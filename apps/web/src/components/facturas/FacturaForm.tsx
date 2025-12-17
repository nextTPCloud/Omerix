'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  IFactura,
  CreateFacturaDTO,
  UpdateFacturaDTO,
  ILineaFactura,
  IComponenteKit,
  IDireccion,
  IVencimiento,
  TipoLinea,
  TipoFactura,
  EstadoFactura,
  MetodoPago,
  SistemaFiscal,
  MotivoRectificacion,
  ESTADOS_FACTURA,
  TIPOS_FACTURA,
  TIPOS_LINEA,
  METODOS_PAGO,
  SISTEMAS_FISCALES,
  MOTIVOS_RECTIFICACION,
  calcularLinea,
  crearLineaVacia,
} from '@/types/factura.types'
import { facturasService } from '@/services/facturas.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Check,
  AlignLeft,
  CreditCard,
  Calendar,
  Euro,
  Building2,
  Layers,
  AlertTriangle,
  FileWarning,
  Search,
} from 'lucide-react'

// Components
import { SearchableSelect, EditableSearchableSelect } from '@/components/ui/searchable-select'
import { FullCreateCliente, FullCreateAgenteComercial, FullCreateProyecto } from '@/components/full-create'
import { DateInput } from '@/components/ui/date-picker'

// Services
import { clientesService } from '@/services/clientes.service'
import { agentesService } from '@/services/agentes-comerciales.service'
import { proyectosService } from '@/services/proyectos.service'
import { productosService } from '@/services/productos.service'
import { seriesDocumentosService } from '@/services/series-documentos.service'
import { formasPagoService } from '@/services/formas-pago.service'
import { terminosPagoService } from '@/services/terminos-pago.service'
import { ISerieDocumento } from '@/types/serie-documento.types'

// Types
import { Cliente, DireccionExtendida } from '@/types/cliente.types'
import { AgenteComercial } from '@/types/agente-comercial.types'
import { IProyecto } from '@/types/proyecto.types'
import { Producto, Variante } from '@/types/producto.types'
import { FormaPago } from '@/types/forma-pago.types'
import { TerminoPago } from '@/types/termino-pago.types'
import { toast } from 'sonner'

// Componente de selección de variantes
import { VarianteSelector, VarianteSeleccion } from '@/components/productos/VarianteSelector'

// Permisos
import { usePermissions } from '@/hooks/usePermissions'

interface FacturaFormProps {
  initialData?: IFactura
  onSubmit: (data: CreateFacturaDTO | UpdateFacturaDTO) => Promise<void>
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

export function FacturaForm({
  initialData,
  onSubmit,
  isLoading = false,
  mode = 'create',
}: FacturaFormProps) {
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
  const [seriesDocumentos, setSeriesDocumentos] = useState<ISerieDocumento[]>([])
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])
  const [terminosPago, setTerminosPago] = useState<TerminoPago[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Direcciones del cliente seleccionado
  const [direccionesCliente, setDireccionesCliente] = useState<DireccionExtendida[]>([])

  // Estado de visibilidad de costes (controlado por permisos)
  const [mostrarCostesUI, setMostrarCostesUI] = useState(true)
  // Solo mostrar costes si el usuario tiene permiso Y el toggle está activo
  const mostrarCostes = canVerCostes() && mostrarCostesUI
  // Solo mostrar márgenes si el usuario tiene permiso Y se muestran costes
  const mostrarMargenes = canVerMargenes() && mostrarCostes

  // Referencias para inputs
  const cantidadRefs = React.useRef<Map<number, HTMLInputElement>>(new Map())
  const productoRefs = React.useRef<Map<number, HTMLInputElement>>(new Map())

  // Diálogos
  const [showMargenDialog, setShowMargenDialog] = useState(false)
  const [showCreateCliente, setShowCreateCliente] = useState(false)
  const [showCreateAgente, setShowCreateAgente] = useState(false)
  const [showCreateProyecto, setShowCreateProyecto] = useState(false)
  const [showDescripcionDialog, setShowDescripcionDialog] = useState(false)
  const [descripcionEditIndex, setDescripcionEditIndex] = useState<number | null>(null)
  const [descripcionEdit, setDescripcionEdit] = useState({ corta: '', larga: '' })
  const [showVencimientoDialog, setShowVencimientoDialog] = useState(false)
  const [vencimientoEditIndex, setVencimientoEditIndex] = useState<number | null>(null)

  // Estado para selector de variantes
  const [varianteSelectorOpen, setVarianteSelectorOpen] = useState(false)
  const [productoConVariantes, setProductoConVariantes] = useState<Producto | null>(null)
  const [lineaIndexParaVariante, setLineaIndexParaVariante] = useState<number | null>(null)

  // Estado para facturas rectificativas
  const [facturasDisponibles, setFacturasDisponibles] = useState<IFactura[]>([])
  const [loadingFacturas, setLoadingFacturas] = useState(false)
  const [busquedaFactura, setBusquedaFactura] = useState('')

  const [margenConfig, setMargenConfig] = useState({
    tipo: 'porcentaje' as 'porcentaje' | 'importe',
    valor: 0,
    aplicarA: 'todas' as 'todas' | 'productos' | 'servicios',
    sobreCoste: true,
  })

  // Estado de nuevo vencimiento
  const [nuevoVencimiento, setNuevoVencimiento] = useState<Omit<IVencimiento, '_id'>>({
    numero: 1,
    fecha: new Date().toISOString().split('T')[0],
    importe: 0,
    metodoPago: MetodoPago.TRANSFERENCIA,
    cobrado: false,
  })

  // Estado del formulario
  const [formData, setFormData] = useState<CreateFacturaDTO>({
    clienteId: '',
    clienteNombre: '',
    clienteNif: '',
    tipo: TipoFactura.ORDINARIA,
    estado: EstadoFactura.BORRADOR,
    fecha: new Date().toISOString().split('T')[0],
    lineas: [],
    vencimientos: [],
    descuentoGlobalPorcentaje: 0,
    regimenIva: 'general',
    recargoEquivalencia: false,
    sistemaFiscal: SistemaFiscal.VERIFACTU,
    mostrarCostes: true,
    mostrarMargenes: true,
    mostrarPrecios: true,
    mostrarComponentesKit: true,
    // Campos para facturas rectificativas
    esRectificativa: false,
    facturaRectificadaId: undefined,
    facturaRectificadaCodigo: undefined,
    motivoRectificacion: undefined,
    descripcionRectificacion: undefined,
    condiciones: {
      formaPagoId: undefined,
      terminoPagoId: undefined,
    },
  })

  // Totales calculados
  const [totales, setTotales] = useState({
    subtotalBruto: 0,
    totalDescuentos: 0,
    subtotalNeto: 0,
    totalIva: 0,
    totalRecargoEquivalencia: 0,
    totalFactura: 0,
    costeTotal: 0,
    margenBruto: 0,
    margenPorcentaje: 0,
  })

  // Cargar opciones al montar
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true)
        const [clientesRes, agentesRes, proyectosRes, productosRes, seriesRes, formasPagoRes, terminosPagoRes] = await Promise.all([
          clientesService.getAll({ activo: true, limit: 100 }),
          agentesService.getAll({ activo: true, limit: 100 }),
          proyectosService.getAll({ activo: 'true', limit: 100 }),
          productosService.getAll({ activo: true, limit: 100 }),
          seriesDocumentosService.getByTipoDocumento('factura', true).catch(() => ({ success: true, data: [] })),
          formasPagoService.getActivas().catch(() => ({ success: true, data: [] })),
          terminosPagoService.getAll({ activo: 'true', limit: 100 }).catch(() => ({ success: true, data: [] })),
        ])

        if (clientesRes.success) setClientes(clientesRes.data || [])
        if (agentesRes.success) setAgentes(agentesRes.data || [])
        if (proyectosRes.success) setProyectos(proyectosRes.data || [])
        if (productosRes.success) setProductos(productosRes.data || [])
        if (formasPagoRes.success) setFormasPago(formasPagoRes.data || [])
        if (terminosPagoRes.success) setTerminosPago(terminosPagoRes.data || [])
        if (seriesRes.success) {
          setSeriesDocumentos(seriesRes.data || [])
          // Si hay una serie predeterminada y es modo creación, seleccionarla automáticamente
          if (mode === 'create') {
            const seriePredeterminada = seriesRes.data?.find((s: ISerieDocumento) => s.predeterminada)
            if (seriePredeterminada) {
              try {
                const codigoRes = await seriesDocumentosService.sugerirCodigo('factura', seriePredeterminada._id)
                if (codigoRes.success && codigoRes.data) {
                  setFormData(prev => ({
                    ...prev,
                    serieId: seriePredeterminada._id,
                    serie: seriePredeterminada.codigo,
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
  }, [mode])

  // Cargar facturas disponibles para rectificar cuando se selecciona tipo rectificativa
  const buscarFacturasRectificables = useCallback(async (busqueda: string = '') => {
    if (formData.tipo !== TipoFactura.RECTIFICATIVA) return

    try {
      setLoadingFacturas(true)
      // Buscar facturas emitidas que pueden ser rectificadas
      const response = await facturasService.getAll({
        search: busqueda || undefined,
        estado: EstadoFactura.EMITIDA,
        tipo: TipoFactura.ORDINARIA,
        limit: 50,
      })

      if (response.success && response.data) {
        setFacturasDisponibles(response.data || [])
      }
    } catch (error) {
      console.error('Error buscando facturas:', error)
    } finally {
      setLoadingFacturas(false)
    }
  }, [formData.tipo])

  // Cargar facturas cuando se cambia a tipo rectificativa
  useEffect(() => {
    if (formData.tipo === TipoFactura.RECTIFICATIVA) {
      buscarFacturasRectificables()
      // Actualizar el flag esRectificativa
      setFormData(prev => ({ ...prev, esRectificativa: true }))
    } else {
      setFacturasDisponibles([])
      // Limpiar campos de rectificativa si se cambia el tipo
      setFormData(prev => ({
        ...prev,
        esRectificativa: false,
        facturaRectificadaId: undefined,
        facturaRectificadaCodigo: undefined,
        motivoRectificacion: undefined,
        descripcionRectificacion: undefined,
      }))
    }
  }, [formData.tipo, buscarFacturasRectificables])

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

      setFormData({
        serie: initialData.serie,
        tipo: initialData.tipo,
        estado: initialData.estado,
        fecha: new Date(initialData.fecha).toISOString().split('T')[0],
        fechaVencimiento: initialData.fechaVencimiento
          ? new Date(initialData.fechaVencimiento).toISOString().split('T')[0]
          : undefined,
        fechaOperacion: initialData.fechaOperacion
          ? new Date(initialData.fechaOperacion).toISOString().split('T')[0]
          : undefined,
        clienteId,
        clienteNombre: initialData.clienteNombre,
        clienteNif: initialData.clienteNif,
        clienteEmail: initialData.clienteEmail,
        clienteTelefono: initialData.clienteTelefono,
        direccionFacturacion: initialData.direccionFacturacion,
        proyectoId,
        agenteComercialId: agenteId,
        referenciaCliente: initialData.referenciaCliente,
        titulo: initialData.titulo,
        descripcion: initialData.descripcion,
        lineas: initialData.lineas || [],
        descuentoGlobalPorcentaje: initialData.descuentoGlobalPorcentaje || 0,
        vencimientos: initialData.vencimientos || [],
        regimenIva: initialData.regimenIva || 'general',
        recargoEquivalencia: initialData.recargoEquivalencia || false,
        retencionIRPF: initialData.retencionIRPF,
        sistemaFiscal: initialData.sistemaFiscal || SistemaFiscal.VERIFACTU,
        observaciones: initialData.observaciones,
        observacionesInternas: initialData.observacionesInternas,
        condicionesPago: initialData.condicionesPago,
        pieFactura: initialData.pieFactura,
        tags: initialData.tags,
        mostrarCostes: initialData.mostrarCostes,
        mostrarMargenes: initialData.mostrarMargenes,
        mostrarPrecios: initialData.mostrarPrecios,
        mostrarComponentesKit: initialData.mostrarComponentesKit,
      })

      setMostrarCostesUI(initialData.mostrarCostes !== false)

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
    const recargoEquivalencia = formData.recargoEquivalencia || false

    let subtotalBruto = 0
    let totalDescuentos = 0
    let subtotalNeto = 0
    let totalIva = 0
    let totalRecargo = 0
    let costeTotal = 0

    lineas.forEach(linea => {
      if (linea.incluidoEnTotal !== false) {
        const calculada = calcularLinea(linea, recargoEquivalencia)
        subtotalBruto += calculada.cantidad * calculada.precioUnitario
        totalDescuentos += calculada.descuentoImporte
        subtotalNeto += calculada.subtotal
        totalIva += calculada.ivaImporte
        totalRecargo += calculada.recargoImporte || 0
        costeTotal += calculada.costeTotalLinea
      }
    })

    const descuentoGlobalImporte = subtotalNeto * (descuentoGlobal / 100)
    subtotalNeto -= descuentoGlobalImporte
    totalDescuentos += descuentoGlobalImporte

    const totalFactura = subtotalNeto + totalIva + totalRecargo
    const margenBruto = subtotalNeto - costeTotal
    const margenPorcentaje = costeTotal > 0 ? (margenBruto / costeTotal) * 100 : 0

    setTotales({
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round(totalDescuentos * 100) / 100,
      subtotalNeto: Math.round(subtotalNeto * 100) / 100,
      totalIva: Math.round(totalIva * 100) / 100,
      totalRecargoEquivalencia: Math.round(totalRecargo * 100) / 100,
      totalFactura: Math.round(totalFactura * 100) / 100,
      costeTotal: Math.round(costeTotal * 100) / 100,
      margenBruto: Math.round(margenBruto * 100) / 100,
      margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
    })
  }, [formData.lineas, formData.descuentoGlobalPorcentaje, formData.recargoEquivalencia])

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

  const seriesOptions = React.useMemo(() => {
    return seriesDocumentos.map((serie) => ({
      value: serie._id,
      label: serie.codigo,
      description: `${serie.nombre}${serie.predeterminada ? ' (Predeterminada)' : ''}`,
    }))
  }, [seriesDocumentos])

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

  // Handler para cambio de serie
  const handleSerieChange = async (serieId: string) => {
    const serie = seriesDocumentos.find(s => s._id === serieId)
    if (serie) {
      try {
        const codigoRes = await seriesDocumentosService.sugerirCodigo('factura', serieId)
        if (codigoRes.success && codigoRes.data) {
          setFormData(prev => ({
            ...prev,
            serieId: serieId,
            serie: serie.codigo,
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
        recargoEquivalencia: (cliente as any).aplicaRecargoEquivalencia || false,
        condiciones: {
          ...prev.condiciones,
          formaPagoId: formaPagoIdCliente || prev.condiciones?.formaPagoId,
          terminoPagoId: terminoPagoIdCliente || prev.condiciones?.terminoPagoId,
        },
      }))
      setDireccionesCliente(cliente.direcciones || [])

      // Seleccionar dirección de facturación por defecto
      const dirFacturacion = cliente.direcciones?.find(d => d.tipo === 'fiscal')
      if (dirFacturacion) {
        setFormData(prev => ({
          ...prev,
          direccionFacturacion: {
            nombre: cliente.nombre,
            calle: dirFacturacion.calle || '',
            numero: dirFacturacion.numero || '',
            piso: dirFacturacion.piso || '',
            codigoPostal: dirFacturacion.codigoPostal || '',
            ciudad: dirFacturacion.ciudad || '',
            provincia: dirFacturacion.provincia || '',
            pais: dirFacturacion.pais || 'España',
          },
        }))
      }
    } else {
      setDireccionesCliente([])
    }
  }

  // Handler para seleccionar producto en línea
  const handleProductoSelect = (index: number, productoId: string) => {
    const producto = productos.find(p => p._id === productoId)
    if (producto) {
      // Verificar si tiene variantes activas
      const variantesActivas = producto.variantes?.filter((v: Variante) => v.activo) || []
      if (variantesActivas.length > 0) {
        // Abrir selector de variantes
        setProductoConVariantes(producto)
        setLineaIndexParaVariante(index)
        setVarianteSelectorOpen(true)
        return
      }

      // Sin variantes, aplicar producto directamente
      aplicarProductoALinea(index, producto)
    }
  }

  // Función para aplicar producto a una línea (con o sin variante)
  const aplicarProductoALinea = (
    index: number,
    producto: Producto,
    variante?: { varianteId: string; sku: string; combinacion: Record<string, string>; precioUnitario: number; costeUnitario: number }
  ) => {
    const esKit = producto.tipo === 'compuesto' || (producto.componentesKit && producto.componentesKit.length > 0)

    // Construir los componentes del kit si aplica
    let componentesKit: IComponenteKit[] | undefined = undefined
    if (esKit && producto.componentesKit && producto.componentesKit.length > 0) {
      componentesKit = producto.componentesKit.map(comp => {
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
          seleccionado: !comp.opcional,
        }
      })
    }

    const datosLinea: Partial<ILineaFactura> = {
      productoId: producto._id,
      codigo: variante?.sku || producto.sku || '',
      nombre: variante
        ? `${producto.nombre} - ${Object.values(variante.combinacion).join(' / ')}`
        : producto.nombre,
      descripcion: producto.descripcionCorta || producto.descripcion || '',
      precioUnitario: variante?.precioUnitario ?? producto.precios?.venta ?? 0,
      costeUnitario: variante?.costeUnitario ?? producto.precios?.compra ?? 0,
      iva: producto.iva || 21,
      unidad: 'ud',
      tipo: esKit ? TipoLinea.KIT : TipoLinea.PRODUCTO,
      componentesKit,
      mostrarComponentes: esKit,
    }

    // Si hay variante, agregar la información
    if (variante) {
      (datosLinea as ILineaFactura & { variante?: { varianteId: string; sku: string; combinacion: Record<string, string>; precioAdicional: number; costeAdicional: number } }).variante = {
        varianteId: variante.varianteId,
        sku: variante.sku,
        combinacion: variante.combinacion,
        precioAdicional: 0,
        costeAdicional: 0,
      }
    }

    handleUpdateLinea(index, datosLinea)
  }

  // Handler cuando se selecciona una variante desde el selector
  const handleVarianteSelect = (variante: VarianteSeleccion) => {
    if (lineaIndexParaVariante !== null && productoConVariantes) {
      aplicarProductoALinea(lineaIndexParaVariante, productoConVariantes, variante)
      // Actualizar cantidad si se especificó
      if (variante.cantidad && variante.cantidad !== 1) {
        handleUpdateLinea(lineaIndexParaVariante, { cantidad: variante.cantidad })
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
        lineas: [...(prev.lineas || []), ...nuevasLineas] as ILineaFactura[],
      }))
    }

    setVarianteSelectorOpen(false)
    setProductoConVariantes(null)
    setLineaIndexParaVariante(null)
  }

  // Handler para usar el producto base (sin variante)
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

  // Handler para seleccionar dirección del cliente
  const handleDireccionSelect = (direccionIndex: string) => {
    const dir = direccionesCliente[parseInt(direccionIndex)]
    if (dir) {
      setFormData(prev => ({
        ...prev,
        direccionFacturacion: {
          nombre: formData.clienteNombre,
          calle: dir.calle || '',
          numero: dir.numero || '',
          piso: dir.piso || '',
          codigoPostal: dir.codigoPostal || '',
          ciudad: dir.ciudad || '',
          provincia: dir.provincia || '',
          pais: dir.pais || 'España',
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
      lineas: [...(prev.lineas || []), newLinea as ILineaFactura],
    }))
    focusProducto(newIndex)
  }, [formData.lineas?.length, focusProducto])

  // Handler para cuando se presiona Enter en el buscador de producto
  const handleProductEnterPress = useCallback((index: number) => {
    focusCantidad(index)
  }, [focusCantidad])

  // Handler para cuando se presiona Enter en el campo de cantidad
  const handleCantidadKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddLinea(TipoLinea.PRODUCTO)
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
  }, [handleAddLinea])

  // Atajo global Ctrl+Enter para añadir línea
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'lineas') return

      // Ignorar si el foco está en un input (ya tienen sus propios handlers)
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 'n')) {
        e.preventDefault()
        handleAddLinea(TipoLinea.PRODUCTO)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [activeTab, handleAddLinea])

  const handleUpdateLinea = (index: number, updates: Partial<ILineaFactura>) => {
    setFormData(prev => {
      const lineas = [...(prev.lineas || [])]
      const lineaActualizada = calcularLinea({ ...lineas[index], ...updates }, prev.recargoEquivalencia)
      lineas[index] = lineaActualizada
      return { ...prev, lineas }
    })
  }

  const handleUpdateMargen = (index: number, nuevoMargenPorcentaje: number) => {
    setFormData(prev => {
      const lineas = [...(prev.lineas || [])]
      const linea = lineas[index]
      const coste = linea.costeUnitario || 0

      const nuevoPrecio = coste > 0 ? coste * (1 + nuevoMargenPorcentaje / 100) : linea.precioUnitario

      const lineaActualizada = calcularLinea({
        ...linea,
        precioUnitario: Math.round(nuevoPrecio * 100) / 100,
      }, prev.recargoEquivalencia)
      lineas[index] = lineaActualizada
      return { ...prev, lineas }
    })
  }

  const handleRemoveLinea = (index: number) => {
    setFormData(prev => {
      const lineas = (prev.lineas || []).filter((_, i) => i !== index)
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

        return calcularLinea({ ...linea, precioUnitario: nuevoPrecio }, prev.recargoEquivalencia)
      })

      return { ...prev, lineas }
    })

    setShowMargenDialog(false)
    toast.success('Margen aplicado correctamente')
  }

  // Handlers para vencimientos
  const handleAddVencimiento = () => {
    const vencimientos = formData.vencimientos || []
    const nuevoNumero = vencimientos.length + 1
    const importePendiente = totales.totalFactura - vencimientos.reduce((sum, v) => sum + v.importe, 0)

    setNuevoVencimiento({
      numero: nuevoNumero,
      fecha: formData.fecha || new Date().toISOString().split('T')[0],
      importe: Math.max(0, importePendiente),
      metodoPago: MetodoPago.TRANSFERENCIA,
      cobrado: false,
    })
    setVencimientoEditIndex(null)
    setShowVencimientoDialog(true)
  }

  const handleEditVencimiento = (index: number) => {
    const vencimiento = formData.vencimientos?.[index]
    if (vencimiento) {
      setNuevoVencimiento({
        numero: vencimiento.numero,
        fecha: typeof vencimiento.fecha === 'string' ? vencimiento.fecha : new Date(vencimiento.fecha).toISOString().split('T')[0],
        importe: vencimiento.importe,
        metodoPago: vencimiento.metodoPago,
        cobrado: vencimiento.cobrado,
        observaciones: vencimiento.observaciones,
      })
      setVencimientoEditIndex(index)
      setShowVencimientoDialog(true)
    }
  }

  const handleSaveVencimiento = () => {
    setFormData(prev => {
      const vencimientos = [...(prev.vencimientos || [])]
      if (vencimientoEditIndex !== null) {
        vencimientos[vencimientoEditIndex] = nuevoVencimiento
      } else {
        vencimientos.push(nuevoVencimiento)
      }
      return { ...prev, vencimientos }
    })
    setShowVencimientoDialog(false)
    toast.success(vencimientoEditIndex !== null ? 'Vencimiento actualizado' : 'Vencimiento añadido')
  }

  const handleRemoveVencimiento = (index: number) => {
    setFormData(prev => {
      const vencimientos = (prev.vencimientos || []).filter((_, i) => i !== index)
      return {
        ...prev,
        vencimientos: vencimientos.map((v, i) => ({ ...v, numero: i + 1 })),
      }
    })
    toast.success('Vencimiento eliminado')
  }

  // Generar vencimientos automáticos basados en el término de pago
  const handleGenerarVencimientosAuto = () => {
    if (!formData.fecha) {
      toast.error('Debe establecer una fecha de factura')
      return
    }

    // Buscar el término de pago seleccionado
    const terminoPago = terminosPago.find(tp => tp._id === formData.condiciones?.terminoPagoId)

    if (terminoPago?.vencimientos && terminoPago.vencimientos.length > 0) {
      // Generar vencimientos según el término de pago
      const fechaBase = new Date(formData.fecha)
      const nuevosVencimientos: Omit<IVencimiento, '_id'>[] = terminoPago.vencimientos.map((v, index) => {
        const fechaVencimiento = new Date(fechaBase)
        fechaVencimiento.setDate(fechaVencimiento.getDate() + v.dias)

        return {
          numero: index + 1,
          fecha: fechaVencimiento.toISOString().split('T')[0],
          importe: Math.round((totales.totalFactura * v.porcentaje / 100) * 100) / 100,
          metodoPago: MetodoPago.TRANSFERENCIA,
          cobrado: false,
        }
      })

      setFormData(prev => ({
        ...prev,
        vencimientos: nuevosVencimientos,
      }))
      toast.success(`${nuevosVencimientos.length} vencimiento(s) generado(s) según término de pago`)
    } else {
      // Si no hay término de pago, crear un único vencimiento con la fecha de la factura
      const vencimientoUnico: Omit<IVencimiento, '_id'> = {
        numero: 1,
        fecha: formData.fecha,
        importe: totales.totalFactura,
        metodoPago: MetodoPago.TRANSFERENCIA,
        cobrado: false,
      }

      setFormData(prev => ({
        ...prev,
        vencimientos: [vencimientoUnico],
      }))
      toast.success('Vencimiento generado (seleccione un término de pago para generar automáticamente)')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clienteId) {
      toast.error('Debe seleccionar un cliente')
      setActiveTab('cliente')
      return
    }

    const lineas = formData.lineas || []
    const lineasVacias = lineas.filter((linea) => {
      if (linea.tipo === TipoLinea.TEXTO || linea.tipo === TipoLinea.SUBTOTAL || linea.tipo === TipoLinea.DESCUENTO) {
        return false
      }
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
  const numVencimientos = formData.vencimientos?.length || 0

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

              <div className="flex items-center gap-2">
                <Label htmlFor="recargoEquivalencia" className="text-sm">
                  R.E.
                </Label>
                <Switch
                  id="recargoEquivalencia"
                  checked={formData.recargoEquivalencia || false}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ ...prev, recargoEquivalencia: checked }))
                  }}
                />
              </div>
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
          <TabsTrigger value="vencimientos" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Vencimientos</span>
            {numVencimientos > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {numVencimientos}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Fiscal</span>
          </TabsTrigger>
          <TabsTrigger value="otros" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Otros</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: CLIENTE Y DATOS GENERALES */}
        <TabsContent value="cliente" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Datos de la Factura */}
            <Card>
              <CardHeader>
                <CardTitle>Datos de la Factura</CardTitle>
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
                      disabled={loadingOptions || mode === 'edit'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <SearchableSelect
                      options={TIPOS_FACTURA.map(t => ({ value: t.value, label: t.label }))}
                      value={formData.tipo || TipoFactura.ORDINARIA}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as TipoFactura }))}
                      placeholder="Tipo de factura..."
                      disabled={mode === 'edit'}
                    />
                  </div>
                </div>

                {/* Campos para facturas rectificativas */}
                {formData.tipo === TipoFactura.RECTIFICATIVA && (
                  <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <FileWarning className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-base">Datos de Factura Rectificativa</CardTitle>
                      </div>
                      <CardDescription>
                        Información requerida para cumplir con la normativa antifraude
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Selector de factura a rectificar */}
                      <div className="space-y-2">
                        <Label htmlFor="facturaRectificar" className="flex items-center gap-2">
                          <span>Factura a rectificar *</span>
                          {loadingFacturas && <Loader2 className="h-3 w-3 animate-spin" />}
                        </Label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <SearchableSelect
                              options={facturasDisponibles.map(f => ({
                                value: f._id,
                                label: f.codigo,
                                description: `${f.clienteNombre} - ${new Date(f.fecha).toLocaleDateString('es-ES')} - ${f.totales?.totalFactura?.toFixed(2) || '0.00'}€`,
                              }))}
                              value={formData.facturaRectificadaId || ''}
                              onValueChange={(value) => {
                                const factura = facturasDisponibles.find(f => f._id === value)
                                setFormData(prev => ({
                                  ...prev,
                                  facturaRectificadaId: value || undefined,
                                  facturaRectificadaCodigo: factura?.codigo,
                                  // Copiar datos del cliente de la factura original
                                  clienteId: typeof factura?.clienteId === 'object'
                                    ? factura.clienteId._id
                                    : factura?.clienteId || prev.clienteId,
                                  clienteNombre: factura?.clienteNombre || prev.clienteNombre,
                                  clienteNif: factura?.clienteNif || prev.clienteNif,
                                }))
                              }}
                              placeholder="Buscar factura emitida..."
                              searchPlaceholder="Código, cliente..."
                              emptyMessage={loadingFacturas ? "Cargando facturas..." : "No hay facturas disponibles"}
                              loading={loadingFacturas}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => buscarFacturasRectificables(busquedaFactura)}
                            disabled={loadingFacturas}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                        {formData.facturaRectificadaCodigo && (
                          <p className="text-sm text-muted-foreground">
                            Rectificando factura: <strong>{formData.facturaRectificadaCodigo}</strong>
                          </p>
                        )}
                      </div>

                      {/* Motivo de rectificación */}
                      <div className="space-y-2">
                        <Label htmlFor="motivoRectificacion">Motivo de rectificación *</Label>
                        <SearchableSelect
                          options={MOTIVOS_RECTIFICACION.map(m => ({
                            value: m.value,
                            label: m.label,
                          }))}
                          value={formData.motivoRectificacion || ''}
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            motivoRectificacion: value as MotivoRectificacion || undefined,
                          }))}
                          placeholder="Seleccionar motivo..."
                        />
                      </div>

                      {/* Descripción del motivo */}
                      <div className="space-y-2">
                        <Label htmlFor="descripcionRectificacion">Descripción del motivo</Label>
                        <Textarea
                          id="descripcionRectificacion"
                          value={formData.descripcionRectificacion || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            descripcionRectificacion: e.target.value,
                          }))}
                          placeholder="Describa detalladamente el motivo de la rectificación..."
                          rows={3}
                        />
                      </div>

                      {/* Aviso sobre productos vs servicios */}
                      <div className="flex items-start gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800 dark:text-amber-200">
                          <p className="font-medium">Importante:</p>
                          <p>
                            Para rectificar facturas con <strong>productos</strong>, primero debe crear un
                            <strong> albarán rectificativo</strong> (devolución de mercancía) y luego facturarlo.
                          </p>
                          <p className="mt-1">
                            Las facturas rectificativas directas solo se permiten para <strong>servicios</strong>.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <DateInput
                      value={typeof formData.fecha === 'string' ? formData.fecha : ''}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        fecha: value,
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="formaPago">Forma de pago</Label>
                    <SearchableSelect
                      options={formasPagoOptions}
                      value={formData.condiciones?.formaPagoId || ''}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        condiciones: { ...prev.condiciones, formaPagoId: value || undefined }
                      }))}
                      placeholder="Seleccionar..."
                      searchPlaceholder="Buscar..."
                      emptyMessage="No hay formas de pago"
                      allowClear
                      loading={loadingOptions}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terminoPago">Término de pago</Label>
                  <SearchableSelect
                    options={terminosPagoOptions}
                    value={formData.condiciones?.terminoPagoId || ''}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      condiciones: { ...prev.condiciones, terminoPagoId: value || undefined }
                    }))}
                    placeholder="Seleccionar..."
                    searchPlaceholder="Buscar..."
                    emptyMessage="No hay términos de pago"
                    allowClear
                    loading={loadingOptions}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <SearchableSelect
                    options={ESTADOS_FACTURA.map(e => ({ value: e.value, label: e.label }))}
                    value={formData.estado || EstadoFactura.BORRADOR}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value as EstadoFactura }))}
                    placeholder="Estado..."
                    disabled={initialData?.inmutable}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenciaCliente">Referencia cliente</Label>
                  <Input
                    id="referenciaCliente"
                    value={formData.referenciaCliente || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, referenciaCliente: e.target.value }))}
                    placeholder="Número de pedido, referencia..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Datos del Cliente */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Cliente</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateCliente(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <SearchableSelect
                    options={clientesOptions}
                    value={formData.clienteId}
                    onValueChange={handleClienteChange}
                    placeholder="Buscar cliente..."
                    disabled={loadingOptions}
                  />
                </div>

                {formData.clienteId && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>NIF</Label>
                        <Input value={formData.clienteNif || ''} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={formData.clienteEmail || ''} disabled />
                      </div>
                    </div>

                    {direccionesCliente.length > 0 && (
                      <div className="space-y-2">
                        <Label>Dirección de facturación</Label>
                        <SearchableSelect
                          options={direccionesOptions}
                          value=""
                          onValueChange={handleDireccionSelect}
                          placeholder="Seleccionar dirección..."
                        />
                        {formData.direccionFacturacion?.calle && (
                          <p className="text-sm text-muted-foreground">
                            {formData.direccionFacturacion.calle} {formData.direccionFacturacion.numero},
                            {formData.direccionFacturacion.codigoPostal} {formData.direccionFacturacion.ciudad}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Relaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Relaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="proyecto">Proyecto</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateProyecto(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <SearchableSelect
                    options={proyectosOptions}
                    value={formData.proyectoId || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, proyectoId: value }))}
                    placeholder="Seleccionar proyecto..."
                    disabled={loadingOptions}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="agente">Agente comercial</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateAgente(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <SearchableSelect
                    options={agentesOptions}
                    value={formData.agenteComercialId || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, agenteComercialId: value }))}
                    placeholder="Seleccionar agente..."
                    disabled={loadingOptions}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumen de totales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal bruto:</span>
                    <span>{formatCurrency(totales.subtotalBruto)}</span>
                  </div>
                  {totales.totalDescuentos > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Descuentos:</span>
                      <span>-{formatCurrency(totales.totalDescuentos)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Subtotal neto:</span>
                    <span>{formatCurrency(totales.subtotalNeto)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA:</span>
                    <span>{formatCurrency(totales.totalIva)}</span>
                  </div>
                  {totales.totalRecargoEquivalencia > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Recargo equiv.:</span>
                      <span>{formatCurrency(totales.totalRecargoEquivalencia)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(totales.totalFactura)}</span>
                    </div>
                  </div>
                  {/* Coste total - solo si puede ver costes */}
                  {mostrarCostes && (
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Coste total:</span>
                        <span>{formatCurrency(totales.costeTotal)}</span>
                      </div>
                    </div>
                  )}
                  {/* Margen - solo si puede ver márgenes */}
                  {mostrarMargenes && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Margen:</span>
                      <span>{formatCurrency(totales.margenBruto)} ({totales.margenPorcentaje.toFixed(1)}%)</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: LÍNEAS */}
        <TabsContent value="lineas" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Líneas de factura</CardTitle>
                <CardDescription>
                  Pulse Ctrl+Enter o Enter en cantidad para añadir líneas rápidamente
                </CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={() => handleAddLinea(TipoLinea.PRODUCTO)}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Línea
              </Button>
            </CardHeader>
            <CardContent>
              {(!formData.lineas || formData.lineas.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay líneas en esta factura</p>
                  <p className="text-sm">Pulse "Añadir línea" para comenzar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Encabezados */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 pb-2 border-b">
                    <div className="col-span-1">Tipo</div>
                    <div className="col-span-3">Producto / Descripción</div>
                    <div className="col-span-1 text-right">Cant.</div>
                    <div className="col-span-1 text-right">Precio</div>
                    {mostrarCostes && <div className="col-span-1 text-right">Coste</div>}
                    <div className="col-span-1 text-right">Dto.%</div>
                    <div className="col-span-1 text-right">IVA%</div>
                    <div className={`${mostrarCostes ? 'col-span-1' : 'col-span-2'} text-right`}>Total</div>
                    {mostrarCostes && <div className="col-span-1 text-right">Margen</div>}
                    <div className="col-span-1"></div>
                  </div>

                  {/* Líneas */}
                  {formData.lineas.map((linea, index) => (
                    <div
                      key={(linea as any)._id || index}
                      className="grid grid-cols-12 gap-2 items-center py-2 px-2 rounded hover:bg-muted/50"
                    >
                      {/* Tipo */}
                      <div className="col-span-1">
                        <select
                          value={linea.tipo}
                          onChange={(e) => handleUpdateLinea(index, { tipo: e.target.value as TipoLinea })}
                          className="h-9 w-full text-xs rounded-md border border-input bg-background px-2"
                        >
                          {TIPOS_LINEA.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Producto */}
                      <div className="col-span-3">
                        {linea.tipo === TipoLinea.TEXTO || linea.tipo === TipoLinea.SUBTOTAL ? (
                          <Input
                            value={linea.nombre}
                            onChange={(e) => handleNombreChange(index, e.target.value)}
                            placeholder={linea.tipo === TipoLinea.TEXTO ? 'Texto libre...' : 'Subtotal'}
                            className="text-sm"
                          />
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <EditableSearchableSelect
                                inputRef={(el: HTMLInputElement | null) => {
                                  if (el) productoRefs.current.set(index, el)
                                }}
                                options={productosOptions}
                                value={linea.productoId || ''}
                                displayValue={linea.nombre}
                                onValueChange={(value) => handleProductoSelect(index, value)}
                                onDisplayValueChange={(value) => handleNombreChange(index, value)}
                                onEnterPress={() => handleProductEnterPress(index)}
                                placeholder="Buscar producto..."
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={() => handleOpenDescripcionDialog(index)}
                                title="Editar descripciones"
                              >
                                <AlignLeft className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                            {linea.descripcion && (
                              <p className="text-xs text-muted-foreground truncate">{linea.descripcion}</p>
                            )}
                            {/* Indicador de kit */}
                            {linea.tipo === TipoLinea.KIT && (
                              <Badge variant="secondary" className="flex-shrink-0 gap-1 mt-1 w-fit">
                                <Layers className="h-3 w-3" />
                                Kit
                              </Badge>
                            )}
                            {/* Componentes del kit expandidos */}
                            {linea.tipo === TipoLinea.KIT && linea.mostrarComponentes && linea.componentesKit && linea.componentesKit.length > 0 && (
                              <div className="ml-2 mt-2 space-y-1 border-l-2 border-primary/20 pl-3">
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  Componentes del kit ({linea.componentesKit.length}):
                                </div>
                                {linea.componentesKit.map((comp, compIndex) => (
                                  <div
                                    key={compIndex}
                                    className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${
                                      comp.opcional ? 'bg-amber-50 border border-amber-200' : 'bg-muted/50'
                                    }`}
                                  >
                                    <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    <span className="flex-1 truncate">{comp.nombre}</span>
                                    <span className="text-muted-foreground">x{comp.cantidad}</span>
                                    {comp.opcional && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                                        Opcional
                                      </Badge>
                                    )}
                                    <span className="font-medium">{formatCurrency(comp.subtotal)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Cantidad */}
                      <div className="col-span-1">
                        {linea.tipo !== TipoLinea.TEXTO && linea.tipo !== TipoLinea.SUBTOTAL && (
                          <Input
                            ref={(el) => {
                              if (el) cantidadRefs.current.set(index, el)
                            }}
                            type="number"
                            min="0"
                            step="0.01"
                            value={linea.cantidad}
                            onChange={(e) => handleUpdateLinea(index, { cantidad: parseFloat(e.target.value) || 0 })}
                            onKeyDown={(e) => handleCantidadKeyDown(e, index)}
                            className="text-right text-sm"
                          />
                        )}
                      </div>

                      {/* Precio */}
                      <div className="col-span-1">
                        {linea.tipo !== TipoLinea.TEXTO && linea.tipo !== TipoLinea.SUBTOTAL && (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={linea.precioUnitario}
                            onChange={(e) => handleUpdateLinea(index, { precioUnitario: parseFloat(e.target.value) || 0 })}
                            className="text-right text-sm"
                            disabled={!canModificarPVP()}
                          />
                        )}
                      </div>

                      {/* Coste */}
                      {mostrarCostes && (
                        <div className="col-span-1">
                          {linea.tipo !== TipoLinea.TEXTO && linea.tipo !== TipoLinea.SUBTOTAL && (
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={linea.costeUnitario}
                              onChange={(e) => handleUpdateLinea(index, { costeUnitario: parseFloat(e.target.value) || 0 })}
                              className="text-right text-sm"
                            />
                          )}
                        </div>
                      )}

                      {/* Descuento */}
                      <div className="col-span-1">
                        {linea.tipo !== TipoLinea.TEXTO && linea.tipo !== TipoLinea.SUBTOTAL && (
                          <Input
                            type="number"
                            min="0"
                            max={canAplicarDescuentos() ? getDescuentoMaximo() : 0}
                            step="0.1"
                            value={linea.descuento}
                            onChange={(e) => {
                              const valor = parseFloat(e.target.value) || 0
                              const max = getDescuentoMaximo()
                              handleUpdateLinea(index, { descuento: Math.min(valor, max) })
                            }}
                            className="text-right text-sm"
                            disabled={!canAplicarDescuentos()}
                          />
                        )}
                      </div>

                      {/* IVA */}
                      <div className="col-span-1">
                        {linea.tipo !== TipoLinea.TEXTO && linea.tipo !== TipoLinea.SUBTOTAL && (
                          <SearchableSelect
                            options={[
                              { value: '21', label: '21%' },
                              { value: '10', label: '10%' },
                              { value: '4', label: '4%' },
                              { value: '0', label: '0%' },
                            ]}
                            value={linea.iva?.toString() || '21'}
                            onValueChange={(value) => handleUpdateLinea(index, { iva: parseInt(value) })}
                          />
                        )}
                      </div>

                      {/* Total */}
                      <div className={`${mostrarCostes ? 'col-span-1' : 'col-span-2'} text-right font-medium`}>
                        {linea.tipo !== TipoLinea.TEXTO && (
                          <span>{formatCurrency(linea.subtotal || 0)}</span>
                        )}
                      </div>

                      {/* Margen */}
                      {mostrarMargenes && (
                        <div className="col-span-1 text-right">
                          {linea.tipo !== TipoLinea.TEXTO && linea.tipo !== TipoLinea.SUBTOTAL && (
                            <span className={linea.margenPorcentaje >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {linea.margenPorcentaje?.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="col-span-1 flex justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleMoveLinea(index, 'up')}
                          disabled={index === 0}
                          title="Subir"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleMoveLinea(index, 'down')}
                          disabled={index === formData.lineas!.length - 1}
                          title="Bajar"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDuplicateLinea(index)}
                          title="Duplicar"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveLinea(index)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Descuento global - solo si puede aplicar descuentos */}
          {canAplicarDescuentos() && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="descuentoGlobal" className="whitespace-nowrap">
                    Descuento global:
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="descuentoGlobal"
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
                          descuentoGlobalPorcentaje: Math.min(valor, max)
                        }))
                      }}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    {getDescuentoMaximo() < 100 && (
                      <span className="text-xs text-muted-foreground">(máx: {getDescuentoMaximo()}%)</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: VENCIMIENTOS */}
        <TabsContent value="vencimientos" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vencimientos de cobro</CardTitle>
                <CardDescription>
                  Configure los plazos y métodos de pago
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerarVencimientosAuto}
                  disabled={!formData.fecha}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Generar automático
                </Button>
                <Button type="button" variant="outline" onClick={handleAddVencimiento}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir vencimiento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(!formData.vencimientos || formData.vencimientos.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay vencimientos configurados</p>
                  <p className="text-sm">Añada vencimientos o genérelos automáticamente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-4 text-xs font-medium text-muted-foreground px-2 pb-2 border-b">
                    <div>Nº</div>
                    <div>Fecha</div>
                    <div>Método</div>
                    <div className="text-right">Importe</div>
                    <div>Estado</div>
                    <div></div>
                  </div>

                  {formData.vencimientos.map((venc, index) => (
                    <div
                      key={(venc as any)._id || index}
                      className="grid grid-cols-6 gap-4 items-center py-2 px-2 rounded hover:bg-muted/50"
                    >
                      <div className="font-medium">#{venc.numero}</div>
                      <div>{new Date(venc.fecha).toLocaleDateString('es-ES')}</div>
                      <div>{METODOS_PAGO.find(m => m.value === venc.metodoPago)?.label}</div>
                      <div className="text-right font-medium">{formatCurrency(venc.importe)}</div>
                      <div>
                        <Badge variant={venc.cobrado ? 'default' : 'secondary'}>
                          {venc.cobrado ? 'Cobrado' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVencimiento(index)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVencimiento(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Resumen */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between text-sm">
                      <span>Total vencimientos:</span>
                      <span className="font-medium">
                        {formatCurrency(formData.vencimientos.reduce((sum, v) => sum + v.importe, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Total factura:</span>
                      <span className="font-medium">{formatCurrency(totales.totalFactura)}</span>
                    </div>
                    {Math.abs(formData.vencimientos.reduce((sum, v) => sum + v.importe, 0) - totales.totalFactura) > 0.01 && (
                      <div className="flex justify-between text-sm mt-1 text-orange-600">
                        <span>Diferencia:</span>
                        <span className="font-medium">
                          {formatCurrency(totales.totalFactura - formData.vencimientos.reduce((sum, v) => sum + v.importe, 0))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: FISCAL */}
        <TabsContent value="fiscal" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración fiscal</CardTitle>
              <CardDescription>
                Parámetros fiscales y sistema de verificación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sistema fiscal</Label>
                  <SearchableSelect
                    options={SISTEMAS_FISCALES.map(s => ({ value: s.value, label: s.label, description: s.descripcion }))}
                    value={formData.sistemaFiscal || SistemaFiscal.VERIFACTU}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sistemaFiscal: value as SistemaFiscal }))}
                    disabled={initialData?.inmutable}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Régimen IVA</Label>
                  <SearchableSelect
                    options={[
                      { value: 'general', label: 'Régimen general' },
                      { value: 'simplificado', label: 'Régimen simplificado' },
                      { value: 'recargo', label: 'Recargo de equivalencia' },
                      { value: 'exento', label: 'Exento' },
                      { value: 'intracomunitario', label: 'Intracomunitario' },
                      { value: 'exportacion', label: 'Exportación' },
                    ]}
                    value={formData.regimenIva || 'general'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, regimenIva: value }))}
                    disabled={initialData?.inmutable}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Retención IRPF (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="25"
                    step="0.5"
                    value={formData.retencionIRPF || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, retencionIRPF: parseFloat(e.target.value) || 0 }))}
                    disabled={initialData?.inmutable}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Clave operación</Label>
                  <Input
                    value={formData.claveOperacion || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, claveOperacion: e.target.value }))}
                    placeholder="Ej: F1, F2..."
                    disabled={initialData?.inmutable}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="recargoEquivalenciaFiscal"
                    checked={formData.recargoEquivalencia || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recargoEquivalencia: checked }))}
                    disabled={initialData?.inmutable}
                  />
                  <Label htmlFor="recargoEquivalenciaFiscal">Aplicar recargo de equivalencia</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: OTROS */}
        <TabsContent value="otros" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Observaciones (visibles en factura)</Label>
                  <Textarea
                    value={formData.observaciones || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    rows={4}
                    placeholder="Observaciones para el cliente..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observaciones internas</Label>
                  <Textarea
                    value={formData.observacionesInternas || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacionesInternas: e.target.value }))}
                    rows={3}
                    placeholder="Notas internas (no visibles en factura)..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Condiciones y pie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Condiciones de pago</Label>
                  <Textarea
                    value={formData.condicionesPago || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, condicionesPago: e.target.value }))}
                    rows={3}
                    placeholder="Condiciones de pago..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pie de factura</Label>
                  <Textarea
                    value={formData.pieFactura || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pieFactura: e.target.value }))}
                    rows={3}
                    placeholder="Texto pie de factura..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
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
                  placeholder="Etiquetas separadas por comas..."
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botones de acción */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={isLoading || initialData?.inmutable}
          className="min-w-32"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Crear factura' : 'Guardar cambios'}
            </>
          )}
        </Button>
      </div>

      {/* Diálogos */}

      {/* Diálogo de descripción */}
      <Dialog open={showDescripcionDialog} onOpenChange={setShowDescripcionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar descripciones</DialogTitle>
            <DialogDescription>
              Modifique las descripciones de esta línea
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descripción corta</Label>
              <Input
                value={descripcionEdit.corta}
                onChange={(e) => setDescripcionEdit(prev => ({ ...prev, corta: e.target.value }))}
                placeholder="Descripción corta..."
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción larga</Label>
              <Textarea
                value={descripcionEdit.larga}
                onChange={(e) => setDescripcionEdit(prev => ({ ...prev, larga: e.target.value }))}
                rows={4}
                placeholder="Descripción detallada..."
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

      {/* Diálogo de margen */}
      <Dialog open={showMargenDialog} onOpenChange={setShowMargenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar margen</DialogTitle>
            <DialogDescription>
              Configure el margen a aplicar a las líneas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de cálculo</Label>
              <SearchableSelect
                options={[
                  { value: 'porcentaje', label: 'Porcentaje' },
                  { value: 'importe', label: 'Importe fijo' },
                ]}
                value={margenConfig.tipo}
                onValueChange={(value) => setMargenConfig(prev => ({ ...prev, tipo: value as 'porcentaje' | 'importe' }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={margenConfig.valor}
                onChange={(e) => setMargenConfig(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Aplicar a</Label>
              <SearchableSelect
                options={[
                  { value: 'todas', label: 'Todas las líneas' },
                  { value: 'productos', label: 'Solo productos' },
                  { value: 'servicios', label: 'Solo servicios' },
                ]}
                value={margenConfig.aplicarA}
                onValueChange={(value) => setMargenConfig(prev => ({ ...prev, aplicarA: value as 'todas' | 'productos' | 'servicios' }))}
              />
            </div>
            {margenConfig.tipo === 'porcentaje' && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={margenConfig.sobreCoste}
                  onCheckedChange={(checked) => setMargenConfig(prev => ({ ...prev, sobreCoste: checked }))}
                />
                <Label>Calcular sobre coste</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMargenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAplicarMargen}>
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de vencimiento */}
      <Dialog open={showVencimientoDialog} onOpenChange={setShowVencimientoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {vencimientoEditIndex !== null ? 'Editar vencimiento' : 'Nuevo vencimiento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <DateInput
                  value={typeof nuevoVencimiento.fecha === 'string' ? nuevoVencimiento.fecha : ''}
                  onChange={(value) => setNuevoVencimiento(prev => ({
                    ...prev,
                    fecha: value,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Importe</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={nuevoVencimiento.importe}
                  onChange={(e) => setNuevoVencimiento(prev => ({
                    ...prev,
                    importe: parseFloat(e.target.value) || 0,
                  }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <SearchableSelect
                options={METODOS_PAGO.map(m => ({ value: m.value, label: m.label }))}
                value={nuevoVencimiento.metodoPago}
                onValueChange={(value) => setNuevoVencimiento(prev => ({
                  ...prev,
                  metodoPago: value as MetodoPago,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input
                value={nuevoVencimiento.observaciones || ''}
                onChange={(e) => setNuevoVencimiento(prev => ({
                  ...prev,
                  observaciones: e.target.value,
                }))}
                placeholder="Observaciones..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVencimientoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveVencimiento}>
              {vencimientoEditIndex !== null ? 'Guardar' : 'Añadir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Selector de variantes */}
      {productoConVariantes && (
        <VarianteSelector
          open={varianteSelectorOpen}
          onOpenChange={setVarianteSelectorOpen}
          producto={productoConVariantes}
          onSelect={handleVarianteSelect}
          onSelectMultiple={handleVariantesMultipleSelect}
          onSelectBase={handleUsarProductoBase}
          multiSelect={true}
        />
      )}

      {/* Diálogos de creación */}
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
      />
    </form>
  )
}

export default FacturaForm
