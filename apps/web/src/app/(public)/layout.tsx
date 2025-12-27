"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'

function PublicHeader() {
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Si está autenticado, redirigir al dashboard
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <svg
              width="140"
              height="40"
              viewBox="0 0 200 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-9 w-auto"
            >
              <style>{`
                @font-face {
                  font-family: 'GameOfSquids';
                  src: url('/fonts/GameOfSquids.woff2') format('woff2'),
                      url('/fonts/GameOfSquids.woff') format('woff');
                  font-weight: 700;
                  font-style: bold;
                }
              `}</style>
              <circle cx="24" cy="24" r="20" stroke="#1e40af" strokeWidth="2.5" fill="none" opacity="0.15"/>
              <circle cx="24" cy="24" r="20" stroke="#1e40af" strokeWidth="2.5" fill="none" strokeDasharray="95 31" strokeLinecap="round"/>
              <rect x="14" y="28" width="4" height="10" rx="1.5" fill="#1e40af"/>
              <rect x="20" y="23" width="4" height="15" rx="1.5" fill="#1e40af"/>
              <rect x="26" y="18" width="4" height="20" rx="1.5" fill="#1e40af"/>
              <circle cx="34" cy="15" r="3" fill="#2563eb"/>
              <text x="54" y="38" fontFamily="GameOfSquids, sans-serif" fontSize="36" fontWeight="700" fill="#1e40af" letterSpacing="1">Tralok</text>
            </svg>
          </Link>

          {/* Navegación */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/planes"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Planes
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Funcionalidades
            </Link>
            <Link
              href="#modulos"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Modulos
            </Link>
          </nav>

          {/* Botones */}
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                Iniciar sesion
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Prueba gratis
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripcion */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <svg
                width="120"
                height="32"
                viewBox="0 0 200 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-auto"
              >
                <circle cx="24" cy="24" r="20" stroke="white" strokeWidth="2.5" fill="none" opacity="0.15"/>
                <circle cx="24" cy="24" r="20" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="95 31" strokeLinecap="round"/>
                <rect x="14" y="28" width="4" height="10" rx="1.5" fill="white"/>
                <rect x="20" y="23" width="4" height="15" rx="1.5" fill="white"/>
                <rect x="26" y="18" width="4" height="20" rx="1.5" fill="white"/>
                <circle cx="34" cy="15" r="3" fill="white"/>
                <text x="54" y="38" fontFamily="GameOfSquids, sans-serif" fontSize="36" fontWeight="700" fill="white" letterSpacing="1">Tralok</text>
              </svg>
            </Link>
            <p className="text-slate-400 text-sm max-w-md">
              El ERP completo para gestionar tu negocio. Ventas, compras, inventario,
              recursos humanos y mucho mas en una sola plataforma.
            </p>
          </div>

          {/* Producto */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Producto</h3>
            <ul className="space-y-2">
              <li><Link href="/planes" className="text-slate-400 hover:text-white text-sm transition-colors">Planes y precios</Link></li>
              <li><Link href="#features" className="text-slate-400 hover:text-white text-sm transition-colors">Funcionalidades</Link></li>
              <li><Link href="#modulos" className="text-slate-400 hover:text-white text-sm transition-colors">Modulos</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacidad" className="text-slate-400 hover:text-white text-sm transition-colors">Privacidad</Link></li>
              <li><Link href="/terminos" className="text-slate-400 hover:text-white text-sm transition-colors">Terminos de uso</Link></li>
              <li><Link href="/contacto" className="text-slate-400 hover:text-white text-sm transition-colors">Contacto</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Tralok. Todos los derechos reservados.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span className="text-slate-500 text-xs">Hecho en Espana</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-grow">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
