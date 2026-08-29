'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock3, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Submission } from '@/lib/submissions';

const statusLabels = { pending: 'Чакае праверкі', approved: 'Прынята', rejected: 'Адхілена' };
type QueueFilter = 'pending' | 'archived' | 'all';

export default function AdminPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [filter, setFilter] = useState<QueueFilter>('pending');

  const load = useCallback(async () => {
    const response = await fetch('/api/submissions', { cache: 'no-store' });
    if (response.status === 403) { setForbidden(true); setLoading(false); return; }
    const data = await response.json();
    setItems(data.submissions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (id: string, status: Submission['status']) => {
    const response = await fetch('/api/submissions', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) });
    if (response.ok) setItems((current) => current.map((item) => item.id === id ? { ...item, status, reviewed_at: status === 'pending' ? null : new Date().toISOString() } : item));
  };

  const visibleItems = items.filter((item) => filter === 'all' || (filter === 'pending' ? item.status === 'pending' : item.status !== 'pending'));
  const pendingCount = items.filter((item) => item.status === 'pending').length;
  const archivedCount = items.length - pendingCount;

  return (
    <main className="site-shell min-h-screen text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#111821]/92 backdrop-blur-xl"><div className="mx-auto flex h-18 max-w-6xl items-center gap-4 px-5"><a href="/" className="text-2xl font-black tracking-[-0.06em] text-white">КОШ<span className="text-primary">.</span></a><span className="text-sm text-white/35">/ Адміністратар</span><Button render={<a href="/" />} variant="ghost" className="ml-auto rounded-full text-white/65"><ArrowLeft className="size-4" /> На галоўную</Button></div></header>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-6 flex flex-wrap gap-2">{([
          ['pending', `Чакаюць прыняцця · ${pendingCount}`],
          ['archived', `Архіваваныя · ${archivedCount}`],
          ['all', `Усе · ${items.length}`],
        ] as [QueueFilter, string][]).map(([value, label]) => <Button key={value} onClick={() => setFilter(value)} variant="outline" className={`rounded-full ${filter === value ? 'border-primary bg-primary font-bold text-white hover:bg-primary/90' : 'border-white/10 bg-white/4 text-white/60 hover:bg-white/8'}`}>{label}</Button>)}</div>
        {loading ? <p className="text-white/45">Загружаем заяўкі…</p> : forbidden ? <div className="rounded-3xl border border-red-300/15 bg-red-300/5 p-8"><h2 className="font-bold text-red-200">Няма доступу</h2><p className="mt-2 text-sm text-white/50">Гэты раздзел даступны толькі ўладальніку КОШа.</p></div> : !visibleItems.length ? <div className="rounded-3xl border border-dashed border-white/12 py-20 text-center"><Clock3 className="mx-auto mb-4 size-8 text-white/25" /><h2 className="font-bold">У гэтым раздзеле заявак няма</h2></div> : <div className="space-y-4">{visibleItems.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/4 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><span className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${item.status === 'pending' ? 'bg-amber-300/15 text-amber-200' : item.status === 'approved' ? 'bg-emerald-300/15 text-emerald-200' : 'bg-red-300/15 text-red-200'}`}>{statusLabels[item.status]}</span><a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 break-all font-bold text-white hover:text-secondary">{item.url}<ExternalLink className="size-4 shrink-0" /></a><p className="mt-3 text-sm leading-relaxed text-white/60">{item.reason}</p><p className="mt-3 text-xs text-white/30">{new Date(item.created_at).toLocaleString('be-BY')}{item.submitter_email ? ` · ${item.submitter_email}` : ''}</p></div>{item.status === 'pending' && <div className="flex shrink-0 gap-2"><Button onClick={() => updateStatus(item.id, 'approved')} className="rounded-full bg-emerald-600 text-white hover:bg-emerald-500"><Check className="size-4" /> Прыняць</Button><Button onClick={() => updateStatus(item.id, 'rejected')} variant="outline" className="rounded-full border-red-300/20 text-red-200 hover:bg-red-300/10"><X className="size-4" /> Адхіліць</Button></div>}</div></article>)}</div>}
      </div>
    </main>
  );
}
