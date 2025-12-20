'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { partesTrabajoService } from '@/services/partes-trabajo.service'
import { clientesService } from '@/services/clientes.service'
import { proyectosService } from '@/services/proyectos.service'
import { personalService } from '@/services/personal.service'
import { productosService } from '@/services/productos.service'
import { maquinariaService } from '@/services/maquinaria.service'
import { tiposGastoService } from '@/services/tipos-gasto.service'
import { empresaService } from '@/services/empresa.service'
import {
  ParteTrabajo,
  UpdateParteTrabajoDTO,
  TIPOS_PARTE_TRABAJO,
  PRIORIDADES,
  ESTADOS_PARTE_TRABAJO,
  TipoParteTrabajo,
  Prioridad,
  EstadoParteTrabajo,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Save,
  Wrench,
  RefreshCw,
  Calendar,
  Building2,
  FolderKanban,
  User,
  Plus,
  Trash2,
  Users,
  Package,
  Truck as TruckIcon,
  Wallet,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'

export default function EditarParteTrabajoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [parte, setParte] = useState<ParteTrabajo | null>(null)

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

  // Form data
  const [formData, setFormData] = useState<UpdateParteTrabajoDTO>({})

  // Cargar datos iniciales
  const cargarDatos = useCallback(async () => {
    setIsLoading(true)
    try {
      const [parteRes, clientesRes, proyectosRes, personalRes, productosRes, maquinariasRes, tiposGastoRes, empresaRes] = await Promise.all([
        partesTrabajoService.getById(id),
        clientesService.getAll({ limit: 100, activo: 'true' }),
        proyectosService.getAll({ limit: 100, activo: 'true' }),
        personalService.getAll({ limit: 100, activo: 'true' }),
        productosService.getAll({ limit: 100, activo: 'true' }),
        maquinariaService.getAll({ limit: 100, activo: 'true' }),
        tiposGastoService.getActivos(),
        empresaService.getMiEmpresa(),
      ])

      // Cargar configuración de empresa
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

      if (parteRes.success && parteRes.data) {
        setParte(parteRes.data)
        // Extraer IDs de objetos poblados (el backend puede devolver objetos completos o solo IDs)
        const extractId = (value: any) => typeof value === 'object' && value?._id ? value._id : value

        // Normalizar líneas de personal para extraer IDs de objetos poblados
        const normalizarLineasPersonal = (lineas: any[]) => (lineas || []).map(l => ({
          ...l,
          personalId: extractId(l.personalId),
          personalNombre: l.personalNombre || (typeof l.personalId === 'object' ? `${l.personalId?.nombre || ''} ${l.personalId?.apellidos || ''}`.trim() : '') || '',
          productoServicioId: extractId(l.productoServicioId),
          productoServicioCodigo: l.productoServicioCodigo || (typeof l.productoServicioId === 'object' ? l.productoServicioId?.codigo : '') || '',
          productoServicioNombre: l.productoServicioNombre || (typeof l.productoServicioId === 'object' ? l.productoServicioId?.nombre : '') || '',
          facturable: l.facturable !== false, // Por defecto true
        }))

        // Normalizar líneas de material para extraer IDs de objetos poblados
        const normalizarLineasMaterial = (lineas: any[]) => (lineas || []).map(l => ({
          ...l,
          productoId: extractId(l.productoId),
          nombre: l.nombre || (typeof l.productoId === 'object' ? l.productoId?.nombre : '') || '',
          facturable: l.facturable !== false, // Por defecto true
        }))

        // Normalizar líneas de maquinaria para asegurar que tengan el campo nombre
        const normalizarLineasMaquinaria = (lineas: any[]) => (lineas || []).map(l => ({
          ...l,
          maquinariaId: extractId(l.maquinariaId),
          operadorId: extractId(l.operadorId),
          nombre: l.nombre || (typeof l.maquinariaId === 'object' ? l.maquinariaId?.nombre : '') || '',
          facturable: l.facturable !== false, // Por defecto true
        }))

        // Normalizar líneas de transporte para extraer IDs de objetos poblados
        const normalizarLineasTransporte = (lineas: any[]) => (lineas || []).map(l => ({
          ...l,
          conductorId: extractId(l.conductorId),
          facturable: l.facturable !== false, // Por defecto true
        }))

        // Normalizar líneas de gastos para asegurar que tengan el campo tipoGastoNombre
        const normalizarLineasGastos = (lineas: any[]) => (lineas || []).map(l => ({
          ...l,
          tipoGastoId: extractId(l.tipoGastoId),
          tipoGastoNombre: l.tipoGastoNombre || (typeof l.tipoGastoId === 'object' ? l.tipoGastoId?.nombre : '') || '',
          facturable: l.facturable !== false, // Por defecto true
        }))

        setFormData({
          clienteId: extractId(parteRes.data.clienteId),
          proyectoId: extractId(parteRes.data.proyectoId),
          responsableId: extractId(parteRes.data.responsableId),
          tipo: parteRes.data.tipo,
          prioridad: parteRes.data.prioridad,
          fecha: parteRes.data.fecha,
          fechaInicio: parteRes.data.fechaInicio,
          fechaFin: parteRes.data.fechaFin,
          titulo: parteRes.data.titulo,
          descripcion: parteRes.data.descripcion,
          trabajoRealizado: parteRes.data.trabajoRealizado,
          observacionesInternas: parteRes.data.observacionesInternas,
          direccionTrabajo: parteRes.data.direccionTrabajo,
          lineasPersonal: normalizarLineasPersonal(parteRes.data.lineasPersonal),
          lineasMaterial: normalizarLineasMaterial(parteRes.data.lineasMaterial),
          lineasMaquinaria: normalizarLineasMaquinaria(parteRes.data.lineasMaquinaria),
          lineasTransporte: normalizarLineasTransporte(parteRes.data.lineasTransporte),
          lineasGastos: normalizarLineasGastos(parteRes.data.lineasGastos),
          descuentoGlobalPorcentaje: parteRes.data.descuentoGlobalPorcentaje,
          mostrarCostes: parteRes.data.mostrarCostes,
          mostrarMargenes: parteRes.data.mostrarMargenes,
          mostrarPrecios: parteRes.data.mostrarPrecios,
        })
      } else {
        toast.error('Parte de trabajo no encontrado')
        router.push('/partes-trabajo')
      }

      if (clientesRes.success) setClientes(clientesRes.data)
      if (proyectosRes.success) setProyectos(proyectosRes.data)
      if (personalRes.success) setPersonal(personalRes.data)
      if (productosRes.success) setProductos(productosRes.data)
      if (maquinariasRes.success) setMaquinarias(maquinariasRes.data)
      if (tiposGastoRes.success) setTiposGasto(tiposGastoRes.data)
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar los datos')
      router.push('/partes-trabajo')
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    if (id) cargarDatos()
  }, [id, cargarDatos])

  // Opciones para SearchableSelect
  const clientesOptions = useMemo(() => clientes.map(c => ({
    value: c._id,
    label: c.nombre || c.nombreComercial || '',
    description: c.nif || '',
  })), [clientes])

  const proyectosOptions = useMemo(() => proyectos.map(p => ({
    value: p._id,
    label: `${p.codigo || ''} - ${p.nombre || p.titulo || ''}`.trim(),
  })), [proyectos])

  const personalOptions = useMemo(() => personal.map(p => ({
    value: p._id,
    label: `${p.nombre} ${p.apellidos || ''}`.trim(),
    description: p.codigo || '',
  })), [personal])

  const productosOptions = useMemo(() => productos.map(p => ({
    value: p._id,
    label: p.nombre || '',
    description: p.codigo || '',
  })), [productos])

  // Productos de tipo servicio (para lineas de personal - mano de obra)
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

  // Valores de step para inputs numéricos basados en configuración de decimales
  const stepPrecios = useMemo(() => Math.pow(10, -decimalesPrecios), [decimalesPrecios])
  const stepCantidad = useMemo(() => Math.pow(10, -decimalesCantidad), [decimalesCantidad])

  // Handlers para lineas
  const agregarLineaPersonal = () => {
    setFormData(prev => ({
      ...prev,
      lineasPersonal: [...(prev.lineasPersonal || []), crearLineaPersonalVacia() as LineaPersonal]
    }))
  }

  const agregarLineaMaterial = () => {
    setFormData(prev => ({
      ...prev,
      lineasMaterial: [...(prev.lineasMaterial || []), crearLineaMaterialVacia() as LineaMaterial]
    }))
  }

  const agregarLineaMaquinaria = () => {
    setFormData(prev => ({
      ...prev,
      lineasMaquinaria: [...(prev.lineasMaquinaria || []), crearLineaMaquinariaVacia() as LineaMaquinaria]
    }))
  }

  const agregarLineaTransporte = () => {
    setFormData(prev => ({
      ...prev,
      lineasTransporte: [...(prev.lineasTransporte || []), crearLineaTransporteVacia() as LineaTransporte]
    }))
  }

  const agregarLineaGasto = () => {
    setFormData(prev => ({
      ...prev,
      lineasGastos: [...(prev.lineasGastos || []), crearLineaGastoVacia() as LineaGasto]
    }))
  }

  const eliminarLinea = (tipo: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [tipo]: (prev as any)[tipo].filter((_: any, i: number) => i !== index)
    }))
  }

  // Función para calcular horas desde hora inicio y fin
  const calcularHorasDesdeHorario = useCallback((horaInicio?: string, horaFin?: string): number => {
    if (!horaInicio || !horaFin) return 0
    const [hiH, hiM] = horaInicio.split(':').map(Number)
    const [hfH, hfM] = horaFin.split(':').map(Number)
    const inicioMinutos = hiH * 60 + hiM
    const finMinutos = hfH * 60 + hfM
    const diferenciaMinutos = finMinutos - inicioMinutos
    if (diferenciaMinutos <= 0) return 0
    // Redondear al intervalo de facturación configurado en la empresa
    const minutosRedondeados = Math.ceil(diferenciaMinutos / intervaloFacturacion) * intervaloFacturacion
    return minutosRedondeados / 60
  }, [intervaloFacturacion])

  const actualizarLinea = (tipo: string, index: number, campo: string, valor: any) => {
    setFormData(prev => {
      const lineas = [...((prev as any)[tipo] || [])]
      lineas[index] = { ...lineas[index], [campo]: valor }

      // Recalcular totales de linea
      if (tipo === 'lineasPersonal') {
        const l = lineas[index]
        // Si se cambia hora inicio o fin, recalcular horas trabajadas
        if (campo === 'horaInicio' || campo === 'horaFin') {
          l.horasTrabajadas = calcularHorasDesdeHorario(l.horaInicio, l.horaFin)
        }
        const horas = (l.horasTrabajadas || 0) + (l.horasExtras || 0)
        l.costeTotal = horas * (l.tarifaHoraCoste || 0)
        l.ventaTotal = horas * (l.tarifaHoraVenta || 0)
      } else if (tipo === 'lineasMaterial') {
        const l = lineas[index]
        l.costeTotal = (l.cantidad || 0) * (l.precioCoste || 0)
        const subtotal = (l.cantidad || 0) * (l.precioVenta || 0)
        l.ventaTotal = subtotal - (subtotal * (l.descuento || 0) / 100)
      } else if (tipo === 'lineasMaquinaria') {
        const l = lineas[index]
        l.costeTotal = (l.cantidad || 0) * (l.tarifaCoste || 0)
        l.ventaTotal = (l.cantidad || 0) * (l.tarifaVenta || 0)
      } else if (tipo === 'lineasTransporte') {
        const l = lineas[index]
        const costeKm = (l.kmRecorridos || 0) * (l.tarifaPorKm || 0)
        l.costeTotal = costeKm + (l.importeFijoViaje || 0) + (l.peajes || 0) + (l.combustible || 0)
      } else if (tipo === 'lineasGastos') {
        const l = lineas[index]
        l.importeFacturable = (l.importe || 0) * (1 + (l.margen || 0) / 100)
      }

      return { ...prev, [tipo]: lineas }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clienteId) {
      toast.error('El cliente es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await partesTrabajoService.update(id, formData)
      if (response.success) {
        toast.success('Parte de trabajo actualizado correctamente')
        router.push(`/partes-trabajo/${id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar el parte de trabajo')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!parte) return null

  return (
    <DashboardLayout>
      <div className="w-full max-w-full space-y-6">
        {/* Header */}
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/partes-trabajo/${id}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Wrench className="h-7 w-7 text-primary" />
                Editar {parte.codigo}
              </h1>
              <p className="text-sm text-muted-foreground">
                Modifica los datos del parte de trabajo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/partes-trabajo/${id}`}>Cancelar</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full flex flex-wrap gap-1">
              <TabsTrigger value="general">
                <Building2 className="h-4 w-4 mr-2 hidden sm:inline" />
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

            {/* Tab General */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Datos Generales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente *</Label>
                      <SearchableSelect
                        options={clientesOptions}
                        value={formData.clienteId || ''}
                        onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                        placeholder="Buscar cliente..."
                        searchPlaceholder="Buscar por nombre o NIF..."
                        emptyMessage="No se encontraron clientes"
                        loading={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Proyecto</Label>
                      <SearchableSelect
                        options={proyectosOptions}
                        value={formData.proyectoId || ''}
                        onValueChange={(value) => setFormData({ ...formData, proyectoId: value || undefined })}
                        placeholder="Sin proyecto"
                        searchPlaceholder="Buscar proyecto..."
                        emptyMessage="No se encontraron proyectos"
                        allowClear
                        loading={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoParteTrabajo })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_PARTE_TRABAJO.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridad</Label>
                      <Select
                        value={formData.prioridad}
                        onValueChange={(value) => setFormData({ ...formData, prioridad: value as Prioridad })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORIDADES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Responsable</Label>
                      <SearchableSelect
                        options={personalOptions}
                        value={formData.responsableId || ''}
                        onValueChange={(value) => setFormData({ ...formData, responsableId: value || undefined })}
                        placeholder="Sin asignar"
                        searchPlaceholder="Buscar trabajador..."
                        emptyMessage="No se encontró personal"
                        allowClear
                        loading={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={formData.fecha?.split('T')[0] || ''}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Inicio</Label>
                      <Input
                        type="date"
                        value={formData.fechaInicio?.split('T')[0] || ''}
                        onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Fin</Label>
                      <Input
                        type="date"
                        value={formData.fechaFin?.split('T')[0] || ''}
                        onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Titulo</Label>
                    <Input
                      value={formData.titulo || ''}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descripcion</Label>
                    <Textarea
                      rows={3}
                      value={formData.descripcion || ''}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trabajo Realizado</Label>
                    <Textarea
                      rows={3}
                      value={formData.trabajoRealizado || ''}
                      onChange={(e) => setFormData({ ...formData, trabajoRealizado: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Direccion */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Direccion del Trabajo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Calle</Label>
                      <Input
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
                        value={formData.direccionTrabajo?.numero || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccionTrabajo: { ...formData.direccionTrabajo, numero: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Codigo Postal</Label>
                      <Input
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
            <TabsContent value="personal" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Lineas de Personal</CardTitle>
                  <Button type="button" size="sm" onClick={agregarLineaPersonal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </CardHeader>
                <CardContent>
                  {formData.lineasPersonal && formData.lineasPersonal.length > 0 ? (
                    <div className="space-y-4">
                      {formData.lineasPersonal.map((linea, idx) => (
                        <div key={idx} className="p-4 border rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Linea {idx + 1}</span>
                            <Button type="button" variant="ghost" size="icon" onClick={() => eliminarLinea('lineasPersonal', idx)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Trabajador</Label>
                              <SearchableSelect
                                options={personalOptions}
                                value={linea.personalId || ''}
                                onValueChange={(value) => {
                                  const p = personal.find(x => x._id === value)
                                  actualizarLinea('lineasPersonal', idx, 'personalId', value || undefined)
                                  if (p) {
                                    actualizarLinea('lineasPersonal', idx, 'personalNombre', `${p.nombre} ${p.apellidos || ''}`.trim())
                                  }
                                }}
                                placeholder="Seleccionar..."
                                searchPlaceholder="Buscar trabajador..."
                                emptyMessage="No encontrado"
                                triggerClassName="h-9"
                                allowClear
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Servicio (Precios)</Label>
                              <SearchableSelect
                                options={productosServicioOptions}
                                value={linea.productoServicioId || ''}
                                onValueChange={(value) => {
                                  const p = productos.find(x => x._id === value)
                                  actualizarLinea('lineasPersonal', idx, 'productoServicioId', value || undefined)
                                  if (p) {
                                    actualizarLinea('lineasPersonal', idx, 'productoServicioCodigo', p.codigo || p.sku || '')
                                    actualizarLinea('lineasPersonal', idx, 'productoServicioNombre', p.nombre || '')
                                    // Obtener precios del producto servicio
                                    actualizarLinea('lineasPersonal', idx, 'tarifaHoraCoste', p.precios?.compra || p.coste || 0)
                                    actualizarLinea('lineasPersonal', idx, 'tarifaHoraVenta', p.precios?.venta || p.precioVenta || 0)
                                  }
                                }}
                                placeholder="Seleccionar servicio..."
                                searchPlaceholder="Buscar servicio..."
                                emptyMessage="No hay servicios"
                                triggerClassName="h-9"
                                allowClear
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Nombre</Label>
                              <Input
                                className="h-9"
                                value={linea.personalNombre || ''}
                                onChange={(e) => actualizarLinea('lineasPersonal', idx, 'personalNombre', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Fecha</Label>
                              <Input
                                type="date"
                                className="h-9"
                                value={linea.fecha?.split('T')[0] || ''}
                                onChange={(e) => actualizarLinea('lineasPersonal', idx, 'fecha', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-6 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Hora Entrada</Label>
                              <Input
                                type="time"
                                className="h-9"
                                value={linea.horaInicio || ''}
                                onChange={(e) => actualizarLinea('lineasPersonal', idx, 'horaInicio', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Hora Salida</Label>
                              <Input
                                type="time"
                                className="h-9"
                                value={linea.horaFin || ''}
                                onChange={(e) => actualizarLinea('lineasPersonal', idx, 'horaFin', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Horas Facturar</Label>
                              <Input
                                type="number"
                                className="h-9 bg-muted"
                                min={0}
                                step={0.25}
                                value={linea.horasTrabajadas || 0}
                                onChange={(e) => actualizarLinea('lineasPersonal', idx, 'horasTrabajadas', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Horas Extra</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step={0.25}
                                value={linea.horasExtras || 0}
                                onChange={(e) => actualizarLinea('lineasPersonal', idx, 'horasExtras', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Tarifa Coste/h</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step="any"
                                value={linea.tarifaHoraCoste || 0}
                                onChange={(e) => actualizarLinea('lineasPersonal', idx, 'tarifaHoraCoste', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Tarifa Venta/h</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step="any"
                                value={linea.tarifaHoraVenta || 0}
                                onChange={(e) => actualizarLinea('lineasPersonal', idx, 'tarifaHoraVenta', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={linea.facturable}
                                onCheckedChange={(checked) => actualizarLinea('lineasPersonal', idx, 'facturable', checked)}
                              />
                              <Label className="text-xs">Facturable</Label>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm">
                                <span className="text-muted-foreground">Coste:</span>{' '}
                                <span className="font-medium">{(linea.costeTotal || 0).toFixed(2)} €</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Venta:</span>{' '}
                                <span className="font-medium text-green-600">{(linea.ventaTotal || 0).toFixed(2)} €</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No hay lineas de personal. Haz clic en "Agregar" para crear una.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Material */}
            <TabsContent value="material" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Lineas de Material</CardTitle>
                  <Button type="button" size="sm" onClick={agregarLineaMaterial}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </CardHeader>
                <CardContent>
                  {formData.lineasMaterial && formData.lineasMaterial.length > 0 ? (
                    <div className="space-y-4">
                      {formData.lineasMaterial.map((linea, idx) => (
                        <div key={idx} className="p-4 border rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Linea {idx + 1}</span>
                            <Button type="button" variant="ghost" size="icon" onClick={() => eliminarLinea('lineasMaterial', idx)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-2 space-y-1">
                              <Label className="text-xs">Producto</Label>
                              <SearchableSelect
                                options={productosOptions}
                                value={linea.productoId || ''}
                                onValueChange={(value) => {
                                  const p = productos.find(x => x._id === value)
                                  actualizarLinea('lineasMaterial', idx, 'productoId', value || undefined)
                                  if (p) {
                                    actualizarLinea('lineasMaterial', idx, 'productoNombre', p.nombre)
                                    actualizarLinea('lineasMaterial', idx, 'productoCodigo', p.sku || p.codigo)
                                    actualizarLinea('lineasMaterial', idx, 'precioCoste', p.coste || 0)
                                    actualizarLinea('lineasMaterial', idx, 'precioVenta', p.precioVenta || 0)
                                  }
                                }}
                                placeholder="Seleccionar..."
                                searchPlaceholder="Buscar producto..."
                                emptyMessage="No encontrado"
                                triggerClassName="h-9"
                                allowClear
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Cantidad</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                value={linea.cantidad || 1}
                                onChange={(e) => actualizarLinea('lineasMaterial', idx, 'cantidad', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Unidad</Label>
                              <Input
                                className="h-9"
                                value={linea.unidad || 'ud'}
                                onChange={(e) => actualizarLinea('lineasMaterial', idx, 'unidad', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Precio Coste</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step={stepPrecios}
                                value={linea.precioCoste || 0}
                                onChange={(e) => actualizarLinea('lineasMaterial', idx, 'precioCoste', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Precio Venta</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step={stepPrecios}
                                value={linea.precioVenta || 0}
                                onChange={(e) => actualizarLinea('lineasMaterial', idx, 'precioVenta', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Dto %</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                max={100}
                                value={linea.descuento || 0}
                                onChange={(e) => actualizarLinea('lineasMaterial', idx, 'descuento', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Total Venta</Label>
                              <Input
                                className="h-9 bg-muted"
                                readOnly
                                value={(linea.ventaTotal || 0).toFixed(2)}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={linea.facturable}
                                onCheckedChange={(checked) => actualizarLinea('lineasMaterial', idx, 'facturable', checked)}
                              />
                              <Label className="text-xs">Facturable</Label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No hay lineas de material. Haz clic en "Agregar" para crear una.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Maquinaria */}
            <TabsContent value="maquinaria" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Lineas de Maquinaria</CardTitle>
                  <Button type="button" size="sm" onClick={agregarLineaMaquinaria}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </CardHeader>
                <CardContent>
                  {formData.lineasMaquinaria && formData.lineasMaquinaria.length > 0 ? (
                    <div className="space-y-4">
                      {formData.lineasMaquinaria.map((linea, idx) => (
                        <div key={idx} className="p-4 border rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Linea {idx + 1}</span>
                            <Button type="button" variant="ghost" size="icon" onClick={() => eliminarLinea('lineasMaquinaria', idx)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-2 space-y-1">
                              <Label className="text-xs">Maquinaria</Label>
                              <SearchableSelect
                                options={maquinariasOptions}
                                value={linea.maquinariaId || ''}
                                onValueChange={(value) => {
                                  const m = maquinarias.find(x => x._id === value)
                                  actualizarLinea('lineasMaquinaria', idx, 'maquinariaId', value || undefined)
                                  if (m) {
                                    actualizarLinea('lineasMaquinaria', idx, 'nombre', m.nombre)
                                    actualizarLinea('lineasMaquinaria', idx, 'codigo', m.codigo)
                                    actualizarLinea('lineasMaquinaria', idx, 'tarifaCoste', m.tarifaHoraCoste || 0)
                                    actualizarLinea('lineasMaquinaria', idx, 'tarifaVenta', m.tarifaHoraVenta || 0)
                                  }
                                }}
                                placeholder="Seleccionar..."
                                searchPlaceholder="Buscar maquinaria..."
                                emptyMessage="No encontrado"
                                triggerClassName="h-9"
                                allowClear
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Unidad</Label>
                              <Select
                                value={linea.tipoUnidad || 'horas'}
                                onValueChange={(value) => actualizarLinea('lineasMaquinaria', idx, 'tipoUnidad', value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="horas">Horas</SelectItem>
                                  <SelectItem value="dias">Dias</SelectItem>
                                  <SelectItem value="km">Km</SelectItem>
                                  <SelectItem value="unidades">Unidades</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Cantidad</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step={0.5}
                                value={linea.cantidad || 1}
                                onChange={(e) => actualizarLinea('lineasMaquinaria', idx, 'cantidad', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Tarifa Coste</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step={stepPrecios}
                                value={linea.tarifaCoste || 0}
                                onChange={(e) => actualizarLinea('lineasMaquinaria', idx, 'tarifaCoste', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Tarifa Venta</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step={stepPrecios}
                                value={linea.tarifaVenta || 0}
                                onChange={(e) => actualizarLinea('lineasMaquinaria', idx, 'tarifaVenta', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Fecha Uso</Label>
                              <Input
                                type="date"
                                className="h-9"
                                value={linea.fechaUso?.split('T')[0] || ''}
                                onChange={(e) => actualizarLinea('lineasMaquinaria', idx, 'fechaUso', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Total Venta</Label>
                              <Input
                                className="h-9 bg-muted"
                                readOnly
                                value={(linea.ventaTotal || 0).toFixed(2)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No hay lineas de maquinaria.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Transporte */}
            <TabsContent value="transporte" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Lineas de Transporte</CardTitle>
                  <Button type="button" size="sm" onClick={agregarLineaTransporte}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </CardHeader>
                <CardContent>
                  {formData.lineasTransporte && formData.lineasTransporte.length > 0 ? (
                    <div className="space-y-4">
                      {formData.lineasTransporte.map((linea, idx) => (
                        <div key={idx} className="p-4 border rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Linea {idx + 1}</span>
                            <Button type="button" variant="ghost" size="icon" onClick={() => eliminarLinea('lineasTransporte', idx)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Vehiculo</Label>
                              <Input
                                className="h-9"
                                value={linea.vehiculoNombre || ''}
                                onChange={(e) => actualizarLinea('lineasTransporte', idx, 'vehiculoNombre', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Matricula</Label>
                              <Input
                                className="h-9"
                                value={linea.matricula || ''}
                                onChange={(e) => actualizarLinea('lineasTransporte', idx, 'matricula', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Origen</Label>
                              <Input
                                className="h-9"
                                value={linea.origen || ''}
                                onChange={(e) => actualizarLinea('lineasTransporte', idx, 'origen', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Destino</Label>
                              <Input
                                className="h-9"
                                value={linea.destino || ''}
                                onChange={(e) => actualizarLinea('lineasTransporte', idx, 'destino', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-5 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Km</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                value={linea.kmRecorridos || 0}
                                onChange={(e) => actualizarLinea('lineasTransporte', idx, 'kmRecorridos', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Tarifa/Km</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step={stepPrecios}
                                value={linea.tarifaPorKm || 0}
                                onChange={(e) => actualizarLinea('lineasTransporte', idx, 'tarifaPorKm', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Peajes</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step={stepPrecios}
                                value={linea.peajes || 0}
                                onChange={(e) => actualizarLinea('lineasTransporte', idx, 'peajes', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Combustible</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step={stepPrecios}
                                value={linea.combustible || 0}
                                onChange={(e) => actualizarLinea('lineasTransporte', idx, 'combustible', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Precio Venta</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step={stepPrecios}
                                value={linea.precioVenta || 0}
                                onChange={(e) => actualizarLinea('lineasTransporte', idx, 'precioVenta', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No hay lineas de transporte.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Gastos */}
            <TabsContent value="gastos" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Lineas de Gastos</CardTitle>
                  <Button type="button" size="sm" onClick={agregarLineaGasto}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </CardHeader>
                <CardContent>
                  {formData.lineasGastos && formData.lineasGastos.length > 0 ? (
                    <div className="space-y-4">
                      {formData.lineasGastos.map((linea, idx) => (
                        <div key={idx} className="p-4 border rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Linea {idx + 1}</span>
                            <Button type="button" variant="ghost" size="icon" onClick={() => eliminarLinea('lineasGastos', idx)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Tipo Gasto</Label>
                              <SearchableSelect
                                options={tiposGastoOptions}
                                value={linea.tipoGastoId || ''}
                                onValueChange={(value) => {
                                  const t = tiposGasto.find(x => x._id === value)
                                  actualizarLinea('lineasGastos', idx, 'tipoGastoId', value || undefined)
                                  if (t) {
                                    actualizarLinea('lineasGastos', idx, 'tipoGastoNombre', t.nombre)
                                    actualizarLinea('lineasGastos', idx, 'margen', t.margenPorDefecto || 0)
                                    actualizarLinea('lineasGastos', idx, 'iva', t.ivaPorDefecto || 21)
                                  }
                                }}
                                placeholder="Seleccionar..."
                                searchPlaceholder="Buscar tipo..."
                                emptyMessage="No encontrado"
                                triggerClassName="h-9"
                                allowClear
                              />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <Label className="text-xs">Descripcion</Label>
                              <Input
                                className="h-9"
                                value={linea.descripcion || ''}
                                onChange={(e) => actualizarLinea('lineasGastos', idx, 'descripcion', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Fecha</Label>
                              <Input
                                type="date"
                                className="h-9"
                                value={linea.fecha?.split('T')[0] || ''}
                                onChange={(e) => actualizarLinea('lineasGastos', idx, 'fecha', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Importe</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step={stepPrecios}
                                value={linea.importe || 0}
                                onChange={(e) => actualizarLinea('lineasGastos', idx, 'importe', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Margen %</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                step={1}
                                value={linea.margen || 0}
                                onChange={(e) => actualizarLinea('lineasGastos', idx, 'margen', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">IVA %</Label>
                              <Input
                                type="number"
                                className="h-9"
                                min={0}
                                value={linea.iva || 21}
                                onChange={(e) => actualizarLinea('lineasGastos', idx, 'iva', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Imp. Facturable</Label>
                              <Input
                                className="h-9 bg-muted"
                                readOnly
                                value={(linea.importeFacturable || 0).toFixed(2)}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={linea.facturable}
                                onCheckedChange={(checked) => actualizarLinea('lineasGastos', idx, 'facturable', checked)}
                              />
                              <Label className="text-xs">Facturable</Label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No hay lineas de gastos.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </DashboardLayout>
  )
}
