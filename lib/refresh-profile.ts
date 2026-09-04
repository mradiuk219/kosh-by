import { submissionsDb } from '@/lib/submissions';
import { channelIdentity, staticChannelIdentities } from '@/lib/channel-identity';
import { enrichChannel } from '@/lib/enrich-channel';

export async function refreshProfile(url: string) {
  const key = channelIdentity(url);
  if (!key) throw new Error('Няправільная спасылка');
  const db = submissionsDb();
  let failure: string | null = null;
  const metadata = await enrichChannel(url, '').catch(() => { failure = 'Не ўдалося атрымаць метаданыя: сеткавая памылка або адказ крыніцы.'; return null; });
  const status = metadata?.avatarUrl && metadata.description && metadata.subscriberCount !== null ? 'complete' : metadata?.avatarUrl || metadata?.description || metadata?.subscriberCount !== null && metadata?.subscriberCount !== undefined ? 'partial' : 'unavailable';
  const error = status === 'complete' ? null : (metadata?.warnings?.join(' ') || failure || (status === 'partial' ? 'Крыніца аддала толькі частку палёў.' : 'Крыніца не аддала даныя профілю.'));
  await db.prepare(`INSERT INTO profile_metadata (canonical_key, title, description, avatar_url, subscriber_count, checked_at, status, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(canonical_key) DO UPDATE SET
    title = COALESCE(excluded.title, profile_metadata.title), description = COALESCE(excluded.description, profile_metadata.description),
    avatar_url = COALESCE(excluded.avatar_url, profile_metadata.avatar_url), subscriber_count = COALESCE(excluded.subscriber_count, profile_metadata.subscriber_count),
    checked_at = excluded.checked_at, status = excluded.status, error = excluded.error`)
    .bind(key, status !== 'unavailable' ? metadata?.title || null : null, metadata?.description || null, metadata?.avatarUrl ?? null, metadata?.subscriberCount ?? null, new Date().toISOString(), status, error).run();
  // Existing text may have been edited before provenance was tracked. Never overwrite it.
  if (metadata && status !== 'unavailable') await db.prepare(`UPDATE submissions SET
    title = COALESCE(NULLIF(title, ''), ?), description = COALESCE(NULLIF(description, ''), ?),
    avatar_url = COALESCE(?, avatar_url), platform = COALESCE(NULLIF(platform, ''), ?)
    WHERE canonical_key = ?`).bind(metadata.title, metadata.description, metadata.avatarUrl, metadata.platform, key).run();
  return { canonical_key: key, status, avatar: Boolean(metadata?.avatarUrl), description: Boolean(metadata?.description), followers: metadata?.subscriberCount !== null && metadata?.subscriberCount !== undefined };
}

export async function refreshTargets() {
  const db = submissionsDb();
  const rows = await db.prepare("SELECT url FROM submissions WHERE status = 'approved' ORDER BY id").all<{ url: string }>();
  const deleted = await db.prepare('SELECT canonical_key FROM catalog_overrides WHERE deleted = 1').all<{ canonical_key: string }>();
  const blocked = new Set((deleted.results ?? []).map((r) => r.canonical_key));
  const urls = [...staticChannelIdentities].map((key) => {
    const [platform, account] = key.split(':');
    const hosts: Record<string, string> = { youtube: 'www.youtube.com/@', twitch: 'www.twitch.tv/', instagram: 'www.instagram.com/', tiktok: 'www.tiktok.com/@' };
    return hosts[platform] ? `https://${hosts[platform]}${account}` : '';
  }).filter(Boolean).concat((rows.results ?? []).map((r) => r.url));
  return [...new Map(urls.filter((url) => !blocked.has(channelIdentity(url) ?? '')).map((url) => [channelIdentity(url), url])).values()].sort();
}
