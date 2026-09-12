import type { Metadata } from 'next';
import { SITE_ORIGIN, IS_STAGING } from './site-config';
import { localizedPath, locales, type Locale } from './locale';
const copy = {
  en: { home: 'KOSH — Belarusian content in one place', catalog: 'Belarusian content catalog — KOSH', description: 'Discover Belarusian-language creators on YouTube, Twitch, Instagram, TikTok and Spotify, plus films and books in Belarusian.', og: 'en_US' },
  be: { home: 'КОШ — беларускі кантэнт у адным кошы', catalog: 'Каталог беларускага кантэнту — КОШ', description: 'Знаходзьце беларускамоўных аўтараў на YouTube, Twitch, Instagram, TikTok і Spotify, фільмы і кнігі па-беларуску.', og: 'be_BY' },
  uk: { home: 'КОШ — білоруський контент в одному місці', catalog: 'Каталог білоруського контенту — КОШ', description: 'Знаходьте білоруськомовних авторів на YouTube, Twitch, Instagram, TikTok і Spotify, фільми й книжки білоруською мовою.', og: 'uk_UA' },
  ru: { home: 'КОШ — белорусский контент в одном месте', catalog: 'Каталог белорусского контента — КОШ', description: 'Находите белорусскоязычных авторов на YouTube, Twitch, Instagram, TikTok и Spotify, фильмы и книги на белорусском языке.', og: 'ru_BY' },
};
export function pageMetadata(locale: Locale, catalog = false): Metadata {
  const path = catalog ? '/catalog' : '/';
  const title = copy[locale][catalog ? 'catalog' : 'home'];
  const description = copy[locale].description;
  return {
    title, description,
    alternates: { canonical: SITE_ORIGIN + localizedPath(locale, path), languages: { ...Object.fromEntries(locales.map(language => [language, SITE_ORIGIN + localizedPath(language, path)])), 'x-default': SITE_ORIGIN + path } },
    robots: IS_STAGING ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title, description, url: SITE_ORIGIN + localizedPath(locale, path), locale: copy[locale].og, alternateLocale: locales.filter(language => language !== locale).map(language => copy[language].og) },
    twitter: { title, description },
  };
}
