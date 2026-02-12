'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { contabilidadService } from '@/services/contabilidad.service'
import { BalanceSituacionResponse, PartidaBalance } from '@/types/contabilidad.types'
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
  Scale,
  ArrowLeft,
  RefreshCw,
  Printer,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function BalanceSituacionPage() {
  const [data, setData] = useState<BalanceSituacionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filtros
  const [ejercicio, setEjercicio] = useState(new Date().getFullYear().toString())
  const [fechaHasta, setFechaHasta] = useState('')
  const [nivelDetalle, setNivelDetalle] = useState('2')

  // Cargar datos
  const cargarDatos = async () => {
    try {
      setIsLoading(true)
      const response = await contabilidadService.getBalanceSituacion({
        ejercicio: parseInt(ejercicio),
        fechaHasta: fechaHasta || undefined,
        nivelDetalle: parseInt(nivelDetalle),
      })
      setData(response)
    } catch (error) {
      console.error('Error cargando balance de situación:', error)
      toast.error('Error al cargar el balance de situación')
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

  // Renderizar partidas
  const renderPartidas = (partidas: PartidaBalance[] = []) => {
    return partidas.map((partida, idx) => (
      <tr
        key={idx}
        className={`hover:bg-muted/30 ${partida.esSubtotal ? 'font-semibold bg-muted/20' : ''}`}
      >
        <td
          className="px-4 py-2 font-mono text-xs"
          style={{ paddingLeft: `${0.5 + partida.nivel * 0.5}rem` }}
        >
          {partida.codigo}
        </td>
        <td className="px-4 py-2">{partida.nombre}</td>
        <td className="px-4 py-2 text-right font-medium">
          {formatImporte(partida.importe)} €
        </td>
      </tr>
    ))
  }

  return (
    
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
                <Scale className="h-7 w-7 text-primary" />
                Balance de Situación
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Estado de situación patrimonial
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {data && (
              <>
                {data.cuadra ? (
                  <Badge variant="default" className="bg-emerald-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Cuadrado
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Diferencia: {formatImporte(data.diferencia)} €
                  </Badge>
                )}
              </>
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
              <Label>Fecha de cierre</Label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="mt-1.5 w-[150px]"
              />
            </div>
            <div>
              <Label>Nivel detalle</Label>
              <Select value={nivelDetalle} onValueChange={setNivelDetalle}>
                <SelectTrigger className="w-[140px] mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Grupos</SelectItem>
                  <SelectItem value="2">Subgrupos</SelectItem>
                  <SelectItem value="3">Cuentas</SelectItem>
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
        </Card>

        {/* CONTENIDO */}
        {isLoading ? (
          <Card className="p-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto" />
            <span className="mt-2 text-muted-foreground">Cargando...</span>
          </Card>
        ) : !data ? (
          <Card className="p-12 text-center">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium">No hay datos para mostrar</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:grid-cols-2">
            {/* ACTIVO */}
            <Card className="overflow-hidden print:shadow-none">
              <div className="bg-blue-50 dark:bg-blue-950/30 px-4 py-3 border-b">
                <h2 className="font-bold text-lg text-blue-700 dark:text-blue-400">ACTIVO</h2>
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
                    {/* Activo No Corriente */}
                    <tr className="bg-muted/30 font-bold">
                      <td className="px-4 py-2" colSpan={2}>A) ACTIVO NO CORRIENTE</td>
                      <td className="px-4 py-2 text-right">
                        {formatImporte(data.activo.totalActivoNoCorriente)} €
                      </td>
                    </tr>
                    {renderPartidas(data.activo.activoNoCorriente)}

                    {/* Activo Corriente */}
                    <tr className="bg-muted/30 font-bold">
                      <td className="px-4 py-2" colSpan={2}>B) ACTIVO CORRIENTE</td>
                      <td className="px-4 py-2 text-right">
                        {formatImporte(data.activo.totalActivoCorriente)} €
                      </td>
                    </tr>
                    {renderPartidas(data.activo.activoCorriente)}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-100 dark:bg-blue-900/30 font-bold border-t-2">
                      <td className="px-4 py-3" colSpan={2}>TOTAL ACTIVO (A+B)</td>
                      <td className="px-4 py-3 text-right text-lg">
                        {formatImporte(data.activo.totalActivo)} €
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>

            {/* PASIVO Y PATRIMONIO NETO */}
            <Card className="overflow-hidden print:shadow-none">
              <div className="bg-green-50 dark:bg-green-950/30 px-4 py-3 border-b">
                <h2 className="font-bold text-lg text-green-700 dark:text-green-400">
                  PATRIMONIO NETO Y PASIVO
                </h2>
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
                    {/* Patrimonio Neto */}
                    <tr className="bg-muted/30 font-bold">
                      <td className="px-4 py-2" colSpan={2}>A) PATRIMONIO NETO</td>
                      <td className="px-4 py-2 text-right">
                        {formatImporte(data.pasivo.totalPatrimonioNeto)} €
                      </td>
                    </tr>
                    {renderPartidas(data.pasivo.patrimonioNeto)}

                    {/* Pasivo No Corriente */}
                    <tr className="bg-muted/30 font-bold">
                      <td className="px-4 py-2" colSpan={2}>B) PASIVO NO CORRIENTE</td>
                      <td className="px-4 py-2 text-right">
                        {formatImporte(data.pasivo.totalPasivoNoCorriente)} €
                      </td>
                    </tr>
                    {renderPartidas(data.pasivo.pasivoNoCorriente)}

                    {/* Pasivo Corriente */}
                    <tr className="bg-muted/30 font-bold">
                      <td className="px-4 py-2" colSpan={2}>C) PASIVO CORRIENTE</td>
                      <td className="px-4 py-2 text-right">
                        {formatImporte(data.pasivo.totalPasivoCorriente)} €
                      </td>
                    </tr>
                    {renderPartidas(data.pasivo.pasivoCorriente)}
                  </tbody>
                  <tfoot>
                    <tr className="bg-green-100 dark:bg-green-900/30 font-bold border-t-2">
                      <td className="px-4 py-3" colSpan={2}>TOTAL PN + PASIVO (A+B+C)</td>
                      <td className="px-4 py-3 text-right text-lg">
                        {formatImporte(data.pasivo.totalPasivoPatrimonio)} €
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    
  )
}
