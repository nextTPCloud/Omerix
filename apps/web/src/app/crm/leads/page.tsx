'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { crmService } from '@/services/crm.service'
import {
  Lead,
  FiltroLeads,
  EstadoLead,
  OrigenLead,
  InteresLead,
  ESTADO_LEAD_LABELS,
  ESTADO_LEAD_COLORS,
  ORIGEN_LEAD_LABELS,
  INTERES_LEAD_LABELS,
  INTERES_LEAD_COLORS,
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
import {
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  RefreshCw,
  Download,
  Phone,
  Mail,
  Building2,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  })
  const [filters, setFilters] = useState<FiltroLeads>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])

  const cargarLeads = async () => {
    try {
      setIsLoading(true)
      const response = await crmService.getLeads(filters)
      setLeads(response.data)
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Error cargando leads:', error)
      toast.error('Error al cargar los leads')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarLeads()
  }, [filters])

  const handleFilterChange = (key: keyof FiltroLeads, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }))
  }

  const handleSearch = (busqueda: string) => {
    setFilters(prev => ({
      ...prev,
      busqueda,
      page: 1,
    }))
  }

  const handleSort = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleDeleteLead = async (id: string) => {
    if (!confirm('¿Estas seguro de eliminar este lead?')) return

    try {
      await crmService.deleteLead(id)
      toast.success('Lead eliminado correctamente')
      cargarLeads()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    }
  }

  const handleDeleteMultiple = async () => {
    if (selectedLeads.length === 0) return
    if (!confirm(`¿Estas seguro de eliminar ${selectedLeads.length} leads?`)) return

    try {
      await crmService.deleteLeadsMultiple(selectedLeads)
      toast.success(`${selectedLeads.length} leads eliminados`)
      setSelectedLeads([])
      cargarLeads()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    }
  }

  const handleCambiarEstado = async (id: string, estado: EstadoLead) => {
    try {
      await crmService.cambiarEstadoLead(id, estado)
      toast.success('Estado actualizado')
      cargarLeads()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado')
    }
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  }

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map(l => l._id))
    }
  }

  const hasActiveFilters = filters.busqueda || filters.estado || filters.origen || filters.interes

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gestion de prospectos y oportunidades de negocio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={cargarLeads} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Link href="/crm/leads/nuevo">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Lead
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros y busqueda */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, email, empresa..."
                className="pl-10"
                value={filters.busqueda || ''}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Toggle filtros */}
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Activos
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Panel de filtros expandido */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-1 block">Estado</label>
                <Select
                  value={filters.estado || 'all'}
                  onValueChange={(v) => handleFilterChange('estado', v === 'all' ? undefined : v as EstadoLead)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {Object.entries(ESTADO_LEAD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Origen</label>
                <Select
                  value={filters.origen || 'all'}
                  onValueChange={(v) => handleFilterChange('origen', v === 'all' ? undefined : v as OrigenLead)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los origenes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los origenes</SelectItem>
                    {Object.entries(ORIGEN_LEAD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Interes</label>
                <Select
                  value={filters.interes || 'all'}
                  onValueChange={(v) => handleFilterChange('interes', v === 'all' ? undefined : v as InteresLead)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(INTERES_LEAD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </Card>

        {/* Acciones en lote */}
        {selectedLeads.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedLeads.length} lead(s) seleccionado(s)
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedLeads([])}>
                  Deseleccionar
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteMultiple}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Tabla de leads */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => handleSort('nombre')}
                  >
                    Lead
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => handleSort('estado')}
                  >
                    Estado
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Interes</TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => handleSort('createdAt')}
                  >
                    Fecha
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No se encontraron leads</p>
                    <Link href="/crm/leads/nuevo">
                      <Button variant="link" className="mt-2">
                        Crear primer lead
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead._id)}
                        onChange={() => toggleSelectLead(lead._id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <Link
                          href={`/crm/leads/${lead._id}`}
                          className="font-medium hover:text-blue-600 hover:underline"
                        >
                          {lead.nombre} {lead.apellidos}
                        </Link>
                        {lead.empresa && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Building2 className="h-3 w-3" />
                            {lead.empresa}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <a href={`mailto:${lead.email}`} className="hover:text-blue-600">
                              {lead.email}
                            </a>
                          </div>
                        )}
                        {lead.telefono && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <a href={`tel:${lead.telefono}`} className="hover:text-blue-600">
                              {lead.telefono}
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: `${ESTADO_LEAD_COLORS[lead.estado]}20`,
                          color: ESTADO_LEAD_COLORS[lead.estado],
                          borderColor: ESTADO_LEAD_COLORS[lead.estado],
                        }}
                        variant="outline"
                      >
                        {ESTADO_LEAD_LABELS[lead.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{ORIGEN_LEAD_LABELS[lead.origen]}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: `${INTERES_LEAD_COLORS[lead.interes]}20`,
                          color: INTERES_LEAD_COLORS[lead.interes],
                        }}
                        variant="outline"
                      >
                        {INTERES_LEAD_LABELS[lead.interes]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(lead.createdAt), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/crm/leads/${lead._id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/crm/leads/${lead._id}/editar`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleCambiarEstado(lead._id, EstadoLead.CONTACTADO)}
                            disabled={lead.estado === EstadoLead.CONTACTADO}
                          >
                            Marcar como Contactado
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCambiarEstado(lead._id, EstadoLead.CALIFICADO)}
                            disabled={lead.estado === EstadoLead.CALIFICADO}
                          >
                            Marcar como Calificado
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteLead(lead._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Paginacion */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => handleFilterChange('page', pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Pagina {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
