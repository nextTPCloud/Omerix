'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import { zonasPreparacionService } from '@/services/zonas-preparacion.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, ChefHat, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarZonaPreparacionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    color: '#EF4444',
    icono: 'flame',
    orden: 0,
    tiempoPreparacionPromedio: 15,
    notificarRetraso: true,
    tiempoAlertaMinutos: 10,
    activo: true,
    kds: {
      habilitado: false,
      mostrarTiempo: true,
      mostrarPrioridad: true,
      sonidoNuevaComanda: true,
    },
  })

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await zonasPreparacionService.getById(id)
        if (response.success && response.data) {
          const zona = response.data
          setFormData({
            nombre: zona.nombre || '',
            codigo: zona.codigo || '',
            descripcion: zona.descripcion || '',
            color: zona.color || '#EF4444',
            icono: zona.icono || 'flame',
            orden: zona.orden || 0,
            tiempoPreparacionPromedio: zona.tiempoPreparacionPromedio || 15,
            notificarRetraso: zona.notificarRetraso !== undefined ? zona.notificarRetraso : true,
            tiempoAlertaMinutos: zona.tiempoAlertaMinutos || 10,
            activo: zona.activo !== undefined ? zona.activo : true,
            kds: zona.kds || {
              habilitado: false,
              mostrarTiempo: true,
              mostrarPrioridad: true,
              sonidoNuevaComanda: true,
            },
          })
        }
      } catch (error) {
        toast.error('Error al cargar la zona')
        router.push('/zonas-preparacion')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await zonasPreparacionService.update(id, formData)
      if (response.success) {
        toast.success('Zona actualizada correctamente')
        router.push('/zonas-preparacion')
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
            <p className="text-sm text-muted-foreground">Cargando zona...</p>
          </div>
        </div>
      
    )
  }

  return (
    
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/zonas-preparacion"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ChefHat className="h-7 w-7 text-primary" />
              Editar Zona de Preparación
            </h1>
            <p className="text-sm text-muted-foreground">Modifica la configuración</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input id="codigo" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-16 h-10 p-1 cursor-pointer" />
                    <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orden">Orden</Label>
                  <Input id="orden" type="number" value={formData.orden} onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })} min={0} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Tiempos y Alertas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tiempo preparación (min)</Label>
                  <Input type="number" value={formData.tiempoPreparacionPromedio} onChange={(e) => setFormData({ ...formData, tiempoPreparacionPromedio: parseInt(e.target.value) || 0 })} min={0} />
                </div>
                <div className="space-y-2">
                  <Label>Alerta retraso (min)</Label>
                  <Input type="number" value={formData.tiempoAlertaMinutos} onChange={(e) => setFormData({ ...formData, tiempoAlertaMinutos: parseInt(e.target.value) || 0 })} min={0} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Notificar retrasos</Label>
                  <p className="text-sm text-muted-foreground">Alertar cuando se supere el tiempo</p>
                </div>
                <Switch checked={formData.notificarRetraso} onCheckedChange={(checked) => setFormData({ ...formData, notificarRetraso: checked })} />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Kitchen Display System (KDS)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">KDS Habilitado</Label>
                  <p className="text-sm text-muted-foreground">Mostrar comandas en pantalla</p>
                </div>
                <Switch checked={formData.kds.habilitado} onCheckedChange={(checked) => setFormData({ ...formData, kds: { ...formData.kds, habilitado: checked } })} />
              </div>

              {formData.kds.habilitado && (
                <>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div><Label className="font-medium">Mostrar tiempo</Label></div>
                    <Switch checked={formData.kds.mostrarTiempo} onCheckedChange={(checked) => setFormData({ ...formData, kds: { ...formData.kds, mostrarTiempo: checked } })} />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div><Label className="font-medium">Mostrar prioridad</Label></div>
                    <Switch checked={formData.kds.mostrarPrioridad} onCheckedChange={(checked) => setFormData({ ...formData, kds: { ...formData.kds, mostrarPrioridad: checked } })} />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div><Label className="font-medium">Sonido nueva comanda</Label></div>
                    <Switch checked={formData.kds.sonidoNuevaComanda} onCheckedChange={(checked) => setFormData({ ...formData, kds: { ...formData.kds, sonidoNuevaComanda: checked } })} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Activa</Label>
                  <p className="text-sm text-muted-foreground">La zona está disponible</p>
                </div>
                <Switch checked={formData.activo} onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" asChild><Link href="/zonas-preparacion">Cancelar</Link></Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    
  )
}
