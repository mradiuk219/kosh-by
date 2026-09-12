import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SITE_ORIGIN } from '@/lib/site-config';
import { headers } from 'next/headers';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: 'КОШ — беларускі кантэнт у адным кошы',
  description: 'Відэа, падкасты, аўтары і гісторыі па-беларуску.',
  openGraph: {
    title: 'КОШ — беларускі кантэнт у адным кошы',
    description: 'Відэа, падкасты, аўтары і гісторыі па-беларуску.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'КОШ — беларускі кантэнт у адным кошы' }],
    locale: 'be_BY',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'КОШ — беларускі кантэнт у адным кошы',
    description: 'Відэа, падкасты, аўтары і гісторыі па-беларуску.',
    images: ['/og.png'],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestedLocale = (await headers()).get('x-kosh-locale');
  const locale = requestedLocale === 'ru' || requestedLocale === 'uk' || requestedLocale === 'en' ? requestedLocale : 'be';
  return <html lang={locale} className="dark"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}
