import Home from '@/components/home-client';
import { LanguageProvider } from '@/components/language';
import { pageMetadata, websiteStructuredData } from '@/lib/seo';
import { SeoJsonLd } from '@/components/seo-json-ld';
export const metadata = pageMetadata('uk');
export default function Page() { return <><SeoJsonLd data={websiteStructuredData('uk')} /><LanguageProvider locale="uk"><div lang="uk"><Home /></div></LanguageProvider></>; }
