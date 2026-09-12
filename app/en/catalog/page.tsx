import Catalog from '@/components/catalog-client';
import {LanguageProvider} from '@/components/language';
import {pageMetadata} from '@/lib/seo';
export const metadata=pageMetadata('en',true);
export default function Page(){return <LanguageProvider locale="en"><Catalog/></LanguageProvider>}
