'use client'

import { useState, useEffect, useCallback } from 'react'
import { turnosServicioService, TurnoServicio, CreateTurnoServicioDTO, UpdateTurnoServicioDTO } from '@/services/turnos-servicio.service'
import { salonesService, Salon } from '@/services/salones.service'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Clock,
  Save,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lun' },
  { key: 'martes', label: 'Mar' },
  { key: 'miercoles', label: 'Mie' },
  { key: 'jueves', label: 'Jue' },
  { key: 'viernes', label: 'Vie' },
  { key: 'sabado', label: 'Sab' },
  { key: 'domingo', label: 'Dom' },
]

const COLORES = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
]

const EMPTY_FORM: CreateTurnoServicioDTO = {
  nombre: '',
  codigo: '',
  horaInicio: '08:00',
  horaFin: '16:00',
  diasSemana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
  salonesIds: [],
  maxCamareros: undefined,
  color: '#3b82f6',
  descripcion: '',
}

export default function TurnosServicioPage() {
  const [turnos, setTurnos] = useState<TurnoServicio[]>([])
  const [salones, setSalones] = useState<Salon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateTurnoServicioDTO>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; nombre: string }>({
    open: false, id: '', nombre: ''
  })

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true)
      const [turnosRes, salonesRes] = await Promise.all([
        turnosServicioService.getAll({ limit: 100 }),
        salonesService.getAll({ activo: true, limit: 100 }),
      ])
      if (turnosRes.success) {
        setTurnos(turnosRes.data || [])
      }
      if (salonesRes.success) {
        setSalones(salonesRes.data || [])
      }
    } catch (error) {
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const handleNuevo = () => {
    setFormData(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  const handleEditar = (turno: TurnoServicio) => {
    setFormData({
      nombre: turno.nombre,
      codigo: turno.codigo,
      horaInicio: turno.horaInicio,
      horaFin: turno.horaFin,
      diasSemana: turno.diasSemana,
      salonesIds: Array.isArray(turno.salonesIds)
        ? turno.salonesIds.map((s: any) => typeof s === 'string' ? s : s._id)
        : [],
      maxCamareros: turno.maxCamareros,
      color: turno.color || '#3b82f6',
      descripcion: turno.descripcion || '',
    })
    setEditingId(turno._id)
    setShowForm(true)
  }

  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!formData.codigo.trim()) {
      toast.error('El codigo es obligatorio')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await turnosServicioService.update(editingId, formData as UpdateTurnoServicioDTO)
        toast.success('Turno de servicio actualizado')
      } else {
        await turnosServicioService.create(formData)
        toast.success('Turno de servicio creado')
      }
      setShowForm(false)
      cargarDatos()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async () => {
    try {
      await turnosServicioService.delete(deleteDialog.id)
      toast.success('Turno de servicio eliminado')
      setDeleteDialog({ open: false, id: '', nombre: '' })
      cargarDatos()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleToggleActivo = async (turno: TurnoServicio) => {
    try {
      await turnosServicioService.update(turno._id, { activo: !turno.activo })
      toast.success(turno.activo ? 'Turno desactivado' : 'Turno activado')
      cargarDatos()
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  const toggleDia = (dia: string) => {
    setFormData(prev => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter(d => d !== dia)
        : [...prev.diasSemana, dia],
    }))
  }

  const toggleSalon = (salonId: string) => {
    setFormData(prev => {
      const current = prev.salonesIds || []
      return {
        ...prev,
        salonesIds: current.includes(salonId)
          ? current.filter(id => id !== salonId)
          : [...current, salonId],
      }
    })
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary" />
            Turnos de Servicio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los turnos de servicio del restaurante (desayuno, comida, cena...)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={cargarDatos}>
            <RefreshCw className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Actualizar</span>
          </Button>
          <Button size="sm" onClick={handleNuevo}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Turno
          </Button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingId ? 'Editar' : 'Nuevo'} Turno de Servicio</span>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Comida"
                />
              </div>
              <div className="space-y-2">
                <Label>Codigo *</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="Ej: COM"
                />
              </div>
              <div className="space-y-2">
                <Label>Max. Camareros</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.maxCamareros || ''}
                  onChange={(e) => setFormData({ ...formData, maxCamareros: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Sin limite"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora Inicio *</Label>
                <Input
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora Fin *</Label>
                <Input
                  type="time"
                  value={formData.horaFin}
                  onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dias de la semana</Label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDia(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formData.diasSemana.includes(key)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {salones.length > 0 && (
              <div className="space-y-2">
                <Label>Salones</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {salones.map((salon) => (
                    <div
                      key={salon._id}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                        formData.salonesIds?.includes(salon._id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleSalon(salon._id)}
                    >
                      <Checkbox
                        checked={formData.salonesIds?.includes(salon._id)}
                        onCheckedChange={() => toggleSalon(salon._id)}
                      />
                      <span>{salon.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      formData.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Input
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripcion opcional"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={saving}>
                {saving ? (
                  <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Guardando...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />{editingId ? 'Actualizar' : 'Crear'}</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de turnos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : turnos.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="font-medium">No hay turnos de servicio</p>
            <p className="text-sm mt-1">Crea turnos como desayuno, comida o cena</p>
          </div>
        ) : (
          turnos.map((turno) => (
            <Card key={turno._id} className={`overflow-hidden ${!turno.activo ? 'opacity-60' : ''}`}>
              <div className="h-1" style={{ backgroundColor: turno.color || '#3b82f6' }} />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{turno.nombre}</h3>
                    <span className="text-xs font-mono text-muted-foreground">{turno.codigo}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditar(turno)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => setDeleteDialog({ open: true, id: turno._id, nombre: turno.nombre })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="font-medium">{turno.horaInicio}</span>
                  <span className="text-muted-foreground"> - </span>
                  <span className="font-medium">{turno.horaFin}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {DIAS_SEMANA.map(({ key, label }) => (
                    <Badge
                      key={key}
                      variant={turno.diasSemana.includes(key) ? 'default' : 'secondary'}
                      className={`text-[10px] ${turno.diasSemana.includes(key) ? '' : 'opacity-30'}`}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>

                {turno.salonesIds && Array.isArray(turno.salonesIds) && turno.salonesIds.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {turno.salonesIds.map((salon: any) => (
                      <Badge key={typeof salon === 'string' ? salon : salon._id} variant="outline" className="text-[10px]">
                        {typeof salon === 'string' ? salon : salon.nombre}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  {turno.maxCamareros ? (
                    <span className="text-xs text-muted-foreground">Max {turno.maxCamareros} camareros</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin limite</span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{turno.activo ? 'Activo' : 'Inactivo'}</span>
                    <Switch
                      checked={turno.activo}
                      onCheckedChange={() => handleToggleActivo(turno)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar turno de servicio</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que deseas eliminar el turno &quot;{deleteDialog.nombre}&quot;? Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: '', nombre: '' })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminar}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
