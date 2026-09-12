export type Media = {
  id?: string;
  title: string;
  creator: string;
  platform: string;
  category: string;
  image?: string;
  logoText?: string;
  background: string;
  url?: string;
  featured?: boolean;
  addedAt?: string;
  subscriberCount?: number;
  contentKind?: 'channel' | 'movie' | 'book';
  releaseYear?: number;
  author?: string;
};

// Titles and translated platform labels are not identities: remakes can share both.
export function mediaKey(item: Media): string {
  return JSON.stringify([item.contentKind ?? 'channel', item.platform,
    item.id ?? item.url ?? [item.title, item.author, item.releaseYear, item.creator]]);
}

const PLATFORM_BY_HOST = [
  ['YouTube', ['youtube.com', 'youtu.be']],
  ['Instagram', ['instagram.com']],
  ['TikTok', ['tiktok.com']],
  ['Twitch', ['twitch.tv']],
  ['Spotify', ['open.spotify.com']],
] as const;

function platformFromUrl(url?: string) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return (
      PLATFORM_BY_HOST.find(([, hosts]) =>
        hosts.some((name) => host === name || host.endsWith(`.${name}`)),
      )?.[0] ?? null
    );
  } catch {
    return null;
  }
}

export function normalizeMedia(item: Media): Media {
  const platform = platformFromUrl(item.url) ?? item.platform.trim();
  return platform === item.platform ? item : { ...item, platform };
}

export const bg = {
  culture:
    'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=78',
  games:
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=78',
  talk: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=78',
  travel:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=78',
};

const youtubeMedia: Media[] = [
  {
    title: 'Будзьма беларусамі!',
    creator: 'Культура, гісторыя і беларуская ідэнтычнасць',
    platform: 'YouTube',
    category: 'Культура',
    image: '/channel-logos/budzma.png',
    background:
      'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=78',
    url: 'https://www.youtube.com/@TheBudzma',
    featured: true,
  },
  {
    title: 'Годна',
    creator: 'Беларуская культура, музыка і гісторыя',
    platform: 'YouTube',
    category: 'Культура',
    image: '/channel-logos/hodna.png',
    background:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=78',
    url: 'https://www.youtube.com/@hodnaby',
    featured: true,
  },
  {
    title: 'Тутэйшы Шляхціч',
    creator: 'Беларуская гісторыя, мова і культура',
    platform: 'YouTube',
    category: 'Гісторыя',
    image: '/channel-logos/tutejszy.png',
    background:
      'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=900&q=78',
    url: 'https://www.youtube.com/@TutejszySzlachcicz',
    featured: true,
  },
  {
    title: 'ХАДАНОВІЧ',
    creator: 'Літаратура, паэзія і культурныя размовы',
    platform: 'YouTube',
    category: 'Кнігі',
    image: '/channel-logos/chadanovic.png',
    background:
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=78',
    url: 'https://www.youtube.com/@chadanovic',
    featured: true,
  },
  {
    title: 'PALATNO Media',
    creator: 'Гісторыі беларускіх гарадоў і супольнасцяў',
    platform: 'YouTube',
    category: 'Грамадства',
    image: '/channel-logos/palatno.png',
    background:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=78',
    url: 'https://www.youtube.com/@palatno',
  },
  {
    title: 'Рудзі',
    creator: 'Гульні і гульнявая індустрыя па-беларуску',
    platform: 'YouTube',
    category: 'Гульні',
    image: '/channel-logos/rudzi.png',
    background:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=78',
    url: 'https://www.youtube.com/@Rudzi',
  },
  {
    title: 'Vozhyk',
    creator: 'Беларускамоўныя агучкі, гумар і пераклады',
    platform: 'YouTube',
    category: 'Гумар',
    image: '/channel-logos/vozhyk.png',
    background:
      'https://images.unsplash.com/photo-1586899028174-e7098604235b?auto=format&fit=crop&w=900&q=78',
    url: 'https://www.youtube.com/@vozh_voice',
  },
  {
    title: 'Konan Ŭ',
    creator: 'Казкі, мова і развагі пра беларускасць',
    platform: 'YouTube',
    category: 'Культура',
    image: '/channel-logos/konan.png',
    background:
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=78',
    url: 'https://www.youtube.com/@Konan_V',
  },
  {
    title: 'Віталь Чырвінскі',
    creator: 'Размовы пра ваенную гісторыю Беларусі',
    platform: 'YouTube',
    category: 'Гісторыя',
    image: '/channel-logos/chyrvinski.png',
    background:
      'https://images.unsplash.com/photo-1564982759782-3a931653a86c?auto=format&fit=crop&w=900&q=78',
    url: 'https://www.youtube.com/@vital_chyrvinski',
  },
  {
    title: 'Белсат History',
    creator: 'Дакументальныя фільмы і гісторыя Беларусі',
    platform: 'YouTube',
    category: 'Гісторыя',
    image: '/channel-logos/belsat-history.png',
    background:
      'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=78',
    url: 'https://www.youtube.com/@belsat_history',
  },
  {
    title: 'Гісторыя на Свабодзе',
    creator: 'Размовы пра мінулае Беларусі і рэгіёна',
    platform: 'YouTube',
    category: 'Гісторыя',
    image: '/channel-logos/svaboda-history.png',
    background:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=78',
    url: 'https://www.youtube.com/@svaboda-historyja',
  },
  {
    title: 'Слухай сюды',
    creator: 'Эпізоды беларускай гісторыі і культуры',
    platform: 'YouTube',
    category: 'Гісторыя',
    image: '/channel-logos/sluhaj.png',
    background:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=78',
    url: 'https://www.youtube.com/@user-Sluhaj',
  },
];

const socialMedia: Media[] = [
  {
    title: 'Animatarka',
    creator: 'Анімацыя і беларуская творчасць',
    platform: 'Instagram',
    category: 'Творчасць',
    logoText: 'A',
    background: bg.culture,
    url: 'https://www.instagram.com/animatarka/',
  },
  {
    title: 'Брудны Вожык',
    creator: 'Агучкі, пераклады і гумар па-беларуску',
    platform: 'Instagram',
    category: 'Гумар',
    logoText: 'В',
    background: bg.culture,
    url: 'https://www.instagram.com/brudny_vozhyk/',
  },
  {
    title: 'Heta Top',
    creator: 'Беларускія знаходкі, культура і людзі',
    platform: 'Instagram',
    category: 'Культура',
    logoText: 'HT',
    background: bg.travel,
    url: 'https://www.instagram.com/heta.top/',
  },
  {
    title: 'Белсат',
    creator: 'Беларускія навіны, гісторыі і рэпартажы',
    platform: 'Instagram',
    category: 'Медыя',
    logoText: 'Б',
    background: bg.talk,
    url: 'https://www.instagram.com/belsat/',
  },
  {
    title: 'Загляне сонца',
    creator: 'Беларуская гісторыя і шлях да сваёй мовы',
    platform: 'Instagram',
    category: 'Гісторыя',
    logoText: 'ЗС',
    background: bg.culture,
    url: 'https://www.instagram.com/zahlianie_sonca/',
  },
  {
    title: 'Nochy',
    creator: 'Музычны гурт і песні па-беларуску',
    platform: 'Instagram',
    category: 'Музыка',
    logoText: 'N',
    background: bg.talk,
    url: 'https://www.instagram.com/nochy_musicband/',
  },
  {
    title: 'Мой родны гук',
    creator: 'Беларуская музыка і сучаснае гучанне',
    platform: 'Instagram',
    category: 'Музыка',
    logoText: 'МГ',
    background: bg.talk,
    url: 'https://www.instagram.com/mojrodnyhuk/',
  },
  {
    title: 'Палеская эмігрантка',
    creator: 'Палессе, мова і асабістыя гісторыі',
    platform: 'Instagram',
    category: 'Блог',
    logoText: 'ПЭ',
    background: bg.travel,
    url: 'https://www.instagram.com/paleskaja.emigrantka/',
  },
  {
    title: 'Ілля Сіўцоў',
    creator: 'Беларускамоўны аўтарскі блог',
    platform: 'Instagram',
    category: 'Блог',
    logoText: 'ІС',
    background: bg.travel,
    url: 'https://www.instagram.com/illasiucou/',
  },
  {
    title: 'Пра мову',
    creator: 'Беларуская мова проста і штодзённа',
    platform: 'Instagram',
    category: 'Мова',
    logoText: 'ПМ',
    background: bg.culture,
    url: 'https://www.instagram.com/pramovu/',
  },
  {
    title: 'Кася Мастак',
    creator: 'Мастацтва і творчасць па-беларуску',
    platform: 'Instagram',
    category: 'Мастацтва',
    logoText: 'КМ',
    background: bg.culture,
    url: 'https://www.instagram.com/kasia_mastak/',
  },
  {
    title: 'Годна',
    creator: 'Беларуская культура, музыка і гісторыя',
    platform: 'Instagram',
    category: 'Культура',
    logoText: 'Г',
    background: bg.culture,
    url: 'https://www.instagram.com/hodna.by/',
  },

  {
    title: 'Itbeard',
    creator: 'ІТ і тэхналогіі па-беларуску',
    platform: 'TikTok',
    category: 'Тэхналогіі',
    image: '/social-logos/tiktok-itbeard.jpg',
    background: bg.games,
    url: 'https://www.tiktok.com/@itbeard',
  },
  {
    title: 'Ikbytech',
    creator: 'Праграмаванне і тэхналогіі па-беларуску',
    platform: 'TikTok',
    category: 'Тэхналогіі',
    logoText: 'IK',
    background: bg.games,
    url: 'https://www.tiktok.com/@ikbytech',
  },
  {
    title: 'Першы Гікаўскі',
    creator: 'Гульні, медыя, серыялы і тэхналогіі',
    platform: 'TikTok',
    category: 'Гульні',
    logoText: 'ПГ',
    background: bg.games,
    url: 'https://www.tiktok.com/@piersyhikauski',
  },
  {
    title: 'Праз космас',
    creator: 'Кароткія навіны і факты пра космас',
    platform: 'TikTok',
    category: 'Навука',
    logoText: 'ПК',
    background: bg.games,
    url: 'https://www.tiktok.com/@praz_kosmas',
  },
  {
    title: 'Rudzi Game',
    creator: 'Агляды гульняў па-беларуску',
    platform: 'TikTok',
    category: 'Гульні',
    logoText: 'R',
    background: bg.games,
    url: 'https://www.tiktok.com/@rudzi_game',
  },
  {
    title: 'Ms Bahiema',
    creator: 'Стрымы і гульнявы кантэнт па-беларуску',
    platform: 'TikTok',
    category: 'Гульні',
    logoText: 'MB',
    background: bg.games,
    url: 'https://www.tiktok.com/@ms.bahiema',
  },
  {
    title: 'NadzeyaGames',
    creator: 'Агляды і гісторыі пра відэагульні',
    platform: 'TikTok',
    category: 'Гульні',
    logoText: 'NG',
    background: bg.games,
    url: 'https://www.tiktok.com/@nadzeyagames',
  },
  {
    title: 'Брудны Вожык',
    creator: 'Беларускамоўныя агучкі і пераклады',
    platform: 'TikTok',
    category: 'Агучка',
    logoText: 'В',
    background: bg.culture,
    url: 'https://www.tiktok.com/@brudny_vozhyk',
  },
  {
    title: 'Агучка Кавярня',
    creator: 'Серыялы, мультфільмы і кіно па-беларуску',
    platform: 'TikTok',
    category: 'Агучка',
    logoText: 'АК',
    background: bg.culture,
    url: 'https://www.tiktok.com/@kaviarnia',
  },
  {
    title: 'Жужаль',
    creator: 'Пераклады розных відэа на беларускую мову',
    platform: 'TikTok',
    category: 'Агучка',
    logoText: 'Ж',
    background: bg.culture,
    url: 'https://www.tiktok.com/@zhuzhal',
  },
  {
    title: 'Гаварун',
    creator: 'Кіно і мультфільмы ў беларускай агучцы',
    platform: 'TikTok',
    category: 'Агучка',
    logoText: 'Г',
    background: bg.culture,
    url: 'https://www.tiktok.com/@gavarun.by',
  },
  {
    title: 'Bastiesmiles',
    creator: 'Беларускія міфы, традыцыі і гісторыя',
    platform: 'TikTok',
    category: 'Культура',
    logoText: 'B',
    background: bg.culture,
    url: 'https://www.tiktok.com/@bastiesmiles',
  },

  ...[
    'watafakablr',
    'impani4',
    'dzedmaksim',
    'lepus81',
    'nine_ravens_cemetery',
    'angryralef',
    'ms_bahiema',
    'toddzie',
    'shagrael_by',
    'rudzi_belarus',
    'bel_asch',
    'sla5her_by',
    'mihas_gareza',
  ].map((handle, index) => ({
    title: handle.replaceAll('_', ' '),
    creator: 'Беларускамоўныя жывыя эфіры, гульні і размовы',
    platform: 'Twitch',
    category: 'Стрымы',
    image: index === 0 ? '/social-logos/twitch-watafakablr.jpg' : undefined,
    logoText: handle.slice(0, 2).toUpperCase(),
    background: index % 2 ? bg.talk : bg.games,
    url: `https://www.twitch.tv/${handle}`,
  })),
];

export const media = [...youtubeMedia, ...socialMedia].map((item) =>
  item.platform === 'Instagram' ? { ...item, addedAt: '2026-08-29' } : item,
);
