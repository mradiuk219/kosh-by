const ts = require('typescript');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const loaded = {exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync('lib/catalog-state.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(loaded.exports,loaded);
const {readCatalogState,catalogHref,safeCatalogReturn} = loaded.exports;
const state = {query:'Беларуская музыка',platform:'YouTube',category:'Музыка',sort:'za'};
for (const path of ['/catalog','/en/catalog','/uk/catalog','/ru/catalog']) {
  const url = catalogHref(path,state);
  assert.deepEqual(readCatalogState(url.slice(url.indexOf('?'))),state);
  assert.equal(safeCatalogReturn(url,'/catalog'),url);
}
for (const url of ['https://evil.test','//evil.test','/catalog/evil','/catalog\\evil','javascript:alert(1)']) {
  assert.equal(safeCatalogReturn(url,'/catalog'),'/catalog');
}
assert.equal(readCatalogState('?sort=evil&platform=evil').sort,'popular');
assert.equal(readCatalogState('?platform=evil').platform,'');
const home=fs.readFileSync('components/home-client.tsx','utf8');
const catalog=fs.readFileSync('components/catalog-client.tsx','utf8');
const nav=fs.readFileSync('components/discovery-nav.tsx','utf8');
assert.ok(/destination\s*=\s*'platform'/.test(home));
assert.ok(catalog.includes('destination="author"'));
assert.ok(catalog.includes('catalogReturnTo={returnTo}'));
assert.ok(/scrollY\s*<=\s*24/.test(nav));
assert.ok(!catalog.includes('TopicLinks'));
assert.ok(!fs.readFileSync('components/discovery-pages.tsx','utf8').includes('TopicLinks'));
console.log('Catalog state and navigation checks passed');
