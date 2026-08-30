import { submissionsDb } from '@/lib/submissions';

export type CatalogOverride = {
  canonical_key: string;
  description: string;
  category: string;
  deleted: number;
  updated_at: string;
};

export async function ensureCatalogOverridesTable() {
  const db = submissionsDb();
  await db
    .prepare(`CREATE TABLE IF NOT EXISTS catalog_overrides (
    canonical_key TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`)
    .run();
  await db
    .prepare(
      'CREATE INDEX IF NOT EXISTS idx_catalog_overrides_deleted ON catalog_overrides(deleted)',
    )
    .run();
  return db;
}
