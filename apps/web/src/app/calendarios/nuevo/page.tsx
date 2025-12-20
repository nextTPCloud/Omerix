'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { calendariosService } from '@/services/calendarios.service'
import { CreateCalendarioDTO, REGIONES_ESPANA, Festivo, TIPOS_FESTIVO } from '@/types/calendario.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Save, CalendarDays, Plus, Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function NuevoCalendarioPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [festivos, setFestivos] = useState<Festivo[]>([])
  const [festivoDialog, setFestivoDialog] = useState<{ open: boolean; festivo: Partial<Festivo>; editIndex: number | null }>({
    open: false,
    festivo: { fecha: '', nombre: '', tipo: 'nacional', sustituible: false },
    editIndex: null,
  })
  const [formData, setFormData] = useState<CreateCalendarioDTO & { activo: boolean }>({
    anio: new Date().getFullYear(),
    nombre: '',
    region: '',
    provincia: '',
    localidad: '',
    esDefecto: false,
    festivos: [],
    activo: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await calendariosService.create({ ...formData, festivos })
      if (response.success) {
        toast.success('Calendario creado correctamente')
        router.push('/calendarios')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddFestivo = () => {
    if (!festivoDialog.festivo.fecha || !festivoDialog.festivo.nombre) {
      toast.error('Fecha y nombre son obligatorios')
      return
    }
    if (festivoDialog.editIndex !== null) {
      const newFestivos = [...festivos]
      newFestivos[festivoDialog.editIndex] = festivoDialog.festivo as Festivo
      setFestivos(newFestivos)
    } else {
      setFestivos([...festivos, festivoDialog.festivo as Festivo])
    }
    setFestivoDialog({ open: false, festivo: { fecha: '', nombre: '', tipo: 'nacional', sustituible: false }, editIndex: null })
  }

  const handleDeleteFestivo = (index: number) => {
    setFestivos(festivos.filter((_, i) => i !== index))
  }

  const handleCargarNacionales = async () => {
    // Festivos nacionales de España
    const festivosNacionales: Festivo[] = [
      { fecha: `${formData.anio}-01-01`, nombre: 'Año Nuevo', tipo: 'nacional', sustituible: false },
      { fecha: `${formData.anio}-01-06`, nombre: 'Epifanía del Señor', tipo: 'nacional', sustituible: false },
      { fecha: `${formData.anio}-05-01`, nombre: 'Fiesta del Trabajo', tipo: 'nacional', sustituible: false },
      { fecha: `${formData.anio}-08-15`, nombre: 'Asunción de la Virgen', tipo: 'nacional', sustituible: false },
      { fecha: `${formData.anio}-10-12`, nombre: 'Fiesta Nacional de España', tipo: 'nacional', sustituible: false },
      { fecha: `${formData.anio}-11-01`, nombre: 'Todos los Santos', tipo: 'nacional', sustituible: false },
      { fecha: `${formData.anio}-12-06`, nombre: 'Día de la Constitución', tipo: 'nacional', sustituible: false },
      { fecha: `${formData.anio}-12-08`, nombre: 'Inmaculada Concepción', tipo: 'nacional', sustituible: false },
      { fecha: `${formData.anio}-12-25`, nombre: 'Navidad', tipo: 'nacional', sustituible: false },
    ]
    setFestivos([...festivos, ...festivosNacionales.filter(fn => !festivos.some(f => f.fecha === fn.fecha))])
    toast.success('Festivos nacionales cargados')
  }

  const festivosOrdenados = [...festivos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/calendarios"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarDays className="h-7 w-7 text-primary" />
              Nuevo Calendario Laboral
            </h1>
            <p className="text-sm text-muted-foreground">Configura el calendario con los festivos del año</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Informacion General */}
          <Card>
            <CardHeader><CardTitle>Informacion General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="anio">Año *</Label>
                  <Input
                    id="anio"
                    type="number"
                    min={2020}
                    max={2050}
                    value={formData.anio}
                    onChange={(e) => setFormData({ ...formData, anio: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Calendario Nacional 2025"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Comunidad Autonoma</Label>
                  <Select
                    value={formData.region || ''}
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin especificar</SelectItem>
                      {REGIONES_ESPANA.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input
                    id="provincia"
                    placeholder="Ej: Madrid"
                    value={formData.provincia || ''}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localidad">Localidad</Label>
                  <Input
                    id="localidad"
                    placeholder="Ej: Alcobendas"
                    value={formData.localidad || ''}
                    onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Festivos */}
          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Festivos ({festivos.length})</CardTitle>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCargarNacionales}>
                  <Download className="h-4 w-4 mr-2" />Cargar Nacionales
                </Button>
                <Button type="button" size="sm" onClick={() => setFestivoDialog({ open: true, festivo: { fecha: `${formData.anio}-01-01`, nombre: '', tipo: 'nacional', sustituible: false }, editIndex: null })}>
                  <Plus className="h-4 w-4 mr-2" />Añadir Festivo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {festivos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No hay festivos añadidos</p>
                  <p className="text-sm">Añade festivos manualmente o carga los nacionales</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {festivosOrdenados.map((festivo, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-lg font-bold">{new Date(festivo.fecha + 'T00:00:00').getDate()}</div>
                          <div className="text-xs text-muted-foreground">{new Date(festivo.fecha + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' })}</div>
                        </div>
                        <div>
                          <p className="font-medium">{festivo.nombre}</p>
                          <Badge variant="outline" className="text-xs">{TIPOS_FESTIVO.find(t => t.value === festivo.tipo)?.label || festivo.tipo}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setFestivoDialog({ open: true, festivo, editIndex: festivos.indexOf(festivo) })}>Editar</Button>
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteFestivo(festivos.indexOf(festivo))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estado */}
          <Card className="mt-4">
            <CardHeader><CardTitle>Configuracion</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Calendario por defecto</Label>
                  <p className="text-sm text-muted-foreground">Este calendario se usara por defecto para el año {formData.anio}</p>
                </div>
                <Switch
                  checked={formData.esDefecto}
                  onCheckedChange={(checked) => setFormData({ ...formData, esDefecto: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Activo</Label>
                  <p className="text-sm text-muted-foreground">El calendario esta disponible para usar</p>
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
              <Link href="/calendarios">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Crear Calendario'}
            </Button>
          </div>
        </form>

        {/* Dialog Festivo */}
        <Dialog open={festivoDialog.open} onOpenChange={(o) => setFestivoDialog({ ...festivoDialog, open: o })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{festivoDialog.editIndex !== null ? 'Editar' : 'Añadir'} Festivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={festivoDialog.festivo.fecha || ''}
                  onChange={(e) => setFestivoDialog({ ...festivoDialog, festivo: { ...festivoDialog.festivo, fecha: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Ej: San Jose"
                  value={festivoDialog.festivo.nombre || ''}
                  onChange={(e) => setFestivoDialog({ ...festivoDialog, festivo: { ...festivoDialog.festivo, nombre: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={festivoDialog.festivo.tipo || 'nacional'}
                  onValueChange={(value) => setFestivoDialog({ ...festivoDialog, festivo: { ...festivoDialog.festivo, tipo: value as any } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_FESTIVO.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label>Sustituible por otro dia</Label>
                <Switch
                  checked={festivoDialog.festivo.sustituible || false}
                  onCheckedChange={(checked) => setFestivoDialog({ ...festivoDialog, festivo: { ...festivoDialog.festivo, sustituible: checked } })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFestivoDialog({ open: false, festivo: { fecha: '', nombre: '', tipo: 'nacional', sustituible: false }, editIndex: null })}>Cancelar</Button>
              <Button onClick={handleAddFestivo}>{festivoDialog.editIndex !== null ? 'Guardar' : 'Añadir'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
