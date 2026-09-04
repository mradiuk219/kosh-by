export const socialPlatforms = ['Instagram', 'Twitch', 'TikTok', 'Spotify'] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];

// Accept accounts only, never posts, redirects, playlists or arbitrary fetch URLs.
export function socialProfile(value: string) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return null;
    const host = parsed.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
    const parts = parsed.pathname.split('/').filter(Boolean);
    const name = parts[0] ?? '';
    let platform: SocialPlatform;
    let path: string;
    if (host === 'instagram.com' && parts.length === 1 && /^[a-z0-9_.]{1,30}$/i.test(name) && !['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'about', 'developer'].includes(name.toLowerCase())) {
      platform = 'Instagram'; path = name.toLowerCase();
    } else if (host === 'twitch.tv' && parts.length === 1 && /^[a-z0-9_]{3,25}$/i.test(name) && !['directory', 'downloads', 'jobs', 'settings', 'videos', 'search', 'subscriptions', 'wallet', 'turbo', 'inventory', 'login', 'signup'].includes(name.toLowerCase())) {
      platform = 'Twitch'; path = name.toLowerCase();
    } else if (host === 'tiktok.com' && /^@[a-z0-9_.]{2,24}$/i.test(name) && (parts.length === 1 || (parts.length === 3 && parts[1] === 'video' && /^\d+$/.test(parts[2])))) {
      platform = 'TikTok'; path = name.toLowerCase();
    } else if (host === 'open.spotify.com' && parts.length === 2 && name === 'artist' && /^[a-zA-Z0-9]{22}$/.test(parts[1])) {
      platform = 'Spotify'; path = `artist/${parts[1]}`;
    } else return null;
    return { platform, url: `https://${host}/${path}`, canonical_key: `${platform.toLowerCase()}:${path.replace(/^@/, '').toLowerCase()}`, fallbackTitle: path.replace(/^@|^artist\//, '') };
  } catch { return null; }
}

export function socialLinks(text: string) {
  return [...new Map((text.match(/https:\/\/[^\s<>"']+/g) ?? [])
    .map((url) => socialProfile(url.replace(/[),;!?]+$/, '')))
    .filter((profile) => profile !== null)
    .map((profile) => [profile.canonical_key, profile])).values()];
}

export type SocialCandidate = {
  id: string; canonical_key: string; platform: SocialPlatform; url: string;
  title: string; description: string; category: string; source_url: string;
  source_label: string; language_evidence: string;
  status: 'pending' | 'approved' | 'rejected'; discovered_at: string; reviewed_at: string | null;
};
