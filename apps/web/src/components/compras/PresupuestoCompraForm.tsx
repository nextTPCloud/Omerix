'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  PresupuestoCompra,
  CreatePresupuestoCompraDTO,
  UpdatePresupuestoCompraDTO,
  LineaPresupuestoCompra,
  ESTADOS_PRESUPUESTO_COMPRA,
  PRIORIDADES,
  EstadoPresupuestoCompra,
} from '@/types/presupuesto-compra.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  FileText,
  Save,
  Building2,
  ShoppingCart,
  Settings,
  Calculator,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Percent,
  Layers,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

// Components
import { SearchableSelect, EditableSearchableSelect } from '@/components/ui/searchable-select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DateInput } from '@/components/ui/date-picker'
import { VarianteSelector, VarianteSeleccion } from '@/components/productos/VarianteSelector'

// Services
import { proveedoresService } from '@/services/proveedores.service'
import { productosService } from '@/services/productos.service'
import { seriesDocumentosService } from '@/services/series-documentos.service'

// Types
import { Proveedor } from '@/types/proveedor.types'
import { Producto, Variante } from '@/types/producto.types'
import { ISerieDocumento } from '@/types/serie-documento.types'
import { toast } from 'sonner'

// Interfaces para kit y variante
interface IComponenteKitPresupuesto {
  productoId: string
  nombre: string
  sku?: string
  cantidad: number
  precioUnitario: number
  opcional: boolean
  seleccionado: boolean
}

interface IVarianteSeleccionada {
  varianteId: string
  sku: string
  combinacion: Record<string, string>
  costeAdicional?: number
}

interface PresupuestoCompraFormProps {
  presupuesto?: PresupuestoCompra
  onSubmit: (data: CreatePresupuestoCompraDTO | UpdatePresupuestoCompraDTO) => Promise<void>
  isEditing?: boolean
}

// Tipo de linea local para el formulario
interface LineaFormulario {
  _id?: string
  orden: number
  tipo: 'producto' | 'servicio' | 'texto' | 'kit'
  productoId?: string
  codigo?: string
  nombre: string
  descripcion?: string
  codigoProveedor?: string
  // Kit y variante
  variante?: IVarianteSeleccionada
  componentesKit?: IComponenteKitPresupuesto[]
  mostrarComponentes?: boolean
  // Cantidades
  cantidad: number
  unidad?: string
  precioUnitario: number
  descuento: number
  iva: number
  subtotal: number
  ivaImporte: number
  total: number
  // Campos de margen/PVP
  precioVenta: number
  margenPorcentaje: number
  margenImporte: number
}

// Funcion para calcular linea
const calcularLinea = (linea: LineaFormulario): LineaFormulario => {
  const subtotalBruto = linea.cantidad * linea.precioUnitario
  const descuentoImporte = subtotalBruto * (linea.descuento / 100)
  const subtotal = subtotalBruto - descuentoImporte
  const ivaImporte = subtotal * (linea.iva / 100)
  const total = subtotal + ivaImporte

  // Calcular peso total de la línea
  const pesoTotal = (linea.peso || 0) * linea.cantidad

  // Calcular margen si hay precio de venta
  let precioVenta = linea.precioVenta || 0
  let margenPorcentaje = linea.margenPorcentaje || 0
  let margenImporte = linea.margenImporte || 0

  if (precioVenta > 0 && linea.precioUnitario > 0) {
    margenImporte = precioVenta - linea.precioUnitario
    margenPorcentaje = (margenImporte / linea.precioUnitario) * 100
  } else if (margenPorcentaje > 0 && linea.precioUnitario > 0) {
    margenImporte = linea.precioUnitario * (margenPorcentaje / 100)
    precioVenta = linea.precioUnitario + margenImporte
  }

  return {
    ...linea,
    subtotal,
    ivaImporte,
    total,
    pesoTotal: Math.round(pesoTotal * 1000) / 1000, // 3 decimales para peso
    precioVenta: Math.round(precioVenta * 100) / 100,
    margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
    margenImporte: Math.round(margenImporte * 100) / 100,
  }
}

// Funcion para crear linea vacia
const crearLineaVacia = (orden: number): LineaFormulario => ({
  orden,
  tipo: 'producto',
  nombre: '',
  cantidad: 1,
  precioUnitario: 0,
  descuento: 0,
  iva: 21,
  subtotal: 0,
  ivaImporte: 0,
  total: 0,
  precioVenta: 0,
  margenPorcentaje: 0,
  margenImporte: 0,
})

export function PresupuestoCompraForm({
  presupuesto,
  onSubmit,
  isEditing = false,
}: PresupuestoCompraFormProps) {
  const [activeTab, setActiveTab] = useState('proveedor')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Opciones cargadas
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [seriesDocumentos, setSeriesDocumentos] = useState<ISerieDocumento[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Referencias para inputs (navegación con teclado)
  const cantidadRefs = useRef<Map<number, HTMLInputElement>>(new Map())
  const productoRefs = useRef<Map<number, HTMLInputElement>>(new Map())

  // Estado para selector de variantes
  const [varianteSelectorOpen, setVarianteSelectorOpen] = useState(false)
  const [productoConVariantes, setProductoConVariantes] = useState<Producto | null>(null)
  const [lineaIndexParaVariante, setLineaIndexParaVariante] = useState<number | null>(null)

  // Estado del formulario
  const [formData, setFormData] = useState<CreatePresupuestoCompraDTO>({
    proveedorId: '',
    proveedorNombre: '',
    proveedorNif: '',
    estado: 'borrador',
    prioridad: 'media',
    fecha: new Date().toISOString().split('T')[0],
    fechaValidez: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lineas: [],
    descuentoGlobalPorcentaje: 0,
  })

  // Lineas del formulario
  const [lineas, setLineas] = useState<LineaFormulario[]>([crearLineaVacia(0)])

  // Totales calculados
  const [totales, setTotales] = useState({
    subtotalBruto: 0,
    totalDescuentos: 0,
    subtotalNeto: 0,
    totalIva: 0,
    totalPresupuesto: 0,
  })

  // Estado para dialogo de actualizar precios
  const [showUpdatePricesDialog, setShowUpdatePricesDialog] = useState(false)
  const [pendingSubmitData, setPendingSubmitData] = useState<CreatePresupuestoCompraDTO | null>(null)
  const [updatePrecioCompra, setUpdatePrecioCompra] = useState(true)
  const [updatePrecioVenta, setUpdatePrecioVenta] = useState(false)

  // Cargar opciones al montar
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true)
        const [proveedoresRes, productosRes] = await Promise.all([
          proveedoresService.getAll({ activo: true, limit: 100 }),
          productosService.getAll({ activo: true, limit: 100 }),
        ])

        if (proveedoresRes.success) setProveedores(proveedoresRes.data || [])
        if (productosRes.success) setProductos(productosRes.data || [])
        // Presupuestos de compra no usan series por ahora
        setSeriesDocumentos([])
      } catch (error) {
        console.error('Error cargando opciones:', error)
        toast.error('Error al cargar las opciones')
      } finally {
        setLoadingOptions(false)
      }
    }

    loadOptions()
  }, [])

  // Cargar datos iniciales si estamos editando
  useEffect(() => {
    if (presupuesto && isEditing) {
      setFormData({
        serie: presupuesto.serie,
        estado: presupuesto.estado,
        prioridad: presupuesto.prioridad,
        fecha: presupuesto.fecha?.split('T')[0],
        fechaSolicitud: presupuesto.fechaSolicitud?.split('T')[0],
        fechaRecepcion: presupuesto.fechaRecepcion?.split('T')[0],
        fechaValidez: presupuesto.fechaValidez?.split('T')[0],
        proveedorId: typeof presupuesto.proveedorId === 'object'
          ? (presupuesto.proveedorId as any)._id
          : presupuesto.proveedorId,
        proveedorNombre: presupuesto.proveedorNombre,
        proveedorNif: presupuesto.proveedorNif,
        proveedorEmail: presupuesto.proveedorEmail,
        proveedorTelefono: presupuesto.proveedorTelefono,
        referencia: presupuesto.referencia,
        referenciaProveedor: presupuesto.referenciaProveedor,
        titulo: presupuesto.titulo,
        descripcion: presupuesto.descripcion,
        descuentoGlobalPorcentaje: presupuesto.descuentoGlobalPorcentaje || 0,
        observaciones: presupuesto.observaciones,
        condicionesProveedor: presupuesto.condicionesProveedor,
        tags: presupuesto.tags,
      })

      // Cargar lineas
      if (presupuesto.lineas && presupuesto.lineas.length > 0) {
        const lineasFormulario: LineaFormulario[] = presupuesto.lineas.map((l, idx) => ({
          _id: l._id,
          orden: l.orden ?? idx,
          tipo: l.tipo as 'producto' | 'servicio' | 'texto' | 'kit',
          productoId: l.productoId,
          codigo: l.codigo,
          nombre: l.nombre,
          descripcion: l.descripcion,
          codigoProveedor: l.codigoProveedor,
          cantidad: l.cantidad,
          unidad: l.unidad,
          precioUnitario: l.precioUnitario,
          descuento: l.descuento,
          iva: l.iva,
          subtotal: l.subtotal,
          ivaImporte: l.ivaImporte,
          total: l.total,
          precioVenta: l.precioVenta || 0,
          margenPorcentaje: l.margenPorcentaje || 0,
          margenImporte: l.margenImporte || 0,
          // Cargar datos de kit y variante si existen
          componentesKit: l.componentesKit?.map(comp => ({
            productoId: comp.productoId,
            nombre: comp.nombre,
            sku: comp.sku,
            cantidad: comp.cantidad,
            precioUnitario: comp.precioUnitario,
            opcional: comp.opcional,
            seleccionado: comp.seleccionado,
          })),
          mostrarComponentes: l.mostrarComponentes ?? (l.componentesKit && l.componentesKit.length > 0),
          variante: l.variante ? {
            varianteId: l.variante.varianteId,
            sku: l.variante.sku,
            combinacion: l.variante.combinacion,
            costeAdicional: l.variante.costeAdicional,
          } : undefined,
        }))
        setLineas(lineasFormulario)
      }
    }
  }, [presupuesto, isEditing])

  // Recalcular totales cuando cambian las lineas
  useEffect(() => {
    const subtotalBruto = lineas.reduce((sum, l) => sum + (l.cantidad * l.precioUnitario), 0)
    const totalDescuentos = lineas.reduce((sum, l) => {
      const bruto = l.cantidad * l.precioUnitario
      return sum + (bruto * l.descuento / 100)
    }, 0)
    const subtotalNeto = subtotalBruto - totalDescuentos
    const totalIva = lineas.reduce((sum, l) => sum + l.ivaImporte, 0)
    const totalPresupuesto = subtotalNeto + totalIva

    setTotales({
      subtotalBruto,
      totalDescuentos,
      subtotalNeto,
      totalIva,
      totalPresupuesto,
    })
  }, [lineas])

  // Handler para cambio de proveedor
  const handleProveedorChange = (proveedorId: string) => {
    const proveedor = proveedores.find(p => p._id === proveedorId)
    if (proveedor) {
      setFormData(prev => ({
        ...prev,
        proveedorId: proveedor._id,
        proveedorNombre: proveedor.nombreComercial || proveedor.nombre,
        proveedorNif: proveedor.nif || '',
        proveedorEmail: proveedor.email,
        proveedorTelefono: proveedor.telefono,
      }))
    }
  }

  // Handler para cambio de producto en linea
  const handleProductoChange = (index: number, productoId: string) => {
    const producto = productos.find(p => p._id === productoId)
    if (producto) {
      // Si el producto tiene variantes activas, abrir el selector
      if (producto.tieneVariantes && producto.variantes && producto.variantes.length > 0) {
        const variantesActivas = producto.variantes.filter((v: Variante) => v.activo !== false)
        if (variantesActivas.length > 0) {
          setProductoConVariantes(producto)
          setLineaIndexParaVariante(index)
          setVarianteSelectorOpen(true)
          return
        }
      }

      // Producto sin variantes o sin variantes activas - proceder normalmente
      aplicarProductoALinea(index, producto)
    }
  }

  // Aplicar producto a línea (usado directamente o después de seleccionar variante)
  const aplicarProductoALinea = (
    index: number,
    producto: Producto,
    variante?: {
      varianteId: string
      sku: string
      combinacion: Record<string, string>
      precioUnitario: number
      costeUnitario: number
    }
  ) => {
    // Determinar si es un kit (tipo compuesto o tiene componentes)
    const esKit = producto.tipo === 'compuesto' || (producto.componentesKit && producto.componentesKit.length > 0)

    // Construir los componentes del kit si aplica
    let componentesKit: IComponenteKitPresupuesto[] | undefined
    if (esKit && producto.componentesKit) {
      componentesKit = producto.componentesKit.map(comp => {
        const productoComp = productos.find(p => p._id === comp.productoId)
        return {
          productoId: comp.productoId,
          nombre: productoComp?.nombre || comp.producto?.nombre || '',
          sku: productoComp?.sku || comp.producto?.sku || '',
          cantidad: comp.cantidad,
          precioUnitario: productoComp?.precios?.compra || 0,
          opcional: comp.opcional || false,
          seleccionado: !comp.opcional,
        }
      })
    }

    // Construir nombre con info de variante
    let nombreFinal = producto.nombre
    if (variante) {
      const combinacionStr = Object.entries(variante.combinacion)
        .map(([, v]) => v)
        .join(' / ')
      nombreFinal = `${producto.nombre} - ${combinacionStr}`
    }

    const precioCompra = variante?.costeUnitario ?? producto.precios?.compra ?? 0
    const precioVenta = variante?.precioUnitario ?? producto.precios?.pvp ?? producto.precios?.venta ?? 0

    const nuevaLinea = calcularLinea({
      ...lineas[index],
      productoId: producto._id,
      codigo: variante?.sku || producto.sku,
      nombre: nombreFinal,
      descripcion: producto.descripcionCorta,
      precioUnitario: precioCompra,
      precioVenta: precioVenta,
      margenPorcentaje: 0,
      margenImporte: 0,
      iva: producto.iva || 21,
      // Peso del producto
      peso: producto.peso || 0,
      tipo: esKit ? 'kit' : 'producto',
      componentesKit,
      mostrarComponentes: true,
      variante: variante ? {
        varianteId: variante.varianteId,
        sku: variante.sku,
        combinacion: variante.combinacion,
        costeAdicional: variante.costeUnitario - (producto.precios?.compra || 0),
      } : undefined,
    })
    const nuevasLineas = [...lineas]
    nuevasLineas[index] = nuevaLinea
    setLineas(nuevasLineas)

    // Enfocar cantidad
    setTimeout(() => {
      const cantidadRef = cantidadRefs.current.get(index)
      if (cantidadRef) {
        cantidadRef.focus()
        cantidadRef.select()
      }
    }, 50)
  }

  // Handler para cuando se selecciona una variante
  const handleVarianteSelect = (varianteInfo: VarianteSeleccion) => {
    if (productoConVariantes && lineaIndexParaVariante !== null) {
      aplicarProductoALinea(lineaIndexParaVariante, productoConVariantes, {
        ...varianteInfo,
      })
      if (varianteInfo.cantidad && varianteInfo.cantidad !== 1) {
        handleLineaChange(lineaIndexParaVariante, 'cantidad', varianteInfo.cantidad)
      }
    }
    setVarianteSelectorOpen(false)
    setProductoConVariantes(null)
    setLineaIndexParaVariante(null)
  }

  // Handler para cuando se seleccionan múltiples variantes
  const handleVariantesMultipleSelect = (variantes: VarianteSeleccion[]) => {
    if (!productoConVariantes || lineaIndexParaVariante === null) return

    // Para la primera variante, usar la línea existente
    const primeraVariante = variantes[0]
    aplicarProductoALinea(lineaIndexParaVariante, productoConVariantes, {
      ...primeraVariante,
    })
    if (primeraVariante.cantidad && primeraVariante.cantidad !== 1) {
      handleLineaChange(lineaIndexParaVariante, 'cantidad', primeraVariante.cantidad)
    }

    // Para el resto de variantes, crear nuevas líneas
    if (variantes.length > 1) {
      const nuevasLineas = variantes.slice(1).map((variante, idx) => {
        const combinacionStr = Object.values(variante.combinacion).join(' / ')
        const precioCompra = variante.costeUnitario
        const precioVenta = variante.precioUnitario

        const linea: LineaFormulario = {
          orden: lineas.length + idx,
          tipo: 'producto',
          productoId: productoConVariantes._id,
          codigo: variante.sku,
          nombre: `${productoConVariantes.nombre} - ${combinacionStr}`,
          descripcion: productoConVariantes.descripcionCorta,
          cantidad: variante.cantidad || 1,
          precioUnitario: precioCompra,
          precioVenta: precioVenta,
          descuento: 0,
          iva: productoConVariantes.iva || 21,
          subtotal: 0,
          ivaImporte: 0,
          total: 0,
          margenPorcentaje: 0,
          margenImporte: 0,
          variante: {
            varianteId: variante.varianteId,
            sku: variante.sku,
            combinacion: variante.combinacion,
            costeAdicional: variante.costeUnitario - (productoConVariantes.precios?.compra || 0),
          },
        }
        return calcularLinea(linea)
      })

      setLineas(prev => [...prev, ...nuevasLineas])
    }

    setVarianteSelectorOpen(false)
    setProductoConVariantes(null)
    setLineaIndexParaVariante(null)
  }

  // Handler para usar producto base sin variante
  const handleUseBaseProduct = () => {
    if (productoConVariantes && lineaIndexParaVariante !== null) {
      aplicarProductoALinea(lineaIndexParaVariante, productoConVariantes)
    }
    setVarianteSelectorOpen(false)
    setProductoConVariantes(null)
    setLineaIndexParaVariante(null)
  }

  // Handler para toggle de mostrar/ocultar componentes del kit
  const handleToggleComponentesKit = (index: number) => {
    const nuevasLineas = [...lineas]
    nuevasLineas[index] = {
      ...nuevasLineas[index],
      mostrarComponentes: !nuevasLineas[index].mostrarComponentes,
    }
    setLineas(nuevasLineas)
  }

  // Handler para cambio de campo en linea
  const handleLineaChange = (index: number, field: keyof LineaFormulario, value: any) => {
    const nuevasLineas = [...lineas]
    nuevasLineas[index] = {
      ...nuevasLineas[index],
      [field]: value,
    }

    // Si cambia el PVP, resetear margen para que se recalcule
    if (field === 'precioVenta') {
      nuevasLineas[index].margenPorcentaje = 0
      nuevasLineas[index].margenImporte = 0
    }
    // Si cambia el margen %, resetear PVP para que se recalcule
    if (field === 'margenPorcentaje') {
      nuevasLineas[index].precioVenta = 0
    }

    // Recalcular si es un campo que afecta al total o margen
    if (['cantidad', 'precioUnitario', 'descuento', 'iva', 'precioVenta', 'margenPorcentaje'].includes(field)) {
      nuevasLineas[index] = calcularLinea(nuevasLineas[index])
    }
    setLineas(nuevasLineas)
  }

  // Agregar linea
  const handleAddLinea = useCallback(() => {
    const newIndex = lineas.length
    setLineas([...lineas, crearLineaVacia(newIndex)])

    // Enfocar el selector de producto de la nueva línea
    setTimeout(() => {
      const productoRef = productoRefs.current.get(newIndex)
      if (productoRef) {
        productoRef.focus()
      }
    }, 100)
  }, [lineas])

  // Handler de teclado genérico para cualquier campo de línea
  // Ctrl+Enter siempre añade nueva línea
  const handleLineaKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleAddLinea()
    }
  }, [handleAddLinea])

  // Handler de teclado para cantidad
  const handleCantidadKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      // Ctrl+Enter siempre añade nueva línea
      e.preventDefault()
      handleAddLinea()
    } else if (e.key === 'Enter' && !e.ctrlKey) {
      // Enter solo añade línea si estamos en el último registro
      if (index === lineas.length - 1) {
        e.preventDefault()
        handleAddLinea()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextInput = cantidadRefs.current.get(index + 1)
      if (nextInput) {
        nextInput.focus()
        nextInput.select()
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevInput = cantidadRefs.current.get(index - 1)
      if (prevInput) {
        prevInput.focus()
        prevInput.select()
      }
    }
  }, [handleAddLinea, lineas.length])

  // Eliminar linea
  const handleRemoveLinea = (index: number) => {
    if (lineas.length > 1) {
      const nuevasLineas = lineas.filter((_, i) => i !== index)
      setLineas(nuevasLineas.map((l, i) => ({ ...l, orden: i })))
    }
  }

  // Mover linea arriba/abajo
  const handleMoveLinea = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= lineas.length) return

    const nuevasLineas = [...lineas]
    const temp = nuevasLineas[index]
    nuevasLineas[index] = nuevasLineas[newIndex]
    nuevasLineas[newIndex] = temp

    setLineas(nuevasLineas.map((l, i) => ({ ...l, orden: i })))
  }

  // Preparar datos para enviar
  const prepareSubmitData = (): CreatePresupuestoCompraDTO => {
    return {
      ...formData,
      lineas: lineas.filter(l => l.nombre).map(l => ({
        orden: l.orden,
        tipo: l.tipo,
        productoId: l.productoId,
        codigo: l.codigo,
        nombre: l.nombre,
        descripcion: l.descripcion,
        codigoProveedor: l.codigoProveedor,
        cantidad: l.cantidad,
        unidad: l.unidad,
        precioUnitario: l.precioUnitario,
        descuento: l.descuento,
        iva: l.iva,
        precioVenta: l.precioVenta,
        margenPorcentaje: l.margenPorcentaje,
        margenImporte: l.margenImporte,
        // Incluir datos de kit y variante
        componentesKit: l.componentesKit,
        variante: l.variante,
      })),
      totales: {
        subtotalBruto: totales.subtotalBruto,
        totalDescuentos: totales.totalDescuentos,
        subtotalNeto: totales.subtotalNeto,
        desgloseIva: [],
        totalIva: totales.totalIva,
        totalPresupuesto: totales.totalPresupuesto,
      },
    }
  }

  // Lineas con productos (para actualizar precios)
  const lineasConProducto = lineas.filter(l => l.productoId && l.nombre)

  // Submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.proveedorId) {
      toast.error('Selecciona un proveedor')
      setActiveTab('proveedor')
      return
    }

    if (lineas.length === 0 || lineas.every(l => !l.nombre)) {
      toast.error('Agrega al menos una linea')
      setActiveTab('lineas')
      return
    }

    const data = prepareSubmitData()

    // Si hay lineas con productos, preguntar si actualizar precios
    if (lineasConProducto.length > 0) {
      setPendingSubmitData(data)
      setShowUpdatePricesDialog(true)
      return
    }

    // Si no hay productos, guardar directamente
    await doSubmit(data, false, false)
  }

  // Ejecutar el submit (con o sin actualizacion de precios)
  const doSubmit = async (
    data: CreatePresupuestoCompraDTO,
    actualizarPrecioCompra: boolean,
    actualizarPrecioVenta: boolean
  ) => {
    setIsSubmitting(true)

    try {
      // Si se quieren actualizar precios, agregar la opcion al data
      const dataConOpciones = {
        ...data,
        actualizarPrecios: {
          precioCompra: actualizarPrecioCompra,
          precioVenta: actualizarPrecioVenta,
        },
      }

      await onSubmit(dataConOpciones as CreatePresupuestoCompraDTO)
    } catch (error) {
      console.error('Error al guardar:', error)
    } finally {
      setIsSubmitting(false)
      setShowUpdatePricesDialog(false)
      setPendingSubmitData(null)
    }
  }

  // Confirmar actualizacion de precios
  const handleConfirmUpdatePrices = () => {
    if (pendingSubmitData) {
      doSubmit(pendingSubmitData, updatePrecioCompra, updatePrecioVenta)
    }
  }

  // Cancelar y guardar sin actualizar precios
  const handleSkipUpdatePrices = () => {
    if (pendingSubmitData) {
      doSubmit(pendingSubmitData, false, false)
    }
  }

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0)
  }

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="proveedor" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Proveedor</span>
          </TabsTrigger>
          <TabsTrigger value="lineas" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Lineas</span>
          </TabsTrigger>
          <TabsTrigger value="condiciones" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Condiciones</span>
          </TabsTrigger>
          <TabsTrigger value="resumen" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Proveedor */}
        <TabsContent value="proveedor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos del Proveedor</CardTitle>
              <CardDescription>Selecciona el proveedor al que solicitar el presupuesto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proveedor *</Label>
                  <SearchableSelect
                    options={proveedores.map(p => ({
                      value: p._id,
                      label: p.nombreComercial || p.nombre,
                      subtitle: p.nif,
                    }))}
                    value={formData.proveedorId}
                    onValueChange={handleProveedorChange}
                    placeholder="Buscar proveedor..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>NIF</Label>
                  <Input
                    value={formData.proveedorNif || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, proveedorNif: e.target.value }))}
                    placeholder="NIF del proveedor"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.proveedorEmail || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, proveedorEmail: e.target.value }))}
                    placeholder="Email del proveedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input
                    value={formData.proveedorTelefono || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, proveedorTelefono: e.target.value }))}
                    placeholder="Telefono del proveedor"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos del Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Titulo</Label>
                  <Input
                    value={formData.titulo || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Titulo descriptivo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value as EstadoPresupuestoCompra }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_PRESUPUESTO_COMPRA.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={formData.prioridad}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, prioridad: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <DateInput
                    value={formData.fecha || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, fecha: value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Validez</Label>
                  <DateInput
                    value={formData.fechaValidez || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, fechaValidez: value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Referencia Proveedor</Label>
                  <Input
                    value={formData.referenciaProveedor || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, referenciaProveedor: e.target.value }))}
                    placeholder="Referencia del proveedor"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Lineas */}
        <TabsContent value="lineas" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lineas del Presupuesto</CardTitle>
                <CardDescription>{lineas.length} lineas</CardDescription>
              </div>
              <Button type="button" onClick={handleAddLinea} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Linea
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-2 py-2 text-left w-8">#</th>
                      <th className="px-2 py-2 text-left min-w-[200px]">Producto</th>
                      <th className="px-2 py-2 text-right w-20">Cant.</th>
                      <th className="px-2 py-2 text-right w-24">P.Compra</th>
                      <th className="px-2 py-2 text-right w-16">Dto%</th>
                      <th className="px-2 py-2 text-right w-24">PVP</th>
                      <th className="px-2 py-2 text-right w-16">Margen%</th>
                      <th className="px-2 py-2 text-right w-16">IVA%</th>
                      <th className="px-2 py-2 text-right w-24">Subtotal</th>
                      <th className="px-2 py-2 text-center w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((linea, index) => (
                      <tr key={index} className="border-b hover:bg-muted/30">
                        <td className="px-2 py-2 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {linea.tipo === 'kit' && linea.componentesKit && linea.componentesKit.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleToggleComponentesKit(index)}
                                className="p-0.5 hover:bg-muted rounded"
                              >
                                {linea.mostrarComponentes ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                            )}
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="space-y-1">
                            <TooltipProvider>
                              <Tooltip delayDuration={500}>
                                <TooltipTrigger asChild>
                                  <div className="w-full">
                                    <EditableSearchableSelect
                                      options={productos.map(p => ({
                                        value: p._id,
                                        label: p.nombre,
                                        description: p.sku,
                                      }))}
                                      value={linea.productoId || ''}
                                      onValueChange={(value) => handleProductoChange(index, value)}
                                      placeholder="Buscar producto..."
                                      displayValue={linea.nombre || ''}
                                      onDisplayValueChange={(value) => handleLineaChange(index, 'nombre', value)}
                                      onCtrlEnterPress={handleAddLinea}
                                      inputRef={(el) => {
                                        if (el) productoRefs.current.set(index, el)
                                        else productoRefs.current.delete(index)
                                      }}
                                    />
                                  </div>
                                </TooltipTrigger>
                                {linea.nombre && linea.nombre.length > 30 && (
                                  <TooltipContent side="top" className="max-w-md">
                                    <p className="text-sm font-medium">{linea.nombre}</p>
                                    {linea.codigo && <p className="text-xs text-muted-foreground">Ref: {linea.codigo}</p>}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                            {/* Indicador de kit */}
                            {linea.tipo === 'kit' && linea.componentesKit && linea.componentesKit.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Layers className="h-3 w-3 mr-1" />
                                Kit
                              </Badge>
                            )}
                            {/* Indicador de variante */}
                            {linea.variante && (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(linea.variante.combinacion).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="text-xs">
                                    {value}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {/* Componentes del kit expandidos */}
                            {linea.tipo === 'kit' && linea.mostrarComponentes && linea.componentesKit && linea.componentesKit.length > 0 && (
                              <div className="ml-2 mt-2 space-y-1 border-l-2 border-primary/20 pl-3">
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  Componentes del kit ({linea.componentesKit.length}):
                                </div>
                                {linea.componentesKit.map((comp, compIdx) => (
                                  <div
                                    key={compIdx}
                                    className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${
                                      comp.opcional ? 'bg-amber-50 border border-amber-200' : 'bg-muted/50'
                                    }`}
                                  >
                                    <span className="font-medium">{comp.cantidad}x</span>
                                    <span className="flex-1">{comp.nombre}</span>
                                    {comp.sku && (
                                      <span className="text-muted-foreground">({comp.sku})</span>
                                    )}
                                    {comp.opcional && (
                                      <Badge variant="outline" className="text-xs">Opcional</Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            ref={(el) => {
                              if (el) cantidadRefs.current.set(index, el)
                            }}
                            type="number"
                            min="0"
                            step="1"
                            value={linea.cantidad}
                            onChange={(e) => handleLineaChange(index, 'cantidad', parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => handleCantidadKeyDown(e, index)}
                            className="w-20 text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={linea.precioUnitario}
                            onChange={(e) => handleLineaChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                            className="w-24 text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={linea.descuento}
                            onChange={(e) => handleLineaChange(index, 'descuento', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={linea.precioVenta}
                            onChange={(e) => handleLineaChange(index, 'precioVenta', parseFloat(e.target.value) || 0)}
                            className="w-24 text-right"
                            placeholder="PVP"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={linea.margenPorcentaje}
                            onChange={(e) => handleLineaChange(index, 'margenPorcentaje', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right"
                            placeholder="%"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Select
                            value={linea.iva.toString()}
                            onValueChange={(value) => handleLineaChange(index, 'iva', parseFloat(value))}
                          >
                            <SelectTrigger className="w-16">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="4">4%</SelectItem>
                              <SelectItem value="10">10%</SelectItem>
                              <SelectItem value="21">21%</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-2 text-right font-medium">
                          {formatCurrency(linea.subtotal)}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMoveLinea(index, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMoveLinea(index, 'down')}
                              disabled={index === lineas.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleRemoveLinea(index)}
                              disabled={lineas.length === 1}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Condiciones */}
        <TabsContent value="condiciones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Observaciones internas</Label>
                <Textarea
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Notas internas sobre este presupuesto..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Condiciones del proveedor</Label>
                <Textarea
                  value={formData.condicionesProveedor || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, condicionesProveedor: e.target.value }))}
                  placeholder="Condiciones indicadas por el proveedor..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Descripcion</Label>
                <Textarea
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripcion general del presupuesto..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etiquetas</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                }))}
                placeholder="Etiquetas separadas por coma..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Resumen */}
        <TabsContent value="resumen" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Presupuesto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Proveedor:</span>
                  <span className="font-medium">{formData.proveedorNombre || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Titulo:</span>
                  <span className="font-medium">{formData.titulo || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge className={ESTADOS_PRESUPUESTO_COMPRA.find(e => e.value === formData.estado)?.color}>
                    {ESTADOS_PRESUPUESTO_COMPRA.find(e => e.value === formData.estado)?.label}
                  </Badge>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Lineas:</span>
                  <span className="font-medium">{lineas.filter(l => l.nombre).length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Totales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Subtotal Bruto:</span>
                  <span className="font-medium">{formatCurrency(totales.subtotalBruto)}</span>
                </div>
                {totales.totalDescuentos > 0 && (
                  <div className="flex justify-between py-2 border-b text-green-600">
                    <span>Descuentos:</span>
                    <span>-{formatCurrency(totales.totalDescuentos)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Base Imponible:</span>
                  <span className="font-medium">{formatCurrency(totales.subtotalNeto)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">IVA:</span>
                  <span className="font-medium">{formatCurrency(totales.totalIva)}</span>
                </div>
                <div className="flex justify-between py-3 text-lg font-bold">
                  <span>TOTAL:</span>
                  <span className="text-primary">{formatCurrency(totales.totalPresupuesto)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botones de accion */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Actualizar' : 'Crear'} Presupuesto
            </>
          )}
        </Button>
      </div>

      {/* Selector de variantes */}
      <VarianteSelector
        open={varianteSelectorOpen}
        onOpenChange={setVarianteSelectorOpen}
        producto={productoConVariantes}
        onSelect={handleVarianteSelect}
        onSelectMultiple={handleVariantesMultipleSelect}
        onSelectBase={handleUseBaseProduct}
        multiSelect={true}
      />

      {/* Dialogo para actualizar precios de productos */}
      <Dialog open={showUpdatePricesDialog} onOpenChange={setShowUpdatePricesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Actualizar precios de productos
            </DialogTitle>
            <DialogDescription>
              Este documento contiene {lineasConProducto.length} producto(s). ¿Deseas actualizar los precios
              en el catálogo de productos?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Opciones de actualización */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30">
                <Checkbox
                  id="updatePrecioCompra"
                  checked={updatePrecioCompra}
                  onCheckedChange={(checked) => setUpdatePrecioCompra(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="updatePrecioCompra"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Actualizar precio de compra
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Se actualizará el coste/precio de compra de los productos
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30">
                <Checkbox
                  id="updatePrecioVenta"
                  checked={updatePrecioVenta}
                  onCheckedChange={(checked) => setUpdatePrecioVenta(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="updatePrecioVenta"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Actualizar PVP
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Se actualizará el precio de venta al público de los productos
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de productos afectados */}
            {lineasConProducto.length > 0 && (updatePrecioCompra || updatePrecioVenta) && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Productos a actualizar:</p>
                <div className="max-h-32 overflow-y-auto rounded-lg border p-2 space-y-1">
                  {lineasConProducto.slice(0, 5).map((linea, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b last:border-0">
                      <span className="truncate flex-1">{linea.nombre}</span>
                      <div className="flex gap-2 ml-2">
                        {updatePrecioCompra && (
                          <span className="text-muted-foreground">
                            Compra: {formatCurrency(linea.precioUnitario)}
                          </span>
                        )}
                        {updatePrecioVenta && linea.precioVenta > 0 && (
                          <span className="text-muted-foreground">
                            PVP: {formatCurrency(linea.precioVenta)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {lineasConProducto.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      ... y {lineasConProducto.length - 5} producto(s) más
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Aviso si no hay opción seleccionada */}
            {!updatePrecioCompra && !updatePrecioVenta && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">No se actualizará ningún precio en el catálogo</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkipUpdatePrices}
              disabled={isSubmitting}
            >
              Guardar sin actualizar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmUpdatePrices}
              disabled={isSubmitting || (!updatePrecioCompra && !updatePrecioVenta)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Guardar y actualizar precios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
