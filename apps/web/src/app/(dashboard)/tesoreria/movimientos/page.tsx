'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  movimientosBancariosService,
  MovimientoBancario,
  MovimientoFilters,
  EstadisticasMovimientos,
  TipoMovimiento,
  OrigenMovimiento,
  MetodoMovimiento,
} from '@/services/movimientos-bancarios.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Search,
  RefreshCw,
  Filter,
  X,
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  XCircle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

// Iconos por método de pago
const metodoIcons: Record<MetodoMovimiento, React.ReactNode> = {
  efectivo: <Banknote className="h-4 w-4" />,
  tarjeta: <CreditCard className="h-4 w-4" />,
  transferencia: <Building2 className="h-4 w-4" />,
  bizum: <Smartphone className="h-4 w-4" />,
  domiciliacion: <FileText className="h-4 w-4" />,
  cheque: <FileText className="h-4 w-4" />,
  pagare: <FileText className="h-4 w-4" />,
  otro: <Wallet className="h-4 w-4" />,
}

export default function MovimientosBancariosPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [movimientos, setMovimientos] = useState<MovimientoBancario[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasMovimientos | null>(null)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 0 })
  const [filters, setFilters] = useState<MovimientoFilters>({
    pagina: 1,
    limite: 50,
    orden: 'desc',
    ordenarPor: 'fecha',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [anularDialog, setAnularDialog] = useState<{ open: boolean; movimiento: MovimientoBancario | null }>({
    open: false,
    movimiento: null,
  })
  const [motivoAnulacion, setMotivoAnulacion] = useState('')

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true)
      const [movRes, statsRes] = await Promise.all([
        movimientosBancariosService.getAll(filters),
        movimientosBancariosService.getEstadisticas(filters.fechaDesde, filters.fechaHasta),
      ])

      if (movRes.success) {
        setMovimientos(movRes.data)
        setPagination(movRes.pagination)
      }
      if (statsRes.success) {
        setEstadisticas(statsRes.data)
      }
    } catch (error) {
      console.error('Error cargando movimientos:', error)
      toast.error('Error al cargar los movimientos bancarios')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Anular movimiento
  const handleAnular = async () => {
    if (!anularDialog.movimiento || !motivoAnulacion.trim()) {
      toast.error('Debe indicar el motivo de anulación')
      return
    }

    try {
      const result = await movimientosBancariosService.anular(anularDialog.movimiento._id, motivoAnulacion)
      if (result.success) {
        toast.success('Movimiento anulado correctamente')
        setAnularDialog({ open: false, movimiento: null })
        setMotivoAnulacion('')
        cargarDatos()
      }
    } catch (error) {
      console.error('Error anulando movimiento:', error)
      toast.error('Error al anular el movimiento')
    }
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFilters({
      pagina: 1,
      limite: 50,
      orden: 'desc',
      ordenarPor: 'fecha',
    })
  }

  // Datos para gráfico por método
  const datosMetodo = estadisticas?.porMetodo.map((m) => ({
    metodo: movimientosBancariosService.getMetodoLabel(m.metodo as MetodoMovimiento),
    entradas: m.entradas,
    salidas: m.salidas,
  })) || []

  // Datos para gráfico por origen
  const datosOrigen = estadisticas?.porOrigen.map((o, i) => ({
    name: movimientosBancariosService.getOrigenLabel(o.origen as OrigenMovimiento),
    value: o.importe,
    cantidad: o.cantidad,
    fill: COLORS[i % COLORS.length],
  })) || []

  // Datos para gráfico por día
  const datosDia = estadisticas?.movimientosPorDia || []

  return (
      <>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Movimientos</h1>
            <p className="text-muted-foreground">Registro de cobros y pagos de tesorería</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline" onClick={cargarDatos} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-300">Total Entradas</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(estadisticas?.totalEntradas || 0)}</p>
                </div>
                <div className="rounded-full bg-green-500/20 p-3">
                  <ArrowDownRight className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="mr-1 h-4 w-4" />
                <span>Cobros realizados</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-300">Total Salidas</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(estadisticas?.totalSalidas || 0)}</p>
                </div>
                <div className="rounded-full bg-red-500/20 p-3">
                  <ArrowUpRight className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-red-600">
                <TrendingDown className="mr-1 h-4 w-4" />
                <span>Pagos realizados</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${(estadisticas?.saldoNeto || 0) >= 0
            ? 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200'
            : 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${(estadisticas?.saldoNeto || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    Saldo Neto
                  </p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(estadisticas?.saldoNeto || 0)}</p>
                </div>
                <div className={`rounded-full p-3 ${(estadisticas?.saldoNeto || 0) >= 0 ? 'bg-blue-500/20' : 'bg-orange-500/20'}`}>
                  <Wallet className={`h-6 w-6 ${(estadisticas?.saldoNeto || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
              </div>
              <div className={`mt-4 flex items-center text-sm ${(estadisticas?.saldoNeto || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {(estadisticas?.saldoNeto || 0) >= 0 ? (
                  <>
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    <span>Balance positivo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="mr-1 h-4 w-4" />
                    <span>Balance negativo</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Número, concepto..."
                      className="pl-8"
                      value={filters.busqueda || ''}
                      onChange={(e) => setFilters({ ...filters, busqueda: e.target.value, pagina: 1 })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo</label>
                  <Select
                    value={filters.tipo || 'todos'}
                    onValueChange={(v) => setFilters({ ...filters, tipo: v === 'todos' ? undefined : v as TipoMovimiento, pagina: 1 })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="entrada">Entradas</SelectItem>
                      <SelectItem value="salida">Salidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Origen</label>
                  <Select
                    value={filters.origen as string || 'todos'}
                    onValueChange={(v) => setFilters({ ...filters, origen: v === 'todos' ? undefined : v as OrigenMovimiento, pagina: 1 })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="tpv">TPV</SelectItem>
                      <SelectItem value="factura_venta">Factura Venta</SelectItem>
                      <SelectItem value="factura_compra">Factura Compra</SelectItem>
                      <SelectItem value="vencimiento">Vencimiento</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Método</label>
                  <Select
                    value={filters.metodo || 'todos'}
                    onValueChange={(v) => setFilters({ ...filters, metodo: v === 'todos' ? undefined : v as MetodoMovimiento, pagina: 1 })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="bizum">Bizum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Desde</label>
                  <Input
                    type="date"
                    value={filters.fechaDesde || ''}
                    onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value, pagina: 1 })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Hasta</label>
                  <Input
                    type="date"
                    value={filters.fechaHasta || ''}
                    onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value, pagina: 1 })}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                  <X className="mr-2 h-4 w-4" />
                  Limpiar filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráficos */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Por Método de Pago</CardTitle>
              <CardDescription>Distribución de entradas y salidas por método</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosMetodo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metodo" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="entradas" name="Entradas" fill="#10b981" />
                    <Bar dataKey="salidas" name="Salidas" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Por Origen</CardTitle>
              <CardDescription>Distribución de movimientos por origen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosOrigen}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {datosOrigen.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evolución últimos 30 días */}
        {datosDia.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolución Últimos 30 Días</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosDia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="salidas" name="Salidas" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla de movimientos */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Movimientos</CardTitle>
            <CardDescription>
              {pagination.total} movimientos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && movimientos.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : movimientos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron movimientos con los filtros actuales
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientos.map((mov) => (
                      <TableRow key={mov._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(mov.fecha)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{mov.numero}</TableCell>
                        <TableCell>
                          <Badge variant={mov.tipo === 'entrada' ? 'default' : 'destructive'}>
                            {mov.tipo === 'entrada' ? (
                              <ArrowDownRight className="mr-1 h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="mr-1 h-3 w-3" />
                            )}
                            {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {movimientosBancariosService.getOrigenLabel(mov.origen)}
                          </span>
                          {mov.ticketNumero && (
                            <span className="block text-xs text-muted-foreground">
                              {mov.ticketNumero}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {metodoIcons[mov.metodo]}
                            <span>{movimientosBancariosService.getMetodoLabel(mov.metodo)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="truncate">{mov.concepto}</p>
                            {mov.terceroNombre && (
                              <p className="text-xs text-muted-foreground truncate">
                                {mov.terceroNombre}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                          {mov.tipo === 'entrada' ? '+' : '-'}
                          {formatCurrency(mov.importe)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              mov.estado === 'confirmado' ? 'default' :
                              mov.estado === 'conciliado' ? 'secondary' :
                              mov.estado === 'anulado' ? 'destructive' : 'outline'
                            }
                          >
                            {mov.estado.charAt(0).toUpperCase() + mov.estado.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {mov.estado !== 'anulado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAnularDialog({ open: true, movimiento: mov })}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginación */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {pagination.page} de {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setFilters({ ...filters, pagina: (filters.pagina || 1) - 1 })}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => setFilters({ ...filters, pagina: (filters.pagina || 1) + 1 })}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de anulación */}
      <Dialog open={anularDialog.open} onOpenChange={(open) => setAnularDialog({ open, movimiento: anularDialog.movimiento })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Movimiento</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El movimiento {anularDialog.movimiento?.numero} será anulado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Motivo de anulación</label>
              <Textarea
                placeholder="Indique el motivo de la anulación..."
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnularDialog({ open: false, movimiento: null })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleAnular}>
              Anular Movimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
  )
}
