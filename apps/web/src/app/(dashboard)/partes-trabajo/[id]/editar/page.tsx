'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  ParteTrabajo,
  UpdateParteTrabajoDTO,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Building2,
  Users,
  Package,
  Truck as TruckIcon,
  Wallet,
  MapPin,
  AlertTriangle,
  FolderOpen,
  Upload,
  FileText,
  File,
  Eye,
  Download,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

// Componentes de grid para líneas
import {
  LineasMaterialGrid,
  LineasPersonalGrid,
  LineasMaquinariaGrid,
  LineasTransporteGrid,
  LineasGastosGrid,
} from '@/components/partes-trabajo'

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
  const [activeTab, setActiveTab] = useState('general')
  const [mostrarCostes, setMostrarCostes] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [documentos, setDocumentos] = useState<any[]>([])
  const docInputRef = useRef<HTMLInputElement>(null)

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

  // Form data
  const [formData, setFormData] = useState<UpdateParteTrabajoDTO>({})

  // Cargar datos iniciales
  const cargarDatos = useCallback(async () => {
    setIsLoading(true)
    try {
      const [parteRes, clientesRes, proyectosRes, personalRes, productosRes, maquinariasRes, tiposGastoRes, empresaRes] = await Promise.all([
        partesTrabajoService.getById(id),
        clientesService.getAll({ limit: 100, activo: true }),
        proyectosService.getAll({ limit: 100, activo: 'true' }),
        personalService.getAll({ limit: 100, activo: true }),
        productosService.getAll({ limit: 100, activo: true }),
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
        setDocumentos(parteRes.data.documentos || [])
        // Extraer IDs de objetos poblados
        const extractId = (value: any) => typeof value === 'object' && value?._id ? value._id : value

        // Normalizar líneas de personal
        const normalizarLineasPersonal = (lineas: any[]) => (lineas || []).map(l => ({
          ...l,
          personalId: extractId(l.personalId),
          personalNombre: l.personalNombre || (typeof l.personalId === 'object' ? `${l.personalId?.nombre || ''} ${l.personalId?.apellidos || ''}`.trim() : '') || '',
          productoServicioId: extractId(l.productoServicioId),
          productoServicioCodigo: l.productoServicioCodigo || (typeof l.productoServicioId === 'object' ? l.productoServicioId?.codigo : '') || '',
          productoServicioNombre: l.productoServicioNombre || (typeof l.productoServicioId === 'object' ? l.productoServicioId?.nombre : '') || '',
          facturable: l.facturable !== false,
        }))

        // Normalizar líneas de material
        const normalizarLineasMaterial = (lineas: any[]) => (lineas || []).map(l => ({
          ...l,
          productoId: extractId(l.productoId),
          nombre: l.nombre || (typeof l.productoId === 'object' ? l.productoId?.nombre : '') || '',
          facturable: l.facturable !== false,
        }))

        // Normalizar líneas de maquinaria
        const normalizarLineasMaquinaria = (lineas: any[]) => (lineas || []).map(l => ({
          ...l,
          maquinariaId: extractId(l.maquinariaId),
          operadorId: extractId(l.operadorId),
          nombre: l.nombre || (typeof l.maquinariaId === 'object' ? l.maquinariaId?.nombre : '') || '',
          facturable: l.facturable !== false,
        }))

        // Normalizar líneas de transporte
        const normalizarLineasTransporte = (lineas: any[]) => (lineas || []).map(l => ({
          ...l,
          conductorId: extractId(l.conductorId),
          facturable: l.facturable !== false,
        }))

        // Normalizar líneas de gastos
        const normalizarLineasGastos = (lineas: any[]) => (lineas || []).map(l => ({
          ...l,
          tipoGastoId: extractId(l.tipoGastoId),
          tipoGastoNombre: l.tipoGastoNombre || (typeof l.tipoGastoId === 'object' ? l.tipoGastoId?.nombre : '') || '',
          facturable: l.facturable !== false,
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
        setMostrarCostes(parteRes.data.mostrarCostes || false)
      } else {
        toast.error('Parte de trabajo no encontrado')
        router.push('/partes-trabajo')
      }

      if (clientesRes.success) setClientes(clientesRes.data || [])
      if (proyectosRes.success) setProyectos(proyectosRes.data || [])
      if (personalRes.success) setPersonal(personalRes.data || [])
      if (productosRes.success) setProductos(productosRes.data || [])
      if (maquinariasRes.success) setMaquinarias(maquinariasRes.data || [])
      if (tiposGastoRes.success) setTiposGasto(tiposGastoRes.data || [])
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

  // Productos de tipo servicio (para lineas de personal)
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

  // Steps para inputs numéricos
  const stepPrecios = useMemo(() => Math.pow(10, -decimalesPrecios), [decimalesPrecios])
  const stepCantidad = useMemo(() => Math.pow(10, -decimalesCantidad), [decimalesCantidad])

  // Función para calcular horas desde hora inicio y fin
  const calcularHorasDesdeHorario = useCallback((horaInicio?: string, horaFin?: string): number => {
    if (!horaInicio || !horaFin) return 0
    const [hiH, hiM] = horaInicio.split(':').map(Number)
    const [hfH, hfM] = horaFin.split(':').map(Number)
    const inicioMinutos = hiH * 60 + hiM
    const finMinutos = hfH * 60 + hfM
    const diferenciaMinutos = finMinutos - inicioMinutos
    if (diferenciaMinutos <= 0) return 0
    const minutosRedondeados = Math.ceil(diferenciaMinutos / intervaloFacturacion) * intervaloFacturacion
    return minutosRedondeados / 60
  }, [intervaloFacturacion])

  // Verificar disponibilidad de personal
  const verificarDisponibilidadPersonal = useCallback(async (
    lineaIndex: number,
    personalId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string
  ) => {
    if (!personalId || !fecha || !horaInicio || !horaFin) {
      setConflictosPersonal(prev => prev.filter(c => c.lineaIndex !== lineaIndex))
      return
    }

    try {
      const response = await partesTrabajoService.verificarDisponibilidad({
        personalIds: [personalId],
        fecha,
        horaInicio,
        horaFin,
        parteIdExcluir: id
      })

      if (response.success && response.data) {
        setConflictosPersonal(prev => {
          const sinEstaLinea = prev.filter(c => c.lineaIndex !== lineaIndex)
          const nuevosConflictos = response.data.conflictos.map(c => ({
            ...c,
            lineaIndex
          }))
          return [...sinEstaLinea, ...nuevosConflictos]
        })
      }
    } catch (error) {
      console.error('Error verificando disponibilidad:', error)
    }
  }, [id])

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

      // Recalcular totales
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

      // Recalcular totales
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

      // Si se cambia hora inicio o fin, recalcular horas trabajadas
      if (campo === 'horaInicio' || campo === 'horaFin') {
        lineas[index].horasTrabajadas = calcularHorasDesdeHorario(lineas[index].horaInicio, lineas[index].horaFin)
      }

      // Recalcular totales
      const l = lineas[index]
      const horas = (l.horasTrabajadas || 0) + (l.horasExtras || 0)
      l.costeTotal = horas * (l.tarifaHoraCoste || 0)
      l.ventaTotal = horas * (l.tarifaHoraVenta || 0)

      // Verificar disponibilidad si cambian campos relevantes
      if (['personalId', 'fecha', 'horaInicio', 'horaFin'].includes(campo)) {
        const fechaLinea = l.fecha?.split('T')[0] || formData.fecha?.split('T')[0] || ''
        verificarDisponibilidadPersonal(index, l.personalId || '', fechaLinea, l.horaInicio || '', l.horaFin || '')
      }

      return { ...prev, lineasPersonal: lineas }
    })
  }, [calcularHorasDesdeHorario, verificarDisponibilidadPersonal, formData.fecha])

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

      // Recalcular totales
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

      // Recalcular totales
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

      // Recalcular totales
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

      // Recalcular coste total
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

      // Recalcular importe facturable
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

  const seleccionarTipoGasto = useCallback((index: number, tipoGastoId: string, tipoGasto?: any) => {
    setFormData(prev => {
      const lineas = [...((prev.lineasGastos as LineaGasto[]) || [])]
      lineas[index] = {
        ...lineas[index],
        tipoGastoId: tipoGastoId || undefined,
        tipoGastoNombre: tipoGasto?.nombre || '',
        margen: tipoGasto?.margenPorDefecto || lineas[index].margen || 0,
        iva: tipoGasto?.ivaPorDefecto || lineas[index].iva || 21,
      }

      // Recalcular importe facturable
      const l = lineas[index]
      l.importeFacturable = (l.importe || 0) * (1 + (l.margen || 0) / 100)

      return { ...prev, lineasGastos: lineas }
    })
  }, [])

  // ========================================
  // SUBMIT
  // ========================================

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (e.target) e.target.value = ''

    if (file.size > 50 * 1024 * 1024) {
      toast.error('El archivo no puede superar 50MB')
      return
    }

    setUploadingDoc(true)
    try {
      const response = await partesTrabajoService.subirDocumento(id, file)
      if (response.success) {
        setDocumentos(response.data.documentos || [])
        toast.success('Documento subido correctamente')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al subir el documento')
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    try {
      const response = await partesTrabajoService.eliminarDocumento(id, docId)
      if (response.success) {
        setDocumentos(response.data.documentos || [])
        toast.success('Documento eliminado')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar el documento')
    }
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
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
      
    )
  }

  if (!parte) return null

  return (
    
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              <TabsTrigger value="documentos">
                <FolderOpen className="h-4 w-4 mr-2 hidden sm:inline" />
                Documentos
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

            {/* Tab Personal - Usando nuevo componente LineasPersonalGrid */}
            <TabsContent value="personal" className="mt-4 space-y-4">
              {/* Alerta de conflictos de disponibilidad */}
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
                    <p className="text-xs mt-2 opacity-75">
                      Puedes continuar igualmente, pero ten en cuenta los solapamientos.
                    </p>
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

            {/* Tab Material - Usando nuevo componente LineasMaterialGrid */}
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

            {/* Tab Maquinaria - Usando nuevo componente LineasMaquinariaGrid */}
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

            {/* Tab Transporte - Usando nuevo componente LineasTransporteGrid */}
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

            {/* Tab Gastos - Usando nuevo componente LineasGastosGrid */}
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

            {/* Tab Documentos */}
            <TabsContent value="documentos" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      Documentos Adjuntos
                    </CardTitle>
                    <Button type="button" onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}>
                      {uploadingDoc ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Subir documento
                        </>
                      )}
                    </Button>
                    <input
                      ref={docInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.csv,.txt,.zip,.rar"
                      onChange={handleDocUpload}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {documentos.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground mb-3">
                        No hay documentos adjuntos
                      </p>
                      <Button type="button" variant="outline" onClick={() => docInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Subir primer documento
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {documentos.map((doc: any) => {
                        const isPdf = doc.tipo?.includes('pdf') || doc.url?.match(/\.pdf$/i)
                        const isImage = doc.tipo?.startsWith('image/') || doc.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                        const Icono = isPdf ? FileText : isImage ? File : File
                        const fecha = doc.fechaSubida
                          ? new Date(doc.fechaSubida).toLocaleDateString('es-ES')
                          : ''

                        return (
                          <div
                            key={doc._id}
                            className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="p-2 bg-muted rounded-lg">
                              <Icono className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm" title={doc.nombre}>
                                {doc.nombre}
                              </p>
                              {doc.tamaño && (
                                <p className="text-xs text-muted-foreground">
                                  {doc.tamaño < 1024 * 1024
                                    ? `${(doc.tamaño / 1024).toFixed(1)} KB`
                                    : `${(doc.tamaño / (1024 * 1024)).toFixed(1)} MB`}
                                </p>
                              )}
                              {fecha && (
                                <p className="text-xs text-muted-foreground mt-1">{fecha}</p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => window.open(doc.url, '_blank')}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = doc.url
                                  link.download = doc.nombre
                                  link.target = '_blank'
                                  link.click()
                                }}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Descargar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => doc._id && handleDeleteDoc(doc._id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    
  )
}
