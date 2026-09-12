import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
function load(file,deps={}){const module={exports:{}};const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','exports','module',code)(name=>{if(!(name in deps))throw Error(name);return deps[name]},module.exports,module);return module.exports}
const identity=load('../lib/channel-identity.ts');
const {authorSlug,authorPath}=load('../lib/author-identity.ts',{'./channel-identity':identity});
assert.equal(authorSlug('https://www.youtube.com/@Test'),'test');
assert.equal(authorPath('https://www.twitch.tv/test'),null);
assert.equal(authorSlug('https://www.youtube.com/channel/UC123'),'channel~uc123');
const {validateGames}=load('../lib/author-games.ts');
assert.deepEqual(validateGames([{name:' Minecraft ',url:''}]),[{name:'Minecraft',url:''}]);
assert.equal(validateGames([{name:'Test',url:'javascript:alert(1)'}]),null);
assert.equal(validateGames([{name:'Test',url:'https://youtube.com.evil.test/watch?v=1'}]),null);
assert.equal(validateGames([{name:'a',url:''},{name:'A',url:''}]),null);
const db=new DatabaseSync(':memory:');db.exec(readFileSync('drizzle/0016_author_details.sql','utf8'));
const d1={prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)},async run(){return {meta:db.prepare(sql).run(...args)}}}}}}};
const {authorDetails}=load('../lib/author-details.ts',{'cloudflare:workers':{env:{YOUTUBE_API_KEY:'test-only'}},'./public-catalog':{catalogDb:()=>d1},'./channel-identity':identity});
let calls=0;const originalFetch=globalThis.fetch;
globalThis.fetch=async url=>{calls++;const endpoint=new URL(url).pathname.split('/').at(-1);
const items=endpoint==='channels'?[{contentDetails:{relatedPlaylists:{uploads:'uploads'}}}]:endpoint==='playlistItems'?[{contentDetails:{videoId:'aaaaaaaaaaa'}},{contentDetails:{videoId:'bbbbbbbbbbb'}}]:[{id:'aaaaaaaaaaa',snippet:{title:'Older',publishedAt:'2025-01-01T00:00:00Z'},status:{privacyStatus:'public',embeddable:true}},{id:'bbbbbbbbbbb',snippet:{title:'Newest',publishedAt:'2025-02-01T00:00:00Z'},status:{privacyStatus:'public',embeddable:false}}];
return Response.json({items})};
const first=await authorDetails('https://www.youtube.com/@test');assert.equal(first.latest.id,'bbbbbbbbbbb');assert.equal(first.latest.embeddable,false);assert.equal(calls,3);
await authorDetails('https://www.youtube.com/@test');assert.equal(calls,3,'cache prevents repeated API requests');
db.prepare('UPDATE author_details SET next_check=0').run();globalThis.fetch=async()=>{throw Error('offline')};
const fallback=await authorDetails('https://www.youtube.com/@test');assert.equal(fallback.latest.id,'bbbbbbbbbbb');assert.equal(fallback.unavailable,true);
globalThis.fetch=originalFetch;
console.log('Author identities, game validation, latest upload order, cache and outage fallback: OK');
if(process.env.TEST_ORIGIN){
 const origin=process.env.TEST_ORIGIN;
 async function get(path,options){for(let i=0;i<3;i++){const r=await fetch(origin+path,options);const html=await r.text();if(r.status===503&&html.includes('Your worker restarted mid-request'))continue;return {r,html}}throw Error('Worker restarted repeatedly')}
 for(const locale of ['be','uk','ru'])for(const topic of ['bloggers','movies','books']){
 const path=(locale==='be'?'':'/'+locale)+'/topics/'+topic;const {r,html}=await get(path);assert.equal(r.status,200,path+html.slice(0,100));assert.ok(html.includes('lang="'+locale+'"'));assert.ok(html.includes('canonical'));assert.ok(html.includes('noindex'));
 }
 for(const path of ['/authors/thebudzma','/uk/authors/thebudzma','/ru/authors/thebudzma']){const {r,html}=await get(path);assert.equal(r.status,200,path+html.slice(0,200));assert.ok(html.includes('YouTube'));}
 for(const path of ['/topics/invalid','/authors/nonexistent-test-author','/topics/bloggers?page=9999'])assert.equal((await get(path)).r.status,404,path);
 assert.equal((await get('/api/admin/author-games',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({slug:'thebudzma',games:[]})})).r.status,403);
 assert.ok((await get('/admin/authors')).html.includes('Патрабуецца ўваход'));
 console.log('Nine topic pages, three author languages, unknown routes and admin protection: OK');
}
