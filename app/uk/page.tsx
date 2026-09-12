import Home from '@/components/home-client';
import { LanguageProvider } from '@/components/language';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata('uk');
export default function Page() { return <LanguageProvider locale="uk"><div lang="uk"><Home /></div></LanguageProvider>; }
