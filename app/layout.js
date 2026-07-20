import {
  Inter,
  Poppins,
  Roboto,
  DM_Sans,
  Plus_Jakarta_Sans,
  Noto_Sans_Devanagari,
} from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import './home.css';
import { Toaster } from '@/components/ui/sonner';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import SessionTracker from '@/components/analytics/SessionTracker';
import SiteChromeProvider from '@/components/providers/SiteChromeProvider';
import JsonLd from '@/components/seo/JsonLd';
import { websiteSchema, organizationGraph } from '@/lib/seo/jsonld';
import { SITE, SITE_URL, VERIFICATION } from '@/lib/seo/config';

// Each font exposes a CSS variable so client components can switch at runtime
const inter         = Inter         ({ subsets: ['latin'],      weight: ['300','400','500','600','700','800'], variable: '--font-inter',         display: 'swap' });
const poppins       = Poppins       ({ subsets: ['latin'],      weight: ['300','400','500','600','700','800'], variable: '--font-poppins',       display: 'swap' });
const roboto        = Roboto        ({ subsets: ['latin'],      weight: ['300','400','500','700','900'],       variable: '--font-roboto',        display: 'swap' });
const dmSans        = DM_Sans       ({ subsets: ['latin'],      weight: ['300','400','500','600','700'],       variable: '--font-dm-sans',       display: 'swap' });
const plusJakarta   = Plus_Jakarta_Sans({ subsets: ['latin'],   weight: ['300','400','500','600','700'],       variable: '--font-plus-jakarta',  display: 'swap' });

// Pre-load Hindi script — used when selectedLanguage === 'hi'
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-devanagari',
  display: 'swap',
});

export const metadata = {
  // metadataBase makes every relative OG/canonical URL resolve to the live origin.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} - Latest Hindi & English News`,
    // Page titles become "Story Title | INI KhabarON" automatically.
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    'news', 'latest news', 'breaking news', 'India news', 'Hindi news',
    'politics', 'business', 'sports', 'entertainment', 'technology', 'KhabarON',
  ],
  authors: [{ name: SITE.name, url: SITE_URL }],
  publisher: SITE.name,
  creator: SITE.name,
  category: 'news',
  manifest: '/site.webmanifest',
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [{ url: '/rss.xml', title: `${SITE.name} RSS Feed` }],
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} - Latest Hindi & English News`,
    description: SITE.description,
    url: SITE_URL,
    locale: SITE.locale,
    alternateLocale: SITE.localeAlt,
    images: [{ url: SITE.defaultImage, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.social.twitterHandle,
    creator: SITE.social.twitterHandle,
    title: `${SITE.name} - Latest Hindi & English News`,
    description: SITE.description,
    images: [SITE.defaultImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: VERIFICATION.google || undefined,
    yandex: VERIFICATION.yandex || undefined,
    other: VERIFICATION.bing ? { 'msvalidate.01': VERIFICATION.bing } : undefined,
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#152a58',
};

export default function RootLayout({ children }) {
  const fontVars = [
    inter.variable,
    poppins.variable,
    roboto.variable,
    dmSans.variable,
    // nunitoSans.variable,
    plusJakarta.variable,
    notoDevanagari.variable,
    // inter.className is the default body font
    inter.className,
  ].join(' ');

  return (
    <html lang="en" className={fontVars}>
      <head>
        <meta name="theme-color" content="#152a58" />
        {/* Geo signals for regional news relevance */}
        <meta name="geo.region" content={SITE.geo.region} />
        <meta name="geo.placename" content={SITE.geo.placename} />
        <meta name="og:locale" content={SITE.locale} />
        {/* Site-wide structured data: Organization + WebSite (SearchAction) */}
        <JsonLd data={[organizationGraph(), websiteSchema()]} />
        <Script
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1008647598112103"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <GoogleAnalytics />
        <SessionTracker />
        <SiteChromeProvider>
          {children}
        </SiteChromeProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
