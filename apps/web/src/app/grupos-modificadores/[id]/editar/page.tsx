'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { gruposModificadoresService, modificadoresService, ModificadorProducto } from '@/services/modificadores.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Save, Grid3X3, RefreshCw, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarGrupoModificadoresPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [modificadoresDisponibles, setModificadoresDisponibles] = useState<ModificadorProducto[]>([])
  const [modificadoresGrupo, setModificadoresGrupo] = useState<ModificadorProducto[]>([])
  const [selectedModificador, setSelectedModificador] = useState<string>('')
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'multiple' as 'exclusivo' | 'multiple',
    minSelecciones: 0,
    maxSelecciones: undefined as number | undefined,
    orden: 0,
    activo: true,
  })

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const [grupoRes, modRes] = await Promise.all([
          gruposModificadoresService.getById(id),
          modificadoresService.getAll({ limit: 1000 })
        ])

        if (grupoRes.success && grupoRes.data) {
          const grupo = grupoRes.data
          setFormData({
            nombre: grupo.nombre || '',
            descripcion: grupo.descripcion || '',
            tipo: grupo.tipo || 'multiple',
            minSelecciones: grupo.minSelecciones || 0,
            maxSelecciones: grupo.maxSelecciones,
            orden: grupo.orden || 0,
            activo: grupo.activo !== undefined ? grupo.activo : true,
          })
          setModificadoresGrupo(grupo.modificadores || [])
        }

        if (modRes.success) {
          setModificadoresDisponibles(modRes.data)
        }
      } catch (error) {
        toast.error('Error al cargar el grupo')
        router.push('/grupos-modificadores')
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
      const response = await gruposModificadoresService.update(id, formData)
      if (response.success) {
        toast.success('Grupo actualizado correctamente')
        router.push('/grupos-modificadores')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddModificador = async () => {
    if (!selectedModificador) return
    try {
      const response = await gruposModificadoresService.addModificador(id, selectedModificador)
      if (response.success) {
        toast.success('Modificador añadido')
        setModificadoresGrupo(response.data.modificadores || [])
        setSelectedModificador('')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al añadir modificador')
    }
  }

  const handleRemoveModificador = async (modificadorId: string) => {
    try {
      const response = await gruposModificadoresService.removeModificador(id, modificadorId)
      if (response.success) {
        toast.success('Modificador eliminado del grupo')
        setModificadoresGrupo(response.data.modificadores || [])
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar modificador')
    }
  }

  const modificadoresNoAsignados = modificadoresDisponibles.filter(
    m => !modificadoresGrupo.some(mg => mg._id === m._id)
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando grupo...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/grupos-modificadores"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Grid3X3 className="h-7 w-7 text-primary" />
              Editar Grupo de Modificadores
            </h1>
            <p className="text-sm text-muted-foreground">Modifica la configuración del grupo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
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
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Modificadores del Grupo</span>
                <span className="text-sm font-normal text-muted-foreground">{modificadoresGrupo.length} modificadores</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedModificador} onValueChange={setSelectedModificador}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar modificador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modificadoresNoAsignados.map(m => (
                      <SelectItem key={m._id} value={m._id}>{m.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={handleAddModificador} disabled={!selectedModificador}>
                  <Plus className="h-4 w-4 mr-1" />Añadir
                </Button>
              </div>

              {modificadoresGrupo.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Precio Extra</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modificadoresGrupo.map(m => (
                        <TableRow key={m._id}>
                          <TableCell className="font-medium">{m.nombre}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100">
                              {m.tipo}
                            </span>
                          </TableCell>
                          <TableCell>{m.precioExtra > 0 ? `+${m.precioExtra.toFixed(2)} €` : '-'}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveModificador(m._id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">No hay modificadores en este grupo</p>
              )}
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
