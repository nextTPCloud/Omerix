"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'
import { isTokenExpired, getTokenTimeRemaining } from '@/utils/jwt.utils'

// Intervalo de verificación del token (cada 60 segundos)
const TOKEN_CHECK_INTERVAL = 60 * 1000

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const { isAuthenticated, isHydrated, accessToken, checkAndRefreshToken, clearAuth } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Función para verificar y refrescar el token
  const verifyToken = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      return
    }

    // Si el token está próximo a expirar (menos de 2 minutos), intentar refrescar
    if (isTokenExpired(accessToken, 120)) {
      const isValid = await checkAndRefreshToken()
      if (!isValid) {
        router.push('/login')
      }
    }
  }, [isAuthenticated, accessToken, checkAndRefreshToken, router])

  // Marcar componente como montado
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Verificar token al montar y configurar verificación periódica
  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      return
    }

    // Verificar inmediatamente al montar
    verifyToken()

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
  }, [isHydrated, isAuthenticated, verifyToken])

  useEffect(() => {
    // Redirigir cuando ya se haya cargado del localStorage y no esté autenticado
    if (isHydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isHydrated, router])

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

  // ✅ Mostrar loading mientras se carga del localStorage
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // ✅ Si ya se cargó y NO está autenticado, mostrar null (va a redirigir)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        <main className={cn(
          "flex-1 w-full min-w-0 p-3 sm:p-4 md:p-6 transition-all duration-300",
          isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}>
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}