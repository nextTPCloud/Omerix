'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { agentesService } from '@/services/agentes-comerciales.service'
import {
  AgenteComercial,
  CreateAgenteDTO,
  TIPOS_AGENTE,
  ESTADOS_AGENTE,
  TIPOS_COMISION,
} from '@/types/agente-comercial.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, RefreshCw, Briefcase, Mail, MapPin, CreditCard, Percent } from 'lucide-react'
import { toast } from 'sonner'
import { CodeInput } from '@/components/ui/code-input'

export default function NuevoAgenteEditarPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CreateAgenteDTO>({
    nombre: '',
    apellidos: '',
    tipo: 'comercial',
    estado: 'activo',
    activo: true,
    contacto: {},
    direccion: {},
    comision: { tipo: 'porcentaje', porcentaje: 0 },
    zonasAsignadas: [],
    observaciones: '',
    tags: [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre) {
      toast.error('El nombre es obligatorio')
      return
    }

    try {
      setSaving(true)
      const response = await agentesService.create(formData)

      if (response.success && response.data) {
        toast.success('Agente creado correctamente')
        const agenteId = response.data._id || response.data.id
        if (agenteId) {
          router.push(`/agentes-comerciales/${agenteId}`)
        } else {
          router.push('/agentes-comerciales')
        }
      } else {
        toast.error('Error al guardar el agente')
      }
    } catch (err: any) {
      console.error('Error guardando agente:', err)
      toast.error(err.response?.data?.message || err.message || 'Error al guardar el agente')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateNestedField = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...(prev as any)[parent], [field]: value },
    }))
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Nuevo Agente Comercial</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Formulario */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">Datos Generales</TabsTrigger>
            <TabsTrigger value="contacto">Contacto</TabsTrigger>
            <TabsTrigger value="comisiones">Comisiones</TabsTrigger>
            <TabsTrigger value="bancarios">Datos Bancarios</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Datos del Agente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <CodeInput
                      id="codigo"
                      value={formData.codigo || ''}
                      onChange={(value) => updateField('codigo', value)}
                      placeholder="Ej: AGT (pulsa ↓ para sugerir)"
                      onSearchCodes={async (prefix) => {
                        try {
                          const response = await agentesService.search(prefix)
                          return response.data?.map((a: AgenteComercial) => a.codigo) || []
                        } catch {
                          return []
                        }
                      }}
                      helperText="Escribe un prefijo y pulsa ↓ para sugerir"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => updateField('nombre', e.target.value)}
                      placeholder="Nombre del agente"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input
                      id="apellidos"
                      value={formData.apellidos || ''}
                      onChange={(e) => updateField('apellidos', e.target.value)}
                      placeholder="Apellidos"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nif">NIF</Label>
                    <Input
                      id="nif"
                      value={formData.nif || ''}
                      onChange={(e) => updateField('nif', e.target.value)}
                      placeholder="12345678A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Agente</Label>
                    <Select value={formData.tipo} onValueChange={(value) => updateField('tipo', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_AGENTE.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={formData.estado} onValueChange={(value) => updateField('estado', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_AGENTE.map((estado) => (
                          <SelectItem key={estado.value} value={estado.value}>
                            {estado.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => updateField('activo', checked)}
                  />
                  <Label htmlFor="activo">Agente activo</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones || ''}
                    onChange={(e) => updateField('observaciones', e.target.value)}
                    placeholder="Notas adicionales..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacto" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Datos de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.contacto?.email || ''}
                      onChange={(e) => updateNestedField('contacto', 'email', e.target.value)}
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailSecundario">Email Secundario</Label>
                    <Input
                      id="emailSecundario"
                      type="email"
                      value={formData.contacto?.emailSecundario || ''}
                      onChange={(e) => updateNestedField('contacto', 'emailSecundario', e.target.value)}
                      placeholder="email2@ejemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.contacto?.telefono || ''}
                      onChange={(e) => updateNestedField('contacto', 'telefono', e.target.value)}
                      placeholder="+34 912 345 678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefonoMovil">Teléfono Móvil</Label>
                    <Input
                      id="telefonoMovil"
                      value={formData.contacto?.telefonoMovil || ''}
                      onChange={(e) => updateNestedField('contacto', 'telefonoMovil', e.target.value)}
                      placeholder="+34 612 345 678"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Dirección
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion?.direccion || ''}
                      onChange={(e) => updateNestedField('direccion', 'direccion', e.target.value)}
                      placeholder="Calle, número..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigoPostal">Código Postal</Label>
                      <Input
                        id="codigoPostal"
                        value={formData.direccion?.codigoPostal || ''}
                        onChange={(e) => updateNestedField('direccion', 'codigoPostal', e.target.value)}
                        placeholder="28001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ciudad">Ciudad</Label>
                      <Input
                        id="ciudad"
                        value={formData.direccion?.ciudad || ''}
                        onChange={(e) => updateNestedField('direccion', 'ciudad', e.target.value)}
                        placeholder="Madrid"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provincia">Provincia</Label>
                      <Input
                        id="provincia"
                        value={formData.direccion?.provincia || ''}
                        onChange={(e) => updateNestedField('direccion', 'provincia', e.target.value)}
                        placeholder="Madrid"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pais">País</Label>
                      <Input
                        id="pais"
                        value={formData.direccion?.pais || 'España'}
                        onChange={(e) => updateNestedField('direccion', 'pais', e.target.value)}
                        placeholder="España"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comisiones" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Configuración de Comisiones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoComision">Tipo de Comisión</Label>
                    <Select
                      value={formData.comision?.tipo || 'porcentaje'}
                      onValueChange={(value) => updateNestedField('comision', 'tipo', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_COMISION.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="porcentaje">Porcentaje de Comisión (%)</Label>
                    <Input
                      id="porcentaje"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.comision?.porcentaje || 0}
                      onChange={(e) => updateNestedField('comision', 'porcentaje', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="importeFijo">Importe Fijo (€)</Label>
                    <Input
                      id="importeFijo"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.comision?.importeFijo || 0}
                      onChange={(e) => updateNestedField('comision', 'importeFijo', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="porcentajeMinimo">% Mínimo</Label>
                    <Input
                      id="porcentajeMinimo"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.comision?.porcentajeMinimo || 0}
                      onChange={(e) => updateNestedField('comision', 'porcentajeMinimo', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="porcentajeMaximo">% Máximo</Label>
                    <Input
                      id="porcentajeMaximo"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.comision?.porcentajeMaximo || 100}
                      onChange={(e) => updateNestedField('comision', 'porcentajeMaximo', parseFloat(e.target.value) || 100)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bancarios" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Datos Bancarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={formData.iban || ''}
                      onChange={(e) => updateField('iban', e.target.value.toUpperCase())}
                      placeholder="ES00 0000 0000 0000 0000 0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="swift">SWIFT/BIC</Label>
                    <Input
                      id="swift"
                      value={formData.swift || ''}
                      onChange={(e) => updateField('swift', e.target.value.toUpperCase())}
                      placeholder="XXXXXXXX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    id="banco"
                    value={formData.banco || ''}
                    onChange={(e) => updateField('banco', e.target.value)}
                    placeholder="Nombre del banco"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </DashboardLayout>
  )
}
