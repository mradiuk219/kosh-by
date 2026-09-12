export const catalogPlatforms = ['YouTube', 'Instagram', 'TikTok', 'Twitch', 'Spotify', 'Кіно', 'Кнігі'];
export type SortKey = 'popular' | 'az' | 'za' | 'newest' | 'platform';
export type CatalogState = {query:string;platform:string;category:string;sort:SortKey};
export function readCatalogState(search:string):CatalogState {
 const p=new URLSearchParams(search),sort=p.get('sort') || 'popular';
 return {query:(p.get('q') || '').slice(0,500),platform:catalogPlatforms.includes(p.get('platform') || '')?p.get('platform')!:'',category:(p.get('category') || 'Усе катэгорыі').slice(0,100),sort:(['popular','az','za','newest','platform'].includes(sort)?sort:'popular') as SortKey};
}
export function catalogHref(path:string,state:CatalogState){
 const p=new URLSearchParams();
 if(state.query)p.set('q',state.query);
 if(state.platform)p.set('platform',state.platform);
 if(state.category!=='Усе катэгорыі')p.set('category',state.category);
 if(state.sort!=='popular')p.set('sort',state.sort);
 return path+(p.size?'?'+p.toString():'');
}
export function safeCatalogReturn(value:string|null,fallback:string){
 if(!value || !/^\/(?:(?:en|uk|ru)\/)?catalog(?:\?|$)/.test(value) || value.includes('\\'))return fallback;
 const parsed=new URL(value,'https://kosh.invalid');
 return catalogHref(parsed.pathname,readCatalogState(parsed.search));
}
