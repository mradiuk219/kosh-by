import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/site-config';
import {publicCatalog} from '@/lib/public-catalog';
import {authorPath} from '@/lib/author-identity';
import {locales,localizedPath} from '@/lib/locale';
import {topicSlugs} from '@/lib/discovery-copy';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const authors=(await publicCatalog()).filter(a=>a.platform==='YouTube').map(a=>authorPath(a.url)).filter((p):p is string=>!!p);
 const paths=['/','/catalog',...topicSlugs.map(s=>'/topics/'+s),...authors];
 return locales.flatMap(locale=>paths.map(path=>({url:SITE_ORIGIN+localizedPath(locale,path)})));
}
