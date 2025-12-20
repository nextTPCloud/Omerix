'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { departamentosService } from '@/services/departamentos.service'
import { turnosService } from '@/services/turnos.service'
import { calendariosService } from '@/services/calendarios.service'
import { Departamento, UpdateDepartamentoDTO, COLORES_DEPARTAMENTO } from '@/types/departamento.types'
import { Turno } from '@/types/turno.types'
import { CalendarioLaboral } from '@/types/calendario.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Building2, RefreshCw, Clock } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { toast } from 'sonner'

export default function EditarDepartamentoPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateDepartamentoDTO & { codigo: string }>({
    codigo: '',
    nombre: '',
    descripcion: '',
    responsableId: '',
    responsableNombre: '',
    color: '#3B82F6',
    orden: 0,
    activo: true,
    // Control horario
    turnoDefectoId: '',
    calendarioLaboralId: '',
    toleranciaRetrasoMinutos: undefined,
  })
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [calendarios, setCalendarios] = useState<CalendarioLaboral[]>([])

  // Opciones para SearchableSelect
  const turnosOptions = useMemo(() => [
    { value: '', label: 'Sin asignar', description: 'Los empleados no heredarán turno' },
    ...turnos.map(t => ({
      value: t._id,
      label: t.nombre,
      description: `${t.horaEntrada} - ${t.horaSalida} (${t.horasTeoricas}h)`
    }))
  ], [turnos])

  const calendariosOptions = useMemo(() => [
    { value: '', label: 'Usar por defecto', description: 'Usar el calendario por defecto del año' },
    ...calendarios.map(c => ({
      value: c._id,
      label: c.nombre,
      description: `Año ${c.anio} - ${c.festivos?.length || 0} festivos`
    }))
  ], [calendarios])

  // Cargar turnos y calendarios
  useEffect(() => {
    const loadSelectData = async () => {
      try {
        const [turnosRes, calendariosRes] = await Promise.all([
          turnosService.getActivos(),
          calendariosService.getActivos()
        ])
        if (turnosRes.success) setTurnos(turnosRes.data)
        if (calendariosRes.success) setCalendarios(calendariosRes.data)
      } catch (err) {
        console.error('Error cargando datos de selects:', err)
      }
    }
    loadSelectData()
  }, [])

  useEffect(() => {
    const cargarDepartamento = async () => {
      try {
        setIsLoading(true)
        const response = await departamentosService.getById(params.id as string)
        if (response.success && response.data) {
          const dept = response.data
          setFormData({
            codigo: dept.codigo,
            nombre: dept.nombre,
            descripcion: dept.descripcion || '',
            responsableId: dept.responsableId || '',
            responsableNombre: dept.responsableNombre || '',
            color: dept.color || '#3B82F6',
            orden: dept.orden,
            activo: dept.activo,
            // Control horario
            turnoDefectoId: dept.turnoDefectoId || '',
            calendarioLaboralId: dept.calendarioLaboralId || '',
            toleranciaRetrasoMinutos: dept.toleranciaRetrasoMinutos,
          })
        } else {
          toast.error('Departamento no encontrado')
          router.push('/departamentos')
        }
      } catch (error) {
        toast.error('Error al cargar el departamento')
        router.push('/departamentos')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      cargarDepartamento()
    }
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre?.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await departamentosService.update(params.id as string, formData)
      if (response.success) {
        toast.success('Departamento actualizado correctamente')
        router.push(`/departamentos/${params.id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/departamentos/${params.id}`}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              Editar Departamento
            </h1>
            <p className="text-sm text-muted-foreground">Modifica los datos del departamento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Informacion General */}
          <Card>
            <CardHeader><CardTitle>Informacion General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Codigo</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">El codigo no se puede modificar</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Administracion, Produccion"
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Descripcion del departamento y sus funciones"
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsableNombre">Responsable</Label>
                  <Input
                    id="responsableNombre"
                    placeholder="Nombre del responsable"
                    value={formData.responsableNombre || ''}
                    onChange={(e) => setFormData({ ...formData, responsableNombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orden">Orden</Label>
                  <Input
                    id="orden"
                    type="number"
                    min={0}
                    value={formData.orden || 0}
                    onChange={(e) => setFormData({ ...formData, orden: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Apariencia */}
          <Card className="mt-4">
            <CardHeader><CardTitle>Apariencia</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Color del departamento</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORES_DEPARTAMENTO.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-primary' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      title={color.label}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Color seleccionado: {COLORES_DEPARTAMENTO.find(c => c.value === formData.color)?.label || formData.color}</p>
              </div>
            </CardContent>
          </Card>

          {/* Control Horario */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Control Horario (Heredable)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Estos valores serán heredados por los empleados del departamento que no tengan configuración propia.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="turnoDefecto">Turno por defecto</Label>
                  <SearchableSelect
                    options={turnosOptions}
                    value={formData.turnoDefectoId || ''}
                    onValueChange={(value) => setFormData({ ...formData, turnoDefectoId: value || undefined })}
                    placeholder="Sin asignar"
                    searchPlaceholder="Buscar turno..."
                    emptyMessage="No se encontraron turnos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calendarioLaboral">Calendario laboral</Label>
                  <SearchableSelect
                    options={calendariosOptions}
                    value={formData.calendarioLaboralId || ''}
                    onValueChange={(value) => setFormData({ ...formData, calendarioLaboralId: value || undefined })}
                    placeholder="Usar por defecto"
                    searchPlaceholder="Buscar calendario..."
                    emptyMessage="No se encontraron calendarios"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="toleranciaRetraso">Tolerancia retraso (minutos)</Label>
                  <Input
                    id="toleranciaRetraso"
                    type="number"
                    min="0"
                    max="60"
                    value={formData.toleranciaRetrasoMinutos ?? ''}
                    onChange={(e) => setFormData({ ...formData, toleranciaRetrasoMinutos: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="5 (por defecto)"
                  />
                  <p className="text-xs text-muted-foreground">Minutos de tolerancia para retrasos. Vacío = 5 min por defecto</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado */}
          <Card className="mt-4">
            <CardHeader><CardTitle>Estado</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Activo</Label>
                  <p className="text-sm text-muted-foreground">El departamento esta disponible para asignar personal</p>
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
              <Link href={`/departamentos/${params.id}`}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
