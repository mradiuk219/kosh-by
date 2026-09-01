import { env } from 'cloudflare:workers';
import { staticYoutubeChannels } from '@/lib/channel-identity';
import { submissionsDb } from '@/lib/submissions';

export type ChannelMetric = {
  canonical_key: string;
  subscriber_count: number;
  updated_at: string;
};

type YoutubeChannel = {
  id?: string;
  statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
};

export async function ensureChannelMetricsTable() {
  const db = submissionsDb();
  await db.prepare(`CREATE TABLE IF NOT EXISTS channel_metrics (
    canonical_key TEXT PRIMARY KEY,
    subscriber_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`).run();
  return db;
}

async function youtubeChannels(path: string, key: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&${path}&key=${encodeURIComponent(key)}`,
    { signal: AbortSignal.timeout(12000) },
  );
  if (!response.ok) throw new Error(`YouTube API: ${response.status}`);
  return response.json() as Promise<{ items?: YoutubeChannel[] }>;
}

export async function refreshYoutubeMetrics(force = false) {
  const db = await ensureChannelMetricsTable();
  const key = (env as unknown as { YOUTUBE_API_KEY?: string }).YOUTUBE_API_KEY;
  if (!key) return;
  const latest = await db.prepare('SELECT MAX(updated_at) AS updated_at FROM channel_metrics').all<{ updated_at: string | null }>();
  const updatedAt = latest.results?.[0]?.updated_at;
  if (!force && updatedAt && Date.now() - Date.parse(updatedAt) < 86_400_000) return;

  const approved = await db.prepare("SELECT canonical_key FROM submissions WHERE status = 'approved' AND platform = 'YouTube' AND canonical_key IS NOT NULL").all<{ canonical_key: string }>();
  const identities = new Set([
    ...staticYoutubeChannels.map((item) => `youtube:${item.handle}`),
    ...(approved.results ?? []).map((item) => item.canonical_key),
  ]);
  const now = new Date().toISOString();
  const save = async (canonicalKey: string, channel?: YoutubeChannel) => {
    if (!channel || channel.statistics?.hiddenSubscriberCount) return;
    const count = Number(channel.statistics?.subscriberCount ?? '');
    if (!Number.isFinite(count)) return;
    await db.prepare(`INSERT INTO channel_metrics (canonical_key, subscriber_count, updated_at)
      VALUES (?, ?, ?) ON CONFLICT(canonical_key) DO UPDATE SET subscriber_count = excluded.subscriber_count, updated_at = excluded.updated_at`)
      .bind(canonicalKey, count, now).run();
  };

  const channelIds = [...identities].filter((item) => item.startsWith('youtube:channel/'));
  for (let index = 0; index < channelIds.length; index += 50) {
    const batch = channelIds.slice(index, index + 50);
    const result = await youtubeChannels(`id=${encodeURIComponent(batch.map((item) => item.slice('youtube:channel/'.length)).join(','))}`, key);
    const byId = new Map((result.items ?? []).map((item) => [item.id?.toLowerCase(), item]));
    await Promise.all(batch.map((identity) => save(identity, byId.get(identity.slice('youtube:channel/'.length)))));
  }
  const handles = [...identities].filter((item) => item.startsWith('youtube:') && !item.startsWith('youtube:channel/'));
  for (let index = 0; index < handles.length; index += 10) {
    await Promise.all(handles.slice(index, index + 10).map(async (identity) => {
      const handle = identity.slice('youtube:'.length).replace(/^@/, '');
      const result = await youtubeChannels(`forHandle=${encodeURIComponent(handle)}`, key);
      await save(identity, result.items?.[0]);
    }));
  }
}
