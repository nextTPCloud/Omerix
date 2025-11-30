"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth.service'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Menu, X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { LogoLink } from './LogoLink'
import { SkinSelector } from '@/components/SkinSelector'

interface HeaderProps {
  onMenuClick: () => void
  isMobileMenuOpen: boolean
}

export function Header({ onMenuClick, isMobileMenuOpen }: HeaderProps) {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    authService.logoutLocal()
    clearAuth()
    toast.success('Sesión cerrada')
    router.push('/login')
  }

  if (!user) return null

  const initials = `${user.nombre[0]}${user.apellidos[0]}`.toUpperCase()

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
              <DropdownMenuItem onClick={() => router.push('/configuracion')}>
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}