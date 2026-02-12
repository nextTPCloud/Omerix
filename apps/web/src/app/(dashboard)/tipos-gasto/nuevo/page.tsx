'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { tiposGastoService } from '@/services/tipos-gasto.service'
import { CreateTipoGastoDTO, CategoriaTipoGasto, CATEGORIAS_TIPO_GASTO } from '@/types/tipo-gasto.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CodeInput } from '@/components/ui/code-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Receipt } from 'lucide-react'
import { toast } from 'sonner'

export default function NuevoTipoGastoPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<CreateTipoGastoDTO>({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: 'otros',
    cuenta: '',
    ivaPorDefecto: 21,
    facturable: true,
    margenPorDefecto: 0,
    orden: 0,
    activo: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.codigo.trim()) {
      toast.error('El codigo es obligatorio')
      return
    }

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await tiposGastoService.create(formData)
      if (response.success) {
        toast.success('Tipo de gasto creado correctamente')
        router.push('/tipos-gasto')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tipos-gasto"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Receipt className="h-7 w-7 text-primary" />
              Nuevo Tipo de Gasto
            </h1>
            <p className="text-sm text-muted-foreground">Configura los datos del tipo de gasto</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Informacion General */}
          <Card>
            <CardHeader><CardTitle>Informacion General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Codigo *</Label>
                  <CodeInput
                    id="codigo"
                    placeholder="Ej: MAT, TRA, DIE"
                    value={formData.codigo}
                    onChange={(value) => setFormData({ ...formData, codigo: value.toUpperCase() })}
                    onSearchCodes={tiposGastoService.searchCodigos}
                    helperText="Pulsa ↓ para sugerir siguiente codigo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Material, Transporte, Dietas"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value as CategoriaTipoGasto })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_TIPO_GASTO.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuenta">Cuenta Contable</Label>
                  <Input
                    id="cuenta"
                    placeholder="Ej: 62900001"
                    value={formData.cuenta || ''}
                    onChange={(e) => setFormData({ ...formData, cuenta: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Descripcion opcional del tipo de gasto"
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuracion */}
          <Card className="mt-4">
            <CardHeader><CardTitle>Configuracion</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ivaPorDefecto">IVA por defecto (%)</Label>
                  <Input
                    id="ivaPorDefecto"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={formData.ivaPorDefecto}
                    onChange={(e) => setFormData({ ...formData, ivaPorDefecto: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margenPorDefecto">Margen por defecto (%)</Label>
                  <Input
                    id="margenPorDefecto"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={formData.margenPorDefecto || 0}
                    onChange={(e) => setFormData({ ...formData, margenPorDefecto: Number(e.target.value) })}
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

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Facturable</Label>
                  <p className="text-sm text-muted-foreground">Este tipo de gasto puede ser facturado al cliente</p>
                </div>
                <Switch
                  checked={formData.facturable}
                  onCheckedChange={(checked) => setFormData({ ...formData, facturable: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Activo</Label>
                  <p className="text-sm text-muted-foreground">El tipo de gasto esta disponible para usar</p>
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
              <Link href="/tipos-gasto">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Crear Tipo de Gasto'}
            </Button>
          </div>
        </form>
      </div>
    
  )
}
