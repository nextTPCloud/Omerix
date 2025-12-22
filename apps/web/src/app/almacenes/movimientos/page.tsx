'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { stockService, MovimientoStock, TipoMovimiento, SearchMovimientosParams } from '@/services/stock.service'
import { almacenesService } from '@/services/almacenes.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  Eye,
  RefreshCw,
  MoreHorizontal,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  Warehouse,
  Calendar,
  XCircle,
  Filter,
  ArrowRightLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { ExportButton } from '@/components/ui/ExportButton'

// Hook de debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function MovimientosStockPage() {
  const router = useRouter()

  // Estado de datos
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([])
  const [almacenes, setAlmacenes] = useState<{ _id: string; nombre: string }[]>([])
  const [tiposMovimiento, setTiposMovimiento] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 })

  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [almacenFilter, setAlmacenFilter] = useState<string>('')
  const [tipoFilter, setTipoFilter] = useState<string>('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [incluirAnulados, setIncluirAnulados] = useState(false)
  const [sortBy, setSortBy] = useState('fecha')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Estado UI
  const [selectedMovimiento, setSelectedMovimiento] = useState<MovimientoStock | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showAnularDialog, setShowAnularDialog] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [anulando, setAnulando] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [almacenesRes, tiposRes] = await Promise.all([
          almacenesService.getActivos(),
          stockService.getTiposMovimiento(),
        ])
        setAlmacenes(almacenesRes.data || [])
        setTiposMovimiento(tiposRes.data?.tipos || [])
      } catch (error) {
        console.error('Error cargando datos iniciales:', error)
      }
    }
    loadInitialData()
  }, [])

  // Cargar movimientos
  const loadMovimientos = useCallback(async () => {
    setLoading(true)
    try {
      const params: SearchMovimientosParams = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        incluirAnulados,
      }

      if (almacenFilter) params.almacenId = almacenFilter
      if (tipoFilter) params.tipo = tipoFilter as TipoMovimiento
      if (fechaDesde) params.fechaDesde = fechaDesde
      if (fechaHasta) params.fechaHasta = fechaHasta

      const response = await stockService.getMovimientos(params)
      setMovimientos(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
      }))
    } catch (error) {
      console.error('Error cargando movimientos:', error)
      toast.error('Error al cargar los movimientos')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, almacenFilter, tipoFilter, fechaDesde, fechaHasta, incluirAnulados])

  useEffect(() => {
    loadMovimientos()
  }, [loadMovimientos])

  // Filtrar por búsqueda local
  const filteredMovimientos = useMemo(() => {
    if (!debouncedSearch) return movimientos
    const search = debouncedSearch.toLowerCase()
    return movimientos.filter(m =>
      m.productoNombre?.toLowerCase().includes(search) ||
      m.productoCodigo?.toLowerCase().includes(search) ||
      m.almacenNombre?.toLowerCase().includes(search) ||
      m.documentoOrigenCodigo?.toLowerCase().includes(search) ||
      m.terceroNombre?.toLowerCase().includes(search)
    )
  }, [movimientos, debouncedSearch])

  // Manejar ordenación
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // Anular movimiento
  const handleAnular = async () => {
    if (!selectedMovimiento || !motivoAnulacion.trim()) return

    setAnulando(true)
    try {
      await stockService.anularMovimiento(selectedMovimiento._id, motivoAnulacion)
      toast.success('Movimiento anulado correctamente')
      setShowAnularDialog(false)
      setMotivoAnulacion('')
      loadMovimientos()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al anular el movimiento')
    } finally {
      setAnulando(false)
    }
  }

  // Limpiar filtros
  const clearFilters = () => {
    setSearchQuery('')
    setAlmacenFilter('')
    setTipoFilter('')
    setFechaDesde('')
    setFechaHasta('')
    setIncluirAnulados(false)
  }

  // Obtener badge del tipo
  const getTipoBadge = (tipo: TipoMovimiento, anulado: boolean) => {
    if (anulado) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-500">Anulado</Badge>
    }
    const esEntrada = stockService.esEntrada(tipo)
    return (
      <Badge variant={esEntrada ? 'default' : 'secondary'} className={esEntrada ? 'bg-green-600' : ''}>
        {stockService.getTipoLabel(tipo)}
      </Badge>
    )
  }

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 opacity-50" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArrowRightLeft className="h-6 w-6" />
              Movimientos de Stock
            </h1>
            <p className="text-muted-foreground">Historial de entradas y salidas de almacén</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadMovimientos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <ExportButton
              data={filteredMovimientos.map(m => ({
                Fecha: formatDateTime(m.fecha),
                Tipo: stockService.getTipoLabel(m.tipo),
                Producto: m.productoNombre,
                Codigo: m.productoCodigo,
                Almacen: m.almacenNombre,
                Cantidad: m.cantidad,
                'Stock Anterior': m.stockAnterior,
                'Stock Posterior': m.stockPosterior,
                'Coste Unit.': m.costeUnitario,
                Valor: m.valorMovimiento,
                Documento: m.documentoOrigenCodigo || '',
                Tercero: m.terceroNombre || '',
                Motivo: m.motivo || '',
                Usuario: m.usuarioNombre,
                Anulado: m.anulado ? 'Sí' : 'No',
              }))}
              filename="movimientos-stock"
            />
          </div>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto, documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={almacenFilter} onValueChange={setAlmacenFilter}>
              <SelectTrigger>
                <Warehouse className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos los almacenes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los almacenes</SelectItem>
                {almacenes.map(a => (
                  <SelectItem key={a._id} value={a._id}>{a.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los tipos</SelectItem>
                {tiposMovimiento.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={incluirAnulados}
                  onCheckedChange={(checked) => setIncluirAnulados(checked as boolean)}
                />
                Incluir anulados
              </label>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <XCircle className="h-4 w-4 mr-1" />
                Limpiar
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
                  <th className="p-3 text-left cursor-pointer hover:bg-muted" onClick={() => handleSort('fecha')}>
                    <div className="flex items-center gap-1">Fecha {renderSortIcon('fecha')}</div>
                  </th>
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-left cursor-pointer hover:bg-muted" onClick={() => handleSort('productoNombre')}>
                    <div className="flex items-center gap-1">Producto {renderSortIcon('productoNombre')}</div>
                  </th>
                  <th className="p-3 text-left">Almacén</th>
                  <th className="p-3 text-right">Cantidad</th>
                  <th className="p-3 text-right">Stock Ant.</th>
                  <th className="p-3 text-right">Stock Post.</th>
                  <th className="p-3 text-left">Documento</th>
                  <th className="p-3 text-left">Tercero</th>
                  <th className="p-3 text-right">Valor</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : filteredMovimientos.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-muted-foreground">
                      No hay movimientos que mostrar
                    </td>
                  </tr>
                ) : (
                  filteredMovimientos.map((mov) => (
                    <tr
                      key={mov._id}
                      className={`border-b hover:bg-muted/50 ${mov.anulado ? 'opacity-60 bg-gray-50' : ''}`}
                    >
                      <td className="p-3">{formatDateTime(mov.fecha)}</td>
                      <td className="p-3">{getTipoBadge(mov.tipo, mov.anulado)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{mov.productoNombre}</div>
                            <div className="text-xs text-muted-foreground">{mov.productoCodigo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{mov.almacenNombre}</td>
                      <td className="p-3 text-right font-medium">
                        <span className={stockService.esEntrada(mov.tipo) ? 'text-green-600' : 'text-red-600'}>
                          {stockService.esEntrada(mov.tipo) ? '+' : '-'}{mov.cantidad}
                        </span>
                      </td>
                      <td className="p-3 text-right text-muted-foreground">{mov.stockAnterior}</td>
                      <td className="p-3 text-right font-medium">{mov.stockPosterior}</td>
                      <td className="p-3">
                        {mov.documentoOrigenCodigo && (
                          <Badge variant="outline">{mov.documentoOrigenCodigo}</Badge>
                        )}
                      </td>
                      <td className="p-3">{mov.terceroNombre || '-'}</td>
                      <td className="p-3 text-right">{formatCurrency(mov.valorMovimiento)}</td>
                      <td className="p-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedMovimiento(mov)
                              setShowDetailDialog(true)
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            {!mov.anulado && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedMovimiento(mov)
                                  setShowAnularDialog(true)
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Anular
                              </DropdownMenuItem>
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
              Mostrando {filteredMovimientos.length} de {pagination.total} movimientos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: 1 }))}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                Página {pagination.page} de {pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.totalPages }))}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Dialog Detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Movimiento</DialogTitle>
          </DialogHeader>
          {selectedMovimiento && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha</label>
                <p>{formatDateTime(selectedMovimiento.fecha)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <p>{getTipoBadge(selectedMovimiento.tipo, selectedMovimiento.anulado)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Producto</label>
                <p className="font-medium">{selectedMovimiento.productoNombre}</p>
                <p className="text-sm text-muted-foreground">{selectedMovimiento.productoCodigo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Almacén</label>
                <p>{selectedMovimiento.almacenNombre}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cantidad</label>
                <p className="font-medium">{selectedMovimiento.cantidad}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Stock</label>
                <p>{selectedMovimiento.stockAnterior} → {selectedMovimiento.stockPosterior}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Coste Unitario</label>
                <p>{formatCurrency(selectedMovimiento.costeUnitario)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                <p className="font-medium">{formatCurrency(selectedMovimiento.valorMovimiento)}</p>
              </div>
              {selectedMovimiento.documentoOrigenCodigo && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Documento Origen</label>
                  <p>{selectedMovimiento.documentoOrigenTipo}: {selectedMovimiento.documentoOrigenCodigo}</p>
                </div>
              )}
              {selectedMovimiento.terceroNombre && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tercero</label>
                  <p>{selectedMovimiento.terceroNombre} ({selectedMovimiento.terceroTipo})</p>
                </div>
              )}
              {selectedMovimiento.lote && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lote</label>
                  <p>{selectedMovimiento.lote}</p>
                </div>
              )}
              {selectedMovimiento.ubicacion && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                  <p>{selectedMovimiento.ubicacion}</p>
                </div>
              )}
              {selectedMovimiento.motivo && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Motivo</label>
                  <p>{selectedMovimiento.motivo}</p>
                </div>
              )}
              {selectedMovimiento.observaciones && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Observaciones</label>
                  <p>{selectedMovimiento.observaciones}</p>
                </div>
              )}
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Usuario</label>
                <p>{selectedMovimiento.usuarioNombre}</p>
              </div>
              {selectedMovimiento.anulado && (
                <div className="col-span-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-600 font-medium">Movimiento Anulado</p>
                  {selectedMovimiento.motivoAnulacion && (
                    <p className="text-sm text-red-500">Motivo: {selectedMovimiento.motivoAnulacion}</p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Anular */}
      <Dialog open={showAnularDialog} onOpenChange={setShowAnularDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Movimiento</DialogTitle>
            <DialogDescription>
              Esta acción creará un movimiento inverso para anular el efecto en el stock.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Motivo de anulación *</label>
            <Input
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              placeholder="Ingrese el motivo de la anulación..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnularDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleAnular}
              disabled={anulando || !motivoAnulacion.trim()}
            >
              {anulando ? 'Anulando...' : 'Anular Movimiento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
