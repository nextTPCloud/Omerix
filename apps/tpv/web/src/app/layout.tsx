import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tralok TPV',
  description: 'Punto de Venta Tralok',
  icons: {
    icon: '/tralok-icon.svg',
    shortcut: '/tralok-icon.svg',
    apple: '/tralok-icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} no-select`}>
        {children}
      </body>
    </html>
  );
}
