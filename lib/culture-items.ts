import { env } from 'cloudflare:workers';
export type CultureKind = 'movie' | 'book';
export type CultureItem = { id:string; kind:CultureKind; title:string; release_year:number; author:string; description:string; url:string; banner_url:string|null; status:'published'|'hidden'; created_at:string; updated_at:string };
export const cultureItemsSchema = `CREATE TABLE IF NOT EXISTS culture_items (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK (kind IN ('movie','book')), title TEXT NOT NULL,
 release_year INTEGER NOT NULL, author TEXT NOT NULL, description TEXT NOT NULL, url TEXT NOT NULL,
 banner_url TEXT, status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`;
export async function ensureCultureItemsTable(){const db=(env as unknown as {DB:D1Database}).DB;await db.prepare(cultureItemsSchema).run();await db.prepare('CREATE INDEX IF NOT EXISTS idx_culture_items_kind_status_updated ON culture_items(kind,status,updated_at DESC)').run();return db}
