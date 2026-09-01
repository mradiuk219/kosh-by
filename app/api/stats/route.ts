import { ensureSubmissionsTable } from '@/lib/submissions';

type StatsPayload = {
  total: number;
  platforms: Record<string, number>;
  topSubscribers: string;
  topChannel: string;
  topChannelUrl: string;
  updatedAt: string;
};

const baseline = { YouTube: 12, Twitch: 13, Instagram: 12, TikTok: 12, Spotify: 0 };
const topChannel = {
  name: 'БЕЛСАТ NEWS',
  url: 'https://www.youtube.com/@belsat_news',
  fallback: 442_000,
};

function parseSubscriberCount(html: string) {
  const candidates = [
    ...Array.from(
      html.matchAll(
        /"subscriberCountText"\s*:\s*\{[^}]*"simpleText"\s*:\s*"([^"]+)"/gi,
      ),
      (match) => match[1],
    ),
    ...Array.from(
      html.matchAll(/([\d.,]+)\s*([KMB])?\s+subscribers/gi),
      (match) => `${match[1]}${match[2] ?? ''}`,
    ),
  ];
  if (!candidates.length) return null;
  const values = candidates.map((candidate) => {
    const match = candidate
      .replaceAll(',', '')
      .replace(/\s/g, '')
      .match(/([\d.]+)([KMB])?/i);
    if (!match) return 0;
    const multiplier =
      match[2]?.toUpperCase() === 'B'
        ? 1_000_000_000
        : match[2]?.toUpperCase() === 'M'
          ? 1_000_000
          : match[2]?.toUpperCase() === 'K'
            ? 1_000
            : 1;
    return Math.round(Number(match[1]) * multiplier);
  });
  return Math.max(...values);
}

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
  previous?: StatsPayload,
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
  let subscriberCount = Math.max(
    parseStoredSubscribers(previous?.topSubscribers),
    topChannel.fallback,
  );
  try {
    const response = await fetch(topChannel.url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; KOSH/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok)
      subscriberCount = Math.max(
        parseSubscriberCount(await response.text()) ?? 0,
        subscriberCount,
      );
  } catch {
    /* захоўваем апошняе вядомае значэнне */
  }
  const payload: StatsPayload = {
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
    row?.updated_at.slice(0, 10) === today &&
    parseStoredSubscribers(previous?.topSubscribers) >= topChannel.fallback;
  const payload = cacheIsValid ? previous! : await refreshStats(db, previous);
  return Response.json(payload, {
    headers: { 'cache-control': 'public, max-age=300' },
  });
}
