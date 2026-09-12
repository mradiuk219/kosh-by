import {notFound} from 'next/navigation';
import {LanguageProvider} from './language';
import {DiscoveryHeader} from './discovery-nav';
import {publicCatalog,findAuthor} from '@/lib/public-catalog';
import {authorPath} from '@/lib/author-identity';
import {authorDetails} from '@/lib/author-details';
import {discoveryCopy,topicSlugs,type Topic} from '@/lib/discovery-copy';
import {localizedPath,type Locale} from '@/lib/locale';
import LatestVideoPlayer from './latest-video';
export async function TopicPage({locale,slug,page}:{locale:Locale;slug:string;page?:string}){
 if(!topicSlugs.includes(slug as Topic))notFound();
 const topic=slug as Topic,c=discoveryCopy[locale];
 const items=(await publicCatalog()).filter(item=>topic==='bloggers'?item.contentKind==='channel':item.contentKind===(topic==='movies'?'movie':'book'));
 const current=/^[1-9]\d*$/.test(page || '')?Number(page):1;
 if(current>Math.max(1,Math.ceil(items.length/24)))notFound();
 return <LanguageProvider locale={locale}><DiscoveryHeader/><main className="mx-auto max-w-6xl px-6 py-8"><h1 className="mt-5 text-4xl font-bold">{c[topic]}</h1><p className="my-6 max-w-3xl text-lg text-white/60">{c.intro[topic]}</p><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.slice((current-1)*24,current*24).map((item,i)=>{const internal=item.contentKind==='channel'?authorPath(item.url):null;return <article key={item.url+':'+i} className="rounded-2xl border border-white/10 p-6">{item.image&&<img src={item.image} alt="" loading="lazy" className="mb-4 size-20 rounded-full object-cover"/>}<h2 className="text-xl font-bold"><a className="hover:text-sky-400" href={internal?localizedPath(locale,internal):item.url} target={internal?undefined:'_blank'} rel={internal?undefined:'noreferrer'}>{item.title}</a></h2><p className="my-2 text-sm text-sky-400">{item.platform}{item.author?' · '+item.author:''}{item.releaseYear?' · '+item.releaseYear:''}</p><p className="line-clamp-4 text-white/60">{item.creator}</p></article>})}</div>{!items.length&&<p className="py-12 text-white/60">{c.empty}</p>}<nav className="my-8 flex justify-between">{current>1?<a href={'?page='+(current-1)}>{c.previous}</a>:<span/>}{current*24<items.length&&<a href={'?page='+(current+1)}>{c.next}</a>}</nav></main></LanguageProvider>;
}
export async function AuthorPage({locale,slug}:{locale:Locale;slug:string}){
 const author=await findAuthor(slug);if(!author?.url)notFound();const c=discoveryCopy[locale];const details=await authorDetails(author.url);
 return <LanguageProvider locale={locale}><DiscoveryHeader/><main className="mx-auto max-w-4xl px-6 py-8"><div className="my-8 flex items-center gap-6">{author.image&&<img src={author.image} alt="" className="size-24 rounded-full object-cover"/>}<div><p className="text-sm text-sky-400">YouTube · {author.category}</p><h1 className="mt-2 text-4xl font-bold">{author.title}</h1></div></div><p className="whitespace-pre-line text-lg text-white/70">{author.creator}</p>{author.subscriberCount!=null&&<p className="my-4 text-white/60">{c.followers}: {author.subscriberCount.toLocaleString(locale)}</p>}<a className="my-6 inline-block text-sky-400" href={author.url} target="_blank" rel="noreferrer">{c.watch} ↗</a><section className="my-8"><h2 className="mb-5 text-2xl font-bold">{c.latest}</h2>{details.latest?<LatestVideoPlayer video={details.latest} locale={locale}/>:<p className="text-white/60">{details.unavailable?c.unavailable:c.noVideo}</p>}{details.latest&&details.unavailable&&<p className="mt-3 text-white/50">{c.stale}</p>}</section>{(author.category.includes('Гульні')||details.games.length>0)&&<section className="my-12"><h2 className="mb-5 text-2xl font-bold">{c.games}</h2>{details.games.length?<ul className="space-y-3">{details.games.map(game=><li key={game.name} className="rounded-xl bg-white/5 p-4">{game.name}{game.url&&<a className="ml-4 text-sm text-sky-400" href={game.url} target="_blank" rel="noreferrer">{c.source} ↗</a>}</li>)}</ul>:<p className="text-white/60">{c.emptyGames}</p>}</section>}</main></LanguageProvider>;
}
