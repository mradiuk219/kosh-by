import { env } from 'cloudflare:workers';
import { submissionsDb } from '@/lib/submissions';
import { channelIdentity, staticChannelIdentities, staticYoutubeChannels } from '@/lib/channel-identity';
import { socialLinks, type SocialCandidate } from '@/lib/social-discovery-core';

type Seed = { url: string; title: string; description: string; category: string };
type Artist = { id: string; name: string; relations?: { url?: { resource?: string } }[] };
type Release = { id: string; title: string; 'artist-credit'?: { artist?: Artist }[] };
type YoutubeChannel = { id: string; snippet?: { title?: string; description?: string } };
const uuid = /^[a-f0-9-]{36}$/i;

async function json<T>(url: string, music = false): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000), headers: music ? { 'User-Agent': 'KOSH-Staging/1.0 (https://belaruski-kosh.org)', Accept: 'application/json' } : {} });
  if (!response.ok) throw new Error(`${music ? 'MusicBrainz' : 'YouTube'}: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function runSocialDiscovery() {
  const db = submissionsDb();
  const now = new Date().toISOString();
  await db.prepare("INSERT OR IGNORE INTO social_discovery_state (id, lease_until) VALUES ('main', '')").run();
  const lease = new Date(Date.now() + 300_000).toISOString();
  const lock = await db.prepare("UPDATE social_discovery_state SET lease_until = ? WHERE id = 'main' AND lease_until < ? RETURNING youtube_offset, music_offset").bind(lease, now).all<{ youtube_offset: number; music_offset: number }>();
  const state = lock.results?.[0];
  if (!state) throw new Error('Пошук ужо працуе. Паспрабуйце пазней.');
  const runId = crypto.randomUUID();
  let found = 0;
  const warnings: string[] = [];
  let successes = 0;
  try {
    await db.prepare("UPDATE social_discovery_runs SET status = 'failed', error = 'Папярэдні пошук перарваўся', finished_at = ? WHERE status = 'running'").bind(now).run();
    await db.prepare("INSERT INTO social_discovery_runs (id, status, started_at) VALUES (?, 'running', ?)").bind(runId, now).run();
    const submissions = await db.prepare('SELECT url, title, description, category, canonical_key FROM submissions').all<Seed & { canonical_key: string | null }>();
    // Include rejected/removed identities: discovery must not resurrect moderation decisions.
    const overrides = await db.prepare('SELECT canonical_key FROM catalog_overrides').all<{ canonical_key: string }>();
    const known = new Set([...staticChannelIdentities, ...(submissions.results ?? []).map((s) => s.canonical_key ?? channelIdentity(s.url)), ...(overrides.results ?? []).map((s) => s.canonical_key)]);
    const existing = await db.prepare('SELECT canonical_key FROM social_candidates').all<{ canonical_key: string }>();
    for (const row of existing.results ?? []) known.add(row.canonical_key);
    const save = async (seed: Seed, sourceLabel: string, evidence: string, text = seed.description ?? '') => {
      for (const profile of socialLinks(text)) {
        if (known.has(profile.canonical_key)) continue;
        const inserted = await db.prepare(`INSERT OR IGNORE INTO social_candidates
          (id, canonical_key, platform, url, title, description, category, source_url, source_label, language_evidence, discovered_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`)
          .bind(crypto.randomUUID(), profile.canonical_key, profile.platform, profile.url,
            sourceLabel === 'MusicBrainz' ? seed.title.slice(0, 200) : profile.fallbackTitle,
            '', profile.platform === 'Spotify' ? 'Музыка' : seed.category || 'Супольнасць', seed.url,
            `${sourceLabel}: ${seed.title}`.slice(0, 300), evidence.slice(0, 1500), now).all<{ id: string }>();
        found += inserted.results?.length ?? 0;
        known.add(profile.canonical_key);
      }
    };
    const stored = await db.prepare("SELECT url, title, description, category FROM youtube_candidates WHERE status != 'rejected' ORDER BY discovered_at DESC").all<Seed>();
    const approved = await db.prepare("SELECT url, title, description, category FROM submissions WHERE status = 'approved' AND platform = 'YouTube' ORDER BY id").all<Seed>();
    const seeds = [...(approved.results ?? []), ...(stored.results ?? [])];
    for (const seed of seeds) await save(seed, 'YouTube', 'Спасылка з апісання беларускамоўнага YouTube-канала. Мову і прыналежнасць звязанага акаўнта трэба праверыць асобна.');
    if (seeds.length) successes++;

    const key = (env as unknown as { YOUTUBE_API_KEY?: string }).YOUTUBE_API_KEY;
    if (key) {
      try {
        const allSeeds = [...new Map([...seeds, ...staticYoutubeChannels.map((s) => ({ url: `https://www.youtube.com/@${s.handle}`, title: s.title, description: '', category: 'Супольнасць' }))].map((s) => [channelIdentity(s.url), s])).values()];
        const start = state.youtube_offset < allSeeds.length ? state.youtube_offset : 0;
        const batch = allSeeds.slice(start, start + 12);
        for (const seed of batch) {
          const identity = channelIdentity(seed.url);
          if (!identity?.startsWith('youtube:')) continue;
          const account = identity.slice(8);
          const params = new URLSearchParams({ part: 'snippet', key });
          if (account.startsWith('channel/')) {
            // Preserve case-sensitive YouTube IDs from the original URL.
            params.set('id', new URL(seed.url).pathname.split('/')[2]);
          } else if (account.startsWith('user/')) params.set('forUsername', account.slice(5));
          else if (!account.includes('/')) params.set('forHandle', account);
          else continue;
          const result = await json<{ items?: YoutubeChannel[] }>(`https://www.googleapis.com/youtube/v3/channels?${params}`);
          const item = result.items?.[0];
          if (item?.snippet) await save({ ...seed, description: item.snippet.description ?? '' }, 'YouTube', 'Спасылка з актуальнага апісання YouTube-канала. Гэта падказка, а не пацверджанне мовы новага акаўнта.');
        }
        await db.prepare("UPDATE social_discovery_state SET youtube_offset = ? WHERE id = 'main'").bind(start + batch.length >= allSeeds.length ? 0 : start + batch.length).run();
        successes++;
      } catch (error) { warnings.push(error instanceof Error ? error.message : 'YouTube недаступны'); }
    } else warnings.push('Няма ключа YouTube: правераныя толькі ўжо захаваныя апісанні.');

    try {
      // Public metadata, no Spotify credentials or platform scraping. One request per >1 second.
      const params = new URLSearchParams({ query: 'lang:bel', fmt: 'json', limit: '6', offset: String(state.music_offset) });
      const result = await json<{ releases?: Release[]; count: number }>(`https://musicbrainz.org/ws/2/release/?${params}`, true);
      const artists = new Map<string, { artist: Artist; release: Release }>();
      for (const release of result.releases ?? []) for (const credit of release['artist-credit'] ?? []) {
        if (credit.artist && uuid.test(credit.artist.id) && credit.artist.name !== 'Various Artists') artists.set(credit.artist.id, { artist: credit.artist, release });
      }
      for (const { artist, release } of [...artists.values()].slice(0, 8)) {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        const info = await json<Artist>(`https://musicbrainz.org/ws/2/artist/${artist.id}?inc=url-rels&fmt=json`, true);
        const text = (info.relations ?? []).map((r) => r.url?.resource ?? '').join('\n');
        await save({ url: `https://musicbrainz.org/artist/${artist.id}`, title: info.name, description: '', category: 'Музыка' }, 'MusicBrainz', `Рэліз «${release.title}» пазначаны мовай bel: https://musicbrainz.org/release/${release.id}. Гэта мова метаданых рэлізу, не гарантыя мовы песень. Праверце беларускамоўныя творы і мову сацыяльнага акаўнта.`, text);
      }
      const next = state.music_offset + (result.releases?.length ?? 0);
      await db.prepare("UPDATE social_discovery_state SET music_offset = ? WHERE id = 'main'").bind(next >= result.count || !result.releases?.length ? 0 : next).run();
      successes++;
    } catch (error) { warnings.push(error instanceof Error ? error.message : 'MusicBrainz недаступны'); }
    const status = warnings.length ? (successes ? 'partial' : 'failed') : 'complete';
    await db.prepare('UPDATE social_discovery_runs SET status = ?, found_count = ?, error = ?, finished_at = ? WHERE id = ?').bind(status, found, warnings.join(' ') || null, new Date().toISOString(), runId).run();
    return { found, status, warnings };
  } catch (error) {
    await db.prepare("UPDATE social_discovery_runs SET status = 'failed', found_count = ?, error = ?, finished_at = ? WHERE id = ?").bind(found, 'Пошук перарваўся. Ужо знойдзеныя кандыдаты захаваныя.', new Date().toISOString(), runId).run();
    throw error;
  } finally {
    // Short cooldown also keeps sequential MusicBrainz runs below its rate limit.
    await db.prepare("UPDATE social_discovery_state SET lease_until = ? WHERE id = 'main' AND lease_until = ?").bind(new Date(Date.now() + 2000).toISOString(), lease).run();
  }
}

export type { SocialCandidate };
