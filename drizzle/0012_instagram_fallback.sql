ALTER TABLE profile_metadata ADD COLUMN manual_avatar_url TEXT;
CREATE TABLE instagram_fetch_state (id TEXT PRIMARY KEY, next_attempt_at INTEGER NOT NULL);
