'use client'

import * as React from 'react'
import { useState } from 'react'
import { QuickCreateModal } from '@/components/ui/quick-create-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { personalService } from '@/services/personal.service'
import { TIPOS_CONTRATO, TIPOS_JORNADA, TipoContrato, TipoJornada } from '@/types/personal.types'
import { toast } from 'sonner'

interface QuickCreatePersonalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (personal: { _id: string; codigo: string; nombre: string; apellidos: string }) => void
}

export function QuickCreatePersonal({ open, onOpenChange, onCreated }: QuickCreatePersonalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    puesto: '',
    tipoContrato: 'indefinido' as TipoContrato,
    tipoJornada: 'completa' as TipoJornada,
    fechaInicioContrato: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!formData.apellidos.trim()) {
      toast.error('Los apellidos son obligatorios')
      return
    }
    if (!formData.puesto.trim()) {
      toast.error('El puesto es obligatorio')
      return
    }

    setLoading(true)
    try {
      const response = await personalService.create({
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        datosLaborales: {
          puesto: formData.puesto.trim(),
          tipoContrato: formData.tipoContrato,
          tipoJornada: formData.tipoJornada,
          fechaInicioContrato: formData.fechaInicioContrato,
        },
        activo: true,
      })

      if (response.success && response.data) {
        toast.success('Personal creado correctamente')
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
          puesto: '',
          tipoContrato: 'indefinido',
          tipoJornada: 'completa',
          fechaInicioContrato: new Date().toISOString().split('T')[0],
        })
      }
    } catch (error: any) {
      console.error('Error al crear personal:', error)
      toast.error(error.response?.data?.message || 'Error al crear personal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <QuickCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear Personal"
      description="Añade un nuevo empleado rápidamente"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="qc-personal-nombre">Nombre *</Label>
            <Input
              id="qc-personal-nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Juan"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="qc-personal-apellidos">Apellidos *</Label>
            <Input
              id="qc-personal-apellidos"
              value={formData.apellidos}
              onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
              placeholder="Ej: García López"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="qc-personal-puesto">Puesto *</Label>
          <Input
            id="qc-personal-puesto"
            value={formData.puesto}
            onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
            placeholder="Ej: Técnico, Administrativo, Comercial..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="qc-personal-tipoContrato">Tipo de Contrato</Label>
            <Select
              value={formData.tipoContrato}
              onValueChange={(value) => setFormData({ ...formData, tipoContrato: value as TipoContrato })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_CONTRATO.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="qc-personal-tipoJornada">Tipo de Jornada</Label>
            <Select
              value={formData.tipoJornada}
              onValueChange={(value) => setFormData({ ...formData, tipoJornada: value as TipoJornada })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_JORNADA.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </QuickCreateModal>
  )
}
