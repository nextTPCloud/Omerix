'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { traspasosService, Traspaso, EstadoTraspaso, SearchTraspasosParams } from '@/services/traspasos.service'
import { almacenesService } from '@/services/almacenes.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  Eye,
  RefreshCw,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Warehouse,
  Calendar,
  XCircle,
  ArrowRightLeft,
  Truck,
  PackageCheck,
  Send,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { ExportButton } from '@/components/ui/ExportButton'
import { Textarea } from '@/components/ui/textarea'

export default function TraspasosPage() {
  const router = useRouter()

  // Estado de datos
  const [traspasos, setTraspasos] = useState<Traspaso[]>([])
  const [almacenes, setAlmacenes] = useState<{ _id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 })
  const [stats, setStats] = useState({ pendientes: 0, enTransito: 0, completados: 0, anulados: 0 })

  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [almacenOrigenFilter, setAlmacenOrigenFilter] = useState<string>('')
  const [almacenDestinoFilter, setAlmacenDestinoFilter] = useState<string>('')
  const [estadoFilter, setEstadoFilter] = useState<string>('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [sortBy, setSortBy] = useState('fechaCreacion')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Dialogs
  const [showAnularDialog, setShowAnularDialog] = useState(false)
  const [selectedTraspaso, setSelectedTraspaso] = useState<Traspaso | null>(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [procesando, setProcesando] = useState(false)

  // Cargar almacenes
  useEffect(() => {
    const loadAlmacenes = async () => {
      try {
        const res = await almacenesService.getActivos()
        setAlmacenes(res.data || [])
      } catch (error) {
        console.error('Error cargando almacenes:', error)
      }
    }
    loadAlmacenes()
  }, [])

  // Cargar traspasos
  const loadTraspasos = useCallback(async () => {
    setLoading(true)
    try {
      const params: SearchTraspasosParams = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        q: searchQuery || undefined,
      }

      if (almacenOrigenFilter) params.almacenOrigenId = almacenOrigenFilter
      if (almacenDestinoFilter) params.almacenDestinoId = almacenDestinoFilter
      if (estadoFilter) params.estado = estadoFilter as EstadoTraspaso
      if (fechaDesde) params.fechaDesde = fechaDesde
      if (fechaHasta) params.fechaHasta = fechaHasta

      const [traspasosRes, statsRes] = await Promise.all([
        traspasosService.listar(params),
        traspasosService.estadisticas(),
      ])

      setTraspasos(traspasosRes.data || [])
      setPagination(prev => ({
        ...prev,
        total: traspasosRes.pagination?.total || 0,
        totalPages: traspasosRes.pagination?.totalPages || 0,
      }))
      setStats(statsRes.data || { pendientes: 0, enTransito: 0, completados: 0, anulados: 0 })
    } catch (error) {
      console.error('Error cargando traspasos:', error)
      toast.error('Error al cargar los traspasos')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, searchQuery, almacenOrigenFilter, almacenDestinoFilter, estadoFilter, fechaDesde, fechaHasta])

  useEffect(() => {
    loadTraspasos()
  }, [loadTraspasos])

  // Confirmar salida
  const handleConfirmarSalida = async (traspaso: Traspaso) => {
    setProcesando(true)
    try {
      await traspasosService.confirmarSalida(traspaso._id)
      toast.success('Salida confirmada correctamente')
      loadTraspasos()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al confirmar salida')
    } finally {
      setProcesando(false)
    }
  }

  // Confirmar recepción
  const handleConfirmarRecepcion = async (traspaso: Traspaso) => {
    setProcesando(true)
    try {
      await traspasosService.confirmarRecepcion(traspaso._id)
      toast.success('Recepción confirmada correctamente')
      loadTraspasos()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al confirmar recepción')
    } finally {
      setProcesando(false)
    }
  }

  // Anular traspaso
  const handleAnular = async () => {
    if (!selectedTraspaso || !motivoAnulacion.trim()) return

    setProcesando(true)
    try {
      await traspasosService.anular(selectedTraspaso._id, motivoAnulacion)
      toast.success('Traspaso anulado correctamente')
      setShowAnularDialog(false)
      setMotivoAnulacion('')
      loadTraspasos()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al anular traspaso')
    } finally {
      setProcesando(false)
    }
  }

  // Ordenación
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // Limpiar filtros
  const clearFilters = () => {
    setSearchQuery('')
    setAlmacenOrigenFilter('')
    setAlmacenDestinoFilter('')
    setEstadoFilter('')
    setFechaDesde('')
    setFechaHasta('')
  }

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 opacity-50" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  return (
      <>
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArrowRightLeft className="h-6 w-6" />
              Traspasos entre Almacenes
            </h1>
            <p className="text-muted-foreground">Gestión de transferencias de stock</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadTraspasos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Link href="/almacenes/traspasos/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Traspaso
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pendientes}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">En Tránsito</p>
                <p className="text-2xl font-bold text-blue-600">{stats.enTransito}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <PackageCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold text-green-600">{stats.completados}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm text-muted-foreground">Anulados</p>
                <p className="text-2xl font-bold text-gray-500">{stats.anulados}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={almacenOrigenFilter} onValueChange={setAlmacenOrigenFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Almacén origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los orígenes</SelectItem>
                {almacenes.map(a => (
                  <SelectItem key={a._id} value={a._id}>{a.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={almacenDestinoFilter} onValueChange={setAlmacenDestinoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Almacén destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los destinos</SelectItem>
                {almacenes.map(a => (
                  <SelectItem key={a._id} value={a._id}>{a.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="en_transito">En tránsito</SelectItem>
                <SelectItem value="recibido_parcial">Recibido parcial</SelectItem>
                <SelectItem value="recibido">Recibido</SelectItem>
                <SelectItem value="anulado">Anulado</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              placeholder="Desde"
            />

            <div className="flex gap-2">
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                placeholder="Hasta"
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabla */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-left cursor-pointer hover:bg-muted" onClick={() => handleSort('codigo')}>
                    <div className="flex items-center gap-1">Código {renderSortIcon('codigo')}</div>
                  </th>
                  <th className="p-3 text-left cursor-pointer hover:bg-muted" onClick={() => handleSort('fechaCreacion')}>
                    <div className="flex items-center gap-1">Fecha {renderSortIcon('fechaCreacion')}</div>
                  </th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-left">Origen</th>
                  <th className="p-3 text-left">Destino</th>
                  <th className="p-3 text-right">Productos</th>
                  <th className="p-3 text-right">Unidades</th>
                  <th className="p-3 text-right">Valor</th>
                  <th className="p-3 text-center">Prioridad</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : traspasos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                      No hay traspasos que mostrar
                    </td>
                  </tr>
                ) : (
                  traspasos.map((tr) => (
                    <tr key={tr._id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-mono font-medium">{tr.codigo}</td>
                      <td className="p-3">{formatDate(tr.fechaCreacion)}</td>
                      <td className="p-3">
                        <Badge variant={traspasosService.getEstadoVariant(tr.estado)}>
                          {traspasosService.getEstadoLabel(tr.estado)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          {tr.almacenOrigenNombre}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          {tr.almacenDestinoNombre}
                        </div>
                      </td>
                      <td className="p-3 text-right">{tr.totalProductos}</td>
                      <td className="p-3 text-right">{tr.totalUnidades}</td>
                      <td className="p-3 text-right">{formatCurrency(tr.valorTotal)}</td>
                      <td className="p-3 text-center">
                        <span className={`font-medium ${traspasosService.getPrioridadColor(tr.prioridad)}`}>
                          {tr.prioridad.charAt(0).toUpperCase() + tr.prioridad.slice(1)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={procesando}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/almacenes/traspasos/${tr._id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>

                            {traspasosService.puedeConfirmarSalida(tr.estado) && (
                              <DropdownMenuItem onClick={() => handleConfirmarSalida(tr)}>
                                <Send className="h-4 w-4 mr-2" />
                                Confirmar Salida
                              </DropdownMenuItem>
                            )}

                            {traspasosService.puedeConfirmarRecepcion(tr.estado) && (
                              <DropdownMenuItem onClick={() => handleConfirmarRecepcion(tr)}>
                                <PackageCheck className="h-4 w-4 mr-2" />
                                Confirmar Recepción
                              </DropdownMenuItem>
                            )}

                            {traspasosService.puedeAnular(tr.estado) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedTraspaso(tr)
                                    setShowAnularDialog(true)
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Anular
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {traspasos.length} de {pagination.total} traspasos
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: 1 }))}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">Página {pagination.page} de {pagination.totalPages || 1}</span>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.totalPages }))}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Dialog Anular */}
      <Dialog open={showAnularDialog} onOpenChange={setShowAnularDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Traspaso</DialogTitle>
            <DialogDescription>
              Esta acción revertirá los movimientos de stock realizados.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Motivo de anulación *</label>
            <Textarea
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              placeholder="Ingrese el motivo..."
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnularDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleAnular}
              disabled={procesando || !motivoAnulacion.trim()}
            >
              {procesando ? 'Anulando...' : 'Anular Traspaso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
  )
}
