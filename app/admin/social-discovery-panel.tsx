'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { socialPlatforms, type SocialCandidate } from '@/lib/social-discovery-core';

type Run = { started_at: string; status: string; found_count: number; error: string | null };

function CandidateCard({ candidate, onReview }: { candidate: SocialCandidate; onReview: () => Promise<void> }) {
  const [confirmed, setConfirmed] = useState(false);
  const [title, setTitle] = useState(candidate.title);
  const [description, setDescription] = useState(candidate.description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function review(status: 'approved' | 'rejected') {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/social-discovery', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: candidate.id, status, languageConfirmed: confirmed, title, description }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Не ўдалося апрацаваць кандыдата');
      await onReview();
    } catch (e) { setError(e instanceof Error ? e.message : 'Памылка злучэння'); }
    finally { setBusy(false); }
  }
  return <article className="space-y-4 rounded-2xl border border-white/10 bg-black/15 p-5">
    <div className="flex flex-wrap items-center gap-3"><span className="text-sm font-bold text-secondary">{candidate.platform}</span><a href={candidate.url} target="_blank" rel="noreferrer" className="break-all text-sm text-white underline">{candidate.url}</a><span className="text-sm text-white/50">{candidate.status === 'pending' ? 'Мова не пацверджаная' : candidate.status === 'approved' ? 'Прынята' : 'Адхілена'}</span></div>
    <a href={candidate.source_url} target="_blank" rel="noreferrer" className="block text-sm text-secondary underline">Крыніца: {candidate.source_label}</a>
    <p className="text-sm leading-relaxed text-white/60">{candidate.language_evidence}</p>
    {candidate.status === 'pending' ? <>
      <label className="block space-y-2 text-sm">Назва акаўнта<Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} disabled={busy} /></label>
      <label className="block space-y-2 text-sm">Апісанне для каталога<Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} disabled={busy} /></label>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed"><Checkbox checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} disabled={busy} />{candidate.platform === 'Spotify' ? 'Я праверыў(-ла) выканаўцу і пацвярджаю наяўнасць беларускамоўных твораў.' : 'Я адкрыў(-ла) акаўнт і праверыў(-ла), што аўтар вядзе яго па-беларуску і публікуе беларускамоўны кантэнт.'}</label>
      <div className="flex flex-wrap gap-3"><Button disabled={busy || !confirmed || !title.trim()} onClick={() => void review('approved')} className="rounded-full bg-emerald-600 text-white">Прыняць у каталог</Button><Button disabled={busy} onClick={() => void review('rejected')} variant="outline" className="rounded-full">Адхіліць</Button></div>
    </> : <h3 className="font-bold">{candidate.title}</h3>}
    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
  </article>;
}

export default function SocialDiscoveryPanel() {
  const [candidates, setCandidates] = useState<SocialCandidate[]>([]);
  const [lastRun, setLastRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('Усе');
  const [archived, setArchived] = useState(false);
  const autoStarted = useRef(false);
  const load = useCallback(async () => {
    const response = await fetch('/api/social-discovery', { cache: 'no-store' });
    if (!response.ok) throw new Error('Не ўдалося загрузіць кандыдатаў. Абнавіце старонку.');
    const data = await response.json() as { candidates: SocialCandidate[]; lastRun: Run | null };
    setCandidates(data.candidates); setLastRun(data.lastRun); setLoading(false);
  }, []);
  const run = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/social-discovery', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'run' }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Пошук недаступны');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Памылка злучэння'); }
    finally { setBusy(false); }
  }, [load]);
  useEffect(() => { void load().catch((e) => { setError(e.message); setLoading(false); }); }, [load]);
  useEffect(() => {
    if (!loading && !error && !autoStarted.current && lastRun?.started_at.slice(0, 10) !== new Date().toISOString().slice(0, 10)) {
      autoStarted.current = true; void run();
    }
  }, [loading, error, lastRun, run]);
  const visible = candidates.filter((c) => (platform === 'Усе' || c.platform === platform) && (archived ? c.status !== 'pending' : c.status === 'pending'));
  return <section className="mb-10 space-y-5 rounded-3xl border border-white/10 bg-white/4 p-5 sm:p-7">
    <h2 className="text-2xl font-black">Instagram, Twitch, TikTok і Spotify</h2>
    <p className="max-w-3xl text-sm leading-relaxed text-white/60">Бясплатны пошук па спасылках з YouTube і MusicBrainz. Гэта не поўны пошук унутры платформаў. Для Spotify шукаем толькі выканаўцаў. Кожная знаходка патрабуе вашай праверкі; аўтаматычнай публікацыі няма.</p>
    <p className="text-sm text-white/50">Пошук запускаецца пры першым адкрыцці адмінкі за дзень. Кнопка правярае наступную порцыю крыніц.</p>
    <Button disabled={busy || loading} onClick={() => void run()} className="rounded-full">{busy ? 'Шукаем кандыдатаў…' : 'Праверыць наступныя крыніцы'}</Button>
    {lastRun && <p className="text-sm text-white/50">{new Date(lastRun.started_at).toLocaleString('be-BY')} · {lastRun.status === 'running' ? 'Пошук яшчэ працуе' : `Новых кандыдатаў: ${lastRun.found_count}`} {lastRun.error && `· ${lastRun.error}`}</p>}
    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
    <div className="flex flex-wrap gap-2">{['Усе', ...socialPlatforms].map((p) => <Button key={p} variant={p === platform ? 'default' : 'outline'} onClick={() => setPlatform(p)} className="rounded-full">{p} · {candidates.filter((c) => (p === 'Усе' || c.platform === p) && c.status === 'pending').length}</Button>)}<Button variant="outline" onClick={() => setArchived(!archived)} className="rounded-full">{archived ? 'Паказаць чаргу' : 'Паказаць архіў'}</Button></div>
    {loading ? <p>Загрузка…</p> : !visible.length ? <p className="py-5 text-sm text-white/50">{archived ? 'Архіў пусты.' : 'Новых кандыдатаў у гэтым раздзеле пакуль няма.'}</p> : visible.map((c) => <CandidateCard key={c.id} candidate={c} onReview={load} />)}
  </section>;
}
