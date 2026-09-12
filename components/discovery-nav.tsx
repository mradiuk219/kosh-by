'use client';
import {useLanguage,LanguageSwitch} from './language';
import {discoveryCopy,topicSlugs} from '@/lib/discovery-copy';
export function TopicLinks(){const {locale,path}=useLanguage();return <nav aria-label="КОШ" className="flex flex-wrap gap-x-6 gap-y-3 py-5 text-sm text-white/70">{topicSlugs.map(slug=><a className="hover:text-white underline-offset-4 hover:underline" key={slug} href={path('/topics/'+slug)}>{discoveryCopy[locale][slug]}</a>)}</nav>}
export function DiscoveryHeader(){const {locale,path}=useLanguage();const c=discoveryCopy[locale];return <header className="border-b border-white/10"><div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4"><a className="text-2xl font-black" href={path('/')}>КОШ<span className="text-red-500">.</span></a><div className="flex items-center gap-5"><a href={path('/catalog')}>{c.catalog}</a><LanguageSwitch /></div></div></header>}
