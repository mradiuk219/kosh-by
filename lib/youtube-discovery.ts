import { env } from 'cloudflare:workers';
import { staticChannelIdentities } from '@/lib/channel-identity';
import { submissionsDb } from '@/lib/submissions';

export type YoutubeCandidate = {
  id: string;
  canonical_key: string;
  channel_id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  avatar_url: string | null;
  subscriber_count: number | null;
  language_score: number;
  language_evidence: string;
  source_query: string;
  status: 'pending' | 'approved' | 'rejected';
  discovered_at: string;
  reviewed_at: string | null;
};

export type DiscoveryRun = {
  id: string;
  status: 'running' | 'complete' | 'failed';
  found_count: number;
  error: string | null;
  started_at: string;
  finished_at: string | null;
};

const QUERIES = ['беларуская мова', 'па-беларуску', 'беларускі канал', 'беларуская гісторыя', 'беларускія гульні', 'беларуская музыка', 'беларускі падкаст'];
const STRONG_WORDS = ['беларус', 'па-беларуску', 'беларускамоў', 'беларуская мова', 'беларускай мове'];
const COMMON_WORDS = ['гэта', 'якія', 'які', 'што', 'для', 'пра', 'наш', 'наша', 'сёння', 'людзі', 'відэа', 'новы', 'новая'];

function categoryFor(text: string) {
  const value = text.toLowerCase();
  const rules: [string, string[]][] = [
    ['Гульні', ['гульн', 'gaming', 'gameplay']], ['Музыка', ['музык', 'песн', 'гурт', 'music']],
    ['Гісторыя', ['гістор', 'мінула']], ['Навіны', ['навін', 'рэпартаж', 'журналіст']],
    ['Тэхналогіі', ['тэхналог', 'праграм', 'айці', 'tech']], ['Мова', ['мова', 'мовазнаў']],
    ['Культура', ['культур', 'літаратур', 'паэзі', 'мастац']], ['Гумар', ['гумар', 'жарт', 'камед']],
    ['Падарожжы', ['падарож', 'вандроў']],
  ];
  return rules.find(([, words]) => words.some((word) => value.includes(word)))?.[0] ?? 'Супольнасць';
}

function languageAssessment(text: string) {
  const value = ` ${text.toLowerCase()} `;
  const strong = STRONG_WORDS.filter((word) => value.includes(word));
  const common = COMMON_WORDS.filter((word) => value.includes(` ${word} `));
  const specialLetters = (value.match(/[ўі]/g) ?? []).length;
  const score = Math.min(1, strong.length * 0.35 + Math.min(specialLetters, 8) * 0.055 + Math.min(common.length, 5) * 0.045);
  const evidence = [...strong, specialLetters ? `${specialLetters} літар «ў/і»` : '', ...common].filter(Boolean).slice(0, 6);
  return { score: Number(score.toFixed(2)), evidence };
}

export async function ensureYoutubeDiscoveryTables() {
  const db = submissionsDb();
  await db.prepare(`CREATE TABLE IF NOT EXISTS youtube_candidates (
    id TEXT PRIMARY KEY, canonical_key TEXT NOT NULL UNIQUE, channel_id TEXT NOT NULL UNIQUE, url TEXT NOT NULL,
    title TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, avatar_url TEXT, subscriber_count INTEGER,
    language_score REAL NOT NULL, language_evidence TEXT NOT NULL, source_query TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    discovered_at TEXT NOT NULL, reviewed_at TEXT
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_youtube_candidates_status_discovered_at ON youtube_candidates(status, discovered_at DESC)').run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS youtube_discovery_runs (
    id TEXT PRIMARY KEY, status TEXT NOT NULL, found_count INTEGER NOT NULL DEFAULT 0, error TEXT,
    started_at TEXT NOT NULL, finished_at TEXT
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_youtube_discovery_runs_started_at ON youtube_discovery_runs(started_at DESC)').run();
  return db;
}

type SearchItem = { snippet?: { channelId?: string; channelTitle?: string; title?: string; description?: string } };
type ChannelItem = { id?: string; snippet?: { title?: string; description?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } } }; statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean } };

async function youtubeJson<T>(path: string, key: string) {
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(response.status === 403 ? 'YouTube API адхіліў запыт. Праверце ключ і квоту.' : `YouTube API: ${response.status}`);
  return response.json() as Promise<T>;
}

export function hasYoutubeKey() {
  return Boolean((env as unknown as { YOUTUBE_API_KEY?: string }).YOUTUBE_API_KEY);
}

export async function runYoutubeDiscovery() {
  const key = (env as unknown as { YOUTUBE_API_KEY?: string }).YOUTUBE_API_KEY;
  if (!key) throw new Error('Не падключаны ключ YouTube Data API.');
  const db = await ensureYoutubeDiscoveryTables();
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  await db.prepare("INSERT INTO youtube_discovery_runs (id, status, started_at) VALUES (?, 'running', ?)").bind(runId, startedAt).run();
  try {
    const discovered = new Map<string, { query: string; text: string }>();
    for (const query of QUERIES) {
      const params = new URLSearchParams({ part: 'snippet', type: 'video', order: 'date', maxResults: '25', relevanceLanguage: 'be', regionCode: 'BY', q: query });
      const result = await youtubeJson<{ items?: SearchItem[] }>(`search?${params}`, key);
      for (const item of result.items ?? []) {
        const channelId = item.snippet?.channelId;
        if (channelId && !discovered.has(channelId)) discovered.set(channelId, { query, text: `${item.snippet?.channelTitle ?? ''} ${item.snippet?.title ?? ''} ${item.snippet?.description ?? ''}` });
      }
    }
    let found = 0;
    const ids = [...discovered.keys()];
    for (let index = 0; index < ids.length; index += 50) {
      const params = new URLSearchParams({ part: 'snippet,statistics', id: ids.slice(index, index + 50).join(','), maxResults: '50' });
      const result = await youtubeJson<{ items?: ChannelItem[] }>(`channels?${params}`, key);
      for (const channel of result.items ?? []) {
        if (!channel.id || !channel.snippet?.title) continue;
        const seed = discovered.get(channel.id);
        const description = channel.snippet.description ?? '';
        const assessment = languageAssessment(`${channel.snippet.title} ${description} ${seed?.text ?? ''}`);
        if (assessment.score < 0.6) continue;
        const canonicalKey = `youtube:channel/${channel.id.toLowerCase()}`;
        if (staticChannelIdentities.has(canonicalKey)) continue;
        const existing = await db.prepare("SELECT id FROM submissions WHERE canonical_key = ? AND status IN ('pending', 'approved') LIMIT 1").bind(canonicalKey).all<{ id: string }>();
        if (existing.results?.length) continue;
        const avatar = channel.snippet.thumbnails?.high?.url ?? channel.snippet.thumbnails?.medium?.url ?? channel.snippet.thumbnails?.default?.url ?? null;
        const subscribers = channel.statistics?.hiddenSubscriberCount ? null : Number(channel.statistics?.subscriberCount ?? '') || null;
        await db.prepare(`INSERT INTO youtube_candidates (id, canonical_key, channel_id, url, title, description, category, avatar_url, subscriber_count, language_score, language_evidence, source_query, status, discovered_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
          ON CONFLICT(channel_id) DO UPDATE SET title = excluded.title, description = excluded.description, category = excluded.category, avatar_url = excluded.avatar_url, subscriber_count = excluded.subscriber_count, language_score = excluded.language_score, language_evidence = excluded.language_evidence, source_query = excluded.source_query
          WHERE youtube_candidates.status = 'pending'`)
          .bind(crypto.randomUUID(), canonicalKey, channel.id, `https://www.youtube.com/channel/${channel.id}`, channel.snippet.title, description.slice(0, 500), categoryFor(`${channel.snippet.title} ${description}`), avatar, subscribers, assessment.score, JSON.stringify(assessment.evidence), seed?.query ?? '', new Date().toISOString()).run();
        found += 1;
      }
    }
    await db.prepare("UPDATE youtube_discovery_runs SET status = 'complete', found_count = ?, finished_at = ? WHERE id = ?").bind(found, new Date().toISOString(), runId).run();
    return found;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Невядомая памылка';
    await db.prepare("UPDATE youtube_discovery_runs SET status = 'failed', error = ?, finished_at = ? WHERE id = ?").bind(message, new Date().toISOString(), runId).run();
    throw error;
  }
}
