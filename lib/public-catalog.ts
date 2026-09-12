import { env } from 'cloudflare:workers';
import { cache } from 'react';
import { media, bg, normalizeMedia, type Media } from './media-data';
import { channelIdentity } from './channel-identity';
export const catalogDb = () => (env as unknown as {DB:D1Database}).DB;
import {authorSlug} from './author-identity';
export const publicCatalog = cache(async ():Promise<Media[]> => {
 const db=catalogDb();
 const [sub,over,profiles,metrics,culture]=await Promise.all([
  db.prepare("SELECT url,title,description,reason,category,platform,avatar_url,created_at,reviewed_at FROM submissions WHERE status='approved'").all<{url:string;title:string|null;description:string|null;reason:string;category:string;platform:string;avatar_url:string;created_at:string;reviewed_at:string}>(),
  db.prepare('SELECT canonical_key,title,description,category,deleted FROM catalog_overrides').all<{canonical_key:string;title:string;description:string;category:string;deleted:number}>(),
  db.prepare('SELECT canonical_key,COALESCE(manual_avatar_url,avatar_url) AS avatar_url,subscriber_count FROM profile_metadata').all<{canonical_key:string;avatar_url:string;subscriber_count:number|null}>(),
  db.prepare('SELECT canonical_key,subscriber_count FROM channel_metrics').all<{canonical_key:string;subscriber_count:number}>(),
  db.prepare("SELECT * FROM culture_items WHERE status='published'").all<{id:string;kind:'movie'|'book';title:string;description:string;release_year:number;author:string;url:string;banner_url:string;updated_at:string}>()
 ]);
 const overrides=new Map(over.results.map(r=>[r.canonical_key,r]));
 const avatars=new Map(profiles.results.map(r=>[r.canonical_key,r]));
 const counts=new Map(metrics.results.map(r=>[r.canonical_key,r.subscriber_count]));
 const channels=new Map<string,Media>();
 for(const item of [...media,...sub.results.map(r=>({title:r.title || new URL(r.url).pathname,creator:r.description || r.reason || '',category:r.category || 'Супольнасць',platform:r.platform || '',url:r.url,image:r.avatar_url,background:bg.culture,addedAt:r.reviewed_at || r.created_at} satisfies Media))]){
  const key=channelIdentity(item.url);if(!key)continue;
  const override=overrides.get(key);if(override?.deleted)continue;
  const profile=avatars.get(key);
  channels.set(key,normalizeMedia({...item,title:override?.title || item.title,creator:override?.description ?? item.creator,category:override?.category || item.category,image:profile?.avatar_url || item.image,subscriberCount:counts.get(key) ?? profile?.subscriber_count ?? undefined,contentKind:'channel'}));
 }
 return [...channels.values(),...culture.results.map(r=>({title:r.title,creator:r.description,category:r.kind==='book'?'Кнігі':'Кіно',platform:r.kind==='book'?'Кнігі':'Кіно',contentKind:r.kind,url:r.url,background:r.banner_url || bg.culture,releaseYear:r.release_year,author:r.author,addedAt:r.updated_at} satisfies Media))];
});
export const findAuthor = async(slug:string) => (await publicCatalog()).find(item=>item.platform==='YouTube' && authorSlug(item.url)===encodeURIComponent(slug));
