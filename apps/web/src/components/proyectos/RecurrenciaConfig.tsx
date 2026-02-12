'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
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
import { EditableSearchableSelect } from '@/components/ui/searchable-select'
import {
  Loader2,
  Save,
  RefreshCw,
  Calendar,
  Plus,
  Trash2,
  ClipboardList,
  FileText,
  Receipt,
  Play,
  History,
  AlertCircle,
  Package,
  Wrench,
  Truck,
  DollarSign,
  Users,
} from 'lucide-react'
import { DateInput } from '@/components/ui/date-picker'
import { proyectosService } from '@/services/proyectos.service'
import { productosService } from '@/services/productos.service'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

// ============================================
// TIPOS
// ============================================

type FrecuenciaRecurrencia = 'semanal' | 'quincenal' | 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
type TipoLineaPlantilla = 'mano_obra' | 'material' | 'gasto' | 'maquinaria' | 'transporte'

interface ILineaPlantilla {
  _id?: string
  tipo: TipoLineaPlantilla
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
  productoId?: string
  personalId?: string
  incluirEnAlbaran: boolean
}

interface IConfiguracionRecurrencia {
  activo: boolean
  frecuencia: FrecuenciaRecurrencia
  diaGeneracion: number
  fechaInicio: string
  fechaFin?: string
  proximaGeneracion?: string
  generarParteTrabajo: boolean
  generarAlbaran: boolean
  generarFactura: boolean
  lineasPlantilla: ILineaPlantilla[]
}

interface IInstanciaGenerada {
  _id: string
  fechaGeneracion: string
  periodoInicio: string
  periodoFin: string
  estado: string
  parteTrabajoId?: any
  albaranId?: any
  facturaId?: any
  observaciones?: string
}

interface RecurrenciaConfigProps {
  proyectoId: string
  esRecurrente: boolean
  recurrencia?: IConfiguracionRecurrencia
  onUpdate: () => void
}

interface ProductoOption {
  value: string
  label: string
  description?: string
  precio?: number
  unidad?: string
}

// ============================================
// CONSTANTES
// ============================================

const FRECUENCIAS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
]

const TIPOS_LINEA = [
  { value: 'mano_obra', label: 'Mano de Obra', icon: Users },
  { value: 'material', label: 'Material', icon: Package },
  { value: 'gasto', label: 'Gasto', icon: DollarSign },
  { value: 'maquinaria', label: 'Maquinaria', icon: Wrench },
  { value: 'transporte', label: 'Transporte', icon: Truck },
]

const UNIDADES = [
  { value: 'h', label: 'Horas' },
  { value: 'ud', label: 'Unidades' },
  { value: 'kg', label: 'Kg' },
  { value: 'km', label: 'Km' },
  { value: 'dia', label: 'Días' },
  { value: 'm', label: 'Metros' },
  { value: 'm2', label: 'm²' },
  { value: 'm3', label: 'm³' },
]

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function RecurrenciaConfig({
  proyectoId,
  esRecurrente,
  recurrencia,
  onUpdate,
}: RecurrenciaConfigProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [historial, setHistorial] = useState<IInstanciaGenerada[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [showHistorial, setShowHistorial] = useState(false)

  // Productos
  const [productos, setProductos] = useState<ProductoOption[]>([])
  const [loadingProductos, setLoadingProductos] = useState(false)

  // Refs para navegación con teclado
  const cantidadRefs = useRef<Map<number, HTMLInputElement>>(new Map())

  // Estado del formulario
  const [config, setConfig] = useState<IConfiguracionRecurrencia>({
    activo: false,
    frecuencia: 'mensual',
    diaGeneracion: 1,
    fechaInicio: new Date().toISOString().split('T')[0],
    generarParteTrabajo: true,
    generarAlbaran: false,
    generarFactura: false,
    lineasPlantilla: [],
  })

  // Cargar productos
  useEffect(() => {
    const loadProductos = async () => {
      try {
        setLoadingProductos(true)
        const response = await productosService.getAll({ activo: true, limit: 500 })
        if (response.success && response.data) {
          setProductos(
            response.data.map((p: any) => ({
              value: p._id,
              label: p.nombre,
              description: `${p.codigo} - ${p.categoria || 'Sin categoría'}`,
              precio: p.precioVenta || 0,
              unidad: p.unidad || 'ud',
            }))
          )
        }
      } catch (error) {
        console.error('Error cargando productos:', error)
      } finally {
        setLoadingProductos(false)
      }
    }
    if (open) {
      loadProductos()
    }
  }, [open])

  // Calcular próxima fecha de generación
  const calcularProximaFecha = useCallback(
    (frecuencia: FrecuenciaRecurrencia, diaGeneracion: number, fechaInicio: string): string => {
      const fecha = new Date(fechaInicio)
      const hoy = new Date()

      // Empezar desde la fecha de inicio o desde hoy si ya pasó
      if (fecha < hoy) {
        fecha.setTime(hoy.getTime())
      }

      // Ajustar al día de generación
      const getDaysInMonth = (date: Date) =>
        new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

      switch (frecuencia) {
        case 'semanal':
          // Próximo día de la semana (diaGeneracion: 1-7)
          const diasHastaSiguiente = ((diaGeneracion - fecha.getDay() + 7) % 7) || 7
          fecha.setDate(fecha.getDate() + diasHastaSiguiente)
          break

        case 'quincenal':
          // Cada 15 días desde fecha inicio
          const diasTranscurridos = Math.floor(
            (hoy.getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24)
          )
          const periodos = Math.ceil(diasTranscurridos / 15)
          fecha.setTime(new Date(fechaInicio).getTime())
          fecha.setDate(fecha.getDate() + periodos * 15)
          if (fecha <= hoy) {
            fecha.setDate(fecha.getDate() + 15)
          }
          break

        case 'mensual':
          fecha.setDate(Math.min(diaGeneracion, getDaysInMonth(fecha)))
          if (fecha <= hoy) {
            fecha.setMonth(fecha.getMonth() + 1)
            fecha.setDate(Math.min(diaGeneracion, getDaysInMonth(fecha)))
          }
          break

        case 'bimestral':
          fecha.setDate(Math.min(diaGeneracion, getDaysInMonth(fecha)))
          if (fecha <= hoy) {
            fecha.setMonth(fecha.getMonth() + 2)
            fecha.setDate(Math.min(diaGeneracion, getDaysInMonth(fecha)))
          }
          break

        case 'trimestral':
          fecha.setDate(Math.min(diaGeneracion, getDaysInMonth(fecha)))
          if (fecha <= hoy) {
            fecha.setMonth(fecha.getMonth() + 3)
            fecha.setDate(Math.min(diaGeneracion, getDaysInMonth(fecha)))
          }
          break

        case 'semestral':
          fecha.setDate(Math.min(diaGeneracion, getDaysInMonth(fecha)))
          if (fecha <= hoy) {
            fecha.setMonth(fecha.getMonth() + 6)
            fecha.setDate(Math.min(diaGeneracion, getDaysInMonth(fecha)))
          }
          break

        case 'anual':
          fecha.setDate(Math.min(diaGeneracion, getDaysInMonth(fecha)))
          if (fecha <= hoy) {
            fecha.setFullYear(fecha.getFullYear() + 1)
            fecha.setDate(Math.min(diaGeneracion, getDaysInMonth(fecha)))
          }
          break
      }

      return fecha.toISOString().split('T')[0]
    },
    []
  )

  // Recalcular próxima generación cuando cambian los parámetros
  useEffect(() => {
    if (config.activo && config.fechaInicio) {
      const nuevaProximaGeneracion = calcularProximaFecha(
        config.frecuencia,
        config.diaGeneracion,
        config.fechaInicio
      )
      setConfig((prev) => {
        // Solo actualizar si el valor realmente cambió
        if (prev.proximaGeneracion !== nuevaProximaGeneracion) {
          return { ...prev, proximaGeneracion: nuevaProximaGeneracion }
        }
        return prev
      })
    }
    // Nota: No incluimos config.proximaGeneracion en dependencias para evitar loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.activo, config.frecuencia, config.diaGeneracion, config.fechaInicio, calcularProximaFecha])

  // Cargar configuración existente
  useEffect(() => {
    if (recurrencia) {
      setConfig({
        activo: recurrencia.activo,
        frecuencia: recurrencia.frecuencia,
        diaGeneracion: recurrencia.diaGeneracion,
        fechaInicio: recurrencia.fechaInicio
          ? new Date(recurrencia.fechaInicio).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        fechaFin: recurrencia.fechaFin
          ? new Date(recurrencia.fechaFin).toISOString().split('T')[0]
          : undefined,
        proximaGeneracion: recurrencia.proximaGeneracion
          ? new Date(recurrencia.proximaGeneracion).toISOString().split('T')[0]
          : undefined,
        generarParteTrabajo: recurrencia.generarParteTrabajo,
        generarAlbaran: recurrencia.generarAlbaran,
        generarFactura: recurrencia.generarFactura,
        lineasPlantilla: recurrencia.lineasPlantilla || [],
      })
    }
  }, [recurrencia])

  // Cargar historial cuando se abre
  const cargarHistorial = async () => {
    try {
      setLoadingHistorial(true)
      const response = await proyectosService.getHistorialGeneraciones(proyectoId)
      if (response.success) {
        setHistorial(response.data || [])
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
    } finally {
      setLoadingHistorial(false)
    }
  }

  // Guardar configuración
  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await proyectosService.configurarRecurrencia(proyectoId, config)
      if (response.success) {
        toast.success('Configuración de recurrencia guardada')
        onUpdate()
        setOpen(false)
      } else {
        toast.error(response.message || 'Error al guardar configuración')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  // Generar ahora
  const handleGenerarAhora = async () => {
    try {
      setGenerating(true)
      const response = await proyectosService.procesarRecurrente(proyectoId)
      if (response.success) {
        const data = response.data
        if (data.parteTrabajoNumero) {
          toast.success(`Parte de trabajo ${data.parteTrabajoNumero} generado`)
        }
        if (data.albaranNumero) {
          toast.success(`Albarán ${data.albaranNumero} generado`)
        }
        onUpdate()
        cargarHistorial()
      } else {
        toast.error(response.message || 'Error al generar')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al generar')
    } finally {
      setGenerating(false)
    }
  }

  // ============================================
  // GESTIÓN DE LÍNEAS DE PLANTILLA
  // ============================================

  const agregarLinea = useCallback((tipo: TipoLineaPlantilla = 'material') => {
    setConfig((prev) => ({
      ...prev,
      lineasPlantilla: [
        ...prev.lineasPlantilla,
        {
          tipo,
          descripcion: '',
          cantidad: 1,
          unidad: tipo === 'mano_obra' ? 'h' : tipo === 'transporte' ? 'km' : 'ud',
          precioUnitario: 0,
          incluirEnAlbaran: true,
        },
      ],
    }))
    // Focus en el nuevo campo después de un pequeño delay
    setTimeout(() => {
      const newIndex = config.lineasPlantilla.length
      const cantidadInput = cantidadRefs.current.get(newIndex)
      if (cantidadInput) {
        cantidadInput.focus()
      }
    }, 100)
  }, [config.lineasPlantilla.length])

  const actualizarLinea = useCallback((index: number, campo: keyof ILineaPlantilla, valor: any) => {
    setConfig((prev) => {
      const lineas = [...prev.lineasPlantilla]
      lineas[index] = { ...lineas[index], [campo]: valor }
      return { ...prev, lineasPlantilla: lineas }
    })
  }, [])

  const eliminarLinea = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      lineasPlantilla: prev.lineasPlantilla.filter((_, i) => i !== index),
    }))
  }, [])

  // Seleccionar producto
  const handleProductoSelect = useCallback((index: number, productoId: string) => {
    const producto = productos.find((p) => p.value === productoId)
    if (producto) {
      setConfig((prev) => {
        const lineas = [...prev.lineasPlantilla]
        lineas[index] = {
          ...lineas[index],
          productoId,
          descripcion: producto.label,
          precioUnitario: producto.precio || 0,
          unidad: producto.unidad || 'ud',
        }
        return { ...prev, lineasPlantilla: lineas }
      })
    }
  }, [productos])

  // Manejar Ctrl+Enter para añadir línea
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      agregarLinea('material')
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // Mover al siguiente campo o siguiente línea
      const nextCantidadInput = cantidadRefs.current.get(index + 1)
      if (nextCantidadInput) {
        nextCantidadInput.focus()
      }
    }
  }, [agregarLinea])

  // Calcular total plantilla
  const totalPlantilla = config.lineasPlantilla.reduce(
    (sum, linea) => sum + linea.cantidad * linea.precioUnitario,
    0
  )

  const getTipoIcon = (tipo: TipoLineaPlantilla) => {
    const tipoConfig = TIPOS_LINEA.find((t) => t.value === tipo)
    if (!tipoConfig) return Package
    return tipoConfig.icon
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant={esRecurrente ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setOpen(true)
            if (esRecurrente) {
              cargarHistorial()
            }
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {esRecurrente ? 'Recurrencia Activa' : 'Configurar Recurrencia'}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-5xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Configuración de Recurrencia
          </SheetTitle>
          <SheetDescription>
            Configura la generación automática de partes de trabajo y albaranes.
            <span className="block text-xs mt-1 text-blue-600">
              Ctrl+Enter para añadir nueva línea
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Activar/Desactivar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Activar Recurrencia</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilita la generación automática periódica
                  </p>
                </div>
                <Switch
                  checked={config.activo}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({ ...prev, activo: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {config.activo && (
            <>
              {/* Frecuencia */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Frecuencia</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Periodicidad</Label>
                    <Select
                      value={config.frecuencia}
                      onValueChange={(value) =>
                        setConfig((prev) => ({
                          ...prev,
                          frecuencia: value as FrecuenciaRecurrencia,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FRECUENCIAS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Día de Generación</Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={config.diaGeneracion}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          diaGeneracion: parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha Inicio</Label>
                    <DateInput
                      value={config.fechaInicio}
                      onChange={(value) =>
                        setConfig((prev) => ({ ...prev, fechaInicio: value || '' }))
                      }
                      placeholder="Seleccionar"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha Fin (opcional)</Label>
                    <DateInput
                      value={config.fechaFin || ''}
                      onChange={(value) =>
                        setConfig((prev) => ({ ...prev, fechaFin: value || undefined }))
                      }
                      placeholder="Sin fecha fin"
                    />
                  </div>

                  {config.proximaGeneracion && (
                    <div className="col-span-2 p-3 bg-muted rounded-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Próxima generación:{' '}
                        <strong>
                          {new Date(config.proximaGeneracion).toLocaleDateString('es-ES')}
                        </strong>
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Acciones Automáticas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Acciones Automáticas</CardTitle>
                  <CardDescription>
                    Qué documentos generar en cada ciclo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      <span>Generar Parte de Trabajo</span>
                    </div>
                    <Switch
                      checked={config.generarParteTrabajo}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, generarParteTrabajo: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Generar Albarán</span>
                    </div>
                    <Switch
                      checked={config.generarAlbaran}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, generarAlbaran: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      <span>Generar Factura</span>
                      <span className="text-xs text-muted-foreground">(genera albarán automáticamente)</span>
                    </div>
                    <Switch
                      checked={config.generarFactura}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, generarFactura: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Plantilla de Líneas */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Plantilla de Líneas</CardTitle>
                      <CardDescription>
                        Líneas que se incluirán en cada generación
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {TIPOS_LINEA.map((tipo) => {
                        const Icon = tipo.icon
                        return (
                          <Button
                            key={tipo.value}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => agregarLinea(tipo.value as TipoLineaPlantilla)}
                            title={`Añadir ${tipo.label}`}
                          >
                            <Icon className="h-4 w-4" />
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {config.lineasPlantilla.length > 0 ? (
                    <div className="space-y-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">Tipo</TableHead>
                            <TableHead className="min-w-[200px]">Producto/Descripción</TableHead>
                            <TableHead className="w-20 text-right">Cant.</TableHead>
                            <TableHead className="w-16">Ud.</TableHead>
                            <TableHead className="w-24 text-right">Precio</TableHead>
                            <TableHead className="w-24 text-right">Total</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {config.lineasPlantilla.map((linea, index) => {
                            const TipoIcon = getTipoIcon(linea.tipo)
                            const lineaTotal = linea.cantidad * linea.precioUnitario

                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  <Select
                                    value={linea.tipo}
                                    onValueChange={(value) =>
                                      actualizarLinea(index, 'tipo', value)
                                    }
                                  >
                                    <SelectTrigger className="w-10 h-8 p-0 justify-center border-0">
                                      <TipoIcon className="h-4 w-4" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIPOS_LINEA.map((t) => {
                                        const Icon = t.icon
                                        return (
                                          <SelectItem key={t.value} value={t.value}>
                                            <div className="flex items-center gap-2">
                                              <Icon className="h-4 w-4" />
                                              {t.label}
                                            </div>
                                          </SelectItem>
                                        )
                                      })}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  {linea.tipo === 'material' ? (
                                    <EditableSearchableSelect
                                      options={productos}
                                      value={linea.productoId || ''}
                                      displayValue={linea.descripcion}
                                      onValueChange={(value) =>
                                        handleProductoSelect(index, value)
                                      }
                                      onInputChange={(value) =>
                                        actualizarLinea(index, 'descripcion', value)
                                      }
                                      placeholder="Buscar producto..."
                                      emptyMessage="No se encontraron productos"
                                      loading={loadingProductos}
                                      className="h-8"
                                      onKeyDown={(e) => handleKeyDown(e, index)}
                                    />
                                  ) : (
                                    <Input
                                      value={linea.descripcion}
                                      onChange={(e) =>
                                        actualizarLinea(index, 'descripcion', e.target.value)
                                      }
                                      placeholder={
                                        linea.tipo === 'mano_obra'
                                          ? 'Ej: Técnico instalador'
                                          : linea.tipo === 'gasto'
                                            ? 'Ej: Dietas, parking'
                                            : linea.tipo === 'maquinaria'
                                              ? 'Ej: Grúa, elevador'
                                              : 'Ej: Desplazamiento'
                                      }
                                      className="h-8"
                                      onKeyDown={(e) => handleKeyDown(e, index)}
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    ref={(el) => {
                                      if (el) cantidadRefs.current.set(index, el)
                                    }}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={linea.cantidad}
                                    onChange={(e) =>
                                      actualizarLinea(
                                        index,
                                        'cantidad',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="h-8 text-right"
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={linea.unidad}
                                    onValueChange={(value) =>
                                      actualizarLinea(index, 'unidad', value)
                                    }
                                  >
                                    <SelectTrigger className="h-8 w-16">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {UNIDADES.map((u) => (
                                        <SelectItem key={u.value} value={u.value}>
                                          {u.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={linea.precioUnitario}
                                    onChange={(e) =>
                                      actualizarLinea(
                                        index,
                                        'precioUnitario',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="h-8 text-right"
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                  />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(lineaTotal)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => eliminarLinea(index)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>

                      {/* Total */}
                      <div className="flex justify-end p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">
                          Total plantilla:{' '}
                          <span className="text-lg font-bold">
                            {formatCurrency(totalPlantilla)}
                          </span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay líneas en la plantilla</p>
                      <p className="text-xs mb-3">
                        Usa los botones de arriba para añadir líneas
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => agregarLinea('material')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir Material
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Historial */}
              {esRecurrente && (
                <Card>
                  <CardHeader className="pb-3">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => {
                        setShowHistorial(!showHistorial)
                        if (!showHistorial && historial.length === 0) {
                          cargarHistorial()
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        <CardTitle className="text-base">Historial de Generaciones</CardTitle>
                      </div>
                      <Badge variant="secondary">{historial.length}</Badge>
                    </div>
                  </CardHeader>

                  {showHistorial && (
                    <CardContent>
                      {loadingHistorial ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : historial.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {historial.map((inst) => (
                            <div
                              key={inst._id}
                              className="flex items-center justify-between p-2 border rounded text-sm"
                            >
                              <div>
                                <span className="font-medium">
                                  {new Date(inst.periodoInicio).toLocaleDateString('es-ES')} -{' '}
                                  {new Date(inst.periodoFin).toLocaleDateString('es-ES')}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  Generado:{' '}
                                  {new Date(inst.fechaGeneracion).toLocaleDateString('es-ES')}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {inst.parteTrabajoId && (
                                  <Badge variant="outline" className="text-xs">
                                    PT: {inst.parteTrabajoId.numero || 'N/A'}
                                  </Badge>
                                )}
                                {inst.albaranId && (
                                  <Badge variant="outline" className="text-xs">
                                    ALB: {inst.albaranId.numero || 'N/A'}
                                  </Badge>
                                )}
                                <Badge
                                  variant={
                                    inst.estado === 'facturado'
                                      ? 'default'
                                      : inst.estado === 'albaran_generado'
                                        ? 'secondary'
                                        : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  {inst.estado}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          No hay generaciones en el historial
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}
            </>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4 border-t">
            {esRecurrente && config.activo && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerarAhora}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Generar Ahora
              </Button>
            )}

            <Button
              type="button"
              className="flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Configuración
            </Button>
          </div>

          {!config.activo && esRecurrente && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                La recurrencia está desactivada. Active el switch para reanudar la generación automática.
              </span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default RecurrenciaConfig
