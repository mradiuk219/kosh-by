CREATE TABLE profile_metadata (
 canonical_key TEXT PRIMARY KEY,
 title TEXT,
 description TEXT,
 avatar_url TEXT,
 subscriber_count INTEGER CHECK (subscriber_count IS NULL OR subscriber_count >= 0),
 checked_at TEXT NOT NULL,
 status TEXT NOT NULL CHECK (status IN ('complete', 'partial', 'unavailable'))
);
