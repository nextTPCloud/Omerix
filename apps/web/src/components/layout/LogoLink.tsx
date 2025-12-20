"use client"

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export function LogoLink() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  return (
    <a
      href="#"
      onClick={handleClick}
      className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
    >
      {/* Logo SVG inline para que currentColor se adapte al tema */}
      <svg
        width="140"
        height="40"
        viewBox="0 0 180 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-auto"
      >
        {/* Anillo exterior - O estilizada */}
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.15"/>
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="95 31" strokeLinecap="round"/>

        {/* Barras de datos ascendentes */}
        <rect x="14" y="28" width="4" height="10" rx="1.5" fill="currentColor"/>
        <rect x="20" y="23" width="4" height="15" rx="1.5" fill="currentColor"/>
        <rect x="26" y="18" width="4" height="20" rx="1.5" fill="currentColor"/>

        {/* Punto destacado (metrica/KPI) */}
        <circle cx="34" cy="15" r="3" fill="currentColor"/>

        {/* Texto OMERIX */}
        <text x="56" y="32" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fontSize="24" fontWeight="700" fill="currentColor" letterSpacing="1">OMERIX</text>
      </svg>
    </a>
  )
}
