'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { pagaresService } from '@/services/pagares.service'
import {
  IPagare,
  IPagareFilters,
  EstadoPagare,
  TipoPagare,
  ESTADO_PAGARE_COLORS,
  ESTADO_PAGARE_LABELS,
  TIPO_PAGARE_LABELS,
} from '@/types/pagare.types'
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
  DropdownMenuLabel,
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
  Plus,
  Search,
  Eye,
  MoreHorizontal,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Banknote,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function PagaresPage() {
  const router = useRouter()
  const [pagares, setPagares] = useState<IPagare[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<string>('all')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('fechaVencimiento')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Estadísticas
  const [stats, setStats] = useState({
    totalPendientes: 0,
    importePendiente: 0,
    totalCobrados: 0,
    importeCobrado: 0,
    totalDevueltos: 0,
    importeDevuelto: 0,
    proximosVencimientos: 0,
  })

  // Dialog de cobro
  const [cobroDialog, setCobroDialog] = useState<{
    open: boolean
    pagare: IPagare | null
  }>({ open: false, pagare: null })
  const [fechaCobro, setFechaCobro] = useState('')
  const [observacionesCobro, setObservacionesCobro] = useState('')

  // Dialog de devolución
  const [devolucionDialog, setDevolucionDialog] = useState<{
    open: boolean
    pagare: IPagare | null
  }>({ open: false, pagare: null })
  const [motivoDevolucion, setMotivoDevolucion] = useState('')
  const [comisionDevolucion, setComisionDevolucion] = useState('')

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  })

  // Cargar pagarés
  const cargarPagares = useCallback(async () => {
    try {
      setIsLoading(true)
      const filters: IPagareFilters = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      }

      if (searchTerm) filters.q = searchTerm
      if (estadoFilter && estadoFilter !== 'all') filters.estado = estadoFilter as EstadoPagare
      if (tipoFilter && tipoFilter !== 'all') filters.tipo = tipoFilter as TipoPagare

      const response = await pagaresService.getAll(filters)

      if (response.success) {
        setPagares(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      }
    } catch (error) {
      console.error('Error cargando pagarés:', error)
      toast.error('Error al cargar los pagarés')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm, estadoFilter, tipoFilter, sortBy, sortOrder])

  // Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      const response = await pagaresService.getEstadisticas()
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }, [])

  useEffect(() => {
    cargarPagares()
    cargarEstadisticas()
  }, [cargarPagares, cargarEstadisticas])

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    cargarPagares()
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const handleCobrar = async () => {
    if (!cobroDialog.pagare) return

    try {
      const response = await pagaresService.marcarCobrado(cobroDialog.pagare._id, {
        fechaCobro: fechaCobro || undefined,
        observaciones: observacionesCobro || undefined,
      })

      if (response.success) {
        toast.success('Pagaré marcado como cobrado')
        setCobroDialog({ open: false, pagare: null })
        setFechaCobro('')
        setObservacionesCobro('')
        cargarPagares()
        cargarEstadisticas()
      }
    } catch (error) {
      console.error('Error al cobrar pagaré:', error)
      toast.error('Error al marcar el pagaré como cobrado')
    }
  }

  const handleDevolver = async () => {
    if (!devolucionDialog.pagare || !motivoDevolucion) return

    try {
      const response = await pagaresService.marcarDevuelto(devolucionDialog.pagare._id, {
        motivo: motivoDevolucion,
        comision: comisionDevolucion ? parseFloat(comisionDevolucion) : undefined,
      })

      if (response.success) {
        toast.success('Pagaré marcado como devuelto')
        setDevolucionDialog({ open: false, pagare: null })
        setMotivoDevolucion('')
        setComisionDevolucion('')
        cargarPagares()
        cargarEstadisticas()
      }
    } catch (error) {
      console.error('Error al devolver pagaré:', error)
      toast.error('Error al marcar el pagaré como devuelto')
    }
  }

  const handleAnular = async (pagare: IPagare) => {
    if (!confirm('¿Está seguro de anular este pagaré?')) return

    try {
      const response = await pagaresService.anular(pagare._id)
      if (response.success) {
        toast.success('Pagaré anulado')
        cargarPagares()
        cargarEstadisticas()
      }
    } catch (error) {
      console.error('Error al anular pagaré:', error)
      toast.error('Error al anular el pagaré')
    }
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pagarés</h1>
            <p className="text-muted-foreground">Gestión de pagarés emitidos y recibidos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { cargarPagares(); cargarEstadisticas(); }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button onClick={() => router.push('/tesoreria/pagares/nuevo')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Pagaré
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.importePendiente)}</p>
                <p className="text-xs text-muted-foreground">{stats.totalPendientes} pagarés</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cobrados</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.importeCobrado)}</p>
                <p className="text-xs text-muted-foreground">{stats.totalCobrados} pagarés</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Devueltos</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.importeDevuelto)}</p>
                <p className="text-xs text-muted-foreground">{stats.totalDevueltos} pagarés</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-100 p-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Próximos a vencer</p>
                <p className="text-2xl font-bold">{stats.proximosVencimientos}</p>
                <p className="text-xs text-muted-foreground">En los próximos 7 días</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, tercero..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value={TipoPagare.EMITIDO}>Emitidos</SelectItem>
                <SelectItem value={TipoPagare.RECIBIDO}>Recibidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.values(EstadoPagare).map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {ESTADO_PAGARE_LABELS[estado]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Buscar</Button>
          </form>
        </Card>

        {/* Tabla */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('numero')}>
                  <div className="flex items-center gap-2">
                    Número {getSortIcon('numero')}
                  </div>
                </TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tercero</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('importe')}>
                  <div className="flex items-center gap-2">
                    Importe {getSortIcon('importe')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('fechaVencimiento')}>
                  <div className="flex items-center gap-2">
                    Vencimiento {getSortIcon('fechaVencimiento')}
                  </div>
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : pagares.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron pagarés
                  </TableCell>
                </TableRow>
              ) : (
                pagares.map((pagare) => {
                  const vencido = new Date(pagare.fechaVencimiento) < new Date() &&
                    pagare.estado === EstadoPagare.PENDIENTE

                  return (
                    <TableRow key={pagare._id} className={vencido ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {pagare.numero}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TIPO_PAGARE_LABELS[pagare.tipo]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pagare.terceroNombre}</p>
                          {pagare.terceroNif && (
                            <p className="text-sm text-muted-foreground">{pagare.terceroNif}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(pagare.importe)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {vencido && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {formatDate(pagare.fechaVencimiento)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ESTADO_PAGARE_COLORS[pagare.estado]}>
                          {ESTADO_PAGARE_LABELS[pagare.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/tesoreria/pagares/${pagare._id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {pagare.estado === EstadoPagare.PENDIENTE && (
                              <>
                                <DropdownMenuItem onClick={() => setCobroDialog({ open: true, pagare })}>
                                  <Banknote className="mr-2 h-4 w-4" />
                                  Marcar como cobrado
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDevolucionDialog({ open: true, pagare })}
                                  className="text-red-600"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Registrar devolución
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleAnular(pagare)}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Anular
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Dialog de Cobro */}
        <Dialog open={cobroDialog.open} onOpenChange={(open) => setCobroDialog({ open, pagare: cobroDialog.pagare })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar pagaré como cobrado</DialogTitle>
              <DialogDescription>
                Pagaré {cobroDialog.pagare?.numero} por {cobroDialog.pagare && formatCurrency(cobroDialog.pagare.importe)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fechaCobro">Fecha de cobro</Label>
                <Input
                  id="fechaCobro"
                  type="date"
                  value={fechaCobro}
                  onChange={(e) => setFechaCobro(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={observacionesCobro}
                  onChange={(e) => setObservacionesCobro(e.target.value)}
                  placeholder="Observaciones opcionales..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCobroDialog({ open: false, pagare: null })}>
                Cancelar
              </Button>
              <Button onClick={handleCobrar}>
                Confirmar cobro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Devolución */}
        <Dialog open={devolucionDialog.open} onOpenChange={(open) => setDevolucionDialog({ open, pagare: devolucionDialog.pagare })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar devolución de pagaré</DialogTitle>
              <DialogDescription>
                Pagaré {devolucionDialog.pagare?.numero} por {devolucionDialog.pagare && formatCurrency(devolucionDialog.pagare.importe)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="motivo">Motivo de devolución *</Label>
                <Textarea
                  id="motivo"
                  value={motivoDevolucion}
                  onChange={(e) => setMotivoDevolucion(e.target.value)}
                  placeholder="Indica el motivo de la devolución..."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comision">Comisión bancaria</Label>
                <Input
                  id="comision"
                  type="number"
                  step="0.01"
                  value={comisionDevolucion}
                  onChange={(e) => setComisionDevolucion(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDevolucionDialog({ open: false, pagare: null })}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDevolver} disabled={!motivoDevolucion}>
                Registrar devolución
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
