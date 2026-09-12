import Catalog from '@/components/catalog-client';
import { LanguageProvider } from '@/components/language';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata('uk', true);
export default function Page() { return <LanguageProvider locale="uk"><div lang="uk"><Catalog /></div></LanguageProvider>; }
