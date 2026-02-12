'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { crmService } from '@/services/crm.service'
import {
  Oportunidad,
  UpdateOportunidadDTO,
  EtapaPipeline,
  EstadoOportunidad,
} from '@/types/crm.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { productosService } from '@/services/productos.service'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarOportunidadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [etapas, setEtapas] = useState<EtapaPipeline[]>([])
  const [productos, setProductos] = useState<{ value: string; label: string; precio: number }[]>([])

  const [formData, setFormData] = useState<UpdateOportunidadDTO>({
    nombre: '',
    descripcion: '',
    etapaId: '',
    probabilidad: 50,
    valorEstimado: 0,
    moneda: 'EUR',
    fechaCierreEstimada: '',
    estado: EstadoOportunidad.ABIERTA,
    lineas: [],
    etiquetas: [],
  })

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsLoading(true)

        // Cargar etapas, oportunidad y productos en paralelo
        const [etapasData, oportunidad, productosRes] = await Promise.all([
          crmService.getEtapas(true),
          crmService.getOportunidadById(id),
          productosService.getAll({ limit: 500 }),
        ])

        setEtapas(etapasData)

        // Preparar productos para el selector
        const prods = (productosRes.data?.productos || productosRes.data || []).map((p: any) => ({
          value: p._id,
          label: `${p.referencia ? p.referencia + ' - ' : ''}${p.nombre}`,
          precio: p.precioVenta || p.precio || 0,
        }))
        setProductos(prods)

        // Poblar el formulario con los datos existentes
        const fechaCierre = oportunidad.fechaCierreEstimada
          ? new Date(oportunidad.fechaCierreEstimada).toISOString().split('T')[0]
          : ''

        setFormData({
          nombre: oportunidad.nombre || '',
          descripcion: oportunidad.descripcion || '',
          etapaId: typeof oportunidad.etapaId === 'object' ? oportunidad.etapaId._id : oportunidad.etapaId,
          probabilidad: oportunidad.probabilidad ?? 50,
          valorEstimado: oportunidad.valorEstimado || 0,
          moneda: oportunidad.moneda || 'EUR',
          fechaCierreEstimada: fechaCierre,
          estado: oportunidad.estado || EstadoOportunidad.ABIERTA,
          lineas: oportunidad.lineas || [],
          etiquetas: oportunidad.etiquetas || [],
        })
      } catch (error) {
        console.error('Error cargando datos:', error)
        toast.error('Error al cargar la oportunidad')
        router.push('/crm/oportunidades')
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
  }, [id, router])

  const handleChange = (field: keyof UpdateOportunidadDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEtapaChange = (etapaId: string) => {
    const etapa = etapas.find(e => e._id === etapaId)
    setFormData(prev => ({
      ...prev,
      etapaId,
      probabilidad: etapa?.probabilidadDefecto || prev.probabilidad,
    }))
  }

  const handleAddLinea = () => {
    setFormData(prev => ({
      ...prev,
      lineas: [
        ...(prev.lineas || []),
        { descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0 },
      ],
    }))
  }

  const handleRemoveLinea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lineas: prev.lineas?.filter((_, i) => i !== index),
    }))
  }

  const handleLineaChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      lineas: prev.lineas?.map((linea, i) =>
        i === index ? { ...linea, [field]: value } : linea
      ),
    }))
  }

  const calcularTotalLineas = () => {
    return formData.lineas?.reduce((total, linea) => {
      const subtotal = linea.cantidad * linea.precioUnitario
      const descuento = subtotal * ((linea.descuento || 0) / 100)
      return total + (subtotal - descuento)
    }, 0) || 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre?.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    if (!formData.etapaId) {
      toast.error('Selecciona una etapa del pipeline')
      return
    }

    try {
      setIsSubmitting(true)

      // Si hay lineas, calcular el valor estimado de ellas
      const valorLineas = calcularTotalLineas()
      const dataToSend = {
        ...formData,
        valorEstimado: valorLineas > 0 ? valorLineas : formData.valorEstimado,
      }

      await crmService.updateOportunidad(id, dataToSend)
      toast.success('Oportunidad actualizada correctamente')
      router.push(`/crm/oportunidades/${id}`)
    } catch (error: any) {
      console.error('Error actualizando oportunidad:', error)
      toast.error(error.response?.data?.error || 'Error al actualizar la oportunidad')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (etapas.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Pipeline no configurado</h2>
          <p className="text-gray-500 mb-6">
            Necesitas configurar las etapas del pipeline antes de editar oportunidades.
          </p>
          <Link href="/crm/configuracion/pipeline">
            <Button>Configurar Pipeline</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/crm/oportunidades/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Oportunidad</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Modifica los datos de la oportunidad
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Datos basicos */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Datos Basicos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nombre">Nombre de la Oportunidad *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Ej: Proyecto web para Empresa ABC"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="descripcion">Descripcion</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                placeholder="Describe la oportunidad..."
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Pipeline */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="etapa">Etapa *</Label>
              <Select
                value={formData.etapaId}
                onValueChange={handleEtapaChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una etapa" />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa._id} value={etapa._id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: etapa.color }}
                        />
                        {etapa.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="probabilidad">Probabilidad de Cierre (%)</Label>
              <Input
                id="probabilidad"
                type="number"
                min="0"
                max="100"
                step="any"
                value={formData.probabilidad || ''}
                onChange={(e) => handleChange('probabilidad', e.target.value === '' ? 0 : parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="fechaCierre">Fecha Estimada de Cierre</Label>
              <Input
                id="fechaCierre"
                type="date"
                value={formData.fechaCierreEstimada || ''}
                onChange={(e) => handleChange('fechaCierreEstimada', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Valor */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Valor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valorEstimado">Valor Estimado</Label>
              <Input
                id="valorEstimado"
                type="number"
                min="0"
                step="0.01"
                value={formData.valorEstimado || ''}
                onChange={(e) => handleChange('valorEstimado', e.target.value === '' ? 0 : parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="moneda">Moneda</Label>
              <Select
                value={formData.moneda}
                onValueChange={(v) => handleChange('moneda', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - Dolar</SelectItem>
                  <SelectItem value="GBP">GBP - Libra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Lineas de productos/servicios */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Productos/Servicios</h2>
            <Button type="button" variant="outline" size="sm" onClick={handleAddLinea}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar linea
            </Button>
          </div>

          {formData.lineas && formData.lineas.length > 0 ? (
            <div className="space-y-4">
              {formData.lineas.map((linea, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label className="text-xs">Producto/Servicio</Label>
                    <SearchableSelect
                      options={productos}
                      value={(linea as any).productoId || ''}
                      onValueChange={(val) => {
                        const prod = productos.find(p => p.value === val)
                        handleLineaChange(index, 'productoId', val)
                        if (prod) {
                          handleLineaChange(index, 'descripcion', prod.label)
                          if (prod.precio > 0) {
                            handleLineaChange(index, 'precioUnitario', prod.precio)
                          }
                        }
                      }}
                      placeholder="Buscar producto..."
                      allowClear
                    />
                    <Input
                      value={linea.descripcion}
                      onChange={(e) => handleLineaChange(index, 'descripcion', e.target.value)}
                      placeholder="Descripcion"
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={linea.cantidad}
                      onChange={(e) => handleLineaChange(index, 'cantidad', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Precio Unit.</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={linea.precioUnitario}
                      onChange={(e) => handleLineaChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Dto. %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={linea.descuento || 0}
                      onChange={(e) => handleLineaChange(index, 'descuento', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLinea(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total lineas</p>
                  <p className="text-xl font-bold">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: formData.moneda || 'EUR' }).format(calcularTotalLineas())}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Sin lineas de productos. Puedes agregar lineas o usar el valor estimado directamente.
            </p>
          )}
        </Card>

        {/* Botones */}
        <div className="flex items-center justify-end gap-3">
          <Link href={`/crm/oportunidades/${id}`}>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
