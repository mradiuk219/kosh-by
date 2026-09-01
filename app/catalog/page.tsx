'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseCategories } from '@/lib/categories';
import { fetchCatalogData, MediaCard, media, type Media } from '../page';

const platforms = ['YouTube', 'Instagram', 'TikTok', 'Twitch', 'Spotify'];
type SortKey = 'popular' | 'az' | 'za' | 'newest' | 'platform';

export default function CatalogPage() {
  const [query, setQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [category, setCategory] = useState('Усе катэгорыі');
  const [sort, setSort] = useState<SortKey>('popular');
  const [catalogItems, setCatalogItems] = useState<Media[]>(media);

  useEffect(() => {
    let active = true;
    void fetchCatalogData().then(({ catalog }) => {
      if (!active) return;
      setCatalogItems(catalog);
    });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => [
      'Усе катэгорыі',
      ...Array.from(
        new Set(catalogItems.flatMap((item) => parseCategories(item.category))),
      ).sort((a, b) => a.localeCompare(b, 'be')),
    ],
    [catalogItems],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = catalogItems.filter((item) => {
      const matchesPlatform =
        !selectedPlatform || item.platform === selectedPlatform;
      const matchesCategory =
        category === 'Усе катэгорыі' ||
        parseCategories(item.category).some(
          (itemCategory) =>
            itemCategory.localeCompare(category, 'be', {
              sensitivity: 'base',
            }) === 0,
        );
      const matchesQuery =
        !needle ||
        `${item.title} ${item.creator} ${item.category} ${item.platform}`
          .toLowerCase()
          .includes(needle);
      return matchesPlatform && matchesCategory && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'az') return a.title.localeCompare(b.title, 'be');
      if (sort === 'za') return b.title.localeCompare(a.title, 'be');
      if (sort === 'newest')
        return (
          (b.addedAt ?? '').localeCompare(a.addedAt ?? '') ||
          a.title.localeCompare(b.title, 'be')
        );
      if (sort === 'platform')
        return (
          a.platform.localeCompare(b.platform, 'be') ||
          a.title.localeCompare(b.title, 'be')
        );
      return (
        Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
        a.title.localeCompare(b.title, 'be')
      );
    });
  }, [catalogItems, category, query, selectedPlatform, sort]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatform((current) => (current === platform ? '' : platform));
  };

  const resetFilters = () => {
    setQuery('');
    setSelectedPlatform('');
    setCategory('Усе катэгорыі');
  };

  const hasFilters = Boolean(
    query || selectedPlatform || category !== 'Усе катэгорыі',
  );

  return (
    <main className="site-shell min-h-screen text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#111821]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1500px] items-center gap-5 px-5 lg:px-10">
          <a
            href="/"
            className="text-2xl font-black tracking-[-0.06em] text-white"
            aria-label="КОШ — галоўная"
          >
            КОШ<span className="text-primary">.</span>
          </a>
          <span className="hidden text-sm text-white/35 sm:block">
            / Каталог
          </span>
          <Button
            render={<a href="/" />}
            variant="ghost"
            className="ml-auto rounded-full text-white/65"
          >
            <ArrowLeft className="size-4" /> На галоўную
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-10 lg:px-10">
        <div className="mb-9 max-w-3xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            Увесь КОШ
          </p>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Каталог беларускага кантэнту
          </h1>
          <p className="mt-4 text-white/55">
            Шукай аўтараў па платформе і тэме
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="h-fit space-y-7 lg:sticky lg:top-28">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold">
                <SlidersHorizontal className="size-4 text-secondary" /> Фільтры
              </h2>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-white/45"
                >
                  <X className="size-3.5" /> Скінуць
                </Button>
              )}
            </div>

            <div>
              <label
                htmlFor="catalog-search"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/45"
              >
                Пошук
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                <Input
                  id="catalog-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Назва або тэма"
                  className="h-11 border-white/10 bg-white/5 pl-9"
                />
              </div>
            </div>

            <fieldset>
              <legend className="mb-3 text-xs font-bold uppercase tracking-wider text-white/45">
                Платформа
              </legend>
              <div className="flex flex-wrap gap-2 lg:grid">
                {platforms.map((platform) => (
                  <Button
                    key={platform}
                    aria-pressed={selectedPlatform === platform}
                    variant="outline"
                    onClick={() => togglePlatform(platform)}
                    className={`justify-start rounded-xl transition ${selectedPlatform === platform ? 'border-primary bg-primary font-bold text-white shadow-[0_0_0_3px_rgba(230,72,42,.24),0_8px_24px_rgba(230,72,42,.28)] hover:border-primary hover:bg-primary/90' : 'border-white/10 bg-white/4 text-white/65 hover:bg-white/8'}`}
                  >
                    {platform}
                  </Button>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/45"
              >
                Катэгорыя
              </label>
              <select
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#151b24] px-3 text-sm text-white outline-none focus:border-secondary/60"
              >
                {categories.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </div>
          </aside>

          <section>
            <div className="mb-6 flex flex-col gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/50">
                <strong className="text-white">{results.length}</strong>{' '}
                {results.length === 1 ? 'вынік' : 'вынікаў'}
              </p>
              <label className="flex items-center gap-3 text-sm text-white/50">
                Сартаваць
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="h-10 rounded-xl border border-white/10 bg-[#151b24] px-3 text-sm text-white outline-none focus:border-secondary/60"
                >
                  <option value="popular">Па папулярнасці</option>
                  <option value="az">Назва: А–Я</option>
                  <option value="za">Назва: Я–А</option>
                  <option value="newest">Спачатку новыя</option>
                  <option value="platform">Па платформе</option>
                </select>
              </label>
            </div>

            {results.length ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {results.map((item) => (
                  <MediaCard
                    key={`${item.platform}-${item.title}`}
                    item={item}
                    fluid
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/12 px-6 py-20 text-center">
                <Search className="mx-auto mb-4 size-7 text-white/30" />
                <h2 className="font-bold">Нічога не знайшлося</h2>
                <p className="mt-2 text-sm text-white/45">
                  Змяні фільтры або скінь іх.
                </p>
                <Button
                  variant="link"
                  onClick={resetFilters}
                  className="mt-2 text-secondary"
                >
                  Скінуць фільтры
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
