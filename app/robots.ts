import type { MetadataRoute } from 'next';
import { IS_STAGING, SITE_ORIGIN } from '@/lib/site-config';
export default function robots(): MetadataRoute.Robots { return { rules: IS_STAGING ? { userAgent: '*', disallow: '/' } : { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }, sitemap: SITE_ORIGIN + '/sitemap.xml' }; }
