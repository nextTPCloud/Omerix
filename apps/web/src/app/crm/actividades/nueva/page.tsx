'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { crmService } from '@/services/crm.service'
import {
  CreateActividadDTO,
  TipoActividad,
  TIPO_ACTIVIDAD_LABELS,
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
import { ArrowLeft, Save, Loader2, Phone, Mail, Users, Building2, CheckCircle, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

const tipoIconos: Record<TipoActividad, any> = {
  [TipoActividad.LLAMADA]: Phone,
  [TipoActividad.EMAIL]: Mail,
  [TipoActividad.REUNION]: Users,
  [TipoActividad.VISITA]: Building2,
  [TipoActividad.TAREA]: CheckCircle,
  [TipoActividad.NOTA]: MessageSquare,
  [TipoActividad.WHATSAPP]: MessageSquare,
}

export default function NuevaActividadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parametros opcionales para preseleccionar lead/oportunidad/cliente
  const leadIdParam = searchParams.get('leadId')
  const oportunidadIdParam = searchParams.get('oportunidadId')
  const clienteIdParam = searchParams.get('clienteId')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateActividadDTO>({
    tipo: TipoActividad.LLAMADA,
    asunto: '',
    descripcion: '',
    fechaProgramada: '',
    duracionMinutos: 30,
    leadId: leadIdParam || undefined,
    oportunidadId: oportunidadIdParam || undefined,
    clienteId: clienteIdParam || undefined,
    recordatorio: '',
  })

  const handleChange = (field: keyof CreateActividadDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.asunto.trim()) {
      toast.error('El asunto es obligatorio')
      return
    }

    if (!formData.leadId && !formData.oportunidadId && !formData.clienteId) {
      toast.error('Debes asociar la actividad a un lead, oportunidad o cliente')
      return
    }

    try {
      setIsSubmitting(true)
      const actividad = await crmService.createActividad(formData)
      toast.success('Actividad creada correctamente')

      // Redirigir segun el contexto
      if (formData.leadId) {
        router.push(`/crm/leads/${formData.leadId}`)
      } else if (formData.oportunidadId) {
        router.push(`/crm/oportunidades/${formData.oportunidadId}`)
      } else {
        router.push('/crm/actividades')
      }
    } catch (error: any) {
      console.error('Error creando actividad:', error)
      toast.error(error.response?.data?.error || 'Error al crear la actividad')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generar fecha y hora actual para el campo datetime-local
  const getDefaultDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/crm/actividades">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Actividad</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Programa una llamada, reunion o tarea
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tipo de actividad */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Tipo de Actividad</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(TIPO_ACTIVIDAD_LABELS).map(([tipo, label]) => {
                const Icon = tipoIconos[tipo as TipoActividad]
                const isSelected = formData.tipo === tipo
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => handleChange('tipo', tipo as TipoActividad)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mx-auto mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className={`text-sm ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                      {label}
                    </p>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Detalles */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Detalles</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="asunto">Asunto *</Label>
                <Input
                  id="asunto"
                  value={formData.asunto}
                  onChange={(e) => handleChange('asunto', e.target.value)}
                  placeholder="Ej: Llamada de seguimiento"
                  required
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  placeholder="Notas o detalles adicionales..."
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Programacion */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Programacion</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaProgramada">Fecha y Hora</Label>
                <Input
                  id="fechaProgramada"
                  type="datetime-local"
                  value={formData.fechaProgramada || ''}
                  onChange={(e) => handleChange('fechaProgramada', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="duracion">Duracion (minutos)</Label>
                <Select
                  value={String(formData.duracionMinutos)}
                  onValueChange={(v) => handleChange('duracionMinutos', parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1.5 horas</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="recordatorio">Recordatorio</Label>
                <Input
                  id="recordatorio"
                  type="datetime-local"
                  value={formData.recordatorio || ''}
                  onChange={(e) => handleChange('recordatorio', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Opcional: recibir aviso antes</p>
              </div>
            </div>
          </Card>

          {/* Asociar a */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Asociar a *</h2>
            <p className="text-sm text-gray-500 mb-4">
              Introduce el ID del lead, oportunidad o cliente al que asociar esta actividad.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="leadId">Lead ID</Label>
                <Input
                  id="leadId"
                  value={formData.leadId || ''}
                  onChange={(e) => handleChange('leadId', e.target.value || undefined)}
                  placeholder="ID del lead"
                />
              </div>
              <div>
                <Label htmlFor="oportunidadId">Oportunidad ID</Label>
                <Input
                  id="oportunidadId"
                  value={formData.oportunidadId || ''}
                  onChange={(e) => handleChange('oportunidadId', e.target.value || undefined)}
                  placeholder="ID de oportunidad"
                />
              </div>
              <div>
                <Label htmlFor="clienteId">Cliente ID</Label>
                <Input
                  id="clienteId"
                  value={formData.clienteId || ''}
                  onChange={(e) => handleChange('clienteId', e.target.value || undefined)}
                  placeholder="ID del cliente"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Nota: Solo es necesario completar uno de los tres campos.
            </p>
          </Card>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/crm/actividades">
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
                  Guardar Actividad
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
