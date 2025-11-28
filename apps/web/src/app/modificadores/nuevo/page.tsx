'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { ArrowLeft, Save, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { CodeInput } from '@/components/ui/code-input'

export default function NuevoModificadorPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'gratis' as 'gratis' | 'cargo' | 'descuento',
    aplicaA: 'todos' as 'todos' | 'familias' | 'productos',
    precioExtra: 0,
    orden: 0,
    activo: true,
  })

  const searchCodigos = async (prefix: string): Promise<string[]> => {
    try {
      const response = await modificadoresService.searchCodigos(prefix)
      return response.data || []
    } catch {
      return []
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.codigo.trim()) { toast.error('El código es obligatorio'); return }
    if (!formData.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setIsLoading(true)
    try {
      const response = await modificadoresService.create(formData)
      if (response.success) { toast.success('Modificador creado correctamente'); router.push('/modificadores') }
    } catch (error: any) { toast.error(error.response?.data?.error || 'Error al crear') } finally { setIsLoading(false) }
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/modificadores"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><SlidersHorizontal className="h-7 w-7 text-primary" />Nuevo Modificador</h1>
            <p className="text-sm text-muted-foreground">Crea un nuevo modificador de producto</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <CodeInput
                    value={formData.codigo}
                    onChange={(value) => setFormData({ ...formData, codigo: value })}
                    onSearchCodes={searchCodigos}
                    placeholder="Ej: MOD001"
                    helperText="Pulsa ↓ para sugerir código"
                  />
                </div>
                <div className="space-y-2"><Label>Nombre *</Label><Input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Poco hecho" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo</Label><Select value={formData.tipo} onValueChange={(v: any) => setFormData({ ...formData, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gratis">Gratis</SelectItem><SelectItem value="cargo">Cargo extra</SelectItem><SelectItem value="descuento">Descuento</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Precio extra (€)</Label><Input type="number" step="0.01" value={formData.precioExtra} onChange={e => setFormData({ ...formData, precioExtra: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="space-y-2"><Label>Descripción</Label><Textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} rows={2} /></div>
              <div className="space-y-2"><Label>Aplica a</Label><Select value={formData.aplicaA} onValueChange={(v: any) => setFormData({ ...formData, aplicaA: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos los productos</SelectItem><SelectItem value="familias">Por familias</SelectItem><SelectItem value="productos">Productos específicos</SelectItem></SelectContent></Select></div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Configuración</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Orden</Label><Input type="number" value={formData.orden} onChange={e => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })} min={0} /></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg"><div><Label className="font-medium">Activo</Label></div><Switch checked={formData.activo} onCheckedChange={c => setFormData({ ...formData, activo: c })} /></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" asChild><Link href="/modificadores">Cancelar</Link></Button>
            <Button type="submit" disabled={isLoading}><Save className="h-4 w-4 mr-2" />{isLoading ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
