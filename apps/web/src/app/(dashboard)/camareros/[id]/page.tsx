'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

import { camarerosService, UpdateCamareroDTO, Turno, Camarero } from '@/services/camareros.service'
import { salonesService, Salon } from '@/services/salones.service'
import personalService from '@/services/personal.service'
import { turnosService } from '@/services/turnos.service'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  ArrowLeft,
  Save,
  UserCog,
  Shield,
  Clock,
  LayoutGrid,
  Users,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

const DIAS_SEMANA: { key: Turno['dia']; label: string }[] = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miercoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sabado' },
  { key: 'domingo', label: 'Domingo' },
]

const COLORES_PREDEFINIDOS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#ec4899', '#78716c', '#64748b',
]

export default function EditarCamareroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [salones, setSalones] = useState<Salon[]>([])
  const [personalList, setPersonalList] = useState<any[]>([])
  const [turnosList, setTurnosList] = useState<any[]>([])
  const [usarTurnosRRHH, setUsarTurnosRRHH] = useState(false)
  const [formData, setFormData] = useState<UpdateCamareroDTO>({})
  const [codigo, setCodigo] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [camareroResponse, salonesResponse] = await Promise.all([
        camarerosService.getById(id),
        salonesService.getAll({ activo: true, limit: 100 }),
      ])

      if (camareroResponse.success) {
        const camarero = camareroResponse.data
        setCodigo(camarero.codigo)

        // Extraer personalId
        const personalIdValue = camarero.personalId
          ? (typeof camarero.personalId === 'object' ? camarero.personalId._id : camarero.personalId)
          : undefined

        // Extraer turnosRRHHIds
        const turnosRRHHIdsValue = Array.isArray(camarero.turnosRRHHIds)
          ? camarero.turnosRRHHIds.map((t: any) => typeof t === 'object' ? t._id : t)
          : []

        // Si tiene turnos RRHH asignados, activar el toggle
        if (turnosRRHHIdsValue.length > 0) {
          setUsarTurnosRRHH(true)
        }

        setFormData({
          nombre: camarero.nombre,
          apellidos: camarero.apellidos,
          alias: camarero.alias,
          color: camarero.color,
          personalId: personalIdValue,
          turnosRRHHIds: turnosRRHHIdsValue,
          salonesAsignados: Array.isArray(camarero.salonesAsignados)
            ? camarero.salonesAsignados.map(s => typeof s === 'object' ? s._id : s)
            : [],
          turnos: camarero.turnos,
          comisionPorcentaje: camarero.comisionPorcentaje,
          permisos: camarero.permisos,
          activo: camarero.activo,
        })
      }

      if (salonesResponse.success) {
        setSalones(salonesResponse.data)
      }

      // Cargar personal RRHH
      try {
        const personalResponse = await personalService.getAll({ activo: true, limit: 200 })
        if (personalResponse.success && personalResponse.data) {
          setPersonalList(personalResponse.data)
        }
      } catch {
        // Si falla, continuar sin personal
      }

      // Cargar turnos RRHH
      try {
        const turnosResponse = await turnosService.getAll({ activo: true, limit: 100 })
        if (turnosResponse.success && turnosResponse.data) {
          setTurnosList(turnosResponse.data)
        }
      } catch {
        // Si falla, continuar sin turnos
      }
    } catch (error) {
      console.error('Error cargando camarero:', error)
      toast.error('Error al cargar el camarero')
      router.push('/camareros')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre?.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setSaving(true)
    try {
      const dataToSend = { ...formData }
      if (!dataToSend.personalId) {
        dataToSend.personalId = null
      }
      // Si usa turnos RRHH, no enviar turnos personalizados
      if (usarTurnosRRHH) {
        delete dataToSend.turnos
      } else {
        delete dataToSend.turnosRRHHIds
      }

      await camarerosService.update(id, dataToSend)
      toast.success('Camarero actualizado correctamente')
      router.push('/camareros')
    } catch (error: any) {
      console.error('Error al actualizar camarero:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar el camarero')
    } finally {
      setSaving(false)
    }
  }

  const handleTurnoChange = (dia: Turno['dia'], field: keyof Turno, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      turnos: prev.turnos?.map(t =>
        t.dia === dia ? { ...t, [field]: value } : t
      ),
    }))
  }

  const handleSalonToggle = (salonId: string) => {
    setFormData(prev => {
      const current = prev.salonesAsignados || []
      const isSelected = current.includes(salonId)
      return {
        ...prev,
        salonesAsignados: isSelected
          ? current.filter(id => id !== salonId)
          : [...current, salonId],
      }
    })
  }

  const handleTurnoRRHHToggle = (turnoId: string) => {
    setFormData(prev => {
      const current = prev.turnosRRHHIds || []
      const isSelected = current.includes(turnoId)
      return {
        ...prev,
        turnosRRHHIds: isSelected
          ? current.filter(id => id !== turnoId)
          : [...current, turnoId],
      }
    })
  }

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      
    )
  }

  return (
    
      <div className="w-full space-y-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <UserCog className="h-7 w-7 text-primary" />
              Editar Camarero
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Codigo: {codigo}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informacion General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Informacion General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del camarero"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos</Label>
                  <Input
                    id="apellidos"
                    value={formData.apellidos || ''}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    placeholder="Apellidos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alias">Alias</Label>
                  <Input
                    id="alias"
                    value={formData.alias || ''}
                    onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                    placeholder="Nombre corto para TPV"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pin">Nuevo PIN (4 digitos)</Label>
                  <Input
                    id="pin"
                    type="password"
                    maxLength={4}
                    value={formData.pin || ''}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="Dejar vacio para no cambiar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comision">Comision (%)</Label>
                  <Input
                    id="comision"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.comisionPorcentaje || 0}
                    onChange={(e) => setFormData({ ...formData, comisionPorcentaje: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORES_PREDEFINIDOS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo">Camarero activo</Label>
              </div>
            </CardContent>
          </Card>

          {/* Personal RRHH vinculado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Personal RRHH Vinculado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Vincula este camarero con un empleado de RRHH para fichaje y control horario.
              </p>
              <SearchableSelect
                options={personalList.map((p: any) => ({
                  value: p._id,
                  label: `${p.nombre} ${p.apellidos || ''}`.trim(),
                  description: p.email || undefined,
                }))}
                value={formData.personalId || ''}
                onValueChange={(value) => setFormData({ ...formData, personalId: value || undefined })}
                placeholder="Sin vincular"
                searchPlaceholder="Buscar personal..."
                emptyMessage="No se encontro personal"
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Salones Asignados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                Salones Asignados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salones.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay salones disponibles.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {salones.map((salon) => (
                    <div
                      key={salon._id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.salonesAsignados?.includes(salon._id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSalonToggle(salon._id)}
                    >
                      <Checkbox
                        checked={formData.salonesAsignados?.includes(salon._id)}
                        onCheckedChange={() => handleSalonToggle(salon._id)}
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: salon.color }}
                        />
                        <span className="text-sm font-medium">{salon.nombre}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permisos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permisos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="puedeCobrar"
                    checked={formData.permisos?.puedeCobrar}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permisos: { ...formData.permisos!, puedeCobrar: checked }
                    })}
                  />
                  <Label htmlFor="puedeCobrar">Puede cobrar</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="puedeAnularLineas"
                    checked={formData.permisos?.puedeAnularLineas}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permisos: { ...formData.permisos!, puedeAnularLineas: checked }
                    })}
                  />
                  <Label htmlFor="puedeAnularLineas">Puede anular lineas</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="puedeAplicarDescuentos"
                    checked={formData.permisos?.puedeAplicarDescuentos}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permisos: { ...formData.permisos!, puedeAplicarDescuentos: checked }
                    })}
                  />
                  <Label htmlFor="puedeAplicarDescuentos">Puede aplicar descuentos</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="puedeReimprimir"
                    checked={formData.permisos?.puedeReimprimir}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permisos: { ...formData.permisos!, puedeReimprimir: checked }
                    })}
                  />
                  <Label htmlFor="puedeReimprimir">Puede reimprimir</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="puedeTraspasar"
                    checked={formData.permisos?.puedeTraspasar}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permisos: { ...formData.permisos!, puedeTraspasar: checked }
                    })}
                  />
                  <Label htmlFor="puedeTraspasar">Puede traspasar mesas</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limiteDescuento">Limite descuento (%)</Label>
                  <Input
                    id="limiteDescuento"
                    type="number"
                    min="0"
                    max="100"
                    className="w-24"
                    value={formData.permisos?.limiteDescuento || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      permisos: { ...formData.permisos!, limiteDescuento: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Turnos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Turnos de Trabajo
                </div>
                {turnosList.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="usarTurnosRRHH" className="text-sm font-normal text-muted-foreground">
                      Usar turnos RRHH
                    </Label>
                    <Switch
                      id="usarTurnosRRHH"
                      checked={usarTurnosRRHH}
                      onCheckedChange={setUsarTurnosRRHH}
                    />
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usarTurnosRRHH ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecciona los turnos de RRHH que aplican a este camarero.
                  </p>
                  {turnosList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay turnos RRHH disponibles.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {turnosList.map((turno: any) => (
                        <div
                          key={turno._id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            formData.turnosRRHHIds?.includes(turno._id)
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleTurnoRRHHToggle(turno._id)}
                        >
                          <Checkbox
                            checked={formData.turnosRRHHIds?.includes(turno._id)}
                            onCheckedChange={() => handleTurnoRRHHToggle(turno._id)}
                          />
                          <div>
                            <div className="text-sm font-medium">{turno.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {turno.horaInicio} - {turno.horaFin}
                              {turno.codigo && ` (${turno.codigo})`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {DIAS_SEMANA.map(({ key, label }) => {
                    const turno = formData.turnos?.find(t => t.dia === key) || {
                      dia: key,
                      horaInicio: '09:00',
                      horaFin: '17:00',
                      activo: true,
                    }
                    return (
                      <div key={key} className="flex items-center gap-4 py-2 border-b last:border-b-0">
                        <div className="w-24 font-medium">{label}</div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={turno.activo}
                            onCheckedChange={(checked) => handleTurnoChange(key, 'activo', checked)}
                          />
                          <span className="text-sm text-muted-foreground w-16">
                            {turno.activo ? 'Trabaja' : 'Libre'}
                          </span>
                        </div>
                        {turno.activo && (
                          <>
                            <Input
                              type="time"
                              className="w-32"
                              value={turno.horaInicio}
                              onChange={(e) => handleTurnoChange(key, 'horaInicio', e.target.value)}
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              className="w-32"
                              value={turno.horaFin}
                              onChange={(e) => handleTurnoChange(key, 'horaFin', e.target.value)}
                            />
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de accion */}
          <Card className="p-4 bg-muted/50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Los cambios se guardaran inmediatamente
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
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
            </div>
          </Card>
        </form>
      </div>
    
  )
}
