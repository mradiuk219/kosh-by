import type { Metadata } from 'next';
import { SITE_ORIGIN, IS_STAGING } from './site-config';
import { localizedPath, locales, type Locale } from './locale';
export const seoCopy = {
  en: { home: 'KOSH — a catalog of Belarusian-language content', catalog: 'Belarusian-language creators, films and books — KOSH catalog', description: 'Discover Belarusian-language content: creators on YouTube, Twitch, Instagram, TikTok and Spotify, plus films, animation and books in Belarusian.', og: 'en_US' },
  be: { home: 'КОШ — каталог беларускамоўнага кантэнту', catalog: 'Беларускамоўны кантэнт: каталог аўтараў, кіно і кніг — КОШ', description: 'Знаходзьце беларускамоўны кантэнт: аўтараў на YouTube, Twitch, Instagram, TikTok і Spotify, фільмы, мультфільмы і кнігі па-беларуску.', og: 'be_BY' },
  uk: { home: 'КОШ — каталог білоруськомовного контенту', catalog: 'Білоруськомовний контент: автори, кіно та книжки — каталог КОШ', description: 'Знаходьте білоруськомовний контент: авторів на YouTube, Twitch, Instagram, TikTok і Spotify, фільми, анімацію та книжки білоруською.', og: 'uk_UA' },
  ru: { home: 'КОШ — каталог белорусскоязычного контента', catalog: 'Белорусскоязычный контент: авторы, кино и книги — каталог КОШ', description: 'Находите белорусскоязычный контент: авторов на YouTube, Twitch, Instagram, TikTok и Spotify, фильмы, мультфильмы и книги на белорусском языке.', og: 'ru_BY' },
};

export function websiteStructuredData(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'КОШ',
    alternateName: seoCopy[locale].home,
    url: SITE_ORIGIN + localizedPath(locale),
    description: seoCopy[locale].description,
    inLanguage: locale,
  };
}
export function pageMetadata(locale: Locale, catalog = false): Metadata {
  const path = catalog ? '/catalog' : '/';
  const title = seoCopy[locale][catalog ? 'catalog' : 'home'];
  const description = seoCopy[locale].description;
  return {
    title, description,
    alternates: { canonical: SITE_ORIGIN + localizedPath(locale, path), languages: { ...Object.fromEntries(locales.map(language => [language, SITE_ORIGIN + localizedPath(language, path)])), 'x-default': SITE_ORIGIN + path } },
    robots: IS_STAGING ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title, description, url: SITE_ORIGIN + localizedPath(locale, path), locale: seoCopy[locale].og, alternateLocale: locales.filter(language => language !== locale).map(language => seoCopy[language].og), images: [{ url: '/og.png', width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
  };
}
