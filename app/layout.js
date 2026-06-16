import {
  Inter,
  Poppins,
  Roboto,
  DM_Sans,
  Nunito_Sans,
  Plus_Jakarta_Sans,
  Noto_Sans_Devanagari,
} from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import './home.css';
import { Toaster } from '@/components/ui/sonner';

// Each font exposes a CSS variable so client components can switch at runtime
const inter         = Inter         ({ subsets: ['latin'],      weight: ['300','400','500','600','700','800'], variable: '--font-inter',         display: 'swap' });
const poppins       = Poppins       ({ subsets: ['latin'],      weight: ['300','400','500','600','700','800'], variable: '--font-poppins',       display: 'swap' });
const roboto        = Roboto        ({ subsets: ['latin'],      weight: ['300','400','500','700','900'],       variable: '--font-roboto',        display: 'swap' });
const dmSans        = DM_Sans       ({ subsets: ['latin'],      weight: ['300','400','500','600','700'],       variable: '--font-dm-sans',       display: 'swap' });
// const nunitoSans    = Nunito_Sans   ({ subsets: ['latin'],      weight: ['300','400','600','700','800'],       variable: '--font-nunito-sans',   display: 'swap' });
const plusJakarta   = Plus_Jakarta_Sans({ subsets: ['latin'],   weight: ['300','400','500','600','700'],       variable: '--font-plus-jakarta',  display: 'swap' });

// Pre-load Hindi script — used when selectedLanguage === 'hi'
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-devanagari',
  display: 'swap',
});

export const metadata = {
  title: 'KhabarON - Your Daily News Source',
  description: 'Stay informed with the latest news across politics, sports, business, entertainment, and technology.',
    manifest: '/site.webmanifest',
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
        <Script
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1008647598112103"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
