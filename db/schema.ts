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
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
)`;
