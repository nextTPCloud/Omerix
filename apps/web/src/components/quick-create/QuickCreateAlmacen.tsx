'use client'

import * as React from 'react'
import { useState } from 'react'
import { QuickCreateModal } from '@/components/ui/quick-create-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { almacenesService } from '@/services/almacenes.service'
import { toast } from 'sonner'

interface QuickCreateAlmacenProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (almacen: { _id: string; nombre: string; codigo?: string }) => void
}

export function QuickCreateAlmacen({ open, onOpenChange, onCreated }: QuickCreateAlmacenProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
  })

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setLoading(true)
    try {
      const response = await almacenesService.create({
        nombre: formData.nombre.trim(),
        codigo: formData.codigo.trim(),
        activo: true,
      })

      if (response.success && response.data) {
        toast.success('Almacén creado correctamente')
        onCreated({
          _id: response.data._id,
          nombre: response.data.nombre,
          codigo: response.data.codigo || '',
        })
        onOpenChange(false)
        setFormData({ nombre: '', codigo: '' })
      }
    } catch (error: any) {
      console.error('Error al crear almacén:', error)
      toast.error(error.response?.data?.message || 'Error al crear almacén')
    } finally {
      setLoading(false)
    }
  }

  return (
    <QuickCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear Almacén"
      description="Crea un nuevo almacén rápidamente"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="qc-almacen-nombre">Nombre *</Label>
          <Input
            id="qc-almacen-nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Almacén Principal"
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="qc-almacen-codigo">Código</Label>
          <Input
            id="qc-almacen-codigo"
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            placeholder="Ej: ALM01"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Opcional. Si no lo indicas, se generará automáticamente.
          </p>
        </div>
      </div>
    </QuickCreateModal>
  )
}
