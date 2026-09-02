import { ensureSubmissionsTable, type Submission } from '@/lib/submissions';
import { enrichChannel } from '@/lib/enrich-channel';
import { channelIdentity, staticChannelIdentities } from '@/lib/channel-identity';
import { allowSubmission } from '@/lib/request-rate-limit';

const OWNER_EMAIL = 'radziuk219@gmail.com';
const DUPLICATE_MESSAGE = 'Вы спрабуеце прапанаваць канал які ўжо існуе ў каталогу. Калі ласка праверце спасылку.';

function isOwner(request: Request) {
  return request.headers.get('oai-authenticated-user-email')?.toLowerCase() === OWNER_EMAIL;
}

async function backfillCanonicalKeys(db: Awaited<ReturnType<typeof ensureSubmissionsTable>>) {
  const rows = await db.prepare("SELECT * FROM submissions WHERE status IN ('pending', 'approved') AND canonical_key IS NULL ORDER BY CASE status WHEN 'approved' THEN 0 ELSE 1 END, reviewed_at ASC, created_at ASC").all<Submission>();
  for (const item of rows.results ?? []) {
    const key = channelIdentity(item.url);
    if (!key) continue;
    if (staticChannelIdentities.has(key)) {
      await db.prepare("UPDATE submissions SET status = 'rejected', reviewed_at = ? WHERE id = ?").bind(new Date().toISOString(), item.id).run();
      continue;
    }
    try {
      await db.prepare('UPDATE submissions SET canonical_key = ? WHERE id = ?').bind(key, item.id).run();
    } catch {
      await db.prepare("UPDATE submissions SET status = 'rejected', reviewed_at = ? WHERE id = ?").bind(new Date().toISOString(), item.id).run();
    }
  }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > 16_384) {
    return Response.json({ error: 'Запыт занадта вялікі' }, { status: 413 });
  }
  if (!(await allowSubmission(request))) {
    return Response.json(
      { error: 'Занадта шмат спроб. Калі ласка, паспрабуйце пазней.' },
      { status: 429, headers: { 'retry-after': '3600' } },
    );
  }
  const body = await request.json().catch(() => null) as { url?: unknown } | null;
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  const reason = '';

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid');
  } catch {
    return Response.json({ error: 'Няправільная спасылка' }, { status: 400 });
  }

  const db = await ensureSubmissionsTable();
  await backfillCanonicalKeys(db);
  const canonicalKey = channelIdentity(url);
  if (canonicalKey && staticChannelIdentities.has(canonicalKey)) {
    return Response.json({ error: DUPLICATE_MESSAGE }, { status: 409 });
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  try {
    await db.prepare('INSERT INTO submissions (id, url, reason, status, created_at, canonical_key) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, url, reason, 'pending', createdAt, canonicalKey).run();
  } catch {
    return Response.json({ error: DUPLICATE_MESSAGE }, { status: 409 });
  }

  return Response.json({ id, status: 'pending' }, { status: 201 });
}

export async function GET(request: Request) {
  const view = new URL(request.url).searchParams.get('view');
  if (view === 'approved') {
    const db = await ensureSubmissionsTable();
    await backfillCanonicalKeys(db);
    const result = await db.prepare(`SELECT s.id, s.url, s.reason, s.status, s.created_at, s.reviewed_at,
      s.title, s.description, s.category, s.platform, s.avatar_url, s.enrichment_status,
      COALESCE(yc.subscriber_count, CASE WHEN s.canonical_key = 'youtube:belsat_news' THEN 442000 END) AS subscriber_count
      FROM submissions s
      LEFT JOIN youtube_candidates yc ON yc.canonical_key = s.canonical_key
      WHERE s.status = 'approved'
      ORDER BY s.reviewed_at DESC, s.created_at DESC`).all<Omit<Submission, 'submitter_email'> & { subscriber_count: number | null }>();
    return Response.json({ submissions: result.results ?? [] });
  }

  if (!isOwner(request)) return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const db = await ensureSubmissionsTable();
  await backfillCanonicalKeys(db);
  const result = await db.prepare(`SELECT id, url, reason, status, created_at, reviewed_at, title, description,
      category, platform, avatar_url, enrichment_status, canonical_key
      FROM submissions ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC`).all<Submission>();
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
    try {
      await db.prepare("UPDATE submissions SET status = ?, reviewed_at = ?, title = ?, description = ?, category = ?, platform = ?, avatar_url = ?, enrichment_status = 'complete', canonical_key = ? WHERE id = ?")
        .bind(status, new Date().toISOString(), metadata.title, metadata.description, metadata.category, metadata.platform, metadata.avatarUrl, channelIdentity(submission.url), id).run();
    } catch {
      return Response.json({ error: DUPLICATE_MESSAGE }, { status: 409 });
    }
    await db.prepare("DELETE FROM homepage_stats WHERE id = 'current'").run();
    return Response.json({ id, status, metadata });
  }
  try {
    await db.prepare('UPDATE submissions SET status = ?, reviewed_at = ?, canonical_key = ? WHERE id = ?')
      .bind(status, status === 'pending' ? null : new Date().toISOString(), channelIdentity(submission.url), id).run();
  } catch {
    return Response.json({ error: DUPLICATE_MESSAGE }, { status: 409 });
  }
  if (status === 'approved') await db.prepare("UPDATE submissions SET enrichment_status = 'failed' WHERE id = ?").bind(id).run();
  if (status === 'approved') await db.prepare("DELETE FROM homepage_stats WHERE id = 'current'").run();
  return Response.json({ id, status });
}
