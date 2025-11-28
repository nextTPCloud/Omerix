'use client'

import * as React from 'react'
import { useState } from 'react'
import { QuickCreateModal } from '@/components/ui/quick-create-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { tiposImpuestoService } from '@/services/tipos-impuesto.service'
import { toast } from 'sonner'

interface QuickCreateTipoImpuestoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (tipoImpuesto: { _id: string; nombre: string; porcentaje: number }) => void
}

export function QuickCreateTipoImpuesto({ open, onOpenChange, onCreated }: QuickCreateTipoImpuestoProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    porcentaje: '',
  })

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    const porcentaje = parseFloat(formData.porcentaje)
    if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      toast.error('El porcentaje debe ser un número entre 0 y 100')
      return
    }

    setLoading(true)
    try {
      const response = await tiposImpuestoService.create({
        nombre: formData.nombre.trim(),
        porcentaje,
        activo: true,
      })

      if (response.success && response.data) {
        toast.success('Tipo de impuesto creado correctamente')
        onCreated({
          _id: response.data._id,
          nombre: response.data.nombre,
          porcentaje: response.data.porcentaje,
        })
        onOpenChange(false)
        setFormData({ nombre: '', porcentaje: '' })
      }
    } catch (error: any) {
      console.error('Error al crear tipo de impuesto:', error)
      toast.error(error.response?.data?.message || 'Error al crear tipo de impuesto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <QuickCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear Tipo de Impuesto"
      description="Crea un nuevo tipo de impuesto rápidamente"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="qc-impuesto-nombre">Nombre *</Label>
          <Input
            id="qc-impuesto-nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: IVA 21%"
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="qc-impuesto-porcentaje">Porcentaje *</Label>
          <Input
            id="qc-impuesto-porcentaje"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.porcentaje}
            onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
            placeholder="Ej: 21"
          />
        </div>
      </div>
    </QuickCreateModal>
  )
}
