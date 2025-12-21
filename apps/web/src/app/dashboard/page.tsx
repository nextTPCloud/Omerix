'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import { useAuthStore } from '@/stores/authStore'
import { empresaService } from '@/services/empresa.service'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [refreshInterval, setRefreshInterval] = useState(60)

  // Cargar configuración de intervalo de actualización desde empresa
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const response = await empresaService.getMiEmpresa()
        if (response.success && response.data) {
          // El intervalo puede estar en diferentes lugares según la estructura
          const config = (response.data as any).configuracion
          if (config?.dashboardRefreshInterval) {
            setRefreshInterval(config.dashboardRefreshInterval)
          }
        }
      } catch (error) {
        console.error('Error cargando configuración:', error)
      }
    }
    cargarConfiguracion()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header con bienvenida */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Bienvenido, {user?.nombre || 'Usuario'}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Este es tu panel de control personalizable
          </p>
        </div>

        {/* Dashboard con widgets personalizables */}
        <DashboardGrid refreshInterval={refreshInterval} />
      </div>
    </DashboardLayout>
  )
}
