'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { fichajesService, SearchFichajesParams } from '@/services/fichajes.service'
import { personalService } from '@/services/personal.service'
import { departamentosService } from '@/services/departamentos.service'
import { Fichaje, TIPOS_FICHAJE, ESTADOS_FICHAJE } from '@/types/fichaje.types'
import { Personal } from '@/types/personal.types'
import { Departamento } from '@/types/departamento.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Fingerprint, RefreshCw, Calendar, Clock, LogIn, LogOut,
  Building2, Home, Plane, GraduationCap, ChevronLeft, ChevronRight,
  Filter, Download, CheckCircle, XCircle, AlertCircle, Eye, MapPin, Wifi,
  Pause, X,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function FichajesListPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [fichajes, setFichajes] = useState<Fichaje[]>([])
  const [personalList, setPersonalList] = useState<Personal[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(25)

  // Detalle fichaje
  const [fichajeSeleccionado, setFichajeSeleccionado] = useState<Fichaje | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Filtros
  const [filters, setFilters] = useState<SearchFichajesParams>({
    fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fechaHasta: new Date().toISOString().split('T')[0],
    personalId: '',
    departamentoId: '',
    estado: '',
    tipo: '',
    sortBy: 'fecha',
    sortOrder: 'desc',
  })

  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true)

      const [fichajesRes, personalRes, deptosRes] = await Promise.all([
        fichajesService.getAll({
          ...filters,
          personalId: filters.personalId || undefined,
          departamentoId: filters.departamentoId || undefined,
          estado: filters.estado || undefined,
          tipo: filters.tipo || undefined,
          page,
          limit,
        }),
        personalService.getAll({ activo: true, limit: 100 }),
        departamentosService.getActivos(),
      ])

      if (fichajesRes.success) {
        setFichajes(fichajesRes.data)
        setTotal(fichajesRes.total || 0)
      }

      if (personalRes.success) {
        setPersonalList(personalRes.data)
      }

      if (deptosRes.success) {
        setDepartamentos(deptosRes.data)
      }
    } catch (error) {
      toast.error('Error al cargar fichajes')
    } finally {
      setIsLoading(false)
    }
  }, [filters, page, limit])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const totalPages = Math.ceil(total / limit)

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'normal': return <Building2 className="h-4 w-4" />
      case 'teletrabajo': return <Home className="h-4 w-4" />
      case 'viaje': return <Plane className="h-4 w-4" />
      case 'formacion': return <GraduationCap className="h-4 w-4" />
      default: return <Building2 className="h-4 w-4" />
    }
  }

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'abierto': return 'bg-blue-100 text-blue-800'
      case 'cerrado': return 'bg-gray-100 text-gray-800'
      case 'aprobado': return 'bg-green-100 text-green-800'
      case 'rechazado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  const formatHora = (fecha?: string) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const limpiarFiltros = () => {
    setFilters({
      fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      fechaHasta: new Date().toISOString().split('T')[0],
      personalId: '',
      departamentoId: '',
      estado: '',
      tipo: '',
      sortBy: 'fecha',
      sortOrder: 'desc',
    })
    setPage(1)
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Fingerprint className="h-7 w-7 text-primary" />
              Fichajes
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestion de fichajes de personal ({total} registros)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cargarDatos} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Desde</label>
                <Input
                  type="date"
                  value={filters.fechaDesde || ''}
                  onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Hasta</label>
                <Input
                  type="date"
                  value={filters.fechaHasta || ''}
                  onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Empleado</label>
                <Select
                  value={filters.personalId || ''}
                  onValueChange={(v) => setFilters({ ...filters, personalId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {personalList.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.nombre} {p.apellidos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Departamento</label>
                <Select
                  value={filters.departamentoId || ''}
                  onValueChange={(v) => setFilters({ ...filters, departamentoId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {departamentos.map((d) => (
                      <SelectItem key={d._id} value={d._id}>
                        {d.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Estado</label>
                <Select
                  value={filters.estado || ''}
                  onValueChange={(v) => setFilters({ ...filters, estado: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {ESTADOS_FICHAJE.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Tipo</label>
                <Select
                  value={filters.tipo || ''}
                  onValueChange={(v) => setFilters({ ...filters, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {TIPOS_FICHAJE.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : fichajes.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground">
                <Fingerprint className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No hay fichajes que coincidan con los filtros</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Entrada</TableHead>
                    <TableHead className="text-center">Salida</TableHead>
                    <TableHead className="text-center">Horas</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="text-center w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fichajes.map((fichaje) => (
                    <TableRow key={fichaje._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatFecha(fichaje.fecha)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {fichaje.personalNombre || 'Sin nombre'}
                          </p>
                          {fichaje.departamentoNombre && (
                            <p className="text-xs text-muted-foreground">
                              {fichaje.departamentoNombre}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getIconoTipo(fichaje.tipo)}
                          <span className="text-sm">
                            {TIPOS_FICHAJE.find((t) => t.value === fichaje.tipo)?.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <LogIn className="h-3 w-3 text-green-600" />
                          {formatHora(fichaje.horaEntrada)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <LogOut className="h-3 w-3 text-red-600" />
                          {formatHora(fichaje.horaSalida)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {fichaje.horasTrabajadas !== undefined && fichaje.horasTrabajadas > 0
                          ? `${fichaje.horasTrabajadas.toFixed(1)}h`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getColorEstado(fichaje.estado)}>
                          {ESTADOS_FICHAJE.find((e) => e.value === fichaje.estado)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {fichaje.observaciones || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFichajeSeleccionado(fichaje)
                            setDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Paginacion */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-3 text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Dialog detalle fichaje */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Detalle del Fichaje
            </DialogTitle>
          </DialogHeader>

          {fichajeSeleccionado && (
            <div className="space-y-4">
              {/* Empleado */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-semibold text-lg">
                  {fichajeSeleccionado.personalNombre || 'Sin nombre'}
                </p>
                {fichajeSeleccionado.departamentoNombre && (
                  <p className="text-sm text-muted-foreground">
                    {fichajeSeleccionado.departamentoNombre}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {formatFecha(fichajeSeleccionado.fecha)}
                </p>
              </div>

              {/* Horarios */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <LogIn className="h-4 w-4" />
                    <span className="text-sm font-medium">Entrada</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatHora(fichajeSeleccionado.horaEntrada)}
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Salida</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatHora(fichajeSeleccionado.horaSalida)}
                  </p>
                </div>
              </div>

              {/* Pausa */}
              {(fichajeSeleccionado.pausaInicio || fichajeSeleccionado.pausaFin) && (
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-600 mb-1">
                    <Pause className="h-4 w-4" />
                    <span className="text-sm font-medium">Pausa</span>
                  </div>
                  <p className="text-sm">
                    {formatHora(fichajeSeleccionado.pausaInicio)} - {formatHora(fichajeSeleccionado.pausaFin)}
                  </p>
                </div>
              )}

              {/* Horas trabajadas */}
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">Horas trabajadas</span>
                </div>
                <span className="text-lg font-semibold">
                  {fichajeSeleccionado.horasTrabajadas?.toFixed(2) || '0'} h
                </span>
              </div>

              {/* Tipo y Estado */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIconoTipo(fichajeSeleccionado.tipo)}
                  <span>{TIPOS_FICHAJE.find((t) => t.value === fichajeSeleccionado.tipo)?.label}</span>
                </div>
                <Badge className={getColorEstado(fichajeSeleccionado.estado)}>
                  {ESTADOS_FICHAJE.find((e) => e.value === fichajeSeleccionado.estado)?.label}
                </Badge>
              </div>

              {/* Ubicación Entrada */}
              {fichajeSeleccionado.ubicacionEntrada && (
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Ubicación Entrada</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Lat: {fichajeSeleccionado.ubicacionEntrada.latitud?.toFixed(6)},
                    Lng: {fichajeSeleccionado.ubicacionEntrada.longitud?.toFixed(6)}
                  </p>
                  {fichajeSeleccionado.ubicacionEntrada.direccion && (
                    <p className="text-sm mt-1">{fichajeSeleccionado.ubicacionEntrada.direccion}</p>
                  )}
                  <a
                    href={`https://www.google.com/maps?q=${fichajeSeleccionado.ubicacionEntrada.latitud},${fichajeSeleccionado.ubicacionEntrada.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Ver en Google Maps
                  </a>
                </div>
              )}

              {/* Ubicación Salida */}
              {fichajeSeleccionado.ubicacionSalida && (
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Ubicación Salida</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Lat: {fichajeSeleccionado.ubicacionSalida.latitud?.toFixed(6)},
                    Lng: {fichajeSeleccionado.ubicacionSalida.longitud?.toFixed(6)}
                  </p>
                  {fichajeSeleccionado.ubicacionSalida.direccion && (
                    <p className="text-sm mt-1">{fichajeSeleccionado.ubicacionSalida.direccion}</p>
                  )}
                  <a
                    href={`https://www.google.com/maps?q=${fichajeSeleccionado.ubicacionSalida.latitud},${fichajeSeleccionado.ubicacionSalida.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Ver en Google Maps
                  </a>
                </div>
              )}

              {/* IPs */}
              {(fichajeSeleccionado.ipEntrada || fichajeSeleccionado.ipSalida) && (
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm font-medium">Direcciones IP</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {fichajeSeleccionado.ipEntrada && (
                      <div>
                        <span className="text-muted-foreground">Entrada:</span>{' '}
                        <span className="font-mono">{fichajeSeleccionado.ipEntrada}</span>
                      </div>
                    )}
                    {fichajeSeleccionado.ipSalida && (
                      <div>
                        <span className="text-muted-foreground">Salida:</span>{' '}
                        <span className="font-mono">{fichajeSeleccionado.ipSalida}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {fichajeSeleccionado.observaciones && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Observaciones</p>
                  <p className="text-sm text-muted-foreground">
                    {fichajeSeleccionado.observaciones}
                  </p>
                </div>
              )}

              {/* Incidencia */}
              {fichajeSeleccionado.incidencia && (
                <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Incidencia</span>
                  </div>
                  <p className="text-sm text-red-700">
                    {fichajeSeleccionado.incidencia}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
