import Home from '@/components/home-client';
import {LanguageProvider} from '@/components/language';
import {pageMetadata} from '@/lib/seo';
export const metadata=pageMetadata('en');
export default function Page(){return <LanguageProvider locale="en"><Home/></LanguageProvider>}
