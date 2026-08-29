import { ensureSubmissionsTable, type Submission } from '@/lib/submissions';
import { enrichChannel } from '@/lib/enrich-channel';

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
  const view = new URL(request.url).searchParams.get('view');
  if (view === 'approved') {
    const db = await ensureSubmissionsTable();
    const missing = await db.prepare("SELECT * FROM submissions WHERE status = 'approved' AND (enrichment_status IS NULL OR enrichment_status = 'pending') ORDER BY reviewed_at DESC LIMIT 4").all<Submission>();
    await Promise.all((missing.results ?? []).map(async (item) => {
      try {
        const metadata = await enrichChannel(item.url, item.reason);
        await db.prepare("UPDATE submissions SET title = ?, description = ?, category = ?, platform = ?, avatar_url = ?, enrichment_status = 'complete' WHERE id = ?")
          .bind(metadata.title, metadata.description, metadata.category, metadata.platform, metadata.avatarUrl, item.id).run();
      } catch {
        await db.prepare("UPDATE submissions SET enrichment_status = 'failed' WHERE id = ?").bind(item.id).run();
      }
    }));
    const result = await db.prepare("SELECT id, url, reason, status, created_at, reviewed_at, title, description, category, platform, avatar_url, enrichment_status FROM submissions WHERE status = 'approved' ORDER BY reviewed_at DESC, created_at DESC").all<Omit<Submission, 'submitter_email'>>();
    return Response.json({ submissions: result.results ?? [] });
  }

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
  const current = await db.prepare('SELECT * FROM submissions WHERE id = ?').bind(id).all<Submission>();
  const submission = current.results?.[0];
  if (!submission) return Response.json({ error: 'Заяўка не знойдзена' }, { status: 404 });
  let metadata = null;
  if (status === 'approved') {
    try { metadata = await enrichChannel(submission.url, submission.reason); } catch { metadata = null; }
  }
  if (status === 'approved' && metadata) {
    await db.prepare("UPDATE submissions SET status = ?, reviewed_at = ?, title = ?, description = ?, category = ?, platform = ?, avatar_url = ?, enrichment_status = 'complete' WHERE id = ?")
      .bind(status, new Date().toISOString(), metadata.title, metadata.description, metadata.category, metadata.platform, metadata.avatarUrl, id).run();
    return Response.json({ id, status, metadata });
  }
  await db.prepare('UPDATE submissions SET status = ?, reviewed_at = ? WHERE id = ?')
    .bind(status, status === 'pending' ? null : new Date().toISOString(), id)
    .run();
  if (status === 'approved') await db.prepare("UPDATE submissions SET enrichment_status = 'failed' WHERE id = ?").bind(id).run();
  return Response.json({ id, status });
}
