'use client';
import { createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { localizedPath, locales, type Locale } from '@/lib/locale';
import { ru } from '@/lib/translations';
import { uk } from '@/lib/translations-uk';
import { en } from '@/lib/translations-en';
import VisitTracker from './visit-tracker';
import { Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem } from './ui/dropdown-menu';

const LanguageContext = createContext<Locale>('be');
export function LanguageProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return <LanguageContext.Provider value={locale}>{children}<VisitTracker /></LanguageContext.Provider>;
}
export function useLanguage() {
  const locale = useContext(LanguageContext);
  const dictionary = locale === 'uk' ? uk : locale === 'en' ? en : locale === 'ru' ? ru : {};
  return { locale, t: (text: string) => dictionary[text.replace(/\s+/g, ' ').trim()] ?? text, path: (p: string) => localizedPath(locale, p) };
}
export function LanguageSwitch() {
  const { locale, t } = useLanguage();
  const pathname = usePathname() || '/';
  const base = pathname.replace(/^\/(ru|uk|en)(?=\/|$)/, '') || '/';
  return <DropdownMenu>
    <DropdownMenuTrigger aria-label={t('Налады мовы')} title={t('Налады')} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/45 transition hover:bg-white/5 hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50">
      <Settings className="size-4" strokeWidth={1.5} aria-hidden="true" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={10} className="w-44 border border-white/10 bg-[#20252c] p-1.5 text-white shadow-lg ring-0">
      <DropdownMenuGroup>
        <DropdownMenuLabel className="px-2 py-2 text-white/45">{t('Мова сайта')}</DropdownMenuLabel>
        {locales.map((language) => <DropdownMenuItem key={language}
          render={<a href={localizedPath(language, base)} hrefLang={language} lang={language} aria-current={locale === language ? 'page' : undefined} />}
          onClick={() => { try { localStorage.setItem('kosh-language', language); } catch {} }}
          className={`cursor-pointer px-2 py-2 text-white/75 focus:bg-white/10 focus:text-white data-highlighted:bg-white/10 ${locale === language ? 'bg-white/10 text-white' : ''}`}>
          {{be: 'Беларуская', uk: 'Українська', en: 'English', ru: 'Русский'}[language]}
        </DropdownMenuItem>)}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}
