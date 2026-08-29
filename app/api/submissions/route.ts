import { ensureSubmissionsTable, type Submission } from '@/lib/submissions';

const OWNER_EMAIL = 'radziuk219@gmail.com';

function isOwner(request: Request) {
  return request.headers.get('oai-authenticated-user-email')?.toLowerCase() === OWNER_EMAIL;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { url?: unknown; reason?: unknown } | null;
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid');
  } catch {
    return Response.json({ error: 'Няправільная спасылка' }, { status: 400 });
  }

  if (!reason || reason.length > 500) return Response.json({ error: 'Дадай кароткае апісанне' }, { status: 400 });

  const db = await ensureSubmissionsTable();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const submitterEmail = request.headers.get('oai-authenticated-user-email');
  await db.prepare('INSERT INTO submissions (id, url, reason, status, submitter_email, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, url, reason, 'pending', submitterEmail, createdAt)
    .run();

  return Response.json({ id, status: 'pending' }, { status: 201 });
}

export async function GET(request: Request) {
  if (!isOwner(request)) return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const db = await ensureSubmissionsTable();
  const result = await db.prepare("SELECT * FROM submissions ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC").all<Submission>();
  return Response.json({ submissions: result.results ?? [] });
}

export async function PATCH(request: Request) {
  if (!isOwner(request)) return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown } | null;
  const id = typeof body?.id === 'string' ? body.id : '';
  const status = typeof body?.status === 'string' ? body.status : '';
  if (!id || !['pending', 'approved', 'rejected'].includes(status)) return Response.json({ error: 'Няправільныя даныя' }, { status: 400 });

  const db = await ensureSubmissionsTable();
  await db.prepare('UPDATE submissions SET status = ?, reviewed_at = ? WHERE id = ?')
    .bind(status, status === 'pending' ? null : new Date().toISOString(), id)
    .run();
  return Response.json({ id, status });
}
