'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock3, ExternalLink, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Submission } from '@/lib/submissions';

const statusLabels = { pending: 'Чакае праверкі', approved: 'Прынята', rejected: 'Адхілена' };
type QueueFilter = 'pending' | 'archived' | 'all';
type Candidate = { id: string; url: string; title: string; description: string; category: string; avatar_url: string | null; subscriber_count: number | null; language_score: number; language_evidence: string; source_query: string; status: 'pending' | 'approved' | 'rejected'; discovered_at: string; reviewed_at: string | null };
type DiscoveryRun = { status: 'running' | 'complete' | 'failed'; found_count: number; error: string | null; started_at: string; finished_at: string | null };

export default function AdminPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [filter, setFilter] = useState<QueueFilter>('pending');
  const [actionError, setActionError] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [lastRun, setLastRun] = useState<DiscoveryRun | null>(null);
  const [configured, setConfigured] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  const load = useCallback(async () => {
    const [response, discoveryResponse] = await Promise.all([fetch('/api/submissions', { cache: 'no-store' }), fetch('/api/youtube-discovery', { cache: 'no-store' })]);
    if (response.status === 403) { setForbidden(true); setLoading(false); return; }
    const data = await response.json() as { submissions?: Submission[] };
    setItems(data.submissions ?? []);
    if (discoveryResponse.ok) { const discovery = await discoveryResponse.json() as { candidates?: Candidate[]; lastRun?: DiscoveryRun | null; configured?: boolean }; setCandidates(discovery.candidates ?? []); setLastRun(discovery.lastRun ?? null); setConfigured(Boolean(discovery.configured)); }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (id: string, status: Submission['status']) => {
    setActionError('');
    const response = await fetch('/api/submissions', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) });
    if (response.ok) setItems((current) => current.map((item) => item.id === id ? { ...item, status, reviewed_at: status === 'pending' ? null : new Date().toISOString() } : item));
    else setActionError(((await response.json().catch(() => null)) as { error?: string } | null)?.error ?? 'Не ўдалося абнавіць заяўку');
  };

  const runDiscovery = async () => {
    setDiscovering(true); setActionError('');
    const response = await fetch('/api/youtube-discovery', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'run' }) });
    const data = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) setActionError(data?.error ?? 'Не ўдалося запусціць пошук');
    await load(); setDiscovering(false);
  };

  const reviewCandidate = async (id: string, status: 'approved' | 'rejected') => {
    setActionError('');
    const response = await fetch('/api/youtube-discovery', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) });
    if (response.ok) { setCandidates((current) => current.map((item) => item.id === id ? { ...item, status, reviewed_at: new Date().toISOString() } : item)); if (status === 'approved') await load(); }
    else setActionError(((await response.json().catch(() => null)) as { error?: string } | null)?.error ?? 'Не ўдалося апрацаваць кандыдата');
  };

  const visibleItems = items.filter((item) => filter === 'all' || (filter === 'pending' ? item.status === 'pending' : item.status !== 'pending'));
  const pendingCount = items.filter((item) => item.status === 'pending').length;
  const archivedCount = items.length - pendingCount;

  return (
    <main className="site-shell min-h-screen text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#111821]/92 backdrop-blur-xl"><div className="mx-auto flex h-18 max-w-6xl items-center gap-4 px-5"><a href="/" className="text-2xl font-black tracking-[-0.06em] text-white">КОШ<span className="text-primary">.</span></a><span className="text-sm text-white/35">/ Адміністратар</span><Button render={<a href="/" />} variant="ghost" className="ml-auto rounded-full text-white/65"><ArrowLeft className="size-4" /> На галоўную</Button></div></header>
      <div className="mx-auto max-w-6xl px-5 py-10">
        {!forbidden && <section className="mb-10 rounded-3xl border border-white/10 bg-white/4 p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-secondary"><Search className="size-4" /> Аўтапошук YouTube</div><h1 className="mt-2 text-2xl font-black text-white">Знойдзеныя аўтаматычна</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">Сайт шукае беларускамоўныя каналы, правярае мову і дублікаты. У каталог трапляюць толькі каналы, якія вы прымеце.</p>{lastRun && <p className="mt-3 text-xs text-white/35">Апошні запуск: {new Date(lastRun.started_at).toLocaleString('be-BY')} · {lastRun.status === 'complete' ? `знойдзена ${lastRun.found_count}` : lastRun.status === 'failed' ? `памылка: ${lastRun.error}` : 'ідзе пошук'}</p>}</div><Button disabled={!configured || discovering} onClick={runDiscovery} className="shrink-0 rounded-full bg-secondary text-white hover:bg-secondary/90"><RefreshCw className={`size-4 ${discovering ? 'animate-spin' : ''}`} /> {discovering ? 'Шукаем…' : 'Запусціць пошук'}</Button></div>{!configured && <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/5 px-4 py-3 text-sm text-amber-100">Для запуску трэба адзін раз падключыць сакрэтны ключ YouTube Data API.</div>}<div className="mt-6 space-y-3">{candidates.filter((item) => item.status === 'pending').length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 py-9 text-center text-sm text-white/35">Новых кандыдатаў пакуль няма</div> : candidates.filter((item) => item.status === 'pending').map((item) => <article key={item.id} className="rounded-2xl bg-black/15 p-4"><div className="flex flex-col gap-4 sm:flex-row"><div className="flex min-w-0 flex-1 gap-4">{item.avatar_url ? <img src={item.avatar_url} alt="" className="size-14 shrink-0 rounded-full object-cover" /> : <div className="size-14 shrink-0 rounded-full bg-white/8" />}<div className="min-w-0"><a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-bold text-white hover:text-secondary">{item.title}<ExternalLink className="size-3.5" /></a><p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/50">{item.description || 'Апісанне адсутнічае'}</p><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-secondary/12 px-2.5 py-1 text-secondary">Беларуская: {Math.round(item.language_score * 100)}%</span><span className="rounded-full bg-white/6 px-2.5 py-1 text-white/45">{item.category}</span>{item.subscriber_count !== null && <span className="rounded-full bg-white/6 px-2.5 py-1 text-white/45">{item.subscriber_count.toLocaleString('be-BY')} падпісантаў</span>}</div></div></div><div className="flex shrink-0 gap-2"><Button onClick={() => reviewCandidate(item.id, 'approved')} className="rounded-full bg-emerald-600 text-white hover:bg-emerald-500"><Check className="size-4" /> Прыняць</Button><Button onClick={() => reviewCandidate(item.id, 'rejected')} variant="outline" className="rounded-full border-red-300/20 text-red-200 hover:bg-red-300/10"><X className="size-4" /> Адхіліць</Button></div></div></article>)}</div></section>}
        <div className="mb-6 flex flex-wrap gap-2">{([
          ['pending', `Чакаюць прыняцця · ${pendingCount}`],
          ['archived', `Архіваваныя · ${archivedCount}`],
          ['all', `Усе · ${items.length}`],
        ] as [QueueFilter, string][]).map(([value, label]) => <Button key={value} onClick={() => setFilter(value)} variant="outline" className={`rounded-full ${filter === value ? 'border-primary bg-primary font-bold text-white hover:bg-primary/90' : 'border-white/10 bg-white/4 text-white/60 hover:bg-white/8'}`}>{label}</Button>)}</div>
        {actionError && <p role="alert" className="mb-5 rounded-xl border border-red-300/15 bg-red-300/5 px-4 py-3 text-sm text-red-200">{actionError}</p>}
        {loading ? <p className="text-white/45">Загружаем заяўкі…</p> : forbidden ? <div className="rounded-3xl border border-red-300/15 bg-red-300/5 p-8"><h2 className="font-bold text-red-200">Няма доступу</h2><p className="mt-2 text-sm text-white/50">Гэты раздзел даступны толькі ўладальніку КОШа.</p></div> : !visibleItems.length ? <div className="rounded-3xl border border-dashed border-white/12 py-20 text-center"><Clock3 className="mx-auto mb-4 size-8 text-white/25" /><h2 className="font-bold">У гэтым раздзеле заявак няма</h2></div> : <div className="space-y-4">{visibleItems.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/4 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><span className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${item.status === 'pending' ? 'bg-amber-300/15 text-amber-200' : item.status === 'approved' ? 'bg-emerald-300/15 text-emerald-200' : 'bg-red-300/15 text-red-200'}`}>{statusLabels[item.status]}</span><a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 break-all font-bold text-white hover:text-secondary">{item.url}<ExternalLink className="size-4 shrink-0" /></a><p className="mt-3 text-sm leading-relaxed text-white/60">{item.reason}</p><p className="mt-3 text-xs text-white/30">{new Date(item.created_at).toLocaleString('be-BY')}{item.submitter_email ? ` · ${item.submitter_email}` : ''}</p></div>{item.status === 'pending' && <div className="flex shrink-0 gap-2"><Button onClick={() => updateStatus(item.id, 'approved')} className="rounded-full bg-emerald-600 text-white hover:bg-emerald-500"><Check className="size-4" /> Прыняць</Button><Button onClick={() => updateStatus(item.id, 'rejected')} variant="outline" className="rounded-full border-red-300/20 text-red-200 hover:bg-red-300/10"><X className="size-4" /> Адхіліць</Button></div>}</div></article>)}</div>}
      </div>
    </main>
  );
}
