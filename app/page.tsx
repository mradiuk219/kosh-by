'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Camera, Check, ChevronLeft, ChevronRight, Clapperboard, Menu, Mic2, Play, Radio, Search, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export type Media = { title: string; creator: string; platform: string; category: string; image?: string; logoText?: string; background: string; url?: string; featured?: boolean; addedAt?: string };

const bg = {
  culture: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=78',
  games: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=78',
  talk: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=78',
  travel: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=78',
};

const youtubeMedia: Media[] = [
  { title: 'Будзьма беларусамі!', creator: 'Культура, гісторыя і беларуская ідэнтычнасць', platform: 'YouTube', category: 'Культура', image: '/channel-logos/budzma.png', background: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=78', url: 'https://www.youtube.com/@TheBudzma', featured: true },
  { title: 'Годна', creator: 'Беларуская культура, музыка і гісторыя', platform: 'YouTube', category: 'Культура', image: '/channel-logos/hodna.png', background: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=78', url: 'https://www.youtube.com/@hodnaby', featured: true },
  { title: 'Тутэйшы Шляхціч', creator: 'Беларуская гісторыя, мова і культура', platform: 'YouTube', category: 'Гісторыя', image: '/channel-logos/tutejszy.png', background: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=900&q=78', url: 'https://www.youtube.com/@TutejszySzlachcicz', featured: true },
  { title: 'ХАДАНОВІЧ', creator: 'Літаратура, паэзія і культурныя размовы', platform: 'YouTube', category: 'Кнігі', image: '/channel-logos/chadanovic.png', background: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=78', url: 'https://www.youtube.com/@chadanovic', featured: true },
  { title: 'PALATNO Media', creator: 'Гісторыі беларускіх гарадоў і супольнасцяў', platform: 'YouTube', category: 'Грамадства', image: '/channel-logos/palatno.png', background: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=78', url: 'https://www.youtube.com/@palatno' },
  { title: 'Рудзі', creator: 'Гульні і гульнявая індустрыя па-беларуску', platform: 'YouTube', category: 'Гульні', image: '/channel-logos/rudzi.png', background: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=78', url: 'https://www.youtube.com/@Rudzi' },
  { title: 'Vozhyk', creator: 'Беларускамоўныя агучкі, гумар і пераклады', platform: 'YouTube', category: 'Гумар', image: '/channel-logos/vozhyk.png', background: 'https://images.unsplash.com/photo-1586899028174-e7098604235b?auto=format&fit=crop&w=900&q=78', url: 'https://www.youtube.com/@vozh_voice' },
  { title: 'Konan Ŭ', creator: 'Казкі, мова і развагі пра беларускасць', platform: 'YouTube', category: 'Культура', image: '/channel-logos/konan.png', background: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=78', url: 'https://www.youtube.com/@Konan_V' },
  { title: 'Віталь Чырвінскі', creator: 'Размовы пра ваенную гісторыю Беларусі', platform: 'YouTube', category: 'Гісторыя', image: '/channel-logos/chyrvinski.png', background: 'https://images.unsplash.com/photo-1564982759782-3a931653a86c?auto=format&fit=crop&w=900&q=78', url: 'https://www.youtube.com/@vital_chyrvinski' },
  { title: 'Белсат History', creator: 'Дакументальныя фільмы і гісторыя Беларусі', platform: 'YouTube', category: 'Гісторыя', image: '/channel-logos/belsat-history.png', background: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=78', url: 'https://www.youtube.com/@belsat_history' },
  { title: 'Гісторыя на Свабодзе', creator: 'Размовы пра мінулае Беларусі і рэгіёна', platform: 'YouTube', category: 'Гісторыя', image: '/channel-logos/svaboda-history.png', background: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=78', url: 'https://www.youtube.com/@svaboda-historyja' },
  { title: 'Слухай сюды', creator: 'Эпізоды беларускай гісторыі і культуры', platform: 'YouTube', category: 'Гісторыя', image: '/channel-logos/sluhaj.png', background: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=78', url: 'https://www.youtube.com/@user-Sluhaj' },
];

const socialMedia: Media[] = [
  { title: 'Animatarka', creator: 'Анімацыя і беларуская творчасць', platform: 'Instagram', category: 'Творчасць', logoText: 'A', background: bg.culture, url: 'https://www.instagram.com/animatarka/' },
  { title: 'Брудны Вожык', creator: 'Агучкі, пераклады і гумар па-беларуску', platform: 'Instagram', category: 'Гумар', logoText: 'В', background: bg.culture, url: 'https://www.instagram.com/brudny_vozhyk/' },
  { title: 'Heta Top', creator: 'Беларускія знаходкі, культура і людзі', platform: 'Instagram', category: 'Культура', logoText: 'HT', background: bg.travel, url: 'https://www.instagram.com/heta.top/' },
  { title: 'Белсат', creator: 'Беларускія навіны, гісторыі і рэпартажы', platform: 'Instagram', category: 'Медыя', logoText: 'Б', background: bg.talk, url: 'https://www.instagram.com/belsat/' },
  { title: 'Загляне сонца', creator: 'Беларуская гісторыя і шлях да сваёй мовы', platform: 'Instagram', category: 'Гісторыя', logoText: 'ЗС', background: bg.culture, url: 'https://www.instagram.com/zahlianie_sonca/' },
  { title: 'Nochy', creator: 'Музычны гурт і песні па-беларуску', platform: 'Instagram', category: 'Музыка', logoText: 'N', background: bg.talk, url: 'https://www.instagram.com/nochy_musicband/' },
  { title: 'Мой родны гук', creator: 'Беларуская музыка і сучаснае гучанне', platform: 'Instagram', category: 'Музыка', logoText: 'МГ', background: bg.talk, url: 'https://www.instagram.com/mojrodnyhuk/' },
  { title: 'Палеская эмігрантка', creator: 'Палессе, мова і асабістыя гісторыі', platform: 'Instagram', category: 'Блог', logoText: 'ПЭ', background: bg.travel, url: 'https://www.instagram.com/paleskaja.emigrantka/' },
  { title: 'Ілля Сіўцоў', creator: 'Беларускамоўны аўтарскі блог', platform: 'Instagram', category: 'Блог', logoText: 'ІС', background: bg.travel, url: 'https://www.instagram.com/illasiucou/' },
  { title: 'Пра мову', creator: 'Беларуская мова проста і штодзённа', platform: 'Instagram', category: 'Мова', logoText: 'ПМ', background: bg.culture, url: 'https://www.instagram.com/pramovu/' },
  { title: 'Кася Мастак', creator: 'Мастацтва і творчасць па-беларуску', platform: 'Instagram', category: 'Мастацтва', logoText: 'КМ', background: bg.culture, url: 'https://www.instagram.com/kasia_mastak/' },
  { title: 'Годна', creator: 'Беларуская культура, музыка і гісторыя', platform: 'Instagram', category: 'Культура', logoText: 'Г', background: bg.culture, url: 'https://www.instagram.com/hodna.by/' },

  { title: 'Itbeard', creator: 'ІТ і тэхналогіі па-беларуску', platform: 'TikTok', category: 'Тэхналогіі', image: '/social-logos/tiktok-itbeard.jpg', background: bg.games, url: 'https://www.tiktok.com/@itbeard' },
  { title: 'Ikbytech', creator: 'Праграмаванне і тэхналогіі па-беларуску', platform: 'TikTok', category: 'Тэхналогіі', logoText: 'IK', background: bg.games, url: 'https://www.tiktok.com/@ikbytech' },
  { title: 'Першы Гікаўскі', creator: 'Гульні, медыя, серыялы і тэхналогіі', platform: 'TikTok', category: 'Гульні', logoText: 'ПГ', background: bg.games, url: 'https://www.tiktok.com/@piersyhikauski' },
  { title: 'Праз космас', creator: 'Кароткія навіны і факты пра космас', platform: 'TikTok', category: 'Навука', logoText: 'ПК', background: bg.games, url: 'https://www.tiktok.com/@praz_kosmas' },
  { title: 'Rudzi Game', creator: 'Агляды гульняў па-беларуску', platform: 'TikTok', category: 'Гульні', logoText: 'R', background: bg.games, url: 'https://www.tiktok.com/@rudzi_game' },
  { title: 'Ms Bahiema', creator: 'Стрымы і гульнявы кантэнт па-беларуску', platform: 'TikTok', category: 'Гульні', logoText: 'MB', background: bg.games, url: 'https://www.tiktok.com/@ms.bahiema' },
  { title: 'NadzeyaGames', creator: 'Агляды і гісторыі пра відэагульні', platform: 'TikTok', category: 'Гульні', logoText: 'NG', background: bg.games, url: 'https://www.tiktok.com/@nadzeyagames' },
  { title: 'Брудны Вожык', creator: 'Беларускамоўныя агучкі і пераклады', platform: 'TikTok', category: 'Агучка', logoText: 'В', background: bg.culture, url: 'https://www.tiktok.com/@brudny_vozhyk' },
  { title: 'Агучка Кавярня', creator: 'Серыялы, мультфільмы і кіно па-беларуску', platform: 'TikTok', category: 'Агучка', logoText: 'АК', background: bg.culture, url: 'https://www.tiktok.com/@kaviarnia' },
  { title: 'Жужаль', creator: 'Пераклады розных відэа на беларускую мову', platform: 'TikTok', category: 'Агучка', logoText: 'Ж', background: bg.culture, url: 'https://www.tiktok.com/@zhuzhal' },
  { title: 'Гаварун', creator: 'Кіно і мультфільмы ў беларускай агучцы', platform: 'TikTok', category: 'Агучка', logoText: 'Г', background: bg.culture, url: 'https://www.tiktok.com/@gavarun.by' },
  { title: 'Bastiesmiles', creator: 'Беларускія міфы, традыцыі і гісторыя', platform: 'TikTok', category: 'Культура', logoText: 'B', background: bg.culture, url: 'https://www.tiktok.com/@bastiesmiles' },

  ...['watafakablr','impani4','dzedmaksim','lepus81','nine_ravens_cemetery','angryralef','ms_bahiema','toddzie','shagrael_by','rudzi_belarus','bel_asch','sla5her_by','mihas_gareza'].map((handle, index) => ({
    title: handle.replaceAll('_', ' '), creator: 'Беларускамоўныя жывыя эфіры, гульні і размовы', platform: 'Twitch', category: 'Стрымы',
    image: index === 0 ? '/social-logos/twitch-watafakablr.jpg' : undefined, logoText: handle.slice(0, 2).toUpperCase(), background: index % 2 ? bg.talk : bg.games, url: `https://www.twitch.tv/${handle}`,
  })),
];

export const media = [...youtubeMedia, ...socialMedia].map((item) => item.platform === 'Instagram' ? { ...item, addedAt: '2026-08-29' } : item);
const filters = ['Усё', 'YouTube', 'Instagram', 'TikTok', 'Twitch'];
const platformCounts = Object.fromEntries(filters.slice(1).map((platform) => [platform, media.filter((item) => item.platform === platform).length]));
const heroStats = [
  { value: media.length, label: 'Колькасьць аўтараў' },
  { value: '442 тыс.', label: 'Найбольш падпісантаў' },
  { value: platformCounts.YouTube, label: 'Аўтараў з YouTube' },
  { value: platformCounts.Twitch, label: 'Аўтараў з Twitch' },
  { value: platformCounts.Instagram, label: 'Аўтараў з Instagram' },
  { value: platformCounts.TikTok, label: 'Аўтараў з TikTok' },
];

function shuffleMedia(items: Media[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
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
    .sort((a, b) => b.item.addedAt!.localeCompare(a.item.addedAt!) || b.index - a.index)
    .map(({ item }) => item);
  if (latestDayItems.length > 4) return latestDayItems;

  return datedItems
    .sort((a, b) => b.item.addedAt!.localeCompare(a.item.addedAt!) || b.index - a.index)
    .slice(0, 4)
    .map(({ item }) => item);
}

const freshMedia = getFreshMedia(media);

type ApprovedSubmission = { id: string; url: string; reason: string; created_at: string; reviewed_at: string | null; title?: string | null; description?: string | null; category?: string | null; platform?: string | null; avatar_url?: string | null };

export function approvedSubmissionToMedia(submission: ApprovedSubmission): Media {
  const parsed = new URL(submission.url);
  const handle = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).at(-1) ?? 'Новы аўтар').replace(/^@/, '').replaceAll('_', ' ');
  const title = submission.title || handle.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  const host = parsed.hostname.toLowerCase();
  const platform = submission.platform || (host.includes('youtube') || host.includes('youtu.be') ? 'YouTube' : host.includes('instagram') ? 'Instagram' : host.includes('tiktok') ? 'TikTok' : host.includes('twitch') ? 'Twitch' : 'Сайт');
  const lowerReason = submission.reason.toLowerCase();
  const category = submission.category || (lowerReason.includes('гуль') || lowerReason.includes('game') ? 'Гульні' : lowerReason.includes('музык') || lowerReason.includes('пес') ? 'Музыка' : 'Супольнасць');
  const backgrounds: Record<string, string> = { YouTube: bg.culture, Instagram: bg.travel, TikTok: bg.games, Twitch: bg.talk, Сайт: bg.culture };

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
  };
}

export async function fetchApprovedMedia() {
  const response = await fetch('/api/submissions?view=approved', { cache: 'no-store' });
  if (!response.ok) return [] as Media[];
  const data = await response.json() as { submissions?: ApprovedSubmission[] };
  return (data.submissions ?? []).map(approvedSubmissionToMedia);
}

function mergeMedia(base: Media[], approved: Media[]) {
  const knownUrls = new Set(base.map((item) => item.url).filter(Boolean));
  return [...base, ...approved.filter((item) => !knownUrls.has(item.url))];
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'YouTube') return <Clapperboard className="size-3.5" />;
  if (platform === 'Instagram') return <Camera className="size-3.5" />;
  if (platform === 'Twitch') return <Radio className="size-3.5" />;
  if (platform === 'Падкаст') return <Mic2 className="size-3.5" />;
  return <Play className="size-3.5" />;
}

export function MediaCard({ item, fluid = false }: { item: Media; fluid?: boolean }) {
  const badgeClass = item.platform === 'YouTube' ? 'border-[#ff4e45] bg-[#ff0000]' : item.platform === 'Instagram' ? 'border-fuchsia-400/70 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-400' : item.platform === 'TikTok' ? 'border-cyan-300/70 bg-black shadow-cyan-500/20' : 'border-violet-300/70 bg-[#9146ff]';
  const logoClass = item.platform === 'Instagram' ? 'bg-gradient-to-br from-violet-600 via-pink-500 to-orange-400' : item.platform === 'TikTok' ? 'bg-black' : item.platform === 'Twitch' ? 'bg-[#9146ff]' : 'bg-white';
  const card = (
    <article className={`group relative aspect-[4/5] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/8 bg-card transition hover:-translate-y-1 hover:border-white/20 ${fluid ? 'w-full max-w-none' : 'w-[72vw] max-w-[285px]'}`}>
      <img src={item.background} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/72 to-[#08090b]/98" />
      <div className="absolute inset-x-0 top-0 flex justify-center px-5 pt-7">
        {item.image ? <img src={item.image} alt={`Лагатып канала ${item.title}`} className="size-32 rounded-full border-4 border-white/12 bg-white object-cover shadow-2xl shadow-black/45 transition duration-500 group-hover:scale-105" /> : <div aria-label={`Лагатып канала ${item.title}`} className={`grid size-32 place-items-center rounded-full border-4 border-white/15 text-3xl font-black text-white shadow-2xl shadow-black/45 transition duration-500 group-hover:scale-105 ${logoClass}`}>{item.logoText}</div>}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <Badge className={`mb-3 font-bold text-white shadow-lg ${badgeClass}`} variant="outline"><PlatformIcon platform={item.platform} /> {item.platform}</Badge>
        <p className="mb-1 text-xs font-semibold text-secondary">{item.category}</p>
        <h3 className="text-lg font-bold leading-tight text-white">{item.title}</h3>
        <p className="mt-1 line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-white/62">{item.creator}</p>
      </div>
    </article>
  );

  return item.url ? <a href={item.url} target="_blank" rel="noreferrer" aria-label={`Адкрыць канал ${item.title} на YouTube`}>{card}</a> : card;
}

function CarouselRow({ items }: { items: Media[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const showControls = items.length > 4;

  const scroll = (direction: -1 | 1) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: direction * Math.max(280, row.clientWidth * 0.82), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div ref={rowRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-5 pr-10 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => <MediaCard key={`${item.platform}-${item.title}`} item={item} />)}
      </div>
      {showControls && <>
        <Button type="button" size="icon" variant="ghost" aria-label="Гартаць налева" onClick={() => scroll(-1)} className="absolute left-2 top-1/2 z-20 hidden size-11 -translate-y-1/2 rounded-full border border-white/15 bg-black/75 text-white shadow-xl backdrop-blur hover:bg-black/95 sm:grid">
          <ChevronLeft className="size-6" />
        </Button>
        <Button type="button" size="icon" variant="ghost" aria-label="Гартаць направа" onClick={() => scroll(1)} className="absolute right-2 top-1/2 z-20 hidden size-11 -translate-y-1/2 rounded-full border border-white/15 bg-black/75 text-white shadow-xl backdrop-blur hover:bg-black/95 sm:grid">
          <ChevronRight className="size-6" />
        </Button>
      </>}
    </div>
  );
}

function SubmitDialog() {
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
        body: JSON.stringify({ url: form.get('url'), reason: form.get('reason') }),
      });
      if (!response.ok) throw new Error('Не ўдалося захаваць прапанову');
      setSent(true);
    } catch {
      setError('Не ўдалося адправіць. Калі ласка, паспрабуй яшчэ раз.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => { if (!open) { setSent(false); setError(''); } }}>
      <DialogTrigger render={<Button className="rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90" />}>Прапанаваць</DialogTrigger>
      <DialogContent className="border-white/10 bg-[#15171b] p-6 sm:max-w-md">
        {sent ? (
          <div className="py-8 text-center"><span className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-secondary/15 text-secondary"><Check className="size-7" /></span><DialogTitle className="text-xl font-bold">Дзякуй за знаходку!</DialogTitle><DialogDescription className="mt-3">Прапанова захавана для праверкі рэдакцыяй КОШа.</DialogDescription></div>
        ) : (
          <><DialogHeader><DialogTitle className="text-xl font-bold">Дадаць у КОШ</DialogTitle><DialogDescription>Дашлі спасылку на добры беларускамоўны канал, ролік або падкаст.</DialogDescription></DialogHeader>
          <form className="mt-2 space-y-4" onSubmit={submitSuggestion}>
            <label className="block text-sm font-medium">Спасылка<Input name="url" type="url" required placeholder="https://…" className="mt-2 h-11 border-white/10 bg-white/5" /></label>
            <label className="block text-sm font-medium">Чаму варта дадаць?<Input name="reason" required maxLength={500} placeholder="Коратка пра кантэнт" className="mt-2 h-11 border-white/10 bg-white/5" /></label>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <Button type="submit" disabled={sending} className="h-11 w-full rounded-full font-bold"><Send className="size-4" /> {sending ? 'Адпраўляем…' : 'Адправіць прапанову'}</Button>
          </form></>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Усё');
  const [catalogMedia, setCatalogMedia] = useState(media);
  const [approvedMedia, setApprovedMedia] = useState<Media[]>([]);

  useEffect(() => {
    let active = true;
    void fetchApprovedMedia().then((approved) => {
      if (!active) return;
      setApprovedMedia(approved);
      setCatalogMedia(shuffleMedia(mergeMedia(media, approved)));
    });
    return () => { active = false; };
  }, []);

  const results = useMemo(() => catalogMedia.filter((item) => {
    const matchesFilter = filter === 'Усё' || item.platform === filter;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || `${item.title} ${item.creator} ${item.category}`.toLowerCase().includes(needle);
    return matchesFilter && matchesQuery;
  }), [catalogMedia, filter, query]);

  return (
    <main className="site-shell min-h-screen overflow-x-hidden text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#111821]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1500px] items-center gap-7 px-5 lg:px-10">
          <Sheet><SheetTrigger render={<Button aria-label="Адкрыць меню" size="icon" variant="ghost" className="md:hidden" />}><Menu /></SheetTrigger><SheetContent side="left" className="border-white/10 bg-[#101115]"><SheetHeader><SheetTitle className="text-2xl font-black">КОШ<span className="text-primary">.</span></SheetTitle><SheetDescription>Беларускі кантэнт у адным кошы</SheetDescription></SheetHeader><nav className="grid gap-1 px-4 text-lg"><a className="rounded-xl bg-white/6 px-4 py-3" href="#">Галоўная</a><a className="rounded-xl px-4 py-3" href="#catalog">Катэгорыі</a><a className="rounded-xl px-4 py-3" href="#new">Новае</a><a className="rounded-xl px-4 py-3" href="#about">Пра КОШ</a></nav></SheetContent></Sheet>
          <a href="#" className="text-2xl font-black tracking-[-0.06em] text-white" aria-label="КОШ — галоўная">КОШ<span className="text-primary">.</span></a>
          <nav className="hidden items-center gap-6 text-sm text-white/62 md:flex" aria-label="Асноўная навігацыя"><a className="font-medium text-white" href="#">Галоўная</a><a className="transition hover:text-white" href="#catalog">Катэгорыі</a><a className="transition hover:text-white" href="#new">Новае</a><a className="transition hover:text-white" href="#about">Пра КОШ</a></nav>
          <div className="ml-auto hidden w-full max-w-xs md:block"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" /><Input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Пошук па КОШы" placeholder="Шукаць кантэнт" className="h-10 border-white/10 bg-white/6 pl-9 text-white placeholder:text-white/35" /></div></div>
          <SubmitDialog />
        </div>
      </header>

      <section className="relative isolate min-h-[690px] pt-24">
        <img className="absolute inset-0 -z-20 h-full w-full object-cover object-center" src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=88" alt="Ранішняе святло над краявідам" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#111821_3%,rgba(17,24,33,.82)_36%,rgba(17,24,33,.18)_72%,rgba(17,24,33,.56)_100%),linear-gradient(0deg,#151b24_0%,transparent_58%)]" />
        <div className="mx-auto flex min-h-[620px] max-w-[1500px] items-end px-5 pb-16 lg:px-10"><div className="max-w-3xl">
          <h1 className="text-balance text-5xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-7xl">Беларускае —<br />бліжэй, чым здаецца</h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">Відэа, падкасты, аўтары і гісторыі па-беларуску — сабраныя ў адным месцы, каб цікавае не гублялася ў стужцы.</p>
          <div className="mt-7 grid max-w-3xl grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div key={stat.label} className="relative flex min-h-40 flex-col items-center justify-center px-2 text-center">
                <img src="/honor-seal-ornament.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 object-contain opacity-30" />
                <strong className="relative z-10 mt-1 block text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,.8)] sm:text-4xl">{stat.value}</strong>
                <span className="relative z-10 mt-1 block max-w-32 text-[13px] font-semibold leading-tight text-white/75 drop-shadow-[0_2px_8px_rgba(0,0,0,.9)]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div></div>
      </section>

      <section id="catalog" className="mx-auto max-w-[1500px] px-5 pb-12 pt-6 lg:px-10">
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">Знайдзі сваё</p><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Каталог КОШа</h2></div><div className="relative block sm:hidden"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Шукаць кантэнт" className="h-11 border-white/10 bg-white/6 pl-9" /></div></div>
        <div className="mb-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">{filters.map((name) => <Button key={name} onClick={() => setFilter(name)} variant={filter === name ? 'secondary' : 'outline'} className={`h-9 shrink-0 rounded-full px-4 ${filter !== name ? 'border-white/10 bg-white/4 text-white/65' : ''}`}>{name}</Button>)}</div>
        {results.length ? <><CarouselRow items={results} /><div className="mt-3 flex justify-center"><Button size="lg" className="h-11 rounded-full bg-primary px-7 font-bold" onClick={() => { window.location.href = '/catalog'; }}>Адкрыць каталог <ArrowRight className="size-4" /></Button></div></> : <div className="rounded-3xl border border-dashed border-white/12 bg-white/3 px-6 py-14 text-center"><Search className="mx-auto mb-4 size-7 text-white/30" /><h3 className="font-bold">Нічога не знайшлося</h3><p className="mt-2 text-sm text-white/50">Паспрабуй іншыя словы або абяры «Усё».</p><Button variant="link" className="mt-2 text-secondary" onClick={() => { setQuery(''); setFilter('Усё'); }}>Скінуць пошук</Button></div>}
      </section>

      <section id="new" className="mx-auto max-w-[1500px] px-5 py-12 lg:px-10"><div className="mb-6 flex items-end justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Свежае ў кошы</p><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Новыя знаходкі</h2></div><button className="hidden items-center gap-1 text-sm font-semibold text-white/55 sm:flex">Глядзець усе <ChevronRight className="size-4" /></button></div><CarouselRow items={approvedMedia.length ? getFreshMedia(mergeMedia(media, approvedMedia)) : freshMedia} /></section>

      <section id="about" className="mx-5 my-14 overflow-hidden rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_15%_30%,rgba(70,131,214,.22),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(233,101,42,.2),transparent_35%),#14161a] lg:mx-10"><div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 text-center sm:px-12"><p className="mx-auto text-xs font-bold uppercase tracking-[0.2em] text-secondary">Супольны праект</p><h2 className="text-balance text-3xl font-black tracking-tight sm:text-5xl">Добры кантэнт ствараюць людзі</h2><p className="mx-auto max-w-2xl text-white/62">КОШ расце з вашых парад. Калі ведаеш аўтара, канал або падкаст па-беларуску — падзяліся спасылкай.</p><div><SubmitDialog /></div></div></section>

      <footer className="border-t border-white/8"><div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-9 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between lg:px-10"><p><strong className="text-lg text-white">КОШ<span className="text-primary">.</span></strong> · Беларускі кантэнт у адным кошы</p><p>Зроблена для тых, хто шукае сваё.</p></div></footer>
    </main>
  );
}
