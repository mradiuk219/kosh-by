'use client';
import {catalogPlatforms,readCatalogState,catalogHref,type SortKey} from '@/lib/catalog-state';
import { useLanguage, LanguageSwitch } from '@/components/language';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseCategories } from '@/lib/categories';
import { mediaKey } from '@/lib/media-data';
import { fetchCatalogData, MediaCard, media, type Media } from './home-client';

const platforms = catalogPlatforms;

export default function CatalogPage() {
  const { t, locale, path } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [category, setCategory] = useState('Усе катэгорыі');
  const [sort, setSort] = useState<SortKey>('popular');
  const [catalogItems, setCatalogItems] = useState<Media[]>(media);
  const [restored,setRestored] = useState(false);
  const returnTo = catalogHref(path('/catalog'),{query,platform:selectedPlatform,category,sort});

  useEffect(() => {
    const restore = () => {
      const saved=readCatalogState(window.location.search);
      setQuery(saved.query); setSelectedPlatform(saved.platform);
      setCategory(saved.category); setSort(saved.sort); setRestored(true);
    };
    restore();
    window.addEventListener('popstate',restore);
    window.addEventListener('pageshow',restore);
    return () => {window.removeEventListener('popstate',restore);window.removeEventListener('pageshow',restore);};
  },[]);
  useEffect(() => {
    if(restored && window.location.pathname+window.location.search !== returnTo)
      window.history.replaceState(window.history.state,'',returnTo+window.location.hash);
  },[returnTo,restored]);

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
        `${item.title} ${item.creator} ${item.category} ${parseCategories(item.category).map(t).join(' ')} ${t(item.platform)}`
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
        (b.subscriberCount ?? 0) - (a.subscriberCount ?? 0) ||
        Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
        a.title.localeCompare(b.title, 'be')
      );
    });
  }, [catalogItems, category, query, selectedPlatform, sort, locale]);

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
            href={path('/')}
            className="text-2xl font-black tracking-[-0.06em] text-white"
            aria-label={t("КОШ — галоўная")}
          >{t("КОШ")}<span className="text-primary">.</span>
          </a>
          <span className="hidden text-sm text-white/35 sm:block">{t("/ Каталог")}</span>
          <Button
            render={<a href={path('/')} />}
            variant="ghost"
            className="ml-auto rounded-full text-white/65"
          >
            <ArrowLeft className="size-4" />{t("На галоўную")}</Button>
          <LanguageSwitch />
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-10 lg:px-10">
        <div className="mb-9 max-w-3xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">{t("Увесь КОШ")}</p>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("Каталог беларускага кантэнту")}</h1>
          <p className="mt-4 text-white/55">{t("Шукай каналы, фільмы і кнігі па назве, аўтару або тэме")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="h-fit space-y-7 lg:sticky lg:top-28">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold">
                <SlidersHorizontal className="size-4 text-secondary" />{t("Фільтры")}</h2>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-white/45"
                >
                  <X className="size-3.5" />{t("Скінуць")}</Button>
              )}
            </div>

            <div>
              <label
                htmlFor="catalog-search"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/45"
              >{t("Пошук")}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                <Input
                  id="catalog-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("Назва або тэма")}
                  className="h-11 border-white/10 bg-white/5 pl-9"
                />
              </div>
            </div>

            <fieldset>
              <legend className="mb-3 text-xs font-bold uppercase tracking-wider text-white/45">{t("Платформа")}</legend>
              <div className="flex flex-wrap gap-2 lg:grid">
                {platforms.map((platform) => (
                  <Button
                    key={t(platform)}
                    aria-pressed={selectedPlatform === platform}
                    variant="outline"
                    onClick={() => togglePlatform(platform)}
                    className={`justify-start rounded-xl transition ${selectedPlatform === platform ? 'border-primary bg-primary font-bold text-white shadow-[0_0_0_3px_rgba(230,72,42,.24),0_8px_24px_rgba(230,72,42,.28)] hover:border-primary hover:bg-primary/90' : 'border-white/10 bg-white/4 text-white/65 hover:bg-white/8'}`}
                  >
                    {t(platform)}
                  </Button>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/45"
              >{t("Катэгорыя")}</label>
              <select
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#151b24] px-3 text-sm text-white outline-none focus:border-secondary/60"
              >
                {categories.map((name) => (
                  <option key={name} value={name}>{t(name)}</option>
                ))}
              </select>
            </div>
          </aside>

          <section>
            <div className="mb-6 flex flex-col gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/50">
                <strong className="text-white">{results.length}</strong>{' '}
                {t(results.length === 1 ? 'вынік' : 'вынікаў')}
              </p>
              <label className="flex items-center gap-3 text-sm text-white/50">{t("Сартаваць")}<select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="h-10 rounded-xl border border-white/10 bg-[#151b24] px-3 text-sm text-white outline-none focus:border-secondary/60"
                >
                  <option value="popular">{t("Па папулярнасці")}</option>
                  <option value="az">{t("Назва: А–Я")}</option>
                  <option value="za">{t("Назва: Я–А")}</option>
                  <option value="newest">{t("Спачатку новыя")}</option>
                  <option value="platform">{t("Па платформе")}</option>
                </select>
              </label>
            </div>

            {results.length ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {results.map((item) => (
                  <MediaCard
                    key={mediaKey(item)}
                    item={item}
                    fluid
                    destination="author"
                    catalogReturnTo={returnTo}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/12 px-6 py-20 text-center">
                <Search className="mx-auto mb-4 size-7 text-white/30" />
                <h2 className="font-bold">{t("Нічога не знайшлося")}</h2>
                <p className="mt-2 text-sm text-white/45">{t("Змяні фільтры або скінь іх.")}</p>
                <Button
                  variant="link"
                  onClick={resetFilters}
                  className="mt-2 text-secondary"
                >{t("Скінуць фільтры")}</Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
