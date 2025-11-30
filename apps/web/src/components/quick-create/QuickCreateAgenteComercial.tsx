'use client'

import * as React from 'react'
import { useState } from 'react'
import { QuickCreateModal } from '@/components/ui/quick-create-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { agentesService } from '@/services/agentes-comerciales.service'
import { toast } from 'sonner'

interface QuickCreateAgenteComercialProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (agente: { _id: string; codigo: string; nombre: string; apellidos?: string }) => void
}

export function QuickCreateAgenteComercial({ open, onOpenChange, onCreated }: QuickCreateAgenteComercialProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
  })

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setLoading(true)
    try {
      const response = await agentesService.create({
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim() || undefined,
        contacto: formData.email.trim() || formData.telefono.trim() ? {
          email: formData.email.trim() || undefined,
          telefono: formData.telefono.trim() || undefined,
        } : undefined,
        activo: true,
      })

      if (response.success && response.data) {
        toast.success('Agente comercial creado correctamente')
        onCreated({
          _id: response.data._id,
          codigo: response.data.codigo,
          nombre: response.data.nombre,
          apellidos: response.data.apellidos,
        })
        onOpenChange(false)
        // Resetear formulario
        setFormData({
          nombre: '',
          apellidos: '',
          email: '',
          telefono: '',
        })
      }
    } catch (error: any) {
      console.error('Error al crear agente comercial:', error)
      toast.error(error.response?.data?.message || 'Error al crear agente comercial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <QuickCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear Agente Comercial"
      description="Crea un nuevo agente comercial rápidamente"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="qc-agente-nombre">Nombre *</Label>
            <Input
              id="qc-agente-nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Juan"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="qc-agente-apellidos">Apellidos</Label>
            <Input
              id="qc-agente-apellidos"
              value={formData.apellidos}
              onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
              placeholder="Ej: García López"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="qc-agente-email">Email</Label>
          <Input
            id="qc-agente-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="agente@empresa.com"
          />
        </div>
        <div>
          <Label htmlFor="qc-agente-telefono">Teléfono</Label>
          <Input
            id="qc-agente-telefono"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            placeholder="612345678"
          />
        </div>
      </div>
    </QuickCreateModal>
  )
}
