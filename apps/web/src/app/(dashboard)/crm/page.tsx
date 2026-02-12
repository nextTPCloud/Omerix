'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { crmService } from '@/services/crm.service'
import {
  EstadisticasLeads,
  EstadisticasOportunidades,
  EstadisticasActividades,
  ForecastData,
  ESTADO_LEAD_LABELS,
  ESTADO_LEAD_COLORS,
} from '@/types/crm.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Target,
  UserPlus,
  TrendingUp,
  Phone,
  ArrowRight,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Kanban,
  Settings,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

export default function CRMDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [leadStats, setLeadStats] = useState<EstadisticasLeads | null>(null)
  const [oportunidadStats, setOportunidadStats] = useState<EstadisticasOportunidades | null>(null)
  const [actividadStats, setActividadStats] = useState<EstadisticasActividades | null>(null)
  const [forecast, setForecast] = useState<ForecastData[]>([])
  const [needsInit, setNeedsInit] = useState(false)

  const cargarDatos = async () => {
    try {
      setIsLoading(true)
      const data = await crmService.getDashboard()
      setLeadStats(data.leads)
      setOportunidadStats(data.oportunidades)
      setActividadStats(data.actividades)
      setForecast(data.forecast)
      setNeedsInit(false)
    } catch (error: any) {
      console.error('Error cargando datos CRM:', error)
      if (error.response?.status === 404) {
        setNeedsInit(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleInicializarPipeline = async () => {
    try {
      toast.loading('Inicializando pipeline de ventas...')
      await crmService.inicializarPipeline()
      toast.dismiss()
      toast.success('Pipeline inicializado correctamente')
      cargarDatos()
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.error || 'Error al inicializar pipeline')
    }
  }

  const modulos = [
    {
      titulo: 'Leads',
      descripcion: 'Gestiona prospectos y oportunidades de negocio',
      icono: UserPlus,
      href: '/crm/leads',
      color: 'bg-blue-500',
      stats: leadStats ? `${leadStats.total} leads` : '0 leads',
    },
    {
      titulo: 'Oportunidades',
      descripcion: 'Pipeline de ventas y seguimiento',
      icono: Kanban,
      href: '/crm/oportunidades',
      color: 'bg-green-500',
      stats: oportunidadStats ? `${oportunidadStats.abiertas} abiertas` : '0 abiertas',
    },
    {
      titulo: 'Actividades',
      descripcion: 'Llamadas, reuniones y tareas',
      icono: Phone,
      href: '/crm/actividades',
      color: 'bg-purple-500',
      stats: actividadStats ? `${actividadStats.pendientes} pendientes` : '0 pendientes',
    },
    {
      titulo: 'Configuracion Pipeline',
      descripcion: 'Configura las etapas del pipeline',
      icono: Settings,
      href: '/crm/configuracion/pipeline',
      color: 'bg-gray-500',
      stats: 'Personalizar',
    },
  ]

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      
    )
  }

  if (needsInit) {
    return (
      
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gestion de relaciones con clientes
            </p>
          </div>

          <Card className="p-8 text-center">
            <Target className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Configurar CRM</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Para comenzar a usar el CRM, necesitas inicializar el pipeline de ventas
              con las etapas por defecto.
            </p>
            <Button onClick={handleInicializarPipeline}>
              <Plus className="h-4 w-4 mr-2" />
              Inicializar Pipeline
            </Button>
          </Card>
        </div>
      
    )
  }

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Panel de gestion de relaciones con clientes
            </p>
          </div>
          <Button variant="outline" onClick={cargarDatos}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="text-2xl font-bold">{leadStats?.total || 0}</p>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-green-600">{leadStats?.tasaConversion?.toFixed(1) || 0}%</span>
              <span className="text-gray-500 ml-1">tasa conversion</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Oportunidades Abiertas</p>
                <p className="text-2xl font-bold">{oportunidadStats?.abiertas || 0}</p>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-green-600">{formatCurrency(oportunidadStats?.valorTotalAbierto || 0)}</span>
              <span className="text-gray-500 ml-1">valor total</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Ponderado</p>
                <p className="text-2xl font-bold">{formatCurrency(oportunidadStats?.valorPonderadoTotal || 0)}</p>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-gray-500">Forecast ajustado por probabilidad</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tasa Conversion</p>
                <p className="text-2xl font-bold">{oportunidadStats?.tasaConversion?.toFixed(1) || 0}%</p>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-green-600">{oportunidadStats?.ganadas || 0}</span>
              <span className="text-gray-500 ml-1">ganadas</span>
            </div>
          </Card>
        </div>

        {/* Modulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modulos.map((modulo) => {
            const Icon = modulo.icono
            return (
              <Link key={modulo.href} href={modulo.href}>
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${modulo.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{modulo.titulo}</h3>
                      <p className="text-sm text-gray-500 mt-1">{modulo.descripcion}</p>
                      <p className="text-sm font-medium text-blue-600 mt-2">{modulo.stats}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Actividades pendientes y proximas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actividades por estado */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Actividades</h3>
              <Link href="/crm/actividades">
                <Button variant="ghost" size="sm">
                  Ver todas
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>Pendientes</span>
                </div>
                <span className="font-semibold text-amber-600">{actividadStats?.pendientes || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Hoy</span>
                </div>
                <span className="font-semibold text-blue-600">{actividadStats?.proximasHoy || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>Vencidas</span>
                </div>
                <span className="font-semibold text-red-600">{actividadStats?.vencidas || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Completadas</span>
                </div>
                <span className="font-semibold text-green-600">{actividadStats?.completadas || 0}</span>
              </div>
            </div>
          </Card>

          {/* Leads por estado */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Leads por Estado</h3>
              <Link href="/crm/leads">
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {leadStats?.porEstado && Object.entries(leadStats.porEstado).map(([estado, cantidad]) => (
                <div
                  key={estado}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: `${ESTADO_LEAD_COLORS[estado as keyof typeof ESTADO_LEAD_COLORS]}15` }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ESTADO_LEAD_COLORS[estado as keyof typeof ESTADO_LEAD_COLORS] }}
                    />
                    <span>{ESTADO_LEAD_LABELS[estado as keyof typeof ESTADO_LEAD_LABELS] || estado}</span>
                  </div>
                  <span className="font-semibold">{cantidad}</span>
                </div>
              ))}
              {(!leadStats?.porEstado || Object.keys(leadStats.porEstado).length === 0) && (
                <p className="text-center text-gray-500 py-4">No hay leads registrados</p>
              )}
            </div>
          </Card>
        </div>

        {/* Forecast */}
        {forecast.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Forecast de Ventas</h3>
              <span className="text-sm text-gray-500">Proximos 6 meses</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Mes</th>
                    <th className="text-right py-2 px-3">Oportunidades</th>
                    <th className="text-right py-2 px-3">Valor Estimado</th>
                    <th className="text-right py-2 px-3">Valor Ponderado</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((f) => (
                    <tr key={f.mes} className="border-b last:border-0">
                      <td className="py-2 px-3 font-medium">{f.mes}</td>
                      <td className="text-right py-2 px-3">{f.cantidad}</td>
                      <td className="text-right py-2 px-3">{formatCurrency(f.valorEstimado)}</td>
                      <td className="text-right py-2 px-3 text-green-600 font-medium">
                        {formatCurrency(f.valorPonderado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    
  )
}
