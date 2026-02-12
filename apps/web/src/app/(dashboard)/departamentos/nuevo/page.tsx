'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { departamentosService } from '@/services/departamentos.service'
import { CreateDepartamentoDTO, COLORES_DEPARTAMENTO } from '@/types/departamento.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CodeInput } from '@/components/ui/code-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NuevoDepartamentoPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<CreateDepartamentoDTO & { activo: boolean }>({
    codigo: '',
    nombre: '',
    descripcion: '',
    responsableId: '',
    responsableNombre: '',
    color: '#3B82F6',
    orden: 0,
    activo: true,
  })

  useEffect(() => {
    const cargarCodigo = async () => {
      try {
        const response = await departamentosService.sugerirCodigo()
        if (response.success && response.data?.codigo) {
          setFormData(prev => ({ ...prev, codigo: response.data.codigo }))
        }
      } catch (error) {
        console.error('Error al sugerir codigo:', error)
      }
    }
    cargarCodigo()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.codigo?.trim()) {
      toast.error('El codigo es obligatorio')
      return
    }

    if (!formData.nombre?.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await departamentosService.create(formData)
      if (response.success) {
        toast.success('Departamento creado correctamente')
        router.push('/departamentos')
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
            <Link href="/departamentos"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              Nuevo Departamento
            </h1>
            <p className="text-sm text-muted-foreground">Configura los datos del departamento</p>
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
                    placeholder="Ej: ADMIN, PROD, RRHH"
                    value={formData.codigo}
                    onChange={(value) => setFormData({ ...formData, codigo: value.toUpperCase() })}
                    onSearchCodes={departamentosService.searchCodigos}
                    helperText="Pulsa ↓ para sugerir siguiente codigo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Administracion, Produccion"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Descripcion del departamento y sus funciones"
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsableNombre">Responsable</Label>
                  <Input
                    id="responsableNombre"
                    placeholder="Nombre del responsable"
                    value={formData.responsableNombre || ''}
                    onChange={(e) => setFormData({ ...formData, responsableNombre: e.target.value })}
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
            </CardContent>
          </Card>

          {/* Apariencia */}
          <Card className="mt-4">
            <CardHeader><CardTitle>Apariencia</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Color del departamento</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORES_DEPARTAMENTO.map((color) => (
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
                <p className="text-xs text-muted-foreground">Color seleccionado: {COLORES_DEPARTAMENTO.find(c => c.value === formData.color)?.label || formData.color}</p>
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
                  <p className="text-sm text-muted-foreground">El departamento esta disponible para asignar personal</p>
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
              <Link href="/departamentos">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Crear Departamento'}
            </Button>
          </div>
        </form>
      </div>
    
  )
}
