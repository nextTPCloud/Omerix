'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { contabilidadService } from '@/services/contabilidad.service'
import { LibroMayorResponse, LibroMayorCuenta } from '@/types/contabilidad.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Printer,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function LibroMayorPage() {
  const [data, setData] = useState<LibroMayorResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedCuentas, setExpandedCuentas] = useState<Set<string>>(new Set())
  const [busqueda, setBusqueda] = useState('')

  // Filtros
  const [ejercicio, setEjercicio] = useState(new Date().getFullYear().toString())
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [cuentaDesde, setCuentaDesde] = useState('')
  const [cuentaHasta, setCuentaHasta] = useState('')
  const [nivel, setNivel] = useState('')

  // Cargar datos
  const cargarDatos = async () => {
    try {
      setIsLoading(true)
      const response = await contabilidadService.getLibroMayor({
        ejercicio: parseInt(ejercicio),
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        cuentaDesde: cuentaDesde || undefined,
        cuentaHasta: cuentaHasta || undefined,
        nivel: nivel ? parseInt(nivel) : undefined,
        incluirCuentasSinMovimiento: false,
      })
      setData(response)
      // Expandir todas las cuentas por defecto
      if (response.cuentas && response.cuentas.length > 0) {
        setExpandedCuentas(new Set(response.cuentas.map((c) => c.cuentaCodigo)))
      }
    } catch (error) {
      console.error('Error cargando libro mayor:', error)
      toast.error('Error al cargar el libro mayor')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Toggle cuenta expandida
  const toggleCuenta = (codigo: string) => {
    const newExpanded = new Set(expandedCuentas)
    if (newExpanded.has(codigo)) {
      newExpanded.delete(codigo)
    } else {
      newExpanded.add(codigo)
    }
    setExpandedCuentas(newExpanded)
  }

  // Expandir/colapsar todas
  const expandirTodas = () => {
    if (data && data.cuentas) {
      setExpandedCuentas(new Set(data.cuentas.map((c) => c.cuentaCodigo)))
    }
  }

  const colapsarTodas = () => {
    setExpandedCuentas(new Set())
  }

  // Formatear fecha
  const formatFecha = (fecha: Date | string) => {
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es })
  }

  // Formatear importe
  const formatImporte = (importe: number) => {
    return (importe || 0).toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Imprimir
  const handlePrint = () => {
    window.print()
  }

  // Años disponibles
  const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  // Filtrar cuentas por búsqueda
  const cuentasFiltradas = (data?.cuentas || []).filter((c) => {
    if (!busqueda) return true
    const term = busqueda.toLowerCase()
    return (
      c.cuentaCodigo.toLowerCase().includes(term) ||
      c.cuentaNombre.toLowerCase().includes(term)
    )
  })

  // Calcular totales desde resumen o manualmente
  const totales = data?.resumen || {
    totalDebe: cuentasFiltradas.reduce((acc, c) => acc + (c.totalDebe || 0), 0),
    totalHaber: cuentasFiltradas.reduce((acc, c) => acc + (c.totalHaber || 0), 0),
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/contabilidad">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="h-7 w-7 text-primary" />
                Libro Mayor
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {cuentasFiltradas.length} cuentas con movimientos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandirTodas}>
              Expandir todas
            </Button>
            <Button variant="outline" size="sm" onClick={colapsarTodas}>
              Colapsar todas
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* FILTROS */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>Ejercicio</Label>
              <Select value={ejercicio} onValueChange={setEjercicio}>
                <SelectTrigger className="w-[120px] mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anios.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Desde</Label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="mt-1.5 w-[150px]"
              />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="mt-1.5 w-[150px]"
              />
            </div>
            <div>
              <Label>Cuenta desde</Label>
              <Input
                type="text"
                placeholder="Ej: 400"
                value={cuentaDesde}
                onChange={(e) => setCuentaDesde(e.target.value)}
                className="mt-1.5 w-[120px]"
              />
            </div>
            <div>
              <Label>Cuenta hasta</Label>
              <Input
                type="text"
                placeholder="Ej: 499"
                value={cuentaHasta}
                onChange={(e) => setCuentaHasta(e.target.value)}
                className="mt-1.5 w-[120px]"
              />
            </div>
            <div>
              <Label>Nivel</Label>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger className="w-[100px] mt-1.5">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} dígitos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={cargarDatos} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Consultar
            </Button>
          </div>

          {/* Búsqueda rápida */}
          {data && data.cuentas && data.cuentas.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar cuenta..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}
        </Card>

        {/* CONTENIDO */}
        <Card className="overflow-hidden print:shadow-none">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando...</span>
            </div>
          ) : !data || cuentasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium">No hay cuentas con movimientos en el período</p>
            </div>
          ) : (
            <div className="divide-y">
              {cuentasFiltradas.map((cuenta) => (
                <div key={cuenta.cuentaCodigo}>
                  {/* Cabecera de la cuenta */}
                  <button
                    className="w-full px-4 py-3 flex items-center gap-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => toggleCuenta(cuenta.cuentaCodigo)}
                  >
                    {expandedCuentas.has(cuenta.cuentaCodigo) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-mono font-bold text-primary">
                      {cuenta.cuentaCodigo}
                    </span>
                    <span className="flex-1 truncate">{cuenta.cuentaNombre}</span>
                    <Badge variant="outline" className="text-xs">
                      {cuenta.movimientos?.length || 0} mov.
                    </Badge>
                    <div className="text-right w-28">
                      <span className="text-xs text-muted-foreground">Saldo</span>
                      <p
                        className={`font-medium ${
                          cuenta.saldoFinal >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {formatImporte(Math.abs(cuenta.saldoFinal))} €
                        <span className="text-xs ml-1">
                          {cuenta.naturaleza === 'deudora' ? (cuenta.saldoFinal >= 0 ? 'D' : 'H') : (cuenta.saldoFinal >= 0 ? 'H' : 'D')}
                        </span>
                      </p>
                    </div>
                  </button>

                  {/* Movimientos de la cuenta */}
                  {expandedCuentas.has(cuenta.cuentaCodigo) && (
                    <div className="bg-background">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground border-b">
                            <th className="px-4 py-2 text-left w-24">Fecha</th>
                            <th className="px-4 py-2 text-left w-20">Asiento</th>
                            <th className="px-4 py-2 text-left">Concepto</th>
                            <th className="px-4 py-2 text-right w-28">Debe</th>
                            <th className="px-4 py-2 text-right w-28">Haber</th>
                            <th className="px-4 py-2 text-right w-28">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Saldo inicial */}
                          {cuenta.saldoInicial !== 0 && (
                            <tr className="border-b bg-muted/20 italic text-muted-foreground">
                              <td className="px-4 py-2" colSpan={3}>
                                Saldo inicial
                              </td>
                              <td className="px-4 py-2 text-right">
                                {cuenta.saldoInicial > 0 ? formatImporte(cuenta.saldoInicial) : ''}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {cuenta.saldoInicial < 0 ? formatImporte(Math.abs(cuenta.saldoInicial)) : ''}
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                {formatImporte(Math.abs(cuenta.saldoInicial))}
                                <span className="text-xs ml-1">
                                  {cuenta.saldoInicial >= 0 ? 'D' : 'H'}
                                </span>
                              </td>
                            </tr>
                          )}
                          {(cuenta.movimientos || []).map((mov, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="px-4 py-2 text-muted-foreground">
                                {formatFecha(mov.fecha)}
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">
                                #{mov.asientoNumero}
                              </td>
                              <td className="px-4 py-2 truncate max-w-xs">{mov.concepto}</td>
                              <td className="px-4 py-2 text-right font-medium">
                                {mov.debe > 0 ? formatImporte(mov.debe) : ''}
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                {mov.haber > 0 ? formatImporte(mov.haber) : ''}
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                {formatImporte(Math.abs(mov.saldoParcial))}
                                <span className="text-xs ml-1 text-muted-foreground">
                                  {mov.saldoParcial >= 0 ? 'D' : 'H'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-muted/30 font-medium">
                            <td className="px-4 py-2" colSpan={3}>
                              Totales cuenta {cuenta.cuentaCodigo}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {formatImporte(cuenta.totalDebe)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {formatImporte(cuenta.totalHaber)}
                            </td>
                            <td
                              className={`px-4 py-2 text-right ${
                                cuenta.saldoFinal >= 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {formatImporte(Math.abs(cuenta.saldoFinal))}
                              <span className="text-xs ml-1">
                                {cuenta.saldoFinal >= 0 ? 'D' : 'H'}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              ))}

              {/* TOTALES GENERALES */}
              <div className="px-4 py-4 bg-muted/50 flex justify-end gap-8">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Debe</p>
                  <p className="text-lg font-bold">{formatImporte(totales.totalDebe)} €</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Haber</p>
                  <p className="text-lg font-bold">{formatImporte(totales.totalHaber)} €</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
