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
  Trash2,
  ArrowUp,
  ArrowDown,
  Percent,
} from 'lucide-react'

// Components
import { SearchableSelect, EditableSearchableSelect } from '@/components/ui/searchable-select'
import { DateInput } from '@/components/ui/date-picker'

// Services
import { proveedoresService } from '@/services/proveedores.service'
import { productosService } from '@/services/productos.service'
import { seriesDocumentosService } from '@/services/series-documentos.service'

// Types
import { Proveedor } from '@/types/proveedor.types'
import { Producto } from '@/types/producto.types'
import { ISerieDocumento } from '@/types/serie-documento.types'
import { toast } from 'sonner'

interface PresupuestoCompraFormProps {
  presupuesto?: PresupuestoCompra
  onSubmit: (data: CreatePresupuestoCompraDTO | UpdatePresupuestoCompraDTO) => Promise<void>
  isEditing?: boolean
}

// Tipo de linea local para el formulario
interface LineaFormulario {
  _id?: string
  orden: number
  tipo: 'producto' | 'servicio' | 'texto'
  productoId?: string
  codigo?: string
  nombre: string
  descripcion?: string
  codigoProveedor?: string
  cantidad: number
  unidad?: string
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
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Referencias para inputs (navegación con teclado)
  const cantidadRefs = useRef<Map<number, HTMLInputElement>>(new Map())
  const productoRefs = useRef<Map<number, HTMLInputElement>>(new Map())

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

  // Cargar opciones al montar
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true)
        const [proveedoresRes, productosRes] = await Promise.all([
          proveedoresService.getAll({ activo: true, limit: 500 }),
          productosService.getAll({ activo: true, limit: 500 }),
        ])

        if (proveedoresRes.success) setProveedores(proveedoresRes.data || [])
        if (productosRes.success) setProductos(productosRes.data || [])
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
        tags: presupuesto.tags,
      })

      // Cargar lineas
      if (presupuesto.lineas && presupuesto.lineas.length > 0) {
        const lineasFormulario: LineaFormulario[] = presupuesto.lineas.map((l, idx) => ({
          _id: l._id,
          orden: l.orden ?? idx,
          tipo: l.tipo as 'producto' | 'servicio' | 'texto',
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
          precioVenta: (l as any).precioVenta || 0,
          margenPorcentaje: (l as any).margenPorcentaje || 0,
          margenImporte: (l as any).margenImporte || 0,
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

  // Handler para cambio de producto en linea
  const handleProductoChange = (index: number, productoId: string) => {
    const producto = productos.find(p => p._id === productoId)
    if (producto) {
      const precioCompra = producto.precios?.compra || 0
      const precioVenta = producto.precios?.pvp || producto.precios?.venta || 0

      const nuevaLinea = calcularLinea({
        ...lineas[index],
        productoId: producto._id,
        codigo: producto.sku,
        nombre: producto.nombre,
        descripcion: producto.descripcionCorta,
        precioUnitario: precioCompra,
        precioVenta: precioVenta,
        margenPorcentaje: 0, // Se calculará en calcularLinea
        margenImporte: 0,
        iva: producto.iva || 21,
      })
      const nuevasLineas = [...lineas]
      nuevasLineas[index] = nuevaLinea
      setLineas(nuevasLineas)
    }
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

    setIsSubmitting(true)

    try {
      const data: CreatePresupuestoCompraDTO = {
        ...formData,
        lineas: lineas.filter(l => l.nombre).map(l => ({
          orden: l.orden,
          tipo: l.tipo,
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
          precioVenta: l.precioVenta,
          margenPorcentaje: l.margenPorcentaje,
          margenImporte: l.margenImporte,
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

      await onSubmit(data)
    } catch (error) {
      console.error('Error al guardar:', error)
    } finally {
      setIsSubmitting(false)
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
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lineas del Presupuesto</CardTitle>
                <CardDescription>{lineas.length} lineas</CardDescription>
              </div>
              <Button type="button" onClick={handleAddLinea} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Linea
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
                      <th className="px-2 py-2 text-right w-24">P.Compra</th>
                      <th className="px-2 py-2 text-right w-16">Dto%</th>
                      <th className="px-2 py-2 text-right w-24">PVP</th>
                      <th className="px-2 py-2 text-right w-16">Margen%</th>
                      <th className="px-2 py-2 text-right w-16">IVA%</th>
                      <th className="px-2 py-2 text-right w-24">Subtotal</th>
                      <th className="px-2 py-2 text-center w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((linea, index) => (
                      <tr key={index} className="border-b hover:bg-muted/30">
                        <td className="px-2 py-2 text-muted-foreground">{index + 1}</td>
                        <td className="px-2 py-2">
                          <EditableSearchableSelect
                            options={productos.map(p => ({
                              value: p._id,
                              label: p.nombre,
                              description: p.sku,
                            }))}
                            value={linea.productoId || ''}
                            onValueChange={(value) => handleProductoChange(index, value)}
                            placeholder="Buscar producto..."
                            displayValue={linea.nombre || ''}
                            onDisplayValueChange={(value) => handleLineaChange(index, 'nombre', value)}
                            onCtrlEnterPress={handleAddLinea}
                            inputRef={(el) => {
                              if (el) productoRefs.current.set(index, el)
                              else productoRefs.current.delete(index)
                            }}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            ref={(el) => {
                              if (el) cantidadRefs.current.set(index, el)
                            }}
                            type="number"
                            min="0"
                            step="0.01"
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
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={linea.precioVenta}
                            onChange={(e) => handleLineaChange(index, 'precioVenta', parseFloat(e.target.value) || 0)}
                            className="w-24 text-right"
                            placeholder="PVP"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={linea.margenPorcentaje}
                            onChange={(e) => handleLineaChange(index, 'margenPorcentaje', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right"
                            placeholder="%"
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
                          <div className="flex items-center justify-center gap-1">
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
                              disabled={index === lineas.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleRemoveLinea(index)}
                              disabled={lineas.length === 1}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Condiciones */}
        <TabsContent value="condiciones" className="space-y-6">
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
    </form>
  )
}
