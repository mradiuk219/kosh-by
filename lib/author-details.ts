import {env} from 'cloudflare:workers';
import {catalogDb} from './public-catalog';
import {channelIdentity} from './channel-identity';
export type Game = {name:string;url:string};
export type LatestVideo = {id:string;title:string;publishedAt:string;embeddable:boolean;checkedAt:string};
export type AuthorDetails = {games:Game[];latest:LatestVideo|null;unavailable:boolean};
export async function authorDetails(url:string):Promise<AuthorDetails>{
 const db=catalogDb();const key=channelIdentity(url)!;
 await db.prepare('INSERT OR IGNORE INTO author_details(canonical_key) VALUES (?)').bind(key).run();
 const row=await db.prepare('SELECT * FROM author_details WHERE canonical_key=?').bind(key).first<{games_json:string;latest_json:string|null;next_check:number}>();
 const games:Game[]=JSON.parse(row?.games_json || '[]');
 let latest:LatestVideo|null=JSON.parse(row?.latest_json || 'null');
 const unavailable=row?.latest_json==null || !!latest && Date.parse(latest.checkedAt)<Date.now()-86400000;
 if((row?.next_check || 0)>Date.now())return {games,latest,unavailable};
 // A bounded lease prevents simultaneous page views from spending duplicate API quota.
 const lease=await db.prepare('UPDATE author_details SET next_check=? WHERE canonical_key=? AND next_check<=?').bind(Date.now()+3600000,key,Date.now()).run();
 if(!lease.meta.changes)return {games,latest,unavailable};
 try{
  const apiKey=(env as unknown as {YOUTUBE_API_KEY?:string}).YOUTUBE_API_KEY;if(!apiKey)throw Error('Missing key');
  const call=async(endpoint:string,params:Record<string,string>)=>{
   const response=await fetch('https://www.googleapis.com/youtube/v3/'+endpoint+'?'+new URLSearchParams({...params,key:apiKey}),{signal:AbortSignal.timeout(6000)});
   if(!response.ok)throw Error('YouTube unavailable');
   return await response.json() as {items?:any[]};
  };
  const parts=new URL(url).pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const lookup:Record<string,string>=parts[0]==='channel'?{id:parts[1]}:parts[0]?.startsWith('@')?{forHandle:parts[0]}:parts[0]==='user'?{forUsername:parts[1]}:{};
  if(!Object.keys(lookup).length)throw Error('Unsupported channel URL');
  const channel=(await call('channels',{part:'contentDetails',...lookup})).items?.[0];
  const playlist=channel?.contentDetails?.relatedPlaylists?.uploads;if(!playlist)throw Error('No uploads');
  const uploads=(await call('playlistItems',{part:'contentDetails',playlistId:playlist,maxResults:'10'})).items || [];
  const ids=uploads.map(v=>v.contentDetails?.videoId).filter(id=>typeof id==='string' && /^[\w-]{11}$/.test(id));
  let newest:any;
  if(ids.length)newest=(await call('videos',{part:'snippet,status',id:ids.join(',')})).items?.filter(v=>v.status?.privacyStatus==='public' && v.snippet?.liveBroadcastContent!=='upcoming' && Date.parse(v.snippet?.publishedAt)<=Date.now()).sort((a,b)=>Date.parse(b.snippet.publishedAt)-Date.parse(a.snippet.publishedAt))[0];
  latest=newest?{id:newest.id,title:newest.snippet.title,publishedAt:newest.snippet.publishedAt,embeddable:newest.status.embeddable===true,checkedAt:new Date().toISOString()}:null;
  await db.prepare('UPDATE author_details SET latest_json=?,next_check=? WHERE canonical_key=?').bind(JSON.stringify(latest),Date.now()+86400000,key).run();
  return {games,latest,unavailable:false};
 }catch{console.warn('Author video refresh unavailable');return {games,latest,unavailable:true};}
}
