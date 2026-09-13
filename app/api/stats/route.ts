import { ensureSubmissionsTable } from '@/lib/submissions';
import {
  ensureChannelMetricsTable,
  refreshYoutubeMetrics,
} from '@/lib/channel-metrics';

type StatsPayload = {
  total: number;
  movies: number;
  books: number;
  platforms: Record<string, number>;
  topSubscribers: string;
  topChannel: string;
  topChannelUrl: string;
  updatedAt: string;
};

const baseline = {
  YouTube: 12,
  Twitch: 13,
  Instagram: 12,
  TikTok: 12,
  Spotify: 0,
};
const topChannel = {
  name: 'БЕЛСАТ NEWS',
  url: 'https://www.youtube.com/@belsat_news',
  fallback: 442_000,
};

function parseStoredSubscribers(value?: string) {
  if (!value) return 0;
  const number = Number(value.replace(',', '.').match(/[\d.]+/)?.[0] ?? 0);
  return value.includes('млн')
    ? number * 1_000_000
    : value.includes('тыс')
      ? number * 1_000
      : number;
}

function formatSubscribers(value: number) {
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0).replace('.', ',')} млн`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} тыс.`;
  return String(value);
}

async function refreshStats(
  db: Awaited<ReturnType<typeof ensureSubmissionsTable>>,
  subscriberCount: number,
) {
  const approved = await db
    .prepare("SELECT platform FROM submissions WHERE status = 'approved'")
    .all<{ platform: string | null }>();
  const platforms = { ...baseline } as Record<string, number>;
  const deletedStatic = await db
    .prepare('SELECT canonical_key FROM catalog_overrides WHERE deleted = 1')
    .all<{ canonical_key: string }>()
    .catch(() => ({ results: [] as { canonical_key: string }[] }));
  const platformNames: Record<string, string> = {
    youtube: 'YouTube',
    twitch: 'Twitch',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    spotify: 'Spotify',
  };
  for (const item of deletedStatic.results ?? []) {
    const platform = platformNames[item.canonical_key.split(':')[0]];
    if (platform && platforms[platform] > 0) platforms[platform] -= 1;
  }
  for (const item of approved.results ?? []) {
    if (item.platform && item.platform in platforms)
      platforms[item.platform] += 1;
  }
  const culture = await db
    .prepare("SELECT kind, COUNT(*) AS count FROM culture_items WHERE status = 'published' GROUP BY kind")
    .all<{ kind: string; count: number }>();
  const payload: StatsPayload = {
    movies: culture.results?.find((item) => item.kind === 'movie')?.count ?? 0,
    books: culture.results?.find((item) => item.kind === 'book')?.count ?? 0,
    total: Object.values(platforms).reduce((sum, value) => sum + value, 0),
    platforms,
    topSubscribers: formatSubscribers(subscriberCount),
    topChannel: topChannel.name,
    topChannelUrl: topChannel.url,
    updatedAt: new Date().toISOString(),
  };
  await db
    .prepare(
      'INSERT OR REPLACE INTO homepage_stats (id, payload, updated_at) VALUES (?, ?, ?)',
    )
    .bind('current', JSON.stringify(payload), payload.updatedAt)
    .run();
  return payload;
}

export async function GET() {
  const db = await ensureSubmissionsTable();
  await refreshYoutubeMetrics().catch(() => {});
  const metricsDb = await ensureChannelMetricsTable();
  const metric = await metricsDb
    .prepare(
      "SELECT subscriber_count FROM channel_metrics WHERE canonical_key = 'youtube:belsat_news'",
    )
    .all<{ subscriber_count: number }>();
  const subscriberCount =
    metric.results?.[0]?.subscriber_count ?? topChannel.fallback;
  await db
    .prepare(
      'CREATE TABLE IF NOT EXISTS homepage_stats (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)',
    )
    .run();
  const cached = await db
    .prepare(
      "SELECT payload, updated_at FROM homepage_stats WHERE id = 'current'",
    )
    .all<{ payload: string; updated_at: string }>();
  const row = cached.results?.[0];
  const previous = row ? (JSON.parse(row.payload) as StatsPayload) : undefined;
  const today = new Date().toISOString().slice(0, 10);
  const cacheIsValid =
    typeof previous?.movies === 'number' &&
    typeof previous?.books === 'number' &&
    row?.updated_at.slice(0, 10) === today &&
    parseStoredSubscribers(previous?.topSubscribers) === subscriberCount;
  const payload = cacheIsValid
    ? previous!
    : await refreshStats(db, subscriberCount);
  return Response.json(payload, {
    headers: { 'cache-control': 'public, max-age=300' },
  });
}
