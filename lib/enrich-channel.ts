export type ChannelMetadata = {
  title: string;
  description: string;
  category: string;
  platform: string;
  avatarUrl: string | null;
};

const platformForHost = (host: string) => host.includes('youtube.com') || host === 'youtu.be' ? 'YouTube' : host.includes('instagram.com') ? 'Instagram' : host.includes('tiktok.com') ? 'TikTok' : host.includes('twitch.tv') ? 'Twitch' : 'Сайт';

function fallbackTitle(url: URL) {
  const handle = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? url.hostname)
    .replace(/^@/, '')
    .replaceAll('_', ' ');
  return handle.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function readMeta(html: string, names: string[]) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
    ];
    for (const pattern of patterns) {
      const value = html.match(pattern)?.[1];
      if (value) return decodeHtml(value.trim());
    }
  }
  return '';
}

function decodeHtml(value: string) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function chooseCategory(text: string) {
  const value = text.toLowerCase();
  const rules: [string, string[]][] = [
    ['Гульні', ['гульн', 'гульні', 'gaming', 'gameplay', 'відэагуль']],
    ['Музыка', ['музык', 'песн', 'гурт', 'music', 'band']],
    ['Гісторыя', ['гістор', 'мінула', 'history']],
    ['Навіны', ['навін', 'news', 'рэпартаж', 'журналіст']],
    ['Тэхналогіі', ['тэхналог', 'праграм', 'айці', ' it ', 'tech']],
    ['Мова', ['беларуская мова', 'пра мову', 'мовазнаў']],
    ['Культура', ['культур', 'літаратур', 'паэзі', 'мастац', 'традыц']],
    ['Гумар', ['гумар', 'жарт', 'камед', 'comedy']],
    ['Падарожжы', ['падарож', 'вандроў', 'travel']],
    ['Стрымы', ['стрым', 'жывы эфір', 'stream']],
  ];
  return rules.find(([, words]) => words.some((word) => value.includes(word)))?.[0] ?? 'Супольнасць';
}

export async function enrichChannel(sourceUrl: string, reason: string): Promise<ChannelMetadata> {
  const url = new URL(sourceUrl);
  const platform = platformForHost(url.hostname.toLowerCase());
  const allowed = ['youtube.com', 'youtu.be', 'instagram.com', 'tiktok.com', 'twitch.tv'];
  if (!allowed.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    return { title: fallbackTitle(url), description: reason, category: chooseCategory(reason), platform, avatarUrl: null };
  }

  const response = await fetch(url.toString(), {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; KOSH/1.0; +https://kosh-belarus.radziuk219.chatgpt.site)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Metadata request failed: ${response.status}`);
  const html = await response.text();
  const rawTitle = readMeta(html, ['og:title', 'twitter:title']);
  const title = rawTitle.replace(/\s*[|–-]\s*(YouTube|Instagram|TikTok|Twitch).*$/i, '').trim() || fallbackTitle(url);
  const description = readMeta(html, ['og:description', 'twitter:description', 'description']).slice(0, 500) || reason;
  const avatarUrl = readMeta(html, ['og:image', 'twitter:image']) || null;
  return { title, description, category: chooseCategory(`${title} ${description} ${reason}`), platform, avatarUrl };
}
