"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'
import { isTokenExpired } from '@/utils/jwt.utils'
import { FavoritosProvider } from '@/contexts/FavoritosContext'
import { AIChat } from '@/components/ai/AIChat'

// Intervalo de verificación del token (cada 60 segundos)
const TOKEN_CHECK_INTERVAL = 60 * 1000

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const { isAuthenticated, isHydrated, accessToken, checkAndRefreshToken } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  // Estado para bloquear render de hijos hasta verificar token
  const [isTokenVerified, setIsTokenVerified] = useState(false)
  const isVerifyingRef = useRef(false)

  // Función para verificar y refrescar el token
  const verifyToken = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !accessToken) {
      return false
    }

    // Si el token está próximo a expirar (menos de 2 minutos), intentar refrescar
    if (isTokenExpired(accessToken, 120)) {
      const isValid = await checkAndRefreshToken()
      if (!isValid) {
        router.push('/')
        return false
      }
    }
    return true
  }, [isAuthenticated, accessToken, checkAndRefreshToken, router])

  // Verificación inicial del token ANTES de renderizar hijos
  useEffect(() => {
    const verifyInitialToken = async () => {
      if (!isHydrated || isVerifyingRef.current) return

      isVerifyingRef.current = true

      if (!isAuthenticated) {
        router.push('/')
        return
      }

      // Verificar token antes de permitir render de hijos
      const isValid = await verifyToken()
      if (isValid) {
        setIsTokenVerified(true)
      }
      // Si no es válido, verifyToken ya redirigió

      isVerifyingRef.current = false
    }

    verifyInitialToken()
  }, [isHydrated, isAuthenticated, verifyToken, router])

  // Marcar componente como montado
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Configurar verificación periódica (solo después de verificación inicial)
  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !isTokenVerified) {
      return
    }

    // Configurar verificación periódica
    const intervalId = setInterval(verifyToken, TOKEN_CHECK_INTERVAL)

    // Verificar cuando la ventana vuelve a tener foco (usuario vuelve a la pestaña)
    const handleFocus = () => {
      verifyToken()
    }
    window.addEventListener('focus', handleFocus)

    // Verificar cuando el usuario vuelve a estar activo (visibilitychange)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifyToken()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isHydrated, isAuthenticated, isTokenVerified, verifyToken])

  // Cerrar menú móvil al cambiar de tamaño a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Cargar estado del sidebar desde localStorage solo después de montar
  useEffect(() => {
    if (isMounted) {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved !== null) {
        setIsSidebarCollapsed(saved === 'true')
      }
    }
  }, [isMounted])

  // Guardar estado del sidebar en localStorage
  const handleToggleCollapse = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  // Mostrar loading mientras se carga del localStorage o se verifica el token
  if (!isHydrated || !isTokenVerified) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Si ya se verificó y NO está autenticado, mostrar null (va a redirigir)
  if (!isAuthenticated) {
    return null
  }

  return (
    <FavoritosProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Header
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
          <main className={cn(
            "flex-1 w-full min-w-0 p-3 sm:p-4 md:p-6 transition-all duration-300 overflow-y-auto",
            isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
          )}>
            <div className="w-full max-w-full">
              {children}
            </div>
          </main>
        </div>
        {/* Chat de IA flotante */}
        <AIChat />
      </div>
    </FavoritosProvider>
  )
}