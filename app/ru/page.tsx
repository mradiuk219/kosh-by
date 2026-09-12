import Home from '@/components/home-client';
import { LanguageProvider } from '@/components/language';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata('ru');
export default function Page() { return <LanguageProvider locale="ru"><div lang="ru"><Home /></div></LanguageProvider>; }
