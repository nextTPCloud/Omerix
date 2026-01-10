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
  Percent,
  RefreshCw,
  AlertCircle,
  Tag,
  TrendingUp,
  Info,
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
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DateInput } from '@/components/ui/date-picker'
import { VarianteSelector, VarianteSeleccion } from '@/components/productos/VarianteSelector'
import { DocumentoLineasGrid } from '@/components/documentos'
import { useLineasConfig } from '@/hooks/useLineasConfig'

// Services
import { proveedoresService } from '@/services/proveedores.service'
import { productosService } from '@/services/productos.service'
import { seriesDocumentosService } from '@/services/series-documentos.service'
import { formasPagoService } from '@/services/formas-pago.service'
import { terminosPagoService } from '@/services/terminos-pago.service'
import { tarifasService } from '@/services/tarifas.service'
import { ofertasService } from '@/services/ofertas.service'

// Hooks
import { usePermissions } from '@/hooks/usePermissions'

// Types
import { Proveedor } from '@/types/proveedor.types'
import { FormaPago } from '@/types/forma-pago.types'
import { TerminoPago } from '@/types/termino-pago.types'
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
  subtotal: number
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
  descripcionLarga?: string
  codigoProveedor?: string
  // Kit y variante
  variante?: IVarianteSeleccionada
  componentesKit?: IComponenteKitPresupuesto[]
  mostrarComponentes?: boolean
  // Cantidades
  cantidad: number
  unidad?: string
  peso?: number
  pesoTotal?: number
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
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])
  const [terminosPago, setTerminosPago] = useState<TerminoPago[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Configuración de columnas visibles (no se usa directamente, DocumentoLineasGrid lo maneja internamente)
  const { esColumnaVisible } = useLineasConfig('presupuestos-compra-lineas', { esVenta: false })

  // Opciones de productos formateadas para DocumentoLineasGrid
  const productosOptions = React.useMemo(() => {
    return productos.map(p => ({
      value: p._id,
      label: p.nombre,
      description: p.sku || '',
    }))
  }, [productos])

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
    condiciones: {
      formaPagoId: '',
      terminoPagoId: '',
    },
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

  // Hook de permisos
  const {
    canModificarPVP,
    canModificarPrecioCompra,
    canUpdate,
    canVerMargenes,
  } = usePermissions()

  // Interface para precios editables en el modal
  interface PrecioEditable {
    productoId: string
    nombre: string
    iva: number
    precioCompraActual: number
    precioCompraNew: number
    pvpSinIvaActual: number
    pvpSinIvaNew: number
    pvpConIvaNew: number
    margenPct: number
    margenEuro: number
    enTarifas: string[] // IDs de tarifas donde está el producto
    enOfertas: string[] // IDs de ofertas donde está el producto
  }

  // Estado para dialogo de actualizar precios
  const [showUpdatePricesDialog, setShowUpdatePricesDialog] = useState(false)
  const [pendingSubmitData, setPendingSubmitData] = useState<CreatePresupuestoCompraDTO | null>(null)
  const [updatePrecioCompra, setUpdatePrecioCompra] = useState(true)
  const [updatePrecioVenta, setUpdatePrecioVenta] = useState(false)
  const [updateTarifas, setUpdateTarifas] = useState(false)
  const [updateOfertas, setUpdateOfertas] = useState(false)
  const [preciosEditables, setPreciosEditables] = useState<PrecioEditable[]>([])
  const [margenUniforme, setMargenUniforme] = useState<string>('')
  const [loadingTarifasOfertas, setLoadingTarifasOfertas] = useState(false)
  // Estados para edición de inputs sin formateo en tiempo real
  const [editingInputs, setEditingInputs] = useState<Record<string, string>>({})

  // Estado para dialogo de descripcion larga
  const [showDescripcionDialog, setShowDescripcionDialog] = useState(false)
  const [descripcionEditIndex, setDescripcionEditIndex] = useState<number | null>(null)
  const [descripcionEdit, setDescripcionEdit] = useState({ corta: '', larga: '' })

  // Cargar opciones al montar
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true)
        const [proveedoresRes, productosRes, formasPagoRes, terminosPagoRes] = await Promise.all([
          proveedoresService.getAll({ activo: true, limit: 100 }),
          productosService.getAll({ activo: true, limit: 100 }),
          formasPagoService.getAll({ activo: true }),
          terminosPagoService.getAll({ activo: true }),
        ])

        if (proveedoresRes.success) setProveedores(proveedoresRes.data || [])
        if (productosRes.success) setProductos(productosRes.data || [])
        if (formasPagoRes.success) setFormasPago(formasPagoRes.data || [])
        if (terminosPagoRes.success) setTerminosPago(terminosPagoRes.data || [])
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
        condiciones: {
          formaPagoId: (presupuesto as any).condiciones?.formaPagoId || '',
          terminoPagoId: (presupuesto as any).condiciones?.terminoPagoId || '',
        },
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
      // Obtener ID de forma de pago y término de pago del proveedor
      const formaPagoIdProveedor = typeof proveedor.formaPagoId === 'object'
        ? (proveedor.formaPagoId as any)?._id
        : proveedor.formaPagoId
      const terminoPagoIdProveedor = typeof proveedor.terminoPagoId === 'object'
        ? (proveedor.terminoPagoId as any)?._id
        : proveedor.terminoPagoId

      setFormData(prev => ({
        ...prev,
        proveedorId: proveedor._id,
        proveedorNombre: proveedor.nombreComercial || proveedor.nombre,
        proveedorNif: proveedor.nif || '',
        proveedorEmail: proveedor.email,
        proveedorTelefono: proveedor.telefono,
        condiciones: {
          ...prev.condiciones,
          formaPagoId: formaPagoIdProveedor || prev.condiciones?.formaPagoId,
          terminoPagoId: terminoPagoIdProveedor || prev.condiciones?.terminoPagoId,
        },
      }))
    }
  }

  // Handler para cambio de producto en linea
  const handleProductoChange = async (index: number, productoId: string) => {
    let producto = productos.find(p => p._id === productoId)
    if (!producto) return

    // Si es un producto tipo compuesto (kit), cargar el producto completo
    // para asegurar que tenemos los datos de componentesKit poblados
    if (producto.tipo === 'compuesto') {
      try {
        const response = await productosService.getById(productoId)
        if (response.success && response.data) {
          producto = response.data
        }
      } catch (error) {
        console.error('Error al cargar producto completo:', error)
      }
    }

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
        // Buscar producto en lista local o usar datos poblados del backend
        const productoComp = productos.find(p => p._id === comp.productoId)
        const productoInfo = typeof comp.productoId === 'object' ? comp.productoId : null
        const precioUnit = productoComp?.precios?.compra || productoInfo?.precios?.compra || 0
        const cantidad = comp.cantidad || 1
        return {
          productoId: typeof comp.productoId === 'object' ? comp.productoId._id : comp.productoId,
          nombre: productoComp?.nombre || productoInfo?.nombre || '',
          sku: productoComp?.sku || productoInfo?.sku || '',
          cantidad,
          precioUnitario: precioUnit,
          subtotal: Math.round(cantidad * precioUnit * 100) / 100,
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

    const precioCompra = variante?.costeUnitario ?? producto.costes?.costeUltimo ?? producto.precios?.compra ?? 0
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

  // Handler para actualizar línea (compatible con DocumentoLineasGrid)
  const handleUpdateLinea = (index: number, updates: Partial<LineaFormulario>) => {
    const nuevasLineas = [...lineas]
    nuevasLineas[index] = { ...nuevasLineas[index], ...updates }

    // Si cambia el PVP, resetear margen para que se recalcule
    if ('precioVenta' in updates) {
      nuevasLineas[index].margenPorcentaje = 0
      nuevasLineas[index].margenImporte = 0
    }
    // Si cambia el margen %, resetear PVP para que se recalcule
    if ('margenPorcentaje' in updates) {
      nuevasLineas[index].precioVenta = 0
    }

    // Recalcular si es un campo que afecta al total o margen
    const camposRecalculo = ['cantidad', 'precioUnitario', 'descuento', 'iva', 'precioVenta', 'margenPorcentaje']
    if (Object.keys(updates).some(key => camposRecalculo.includes(key))) {
      nuevasLineas[index] = calcularLinea(nuevasLineas[index])
    }
    setLineas(nuevasLineas)
  }

  // Handler para cambiar nombre de línea (compatible con DocumentoLineasGrid)
  const handleNombreChange = (index: number, nombre: string) => {
    handleUpdateLinea(index, { nombre })
  }

  // Handler para abrir dialogo de descripción
  const handleOpenDescripcionDialog = useCallback((index: number) => {
    const linea = lineas[index]
    if (linea) {
      const producto = productos.find(p => p._id === linea.productoId) as any
      setDescripcionEdit({
        corta: linea.descripcion || producto?.descripcionCorta || '',
        larga: linea.descripcionLarga || producto?.descripcion || '',
      })
      setDescripcionEditIndex(index)
      setShowDescripcionDialog(true)
    }
  }, [lineas, productos])

  // Handler para guardar descripcion
  const handleSaveDescripcion = useCallback(() => {
    if (descripcionEditIndex !== null) {
      handleUpdateLinea(descripcionEditIndex, {
        descripcion: descripcionEdit.corta,
        descripcionLarga: descripcionEdit.larga,
      })
      setShowDescripcionDialog(false)
      setDescripcionEditIndex(null)
      toast.success('Descripciones actualizadas')
    }
  }, [descripcionEditIndex, descripcionEdit, handleUpdateLinea])

  // Handler para duplicar línea (compatible con DocumentoLineasGrid)
  const handleDuplicateLinea = (index: number) => {
    const lineaOriginal = lineas[index]
    const lineaDuplicada: LineaFormulario = {
      ...lineaOriginal,
      _id: undefined,
      orden: lineas.length,
    }
    setLineas([...lineas, lineaDuplicada])
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
        descripcionLarga: l.descripcionLarga,
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

  // Función para calcular margen
  const calcularMargen = (precioCompra: number, pvpSinIva: number) => {
    if (precioCompra <= 0) return { pct: 0, euro: pvpSinIva }
    const margenEuro = pvpSinIva - precioCompra
    const margenPct = (margenEuro / precioCompra) * 100
    return { pct: margenPct, euro: margenEuro }
  }

  // Función para calcular PVP desde margen
  const calcularPvpDesdeMargen = (precioCompra: number, margenPct: number) => {
    return precioCompra * (1 + margenPct / 100)
  }

  // Inicializar precios editables cuando se abre el modal
  const initializePreciosEditables = async () => {
    setLoadingTarifasOfertas(true)
    // Limpiar estados de edición anteriores
    setEditingInputs({})
    setMargenUniforme('')

    try {
      // Obtener IDs únicos de productos
      const productosIds = [...new Set(lineasConProducto.map(l => l.productoId).filter(Boolean))] as string[]

      // Cargar tarifas y ofertas para ver donde están los productos
      const [tarifasRes, ofertasRes] = await Promise.all([
        tarifasService.getAll({ activa: true }).catch(() => ({ success: false, data: [] })),
        ofertasService.getAll({ activa: true }).catch(() => ({ success: false, data: [] })),
      ])

      const tarifas = tarifasRes.success ? tarifasRes.data || [] : []
      const ofertas = ofertasRes.success ? ofertasRes.data || [] : []

      // Mapear productos a sus tarifas y ofertas
      const productosEnTarifas: Record<string, string[]> = {}
      const productosEnOfertas: Record<string, string[]> = {}

      tarifas.forEach((tarifa: any) => {
        tarifa.productos?.forEach((prod: any) => {
          const prodId = prod.productoId?._id || prod.productoId
          if (prodId && productosIds.includes(prodId)) {
            if (!productosEnTarifas[prodId]) productosEnTarifas[prodId] = []
            productosEnTarifas[prodId].push(tarifa._id)
          }
        })
      })

      ofertas.forEach((oferta: any) => {
        oferta.productos?.forEach((prod: any) => {
          const prodId = prod.productoId?._id || prod.productoId
          if (prodId && productosIds.includes(prodId)) {
            if (!productosEnOfertas[prodId]) productosEnOfertas[prodId] = []
            productosEnOfertas[prodId].push(oferta._id)
          }
        })
      })

      // Crear precios editables
      const editables: PrecioEditable[] = lineasConProducto.map(linea => {
        const producto = productos.find(p => p._id === linea.productoId)
        const precioCompraActual = producto?.precios?.compra || producto?.costes?.costeUltimo || 0
        const pvpSinIvaActual = producto?.precios?.venta || 0
        const iva = linea.iva || producto?.iva || 21

        const precioCompraNew = linea.precioUnitario
        const pvpSinIvaNew = linea.precioVenta || pvpSinIvaActual
        const pvpConIvaNew = pvpSinIvaNew * (1 + iva / 100)
        const margen = calcularMargen(precioCompraNew, pvpSinIvaNew)

        return {
          productoId: linea.productoId!,
          nombre: linea.nombre,
          iva,
          precioCompraActual,
          precioCompraNew,
          pvpSinIvaActual,
          pvpSinIvaNew,
          pvpConIvaNew,
          margenPct: margen.pct,
          margenEuro: margen.euro,
          enTarifas: productosEnTarifas[linea.productoId!] || [],
          enOfertas: productosEnOfertas[linea.productoId!] || [],
        }
      })

      setPreciosEditables(editables)
    } catch (error) {
      console.error('Error cargando tarifas/ofertas:', error)
      // Crear editables sin info de tarifas/ofertas
      const editables: PrecioEditable[] = lineasConProducto.map(linea => {
        const producto = productos.find(p => p._id === linea.productoId)
        const precioCompraActual = producto?.precios?.compra || producto?.costes?.costeUltimo || 0
        const pvpSinIvaActual = producto?.precios?.venta || 0
        const iva = linea.iva || producto?.iva || 21

        const precioCompraNew = linea.precioUnitario
        const pvpSinIvaNew = linea.precioVenta || pvpSinIvaActual
        const pvpConIvaNew = pvpSinIvaNew * (1 + iva / 100)
        const margen = calcularMargen(precioCompraNew, pvpSinIvaNew)

        return {
          productoId: linea.productoId!,
          nombre: linea.nombre,
          iva,
          precioCompraActual,
          precioCompraNew,
          pvpSinIvaActual,
          pvpSinIvaNew,
          pvpConIvaNew,
          margenPct: margen.pct,
          margenEuro: margen.euro,
          enTarifas: [],
          enOfertas: [],
        }
      })
      setPreciosEditables(editables)
    } finally {
      setLoadingTarifasOfertas(false)
    }
  }

  // Actualizar un precio editable
  const updatePrecioEditable = (index: number, field: keyof PrecioEditable, value: number) => {
    setPreciosEditables(prev => {
      const updated = [...prev]
      const item = { ...updated[index] }

      if (field === 'pvpSinIvaNew') {
        item.pvpSinIvaNew = value
        item.pvpConIvaNew = value * (1 + item.iva / 100)
        const margen = calcularMargen(item.precioCompraNew, value)
        item.margenPct = margen.pct
        item.margenEuro = margen.euro
      } else if (field === 'pvpConIvaNew') {
        item.pvpConIvaNew = value
        item.pvpSinIvaNew = value / (1 + item.iva / 100)
        const margen = calcularMargen(item.precioCompraNew, item.pvpSinIvaNew)
        item.margenPct = margen.pct
        item.margenEuro = margen.euro
      } else if (field === 'margenPct') {
        item.margenPct = value
        item.pvpSinIvaNew = calcularPvpDesdeMargen(item.precioCompraNew, value)
        item.pvpConIvaNew = item.pvpSinIvaNew * (1 + item.iva / 100)
        item.margenEuro = item.pvpSinIvaNew - item.precioCompraNew
      }

      updated[index] = item
      return updated
    })
  }

  // Aplicar margen uniforme a todos los productos
  const aplicarMargenUniforme = () => {
    const margen = parseFloat(margenUniforme) || 0
    setPreciosEditables(prev => prev.map(item => {
      const pvpSinIvaNew = calcularPvpDesdeMargen(item.precioCompraNew, margen)
      const pvpConIvaNew = pvpSinIvaNew * (1 + item.iva / 100)
      return {
        ...item,
        pvpSinIvaNew,
        pvpConIvaNew,
        margenPct: margen,
        margenEuro: pvpSinIvaNew - item.precioCompraNew,
      }
    }))
    // Limpiar los estados de edición
    setEditingInputs({})
  }

  // Verificar si hay productos en tarifas u ofertas
  const hayProductosEnTarifas = preciosEditables.some(p => p.enTarifas.length > 0)
  const hayProductosEnOfertas = preciosEditables.some(p => p.enOfertas.length > 0)

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
      // Inicializar precios editables y abrir modal
      initializePreciosEditables()
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
    actualizarPrecioVenta: boolean,
    actualizarTarifas: boolean = false,
    actualizarOfertas: boolean = false
  ) => {
    setIsSubmitting(true)

    try {
      // Preparar datos de precios con los valores editados
      const preciosActualizados = preciosEditables.map(p => ({
        productoId: p.productoId,
        precioCompra: p.precioCompraNew,
        pvpSinIva: p.pvpSinIvaNew,
        pvpConIva: p.pvpConIvaNew,
        enTarifas: p.enTarifas,
        enOfertas: p.enOfertas,
      }))

      // Si se quieren actualizar precios, agregar la opcion al data
      const dataConOpciones = {
        ...data,
        actualizarPrecios: {
          precioCompra: actualizarPrecioCompra,
          precioVenta: actualizarPrecioVenta,
          actualizarTarifas,
          actualizarOfertas,
          precios: preciosActualizados,
        },
      }

      await onSubmit(dataConOpciones as CreatePresupuestoCompraDTO)
    } catch (error) {
      console.error('Error al guardar:', error)
    } finally {
      setIsSubmitting(false)
      setShowUpdatePricesDialog(false)
      setPendingSubmitData(null)
      // Reset estados
      setUpdatePrecioCompra(true)
      setUpdatePrecioVenta(false)
      setUpdateTarifas(false)
      setUpdateOfertas(false)
      setPreciosEditables([])
      setMargenUniforme(0)
    }
  }

  // Confirmar actualizacion de precios
  const handleConfirmUpdatePrices = () => {
    if (pendingSubmitData) {
      doSubmit(pendingSubmitData, updatePrecioCompra, updatePrecioVenta, updateTarifas, updateOfertas)
    }
  }

  // Cancelar y guardar sin actualizar precios
  const handleSkipUpdatePrices = () => {
    if (pendingSubmitData) {
      doSubmit(pendingSubmitData, false, false, false, false)
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
          <DocumentoLineasGrid
            moduloNombre="presupuestos-compra-lineas"
            lineas={lineas as any}
            esVenta={false}
            mostrarCostes={false}
            mostrarMargenes={false}
            productosOptions={productosOptions}
            onAddLinea={handleAddLinea}
            onUpdateLinea={handleUpdateLinea as any}
            onRemoveLinea={handleRemoveLinea}
            onDuplicateLinea={handleDuplicateLinea}
            onMoveLinea={handleMoveLinea}
            onProductoSelect={handleProductoChange}
            onNombreChange={handleNombreChange}
            cantidadRefs={cantidadRefs}
            productoRefs={productoRefs}
            onCantidadKeyDown={handleCantidadKeyDown as any}
            onCtrlEnterPress={handleAddLinea}
            onOpenDescripcionDialog={handleOpenDescripcionDialog}
          />
        </TabsContent>

        {/* Tab Condiciones */}
        <TabsContent value="condiciones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Condiciones de Pago</CardTitle>
              <CardDescription>Forma y términos de pago para este documento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forma de Pago</Label>
                  <SearchableSelect
                    options={formasPago.map(fp => ({
                      value: fp._id,
                      label: fp.nombre,
                      subtitle: fp.descripcion,
                    }))}
                    value={formData.condiciones?.formaPagoId || ''}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      condiciones: { ...prev.condiciones, formaPagoId: value }
                    }))}
                    placeholder="Seleccionar forma de pago..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Término de Pago</Label>
                  <SearchableSelect
                    options={terminosPago.map(tp => ({
                      value: tp._id,
                      label: tp.nombre,
                      subtitle: tp.descripcion || `${tp.diasVencimiento || 0} días`,
                    }))}
                    value={formData.condiciones?.terminoPagoId || ''}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      condiciones: { ...prev.condiciones, terminoPagoId: value }
                    }))}
                    placeholder="Seleccionar término de pago..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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

      {/* Dialogo mejorado para actualizar precios de productos */}
      <Dialog open={showUpdatePricesDialog} onOpenChange={setShowUpdatePricesDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Actualizar precios de productos
            </DialogTitle>
            <DialogDescription>
              Este documento contiene {lineasConProducto.length} producto(s). Configura qué precios actualizar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {loadingTarifasOfertas ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Cargando información...</span>
              </div>
            ) : (
              <>
                {/* Opciones principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Actualizar precio de compra */}
                  <div className={`flex items-center space-x-3 p-3 rounded-lg border ${!canModificarPrecioCompra() ? 'opacity-50' : 'bg-muted/30'}`}>
                    <Checkbox
                      id="updatePrecioCompra"
                      checked={updatePrecioCompra}
                      onCheckedChange={(checked) => setUpdatePrecioCompra(checked === true)}
                      disabled={!canModificarPrecioCompra()}
                    />
                    <div className="grid gap-1 leading-none">
                      <label htmlFor="updatePrecioCompra" className="text-sm font-medium">
                        Actualizar precio de compra
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Coste/precio de compra en el producto
                      </p>
                    </div>
                  </div>

                  {/* Actualizar PVP */}
                  <div className={`flex items-center space-x-3 p-3 rounded-lg border ${!canModificarPVP() ? 'opacity-50' : 'bg-muted/30'}`}>
                    <Checkbox
                      id="updatePrecioVenta"
                      checked={updatePrecioVenta}
                      onCheckedChange={(checked) => setUpdatePrecioVenta(checked === true)}
                      disabled={!canModificarPVP()}
                    />
                    <div className="grid gap-1 leading-none">
                      <label htmlFor="updatePrecioVenta" className="text-sm font-medium">
                        Actualizar PVP
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Precio de venta al público
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opciones de tarifas y ofertas */}
                {(hayProductosEnTarifas || hayProductosEnOfertas) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {hayProductosEnTarifas && (
                      <div className={`flex items-center space-x-3 p-3 rounded-lg border ${!canUpdate('tarifas') ? 'opacity-50' : 'bg-blue-50 border-blue-200'}`}>
                        <Checkbox
                          id="updateTarifas"
                          checked={updateTarifas}
                          onCheckedChange={(checked) => setUpdateTarifas(checked === true)}
                          disabled={!canUpdate('tarifas') || !updatePrecioVenta}
                        />
                        <div className="grid gap-1 leading-none">
                          <label htmlFor="updateTarifas" className="text-sm font-medium flex items-center gap-2">
                            <Tag className="h-4 w-4 text-blue-600" />
                            Actualizar en tarifas
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {preciosEditables.filter(p => p.enTarifas.length > 0).length} producto(s) en tarifas
                          </p>
                        </div>
                      </div>
                    )}

                    {hayProductosEnOfertas && (
                      <div className={`flex items-center space-x-3 p-3 rounded-lg border ${!canUpdate('ofertas') ? 'opacity-50' : 'bg-green-50 border-green-200'}`}>
                        <Checkbox
                          id="updateOfertas"
                          checked={updateOfertas}
                          onCheckedChange={(checked) => setUpdateOfertas(checked === true)}
                          disabled={!canUpdate('ofertas') || !updatePrecioVenta}
                        />
                        <div className="grid gap-1 leading-none">
                          <label htmlFor="updateOfertas" className="text-sm font-medium flex items-center gap-2">
                            <Percent className="h-4 w-4 text-green-600" />
                            Actualizar en ofertas
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {preciosEditables.filter(p => p.enOfertas.length > 0).length} producto(s) en ofertas
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Aplicar margen uniforme */}
                {updatePrecioVenta && canModificarPVP() && canVerMargenes() && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50 border-amber-200">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Aplicar margen uniforme</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="w-24 h-8 text-right"
                        value={margenUniforme}
                        onChange={(e) => setMargenUniforme(e.target.value.replace(/[^0-9.,\-]/g, ''))}
                        placeholder="0"
                      />
                      <span className="text-sm">%</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={aplicarMargenUniforme}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tabla de productos */}
                {(updatePrecioCompra || updatePrecioVenta) && preciosEditables.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Productos a actualizar:</p>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 sticky top-0">
                            <tr>
                              <th className="text-left p-2 font-medium">Producto</th>
                              {updatePrecioCompra && (
                                <>
                                  <th className="text-right p-2 font-medium w-24">P.Compra Act.</th>
                                  <th className="text-right p-2 font-medium w-24">P.Compra Nuevo</th>
                                </>
                              )}
                              {updatePrecioVenta && canModificarPVP() && (
                                <>
                                  <th className="text-right p-2 font-medium w-24">PVP s/IVA</th>
                                  <th className="text-center p-2 font-medium w-16">IVA</th>
                                  <th className="text-right p-2 font-medium w-28">PVP c/IVA</th>
                                  {canVerMargenes() && (
                                    <>
                                      <th className="text-right p-2 font-medium w-24">Margen %</th>
                                      <th className="text-right p-2 font-medium w-24">Margen €</th>
                                    </>
                                  )}
                                </>
                              )}
                              <th className="text-center p-2 font-medium w-16">Info</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {preciosEditables.map((item, idx) => (
                              <tr key={idx} className="hover:bg-muted/30">
                                <td className="p-2">
                                  <span className="truncate block max-w-[200px]" title={item.nombre}>
                                    {item.nombre}
                                  </span>
                                </td>
                                {updatePrecioCompra && (
                                  <>
                                    <td className="p-2 text-right text-muted-foreground">
                                      {formatCurrency(item.precioCompraActual)}
                                    </td>
                                    <td className="p-2 text-right font-medium">
                                      {formatCurrency(item.precioCompraNew)}
                                    </td>
                                  </>
                                )}
                                {updatePrecioVenta && canModificarPVP() && (
                                  <>
                                    <td className="p-2">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        className="w-full h-7 text-right text-sm"
                                        value={editingInputs[`pvpSinIva_${idx}`] ?? item.pvpSinIvaNew.toFixed(2)}
                                        onChange={(e) => setEditingInputs(prev => ({ ...prev, [`pvpSinIva_${idx}`]: e.target.value.replace(/[^0-9.,\-]/g, '') }))}
                                        onBlur={(e) => {
                                          const value = parseFloat(e.target.value.replace(',', '.')) || 0
                                          updatePrecioEditable(idx, 'pvpSinIvaNew', value)
                                          setEditingInputs(prev => { const n = {...prev}; delete n[`pvpSinIva_${idx}`]; return n })
                                        }}
                                      />
                                    </td>
                                    <td className="p-2 text-center text-xs text-muted-foreground">
                                      {item.iva}%
                                    </td>
                                    <td className="p-2">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        className="w-full h-7 text-right text-sm"
                                        value={editingInputs[`pvpConIva_${idx}`] ?? item.pvpConIvaNew.toFixed(2)}
                                        onChange={(e) => setEditingInputs(prev => ({ ...prev, [`pvpConIva_${idx}`]: e.target.value.replace(/[^0-9.,\-]/g, '') }))}
                                        onBlur={(e) => {
                                          const value = parseFloat(e.target.value.replace(',', '.')) || 0
                                          updatePrecioEditable(idx, 'pvpConIvaNew', value)
                                          setEditingInputs(prev => { const n = {...prev}; delete n[`pvpConIva_${idx}`]; return n })
                                        }}
                                      />
                                    </td>
                                    {canVerMargenes() && (
                                      <>
                                        <td className="p-2">
                                          <Input
                                            type="text"
                                            inputMode="decimal"
                                            className={`w-full h-7 text-right text-sm ${item.margenPct < 0 ? 'text-red-600' : item.margenPct > 30 ? 'text-green-600' : ''}`}
                                            value={editingInputs[`margenPct_${idx}`] ?? item.margenPct.toFixed(1)}
                                            onChange={(e) => setEditingInputs(prev => ({ ...prev, [`margenPct_${idx}`]: e.target.value.replace(/[^0-9.,\-]/g, '') }))}
                                            onBlur={(e) => {
                                              const value = parseFloat(e.target.value.replace(',', '.')) || 0
                                              updatePrecioEditable(idx, 'margenPct', value)
                                              setEditingInputs(prev => { const n = {...prev}; delete n[`margenPct_${idx}`]; return n })
                                            }}
                                          />
                                        </td>
                                        <td className={`p-2 text-right ${item.margenEuro < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                          {formatCurrency(item.margenEuro)}
                                        </td>
                                      </>
                                    )}
                                  </>
                                )}
                                <td className="p-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {item.enTarifas.length > 0 && (
                                      <Badge variant="outline" className="text-xs px-1">
                                        <Tag className="h-3 w-3 mr-1" />
                                        {item.enTarifas.length}
                                      </Badge>
                                    )}
                                    {item.enOfertas.length > 0 && (
                                      <Badge variant="outline" className="text-xs px-1 bg-green-50">
                                        <Percent className="h-3 w-3 mr-1" />
                                        {item.enOfertas.length}
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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

                {/* Aviso de permisos */}
                {(!canModificarPrecioCompra() || !canModificarPVP()) && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
                    <Info className="h-4 w-4" />
                    <span className="text-sm">
                      Algunas opciones están deshabilitadas por permisos de tu rol.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
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
              disabled={isSubmitting || (!updatePrecioCompra && !updatePrecioVenta) || loadingTarifasOfertas}
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

      {/* Dialogo para editar descripcion larga */}
      <Dialog open={showDescripcionDialog} onOpenChange={setShowDescripcionDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Editar Descripciones
            </DialogTitle>
            <DialogDescription>
              Modifica la descripción corta y larga del producto en esta línea
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="descripcionCorta">Descripción corta</Label>
              <Input
                id="descripcionCorta"
                value={descripcionEdit.corta}
                onChange={(e) => setDescripcionEdit(prev => ({ ...prev, corta: e.target.value }))}
                placeholder="Descripción breve del producto..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcionLarga">Descripción larga</Label>
              <Textarea
                id="descripcionLarga"
                value={descripcionEdit.larga}
                onChange={(e) => setDescripcionEdit(prev => ({ ...prev, larga: e.target.value }))}
                placeholder="Descripción detallada del producto..."
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDescripcionDialog(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveDescripcion}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
