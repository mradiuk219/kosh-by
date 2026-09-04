export type ProfileFields = { title: string; description: string; avatarUrl: string | null; subscriberCount: number | null };
export const emptyProfile = (): ProfileFields => ({ title: '', description: '', avatarUrl: null, subscriberCount: null });
export function countValue(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}
export function imageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function decodeEntities(value: string) {
  return value.replace(/&#(x[0-9a-f]+|\d+);/gi, (whole, code: string) => { const n = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole; }).replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
}
export function metaValue(html: string, names: string[]) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = new Map([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)].map((m) => [m[1].toLowerCase(), decodeEntities(m[3])]));
    if (names.includes(attrs.get('property') ?? attrs.get('name') ?? '')) return attrs.get('content')?.trim() ?? '';
  }
  return '';
}
export function parseProfile(html: string, platform: string, handle: string): ProfileFields {
  const result = emptyProfile();
  // Login/challenge screens are not account metadata.
  const rawTitle = metaValue(html, ['og:title', 'twitter:title']);
  if (/^(login|log in|sign up|instagram|tiktok|spotify|security check|just a moment)[.!…\s]*$/i.test(rawTitle) || /<title>\s*(Just a moment|Access denied)/i.test(html)) return result;
  result.title = rawTitle.replace(/\s*[|–-]\s*(YouTube|Instagram|TikTok|Spotify).*$/i, '').trim();
  result.description = metaValue(html, ['og:description', 'twitter:description', 'description']);
  result.avatarUrl = imageUrl(metaValue(html, ['og:image', 'twitter:image']));
  // Spotify's generic OG description often contains monthly listeners: never interpret as followers or a bio.
  if (platform === 'Spotify' && /monthly listeners|штомесяч|слушател|słuchacz/i.test(result.description)) result.description = '';
  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    let root: unknown;
    try { root = JSON.parse(script[1]); } catch { continue; }
    const queue: unknown[] = [root]; let visited = 0;
    while (queue.length && visited++ < 20000) {
      const node = queue.shift();
      if (!node || typeof node !== 'object') continue;
      const obj = node as Record<string, any>;
      const user = platform === 'TikTok' ? obj.user : obj;
      if (user && typeof user === 'object' && String(user.uniqueId ?? user.username ?? '').toLowerCase() === handle.toLowerCase()) {
        result.title = user.nickname || user.full_name || result.title;
        result.description = user.signature ?? user.biography ?? result.description;
        result.avatarUrl = imageUrl(user.avatarLarger ?? user.avatarMedium ?? user.profile_pic_url_hd ?? user.profile_pic_url) ?? result.avatarUrl;
        result.subscriberCount = countValue(obj.stats?.followerCount ?? user.edge_followed_by?.count ?? user.follower_count) ?? result.subscriberCount;
      }
      for (const value of Object.values(obj)) if (value && typeof value === 'object') queue.push(value);
    }
  }
  // Only an explicitly labelled follower count, not following/likes/views/listeners.
  if (platform === 'Instagram' && result.subscriberCount === null) {
    const match = result.description.match(/(?:^|\s)([\d,]+)\s+Followers\b/i);
    if (match) result.subscriberCount = countValue(match[1].replaceAll(',', ''));
  }
  result.title = String(result.title).slice(0, 200);
  result.description = String(result.description).slice(0, 1000);
  return result;
}

const hosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'instagram.com', 'www.instagram.com', 'tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'twitch.tv', 'www.twitch.tv', 'open.spotify.com']);
export function allowedProfileUrl(value: string) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.port && !u.username && !u.password && hosts.has(u.hostname); } catch { return false; }
}
export async function fetchProfilePage(value: string): Promise<string> {
  let url = value;
  for (let i = 0; i < 4; i++) {
    if (new URL(url).hostname === 'consent.youtube.com') throw new Error('YouTube вярнуў старонку згоды замест профілю. Патрэбны YouTube API.');
    if (!allowedProfileUrl(url)) throw new Error('Небяспечная спасылка метаданых');
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KOSH/1.0)' } }).catch(() => { throw new Error('Крыніца не адказала: тайм-аўт або сеткавая памылка.'); });
    if (response.status >= 300 && response.status < 400) { const next = response.headers.get('location'); if (!next) throw new Error('Пусты пераход'); url = new URL(next, url).href; continue; }
    if (!response.ok) {
      const error = new Error(`Крыніца недаступная: ${response.status}`) as Error & { retryAt?: number };
      const retry = response.headers.get('retry-after');
      if (retry) { const time = /^\d+$/.test(retry) ? Date.now() + Number(retry) * 1000 : Date.parse(retry); if (Number.isFinite(time)) error.retryAt = time; }
      throw error;
    }
    const reader = response.body?.getReader(); if (!reader) return '';
    const decoder = new TextDecoder(); let text = ''; let bytes = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 3_000_000) { await reader.cancel(); throw new Error('Адказ занадта вялікі'); } text += decoder.decode(value, { stream: true }); }
    const html = text + decoder.decode();
    if (/\/accounts\/login|<title>\s*(Log in|Login|Just a moment|Access denied)/i.test(new URL(url).pathname + html.slice(0, 5000))) throw new Error('Крыніца вярнула старонку ўваходу або абмежавання доступу.');
    return html;
  }
  throw new Error('Занадта шмат пераходаў');
}
