'use client';
import {useEffect,useState} from 'react';
export default function VisitorsPanel() {
 const [counts,setCounts]=useState<{today:number;week:number;month:number}|null>(null);
 const [error,setError]=useState(false);
 const load=()=>{setError(false);void fetch('/admin/api/visitors',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();const data = await r.json() as {counts:{today:number;week:number;month:number}};setCounts(data.counts);}).catch(()=>setError(true));};
 useEffect(load,[]);
 return <section className="mb-8 rounded-3xl border border-white/10 bg-white/4 p-6"><h2 className="text-xl font-bold">Наведвальнікі</h2><p className="mt-2 text-sm text-white/60">Унікальныя браўзеры, якія дазволілі статыстыку. Дзень — паводле часу Беларусі; перыяды ўключаюць сёння.</p>{error?<p role="alert" className="mt-4">Статыстыка часова недаступная. <button className="text-secondary" onClick={load}>Паўтарыць</button></p>:<dl className="mt-5 grid grid-cols-3 gap-4">{(['today','week','month'] as const).map((key,i)=><div key={key}><dt className="text-sm text-white/60">{['Сёння','7 дзён','30 дзён'][i]}</dt><dd className="mt-2 text-3xl font-bold">{counts?counts[key]:'…'}</dd></div>)}</dl>}<p className="mt-4 text-xs text-white/45">Падлік пачынаецца пасля ўключэння функцыі. Адзін наведвальнік з розных браўзераў можа ўлічвацца некалькі разоў.</p></section>;
}
