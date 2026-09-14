import Home from '@/components/home-client';
import { LanguageProvider } from '@/components/language';
import { pageMetadata, websiteStructuredData } from '@/lib/seo';
import { SeoJsonLd } from '@/components/seo-json-ld';
export const metadata = pageMetadata('ru');
export default function Page() { return <><SeoJsonLd data={websiteStructuredData('ru')} /><LanguageProvider locale="ru"><div lang="ru"><Home /></div></LanguageProvider></>; }
