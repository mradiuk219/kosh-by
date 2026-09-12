import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function load(file){const module={exports:{}};new Function('exports','module',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(module.exports,module);return module.exports}
const {en}=load('lib/translations-en.ts'),{ru}=load('lib/translations.ts');
assert.deepEqual(Object.keys(en).sort(),Object.keys(ru).sort(),'English covers every existing translation key');
const {locales,localeFromPath,localizedPath}=load('lib/locale.ts');
assert.deepEqual(locales,['be','uk','en','ru']);
assert.equal(localeFromPath('/'), 'be');assert.equal(localeFromPath('/en/catalog'),'en');assert.equal(localeFromPath('/english'),'be');
assert.equal(localizedPath('en','/topics/books'),'/en/topics/books');
console.log('English translations, menu order and default locale: OK');
if(process.env.TEST_ORIGIN){
 for(const [path,locale,title] of [['/','be','Беларускае'],['/en','en','closer than you think'],['/en/catalog','en','Belarusian content catalog'],['/en/topics/bloggers','en','Belarusian-language creators'],['/en/topics/movies','en','Films and animation'],['/en/topics/books','en','Books in Belarusian'],['/en/authors/thebudzma','en','Latest video']]){
 const response=await fetch(process.env.TEST_ORIGIN+path,{signal:AbortSignal.timeout(20000)});assert.equal(response.status,200,path);const html=await response.text();assert.ok(html.includes('lang="'+locale+'"'),path);assert.ok(html.includes(title),path);assert.ok(html.includes('canonical'));assert.ok(html.includes('noindex'));
 }
 console.log('English home, catalog, topics, author and Belarusian default: OK');
}
