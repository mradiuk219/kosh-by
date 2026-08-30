import { ensureSubmissionsTable, type Submission } from '@/lib/submissions';

const OWNER_EMAIL = 'radziuk219@gmail.com';
const isOwner = (request: Request) => request.headers.get('oai-authenticated-user-email')?.toLowerCase() === OWNER_EMAIL;

export async function GET(request: Request) {
  if (!isOwner(request)) return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const db = await ensureSubmissionsTable();
  const result = await db.prepare("SELECT id, url, title, description, category, platform, avatar_url, created_at, reviewed_at FROM submissions WHERE status = 'approved' ORDER BY lower(COALESCE(title, url)) ASC").all<Submission>();
  return Response.json({ channels: result.results ?? [] });
}

export async function PATCH(request: Request) {
  if (!isOwner(request)) return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const body = await request.json().catch(() => null) as { id?: unknown; description?: unknown; category?: unknown } | null;
  const id = typeof body?.id === 'string' ? body.id : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const category = typeof body?.category === 'string' ? body.category.trim() : '';
  if (!id || !category || description.length > 1000 || category.length > 60) return Response.json({ error: 'Праверце апісанне і катэгорыю' }, { status: 400 });
  const db = await ensureSubmissionsTable();
  const current = await db.prepare("SELECT id FROM submissions WHERE id = ? AND status = 'approved'").bind(id).all<{ id: string }>();
  if (!current.results?.length) return Response.json({ error: 'Канал не знойдзены' }, { status: 404 });
  await db.prepare("UPDATE submissions SET description = ?, category = ? WHERE id = ? AND status = 'approved'").bind(description, category, id).run();
  return Response.json({ id, description, category });
}

export async function DELETE(request: Request) {
  if (!isOwner(request)) return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!id) return Response.json({ error: 'Не пазначаны канал' }, { status: 400 });
  const db = await ensureSubmissionsTable();
  const current = await db.prepare("SELECT id FROM submissions WHERE id = ? AND status = 'approved'").bind(id).all<{ id: string }>();
  if (!current.results?.length) return Response.json({ error: 'Канал не знойдзены' }, { status: 404 });
  await db.prepare("DELETE FROM submissions WHERE id = ? AND status = 'approved'").bind(id).run();
  await db.prepare("DELETE FROM homepage_stats WHERE id = 'current'").run();
  return Response.json({ id, deleted: true });
}
