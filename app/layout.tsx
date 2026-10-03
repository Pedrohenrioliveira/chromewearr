import type { Metadata, Viewport } from 'next';
import { Hanken_Grotesk, Cinzel } from 'next/font/google';
import './globals.css';

const hanken = Hanken_Grotesk({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hanken',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-cinzel',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ChromeWear | Streetwear & Moda Urbana Contemporânea',
  description:
    'Loja oficial ChromeWear. Roupas autorais de alta qualidade, jaquetas, camisetas oversized, calças cargo e acessórios streetwear com design minimalista.',
  keywords: [
    'ChromeWear',
    'Streetwear',
    'Moda Urbana',
    'Jaqueta Puffer',
    'Camiseta Oversized',
    'Calça Cargo',
    'Roupas Masculinas',
    'Roupas Femininas',
  ],
  openGraph: {
    title: 'ChromeWear | Streetwear & Moda Urbana Contemporânea',
    description:
      'Marca autoral de streetwear e moda urbana contemporânea. Design minimalista, sofisticação e atitude.',
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
    <html lang="pt-BR" className={`${hanken.variable} ${cinzel.variable}`}>
      <body className="bg-surface-pure text-text-primary antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
