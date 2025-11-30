'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RefreshCw } from 'lucide-react'

export default function NuevoAgentePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a la página de edición con id="nuevo"
    router.replace('/agentes-comerciales/nuevo/editar')
  }, [router])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    </DashboardLayout>
  )
}
