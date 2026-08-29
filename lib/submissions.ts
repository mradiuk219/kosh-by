import { env } from 'cloudflare:workers';

type Statement = {
  bind: (...values: unknown[]) => Statement;
  run: () => Promise<unknown>;
  all: <T>() => Promise<{ results?: T[] }>;
};

type Database = {
  prepare: (query: string) => Statement;
};

export type Submission = {
  id: string;
  url: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submitter_email: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export const submissionsDb = () => (env as unknown as { DB: Database }).DB;

export async function ensureSubmissionsTable() {
  const db = submissionsDb();
  await db.prepare(`CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitter_email TEXT,
    created_at TEXT NOT NULL,
    reviewed_at TEXT
  )`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_submissions_status_created_at ON submissions(status, created_at DESC)").run();
  return db;
}
