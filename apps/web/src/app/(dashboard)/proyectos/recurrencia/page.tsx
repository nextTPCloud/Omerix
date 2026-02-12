'use client'

import React, { useEffect, useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { proyectosService } from '@/services/proyectos.service'
import { IProyecto } from '@/types/proyecto.types'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  ArrowLeft,
  RefreshCw,
  Play,
  Loader2,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ClipboardList,
  Receipt,
} from 'lucide-react'

// ============================================
// TIPOS
// ============================================

interface ResultadoGeneracion {
  exito: boolean
  proyectoId: string
  proyectoCodigo: string
  proyectoNombre: string
  clienteNombre?: string
  parteTrabajoId?: string
  parteTrabajoNumero?: string
  albaranId?: string
  albaranNumero?: string
  facturaId?: string
  facturaNumero?: string
  error?: string
}

interface ResumenGeneracion {
  fecha: string
  totalProyectosProcessados: number
  totalExitos: number
  totalErrores: number
  resultados: ResultadoGeneracion[]
}

// ============================================
// CONSTANTES DE FRECUENCIA
// ============================================

const FRECUENCIA_LABELS: Record<string, string> = {
  semanal: 'Semanal',
  quincenal: 'Quincenal',
  mensual: 'Mensual',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function RecurrenciaPage() {
  const [proyectosPendientes, setProyectosPendientes] = useState<IProyecto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [resultados, setResultados] = useState<ResumenGeneracion | null>(null)
  const [showResultados, setShowResultados] = useState(false)

  // Cargar proyectos pendientes
  useEffect(() => {
    loadProyectosPendientes()
  }, [])

  const loadProyectosPendientes = async () => {
    try {
      setIsLoading(true)
      const response = await proyectosService.getProyectosPendientesGeneracion()
      if (response.success && response.data) {
        setProyectosPendientes(response.data)
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar proyectos pendientes')
    } finally {
      setIsLoading(false)
    }
  }

  // Selección
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(proyectosPendientes.map((p) => p._id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  // Generar masivamente
  const handleGenerarMasivo = async () => {
    setShowConfirmDialog(false)
    setIsGenerating(true)

    try {
      const response = await proyectosService.ejecutarGeneracionMasiva()

      if (response.success && response.data) {
        setResultados(response.data)
        setShowResultados(true)

        if (response.data.totalExitos > 0) {
          toast.success(`${response.data.totalExitos} documentos generados correctamente`)
        }
        if (response.data.totalErrores > 0) {
          toast.error(`${response.data.totalErrores} errores durante la generación`)
        }

        // Recargar lista
        await loadProyectosPendientes()
        setSelectedIds(new Set())
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al generar documentos')
    } finally {
      setIsGenerating(false)
    }
  }

  // Generar individual
  const handleGenerarIndividual = async (proyectoId: string) => {
    try {
      const response = await proyectosService.procesarRecurrente(proyectoId)

      if (response.success && response.data) {
        const data = response.data
        if (data.exito) {
          if (data.parteTrabajoNumero) {
            toast.success(`Parte de trabajo ${data.parteTrabajoNumero} generado`)
          }
          if (data.albaranNumero) {
            toast.success(`Albarán ${data.albaranNumero} generado`)
          }
          await loadProyectosPendientes()
        } else {
          toast.error(data.error || 'Error al generar')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al generar')
    }
  }

  return (
      <>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/proyectos">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Generación Periódica</h1>
              <p className="text-sm text-muted-foreground">
                Proyectos recurrentes pendientes de generación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadProyectosPendientes}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>

            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={proyectosPendientes.length === 0 || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Generar Todos ({proyectosPendientes.length})
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">{proyectosPendientes.length}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Generarán Parte</p>
                  <p className="text-2xl font-bold">
                    {proyectosPendientes.filter((p) => p.recurrencia?.generarParteTrabajo).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Generarán Albarán</p>
                  <p className="text-2xl font-bold">
                    {proyectosPendientes.filter((p) => p.recurrencia?.generarAlbaran).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Generarán Factura</p>
                  <p className="text-2xl font-bold">
                    {proyectosPendientes.filter((p) => p.recurrencia?.generarFactura).length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de proyectos */}
        <Card>
          <CardHeader>
            <CardTitle>Proyectos Pendientes</CardTitle>
            <CardDescription>
              Proyectos con recurrencia activa cuya fecha de próxima generación ya ha pasado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : proyectosPendientes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === proyectosPendientes.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Próxima Generación</TableHead>
                    <TableHead>Acciones</TableHead>
                    <TableHead className="text-right">Generar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proyectosPendientes.map((proyecto) => {
                    const clienteNombre =
                      typeof proyecto.clienteId === 'object'
                        ? proyecto.clienteId.nombre || proyecto.clienteId.nombreComercial
                        : 'N/A'

                    return (
                      <TableRow key={proyecto._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(proyecto._id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(proyecto._id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/proyectos/${proyecto._id}`}
                            className="font-medium hover:underline"
                          >
                            {proyecto.nombre}
                          </Link>
                          <p className="text-xs text-muted-foreground font-mono">
                            {proyecto.codigo}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{clienteNombre}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {FRECUENCIA_LABELS[proyecto.recurrencia?.frecuencia || ''] ||
                              proyecto.recurrencia?.frecuencia}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {proyecto.recurrencia?.proximaGeneracion && (
                            <span className="text-sm">
                              {new Date(
                                proyecto.recurrencia.proximaGeneracion
                              ).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {proyecto.recurrencia?.generarParteTrabajo && (
                              <Badge variant="secondary" className="text-xs">
                                <ClipboardList className="h-3 w-3 mr-1" />
                                PT
                              </Badge>
                            )}
                            {proyecto.recurrencia?.generarAlbaran && (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                ALB
                              </Badge>
                            )}
                            {proyecto.recurrencia?.generarFactura && (
                              <Badge variant="secondary" className="text-xs">
                                <Receipt className="h-3 w-3 mr-1" />
                                FAC
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerarIndividual(proyecto._id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                <h3 className="text-lg font-semibold mb-1">Todo al día</h3>
                <p className="text-sm text-muted-foreground">
                  No hay proyectos recurrentes pendientes de generación
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados de última generación */}
        {showResultados && resultados && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resultados de Generación</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowResultados(false)}>
                  Cerrar
                </Button>
              </div>
              <CardDescription>
                {new Date(resultados.fecha).toLocaleString('es-ES')} -{' '}
                {resultados.totalProyectosProcessados} proyectos procesados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {resultados.totalExitos} éxitos
                </Badge>
                {resultados.totalErrores > 0 && (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    {resultados.totalErrores} errores
                  </Badge>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {resultados.resultados.map((resultado, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      resultado.exito ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{resultado.proyectoNombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {resultado.proyectoCodigo} - {resultado.clienteNombre}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {resultado.exito ? (
                        <>
                          {resultado.parteTrabajoNumero && (
                            <Badge variant="outline" className="text-xs">
                              PT: {resultado.parteTrabajoNumero}
                            </Badge>
                          )}
                          {resultado.albaranNumero && (
                            <Badge variant="outline" className="text-xs">
                              ALB: {resultado.albaranNumero}
                            </Badge>
                          )}
                          {resultado.facturaNumero && (
                            <Badge variant="outline" className="text-xs">
                              FAC: {resultado.facturaNumero}
                            </Badge>
                          )}
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-red-600">{resultado.error}</span>
                          <XCircle className="h-4 w-4 text-red-600" />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Confirmar generación masiva
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se van a generar documentos para <strong>{proyectosPendientes.length}</strong>{' '}
              proyectos recurrentes pendientes. Esta acción creará:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  {proyectosPendientes.filter((p) => p.recurrencia?.generarParteTrabajo).length}{' '}
                  partes de trabajo
                </li>
                <li>
                  {proyectosPendientes.filter((p) => p.recurrencia?.generarAlbaran || p.recurrencia?.generarFactura).length}{' '}
                  albaranes
                </li>
                <li>
                  {proyectosPendientes.filter((p) => p.recurrencia?.generarFactura).length}{' '}
                  facturas
                </li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerarMasivo}>
              <Play className="h-4 w-4 mr-2" />
              Generar Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
  )
}
