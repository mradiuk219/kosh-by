import { submissionsDb } from '@/lib/submissions';
import { runSocialDiscovery, type SocialCandidate } from '@/lib/social-discovery';
import { socialProfile } from '@/lib/social-discovery-core';
import { refreshProfile } from '@/lib/refresh-profile';

const isOwner = (request: Request) => request.headers.get('oai-authenticated-user-email')?.toLowerCase() === 'radziuk219@gmail.com';
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request: Request) {
  if (!isOwner(request)) return reply({ error: 'Няма доступу' }, 403);
  const db = submissionsDb();
  const candidates = await db.prepare("SELECT * FROM social_candidates ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, discovered_at DESC LIMIT 500").all<SocialCandidate>();
  const runs = await db.prepare('SELECT * FROM social_discovery_runs ORDER BY started_at DESC LIMIT 1').all();
  return reply({ candidates: candidates.results ?? [], lastRun: runs.results?.[0] ?? null });
}

export async function POST(request: Request) {
  if (!isOwner(request)) return reply({ error: 'Няма доступу' }, 403);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply({ error: 'Няправільная крыніца запыту' }, 403);
  const raw = await request.text();
  if (raw.length > 8192) return reply({ error: 'Запыт занадта вялікі' }, 413);
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return reply({ error: 'Няправільныя даныя' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ error: 'Няправільныя даныя' }, 400);
  if (body.action === 'run') {
    try { return reply(await runSocialDiscovery()); }
    catch (error) { return reply({ error: error instanceof Error ? error.message : 'Не ўдалося запусціць пошук' }, 503); }
  }
  if (typeof body.id !== 'string' || !['approved', 'rejected'].includes(String(body.status))) return reply({ error: 'Няправільныя даныя' }, 400);
  if (body.status === 'approved' && body.languageConfirmed !== true) return reply({ error: 'Спачатку пацвердзіце, што праверылі беларускамоўны кантэнт.' }, 400);
  const db = submissionsDb();
  const result = await db.prepare('SELECT * FROM social_candidates WHERE id = ?').bind(body.id).all<SocialCandidate>();
  const candidate = result.results?.[0];
  if (!candidate) return reply({ error: 'Кандыдат не знойдзены' }, 404);
  if (candidate.status !== 'pending') return reply({ error: 'Кандыдат ужо разгледжаны' }, 409);
  const now = new Date().toISOString();
  if (body.status === 'rejected') {
    await db.prepare("UPDATE social_candidates SET status = 'rejected', reviewed_at = ? WHERE id = ? AND status = 'pending'").bind(now, candidate.id).run();
    return reply({ id: candidate.id, status: 'rejected' });
  }
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!title || title.length > 200 || description.length > 1000) return reply({ error: 'Праверце назву (да 200 знакаў) і апісанне (да 1000).' }, 400);
  const profile = socialProfile(candidate.url);
  if (!profile || profile.platform !== candidate.platform) return reply({ error: 'Няправільная спасылка кандыдата' }, 400);
  const duplicate = await db.prepare("SELECT id FROM submissions WHERE canonical_key = ? AND status IN ('pending', 'approved')").bind(candidate.canonical_key).all();
  if (duplicate.results?.length) return reply({ error: 'Гэты акаўнт ужо ёсць у каталогу або чарзе заявак.' }, 409);
  type Statement = ReturnType<typeof db.prepare>;
  const transactionalDb = db as typeof db & { batch: (statements: Statement[]) => Promise<unknown> };
  try {
    // Atomic D1 batch: only a still-pending candidate can become a catalog entry.
    await transactionalDb.batch([
      db.prepare(`INSERT INTO submissions (id, url, reason, status, created_at, reviewed_at, title, description, category, platform, enrichment_status, canonical_key)
        SELECT id, url, '', 'approved', discovered_at, ?, ?, ?, category, platform, 'complete', canonical_key
        FROM social_candidates WHERE id = ? AND status = 'pending'`).bind(now, title, description, candidate.id),
      db.prepare("UPDATE social_candidates SET status = 'approved', language_confirmed = 1, reviewed_at = ?, title = ?, description = ? WHERE id = ? AND status = 'pending' AND EXISTS (SELECT 1 FROM submissions WHERE id = ? AND status = 'approved')").bind(now, title, description, candidate.id, candidate.id),
      db.prepare("DELETE FROM homepage_stats WHERE id = 'current'"),
    ]);
    const final = await db.prepare('SELECT status FROM social_candidates WHERE id = ?').bind(candidate.id).all<{ status: string }>();
    if (final.results?.[0]?.status !== 'approved') return reply({ error: 'Кандыдат ужо разгледжаны. Абнавіце чаргу.' }, 409);
  } catch { return reply({ error: 'Не ўдалося прыняць кандыдата. Абнавіце чаргу і праверце дублікаты.' }, 409); }
  await refreshProfile(candidate.url).catch(() => {});
  return reply({ id: candidate.id, status: 'approved' });
}
