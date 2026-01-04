'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { contabilidadService } from '@/services/contabilidad.service'
import { CuentaResultadosResponse } from '@/types/contabilidad.types'
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
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  RefreshCw,
  Printer,
} from 'lucide-react'
import { toast } from 'sonner'

export default function CuentaResultadosPage() {
  const [data, setData] = useState<CuentaResultadosResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filtros
  const [ejercicio, setEjercicio] = useState(new Date().getFullYear().toString())
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Cargar datos
  const cargarDatos = async () => {
    try {
      setIsLoading(true)
      const response = await contabilidadService.getCuentaResultados({
        ejercicio: parseInt(ejercicio),
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
      })
      setData(response)
    } catch (error) {
      console.error('Error cargando cuenta de resultados:', error)
      toast.error('Error al cargar la cuenta de resultados')
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

  // Años disponibles
  const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const ingresos = data?.ingresos?.lineas || []
  const gastos = data?.gastos?.lineas || []
  const totalIngresos = data?.ingresos?.total || 0
  const totalGastos = data?.gastos?.total || 0
  const resultado = data?.resultado || 0

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
                {resultado >= 0 ? (
                  <TrendingUp className="h-7 w-7 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-7 w-7 text-red-500" />
                )}
                Cuenta de Pérdidas y Ganancias
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Resultado del ejercicio
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {data && (
              <Badge
                variant="outline"
                className={`text-lg px-4 py-2 ${
                  resultado >= 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-red-50 text-red-700 border-red-300'
                }`}
              >
                {resultado >= 0 ? 'Beneficio' : 'Pérdida'}: {formatImporte(Math.abs(resultado))} €
              </Badge>
            )}
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

        {/* CONTENIDO */}
        {isLoading ? (
          <Card className="p-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto" />
            <span className="mt-2 text-muted-foreground">Cargando...</span>
          </Card>
        ) : !data ? (
          <Card className="p-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium">No hay datos para mostrar</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:grid-cols-2">
            {/* INGRESOS */}
            <Card className="overflow-hidden print:shadow-none">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 border-b flex justify-between items-center">
                <h2 className="font-bold text-lg text-emerald-700 dark:text-emerald-400">
                  INGRESOS (Grupo 7)
                </h2>
                <span className="font-bold text-lg">{formatImporte(totalIngresos)} €</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-4 py-2 text-left font-semibold w-20">Cuenta</th>
                      <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                      <th className="px-4 py-2 text-right font-semibold w-28">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ingresos.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                          No hay ingresos registrados
                        </td>
                      </tr>
                    ) : (
                      ingresos.map((linea, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-muted/30 ${
                            linea.nivel <= 2 ? 'font-semibold bg-muted/20' : ''
                          }`}
                        >
                          <td
                            className="px-4 py-2 font-mono text-xs"
                            style={{ paddingLeft: `${0.5 + linea.nivel * 0.5}rem` }}
                          >
                            {linea.codigo}
                          </td>
                          <td className="px-4 py-2">{linea.nombre}</td>
                          <td className="px-4 py-2 text-right font-medium text-emerald-600">
                            {formatImporte(linea.importe)} €
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* GASTOS */}
            <Card className="overflow-hidden print:shadow-none">
              <div className="bg-red-50 dark:bg-red-950/30 px-4 py-3 border-b flex justify-between items-center">
                <h2 className="font-bold text-lg text-red-700 dark:text-red-400">
                  GASTOS (Grupo 6)
                </h2>
                <span className="font-bold text-lg">{formatImporte(totalGastos)} €</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-4 py-2 text-left font-semibold w-20">Cuenta</th>
                      <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                      <th className="px-4 py-2 text-right font-semibold w-28">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {gastos.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                          No hay gastos registrados
                        </td>
                      </tr>
                    ) : (
                      gastos.map((linea, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-muted/30 ${
                            linea.nivel <= 2 ? 'font-semibold bg-muted/20' : ''
                          }`}
                        >
                          <td
                            className="px-4 py-2 font-mono text-xs"
                            style={{ paddingLeft: `${0.5 + linea.nivel * 0.5}rem` }}
                          >
                            {linea.codigo}
                          </td>
                          <td className="px-4 py-2">{linea.nombre}</td>
                          <td className="px-4 py-2 text-right font-medium text-red-600">
                            {formatImporte(linea.importe)} €
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* RESUMEN */}
        {data && (
          <Card className="p-6 print:shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <p className="text-sm text-emerald-600 font-medium">Total Ingresos</p>
                <p className="text-2xl font-bold text-emerald-700">{formatImporte(totalIngresos)} €</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Total Gastos</p>
                <p className="text-2xl font-bold text-red-700">{formatImporte(totalGastos)} €</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground font-medium">Margen</p>
                <p className="text-2xl font-bold">
                  {totalIngresos > 0
                    ? ((resultado / totalIngresos) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  resultado >= 0
                    ? 'bg-emerald-100 dark:bg-emerald-900/40'
                    : 'bg-red-100 dark:bg-red-900/40'
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    resultado >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {resultado >= 0 ? 'BENEFICIO' : 'PÉRDIDA'}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    resultado >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {formatImporte(Math.abs(resultado))} €
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
