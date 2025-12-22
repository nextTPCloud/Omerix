'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { recibosService } from '@/services/recibos.service'
import {
  IRecibo,
  IReciboFilters,
  EstadoRecibo,
  ESTADO_RECIBO_COLORS,
  ESTADO_RECIBO_LABELS,
} from '@/types/recibo.types'
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
import { Checkbox } from '@/components/ui/checkbox'
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
  Send,
  Building2,
  FileDown,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function RecibosPage() {
  const router = useRouter()
  const [recibos, setRecibos] = useState<IRecibo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('fechaVencimiento')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedRecibos, setSelectedRecibos] = useState<Set<string>>(new Set())

  // Estadísticas
  const [stats, setStats] = useState({
    totalEmitidos: 0,
    importeEmitido: 0,
    totalEnviados: 0,
    importeEnviado: 0,
    totalCobrados: 0,
    importeCobrado: 0,
    totalDevueltos: 0,
    importeDevuelto: 0,
  })

  // Dialog de cobro
  const [cobroDialog, setCobroDialog] = useState<{
    open: boolean
    recibo: IRecibo | null
  }>({ open: false, recibo: null })
  const [fechaCobro, setFechaCobro] = useState('')
  const [observacionesCobro, setObservacionesCobro] = useState('')

  // Dialog de devolución
  const [devolucionDialog, setDevolucionDialog] = useState<{
    open: boolean
    recibo: IRecibo | null
  }>({ open: false, recibo: null })
  const [motivoDevolucion, setMotivoDevolucion] = useState('')
  const [comisionDevolucion, setComisionDevolucion] = useState('')

  // Dialog de remesa
  const [remesaDialog, setRemesaDialog] = useState(false)
  const [nombreRemesa, setNombreRemesa] = useState('')
  const [fechaCargo, setFechaCargo] = useState('')

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  })

  // Cargar recibos
  const cargarRecibos = useCallback(async () => {
    try {
      setIsLoading(true)
      const filters: IReciboFilters = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      }

      if (searchTerm) filters.q = searchTerm
      if (estadoFilter && estadoFilter !== 'all') filters.estado = estadoFilter as EstadoRecibo

      const response = await recibosService.getAll(filters)

      if (response.success) {
        setRecibos(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      }
    } catch (error) {
      console.error('Error cargando recibos:', error)
      toast.error('Error al cargar los recibos')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm, estadoFilter, sortBy, sortOrder])

  // Calcular estadísticas localmente
  const calcularEstadisticas = useCallback(() => {
    const newStats = {
      totalEmitidos: 0,
      importeEmitido: 0,
      totalEnviados: 0,
      importeEnviado: 0,
      totalCobrados: 0,
      importeCobrado: 0,
      totalDevueltos: 0,
      importeDevuelto: 0,
    }

    recibos.forEach(recibo => {
      switch (recibo.estado) {
        case EstadoRecibo.EMITIDO:
          newStats.totalEmitidos++
          newStats.importeEmitido += recibo.importe
          break
        case EstadoRecibo.ENVIADO:
          newStats.totalEnviados++
          newStats.importeEnviado += recibo.importe
          break
        case EstadoRecibo.COBRADO:
          newStats.totalCobrados++
          newStats.importeCobrado += recibo.importe
          break
        case EstadoRecibo.DEVUELTO:
          newStats.totalDevueltos++
          newStats.importeDevuelto += recibo.importe
          break
      }
    })

    setStats(newStats)
  }, [recibos])

  useEffect(() => {
    cargarRecibos()
  }, [cargarRecibos])

  useEffect(() => {
    calcularEstadisticas()
  }, [calcularEstadisticas])

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    cargarRecibos()
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const handleSelectRecibo = (reciboId: string, checked: boolean) => {
    const newSelected = new Set(selectedRecibos)
    if (checked) {
      newSelected.add(reciboId)
    } else {
      newSelected.delete(reciboId)
    }
    setSelectedRecibos(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const eligibleRecibos = recibos
        .filter(r => r.estado === EstadoRecibo.EMITIDO)
        .map(r => r._id)
      setSelectedRecibos(new Set(eligibleRecibos))
    } else {
      setSelectedRecibos(new Set())
    }
  }

  const handleEnviar = async (recibo: IRecibo) => {
    try {
      const response = await recibosService.marcarEnviado(recibo._id)
      if (response.success) {
        toast.success('Recibo marcado como enviado')
        cargarRecibos()
      }
    } catch (error) {
      console.error('Error al enviar recibo:', error)
      toast.error('Error al marcar el recibo como enviado')
    }
  }

  const handleCobrar = async () => {
    if (!cobroDialog.recibo) return

    try {
      const response = await recibosService.marcarCobrado(cobroDialog.recibo._id, {
        fechaCobro: fechaCobro || undefined,
        observaciones: observacionesCobro || undefined,
      })

      if (response.success) {
        toast.success('Recibo marcado como cobrado')
        setCobroDialog({ open: false, recibo: null })
        setFechaCobro('')
        setObservacionesCobro('')
        cargarRecibos()
      }
    } catch (error) {
      console.error('Error al cobrar recibo:', error)
      toast.error('Error al marcar el recibo como cobrado')
    }
  }

  const handleDevolver = async () => {
    if (!devolucionDialog.recibo || !motivoDevolucion) return

    try {
      const response = await recibosService.marcarDevuelto(devolucionDialog.recibo._id, {
        motivo: motivoDevolucion,
        comision: comisionDevolucion ? parseFloat(comisionDevolucion) : undefined,
      })

      if (response.success) {
        toast.success('Recibo marcado como devuelto')
        setDevolucionDialog({ open: false, recibo: null })
        setMotivoDevolucion('')
        setComisionDevolucion('')
        cargarRecibos()
      }
    } catch (error) {
      console.error('Error al devolver recibo:', error)
      toast.error('Error al marcar el recibo como devuelto')
    }
  }

  const handleAnular = async (recibo: IRecibo) => {
    if (!confirm('¿Está seguro de anular este recibo?')) return

    try {
      const response = await recibosService.anular(recibo._id)
      if (response.success) {
        toast.success('Recibo anulado')
        cargarRecibos()
      }
    } catch (error) {
      console.error('Error al anular recibo:', error)
      toast.error('Error al anular el recibo')
    }
  }

  const handleCrearRemesa = async () => {
    if (selectedRecibos.size === 0 || !nombreRemesa) {
      toast.error('Seleccione recibos y proporcione un nombre para la remesa')
      return
    }

    try {
      const response = await recibosService.crearRemesa({
        nombre: nombreRemesa,
        reciboIds: Array.from(selectedRecibos),
        fechaCargo: fechaCargo || undefined,
      })

      if (response.success) {
        toast.success(`Remesa creada con ${selectedRecibos.size} recibos`)
        setRemesaDialog(false)
        setNombreRemesa('')
        setFechaCargo('')
        setSelectedRecibos(new Set())
        cargarRecibos()
      }
    } catch (error) {
      console.error('Error al crear remesa:', error)
      toast.error('Error al crear la remesa')
    }
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const eligibleForRemesa = recibos.filter(r => r.estado === EstadoRecibo.EMITIDO)
  const allEligibleSelected = eligibleForRemesa.length > 0 &&
    eligibleForRemesa.every(r => selectedRecibos.has(r._id))

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Recibos</h1>
            <p className="text-muted-foreground">Gestión de recibos bancarios y domiciliaciones</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cargarRecibos}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            {selectedRecibos.size > 0 && (
              <Button variant="secondary" onClick={() => setRemesaDialog(true)}>
                <Package className="mr-2 h-4 w-4" />
                Crear remesa ({selectedRecibos.size})
              </Button>
            )}
            <Button onClick={() => router.push('/tesoreria/recibos/nuevo')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Recibo
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emitidos</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.importeEmitido)}</p>
                <p className="text-xs text-muted-foreground">{stats.totalEmitidos} recibos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <Send className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enviados al banco</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.importeEnviado)}</p>
                <p className="text-xs text-muted-foreground">{stats.totalEnviados} recibos</p>
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
                <p className="text-xs text-muted-foreground">{stats.totalCobrados} recibos</p>
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
                <p className="text-xs text-muted-foreground">{stats.totalDevueltos} recibos</p>
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
                  placeholder="Buscar por número, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.values(EstadoRecibo).map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {ESTADO_RECIBO_LABELS[estado]}
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
                <TableHead className="w-12">
                  <Checkbox
                    checked={allEligibleSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Seleccionar todos"
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('numero')}>
                  <div className="flex items-center gap-2">
                    Número {getSortIcon('numero')}
                  </div>
                </TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Concepto</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : recibos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron recibos
                  </TableCell>
                </TableRow>
              ) : (
                recibos.map((recibo) => {
                  const vencido = new Date(recibo.fechaVencimiento) < new Date() &&
                    (recibo.estado === EstadoRecibo.EMITIDO || recibo.estado === EstadoRecibo.ENVIADO)
                  const isEligible = recibo.estado === EstadoRecibo.EMITIDO

                  return (
                    <TableRow key={recibo._id} className={vencido ? 'bg-red-50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecibos.has(recibo._id)}
                          onCheckedChange={(checked) => handleSelectRecibo(recibo._id, !!checked)}
                          disabled={!isEligible}
                          aria-label="Seleccionar recibo"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {recibo.serie}-{recibo.numero}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{recibo.clienteNombre}</p>
                          {recibo.clienteNIF && (
                            <p className="text-sm text-muted-foreground">{recibo.clienteNIF}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {recibo.concepto}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(recibo.importe)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {vencido && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {formatDate(recibo.fechaVencimiento)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ESTADO_RECIBO_COLORS[recibo.estado]}>
                          {ESTADO_RECIBO_LABELS[recibo.estado]}
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
                            <DropdownMenuItem onClick={() => router.push(`/tesoreria/recibos/${recibo._id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {recibo.estado === EstadoRecibo.EMITIDO && (
                              <>
                                <DropdownMenuItem onClick={() => handleEnviar(recibo)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Marcar como enviado
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setCobroDialog({ open: true, recibo })}>
                                  <Banknote className="mr-2 h-4 w-4" />
                                  Marcar como cobrado
                                </DropdownMenuItem>
                              </>
                            )}
                            {recibo.estado === EstadoRecibo.ENVIADO && (
                              <>
                                <DropdownMenuItem onClick={() => setCobroDialog({ open: true, recibo })}>
                                  <Banknote className="mr-2 h-4 w-4" />
                                  Marcar como cobrado
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDevolucionDialog({ open: true, recibo })}
                                  className="text-red-600"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Registrar devolución
                                </DropdownMenuItem>
                              </>
                            )}
                            {(recibo.estado === EstadoRecibo.EMITIDO || recibo.estado === EstadoRecibo.ENVIADO) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleAnular(recibo)}
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
        <Dialog open={cobroDialog.open} onOpenChange={(open) => setCobroDialog({ open, recibo: cobroDialog.recibo })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar recibo como cobrado</DialogTitle>
              <DialogDescription>
                Recibo {cobroDialog.recibo?.serie}-{cobroDialog.recibo?.numero} por {cobroDialog.recibo && formatCurrency(cobroDialog.recibo.importe)}
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
              <Button variant="outline" onClick={() => setCobroDialog({ open: false, recibo: null })}>
                Cancelar
              </Button>
              <Button onClick={handleCobrar}>
                Confirmar cobro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Devolución */}
        <Dialog open={devolucionDialog.open} onOpenChange={(open) => setDevolucionDialog({ open, recibo: devolucionDialog.recibo })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar devolución de recibo</DialogTitle>
              <DialogDescription>
                Recibo {devolucionDialog.recibo?.serie}-{devolucionDialog.recibo?.numero} por {devolucionDialog.recibo && formatCurrency(devolucionDialog.recibo.importe)}
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
              <Button variant="outline" onClick={() => setDevolucionDialog({ open: false, recibo: null })}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDevolver} disabled={!motivoDevolucion}>
                Registrar devolución
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Crear Remesa */}
        <Dialog open={remesaDialog} onOpenChange={setRemesaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear remesa SEPA</DialogTitle>
              <DialogDescription>
                Se incluirán {selectedRecibos.size} recibos en la remesa
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombreRemesa">Nombre de la remesa *</Label>
                <Input
                  id="nombreRemesa"
                  value={nombreRemesa}
                  onChange={(e) => setNombreRemesa(e.target.value)}
                  placeholder="Ej: Remesa diciembre 2024"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fechaCargo">Fecha de cargo</Label>
                <Input
                  id="fechaCargo"
                  type="date"
                  value={fechaCargo}
                  onChange={(e) => setFechaCargo(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Si no se indica, se usará la fecha de vencimiento de cada recibo
                </p>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">Importe total de la remesa:</p>
                <p className="text-xl font-bold">
                  {formatCurrency(
                    recibos
                      .filter(r => selectedRecibos.has(r._id))
                      .reduce((sum, r) => sum + r.importe, 0)
                  )}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemesaDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCrearRemesa} disabled={!nombreRemesa || selectedRecibos.size === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Crear remesa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
