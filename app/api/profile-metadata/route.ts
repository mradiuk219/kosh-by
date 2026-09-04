import { submissionsDb } from '@/lib/submissions';
import { refreshProfile, refreshTargets } from '@/lib/refresh-profile';
import { channelIdentity } from '@/lib/channel-identity';
import { isOwnerRequest } from '@/lib/admin-access';
export async function GET() {
  const result = await submissionsDb().prepare('SELECT canonical_key, title, description, COALESCE(manual_avatar_url, avatar_url) AS avatar_url, subscriber_count, checked_at, status, error FROM profile_metadata').all();
  const allowed = new Set((await refreshTargets()).map(channelIdentity));
  return Response.json({ profiles: (result.results ?? []).filter((row) => allowed.has((row as { canonical_key: string }).canonical_key)) }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  if (!isOwnerRequest(request)) return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const body = await request.json().catch(() => null) as { offset?: unknown } | null;
  const offset = body?.offset;
  if (!Number.isSafeInteger(offset) || Number(offset) < 0) return Response.json({ error: 'Няправільныя даныя' }, { status: 400 });
  const targets = await refreshTargets();
  const batch = targets.slice(Number(offset), Number(offset) + 3);
  const results = [];
  for (const url of batch) results.push(await refreshProfile(url));
  return Response.json({ results, total: targets.length, next: Number(offset) + batch.length < targets.length ? Number(offset) + batch.length : null }, { headers: { 'Cache-Control': 'no-store' } });
}
