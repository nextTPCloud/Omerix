'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Building2,
  Package,
  FileText,
  Calculator,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw,
  Receipt,
  Calendar,
  CreditCard,
  Layers,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  FacturaCompra,
  CreateFacturaCompraDTO,
  UpdateFacturaCompraDTO,
  LineaFacturaCompra,
  VencimientoFacturaCompra,
  ESTADOS_FACTURA_COMPRA,
  EstadoFacturaCompra,
} from '@/types/factura-compra.types'
import { proveedoresService } from '@/services/proveedores.service'
import { productosService } from '@/services/productos.service'
import { SearchableSelect, EditableSearchableSelect } from '@/components/ui/searchable-select'
import { DateInput } from '@/components/ui/date-picker'
import { VarianteSelector, VarianteSeleccion } from '@/components/productos/VarianteSelector'
import { Producto, Variante } from '@/types/producto.types'

// ============================================
// INTERFACES LOCALES
// ============================================

// Interface para componentes del kit en factura de compra
interface IComponenteKitFactura {
  productoId: string
  nombre: string
  sku: string
  cantidad: number
  precioUnitario: number
  costeUnitario: number
  descuento: number
  iva: number
  subtotal: number
  opcional: boolean
  seleccionado: boolean
}

// Interface para variante seleccionada
interface IVarianteSeleccionada {
  varianteId: string
  sku: string
  combinacion: Record<string, string>
  costeAdicional?: number
}

interface LineaFormulario {
  _id?: string
  orden: number
  tipo: 'producto' | 'servicio' | 'texto' | 'subtotal' | 'descuento' | 'kit'
  productoId?: string
  codigo?: string
  nombre: string
  descripcion?: string
  sku?: string
  codigoProveedor?: string
  variante?: IVarianteSeleccionada
  componentesKit?: IComponenteKitFactura[]
  mostrarComponentes?: boolean
  cantidad: number
  unidad?: string
  precioUnitario: number
  descuento: number
  descuentoImporte: number
  subtotal: number
  iva: number
  ivaImporte: number
  total: number
  albaranCompraId?: string
  lineaAlbaranId?: string
  esEditable: boolean
  incluidoEnTotal: boolean
  notasInternas?: string
  // Campos para actualización de precios
  precioVenta?: number
  margenPorcentaje?: number
  margenImporte?: number
}

interface VencimientoFormulario {
  _id?: string
  numero: number
  fechaVencimiento: string
  importe: number
  importePagado: number
  importePendiente: number
  pagado: boolean
  observaciones?: string
}

interface ProveedorOption {
  _id: string
  nombre: string
  nombreComercial?: string
  nif?: string
  email?: string
  telefono?: string
}

interface ProductoOption {
  _id: string
  nombre: string
  sku: string
  precioCompra?: number
  iva?: number
  unidad?: string
  descripcionCorta?: string
  tipo?: 'simple' | 'variantes' | 'compuesto' | 'servicio' | 'materia_prima'
  tieneVariantes?: boolean
  variantes?: Variante[]
  componentesKit?: {
    productoId: string
    producto?: {
      _id: string
      nombre: string
      sku: string
    }
    cantidad: number
    opcional?: boolean
  }[]
  precios?: {
    compra?: number
    venta?: number
  }
}

interface FacturaCompraFormProps {
  factura?: FacturaCompra
  onSubmit: (data: CreateFacturaCompraDTO | UpdateFacturaCompraDTO) => Promise<void>
  isEditing?: boolean
  defaultProveedorId?: string
  defaultAlbaranIds?: string[]
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function FacturaCompraForm({
  factura,
  onSubmit,
  isEditing = false,
  defaultProveedorId,
  defaultAlbaranIds,
}: FacturaCompraFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('proveedor')

  // Datos del proveedor
  const [proveedorId, setProveedorId] = useState<string>(factura?.proveedorId || defaultProveedorId || '')
  const [proveedorNombre, setProveedorNombre] = useState(factura?.proveedorNombre || '')
  const [proveedorNif, setProveedorNif] = useState(factura?.proveedorNif || '')
  const [proveedorEmail, setProveedorEmail] = useState(factura?.proveedorEmail || '')
  const [proveedorTelefono, setProveedorTelefono] = useState(factura?.proveedorTelefono || '')

  // Datos de la factura
  const [estado, setEstado] = useState<EstadoFacturaCompra>(factura?.estado || 'borrador')
  const [fecha, setFecha] = useState(factura?.fecha?.split('T')[0] || new Date().toISOString().split('T')[0])
  const [numeroFacturaProveedor, setNumeroFacturaProveedor] = useState(factura?.numeroFacturaProveedor || '')
  const [fechaFacturaProveedor, setFechaFacturaProveedor] = useState(factura?.fechaFacturaProveedor?.split('T')[0] || new Date().toISOString().split('T')[0])
  const [titulo, setTitulo] = useState(factura?.titulo || '')
  const [descripcion, setDescripcion] = useState(factura?.descripcion || '')
  const [observaciones, setObservaciones] = useState(factura?.observaciones || '')

  // Descuento global
  const [descuentoGlobalPorcentaje, setDescuentoGlobalPorcentaje] = useState(factura?.descuentoGlobalPorcentaje || 0)

  // Lineas
  const [lineas, setLineas] = useState<LineaFormulario[]>([])

  // Vencimientos
  const [vencimientos, setVencimientos] = useState<VencimientoFormulario[]>([])

  // Opciones para selects
  const [proveedores, setProveedores] = useState<ProveedorOption[]>([])
  const [productos, setProductos] = useState<ProductoOption[]>([])
  const [loadingProveedores, setLoadingProveedores] = useState(false)
  const [loadingProductos, setLoadingProductos] = useState(false)

  // Referencias para inputs (navegación con teclado)
  const cantidadRefs = useRef<Map<number, HTMLInputElement>>(new Map())
  const productoRefs = useRef<Map<number, HTMLInputElement>>(new Map())

  // Estado para selector de variantes
  const [varianteSelectorOpen, setVarianteSelectorOpen] = useState(false)
  const [productoConVariantes, setProductoConVariantes] = useState<Producto | null>(null)
  const [lineaIndexParaVariante, setLineaIndexParaVariante] = useState<number | null>(null)

  // Estado para dialogo de actualizar precios
  const [showUpdatePricesDialog, setShowUpdatePricesDialog] = useState(false)
  const [pendingSubmitData, setPendingSubmitData] = useState<CreateFacturaCompraDTO | UpdateFacturaCompraDTO | null>(null)
  const [updatePrecioCompra, setUpdatePrecioCompra] = useState(true)
  const [updatePrecioVenta, setUpdatePrecioVenta] = useState(false)

  // Lineas con productos (para actualizar precios)
  const lineasConProducto = lineas.filter(l => l.productoId && l.nombre)

  // ============================================
  // CARGAR DATOS INICIALES
  // ============================================

  useEffect(() => {
    cargarProveedores()
    cargarProductos()
  }, [])

  useEffect(() => {
    if (factura?.lineas) {
      const lineasConvertidas: LineaFormulario[] = factura.lineas.map((l: any, idx) => ({
        _id: l._id,
        orden: l.orden || idx + 1,
        tipo: l.tipo || 'producto',
        productoId: l.productoId,
        codigo: l.codigo,
        nombre: l.nombre || '',
        descripcion: l.descripcion,
        sku: l.sku,
        codigoProveedor: l.codigoProveedor,
        variante: l.variante,
        componentesKit: l.componentesKit,
        mostrarComponentes: l.mostrarComponentes ?? true,
        cantidad: l.cantidad || 0,
        unidad: l.unidad || 'ud.',
        precioUnitario: l.precioUnitario || 0,
        descuento: l.descuento || 0,
        descuentoImporte: l.descuentoImporte || 0,
        subtotal: l.subtotal || 0,
        iva: l.iva || 21,
        ivaImporte: l.ivaImporte || 0,
        total: l.total || 0,
        albaranCompraId: l.albaranCompraId,
        lineaAlbaranId: l.lineaAlbaranId,
        esEditable: l.esEditable !== false,
        incluidoEnTotal: l.incluidoEnTotal !== false,
        notasInternas: l.notasInternas,
      }))
      setLineas(lineasConvertidas)
    }

    if (factura?.vencimientos) {
      const vencimientosConvertidos: VencimientoFormulario[] = factura.vencimientos.map((v, idx) => ({
        _id: v._id,
        numero: v.numero || idx + 1,
        fechaVencimiento: v.fechaVencimiento?.split('T')[0] || '',
        importe: v.importe || 0,
        importePagado: v.importePagado || 0,
        importePendiente: v.importePendiente || 0,
        pagado: v.pagado || false,
        observaciones: v.observaciones,
      }))
      setVencimientos(vencimientosConvertidos)
    }
  }, [factura])

  // Cargar proveedor por defecto
  useEffect(() => {
    if (defaultProveedorId && !isEditing) {
      cargarProveedor(defaultProveedorId)
    }
  }, [defaultProveedorId, isEditing])

  const cargarProveedores = async (search?: string) => {
    try {
      setLoadingProveedores(true)
      const response = await proveedoresService.getAll({ search, limit: 50, activo: true })
      if (response.success && response.data) {
        setProveedores(response.data)
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error)
    } finally {
      setLoadingProveedores(false)
    }
  }

  const cargarProductos = async (search?: string) => {
    try {
      setLoadingProductos(true)
      const response = await productosService.getAll({ q: search, limit: 50, activo: true })
      if (response.success && response.data) {
        setProductos(response.data)
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
    } finally {
      setLoadingProductos(false)
    }
  }

  const cargarProveedor = async (id: string) => {
    try {
      const response = await proveedoresService.getById(id)
      if (response.success && response.data) {
        const prov = response.data
        setProveedorId(prov._id)
        setProveedorNombre(prov.nombreComercial || prov.nombre)
        setProveedorNif(prov.nif || '')
        setProveedorEmail(prov.email || '')
        setProveedorTelefono(prov.telefono || '')
      }
    } catch (error) {
      console.error('Error al cargar proveedor:', error)
    }
  }

  // ============================================
  // GESTION DE LINEAS
  // ============================================

  const calcularLinea = (linea: LineaFormulario): LineaFormulario => {
    const subtotalBruto = linea.cantidad * linea.precioUnitario
    const descuentoImporte = subtotalBruto * (linea.descuento / 100)
    const subtotal = subtotalBruto - descuentoImporte
    const ivaImporte = subtotal * (linea.iva / 100)
    const total = subtotal + ivaImporte

    return {
      ...linea,
      descuentoImporte: Math.round(descuentoImporte * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      ivaImporte: Math.round(ivaImporte * 100) / 100,
      total: Math.round(total * 100) / 100,
    }
  }

  const agregarLinea = useCallback(() => {
    const newIndex = lineas.length
    const nuevaLinea: LineaFormulario = {
      orden: newIndex + 1,
      tipo: 'producto',
      nombre: '',
      cantidad: 1,
      unidad: 'ud.',
      precioUnitario: 0,
      descuento: 0,
      descuentoImporte: 0,
      subtotal: 0,
      iva: 21,
      ivaImporte: 0,
      total: 0,
      esEditable: true,
      incluidoEnTotal: true,
    }
    setLineas([...lineas, nuevaLinea])

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
      agregarLinea()
    }
  }, [agregarLinea])

  // Handler de teclado para cantidad
  const handleCantidadKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      // Ctrl+Enter siempre añade nueva línea
      e.preventDefault()
      agregarLinea()
    } else if (e.key === 'Enter' && !e.ctrlKey) {
      // Enter solo añade línea si estamos en el último registro
      if (index === lineas.length - 1) {
        e.preventDefault()
        agregarLinea()
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
  }, [agregarLinea, lineas.length])

  const eliminarLinea = (index: number) => {
    const nuevasLineas = lineas.filter((_, i) => i !== index)
    setLineas(nuevasLineas.map((l, i) => ({ ...l, orden: i + 1 })))
  }

  const moverLinea = (index: number, direccion: 'arriba' | 'abajo') => {
    const nuevasLineas = [...lineas]
    const newIndex = direccion === 'arriba' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= nuevasLineas.length) return
    ;[nuevasLineas[index], nuevasLineas[newIndex]] = [nuevasLineas[newIndex], nuevasLineas[index]]
    setLineas(nuevasLineas.map((l, i) => ({ ...l, orden: i + 1 })))
  }

  const actualizarLinea = (index: number, campo: keyof LineaFormulario, valor: any) => {
    const nuevasLineas = [...lineas]
    nuevasLineas[index] = { ...nuevasLineas[index], [campo]: valor }
    nuevasLineas[index] = calcularLinea(nuevasLineas[index])
    setLineas(nuevasLineas)
  }

  const seleccionarProducto = (index: number, productoId: string) => {
    const producto = productos.find(p => p._id === productoId) as any
    if (producto) {
      // Si el producto tiene variantes activas, abrir el selector
      if (producto.tieneVariantes && producto.variantes && producto.variantes.length > 0) {
        const variantesActivas = producto.variantes.filter((v: Variante) => v.activo !== false)
        if (variantesActivas.length > 0) {
          setProductoConVariantes(producto as Producto)
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
    producto: any,
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
    let componentesKit: IComponenteKitFactura[] | undefined
    if (esKit && producto.componentesKit) {
      componentesKit = producto.componentesKit.map((comp: any) => ({
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
      sku: variante?.sku || producto.sku,
      precioUnitario: variante?.costeUnitario ?? producto.precios?.compra ?? producto.precioCompra ?? 0,
      iva: producto.iva || 21,
      unidad: producto.unidad || 'ud.',
      tipo: esKit ? 'kit' : 'producto',
      componentesKit,
      mostrarComponentes: true,
      variante: variante ? {
        varianteId: variante.varianteId,
        sku: variante.sku,
        combinacion: variante.combinacion,
        costeAdicional: variante.costeUnitario - (producto.precios?.compra || producto.precioCompra || 0),
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
        actualizarLinea(lineaIndexParaVariante, 'cantidad', varianteInfo.cantidad)
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
      actualizarLinea(lineaIndexParaVariante, 'cantidad', primeraVariante.cantidad)
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
          sku: variante.sku,
          nombre: `${productoConVariantes.nombre} - ${combinacionStr}`,
          descripcion: productoConVariantes.descripcionCorta,
          cantidad: variante.cantidad || 1,
          precioUnitario: variante.costeUnitario,
          descuento: 0,
          descuentoImporte: 0,
          iva: productoConVariantes.iva || 21,
          subtotal: 0,
          ivaImporte: 0,
          total: 0,
          esEditable: true,
          incluidoEnTotal: true,
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

  // ============================================
  // GESTION DE VENCIMIENTOS
  // ============================================

  const agregarVencimiento = () => {
    const totalPendiente = totales.totalFactura - vencimientos.reduce((sum, v) => sum + v.importe, 0)
    const nuevoVenc: VencimientoFormulario = {
      numero: vencimientos.length + 1,
      fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
      importe: Math.max(0, totalPendiente),
      importePagado: 0,
      importePendiente: Math.max(0, totalPendiente),
      pagado: false,
    }
    setVencimientos([...vencimientos, nuevoVenc])
  }

  const eliminarVencimiento = (index: number) => {
    const nuevosVencimientos = vencimientos.filter((_, i) => i !== index)
    setVencimientos(nuevosVencimientos.map((v, i) => ({ ...v, numero: i + 1 })))
  }

  const actualizarVencimiento = (index: number, campo: keyof VencimientoFormulario, valor: any) => {
    const nuevosVencimientos = [...vencimientos]
    nuevosVencimientos[index] = { ...nuevosVencimientos[index], [campo]: valor }
    // Recalcular pendiente
    nuevosVencimientos[index].importePendiente = nuevosVencimientos[index].importe - nuevosVencimientos[index].importePagado
    setVencimientos(nuevosVencimientos)
  }

  // Generar vencimientos automaticamente
  const generarVencimientosAutomaticos = (numVencimientos: number = 1, diasEntrePagos: number = 30) => {
    const totalFactura = totales.totalFactura
    const importePorVenc = Math.round((totalFactura / numVencimientos) * 100) / 100

    const nuevosVencimientos: VencimientoFormulario[] = []
    for (let i = 0; i < numVencimientos; i++) {
      const fechaBase = new Date(fechaFacturaProveedor || fecha)
      fechaBase.setDate(fechaBase.getDate() + diasEntrePagos * (i + 1))

      // Ultimo vencimiento lleva el resto para evitar errores de redondeo
      const importe = i === numVencimientos - 1
        ? totalFactura - importePorVenc * i
        : importePorVenc

      nuevosVencimientos.push({
        numero: i + 1,
        fechaVencimiento: fechaBase.toISOString().split('T')[0],
        importe: Math.round(importe * 100) / 100,
        importePagado: 0,
        importePendiente: Math.round(importe * 100) / 100,
        pagado: false,
      })
    }

    setVencimientos(nuevosVencimientos)
  }

  // ============================================
  // CALCULOS DE TOTALES
  // ============================================

  const calcularTotales = useCallback(() => {
    const lineasIncluidas = lineas.filter(l => l.incluidoEnTotal && l.tipo === 'producto')

    const subtotalBruto = lineasIncluidas.reduce((sum, l) => sum + (l.cantidad * l.precioUnitario), 0)
    const totalDescuentosLineas = lineasIncluidas.reduce((sum, l) => sum + l.descuentoImporte, 0)
    const subtotalNeto = subtotalBruto - totalDescuentosLineas

    // Descuento global
    const descuentoGlobalImporte = subtotalNeto * (descuentoGlobalPorcentaje / 100)
    const subtotalConDescuento = subtotalNeto - descuentoGlobalImporte

    // Desglose IVA
    const desgloseIva: { [key: number]: { base: number; cuota: number } } = {}
    lineasIncluidas.forEach(linea => {
      const baseLinea = linea.subtotal * (1 - descuentoGlobalPorcentaje / 100)
      if (!desgloseIva[linea.iva]) {
        desgloseIva[linea.iva] = { base: 0, cuota: 0 }
      }
      desgloseIva[linea.iva].base += baseLinea
      desgloseIva[linea.iva].cuota += baseLinea * (linea.iva / 100)
    })

    const totalIva = Object.values(desgloseIva).reduce((sum, d) => sum + d.cuota, 0)
    const totalFactura = subtotalConDescuento + totalIva

    // Totales de pago
    const totalPagado = vencimientos.reduce((sum, v) => sum + (v.importePagado || 0), 0)
    const totalPendiente = totalFactura - totalPagado

    return {
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round((totalDescuentosLineas + descuentoGlobalImporte) * 100) / 100,
      subtotalNeto: Math.round(subtotalConDescuento * 100) / 100,
      desgloseIva: Object.entries(desgloseIva).map(([tipo, valores]) => ({
        tipo: Number(tipo),
        base: Math.round(valores.base * 100) / 100,
        cuota: Math.round(valores.cuota * 100) / 100,
      })),
      totalIva: Math.round(totalIva * 100) / 100,
      totalFactura: Math.round(totalFactura * 100) / 100,
      descuentoGlobalImporte: Math.round(descuentoGlobalImporte * 100) / 100,
      totalPagado: Math.round(totalPagado * 100) / 100,
      totalPendiente: Math.round(totalPendiente * 100) / 100,
    }
  }, [lineas, descuentoGlobalPorcentaje, vencimientos])

  const totales = calcularTotales()

  // ============================================
  // FORMATEO
  // ============================================

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
    })
  }

  // ============================================
  // SUBMIT
  // ============================================

  // Preparar datos para enviar
  const prepareSubmitData = (): CreateFacturaCompraDTO | UpdateFacturaCompraDTO => {
    return {
      estado,
      fecha,
      numeroFacturaProveedor,
      fechaFacturaProveedor,
      proveedorId,
      proveedorNombre,
      proveedorNif,
      proveedorEmail: proveedorEmail || undefined,
      proveedorTelefono: proveedorTelefono || undefined,
      albaranesCompraIds: defaultAlbaranIds,
      titulo: titulo || undefined,
      descripcion: descripcion || undefined,
      lineas: lineas.map(l => ({
        _id: l._id,
        orden: l.orden,
        tipo: l.tipo as any,
        productoId: l.productoId,
        codigo: l.codigo,
        nombre: l.nombre,
        descripcion: l.descripcion,
        sku: l.sku,
        codigoProveedor: l.codigoProveedor,
        variante: l.variante,
        componentesKit: l.componentesKit,
        mostrarComponentes: l.mostrarComponentes,
        cantidad: l.cantidad,
        unidad: l.unidad,
        precioUnitario: l.precioUnitario,
        descuento: l.descuento,
        descuentoImporte: l.descuentoImporte,
        subtotal: l.subtotal,
        iva: l.iva,
        ivaImporte: l.ivaImporte,
        total: l.total,
        albaranCompraId: l.albaranCompraId,
        lineaAlbaranId: l.lineaAlbaranId,
        esEditable: l.esEditable,
        incluidoEnTotal: l.incluidoEnTotal,
        notasInternas: l.notasInternas,
        precioVenta: l.precioVenta,
      })) as any,
      vencimientos: vencimientos.map(v => ({
        _id: v._id,
        numero: v.numero,
        fechaVencimiento: v.fechaVencimiento,
        importe: v.importe,
        importePagado: v.importePagado,
        importePendiente: v.importePendiente,
        pagado: v.pagado,
        observaciones: v.observaciones,
      })),
      totales: {
        subtotalBruto: totales.subtotalBruto,
        totalDescuentos: totales.totalDescuentos,
        subtotalNeto: totales.subtotalNeto,
        desgloseIva: totales.desgloseIva,
        totalIva: totales.totalIva,
        totalFactura: totales.totalFactura,
        totalPagado: totales.totalPagado,
        totalPendiente: totales.totalPendiente,
      },
      descuentoGlobalPorcentaje,
      descuentoGlobalImporte: totales.descuentoGlobalImporte,
      observaciones: observaciones || undefined,
    }
  }

  // Ejecutar el submit (con o sin actualización de precios)
  const doSubmit = async (
    data: CreateFacturaCompraDTO | UpdateFacturaCompraDTO,
    actualizarPrecioCompra: boolean,
    actualizarPrecioVenta: boolean
  ) => {
    setIsLoading(true)

    try {
      const dataConOpciones = {
        ...data,
        actualizarPrecios: {
          precioCompra: actualizarPrecioCompra,
          precioVenta: actualizarPrecioVenta,
        },
      }

      await onSubmit(dataConOpciones as CreateFacturaCompraDTO)
    } catch (error) {
      // Error manejado en el componente padre
    } finally {
      setIsLoading(false)
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

  const handleSubmit = async () => {
    // Validaciones
    if (!proveedorId) {
      toast.error('Debes seleccionar un proveedor')
      setActiveTab('proveedor')
      return
    }

    if (!numeroFacturaProveedor) {
      toast.error('Debes indicar el numero de factura del proveedor')
      setActiveTab('proveedor')
      return
    }

    if (lineas.length === 0) {
      toast.error('Debes agregar al menos una linea')
      setActiveTab('lineas')
      return
    }

    const lineasInvalidas = lineas.filter(l => l.tipo === 'producto' && (!l.nombre || l.cantidad <= 0))
    if (lineasInvalidas.length > 0) {
      toast.error('Hay lineas sin producto o con cantidad invalida')
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

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="proveedor" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Proveedor</span>
          </TabsTrigger>
          <TabsTrigger value="lineas" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Lineas</span>
            {lineas.length > 0 && (
              <Badge variant="secondary" className="ml-1">{lineas.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="vencimientos" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Vencimientos</span>
            {vencimientos.length > 0 && (
              <Badge variant="secondary" className="ml-1">{vencimientos.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resumen" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* TAB PROVEEDOR */}
        {/* ============================================ */}
        <TabsContent value="proveedor" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Datos del Proveedor
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Proveedor *</Label>
                <SearchableSelect
                  options={proveedores.map(p => ({
                    value: p._id,
                    label: p.nombreComercial || p.nombre,
                    sublabel: p.nif,
                  }))}
                  value={proveedorId}
                  onValueChange={(value) => {
                    if (value) cargarProveedor(value)
                  }}
                  placeholder="Buscar proveedor..."
                  loading={loadingProveedores}
                />
              </div>

              <div>
                <Label>Nombre</Label>
                <Input
                  value={proveedorNombre}
                  onChange={(e) => setProveedorNombre(e.target.value)}
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div>
                <Label>NIF/CIF</Label>
                <Input
                  value={proveedorNif}
                  onChange={(e) => setProveedorNif(e.target.value)}
                  placeholder="NIF/CIF"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={proveedorEmail}
                  onChange={(e) => setProveedorEmail(e.target.value)}
                  placeholder="email@proveedor.com"
                />
              </div>

              <div>
                <Label>Telefono</Label>
                <Input
                  value={proveedorTelefono}
                  onChange={(e) => setProveedorTelefono(e.target.value)}
                  placeholder="Telefono"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Datos de la Factura
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Estado</Label>
                <Select value={estado} onValueChange={(v) => setEstado(v as EstadoFacturaCompra)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_FACTURA_COMPRA.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fecha registro *</Label>
                <DateInput
                  value={fecha}
                  onChange={(value) => setFecha(value)}
                />
              </div>

              <div>
                <Label>N. Factura Proveedor *</Label>
                <Input
                  value={numeroFacturaProveedor}
                  onChange={(e) => setNumeroFacturaProveedor(e.target.value)}
                  placeholder="Numero de factura del proveedor"
                />
              </div>

              <div>
                <Label>Fecha Factura Proveedor *</Label>
                <DateInput
                  value={fechaFacturaProveedor}
                  onChange={(value) => setFechaFacturaProveedor(value)}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Titulo</Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Titulo descriptivo (opcional)"
                />
              </div>

              <div className="md:col-span-3">
                <Label>Descripcion</Label>
                <Textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripcion de la factura"
                  rows={2}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB LINEAS */}
        {/* ============================================ */}
        <TabsContent value="lineas" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Lineas de la Factura
              </h3>
              <Button onClick={agregarLinea} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Linea
              </Button>
            </div>

            {lineas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No hay lineas en la factura</p>
                <Button onClick={agregarLinea} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primera linea
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead className="min-w-[250px]">Producto</TableHead>
                      <TableHead className="w-[100px] text-right">Cantidad</TableHead>
                      <TableHead className="w-[120px] text-right">Precio</TableHead>
                      <TableHead className="w-[80px] text-right">Dto %</TableHead>
                      <TableHead className="w-[80px] text-right">IVA %</TableHead>
                      <TableHead className="w-[120px] text-right">Total</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineas.map((linea, index) => (
                      <React.Fragment key={index}>
                        <TableRow>
                          <TableCell className="text-muted-foreground">
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
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <EditableSearchableSelect
                                options={productos.map(p => ({
                                  value: p._id,
                                  label: p.nombre,
                                  sublabel: p.sku,
                                }))}
                                value={linea.productoId || ''}
                                displayValue={linea.nombre}
                                onValueChange={(value) => {
                                  if (value) seleccionarProducto(index, value)
                                }}
                                onDisplayValueChange={(value) => actualizarLinea(index, 'nombre', value)}
                                placeholder="Buscar producto..."
                                loading={loadingProductos}
                                onCtrlEnterPress={agregarLinea}
                                inputRef={(el) => {
                                  if (el) productoRefs.current.set(index, el)
                                  else productoRefs.current.delete(index)
                                }}
                              />
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
                          </TableCell>
                          <TableCell>
                            <Input
                              ref={(el) => {
                                if (el) cantidadRefs.current.set(index, el)
                              }}
                              type="number"
                              min="0"
                              step="1"
                              value={linea.cantidad}
                              onChange={(e) => actualizarLinea(index, 'cantidad', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => handleCantidadKeyDown(e, index)}
                              className="w-[80px] text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={linea.precioUnitario}
                              onChange={(e) => actualizarLinea(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                              className="w-[100px] text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={linea.descuento}
                              onChange={(e) => actualizarLinea(index, 'descuento', parseFloat(e.target.value) || 0)}
                              className="w-[60px] text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={linea.iva.toString()}
                              onValueChange={(v) => actualizarLinea(index, 'iva', parseFloat(v))}
                            >
                              <SelectTrigger className="w-[70px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="4">4%</SelectItem>
                                <SelectItem value="10">10%</SelectItem>
                                <SelectItem value="21">21%</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(linea.total)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moverLinea(index, 'arriba')}
                                disabled={index === 0}
                                className="h-7 w-7 p-0"
                              >
                                <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moverLinea(index, 'abajo')}
                              disabled={index === lineas.length - 1}
                              className="h-7 w-7 p-0"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarLinea(index)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Componentes del kit expandidos */}
                      {linea.tipo === 'kit' && linea.mostrarComponentes && linea.componentesKit && linea.componentesKit.length > 0 && (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={8} className="px-8 py-2">
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
                          </TableCell>
                        </TableRow>
                      )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>

          {/* Resumen rapido */}
          {lineas.length > 0 && (
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <Label className="text-xs">Descuento Global %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={descuentoGlobalPorcentaje}
                      onChange={(e) => setDescuentoGlobalPorcentaje(parseFloat(e.target.value) || 0)}
                      className="w-[100px]"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Subtotal: {formatCurrency(totales.subtotalBruto)}</p>
                  {totales.totalDescuentos > 0 && (
                    <p className="text-sm text-red-600">Descuentos: -{formatCurrency(totales.totalDescuentos)}</p>
                  )}
                  <p className="text-sm text-muted-foreground">IVA: {formatCurrency(totales.totalIva)}</p>
                  <p className="text-xl font-bold text-primary">Total: {formatCurrency(totales.totalFactura)}</p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB VENCIMIENTOS */}
        {/* ============================================ */}
        <TabsContent value="vencimientos" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Vencimientos de Pago
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => generarVencimientosAutomaticos(1, 30)}>
                  1 Venc. (30d)
                </Button>
                <Button variant="outline" size="sm" onClick={() => generarVencimientosAutomaticos(2, 30)}>
                  2 Venc. (30/60d)
                </Button>
                <Button variant="outline" size="sm" onClick={() => generarVencimientosAutomaticos(3, 30)}>
                  3 Venc.
                </Button>
                <Button onClick={agregarVencimiento} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>

            {vencimientos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No hay vencimientos definidos</p>
                <p className="text-xs mt-1">Usa los botones para generar automaticamente o agrega manualmente</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Fecha Vencimiento</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vencimientos.map((venc, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-muted-foreground">{venc.numero}</TableCell>
                        <TableCell>
                          <DateInput
                            value={venc.fechaVencimiento}
                            onChange={(value) => actualizarVencimiento(index, 'fechaVencimiento', value)}
                            className="w-[150px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={venc.importe}
                            onChange={(e) => actualizarVencimiento(index, 'importe', parseFloat(e.target.value) || 0)}
                            className="w-[120px] text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={venc.observaciones || ''}
                            onChange={(e) => actualizarVencimiento(index, 'observaciones', e.target.value)}
                            placeholder="Notas"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarVencimiento(index)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Resumen de vencimientos */}
            {vencimientos.length > 0 && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total vencimientos:</span>
                  <span className="font-medium">{formatCurrency(vencimientos.reduce((sum, v) => sum + v.importe, 0))}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-muted-foreground">Total factura:</span>
                  <span className="font-medium">{formatCurrency(totales.totalFactura)}</span>
                </div>
                {Math.abs(vencimientos.reduce((sum, v) => sum + v.importe, 0) - totales.totalFactura) > 0.01 && (
                  <div className="flex justify-between items-center mt-1 text-orange-600">
                    <span className="text-sm">Diferencia:</span>
                    <span className="font-medium">{formatCurrency(totales.totalFactura - vencimientos.reduce((sum, v) => sum + v.importe, 0))}</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB RESUMEN */}
        {/* ============================================ */}
        <TabsContent value="resumen" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resumen de la factura */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Resumen de la Factura
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proveedor</span>
                  <span className="font-medium">{proveedorNombre || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">N. Factura Prov.</span>
                  <span className="font-medium">{numeroFacturaProveedor || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha Factura</span>
                  <span className="font-medium">
                    {fechaFacturaProveedor ? new Date(fechaFacturaProveedor).toLocaleDateString('es-ES') : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge className={`text-white ${ESTADOS_FACTURA_COMPRA.find(e => e.value === estado)?.color || ''}`}>
                    {ESTADOS_FACTURA_COMPRA.find(e => e.value === estado)?.label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lineas</span>
                  <span className="font-medium">{lineas.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencimientos</span>
                  <span className="font-medium">{vencimientos.length}</span>
                </div>
              </div>
            </Card>

            {/* Totales */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Totales
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal bruto</span>
                  <span>{formatCurrency(totales.subtotalBruto)}</span>
                </div>
                {totales.totalDescuentos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuentos</span>
                    <span className="text-red-600">-{formatCurrency(totales.totalDescuentos)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal neto</span>
                  <span>{formatCurrency(totales.subtotalNeto)}</span>
                </div>
                <Separator className="my-2" />
                {totales.desgloseIva.map((desglose, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA {desglose.tipo}% (Base: {formatCurrency(desglose.base)})</span>
                    <span>{formatCurrency(desglose.cuota)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total IVA</span>
                  <span>{formatCurrency(totales.totalIva)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total Factura</span>
                  <span className="text-primary">{formatCurrency(totales.totalFactura)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Observaciones */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Observaciones</h3>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones de la factura"
              rows={3}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Barra de acciones */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {lineas.length} linea(s) | {vencimientos.length} vencimiento(s) | Total: <span className="font-bold text-primary">{formatCurrency(totales.totalFactura)}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Actualizar' : 'Crear'} Factura
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

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
              disabled={isLoading}
            >
              Guardar sin actualizar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmUpdatePrices}
              disabled={isLoading || (!updatePrecioCompra && !updatePrecioVenta)}
            >
              {isLoading ? (
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
    </div>
  )
}
