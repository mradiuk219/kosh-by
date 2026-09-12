CREATE TABLE author_details (
 canonical_key TEXT PRIMARY KEY,
 games_json TEXT NOT NULL DEFAULT '[]',
 latest_json TEXT,
 next_check INTEGER NOT NULL DEFAULT 0
);
