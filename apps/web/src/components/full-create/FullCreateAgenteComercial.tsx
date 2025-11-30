'use client'

import * as React from 'react'
import { useState } from 'react'
import { FullCreateModal } from '@/components/ui/full-create-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Percent, FileText } from 'lucide-react'
import { agentesService } from '@/services/agentes-comerciales.service'
import { toast } from 'sonner'

interface FullCreateAgenteComercialProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (agente: { _id: string; codigo: string; nombre: string; apellidos?: string }) => void
}

export function FullCreateAgenteComercial({ open, onOpenChange, onCreated }: FullCreateAgenteComercialProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('datos')

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    nif: '',
    email: '',
    telefono: '',
    movil: '',
    direccion: '',
    codigoPostal: '',
    ciudad: '',
    provincia: '',
    pais: 'España',
    comisionPorDefecto: 0,
    observaciones: '',
    activo: true,
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
        nif: formData.nif.trim() || undefined,
        contacto: formData.email.trim() || formData.telefono.trim() || formData.movil.trim() ? {
          email: formData.email.trim() || undefined,
          telefono: formData.telefono.trim() || undefined,
          telefonoMovil: formData.movil.trim() || undefined,
        } : undefined,
        direccion: formData.direccion.trim() || formData.codigoPostal.trim() || formData.ciudad.trim() ? {
          direccion: formData.direccion.trim() || undefined,
          codigoPostal: formData.codigoPostal.trim() || undefined,
          ciudad: formData.ciudad.trim() || undefined,
          provincia: formData.provincia.trim() || undefined,
          pais: formData.pais.trim() || undefined,
        } : undefined,
        comision: formData.comisionPorDefecto ? {
          tipo: 'porcentaje' as const,
          porcentaje: formData.comisionPorDefecto,
        } : undefined,
        observaciones: formData.observaciones.trim() || undefined,
        activo: formData.activo,
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
        resetForm()
      }
    } catch (error: any) {
      console.error('Error al crear agente comercial:', error)
      toast.error(error.response?.data?.message || 'Error al crear agente comercial')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      nif: '',
      email: '',
      telefono: '',
      movil: '',
      direccion: '',
      codigoPostal: '',
      ciudad: '',
      provincia: '',
      pais: 'España',
      comisionPorDefecto: 0,
      observaciones: '',
      activo: true,
    })
    setActiveTab('datos')
  }

  return (
    <FullCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear Nuevo Agente Comercial"
      description="Complete los datos del agente comercial"
      onSubmit={handleSubmit}
      loading={loading}
      size="lg"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="datos" className="gap-2">
            <User className="h-4 w-4" />
            Datos Personales
          </TabsTrigger>
          <TabsTrigger value="comision" className="gap-2">
            <Percent className="h-4 w-4" />
            Comisiones
          </TabsTrigger>
          <TabsTrigger value="otros" className="gap-2">
            <FileText className="h-4 w-4" />
            Otros
          </TabsTrigger>
        </TabsList>

        {/* Tab Datos Personales */}
        <TabsContent value="datos" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Apellidos</Label>
              <Input
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                placeholder="Apellidos"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>NIF/CIF</Label>
              <Input
                value={formData.nif}
                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                placeholder="12345678A"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="912345678"
              />
            </div>
            <div className="space-y-2">
              <Label>Móvil</Label>
              <Input
                value={formData.movil}
                onChange={(e) => setFormData({ ...formData, movil: e.target.value })}
                placeholder="612345678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Calle, número, piso..."
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>C.P.</Label>
              <Input
                value={formData.codigoPostal}
                onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                placeholder="28001"
              />
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Madrid"
              />
            </div>
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Input
                value={formData.provincia}
                onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                placeholder="Madrid"
              />
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Input
                value={formData.pais}
                onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                placeholder="España"
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab Comisiones */}
        <TabsContent value="comision" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración de Comisiones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Comisión por Defecto (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.comisionPorDefecto}
                  onChange={(e) => setFormData({ ...formData, comisionPorDefecto: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Este porcentaje se aplicará por defecto a las ventas de este agente
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Otros */}
        <TabsContent value="otros" className="space-y-4 mt-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <Switch
              checked={formData.activo}
              onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
            />
            <div>
              <Label>Agente Activo</Label>
              <p className="text-xs text-muted-foreground">Los agentes inactivos no aparecerán en las búsquedas</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas adicionales sobre el agente..."
              rows={4}
            />
          </div>
        </TabsContent>
      </Tabs>
    </FullCreateModal>
  )
}
