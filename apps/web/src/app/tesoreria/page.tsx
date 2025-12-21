'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { tesoreriaService, EstadisticasTesoreria, PrevisionCaja } from '@/services/tesoreria.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  Calendar,
  Users,
  Building2,
  ChevronRight,
  Banknote,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function TesoreriaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<EstadisticasTesoreria | null>(null)
  const [prevision, setPrevision] = useState<PrevisionCaja | null>(null)
  const [diasPrevision, setDiasPrevision] = useState(30)
  const [saldoInicial, setSaldoInicial] = useState(0)

  // Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      setIsLoading(true)
      const [statsRes, previsionRes] = await Promise.all([
        tesoreriaService.getEstadisticas(),
        tesoreriaService.getPrevisionCaja(diasPrevision, saldoInicial),
      ])

      if (statsRes.success) {
        setStats(statsRes.data)
      }
      if (previsionRes.success) {
        setPrevision(previsionRes.data)
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      toast.error('Error al cargar las estadísticas de tesorería')
    } finally {
      setIsLoading(false)
    }
  }, [diasPrevision, saldoInicial])

  useEffect(() => {
    cargarEstadisticas()
  }, [cargarEstadisticas])

  // Datos para gráfica de vencimientos por período
  const datosVencimientosPeriodo = stats ? [
    {
      periodo: 'Esta semana',
      cobros: stats.vencimientosSemana.cobros,
      pagos: stats.vencimientosSemana.pagos,
    },
    {
      periodo: 'Este mes',
      cobros: stats.vencimientosMes.cobros,
      pagos: stats.vencimientosMes.pagos,
    },
    {
      periodo: 'Este trimestre',
      cobros: stats.vencimientosTrimestre.cobros,
      pagos: stats.vencimientosTrimestre.pagos,
    },
  ] : []

  // Datos para gráfica de distribución
  const datosDistribucion = stats ? [
    { name: 'Pendiente cobro', value: stats.saldoPendienteCobro, color: '#3b82f6' },
    { name: 'Pendiente pago', value: stats.saldoPendientePago, color: '#ef4444' },
    { name: 'Pagarés recibidos', value: stats.pagaresPendientesRecibidos, color: '#10b981' },
    { name: 'Pagarés emitidos', value: stats.pagaresPendientesEmitidos, color: '#f59e0b' },
  ] : []

  if (isLoading && !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tesorería</h1>
            <p className="text-muted-foreground">Control de cobros, pagos y flujo de caja</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cargarEstadisticas} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* KPIs Principales */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Pendiente de Cobro</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats?.saldoPendienteCobro || 0)}</p>
                </div>
                <div className="rounded-full bg-blue-500/20 p-3">
                  <ArrowDownRight className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600">
                <TrendingUp className="mr-1 h-4 w-4" />
                <span>Cobros previstos</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-300">Pendiente de Pago</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats?.saldoPendientePago || 0)}</p>
                </div>
                <div className="rounded-full bg-red-500/20 p-3">
                  <ArrowUpRight className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-red-600">
                <TrendingDown className="mr-1 h-4 w-4" />
                <span>Pagos previstos</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${(stats?.saldoNeto || 0) >= 0
            ? 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200'
            : 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${(stats?.saldoNeto || 0) >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    Saldo Neto
                  </p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats?.saldoNeto || 0)}</p>
                </div>
                <div className={`rounded-full p-3 ${(stats?.saldoNeto || 0) >= 0 ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                  <Wallet className={`h-6 w-6 ${(stats?.saldoNeto || 0) >= 0 ? 'text-green-600' : 'text-orange-600'}`} />
                </div>
              </div>
              <div className={`mt-4 flex items-center text-sm ${(stats?.saldoNeto || 0) >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {(stats?.saldoNeto || 0) >= 0 ? (
                  <>
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    <span>Situación favorable</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-1 h-4 w-4" />
                    <span>Revisar flujo de caja</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Devoluciones (mes)</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats?.importeDevuelto || 0)}</p>
                </div>
                <div className="rounded-full bg-purple-500/20 p-3">
                  <RotateCcw className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-purple-600">
                <span>{stats?.devolucionesMes || 0} efectos · {stats?.tasaDevolucion?.toFixed(1)}% tasa</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accesos rápidos */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/tesoreria/cobros')}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <ArrowDownRight className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Cobros</p>
                  <p className="text-sm text-muted-foreground">Vencimientos a cobrar</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/tesoreria/pagos')}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <ArrowUpRight className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Pagos</p>
                  <p className="text-sm text-muted-foreground">Vencimientos a pagar</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/tesoreria/pagares')}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-yellow-100 p-2">
                  <FileText className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">Pagarés</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency((stats?.pagaresPendientesRecibidos || 0) + (stats?.pagaresPendientesEmitidos || 0))}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/tesoreria/recibos')}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Recibos</p>
                  <p className="text-sm text-muted-foreground">{stats?.recibosPendientes || 0} pendientes</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal en tabs */}
        <Tabs defaultValue="prevision" className="space-y-4">
          <TabsList>
            <TabsTrigger value="prevision">Previsión de Caja</TabsTrigger>
            <TabsTrigger value="vencimientos">Vencimientos</TabsTrigger>
            <TabsTrigger value="morosos">Clientes Morosos</TabsTrigger>
          </TabsList>

          {/* Tab: Previsión de Caja */}
          <TabsContent value="prevision" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={diasPrevision.toString()} onValueChange={(v) => setDiasPrevision(parseInt(v))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Próximos 7 días</SelectItem>
                    <SelectItem value="15">Próximos 15 días</SelectItem>
                    <SelectItem value="30">Próximos 30 días</SelectItem>
                    <SelectItem value="60">Próximos 60 días</SelectItem>
                    <SelectItem value="90">Próximos 90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {prevision && (
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total cobros: </span>
                    <span className="font-medium text-green-600">{formatCurrency(prevision.totales.totalCobros)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total pagos: </span>
                    <span className="font-medium text-red-600">{formatCurrency(prevision.totales.totalPagos)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Saldo final: </span>
                    <span className={`font-medium ${prevision.totales.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(prevision.totales.saldoFinal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Flujo de Caja Previsto</CardTitle>
                <CardDescription>Evolución del saldo según vencimientos pendientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prevision?.prevision || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => formatDate(label)}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="cobros"
                        name="Cobros"
                        stroke="#10b981"
                        fill="#10b98120"
                        stackId="1"
                      />
                      <Area
                        type="monotone"
                        dataKey="pagos"
                        name="Pagos"
                        stroke="#ef4444"
                        fill="#ef444420"
                        stackId="2"
                      />
                      <Line
                        type="monotone"
                        dataKey="saldoAcumulado"
                        name="Saldo Acumulado"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Vencimientos */}
          <TabsContent value="vencimientos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Vencimientos por Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosVencimientosPeriodo}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="cobros" name="Cobros" fill="#10b981" />
                        <Bar dataKey="pagos" name="Pagos" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Efectos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datosDistribucion}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {datosDistribucion.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Próximos vencimientos */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Vencimientos (30 días)</CardTitle>
                <CardDescription>Detalle diario de cobros y pagos previstos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.vencimientosProximosDias || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => formatDate(label)}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="cobros" name="Cobros" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="pagos" name="Pagos" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Clientes Morosos */}
          <TabsContent value="morosos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Clientes con Deuda Vencida
                </CardTitle>
                <CardDescription>
                  Clientes con vencimientos impagados ordenados por importe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.clientesMorosos && stats.clientesMorosos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Importe Pendiente</TableHead>
                        <TableHead className="text-center">Documentos</TableHead>
                        <TableHead className="text-center">Días Mora Prom.</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.clientesMorosos.map((cliente) => (
                        <TableRow key={cliente.clienteId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{cliente.nombre}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            {formatCurrency(cliente.importePendiente)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{cliente.documentosPendientes}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={cliente.diasMoraProm > 30 ? 'destructive' : cliente.diasMoraProm > 15 ? 'secondary' : 'outline'}
                            >
                              {cliente.diasMoraProm} días
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/clientes/${cliente.clienteId}`)}
                            >
                              Ver cliente
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No hay clientes con deuda vencida</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
