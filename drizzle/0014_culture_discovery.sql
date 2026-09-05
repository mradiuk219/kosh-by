CREATE TABLE culture_candidates (
  id TEXT PRIMARY KEY,
  canonical_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('movie', 'book')),
  title TEXT NOT NULL,
  release_year INTEGER NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  banner_source_url TEXT,
  source_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  discovered_at TEXT NOT NULL,
  reviewed_at TEXT
);
CREATE INDEX idx_culture_candidates_status_date ON culture_candidates(status, discovered_at DESC);
CREATE TABLE culture_discovery_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('running', 'complete', 'partial', 'failed')),
  found_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT
);
CREATE INDEX idx_culture_discovery_runs_date ON culture_discovery_runs(started_at DESC);
CREATE TABLE culture_discovery_state (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  lease_until TEXT NOT NULL,
  movie_offset INTEGER NOT NULL DEFAULT 0,
  book_page INTEGER NOT NULL DEFAULT 1
);
PRAGMA optimize;
