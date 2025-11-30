'use client'

import * as React from 'react'
import { useState } from 'react'
import { QuickCreateModal } from '@/components/ui/quick-create-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { clientesService } from '@/services/clientes.service'
import { toast } from 'sonner'

interface QuickCreateClienteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (cliente: { _id: string; codigo: string; nombre: string; nif: string }) => void
}

export function QuickCreateCliente({ open, onOpenChange, onCreated }: QuickCreateClienteProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tipoCliente: 'empresa' as 'particular' | 'empresa',
    nombre: '',
    nif: '',
    email: '',
    telefono: '',
  })

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!formData.nif.trim()) {
      toast.error('El NIF/CIF es obligatorio')
      return
    }

    setLoading(true)
    try {
      const response = await clientesService.create({
        tipoCliente: formData.tipoCliente,
        nombre: formData.nombre.trim(),
        nif: formData.nif.trim(),
        email: formData.email.trim() || undefined,
        telefono: formData.telefono.trim() || undefined,
        activo: true,
      })

      if (response.success && response.data) {
        toast.success('Cliente creado correctamente')
        onCreated({
          _id: response.data._id,
          codigo: response.data.codigo,
          nombre: response.data.nombre,
          nif: response.data.nif,
        })
        onOpenChange(false)
        // Resetear formulario
        setFormData({
          tipoCliente: 'empresa',
          nombre: '',
          nif: '',
          email: '',
          telefono: '',
        })
      }
    } catch (error: any) {
      console.error('Error al crear cliente:', error)
      toast.error(error.response?.data?.message || 'Error al crear cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <QuickCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear Cliente"
      description="Crea un nuevo cliente rápidamente"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="qc-cliente-tipo">Tipo de Cliente *</Label>
          <Select
            value={formData.tipoCliente}
            onValueChange={(value) => setFormData({ ...formData, tipoCliente: value as 'particular' | 'empresa' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="particular">Particular</SelectItem>
              <SelectItem value="empresa">Empresa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="qc-cliente-nombre">Nombre / Razón Social *</Label>
          <Input
            id="qc-cliente-nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Empresa S.L."
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="qc-cliente-nif">NIF/CIF *</Label>
          <Input
            id="qc-cliente-nif"
            value={formData.nif}
            onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
            placeholder="Ej: B12345678"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="qc-cliente-email">Email</Label>
            <Input
              id="qc-cliente-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@empresa.com"
            />
          </div>
          <div>
            <Label htmlFor="qc-cliente-telefono">Teléfono</Label>
            <Input
              id="qc-cliente-telefono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="612345678"
            />
          </div>
        </div>
      </div>
    </QuickCreateModal>
  )
}
