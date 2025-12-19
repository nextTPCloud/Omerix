'use client'

import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { QuickCreateModal } from '@/components/ui/quick-create-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { proyectosService } from '@/services/proyectos.service'
import { clientesService } from '@/services/clientes.service'
import { Cliente } from '@/types/cliente.types'
import { TipoProyecto, PrioridadProyecto, TIPOS_PROYECTO, PRIORIDADES_PROYECTO } from '@/types/proyecto.types'
import { toast } from 'sonner'

interface QuickCreateProyectoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (proyecto: { _id: string; codigo: string; nombre: string }) => void
  clienteIdDefault?: string // Para preseleccionar el cliente
}

export function QuickCreateProyecto({ open, onOpenChange, onCreated, clienteIdDefault }: QuickCreateProyectoProps) {
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    clienteId: clienteIdDefault || '',
    tipo: TipoProyecto.CLIENTE,
    prioridad: PrioridadProyecto.MEDIA,
  })

  // Cargar clientes
  useEffect(() => {
    const fetchClientes = async () => {
      setLoadingClientes(true)
      try {
        const response = await clientesService.getAll({ activo: true, limit: 100 })
        if (response.success) {
          setClientes(response.data || [])
        }
      } catch (error) {
        console.error('Error al cargar clientes:', error)
      } finally {
        setLoadingClientes(false)
      }
    }
    if (open) {
      fetchClientes()
    }
  }, [open])

  // Actualizar clienteId cuando cambia el default
  useEffect(() => {
    if (clienteIdDefault) {
      setFormData(prev => ({ ...prev, clienteId: clienteIdDefault }))
    }
  }, [clienteIdDefault])

  const clientesOptions = useMemo(() => {
    return clientes.map((cliente) => ({
      value: cliente._id,
      label: cliente.nombre,
      description: cliente.codigo,
    }))
  }, [clientes])

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!formData.clienteId) {
      toast.error('El cliente es obligatorio')
      return
    }

    setLoading(true)
    try {
      const response = await proyectosService.create({
        nombre: formData.nombre.trim(),
        clienteId: formData.clienteId,
        tipo: formData.tipo,
        prioridad: formData.prioridad,
        activo: true,
      })

      if (response.success && response.data) {
        toast.success('Proyecto creado correctamente')
        onCreated({
          _id: response.data._id,
          codigo: response.data.codigo,
          nombre: response.data.nombre,
        })
        onOpenChange(false)
        // Resetear formulario
        setFormData({
          nombre: '',
          clienteId: clienteIdDefault || '',
          tipo: TipoProyecto.CLIENTE,
          prioridad: PrioridadProyecto.MEDIA,
        })
      }
    } catch (error: any) {
      console.error('Error al crear proyecto:', error)
      toast.error(error.response?.data?.message || 'Error al crear proyecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <QuickCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear Proyecto"
      description="Crea un nuevo proyecto rápidamente"
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="qc-proyecto-nombre">Nombre del Proyecto *</Label>
          <Input
            id="qc-proyecto-nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Instalación Sistema Solar"
            autoFocus
          />
        </div>
        <div>
          <Label>Cliente *</Label>
          <SearchableSelect
            options={clientesOptions}
            value={formData.clienteId}
            onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
            placeholder="Seleccionar cliente..."
            searchPlaceholder="Buscar cliente..."
            emptyMessage="No se encontraron clientes"
            loading={loadingClientes}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="qc-proyecto-tipo">Tipo</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoProyecto })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_PROYECTO.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="qc-proyecto-prioridad">Prioridad</Label>
            <Select
              value={formData.prioridad}
              onValueChange={(value) => setFormData({ ...formData, prioridad: value as PrioridadProyecto })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORIDADES_PROYECTO.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
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
