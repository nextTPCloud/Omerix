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
import { User, Briefcase, FileText, MapPin } from 'lucide-react'
import { personalService } from '@/services/personal.service'
import { TIPOS_CONTRATO, TIPOS_JORNADA, TipoContrato, TipoJornada } from '@/types/personal.types'
import { DateInput } from '@/components/ui/date-picker'
import { toast } from 'sonner'

interface FullCreatePersonalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (personal: { _id: string; codigo: string; nombre: string; apellidos: string }) => void
}

export function FullCreatePersonal({ open, onOpenChange, onCreated }: FullCreatePersonalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('datos')

  const [formData, setFormData] = useState({
    // Datos personales
    nombre: '',
    apellidos: '',
    nif: '',
    fechaNacimiento: '',
    genero: 'no_especificado' as const,
    // Contacto
    email: '',
    emailCorporativo: '',
    telefono: '',
    telefonoMovil: '',
    // Dirección
    direccion: '',
    codigoPostal: '',
    ciudad: '',
    provincia: '',
    pais: 'España',
    // Datos laborales
    puesto: '',
    departamento: '',
    tipoContrato: 'indefinido' as TipoContrato,
    tipoJornada: 'completa' as TipoJornada,
    fechaInicioContrato: new Date().toISOString().split('T')[0],
    salarioBrutoAnual: 0,
    // Otros
    observaciones: '',
    activo: true,
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
        datosPersonales: {
          fechaNacimiento: formData.fechaNacimiento || undefined,
          genero: formData.genero,
        },
        documentacion: {
          nif: formData.nif.trim() || undefined,
        },
        contacto: {
          email: formData.email.trim() || undefined,
          emailCorporativo: formData.emailCorporativo.trim() || undefined,
          telefono: formData.telefono.trim() || undefined,
          telefonoMovil: formData.telefonoMovil.trim() || undefined,
        },
        direccion: {
          direccion: formData.direccion.trim() || undefined,
          codigoPostal: formData.codigoPostal.trim() || undefined,
          ciudad: formData.ciudad.trim() || undefined,
          provincia: formData.provincia.trim() || undefined,
          pais: formData.pais.trim() || undefined,
        },
        datosLaborales: {
          puesto: formData.puesto.trim(),
          departamentoId: formData.departamento.trim() || undefined,
          tipoContrato: formData.tipoContrato,
          tipoJornada: formData.tipoJornada,
          fechaInicioContrato: formData.fechaInicioContrato,
        },
        observaciones: formData.observaciones.trim() || undefined,
        activo: formData.activo,
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
        resetForm()
      }
    } catch (error: any) {
      console.error('Error al crear personal:', error)
      toast.error(error.response?.data?.message || 'Error al crear personal')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      nif: '',
      fechaNacimiento: '',
      genero: 'no_especificado',
      email: '',
      emailCorporativo: '',
      telefono: '',
      telefonoMovil: '',
      direccion: '',
      codigoPostal: '',
      ciudad: '',
      provincia: '',
      pais: 'España',
      puesto: '',
      departamento: '',
      tipoContrato: 'indefinido',
      tipoJornada: 'completa',
      fechaInicioContrato: new Date().toISOString().split('T')[0],
      salarioBrutoAnual: 0,
      observaciones: '',
      activo: true,
    })
    setActiveTab('datos')
  }

  return (
    <FullCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear Nuevo Empleado"
      description="Complete los datos del empleado"
      onSubmit={handleSubmit}
      loading={loading}
      size="xl"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="datos" className="gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="contacto" className="gap-2">
            <MapPin className="h-4 w-4" />
            Contacto
          </TabsTrigger>
          <TabsTrigger value="laboral" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Laboral
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
              <Label>Apellidos *</Label>
              <Input
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                placeholder="Apellidos"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>NIF/NIE</Label>
              <Input
                value={formData.nif}
                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                placeholder="12345678A"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Nacimiento</Label>
              <DateInput
                value={formData.fechaNacimiento}
                onChange={(value) => setFormData({ ...formData, fechaNacimiento: value })}
                placeholder="Seleccionar fecha"
              />
            </div>
            <div className="space-y-2">
              <Label>Género</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={formData.genero}
                onChange={(e) => setFormData({ ...formData, genero: e.target.value as any })}
              >
                <option value="no_especificado">No especificado</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="no_binario">No binario</option>
              </select>
            </div>
          </div>
        </TabsContent>

        {/* Tab Contacto */}
        <TabsContent value="contacto" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Personal</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="personal@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Corporativo</Label>
                  <Input
                    type="email"
                    value={formData.emailCorporativo}
                    onChange={(e) => setFormData({ ...formData, emailCorporativo: e.target.value })}
                    placeholder="trabajo@empresa.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono Fijo</Label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="912345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono Móvil</Label>
                  <Input
                    value={formData.telefonoMovil}
                    onChange={(e) => setFormData({ ...formData, telefonoMovil: e.target.value })}
                    placeholder="612345678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dirección</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Laboral */}
        <TabsContent value="laboral" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos Laborales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Puesto *</Label>
                  <Input
                    value={formData.puesto}
                    onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                    placeholder="Ej: Técnico, Administrativo, Comercial..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Input
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    placeholder="Ej: Ventas, RRHH, IT..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Contrato</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.tipoContrato}
                    onChange={(e) => setFormData({ ...formData, tipoContrato: e.target.value as TipoContrato })}
                  >
                    {TIPOS_CONTRATO.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Jornada</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.tipoJornada}
                    onChange={(e) => setFormData({ ...formData, tipoJornada: e.target.value as TipoJornada })}
                  >
                    {TIPOS_JORNADA.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio Contrato</Label>
                  <DateInput
                    value={formData.fechaInicioContrato}
                    onChange={(value) => setFormData({ ...formData, fechaInicioContrato: value })}
                    placeholder="Seleccionar fecha"
                    allowClear={false}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salario Bruto Anual (€)</Label>
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={formData.salarioBrutoAnual || ''}
                    onChange={(e) => setFormData({ ...formData, salarioBrutoAnual: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
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
              <Label>Empleado Activo</Label>
              <p className="text-xs text-muted-foreground">Los empleados inactivos no aparecerán en las búsquedas</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas adicionales sobre el empleado..."
              rows={4}
            />
          </div>
        </TabsContent>
      </Tabs>
    </FullCreateModal>
  )
}
