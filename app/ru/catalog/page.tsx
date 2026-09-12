import Catalog from '@/components/catalog-client';
import { LanguageProvider } from '@/components/language';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata('ru', true);
export default function Page() { return <LanguageProvider locale="ru"><div lang="ru"><Catalog /></div></LanguageProvider>; }
