import {SITE_ORIGIN} from '@/lib/site-config';
import {publicCatalog} from '@/lib/public-catalog';
import {authorPath} from '@/lib/author-identity';
import {locales,localizedPath} from '@/lib/locale';
import {topicSlugs,type Topic} from '@/lib/discovery-copy';
import type {Media} from '@/lib/media-data';

export const dynamic='force-dynamic';
const PAGE_SIZE=24;
type Entry={path:string;changeFrequency:'daily'|'weekly';priority:number;lastModified?:Date};

function dateOf(value?:string){
 if(!value)return undefined;
 const time=Date.parse(value);
 return Number.isNaN(time)?undefined:new Date(time);
}

function newest(items:Media[]){
 const dates=items.map(item=>dateOf(item.addedAt)?.getTime()).filter((value):value is number=>value!==undefined);
 return dates.length?new Date(Math.max(...dates)):undefined;
}

function topicItems(items:Media[],topic:Topic){
 return items.filter(item=>topic==='bloggers'?item.contentKind==='channel':item.contentKind===(topic==='movies'?'movie':'book'));
}

function escapeXml(value:string){
 return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
}

function urlXml(entry:Entry,locale:typeof locales[number]){
 const url=SITE_ORIGIN+localizedPath(locale,entry.path);
 const alternates=[...locales.map(language=>[language,SITE_ORIGIN+localizedPath(language,entry.path)] as const),['x-default',SITE_ORIGIN+entry.path] as const];
 return `<url><loc>${escapeXml(url)}</loc>${alternates.map(([language,href])=>`<xhtml:link rel="alternate" hreflang="${language}" href="${escapeXml(href)}"/>`).join('')}${entry.lastModified?`<lastmod>${entry.lastModified.toISOString()}</lastmod>`:''}<changefreq>${entry.changeFrequency}</changefreq><priority>${entry.priority.toFixed(1)}</priority></url>`;
}

export async function GET(){
 const catalog=await publicCatalog();
 const latestCatalogChange=newest(catalog);
 const entries:Entry[]=[
  {path:'/',changeFrequency:'daily',priority:1,lastModified:latestCatalogChange},
  {path:'/catalog',changeFrequency:'daily',priority:.9,lastModified:latestCatalogChange},
 ];
 for(const topic of topicSlugs){
  const items=topicItems(catalog,topic);
  const pageCount=Math.max(1,Math.ceil(items.length/PAGE_SIZE));
  const lastModified=newest(items);
  for(let page=1;page<=pageCount;page++)entries.push({path:'/topics/'+topic+(page>1?'?page='+page:''),changeFrequency:'daily',priority:page===1?.9:.7,lastModified});
 }
 const authors=new Map<string,Date|undefined>();
 for(const item of catalog){
  if(item.platform!=='YouTube')continue;
  const path=authorPath(item.url);
  if(path)authors.set(path,dateOf(item.addedAt));
 }
 for(const [path,lastModified] of authors)entries.push({path,changeFrequency:'weekly',priority:.7,lastModified});
 const body=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.flatMap(entry=>locales.map(locale=>urlXml(entry,locale))).join('')}</urlset>`;
 return new Response(body,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=3600'}});
}
