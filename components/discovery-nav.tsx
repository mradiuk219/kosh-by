'use client';
import {useEffect,useState} from 'react';
import {useLanguage,LanguageSwitch} from './language';
import {discoveryCopy} from '@/lib/discovery-copy';
import {safeCatalogReturn} from '@/lib/catalog-state';

export function HomeTopicLinks({mobile=false}:{mobile?:boolean}){
 const {locale,path}=useLanguage();
 const [visible,setVisible]=useState(true);
 useEffect(()=>{const update=()=>setVisible(window.scrollY<=24);update();window.addEventListener('scroll',update,{passive:true});return ()=>window.removeEventListener('scroll',update)},[]);
 if(!mobile && !visible)return null;
 const labels={be:['Каталог','Блогеры','Кіно','Кнігі'],uk:['Каталог','Блогери','Кіно','Книги'],en:['Catalog','Bloggers','Films','Books'],ru:['Каталог','Блогеры','Кино','Книги']}[locale];
 return <nav aria-label="КОШ" className={mobile?'grid gap-1 px-4 text-lg':'hidden shrink-0 items-center gap-6 text-sm text-white/62 md:flex'}>{['/catalog','/topics/bloggers','/topics/movies','/topics/books'].map((href,index)=><a className={mobile?'rounded-xl px-4 py-3 hover:bg-white/6':'transition hover:text-white'} key={href} href={path(href)}>{labels[index]}</a>)}</nav>;
}
export function DiscoveryHeader(){
 const {locale,path}=useLanguage();const c=discoveryCopy[locale];
 const [returnTo,setReturnTo]=useState<string|null>(null);
 useEffect(()=>{setReturnTo(safeCatalogReturn(new URLSearchParams(window.location.search).get('returnTo'),path('/catalog')))},[locale]);
 return <header className="border-b border-white/10"><div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4"><a className="text-2xl font-black" href={path('/')}>КОШ<span className="text-red-500">.</span></a><div className="flex items-center gap-5"><a href={returnTo || path('/catalog')}>{c.catalog}</a><LanguageSwitch /></div></div></header>;
}
