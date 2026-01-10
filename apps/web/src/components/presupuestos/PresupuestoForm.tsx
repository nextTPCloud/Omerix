'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  IPresupuesto,
  CreatePresupuestoDTO,
  UpdatePresupuestoDTO,
  ILineaPresupuesto,
  IComponenteKit,
  IDireccionEntrega,
  ICondicionesComerciales,
  TipoLinea,
  EstadoPresupuesto,
  ESTADOS_PRESUPUESTO,
  TIPOS_LINEA,
  TIPOS_IVA,
  calcularLinea,
  crearLineaVacia,
} from '@/types/presupuesto.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  FileText,
  Save,
  User,
  MapPin,
  ShoppingCart,
  Settings,
  Calculator,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  ArrowUp,
  ArrowDown,
  Percent,
  Package,
  ChevronDown,
  ChevronRight,
  Import,
  GripVertical,
  Layers,
  Check,
  AlignLeft,
  Tag,
} from 'lucide-react'

// Components
import { SearchableSelect, EditableSearchableSelect } from '@/components/ui/searchable-select'
import { FullCreateCliente, FullCreateAgenteComercial, FullCreateProyecto } from '@/components/full-create'
import { DateInput } from '@/components/ui/date-picker'
import { DocumentoLineasGrid } from '@/components/documentos'

// Services
import { clientesService } from '@/services/clientes.service'
import { agentesService } from '@/services/agentes-comerciales.service'
import { proyectosService } from '@/services/proyectos.service'
import { productosService } from '@/services/productos.service'
import { presupuestosService } from '@/services/presupuestos.service'
import { formasPagoService } from '@/services/formas-pago.service'
import { terminosPagoService } from '@/services/terminos-pago.service'
import { seriesDocumentosService } from '@/services/series-documentos.service'
import { preciosService, IPrecioCalculado } from '@/services/precios.service'
import { empresaService } from '@/services/empresa.service'
import { ISerieDocumento } from '@/types/serie-documento.types'

// Types
import { Cliente, DireccionExtendida } from '@/types/cliente.types'
import { AgenteComercial } from '@/types/agente-comercial.types'
import { IProyecto } from '@/types/proyecto.types'
import { Producto, Variante } from '@/types/producto.types'
import { FormaPago } from '@/types/forma-pago.types'
import { TerminoPago } from '@/types/termino-pago.types'
import { toast } from 'sonner'

// Variantes
import { VarianteSelector, VarianteSeleccion } from '@/components/productos/VarianteSelector'

// Permisos
import { usePermissions } from '@/hooks/usePermissions'

interface PresupuestoFormProps {
  initialData?: IPresupuesto
  onSubmit: (data: CreatePresupuestoDTO | UpdatePresupuestoDTO) => Promise<void>
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

export function PresupuestoForm({
  initialData,
  onSubmit,
  isLoading = false,
  mode = 'create',
}: PresupuestoFormProps) {
  const [activeTab, setActiveTab] = useState('cliente')

  // Permisos del usuario
  const {
    canVerCostes,
    canVerMargenes,
    canModificarPVP,
    canAplicarDescuentos,
    getDescuentoMaximo,
  } = usePermissions()

  // Opciones cargadas
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [agentes, setAgentes] = useState<AgenteComercial[]>([])
  const [proyectos, setProyectos] = useState<IProyecto[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])
  const [terminosPago, setTerminosPago] = useState<TerminoPago[]>([])
  const [seriesDocumentos, setSeriesDocumentos] = useState<ISerieDocumento[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingProductos, setLoadingProductos] = useState(false)

  // Direcciones del cliente seleccionado
  const [direccionesCliente, setDireccionesCliente] = useState<DireccionExtendida[]>([])

  // Estado de visibilidad de costes (controlado por permisos)
  const [mostrarCostesUI, setMostrarCostesUI] = useState(true)
  // Solo mostrar costes si el usuario tiene permiso Y el toggle está activo
  const mostrarCostes = canVerCostes() && mostrarCostesUI
  // Solo mostrar márgenes si el usuario tiene permiso Y se muestran costes
  const mostrarMargenes = canVerMargenes() && mostrarCostes

  // Referencias para inputs (para navegación con teclado)
  const cantidadRefs = React.useRef<Map<number, HTMLInputElement>>(new Map())
  const productoRefs = React.useRef<Map<number, HTMLInputElement>>(new Map())

  // Diálogos
  const [showMargenDialog, setShowMargenDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showCreateCliente, setShowCreateCliente] = useState(false)
  const [showCreateAgente, setShowCreateAgente] = useState(false)
  const [showCreateProyecto, setShowCreateProyecto] = useState(false)
  const [showDescripcionDialog, setShowDescripcionDialog] = useState(false)
  const [descripcionEditIndex, setDescripcionEditIndex] = useState<number | null>(null)
  const [descripcionEdit, setDescripcionEdit] = useState({ corta: '', larga: '' })
  const [margenConfig, setMargenConfig] = useState({
    tipo: 'porcentaje' as 'porcentaje' | 'importe',
    valor: 0,
    aplicarA: 'todas' as 'todas' | 'productos' | 'servicios',
    sobreCoste: true,
  })

  // Configuración de decimales de la empresa
  const [decimalesConfig, setDecimalesConfig] = useState({
    precios: 2,
    cantidad: 2,
  })

  // Función helper para redondear precios según configuración de empresa
  const redondearPrecio = useCallback((valor: number): number => {
    const factor = Math.pow(10, decimalesConfig.precios)
    return Math.round(valor * factor) / factor
  }, [decimalesConfig.precios])

  // Estado para selector de variantes
  const [varianteSelectorOpen, setVarianteSelectorOpen] = useState(false)
  const [productoConVariantes, setProductoConVariantes] = useState<Producto | null>(null)
  const [lineaIndexParaVariante, setLineaIndexParaVariante] = useState<number | null>(null)

  // Estado del formulario
  const [formData, setFormData] = useState<CreatePresupuestoDTO>({
    clienteId: '',
    clienteNombre: '',
    clienteNif: '',
    estado: EstadoPresupuesto.BORRADOR,
    fecha: new Date().toISOString().split('T')[0],
    fechaValidez: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lineas: [],
    condiciones: {
      validezDias: 30,
      portesPagados: false,
    },
    descuentoGlobalPorcentaje: 0,
    mostrarCostes: true,
    mostrarMargenes: true,
    mostrarComponentesKit: true,
  })

  // Totales calculados
  const [totales, setTotales] = useState({
    subtotalBruto: 0,
    totalDescuentos: 0,
    subtotalNeto: 0,
    totalIva: 0,
    totalPresupuesto: 0,
    costeTotal: 0,
    margenBruto: 0,
    margenPorcentaje: 0,
  })

  // Cargar opciones al montar
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true)
        const [clientesRes, agentesRes, proyectosRes, productosRes, formasPagoRes, terminosPagoRes, seriesRes, empresaRes] = await Promise.all([
          clientesService.getAll({ activo: true, limit: 100 }),
          agentesService.getAll({ activo: true, limit: 100 }),
          proyectosService.getAll({ activo: 'true', limit: 100 }),
          productosService.getAll({ activo: true, limit: 100 }),
          formasPagoService.getActivas().catch(() => ({ success: true, data: [] })),
          terminosPagoService.getAll({ activo: 'true', limit: 100 }).catch(() => ({ success: true, data: [] })),
          seriesDocumentosService.getByTipoDocumento('presupuesto', true).catch(() => ({ success: true, data: [] })),
          empresaService.getMiEmpresa().catch(() => ({ success: false, data: undefined })),
        ])

        console.log('Respuestas cargadas:', { clientesRes, agentesRes, proyectosRes, productosRes })

        if (clientesRes.success) setClientes(clientesRes.data || [])
        if (agentesRes.success) setAgentes(agentesRes.data || [])
        if (proyectosRes.success) setProyectos(proyectosRes.data || [])
        if (productosRes.success) setProductos(productosRes.data || [])
        if (formasPagoRes.success) setFormasPago(formasPagoRes.data || [])
        if (terminosPagoRes.success) setTerminosPago(terminosPagoRes.data || [])

        // Cargar configuración de decimales de la empresa
        if (empresaRes.success && empresaRes.data) {
          setDecimalesConfig({
            precios: empresaRes.data.decimalesPrecios ?? 2,
            cantidad: empresaRes.data.decimalesCantidad ?? 2,
          })
        }
        if (seriesRes.success) {
          setSeriesDocumentos(seriesRes.data || [])
          // Si hay una serie predeterminada y es modo creación, seleccionarla automáticamente
          if (mode === 'create') {
            const seriePredeterminada = seriesRes.data?.find((s: ISerieDocumento) => s.predeterminada)
            if (seriePredeterminada) {
              // Cargar el código sugerido para la serie predeterminada
              try {
                const codigoRes = await seriesDocumentosService.sugerirCodigo('presupuesto', seriePredeterminada._id)
                if (codigoRes.success && codigoRes.data?.codigo) {
                  setFormData(prev => ({
                    ...prev,
                    serieId: seriePredeterminada._id,
                    serie: seriePredeterminada.codigo,
                    codigo: codigoRes.data!.codigo,
                  }))
                }
              } catch (error) {
                console.error('Error al sugerir código:', error)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error cargando opciones:', error)
        toast.error('Error al cargar las opciones')
      } finally {
        setLoadingOptions(false)
      }
    }
    loadOptions()
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    if (initialData) {
      const clienteId = typeof initialData.clienteId === 'object'
        ? initialData.clienteId._id
        : initialData.clienteId

      const agenteId = typeof initialData.agenteComercialId === 'object'
        ? initialData.agenteComercialId._id
        : initialData.agenteComercialId

      const proyectoId = typeof initialData.proyectoId === 'object'
        ? initialData.proyectoId._id
        : initialData.proyectoId

      // Extraer IDs de condiciones si vienen como objetos poblados
      const formaPagoId = initialData.condiciones?.formaPagoId
        ? (typeof initialData.condiciones.formaPagoId === 'object'
          ? (initialData.condiciones.formaPagoId as any)._id
          : initialData.condiciones.formaPagoId)
        : undefined

      const terminoPagoId = initialData.condiciones?.terminoPagoId
        ? (typeof initialData.condiciones.terminoPagoId === 'object'
          ? (initialData.condiciones.terminoPagoId as any)._id
          : initialData.condiciones.terminoPagoId)
        : undefined

      setFormData({
        codigo: initialData.codigo,
        serie: initialData.serie,
        estado: initialData.estado,
        fecha: new Date(initialData.fecha).toISOString().split('T')[0],
        fechaValidez: new Date(initialData.fechaValidez).toISOString().split('T')[0],
        clienteId,
        clienteNombre: initialData.clienteNombre,
        clienteNif: initialData.clienteNif,
        clienteEmail: initialData.clienteEmail,
        clienteTelefono: initialData.clienteTelefono,
        direccionFacturacion: initialData.direccionFacturacion,
        direccionEntrega: initialData.direccionEntrega,
        fechaEntregaPrevista: initialData.fechaEntregaPrevista
          ? new Date(initialData.fechaEntregaPrevista).toISOString().split('T')[0]
          : undefined,
        proyectoId,
        agenteComercialId: agenteId,
        referenciaCliente: initialData.referenciaCliente,
        pedidoCliente: initialData.pedidoCliente,
        titulo: initialData.titulo,
        descripcion: initialData.descripcion,
        lineas: initialData.lineas || [],
        condiciones: {
          ...initialData.condiciones,
          formaPagoId,
          terminoPagoId,
        },
        descuentoGlobalPorcentaje: initialData.descuentoGlobalPorcentaje || 0,
        introduccion: initialData.introduccion,
        piePagina: initialData.piePagina,
        condicionesLegales: initialData.condicionesLegales,
        observaciones: initialData.observaciones,
        tags: initialData.tags,
        mostrarCostes: initialData.mostrarCostes,
        mostrarMargenes: initialData.mostrarMargenes,
        mostrarComponentesKit: initialData.mostrarComponentesKit,
      })

      setMostrarCostesUI(initialData.mostrarCostes !== false)

      // Cargar direcciones del cliente si viene preseleccionado
      if (clienteId) {
        const cliente = clientes.find(c => c._id === clienteId)
        if (cliente?.direcciones) {
          setDireccionesCliente(cliente.direcciones)
        }
      }
    }
  }, [initialData, clientes])

  // Recalcular totales cuando cambian las líneas
  useEffect(() => {
    const lineas = formData.lineas || []
    const descuentoGlobal = formData.descuentoGlobalPorcentaje || 0

    let subtotalBruto = 0
    let totalDescuentos = 0
    let subtotalNeto = 0
    let totalIva = 0
    let costeTotal = 0

    lineas.forEach(linea => {
      if (linea.incluidoEnTotal !== false) {
        const calculada = calcularLinea(linea)
        subtotalBruto += calculada.cantidad * calculada.precioUnitario
        totalDescuentos += calculada.descuentoImporte
        subtotalNeto += calculada.subtotal
        totalIva += calculada.ivaImporte
        costeTotal += calculada.costeTotalLinea
      }
    })

    // Aplicar descuento global
    const descuentoGlobalImporte = subtotalNeto * (descuentoGlobal / 100)
    subtotalNeto -= descuentoGlobalImporte
    totalDescuentos += descuentoGlobalImporte

    const totalPresupuesto = subtotalNeto + totalIva
    const margenBruto = subtotalNeto - costeTotal
    const margenPorcentaje = costeTotal > 0 ? (margenBruto / costeTotal) * 100 : 0

    setTotales({
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round(totalDescuentos * 100) / 100,
      subtotalNeto: Math.round(subtotalNeto * 100) / 100,
      totalIva: Math.round(totalIva * 100) / 100,
      totalPresupuesto: Math.round(totalPresupuesto * 100) / 100,
      costeTotal: Math.round(costeTotal * 100) / 100,
      margenBruto: Math.round(margenBruto * 100) / 100,
      margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
    })
  }, [formData.lineas, formData.descuentoGlobalPorcentaje])

  // Opciones para SearchableSelect
  const clientesOptions = React.useMemo(() => {
    return clientes.map((cliente) => ({
      value: cliente._id,
      label: cliente.nombre,
      description: `${cliente.codigo} - ${cliente.nif}`,
    }))
  }, [clientes])

  const agentesOptions = React.useMemo(() => {
    return agentes.map((agente) => ({
      value: agente._id,
      label: `${agente.nombre} ${agente.apellidos || ''}`.trim(),
      description: agente.codigo,
    }))
  }, [agentes])

  const proyectosOptions = React.useMemo(() => {
    return proyectos.map((proyecto) => ({
      value: proyecto._id,
      label: proyecto.nombre,
      description: proyecto.codigo,
    }))
  }, [proyectos])

  const productosOptions = React.useMemo(() => {
    console.log('Generando productosOptions, productos:', productos.length)
    return productos.map((producto) => ({
      value: producto._id,
      label: producto.nombre,
      description: `${producto.sku || ''} - ${producto.precios?.venta?.toFixed(2) || '0.00'}€`,
    }))
  }, [productos])

  const direccionesOptions = React.useMemo(() => {
    return direccionesCliente.map((dir, index) => ({
      value: index.toString(),
      label: dir.tipo ? `${dir.tipo.charAt(0).toUpperCase() + dir.tipo.slice(1)}` : `Dirección ${index + 1}`,
      description: `${dir.calle || ''} ${dir.numero || ''}, ${dir.codigoPostal || ''} ${dir.ciudad || ''}`.trim(),
    }))
  }, [direccionesCliente])

  const formasPagoOptions = React.useMemo(() => {
    return formasPago.map((fp) => ({
      value: fp._id,
      label: fp.nombre,
      description: fp.descripcion || fp.tipo,
    }))
  }, [formasPago])

  const terminosPagoOptions = React.useMemo(() => {
    return terminosPago.map((tp) => ({
      value: tp._id,
      label: tp.nombre,
      description: tp.resumenVencimientos || tp.descripcion,
    }))
  }, [terminosPago])

  const seriesOptions = React.useMemo(() => {
    return seriesDocumentos.map((serie) => ({
      value: serie._id,
      label: serie.codigo,
      description: `${serie.nombre}${serie.predeterminada ? ' (Predeterminada)' : ''}`,
    }))
  }, [seriesDocumentos])

  // Handler para cambio de serie
  const handleSerieChange = async (serieId: string) => {
    const serie = seriesDocumentos.find(s => s._id === serieId)
    if (serie) {
      try {
        const codigoRes = await seriesDocumentosService.sugerirCodigo('presupuesto', serieId)
        if (codigoRes.success && codigoRes.data?.codigo) {
          setFormData(prev => ({
            ...prev,
            serieId: serieId,
            serie: serie.codigo,
            codigo: codigoRes.data!.codigo,
          }))
        } else {
          setFormData(prev => ({
            ...prev,
            serieId: serieId,
            serie: serie.codigo,
          }))
        }
      } catch (error) {
        console.error('Error al sugerir código:', error)
        setFormData(prev => ({
          ...prev,
          serieId: serieId,
          serie: serie.codigo,
        }))
      }
    }
  }

  // Handlers para cuando se crea un nuevo elemento
  const handleClienteCreated = (newCliente: { _id: string; codigo: string; nombre: string; nif: string }) => {
    setClientes(prev => [...prev, { ...newCliente, activo: true } as Cliente])
    setFormData(prev => ({
      ...prev,
      clienteId: newCliente._id,
      clienteNombre: newCliente.nombre,
      clienteNif: newCliente.nif,
    }))
  }

  const handleAgenteCreated = (newAgente: { _id: string; codigo: string; nombre: string; apellidos?: string }) => {
    setAgentes(prev => [...prev, { ...newAgente, activo: true } as AgenteComercial])
    setFormData(prev => ({ ...prev, agenteComercialId: newAgente._id }))
  }

  const handleProyectoCreated = (newProyecto: { _id: string; codigo: string; nombre: string }) => {
    setProyectos(prev => [...prev, { ...newProyecto, activo: true } as IProyecto])
    setFormData(prev => ({ ...prev, proyectoId: newProyecto._id }))
  }

  // Handlers
  const handleClienteChange = (clienteId: string) => {
    const cliente = clientes.find(c => c._id === clienteId)
    if (cliente) {
      // Obtener ID de forma de pago y término de pago del cliente
      const formaPagoIdCliente = typeof cliente.formaPagoId === 'object'
        ? (cliente.formaPagoId as any)?._id
        : cliente.formaPagoId
      const terminoPagoIdCliente = typeof cliente.terminoPagoId === 'object'
        ? (cliente.terminoPagoId as any)?._id
        : cliente.terminoPagoId

      setFormData(prev => ({
        ...prev,
        clienteId,
        clienteNombre: cliente.nombre,
        clienteNif: cliente.nif,
        clienteEmail: cliente.email,
        clienteTelefono: cliente.telefono,
        condiciones: {
          ...prev.condiciones,
          formaPagoId: formaPagoIdCliente || prev.condiciones?.formaPagoId,
          terminoPagoId: terminoPagoIdCliente || prev.condiciones?.terminoPagoId,
        },
      }))
      // Cargar direcciones del cliente
      setDireccionesCliente(cliente.direcciones || [])
    } else {
      setDireccionesCliente([])
    }
  }

  // Handler para seleccionar producto en línea
  const handleProductoSelect = (index: number, productoId: string) => {
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
  const aplicarProductoALinea = async (
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
    // Determinar si es un kit (tipo compuesto o tiene componentesKit)
    const esKit = producto.tipo === 'compuesto' || (producto.componentesKit && producto.componentesKit.length > 0)

    // Construir los componentes del kit si aplica
    let componentesKit: IComponenteKit[] | undefined = undefined
    if (esKit && producto.componentesKit && producto.componentesKit.length > 0) {
      componentesKit = producto.componentesKit.map(comp => {
        // Buscar el producto componente para obtener sus precios
        const productoComponente = productos.find(p => p._id === comp.productoId)
        return {
          productoId: comp.productoId,
          nombre: comp.producto?.nombre || productoComponente?.nombre || 'Componente',
          sku: comp.producto?.sku || productoComponente?.sku,
          cantidad: comp.cantidad,
          precioUnitario: productoComponente?.precios?.venta || 0,
          costeUnitario: productoComponente?.precios?.compra || 0,
          descuento: 0,
          iva: productoComponente?.iva || 21,
          subtotal: (productoComponente?.precios?.venta || 0) * comp.cantidad,
          opcional: comp.opcional,
          seleccionado: !comp.opcional, // Los no opcionales están siempre seleccionados
        }
      })
    }

    // Construir nombre con info de variante
    let nombre = producto.nombre
    if (variante) {
      const combinacionStr = Object.entries(variante.combinacion)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
      nombre = `${producto.nombre} (${combinacionStr})`
    }

    // Precio base del producto (PVP)
    const precioBase = variante?.precioUnitario ?? producto.precios?.venta ?? 0
    // Obtener precio calculado considerando tarifas y ofertas del cliente
    let precioUnitario = precioBase
    let descuentoTarifa = 0 // Descuento de la tarifa/oferta a aplicar en el campo descuento
    let origenPrecio: 'producto' | 'tarifa' | 'oferta' | 'precio_cantidad' | 'manual' = 'producto'
    let detalleOrigenPrecio: {
      tarifaId?: string
      tarifaNombre?: string
      ofertaId?: string
      ofertaNombre?: string
      ofertaTipo?: string
      descuentoAplicado?: number
    } | undefined = undefined

    try {
      const precioResponse = await preciosService.calcularPrecio({
        productoId: producto._id,
        varianteId: variante?.varianteId,
        clienteId: formData.clienteId || undefined,
        cantidad: 1,
      })

      if (precioResponse.success && precioResponse.data) {
        const precioCalculado = precioResponse.data
        origenPrecio = precioCalculado.origen as typeof origenPrecio

        // Si hay tarifa u oferta, usar precio base + descuento en campo dto%
        // Esto evita el doble descuento y es más transparente para el usuario
        if (precioCalculado.origen === 'tarifa' || precioCalculado.origen === 'oferta') {
          // Mantener precio base, aplicar descuento en campo descuento
          precioUnitario = precioCalculado.precioBase
          descuentoTarifa = precioCalculado.descuentoAplicado || 0
        } else {
          // Para otros orígenes (precio_cantidad, etc), usar el precio final directamente
          precioUnitario = precioCalculado.precioFinal
        }

        // Guardar detalle del origen
        if (precioCalculado.detalleOrigen) {
          detalleOrigenPrecio = {
            ...precioCalculado.detalleOrigen,
            descuentoAplicado: precioCalculado.descuentoAplicado,
          }
        }

        // Notificar al usuario de la tarifa/oferta aplicada
        if (precioCalculado.origen === 'tarifa' && precioCalculado.detalleOrigen?.tarifaNombre) {
          toast.info(`Tarifa "${precioCalculado.detalleOrigen.tarifaNombre}" aplicada: ${descuentoTarifa.toFixed(1)}% de descuento`)
        } else if (precioCalculado.origen === 'oferta' && precioCalculado.detalleOrigen?.ofertaNombre) {
          toast.info(`Oferta "${precioCalculado.detalleOrigen.ofertaNombre}" aplicada: ${descuentoTarifa.toFixed(1)}% de descuento`)
        }
      }
    } catch (error) {
      // En caso de error, usar el precio base del producto
      console.warn('Error al obtener precio calculado, usando precio base:', error)
    }

    handleUpdateLinea(index, {
      productoId: producto._id,
      codigo: variante?.sku || producto.sku || '',
      nombre,
      descripcion: producto.descripcionCorta || producto.descripcion || '',
      // Precios: usar precio base y poner descuento de tarifa en campo descuento
      precioOriginal: precioBase,
      precioUnitario,
      descuento: descuentoTarifa, // Descuento de la tarifa/oferta
      origenPrecio,
      detalleOrigenPrecio,
      costeUnitario: variante?.costeUnitario ?? producto.precios?.compra ?? 0,
      iva: producto.iva || 21,
      unidad: 'ud',
      // Peso del producto
      peso: producto.peso || 0,
      tipo: esKit ? TipoLinea.KIT : TipoLinea.PRODUCTO,
      componentesKit,
      mostrarComponentes: esKit,
      // Guardar info de variante seleccionada
      variante: variante ? {
        varianteId: variante.varianteId,
        sku: variante.sku,
        combinacion: variante.combinacion,
        precioAdicional: variante.precioUnitario - (producto.precios?.venta || 0),
        costeAdicional: variante.costeUnitario - (producto.precios?.compra || 0),
      } : undefined,
    })
  }

  // Handler para cuando se selecciona una variante (compatibilidad)
  const handleVarianteSelect = (varianteInfo: VarianteSeleccion) => {
    if (lineaIndexParaVariante !== null && productoConVariantes) {
      // Aplicar en la línea actual con la cantidad especificada
      const lineaConCantidad = {
        ...varianteInfo,
      }
      aplicarProductoALinea(lineaIndexParaVariante, productoConVariantes, lineaConCantidad)
      // Actualizar cantidad si se especificó
      if (varianteInfo.cantidad && varianteInfo.cantidad !== 1) {
        handleUpdateLinea(lineaIndexParaVariante, { cantidad: varianteInfo.cantidad })
      }
    }
    setVarianteSelectorOpen(false)
    setProductoConVariantes(null)
    setLineaIndexParaVariante(null)
  }

  // Handler para cuando se seleccionan múltiples variantes
  const handleVariantesMultipleSelect = (variantes: VarianteSeleccion[]) => {
    if (lineaIndexParaVariante === null || !productoConVariantes) return

    // Para la primera variante, usar la línea existente
    const primeraVariante = variantes[0]
    aplicarProductoALinea(lineaIndexParaVariante, productoConVariantes, primeraVariante)
    // Actualizar cantidad de la primera línea
    if (primeraVariante.cantidad) {
      setTimeout(() => {
        handleUpdateLinea(lineaIndexParaVariante, { cantidad: primeraVariante.cantidad })
      }, 0)
    }

    // Para el resto de variantes, crear nuevas líneas
    if (variantes.length > 1) {
      const nuevasLineas = variantes.slice(1).map((variante, idx) => {
        const numLinea = (formData.lineas?.length || 0) + idx + 1
        return calcularLinea({
          ...crearLineaVacia(numLinea),
          productoId: productoConVariantes._id,
          sku: variante.sku,
          nombre: `${productoConVariantes.nombre} - ${Object.values(variante.combinacion).join(' / ')}`,
          descripcion: productoConVariantes.descripcion || '',
          cantidad: variante.cantidad || 1,
          precioUnitario: variante.precioUnitario,
          costeUnitario: variante.costeUnitario,
          descuento: 0,
          iva: productoConVariantes.iva || 21,
          variante: {
            varianteId: variante.varianteId,
            sku: variante.sku,
            combinacion: variante.combinacion,
            precioAdicional: variante.precioUnitario - (productoConVariantes.precios?.venta || 0),
            costeAdicional: variante.costeUnitario - (productoConVariantes.precios?.compra || 0),
          },
        })
      })

      setFormData(prev => ({
        ...prev,
        lineas: [...(prev.lineas || []), ...nuevasLineas] as ILineaPresupuesto[],
      }))
    }

    setVarianteSelectorOpen(false)
    setProductoConVariantes(null)
    setLineaIndexParaVariante(null)
  }

  // Handler para usar producto base sin variante
  const handleUsarProductoBase = () => {
    if (lineaIndexParaVariante !== null && productoConVariantes) {
      aplicarProductoALinea(lineaIndexParaVariante, productoConVariantes)
    }
    setVarianteSelectorOpen(false)
    setProductoConVariantes(null)
    setLineaIndexParaVariante(null)
  }

  // Handler para cambiar el nombre/descripción de la línea
  const handleNombreChange = (index: number, nombre: string) => {
    handleUpdateLinea(index, { nombre })
  }

  // Handler para toggle de mostrar/ocultar componentes del kit
  const handleToggleComponentes = (index: number) => {
    const linea = formData.lineas?.[index]
    if (linea) {
      handleUpdateLinea(index, { mostrarComponentes: !linea.mostrarComponentes })
    }
  }

  // Handler para seleccionar dirección del cliente
  const handleDireccionSelect = (direccionIndex: string) => {
    const dir = direccionesCliente[parseInt(direccionIndex)]
    if (dir) {
      setFormData(prev => ({
        ...prev,
        direccionEntrega: {
          tipo: 'cliente',
          nombre: formData.clienteNombre,
          calle: dir.calle || '',
          numero: dir.numero || '',
          piso: dir.piso || '',
          codigoPostal: dir.codigoPostal || '',
          ciudad: dir.ciudad || '',
          provincia: dir.provincia || '',
          pais: dir.pais || 'España',
          personaContacto: dir.personaContacto || '',
          telefonoContacto: dir.telefonoContacto || '',
        },
      }))
    }
  }

  // Función para enfocar el campo de producto de una línea
  const focusProducto = useCallback((index: number) => {
    setTimeout(() => {
      const input = productoRefs.current.get(index)
      if (input) {
        input.focus()
      }
    }, 50)
  }, [])

  // Función para enfocar el campo de cantidad de una línea
  const focusCantidad = useCallback((index: number) => {
    setTimeout(() => {
      const input = cantidadRefs.current.get(index)
      if (input) {
        input.focus()
        input.select()
      }
    }, 50)
  }, [])

  const handleAddLinea = useCallback((tipo: TipoLinea = TipoLinea.PRODUCTO) => {
    const newIndex = formData.lineas?.length || 0
    const newLinea = {
      ...crearLineaVacia(newIndex + 1),
      tipo,
    }
    setFormData(prev => ({
      ...prev,
      lineas: [...(prev.lineas || []), newLinea as ILineaPresupuesto],
    }))
    // Enfocar el campo de producto de la nueva línea
    focusProducto(newIndex)
  }, [formData.lineas?.length, focusProducto])

  // Handler para cuando se presiona Enter en el buscador de producto
  const handleProductEnterPress = useCallback((index: number) => {
    focusCantidad(index)
  }, [focusCantidad])

  // Handler para cuando se presiona Enter en el campo de cantidad
  const handleCantidadKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      // Añadir nueva línea y enfocar su campo de producto (solo Enter, no Ctrl+Enter)
      handleAddLinea(TipoLinea.PRODUCTO)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Ir a la cantidad de la siguiente línea si existe
      const nextInput = cantidadRefs.current.get(index + 1)
      if (nextInput) {
        nextInput.focus()
        nextInput.select()
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      // Ir a la cantidad de la línea anterior si existe
      const prevInput = cantidadRefs.current.get(index - 1)
      if (prevInput) {
        prevInput.focus()
        prevInput.select()
      }
    }
  }, [handleAddLinea])

  // Atajo global Ctrl+Enter para añadir línea
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Solo en la pestaña de líneas
      if (activeTab !== 'lineas') return

      // Ctrl+Enter o Ctrl+N para añadir línea (funciona en cualquier campo)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 'n')) {
        e.preventDefault()
        handleAddLinea(TipoLinea.PRODUCTO)
        return
      }

      // Para otras teclas, ignorar si el foco está en un input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [activeTab, handleAddLinea])

  const handleUpdateLinea = (index: number, updates: Partial<ILineaPresupuesto>) => {
    setFormData(prev => {
      const lineas = [...(prev.lineas || [])]
      const lineaActualizada = calcularLinea({ ...lineas[index], ...updates })
      lineas[index] = lineaActualizada
      return { ...prev, lineas }
    })
  }

  /**
   * Actualiza el margen porcentaje de una línea y recalcula el precio de venta.
   * El margen se calcula sobre el coste: precio = coste * (1 + margen/100)
   */
  const handleUpdateMargen = (index: number, nuevoMargenPorcentaje: number) => {
    setFormData(prev => {
      const lineas = [...(prev.lineas || [])]
      const linea = lineas[index]
      const coste = linea.costeUnitario || 0

      // Calcular nuevo precio de venta basado en el margen sobre coste
      // Margen % = ((precio - coste) / coste) * 100
      // Despejando: precio = coste * (1 + margen/100)
      const nuevoPrecio = coste > 0 ? coste * (1 + nuevoMargenPorcentaje / 100) : linea.precioUnitario

      const lineaActualizada = calcularLinea({
        ...linea,
        precioUnitario: Math.round(nuevoPrecio * 100) / 100,
      })
      lineas[index] = lineaActualizada
      return { ...prev, lineas }
    })
  }

  const handleRemoveLinea = (index: number) => {
    setFormData(prev => {
      const lineas = (prev.lineas || []).filter((_, i) => i !== index)
      // Reordenar
      return {
        ...prev,
        lineas: lineas.map((l, i) => ({ ...l, orden: i + 1 })),
      }
    })
  }

  const handleMoveLinea = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const lineas = [...(prev.lineas || [])]
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= lineas.length) return prev

      const temp = lineas[index]
      lineas[index] = lineas[newIndex]
      lineas[newIndex] = temp

      return {
        ...prev,
        lineas: lineas.map((l, i) => ({ ...l, orden: i + 1 })),
      }
    })
  }

  const handleDuplicateLinea = (index: number) => {
    setFormData(prev => {
      const lineas = [...(prev.lineas || [])]
      const lineaDuplicada = {
        ...lineas[index],
        _id: undefined,
        orden: lineas.length + 1,
      }
      return {
        ...prev,
        lineas: [...lineas, lineaDuplicada],
      }
    })
  }

  // Handler para abrir el diálogo de edición de descripciones
  const handleOpenDescripcionDialog = (index: number) => {
    const linea = formData.lineas?.[index]
    if (linea) {
      // Buscar el producto original para obtener las descripciones
      const producto = productos.find(p => p._id === linea.productoId)
      setDescripcionEdit({
        corta: linea.descripcion || producto?.descripcionCorta || '',
        larga: linea.descripcionLarga || producto?.descripcion || '',
      })
      setDescripcionEditIndex(index)
      setShowDescripcionDialog(true)
    }
  }

  // Handler para guardar las descripciones editadas
  const handleSaveDescripcion = () => {
    if (descripcionEditIndex !== null) {
      handleUpdateLinea(descripcionEditIndex, {
        descripcion: descripcionEdit.corta,
        descripcionLarga: descripcionEdit.larga,
      })
      setShowDescripcionDialog(false)
      setDescripcionEditIndex(null)
      toast.success('Descripciones actualizadas')
    }
  }

  const handleAplicarMargen = () => {
    setFormData(prev => {
      const lineas = (prev.lineas || []).map(linea => {
        // Filtrar según el tipo
        if (margenConfig.aplicarA === 'productos' && linea.tipo !== TipoLinea.PRODUCTO) return linea
        if (margenConfig.aplicarA === 'servicios' && linea.tipo !== TipoLinea.SERVICIO) return linea

        let nuevoPrecio = linea.precioUnitario
        if (margenConfig.tipo === 'porcentaje') {
          if (margenConfig.sobreCoste) {
            nuevoPrecio = linea.costeUnitario * (1 + margenConfig.valor / 100)
          } else {
            nuevoPrecio = linea.precioUnitario * (1 + margenConfig.valor / 100)
          }
        } else {
          nuevoPrecio = linea.costeUnitario + margenConfig.valor
        }

        // Redondear el precio según la configuración de decimales de la empresa
        nuevoPrecio = redondearPrecio(nuevoPrecio)

        return calcularLinea({ ...linea, precioUnitario: nuevoPrecio })
      })

      return { ...prev, lineas }
    })

    setShowMargenDialog(false)
    toast.success('Margen aplicado correctamente')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clienteId) {
      toast.error('Debe seleccionar un cliente')
      setActiveTab('cliente')
      return
    }

    // Validar que no haya líneas vacías
    const lineas = formData.lineas || []
    const lineasVacias = lineas.filter((linea, index) => {
      // Las líneas de tipo TEXTO, SUBTOTAL o DESCUENTO pueden estar sin producto
      if (linea.tipo === TipoLinea.TEXTO || linea.tipo === TipoLinea.SUBTOTAL || linea.tipo === TipoLinea.DESCUENTO) {
        return false
      }
      // Para productos, servicios y kits, validar que tengan nombre
      return !linea.nombre || linea.nombre.trim() === ''
    })

    if (lineasVacias.length > 0) {
      const numeroLinea = lineas.findIndex((l) => lineasVacias.includes(l)) + 1
      toast.error(`Hay ${lineasVacias.length} línea${lineasVacias.length > 1 ? 's' : ''} sin producto. Revise la línea ${numeroLinea}.`)
      setActiveTab('lineas')
      return
    }

    await onSubmit(formData)
  }

  // Contadores para badges
  const numLineas = formData.lineas?.length || 0

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Barra de herramientas superior */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Solo mostrar toggle de costes si el usuario tiene permiso */}
              {canVerCostes() && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="mostrarCostes" className="text-sm cursor-pointer">
                    {mostrarCostes ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Label>
                  <Switch
                    id="mostrarCostes"
                    checked={mostrarCostesUI}
                    onCheckedChange={(checked) => {
                      setMostrarCostesUI(checked)
                      setFormData(prev => ({ ...prev, mostrarCostes: checked }))
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {mostrarCostes ? 'Costes visibles' : 'Costes ocultos'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Solo mostrar botón de margen si puede ver costes */}
              {canVerCostes() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMargenDialog(true)}
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Aplicar Margen
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <Import className="h-4 w-4 mr-2" />
                Importar Líneas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cliente" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Cliente</span>
          </TabsTrigger>
          <TabsTrigger value="lineas" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Líneas</span>
            {numLineas > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {numLineas}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="entrega" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Entrega</span>
          </TabsTrigger>
          <TabsTrigger value="condiciones" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Condiciones</span>
          </TabsTrigger>
          <TabsTrigger value="otros" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Otros</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* TAB: CLIENTE Y DATOS GENERALES */}
        {/* ============================================ */}
        <TabsContent value="cliente" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Datos del Presupuesto */}
            <Card>
              <CardHeader>
                <CardTitle>Datos del Presupuesto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serie">Serie</Label>
                    <SearchableSelect
                      options={seriesOptions}
                      value={formData.serieId || ''}
                      onValueChange={handleSerieChange}
                      placeholder="Seleccionar serie..."
                      searchPlaceholder="Buscar serie..."
                      emptyMessage="No hay series configuradas"
                      disabled={mode === 'edit'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                      placeholder="Auto-generado"
                      disabled={mode === 'edit'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha *</Label>
                    <DateInput
                      value={formData.fecha as string || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, fecha: value }))}
                      placeholder="Seleccionar fecha"
                      allowClear={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaValidez">Válido hasta *</Label>
                    <DateInput
                      value={formData.fechaValidez as string || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, fechaValidez: value }))}
                      placeholder="Seleccionar fecha validez"
                      allowClear={false}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titulo">Título / Asunto</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Título del presupuesto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    rows={3}
                    placeholder="Descripción breve del presupuesto"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cliente */}
            <Card>
              <CardHeader>
                <CardTitle>Cliente *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clienteId">Seleccionar Cliente</Label>
                  <SearchableSelect
                    options={clientesOptions}
                    value={formData.clienteId}
                    onValueChange={handleClienteChange}
                    placeholder="Buscar cliente..."
                    searchPlaceholder="Buscar por nombre, código o NIF..."
                    emptyMessage="No se encontraron clientes"
                    loading={loadingOptions}
                    onCreate={() => setShowCreateCliente(true)}
                    createLabel="Crear cliente"
                  />
                </div>

                {formData.clienteId && (
                  <>
                    {/* Datos fiscales del cliente */}
                    {(() => {
                      const clienteSeleccionado = clientes.find(c => c._id === formData.clienteId)
                      const direccionFiscal = clienteSeleccionado?.direcciones?.find(d => d.tipo === 'fiscal' && d.activa)
                        || clienteSeleccionado?.direccion

                      return (
                        <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Datos Fiscales</h4>
                            <Badge variant="outline" className="text-xs">
                              {clienteSeleccionado?.tipoCliente === 'empresa' ? 'Empresa' : 'Particular'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground text-xs">NIF</span>
                              <p className="font-medium">{formData.clienteNif || '-'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">Teléfono</span>
                              <p className="font-medium">{formData.clienteTelefono || clienteSeleccionado?.telefono || '-'}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground text-xs">Email</span>
                              <p className="font-medium">{formData.clienteEmail || '-'}</p>
                            </div>
                          </div>

                          {direccionFiscal && (
                            <div className="pt-2 border-t">
                              <span className="text-muted-foreground text-xs">Dirección Fiscal</span>
                              <p className="text-sm">
                                {direccionFiscal.calle} {direccionFiscal.numero}
                                {direccionFiscal.piso && `, ${direccionFiscal.piso}`}
                              </p>
                              <p className="text-sm">
                                {direccionFiscal.codigoPostal} {direccionFiscal.ciudad}
                                {direccionFiscal.provincia && `, ${direccionFiscal.provincia}`}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="referenciaCliente">Referencia del Cliente</Label>
                        <Input
                          id="referenciaCliente"
                          value={formData.referenciaCliente || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, referenciaCliente: e.target.value }))}
                          placeholder="Ref. interna del cliente"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pedidoCliente">Nº Pedido Cliente</Label>
                        <Input
                          id="pedidoCliente"
                          value={formData.pedidoCliente || ''}
                          disabled
                          placeholder="Se asigna al convertir en pedido"
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Relaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Relaciones</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agenteComercialId">Agente Comercial</Label>
                <SearchableSelect
                  options={agentesOptions}
                  value={formData.agenteComercialId || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, agenteComercialId: value || undefined }))}
                  placeholder="Sin agente asignado"
                  searchPlaceholder="Buscar agente comercial..."
                  emptyMessage="No se encontraron agentes"
                  allowClear
                  onCreate={() => setShowCreateAgente(true)}
                  createLabel="Crear agente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proyectoId">Proyecto</Label>
                <SearchableSelect
                  options={proyectosOptions}
                  value={formData.proyectoId || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, proyectoId: value || undefined }))}
                  placeholder="Sin proyecto asignado"
                  searchPlaceholder="Buscar proyecto..."
                  emptyMessage="No se encontraron proyectos"
                  allowClear
                  onCreate={() => setShowCreateProyecto(true)}
                  createLabel="Crear proyecto"
                />
              </div>
            </CardContent>
          </Card>

          {/* Estado y Condiciones de Pago */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del Presupuesto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  value={formData.estado || EstadoPresupuesto.BORRADOR}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value as EstadoPresupuesto }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {ESTADOS_PRESUPUESTO.map(estado => (
                    <option key={estado.value} value={estado.value}>{estado.label}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: LINEAS DEL PRESUPUESTO */}
        {/* ============================================ */}
        <TabsContent value="lineas" className="space-y-6 mt-6">
          <DocumentoLineasGrid
            moduloNombre="presupuestos-lineas"
            lineas={formData.lineas as any || []}
            esVenta={true}
            mostrarCostes={mostrarCostes}
            mostrarMargenes={mostrarMargenes}
            productosOptions={productosOptions}
            onAddLinea={handleAddLinea}
            onUpdateLinea={handleUpdateLinea as any}
            onRemoveLinea={handleRemoveLinea}
            onDuplicateLinea={handleDuplicateLinea}
            onMoveLinea={handleMoveLinea}
            onProductoSelect={handleProductoSelect}
            onNombreChange={handleNombreChange}
            onOpenDescripcionDialog={handleOpenDescripcionDialog}
            onProductEnterPress={handleProductEnterPress}
            cantidadRefs={cantidadRefs}
            productoRefs={productoRefs}
            onCantidadKeyDown={handleCantidadKeyDown as any}
            canModificarPVP={canModificarPVP}
            canAplicarDescuentos={canAplicarDescuentos}
            getDescuentoMaximo={getDescuentoMaximo}
          />

          {/* Totales */}
          {numLineas > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-end">
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Subtotal Bruto:</span>
                      <span>{formatCurrency(totales.subtotalBruto)}</span>
                    </div>
                    {totales.totalDescuentos > 0 && (
                      <div className="flex justify-between py-1 text-orange-600">
                        <span>Descuentos:</span>
                        <span>-{formatCurrency(totales.totalDescuentos)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Base Imponible:</span>
                      <span>{formatCurrency(totales.subtotalNeto)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">IVA:</span>
                      <span>{formatCurrency(totales.totalIva)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t font-bold text-lg">
                      <span>TOTAL:</span>
                      <span>{formatCurrency(totales.totalPresupuesto)}</span>
                    </div>

                    {/* Coste total - solo si puede ver costes */}
                    {mostrarCostes && (
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between py-1 text-blue-600">
                          <span>Coste Total:</span>
                          <span>{formatCurrency(totales.costeTotal)}</span>
                        </div>
                      </div>
                    )}

                    {/* Margen bruto - solo si puede ver márgenes */}
                    {mostrarMargenes && (
                      <div className={`flex justify-between py-1 font-medium ${totales.margenBruto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <span>Margen Bruto:</span>
                        <span>{formatCurrency(totales.margenBruto)} ({totales.margenPorcentaje.toFixed(1)}%)</span>
                      </div>
                    )}

                    {/* Descuento global - solo si puede aplicar descuentos */}
                    {canAplicarDescuentos() && (
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center gap-4">
                          <Label className="whitespace-nowrap">Descuento Global:</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max={getDescuentoMaximo()}
                              step="0.1"
                              value={formData.descuentoGlobalPorcentaje || 0}
                              onChange={(e) => {
                                const valor = parseFloat(e.target.value) || 0
                                const max = getDescuentoMaximo()
                                setFormData(prev => ({
                                  ...prev,
                                  descuentoGlobalPorcentaje: Math.min(valor, max),
                                }))
                              }}
                              className="w-20 h-8"
                            />
                            <span>%</span>
                            {getDescuentoMaximo() < 100 && (
                              <span className="text-xs text-muted-foreground">(máx: {getDescuentoMaximo()}%)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: DIRECCIÓN DE ENTREGA */}
        {/* ============================================ */}
        <TabsContent value="entrega" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dirección de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selector de tipo de entrega */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={formData.direccionEntrega?.tipo === 'cliente' || !formData.direccionEntrega?.tipo ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    direccionEntrega: { ...prev.direccionEntrega, tipo: 'cliente' },
                  }))}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Del Cliente
                </Button>
                <Button
                  type="button"
                  variant={formData.direccionEntrega?.tipo === 'personalizada' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    direccionEntrega: { ...prev.direccionEntrega, tipo: 'personalizada' },
                  }))}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Personalizada
                </Button>
                <Button
                  type="button"
                  variant={formData.direccionEntrega?.tipo === 'recogida' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    direccionEntrega: { ...prev.direccionEntrega, tipo: 'recogida' },
                  }))}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Recogida
                </Button>
              </div>

              {/* Direcciones del cliente */}
              {(formData.direccionEntrega?.tipo === 'cliente' || !formData.direccionEntrega?.tipo) && (
                <>
                  {!formData.clienteId ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                      <p className="text-sm text-amber-800">
                        Seleccione un cliente primero para ver sus direcciones disponibles.
                      </p>
                    </div>
                  ) : direccionesCliente.length === 0 ? (
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        El cliente no tiene direcciones registradas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label>Seleccionar dirección de entrega</Label>
                      <div className="grid gap-2">
                        {direccionesCliente.filter(d => d.activa !== false).map((dir, index) => {
                          const isSelected = formData.direccionEntrega?.calle === dir.calle &&
                            formData.direccionEntrega?.codigoPostal === dir.codigoPostal
                          return (
                            <div
                              key={dir._id || index}
                              onClick={() => handleDireccionSelect(index.toString())}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      {dir.nombre || `Dirección ${index + 1}`}
                                    </span>
                                    <Badge variant="outline" className="text-[10px]">
                                      {dir.tipo?.charAt(0).toUpperCase() + dir.tipo?.slice(1) || 'Envío'}
                                    </Badge>
                                    {dir.predeterminada && (
                                      <Badge variant="secondary" className="text-[10px]">
                                        Predeterminada
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {dir.calle} {dir.numero}{dir.piso && `, ${dir.piso}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {dir.codigoPostal} {dir.ciudad}{dir.provincia && `, ${dir.provincia}`}
                                  </p>
                                  {dir.personaContacto && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Contacto: {dir.personaContacto} {dir.telefonoContacto && `- ${dir.telefonoContacto}`}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Recogida en tienda */}
              {formData.direccionEntrega?.tipo === 'recogida' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Recogida en tienda</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    El cliente recogerá el pedido en nuestras instalaciones.
                  </p>
                  <div className="mt-3 space-y-2">
                    <Label>Observaciones para la recogida</Label>
                    <Textarea
                      value={formData.direccionEntrega?.instrucciones || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, tipo: 'recogida', instrucciones: e.target.value },
                      }))}
                      rows={2}
                      placeholder="Instrucciones especiales para la recogida..."
                    />
                  </div>
                </div>
              )}

              {/* Dirección personalizada */}
              {formData.direccionEntrega?.tipo === 'personalizada' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Nombre / Empresa</Label>
                    <Input
                      value={formData.direccionEntrega?.nombre || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, nombre: e.target.value },
                      }))}
                      placeholder="Nombre del destinatario o empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Calle *</Label>
                    <Input
                      value={formData.direccionEntrega?.calle || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, calle: e.target.value },
                      }))}
                      placeholder="Nombre de la calle"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Número</Label>
                      <Input
                        value={formData.direccionEntrega?.numero || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          direccionEntrega: { ...prev.direccionEntrega!, numero: e.target.value },
                        }))}
                        placeholder="Nº"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Piso/Puerta</Label>
                      <Input
                        value={formData.direccionEntrega?.piso || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          direccionEntrega: { ...prev.direccionEntrega!, piso: e.target.value },
                        }))}
                        placeholder="Ej: 2º A"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Código Postal *</Label>
                    <Input
                      value={formData.direccionEntrega?.codigoPostal || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, codigoPostal: e.target.value },
                      }))}
                      placeholder="Ej: 28001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ciudad *</Label>
                    <Input
                      value={formData.direccionEntrega?.ciudad || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, ciudad: e.target.value },
                      }))}
                      placeholder="Ciudad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Input
                      value={formData.direccionEntrega?.provincia || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, provincia: e.target.value },
                      }))}
                      placeholder="Provincia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>País</Label>
                    <Input
                      value={formData.direccionEntrega?.pais || 'España'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, pais: e.target.value },
                      }))}
                    />
                  </div>

                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h4 className="font-medium text-sm mb-3">Datos de contacto</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Persona de Contacto</Label>
                        <Input
                          value={formData.direccionEntrega?.personaContacto || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            direccionEntrega: { ...prev.direccionEntrega!, personaContacto: e.target.value },
                          }))}
                          placeholder="Nombre del contacto"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Teléfono de Contacto</Label>
                        <Input
                          value={formData.direccionEntrega?.telefonoContacto || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            direccionEntrega: { ...prev.direccionEntrega!, telefonoContacto: e.target.value },
                          }))}
                          placeholder="Teléfono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Horario de Entrega</Label>
                        <Input
                          value={formData.direccionEntrega?.horarioEntrega || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            direccionEntrega: { ...prev.direccionEntrega!, horarioEntrega: e.target.value },
                          }))}
                          placeholder="Ej: L-V de 9:00 a 18:00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Instrucciones de Entrega</Label>
                    <Textarea
                      value={formData.direccionEntrega?.instrucciones || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, instrucciones: e.target.value },
                      }))}
                      rows={2}
                      placeholder="Instrucciones especiales para la entrega..."
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-4">
                <Label htmlFor="fechaEntregaPrevista">Fecha de Entrega Prevista</Label>
                <DateInput
                  value={formData.fechaEntregaPrevista as string || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, fechaEntregaPrevista: value || undefined }))}
                  placeholder="Seleccionar fecha de entrega"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: CONDICIONES COMERCIALES */}
        {/* ============================================ */}
        <TabsContent value="condiciones" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Condiciones Comerciales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="formaPagoId">Forma de Pago</Label>
                <SearchableSelect
                  options={formasPagoOptions}
                  value={formData.condiciones?.formaPagoId || ''}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    condiciones: { ...prev.condiciones!, formaPagoId: value || undefined }
                  }))}
                  placeholder="Seleccionar forma de pago..."
                  searchPlaceholder="Buscar..."
                  emptyMessage="No hay formas de pago"
                  allowClear
                  loading={loadingOptions}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terminoPagoId">Término de Pago</Label>
                <SearchableSelect
                  options={terminosPagoOptions}
                  value={formData.condiciones?.terminoPagoId || ''}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    condiciones: { ...prev.condiciones!, terminoPagoId: value || undefined }
                  }))}
                  placeholder="Seleccionar término de pago..."
                  searchPlaceholder="Buscar..."
                  emptyMessage="No hay términos de pago"
                  allowClear
                  loading={loadingOptions}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validezDias">Validez (días)</Label>
                <Input
                  id="validezDias"
                  type="number"
                  min="1"
                  value={formData.condiciones?.validezDias || 30}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    condiciones: {
                      ...prev.condiciones!,
                      validezDias: parseInt(e.target.value) || 30,
                    },
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiempoEntrega">Tiempo de Entrega</Label>
                <Input
                  id="tiempoEntrega"
                  value={formData.condiciones?.tiempoEntrega || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    condiciones: {
                      ...prev.condiciones!,
                      tiempoEntrega: e.target.value,
                    },
                  }))}
                  placeholder="Ej: 15 días laborables"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="garantia">Garantía</Label>
                <Input
                  id="garantia"
                  value={formData.condiciones?.garantia || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    condiciones: {
                      ...prev.condiciones!,
                      garantia: e.target.value,
                    },
                  }))}
                  placeholder="Ej: 2 años"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="portesPagados" className="cursor-pointer">Portes Pagados</Label>
                <Switch
                  id="portesPagados"
                  checked={formData.condiciones?.portesPagados || false}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    condiciones: {
                      ...prev.condiciones!,
                      portesPagados: checked,
                    },
                  }))}
                />
              </div>

              {!formData.condiciones?.portesPagados && (
                <div className="space-y-2">
                  <Label htmlFor="portesImporte">Importe Portes</Label>
                  <Input
                    id="portesImporte"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.condiciones?.portesImporte || 0}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      condiciones: {
                        ...prev.condiciones!,
                        portesImporte: parseFloat(e.target.value) || 0,
                      },
                    }))}
                  />
                </div>
              )}

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="observacionesEntrega">Observaciones de Entrega</Label>
                <Textarea
                  id="observacionesEntrega"
                  value={formData.condiciones?.observacionesEntrega || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    condiciones: {
                      ...prev.condiciones!,
                      observacionesEntrega: e.target.value,
                    },
                  }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: OTROS */}
        {/* ============================================ */}
        <TabsContent value="otros" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Textos del Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="introduccion">Introducción</Label>
                <Textarea
                  id="introduccion"
                  value={formData.introduccion || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, introduccion: e.target.value }))}
                  rows={3}
                  placeholder="Texto de introducción que aparecerá al inicio del presupuesto..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="piePagina">Pie de Página</Label>
                <Textarea
                  id="piePagina"
                  value={formData.piePagina || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, piePagina: e.target.value }))}
                  rows={3}
                  placeholder="Texto que aparecerá al final del presupuesto..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condicionesLegales">Condiciones Legales</Label>
                <Textarea
                  id="condicionesLegales"
                  value={formData.condicionesLegales || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, condicionesLegales: e.target.value }))}
                  rows={4}
                  placeholder="Condiciones legales y términos del presupuesto..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etiquetas y Observaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas</Label>
                <Input
                  id="tags"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    setFormData(prev => ({ ...prev, tags }))
                  }}
                  placeholder="Urgente, VIP, Promoción..."
                />
                <p className="text-xs text-muted-foreground">Separar con comas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones Internas</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  rows={4}
                  placeholder="Notas internas (no aparecen en el presupuesto impreso)..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================ */}
      {/* BOTONES DE ACCIÓN */}
      {/* ============================================ */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear Presupuesto'}
        </Button>
      </div>

      {/* ============================================ */}
      {/* DIÁLOGO: APLICAR MARGEN */}
      {/* ============================================ */}
      <Dialog open={showMargenDialog} onOpenChange={setShowMargenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Margen</DialogTitle>
            <DialogDescription>
              Aplicar margen de beneficio a las líneas del presupuesto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Margen</Label>
              <select
                value={margenConfig.tipo}
                onChange={(e) => setMargenConfig(prev => ({ ...prev, tipo: e.target.value as 'porcentaje' | 'importe' }))}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="importe">Importe fijo (€)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={margenConfig.valor}
                onChange={(e) => setMargenConfig(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Aplicar a</Label>
              <select
                value={margenConfig.aplicarA}
                onChange={(e) => setMargenConfig(prev => ({ ...prev, aplicarA: e.target.value as 'todas' | 'productos' | 'servicios' }))}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="todas">Todas las líneas</option>
                <option value="productos">Solo productos</option>
                <option value="servicios">Solo servicios</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="sobreCoste"
                checked={margenConfig.sobreCoste}
                onCheckedChange={(checked) => setMargenConfig(prev => ({ ...prev, sobreCoste: checked }))}
              />
              <Label htmlFor="sobreCoste">Calcular sobre el coste</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMargenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAplicarMargen}>
              Aplicar Margen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DIÁLOGO: IMPORTAR LÍNEAS */}
      {/* ============================================ */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Líneas</DialogTitle>
            <DialogDescription>
              Importar líneas desde productos u otros documentos
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-center py-8">
              Funcionalidad de importación de líneas próximamente...
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DIÁLOGO: EDITAR DESCRIPCIONES */}
      {/* ============================================ */}
      <Dialog open={showDescripcionDialog} onOpenChange={setShowDescripcionDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlignLeft className="h-5 w-5" />
              Editar Descripciones
            </DialogTitle>
            <DialogDescription>
              {descripcionEditIndex !== null && formData.lineas?.[descripcionEditIndex] && (
                <span className="font-medium">{formData.lineas[descripcionEditIndex].nombre}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="descripcionCorta">Descripción Corta</Label>
              <Textarea
                id="descripcionCorta"
                value={descripcionEdit.corta}
                onChange={(e) => setDescripcionEdit(prev => ({ ...prev, corta: e.target.value }))}
                rows={2}
                placeholder="Descripción breve del producto (aparece en documentos con descripción corta)"
              />
              <p className="text-xs text-muted-foreground">
                {descripcionEdit.corta.length} caracteres
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcionLarga">Descripción Completa</Label>
              <Textarea
                id="descripcionLarga"
                value={descripcionEdit.larga}
                onChange={(e) => setDescripcionEdit(prev => ({ ...prev, larga: e.target.value }))}
                rows={5}
                placeholder="Descripción detallada del producto (aparece en documentos con descripción completa)"
              />
              <p className="text-xs text-muted-foreground">
                {descripcionEdit.larga.length} caracteres
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDescripcionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDescripcion}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* MODALES CREAR (FORMULARIO COMPLETO) */}
      {/* ============================================ */}
      <FullCreateCliente
        open={showCreateCliente}
        onOpenChange={setShowCreateCliente}
        onCreated={handleClienteCreated}
      />

      <FullCreateAgenteComercial
        open={showCreateAgente}
        onOpenChange={setShowCreateAgente}
        onCreated={handleAgenteCreated}
      />

      <FullCreateProyecto
        open={showCreateProyecto}
        onOpenChange={setShowCreateProyecto}
        onCreated={handleProyectoCreated}
        clienteIdDefault={formData.clienteId}
      />

      {/* Selector de variantes */}
      <VarianteSelector
        open={varianteSelectorOpen}
        onOpenChange={setVarianteSelectorOpen}
        producto={productoConVariantes}
        onSelect={handleVarianteSelect}
        onSelectMultiple={handleVariantesMultipleSelect}
        onSelectBase={handleUsarProductoBase}
        multiSelect={true}
      />
    </form>
  )
}

export default PresupuestoForm
