'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { crmService } from '@/services/crm.service'
import {
  OportunidadPorEtapa,
  Oportunidad,
  EtapaPipeline,
  ESTADO_OPORTUNIDAD_LABELS,
  ESTADO_OPORTUNIDAD_COLORS,
  EstadoOportunidad,
} from '@/types/crm.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Kanban,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  User,
  Building2,
  DollarSign,
  Calendar,
  Target,
  ArrowRight,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function OportunidadesPage() {
  const router = useRouter()
  const [pipeline, setPipeline] = useState<OportunidadPorEtapa[]>([])
  const [etapas, setEtapas] = useState<EtapaPipeline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedOportunidad, setDraggedOportunidad] = useState<string | null>(null)

  const cargarDatos = async () => {
    try {
      setIsLoading(true)
      const [pipelineData, etapasData] = await Promise.all([
        crmService.getOportunidadesPipeline(),
        crmService.getEtapas(true),
      ])
      setPipeline(pipelineData)
      setEtapas(etapasData)
    } catch (error: any) {
      console.error('Error cargando pipeline:', error)
      toast.error('Error al cargar el pipeline')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleDragStart = (e: React.DragEvent, oportunidadId: string) => {
    setDraggedOportunidad(oportunidadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, etapaId: string) => {
    e.preventDefault()
    if (!draggedOportunidad) return

    try {
      await crmService.cambiarEtapaOportunidad(draggedOportunidad, { etapaId })
      toast.success('Oportunidad movida')
      cargarDatos()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al mover')
    } finally {
      setDraggedOportunidad(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estas seguro de eliminar esta oportunidad?')) return

    try {
      await crmService.deleteOportunidad(id)
      toast.success('Oportunidad eliminada')
      cargarDatos()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    }
  }

  const handleCerrar = async (id: string, estado: 'ganada' | 'perdida') => {
    try {
      await crmService.cerrarOportunidad(id, { estado })
      toast.success(`Oportunidad marcada como ${estado}`)
      cargarDatos()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cerrar')
    }
  }

  // Obtener oportunidades por etapa
  const getOportunidadesByEtapa = (etapaId: string): Oportunidad[] => {
    const etapaData = pipeline.find(p => p.etapa._id === etapaId)
    return etapaData?.oportunidades || []
  }

  // Calcular totales por etapa
  const getTotalesByEtapa = (etapaId: string) => {
    const etapaData = pipeline.find(p => p.etapa._id === etapaId)
    return {
      total: etapaData?.total || 0,
      valor: etapaData?.valorTotal || 0,
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (etapas.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline de Ventas</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gestiona tus oportunidades de venta
            </p>
          </div>

          <Card className="p-8 text-center">
            <Kanban className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Configura tu Pipeline</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Necesitas configurar las etapas del pipeline antes de crear oportunidades.
            </p>
            <Link href="/crm/configuracion/pipeline">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Configurar Pipeline
              </Button>
            </Link>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline de Ventas</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Arrastra las oportunidades entre etapas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={cargarDatos} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Link href="/crm/oportunidades/nueva">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Oportunidad
              </Button>
            </Link>
          </div>
        </div>

        {/* Pipeline Kanban */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {etapas.map((etapa) => {
              const oportunidades = getOportunidadesByEtapa(etapa._id)
              const totales = getTotalesByEtapa(etapa._id)

              return (
                <div
                  key={etapa._id}
                  className="w-80 flex-shrink-0"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, etapa._id)}
                >
                  {/* Header de etapa */}
                  <div
                    className="p-3 rounded-t-lg"
                    style={{ backgroundColor: etapa.color }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{etapa.nombre}</span>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {totales.total}
                        </Badge>
                      </div>
                      <span className="text-sm text-white/80">
                        {formatCurrency(totales.valor)}
                      </span>
                    </div>
                    <div className="text-xs text-white/70 mt-1">
                      {etapa.probabilidadDefecto}% probabilidad
                    </div>
                  </div>

                  {/* Lista de oportunidades */}
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-b-lg p-2 min-h-[400px] space-y-2">
                    {oportunidades.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        Sin oportunidades
                      </div>
                    ) : (
                      oportunidades.map((oportunidad) => (
                        <Card
                          key={oportunidad._id}
                          className="p-3 cursor-grab hover:shadow-md transition-shadow"
                          draggable
                          onDragStart={(e) => handleDragStart(e, oportunidad._id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Link
                              href={`/crm/oportunidades/${oportunidad._id}`}
                              className="font-medium hover:text-blue-600 line-clamp-1"
                            >
                              {oportunidad.nombre}
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/crm/oportunidades/${oportunidad._id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/crm/oportunidades/${oportunidad._id}/editar`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleCerrar(oportunidad._id, 'ganada')}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Marcar como Ganada
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCerrar(oportunidad._id, 'perdida')}>
                                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                  Marcar como Perdida
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(oportunidad._id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Cliente/Lead */}
                          {(oportunidad.clienteId || oportunidad.leadId) && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                              <Building2 className="h-3 w-3" />
                              <span className="line-clamp-1">
                                {oportunidad.clienteId?.nombre || oportunidad.leadId?.nombre}
                              </span>
                            </div>
                          )}

                          {/* Valor */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 font-medium text-green-600">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(oportunidad.valorEstimado)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {oportunidad.probabilidad}%
                            </Badge>
                          </div>

                          {/* Fecha cierre */}
                          {oportunidad.fechaCierreEstimada && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(oportunidad.fechaCierreEstimada), 'dd MMM', { locale: es })}
                            </div>
                          )}

                          {/* Asignado */}
                          {oportunidad.asignadoA && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <User className="h-3 w-3" />
                              {oportunidad.asignadoA.nombre}
                            </div>
                          )}
                        </Card>
                      ))
                    )}

                    {/* Boton agregar en cada columna */}
                    <Link href={`/crm/oportunidades/nueva?etapa=${etapa._id}`}>
                      <Button
                        variant="ghost"
                        className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Resumen */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-gray-500">Total Oportunidades</p>
                <p className="text-xl font-bold">
                  {pipeline.reduce((acc, p) => acc + p.total, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(pipeline.reduce((acc, p) => acc + p.valorTotal, 0))}
                </p>
              </div>
            </div>
            <Link href="/crm/configuracion/pipeline">
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4 mr-2" />
                Configurar Etapas
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
