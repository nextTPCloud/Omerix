'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { FullCreateModal } from '@/components/ui/full-create-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { FolderTree } from 'lucide-react'
import { familiasService } from '@/services/familias.service'
import { Familia } from '@/types/familia.types'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { toast } from 'sonner'

interface FullCreateFamiliaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (familia: { _id: string; codigo: string; nombre: string }) => void
}

export function FullCreateFamilia({ open, onOpenChange, onCreated }: FullCreateFamiliaProps) {
  const [loading, setLoading] = useState(false)
  const [familiasDisponibles, setFamiliasDisponibles] = useState<Familia[]>([])
  const [loadingFamilias, setLoadingFamilias] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    familiaPadreId: '',
    orden: 0,
    activo: true,
  })

  // Cargar familias para selector de padre
  useEffect(() => {
    const loadFamilias = async () => {
      try {
        setLoadingFamilias(true)
        const response = await familiasService.getAll({ activo: true, limit: 100 })
        if (response.success) {
          setFamiliasDisponibles(response.data || [])
        }
      } catch (error) {
        console.error('Error cargando familias:', error)
      } finally {
        setLoadingFamilias(false)
      }
    }
    if (open) loadFamilias()
  }, [open])

  const familiasOptions = React.useMemo(() => {
    return familiasDisponibles.map((familia) => ({
      value: familia._id,
      label: familia.nombre,
      description: familia.codigo,
    }))
  }, [familiasDisponibles])

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setLoading(true)
    try {
      const response = await familiasService.create({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        familiaPadreId: formData.familiaPadreId || undefined,
        orden: formData.orden,
        activo: formData.activo,
      })

      if (response.success && response.data) {
        toast.success('Familia creada correctamente')
        onCreated({
          _id: response.data._id,
          codigo: response.data.codigo || '',
          nombre: response.data.nombre,
        })
        onOpenChange(false)
        resetForm()
      }
    } catch (error: any) {
      console.error('Error al crear familia:', error)
      toast.error(error.response?.data?.message || 'Error al crear familia')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      familiaPadreId: '',
      orden: 0,
      activo: true,
    })
  }

  return (
    <FullCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear Nueva Familia"
      description="Complete los datos de la familia de productos"
      onSubmit={handleSubmit}
      loading={loading}
      size="default"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center py-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <FolderTree className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Nombre *</Label>
          <Input
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Electrónica, Ropa, Alimentos..."
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label>Descripción</Label>
          <Textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción de la familia..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Familia Padre</Label>
          <SearchableSelect
            options={familiasOptions}
            value={formData.familiaPadreId}
            onValueChange={(value) => setFormData({ ...formData, familiaPadreId: value })}
            placeholder="Seleccionar familia padre (opcional)"
            searchPlaceholder="Buscar familia..."
            emptyMessage="No se encontraron familias"
            loading={loadingFamilias}
          />
          <p className="text-xs text-muted-foreground">
            Deja vacío si es una familia raíz
          </p>
        </div>

        <div className="space-y-2">
          <Label>Orden</Label>
          <Input
            type="number"
            min="0"
            value={formData.orden}
            onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Define el orden de aparición en listados
          </p>
        </div>

        <div className="flex items-center gap-4 p-4 border rounded-lg">
          <Switch
            checked={formData.activo}
            onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
          />
          <div>
            <Label>Familia Activa</Label>
            <p className="text-xs text-muted-foreground">Las familias inactivas no aparecerán en las búsquedas</p>
          </div>
        </div>
      </div>
    </FullCreateModal>
  )
}
