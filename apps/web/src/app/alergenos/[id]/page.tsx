'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { alergenosService, Alergeno } from '@/services/alergenos.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, AlertTriangle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarAlergenoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    icono: '',
    color: '#F59E0B',
    esObligatorioUE: false,
    orden: 0,
    activo: true,
  })

  useEffect(() => {
    const cargarAlergeno = async () => {
      try {
        setIsLoading(true)
        const response = await alergenosService.getById(id)
        if (response.success && response.data) {
          const alergeno = response.data
          setFormData({
            nombre: alergeno.nombre || '',
            codigo: alergeno.codigo || '',
            descripcion: alergeno.descripcion || '',
            icono: alergeno.icono || '',
            color: alergeno.color || '#F59E0B',
            esObligatorioUE: alergeno.esObligatorioUE || false,
            orden: alergeno.orden || 0,
            activo: alergeno.activo !== undefined ? alergeno.activo : true,
          })
        }
      } catch (error) {
        console.error('Error al cargar alérgeno:', error)
        toast.error('Error al cargar el alérgeno')
        router.push('/alergenos')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      cargarAlergeno()
    }
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    if (!formData.codigo.trim()) {
      toast.error('El código es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await alergenosService.update(id, formData)
      if (response.success) {
        toast.success('Alérgeno actualizado correctamente')
        router.push('/alergenos')
      }
    } catch (error: any) {
      console.error('Error al actualizar alérgeno:', error)
      toast.error(error.response?.data?.error || 'Error al actualizar el alérgeno')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando alérgeno...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/alergenos">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-7 w-7 text-primary" />
              Editar Alérgeno
            </h1>
            <p className="text-sm text-muted-foreground">
              Modifica los datos del alérgeno
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Información del Alérgeno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Gluten"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ej: GLUTEN"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del alérgeno..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icono">Icono</Label>
                  <Input
                    id="icono"
                    value={formData.icono}
                    onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                    placeholder="Ej: wheat"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#F59E0B"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orden">Orden</Label>
                  <Input
                    id="orden"
                    type="number"
                    value={formData.orden}
                    onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="esObligatorioUE" className="font-medium">Obligatorio UE</Label>
                  <p className="text-sm text-muted-foreground">
                    Marca si es uno de los 14 alérgenos obligatorios de la UE
                  </p>
                </div>
                <Switch
                  id="esObligatorioUE"
                  checked={formData.esObligatorioUE}
                  onCheckedChange={(checked) => setFormData({ ...formData, esObligatorioUE: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="activo" className="font-medium">Activo</Label>
                  <p className="text-sm text-muted-foreground">
                    Los alérgenos inactivos no se mostrarán en los productos
                  </p>
                </div>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" asChild>
              <Link href="/alergenos">Cancelar</Link>
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
