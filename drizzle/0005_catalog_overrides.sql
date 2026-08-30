CREATE TABLE IF NOT EXISTS catalog_overrides (
  canonical_key TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_catalog_overrides_deleted ON catalog_overrides(deleted);
PRAGMA optimize;
