export const locales = ['be', 'uk', 'en', 'ru'] as const;
export type Locale = typeof locales[number];
export const localizedPath = (locale: Locale, path = '/') => locale === 'be' ? path : `/${locale}${path === '/' ? '' : path}`;
export const localeFromPath = (path: string): Locale => locales.find(locale => locale !== 'be' && (path === '/'+locale || path.startsWith('/'+locale+'/'))) ?? 'be';
