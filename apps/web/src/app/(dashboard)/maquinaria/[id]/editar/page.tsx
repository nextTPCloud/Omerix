'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import { maquinariaService } from '@/services/maquinaria.service'
import { UpdateMaquinariaDTO, TipoMaquinaria, EstadoMaquinaria, TIPOS_MAQUINARIA, ESTADOS_MAQUINARIA } from '@/types/maquinaria.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Truck, Settings, DollarSign, Calendar, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarMaquinariaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateMaquinariaDTO>({})

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await maquinariaService.getById(id)
        if (response.success && response.data) {
          const m = response.data
          setFormData({
            codigo: m.codigo || '',
            nombre: m.nombre || '',
            descripcion: m.descripcion || '',
            tipo: m.tipo || 'maquinaria',
            matricula: m.matricula || '',
            marca: m.marca || '',
            modelo: m.modelo || '',
            anio: m.anio,
            numeroSerie: m.numeroSerie || '',
            estado: m.estado || 'disponible',
            ubicacionActual: m.ubicacionActual || '',
            tarifaHoraCoste: m.tarifaHoraCoste || 0,
            tarifaHoraVenta: m.tarifaHoraVenta || 0,
            tarifaDiaCoste: m.tarifaDiaCoste,
            tarifaDiaVenta: m.tarifaDiaVenta,
            tarifaKmCoste: m.tarifaKmCoste,
            tarifaKmVenta: m.tarifaKmVenta,
            kmActuales: m.kmActuales,
            horasUso: m.horasUso,
            proximoMantenimientoFecha: m.proximoMantenimientoFecha?.split('T')[0],
            proximoMantenimientoKm: m.proximoMantenimientoKm,
            proximoMantenimientoHoras: m.proximoMantenimientoHoras,
            fechaITV: m.fechaITV?.split('T')[0],
            fechaSeguro: m.fechaSeguro?.split('T')[0],
            polizaSeguro: m.polizaSeguro || '',
            orden: m.orden || 0,
            activo: m.activo !== undefined ? m.activo : true,
            observaciones: m.observaciones || '',
          })
        }
      } catch (error) {
        toast.error('Error al cargar la maquinaria')
        router.push('/maquinaria')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.codigo?.trim()) {
      toast.error('El codigo es obligatorio')
      return
    }

    if (!formData.nombre?.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await maquinariaService.update(id, formData)
      if (response.success) {
        toast.success('Maquinaria actualizada correctamente')
        router.push('/maquinaria')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando maquinaria...</p>
          </div>
        </div>
      
    )
  }

  return (
    
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/maquinaria"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Truck className="h-7 w-7 text-primary" />
              Editar Maquinaria
            </h1>
            <p className="text-sm text-muted-foreground">Modifica los datos del vehiculo, maquinaria o equipo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Informacion General */}
          <Card>
            <CardHeader><CardTitle>Informacion General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Codigo *</Label>
                  <Input
                    id="codigo"
                    placeholder="Ej: MAQ001, VEH001"
                    value={formData.codigo || ''}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Excavadora CAT 320"
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoMaquinaria })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_MAQUINARIA.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matricula</Label>
                  <Input
                    id="matricula"
                    placeholder="Ej: 1234 ABC"
                    value={formData.matricula || ''}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    placeholder="Ej: Caterpillar"
                    value={formData.marca || ''}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    placeholder="Ej: 320D"
                    value={formData.modelo || ''}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anio">Año</Label>
                  <Input
                    id="anio"
                    type="number"
                    min={1900}
                    max={2100}
                    placeholder="2024"
                    value={formData.anio || ''}
                    onChange={(e) => setFormData({ ...formData, anio: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroSerie">Numero de Serie</Label>
                  <Input
                    id="numeroSerie"
                    placeholder="S/N del equipo"
                    value={formData.numeroSerie || ''}
                    onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado Operativo</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value as EstadoMaquinaria })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_MAQUINARIA.map((e) => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Descripcion del equipo..."
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tarifas */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Tarifas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tarifaHoraCoste">Tarifa Hora Coste (EUR)</Label>
                  <Input
                    id="tarifaHoraCoste"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.tarifaHoraCoste || ''}
                    onChange={(e) => setFormData({ ...formData, tarifaHoraCoste: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tarifaHoraVenta">Tarifa Hora Venta (EUR)</Label>
                  <Input
                    id="tarifaHoraVenta"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.tarifaHoraVenta || ''}
                    onChange={(e) => setFormData({ ...formData, tarifaHoraVenta: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tarifaDiaCoste">Tarifa Dia Coste (EUR)</Label>
                  <Input
                    id="tarifaDiaCoste"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.tarifaDiaCoste || ''}
                    onChange={(e) => setFormData({ ...formData, tarifaDiaCoste: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tarifaDiaVenta">Tarifa Dia Venta (EUR)</Label>
                  <Input
                    id="tarifaDiaVenta"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.tarifaDiaVenta || ''}
                    onChange={(e) => setFormData({ ...formData, tarifaDiaVenta: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tarifaKmCoste">Tarifa Km Coste (EUR)</Label>
                  <Input
                    id="tarifaKmCoste"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.tarifaKmCoste || ''}
                    onChange={(e) => setFormData({ ...formData, tarifaKmCoste: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tarifaKmVenta">Tarifa Km Venta (EUR)</Label>
                  <Input
                    id="tarifaKmVenta"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.tarifaKmVenta || ''}
                    onChange={(e) => setFormData({ ...formData, tarifaKmVenta: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contadores y Mantenimiento */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Contadores y Mantenimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kmActuales">Km Actuales</Label>
                  <Input
                    id="kmActuales"
                    type="number"
                    min={0}
                    value={formData.kmActuales || ''}
                    onChange={(e) => setFormData({ ...formData, kmActuales: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horasUso">Horas de Uso</Label>
                  <Input
                    id="horasUso"
                    type="number"
                    min={0}
                    step={0.1}
                    value={formData.horasUso || ''}
                    onChange={(e) => setFormData({ ...formData, horasUso: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proximoMantenimientoFecha">Proximo Mant. (Fecha)</Label>
                  <Input
                    id="proximoMantenimientoFecha"
                    type="date"
                    value={formData.proximoMantenimientoFecha || ''}
                    onChange={(e) => setFormData({ ...formData, proximoMantenimientoFecha: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proximoMantenimientoKm">Proximo Mant. (Km)</Label>
                  <Input
                    id="proximoMantenimientoKm"
                    type="number"
                    min={0}
                    value={formData.proximoMantenimientoKm || ''}
                    onChange={(e) => setFormData({ ...formData, proximoMantenimientoKm: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proximoMantenimientoHoras">Proximo Mant. (Horas)</Label>
                  <Input
                    id="proximoMantenimientoHoras"
                    type="number"
                    min={0}
                    value={formData.proximoMantenimientoHoras || ''}
                    onChange={(e) => setFormData({ ...formData, proximoMantenimientoHoras: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentacion */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Documentacion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaITV">Fecha ITV</Label>
                  <Input
                    id="fechaITV"
                    type="date"
                    value={formData.fechaITV || ''}
                    onChange={(e) => setFormData({ ...formData, fechaITV: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaSeguro">Fecha Seguro</Label>
                  <Input
                    id="fechaSeguro"
                    type="date"
                    value={formData.fechaSeguro || ''}
                    onChange={(e) => setFormData({ ...formData, fechaSeguro: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="polizaSeguro">Poliza Seguro</Label>
                  <Input
                    id="polizaSeguro"
                    placeholder="Numero de poliza"
                    value={formData.polizaSeguro || ''}
                    onChange={(e) => setFormData({ ...formData, polizaSeguro: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado y Observaciones */}
          <Card className="mt-4">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Notas adicionales..."
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Activo</Label>
                  <p className="text-sm text-muted-foreground">La maquinaria esta disponible para usar</p>
                </div>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" asChild>
              <Link href="/maquinaria">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    
  )
}
