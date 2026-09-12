'use client';
import {useState} from 'react';
import type {LatestVideo} from '@/lib/author-details';
import {discoveryCopy} from '@/lib/discovery-copy';
import type {Locale} from '@/lib/locale';
export default function LatestVideoPlayer({video,locale}:{video:LatestVideo;locale:Locale}){
 const [loaded,setLoaded]=useState(false);const c=discoveryCopy[locale];
 return <div><h3 className="mb-3 text-lg">{video.title}</h3>{video.embeddable?<div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">{loaded?<iframe className="h-full w-full" src={'https://www.youtube-nocookie.com/embed/'+video.id} title={video.title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />:<div className="flex h-full flex-col items-center justify-center gap-4 p-5 text-center"><button className="rounded-full bg-white/10 px-5 py-3 hover:bg-white/20" onClick={()=>setLoaded(true)}>{c.play}</button><p className="text-sm text-white/50">{c.privacy}</p></div>}</div>:<p>{c.disabled}</p>}<div className="mt-3 flex flex-wrap justify-between gap-3 text-sm text-white/60"><a className="text-sky-400" href={'https://www.youtube.com/watch?v='+video.id} target="_blank" rel="noreferrer">{c.watch} ↗</a><span>{c.published}: {video.publishedAt.slice(0,10)} · {c.checked}: {video.checkedAt.slice(0,10)}</span></div></div>;
}
