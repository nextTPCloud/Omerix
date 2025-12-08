"use client"

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export function LogoLink() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  // Logo negro para tema claro, logo claro para tema oscuro
  const logoSrc = mounted && resolvedTheme === 'light'
    ? '/omerix-logo-horizontal-black.svg'
    : '/omerix-logo-horizontal.svg'

  return (
    <a
      href="#"
      onClick={handleClick}
      className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
    >
      <Image
        src={logoSrc}
        alt="Omerix ERP"
        width={140}
        height={40}
        className="h-8 w-auto"
        priority
      />
    </a>
  )
}