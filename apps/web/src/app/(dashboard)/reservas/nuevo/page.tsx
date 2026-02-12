'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { reservasService, CreateReservaDTO } from '@/services/reservas.service'
import { salonesService, Salon } from '@/services/salones.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { ArrowLeft, Calendar, Save, Loader2, Users, Clock, Phone, Mail, MapPin } from 'lucide-react'
import { toast } from 'sonner'

const HORAS_DISPONIBLES = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00',
]

const DURACIONES = [
  { value: '60', label: '1 hora' },
  { value: '90', label: '1.5 horas' },
  { value: '120', label: '2 horas' },
  { value: '150', label: '2.5 horas' },
  { value: '180', label: '3 horas' },
]

const ORIGENES = [
  { value: 'telefono', label: 'Teléfono' },
  { value: 'web', label: 'Web' },
  { value: 'app', label: 'App' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'thefork', label: 'TheFork' },
  { value: 'google', label: 'Google' },
]

export default function NuevaReservaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [salones, setSalones] = useState<Salon[]>([])

  const [formData, setFormData] = useState<CreateReservaDTO>({
    clienteNombre: '',
    clienteTelefono: '',
    clienteEmail: '',
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '20:00',
    duracionMinutos: 90,
    comensales: 2,
    origen: 'telefono',
    notas: '',
    ocasionEspecial: '',
    salonId: '',
  })

  useEffect(() => {
    loadSalones()
  }, [])

  const loadSalones = async () => {
    try {
      const response = await salonesService.getAll({ activo: true, limit: 100 })
      if (response.success) {
        setSalones(response.data || [])
      }
    } catch (error) {
      console.error('Error cargando salones:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clienteNombre.trim()) {
      toast.error('El nombre del cliente es obligatorio')
      return
    }
    if (!formData.clienteTelefono.trim()) {
      toast.error('El teléfono del cliente es obligatorio')
      return
    }
    if (!formData.fecha) {
      toast.error('La fecha es obligatoria')
      return
    }
    if (formData.comensales < 1) {
      toast.error('El número de comensales debe ser al menos 1')
      return
    }

    try {
      setLoading(true)
      const dataToSend = {
        ...formData,
        salonId: formData.salonId || undefined,
      }
      await reservasService.create(dataToSend)
      toast.success('Reserva creada correctamente')
      router.push('/reservas')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear la reserva')
    } finally {
      setLoading(false)
    }
  }

  return (
    
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/reservas">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Calendar className="h-7 w-7 text-primary" />
                Nueva Reserva
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Crea una nueva reserva de mesa
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Datos del Cliente
              </CardTitle>
              <CardDescription>Información de contacto del cliente</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clienteNombre">Nombre *</Label>
                <Input
                  id="clienteNombre"
                  value={formData.clienteNombre}
                  onChange={(e) => setFormData({ ...formData, clienteNombre: e.target.value })}
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clienteTelefono">Teléfono *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="clienteTelefono"
                    type="tel"
                    value={formData.clienteTelefono}
                    onChange={(e) => setFormData({ ...formData, clienteTelefono: e.target.value })}
                    placeholder="Ej: 612345678"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clienteEmail">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="clienteEmail"
                    type="email"
                    value={formData.clienteEmail || ''}
                    onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })}
                    placeholder="cliente@email.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos de la Reserva */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Datos de la Reserva
              </CardTitle>
              <CardDescription>Fecha, hora y detalles de la reserva</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Hora *</Label>
                <SearchableSelect
                  value={formData.horaInicio}
                  onValueChange={(value) => setFormData({ ...formData, horaInicio: value })}
                  options={HORAS_DISPONIBLES.map(h => ({ value: h, label: h }))}
                  placeholder="Seleccionar hora"
                  searchPlaceholder="Buscar hora..."
                  emptyMessage="Sin resultados"
                />
              </div>

              <div className="space-y-2">
                <Label>Duración</Label>
                <SearchableSelect
                  value={formData.duracionMinutos?.toString() || '90'}
                  onValueChange={(value) => setFormData({ ...formData, duracionMinutos: parseInt(value) })}
                  options={DURACIONES}
                  placeholder="Duración"
                  searchPlaceholder="Buscar..."
                  emptyMessage="Sin resultados"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comensales">Comensales *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="comensales"
                    type="number"
                    min={1}
                    max={50}
                    value={formData.comensales}
                    onChange={(e) => setFormData({ ...formData, comensales: parseInt(e.target.value) || 1 })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Origen</Label>
                <SearchableSelect
                  value={formData.origen || 'telefono'}
                  onValueChange={(value) => setFormData({ ...formData, origen: value as any })}
                  options={ORIGENES}
                  placeholder="Origen"
                  searchPlaceholder="Buscar..."
                  emptyMessage="Sin resultados"
                />
              </div>

              <div className="space-y-2">
                <Label>Salón</Label>
                <SearchableSelect
                  value={formData.salonId || ''}
                  onValueChange={(value) => setFormData({ ...formData, salonId: value })}
                  options={[
                    { value: '', label: 'Sin asignar' },
                    ...salones.map(s => ({ value: s._id, label: s.nombre }))
                  ]}
                  placeholder="Seleccionar salón"
                  searchPlaceholder="Buscar salón..."
                  emptyMessage="Sin salones"
                />
              </div>
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Información Adicional
              </CardTitle>
              <CardDescription>Notas y peticiones especiales</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ocasionEspecial">Ocasión Especial</Label>
                <Input
                  id="ocasionEspecial"
                  value={formData.ocasionEspecial || ''}
                  onChange={(e) => setFormData({ ...formData, ocasionEspecial: e.target.value })}
                  placeholder="Ej: Cumpleaños, aniversario..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas || ''}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Peticiones especiales, alergias, preferencias..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/reservas">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Crear Reserva
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    
  )
}
