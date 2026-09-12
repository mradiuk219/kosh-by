const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,deps={}){const m={exports:{}};new Function('require','exports','module',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText)(n=>n in deps?deps[n]:require(n),m.exports,m);return m.exports;}
const data=load('lib/media-data.ts'),state=load('lib/catalog-state.ts'),categories=load('lib/categories.ts');
const items=[
 {id:'film-2002',title:'Чалавек-павук',platform:'Кіно',category:'Кіно',contentKind:'movie'},
 {id:'film-1994',title:'Чалавек-павук',platform:'Кіно',category:'Кіно',contentKind:'movie'},
 {id:'film-2014',title:'Што мы робім у цемры',platform:'Кіно',category:'Кіно',contentKind:'movie'},
 {id:'film-2019',title:'Што мы робім у цемры',platform:'Кіно',category:'Кіно',contentKind:'movie'},
 {url:'https://youtube.com/@gamer',title:'Гулец',platform:'YouTube',category:'Гульні'},
 {url:'https://instagram.com/artist',title:'Мастак',platform:'Instagram',category:'Мастацтва'},
 {url:'https://twitch.tv/gamer',title:'Гулец',platform:'Twitch',category:'Гульні'},
].map(x=>({creator:'',background:'',...x}));
let slots=[],cursor=0;
const hooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v}];},useMemo:f=>f(),useEffect:()=>{}};
const Page=load('components/catalog-client.tsx',{
 react:hooks,'@/lib/catalog-state':state,'@/lib/categories':categories,'@/lib/media-data':data,
 '@/components/language':{useLanguage:()=>({t:s=>s,locale:'be',path:s=>s}),LanguageSwitch:'LanguageSwitch'},
 '@/components/ui/button':{Button:'Button'},'@/components/ui/input':{Input:'Input'},
 'lucide-react':{ArrowLeft:'Icon',Search:'Icon',SlidersHorizontal:'Icon',X:'Icon'},
 './home-client':{media:items,MediaCard:'MediaCard',fetchCatalogData:()=>Promise.resolve({catalog:items})}
}).default;
let nodes=[];function render(){cursor=0;nodes=[];function walk(x){if(Array.isArray(x))return x.forEach(walk);if(x&&typeof x==='object'&&x.props){nodes.push(x);walk(x.props.children);}}walk(Page());}
function platform(name){nodes.find(x=>x.type==='Button'&&x.props.children===name).props.onClick();render();}
function category(name){nodes.find(x=>x.props.id==='category').props.onChange({target:{value:name}});render();}
function cards(){return nodes.filter(x=>x.type==='MediaCard');}
function expectPlatforms(expected){assert.deepEqual(cards().map(x=>x.props.item.platform),expected);}
render();assert.equal(new Set(cards().map(x=>x.key)).size,items.length,'Every card needs a unique key, even identical titles');
platform('YouTube');category('Гульні');expectPlatforms(['YouTube']);
platform('Instagram');expectPlatforms([]);assert.equal(slots[2],'Гульні');
platform('Twitch');expectPlatforms(['Twitch']);
platform('Кіно');expectPlatforms([]);
category('Кіно');expectPlatforms(['Кіно','Кіно','Кіно','Кіно']);
platform('Instagram');expectPlatforms([]);
category('Усе катэгорыі');expectPlatforms(['Instagram']);
platform('Instagram');category('Гульні');assert.equal(cards().length,2);assert.ok(cards().every(x=>x.props.item.category==='Гульні'));
nodes.find(x=>x.props.id==='catalog-search').props.onChange({target:{value:'Няма такога'}});render();expectPlatforms([]);
assert.ok(fs.readFileSync('components/home-client.tsx','utf8').includes('key={mediaKey(item)}'));
console.log('PASS: unique keys and platform → category → other platform, empty results, reset and search');
