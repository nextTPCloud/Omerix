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
  Search,
  Truck,
  Warehouse,
  Layers,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
  Settings,
  Tag,
  TrendingUp,
  Percent,
  Info,
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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  AlbaranCompra,
  CreateAlbaranCompraDTO,
  UpdateAlbaranCompraDTO,
  LineaAlbaranCompra,
  ESTADOS_ALBARAN_COMPRA,
  EstadoAlbaranCompra,
} from '@/types/albaran-compra.types'
import { proveedoresService } from '@/services/proveedores.service'
import { productosService } from '@/services/productos.service'
import { almacenesService } from '@/services/almacenes.service'
import { formasPagoService } from '@/services/formas-pago.service'
import { terminosPagoService } from '@/services/terminos-pago.service'
import { tarifasService } from '@/services/tarifas.service'
import { ofertasService } from '@/services/ofertas.service'
import { FormaPago } from '@/types/forma-pago.types'
import { TerminoPago } from '@/types/termino-pago.types'
import { SearchableSelect, EditableSearchableSelect } from '@/components/ui/searchable-select'
import { DateInput } from '@/components/ui/date-picker'
import { VarianteSelector, VarianteSeleccion } from '@/components/productos/VarianteSelector'
import { DocumentoLineasGrid } from '@/components/documentos/DocumentoLineasGrid'
import { Producto, Variante } from '@/types/producto.types'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { usePermissions } from '@/hooks/usePermissions'

// ============================================
// INTERFACES LOCALES
// ============================================

// Interfaz para componentes de kit en albaran de compra
interface IComponenteKitAlbaran {
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

// Interfaz para variante seleccionada
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
  descripcionLarga?: string
  sku?: string
  codigoProveedor?: string
  variante?: IVarianteSeleccionada
  componentesKit?: IComponenteKitAlbaran[]
  mostrarComponentes?: boolean
  cantidad: number
  cantidadRecibida: number
  unidad?: string
  peso?: number
  pesoTotal?: number
  precioUnitario: number
  descuento: number
  descuentoImporte: number
  subtotal: number
  iva: number
  ivaImporte: number
  total: number
  almacenId?: string
  lote?: string
  numeroSerie?: string
  esEditable: boolean
  incluidoEnTotal: boolean
  notasInternas?: string
  // Campos para actualización de precios
  precioVenta?: number
  margenPorcentaje?: number
  margenImporte?: number
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
}

interface AlmacenOption {
  _id: string
  nombre: string
  codigo?: string
}

interface AlbaranCompraFormProps {
  albaran?: AlbaranCompra
  onSubmit: (data: CreateAlbaranCompraDTO | UpdateAlbaranCompraDTO) => Promise<void>
  isEditing?: boolean
  defaultProveedorId?: string
}

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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function AlbaranCompraForm({
  albaran,
  onSubmit,
  isEditing = false,
  defaultProveedorId,
}: AlbaranCompraFormProps) {
  const router = useRouter()
  const { almacenDefaultId: userAlmacenDefault } = useUserPreferences()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('proveedor')

  // Datos del proveedor
  const [proveedorId, setProveedorId] = useState<string>(albaran?.proveedorId || defaultProveedorId || '')
  const [proveedorNombre, setProveedorNombre] = useState(albaran?.proveedorNombre || '')
  const [proveedorNif, setProveedorNif] = useState(albaran?.proveedorNif || '')
  const [proveedorEmail, setProveedorEmail] = useState(albaran?.proveedorEmail || '')
  const [proveedorTelefono, setProveedorTelefono] = useState(albaran?.proveedorTelefono || '')

  // Datos del albaran
  const [estado, setEstado] = useState<EstadoAlbaranCompra>(albaran?.estado || 'borrador')
  const [fecha, setFecha] = useState(albaran?.fecha?.split('T')[0] || new Date().toISOString().split('T')[0])
  const [fechaRecepcion, setFechaRecepcion] = useState(albaran?.fechaRecepcion?.split('T')[0] || '')
  const [albaranProveedor, setAlbaranProveedor] = useState(albaran?.albaranProveedor || '')
  const [titulo, setTitulo] = useState(albaran?.titulo || '')
  const [descripcion, setDescripcion] = useState(albaran?.descripcion || '')
  const [observaciones, setObservaciones] = useState(albaran?.observaciones || '')
  const [observacionesAlmacen, setObservacionesAlmacen] = useState(albaran?.observacionesAlmacen || '')

  // Condiciones
  const [formaPagoId, setFormaPagoId] = useState((albaran as any)?.condiciones?.formaPagoId || '')
  const [terminoPagoId, setTerminoPagoId] = useState((albaran as any)?.condiciones?.terminoPagoId || '')
  const [garantia, setGarantia] = useState((albaran as any)?.condiciones?.garantia || '')
  const [portesPagados, setPortesPagados] = useState((albaran as any)?.condiciones?.portesPagados ?? true)
  const [importePortes, setImportePortes] = useState((albaran as any)?.condiciones?.importePortes || 0)
  const [observacionesEntrega, setObservacionesEntrega] = useState((albaran as any)?.condiciones?.observacionesEntrega || '')

  // Almacen del documento (requerido)
  const [almacenId, setAlmacenId] = useState((albaran as any)?.almacenId || '')

  // Almacen por defecto para lineas nuevas
  const [almacenDefaultId, setAlmacenDefaultId] = useState('')

  // Descuento global
  const [descuentoGlobalPorcentaje, setDescuentoGlobalPorcentaje] = useState(albaran?.descuentoGlobalPorcentaje || 0)

  // Lineas
  const [lineas, setLineas] = useState<LineaFormulario[]>([])

  // Opciones para selects
  const [proveedores, setProveedores] = useState<ProveedorOption[]>([])
  const [productos, setProductos] = useState<ProductoOption[]>([])
  const [almacenes, setAlmacenes] = useState<AlmacenOption[]>([])
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])
  const [terminosPago, setTerminosPago] = useState<TerminoPago[]>([])
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
  const [pendingSubmitData, setPendingSubmitData] = useState<CreateAlbaranCompraDTO | UpdateAlbaranCompraDTO | null>(null)
  const [updatePrecioCompra, setUpdatePrecioCompra] = useState(true)
  const [updatePrecioVenta, setUpdatePrecioVenta] = useState(false)
  const [updateTarifas, setUpdateTarifas] = useState(false)
  const [updateOfertas, setUpdateOfertas] = useState(false)
  const [preciosEditables, setPreciosEditables] = useState<PrecioEditable[]>([])
  const [margenUniforme, setMargenUniforme] = useState<string>('')
  const [loadingTarifasOfertas, setLoadingTarifasOfertas] = useState(false)
  const [editingInputs, setEditingInputs] = useState<Record<string, string>>({})

  // Hook de permisos
  const {
    canModificarPVP,
    canModificarPrecioCompra,
    canUpdate,
    canVerMargenes,
  } = usePermissions()

  // Estado para dialogo de descripcion larga
  const [showDescripcionDialog, setShowDescripcionDialog] = useState(false)
  const [descripcionEditIndex, setDescripcionEditIndex] = useState<number | null>(null)
  const [descripcionEdit, setDescripcionEdit] = useState({ corta: '', larga: '' })

  // Lineas con productos (para actualizar precios)
  const lineasConProducto = lineas.filter(l => l.productoId && l.nombre)

  // ============================================
  // CARGAR DATOS INICIALES
  // ============================================

  useEffect(() => {
    cargarProveedores()
    cargarProductos()
    cargarAlmacenes()
    cargarFormasPago()
    cargarTerminosPago()
  }, [])

  useEffect(() => {
    if (albaran?.lineas) {
      const lineasConvertidas: LineaFormulario[] = albaran.lineas.map((l: any, idx: number) => ({
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
        cantidadRecibida: l.cantidadRecibida || 0,
        unidad: l.unidad || 'ud.',
        precioUnitario: l.precioUnitario || 0,
        descuento: l.descuento || 0,
        descuentoImporte: l.descuentoImporte || 0,
        subtotal: l.subtotal || 0,
        iva: l.iva || 21,
        ivaImporte: l.ivaImporte || 0,
        total: l.total || 0,
        almacenId: l.almacenId,
        lote: l.lote,
        numeroSerie: l.numeroSerie,
        esEditable: l.esEditable !== false,
        incluidoEnTotal: l.incluidoEnTotal !== false,
        notasInternas: l.notasInternas,
      }))
      setLineas(lineasConvertidas)
    }
  }, [albaran])

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

  const cargarAlmacenes = async () => {
    try {
      const response = await almacenesService.getAll({ activo: 'true' })
      if (response.success && response.data) {
        setAlmacenes(response.data)

        // Prioridad para almacén del documento:
        // 1. Almacén del albarán existente (si está editando)
        // 2. Preferencia del usuario
        // 3. Almacén principal
        // 4. Primer almacén disponible
        if (!albaran?.almacenId && !almacenId) {
          let defaultId = ''
          if (userAlmacenDefault) {
            // Verificar que el almacén de preferencias existe
            const existe = response.data.find((a: any) => a._id === userAlmacenDefault)
            if (existe) defaultId = userAlmacenDefault
          }
          if (!defaultId) {
            const almacenPrincipal = response.data.find((a: any) => a.esPrincipal)
            defaultId = almacenPrincipal?._id || response.data[0]?._id || ''
          }
          setAlmacenId(defaultId)
        }

        // Para líneas nuevas, usar la misma lógica
        const almacenDefault = response.data.find((a: any) => a.esPrincipal)
        if (almacenDefault) {
          setAlmacenDefaultId(almacenDefault._id)
        } else if (response.data.length > 0) {
          setAlmacenDefaultId(response.data[0]._id)
        }
      }
    } catch (error) {
      console.error('Error al cargar almacenes:', error)
    }
  }

  const cargarFormasPago = async () => {
    try {
      const response = await formasPagoService.getAll({ activo: true })
      if (response.success && response.data) {
        setFormasPago(response.data)
      }
    } catch (error) {
      console.error('Error al cargar formas de pago:', error)
    }
  }

  const cargarTerminosPago = async () => {
    try {
      const response = await terminosPagoService.getAll({ activo: true })
      if (response.success && response.data) {
        setTerminosPago(response.data)
      }
    } catch (error) {
      console.error('Error al cargar términos de pago:', error)
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
    // Para albaranes de compra, usar cantidadRecibida para los calculos
    const cantidadParaCalculo = linea.cantidadRecibida || linea.cantidad || 0
    const precioUnit = linea.precioUnitario || 0
    const descuentoPct = linea.descuento || 0
    const ivaPct = linea.iva || 0

    const subtotalBruto = cantidadParaCalculo * precioUnit
    const descuentoImporte = subtotalBruto * (descuentoPct / 100)
    const subtotal = subtotalBruto - descuentoImporte
    const ivaImporte = subtotal * (ivaPct / 100)
    const total = subtotal + ivaImporte

    // Calcular peso total de la linea (peso * cantidad recibida)
    const pesoTotal = (linea.peso || 0) * cantidadParaCalculo

    return {
      ...linea,
      descuentoImporte: Math.round(descuentoImporte * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      ivaImporte: Math.round(ivaImporte * 100) / 100,
      total: Math.round(total * 100) / 100,
      pesoTotal: Math.round(pesoTotal * 1000) / 1000, // 3 decimales para peso
    }
  }

  const agregarLinea = useCallback(() => {
    const newIndex = lineas.length
    const nuevaLinea: LineaFormulario = {
      orden: newIndex + 1,
      tipo: 'producto',
      nombre: '',
      cantidad: 1,
      cantidadRecibida: 0,
      unidad: 'ud.',
      precioUnitario: 0,
      descuento: 0,
      descuentoImporte: 0,
      subtotal: 0,
      iva: 21,
      ivaImporte: 0,
      total: 0,
      almacenId: almacenDefaultId,
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
  }, [lineas, almacenDefaultId])

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

  // Wrapper para adaptar a la interfaz de DocumentoLineasGrid
  const handleUpdateLinea = useCallback((index: number, updates: Partial<LineaFormulario> & { cantidadEntregada?: number }) => {
    const nuevasLineas = [...lineas]
    // Mapear cantidadEntregada del grid a cantidadRecibida del formulario
    const mappedUpdates: Partial<LineaFormulario> = { ...updates }
    if ('cantidadEntregada' in updates) {
      mappedUpdates.cantidadRecibida = updates.cantidadEntregada
      delete (mappedUpdates as any).cantidadEntregada
    }
    nuevasLineas[index] = { ...nuevasLineas[index], ...mappedUpdates }
    nuevasLineas[index] = calcularLinea(nuevasLineas[index])
    setLineas(nuevasLineas)
  }, [lineas])

  const handleMoveLinea = useCallback((index: number, direction: 'up' | 'down') => {
    moverLinea(index, direction === 'up' ? 'arriba' : 'abajo')
  }, [moverLinea])

  const handleDuplicateLinea = useCallback((index: number) => {
    const lineaDuplicada = { ...lineas[index], orden: lineas.length + 1 }
    setLineas([...lineas, lineaDuplicada])
  }, [lineas])

  const handleNombreChange = useCallback((index: number, nombre: string) => {
    actualizarLinea(index, 'nombre', nombre)
  }, [])

  // Handler para abrir dialogo de descripcion larga
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

  const seleccionarProducto = async (index: number, productoId: string) => {
    let producto = productos.find(p => p._id === productoId) as any
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
    let componentesKit: IComponenteKitAlbaran[] | undefined
    if (esKit && producto.componentesKit) {
      componentesKit = producto.componentesKit.map((comp: any) => {
        // productoId puede ser un objeto poblado o un string ID
        const productoInfo = typeof comp.productoId === 'object' ? comp.productoId : null
        const productoIdStr = typeof comp.productoId === 'object' ? comp.productoId._id : comp.productoId
        return {
          productoId: productoIdStr,
          nombre: productoInfo?.nombre || comp.nombre || '',
          sku: productoInfo?.sku || comp.sku || '',
          cantidad: comp.cantidad,
          precioUnitario: 0,
          costeUnitario: 0,
          descuento: 0,
          iva: producto.iva || 21,
          subtotal: 0,
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

    const nuevasLineas = [...lineas]
    nuevasLineas[index] = calcularLinea({
      ...nuevasLineas[index],
      productoId: producto._id,
      codigo: variante?.sku || producto.sku,
      nombre: nombreFinal,
      sku: variante?.sku || producto.sku,
      descripcion: producto.descripcionCorta,
      // Prioridad: coste de variante > coste ultimo > precio compra
      precioUnitario: variante?.costeUnitario ?? producto.costes?.costeUltimo ?? producto.precios?.compra ?? producto.precioCompra ?? 0,
      iva: producto.iva || 21,
      unidad: producto.unidadMedida || producto.unidad || 'ud.',
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
          nombre: `${productoConVariantes.nombre} - ${combinacionStr}`,
          descripcion: productoConVariantes.descripcionCorta,
          sku: variante.sku,
          cantidad: variante.cantidad || 1,
          cantidadRecibida: 0,
          unidad: (productoConVariantes as any).unidadMedida || 'ud.',
          precioUnitario: variante.costeUnitario,
          descuento: 0,
          descuentoImporte: 0,
          subtotal: 0,
          iva: productoConVariantes.iva || 21,
          ivaImporte: 0,
          total: 0,
          almacenId: almacenDefaultId,
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
  // CALCULOS DE TOTALES
  // ============================================

  const calcularTotales = useCallback(() => {
    const lineasIncluidas = lineas.filter(l => l.incluidoEnTotal && (l.tipo === 'producto' || l.tipo === 'kit'))

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
    const totalAlbaran = subtotalConDescuento + totalIva

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
      totalAlbaran: Math.round(totalAlbaran * 100) / 100,
      descuentoGlobalImporte: Math.round(descuentoGlobalImporte * 100) / 100,
    }
  }, [lineas, descuentoGlobalPorcentaje])

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
  const prepareSubmitData = (): CreateAlbaranCompraDTO | UpdateAlbaranCompraDTO => {
    return {
      estado,
      fecha,
      fechaRecepcion: fechaRecepcion || undefined,
      almacenId,
      proveedorId,
      proveedorNombre,
      proveedorNif,
      proveedorEmail: proveedorEmail || undefined,
      proveedorTelefono: proveedorTelefono || undefined,
      albaranProveedor: albaranProveedor || undefined,
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
        variante: l.variante as any,
        componentesKit: l.componentesKit as any,
        mostrarComponentes: l.mostrarComponentes,
        cantidad: l.cantidad,
        cantidadRecibida: l.cantidadRecibida,
        unidad: l.unidad,
        precioUnitario: l.precioUnitario,
        descuento: l.descuento,
        descuentoImporte: l.descuentoImporte,
        subtotal: l.subtotal,
        iva: l.iva,
        ivaImporte: l.ivaImporte,
        total: l.total,
        almacenId: l.almacenId,
        lote: l.lote,
        numeroSerie: l.numeroSerie,
        esEditable: l.esEditable,
        incluidoEnTotal: l.incluidoEnTotal,
        notasInternas: l.notasInternas,
        precioVenta: l.precioVenta,
      })),
      totales: {
        subtotalBruto: totales.subtotalBruto,
        totalDescuentos: totales.totalDescuentos,
        subtotalNeto: totales.subtotalNeto,
        desgloseIva: totales.desgloseIva,
        totalIva: totales.totalIva,
        totalAlbaran: totales.totalAlbaran,
      },
      descuentoGlobalPorcentaje,
      descuentoGlobalImporte: totales.descuentoGlobalImporte,
      observaciones: observaciones || undefined,
      observacionesAlmacen: observacionesAlmacen || undefined,
      condiciones: {
        formaPagoId: formaPagoId || undefined,
        terminoPagoId: terminoPagoId || undefined,
        garantia: garantia || undefined,
        portesPagados,
        importePortes: portesPagados ? 0 : importePortes,
        observacionesEntrega: observacionesEntrega || undefined,
      },
    } as any
  }

  // ============================================
  // FUNCIONES PARA GESTIÓN DE PRECIOS
  // ============================================

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
        const producto = productos.find(p => p._id === linea.productoId) as any
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
        const producto = productos.find(p => p._id === linea.productoId) as any
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

  // Ejecutar el submit (con o sin actualización de precios)
  const doSubmit = async (
    data: CreateAlbaranCompraDTO | UpdateAlbaranCompraDTO,
    actualizarPrecioCompra: boolean,
    actualizarPrecioVenta: boolean,
    actualizarTarifas: boolean = false,
    actualizarOfertas: boolean = false
  ) => {
    setIsLoading(true)

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

      await onSubmit(dataConOpciones as CreateAlbaranCompraDTO)
    } catch (error) {
      // Error manejado en el componente padre
    } finally {
      setIsLoading(false)
      setShowUpdatePricesDialog(false)
      setPendingSubmitData(null)
      // Reset estados
      setUpdatePrecioCompra(true)
      setUpdatePrecioVenta(false)
      setUpdateTarifas(false)
      setUpdateOfertas(false)
      setPreciosEditables([])
      setMargenUniforme('')
    }
  }

  // Confirmar actualización de precios
  const handleConfirmUpdatePrices = () => {
    if (pendingSubmitData) {
      doSubmit(pendingSubmitData, updatePrecioCompra, updatePrecioVenta, updateTarifas, updateOfertas)
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

    if (!almacenId) {
      toast.error('Debes seleccionar un almacén de destino')
      setActiveTab('proveedor')
      return
    }

    if (lineas.length === 0) {
      toast.error('Debes agregar al menos una linea')
      setActiveTab('lineas')
      return
    }

    const lineasInvalidas = lineas.filter(l => (l.tipo === 'producto' || l.tipo === 'kit') && (!l.nombre || l.cantidad <= 0))
    if (lineasInvalidas.length > 0) {
      toast.error('Hay lineas sin producto o con cantidad invalida')
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
    await doSubmit(data, false, false, false, false)
  }

  const handleSubmitLegacy = async () => {
    try {
      setIsLoading(true)
      const data = prepareSubmitData()
      await onSubmit(data)
    } catch (error) {
      // Error manejado en el componente padre
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="recepcion" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            <span className="hidden sm:inline">Recepcion</span>
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
              <FileText className="h-5 w-5 text-primary" />
              Datos del Albaran
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Estado</Label>
                <Select value={estado} onValueChange={(v) => setEstado(v as EstadoAlbaranCompra)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_ALBARAN_COMPRA.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fecha *</Label>
                <DateInput
                  value={fecha}
                  onChange={(value) => setFecha(value)}
                />
              </div>

              <div>
                <Label>Fecha Recepcion</Label>
                <DateInput
                  value={fechaRecepcion}
                  onChange={(value) => setFechaRecepcion(value)}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  Almacén Destino *
                </Label>
                <SearchableSelect
                  options={almacenes.map(a => ({
                    value: a._id,
                    label: a.nombre,
                    description: a.codigo || undefined,
                  }))}
                  value={almacenId}
                  onValueChange={setAlmacenId}
                  placeholder="Seleccionar almacén..."
                  searchPlaceholder="Buscar almacén..."
                  emptyMessage="No hay almacenes disponibles"
                />
              </div>

              <div>
                <Label>Albaran del Proveedor</Label>
                <Input
                  value={albaranProveedor}
                  onChange={(e) => setAlbaranProveedor(e.target.value)}
                  placeholder="Numero de albaran del proveedor"
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
                  placeholder="Descripcion del albaran"
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
          <DocumentoLineasGrid
            moduloNombre="albaranes-compra-lineas"
            lineas={lineas.map(l => ({ ...l, cantidadEntregada: l.cantidadRecibida, cantidadSolicitada: l.cantidad })) as any || []}
            esVenta={false}
            esAlbaran={true}
            mostrarCostes={false}
            mostrarMargenes={false}
            productosOptions={productos.map(p => ({ value: p._id, label: p.nombre }))}
            onAddLinea={agregarLinea}
            onUpdateLinea={handleUpdateLinea as any}
            onRemoveLinea={eliminarLinea}
            onDuplicateLinea={handleDuplicateLinea}
            onMoveLinea={handleMoveLinea}
            onProductoSelect={seleccionarProducto}
            onNombreChange={handleNombreChange}
            onOpenDescripcionDialog={handleOpenDescripcionDialog}
            productoRefs={productoRefs}
            cantidadRefs={cantidadRefs}
            onCantidadKeyDown={handleCantidadKeyDown}
            onCtrlEnterPress={agregarLinea}
          />

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
                  <p className="text-xl font-bold text-primary">Total: {formatCurrency(totales.totalAlbaran)}</p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB RECEPCION */}
        {/* ============================================ */}
        <TabsContent value="recepcion" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-primary" />
              Control de Recepcion
            </h3>

            {lineas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Agrega lineas en la pestana "Lineas" para gestionar la recepcion</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad Pedida</TableHead>
                      <TableHead className="text-right">Cantidad Recibida</TableHead>
                      <TableHead className="text-right">Pendiente</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>N. Serie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineas.filter(l => l.tipo === 'producto').map((linea, index) => {
                      const pendiente = linea.cantidad - linea.cantidadRecibida
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{linea.nombre}</p>
                              {linea.sku && <p className="text-xs text-muted-foreground">SKU: {linea.sku}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{linea.cantidad}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={linea.cantidad}
                              value={linea.cantidadRecibida}
                              onChange={(e) => {
                                const lineaIndex = lineas.findIndex(l => l === linea)
                                actualizarLinea(lineaIndex, 'cantidadRecibida', parseFloat(e.target.value) || 0)
                              }}
                              className="w-[80px] text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className={`text-right ${pendiente > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {pendiente}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={linea.lote || ''}
                              onChange={(e) => {
                                const lineaIndex = lineas.findIndex(l => l === linea)
                                actualizarLinea(lineaIndex, 'lote', e.target.value)
                              }}
                              placeholder="Lote"
                              className="w-[100px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={linea.numeroSerie || ''}
                              onChange={(e) => {
                                const lineaIndex = lineas.findIndex(l => l === linea)
                                actualizarLinea(lineaIndex, 'numeroSerie', e.target.value)
                              }}
                              placeholder="N. Serie"
                              className="w-[100px]"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Observaciones de Almacen</h3>
            <Textarea
              value={observacionesAlmacen}
              onChange={(e) => setObservacionesAlmacen(e.target.value)}
              placeholder="Notas para el almacen (incidencias en la recepcion, etc.)"
              rows={3}
            />
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB CONDICIONES */}
        {/* ============================================ */}
        <TabsContent value="condiciones" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Condiciones de Pago y Entrega
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Forma de Pago</Label>
                <SearchableSelect
                  options={formasPago.map(fp => ({
                    value: fp._id,
                    label: fp.nombre,
                    sublabel: fp.descripcion,
                  }))}
                  value={formaPagoId}
                  onValueChange={(value) => setFormaPagoId(value)}
                  placeholder="Seleccionar forma de pago..."
                />
              </div>

              <div>
                <Label>Termino de Pago</Label>
                <SearchableSelect
                  options={terminosPago.map(tp => ({
                    value: tp._id,
                    label: tp.nombre,
                    sublabel: tp.descripcion || `${tp.diasVencimiento || 0} dias`,
                  }))}
                  value={terminoPagoId}
                  onValueChange={(value) => setTerminoPagoId(value)}
                  placeholder="Seleccionar termino de pago..."
                />
              </div>

              <div>
                <Label>Garantia</Label>
                <Input
                  value={garantia}
                  onChange={(e) => setGarantia(e.target.value)}
                  placeholder="Ej: 2 anos, 6 meses..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Portes</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="portes-pagados"
                      checked={portesPagados}
                      onCheckedChange={setPortesPagados}
                    />
                    <Label htmlFor="portes-pagados" className="font-normal cursor-pointer">
                      Portes pagados
                    </Label>
                  </div>
                  {!portesPagados && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={importePortes}
                        onChange={(e) => setImportePortes(parseFloat(e.target.value) || 0)}
                        placeholder="Importe"
                        className="w-[120px]"
                      />
                      <span className="text-sm text-muted-foreground">EUR</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Observaciones de Entrega</Label>
                <Textarea
                  value={observacionesEntrega}
                  onChange={(e) => setObservacionesEntrega(e.target.value)}
                  placeholder="Instrucciones especiales de entrega, horarios, contacto..."
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB RESUMEN */}
        {/* ============================================ */}
        <TabsContent value="resumen" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resumen del albaran */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Resumen del Albaran
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proveedor</span>
                  <span className="font-medium">{proveedorNombre || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha</span>
                  <span className="font-medium">
                    {fecha ? new Date(fecha).toLocaleDateString('es-ES') : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Albaran Proveedor</span>
                  <span className="font-medium">{albaranProveedor || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge className={`text-white ${ESTADOS_ALBARAN_COMPRA.find(e => e.value === estado)?.color || ''}`}>
                    {ESTADOS_ALBARAN_COMPRA.find(e => e.value === estado)?.label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lineas</span>
                  <span className="font-medium">{lineas.length}</span>
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
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(totales.totalAlbaran)}</span>
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
              placeholder="Observaciones generales del albaran"
              rows={3}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Barra de acciones */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {lineas.length} linea(s) | Total: <span className="font-bold text-primary">{formatCurrency(totales.totalAlbaran)}</span>
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
                  {isEditing ? 'Actualizar' : 'Crear'} Albaran
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
              disabled={isLoading}
            >
              Guardar sin actualizar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmUpdatePrices}
              disabled={isLoading || (!updatePrecioCompra && !updatePrecioVenta) || loadingTarifasOfertas}
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

      {/* Dialogo para editar descripcion larga */}
      <Dialog open={showDescripcionDialog} onOpenChange={setShowDescripcionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Descripciones</DialogTitle>
            <DialogDescription>
              Modifica la descripción corta y larga del producto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Descripción Corta</Label>
              <Input
                value={descripcionEdit.corta}
                onChange={(e) => setDescripcionEdit(prev => ({ ...prev, corta: e.target.value }))}
                placeholder="Descripción breve del producto"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción Larga</Label>
              <Textarea
                value={descripcionEdit.larga}
                onChange={(e) => setDescripcionEdit(prev => ({ ...prev, larga: e.target.value }))}
                rows={4}
                placeholder="Descripción detallada, especificaciones, características..."
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
    </div>
  )
}
