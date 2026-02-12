import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SkinProvider } from "@/contexts/SkinContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { ChatwootWidget } from "@/components/ChatwootWidget";

// Forzar renderizado dinamico para toda la aplicacion
// ya que es un SaaS que siempre requiere datos de servidor
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tralok ERP",
  description: "Sistema de gestión empresarial multi-negocio",
  icons: {
    icon: '/tralok-icon.svg',
  },
  manifest: '/manifest.json',
  themeColor: '#3B82F6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tralok ERP',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="skin-default">
      <body className={inter.className} suppressHydrationWarning>
        <SkinProvider>
          <PermissionsProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={3000}
              toastOptions={{
                className: 'cursor-pointer',
              }}
            />
          </PermissionsProvider>
          <ChatwootWidget />
        </SkinProvider>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.log('SW registration failed:', err);
              });
            });
          }
        ` }} />
      </body>
    </html>
  );
}