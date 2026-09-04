import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(path, modules, timers = setTimeout) {
  const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'setTimeout', source)((id) => modules[id] ?? require(id), module, module.exports, timers);
  return module.exports;
}
const core = load('../lib/social-discovery-core.ts', {});
for (const bad of ['https://instagram.com/p/123', 'https://instagram.com/reels', 'https://twitch.tv/directory', 'https://tiktok.com/tag/belarus', 'https://open.spotify.com/playlist/1234567890123456789012', 'https://open.spotify.com/show/1234567890123456789012', 'https://evil.instagram.com/name', 'https://instagram.com.evil.org/name', 'http://instagram.com/name', 'https://user@instagram.com/name', 'https://instagram.com:444/name']) assert.equal(core.socialProfile(bad), null, bad);
assert.equal(core.socialProfile('https://www.instagram.com/Example/?x=1').canonical_key, 'instagram:example');
assert.equal(core.socialProfile('https://www.tiktok.com/@Example/video/123').url, 'https://tiktok.com/@example');
assert.equal(core.socialProfile('https://open.spotify.com/artist/Ab12345678901234567890?si=x').url, 'https://open.spotify.com/artist/Ab12345678901234567890');
assert.equal(core.socialLinks('https://instagram.com/test https://www.instagram.com/test/').length, 1);

const sql = new DatabaseSync(':memory:');
sql.exec(`CREATE TABLE submissions (id TEXT PRIMARY KEY, url TEXT, reason TEXT, status TEXT, created_at TEXT, reviewed_at TEXT, title TEXT, description TEXT, category TEXT, platform TEXT, enrichment_status TEXT, canonical_key TEXT UNIQUE);
CREATE TABLE catalog_overrides (canonical_key TEXT);
CREATE TABLE youtube_candidates (url TEXT, title TEXT, description TEXT, category TEXT, status TEXT, discovered_at TEXT);
CREATE TABLE homepage_stats (id TEXT PRIMARY KEY);
INSERT INTO youtube_candidates VALUES ('https://youtube.com/@seed', 'Seed', 'https://instagram.com/newauthor https://twitch.tv/newstream https://tiktok.com/@newauthor https://instagram.com/known', 'Супольнасць', 'pending', '2026-01-01');`);
sql.exec(readFileSync(new URL('../drizzle/0009_social_discovery.sql', import.meta.url), 'utf8'));
const db = {
  prepare(query) {
    let values = [];
    return { bind(...args) { values = args; return this; }, async all() { return { results: sql.prepare(query).all(...values) }; }, async run() { return sql.prepare(query).run(...values); } };
  },
  async batch(statements) {
    sql.exec('BEGIN');
    try { const results = []; for (const stmt of statements) results.push(await stmt.run()); sql.exec('COMMIT'); return results; }
    catch (e) { sql.exec('ROLLBACK'); throw e; }
  },
};
const modules = {
  'cloudflare:workers': { env: {} },
  '@/lib/submissions': { submissionsDb: () => db },
  '@/lib/channel-identity': { staticChannelIdentities: new Set(['instagram:known']), staticYoutubeChannels: [], channelIdentity: (s) => core.socialProfile(s)?.canonical_key },
  '@/lib/social-discovery-core': core,
  '@/lib/refresh-profile': { refreshProfile: async () => ({}) },
};
const service = load('../lib/social-discovery.ts', modules, process.argv.includes('--live') ? setTimeout : (cb) => { cb(); return 0; });
const route = load('../app/api/social-discovery/route.ts', { ...modules, '@/lib/social-discovery': service });
const actualFetch = globalThis.fetch;
if (!process.argv.includes('--live')) globalThis.fetch = async (url) => Response.json(String(url).includes('/release/?') ? {
  count: 1, releases: [{ id: '11111111-1111-1111-1111-111111111111', title: 'Беларуская песня', 'artist-credit': [{ artist: { id: '22222222-2222-2222-2222-222222222222', name: 'Спявак' } }] }],
} : { name: 'Спявак', relations: [{ url: { resource: 'https://open.spotify.com/artist/Ab12345678901234567890' } }] });
const result = await service.runSocialDiscovery();
assert.equal(sql.prepare("SELECT count(*) AS n FROM submissions WHERE status = 'approved'").get().n, 0, 'Discovery never publishes');
assert.ok(result.found >= 3);
assert.equal(sql.prepare("SELECT count(*) AS n FROM social_candidates WHERE canonical_key = 'instagram:known'").get().n, 0);
const request = (body, owner = true, origin) => new Request('https://stage.test/api/social-discovery', { method: 'POST', headers: { 'content-type': 'application/json', ...(owner ? { 'oai-authenticated-user-email': 'radziuk219@gmail.com' } : {}), ...(origin ? { origin } : {}) }, body: JSON.stringify(body) });
const candidate = sql.prepare("SELECT * FROM social_candidates WHERE platform = 'Instagram'").get();
assert.equal((await route.GET(new Request('https://stage.test/api/social-discovery'))).status, 403);
assert.equal((await route.POST(request({ action: 'run' }, false))).status, 403);
assert.equal((await route.POST(request({ action: 'run' }, true, 'https://evil.test'))).status, 403);
assert.equal((await route.POST(request({ id: candidate.id, status: 'approved', title: 'Name' }))).status, 400);
assert.equal((await route.POST(request({ id: candidate.id, status: 'approved', title: 'Name', languageConfirmed: 'true' }))).status, 400);
assert.throws(() => sql.prepare("UPDATE social_candidates SET status = 'approved' WHERE id = ?").run(candidate.id));
assert.equal((await route.POST(request({ id: candidate.id, status: 'approved', title: 'Правераная назва', description: 'Апісанне', languageConfirmed: true }))).status, 200);
assert.equal(sql.prepare('SELECT title FROM submissions WHERE id = ?').get(candidate.id).title, 'Правераная назва');
assert.equal((await route.POST(request({ id: candidate.id, status: 'approved', title: 'Name', languageConfirmed: true }))).status, 409);
const rejected = sql.prepare("SELECT * FROM social_candidates WHERE platform = 'Twitch'").get();
assert.equal((await route.POST(request({ id: rejected.id, status: 'rejected' }))).status, 200);
sql.exec("UPDATE social_discovery_state SET lease_until = ''");
const repeated = await service.runSocialDiscovery();
assert.equal(sql.prepare('SELECT status FROM social_candidates WHERE id = ?').get(rejected.id).status, 'rejected');
assert.equal(sql.prepare("SELECT count(*) AS n FROM submissions WHERE status = 'approved'").get().n, 1);
sql.exec("UPDATE social_discovery_state SET lease_until = '9999-01-01'");
await assert.rejects(service.runSocialDiscovery(), /ужо працуе/);
globalThis.fetch = actualFetch;
console.log(JSON.stringify({ passed: true, firstRun: result, repeatRun: repeated, candidates: sql.prepare('SELECT platform, title, status FROM social_candidates').all() }, null, 2));
