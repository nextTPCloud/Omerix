'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { crmService } from '@/services/crm.service'
import {
  Oportunidad,
  EstadoOportunidad,
  ESTADO_OPORTUNIDAD_LABELS,
  ESTADO_OPORTUNIDAD_COLORS,
} from '@/types/crm.types'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  User,
  Building2,
  Target,
  DollarSign,
  TrendingUp,
  Loader2,
  RotateCcw,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OportunidadDetallePage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [oportunidad, setOportunidad] = useState<Oportunidad | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActioning, setIsActioning] = useState(false)

  const cargarOportunidad = async () => {
    try {
      setIsLoading(true)
      const data = await crmService.getOportunidadById(resolvedParams.id)
      setOportunidad(data)
    } catch (error: any) {
      console.error('Error cargando oportunidad:', error)
      toast.error('Error al cargar la oportunidad')
      router.push('/crm/oportunidades')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (resolvedParams.id) {
      cargarOportunidad()
    }
  }, [resolvedParams.id])

  const handleCerrar = async (estado: 'ganada' | 'perdida') => {
    if (!confirm(`¿Estas seguro de cerrar esta oportunidad como ${estado}?`)) return

    try {
      setIsActioning(true)
      await crmService.cerrarOportunidad(resolvedParams.id, { estado })
      toast.success(`Oportunidad cerrada como ${estado}`)
      cargarOportunidad()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cerrar la oportunidad')
    } finally {
      setIsActioning(false)
    }
  }

  const handleReabrir = async () => {
    if (!confirm('¿Estas seguro de reabrir esta oportunidad?')) return

    try {
      setIsActioning(true)
      await crmService.reabrirOportunidad(resolvedParams.id)
      toast.success('Oportunidad reabierta')
      cargarOportunidad()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al reabrir la oportunidad')
    } finally {
      setIsActioning(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estas seguro de eliminar esta oportunidad? Esta accion no se puede deshacer.')) return

    try {
      await crmService.deleteOportunidad(resolvedParams.id)
      toast.success('Oportunidad eliminada correctamente')
      router.push('/crm/oportunidades')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    }
  }

  // Estado de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // No encontrada
  if (!oportunidad) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Oportunidad no encontrada</p>
        <Link href="/crm/oportunidades">
          <Button variant="link">Volver a oportunidades</Button>
        </Link>
      </div>
    )
  }

  const isCerrada = oportunidad.estado === EstadoOportunidad.GANADA ||
    oportunidad.estado === EstadoOportunidad.PERDIDA ||
    oportunidad.estado === EstadoOportunidad.CANCELADA

  const valorPonderado = (oportunidad.valorEstimado || 0) * (oportunidad.probabilidad || 0) / 100

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/crm/oportunidades">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {oportunidad.nombre}
              </h1>
              <Badge
                style={{
                  backgroundColor: `${ESTADO_OPORTUNIDAD_COLORS[oportunidad.estado]}20`,
                  color: ESTADO_OPORTUNIDAD_COLORS[oportunidad.estado],
                  borderColor: ESTADO_OPORTUNIDAD_COLORS[oportunidad.estado],
                }}
                variant="outline"
              >
                {ESTADO_OPORTUNIDAD_LABELS[oportunidad.estado]}
              </Badge>
              {oportunidad.etapaId && (
                <Badge variant="outline" className="gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full inline-block"
                    style={{ backgroundColor: oportunidad.etapaId.color }}
                  />
                  {oportunidad.etapaId.nombre}
                </Badge>
              )}
            </div>
            {oportunidad.descripcion && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {oportunidad.descripcion}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCerrada && (
            <>
              <Button
                variant="outline"
                onClick={() => handleCerrar('ganada')}
                disabled={isActioning}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Ganada
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCerrar('perdida')}
                disabled={isActioning}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Perdida
              </Button>
            </>
          )}
          {isCerrada && (
            <Button
              variant="outline"
              onClick={handleReabrir}
              disabled={isActioning}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reabrir
            </Button>
          )}
          <Link href={`/crm/oportunidades/${oportunidad._id}/editar`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos Generales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-gray-500" />
                Datos Generales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nombre</p>
                  <p className="font-medium">{oportunidad.nombre}</p>
                </div>
                {oportunidad.descripcion && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Descripcion</p>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {oportunidad.descripcion}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Estado</p>
                  <Badge
                    style={{
                      backgroundColor: `${ESTADO_OPORTUNIDAD_COLORS[oportunidad.estado]}20`,
                      color: ESTADO_OPORTUNIDAD_COLORS[oportunidad.estado],
                      borderColor: ESTADO_OPORTUNIDAD_COLORS[oportunidad.estado],
                    }}
                    variant="outline"
                  >
                    {ESTADO_OPORTUNIDAD_LABELS[oportunidad.estado]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Etapa</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full inline-block"
                      style={{ backgroundColor: oportunidad.etapaId?.color }}
                    />
                    <span className="font-medium">{oportunidad.etapaId?.nombre}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-500" />
                Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Etapa</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full inline-block"
                      style={{ backgroundColor: oportunidad.etapaId?.color }}
                    />
                    <span className="font-medium">{oportunidad.etapaId?.nombre}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Probabilidad</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${oportunidad.probabilidad || 0}%` }}
                      />
                    </div>
                    <span className="font-medium text-sm">{oportunidad.probabilidad || 0}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valor Ponderado</p>
                  <p className="font-semibold text-lg">{formatCurrency(valorPonderado)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-500" />
                Valor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valor Estimado</p>
                  <p className="font-semibold text-2xl text-green-600">
                    {formatCurrency(oportunidad.valorEstimado || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Moneda</p>
                  <p className="font-medium">{oportunidad.moneda || 'EUR'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lineas de Productos/Servicios */}
          {oportunidad.lineas && oportunidad.lineas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lineas de Productos / Servicios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripcion</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unitario</TableHead>
                      <TableHead className="text-right">Descuento</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oportunidad.lineas.map((linea, index) => {
                      const descuento = linea.descuento || 0
                      const subtotal = linea.cantidad * linea.precioUnitario * (1 - descuento / 100)
                      return (
                        <TableRow key={linea._id || index}>
                          <TableCell className="font-medium">{linea.descripcion}</TableCell>
                          <TableCell className="text-right">{linea.cantidad}</TableCell>
                          <TableCell className="text-right">{formatCurrency(linea.precioUnitario)}</TableCell>
                          <TableCell className="text-right">{descuento > 0 ? `${descuento}%` : '-'}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(subtotal)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(
                        oportunidad.lineas.reduce((acc, linea) => {
                          const descuento = linea.descuento || 0
                          return acc + linea.cantidad * linea.precioUnitario * (1 - descuento / 100)
                        }, 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Motivo perdida (si aplica) */}
          {oportunidad.estado === EstadoOportunidad.PERDIDA && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Informacion de Perdida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {oportunidad.motivoPerdida && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Motivo de Perdida</p>
                      <p className="text-gray-700 dark:text-gray-300">{oportunidad.motivoPerdida}</p>
                    </div>
                  )}
                  {oportunidad.competidor && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Competidor</p>
                      <p className="font-medium">{oportunidad.competidor}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Relaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-500" />
                Relaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {oportunidad.clienteId && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cliente</p>
                    <Link
                      href={`/clientes/${oportunidad.clienteId._id}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Building2 className="h-4 w-4" />
                      {oportunidad.clienteId.nombre}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
                {oportunidad.leadId && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Lead</p>
                    <Link
                      href={`/crm/leads/${oportunidad.leadId._id}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <User className="h-4 w-4" />
                      {oportunidad.leadId.nombre}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
                {oportunidad.asignadoA && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Asignado a</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <p className="font-medium">{oportunidad.asignadoA.nombre}</p>
                    </div>
                  </div>
                )}
                {!oportunidad.clienteId && !oportunidad.leadId && !oportunidad.asignadoA && (
                  <p className="text-sm text-gray-400">Sin relaciones asignadas</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {oportunidad.fechaCierreEstimada && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cierre Estimado</span>
                    <span className="font-medium">
                      {format(new Date(oportunidad.fechaCierreEstimada), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                )}
                {oportunidad.fechaCierreReal && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cierre Real</span>
                    <span className="font-medium">
                      {format(new Date(oportunidad.fechaCierreReal), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Creado</span>
                  <span>{format(new Date(oportunidad.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Actualizado</span>
                  <span>{format(new Date(oportunidad.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Etiquetas */}
          {oportunidad.etiquetas && oportunidad.etiquetas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Etiquetas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {oportunidad.etiquetas.map((etiqueta) => (
                    <Badge key={etiqueta} variant="secondary">
                      {etiqueta}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadatos */}
          <Card>
            <CardHeader>
              <CardTitle>Informacion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {oportunidad.creadoPor && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creado por</span>
                    <span>{oportunidad.creadoPor.nombre}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">ID</span>
                  <span className="font-mono text-xs text-gray-400">{oportunidad._id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
