'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { partesTrabajoService } from '@/services/partes-trabajo.service'
import { clientesService } from '@/services/clientes.service'
import { proyectosService } from '@/services/proyectos.service'
import { personalService } from '@/services/personal.service'
import {
  CreateParteTrabajoDTO,
  TIPOS_PARTE_TRABAJO,
  PRIORIDADES,
  TipoParteTrabajo,
  Prioridad,
} from '@/types/parte-trabajo.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Wrench, RefreshCw, Calendar, Building2, FolderKanban, User } from 'lucide-react'
import { toast } from 'sonner'

export default function NuevoParteTrabajoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Listas para selects
  const [clientes, setClientes] = useState<any[]>([])
  const [proyectos, setProyectos] = useState<any[]>([])
  const [personal, setPersonal] = useState<any[]>([])

  // Form data
  const [formData, setFormData] = useState<CreateParteTrabajoDTO>({
    clienteId: '',
    tipo: 'servicio',
    prioridad: 'media',
    fecha: new Date().toISOString().split('T')[0],
    titulo: '',
    descripcion: '',
  })

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true)
      try {
        const [clientesRes, proyectosRes, personalRes] = await Promise.all([
          clientesService.getAll({ limit: 100, activo: true }),
          proyectosService.getAll({ limit: 100, activo: 'true' }),
          personalService.getAll({ limit: 100, activo: true }),
        ])

        if (clientesRes.success) setClientes(clientesRes.data || [])
        if (proyectosRes.success) setProyectos(proyectosRes.data || [])
        if (personalRes.success) setPersonal(personalRes.data || [])
      } catch (error) {
        console.error('Error cargando datos:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
  }, [])

  // Filtrar proyectos por cliente seleccionado
  const proyectosFiltrados = formData.clienteId
    ? proyectos.filter((p) => p.clienteId === formData.clienteId || p.clienteId?._id === formData.clienteId)
    : proyectos

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clienteId) {
      toast.error('El cliente es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await partesTrabajoService.create(formData)
      if (response.success && response.data) {
        toast.success('Parte de trabajo creado correctamente')
        router.push(`/partes-trabajo/${response.data._id}/editar`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear el parte de trabajo')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/partes-trabajo">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wrench className="h-7 w-7 text-primary" />
              Nuevo Parte de Trabajo
            </h1>
            <p className="text-sm text-muted-foreground">
              Crea un nuevo parte de trabajo. Podras agregar lineas despues de crear el parte.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Datos principales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Datos Generales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="clienteId">Cliente *</Label>
                <Select
                  value={formData.clienteId}
                  onValueChange={(value) => setFormData({ ...formData, clienteId: value, proyectoId: undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente._id} value={cliente._id}>
                        {cliente.nombre || cliente.nombreComercial} {cliente.nif && `(${cliente.nif})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Proyecto (opcional) */}
              <div className="space-y-2">
                <Label htmlFor="proyectoId">
                  <FolderKanban className="h-4 w-4 inline mr-1" />
                  Proyecto (opcional)
                </Label>
                <Select
                  value={formData.proyectoId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, proyectoId: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proyecto</SelectItem>
                    {proyectosFiltrados.map((proyecto) => (
                      <SelectItem key={proyecto._id} value={proyecto._id}>
                        {proyecto.codigo} - {proyecto.nombre || proyecto.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo y Prioridad */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoParteTrabajo })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_PARTE_TRABAJO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select
                    value={formData.prioridad}
                    onValueChange={(value) => setFormData({ ...formData, prioridad: value as Prioridad })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fecha y Responsable */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Fecha
                  </Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsableId">
                    <User className="h-4 w-4 inline mr-1" />
                    Responsable
                  </Label>
                  <Select
                    value={formData.responsableId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, responsableId: value === 'none' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {personal.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.nombre} {p.apellidos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Titulo */}
              <div className="space-y-2">
                <Label htmlFor="titulo">Titulo</Label>
                <Input
                  id="titulo"
                  placeholder="Titulo descriptivo del parte"
                  value={formData.titulo || ''}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>

              {/* Descripcion */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Descripcion del trabajo a realizar..."
                  rows={4}
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Direccion de trabajo */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Direccion del Trabajo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calle">Calle</Label>
                  <Input
                    id="calle"
                    placeholder="Nombre de la calle"
                    value={formData.direccionTrabajo?.calle || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      direccionTrabajo: { ...formData.direccionTrabajo, calle: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Numero</Label>
                  <Input
                    id="numero"
                    placeholder="Numero"
                    value={formData.direccionTrabajo?.numero || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      direccionTrabajo: { ...formData.direccionTrabajo, numero: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoPostal">Codigo Postal</Label>
                  <Input
                    id="codigoPostal"
                    placeholder="CP"
                    value={formData.direccionTrabajo?.codigoPostal || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      direccionTrabajo: { ...formData.direccionTrabajo, codigoPostal: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    placeholder="Ciudad"
                    value={formData.direccionTrabajo?.ciudad || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      direccionTrabajo: { ...formData.direccionTrabajo, ciudad: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input
                    id="provincia"
                    placeholder="Provincia"
                    value={formData.direccionTrabajo?.provincia || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      direccionTrabajo: { ...formData.direccionTrabajo, provincia: e.target.value }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" asChild>
              <Link href="/partes-trabajo">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Crear Parte'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
