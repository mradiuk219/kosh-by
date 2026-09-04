CREATE TABLE social_candidates (
  id TEXT PRIMARY KEY,
  canonical_key TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('Instagram', 'Twitch', 'TikTok', 'Spotify')),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_label TEXT NOT NULL,
  language_evidence TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  discovered_at TEXT NOT NULL,
  reviewed_at TEXT,
  language_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (language_confirmed IN (0, 1)),
  CHECK (status != 'approved' OR language_confirmed = 1)
);
CREATE INDEX idx_social_candidates_status_date ON social_candidates(status, discovered_at DESC);
CREATE TABLE social_discovery_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('running', 'complete', 'partial', 'failed')),
  found_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT
);
CREATE INDEX idx_social_discovery_runs_date ON social_discovery_runs(started_at DESC);
CREATE TABLE social_discovery_state (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  lease_until TEXT NOT NULL,
  youtube_offset INTEGER NOT NULL DEFAULT 0,
  music_offset INTEGER NOT NULL DEFAULT 0
);
PRAGMA optimize;
