import { env } from 'cloudflare:workers';
import { fetchInstagramPage } from '@/lib/instagram-fetch';
import { allowedProfileUrl, fetchProfilePage, parseProfile, imageUrl, countValue } from '@/lib/profile-metadata';

export type ChannelMetadata = {
  title: string;
  description: string;
  category: string;
  platform: string;
  avatarUrl: string | null;
  subscriberCount: number | null;
  warnings?: string[];
};

type TwitchUser = {
  displayName?: string;
  description?: string;
  profileImageURL?: string;
  followers?: { totalCount?: number };
};

const TWITCH_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

const platformForHost = (host: string) =>
  host.includes('youtube.com') || host === 'youtu.be'
    ? 'YouTube'
    : host.includes('instagram.com')
      ? 'Instagram'
      : host.includes('tiktok.com')
        ? 'TikTok'
        : host.includes('twitch.tv')
          ? 'Twitch'
          : host.includes('open.spotify.com')
            ? 'Spotify'
            : 'Сайт';

function fallbackTitle(url: URL) {
  const handle = decodeURIComponent(
    url.pathname.split('/').filter(Boolean).at(-1) ?? url.hostname,
  )
    .replace(/^@/, '')
    .replaceAll('_', ' ');
  return handle.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function readMeta(html: string, names: string[]) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`,
        'i',
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`,
        'i',
      ),
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
  return (
    rules.find(([, words]) =>
      words.some((word) => value.includes(word)),
    )?.[0] ?? 'Супольнасць'
  );
}

export async function enrichChannel(
  sourceUrl: string,
  reason: string,
): Promise<ChannelMetadata> {
  const url = new URL(sourceUrl);
  if (!allowedProfileUrl(sourceUrl)) throw new Error('Непадтрымліваемая спасылка');
  const platform = platformForHost(url.hostname.toLowerCase());
  const allowed = [
    'youtube.com',
    'youtu.be',
    'instagram.com',
    'tiktok.com',
    'twitch.tv',
    'open.spotify.com',
  ];
  if (
    !allowed.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    )
  ) {
    return {
      title: fallbackTitle(url),
      description: reason,
      category: chooseCategory(reason),
      platform,
      avatarUrl: null,
      subscriberCount: null,
    };
  }

  if (platform === 'Twitch') {
    const login = decodeURIComponent(
      url.pathname.split('/').filter(Boolean)[0] ?? '',
    ).replace(/^@/, '');
    if (login) {
      const response = await fetch('https://gql.twitch.tv/gql', {
        method: 'POST',
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query:
            'query ChannelMetadata($login: String!) { user(login: $login) { displayName description profileImageURL(width: 300) followers { totalCount } } }',
          variables: { login },
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          data?: { user?: TwitchUser | null };
        };
        const user = payload.data?.user;
        if (user) {
          const title = user.displayName?.trim() || fallbackTitle(url);
          const description = user.description?.trim().slice(0, 500) || reason;
          const count = user.followers?.totalCount;
          return {
            title,
            description,
            category: chooseCategory(`${title} ${description} ${reason}`),
            platform,
            avatarUrl: user.profileImageURL ?? null,
            subscriberCount:
              Number.isSafeInteger(count) && count! >= 0 ? count! : null,
          };
        }
      }
    }
    return {
      title: fallbackTitle(url),
      description: reason,
      category: chooseCategory(reason),
      platform,
      avatarUrl: null,
      subscriberCount: null,
    };
  }

  const handle = url.pathname.split('/').filter(Boolean)[0]?.replace(/^@/, '') ?? '';
  const warnings: string[] = [];
  const html = await (platform === 'Instagram' ? fetchInstagramPage(url.toString()) : fetchProfilePage(url.toString())).catch((error) => { warnings.push(error instanceof Error ? error.message : 'Не ўдалося прачытаць профіль'); return ''; });
  const parsed = parseProfile(html, platform, handle);
  if (platform === 'Spotify' || platform === 'TikTok') {
    try {
      const endpoint = platform === 'Spotify' ? 'https://open.spotify.com/oembed' : 'https://www.tiktok.com/oembed';
      const response = await fetch(`${endpoint}?url=${encodeURIComponent(url.toString())}`, { redirect: 'error', signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        const embed = await response.json() as { title?: string; author_name?: string; thumbnail_url?: string };
        parsed.title = (platform === 'TikTok' ? embed.author_name : embed.title) || parsed.title;
        parsed.avatarUrl = imageUrl(embed.thumbnail_url) ?? parsed.avatarUrl;
      }
    } catch { warnings.push('oEmbed недаступны: тайм-аўт або сеткавая памылка.'); }
  }
  const key = (env as unknown as { YOUTUBE_API_KEY?: string }).YOUTUBE_API_KEY;
  if (platform === 'YouTube' && !key) warnings.push('Ключ YouTube API не падключаны.');
  if (platform === 'YouTube' && key) {
    try {
      const parts = url.pathname.split('/').filter(Boolean);
      const params = new URLSearchParams({ part: 'snippet,statistics', key });
      if (parts[0] === 'channel') params.set('id', parts[1]);
      else if (parts[0]?.startsWith('@')) params.set('forHandle', parts[0]);
      else if (parts[0] === 'user') params.set('forUsername', parts[1]);
      else throw new Error('Для YouTube API патрэбная спасылка на канал, а не на відэа.');
      const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`, { signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        const data = await response.json() as { items?: { snippet?: { title?: string; description?: string; thumbnails?: { high?: { url?: string } } }; statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean } }[] };
        const item = data.items?.[0];
        if (!item) warnings.push('YouTube API не знайшоў канал па гэтай спасылцы.');
        parsed.title = item?.snippet?.title || parsed.title;
        parsed.description = item?.snippet?.description || parsed.description;
        parsed.avatarUrl = imageUrl(item?.snippet?.thumbnails?.high?.url) ?? parsed.avatarUrl;
        if (!item?.statistics?.hiddenSubscriberCount) parsed.subscriberCount = countValue(item?.statistics?.subscriberCount);
      } else {
        const errorBody = await response.json().catch(() => null) as { error?: { errors?: { reason?: string }[] } } | null;
        const reason = errorBody?.error?.errors?.[0]?.reason;
        const safeReasons: Record<string, string> = { quotaExceeded: 'вычарпаная квота', keyInvalid: 'няправільны ключ', accessNotConfigured: 'API не ўключаны', ipRefererBlocked: 'абмежаванні ключа', forbidden: 'доступ забаронены' };
        warnings.push(`YouTube API: HTTP ${response.status}${reason && safeReasons[reason] ? ` — ${safeReasons[reason]}` : ''}.`);
      }
    } catch (error) { warnings.push(error instanceof Error && error.message.startsWith('Для YouTube') ? error.message : 'YouTube API не адказаў: тайм-аўт або сеткавая памылка.'); }
  }
  const title = parsed.title || fallbackTitle(url);
  const description = parsed.description.slice(0, 1000) || reason;
  const avatarUrl = parsed.avatarUrl;
  if (!parsed.avatarUrl && !parsed.description && parsed.subscriberCount === null && html) warnings.push(`${platform} адказаў, але метаданыя профілю ў адказе не знойдзеныя.`);
  return {
    title,
    description,
    category: chooseCategory(`${title} ${description} ${reason}`),
    platform,
    avatarUrl,
    subscriberCount: parsed.subscriberCount,
    warnings,
  };
}
