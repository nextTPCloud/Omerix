'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { gruposModificadoresService } from '@/services/modificadores.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Grid3X3 } from 'lucide-react'
import { toast } from 'sonner'
import { CodeInput } from '@/components/ui/code-input'

export default function NuevoGrupoModificadoresPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'multiple' as 'exclusivo' | 'multiple',
    minSelecciones: 0,
    maxSelecciones: undefined as number | undefined,
    orden: 0,
    activo: true,
  })

  const searchCodigos = async (prefix: string): Promise<string[]> => {
    try {
      const response = await gruposModificadoresService.searchCodigos(prefix)
      return response.data || []
    } catch {
      return []
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.codigo.trim()) {
      toast.error('El código es obligatorio')
      return
    }

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsLoading(true)
    try {
      const response = await gruposModificadoresService.create(formData)
      if (response.success) {
        toast.success('Grupo creado correctamente')
        router.push('/grupos-modificadores')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear el grupo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/grupos-modificadores"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Grid3X3 className="h-7 w-7 text-primary" />
              Nuevo Grupo de Modificadores
            </h1>
            <p className="text-sm text-muted-foreground">Crea un nuevo grupo para organizar modificadores</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <CodeInput
                    id="codigo"
                    value={formData.codigo}
                    onChange={(value) => setFormData({ ...formData, codigo: value })}
                    onSearchCodes={searchCodigos}
                    placeholder="Ej: GM001"
                    helperText="Pulsa ↓ para sugerir código"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Términos de cocción"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Selección</Label>
                <Select value={formData.tipo} onValueChange={(v: 'exclusivo' | 'multiple') => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclusivo">Exclusivo (solo uno)</SelectItem>
                    <SelectItem value="multiple">Múltiple (varios)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del grupo de modificadores"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Configuración de Selección</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minSelecciones">Mínimo de selecciones</Label>
                  <Input
                    id="minSelecciones"
                    type="number"
                    value={formData.minSelecciones}
                    onChange={(e) => setFormData({ ...formData, minSelecciones: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">0 = opcional</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSelecciones">Máximo de selecciones</Label>
                  <Input
                    id="maxSelecciones"
                    type="number"
                    value={formData.maxSelecciones || ''}
                    onChange={(e) => setFormData({ ...formData, maxSelecciones: e.target.value ? parseInt(e.target.value) : undefined })}
                    min={0}
                    placeholder="Sin límite"
                    disabled={formData.tipo === 'exclusivo'}
                  />
                  <p className="text-xs text-muted-foreground">{formData.tipo === 'exclusivo' ? 'Exclusivo: solo 1' : 'Vacío = sin límite'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orden">Orden de visualización</Label>
                <Input
                  id="orden"
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Activo</Label>
                  <p className="text-sm text-muted-foreground">El grupo está disponible para usar</p>
                </div>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" asChild><Link href="/grupos-modificadores">Cancelar</Link></Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Grupo'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
