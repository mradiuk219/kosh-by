import type {Metadata} from 'next';
import {pageMetadata} from './seo';
import {localizedPath,locales,type Locale} from './locale';
import {SITE_ORIGIN} from './site-config';
import {discoveryCopy,topicSlugs,type Topic} from './discovery-copy';
import {topicEditorial} from './discovery-topic-content';
import {findAuthor} from './public-catalog';

export async function discoveryMetadata(locale:Locale,kind:'topics'|'authors',slug:string,page?:string):Promise<Metadata>{
 const c=discoveryCopy[locale];const author=kind==='authors'?await findAuthor(slug):null;
 if(kind==='topics'?!topicSlugs.includes(slug as Topic):!author)return {title:'404',robots:{index:false}};
 const pageNumber=kind==='topics'&&/^[1-9]\d*$/.test(page || '')?Number(page):1;
 const pageSuffix=pageNumber>1?' — '+topicEditorial[locale][slug as Topic].pageLabel+' '+pageNumber:'';
 const title=(author?.title || c[slug as Topic])+pageSuffix+' — КОШ';
 const description=author?.creator?.slice(0,170) || c.intro[slug as Topic];
 const path='/'+kind+'/'+encodeURIComponent(slug),query=pageNumber>1?'?page='+pageNumber:'',base=pageMetadata(locale);
 return {...base,title,description,alternates:{canonical:SITE_ORIGIN+localizedPath(locale,path)+query,languages:{...Object.fromEntries(locales.map(l=>[l,SITE_ORIGIN+localizedPath(l,path)+query])),'x-default':SITE_ORIGIN+path+query}},openGraph:{...base.openGraph,title,description,url:SITE_ORIGIN+localizedPath(locale,path)+query},twitter:{title,description}};
}
