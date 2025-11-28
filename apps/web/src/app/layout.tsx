import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SkinProvider } from "@/contexts/SkinContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Omerix ERP",
  description: "Sistema de gestión empresarial multi-negocio",
  icons: {
    icon: '/omerix-icon.svg',
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
          {children}
          <Toaster position="top-right" richColors />
        </SkinProvider>
      </body>
    </html>
  );
}