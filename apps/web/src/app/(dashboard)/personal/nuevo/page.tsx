'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { RefreshCw } from 'lucide-react'

export default function NuevoPersonalPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a la página de edición con id="nuevo"
    router.replace('/personal/nuevo/editar')
  }, [router])

  return (
    
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    
  )
}
