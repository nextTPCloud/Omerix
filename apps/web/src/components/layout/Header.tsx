"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth.service'
import { useLicense } from '@/hooks/useLicense'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Menu, X, Sparkles, Clock, AlertTriangle, Crown, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { LogoLink } from './LogoLink'
import { SkinSelector } from '@/components/SkinSelector'
import { UserPreferencesSheet } from '@/components/UserPreferencesSheet'

interface HeaderProps {
  onMenuClick: () => void
  isMobileMenuOpen: boolean
}

export function Header({ onMenuClick, isMobileMenuOpen }: HeaderProps) {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const {
    plan,
    isTrial,
    isActive,
    isExpired,
    isSuspended,
    daysRemaining,
    warnings,
    loading: licenseLoading
  } = useLicense()

  const handleLogout = async () => {
    try {
      await logout() // Esto revoca el token en el servidor y limpia el estado
      toast.success('Sesión cerrada')
      router.push('/')
    } catch (error) {
      // Aún así redirigir
      router.push('/')
    }
  }

  if (!user) return null

  const initials = `${user.nombre[0]}${user.apellidos[0]}`.toUpperCase()

  // Obtener el badge y estilo segun el estado de la licencia
  const getLicenseBadge = () => {
    if (licenseLoading) return null

    if (isExpired) {
      return {
        label: 'Expirada',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        tooltip: 'Tu suscripción ha expirado. Renueva para continuar usando el sistema.'
      }
    }

    if (isSuspended) {
      return {
        label: 'Suspendida',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        tooltip: 'Tu cuenta está suspendida. Contacta con soporte.'
      }
    }

    if (isTrial) {
      return {
        label: `Trial ${daysRemaining}d`,
        variant: 'secondary' as const,
        icon: Clock,
        tooltip: `Te quedan ${daysRemaining} días de prueba gratuita`
      }
    }

    if (isActive && plan) {
      return {
        label: plan.nombre,
        variant: 'outline' as const,
        icon: plan.slug === 'enterprise' ? Crown : Sparkles,
        tooltip: `Plan ${plan.nombre} activo`
      }
    }

    return null
  }

  const licenseBadge = getLicenseBadge()
  const showUpgradeButton = isTrial || (plan && plan.slug !== 'enterprise')

  // Determinar si hay alertas críticas (>=80% uso)
  const hasWarnings = warnings.length > 0
  const hasCriticalWarning = warnings.some(w => w.includes('⛔') || w.includes('⚠️'))

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* Botón hamburguesa móvil */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2"
          onClick={onMenuClick}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* Logo */}
        <LogoLink />

        {/* Espaciador */}
        <div className="flex-1" />

        {/* Avatar y menú usuario */}
        <nav className="flex items-center space-x-2">
          {/* Indicador de licencia */}
          {licenseBadge && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden sm:flex items-center gap-2">
                    <Badge
                      variant={licenseBadge.variant}
                      className="gap-1 cursor-default"
                    >
                      <licenseBadge.icon className="h-3 w-3" />
                      {licenseBadge.label}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{licenseBadge.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Boton Upgrade */}
          {showUpgradeButton && (
            <Link href="/configuracion/billing">
              <Button
                size="sm"
                variant={isTrial || isExpired ? "default" : "outline"}
                className="hidden sm:flex gap-1 h-8 text-xs"
              >
                <Sparkles className="h-3 w-3" />
                {isExpired ? 'Renovar' : 'Upgrade'}
              </Button>
            </Link>
          )}

          {/* Warnings - Alerta si hay limites bajos */}
          {hasWarnings && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/configuracion/billing">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 gap-1.5 ${
                        hasCriticalWarning
                          ? 'text-amber-600 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900'
                          : 'text-amber-500 hover:text-amber-600'
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs font-medium">
                        {hasCriticalWarning ? 'Límites' : 'Uso'}
                      </span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" className="max-w-xs">
                  <div className="space-y-2 p-1">
                    <p className="font-medium text-xs text-amber-500">Uso de tu plan</p>
                    {warnings.map((warning, index) => (
                      <p key={index} className="text-xs">{warning}</p>
                    ))}
                    <p className="text-xs text-muted-foreground pt-1 border-t">
                      Click para ver detalles
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Selector de tema */}
          <SkinSelector />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.nombre} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.nombre} {user.apellidos}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Rol: {user.rol}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/perfil')}>
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPreferencesOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Mis Preferencias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/configuracion')}>
                Configuracion
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                Cerrar Sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      {/* Sheet de preferencias de usuario */}
      <UserPreferencesSheet
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
    </header>
  )
}