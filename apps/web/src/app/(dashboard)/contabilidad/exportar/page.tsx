'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { contabilidadService } from '@/services/contabilidad.service'
import { ExportFormat, ExportFormatInfo } from '@/types/contabilidad.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Download,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

// Iconos por formato
const FORMATO_ICONS: Record<string, any> = {
  csv: FileSpreadsheet,
  a3: FileText,
  sage50: FileText,
  sagedespachos: FileText,
  sage200: FileSpreadsheet,
}

export default function ExportarContabilidadPage() {
  const [formatos, setFormatos] = useState<Record<ExportFormat, ExportFormatInfo>>({} as any)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Opciones de exportación
  const [tipoExportacion, setTipoExportacion] = useState<'asientos' | 'cuentas'>('asientos')
  const [formato, setFormato] = useState<ExportFormat>('csv')
  const [ejercicio, setEjercicio] = useState(new Date().getFullYear().toString())
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [codigoEmpresa, setCodigoEmpresa] = useState('001')

  // Cargar formatos
  useEffect(() => {
    const cargarFormatos = async () => {
      try {
        const data = await contabilidadService.getFormatosExportacion()
        setFormatos(data)
      } catch (error) {
        console.error('Error cargando formatos:', error)
      } finally {
        setIsLoading(false)
      }
    }
    cargarFormatos()
  }, [])

  // Exportar
  const handleExportar = async () => {
    try {
      setIsExporting(true)

      let blob: Blob
      let nombreArchivo: string

      if (tipoExportacion === 'asientos') {
        blob = await contabilidadService.exportarAsientos(formato, {
          ejercicio: parseInt(ejercicio),
          fechaDesde: fechaDesde || undefined,
          fechaHasta: fechaHasta || undefined,
          codigoEmpresa,
        })
        nombreArchivo = `asientos_${ejercicio}.${formatos[formato]?.extension || 'txt'}`
      } else {
        blob = await contabilidadService.exportarPlanCuentas(formato, {
          ejercicio: parseInt(ejercicio),
          codigoEmpresa,
        })
        nombreArchivo = `plan_cuentas_${ejercicio}.${formatos[formato]?.extension || 'txt'}`
      }

      contabilidadService.descargarArchivo(blob, nombreArchivo)
      toast.success('Exportación completada')
    } catch (error: any) {
      console.error('Error exportando:', error)
      toast.error(error.response?.data?.error || 'Error al exportar')
    } finally {
      setIsExporting(false)
    }
  }

  // Años disponibles
  const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      
    )
  }

  return (
    
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/contabilidad">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Download className="h-7 w-7 text-primary" />
              Exportar Contabilidad
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Exporta tus datos a diferentes formatos
            </p>
          </div>
        </div>

        {/* TIPO DE EXPORTACIÓN */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Tipo de Exportación</h2>
          <RadioGroup
            value={tipoExportacion}
            onValueChange={(v) => setTipoExportacion(v as 'asientos' | 'cuentas')}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="asientos"
                id="asientos"
                className="peer sr-only"
              />
              <Label
                htmlFor="asientos"
                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <FileText className="mb-2 h-6 w-6" />
                <span className="font-medium">Asientos Contables</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Libro diario y movimientos
                </span>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="cuentas"
                id="cuentas"
                className="peer sr-only"
              />
              <Label
                htmlFor="cuentas"
                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <FileSpreadsheet className="mb-2 h-6 w-6" />
                <span className="font-medium">Plan de Cuentas</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Catálogo de cuentas
                </span>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* FORMATO */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Formato de Exportación</h2>
          <RadioGroup
            value={formato}
            onValueChange={(v) => setFormato(v as ExportFormat)}
            className="space-y-3"
          >
            {Object.entries(formatos).map(([key, info]) => {
              const Icon = FORMATO_ICONS[key] || FileText
              return (
                <div key={key} className="flex items-center">
                  <RadioGroupItem value={key} id={key} className="peer sr-only" />
                  <Label
                    htmlFor={key}
                    className="flex flex-1 items-center gap-4 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{info.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {info.descripcion}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      .{info.extension}
                    </span>
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </Card>

        {/* OPCIONES */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Opciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Ejercicio</Label>
              <Select value={ejercicio} onValueChange={setEjercicio}>
                <SelectTrigger className="mt-1.5">
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

            {(formato === 'a3' || formato.startsWith('sage')) && (
              <div>
                <Label>Código de Empresa</Label>
                <Input
                  value={codigoEmpresa}
                  onChange={(e) => setCodigoEmpresa(e.target.value)}
                  placeholder="001"
                  maxLength={10}
                  className="mt-1.5"
                />
              </div>
            )}

            {tipoExportacion === 'asientos' && (
              <>
                <div>
                  <Label>Fecha Desde (opcional)</Label>
                  <Input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Fecha Hasta (opcional)</Label>
                  <Input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        {/* RESUMEN Y BOTÓN */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Resumen de Exportación</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {tipoExportacion === 'asientos' ? 'Asientos contables' : 'Plan de cuentas'} del
                ejercicio {ejercicio} en formato {formatos[formato]?.nombre || formato}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleExportar}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* INFO */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            CSV: Compatible con Excel, Google Sheets y cualquier hoja de cálculo
          </p>
          <p className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            A3: Formato XDiario para A3 Asesor / A3Con
          </p>
          <p className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Sage: Compatible con Sage 50 (ContaPlus), Sage Despachos y Sage 200
          </p>
        </div>
      </div>
    
  )
}
