import { ensureSubmissionsTable, type Submission } from '@/lib/submissions';
import { serializeCategories } from '@/lib/categories';
import {
  ensureCatalogOverridesTable,
  type CatalogOverride,
} from '@/lib/catalog-overrides';

const OWNER_EMAIL = 'radziuk219@gmail.com';
const isOwner = (request: Request) =>
  request.headers.get('oai-authenticated-user-email')?.toLowerCase() ===
  OWNER_EMAIL;

export async function GET(request: Request) {
  if (!isOwner(request))
    return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const db = await ensureSubmissionsTable();
  const result = await db
    .prepare(
      "SELECT id, url, title, description, category, platform, avatar_url, created_at, reviewed_at FROM submissions WHERE status = 'approved' ORDER BY lower(COALESCE(title, url)) ASC",
    )
    .all<Submission>();
  await ensureCatalogOverridesTable();
  const overrides = await db
    .prepare('SELECT * FROM catalog_overrides')
    .all<CatalogOverride>();
  return Response.json({
    channels: result.results ?? [],
    overrides: overrides.results ?? [],
  });
}

export async function PATCH(request: Request) {
  if (!isOwner(request))
    return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    description?: unknown;
    categories?: unknown;
  } | null;
  const id = typeof body?.id === 'string' ? body.id : '';
  const description =
    typeof body?.description === 'string' ? body.description.trim() : '';
  const categoryValues = Array.isArray(body?.categories)
    ? body.categories.filter((item): item is string => typeof item === 'string')
    : [];
  const category = serializeCategories(categoryValues);
  if (
    !id ||
    !category ||
    categoryValues.length > 3 ||
    description.length > 1000 ||
    category.length > 180
  )
    return Response.json(
      { error: 'Выберыце ад адной да трох катэгорый' },
      { status: 400 },
    );
  if (id.startsWith('static:')) {
    const canonicalKey = id.slice('static:'.length);
    if (!canonicalKey)
      return Response.json({ error: 'Канал не знойдзены' }, { status: 404 });
    const db = await ensureCatalogOverridesTable();
    await db
      .prepare(
        `INSERT INTO catalog_overrides (canonical_key, description, category, deleted, updated_at) VALUES (?, ?, ?, 0, ?)
         ON CONFLICT(canonical_key) DO UPDATE SET description = excluded.description, category = excluded.category, deleted = 0, updated_at = excluded.updated_at`,
      )
      .bind(canonicalKey, description, category, new Date().toISOString())
      .run();
    return Response.json({ id, description, categories: category.split('|') });
  }
  const db = await ensureSubmissionsTable();
  const current = await db
    .prepare("SELECT id FROM submissions WHERE id = ? AND status = 'approved'")
    .bind(id)
    .all<{ id: string }>();
  if (!current.results?.length)
    return Response.json({ error: 'Канал не знойдзены' }, { status: 404 });
  await db
    .prepare(
      "UPDATE submissions SET description = ?, category = ? WHERE id = ? AND status = 'approved'",
    )
    .bind(description, category, id)
    .run();
  return Response.json({ id, description, categories: category.split('|') });
}

export async function DELETE(request: Request) {
  if (!isOwner(request))
    return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!id)
    return Response.json({ error: 'Не пазначаны канал' }, { status: 400 });
  if (id.startsWith('static:')) {
    const canonicalKey = id.slice('static:'.length);
    if (!canonicalKey)
      return Response.json({ error: 'Канал не знойдзены' }, { status: 404 });
    const db = await ensureCatalogOverridesTable();
    await db
      .prepare(
        `INSERT INTO catalog_overrides (canonical_key, description, category, deleted, updated_at) VALUES (?, '', '', 1, ?)
         ON CONFLICT(canonical_key) DO UPDATE SET deleted = 1, updated_at = excluded.updated_at`,
      )
      .bind(canonicalKey, new Date().toISOString())
      .run();
    await db.prepare("DELETE FROM homepage_stats WHERE id = 'current'").run();
    return Response.json({ id, deleted: true });
  }
  const db = await ensureSubmissionsTable();
  const current = await db
    .prepare("SELECT id FROM submissions WHERE id = ? AND status = 'approved'")
    .bind(id)
    .all<{ id: string }>();
  if (!current.results?.length)
    return Response.json({ error: 'Канал не знойдзены' }, { status: 404 });
  await db
    .prepare("DELETE FROM submissions WHERE id = ? AND status = 'approved'")
    .bind(id)
    .run();
  await db.prepare("DELETE FROM homepage_stats WHERE id = 'current'").run();
  return Response.json({ id, deleted: true });
}
