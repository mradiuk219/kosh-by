import { env } from 'cloudflare:workers';
import { submissionsDb } from '@/lib/submissions';

export type CultureCandidate = {
  id: string;
  canonical_key: string;
  kind: 'movie' | 'book';
  title: string;
  release_year: number;
  author: string;
  description: string;
  url: string;
  banner_source_url: string | null;
  source_label: string;
  status: 'pending' | 'approved' | 'rejected';
  discovered_at: string;
  reviewed_at: string | null;
};
type CandidateSeed = Omit<CultureCandidate, 'id' | 'status' | 'discovered_at' | 'reviewed_at'>;
type CultureDatabase = ReturnType<typeof submissionsDb>;
type SeedBatch = { items: CandidateSeed[]; next: number };
type SourceJob = {
  key: string;
  label: string;
  initial: number;
  load: (cursor: number) => Promise<SeedBatch>;
};

const headers = {
  'User-Agent': 'KOSH/1.0 (https://belaruski-kosh.org)',
  Accept: 'text/html,application/json',
};
const batchSize = 6;

const decode = (value: string) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(parseInt(number, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
const clean = (value: string) => decode(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
const unique = <T>(values: T[]) => [...new Set(values)];
const absolute = (value: string, base: string) => new URL(decode(value), base).toString();
const fingerprint = (kind: CandidateSeed['kind'], title: string) =>
  `${kind}:${clean(title).toLocaleLowerCase('be').replace(/[^\p{L}\p{N}]+/gu, '')}`;

async function requestText(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${new URL(url).hostname}: ${response.status}`);
  const body = await response.text();
  if (body.length > 2_500_000) throw new Error('Адказ крыніцы занадта вялікі');
  return body;
}
async function requestJson<T>(url: string, init?: RequestInit) {
  return JSON.parse(await requestText(url, init)) as T;
}
function attr(html: string, key: string) {
  const escaped = key.replace(':', '\\:');
  const match =
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i')) ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'));
  return match ? decode(match[1]) : '';
}
function titlePart(html: string) {
  return clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
}
function yearFrom(value: string) {
  const years = [...value.matchAll(/\b(19\d{2}|20\d{2})\b/g)].map((match) => Number(match[1]));
  return years.at(-1) ?? new Date().getFullYear();
}
function splitTitleAuthor(value: string, fallback: string) {
  const normalized = clean(value);
  const separator = Math.max(normalized.lastIndexOf(' — '), normalized.lastIndexOf(' - '));
  if (separator > 0) {
    return {
      title: normalized.slice(0, separator).trim(),
      author: normalized.slice(separator + 3).trim() || fallback,
    };
  }
  return { title: normalized, author: fallback };
}
function nextOffset(cursor: number, consumed: number, total: number) {
  return !consumed || cursor + consumed >= total ? 0 : cursor + consumed;
}
async function detail(url: string) {
  const html = await requestText(url);
  return {
    html,
    title: attr(html, 'og:title') || titlePart(html),
    description: attr(html, 'og:description') || attr(html, 'description'),
    banner: attr(html, 'og:image') || null,
    year: yearFrom(html),
  };
}

async function kinakipaSeeds(offset: number): Promise<SeedBatch> {
  const home = await requestText('https://new.kinakipa.site/');
  const ids = unique([...home.matchAll(/href=["']\/movie\?id=(\d+)/gi)].map((match) => match[1]));
  const start = offset < ids.length ? offset : 0;
  const selected = ids.slice(start, start + batchSize);
  const results = await Promise.all(selected.map(async (id): Promise<CandidateSeed | null> => {
    const url = `https://new.kinakipa.site/movie?id=${id}`;
    const html = await requestText(url);
    const raw = titlePart(html);
    const title = raw.split('|')[0]?.trim() || `Фільм ${id}`;
    const description = attr(html, 'description');
    const banner = attr(html, 'og:image');
    const director = html.match(/director=[^"']+["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!description || !banner) return null;
    return {
      canonical_key: `kinakipa:${id}`,
      kind: 'movie',
      title,
      release_year: yearFrom(raw),
      author: director ? clean(director[1]) : 'Рэжысёр не пазначаны',
      description: description.slice(0, 1600),
      url,
      banner_source_url: banner,
      source_label: 'Kinakipa',
    };
  }));
  return { items: results.filter((item): item is CandidateSeed => Boolean(item)), next: nextOffset(start, selected.length, ids.length) };
}

type GutenbergProduct = {
  id: number;
  name: string;
  permalink: string;
  description: string;
  short_description?: string;
  images?: { src?: string; thumbnail?: string }[];
};
async function gutenbergSeeds(page: number): Promise<SeedBatch> {
  const url = `https://gutenbergpublisher.eu/wp-json/wc/store/v1/products?category=177&per_page=${batchSize}&orderby=date&order=desc&page=${page}`;
  const products = await requestJson<GutenbergProduct[]>(url, { headers: { Accept: 'application/json' } });
  const items = products.map((product): CandidateSeed => {
    const parsed = splitTitleAuthor(product.name, 'Аўтар не пазначаны');
    const body = clean(product.short_description || product.description);
    return {
      canonical_key: `gutenberg:${product.id}`,
      kind: 'book',
      title: parsed.title,
      release_year: yearFrom(body),
      author: parsed.author,
      description: (body || 'Апісанне не пазначана').slice(0, 1600),
      url: product.permalink,
      banner_source_url: product.images?.[0]?.src ?? product.images?.[0]?.thumbnail ?? null,
      source_label: 'Gutenberg Publisher',
    };
  });
  return { items, next: products.length < batchSize ? 1 : page + 1 };
}

type AnibelMedia = {
  mediaId: string;
  slug: string;
  mediaType: 'anime' | 'cinema';
  title: { be: string };
  description: { be: string | null } | null;
  poster: string;
  year: number;
  studio: string | null;
};
async function anibelSeeds(mediaType: 'anime' | 'cinema', offset: number): Promise<SeedBatch> {
  const query = 'query($offset:Int!,$limit:Int!,$mediaType:MediaTypes!){getMediaList(offset:$offset,limit:$limit,mediaType:$mediaType){totalDocs docs{mediaId slug mediaType title{be} description{be} poster year studio}}}';
  const result = await requestJson<{
    data?: { getMediaList?: { totalDocs: number; docs: AnibelMedia[] } };
    errors?: { message: string }[];
  }>('https://anibel.net/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables: { offset, limit: batchSize, mediaType } }),
  });
  if (result.errors?.length) throw new Error(result.errors[0].message);
  const list = result.data?.getMediaList;
  if (!list) throw new Error('Anibel вярнуў пусты адказ');
  const items = list.docs
    .filter((item) => item.title.be && item.description?.be && item.poster)
    .map((item): CandidateSeed => ({
      canonical_key: `anibel:${item.mediaId}`,
      kind: 'movie',
      title: clean(item.title.be),
      release_year: item.year,
      author: clean(item.studio || 'Anibel'),
      description: clean(item.description?.be || '').slice(0, 1600),
      url: `https://anibel.net/${mediaType}/${encodeURIComponent(item.slug)}`,
      banner_source_url: item.poster,
      source_label: 'Anibel',
    }));
  return { items, next: nextOffset(offset, list.docs.length, list.totalDocs) };
}

async function comicsBySeeds(offset: number): Promise<SeedBatch> {
  const home = await requestText('https://comicsby.live/');
  const links = unique(
    [...home.matchAll(/href=["'](https:\/\/comicsby\.live\/manga\/[^"'?#]+\/?)["']/gi)]
      .map((match) => match[1]),
  );
  const start = offset < links.length ? offset : 0;
  const selected = links.slice(start, start + batchSize);
  const items = await Promise.all(selected.map(async (url): Promise<CandidateSeed | null> => {
    const page = await detail(url);
    const title = clean(page.title.replace(/\s+-\s+comicsby\.live.*$/i, ''));
    if (!title || !page.description) return null;
    return {
      canonical_key: `comicsby:${new URL(url).pathname.replace(/^\/manga\/|\/$/g, '')}`,
      kind: 'book',
      title,
      release_year: page.year,
      author: 'ComicsBY',
      description: clean(page.description).slice(0, 1600),
      url,
      banner_source_url: page.banner,
      source_label: 'ComicsBY',
    };
  }));
  return { items: items.filter((item): item is CandidateSeed => Boolean(item)), next: nextOffset(start, selected.length, links.length) };
}

async function knihaukaSeeds(offset: number): Promise<SeedBatch> {
  const home = await requestText('https://knihauka.com/');
  const products = [...home.matchAll(/<div\s+data-product-id=["'](\d+)["'][\s\S]{0,5000}?<a\s+class=["'][^"']*\bprodname\b[^"']*["'][^>]+href=["']([^"']+)["'][^>]+title=["']([^"']+)["']/gi)]
    .map((match) => ({ id: match[1], url: absolute(match[2], 'https://knihauka.com/'), label: decode(match[3]) }));
  const uniqueProducts = [...new Map(products.map((product) => [product.id, product])).values()];
  const start = offset < uniqueProducts.length ? offset : 0;
  const selected = uniqueProducts.slice(start, start + batchSize);
  const items = await Promise.all(selected.map(async (product): Promise<CandidateSeed> => {
    const page = await detail(product.url);
    const parsed = splitTitleAuthor(product.label, 'Аўтар не пазначаны');
    const productBlock = home.match(new RegExp(`data-product-id=["']${product.id}["'][\\s\\S]{0,3500}?<a\\s+class=["'][^"']*\\bprodname\\b`, 'i'))?.[0] ?? '';
    const image = productBlock.match(/(?:data-src|src)=["']([^"']+productGfx[^"']*)["']/i)?.[1];
    return {
      canonical_key: `knihauka:${product.id}`,
      kind: 'book',
      title: parsed.title,
      release_year: page.year,
      author: parsed.author,
      description: clean(page.description || product.label).slice(0, 1600),
      url: product.url,
      banner_source_url: image ? absolute(image, 'https://knihauka.com/') : page.banner,
      source_label: 'Knihauka',
    };
  }));
  return { items, next: nextOffset(start, selected.length, uniqueProducts.length) };
}

type KniganoshaBook = {
  id_tovar: string;
  name_tovar: string;
  img_tovar: string | null;
  author_tovar: string;
  age_tovar: string;
  url_tovar: string;
};
async function kniganoshaSeeds(offset: number): Promise<SeedBatch> {
  const form = new FormData();
  form.set('data', JSON.stringify({ type: 'loadBooks', sort: 'new', stock: 0, not_a: 0 }));
  const result = await requestJson<{ books?: KniganoshaBook[] }>(
    'https://kniganosha.by/application/action/front/catalog.php',
    { method: 'POST', body: form },
  );
  const books = result.books ?? [];
  const start = offset < books.length ? offset : 0;
  const selected = books.slice(start, start + batchSize);
  const items = await Promise.all(selected.map(async (book): Promise<CandidateSeed> => {
    const url = `https://kniganosha.by/catalog/${encodeURIComponent(book.url_tovar)}`;
    const page = await detail(url);
    return {
      canonical_key: `kniganosha:${book.id_tovar}`,
      kind: 'book',
      title: clean(book.name_tovar),
      release_year: Number(book.age_tovar) || page.year,
      author: clean(book.author_tovar || 'Аўтар не пазначаны'),
      description: clean(page.description || book.name_tovar).slice(0, 1600),
      url,
      banner_source_url: book.img_tovar
        ? `https://kniganosha.by/public/images/books/${encodeURIComponent(book.img_tovar)}`
        : page.banner,
      source_label: 'Kniganosha',
    };
  }));
  return { items, next: nextOffset(start, selected.length, books.length) };
}

async function ozSeeds(page: number): Promise<SeedBatch> {
  const url = `https://oz.by/books/topic1114104.html?page=${page}`;
  const html = await requestText(url);
  const cards = [...html.matchAll(/<article[^>]+data-value=["'](\d+)["'][\s\S]{0,5000}?<img[^>]+class=["'][^"']*product-card__cover-image[^"']*["'][^>]+src=["']([^"']+)["'][^>]+alt=["']([^"']+)["'][\s\S]{0,2500}?<a\s+href=["'](https:\/\/oz\.by\/books\/more\d+\.html)["'][\s\S]{0,2500}?<div\s+class=["']product-card__subtitle["']>([^<]*)<\/div>/gi)]
    .slice(0, batchSize)
    .map((match) => ({ id: match[1], image: match[2], title: decode(match[3]), url: match[4], year: Number(clean(match[5])) }));
  const items = await Promise.all(cards.map(async (card): Promise<CandidateSeed> => {
    const product = await detail(card.url);
    return {
      canonical_key: `oz:${card.id}`,
      kind: 'book',
      title: clean(card.title),
      release_year: card.year || product.year,
      author: 'Аўтар не пазначаны',
      description: clean(product.description || card.title).slice(0, 1600),
      url: card.url,
      banner_source_url: card.image || product.banner,
      source_label: 'OZ.by',
    };
  }));
  return { items, next: cards.length < batchSize ? 1 : page + 1 };
}

type KirmaProduct = {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  published_at: string;
  vendor: string;
  images?: { src?: string }[];
};
async function kirmaSeeds(page: number): Promise<SeedBatch> {
  const result = await requestJson<{ products?: KirmaProduct[] }>(
    `https://kirma.sh/collections/knihi/products.json?limit=${batchSize}&page=${page}`,
    { headers: { Accept: 'application/json' } },
  );
  const products = result.products ?? [];
  const items = products.map((product): CandidateSeed => {
    const parsed = splitTitleAuthor(product.title, product.vendor || 'Аўтар не пазначаны');
    return {
      canonical_key: `kirma:${product.id}`,
      kind: 'book',
      title: parsed.title,
      release_year: yearFrom(product.body_html || product.published_at),
      author: parsed.author,
      description: clean(product.body_html || product.title).slice(0, 1600),
      url: `https://kirma.sh/products/${encodeURIComponent(product.handle)}`,
      banner_source_url: product.images?.[0]?.src ?? null,
      source_label: 'Kirma.sh',
    };
  });
  return { items, next: products.length < batchSize ? 1 : page + 1 };
}

async function sourceCursor(db: CultureDatabase, key: string, initial: number) {
  await db.prepare('INSERT OR IGNORE INTO culture_source_state (source_key, cursor) VALUES (?, ?)').bind(key, initial).run();
  const rows = await db.prepare('SELECT cursor FROM culture_source_state WHERE source_key = ?').bind(key).all<{ cursor: number }>();
  return rows.results?.[0]?.cursor ?? initial;
}
async function updateSourceCursor(db: CultureDatabase, key: string, cursor: number) {
  await db.prepare('UPDATE culture_source_state SET cursor = ? WHERE source_key = ?').bind(cursor, key).run();
}

export async function runCultureDiscovery() {
  const db = submissionsDb();
  const now = new Date().toISOString();
  const lease = new Date(Date.now() + 180_000).toISOString();
  await db.prepare("INSERT OR IGNORE INTO culture_discovery_state (id, lease_until) VALUES ('main', '')").run();
  const lock = await db
    .prepare("UPDATE culture_discovery_state SET lease_until = ? WHERE id = 'main' AND lease_until < ? RETURNING movie_offset, book_page")
    .bind(lease, now)
    .all<{ movie_offset: number; book_page: number }>();
  const legacy = lock.results?.[0];
  if (!legacy) throw new Error('Пошук ужо працуе');

  const runId = crypto.randomUUID();
  let found = 0;
  const warnings: string[] = [];
  const jobs: SourceJob[] = [
    { key: 'kinakipa', label: 'Kinakipa', initial: legacy.movie_offset, load: kinakipaSeeds },
    { key: 'anibel_anime', label: 'Anibel (анімэ)', initial: 0, load: (cursor) => anibelSeeds('anime', cursor) },
    { key: 'anibel_cinema', label: 'Anibel (кіно)', initial: 0, load: (cursor) => anibelSeeds('cinema', cursor) },
    { key: 'gutenberg', label: 'Gutenberg Publisher', initial: legacy.book_page, load: gutenbergSeeds },
    { key: 'comicsby', label: 'ComicsBY', initial: 0, load: comicsBySeeds },
    { key: 'knihauka', label: 'Knihauka', initial: 0, load: knihaukaSeeds },
    { key: 'kniganosha', label: 'Kniganosha', initial: 0, load: kniganoshaSeeds },
    { key: 'oz', label: 'OZ.by', initial: 1, load: ozSeeds },
    { key: 'kirma', label: 'Kirma.sh', initial: 1, load: kirmaSeeds },
  ];

  try {
    await db
      .prepare("UPDATE culture_discovery_runs SET status = 'failed', error = 'Папярэдні пошук перарваўся', finished_at = ? WHERE status = 'running'")
      .bind(now)
      .run();
    await db
      .prepare("INSERT INTO culture_discovery_runs (id, status, started_at) VALUES (?, 'running', ?)")
      .bind(runId, now)
      .run();

    const known = new Set<string>();
    const knownTitles = new Set<string>();
    const candidates = await db.prepare('SELECT canonical_key, kind, title FROM culture_candidates').all<{ canonical_key: string; kind: CandidateSeed['kind']; title: string }>();
    const published = await db.prepare('SELECT kind, title FROM culture_items').all<{ kind: CandidateSeed['kind']; title: string }>();
    for (const item of candidates.results ?? []) {
      known.add(item.canonical_key);
      knownTitles.add(fingerprint(item.kind, item.title));
    }
    for (const item of published.results ?? []) knownTitles.add(fingerprint(item.kind, item.title));

    const save = async (seed: CandidateSeed) => {
      const titleKey = fingerprint(seed.kind, seed.title);
      if (known.has(seed.canonical_key) || knownTitles.has(titleKey)) return;
      const inserted = await db
        .prepare('INSERT OR IGNORE INTO culture_candidates (id, canonical_key, kind, title, release_year, author, description, url, banner_source_url, source_label, discovered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id')
        .bind(crypto.randomUUID(), seed.canonical_key, seed.kind, seed.title, seed.release_year, seed.author, seed.description, seed.url, seed.banner_source_url, seed.source_label, now)
        .all();
      found += inserted.results?.length ?? 0;
      known.add(seed.canonical_key);
      knownTitles.add(titleKey);
    };

    for (const job of jobs) {
      try {
        const cursor = await sourceCursor(db, job.key, job.initial);
        const result = await job.load(cursor);
        for (const seed of result.items) await save(seed);
        await updateSourceCursor(db, job.key, result.next);
        if (job.key === 'kinakipa') {
          await db.prepare("UPDATE culture_discovery_state SET movie_offset = ? WHERE id = 'main'").bind(result.next).run();
        } else if (job.key === 'gutenberg') {
          await db.prepare("UPDATE culture_discovery_state SET book_page = ? WHERE id = 'main'").bind(result.next).run();
        }
      } catch (error) {
        warnings.push(`${job.label}: ${error instanceof Error ? error.message : 'крыніца недаступная'}`);
      }
    }

    const status = warnings.length === jobs.length ? 'failed' : warnings.length ? 'partial' : 'complete';
    await db
      .prepare('UPDATE culture_discovery_runs SET status = ?, found_count = ?, error = ?, finished_at = ? WHERE id = ?')
      .bind(status, found, warnings.join(' · ') || null, new Date().toISOString(), runId)
      .run();
    return { found, status, warnings };
  } finally {
    await db
      .prepare("UPDATE culture_discovery_state SET lease_until = ? WHERE id = 'main' AND lease_until = ?")
      .bind(new Date(Date.now() + 2_000).toISOString(), lease)
      .run();
  }
}

export async function copyCandidateBanner(source: string | null) {
  if (!source) return null;
  const url = new URL(source);
  if (url.protocol !== 'https:') return null;
  const response = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(15_000) });
  if (!response.ok || !response.body) return null;
  const length = Number(response.headers.get('content-length') || 0);
  if (length > 4_000_000) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > 4_000_000) return null;
  const type = response.headers.get('content-type')?.split(';')[0];
  if (!type || !['image/png', 'image/jpeg', 'image/webp'].includes(type)) return null;
  const id = crypto.randomUUID();
  await (env as unknown as { LOGOS: R2Bucket }).LOGOS.put(`culture-${id}`, bytes, { httpMetadata: { contentType: type } });
  return `/api/culture-banner?id=${id}`;
}
