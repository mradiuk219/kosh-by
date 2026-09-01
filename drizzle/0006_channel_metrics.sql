CREATE TABLE IF NOT EXISTS channel_metrics (
  canonical_key TEXT PRIMARY KEY,
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
