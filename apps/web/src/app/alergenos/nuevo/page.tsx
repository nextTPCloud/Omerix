'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { alergenosService, ALERGENOS_UE } from '@/services/alergenos.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { CodeInput } from '@/components/ui/code-input'

export default function NuevoAlergenoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    icono: '',
    color: '#F59E0B',
    esObligatorioUE: false,
    orden: 0,
    activo: true,
  })

  const searchCodigos = async (prefix: string): Promise<string[]> => {
    try {
      const response = await alergenosService.searchCodigos(prefix)
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
      const response = await alergenosService.create(formData)
      if (response.success) {
        toast.success('Alérgeno creado correctamente')
        router.push('/alergenos')
      }
    } catch (error: any) {
      console.error('Error al crear alérgeno:', error)
      toast.error(error.response?.data?.error || 'Error al crear el alérgeno')
    } finally {
      setIsLoading(false)
    }
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
              Nuevo Alérgeno
            </h1>
            <p className="text-sm text-muted-foreground">
              Crea un nuevo alérgeno para tus productos
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
                  <Label htmlFor="codigo">Código *</Label>
                  <CodeInput
                    id="codigo"
                    value={formData.codigo}
                    onChange={(value) => setFormData({ ...formData, codigo: value })}
                    onSearchCodes={searchCodigos}
                    placeholder="Ej: ALG001"
                    helperText="Pulsa ↓ para sugerir código"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Gluten"
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
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Alérgeno'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
