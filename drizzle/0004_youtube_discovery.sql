CREATE TABLE IF NOT EXISTS youtube_candidates (
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
);
CREATE INDEX IF NOT EXISTS idx_youtube_candidates_status_discovered_at ON youtube_candidates(status, discovered_at DESC);
CREATE TABLE IF NOT EXISTS youtube_discovery_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  found_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_youtube_discovery_runs_started_at ON youtube_discovery_runs(started_at DESC);
PRAGMA optimize;
