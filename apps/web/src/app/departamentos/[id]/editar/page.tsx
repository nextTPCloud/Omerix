'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { departamentosService } from '@/services/departamentos.service'
import { Departamento, UpdateDepartamentoDTO, COLORES_DEPARTAMENTO } from '@/types/departamento.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Building2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarDepartamentoPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateDepartamentoDTO & { codigo: string }>({
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
    const cargarDepartamento = async () => {
      try {
        setIsLoading(true)
        const response = await departamentosService.getById(params.id as string)
        if (response.success && response.data) {
          const dept = response.data
          setFormData({
            codigo: dept.codigo,
            nombre: dept.nombre,
            descripcion: dept.descripcion || '',
            responsableId: dept.responsableId || '',
            responsableNombre: dept.responsableNombre || '',
            color: dept.color || '#3B82F6',
            orden: dept.orden,
            activo: dept.activo,
          })
        } else {
          toast.error('Departamento no encontrado')
          router.push('/departamentos')
        }
      } catch (error) {
        toast.error('Error al cargar el departamento')
        router.push('/departamentos')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      cargarDepartamento()
    }
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre?.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await departamentosService.update(params.id as string, formData)
      if (response.success) {
        toast.success('Departamento actualizado correctamente')
        router.push(`/departamentos/${params.id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/departamentos/${params.id}`}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              Editar Departamento
            </h1>
            <p className="text-sm text-muted-foreground">Modifica los datos del departamento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Informacion General */}
          <Card>
            <CardHeader><CardTitle>Informacion General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Codigo</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">El codigo no se puede modificar</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Administracion, Produccion"
                    value={formData.nombre || ''}
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
              <Link href={`/departamentos/${params.id}`}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
