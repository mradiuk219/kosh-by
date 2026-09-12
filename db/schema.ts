export const profileMetadataSchema = `CREATE TABLE profile_metadata (
 canonical_key TEXT PRIMARY KEY,
 title TEXT,
 description TEXT,
 avatar_url TEXT,
 subscriber_count INTEGER CHECK (subscriber_count IS NULL OR subscriber_count >= 0),
 checked_at TEXT NOT NULL,
 status TEXT NOT NULL CHECK (status IN ('complete', 'partial', 'unavailable')),
 error TEXT,
 manual_avatar_url TEXT
);`;
export const instagramFetchStateSchema = `CREATE TABLE instagram_fetch_state (id TEXT PRIMARY KEY, next_attempt_at INTEGER NOT NULL);`;
export { visitorSchema } from '@/lib/visitor-stats';

export const submissionsSchema = `CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitter_email TEXT,
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  platform TEXT,
  avatar_url TEXT,
  enrichment_status TEXT,
  canonical_key TEXT
)`;

export const homepageStatsSchema = `CREATE TABLE IF NOT EXISTS homepage_stats (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

export const youtubeCandidatesSchema = `CREATE TABLE IF NOT EXISTS youtube_candidates (
  id TEXT PRIMARY KEY,
  canonical_key TEXT NOT NULL UNIQUE,
  channel_id TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  avatar_url TEXT,
  subscriber_count INTEGER,
  language_score REAL NOT NULL,
  language_evidence TEXT NOT NULL,
  source_query TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  discovered_at TEXT NOT NULL,
  reviewed_at TEXT
)`;

export const youtubeDiscoveryRunsSchema = `CREATE TABLE IF NOT EXISTS youtube_discovery_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  found_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT
)`;

export const catalogOverridesSchema = `CREATE TABLE IF NOT EXISTS catalog_overrides (
  canonical_key TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
)`;

export const channelMetricsSchema = `CREATE TABLE IF NOT EXISTS channel_metrics (
  canonical_key TEXT PRIMARY KEY,
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
)`;

export const requestLimitsSchema = `CREATE TABLE IF NOT EXISTS request_limits (
  bucket_key TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL,
  expires_at TEXT NOT NULL
)`;
export { cultureItemsSchema } from '@/lib/culture-items';
export const authorDetailsSchema = `CREATE TABLE author_details (
 canonical_key TEXT PRIMARY KEY,
 games_json TEXT NOT NULL DEFAULT '[]',
 latest_json TEXT,
 next_check INTEGER NOT NULL DEFAULT 0
)`;
export const cultureCandidatesSchema = `CREATE TABLE culture_candidates (
 id TEXT PRIMARY KEY, canonical_key TEXT NOT NULL UNIQUE, kind TEXT NOT NULL,
 title TEXT NOT NULL, release_year INTEGER NOT NULL, author TEXT NOT NULL,
 description TEXT NOT NULL, url TEXT NOT NULL, banner_source_url TEXT,
 source_label TEXT NOT NULL, status TEXT NOT NULL, discovered_at TEXT NOT NULL, reviewed_at TEXT)`;
