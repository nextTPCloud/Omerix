'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { contabilidadService } from '@/services/contabilidad.service'
import { CuentaContable } from '@/types/contabilidad.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Search,
  ChevronsUpDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface LineaAsientoForm {
  id: string
  cuentaCodigo: string
  cuentaNombre: string
  debe: string
  haber: string
  concepto: string
}

const crearLineaVacia = (): LineaAsientoForm => ({
  id: Math.random().toString(36).substr(2, 9),
  cuentaCodigo: '',
  cuentaNombre: '',
  debe: '',
  haber: '',
  concepto: '',
})

export default function NuevoAsientoPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cuentas, setCuentas] = useState<CuentaContable[]>([])
  const [searchResults, setSearchResults] = useState<CuentaContable[]>([])

  // Formulario
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [concepto, setConcepto] = useState('')
  const [lineas, setLineas] = useState<LineaAsientoForm[]>([
    crearLineaVacia(),
    crearLineaVacia(),
  ])

  // Popover de búsqueda de cuenta activo
  const [activeCuentaSearch, setActiveCuentaSearch] = useState<string | null>(null)

  // Cargar cuentas al inicio
  useEffect(() => {
    const cargarCuentas = async () => {
      try {
        const data = await contabilidadService.getCuentas({
          esMovimiento: true,
          activa: true,
        })
        setCuentas(data)
      } catch (error) {
        console.error('Error cargando cuentas:', error)
      }
    }
    cargarCuentas()
  }, [])

  // Buscar cuentas
  const buscarCuentas = useCallback(
    (query: string) => {
      if (!query) {
        setSearchResults(cuentas.slice(0, 20))
        return
      }
      const q = query.toLowerCase()
      const results = cuentas.filter(
        (c) =>
          c.codigo.toLowerCase().includes(q) ||
          c.nombre.toLowerCase().includes(q)
      )
      setSearchResults(results.slice(0, 20))
    },
    [cuentas]
  )

  // Seleccionar cuenta
  const seleccionarCuenta = (lineaId: string, cuenta: CuentaContable) => {
    setLineas((prev) =>
      prev.map((l) =>
        l.id === lineaId
          ? { ...l, cuentaCodigo: cuenta.codigo, cuentaNombre: cuenta.nombre }
          : l
      )
    )
    setActiveCuentaSearch(null)
  }

  // Actualizar línea
  const actualizarLinea = (id: string, campo: keyof LineaAsientoForm, valor: string) => {
    setLineas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    )
  }

  // Agregar línea
  const agregarLinea = () => {
    setLineas((prev) => [...prev, crearLineaVacia()])
  }

  // Eliminar línea
  const eliminarLinea = (id: string) => {
    if (lineas.length <= 2) {
      toast.error('El asiento debe tener al menos 2 líneas')
      return
    }
    setLineas((prev) => prev.filter((l) => l.id !== id))
  }

  // Calcular totales
  const totalDebe = lineas.reduce(
    (sum, l) => sum + (parseFloat(l.debe) || 0),
    0
  )
  const totalHaber = lineas.reduce(
    (sum, l) => sum + (parseFloat(l.haber) || 0),
    0
  )
  const diferencia = Math.abs(totalDebe - totalHaber)
  const estaCuadrado = diferencia < 0.01

  // Guardar asiento
  const handleSubmit = async () => {
    // Validaciones
    if (!fecha) {
      toast.error('La fecha es obligatoria')
      return
    }
    if (!concepto.trim()) {
      toast.error('El concepto es obligatorio')
      return
    }

    const lineasValidas = lineas.filter(
      (l) =>
        l.cuentaCodigo && (parseFloat(l.debe) > 0 || parseFloat(l.haber) > 0)
    )

    if (lineasValidas.length < 2) {
      toast.error('El asiento debe tener al menos 2 líneas con importes')
      return
    }

    if (!estaCuadrado) {
      toast.error('El asiento debe estar cuadrado (Debe = Haber)')
      return
    }

    try {
      setIsSubmitting(true)
      const asiento = await contabilidadService.createAsiento({
        fecha,
        concepto,
        lineas: lineasValidas.map((l) => ({
          cuentaCodigo: l.cuentaCodigo,
          debe: parseFloat(l.debe) || 0,
          haber: parseFloat(l.haber) || 0,
          concepto: l.concepto || concepto,
        })),
      })

      toast.success(`Asiento #${asiento.numero} creado correctamente`)
      router.push('/contabilidad/asientos')
    } catch (error: any) {
      console.error('Error creando asiento:', error)
      toast.error(error.response?.data?.error || 'Error al crear el asiento')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Formatear importe
  const formatImporte = (value: number) => {
    return value.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    
      <div className="w-full max-w-5xl mx-auto space-y-4">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/contabilidad/asientos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-7 w-7 text-primary" />
              Nuevo Asiento Contable
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea un asiento manual
            </p>
          </div>
        </div>

        {/* CABECERA */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="concepto">Concepto *</Label>
              <Input
                id="concepto"
                placeholder="Descripción del asiento..."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        </Card>

        {/* LÍNEAS */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Líneas del Asiento</h2>
            <Button variant="outline" size="sm" onClick={agregarLinea}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir Línea
            </Button>
          </div>

          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-2">
              <div className="col-span-3">Cuenta</div>
              <div className="col-span-3">Descripción</div>
              <div className="col-span-2 text-right">Debe</div>
              <div className="col-span-2 text-right">Haber</div>
              <div className="col-span-1">Concepto</div>
              <div className="col-span-1"></div>
            </div>

            {/* Líneas */}
            {lineas.map((linea, idx) => (
              <div
                key={linea.id}
                className="grid grid-cols-12 gap-2 items-center bg-muted/30 rounded-lg p-2"
              >
                {/* Cuenta */}
                <div className="col-span-3">
                  <Popover
                    open={activeCuentaSearch === linea.id}
                    onOpenChange={(open) =>
                      setActiveCuentaSearch(open ? linea.id : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-9 text-left font-normal"
                      >
                        <span className="truncate">
                          {linea.cuentaCodigo
                            ? `${linea.cuentaCodigo} - ${linea.cuentaNombre}`
                            : 'Seleccionar cuenta...'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Buscar cuenta..."
                          onValueChange={buscarCuentas}
                        />
                        <CommandList>
                          <CommandEmpty>No se encontraron cuentas</CommandEmpty>
                          <CommandGroup>
                            {(searchResults.length > 0 ? searchResults : cuentas.slice(0, 20)).map(
                              (cuenta) => (
                                <CommandItem
                                  key={cuenta._id}
                                  value={cuenta.codigo}
                                  onSelect={() =>
                                    seleccionarCuenta(linea.id, cuenta)
                                  }
                                >
                                  <span className="font-mono mr-2">
                                    {cuenta.codigo}
                                  </span>
                                  <span className="truncate">{cuenta.nombre}</span>
                                </CommandItem>
                              )
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Nombre cuenta (solo lectura) */}
                <div className="col-span-3">
                  <span className="text-sm truncate block">
                    {linea.cuentaNombre || '-'}
                  </span>
                </div>

                {/* Debe */}
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={linea.debe}
                    onChange={(e) =>
                      actualizarLinea(linea.id, 'debe', e.target.value)
                    }
                    className="h-9 text-right"
                    disabled={parseFloat(linea.haber) > 0}
                  />
                </div>

                {/* Haber */}
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={linea.haber}
                    onChange={(e) =>
                      actualizarLinea(linea.id, 'haber', e.target.value)
                    }
                    className="h-9 text-right"
                    disabled={parseFloat(linea.debe) > 0}
                  />
                </div>

                {/* Concepto línea */}
                <div className="col-span-1">
                  <Input
                    placeholder="..."
                    value={linea.concepto}
                    onChange={(e) =>
                      actualizarLinea(linea.id, 'concepto', e.target.value)
                    }
                    className="h-9 text-xs"
                  />
                </div>

                {/* Eliminar */}
                <div className="col-span-1 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => eliminarLinea(linea.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* TOTALES */}
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6 text-right font-semibold">Totales:</div>
              <div className="col-span-2 text-right font-bold">
                {formatImporte(totalDebe)} €
              </div>
              <div className="col-span-2 text-right font-bold">
                {formatImporte(totalHaber)} €
              </div>
              <div className="col-span-2"></div>
            </div>

            {/* Estado cuadre */}
            <div className="mt-3 flex items-center justify-end gap-2">
              {estaCuadrado ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Asiento cuadrado</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Descuadre: {formatImporte(diferencia)} €
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ACCIONES */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/contabilidad/asientos">Cancelar</Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !estaCuadrado}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Guardando...' : 'Guardar Asiento'}
          </Button>
        </div>
      </div>
    
  )
}
