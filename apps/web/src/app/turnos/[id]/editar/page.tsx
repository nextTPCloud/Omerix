'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { turnosService } from '@/services/turnos.service'
import { UpdateTurnoDTO, DIAS_SEMANA, COLORES_TURNO } from '@/types/turno.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Clock, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarTurnoPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateTurnoDTO & { codigo: string }>({
    codigo: '',
    nombre: '',
    descripcion: '',
    horaEntrada: '08:00',
    horaSalida: '17:00',
    pausaInicio: '',
    pausaFin: '',
    duracionPausaMinutos: 0,
    horasTeoricas: 8,
    diasSemana: [1, 2, 3, 4, 5],
    color: '#3B82F6',
    activo: true,
  })

  useEffect(() => {
    const cargarTurno = async () => {
      try {
        setIsLoading(true)
        const response = await turnosService.getById(params.id as string)
        if (response.success && response.data) {
          const turno = response.data
          setFormData({
            codigo: turno.codigo,
            nombre: turno.nombre,
            descripcion: turno.descripcion || '',
            horaEntrada: turno.horaEntrada,
            horaSalida: turno.horaSalida,
            pausaInicio: turno.pausaInicio || '',
            pausaFin: turno.pausaFin || '',
            duracionPausaMinutos: turno.duracionPausaMinutos || 0,
            horasTeoricas: turno.horasTeoricas,
            diasSemana: turno.diasSemana,
            color: turno.color || '#3B82F6',
            activo: turno.activo,
          })
        } else {
          toast.error('Turno no encontrado')
          router.push('/turnos')
        }
      } catch (error) {
        toast.error('Error al cargar el turno')
        router.push('/turnos')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      cargarTurno()
    }
  }, [params.id, router])

  const calcularHoras = () => {
    if (formData.horaEntrada && formData.horaSalida) {
      const horas = turnosService.calcularHorasTeoricas(
        formData.horaEntrada,
        formData.horaSalida,
        formData.duracionPausaMinutos || 0
      )
      setFormData({ ...formData, horasTeoricas: Math.round(horas * 100) / 100 })
    }
  }

  const toggleDia = (dia: number) => {
    if (formData.diasSemana?.includes(dia)) {
      setFormData({ ...formData, diasSemana: formData.diasSemana.filter(d => d !== dia) })
    } else {
      setFormData({ ...formData, diasSemana: [...(formData.diasSemana || []), dia].sort() })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre?.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    if (!formData.horaEntrada || !formData.horaSalida) {
      toast.error('Las horas de entrada y salida son obligatorias')
      return
    }

    setIsSaving(true)
    try {
      const response = await turnosService.update(params.id as string, formData)
      if (response.success) {
        toast.success('Turno actualizado correctamente')
        router.push(`/turnos/${params.id}`)
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
            <Link href={`/turnos/${params.id}`}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Clock className="h-7 w-7 text-primary" />
              Editar Turno
            </h1>
            <p className="text-sm text-muted-foreground">Modifica los horarios del turno de trabajo</p>
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
                    placeholder="Ej: Turno Mañana"
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Descripcion del turno"
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Horarios */}
          <Card className="mt-4">
            <CardHeader><CardTitle>Horarios</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaEntrada">Hora de Entrada *</Label>
                  <Input
                    id="horaEntrada"
                    type="time"
                    value={formData.horaEntrada || ''}
                    onChange={(e) => setFormData({ ...formData, horaEntrada: e.target.value })}
                    onBlur={calcularHoras}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaSalida">Hora de Salida *</Label>
                  <Input
                    id="horaSalida"
                    type="time"
                    value={formData.horaSalida || ''}
                    onChange={(e) => setFormData({ ...formData, horaSalida: e.target.value })}
                    onBlur={calcularHoras}
                  />
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-muted/20">
                <Label className="font-medium">Pausa / Descanso</Label>
                <p className="text-sm text-muted-foreground mb-3">Configura el tiempo de pausa si aplica</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pausaInicio">Inicio Pausa</Label>
                    <Input
                      id="pausaInicio"
                      type="time"
                      value={formData.pausaInicio || ''}
                      onChange={(e) => setFormData({ ...formData, pausaInicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pausaFin">Fin Pausa</Label>
                    <Input
                      id="pausaFin"
                      type="time"
                      value={formData.pausaFin || ''}
                      onChange={(e) => setFormData({ ...formData, pausaFin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duracionPausaMinutos">Minutos Pausa</Label>
                    <Input
                      id="duracionPausaMinutos"
                      type="number"
                      min={0}
                      max={240}
                      value={formData.duracionPausaMinutos || 0}
                      onChange={(e) => setFormData({ ...formData, duracionPausaMinutos: Number(e.target.value) })}
                      onBlur={calcularHoras}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horasTeoricas">Horas Teoricas Diarias</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="horasTeoricas"
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    value={formData.horasTeoricas || 0}
                    onChange={(e) => setFormData({ ...formData, horasTeoricas: Number(e.target.value) })}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">horas</span>
                  <Button type="button" variant="outline" size="sm" onClick={calcularHoras}>Calcular</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dias de la Semana */}
          <Card className="mt-4">
            <CardHeader><CardTitle>Dias de Trabajo</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {DIAS_SEMANA.map((dia) => (
                  <label
                    key={dia.value}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${formData.diasSemana?.includes(dia.value) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                  >
                    <Checkbox
                      checked={formData.diasSemana?.includes(dia.value)}
                      onCheckedChange={() => toggleDia(dia.value)}
                    />
                    <span>{dia.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Dias seleccionados: {formData.diasSemana?.length || 0} | Horas semanales: {((formData.horasTeoricas || 0) * (formData.diasSemana?.length || 0)).toFixed(1)}h
              </p>
            </CardContent>
          </Card>

          {/* Apariencia */}
          <Card className="mt-4">
            <CardHeader><CardTitle>Apariencia</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Color del turno</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORES_TURNO.map((color) => (
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
                  <p className="text-sm text-muted-foreground">El turno esta disponible para asignar</p>
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
              <Link href={`/turnos/${params.id}`}>Cancelar</Link>
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
