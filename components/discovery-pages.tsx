import {notFound} from 'next/navigation';
import {LanguageProvider} from './language';
import {DiscoveryHeader} from './discovery-nav';
import {publicCatalog,findAuthor} from '@/lib/public-catalog';
import {authorPath} from '@/lib/author-identity';
import {authorDetails} from '@/lib/author-details';
import {discoveryCopy,topicSlugs,type Topic} from '@/lib/discovery-copy';
import {topicEditorial} from '@/lib/discovery-topic-content';
import {localizedPath,type Locale} from '@/lib/locale';
import LatestVideoPlayer from './latest-video';
import {SeoJsonLd} from './seo-json-ld';
import {SITE_ORIGIN} from '@/lib/site-config';

export async function TopicPage({locale,slug,page}:{locale:Locale;slug:string;page?:string}){
 if(!topicSlugs.includes(slug as Topic))notFound();
 const topic=slug as Topic,c=discoveryCopy[locale],editorial=topicEditorial[locale][topic];
 const items=(await publicCatalog()).filter(item=>topic==='bloggers'?item.contentKind==='channel':item.contentKind===(topic==='movies'?'movie':'book'));
 const current=/^[1-9]\d*$/.test(page || '')?Number(page):1;
 if(current>Math.max(1,Math.ceil(items.length/24)))notFound();
 const pageItems=items.slice((current-1)*24,current*24);
 const topicUrl=SITE_ORIGIN+localizedPath(locale,'/topics/'+topic);
 const canonicalUrl=topicUrl+(current>1?'?page='+current:'');
 const structuredData=[
  {'@context':'https://schema.org','@type':'CollectionPage',name:c[topic],description:c.intro[topic],url:canonicalUrl,inLanguage:locale,isPartOf:{'@type':'WebSite',name:'КОШ',url:SITE_ORIGIN+localizedPath(locale)},mainEntity:{'@type':'ItemList',numberOfItems:items.length,itemListElement:pageItems.map((item,index)=>{const internal=item.contentKind==='channel'?authorPath(item.url):null;return {'@type':'ListItem',position:(current-1)*24+index+1,name:item.title,url:internal?SITE_ORIGIN+localizedPath(locale,internal):item.url}})}},
  {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'КОШ',item:SITE_ORIGIN+localizedPath(locale)},{'@type':'ListItem',position:2,name:c[topic],item:canonicalUrl}]},
  ...(current===1?[{'@context':'https://schema.org','@type':'FAQPage',mainEntity:editorial.faq.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))}]:[]),
 ];
 const related=topicSlugs.filter(value=>value!==topic);
 return <LanguageProvider locale={locale}>
  <SeoJsonLd data={structuredData}/><DiscoveryHeader/>
  <main className="mx-auto max-w-6xl px-6 py-8">
   <header className="border-b border-white/10 pb-8">
    <h1 className="mt-5 text-4xl font-bold md:text-5xl">{c[topic]}</h1>
    <p className="my-6 max-w-3xl text-lg leading-8 text-white/65">{c.intro[topic]}</p>
    <p className="text-sm font-semibold uppercase tracking-[.14em] text-sky-400">{editorial.countLabel}: {items.length}</p>
   </header>
   {current===1&&<section className="py-10" aria-labelledby="topic-overview">
    <h2 id="topic-overview" className="text-2xl font-bold md:text-3xl">{editorial.overviewTitle}</h2>
    <p className="mt-4 max-w-4xl text-base leading-7 text-white/65">{editorial.overviewBody}</p>
    <div className="mt-7 grid gap-4 md:grid-cols-3">{editorial.highlights.map(item=><article key={item.title} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><h3 className="font-bold text-white">{item.title}</h3><p className="mt-2 leading-6 text-white/60">{item.description}</p></article>)}</div>
   </section>}
   <section aria-label={c[topic]} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{pageItems.map((item,i)=>{const internal=item.contentKind==='channel'?authorPath(item.url):null;return <article key={item.url+':'+i} className="rounded-2xl border border-white/10 p-6">{item.image&&<img src={item.image} alt={item.title} loading="lazy" className="mb-4 size-20 rounded-full object-cover"/>}<h2 className="text-xl font-bold"><a className="hover:text-sky-400" href={internal?localizedPath(locale,internal):item.url} target={internal?undefined:'_blank'} rel={internal?undefined:'noreferrer'}>{item.title}</a></h2><p className="my-2 text-sm text-sky-400">{item.platform}{item.author?' · '+item.author:''}{item.releaseYear?' · '+item.releaseYear:''}</p><p className="line-clamp-4 text-white/60">{item.creator}</p></article>})}</section>
   {!items.length&&<p className="py-12 text-white/60">{c.empty}</p>}
   <nav aria-label={editorial.pageLabel} className="my-8 flex justify-between">{current>1?<a className="text-sky-400 hover:text-sky-300" rel="prev" href={current===2?'?':'?page='+(current-1)}>{c.previous}</a>:<span/>}{current*24<items.length&&<a className="text-sky-400 hover:text-sky-300" rel="next" href={'?page='+(current+1)}>{c.next}</a>}</nav>
   {current===1&&<>
    <section className="my-12 max-w-4xl rounded-2xl bg-white/[.04] p-6 md:p-8"><h2 className="text-2xl font-bold">{editorial.guideTitle}</h2><p className="mt-4 leading-7 text-white/65">{editorial.guideBody}</p></section>
    <section className="my-12 max-w-4xl"><h2 className="text-2xl font-bold">{editorial.faqTitle}</h2><div className="mt-5 divide-y divide-white/10 border-y border-white/10">{editorial.faq.map(item=><article key={item.question} className="py-5"><h3 className="font-bold text-white">{item.question}</h3><p className="mt-2 leading-7 text-white/60">{item.answer}</p></article>)}</div></section>
   </>}
   <nav aria-label={editorial.relatedTitle} className="my-12 border-t border-white/10 pt-8"><h2 className="text-xl font-bold">{editorial.relatedTitle}</h2><div className="mt-4 flex flex-wrap gap-3"><a className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-sky-400 hover:text-sky-400" href={localizedPath(locale,'/catalog')}>{editorial.catalogLink}</a>{related.map(value=><a key={value} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-sky-400 hover:text-sky-400" href={localizedPath(locale,'/topics/'+value)}>{c[value]}</a>)}</div></nav>
  </main>
 </LanguageProvider>;
}

export async function AuthorPage({locale,slug}:{locale:Locale;slug:string}){
 const author=await findAuthor(slug);if(!author?.url)notFound();const c=discoveryCopy[locale];const details=await authorDetails(author.url);
 return <LanguageProvider locale={locale}><DiscoveryHeader/><main className="mx-auto max-w-4xl px-6 py-8"><div className="my-8 flex items-center gap-6">{author.image&&<img src={author.image} alt="" className="size-24 rounded-full object-cover"/>}<div><p className="text-sm text-sky-400">YouTube · {author.category}</p><h1 className="mt-2 text-4xl font-bold">{author.title}</h1></div></div><p className="whitespace-pre-line text-lg text-white/70">{author.creator}</p>{author.subscriberCount!=null&&<p className="my-4 text-white/60">{c.followers}: {author.subscriberCount.toLocaleString(locale)}</p>}<a className="my-6 inline-block text-sky-400" href={author.url} target="_blank" rel="noreferrer">{c.watch} ↗</a><section className="my-8"><h2 className="mb-5 text-2xl font-bold">{c.latest}</h2>{details.latest?<LatestVideoPlayer video={details.latest} locale={locale}/>:<p className="text-white/60">{details.unavailable?c.unavailable:c.noVideo}</p>}{details.latest&&details.unavailable&&<p className="mt-3 text-white/50">{c.stale}</p>}</section>{(author.category.includes('Гульні')||details.games.length>0)&&<section className="my-12"><h2 className="mb-5 text-2xl font-bold">{c.games}</h2>{details.games.length?<ul className="space-y-3">{details.games.map(game=><li key={game.name} className="rounded-xl bg-white/5 p-4">{game.name}{game.url&&<a className="ml-4 text-sm text-sky-400" href={game.url} target="_blank" rel="noreferrer">{c.source} ↗</a>}</li>)}</ul>:<p className="text-white/60">{c.emptyGames}</p>}</section>}</main></LanguageProvider>;
}
