'use client';
import {authorPath} from '@/lib/author-identity';
import {HomeTopicLinks} from './discovery-nav';
import { useLanguage, LanguageSwitch } from '@/components/language';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Menu,
  Mic2,
  Music2,
  Play,
  Radio,
  Search,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { channelIdentity } from '@/lib/channel-identity';
import { displayCategories } from '@/lib/categories';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { media, bg, normalizeMedia, mediaKey, type Media } from '@/lib/media-data';
export { media, type Media } from '@/lib/media-data';
const filters = ['Усё', 'YouTube', 'Instagram', 'TikTok', 'Twitch', 'Spotify'];
type HeroStat = {
  value: number | string;
  label: string;
  channel?: string;
  href?: string;
};
const initialHeroStats: HeroStat[] = [
  { value: '—', label: 'Колькасць аўтараў' },
  {
    value: '442 тыс.',
    label: 'Найбольш падпісантаў',
    channel: 'БЕЛСАТ NEWS',
    href: 'https://www.youtube.com/@belsat_news',
  },
  { value: '—', label: 'Кіно' },
  { value: '—', label: 'Кнігі' },
];

function shuffleMedia(items: Media[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function getFreshMedia(items: Media[]) {
  const datedItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.addedAt);
  if (!datedItems.length) return items.slice(-4).reverse();

  const latestDay = datedItems.reduce((latest, { item }) => {
    const day = item.addedAt!.slice(0, 10);
    return day > latest ? day : latest;
  }, '');
  const latestDayItems = datedItems
    .filter(({ item }) => item.addedAt!.slice(0, 10) === latestDay)
    .sort(
      (a, b) =>
        b.item.addedAt!.localeCompare(a.item.addedAt!) || b.index - a.index,
    )
    .map(({ item }) => item);
  if (latestDayItems.length > 4) return latestDayItems;

  return datedItems
    .sort(
      (a, b) =>
        b.item.addedAt!.localeCompare(a.item.addedAt!) || b.index - a.index,
    )
    .slice(0, 4)
    .map(({ item }) => item);
}

const freshMedia = getFreshMedia(media);

type ApprovedSubmission = {
  id: string;
  url: string;
  reason: string;
  created_at: string;
  reviewed_at: string | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  platform?: string | null;
  avatar_url?: string | null;
  subscriber_count?: number | null;
};

export function approvedSubmissionToMedia(
  submission: ApprovedSubmission,
): Media {
  const parsed = new URL(submission.url);
  const handle = decodeURIComponent(
    parsed.pathname.split('/').filter(Boolean).at(-1) ?? 'Новы аўтар',
  )
    .replace(/^@/, '')
    .replaceAll('_', ' ');
  const title =
    submission.title ||
    handle.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  const host = parsed.hostname.toLowerCase();
  const platform =
    submission.platform ||
    (host.includes('youtube') || host.includes('youtu.be')
      ? 'YouTube'
      : host.includes('instagram')
        ? 'Instagram'
        : host.includes('tiktok')
          ? 'TikTok'
          : host.includes('twitch')
            ? 'Twitch'
            : host.includes('spotify')
              ? 'Spotify'
              : 'Сайт');
  const lowerReason = submission.reason.toLowerCase();
  const category =
    submission.category ||
    (lowerReason.includes('гуль') || lowerReason.includes('game')
      ? 'Гульні'
      : lowerReason.includes('музык') || lowerReason.includes('пес')
        ? 'Музыка'
        : 'Супольнасць');
  const backgrounds: Record<string, string> = {
    YouTube: bg.culture,
    Instagram: bg.travel,
    TikTok: bg.games,
    Twitch: bg.talk,
    Spotify: bg.talk,
    Сайт: bg.culture,
  };

  return {
    title,
    creator: submission.description || submission.reason,
    platform,
    category,
    image: submission.avatar_url || undefined,
    logoText: handle.slice(0, 2).toUpperCase(),
    background: backgrounds[platform],
    url: submission.url,
    addedAt: submission.reviewed_at ?? submission.created_at,
    subscriberCount:
      submission.subscriber_count ??
      (channelIdentity(submission.url) === 'youtube:belsat_news'
        ? 442_000
        : undefined),
  };
}

export async function fetchApprovedMedia() {
  const response = await fetch('/api/submissions?view=approved', {
    cache: 'no-store',
  });
  if (!response.ok) return [] as Media[];
  const data = (await response.json()) as {
    submissions?: ApprovedSubmission[];
  };
  return (data.submissions ?? []).map(approvedSubmissionToMedia);
}

type CatalogOverride = {
  canonical_key: string;
  title: string;
  description: string;
  category: string;
  deleted: number;
};

type ChannelMetric = {
  canonical_key: string;
  subscriber_count: number;
};
export type ProfileRecord = { canonical_key: string; title: string | null; description: string | null; avatar_url: string | null; subscriber_count: number | null; status: string; error?: string | null; checked_at: string };

export async function fetchCatalogData() {
  const [approved, overrideResponse, metricsResponse, profileResponse, cultureResponse] = await Promise.all([
    fetchApprovedMedia(),
    fetch('/api/catalog-overrides', { cache: 'no-store' }),
    fetch('/api/channel-metrics', { cache: 'no-store' }),
    fetch('/api/profile-metadata', { cache: 'no-store' }),
    fetch('/api/culture-items', { cache: 'no-store' }),
  ]);
  const cultureData = cultureResponse.ok ? await cultureResponse.json() as { items?: Array<{ id:string; kind:'movie'|'book'; title:string; release_year:number; author:string; description:string; url:string; banner_url:string|null; updated_at:string }> } : { items: [] };
  const culture = (cultureData.items ?? []).map((item): Media => ({
    id: item.id,
    title: item.title, creator: item.description,
    platform: item.kind === 'movie' ? 'Кіно' : 'Кнігі',
    category: item.kind === 'movie' ? 'Кіно' : 'Кнігі',
    background: item.banner_url || bg.culture, url: item.url, addedAt: item.updated_at,
    contentKind: item.kind, releaseYear: item.release_year, author: item.author,
  }));
  const overrideData = overrideResponse.ok
    ? ((await overrideResponse.json()) as { overrides?: CatalogOverride[] })
    : { overrides: [] as CatalogOverride[] };
  const overrides = new Map(
    (overrideData.overrides ?? []).map((item) => [item.canonical_key, item]),
  );
  const metricsData = metricsResponse.ok
    ? ((await metricsResponse.json()) as { metrics?: ChannelMetric[] })
    : { metrics: [] as ChannelMetric[] };
  const metrics = new Map(
    (metricsData.metrics ?? []).map((item) => [
      item.canonical_key,
      item.subscriber_count,
    ]),
  );
  const withMetric = (item: Media) => {
    const key = channelIdentity(item.url);
    const profile = key ? profiles.get(key) : undefined;
    return { ...item, image: profile?.avatar_url || item.image, creator: item.creator || profile?.description || '', subscriberCount: (key ? metrics.get(key) : undefined) ?? profile?.subscriber_count ?? item.subscriberCount };
  };
  const profileData = profileResponse.ok ? await profileResponse.json() as { profiles: ProfileRecord[] } : { profiles: [] };
  const profiles = new Map(profileData.profiles.map((p) => [p.canonical_key, p]));
  const base = media.flatMap((item) => {
    const key = channelIdentity(item.url);
    const override = key ? overrides.get(key) : undefined;
    if (override?.deleted) return [];
    return [
      override
        ? {
            ...item,
            title: override.title || item.title,
            creator: override.description,
            category: override.category,
          }
        : item,
    ];
  });
  const normalizedApproved = approved.map(normalizeMedia).map(withMetric);
  return {
    approved: normalizedApproved,
    culture,
    catalog: [...mergeMedia(
      base.map(normalizeMedia).map(withMetric),
      normalizedApproved,
    ), ...culture],
  };
}

function mergeMedia(base: Media[], approved: Media[]) {
  const knownChannels = new Set<string>();
  const knownCards = new Set<string>();
  const normalized = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFKC')
      .replace(/[^\p{L}\p{N}]+/gu, '');

  return [...base, ...approved].filter((item) => {
    const identity = channelIdentity(item.url);
    const cardFingerprint = [
      normalized(item.platform),
      normalized(item.title),
      normalized(item.creator),
    ].join(':');
    if (
      (identity && knownChannels.has(identity)) ||
      knownCards.has(cardFingerprint)
    )
      return false;
    if (identity) knownChannels.add(identity);
    knownCards.add(cardFingerprint);
    return true;
  });
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'YouTube') return <Clapperboard className="size-3.5" />;
  if (platform === 'Instagram') return <Camera className="size-3.5" />;
  if (platform === 'Twitch') return <Radio className="size-3.5" />;
  if (platform === 'Spotify') return <Music2 className="size-3.5" />;
  if (platform === 'Падкаст') return <Mic2 className="size-3.5" />;
  return <Play className="size-3.5" />;
}

function formatSubscriberCount(value: number) {
  return new Intl.NumberFormat('be-BY', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function MediaCard({
  item,
  fluid = false,
  destination = 'platform',
  catalogReturnTo,
}: {
  item: Media;
  fluid?: boolean;
  destination?: 'platform' | 'author';
  catalogReturnTo?: string;
}) {
  const { t, locale, path } = useLanguage();
  const cultureCard = item.contentKind === 'movie' || item.contentKind === 'book';
  const badgeClass =
    item.platform === 'YouTube'
      ? 'border-[#ff4e45] bg-[#ff0000]'
      : item.platform === 'Instagram'
        ? 'border-fuchsia-400/70 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-400'
        : item.platform === 'TikTok'
          ? 'border-cyan-300/70 bg-black shadow-cyan-500/20'
          : item.platform === 'Spotify'
            ? 'border-[#1ed760] bg-[#1db954] text-black'
            : 'border-violet-300/70 bg-[#9146ff]';
  const logoClass =
    item.platform === 'Instagram'
      ? 'bg-gradient-to-br from-violet-600 via-pink-500 to-orange-400'
      : item.platform === 'TikTok'
        ? 'bg-black'
        : item.platform === 'Twitch'
          ? 'bg-[#9146ff]'
          : item.platform === 'Spotify'
            ? 'bg-[#1db954]'
            : 'bg-white';
  const card = (
    <article
      className={`group relative aspect-[4/5] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/8 bg-card transition hover:-translate-y-1 hover:border-white/20 ${fluid ? 'w-full max-w-none' : 'w-[72vw] max-w-[285px]'}`}
    >
      <img
        src={item.background}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className={`absolute inset-0 ${cultureCard ? 'bg-gradient-to-b from-black/10 via-black/35 to-[#08090b]/98' : 'bg-gradient-to-b from-black/55 via-black/72 to-[#08090b]/98'}`} />
      {!cultureCard && <div className="absolute inset-x-0 top-0 flex justify-center px-5 pt-7">
        {item.image ? (
          <img
            src={item.image}
            alt={`${t('Лагатып канала')} ${item.title}`}
            className="size-32 rounded-full border-4 border-white/12 bg-white object-cover shadow-2xl shadow-black/45 transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            aria-label={`${t('Лагатып канала')} ${item.title}`}
            className={`grid size-32 place-items-center rounded-full border-4 border-white/15 text-3xl font-black text-white shadow-2xl shadow-black/45 transition duration-500 group-hover:scale-105 ${logoClass}`}
          >
            {item.logoText}
          </div>
        )}
      </div>}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <Badge
          className={`mb-3 font-bold text-white shadow-lg ${badgeClass}`}
          variant="outline"
        >
          <PlatformIcon platform={item.platform} /> {t(item.platform)}
        </Badge>
        {cultureCard && <div className="mb-2 flex flex-wrap gap-x-3 text-xs font-semibold text-white/72"><span>{item.releaseYear}</span><span>{item.author}</span></div>}
        <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold">
          <span className={cultureCard ? 'sr-only' : 'text-secondary'}>
            {displayCategories(item.category).split(' · ').map(t).join(' · ')}
          </span>
          {!cultureCard && typeof item.subscriberCount === 'number' &&
            item.subscriberCount > 0 && (
              <span className="shrink-0 text-white/55">
                {formatSubscriberCount(item.subscriberCount)}{' '}{t("падп.")}</span>
            )}
        </div>
        <h3 className="text-lg font-bold leading-tight text-white">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-white/62">
          {item.creator}
        </p>
      </div>
    </article>
  );

  const internal = destination === 'author' && !cultureCard && item.platform === 'YouTube' ? authorPath(item.url) : null;
  const href = internal ? path(internal) + (catalogReturnTo ? '?returnTo=' + encodeURIComponent(catalogReturnTo) : '') : item.url;
  return item.url ? (
    <a
      href={href}
      target={internal ? undefined : '_blank'}
      rel="noreferrer"
      aria-label={`${t('Адкрыць')} «${item.title}» — ${t(item.platform)}`}
    >
      {card}
    </a>
  ) : (
    card
  );
}

function CarouselRow({ items }: { items: Media[] }) {
  const { t, locale, path } = useLanguage();
  const rowRef = useRef<HTMLDivElement>(null);
  const showControls = items.length > 4;
  const itemsKey = items
    .map((item) => `${t(item.platform)}:${item.url ?? item.title}`)
    .join('|');

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollLeft = 0;
    const frame = requestAnimationFrame(() => {
      row.scrollLeft = 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [itemsKey]);

  const scroll = (direction: -1 | 1) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({
      left: direction * Math.max(280, row.clientWidth * 0.82),
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      <div
        ref={rowRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-5 pr-10 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <MediaCard key={mediaKey(item)} item={item} />
        ))}
      </div>
      {showControls && (
        <>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={t("Гартаць налева")}
            onClick={() => scroll(-1)}
            className="absolute left-2 top-1/2 z-20 hidden size-11 -translate-y-1/2 rounded-full border border-white/15 bg-black/75 text-white shadow-xl backdrop-blur hover:bg-black/95 sm:grid"
          >
            <ChevronLeft className="size-6" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={t("Гартаць направа")}
            onClick={() => scroll(1)}
            className="absolute right-2 top-1/2 z-20 hidden size-11 -translate-y-1/2 rounded-full border border-white/15 bg-black/75 text-white shadow-xl backdrop-blur hover:bg-black/95 sm:grid"
          >
            <ChevronRight className="size-6" />
          </Button>
        </>
      )}
    </div>
  );
}

function SubmitDialog() {
  const { t, locale, path } = useLanguage();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submitSuggestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError('');
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: form.get('url') }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || 'Не ўдалося захаваць прапанову');
      }
      setSent(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Не ўдалося адправіць. Калі ласка, паспрабуй яшчэ раз.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setSent(false);
          setError('');
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90" />
        }
      >{t("Прапанаваць")}</DialogTrigger>
      <DialogContent className="border-white/10 bg-[#15171b] p-6 sm:max-w-md">
        {sent ? (
          <div className="py-8 text-center">
            <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-secondary/15 text-secondary">
              <Check className="size-7" />
            </span>
            <DialogTitle className="text-xl font-bold">{t("Дзякуй за знаходку!")}</DialogTitle>
            <DialogDescription className="mt-3">{t("Прапанова захавана для праверкі рэдакцыяй КОШа.")}</DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{t("Дадаць у КОШ")}</DialogTitle>
              <DialogDescription>{t("Дашлі спасылку на добры беларускамоўны канал, ролік або падкаст.")}</DialogDescription>
            </DialogHeader>
            <form className="mt-2 space-y-4" onSubmit={submitSuggestion}>
              <label className="block text-sm font-medium">{t("Спасылка")}<Input
                  name="url"
                  type="url"
                  required
                  placeholder="https://…"
                  className="mt-2 h-11 border-white/10 bg-white/5"
                />
              </label>
              {error && (
                <p role="alert" className="text-sm text-red-300">
                  {t(error)}
                </p>
              )}
              <Button
                type="submit"
                disabled={sending}
                className="h-11 w-full rounded-full font-bold"
              >
                <Send className="size-4" />{' '}
                {t(sending ? 'Адпраўляем…' : 'Адправіць прапанову')}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const { t, locale, path } = useLanguage();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Усё');
  const [catalogMedia, setCatalogMedia] = useState(media);
  const [approvedMedia, setApprovedMedia] = useState<Media[]>([]);
  const [cultureMedia, setCultureMedia] = useState<Media[]>([]);
  const [heroStats, setHeroStats] = useState<HeroStat[]>(initialHeroStats);

  useEffect(() => {
    let active = true;
    void fetchCatalogData().then(({ approved, catalog, culture }) => {
      if (!active) return;
      setApprovedMedia(approved);
      setCatalogMedia(shuffleMedia(catalog.filter((item) => !item.contentKind)));
      setCultureMedia(culture);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void fetch('/api/stats', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok || !active) return;
        const stats = (await response.json()) as {
          total: number;
          movies: number;
          books: number;
          topSubscribers: string;
          topChannel: string;
          topChannelUrl: string;
        };
        setHeroStats([
          { value: stats.total, label: 'Колькасць аўтараў' },
          {
            value: stats.topSubscribers,
            label: 'Найбольш падпісантаў',
            channel: stats.topChannel,
            href: stats.topChannelUrl,
          },
          { value: stats.movies, label: 'Кіно' },
          { value: stats.books, label: 'Кнігі' },
        ]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(
    () =>
      catalogMedia.filter((item) => {
        const matchesFilter = filter === 'Усё' || item.platform === filter;
        const needle = query.trim().toLowerCase();
        const matchesQuery =
          !needle ||
          `${item.title} ${item.creator} ${item.category} ${t(item.category)}`
            .toLowerCase()
            .includes(needle);
        return matchesFilter && matchesQuery;
      }),
    [catalogMedia, filter, query, locale],
  );

  return (
    <main className="site-shell min-h-screen overflow-x-hidden text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#111821]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1500px] items-center gap-7 px-5 lg:px-10">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  aria-label={t("Адкрыць меню")}
                  size="icon"
                  variant="ghost"
                  className="md:hidden"
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="border-white/10 bg-[#101115]">
              <SheetHeader>
                <SheetTitle className="text-2xl font-black">{t("КОШ")}<span className="text-primary">.</span>
                </SheetTitle>
                <SheetDescription>{t("Беларускі кантэнт у адным кошы")}</SheetDescription>
              </SheetHeader>
<HomeTopicLinks mobile />
            </SheetContent>
          </Sheet>
          <a
            href="#"
            className="text-2xl font-black tracking-[-0.06em] text-white"
            aria-label={t("КОШ — галоўная")}
          >{t("КОШ")}<span className="text-primary">.</span>
          </a>
<HomeTopicLinks />
          <div className="ml-auto hidden w-full max-w-xs md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={t("Пошук па КОШы")}
                placeholder={t("Шукаць кантэнт")}
                className="h-10 border-white/10 bg-white/6 pl-9 text-white placeholder:text-white/35"
              />
            </div>
          </div>
          <SubmitDialog />
          <LanguageSwitch />
        </div>
      </header>

      <section className="relative isolate pt-18">
        <img
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=88"
          alt={t("Ранішняе святло над краявідам")}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#111821_3%,rgba(17,24,33,.82)_36%,rgba(17,24,33,.18)_72%,rgba(17,24,33,.56)_100%),linear-gradient(0deg,#151b24_0%,transparent_58%)]" />
        <div className="mx-auto flex max-w-[1500px] px-5 py-16 lg:px-10">
          <div className="max-w-3xl">
            <h1 className="text-balance text-5xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-7xl">{t("Беларускае —")}<br />{t("бліжэй, чым здаецца")}</h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">{t("Відэа, падкасты, аўтары і гісторыі па-беларуску — сабраныя ў адным месцы, каб цікавае не гублялася ў стужцы.")}</p>
            <div className="mt-7 grid max-w-3xl grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-4">
              {heroStats.map((stat) => (
                <div
                  key={t(stat.label)}
                  className="relative flex min-h-40 flex-col items-center justify-center px-2 text-center"
                >
                  <img
                    src="/honor-seal-ornament.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 object-contain opacity-30"
                  />
                  <strong className="relative z-10 mt-1 block text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,.8)] sm:text-4xl">
                    {stat.value}
                  </strong>
                  <span className="relative z-10 mt-1 block max-w-32 text-[13px] font-semibold leading-tight text-white/75 drop-shadow-[0_2px_8px_rgba(0,0,0,.9)]">
                    {t(stat.label)}
                  </span>
                  {'href' in stat && stat.href && (
                    <a
                      href={stat.href}
                      target="_blank"
                      rel="noreferrer"
                      className="relative z-10 mt-1 text-xs font-bold text-secondary underline decoration-secondary/45 underline-offset-2 transition hover:text-[#8fb8ff]"
                    >
                      {stat.channel}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="catalog"
        className="mx-auto max-w-[1500px] px-5 pb-12 pt-6 lg:px-10"
      >
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">{t("Знайдзі сваё")}</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("Каталог КОШа")}</h2>
          </div>
          <div className="relative block sm:hidden">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Шукаць кантэнт")}
              className="h-11 border-white/10 bg-white/6 pl-9"
            />
          </div>
        </div>
        <div className="mb-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {filters.map((name) => (
            <Button
              key={t(name)}
              onClick={() => setFilter(name)}
              variant={filter === name ? 'secondary' : 'outline'}
              className={`h-9 shrink-0 rounded-full px-4 ${filter !== name ? 'border-white/10 bg-white/4 text-white/65' : ''}`}
            >
              {t(name)}
            </Button>
          ))}
        </div>
        {results.length ? (
          <>
            <CarouselRow items={results} />
            <div className="mt-3 flex justify-center">
              <Button
                size="lg"
                className="h-11 rounded-full bg-primary px-7 font-bold"
                render={<a href={path('/catalog')} />}
                nativeButton={false}
              >{t("Адкрыць каталог")}<ArrowRight className="size-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/12 bg-white/3 px-6 py-14 text-center">
            <Search className="mx-auto mb-4 size-7 text-white/30" />
            <h3 className="font-bold">{t("Нічога не знайшлося")}</h3>
            <p className="mt-2 text-sm text-white/50">{t("Паспрабуй іншыя словы або абяры «Усё».")}</p>
            <Button
              variant="link"
              className="mt-2 text-secondary"
              onClick={() => {
                setQuery('');
                setFilter('Усё');
              }}
            >{t("Скінуць пошук")}</Button>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-12 lg:px-10">
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">{t("Глядзець па-беларуску")}</p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("Кіно і мультфільмы")}</h2>
        </div>
        {cultureMedia.some((item) => item.contentKind === 'movie') ? (
          <CarouselRow items={cultureMedia.filter((item) => item.contentKind === 'movie')} />
        ) : (
          <p className="rounded-3xl border border-dashed border-white/12 px-6 py-10 text-center text-white/40">{t("Кіно хутка з’явіцца ў КОШы")}</p>
        )}
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-12 lg:px-10">
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">{t("Чытаць па-беларуску")}</p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("Кнігі")}</h2>
        </div>
        {cultureMedia.some((item) => item.contentKind === 'book') ? (
          <CarouselRow items={cultureMedia.filter((item) => item.contentKind === 'book')} />
        ) : (
          <p className="rounded-3xl border border-dashed border-white/12 px-6 py-10 text-center text-white/40">{t("Кнігі хутка з’явяцца ў КОШы")}</p>
        )}
      </section>

      <section id="new" className="mx-auto max-w-[1500px] px-5 py-12 lg:px-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">{t("Свежае ў кошы")}</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("Новыя знаходкі")}</h2>
          </div>
          <a href={path('/catalog')} className="hidden items-center gap-1 text-sm font-semibold text-white/55 sm:flex">{t("Глядзець усе")}<ChevronRight className="size-4" />
          </a>
        </div>
        <CarouselRow
          items={
            approvedMedia.length || cultureMedia.length ? getFreshMedia([...approvedMedia, ...cultureMedia]) : freshMedia
          }
        />
      </section>

      <section
        id="about"
        className="mx-5 my-14 overflow-hidden rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_15%_30%,rgba(70,131,214,.22),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(233,101,42,.2),transparent_35%),#14161a] lg:mx-10"
      >
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 text-center sm:px-12">
          <p className="mx-auto text-xs font-bold uppercase tracking-[0.2em] text-secondary">{t("Супольны праект")}</p>
          <h2 className="text-balance text-3xl font-black tracking-tight sm:text-5xl">{t("Добры кантэнт ствараюць людзі")}</h2>
          <p className="mx-auto max-w-2xl text-white/62">{t("КОШ расце з вашых парад. Калі ведаеш аўтара, канал або падкаст па-беларуску — падзяліся спасылкай.")}</p>
          <div>
          <SubmitDialog />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-9 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>
            <strong className="text-lg text-white">{t("КОШ")}<span className="text-primary">.</span>
            </strong>{' '}{t("· Беларускі кантэнт у адным кошы")}</p>
          <p>{t("Зроблена для тых, хто шукае сваё.")}</p>
        </div>
      </footer>
    </main>
  );
}
