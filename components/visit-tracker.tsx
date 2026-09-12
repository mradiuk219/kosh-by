'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from './language';
export default function VisitTracker() {
 const {t} = useLanguage();
 const [choice,setChoice] = useState<string|null>('loading');
 useEffect(() => { try { setChoice(localStorage.getItem('kosh-analytics')); } catch { setChoice('off'); } }, []);
 useEffect(() => {
  if (choice !== 'on' || navigator.doNotTrack === '1' || (navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl) return;
  const track = () => {
   try {
    let id = localStorage.getItem('kosh-visitor');
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) { id=crypto.randomUUID(); localStorage.setItem('kosh-visitor',id); }
    void fetch('/api/visits', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id}),keepalive:true}).catch(()=>{});
   } catch {}
  };
  track();
  const timer = window.setInterval(()=>{if(document.visibilityState==='visible')track();}, 3600000);
  return () => clearInterval(timer);
 },[choice]);
 const choose = (value:string) => {try {localStorage.setItem('kosh-analytics',value); if(value==='off')localStorage.removeItem('kosh-visitor');}catch{} setChoice(value);};
 if(choice==='loading')return null;
 if(choice!==null)return <button className="fixed bottom-2 left-2 z-40 rounded-lg bg-[#111821] px-2 py-1 text-xs text-white/60" onClick={()=>setChoice(null)}>{t('Налады статыстыкі')}</button>;
 return <aside className="fixed bottom-4 left-4 right-4 z-50 max-w-lg rounded-2xl border border-white/20 bg-[#111821] p-5 text-sm text-white shadow-xl" aria-label={t('Статыстыка наведванняў')}>
  <p>{t('Мы выкарыстоўваем лакальнае сховішча браўзера для статыстыкі наведванняў і паляпшэння сайта. Дазволіць збор статыстыкі?')}</p>
  <div className="mt-3 flex flex-wrap gap-3"><button className="rounded-full bg-secondary px-4 py-2" onClick={()=>choose('on')}>{t('Дазволіць')}</button><button className="rounded-full border border-white/25 px-4 py-2" onClick={()=>choose('off')}>{t('Адмовіцца')}</button></div>
  <details className="mt-3 text-white/65">
   <summary className="w-fit cursor-pointer rounded underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60">{t('Падрабязней')}</summary>
   <div className="mt-3 space-y-2 leading-relaxed">
    <p>{t('Пасля згоды мы захоўваем выпадковы ідэнтыфікатар у лакальным сховішчы гэтага браўзера, а ў базе статыстыкі — гэты ідэнтыфікатар і дні наведванняў за апошнія 30 дзён. Cookie для гэтай статыстыкі не выкарыстоўваюцца.')}</p>
    <p>{t('Для гэтай статыстыкі мы не захоўваем імя, email, IP-адрас або гісторыю прагледжаных старонак. Выбар можна змяніць праз «Налады статыстыкі». Пры адмове збор спыняецца, а ідэнтыфікатар выдаляецца з браўзера.')}</p>
   </div>
  </details>
 </aside>;
}
