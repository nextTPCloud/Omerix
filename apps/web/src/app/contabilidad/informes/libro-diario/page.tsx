'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { contabilidadService } from '@/services/contabilidad.service'
import { LibroDiarioResponse, LibroDiarioItem } from '@/types/contabilidad.types'
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
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Printer,
  Download,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function LibroDiarioPage() {
  const [data, setData] = useState<LibroDiarioResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedAsientos, setExpandedAsientos] = useState<Set<number>>(new Set())

  // Filtros
  const [ejercicio, setEjercicio] = useState(new Date().getFullYear().toString())
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Cargar datos
  const cargarDatos = async () => {
    try {
      setIsLoading(true)
      const response = await contabilidadService.getLibroDiario({
        ejercicio: parseInt(ejercicio),
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
      })
      setData(response)
      // Expandir todos por defecto
      setExpandedAsientos(new Set(response.asientos.map((a) => a.numero)))
    } catch (error) {
      console.error('Error cargando libro diario:', error)
      toast.error('Error al cargar el libro diario')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Toggle asiento expandido
  const toggleAsiento = (numero: number) => {
    const newExpanded = new Set(expandedAsientos)
    if (newExpanded.has(numero)) {
      newExpanded.delete(numero)
    } else {
      newExpanded.add(numero)
    }
    setExpandedAsientos(newExpanded)
  }

  // Formatear fecha
  const formatFecha = (fecha: Date | string) => {
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es })
  }

  // Formatear importe
  const formatImporte = (importe: number) => {
    return importe.toLocaleString('es-ES', {
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
                <BarChart3 className="h-7 w-7 text-primary" />
                Libro Diario
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {data?.asientos.length || 0} asientos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
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
        <Card className="overflow-hidden print:shadow-none">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando...</span>
            </div>
          ) : !data || data.asientos.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium">No hay asientos en el período</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.asientos.map((asiento) => (
                <div key={asiento.numero}>
                  {/* Cabecera del asiento */}
                  <button
                    className="w-full px-4 py-3 flex items-center gap-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => toggleAsiento(asiento.numero)}
                  >
                    {expandedAsientos.has(asiento.numero) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-mono font-bold">#{asiento.numero}</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatFecha(asiento.fecha)}
                    </span>
                    <span className="flex-1 truncate">{asiento.concepto}</span>
                    <span className="font-medium text-right w-28">
                      {formatImporte(asiento.totalDebe)} €
                    </span>
                    <Badge
                      variant={asiento.estado === 'contabilizado' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {asiento.estado}
                    </Badge>
                  </button>

                  {/* Líneas del asiento */}
                  {expandedAsientos.has(asiento.numero) && (
                    <div className="bg-background">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground border-b">
                            <th className="px-4 py-2 text-left w-24">Cuenta</th>
                            <th className="px-4 py-2 text-left">Descripción</th>
                            <th className="px-4 py-2 text-right w-28">Debe</th>
                            <th className="px-4 py-2 text-right w-28">Haber</th>
                          </tr>
                        </thead>
                        <tbody>
                          {asiento.lineas.map((linea, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="px-4 py-2 font-mono text-xs">
                                {linea.cuentaCodigo}
                              </td>
                              <td className="px-4 py-2">
                                {linea.cuentaNombre}
                                {linea.concepto && linea.concepto !== asiento.concepto && (
                                  <span className="text-muted-foreground text-xs ml-2">
                                    ({linea.concepto})
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                {linea.debe > 0 ? formatImporte(linea.debe) : ''}
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                {linea.haber > 0 ? formatImporte(linea.haber) : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}

              {/* TOTALES */}
              <div className="px-4 py-4 bg-muted/50 flex justify-end gap-8">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Debe</p>
                  <p className="text-lg font-bold">{formatImporte(data.totales.debe)} €</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Haber</p>
                  <p className="text-lg font-bold">{formatImporte(data.totales.haber)} €</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
