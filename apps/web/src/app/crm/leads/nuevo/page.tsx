'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { crmService } from '@/services/crm.service'
import {
  CreateLeadDTO,
  OrigenLead,
  EstadoLead,
  InteresLead,
  ORIGEN_LEAD_LABELS,
  ESTADO_LEAD_LABELS,
  INTERES_LEAD_LABELS,
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
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NuevoLeadPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateLeadDTO>({
    nombre: '',
    apellidos: '',
    empresa: '',
    cargo: '',
    email: '',
    telefono: '',
    movil: '',
    web: '',
    origen: OrigenLead.WEB,
    estado: EstadoLead.NUEVO,
    interes: InteresLead.TIBIO,
    puntuacion: 50,
    notas: '',
    etiquetas: [],
    direccion: {
      calle: '',
      ciudad: '',
      provincia: '',
      codigoPostal: '',
      pais: 'Espana',
    },
  })

  const handleChange = (field: keyof CreateLeadDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDireccionChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      direccion: { ...prev.direccion, [field]: value },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    try {
      setIsSubmitting(true)
      const lead = await crmService.createLead(formData)
      toast.success('Lead creado correctamente')
      router.push(`/crm/leads/${lead._id}`)
    } catch (error: any) {
      console.error('Error creando lead:', error)
      toast.error(error.response?.data?.error || 'Error al crear el lead')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/crm/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Lead</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Registra un nuevo prospecto
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Datos basicos */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Datos Basicos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Nombre del lead"
                  required
                />
              </div>
              <div>
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) => handleChange('apellidos', e.target.value)}
                  placeholder="Apellidos"
                />
              </div>
              <div>
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  value={formData.empresa}
                  onChange={(e) => handleChange('empresa', e.target.value)}
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => handleChange('cargo', e.target.value)}
                  placeholder="Cargo o puesto"
                />
              </div>
            </div>
          </Card>

          {/* Contacto */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Telefono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  placeholder="+34 900 000 000"
                />
              </div>
              <div>
                <Label htmlFor="movil">Movil</Label>
                <Input
                  id="movil"
                  value={formData.movil}
                  onChange={(e) => handleChange('movil', e.target.value)}
                  placeholder="+34 600 000 000"
                />
              </div>
              <div>
                <Label htmlFor="web">Web</Label>
                <Input
                  id="web"
                  value={formData.web}
                  onChange={(e) => handleChange('web', e.target.value)}
                  placeholder="https://ejemplo.com"
                />
              </div>
            </div>
          </Card>

          {/* Direccion */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Direccion</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="calle">Calle</Label>
                <Input
                  id="calle"
                  value={formData.direccion?.calle}
                  onChange={(e) => handleDireccionChange('calle', e.target.value)}
                  placeholder="Direccion completa"
                />
              </div>
              <div>
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.direccion?.ciudad}
                  onChange={(e) => handleDireccionChange('ciudad', e.target.value)}
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  value={formData.direccion?.provincia}
                  onChange={(e) => handleDireccionChange('provincia', e.target.value)}
                  placeholder="Provincia"
                />
              </div>
              <div>
                <Label htmlFor="codigoPostal">Codigo Postal</Label>
                <Input
                  id="codigoPostal"
                  value={formData.direccion?.codigoPostal}
                  onChange={(e) => handleDireccionChange('codigoPostal', e.target.value)}
                  placeholder="12345"
                />
              </div>
              <div>
                <Label htmlFor="pais">Pais</Label>
                <Input
                  id="pais"
                  value={formData.direccion?.pais}
                  onChange={(e) => handleDireccionChange('pais', e.target.value)}
                  placeholder="Espana"
                />
              </div>
            </div>
          </Card>

          {/* Clasificacion CRM */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Clasificacion CRM</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="origen">Origen</Label>
                <Select
                  value={formData.origen}
                  onValueChange={(v) => handleChange('origen', v as OrigenLead)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORIGEN_LEAD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(v) => handleChange('estado', v as EstadoLead)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESTADO_LEAD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="interes">Nivel de Interes</Label>
                <Select
                  value={formData.interes}
                  onValueChange={(v) => handleChange('interes', v as InteresLead)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INTERES_LEAD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="puntuacion">Puntuacion (0-100)</Label>
                <Input
                  id="puntuacion"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.puntuacion}
                  onChange={(e) => handleChange('puntuacion', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="proximoContacto">Proximo Contacto</Label>
                <Input
                  id="proximoContacto"
                  type="date"
                  value={formData.proximoContacto || ''}
                  onChange={(e) => handleChange('proximoContacto', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Notas */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Notas</h2>
            <Textarea
              value={formData.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              placeholder="Notas adicionales sobre el lead..."
              rows={4}
            />
          </Card>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/crm/leads">
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
                  Guardar Lead
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
