import { env } from 'cloudflare:workers';
import { submissionsDb } from '@/lib/submissions';
import { refreshTargets } from '@/lib/refresh-profile';
import { channelIdentity } from '@/lib/channel-identity';
import { logoMime, MAX_LOGO_BYTES } from '@/lib/logo-file';
import { isOwnerRequest } from '@/lib/admin-access';

const bucket = () => (env as unknown as { LOGOS: R2Bucket }).LOGOS;
export async function POST(request: Request) {
  if (!isOwnerRequest(request)) return Response.json({ error: 'Няма доступу' }, { status: 403 });
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Няма доступу' }, { status: 403 });
  const key = new URL(request.url).searchParams.get('channel');
  if (!key || !(await refreshTargets()).some(url => channelIdentity(url) === key)) return Response.json({ error: 'Канал не знойдзены' }, { status: 404 });
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: 'Выберыце выяву' }, { status: 400 });
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const part = await reader.read(); if (part.done) break;
    size += part.value.byteLength;
    if (size > MAX_LOGO_BYTES) { await reader.cancel(); return Response.json({ error: 'Лога павінна быць не больш за 1 МБ' }, { status: 413 }); }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const type = logoMime(bytes);
  if (!type) return Response.json({ error: 'Падтрымліваюцца толькі PNG, JPEG і WebP да 1 МБ' }, { status: 400 });
  const id = crypto.randomUUID();
  await bucket().put(id, bytes, { httpMetadata: { contentType: type } });
  const url = `/api/channel-logo?id=${id}`;
  await submissionsDb().prepare(`INSERT INTO profile_metadata (canonical_key, checked_at, status, manual_avatar_url)
    VALUES (?, ?, 'unavailable', ?) ON CONFLICT(canonical_key) DO UPDATE SET manual_avatar_url = excluded.manual_avatar_url`)
    .bind(key, new Date().toISOString(), url).run();
  return Response.json({ avatar_url: url });
}
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)) return new Response('Not found', { status: 404 });
  const object = await bucket().get(id);
  if (!object) return new Response('Not found', { status: 404 });
  return new Response(object.body, { headers: { 'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=86400', 'Content-Security-Policy': "default-src 'none'" } });
}
