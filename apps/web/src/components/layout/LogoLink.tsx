"use client"

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import Image from 'next/image'

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
      <Image 
        src="/omerix-logo-horizontal.svg" 
        alt="Omerix ERP" 
        width={140} 
        height={40}
        className="h-8 w-auto"
        priority
      />
    </a>
  )
}