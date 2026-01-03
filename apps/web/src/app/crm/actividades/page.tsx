'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { crmService } from '@/services/crm.service'
import {
  Actividad,
  FiltroActividades,
  TipoActividad,
  TIPO_ACTIVIDAD_LABELS,
  TIPO_ACTIVIDAD_COLORS,
  RESULTADO_ACTIVIDAD_LABELS,
} from '@/types/crm.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Phone,
  Mail,
  Calendar,
  Users,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  X,
  Building2,
  Target,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, isToday, isPast, isFuture } from 'date-fns'
import { es } from 'date-fns/locale'

const tipoIconos: Record<TipoActividad, any> = {
  [TipoActividad.LLAMADA]: Phone,
  [TipoActividad.EMAIL]: Mail,
  [TipoActividad.REUNION]: Users,
  [TipoActividad.VISITA]: Building2,
  [TipoActividad.TAREA]: CheckCircle,
  [TipoActividad.NOTA]: MessageSquare,
  [TipoActividad.WHATSAPP]: MessageSquare,
}

export default function ActividadesPage() {
  const router = useRouter()
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [actividadesPendientes, setActividadesPendientes] = useState<Actividad[]>([])
  const [actividadesProximas, setActividadesProximas] = useState<Actividad[]>([])
  const [actividadesVencidas, setActividadesVencidas] = useState<Actividad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  })
  const [filters, setFilters] = useState<FiltroActividades>({
    page: 1,
    limit: 20,
    sortBy: 'fechaProgramada',
    sortOrder: 'asc',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState('todas')

  const cargarActividades = async () => {
    try {
      setIsLoading(true)
      const [todas, pendientes, proximas, vencidas] = await Promise.all([
        crmService.getActividades(filters),
        crmService.getActividadesPendientes(false),
        crmService.getActividadesProximas(false, 7),
        crmService.getActividadesVencidas(false),
      ])
      setActividades(todas.data)
      setPagination(todas.pagination)
      setActividadesPendientes(pendientes)
      setActividadesProximas(proximas)
      setActividadesVencidas(vencidas)
    } catch (error: any) {
      console.error('Error cargando actividades:', error)
      toast.error('Error al cargar las actividades')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarActividades()
  }, [filters])

  const handleFilterChange = (key: keyof FiltroActividades, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }))
  }

  const handleCompletar = async (id: string) => {
    try {
      await crmService.completarActividad(id, {
        fechaRealizacion: new Date().toISOString(),
      })
      toast.success('Actividad completada')
      cargarActividades()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al completar')
    }
  }

  const handleDescompletar = async (id: string) => {
    try {
      await crmService.descompletarActividad(id)
      toast.success('Actividad reabierta')
      cargarActividades()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al reabrir')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estas seguro de eliminar esta actividad?')) return

    try {
      await crmService.deleteActividad(id)
      toast.success('Actividad eliminada')
      cargarActividades()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    }
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'fechaProgramada',
      sortOrder: 'asc',
    })
  }

  const hasActiveFilters = filters.tipo || filters.completada !== undefined

  const renderActividadRow = (actividad: Actividad) => {
    const TipoIcon = tipoIconos[actividad.tipo] || Phone
    const isVencida = actividad.fechaProgramada && !actividad.completada && isPast(new Date(actividad.fechaProgramada))
    const esHoy = actividad.fechaProgramada && isToday(new Date(actividad.fechaProgramada))

    return (
      <TableRow
        key={actividad._id}
        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isVencida ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
      >
        <TableCell>
          <div
            className="p-2 rounded-lg w-fit"
            style={{ backgroundColor: `${TIPO_ACTIVIDAD_COLORS[actividad.tipo]}20` }}
          >
            <TipoIcon
              className="h-4 w-4"
              style={{ color: TIPO_ACTIVIDAD_COLORS[actividad.tipo] }}
            />
          </div>
        </TableCell>
        <TableCell>
          <div>
            <p className={`font-medium ${actividad.completada ? 'line-through text-gray-400' : ''}`}>
              {actividad.asunto}
            </p>
            {actividad.descripcion && (
              <p className="text-sm text-gray-500 line-clamp-1">{actividad.descripcion}</p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge
            style={{
              backgroundColor: `${TIPO_ACTIVIDAD_COLORS[actividad.tipo]}20`,
              color: TIPO_ACTIVIDAD_COLORS[actividad.tipo],
            }}
            variant="outline"
          >
            {TIPO_ACTIVIDAD_LABELS[actividad.tipo]}
          </Badge>
        </TableCell>
        <TableCell>
          {actividad.leadId && (
            <Link href={`/crm/leads/${actividad.leadId._id}`} className="text-sm hover:text-blue-600">
              {actividad.leadId.nombre}
            </Link>
          )}
          {actividad.oportunidadId && (
            <Link href={`/crm/oportunidades/${actividad.oportunidadId._id}`} className="text-sm hover:text-blue-600">
              {actividad.oportunidadId.nombre}
            </Link>
          )}
          {actividad.clienteId && (
            <Link href={`/clientes/${actividad.clienteId._id}`} className="text-sm hover:text-blue-600">
              {actividad.clienteId.nombre}
            </Link>
          )}
        </TableCell>
        <TableCell>
          {actividad.fechaProgramada ? (
            <div className={`flex items-center gap-1 ${isVencida ? 'text-red-600' : esHoy ? 'text-blue-600' : ''}`}>
              {isVencida && <AlertTriangle className="h-3 w-3" />}
              {esHoy && <Clock className="h-3 w-3" />}
              <span className="text-sm">
                {format(new Date(actividad.fechaProgramada), 'dd/MM/yyyy HH:mm', { locale: es })}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </TableCell>
        <TableCell>
          {actividad.completada ? (
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completada
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
              <Clock className="h-3 w-3 mr-1" />
              Pendiente
            </Badge>
          )}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/crm/actividades/${actividad._id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/crm/actividades/${actividad._id}/editar`)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {actividad.completada ? (
                <DropdownMenuItem onClick={() => handleDescompletar(actividad._id)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Reabrir
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleCompletar(actividad._id)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(actividad._id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Actividades</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gestion de llamadas, reuniones y tareas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={cargarActividades} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Link href="/crm/actividades/nueva">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Actividad
              </Button>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold">{actividadesPendientes.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Proximos 7 dias</p>
                <p className="text-2xl font-bold">{actividadesProximas.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{actividadesVencidas.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="pendientes">
              Pendientes
              {actividadesPendientes.length > 0 && (
                <Badge variant="secondary" className="ml-2">{actividadesPendientes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="vencidas">
              Vencidas
              {actividadesVencidas.length > 0 && (
                <Badge variant="destructive" className="ml-2">{actividadesVencidas.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="mt-4">
            {/* Filtros */}
            <Card className="p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant={showFilters ? 'secondary' : 'outline'}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {hasActiveFilters && <Badge variant="secondary" className="ml-2">Activos</Badge>}
                </Button>

                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                )}
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tipo</label>
                    <Select
                      value={filters.tipo || 'all'}
                      onValueChange={(v) => handleFilterChange('tipo', v === 'all' ? undefined : v as TipoActividad)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {Object.entries(TIPO_ACTIVIDAD_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Estado</label>
                    <Select
                      value={filters.completada === undefined ? 'all' : filters.completada ? 'completada' : 'pendiente'}
                      onValueChange={(v) => handleFilterChange('completada', v === 'all' ? undefined : v === 'completada')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pendiente">Pendientes</SelectItem>
                        <SelectItem value="completada">Completadas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </Card>

            {/* Tabla */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Relacionado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ) : actividades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">No se encontraron actividades</p>
                        <Link href="/crm/actividades/nueva">
                          <Button variant="link" className="mt-2">
                            Crear primera actividad
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    actividades.map(renderActividadRow)
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="pendientes" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Relacionado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actividadesPendientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-2" />
                        <p className="text-gray-500">No hay actividades pendientes</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    actividadesPendientes.map(renderActividadRow)
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="vencidas" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Relacionado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actividadesVencidas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-2" />
                        <p className="text-gray-500">No hay actividades vencidas</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    actividadesVencidas.map(renderActividadRow)
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
