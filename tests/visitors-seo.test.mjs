import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const db = new DatabaseSync(':memory:');
db.exec(fs.readFileSync('drizzle/0015_visitor_days.sql','utf8'));
const add=db.prepare('INSERT OR IGNORE INTO visitor_days VALUES (?, ?)');
add.run('2026-09-10','a');add.run('2026-09-10','a');add.run('2026-09-09','a');add.run('2026-09-06','b');add.run('2026-08-15','c');
const count=db.prepare('SELECT COUNT(DISTINCT visitor_id) AS n FROM visitor_days WHERE day >= ?');
assert.equal(count.get('2026-09-10').n,1);assert.equal(count.get('2026-09-04').n,2);assert.equal(count.get('2026-08-12').n,3);
db.prepare('DELETE FROM visitor_days WHERE day < ?').run('2026-08-20');assert.equal(count.get('2026-08-01').n,2);
console.log('Distinct visitor windows, repeated visits and retention: OK');
if(process.env.TEST_ORIGIN){
 const origin=process.env.TEST_ORIGIN;
 for(const [path,lang,title] of [['/','be','Беларускае'],['/uk','uk','Білоруське'],['/uk/catalog','uk','Каталог білоруського'],['/ru','ru','Белорусское'],['/catalog','be','Каталог беларускага'],['/ru/catalog','ru','Каталог белорусского']]){
  const response=await fetch(origin+path);assert.equal(response.status,200,path);const html=await response.text();assert.ok(new RegExp('<html[^>]*lang="'+lang+'"').test(html),path+' HTML language: '+html.match(/<html[^>]*>/)?.[0]);assert.ok(html.includes(title),path+' title');assert.ok(html.includes('hreflang="ru"')||html.includes('hrefLang="ru"'),path+' hreflang');assert.ok(html.includes('canonical'),path+' canonical');assert.ok(html.includes('noindex'),path+' noindex');
 }
 assert.equal((await fetch(origin+'/api/admin/visitors')).status,403);
 assert.equal((await fetch(origin+'/api/visits',{method:'POST',headers:{origin:'https://example.com','content-type':'application/json'},body:JSON.stringify({id:crypto.randomUUID()})})).status,403);
 const id=crypto.randomUUID();for(let i=0;i<2;i++){
  let status, body;
  for(let attempt=0;attempt<3;attempt++){
   const r=await fetch(origin+'/api/visits',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({id})});
   status=r.status;body=await r.text();
   if(status!==503 || !body.includes('Your worker restarted mid-request'))break;
   await new Promise(resolve=>setTimeout(resolve,500));
  }
  assert.equal(status,204,body?.slice(0,500));
 }
 console.log('HTML language, canonical, hreflang, staging noindex, API authorization and collection: OK');
}
