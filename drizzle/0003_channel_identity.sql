ALTER TABLE submissions ADD COLUMN canonical_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_active_canonical
ON submissions(canonical_key)
WHERE status IN ('pending', 'approved') AND canonical_key IS NOT NULL;
