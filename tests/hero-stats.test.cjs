const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
let cached=null,writes=0,cultureReads=0;
const db={prepare(query){let values=[];return {bind(...args){values=args;return this;},async all(){
 if(query.includes('SELECT payload'))return {results:cached?[cached]:[]};
 if(query.includes('SELECT subscriber_count'))return {results:[{subscriber_count:442000}]};
 if(query.includes('FROM culture_items')){assert.ok(query.includes("status = 'published'"));cultureReads++;return {results:[{kind:'movie',count:17},{kind:'book',count:8}]};}
 if(query.includes('SELECT platform'))return {results:[{platform:'Instagram'}]};
 return {results:[]};
 },async run(){if(query.includes('INSERT OR REPLACE')){writes++;cached={payload:values[1],updated_at:values[2]};}}};}};
const deps={'@/lib/submissions':{ensureSubmissionsTable:async()=>db},'@/lib/channel-metrics':{ensureChannelMetricsTable:async()=>db,refreshYoutubeMetrics:async()=>{}}};
const m={exports:{}};new Function('require','exports','module',ts.transpileModule(fs.readFileSync('app/api/stats/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(n=>deps[n],m.exports,m);
(async()=>{
 let result=await (await m.exports.GET()).json();assert.equal(result.movies,17);assert.equal(result.books,8);assert.equal(result.total,50);assert.equal(writes,1);
 await m.exports.GET();assert.equal(writes,1);assert.equal(cultureReads,1,'Same-day cache must be reused');
 cached.updated_at='2000-01-01T00:00:00.000Z';await m.exports.GET();assert.equal(writes,2,'Next day refreshes');
 const old=JSON.parse(cached.payload);delete old.movies;delete old.books;cached.payload=JSON.stringify(old);await m.exports.GET();assert.equal(writes,3,'Old cache gets new counters once');
 const home=fs.readFileSync('components/home-client.tsx','utf8');const initial=home.split('const initialHeroStats')[1].split('];')[0];
 assert.equal((initial.match(/label:/g)||[]).length,4);for(const label of ['Колькасць аўтараў','Найбольш падпісантаў','Кіно','Кнігі'])assert.ok(initial.includes(label));
 console.log('PASS: four tiles, published culture counts, daily cache and old-cache upgrade');
})().catch(e=>{console.error(e);process.exitCode=1});
