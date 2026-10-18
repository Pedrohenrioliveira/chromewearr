import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { SecurityProvider } from '@/components/SecurityProvider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://chromewear.com.br'),
  title: {
    default: 'ChromeWear | Streetwear & Moda Urbana Contemporânea',
    template: '%s | ChromeWear',
  },
  description:
    'Loja oficial ChromeWear. Roupas autorais de alta qualidade, camisetas oversized 240g, calças cargo, jaquetas e acessórios streetwear com design minimalista.',
  keywords: [
    'ChromeWear',
    'Chrome Wear',
    'chromewear oficial',
    'loja chromewear',
    'CW streetwear',
    'streetwear',
    'streetwear brasil',
    'marca de streetwear',
    'moda urbana',
    'moda streetwear',
    'streetwear nacional',
    'camiseta oversized',
    'camisetas oversized streetwear',
    'camiseta algodao 240g',
    'camiseta grossa oversized',
    'calca cargo streetwear',
    'calça cargo',
    'camisa streetwear',
    'jaqueta puffer',
    'chaveiro streetwear',
    'acessorios streetwear',
    'roupas masculinas streetwear',
    'roupas femininas streetwear',
    'roupas unissex streetwear',
    'comprar streetwear online',
    'loja online streetwear',
    'drop streetwear',
    'hype streetwear brasil',
  ],
  authors: [{ name: 'ChromeWear' }],
  creator: 'ChromeWear',
  publisher: 'ChromeWear',
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
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ChromeWear | Streetwear & Moda Urbana Contemporânea',
    description:
      'Marca autoral de streetwear e moda urbana contemporânea. Design minimalista, malha pesada 240g e atitude.',
    url: 'https://chromewear.com.br',
    siteName: 'ChromeWear',
    images: [
      {
        url: '/images/hero.webp',
        width: 1200,
        height: 630,
        alt: 'ChromeWear Urban Drop',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  icons: {
    icon: '/images/logo.webp',
    shortcut: '/images/logo.webp',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface-pure text-text-primary antialiased min-h-screen flex flex-col">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-VY5JR3X0H3"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-VY5JR3X0H3');
          `}
        </Script>
        <SecurityProvider />
        {children}
      </body>
    </html>
  );
}
