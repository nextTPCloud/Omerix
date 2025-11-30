'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  IPresupuesto,
  CreatePresupuestoDTO,
  UpdatePresupuestoDTO,
  ILineaPresupuesto,
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
  Import,
  GripVertical,
} from 'lucide-react'

// Components
import { SearchableSelect } from '@/components/ui/searchable-select'
import { FullCreateCliente, FullCreateAgenteComercial, FullCreateProyecto } from '@/components/full-create'
import { DateInput } from '@/components/ui/date-picker'

// Services
import { clientesService } from '@/services/clientes.service'
import { agentesService } from '@/services/agentes-comerciales.service'
import { proyectosService } from '@/services/proyectos.service'
import { productosService } from '@/services/productos.service'
import { presupuestosService } from '@/services/presupuestos.service'

// Types
import { Cliente, DireccionExtendida } from '@/types/cliente.types'
import { AgenteComercial } from '@/types/agente-comercial.types'
import { IProyecto } from '@/types/proyecto.types'
import { Producto } from '@/types/producto.types'
import { toast } from 'sonner'

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

  // Opciones cargadas
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [agentes, setAgentes] = useState<AgenteComercial[]>([])
  const [proyectos, setProyectos] = useState<IProyecto[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingProductos, setLoadingProductos] = useState(false)

  // Direcciones del cliente seleccionado
  const [direccionesCliente, setDireccionesCliente] = useState<DireccionExtendida[]>([])

  // Estado de visibilidad de costes
  const [mostrarCostes, setMostrarCostes] = useState(true)

  // Diálogos
  const [showMargenDialog, setShowMargenDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showCreateCliente, setShowCreateCliente] = useState(false)
  const [showCreateAgente, setShowCreateAgente] = useState(false)
  const [showCreateProyecto, setShowCreateProyecto] = useState(false)
  const [margenConfig, setMargenConfig] = useState({
    tipo: 'porcentaje' as 'porcentaje' | 'importe',
    valor: 0,
    aplicarA: 'todas' as 'todas' | 'productos' | 'servicios',
    sobreCoste: true,
  })

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
        const [clientesRes, agentesRes, proyectosRes, productosRes] = await Promise.all([
          clientesService.getAll({ activo: true, limit: 100 }),
          agentesService.getAll({ activo: true, limit: 100 }),
          proyectosService.getAll({ activo: 'true', limit: 100 }),
          productosService.getAll({ activo: true, limit: 100 }),
        ])

        console.log('Respuestas cargadas:', { clientesRes, agentesRes, proyectosRes, productosRes })

        if (clientesRes.success) setClientes(clientesRes.data || [])
        if (agentesRes.success) setAgentes(agentesRes.data || [])
        if (proyectosRes.success) setProyectos(proyectosRes.data || [])
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
        condiciones: initialData.condiciones,
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

      setMostrarCostes(initialData.mostrarCostes !== false)
    }
  }, [initialData])

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
      setFormData(prev => ({
        ...prev,
        clienteId,
        clienteNombre: cliente.nombre,
        clienteNif: cliente.nif,
        clienteEmail: cliente.email,
        clienteTelefono: cliente.telefono,
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
      handleUpdateLinea(index, {
        productoId: producto._id,
        codigo: producto.sku || '',
        nombre: producto.nombre,
        descripcion: producto.descripcionCorta || producto.descripcion || '',
        precioUnitario: producto.precios?.venta || 0,
        costeUnitario: producto.precios?.compra || 0,
        iva: 21, // TODO: obtener IVA del tipo de impuesto del producto
        unidad: 'ud',
      })
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

  const handleAddLinea = (tipo: TipoLinea = TipoLinea.PRODUCTO) => {
    const newLinea = {
      ...crearLineaVacia((formData.lineas?.length || 0) + 1),
      tipo,
    }
    setFormData(prev => ({
      ...prev,
      lineas: [...(prev.lineas || []), newLinea as ILineaPresupuesto],
    }))
  }

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
              <div className="flex items-center gap-2">
                <Label htmlFor="mostrarCostes" className="text-sm cursor-pointer">
                  {mostrarCostes ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Label>
                <Switch
                  id="mostrarCostes"
                  checked={mostrarCostes}
                  onCheckedChange={(checked) => {
                    setMostrarCostes(checked)
                    setFormData(prev => ({ ...prev, mostrarCostes: checked }))
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {mostrarCostes ? 'Costes visibles' : 'Costes ocultos'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMargenDialog(true)}
              >
                <Percent className="h-4 w-4 mr-2" />
                Aplicar Margen
              </Button>
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
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                      placeholder="Auto-generado"
                      disabled={mode === 'edit'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serie">Serie</Label>
                    <Input
                      id="serie"
                      value={formData.serie || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, serie: e.target.value }))}
                      placeholder="Ej: PR"
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>NIF</Label>
                        <Input value={formData.clienteNif || ''} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={formData.clienteEmail || ''} disabled className="bg-muted" />
                      </div>
                    </div>

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
                        onChange={(e) => setFormData(prev => ({ ...prev, pedidoCliente: e.target.value }))}
                        placeholder="Número de pedido del cliente"
                      />
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
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: LINEAS DEL PRESUPUESTO */}
        {/* ============================================ */}
        <TabsContent value="lineas" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Líneas del Presupuesto</CardTitle>
                  <CardDescription>
                    {numLineas} línea{numLineas !== 1 ? 's' : ''} · Total: {formatCurrency(totales.totalPresupuesto)}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button">
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Línea
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleAddLinea(TipoLinea.PRODUCTO)}>
                      <Package className="h-4 w-4 mr-2" />
                      Producto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddLinea(TipoLinea.SERVICIO)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Servicio
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddLinea(TipoLinea.KIT)}>
                      <Package className="h-4 w-4 mr-2" />
                      Kit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleAddLinea(TipoLinea.TEXTO)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Texto/Comentario
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddLinea(TipoLinea.SUBTOTAL)}>
                      <Calculator className="h-4 w-4 mr-2" />
                      Subtotal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddLinea(TipoLinea.DESCUENTO)}>
                      <Percent className="h-4 w-4 mr-2" />
                      Descuento
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {/* Tabla de líneas */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="w-8 px-2 py-3"></th>
                      <th className="px-2 py-3 text-left">Tipo</th>
                      <th className="px-2 py-3 text-left min-w-[200px]">Descripción</th>
                      <th className="px-2 py-3 text-right w-20">Cant.</th>
                      {mostrarCostes && (
                        <th className="px-2 py-3 text-right w-24 text-blue-600">Coste</th>
                      )}
                      {mostrarCostes && (
                        <th className="px-2 py-3 text-right w-20 text-green-600" title="Edita el margen para recalcular el precio">Margen %</th>
                      )}
                      <th className="px-2 py-3 text-right w-24">Precio</th>
                      <th className="px-2 py-3 text-right w-20">Dto %</th>
                      <th className="px-2 py-3 text-right w-20">IVA %</th>
                      <th className="px-2 py-3 text-right w-28">Subtotal</th>
                      {mostrarCostes && (
                        <th className="px-2 py-3 text-right w-24 text-green-600">Margen €</th>
                      )}
                      <th className="w-24 px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.lineas || []).map((linea, index) => (
                      <tr key={index} className="border-b hover:bg-muted/30">
                        <td className="px-2 py-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={linea.tipo}
                            onChange={(e) => handleUpdateLinea(index, { tipo: e.target.value as TipoLinea })}
                            className="h-8 w-full text-xs rounded border border-input bg-background px-2"
                          >
                            {TIPOS_LINEA.map(tipo => (
                              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 min-w-[250px]">
                          {(linea.tipo === TipoLinea.PRODUCTO || linea.tipo === TipoLinea.KIT) ? (
                            <div className="space-y-1">
                              <SearchableSelect
                                options={productosOptions}
                                value={linea.productoId || ''}
                                onValueChange={(value) => handleProductoSelect(index, value)}
                                placeholder="Buscar producto..."
                                searchPlaceholder="Buscar por nombre o código..."
                                emptyMessage={loadingOptions ? "Cargando productos..." : "No se encontraron productos"}
                                loading={loadingOptions}
                                triggerClassName="h-8 text-xs"
                                className="w-[300px]"
                              />
                              {linea.productoId && (
                                <Input
                                  value={linea.nombre || ''}
                                  onChange={(e) => handleUpdateLinea(index, { nombre: e.target.value })}
                                  placeholder="Descripción adicional..."
                                  className="h-7 text-xs"
                                />
                              )}
                            </div>
                          ) : (
                            <Input
                              value={linea.nombre || ''}
                              onChange={(e) => handleUpdateLinea(index, { nombre: e.target.value })}
                              placeholder={linea.tipo === TipoLinea.TEXTO ? "Texto o comentario..." : "Descripción..."}
                              className="h-8 text-sm"
                            />
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={linea.cantidad || 0}
                            onChange={(e) => handleUpdateLinea(index, { cantidad: parseFloat(e.target.value) || 0 })}
                            className="h-8 text-sm text-right"
                          />
                        </td>
                        {mostrarCostes && (
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={linea.costeUnitario || 0}
                              onChange={(e) => handleUpdateLinea(index, { costeUnitario: parseFloat(e.target.value) || 0 })}
                              className="h-8 text-sm text-right text-blue-600"
                            />
                          </td>
                        )}
                        {mostrarCostes && (
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              step="0.1"
                              value={linea.margenPorcentaje || 0}
                              onChange={(e) => handleUpdateMargen(index, parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm text-right text-green-600"
                              title="Editar margen recalcula precio"
                            />
                          </td>
                        )}
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={linea.precioUnitario || 0}
                            onChange={(e) => handleUpdateLinea(index, { precioUnitario: parseFloat(e.target.value) || 0 })}
                            className="h-8 text-sm text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={linea.descuento || 0}
                            onChange={(e) => handleUpdateLinea(index, { descuento: parseFloat(e.target.value) || 0 })}
                            className="h-8 text-sm text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={linea.iva || 21}
                            onChange={(e) => handleUpdateLinea(index, { iva: parseInt(e.target.value) })}
                            className="h-8 w-full text-xs rounded border border-input bg-background px-2"
                          >
                            {TIPOS_IVA.map(tipo => (
                              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 text-right font-medium">
                          {formatCurrency(linea.subtotal || 0)}
                        </td>
                        {mostrarCostes && (
                          <td className="px-2 py-2 text-right">
                            <span className={linea.margenTotalLinea >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(linea.margenTotalLinea || 0)}
                            </span>
                          </td>
                        )}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
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
                              disabled={index === (formData.lineas?.length || 0) - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDuplicateLinea(index)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveLinea(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {numLineas === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay líneas en el presupuesto</p>
                    <p className="text-sm">Haz clic en "Añadir Línea" para comenzar</p>
                  </div>
                )}
              </div>

              {/* Totales */}
              {numLineas > 0 && (
                <div className="mt-6 flex justify-end">
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

                    {mostrarCostes && (
                      <>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between py-1 text-blue-600">
                            <span>Coste Total:</span>
                            <span>{formatCurrency(totales.costeTotal)}</span>
                          </div>
                          <div className={`flex justify-between py-1 font-medium ${totales.margenBruto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <span>Margen Bruto:</span>
                            <span>{formatCurrency(totales.margenBruto)} ({totales.margenPorcentaje.toFixed(1)}%)</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Descuento global */}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center gap-4">
                        <Label className="whitespace-nowrap">Descuento Global:</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={formData.descuentoGlobalPorcentaje || 0}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              descuentoGlobalPorcentaje: parseFloat(e.target.value) || 0,
                            }))}
                            className="w-20 h-8"
                          />
                          <span>%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
              <div className="space-y-2">
                <Label>Tipo de Entrega</Label>
                <select
                  value={formData.direccionEntrega?.tipo || 'cliente'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    direccionEntrega: {
                      ...prev.direccionEntrega,
                      tipo: e.target.value as 'cliente' | 'personalizada' | 'recogida',
                    },
                  }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="cliente">Dirección del cliente</option>
                  <option value="personalizada">Dirección personalizada</option>
                  <option value="recogida">Recogida en tienda</option>
                </select>
              </div>

              {/* Selector de direcciones del cliente */}
              {formData.direccionEntrega?.tipo === 'cliente' && formData.clienteId && (
                <div className="space-y-2">
                  <Label>Seleccionar dirección del cliente</Label>
                  {direccionesCliente.length > 0 ? (
                    <SearchableSelect
                      options={direccionesOptions}
                      value=""
                      onValueChange={handleDireccionSelect}
                      placeholder="Seleccionar una dirección..."
                      searchPlaceholder="Buscar dirección..."
                      emptyMessage="No hay direcciones disponibles"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                      El cliente no tiene direcciones registradas. Puede añadirlas desde la ficha del cliente.
                    </p>
                  )}
                  {formData.direccionEntrega?.calle && (
                    <div className="p-3 bg-muted rounded-md text-sm">
                      <p className="font-medium">{formData.direccionEntrega.nombre}</p>
                      <p>{formData.direccionEntrega.calle} {formData.direccionEntrega.numero}</p>
                      <p>{formData.direccionEntrega.codigoPostal} {formData.direccionEntrega.ciudad}</p>
                      {formData.direccionEntrega.provincia && <p>{formData.direccionEntrega.provincia}, {formData.direccionEntrega.pais}</p>}
                    </div>
                  )}
                </div>
              )}

              {formData.direccionEntrega?.tipo === 'cliente' && !formData.clienteId && (
                <p className="text-sm text-muted-foreground p-3 bg-amber-50 border border-amber-200 rounded-md">
                  Debe seleccionar un cliente primero para ver sus direcciones.
                </p>
              )}

              {formData.direccionEntrega?.tipo === 'personalizada' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Nombre / Empresa</Label>
                    <Input
                      value={formData.direccionEntrega?.nombre || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, nombre: e.target.value },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Calle</Label>
                    <Input
                      value={formData.direccionEntrega?.calle || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, calle: e.target.value },
                      }))}
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Piso</Label>
                      <Input
                        value={formData.direccionEntrega?.piso || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          direccionEntrega: { ...prev.direccionEntrega!, piso: e.target.value },
                        }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Código Postal</Label>
                    <Input
                      value={formData.direccionEntrega?.codigoPostal || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, codigoPostal: e.target.value },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Input
                      value={formData.direccionEntrega?.ciudad || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, ciudad: e.target.value },
                      }))}
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
                  <div className="space-y-2">
                    <Label>Persona de Contacto</Label>
                    <Input
                      value={formData.direccionEntrega?.personaContacto || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, personaContacto: e.target.value },
                      }))}
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
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Horario de Entrega</Label>
                    <Input
                      value={formData.direccionEntrega?.horarioEntrega || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, horarioEntrega: e.target.value },
                      }))}
                      placeholder="Ej: Lunes a Viernes de 9:00 a 18:00"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Instrucciones de Entrega</Label>
                    <Textarea
                      value={formData.direccionEntrega?.instrucciones || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        direccionEntrega: { ...prev.direccionEntrega!, instrucciones: e.target.value },
                      }))}
                      rows={3}
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
    </form>
  )
}

export default PresupuestoForm
