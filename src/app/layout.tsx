import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Navbar } from '@/components/navigation/navbar';
import { ReactQueryProvider } from '@/providers/react-query/react-query-provider';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import NextTopLoader from 'nextjs-toploader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Swap Space - Your Digital Exchange Platform',
    template: '%s | Swap Space',
  },
  description:
    'Swap Space is your premier digital exchange platform. Trade, swap, and exchange items securely with our innovative marketplace solution.',
  keywords: [
    'swap space',
    'digital exchange',
    'marketplace',
    'trading platform',
    'swap items',
    'exchange platform',
    'online trading',
  ],
  authors: [{ name: 'Swap Space Team' }],
  creator: 'Swap Space',
  publisher: 'Swap Space',

  // Open Graph (Facebook, WhatsApp, etc.)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.swap-space-app.com',
    siteName: 'Swap Space',
    title: 'Swap Space - Your Digital Exchange Platform',
    description:
      'Trade, swap, and exchange items securely with our innovative marketplace solution.',
    // images: [
    //   {
    //     url: 'https://www.swap-space-app.com/og-image.jpg', // Add this image later
    //     width: 1200,
    //     height: 630,
    //     alt: 'Swap Space - Digital Exchange Platform',
    //   }
    // ],
  },

  // Twitter Card
  twitter: {
    card: 'summary',
    site: '@swapspace', // Replace with your actual Twitter handle
    creator: '@swapspace',
    title: 'Swap Space - Your Digital Exchange Platform',
    description:
      'Trade, swap, and exchange items securely with our innovative marketplace solution.',
    // images: ['https://www.swap-space-app.com/twitter-image.jpg'], // Add this image later
  },

  // Additional metadata
  metadataBase: new URL('https://www.swap-space-app.com'),
  alternates: {
    canonical: 'https://www.swap-space-app.com',
  },

  // Robots
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

  // Verification (you'll get these from Google Search Console)
  verification: {
    // google: 'your-google-verification-code-here', // Add this later
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },

  // Additional properties
  category: 'technology',
  classification: 'Digital Exchange Platform',

  // Manifest for PWA (if you have one)
  // manifest: '/manifest.json',

  // Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Swap Space',
              alternateName: 'Swap Space App',
              url: 'https://www.swap-space-app.com',
              description:
                'Your premier digital exchange platform for trading and swapping items securely.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate:
                    'https://www.swap-space-app.com/?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
              publisher: {
                '@type': 'Organization',
                name: 'Swap Space',
                url: 'https://www.swap-space-app.com',
                // logo: 'https://www.swap-space-app.com/logo.png'
              },
            }),
          }}
        />

        {/* Additional meta tags */}
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="light dark" />
        <link rel="canonical" href="https://www.swap-space-app.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader
          color="var(--primary)"
          height={2}
          showSpinner={false}
          speed={800}
          easing="ease"
        />
        <NuqsAdapter>
          <ThemeProvider>
            <ReactQueryProvider>
              <Navbar />
              <div className="flex h-screen overflow-hidden ">
                <main
                  className="
                min-h-screen flex-1
                overflow-y-auto overflow-x-hidden
                py-24 
                
                flex flex-col
                
              "
                >
                  {children}
                </main>
              </div>
              <Toaster richColors />
            </ReactQueryProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
