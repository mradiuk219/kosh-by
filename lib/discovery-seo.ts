import type {Metadata} from 'next';
import {pageMetadata} from './seo';
import {localizedPath,locales,type Locale} from './locale';
import {SITE_ORIGIN} from './site-config';
import {discoveryCopy,topicSlugs,type Topic} from './discovery-copy';
import {findAuthor} from './public-catalog';
export async function discoveryMetadata(locale:Locale,kind:'topics'|'authors',slug:string):Promise<Metadata>{
 const c=discoveryCopy[locale];const author=kind==='authors'?await findAuthor(slug):null;
 if(kind==='topics'?!topicSlugs.includes(slug as Topic):!author)return {title:'404',robots:{index:false}};
 const title=(author?.title || c[slug as Topic])+' — КОШ';
 const description=author?.creator?.slice(0,170) || c.intro[slug as Topic];
 const path='/'+kind+'/'+encodeURIComponent(slug),base=pageMetadata(locale);
 return {...base,title,description,alternates:{canonical:SITE_ORIGIN+localizedPath(locale,path),languages:{...Object.fromEntries(locales.map(l=>[l,SITE_ORIGIN+localizedPath(l,path)])),'x-default':SITE_ORIGIN+path}},openGraph:{...base.openGraph,title,description,url:SITE_ORIGIN+localizedPath(locale,path)},twitter:{title,description}};
}
