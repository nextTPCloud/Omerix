'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  tareasService,
  CreateTareaDTO,
  TipoTarea,
  PrioridadTarea,
  RecurrenciaTarea,
} from '@/services/tareas.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  ArrowLeft,
  Save,
  Calendar,
  Clock,
  User,
  Building2,
  Briefcase,
  Bell,
  RefreshCw,
  Tag,
  FileText,
  Repeat,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

// ============================================
// CONSTANTES
// ============================================

const TIPOS = [
  { value: TipoTarea.GENERAL, label: 'General' },
  { value: TipoTarea.RECORDATORIO, label: 'Recordatorio' },
  { value: TipoTarea.SEGUIMIENTO_CLIENTE, label: 'Seguimiento Cliente' },
  { value: TipoTarea.SEGUIMIENTO_PROVEEDOR, label: 'Seguimiento Proveedor' },
  { value: TipoTarea.COBRO, label: 'Cobro' },
  { value: TipoTarea.PAGO, label: 'Pago' },
  { value: TipoTarea.LLAMADA, label: 'Llamada' },
  { value: TipoTarea.REUNION, label: 'Reunion' },
  { value: TipoTarea.VISITA, label: 'Visita' },
  { value: TipoTarea.REVISION, label: 'Revision' },
  { value: TipoTarea.MANTENIMIENTO, label: 'Mantenimiento' },
  { value: TipoTarea.INVENTARIO, label: 'Inventario' },
  { value: TipoTarea.ENTREGA, label: 'Entrega' },
  { value: TipoTarea.OTRO, label: 'Otro' },
]

const PRIORIDADES = [
  { value: PrioridadTarea.BAJA, label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  { value: PrioridadTarea.NORMAL, label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: PrioridadTarea.ALTA, label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: PrioridadTarea.URGENTE, label: 'Urgente', color: 'bg-red-100 text-red-800' },
]

const RECURRENCIAS = [
  { value: RecurrenciaTarea.NINGUNA, label: 'Sin recurrencia' },
  { value: RecurrenciaTarea.DIARIA, label: 'Diaria' },
  { value: RecurrenciaTarea.SEMANAL, label: 'Semanal' },
  { value: RecurrenciaTarea.QUINCENAL, label: 'Quincenal' },
  { value: RecurrenciaTarea.MENSUAL, label: 'Mensual' },
  { value: RecurrenciaTarea.TRIMESTRAL, label: 'Trimestral' },
  { value: RecurrenciaTarea.ANUAL, label: 'Anual' },
]

const COLORES = [
  { value: 'blue', bg: 'bg-blue-500' },
  { value: 'green', bg: 'bg-green-500' },
  { value: 'yellow', bg: 'bg-yellow-500' },
  { value: 'orange', bg: 'bg-orange-500' },
  { value: 'red', bg: 'bg-red-500' },
  { value: 'purple', bg: 'bg-purple-500' },
  { value: 'pink', bg: 'bg-pink-500' },
  { value: 'gray', bg: 'bg-gray-500' },
]

// ============================================
// COMPONENTE
// ============================================

export default function NuevaTareaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados para selectores relacionados
  const [clientes, setClientes] = useState<any[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [personal, setPersonal] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [proyectos, setProyectos] = useState<any[]>([])
  const [loadingRelaciones, setLoadingRelaciones] = useState(true)

  // Datos del formulario
  const [formData, setFormData] = useState<CreateTareaDTO>({
    titulo: '',
    descripcion: '',
    tipo: TipoTarea.GENERAL,
    prioridad: PrioridadTarea.NORMAL,
    fechaVencimiento: '',
    fechaRecordatorio: '',
    fechaInicio: '',
    recurrencia: RecurrenciaTarea.NINGUNA,
    asignadoAId: '',
    departamentoId: '',
    clienteId: '',
    proveedorId: '',
    proyectoId: '',
    horasEstimadas: undefined,
    enviarRecordatorio: false,
    notificarAlCompletar: false,
    etiquetas: [],
    color: 'blue',
  })

  // Etiqueta actual
  const [etiquetaInput, setEtiquetaInput] = useState('')

  // Cargar datos relacionados
  useEffect(() => {
    const cargarRelaciones = async () => {
      try {
        setLoadingRelaciones(true)
        const [clientesRes, proveedoresRes, personalRes, depRes, proyectosRes] = await Promise.all([
          api.get('/clientes', { params: { limit: 100, activo: true } }).catch(() => ({ data: { data: [] } })),
          api.get('/proveedores', { params: { limit: 100, activo: true } }).catch(() => ({ data: { data: [] } })),
          api.get('/personal', { params: { limit: 100, activo: true } }).catch(() => ({ data: { data: [] } })),
          api.get('/departamentos').catch(() => ({ data: { data: [] } })),
          api.get('/proyectos', { params: { limit: 100 } }).catch(() => ({ data: { data: [] } })),
        ])

        setClientes(clientesRes.data.data || [])
        setProveedores(proveedoresRes.data.data || [])
        setPersonal(personalRes.data.data || [])
        setDepartamentos(depRes.data.data || [])
        setProyectos(proyectosRes.data.data || [])
      } catch (error) {
        console.error('Error cargando relaciones:', error)
      } finally {
        setLoadingRelaciones(false)
      }
    }

    cargarRelaciones()
  }, [])

  // Pre-llenar datos si vienen de otro modulo
  useEffect(() => {
    const clienteId = searchParams.get('clienteId')
    const proveedorId = searchParams.get('proveedorId')
    const tipo = searchParams.get('tipo')
    const documentoId = searchParams.get('documentoId')
    const documentoTipo = searchParams.get('documentoTipo')
    const documentoCodigo = searchParams.get('documentoCodigo')

    if (clienteId) setFormData((prev) => ({ ...prev, clienteId }))
    if (proveedorId) setFormData((prev) => ({ ...prev, proveedorId }))
    if (tipo) setFormData((prev) => ({ ...prev, tipo: tipo as TipoTarea }))
    if (documentoId && documentoTipo) {
      setFormData((prev) => ({
        ...prev,
        documentoId,
        documentoTipo,
        documentoCodigo: documentoCodigo || '',
      }))
    }
  }, [searchParams])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddEtiqueta = () => {
    if (etiquetaInput.trim() && !formData.etiquetas?.includes(etiquetaInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        etiquetas: [...(prev.etiquetas || []), etiquetaInput.trim()],
      }))
      setEtiquetaInput('')
    }
  }

  const handleRemoveEtiqueta = (etiqueta: string) => {
    setFormData((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas?.filter((e) => e !== etiqueta),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo.trim()) {
      toast.error('El titulo es obligatorio')
      return
    }

    try {
      setIsSubmitting(true)

      // Limpiar campos vacios
      const dataToSend: CreateTareaDTO = {
        ...formData,
        asignadoAId: formData.asignadoAId || undefined,
        departamentoId: formData.departamentoId || undefined,
        clienteId: formData.clienteId || undefined,
        proveedorId: formData.proveedorId || undefined,
        proyectoId: formData.proyectoId || undefined,
        fechaVencimiento: formData.fechaVencimiento || undefined,
        fechaRecordatorio: formData.fechaRecordatorio || undefined,
        fechaInicio: formData.fechaInicio || undefined,
        horasEstimadas: formData.horasEstimadas || undefined,
      }

      const response = await tareasService.crear(dataToSend)

      if (response.success) {
        toast.success('Tarea creada correctamente')
        router.push('/tareas')
      }
    } catch (error: any) {
      console.error('Error creando tarea:', error)
      toast.error(error.response?.data?.error || 'Error al crear la tarea')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nueva Tarea</h1>
            <p className="text-muted-foreground">
              Crear una nueva tarea o recordatorio
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Datos principales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informacion Principal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Titulo *</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => handleChange('titulo', e.target.value)}
                      placeholder="Titulo de la tarea..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripcion</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => handleChange('descripcion', e.target.value)}
                      placeholder="Describe la tarea..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => handleChange('tipo', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Prioridad</Label>
                      <Select
                        value={formData.prioridad}
                        onValueChange={(value) => handleChange('prioridad', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORIDADES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              <div className="flex items-center gap-2">
                                <span className={cn('w-2 h-2 rounded-full', p.color.split(' ')[0])} />
                                {p.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Recurrencia</Label>
                      <Select
                        value={formData.recurrencia}
                        onValueChange={(value) => handleChange('recurrencia', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RECURRENCIAS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fechas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Fechas y Tiempo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                      <Input
                        id="fechaInicio"
                        type="datetime-local"
                        value={formData.fechaInicio}
                        onChange={(e) => handleChange('fechaInicio', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
                      <Input
                        id="fechaVencimiento"
                        type="datetime-local"
                        value={formData.fechaVencimiento}
                        onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fechaRecordatorio">Fecha de Recordatorio</Label>
                      <Input
                        id="fechaRecordatorio"
                        type="datetime-local"
                        value={formData.fechaRecordatorio}
                        onChange={(e) => handleChange('fechaRecordatorio', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="horasEstimadas">Horas Estimadas</Label>
                      <Input
                        id="horasEstimadas"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.horasEstimadas || ''}
                        onChange={(e) =>
                          handleChange('horasEstimadas', e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        placeholder="0"
                        className="w-32"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Relaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Relaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingRelaciones ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cliente</Label>
                        <SearchableSelect
                          options={clientes.map((c) => ({
                            value: c._id,
                            label: c.nombre || c.razonSocial || '',
                          }))}
                          value={formData.clienteId || ''}
                          onValueChange={(value) => handleChange('clienteId', value)}
                          placeholder="Seleccionar cliente..."
                          searchPlaceholder="Buscar cliente..."
                          emptyMessage="No se encontraron clientes"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Proveedor</Label>
                        <SearchableSelect
                          options={proveedores.map((p) => ({
                            value: p._id,
                            label: p.nombre || p.razonSocial || '',
                          }))}
                          value={formData.proveedorId || ''}
                          onValueChange={(value) => handleChange('proveedorId', value)}
                          placeholder="Seleccionar proveedor..."
                          searchPlaceholder="Buscar proveedor..."
                          emptyMessage="No se encontraron proveedores"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Proyecto</Label>
                        <SearchableSelect
                          options={proyectos.map((p) => ({
                            value: p._id,
                            label: `${p.codigo} - ${p.nombre}`,
                          }))}
                          value={formData.proyectoId || ''}
                          onValueChange={(value) => handleChange('proyectoId', value)}
                          placeholder="Seleccionar proyecto..."
                          searchPlaceholder="Buscar proyecto..."
                          emptyMessage="No se encontraron proyectos"
                        />
                      </div>

                      {formData.documentoTipo && (
                        <div className="space-y-2">
                          <Label>Documento Relacionado</Label>
                          <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">
                              {formData.documentoTipo}: {formData.documentoCodigo}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Columna lateral */}
            <div className="space-y-6">
              {/* Asignacion */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Asignacion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Asignar a</Label>
                    <SearchableSelect
                      options={personal.map((p) => ({
                        value: p._id,
                        label: p.nombreCompleto || `${p.nombre} ${p.apellidos || ''}`.trim(),
                      }))}
                      value={formData.asignadoAId || ''}
                      onValueChange={(value) => handleChange('asignadoAId', value)}
                      placeholder="Seleccionar persona..."
                      searchPlaceholder="Buscar personal..."
                      emptyMessage="No se encontró personal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Departamento</Label>
                    <SearchableSelect
                      options={departamentos.map((d) => ({
                        value: d._id,
                        label: d.nombre,
                      }))}
                      value={formData.departamentoId || ''}
                      onValueChange={(value) => handleChange('departamentoId', value)}
                      placeholder="Seleccionar departamento..."
                      searchPlaceholder="Buscar departamento..."
                      emptyMessage="No se encontraron departamentos"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notificaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enviarRecordatorio"
                      checked={formData.enviarRecordatorio}
                      onCheckedChange={(checked) =>
                        handleChange('enviarRecordatorio', checked as boolean)
                      }
                    />
                    <Label htmlFor="enviarRecordatorio" className="text-sm">
                      Enviar recordatorio
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notificarAlCompletar"
                      checked={formData.notificarAlCompletar}
                      onCheckedChange={(checked) =>
                        handleChange('notificarAlCompletar', checked as boolean)
                      }
                    />
                    <Label htmlFor="notificarAlCompletar" className="text-sm">
                      Notificar al completar
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Color y etiquetas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Personalizacion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLORES.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          className={cn(
                            'w-8 h-8 rounded-full transition-all',
                            c.bg,
                            formData.color === c.value && 'ring-2 ring-offset-2 ring-primary'
                          )}
                          onClick={() => handleChange('color', c.value)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Etiquetas</Label>
                    <div className="flex gap-2">
                      <Input
                        value={etiquetaInput}
                        onChange={(e) => setEtiquetaInput(e.target.value)}
                        placeholder="Nueva etiqueta..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddEtiqueta()
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddEtiqueta}>
                        +
                      </Button>
                    </div>
                    {formData.etiquetas && formData.etiquetas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.etiquetas.map((etiqueta) => (
                          <span
                            key={etiqueta}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                          >
                            {etiqueta}
                            <button
                              type="button"
                              onClick={() => handleRemoveEtiqueta(etiqueta)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Acciones */}
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Crear Tarea
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
