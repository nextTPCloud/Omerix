'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  PedidoCompra,
  CreatePedidoCompraDTO,
  UpdatePedidoCompraDTO,
  ESTADOS_PEDIDO_COMPRA,
  PRIORIDADES,
  EstadoPedidoCompra,
  LineaPedidoCompra,
  IComponenteKitCompra,
  IVarianteSeleccionada,
} from '@/types/pedido-compra.types'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Loader2,
  Save,
  Building2,
  ShoppingCart,
  Calculator,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Truck,
  Copy,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Layers,
  AlignLeft,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
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

// Types
import { Proveedor } from '@/types/proveedor.types'
import { Producto, Variante } from '@/types/producto.types'
import { toast } from 'sonner'

interface PedidoCompraFormProps {
  pedido?: PedidoCompra
  onSubmit: (data: CreatePedidoCompraDTO | UpdatePedidoCompraDTO) => Promise<void>
  isEditing?: boolean
}

// Tipo de linea local
interface LineaFormulario {
  _id?: string
  orden: number
  tipo: 'producto' | 'servicio' | 'kit' | 'texto'
  productoId?: string
  codigo?: string
  nombre: string
  descripcion?: string
  descripcionLarga?: string
  codigoProveedor?: string
  variante?: IVarianteSeleccionada
  componentesKit?: IComponenteKitCompra[]
  mostrarComponentes?: boolean
  cantidad: number
  cantidadRecibida: number
  unidad?: string
  peso?: number
  pesoTotal?: number
  precioUnitario: number
  costeUnitario?: number
  descuento: number
  iva: number
  subtotal: number
  ivaImporte: number
  total: number
  fechaEntregaPrevista?: string
  // Campos para actualización de precios
  precioVenta?: number
  margenPorcentaje?: number
  margenImporte?: number
}

const calcularLinea = (linea: LineaFormulario): LineaFormulario => {
  const subtotalBruto = linea.cantidad * linea.precioUnitario
  const descuentoImporte = subtotalBruto * (linea.descuento / 100)
  const subtotal = subtotalBruto - descuentoImporte
  const ivaImporte = subtotal * (linea.iva / 100)
  const total = subtotal + ivaImporte

  // Calcular peso total de la línea
  const pesoTotal = (linea.peso || 0) * linea.cantidad

  return { ...linea, subtotal, ivaImporte, total, pesoTotal: Math.round(pesoTotal * 1000) / 1000 }
}

const crearLineaVacia = (orden: number): LineaFormulario => ({
  orden,
  tipo: 'producto',
  nombre: '',
  cantidad: 1,
  cantidadRecibida: 0,
  precioUnitario: 0,
  descuento: 0,
  iva: 21,
  subtotal: 0,
  ivaImporte: 0,
  total: 0,
})

export function PedidoCompraForm({
  pedido,
  onSubmit,
  isEditing = false,
}: PedidoCompraFormProps) {
  const [activeTab, setActiveTab] = useState('proveedor')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Referencias para inputs (navegación con teclado)
  const cantidadRefs = useRef<Map<number, HTMLInputElement>>(new Map())
  const productoRefs = useRef<Map<number, HTMLInputElement>>(new Map())

  // Estado para selector de variantes
  const [varianteSelectorOpen, setVarianteSelectorOpen] = useState(false)
  const [productoConVariantes, setProductoConVariantes] = useState<Producto | null>(null)
  const [lineaIndexParaVariante, setLineaIndexParaVariante] = useState<number | null>(null)

  // Diálogo para editar descripción
  const [showDescripcionDialog, setShowDescripcionDialog] = useState(false)
  const [descripcionEditIndex, setDescripcionEditIndex] = useState<number | null>(null)
  const [descripcionEdit, setDescripcionEdit] = useState({ corta: '', larga: '' })

  // Estado para dialogo de actualizar precios
  const [showUpdatePricesDialog, setShowUpdatePricesDialog] = useState(false)
  const [pendingSubmitData, setPendingSubmitData] = useState<CreatePedidoCompraDTO | null>(null)
  const [updatePrecioCompra, setUpdatePrecioCompra] = useState(true)
  const [updatePrecioVenta, setUpdatePrecioVenta] = useState(false)

  const [formData, setFormData] = useState<CreatePedidoCompraDTO>({
    proveedorId: '',
    proveedorNombre: '',
    proveedorNif: '',
    estado: 'borrador',
    prioridad: 'media',
    fecha: new Date().toISOString().split('T')[0],
    lineas: [],
    descuentoGlobalPorcentaje: 0,
  })

  const [lineas, setLineas] = useState<LineaFormulario[]>([crearLineaVacia(0)])

  const [totales, setTotales] = useState({
    subtotalBruto: 0,
    totalDescuentos: 0,
    subtotalNeto: 0,
    totalIva: 0,
    totalPedido: 0,
  })

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
      } catch (error) {
        console.error('Error cargando opciones:', error)
        toast.error('Error al cargar las opciones')
      } finally {
        setLoadingOptions(false)
      }
    }

    loadOptions()
  }, [])

  useEffect(() => {
    if (pedido && isEditing) {
      setFormData({
        serie: pedido.serie,
        estado: pedido.estado,
        prioridad: pedido.prioridad,
        fecha: pedido.fecha?.split('T')[0],
        fechaEnvio: pedido.fechaEnvio?.split('T')[0],
        fechaConfirmacion: pedido.fechaConfirmacion?.split('T')[0],
        fechaEntregaPrevista: pedido.fechaEntregaPrevista?.split('T')[0],
        proveedorId: typeof pedido.proveedorId === 'object'
          ? (pedido.proveedorId as any)._id
          : pedido.proveedorId,
        proveedorNombre: pedido.proveedorNombre,
        proveedorNif: pedido.proveedorNif,
        proveedorEmail: pedido.proveedorEmail,
        proveedorTelefono: pedido.proveedorTelefono,
        referenciaProveedor: pedido.referenciaProveedor,
        titulo: pedido.titulo,
        descripcion: pedido.descripcion,
        descuentoGlobalPorcentaje: pedido.descuentoGlobalPorcentaje || 0,
        observaciones: pedido.observaciones,
        tags: pedido.tags,
      })

      if (pedido.lineas && pedido.lineas.length > 0) {
        const lineasFormulario: LineaFormulario[] = pedido.lineas.map((l, idx) => ({
          _id: l._id,
          orden: l.orden ?? idx,
          tipo: l.tipo as 'producto' | 'servicio' | 'kit' | 'texto',
          productoId: l.productoId,
          codigo: l.codigo,
          nombre: l.nombre,
          descripcion: l.descripcion,
          descripcionLarga: l.descripcionLarga,
          codigoProveedor: l.codigoProveedor,
          variante: l.variante,
          componentesKit: l.componentesKit,
          mostrarComponentes: l.mostrarComponentes ?? true,
          cantidad: l.cantidad,
          cantidadRecibida: l.cantidadRecibida || 0,
          unidad: l.unidad,
          precioUnitario: l.precioUnitario,
          costeUnitario: l.costeUnitario,
          descuento: l.descuento,
          iva: l.iva,
          subtotal: l.subtotal,
          ivaImporte: l.ivaImporte,
          total: l.total,
          fechaEntregaPrevista: l.fechaEntregaPrevista?.split('T')[0],
        }))
        setLineas(lineasFormulario)
      }
    }
  }, [pedido, isEditing])

  useEffect(() => {
    const subtotalBruto = lineas.reduce((sum, l) => sum + (l.cantidad * l.precioUnitario), 0)
    const totalDescuentos = lineas.reduce((sum, l) => {
      const bruto = l.cantidad * l.precioUnitario
      return sum + (bruto * l.descuento / 100)
    }, 0)
    const subtotalNeto = subtotalBruto - totalDescuentos
    const totalIva = lineas.reduce((sum, l) => sum + l.ivaImporte, 0)
    const totalPedido = subtotalNeto + totalIva

    setTotales({ subtotalBruto, totalDescuentos, subtotalNeto, totalIva, totalPedido })
  }, [lineas])

  // Atajo global Ctrl+Enter para añadir línea
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (activeTab === 'lineas' && e.ctrlKey && (e.key === 'Enter' || e.key === 'n')) {
        e.preventDefault()
        handleAddLinea()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [activeTab, lineas])

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
    let componentesKit: IComponenteKitCompra[] | undefined
    if (esKit && producto.componentesKit) {
      componentesKit = producto.componentesKit.map(comp => ({
        productoId: comp.productoId,
        nombre: comp.producto?.nombre || '',
        sku: comp.producto?.sku || '',
        cantidad: comp.cantidad,
        precioUnitario: 0,
        costeUnitario: 0,
        descuento: 0,
        iva: producto.iva || 21,
        subtotal: 0,
        opcional: comp.opcional || false,
        seleccionado: !comp.opcional,
      }))
    }

    // Construir nombre con info de variante
    let nombreFinal = producto.nombre
    if (variante) {
      const combinacionStr = Object.entries(variante.combinacion)
        .map(([, v]) => v)
        .join(' / ')
      nombreFinal = `${producto.nombre} - ${combinacionStr}`
    }

    const nuevaLinea = calcularLinea({
      ...lineas[index],
      productoId: producto._id,
      codigo: variante?.sku || producto.sku,
      nombre: nombreFinal,
      descripcion: producto.descripcionCorta,
      descripcionLarga: producto.descripcion,
      precioUnitario: variante?.costeUnitario ?? producto.precios?.compra ?? producto.precios?.venta ?? 0,
      costeUnitario: variante?.costeUnitario ?? producto.precios?.compra ?? 0,
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
        const linea: LineaFormulario = {
          orden: lineas.length + idx,
          tipo: 'producto',
          productoId: productoConVariantes._id,
          codigo: variante.sku,
          nombre: `${productoConVariantes.nombre} - ${combinacionStr}`,
          descripcion: productoConVariantes.descripcionCorta,
          cantidad: variante.cantidad || 1,
          cantidadRecibida: 0,
          precioUnitario: variante.costeUnitario,
          costeUnitario: variante.costeUnitario,
          descuento: 0,
          iva: productoConVariantes.iva || 21,
          subtotal: 0,
          ivaImporte: 0,
          total: 0,
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

  // Handler para toggle de componente opcional del kit
  const handleToggleComponenteKit = (lineaIndex: number, componenteIndex: number) => {
    const nuevasLineas = [...lineas]
    const linea = nuevasLineas[lineaIndex]
    if (linea.componentesKit) {
      linea.componentesKit[componenteIndex].seleccionado = !linea.componentesKit[componenteIndex].seleccionado
      setLineas(nuevasLineas)
    }
  }

  const handleLineaChange = (index: number, field: keyof LineaFormulario, value: any) => {
    const nuevasLineas = [...lineas]
    nuevasLineas[index] = { ...nuevasLineas[index], [field]: value }
    if (['cantidad', 'precioUnitario', 'descuento', 'iva'].includes(field)) {
      nuevasLineas[index] = calcularLinea(nuevasLineas[index])
    }
    setLineas(nuevasLineas)
  }

  const handleAddLinea = useCallback(() => {
    const newIndex = lineas.length
    setLineas(prev => [...prev, crearLineaVacia(newIndex)])

    // Enfocar el selector de producto de la nueva línea
    setTimeout(() => {
      const productoRef = productoRefs.current.get(newIndex)
      if (productoRef) {
        productoRef.focus()
      }
    }, 100)
  }, [lineas.length])

  const handleRemoveLinea = (index: number) => {
    if (lineas.length > 1) {
      const nuevasLineas = lineas.filter((_, i) => i !== index)
      setLineas(nuevasLineas.map((l, i) => ({ ...l, orden: i })))
    }
  }

  const handleDuplicateLinea = (index: number) => {
    const lineaDuplicada = {
      ...lineas[index],
      _id: undefined,
      orden: lineas.length,
    }
    setLineas([...lineas, calcularLinea(lineaDuplicada)])
  }

  const handleMoveLinea = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= lineas.length) return

    const nuevasLineas = [...lineas]
    const temp = nuevasLineas[index]
    nuevasLineas[index] = nuevasLineas[newIndex]
    nuevasLineas[newIndex] = temp

    setLineas(nuevasLineas.map((l, i) => ({ ...l, orden: i })))
  }

  const handleEditDescripcion = (index: number) => {
    const linea = lineas[index]
    setDescripcionEditIndex(index)
    setDescripcionEdit({
      corta: linea.descripcion || '',
      larga: linea.descripcionLarga || '',
    })
    setShowDescripcionDialog(true)
  }

  const handleSaveDescripcion = () => {
    if (descripcionEditIndex !== null) {
      const nuevasLineas = [...lineas]
      nuevasLineas[descripcionEditIndex] = {
        ...nuevasLineas[descripcionEditIndex],
        descripcion: descripcionEdit.corta,
        descripcionLarga: descripcionEdit.larga,
      }
      setLineas(nuevasLineas)
    }
    setShowDescripcionDialog(false)
    setDescripcionEditIndex(null)
    setDescripcionEdit({ corta: '', larga: '' })
  }

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

  // Lineas con productos (para actualizar precios)
  const lineasConProducto = lineas.filter(l => l.productoId && l.nombre)

  // Preparar datos para enviar
  const prepareSubmitData = (): CreatePedidoCompraDTO => {
    return {
      ...formData,
      lineas: lineas.filter(l => l.nombre).map(l => ({
        orden: l.orden,
        tipo: l.tipo,
        productoId: l.productoId,
        codigo: l.codigo,
        nombre: l.nombre,
        descripcion: l.descripcion,
        descripcionLarga: l.descripcionLarga,
        codigoProveedor: l.codigoProveedor,
        variante: l.variante,
        componentesKit: l.componentesKit,
        mostrarComponentes: l.mostrarComponentes,
        cantidad: l.cantidad,
        cantidadRecibida: l.cantidadRecibida,
        unidad: l.unidad,
        precioUnitario: l.precioUnitario,
        costeUnitario: l.costeUnitario,
        descuento: l.descuento,
        iva: l.iva,
        fechaEntregaPrevista: l.fechaEntregaPrevista,
        precioVenta: l.precioVenta,
      })),
      totales: {
        subtotalBruto: totales.subtotalBruto,
        totalDescuentos: totales.totalDescuentos,
        subtotalNeto: totales.subtotalNeto,
        desgloseIva: [],
        totalIva: totales.totalIva,
        totalPedido: totales.totalPedido,
      },
    }
  }

  // Ejecutar el submit (con o sin actualización de precios)
  const doSubmit = async (
    data: CreatePedidoCompraDTO,
    actualizarPrecioCompra: boolean,
    actualizarPrecioVenta: boolean
  ) => {
    setIsSubmitting(true)

    try {
      const dataConOpciones = {
        ...data,
        actualizarPrecios: {
          precioCompra: actualizarPrecioCompra,
          precioVenta: actualizarPrecioVenta,
        },
      }

      await onSubmit(dataConOpciones as CreatePedidoCompraDTO)
    } catch (error) {
      console.error('Error al guardar:', error)
    } finally {
      setIsSubmitting(false)
      setShowUpdatePricesDialog(false)
      setPendingSubmitData(null)
    }
  }

  // Confirmar actualización de precios
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0)
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
          <TabsTrigger value="entrega" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Entrega</span>
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
              <CardDescription>Selecciona el proveedor del pedido</CardDescription>
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
                  <Input value={formData.proveedorNif || ''} disabled placeholder="NIF del proveedor" />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.proveedorEmail || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, proveedorEmail: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input
                    value={formData.proveedorTelefono || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, proveedorTelefono: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos del Pedido</CardTitle>
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value as EstadoPedidoCompra }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_PEDIDO_COMPRA.map(e => (
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
                      <SelectValue placeholder="Prioridad" />
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
                  <Label>Fecha Entrega Prevista</Label>
                  <DateInput
                    value={formData.fechaEntregaPrevista || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, fechaEntregaPrevista: value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Referencia Proveedor</Label>
                  <Input
                    value={formData.referenciaProveedor || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, referenciaProveedor: e.target.value }))}
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
                <CardTitle>Lineas del Pedido</CardTitle>
                <CardDescription>
                  {lineas.length} lineas | Ctrl+Enter para añadir
                </CardDescription>
              </div>
              <Button type="button" onClick={handleAddLinea} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
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
                      <th className="px-2 py-2 text-right w-24">Precio</th>
                      <th className="px-2 py-2 text-right w-16">Dto%</th>
                      <th className="px-2 py-2 text-right w-16">IVA%</th>
                      <th className="px-2 py-2 text-right w-24">Subtotal</th>
                      <th className="px-2 py-2 text-center w-16">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((linea, index) => (
                      <React.Fragment key={index}>
                        <tr className="border-b hover:bg-muted/30">
                          <td className="px-2 py-2 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              {/* Botón para expandir/colapsar componentes del kit */}
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
                                        placeholder="Buscar..."
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
                              {linea.tipo === 'kit' && (
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
                                      {key}: {value}
                                    </Badge>
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleMoveLinea(index, 'up')} disabled={index === 0}>
                                  <ArrowUp className="h-4 w-4 mr-2" />
                                  Mover arriba
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMoveLinea(index, 'down')} disabled={index === lineas.length - 1}>
                                  <ArrowDown className="h-4 w-4 mr-2" />
                                  Mover abajo
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDuplicateLinea(index)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditDescripcion(index)}>
                                  <AlignLeft className="h-4 w-4 mr-2" />
                                  Editar descripcion
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleRemoveLinea(index)}
                                  disabled={lineas.length === 1}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                        {/* Componentes del kit expandidos */}
                        {linea.tipo === 'kit' && linea.mostrarComponentes && linea.componentesKit && linea.componentesKit.length > 0 && (
                          <tr className="bg-muted/20">
                            <td colSpan={8} className="px-8 py-2">
                              <div className="text-xs text-muted-foreground mb-2">
                                Componentes del kit ({linea.componentesKit.length}):
                              </div>
                              <div className="space-y-1">
                                {linea.componentesKit.map((comp, compIdx) => (
                                  <div
                                    key={compIdx}
                                    className={`flex items-center justify-between px-2 py-1 rounded ${
                                      comp.seleccionado ? 'bg-background' : 'bg-muted/50 opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {comp.opcional && (
                                        <input
                                          type="checkbox"
                                          checked={comp.seleccionado}
                                          onChange={() => handleToggleComponenteKit(index, compIdx)}
                                          className="h-3 w-3"
                                        />
                                      )}
                                      <span className="font-mono text-xs text-muted-foreground">{comp.sku}</span>
                                      <span>{comp.nombre}</span>
                                      {comp.opcional && (
                                        <Badge variant="outline" className="text-xs">Opcional</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                      <span>{comp.cantidad} x {formatCurrency(comp.costeUnitario)}</span>
                                      <span className="font-medium">{formatCurrency(comp.cantidad * comp.costeUnitario)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Entrega y Condiciones */}
        <TabsContent value="entrega" className="space-y-6">
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
                  placeholder="Notas internas..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Descripcion</Label>
                <Textarea
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripcion general..."
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
                <CardTitle>Resumen del Pedido</CardTitle>
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
                  <Badge className={ESTADOS_PEDIDO_COMPRA.find(e => e.value === formData.estado)?.color}>
                    {ESTADOS_PEDIDO_COMPRA.find(e => e.value === formData.estado)?.label}
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
                  <span className="text-primary">{formatCurrency(totales.totalPedido)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botones */}
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
              {isEditing ? 'Actualizar' : 'Crear'} Pedido
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

      {/* Diálogo para editar descripción */}
      <Dialog open={showDescripcionDialog} onOpenChange={setShowDescripcionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Descripcion</DialogTitle>
            <DialogDescription>
              Modifica la descripcion corta y larga de la linea
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Descripcion corta</Label>
              <Input
                value={descripcionEdit.corta}
                onChange={(e) => setDescripcionEdit(prev => ({ ...prev, corta: e.target.value }))}
                placeholder="Descripcion visible en el documento"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripcion larga</Label>
              <Textarea
                value={descripcionEdit.larga}
                onChange={(e) => setDescripcionEdit(prev => ({ ...prev, larga: e.target.value }))}
                placeholder="Descripcion extendida..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDescripcionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDescripcion}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
