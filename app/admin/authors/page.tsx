import {getChatGPTUser} from '@/app/chatgpt-auth';
import {AdminAccessGate} from '@/app/admin/access-gate';
import {publicCatalog,catalogDb} from '@/lib/public-catalog';
import {authorSlug} from '@/lib/author-identity';
import {channelIdentity} from '@/lib/channel-identity';
import AuthorGamesEditor from '@/components/author-games-editor';
export const dynamic='force-dynamic';
export default async function Page(){
 const user=await getChatGPTUser();if(user?.email?.toLowerCase()!=='radziuk219@gmail.com')return <AdminAccessGate returnTo="/admin/authors" signedInEmail={user?.email}/>;
 const rows=await catalogDb().prepare('SELECT canonical_key,games_json FROM author_details').all<{canonical_key:string;games_json:string}>();const games=new Map(rows.results.map(r=>[r.canonical_key,JSON.parse(r.games_json)]));
 const authors=(await publicCatalog()).filter(a=>a.platform==='YouTube').map(a=>({slug:decodeURIComponent(authorSlug(a.url)!),title:a.title,games:games.get(channelIdentity(a.url)!) || []})).sort((a,b)=>a.title.localeCompare(b.title,'be'));
 return <main className="mx-auto max-w-3xl px-6 py-10"><a href="/admin/channels" className="text-sky-400">← База КОШа</a><h1 className="my-8 text-3xl font-bold">Гульні YouTube-аўтараў</h1><AuthorGamesEditor authors={authors}/></main>;
}
