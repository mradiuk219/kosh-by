'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Camera, Check, ChevronRight, Clapperboard, Menu, Mic2, Play, Search, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

type Media = { title: string; creator: string; platform: string; category: string; image: string; background: string; url?: string; featured?: boolean };

const media: Media[] = [
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

const filters = ['Усё', 'YouTube'];

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'YouTube') return <Clapperboard className="size-3.5" />;
  if (platform === 'Instagram') return <Camera className="size-3.5" />;
  if (platform === 'Падкаст') return <Mic2 className="size-3.5" />;
  return <Play className="size-3.5" />;
}

function MediaCard({ item }: { item: Media }) {
  const card = (
    <article className="group relative aspect-[4/5] w-[72vw] max-w-[285px] shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-card transition hover:-translate-y-1 hover:border-white/20">
      <img src={item.background} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/72 to-[#08090b]/98" />
      <div className="absolute inset-x-0 top-0 flex justify-center px-5 pt-7">
        <img src={item.image} alt={`Лагатып канала ${item.title}`} className="size-32 rounded-full border-4 border-white/12 bg-white object-cover shadow-2xl shadow-black/45 transition duration-500 group-hover:scale-105" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <Badge className="mb-3 border-[#ff4e45] bg-[#ff0000] font-bold text-white shadow-lg shadow-red-950/35" variant="outline"><PlatformIcon platform={item.platform} /> {item.platform}</Badge>
        <p className="mb-1 text-xs font-semibold text-secondary">{item.category}</p>
        <h3 className="text-lg font-bold leading-tight text-white">{item.title}</h3>
        <p className="mt-1 line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-white/62">{item.creator}</p>
      </div>
    </article>
  );

  return item.url ? <a href={item.url} target="_blank" rel="noreferrer" aria-label={`Адкрыць канал ${item.title} на YouTube`}>{card}</a> : card;
}

function SubmitDialog() {
  const [sent, setSent] = useState(false);
  return (
    <Dialog onOpenChange={(open) => !open && setSent(false)}>
      <DialogTrigger render={<Button className="rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90" />}>Прапанаваць</DialogTrigger>
      <DialogContent className="border-white/10 bg-[#15171b] p-6 sm:max-w-md">
        {sent ? (
          <div className="py-8 text-center"><span className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-secondary/15 text-secondary"><Check className="size-7" /></span><DialogTitle className="text-xl font-bold">Дзякуй за знаходку!</DialogTitle><DialogDescription className="mt-3">Прапанова захавана для праверкі рэдакцыяй КОШа.</DialogDescription></div>
        ) : (
          <><DialogHeader><DialogTitle className="text-xl font-bold">Дадаць у КОШ</DialogTitle><DialogDescription>Дашлі спасылку на добры беларускамоўны канал, ролік або падкаст.</DialogDescription></DialogHeader>
          <form className="mt-2 space-y-4" onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
            <label className="block text-sm font-medium">Спасылка<Input type="url" required placeholder="https://…" className="mt-2 h-11 border-white/10 bg-white/5" /></label>
            <label className="block text-sm font-medium">Чаму варта дадаць?<Input required placeholder="Коратка пра кантэнт" className="mt-2 h-11 border-white/10 bg-white/5" /></label>
            <Button type="submit" className="h-11 w-full rounded-full font-bold"><Send className="size-4" /> Адправіць прапанову</Button>
          </form></>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Усё');
  const results = useMemo(() => media.filter((item) => {
    const matchesFilter = filter === 'Усё' || item.platform === filter;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || `${item.title} ${item.creator} ${item.category}`.toLowerCase().includes(needle);
    return matchesFilter && matchesQuery;
  }), [filter, query]);

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

      <section className="relative isolate min-h-[690px] pt-18">
        <img className="absolute inset-0 -z-20 h-full w-full object-cover object-center" src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=88" alt="Ранішняе святло над краявідам" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#111821_3%,rgba(17,24,33,.82)_36%,rgba(17,24,33,.18)_72%,rgba(17,24,33,.56)_100%),linear-gradient(0deg,#151b24_0%,transparent_58%)]" />
        <div className="mx-auto flex min-h-[620px] max-w-[1500px] items-end px-5 pb-20 lg:px-10"><div className="max-w-2xl">
          <h1 className="text-balance text-5xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-7xl">Беларускае —<br />бліжэй, чым здаецца</h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">Відэа, падкасты, аўтары і гісторыі па-беларуску — сабраныя ў адным месцы, каб цікавае не гублялася ў стужцы.</p>
          <div className="mt-8"><Button size="lg" className="h-11 rounded-full bg-primary px-7 font-bold" onClick={() => document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' })}>Адкрыць каталог <ArrowRight className="size-4" /></Button></div>
        </div></div>
      </section>

      <section id="catalog" className="mx-auto max-w-[1500px] px-5 pb-12 pt-6 lg:px-10">
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">Знайдзі сваё</p><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Каталог КОШа</h2></div><div className="relative block sm:hidden"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Шукаць кантэнт" className="h-11 border-white/10 bg-white/6 pl-9" /></div></div>
        <div className="mb-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">{filters.map((name) => <Button key={name} onClick={() => setFilter(name)} variant={filter === name ? 'secondary' : 'outline'} className={`h-9 shrink-0 rounded-full px-4 ${filter !== name ? 'border-white/10 bg-white/4 text-white/65' : ''}`}>{name}</Button>)}</div>
        {results.length ? <div className="flex gap-4 overflow-x-auto pb-5 [scrollbar-width:none]">{results.map((item) => <MediaCard key={item.title} item={item} />)}</div> : <div className="rounded-3xl border border-dashed border-white/12 bg-white/3 px-6 py-14 text-center"><Search className="mx-auto mb-4 size-7 text-white/30" /><h3 className="font-bold">Нічога не знайшлося</h3><p className="mt-2 text-sm text-white/50">Паспрабуй іншыя словы або абяры «Усё».</p><Button variant="link" className="mt-2 text-secondary" onClick={() => { setQuery(''); setFilter('Усё'); }}>Скінуць пошук</Button></div>}
      </section>

      <section id="new" className="mx-auto max-w-[1500px] px-5 py-12 lg:px-10"><div className="mb-6 flex items-end justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Свежае ў кошы</p><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Новыя знаходкі</h2></div><button className="hidden items-center gap-1 text-sm font-semibold text-white/55 sm:flex">Глядзець усе <ChevronRight className="size-4" /></button></div><div className="flex gap-4 overflow-x-auto pb-5 [scrollbar-width:none]">{media.slice(4).map((item) => <MediaCard key={item.title} item={item} />)}</div></section>

      <section id="about" className="mx-5 my-14 overflow-hidden rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_15%_30%,rgba(70,131,214,.22),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(233,101,42,.2),transparent_35%),#14161a] lg:mx-10"><div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 text-center sm:px-12"><p className="mx-auto text-xs font-bold uppercase tracking-[0.2em] text-secondary">Супольны праект</p><h2 className="text-balance text-3xl font-black tracking-tight sm:text-5xl">Добры кантэнт ствараюць людзі</h2><p className="mx-auto max-w-2xl text-white/62">КОШ расце з вашых парад. Калі ведаеш аўтара, канал або падкаст па-беларуску — падзяліся спасылкай.</p><div><SubmitDialog /></div></div></section>

      <footer className="border-t border-white/8"><div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-9 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between lg:px-10"><p><strong className="text-lg text-white">КОШ<span className="text-primary">.</span></strong> · Беларускі кантэнт у адным кошы</p><p>Зроблена для тых, хто шукае сваё.</p></div></footer>
    </main>
  );
}
