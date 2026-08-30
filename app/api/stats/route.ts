import { ensureSubmissionsTable } from '@/lib/submissions';

type StatsPayload = {
  total: number;
  platforms: Record<string, number>;
  topSubscribers: string;
  topChannel: string;
  topChannelUrl: string;
  updatedAt: string;
};

const baseline = { YouTube: 12, Twitch: 13, Instagram: 12, TikTok: 12 };
const topChannel = { name: 'БЕЛСАТ NEWS', url: 'https://www.youtube.com/@belsat_news', fallback: 442_000 };

function parseSubscriberCount(html: string) {
  const candidates = [
    html.match(/"subscriberCountText"\s*:\s*\{[^}]*"simpleText"\s*:\s*"([^"]+)"/i)?.[1],
    html.match(/([\d.,]+)\s*([KMB])?\s+subscribers/i)?.slice(1, 3).filter(Boolean).join(''),
  ].filter(Boolean) as string[];
  if (!candidates.length) return null;
  const value = candidates[0].replaceAll(',', '').replace(/\s/g, '');
  const match = value.match(/([\d.]+)([KMB])?/i);
  if (!match) return null;
  const multiplier = match[2]?.toUpperCase() === 'B' ? 1_000_000_000 : match[2]?.toUpperCase() === 'M' ? 1_000_000 : match[2]?.toUpperCase() === 'K' ? 1_000 : 1;
  return Math.round(Number(match[1]) * multiplier);
}

function formatSubscribers(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0).replace('.', ',')} млн`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} тыс.`;
  return String(value);
}

async function refreshStats(db: Awaited<ReturnType<typeof ensureSubmissionsTable>>, previous?: StatsPayload) {
  const approved = await db.prepare("SELECT platform FROM submissions WHERE status = 'approved'").all<{ platform: string | null }>();
  const platforms = { ...baseline } as Record<string, number>;
  for (const item of approved.results ?? []) {
    if (item.platform && item.platform in platforms) platforms[item.platform] += 1;
  }
  let subscriberCount = previous ? Number(previous.topSubscribers.replace(/[^\d]/g, '')) * 1_000 : topChannel.fallback;
  try {
    const response = await fetch(topChannel.url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; KOSH/1.0)' }, signal: AbortSignal.timeout(8000) });
    if (response.ok) subscriberCount = parseSubscriberCount(await response.text()) ?? subscriberCount;
  } catch { /* захоўваем апошняе вядомае значэнне */ }
  const payload: StatsPayload = {
    total: Object.values(platforms).reduce((sum, value) => sum + value, 0),
    platforms,
    topSubscribers: formatSubscribers(subscriberCount),
    topChannel: topChannel.name,
    topChannelUrl: topChannel.url,
    updatedAt: new Date().toISOString(),
  };
  await db.prepare('INSERT OR REPLACE INTO homepage_stats (id, payload, updated_at) VALUES (?, ?, ?)')
    .bind('current', JSON.stringify(payload), payload.updatedAt).run();
  return payload;
}

export async function GET() {
  const db = await ensureSubmissionsTable();
  await db.prepare('CREATE TABLE IF NOT EXISTS homepage_stats (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)').run();
  const cached = await db.prepare("SELECT payload, updated_at FROM homepage_stats WHERE id = 'current'").all<{ payload: string; updated_at: string }>();
  const row = cached.results?.[0];
  const previous = row ? JSON.parse(row.payload) as StatsPayload : undefined;
  const today = new Date().toISOString().slice(0, 10);
  const payload = row?.updated_at.slice(0, 10) === today ? previous! : await refreshStats(db, previous);
  return Response.json(payload, { headers: { 'cache-control': 'public, max-age=300' } });
}
