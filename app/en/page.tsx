import Home from '@/components/home-client';
import {LanguageProvider} from '@/components/language';
import {pageMetadata,websiteStructuredData} from '@/lib/seo';
import {SeoJsonLd} from '@/components/seo-json-ld';
export const metadata=pageMetadata('en');
export default function Page(){return <><SeoJsonLd data={websiteStructuredData('en')}/><LanguageProvider locale="en"><Home/></LanguageProvider></>}
