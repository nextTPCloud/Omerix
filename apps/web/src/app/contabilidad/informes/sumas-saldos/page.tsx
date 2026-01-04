'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { contabilidadService } from '@/services/contabilidad.service'
import { SumasSaldosResponse } from '@/types/contabilidad.types'
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
  Calculator,
  ArrowLeft,
  RefreshCw,
  Printer,
  Download,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

export default function SumasSaldosPage() {
  const [data, setData] = useState<SumasSaldosResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filtros
  const [ejercicio, setEjercicio] = useState(new Date().getFullYear().toString())
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [nivel, setNivel] = useState('all')
  const [cuentaDesde, setCuentaDesde] = useState('')
  const [cuentaHasta, setCuentaHasta] = useState('')

  // Cargar datos
  const cargarDatos = async () => {
    try {
      setIsLoading(true)
      const response = await contabilidadService.getSumasSaldos({
        ejercicio: parseInt(ejercicio),
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        nivel: nivel !== 'all' ? parseInt(nivel) : undefined,
        cuentaDesde: cuentaDesde || undefined,
        cuentaHasta: cuentaHasta || undefined,
      })
      setData(response)
    } catch (error) {
      console.error('Error cargando sumas y saldos:', error)
      toast.error('Error al cargar el balance')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

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

  // Exportar a CSV
  const handleExportCSV = async () => {
    try {
      const blob = await contabilidadService.exportarAsientos('csv', {
        ejercicio: parseInt(ejercicio),
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
      })
      contabilidadService.descargarArchivo(blob, `sumas_saldos_${ejercicio}.csv`)
      toast.success('Exportación completada')
    } catch (error) {
      toast.error('Error al exportar')
    }
  }

  // Años disponibles
  const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  // Obtener líneas y resumen con valores por defecto
  const lineas = data?.lineas || []
  const resumen = data?.resumen || {
    totalSumaDebe: 0,
    totalSumaHaber: 0,
    totalSaldoDeudor: 0,
    totalSaldoAcreedor: 0,
    cuadradoSumas: true,
    cuadradoSaldos: true,
    diferenciaSumas: 0,
    diferenciaSaldos: 0,
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
                <Calculator className="h-7 w-7 text-primary" />
                Balance de Sumas y Saldos
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Balance de comprobación - {lineas.length} cuentas
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {data && (
              <>
                {resumen.cuadradoSumas && resumen.cuadradoSaldos ? (
                  <Badge variant="default" className="bg-emerald-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Cuadrado
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Descuadre
                  </Badge>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
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
              <Label>Nivel</Label>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger className="w-[140px] mt-1.5">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">1 dígito</SelectItem>
                  <SelectItem value="2">2 dígitos</SelectItem>
                  <SelectItem value="3">3 dígitos</SelectItem>
                  <SelectItem value="4">4+ dígitos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cuenta desde</Label>
              <Input
                placeholder="Ej: 100"
                value={cuentaDesde}
                onChange={(e) => setCuentaDesde(e.target.value)}
                className="mt-1.5 w-[100px]"
              />
            </div>
            <div>
              <Label>Cuenta hasta</Label>
              <Input
                placeholder="Ej: 799"
                value={cuentaHasta}
                onChange={(e) => setCuentaHasta(e.target.value)}
                className="mt-1.5 w-[100px]"
              />
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
        </Card>

        {/* TABLA */}
        <Card className="overflow-hidden print:shadow-none">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando...</span>
            </div>
          ) : lineas.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium">No hay datos para mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-4 py-3 text-left font-semibold">Cuenta</th>
                    <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                    <th className="px-4 py-3 text-right font-semibold">Suma Debe</th>
                    <th className="px-4 py-3 text-right font-semibold">Suma Haber</th>
                    <th className="px-4 py-3 text-right font-semibold">Saldo Deudor</th>
                    <th className="px-4 py-3 text-right font-semibold">Saldo Acreedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lineas.map((linea, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-muted/30 ${
                        linea.nivel <= 2 ? 'font-semibold bg-muted/20' : ''
                      }`}
                    >
                      <td
                        className="px-4 py-2 font-mono"
                        style={{ paddingLeft: `${1 + linea.nivel * 0.5}rem` }}
                      >
                        {linea.cuentaCodigo}
                      </td>
                      <td className="px-4 py-2">{linea.cuentaNombre}</td>
                      <td className="px-4 py-2 text-right">
                        {linea.sumaDebe > 0 ? formatImporte(linea.sumaDebe) : ''}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {linea.sumaHaber > 0 ? formatImporte(linea.sumaHaber) : ''}
                      </td>
                      <td className="px-4 py-2 text-right text-blue-600">
                        {linea.saldoDeudor > 0 ? formatImporte(linea.saldoDeudor) : ''}
                      </td>
                      <td className="px-4 py-2 text-right text-red-600">
                        {linea.saldoAcreedor > 0 ? formatImporte(linea.saldoAcreedor) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-bold border-t-2">
                    <td className="px-4 py-3" colSpan={2}>
                      TOTALES
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatImporte(resumen.totalSumaDebe)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatImporte(resumen.totalSumaHaber)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600">
                      {formatImporte(resumen.totalSaldoDeudor)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {formatImporte(resumen.totalSaldoAcreedor)}
                    </td>
                  </tr>
                  {!resumen.cuadradoSumas && (
                    <tr className="bg-red-50 text-red-600 text-xs">
                      <td colSpan={6} className="px-4 py-2 text-center">
                        Diferencia en sumas: {formatImporte(resumen.diferenciaSumas)} €
                      </td>
                    </tr>
                  )}
                  {!resumen.cuadradoSaldos && (
                    <tr className="bg-red-50 text-red-600 text-xs">
                      <td colSpan={6} className="px-4 py-2 text-center">
                        Diferencia en saldos: {formatImporte(resumen.diferenciaSaldos)} €
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
