CREATE TABLE IF NOT EXISTS culture_items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('movie', 'book')),
  title TEXT NOT NULL,
  release_year INTEGER NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_culture_items_kind_status_updated
  ON culture_items(kind, status, updated_at DESC);
