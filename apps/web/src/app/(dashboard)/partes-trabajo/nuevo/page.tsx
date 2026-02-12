'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { partesTrabajoService } from '@/services/partes-trabajo.service'
import { clientesService } from '@/services/clientes.service'
import { proyectosService } from '@/services/proyectos.service'
import { personalService } from '@/services/personal.service'
import { productosService } from '@/services/productos.service'
import { maquinariaService } from '@/services/maquinaria.service'
import { tiposGastoService } from '@/services/tipos-gasto.service'
import { empresaService } from '@/services/empresa.service'
import {
  CreateParteTrabajoDTO,
  TIPOS_PARTE_TRABAJO,
  PRIORIDADES,
  TipoParteTrabajo,
  Prioridad,
  LineaPersonal,
  LineaMaterial,
  LineaMaquinaria,
  LineaTransporte,
  LineaGasto,
  crearLineaPersonalVacia,
  crearLineaMaterialVacia,
  crearLineaMaquinariaVacia,
  crearLineaTransporteVacia,
  crearLineaGastoVacia,
} from '@/types/parte-trabajo.types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  SearchableSelect,
  SearchableSelectOption,
} from '@/components/ui/searchable-select'
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete'
import {
  ArrowLeft,
  Save,
  Wrench,
  RefreshCw,
  Calendar,
  Building2,
  FolderKanban,
  User,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  FileText,
  Settings,
  Package,
  Truck as TruckIcon,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Componentes de grid para líneas
import {
  LineasMaterialGrid,
  LineasPersonalGrid,
  LineasMaquinariaGrid,
  LineasTransporteGrid,
  LineasGastosGrid,
} from '@/components/partes-trabajo'

// Colores para prioridades
const PRIORIDAD_COLORS: Record<string, string> = {
  baja: 'bg-gray-100 text-gray-700 border-gray-300',
  media: 'bg-blue-100 text-blue-700 border-blue-300',
  alta: 'bg-orange-100 text-orange-700 border-orange-300',
  urgente: 'bg-red-100 text-red-700 border-red-300',
}

// Iconos para tipos de parte
const TIPO_ICONS: Record<string, string> = {
  mantenimiento: '🔧',
  instalacion: '🏗️',
  reparacion: '🛠️',
  servicio: '⚡',
  proyecto: '📋',
  otro: '📝',
}

export default function NuevoParteTrabajoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  // Listas para selects
  const [clientes, setClientes] = useState<any[]>([])
  const [proyectos, setProyectos] = useState<any[]>([])
  const [personal, setPersonal] = useState<any[]>([])
  const [productos, setProductos] = useState<any[]>([])
  const [maquinarias, setMaquinarias] = useState<any[]>([])
  const [tiposGasto, setTiposGasto] = useState<any[]>([])
  const [intervaloFacturacion, setIntervaloFacturacion] = useState<number>(15)
  const [decimalesPrecios, setDecimalesPrecios] = useState<number>(2)
  const [decimalesCantidad, setDecimalesCantidad] = useState<number>(2)
  const [mostrarCostes, setMostrarCostes] = useState(false)

  // Cliente seleccionado (para obtener direcciones)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null)

  // Form data
  const [formData, setFormData] = useState<CreateParteTrabajoDTO>({
    clienteId: '',
    tipo: 'servicio',
    prioridad: 'media',
    fecha: new Date().toISOString().split('T')[0],
    titulo: '',
    descripcion: '',
    lineasPersonal: [],
    lineasMaterial: [],
    lineasMaquinaria: [],
    lineasTransporte: [],
    lineasGastos: [],
  })

  // Horario planificado
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')

  // Direccion manual o auto
  const [usarDireccionCliente, setUsarDireccionCliente] = useState(true)

  // Estado para conflictos de disponibilidad de personal
  const [conflictosPersonal, setConflictosPersonal] = useState<Array<{
    personalId: string
    personalNombre: string
    parteId: string
    parteCodigo: string
    horaInicio: string
    horaFin: string
    lineaIndex: number
  }>>([])

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true)
      try {
        const [clientesRes, proyectosRes, personalRes, productosRes, maquinariasRes, tiposGastoRes, empresaRes] = await Promise.all([
          clientesService.getAll({ limit: 100, activo: true }),
          proyectosService.getAll({ limit: 100, activo: 'true' }),
          personalService.getAll({ limit: 100, activo: true }),
          productosService.getAll({ limit: 100, activo: true }),
          maquinariaService.getAll({ limit: 100, activo: 'true' }),
          tiposGastoService.getActivos(),
          empresaService.getMiEmpresa(),
        ])

        if (clientesRes.success) setClientes(clientesRes.data || [])
        if (proyectosRes.success) setProyectos(proyectosRes.data || [])
        if (personalRes.success) setPersonal(personalRes.data || [])
        if (productosRes.success) setProductos(productosRes.data || [])
        if (maquinariasRes.success) setMaquinarias(maquinariasRes.data || [])
        if (tiposGastoRes.success) setTiposGasto(tiposGastoRes.data || [])

        if (empresaRes.success && empresaRes.data) {
          if (empresaRes.data.intervaloFacturacion) {
            setIntervaloFacturacion(empresaRes.data.intervaloFacturacion)
          }
          if (empresaRes.data.decimalesPrecios !== undefined) {
            setDecimalesPrecios(empresaRes.data.decimalesPrecios)
          }
          if (empresaRes.data.decimalesCantidad !== undefined) {
            setDecimalesCantidad(empresaRes.data.decimalesCantidad)
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
  }, [])

  // Cuando cambia el cliente, actualizar direccion si corresponde
  useEffect(() => {
    if (formData.clienteId) {
      const cliente = clientes.find(c => c._id === formData.clienteId)
      setClienteSeleccionado(cliente)

      if (cliente && usarDireccionCliente) {
        const direccion = cliente.direccionFiscal || cliente.direccion ||
          cliente.direcciones?.find((d: any) => d.tipo === 'fiscal' || d.predeterminada) ||
          cliente.direcciones?.[0]

        if (direccion) {
          setFormData(prev => ({
            ...prev,
            direccionTrabajo: {
              calle: direccion.calle || '',
              numero: direccion.numero || '',
              codigoPostal: direccion.codigoPostal || '',
              ciudad: direccion.ciudad || '',
              provincia: direccion.provincia || '',
              pais: direccion.pais || 'España',
              coordenadas: direccion.coordenadas,
            }
          }))
        }
      }
    } else {
      setClienteSeleccionado(null)
    }
  }, [formData.clienteId, clientes, usarDireccionCliente])

  // Opciones para SearchableSelect
  const clienteOptions: SearchableSelectOption[] = useMemo(() =>
    clientes.map(c => ({
      value: c._id,
      label: c.nombre || c.nombreComercial || 'Sin nombre',
      description: c.nif || c.email || '',
    })), [clientes])

  const proyectosFiltrados = useMemo(() => {
    if (!formData.clienteId) return proyectos
    return proyectos.filter((p) =>
      p.clienteId === formData.clienteId ||
      p.clienteId?._id === formData.clienteId
    )
  }, [proyectos, formData.clienteId])

  const proyectoOptions: SearchableSelectOption[] = useMemo(() =>
    proyectosFiltrados.map(p => ({
      value: p._id,
      label: `${p.codigo || ''} - ${p.nombre || p.titulo || 'Sin nombre'}`.trim(),
      description: p.estado || '',
    })), [proyectosFiltrados])

  const personalOptions = useMemo(() => personal.map(p => ({
    value: p._id,
    label: `${p.nombre || ''} ${p.apellidos || ''}`.trim() || 'Sin nombre',
    description: p.cargo || p.categoria || '',
  })), [personal])

  const productosOptions = useMemo(() => productos.map(p => ({
    value: p._id,
    label: p.nombre || '',
    description: p.codigo || '',
  })), [productos])

  const productosServicioOptions = useMemo(() => productos
    .filter(p => p.tipo === 'servicio')
    .map(p => ({
      value: p._id,
      label: p.nombre || '',
      description: p.codigo || '',
    })), [productos])

  const maquinariasOptions = useMemo(() => maquinarias.map(m => ({
    value: m._id,
    label: m.nombre || '',
    description: m.codigo || m.matricula || '',
  })), [maquinarias])

  const tiposGastoOptions = useMemo(() => tiposGasto.map(t => ({
    value: t._id,
    label: t.nombre || '',
    description: t.codigo || '',
  })), [tiposGasto])

  const stepPrecios = useMemo(() => Math.pow(10, -decimalesPrecios), [decimalesPrecios])
  const stepCantidad = useMemo(() => Math.pow(10, -decimalesCantidad), [decimalesCantidad])

  // Función para calcular horas desde hora inicio y fin
  const calcularHorasDesdeHorario = useCallback((horaInicioStr?: string, horaFinStr?: string): number => {
    if (!horaInicioStr || !horaFinStr) return 0
    const [hiH, hiM] = horaInicioStr.split(':').map(Number)
    const [hfH, hfM] = horaFinStr.split(':').map(Number)
    const inicioMinutos = hiH * 60 + hiM
    const finMinutos = hfH * 60 + hfM
    const diferenciaMinutos = finMinutos - inicioMinutos
    if (diferenciaMinutos <= 0) return 0
    const minutosRedondeados = Math.ceil(diferenciaMinutos / intervaloFacturacion) * intervaloFacturacion
    return minutosRedondeados / 60
  }, [intervaloFacturacion])

  // ========================================
  // HANDLERS PARA LÍNEAS DE MATERIAL
  // ========================================

  const agregarLineaMaterial = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      lineasMaterial: [...(prev.lineasMaterial || []), crearLineaMaterialVacia() as LineaMaterial]
    }))
  }, [])

  const actualizarLineaMaterial = useCallback((index: number, campo: string, valor: any) => {
    setFormData(prev => {
      const lineas = [...((prev.lineasMaterial as LineaMaterial[]) || [])]
      lineas[index] = { ...lineas[index], [campo]: valor }
      const l = lineas[index]
      l.costeTotal = (l.cantidad || 0) * (l.precioCoste || 0)
      const subtotal = (l.cantidad || 0) * (l.precioVenta || 0)
      l.ventaTotal = subtotal - (subtotal * (l.descuento || 0) / 100)
      return { ...prev, lineasMaterial: lineas }
    })
  }, [])

  const eliminarLineaMaterial = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      lineasMaterial: (prev.lineasMaterial || []).filter((_, i) => i !== index)
    }))
  }, [])

  const seleccionarProductoMaterial = useCallback((index: number, productoId: string, producto?: any) => {
    setFormData(prev => {
      const lineas = [...((prev.lineasMaterial as LineaMaterial[]) || [])]
      lineas[index] = {
        ...lineas[index],
        productoId: productoId || undefined,
        productoNombre: producto?.nombre || '',
        productoCodigo: producto?.sku || producto?.codigo || '',
        nombre: producto?.nombre || lineas[index].nombre || '',
        precioCoste: producto?.coste || lineas[index].precioCoste || 0,
        precioVenta: producto?.precioVenta || lineas[index].precioVenta || 0,
        unidad: producto?.unidad || lineas[index].unidad || 'ud',
      }
      const l = lineas[index]
      l.costeTotal = (l.cantidad || 0) * (l.precioCoste || 0)
      const subtotal = (l.cantidad || 0) * (l.precioVenta || 0)
      l.ventaTotal = subtotal - (subtotal * (l.descuento || 0) / 100)
      return { ...prev, lineasMaterial: lineas }
    })
  }, [])

  // ========================================
  // HANDLERS PARA LÍNEAS DE PERSONAL
  // ========================================

  const agregarLineaPersonal = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      lineasPersonal: [...(prev.lineasPersonal || []), crearLineaPersonalVacia() as LineaPersonal]
    }))
  }, [])

  const actualizarLineaPersonal = useCallback((index: number, campo: string, valor: any) => {
    setFormData(prev => {
      const lineas = [...((prev.lineasPersonal as LineaPersonal[]) || [])]
      lineas[index] = { ...lineas[index], [campo]: valor }
      if (campo === 'horaInicio' || campo === 'horaFin') {
        lineas[index].horasTrabajadas = calcularHorasDesdeHorario(lineas[index].horaInicio, lineas[index].horaFin)
      }
      const l = lineas[index]
      const horas = (l.horasTrabajadas || 0) + (l.horasExtras || 0)
      l.costeTotal = horas * (l.tarifaHoraCoste || 0)
      l.ventaTotal = horas * (l.tarifaHoraVenta || 0)
      return { ...prev, lineasPersonal: lineas }
    })
  }, [calcularHorasDesdeHorario])

  const eliminarLineaPersonal = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      lineasPersonal: (prev.lineasPersonal || []).filter((_, i) => i !== index)
    }))
    setConflictosPersonal(prev => prev.filter(c => c.lineaIndex !== index))
  }, [])

  const seleccionarPersonal = useCallback((index: number, personalId: string, persona?: any) => {
    setFormData(prev => {
      const lineas = [...((prev.lineasPersonal as LineaPersonal[]) || [])]
      lineas[index] = {
        ...lineas[index],
        personalId: personalId || undefined,
        personalNombre: persona ? `${persona.nombre} ${persona.apellidos || ''}`.trim() : '',
      }
      return { ...prev, lineasPersonal: lineas }
    })
  }, [])

  const seleccionarServicioPersonal = useCallback((index: number, servicioId: string, servicio?: any) => {
    setFormData(prev => {
      const lineas = [...((prev.lineasPersonal as LineaPersonal[]) || [])]
      lineas[index] = {
        ...lineas[index],
        productoServicioId: servicioId || undefined,
        productoServicioCodigo: servicio?.codigo || servicio?.sku || '',
        productoServicioNombre: servicio?.nombre || '',
        tarifaHoraCoste: servicio?.precios?.compra || servicio?.coste || lineas[index].tarifaHoraCoste || 0,
        tarifaHoraVenta: servicio?.precios?.venta || servicio?.precioVenta || lineas[index].tarifaHoraVenta || 0,
      }
      const l = lineas[index]
      const horas = (l.horasTrabajadas || 0) + (l.horasExtras || 0)
      l.costeTotal = horas * (l.tarifaHoraCoste || 0)
      l.ventaTotal = horas * (l.tarifaHoraVenta || 0)
      return { ...prev, lineasPersonal: lineas }
    })
  }, [])

  // ========================================
  // HANDLERS PARA LÍNEAS DE MAQUINARIA
  // ========================================

  const agregarLineaMaquinaria = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      lineasMaquinaria: [...(prev.lineasMaquinaria || []), crearLineaMaquinariaVacia() as LineaMaquinaria]
    }))
  }, [])

  const actualizarLineaMaquinaria = useCallback((index: number, campo: string, valor: any) => {
    setFormData(prev => {
      const lineas = [...((prev.lineasMaquinaria as LineaMaquinaria[]) || [])]
      lineas[index] = { ...lineas[index], [campo]: valor }
      const l = lineas[index]
      l.costeTotal = (l.cantidad || 0) * (l.tarifaCoste || 0)
      l.ventaTotal = (l.cantidad || 0) * (l.tarifaVenta || 0)
      return { ...prev, lineasMaquinaria: lineas }
    })
  }, [])

  const eliminarLineaMaquinaria = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      lineasMaquinaria: (prev.lineasMaquinaria || []).filter((_, i) => i !== index)
    }))
  }, [])

  const seleccionarMaquinaria = useCallback((index: number, maquinariaId: string, maquinaria?: any) => {
    setFormData(prev => {
      const lineas = [...((prev.lineasMaquinaria as LineaMaquinaria[]) || [])]
      lineas[index] = {
        ...lineas[index],
        maquinariaId: maquinariaId || undefined,
        nombre: maquinaria?.nombre || '',
        codigo: maquinaria?.codigo || '',
        tarifaCoste: maquinaria?.tarifaHoraCoste || lineas[index].tarifaCoste || 0,
        tarifaVenta: maquinaria?.tarifaHoraVenta || lineas[index].tarifaVenta || 0,
      }
      const l = lineas[index]
      l.costeTotal = (l.cantidad || 0) * (l.tarifaCoste || 0)
      l.ventaTotal = (l.cantidad || 0) * (l.tarifaVenta || 0)
      return { ...prev, lineasMaquinaria: lineas }
    })
  }, [])

  // ========================================
  // HANDLERS PARA LÍNEAS DE TRANSPORTE
  // ========================================

  const agregarLineaTransporte = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      lineasTransporte: [...(prev.lineasTransporte || []), crearLineaTransporteVacia() as LineaTransporte]
    }))
  }, [])

  const actualizarLineaTransporte = useCallback((index: number, campo: string, valor: any) => {
    setFormData(prev => {
      const lineas = [...((prev.lineasTransporte as LineaTransporte[]) || [])]
      lineas[index] = { ...lineas[index], [campo]: valor }
      const l = lineas[index]
      const costeKm = (l.kmRecorridos || 0) * (l.tarifaPorKm || 0)
      l.costeTotal = costeKm + (l.importeFijoViaje || 0) + (l.peajes || 0) + (l.combustible || 0)
      return { ...prev, lineasTransporte: lineas }
    })
  }, [])

  const eliminarLineaTransporte = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      lineasTransporte: (prev.lineasTransporte || []).filter((_, i) => i !== index)
    }))
  }, [])

  // ========================================
  // HANDLERS PARA LÍNEAS DE GASTOS
  // ========================================

  const agregarLineaGasto = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      lineasGastos: [...(prev.lineasGastos || []), crearLineaGastoVacia() as LineaGasto]
    }))
  }, [])

  const actualizarLineaGasto = useCallback((index: number, campo: string, valor: any) => {
    setFormData(prev => {
      const lineas = [...((prev.lineasGastos as LineaGasto[]) || [])]
      lineas[index] = { ...lineas[index], [campo]: valor }
      const l = lineas[index]
      l.importeFacturable = (l.importe || 0) * (1 + (l.margen || 0) / 100)
      return { ...prev, lineasGastos: lineas }
    })
  }, [])

  const eliminarLineaGasto = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      lineasGastos: (prev.lineasGastos || []).filter((_, i) => i !== index)
    }))
  }, [])

  const seleccionarTipoGasto = useCallback((index: number, tipoGastoId: string, tipoGastoObj?: any) => {
    setFormData(prev => {
      const lineas = [...((prev.lineasGastos as LineaGasto[]) || [])]
      lineas[index] = {
        ...lineas[index],
        tipoGastoId: tipoGastoId || undefined,
        tipoGastoNombre: tipoGastoObj?.nombre || '',
        margen: tipoGastoObj?.margenPorDefecto || lineas[index].margen || 0,
        iva: tipoGastoObj?.ivaPorDefecto || lineas[index].iva || 21,
      }
      const l = lineas[index]
      l.importeFacturable = (l.importe || 0) * (1 + (l.margen || 0) / 100)
      return { ...prev, lineasGastos: lineas }
    })
  }, [])

  // Manejar seleccion de direccion desde autocomplete
  const handleAddressSelect = (address: any) => {
    setFormData(prev => ({
      ...prev,
      direccionTrabajo: {
        calle: address.calle || '',
        numero: address.numero || '',
        codigoPostal: address.codigoPostal || '',
        ciudad: address.ciudad || '',
        provincia: address.provincia || '',
        pais: address.pais || 'España',
        coordenadas: address.latitud && address.longitud ? {
          lat: address.latitud,
          lng: address.longitud,
        } : undefined,
      }
    }))
    setUsarDireccionCliente(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clienteId) {
      toast.error('El cliente es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const dataToSend: CreateParteTrabajoDTO = {
        ...formData,
        fechaInicio: horaInicio
          ? `${formData.fecha}T${horaInicio}:00`
          : `${formData.fecha}T08:00:00`,
        fechaFin: horaFin ? `${formData.fecha}T${horaFin}:00` : undefined,
      }

      const response = await partesTrabajoService.create(dataToSend)
      if (response.success && response.data) {
        toast.success('Parte de trabajo creado correctamente')
        router.push(`/partes-trabajo/${response.data._id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear el parte de trabajo')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
      
    )
  }

  return (
    
      <div className="w-full max-w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/partes-trabajo">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Wrench className="h-7 w-7 text-primary" />
                Nuevo Parte de Trabajo
              </h1>
              <p className="text-sm text-muted-foreground">
                Configura todos los datos del parte de trabajo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/partes-trabajo">Cancelar</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || !formData.clienteId}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Crear Parte'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex flex-wrap gap-1">
              <TabsTrigger value="general">
                <FileText className="h-4 w-4 mr-2 hidden sm:inline" />
                General
              </TabsTrigger>
              <TabsTrigger value="personal">
                <Users className="h-4 w-4 mr-2 hidden sm:inline" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="material">
                <Package className="h-4 w-4 mr-2 hidden sm:inline" />
                Material
              </TabsTrigger>
              <TabsTrigger value="maquinaria">
                <Wrench className="h-4 w-4 mr-2 hidden sm:inline" />
                Maquinaria
              </TabsTrigger>
              <TabsTrigger value="transporte">
                <TruckIcon className="h-4 w-4 mr-2 hidden sm:inline" />
                Transporte
              </TabsTrigger>
              <TabsTrigger value="gastos">
                <Wallet className="h-4 w-4 mr-2 hidden sm:inline" />
                Gastos
              </TabsTrigger>
            </TabsList>

            {/* TAB: General */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Cliente y Proyecto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Cliente *</Label>
                      <SearchableSelect
                        options={clienteOptions}
                        value={formData.clienteId}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          clienteId: value,
                          proyectoId: undefined
                        })}
                        placeholder="Buscar cliente..."
                        searchPlaceholder="Escribe para buscar..."
                        emptyMessage="No se encontraron clientes"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4" />
                        Proyecto
                      </Label>
                      <SearchableSelect
                        options={proyectoOptions}
                        value={formData.proyectoId || ''}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          proyectoId: value || undefined
                        })}
                        placeholder="Sin proyecto asignado"
                        searchPlaceholder="Buscar proyecto..."
                        emptyMessage={formData.clienteId
                          ? "No hay proyectos para este cliente"
                          : "Selecciona un cliente primero"
                        }
                        allowClear
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Responsable
                      </Label>
                      <SearchableSelect
                        options={personalOptions}
                        value={formData.responsableId || ''}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          responsableId: value || undefined
                        })}
                        placeholder="Sin responsable asignado"
                        searchPlaceholder="Buscar empleado..."
                        emptyMessage="No se encontraron empleados"
                        allowClear
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Tipo y Prioridad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de trabajo</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {TIPOS_PARTE_TRABAJO.map((tipo) => (
                          <button
                            key={tipo.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, tipo: tipo.value as TipoParteTrabajo })}
                            className={cn(
                              'flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all',
                              formData.tipo === tipo.value
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            )}
                          >
                            <span className="text-lg">{TIPO_ICONS[tipo.value]}</span>
                            <span className="text-xs font-medium">{tipo.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Prioridad
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {PRIORIDADES.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, prioridad: p.value as Prioridad })}
                            className={cn(
                              'flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border-2 transition-all text-xs',
                              formData.prioridad === p.value
                                ? `${PRIORIDAD_COLORS[p.value]} border-current ring-1`
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Fecha y Horario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha del trabajo</Label>
                      <Input
                        type="date"
                        value={formData.fecha?.split('T')[0] || ''}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora inicio</Label>
                      <Input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora fin (estimada)</Label>
                      <Input
                        type="time"
                        value={horaFin}
                        onChange={(e) => setHoraFin(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Descripcion del Trabajo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titulo</Label>
                    <Input
                      placeholder="Ej: Revision anual climatizacion"
                      value={formData.titulo || ''}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripcion del trabajo</Label>
                    <Textarea
                      placeholder="Describe el trabajo a realizar..."
                      rows={3}
                      value={formData.descripcion || ''}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Direccion del Trabajo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clienteSeleccionado && (
                    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <input
                        type="checkbox"
                        id="usarDireccionCliente"
                        checked={usarDireccionCliente}
                        onChange={(e) => {
                          setUsarDireccionCliente(e.target.checked)
                          if (e.target.checked && clienteSeleccionado) {
                            const direccion = clienteSeleccionado.direccionFiscal ||
                              clienteSeleccionado.direccion ||
                              clienteSeleccionado.direcciones?.[0]
                            if (direccion) {
                              setFormData(prev => ({
                                ...prev,
                                direccionTrabajo: {
                                  calle: direccion.calle || '',
                                  numero: direccion.numero || '',
                                  codigoPostal: direccion.codigoPostal || '',
                                  ciudad: direccion.ciudad || '',
                                  provincia: direccion.provincia || '',
                                  pais: direccion.pais || 'España',
                                }
                              }))
                            }
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor="usarDireccionCliente" className="cursor-pointer flex-1">
                        <span className="font-medium">Usar direccion del cliente</span>
                      </Label>
                    </div>
                  )}

                  <AddressAutocomplete
                    onAddressSelect={handleAddressSelect}
                    label="Buscar otra direccion"
                    placeholder="Escribe para buscar..."
                    defaultValue=""
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Calle</Label>
                      <Input
                        placeholder="Nombre de la calle"
                        value={formData.direccionTrabajo?.calle || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccionTrabajo: { ...formData.direccionTrabajo, calle: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Numero</Label>
                      <Input
                        placeholder="Numero"
                        value={formData.direccionTrabajo?.numero || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccionTrabajo: { ...formData.direccionTrabajo, numero: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Codigo Postal</Label>
                      <Input
                        placeholder="CP"
                        value={formData.direccionTrabajo?.codigoPostal || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccionTrabajo: { ...formData.direccionTrabajo, codigoPostal: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ciudad</Label>
                      <Input
                        placeholder="Ciudad"
                        value={formData.direccionTrabajo?.ciudad || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccionTrabajo: { ...formData.direccionTrabajo, ciudad: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Provincia</Label>
                      <Input
                        placeholder="Provincia"
                        value={formData.direccionTrabajo?.provincia || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccionTrabajo: { ...formData.direccionTrabajo, provincia: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Personal */}
            <TabsContent value="personal" className="mt-4 space-y-4">
              {conflictosPersonal.length > 0 && (
                <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>Conflictos de disponibilidad detectados</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {conflictosPersonal.map((conflicto, idx) => (
                        <li key={idx}>
                          <strong>{conflicto.personalNombre}</strong> ya está asignado al parte{' '}
                          <span className="font-mono text-xs bg-amber-100 dark:bg-amber-900 px-1 rounded">
                            {conflicto.parteCodigo}
                          </span>{' '}
                          de {conflicto.horaInicio} a {conflicto.horaFin}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <LineasPersonalGrid
                lineas={(formData.lineasPersonal as LineaPersonal[]) || []}
                personal={personal}
                personalOptions={personalOptions}
                productosServicioOptions={productosServicioOptions}
                productos={productos}
                mostrarCostes={mostrarCostes}
                fechaParte={formData.fecha}
                onAddLinea={agregarLineaPersonal}
                onUpdateLinea={actualizarLineaPersonal}
                onRemoveLinea={eliminarLineaPersonal}
                onPersonalSelect={seleccionarPersonal}
                onServicioSelect={seleccionarServicioPersonal}
                conflictosPersonal={conflictosPersonal}
              />
            </TabsContent>

            {/* Tab Material */}
            <TabsContent value="material" className="mt-4">
              <LineasMaterialGrid
                lineas={(formData.lineasMaterial as LineaMaterial[]) || []}
                productos={productos}
                productosOptions={productosOptions}
                mostrarCostes={mostrarCostes}
                onAddLinea={agregarLineaMaterial}
                onUpdateLinea={actualizarLineaMaterial}
                onRemoveLinea={eliminarLineaMaterial}
                onProductoSelect={seleccionarProductoMaterial}
                stepPrecios={stepPrecios}
                stepCantidad={stepCantidad}
              />
            </TabsContent>

            {/* Tab Maquinaria */}
            <TabsContent value="maquinaria" className="mt-4">
              <LineasMaquinariaGrid
                lineas={(formData.lineasMaquinaria as LineaMaquinaria[]) || []}
                maquinarias={maquinarias}
                maquinariasOptions={maquinariasOptions}
                personalOptions={personalOptions}
                personal={personal}
                mostrarCostes={mostrarCostes}
                onAddLinea={agregarLineaMaquinaria}
                onUpdateLinea={actualizarLineaMaquinaria}
                onRemoveLinea={eliminarLineaMaquinaria}
                onMaquinariaSelect={seleccionarMaquinaria}
                stepPrecios={stepPrecios}
                stepCantidad={stepCantidad}
              />
            </TabsContent>

            {/* Tab Transporte */}
            <TabsContent value="transporte" className="mt-4">
              <LineasTransporteGrid
                lineas={(formData.lineasTransporte as LineaTransporte[]) || []}
                personalOptions={personalOptions}
                personal={personal}
                mostrarCostes={mostrarCostes}
                onAddLinea={agregarLineaTransporte}
                onUpdateLinea={actualizarLineaTransporte}
                onRemoveLinea={eliminarLineaTransporte}
                stepPrecios={stepPrecios}
              />
            </TabsContent>

            {/* Tab Gastos */}
            <TabsContent value="gastos" className="mt-4">
              <LineasGastosGrid
                lineas={(formData.lineasGastos as LineaGasto[]) || []}
                tiposGasto={tiposGasto}
                tiposGastoOptions={tiposGastoOptions}
                mostrarCostes={mostrarCostes}
                onAddLinea={agregarLineaGasto}
                onUpdateLinea={actualizarLineaGasto}
                onRemoveLinea={eliminarLineaGasto}
                onTipoGastoSelect={seleccionarTipoGasto}
                stepPrecios={stepPrecios}
              />
            </TabsContent>
          </Tabs>
        </form>
      </div>
    
  )
}
