'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { modificadoresService } from '@/services/modificadores.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, SlidersHorizontal, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarModificadorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'gratis' as 'gratis' | 'cargo' | 'descuento',
    aplicaA: 'todos' as 'todos' | 'familias' | 'productos',
    precioExtra: 0,
    orden: 0,
    activo: true,
  })

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await modificadoresService.getById(id)
        if (response.success && response.data) {
          const m = response.data
          setFormData({
            nombre: m.nombre || '',
            descripcion: m.descripcion || '',
            tipo: m.tipo || 'gratis',
            aplicaA: m.aplicaA || 'todos',
            precioExtra: m.precioExtra || 0,
            orden: m.orden || 0,
            activo: m.activo !== undefined ? m.activo : true,
          })
        }
      } catch { toast.error('Error al cargar'); router.push('/modificadores') } finally { setIsLoading(false) }
    }
    if (id) cargar()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setIsSaving(true)
    try {
      const response = await modificadoresService.update(id, formData)
      if (response.success) { toast.success('Actualizado correctamente'); router.push('/modificadores') }
    } catch (error: any) { toast.error(error.response?.data?.error || 'Error al actualizar') } finally { setIsSaving(false) }
  }

  if (isLoading) return <DashboardLayout><div className="flex items-center justify-center h-[calc(100vh-4rem)]"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/modificadores"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><SlidersHorizontal className="h-7 w-7 text-primary" />Editar Modificador</h1>
            <p className="text-sm text-muted-foreground">Modifica la configuración</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nombre *</Label><Input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} /></div>
                <div className="space-y-2"><Label>Tipo</Label><Select value={formData.tipo} onValueChange={(v: any) => setFormData({ ...formData, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="preparacion">Preparación</SelectItem><SelectItem value="ingrediente">Ingrediente</SelectItem><SelectItem value="porcion">Porción</SelectItem><SelectItem value="otro">Otro</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Descripción</Label><Textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Aplica a</Label><Select value={formData.aplicaA} onValueChange={(v: any) => setFormData({ ...formData, aplicaA: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="categorias">Categorías</SelectItem><SelectItem value="productos">Productos</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Precio extra (€)</Label><Input type="number" step="0.01" value={formData.precioExtra} onChange={e => setFormData({ ...formData, precioExtra: parseFloat(e.target.value) || 0 })} /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Configuración</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Orden</Label><Input type="number" value={formData.orden} onChange={e => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })} min={0} /></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg"><div><Label className="font-medium">Activo</Label></div><Switch checked={formData.activo} onCheckedChange={c => setFormData({ ...formData, activo: c })} /></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" asChild><Link href="/modificadores">Cancelar</Link></Button>
            <Button type="submit" disabled={isSaving}><Save className="h-4 w-4 mr-2" />{isSaving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
