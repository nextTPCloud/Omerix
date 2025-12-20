'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { personalService } from '@/services/personal.service'
import {
  Personal,
  CreatePersonalDTO,
  TIPOS_CONTRATO,
  ESTADOS_EMPLEADO,
  TIPOS_JORNADA,
  GENEROS,
} from '@/types/personal.types'
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
import { ArrowLeft, Save, RefreshCw, Users, Mail, MapPin, CreditCard, Briefcase, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { CodeInput } from '@/components/ui/code-input'

export default function EditarPersonalPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isNew = id === 'nuevo'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CreatePersonalDTO>({
    nombre: '',
    apellidos: '',
    estado: 'activo',
    activo: true,
    datosPersonales: {},
    contacto: {},
    direccion: {},
    documentacion: {},
    datosLaborales: {
      puesto: '',
      tipoContrato: 'indefinido',
      tipoJornada: 'completa',
      horasSemanales: 40,
      fechaInicioContrato: new Date().toISOString(),
    },
    datosEconomicos: {
      numPagas: 14,
    },
    cuentasBancarias: [],
    observaciones: '',
    tags: [],
  })

  useEffect(() => {
    const loadEmpleado = async () => {
      if (isNew) return

      try {
        setLoading(true)
        const response = await personalService.getById(id)
        if (response.success) {
          const emp = response.data
          setFormData({
            codigo: emp.codigo,
            nombre: emp.nombre,
            apellidos: emp.apellidos,
            foto: emp.foto,
            estado: emp.estado,
            activo: emp.activo,
            datosPersonales: emp.datosPersonales || {},
            contacto: emp.contacto || {},
            direccion: emp.direccion || {},
            documentacion: emp.documentacion || {},
            datosLaborales: {
              puesto: emp.datosLaborales?.puesto || '',
              departamentoId: emp.datosLaborales?.departamentoId,
              categoriaLaboral: emp.datosLaborales?.categoriaLaboral,
              nivelProfesional: emp.datosLaborales?.nivelProfesional,
              tipoContrato: emp.datosLaborales?.tipoContrato || 'indefinido',
              tipoJornada: emp.datosLaborales?.tipoJornada || 'completa',
              horasSemanales: emp.datosLaborales?.horasSemanales || 40,
              fechaInicioContrato: emp.datosLaborales?.fechaInicioContrato || new Date().toISOString(),
              fechaFinContrato: emp.datosLaborales?.fechaFinContrato,
              periodoPrueba: emp.datosLaborales?.periodoPrueba,
              fechaFinPrueba: emp.datosLaborales?.fechaFinPrueba,
              ubicacionObligatoria: emp.datosLaborales?.ubicacionObligatoria,
              fotoObligatoria: emp.datosLaborales?.fotoObligatoria,
            },
            datosEconomicos: emp.datosEconomicos || { numPagas: 14 },
            responsableId: emp.responsableId,
            cuentasBancarias: emp.cuentasBancarias || [],
            usuarioId: emp.usuarioId,
            observaciones: emp.observaciones,
            tags: emp.tags,
          })
        }
      } catch (err: any) {
        toast.error('Error al cargar el empleado')
        router.push('/personal')
      } finally {
        setLoading(false)
      }
    }

    loadEmpleado()
  }, [id, isNew, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.apellidos) {
      toast.error('El nombre y apellidos son obligatorios')
      return
    }

    if (!formData.datosLaborales?.puesto) {
      toast.error('El puesto es obligatorio')
      return
    }

    try {
      setSaving(true)

      let response
      if (isNew) {
        response = await personalService.create(formData)
      } else {
        response = await personalService.update(id, formData)
      }

      if (response.success && response.data) {
        toast.success(isNew ? 'Empleado creado correctamente' : 'Empleado actualizado correctamente')
        const empleadoId = response.data._id
        if (empleadoId) {
          router.push(`/personal/${empleadoId}`)
        } else {
          router.push('/personal')
        }
      } else {
        toast.error('Error al guardar el empleado')
      }
    } catch (err: any) {
      console.error('Error guardando empleado:', err)
      toast.error(err.response?.data?.message || err.message || 'Error al guardar el empleado')
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
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
              <h1 className="text-2xl font-bold">
                {isNew ? 'Nuevo Empleado' : 'Editar Empleado'}
              </h1>
              {!isNew && formData.codigo && (
                <p className="text-muted-foreground font-mono">{formData.codigo}</p>
              )}
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
        <Tabs defaultValue="personal" className="w-full">
          <TabsList>
            <TabsTrigger value="personal">Datos Personales</TabsTrigger>
            <TabsTrigger value="contacto">Contacto</TabsTrigger>
            <TabsTrigger value="laboral">Datos Laborales</TabsTrigger>
            <TabsTrigger value="economicos">Económicos</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Datos Personales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    {isNew ? (
                      <CodeInput
                        id="codigo"
                        value={formData.codigo || ''}
                        onChange={(value) => updateField('codigo', value)}
                        placeholder="Ej: EMP (pulsa ↓ para sugerir)"
                        onSearchCodes={async (prefix) => {
                          try {
                            const response = await personalService.search(prefix)
                            return response.data?.map((e: Personal) => e.codigo) || []
                          } catch {
                            return []
                          }
                        }}
                        helperText="Escribe un prefijo y pulsa ↓ para sugerir"
                      />
                    ) : (
                      <Input
                        id="codigo"
                        value={formData.codigo || ''}
                        disabled
                        className="bg-muted"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => updateField('nombre', e.target.value)}
                      placeholder="Nombre"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos *</Label>
                    <Input
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={(e) => updateField('apellidos', e.target.value)}
                      placeholder="Apellidos"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nif">NIF</Label>
                    <Input
                      id="nif"
                      value={formData.documentacion?.nif || ''}
                      onChange={(e) => updateNestedField('documentacion', 'nif', e.target.value)}
                      placeholder="12345678A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nss">Nº Seguridad Social</Label>
                    <Input
                      id="nss"
                      value={formData.documentacion?.nss || ''}
                      onChange={(e) => updateNestedField('documentacion', 'nss', e.target.value)}
                      placeholder="123456789012"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento">Fecha Nacimiento</Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      value={formData.datosPersonales?.fechaNacimiento?.split('T')[0] || ''}
                      onChange={(e) => updateNestedField('datosPersonales', 'fechaNacimiento', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genero">Género</Label>
                    <Select
                      value={formData.datosPersonales?.genero || 'no_especificado'}
                      onValueChange={(value) => updateNestedField('datosPersonales', 'genero', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENEROS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nacionalidad">Nacionalidad</Label>
                    <Input
                      id="nacionalidad"
                      value={formData.datosPersonales?.nacionalidad || ''}
                      onChange={(e) => updateNestedField('datosPersonales', 'nacionalidad', e.target.value)}
                      placeholder="Española"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={formData.estado} onValueChange={(value) => updateField('estado', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_EMPLEADO.map((estado) => (
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
                  <Label htmlFor="activo">Empleado activo</Label>
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
                    <Label htmlFor="emailCorporativo">Email Corporativo</Label>
                    <Input
                      id="emailCorporativo"
                      type="email"
                      value={formData.contacto?.emailCorporativo || ''}
                      onChange={(e) => updateNestedField('contacto', 'emailCorporativo', e.target.value)}
                      placeholder="empleado@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Personal</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.contacto?.email || ''}
                      onChange={(e) => updateNestedField('contacto', 'email', e.target.value)}
                      placeholder="personal@email.com"
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
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono Fijo</Label>
                    <Input
                      id="telefono"
                      value={formData.contacto?.telefono || ''}
                      onChange={(e) => updateNestedField('contacto', 'telefono', e.target.value)}
                      placeholder="+34 912 345 678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefonoEmergencia">Teléfono Emergencia</Label>
                    <Input
                      id="telefonoEmergencia"
                      value={formData.contacto?.telefonoEmergencia || ''}
                      onChange={(e) => updateNestedField('contacto', 'telefonoEmergencia', e.target.value)}
                      placeholder="+34 600 000 000"
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

          <TabsContent value="laboral" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Datos Laborales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="puesto">Puesto *</Label>
                    <Input
                      id="puesto"
                      value={formData.datosLaborales?.puesto || ''}
                      onChange={(e) => updateNestedField('datosLaborales', 'puesto', e.target.value)}
                      placeholder="Desarrollador Senior"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoriaLaboral">Categoría</Label>
                    <Input
                      id="categoriaLaboral"
                      value={formData.datosLaborales?.categoriaLaboral || ''}
                      onChange={(e) => updateNestedField('datosLaborales', 'categoriaLaboral', e.target.value)}
                      placeholder="Grupo 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nivelProfesional">Nivel Profesional</Label>
                    <Input
                      id="nivelProfesional"
                      value={formData.datosLaborales?.nivelProfesional || ''}
                      onChange={(e) => updateNestedField('datosLaborales', 'nivelProfesional', e.target.value)}
                      placeholder="Senior"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                    <Select
                      value={formData.datosLaborales?.tipoContrato || 'indefinido'}
                      onValueChange={(value) => updateNestedField('datosLaborales', 'tipoContrato', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_CONTRATO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipoJornada">Tipo de Jornada</Label>
                    <Select
                      value={formData.datosLaborales?.tipoJornada || 'completa'}
                      onValueChange={(value) => updateNestedField('datosLaborales', 'tipoJornada', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_JORNADA.map((jornada) => (
                          <SelectItem key={jornada.value} value={jornada.value}>
                            {jornada.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horasSemanales">Horas/Semana</Label>
                    <Input
                      id="horasSemanales"
                      type="number"
                      min="0"
                      max="60"
                      value={formData.datosLaborales?.horasSemanales || 40}
                      onChange={(e) => updateNestedField('datosLaborales', 'horasSemanales', parseInt(e.target.value) || 40)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaInicioContrato">Fecha Inicio Contrato *</Label>
                    <Input
                      id="fechaInicioContrato"
                      type="date"
                      value={formData.datosLaborales?.fechaInicioContrato?.split('T')[0] || ''}
                      onChange={(e) => updateNestedField('datosLaborales', 'fechaInicioContrato', e.target.value ? new Date(e.target.value).toISOString() : '')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaFinContrato">Fecha Fin Contrato</Label>
                    <Input
                      id="fechaFinContrato"
                      type="date"
                      value={formData.datosLaborales?.fechaFinContrato?.split('T')[0] || ''}
                      onChange={(e) => updateNestedField('datosLaborales', 'fechaFinContrato', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="periodoPrueba"
                    checked={formData.datosLaborales?.periodoPrueba || false}
                    onCheckedChange={(checked) => updateNestedField('datosLaborales', 'periodoPrueba', checked)}
                  />
                  <Label htmlFor="periodoPrueba">En periodo de prueba</Label>
                </div>

                {/* Configuración de fichaje */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">Configuración de Fichaje</h4>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ubicacionObligatoria"
                        checked={formData.datosLaborales?.ubicacionObligatoria || false}
                        onCheckedChange={(checked) => updateNestedField('datosLaborales', 'ubicacionObligatoria', !!checked)}
                      />
                      <Label htmlFor="ubicacionObligatoria" className="text-sm">
                        Ubicación obligatoria para fichaje
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fotoObligatoria"
                        checked={formData.datosLaborales?.fotoObligatoria || false}
                        onCheckedChange={(checked) => updateNestedField('datosLaborales', 'fotoObligatoria', !!checked)}
                      />
                      <Label htmlFor="fotoObligatoria" className="text-sm">
                        Foto obligatoria para terminal biométrico
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="economicos" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Datos Económicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="salarioBrutoAnual">Salario Bruto Anual (€)</Label>
                    <Input
                      id="salarioBrutoAnual"
                      type="number"
                      min="0"
                      step="100"
                      value={formData.datosEconomicos?.salarioBrutoAnual || ''}
                      onChange={(e) => updateNestedField('datosEconomicos', 'salarioBrutoAnual', parseFloat(e.target.value) || 0)}
                      placeholder="30000"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numPagas">Número de Pagas</Label>
                      <Select
                        value={String(formData.datosEconomicos?.numPagas || 14)}
                        onValueChange={(value) => updateNestedField('datosEconomicos', 'numPagas', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12 pagas</SelectItem>
                          <SelectItem value="14">14 pagas</SelectItem>
                          <SelectItem value="15">15 pagas</SelectItem>
                          <SelectItem value="16">16 pagas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="irpf">IRPF (%)</Label>
                      <Input
                        id="irpf"
                        type="number"
                        min="0"
                        max="50"
                        step="0.1"
                        value={formData.datosEconomicos?.irpf || ''}
                        onChange={(e) => updateNestedField('datosEconomicos', 'irpf', parseFloat(e.target.value) || 0)}
                        placeholder="15"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plusTransporte">Plus Transporte (€)</Label>
                      <Input
                        id="plusTransporte"
                        type="number"
                        min="0"
                        step="10"
                        value={formData.datosEconomicos?.plusTransporte || ''}
                        onChange={(e) => updateNestedField('datosEconomicos', 'plusTransporte', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plusComida">Plus Comida (€)</Label>
                      <Input
                        id="plusComida"
                        type="number"
                        min="0"
                        step="10"
                        value={formData.datosEconomicos?.plusComida || ''}
                        onChange={(e) => updateNestedField('datosEconomicos', 'plusComida', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Cuenta Bancaria Principal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={formData.cuentasBancarias?.[0]?.iban || ''}
                      onChange={(e) => {
                        const cuentas = formData.cuentasBancarias || []
                        if (cuentas.length === 0) {
                          cuentas.push({ iban: e.target.value.toUpperCase(), principal: true })
                        } else {
                          cuentas[0] = { ...cuentas[0], iban: e.target.value.toUpperCase() }
                        }
                        updateField('cuentasBancarias', cuentas)
                      }}
                      placeholder="ES00 0000 0000 0000 0000 0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banco">Banco</Label>
                    <Input
                      id="banco"
                      value={formData.cuentasBancarias?.[0]?.banco || ''}
                      onChange={(e) => {
                        const cuentas = formData.cuentasBancarias || []
                        if (cuentas.length === 0) {
                          cuentas.push({ iban: '', banco: e.target.value, principal: true })
                        } else {
                          cuentas[0] = { ...cuentas[0], banco: e.target.value }
                        }
                        updateField('cuentasBancarias', cuentas)
                      }}
                      placeholder="Nombre del banco"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Observaciones */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.observaciones || ''}
                  onChange={(e) => updateField('observaciones', e.target.value)}
                  placeholder="Notas adicionales..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </DashboardLayout>
  )
}
