import { ensureSubmissionsTable } from '@/lib/submissions';
import { ensureYoutubeDiscoveryTables, hasYoutubeKey, runYoutubeDiscovery, type DiscoveryRun, type YoutubeCandidate } from '@/lib/youtube-discovery';

const OWNER_EMAIL = 'radziuk219@gmail.com';
const isOwner = (request: Request) => request.headers.get('oai-authenticated-user-email')?.toLowerCase() === OWNER_EMAIL;

export async function GET(request: Request) {
  if (!isOwner(request)) return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const db = await ensureYoutubeDiscoveryTables();
  const candidates = await db.prepare("SELECT * FROM youtube_candidates ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, discovered_at DESC").all<YoutubeCandidate>();
  const runs = await db.prepare('SELECT * FROM youtube_discovery_runs ORDER BY started_at DESC LIMIT 1').all<DiscoveryRun>();
  return Response.json({ candidates: candidates.results ?? [], lastRun: runs.results?.[0] ?? null, configured: hasYoutubeKey() });
}

export async function POST(request: Request) {
  if (!isOwner(request)) return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const body = await request.json().catch(() => null) as { action?: unknown; id?: unknown; status?: unknown } | null;
  if (body?.action === 'run') {
    try { return Response.json({ found: await runYoutubeDiscovery() }); }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Не ўдалося запусціць пошук' }, { status: 500 }); }
  }
  const id = typeof body?.id === 'string' ? body.id : '';
  const status = typeof body?.status === 'string' ? body.status : '';
  if (!id || !['approved', 'rejected'].includes(status)) return Response.json({ error: 'Няправільныя даныя' }, { status: 400 });
  const db = await ensureYoutubeDiscoveryTables();
  const rows = await db.prepare('SELECT * FROM youtube_candidates WHERE id = ?').bind(id).all<YoutubeCandidate>();
  const candidate = rows.results?.[0];
  if (!candidate) return Response.json({ error: 'Кандыдат не знойдзены' }, { status: 404 });
  if (status === 'approved') {
    await ensureSubmissionsTable();
    try {
      await db.prepare(`INSERT INTO submissions (id, url, reason, status, submitter_email, created_at, reviewed_at, title, description, category, platform, avatar_url, enrichment_status, canonical_key)
        VALUES (?, ?, ?, 'approved', ?, ?, ?, ?, ?, ?, 'YouTube', ?, 'complete', ?)`)
        .bind(crypto.randomUUID(), candidate.url, 'Знойдзена аўтаматычным пошукам YouTube', OWNER_EMAIL, candidate.discovered_at, new Date().toISOString(), candidate.title, candidate.description, candidate.category, candidate.avatar_url, candidate.canonical_key).run();
    } catch { return Response.json({ error: 'Гэты канал ужо ёсць у каталогу або ў чарзе.' }, { status: 409 }); }
  }
  await db.prepare('UPDATE youtube_candidates SET status = ?, reviewed_at = ? WHERE id = ?').bind(status, new Date().toISOString(), id).run();
  return Response.json({ id, status });
}
