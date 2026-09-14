import type {MetadataRoute} from 'next';
import {SITE_ORIGIN} from '@/lib/site-config';
import {publicCatalog} from '@/lib/public-catalog';
import {authorPath} from '@/lib/author-identity';
import {locales,localizedPath} from '@/lib/locale';
import {topicSlugs,type Topic} from '@/lib/discovery-copy';
import type {Media} from '@/lib/media-data';

const PAGE_SIZE=24;
type SitemapItem=MetadataRoute.Sitemap[number];

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

function localizedEntries(path:string,options:Omit<SitemapItem,'url'|'alternates'>):SitemapItem[]{
 const languages=Object.fromEntries([
  ...locales.map(locale=>[locale,SITE_ORIGIN+localizedPath(locale,path)]),
  ['x-default',SITE_ORIGIN+path],
 ]);
 return locales.map(locale=>({url:SITE_ORIGIN+localizedPath(locale,path),alternates:{languages},...options}));
}

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const catalog=await publicCatalog();
 const latestCatalogChange=newest(catalog);
 const pages:MetadataRoute.Sitemap=[
  ...localizedEntries('/',{changeFrequency:'daily',priority:1,lastModified:latestCatalogChange}),
  ...localizedEntries('/catalog',{changeFrequency:'daily',priority:.9,lastModified:latestCatalogChange}),
 ];

 for(const topic of topicSlugs){
  const items=topicItems(catalog,topic);
  const pageCount=Math.max(1,Math.ceil(items.length/PAGE_SIZE));
  const lastModified=newest(items);
  for(let page=1;page<=pageCount;page++){
   const path='/topics/'+topic+(page>1?'?page='+page:'');
   pages.push(...localizedEntries(path,{changeFrequency:'daily',priority:page===1?.9:.7,lastModified}));
  }
 }

 const authors=new Map<string,Date|undefined>();
 for(const item of catalog){
  if(item.platform!=='YouTube')continue;
  const path=authorPath(item.url);
  if(path)authors.set(path,dateOf(item.addedAt));
 }
 for(const [path,lastModified] of authors){
  pages.push(...localizedEntries(path,{changeFrequency:'weekly',priority:.7,lastModified}));
 }
 return pages;
}
