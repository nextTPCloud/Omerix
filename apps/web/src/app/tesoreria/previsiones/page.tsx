'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  previsionesService,
  PrevisionCompleta,
  ResumenEjecutivo,
  AlertaDescubierto,
  EscenarioSimulacion,
  MovimientoSimulado,
  ResultadoSimulacion,
} from '@/services/previsiones.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Switch } from '@/components/ui/switch'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  Calendar,
  Plus,
  X,
  Play,
  ArrowDownRight,
  ArrowUpRight,
  Lightbulb,
  Shield,
  BarChart3,
  LineChart as LineChartIcon,
  Zap,
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
  ReferenceLine,
} from 'recharts'

export default function PrevisionesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [resumen, setResumen] = useState<ResumenEjecutivo | null>(null)
  const [prevision, setPrevision] = useState<PrevisionCompleta | null>(null)
  const [diasPrevision, setDiasPrevision] = useState(30)
  const [incluirProbabilidades, setIncluirProbabilidades] = useState(true)
  const [umbralAlerta, setUmbralAlerta] = useState(0)

  // Estados para simulación
  const [showSimulacion, setShowSimulacion] = useState(false)
  const [escenarioActual, setEscenarioActual] = useState<EscenarioSimulacion>({
    nombre: 'Nuevo escenario',
    movimientos: [],
  })
  const [resultadoSimulacion, setResultadoSimulacion] = useState<ResultadoSimulacion | null>(null)
  const [simulando, setSimulando] = useState(false)

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true)
      const [resumenRes, previsionRes] = await Promise.all([
        previsionesService.getResumenEjecutivo(),
        previsionesService.getPrevision({
          dias: diasPrevision,
          incluirProbabilidades,
          umbralAlerta,
        }),
      ])

      if (resumenRes.success) setResumen(resumenRes.data)
      if (previsionRes.success) setPrevision(previsionRes.data)
    } catch (error) {
      console.error('Error cargando previsiones:', error)
      toast.error('Error al cargar las previsiones')
    } finally {
      setIsLoading(false)
    }
  }, [diasPrevision, incluirProbabilidades, umbralAlerta])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Añadir movimiento a simulación
  const addMovimientoSimulacion = () => {
    const nuevoMov: MovimientoSimulado = {
      id: `mov_${Date.now()}`,
      fecha: new Date().toISOString().slice(0, 10),
      importe: 1000,
      esEntrada: true,
      concepto: '',
    }
    setEscenarioActual({
      ...escenarioActual,
      movimientos: [...escenarioActual.movimientos, nuevoMov],
    })
  }

  // Eliminar movimiento de simulación
  const removeMovimientoSimulacion = (id: string) => {
    setEscenarioActual({
      ...escenarioActual,
      movimientos: escenarioActual.movimientos.filter((m) => m.id !== id),
    })
  }

  // Actualizar movimiento de simulación
  const updateMovimientoSimulacion = (id: string, field: keyof MovimientoSimulado, value: any) => {
    setEscenarioActual({
      ...escenarioActual,
      movimientos: escenarioActual.movimientos.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    })
  }

  // Ejecutar simulación
  const ejecutarSimulacion = async () => {
    if (escenarioActual.movimientos.length === 0) {
      toast.error('Añada al menos un movimiento para simular')
      return
    }

    try {
      setSimulando(true)
      const res = await previsionesService.simular(escenarioActual, diasPrevision)
      if (res.success) {
        setResultadoSimulacion(res.data)
        toast.success('Simulación ejecutada')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al ejecutar simulación')
    } finally {
      setSimulando(false)
    }
  }

  // Datos para gráfico de flujo
  const datosGrafico = prevision?.previsionDiaria.map((d) => ({
    fecha: d.fecha,
    entradas: d.entradas,
    salidas: d.salidas,
    saldo: d.saldoAcumulado,
    alerta: d.alertaDescubierto,
  })) || []

  // Datos para gráfico de simulación
  const datosSimulacion = resultadoSimulacion?.prevision.map((d) => ({
    fecha: d.fecha,
    saldoBase: prevision?.previsionDiaria.find((p) => p.fecha === d.fecha)?.saldoAcumulado || 0,
    saldoSimulado: d.saldoAcumulado,
  })) || []

  if (isLoading && !resumen) {
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
            <h1 className="text-2xl font-bold">Previsiones de Tesorería</h1>
            <p className="text-muted-foreground">
              Análisis predictivo, alertas de descubierto y simulaciones
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={diasPrevision.toString()} onValueChange={(v) => setDiasPrevision(parseInt(v))}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="15">15 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                  <SelectItem value="60">60 días</SelectItem>
                  <SelectItem value="90">90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setShowSimulacion(true)}>
              <Zap className="mr-2 h-4 w-4" />
              Simular
            </Button>
            <Button variant="outline" onClick={cargarDatos} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Resumen ejecutivo */}
        {resumen && (
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Actual</p>
                    <p className="text-2xl font-bold">{formatCurrency(resumen.saldoActual)}</p>
                  </div>
                  <Wallet className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Previsión 7 días</p>
                    <p className={`text-2xl font-bold ${resumen.prevision7Dias.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(resumen.prevision7Dias.saldoFinal)}
                    </p>
                  </div>
                  {resumen.prevision7Dias.saldoFinal >= resumen.saldoActual ? (
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Previsión 30 días</p>
                    <p className={`text-2xl font-bold ${resumen.prevision30Dias.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(resumen.prevision30Dias.saldoFinal)}
                    </p>
                  </div>
                  {resumen.prevision30Dias.saldoFinal >= resumen.saldoActual ? (
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alertas próximas</p>
                    <p className="text-2xl font-bold">{resumen.alertasProximas.length}</p>
                  </div>
                  <AlertTriangle className={`h-8 w-8 ${resumen.alertasProximas.length > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={resumen.riesgoDescubierto === 'critico' ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Nivel de Riesgo</p>
                    <Badge
                      variant={previsionesService.getRiesgoBadgeVariant(resumen.riesgoDescubierto)}
                      className="mt-1 text-sm"
                    >
                      {resumen.riesgoDescubierto.toUpperCase()}
                    </Badge>
                  </div>
                  <Shield className={`h-8 w-8 ${previsionesService.getRiesgoColor(resumen.riesgoDescubierto)}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs de contenido */}
        <Tabs defaultValue="flujo" className="space-y-4">
          <TabsList>
            <TabsTrigger value="flujo">
              <LineChartIcon className="mr-2 h-4 w-4" />
              Flujo de Caja
            </TabsTrigger>
            <TabsTrigger value="alertas">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Alertas ({prevision?.alertasDescubierto.length || 0})
            </TabsTrigger>
            <TabsTrigger value="detalle">
              <BarChart3 className="mr-2 h-4 w-4" />
              Detalle Diario
            </TabsTrigger>
          </TabsList>

          {/* Tab: Flujo de Caja */}
          <TabsContent value="flujo" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Previsión de Flujo de Caja</CardTitle>
                    <CardDescription>
                      Próximos {diasPrevision} días | Saldo mínimo previsto: {formatCurrency(prevision?.resumen.saldoMinimo || 0)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="probabilidades"
                        checked={incluirProbabilidades}
                        onCheckedChange={setIncluirProbabilidades}
                      />
                      <label htmlFor="probabilidades" className="text-sm">
                        Aplicar probabilidades
                      </label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={datosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={(v) => new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                        labelFormatter={(label) => formatDate(label)}
                      />
                      <Legend />
                      <ReferenceLine y={umbralAlerta} stroke="#ef4444" strokeDasharray="5 5" label="Umbral" />
                      <Area
                        type="monotone"
                        dataKey="entradas"
                        name="Entradas"
                        stroke="#10b981"
                        fill="#10b98130"
                        stackId="1"
                      />
                      <Area
                        type="monotone"
                        dataKey="salidas"
                        name="Salidas"
                        stroke="#ef4444"
                        fill="#ef444430"
                        stackId="2"
                      />
                      <Line
                        type="monotone"
                        dataKey="saldo"
                        name="Saldo Acumulado"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Resumen de previsión */}
            {prevision && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-green-50 dark:bg-green-950 border-green-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-green-600">Total Entradas</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(prevision.resumen.totalEntradas)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 dark:bg-red-950 border-red-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-red-600">Total Salidas</p>
                    <p className="text-2xl font-bold text-red-700">
                      {formatCurrency(prevision.resumen.totalSalidas)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Saldo Final</p>
                    <p className={`text-2xl font-bold ${prevision.resumen.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(prevision.resumen.saldoFinal)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Días en Descubierto</p>
                    <p className={`text-2xl font-bold ${prevision.resumen.diasDescubierto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {prevision.resumen.diasDescubierto}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Tab: Alertas */}
          <TabsContent value="alertas" className="space-y-4">
            {prevision?.alertasDescubierto.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold text-green-700">Sin alertas de descubierto</h3>
                  <p className="text-muted-foreground">
                    No se prevén descubiertos en los próximos {diasPrevision} días
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {prevision?.alertasDescubierto.map((alerta, idx) => (
                  <Card key={idx} className="border-orange-300 bg-orange-50 dark:bg-orange-950">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="rounded-full bg-orange-200 p-2">
                            <AlertTriangle className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-orange-800">
                              Descubierto previsto para {formatDate(alerta.fecha)}
                            </h4>
                            <p className="text-sm text-orange-700">
                              {alerta.diasHastaDescubierto === 0
                                ? 'Hoy'
                                : `En ${alerta.diasHastaDescubierto} día(s)`}
                            </p>
                            <div className="mt-2 flex items-center gap-4 text-sm">
                              <span>
                                Saldo previsto:{' '}
                                <strong className="text-red-600">
                                  {formatCurrency(alerta.saldoPrevisto)}
                                </strong>
                              </span>
                              <span>
                                Déficit:{' '}
                                <strong className="text-red-600">
                                  {formatCurrency(alerta.deficit)}
                                </strong>
                              </span>
                            </div>

                            {/* Causantes */}
                            {alerta.movimientosCausantes.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-orange-700 mb-1">
                                  Movimientos causantes:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {alerta.movimientosCausantes.map((mov, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {mov.concepto}: {formatCurrency(mov.importe)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Sugerencias */}
                            {alerta.sugerencias.length > 0 && (
                              <div className="mt-3 p-2 bg-white/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                                  <span className="text-xs font-medium text-gray-700">Sugerencias:</span>
                                </div>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {alerta.sugerencias.map((sug, i) => (
                                    <li key={i}>• {sug}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Detalle Diario */}
          <TabsContent value="detalle">
            <Card>
              <CardHeader>
                <CardTitle>Detalle Diario de Previsión</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right text-green-600">Entradas</TableHead>
                        <TableHead className="text-right text-red-600">Salidas</TableHead>
                        <TableHead className="text-right">Saldo Día</TableHead>
                        <TableHead className="text-right">Saldo Acumulado</TableHead>
                        <TableHead className="text-center">Movimientos</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prevision?.previsionDiaria.map((dia) => (
                        <TableRow
                          key={dia.fecha}
                          className={dia.alertaDescubierto ? 'bg-red-50 dark:bg-red-950' : ''}
                        >
                          <TableCell className="font-medium">{formatDate(dia.fecha)}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {dia.entradas > 0 ? `+${formatCurrency(dia.entradas)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {dia.salidas > 0 ? `-${formatCurrency(dia.salidas)}` : '-'}
                          </TableCell>
                          <TableCell className={`text-right ${dia.saldoDia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(dia.saldoDia)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${dia.saldoAcumulado >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(dia.saldoAcumulado)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{dia.movimientos.length}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {dia.alertaDescubierto ? (
                              <Badge variant="destructive">Alerta</Badge>
                            ) : (
                              <Badge variant="secondary">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Simulación */}
      <Dialog open={showSimulacion} onOpenChange={setShowSimulacion}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Simulación What-If</DialogTitle>
            <DialogDescription>
              Añada movimientos hipotéticos para ver cómo afectarían al flujo de caja
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Nombre del escenario</label>
                <Input
                  value={escenarioActual.nombre}
                  onChange={(e) => setEscenarioActual({ ...escenarioActual, nombre: e.target.value })}
                  placeholder="Ej: Cobro adelantado cliente X"
                />
              </div>
              <Button onClick={addMovimientoSimulacion}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Movimiento
              </Button>
            </div>

            {escenarioActual.movimientos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Añada movimientos para simular</p>
              </div>
            ) : (
              <div className="space-y-2">
                {escenarioActual.movimientos.map((mov) => (
                  <div
                    key={mov.id}
                    className="flex items-center gap-2 p-3 bg-muted rounded-lg"
                  >
                    <Select
                      value={mov.esEntrada ? 'entrada' : 'salida'}
                      onValueChange={(v) =>
                        updateMovimientoSimulacion(mov.id!, 'esEntrada', v === 'entrada')
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">
                          <div className="flex items-center">
                            <ArrowDownRight className="mr-1 h-4 w-4 text-green-600" />
                            Entrada
                          </div>
                        </SelectItem>
                        <SelectItem value="salida">
                          <div className="flex items-center">
                            <ArrowUpRight className="mr-1 h-4 w-4 text-red-600" />
                            Salida
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="date"
                      value={mov.fecha}
                      onChange={(e) => updateMovimientoSimulacion(mov.id!, 'fecha', e.target.value)}
                      className="w-[140px]"
                    />

                    <Input
                      type="number"
                      value={mov.importe}
                      onChange={(e) =>
                        updateMovimientoSimulacion(mov.id!, 'importe', parseFloat(e.target.value) || 0)
                      }
                      className="w-[120px]"
                      placeholder="Importe"
                    />

                    <Input
                      value={mov.concepto}
                      onChange={(e) => updateMovimientoSimulacion(mov.id!, 'concepto', e.target.value)}
                      className="flex-1"
                      placeholder="Concepto"
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMovimientoSimulacion(mov.id!)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Resultado de simulación */}
            {resultadoSimulacion && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Resultado de la Simulación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo Final</p>
                      <p className={`text-xl font-bold ${resultadoSimulacion.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(resultadoSimulacion.saldoFinal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo Mínimo</p>
                      <p className={`text-xl font-bold ${resultadoSimulacion.saldoMinimo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(resultadoSimulacion.saldoMinimo)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha Mínimo</p>
                      <p className="text-xl font-bold">{formatDate(resultadoSimulacion.fechaSaldoMinimo)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Días Descubierto</p>
                      <p className={`text-xl font-bold ${resultadoSimulacion.diasDescubierto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {resultadoSimulacion.diasDescubierto}
                      </p>
                    </div>
                  </div>

                  {/* Gráfico comparativo */}
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={datosSimulacion}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="fecha"
                          tickFormatter={(v) =>
                            new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                          }
                        />
                        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="saldoBase"
                          name="Sin simulación"
                          stroke="#94a3b8"
                          strokeDasharray="5 5"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="saldoSimulado"
                          name="Con simulación"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSimulacion(false)}>
              Cerrar
            </Button>
            <Button
              onClick={ejecutarSimulacion}
              disabled={simulando || escenarioActual.movimientos.length === 0}
            >
              {simulando ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Simulando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Ejecutar Simulación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
