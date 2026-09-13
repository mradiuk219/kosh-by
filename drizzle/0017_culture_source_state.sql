CREATE TABLE culture_source_state (
  source_key TEXT PRIMARY KEY,
  cursor INTEGER NOT NULL DEFAULT 0
);

PRAGMA optimize;
