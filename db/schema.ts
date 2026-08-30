export const submissionsSchema = `CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitter_email TEXT,
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  platform TEXT,
  avatar_url TEXT,
  enrichment_status TEXT,
  canonical_key TEXT
)`;

export const homepageStatsSchema = `CREATE TABLE IF NOT EXISTS homepage_stats (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;
