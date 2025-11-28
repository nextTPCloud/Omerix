'use client'

import * as React from 'react'
import { useState } from 'react'
import { QuickCreateModal } from '@/components/ui/quick-create-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { familiasService } from '@/services/familias.service'
import { toast } from 'sonner'

interface QuickCreateFamiliaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (familia: { _id: string; nombre: string; codigo?: string }) => void
}

export function QuickCreateFamilia({ open, onOpenChange, onCreated }: QuickCreateFamiliaProps) {
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
      const response = await familiasService.create({
        nombre: formData.nombre.trim(),
        codigo: formData.codigo.trim() || undefined,
        activo: true,
      })

      if (response.success && response.data) {
        toast.success('Familia creada correctamente')
        onCreated({
          _id: response.data._id,
          nombre: response.data.nombre,
          codigo: response.data.codigo,
        })
        onOpenChange(false)
        // Resetear formulario
        setFormData({ nombre: '', codigo: '' })
      }
    } catch (error: any) {
      console.error('Error al crear familia:', error)
      toast.error(error.response?.data?.message || 'Error al crear familia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <QuickCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear Familia"
      description="Crea una nueva familia rápidamente"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="qc-familia-nombre">Nombre *</Label>
          <Input
            id="qc-familia-nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Bebidas"
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="qc-familia-codigo">Código</Label>
          <Input
            id="qc-familia-codigo"
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            placeholder="Ej: BEB"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Opcional. Si no lo indicas, se generará automáticamente.
          </p>
        </div>
      </div>
    </QuickCreateModal>
  )
}
