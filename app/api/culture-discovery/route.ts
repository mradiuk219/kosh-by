import { submissionsDb } from '@/lib/submissions';
import { copyCandidateBanner,runCultureDiscovery,type CultureCandidate } from '@/lib/culture-discovery';
const owner=(r:Request)=>(r.headers.get('cf-access-authenticated-user-email')??r.headers.get('oai-authenticated-user-email'))?.toLowerCase()==='radziuk219@gmail.com';
const reply=(x:unknown,s=200)=>Response.json(x,{status:s,headers:{'Cache-Control':'no-store'}});
export async function GET(r:Request){
 if(!owner(r))return reply({error:'Няма доступу'},403);
 const db=submissionsDb(),c=await db.prepare("SELECT * FROM culture_candidates ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END,discovered_at DESC LIMIT 300").all<CultureCandidate>(),runs=await db.prepare('SELECT * FROM culture_discovery_runs ORDER BY started_at DESC LIMIT 1').all();
 return reply({candidates:c.results??[],lastRun:runs.results?.[0]??null})
}
export async function POST(r:Request){
 if(!owner(r)||r.headers.get('origin')!==new URL(r.url).origin)return reply({error:'Няма доступу'},403);
 const b=await r.json().catch(()=>null) as Record<string,unknown>|null;
 if(b?.action==='run'){try{return reply(await runCultureDiscovery())}catch(e){return reply({error:e instanceof Error?e.message:'Пошук недаступны'},503)}}
 if(typeof b?.id!=='string'||!['approved','rejected'].includes(String(b.status)))return reply({error:'Няправільныя даныя'},400);
 const db=submissionsDb(),rows=await db.prepare('SELECT * FROM culture_candidates WHERE id=?').bind(b.id).all<CultureCandidate>(),row=rows.results?.[0];
 if(!row||row.status!=='pending')return reply({error:'Кандыдат не знойдзены або ўжо разгледжаны'},409);
 const now=new Date().toISOString();
 if(b.status==='rejected'){await db.prepare("UPDATE culture_candidates SET status='rejected',reviewed_at=? WHERE id=? AND status='pending'").bind(now,row.id).run();return reply({id:row.id,status:'rejected'})}
 if(b.confirmed!==true)return reply({error:'Спачатку пацвердзіце, што праверылі даныя і беларускамоўную версію.'},400);
 const title=typeof b.title==='string'?b.title.trim():'',author=typeof b.author==='string'?b.author.trim():'',description=typeof b.description==='string'?b.description.trim():'',year=Number(b.release_year);
 if(!title||!author||!description||!Number.isInteger(year)||year<1000||year>2100)return reply({error:'Праверце назву, год, аўтара і апісанне'},400);
 const duplicates=await db.prepare('SELECT id FROM culture_items WHERE url=?').bind(row.url).all();
 if(duplicates.results?.length)return reply({error:'Гэты запіс ужо ёсць у каталогу'},409);
 const banner=await copyCandidateBanner(row.banner_source_url).catch(()=>null),id=crypto.randomUUID();
 type Stmt=ReturnType<typeof db.prepare>;const batchDb=db as typeof db&{batch:(s:Stmt[])=>Promise<unknown>};
 await batchDb.batch([db.prepare("INSERT INTO culture_items (id,kind,title,release_year,author,description,url,banner_url,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,'published',?,?)").bind(id,row.kind,title,year,author,description.slice(0,1600),row.url,banner??row.banner_source_url,now,now),db.prepare("UPDATE culture_candidates SET status='approved',reviewed_at=? WHERE id=? AND status='pending'").bind(now,row.id)]);
 return reply({id,status:'approved'})
}
