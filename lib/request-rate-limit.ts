import { submissionsDb } from '@/lib/submissions';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;

async function anonymousKey(request: Request) {
  const source = [
    request.headers.get('cf-connecting-ip') ?? '',
    request.headers.get('user-agent') ?? '',
  ].join('|');
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(source),
  );
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function allowSubmission(request: Request) {
  const db = submissionsDb();
  await db
    .prepare(`CREATE TABLE IF NOT EXISTS request_limits (
      bucket_key TEXT PRIMARY KEY,
      request_count INTEGER NOT NULL,
      expires_at TEXT NOT NULL
    )`)
    .run();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + WINDOW_MS).toISOString();
  const bucketKey = `submission:${await anonymousKey(request)}`;
  await db
    .prepare(`INSERT INTO request_limits (bucket_key, request_count, expires_at)
      VALUES (?, 1, ?)
      ON CONFLICT(bucket_key) DO UPDATE SET
        request_count = CASE WHEN expires_at <= ? THEN 1 ELSE request_count + 1 END,
        expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END`)
    .bind(bucketKey, expiresAt, now.toISOString(), now.toISOString())
    .run();
  const result = await db
    .prepare('SELECT request_count FROM request_limits WHERE bucket_key = ?')
    .bind(bucketKey)
    .all<{ request_count: number }>();
  return (result.results?.[0]?.request_count ?? MAX_REQUESTS + 1) <= MAX_REQUESTS;
}
