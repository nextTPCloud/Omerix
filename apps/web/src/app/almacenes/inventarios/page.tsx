'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  inventariosService,
  Inventario,
  EstadoInventario,
  TipoInventario,
  SearchInventariosParams,
} from '@/services/inventarios.service'
import { almacenesService } from '@/services/almacenes.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Play,
  CheckCircle2,
  XCircle,
  BarChart3,
  Warehouse,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function InventariosPage() {
  const router = useRouter()

  // Estado de datos
  const [inventarios, setInventarios] = useState<Inventario[]>([])
  const [estadisticas, setEstadisticas] = useState({
    enConteo: 0,
    pendienteRevision: 0,
    regularizados: 0,
    anulados: 0,
  })
  const [almacenes, setAlmacenes] = useState<{ _id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Estado de filtros
  const [filters, setFilters] = useState<SearchInventariosParams>({
    q: '',
    almacenId: '',
    tipo: undefined,
    estado: undefined,
    page: 1,
    limit: 20,
  })
  const [showFilters, setShowFilters] = useState(false)

  // Estado de paginación
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })

  // Estado para diálogos
  const [showAnularDialog, setShowAnularDialog] = useState(false)
  const [inventarioToAnular, setInventarioToAnular] = useState<Inventario | null>(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')

  useEffect(() => {
    loadData()
  }, [filters])

  useEffect(() => {
    loadAlmacenes()
    loadEstadisticas()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const cleanFilters = { ...filters }
      if (!cleanFilters.almacenId) delete cleanFilters.almacenId
      if (!cleanFilters.tipo) delete cleanFilters.tipo
      if (!cleanFilters.estado) delete cleanFilters.estado
      if (!cleanFilters.q) delete cleanFilters.q

      const res = await inventariosService.listar(cleanFilters)
      setInventarios(res.data)
      setPagination(res.pagination)
    } catch (error) {
      console.error('Error cargando inventarios:', error)
      toast.error('Error al cargar los inventarios')
    } finally {
      setLoading(false)
    }
  }

  const loadAlmacenes = async () => {
    try {
      const res = await almacenesService.getActivos()
      setAlmacenes(res.data || [])
    } catch (error) {
      console.error('Error cargando almacenes:', error)
    }
  }

  const loadEstadisticas = async () => {
    try {
      const res = await inventariosService.estadisticas()
      setEstadisticas(res.data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, q: value, page: 1 }))
  }

  const handleFilterChange = (key: keyof SearchInventariosParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleIniciar = async (inventario: Inventario) => {
    setActionLoading(true)
    try {
      await inventariosService.iniciar(inventario._id)
      toast.success('Inventario iniciado correctamente')
      loadData()
      loadEstadisticas()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar el inventario')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAnular = async () => {
    if (!inventarioToAnular || !motivoAnulacion.trim()) {
      toast.error('El motivo de anulación es obligatorio')
      return
    }

    setActionLoading(true)
    try {
      await inventariosService.anular(inventarioToAnular._id, motivoAnulacion)
      toast.success('Inventario anulado correctamente')
      setShowAnularDialog(false)
      setInventarioToAnular(null)
      setMotivoAnulacion('')
      loadData()
      loadEstadisticas()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al anular el inventario')
    } finally {
      setActionLoading(false)
    }
  }

  const getEstadoIcon = (estado: EstadoInventario) => {
    switch (estado) {
      case EstadoInventario.EN_CONTEO:
        return <ClipboardList className="h-4 w-4" />
      case EstadoInventario.PENDIENTE_REVISION:
        return <AlertTriangle className="h-4 w-4" />
      case EstadoInventario.REGULARIZADO:
        return <CheckCircle2 className="h-4 w-4" />
      case EstadoInventario.ANULADO:
        return <XCircle className="h-4 w-4" />
      default:
        return <FileCheck className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              Inventarios Físicos
            </h1>
            <p className="text-muted-foreground">Gestión de inventarios y regularización de stock</p>
          </div>
          <Link href="/almacenes/inventarios/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Inventario
            </Button>
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{estadisticas.enConteo}</div>
                  <div className="text-sm text-muted-foreground">En conteo</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{estadisticas.pendienteRevision}</div>
                  <div className="text-sm text-muted-foreground">Pend. revisión</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{estadisticas.regularizados}</div>
                  <div className="text-sm text-muted-foreground">Regularizados</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{estadisticas.anulados}</div>
                  <div className="text-sm text-muted-foreground">Anulados</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código..."
                    value={filters.q}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" onClick={loadData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Almacén</Label>
                  <Select
                    value={filters.almacenId || 'all'}
                    onValueChange={(v) => handleFilterChange('almacenId', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {almacenes.map((a) => (
                        <SelectItem key={a._id} value={a._id}>{a.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={filters.tipo || 'all'}
                    onValueChange={(v) => handleFilterChange('tipo', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="total">Total</SelectItem>
                      <SelectItem value="parcial">Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={filters.estado || 'all'}
                    onValueChange={(v) => handleFilterChange('estado', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="en_conteo">En conteo</SelectItem>
                      <SelectItem value="pendiente_revision">Pendiente revisión</SelectItem>
                      <SelectItem value="regularizado">Regularizado</SelectItem>
                      <SelectItem value="anulado">Anulado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : inventarios.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron inventarios</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Almacén</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-center">Productos</TableHead>
                      <TableHead className="text-center">Contados</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventarios.map((inv) => (
                      <TableRow key={inv._id}>
                        <TableCell className="font-medium">{inv.codigo}</TableCell>
                        <TableCell>{inv.almacenNombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {inventariosService.getTipoLabel(inv.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={inventariosService.getEstadoVariant(inv.estado)}
                            className="flex items-center gap-1 w-fit"
                          >
                            {getEstadoIcon(inv.estado)}
                            {inventariosService.getEstadoLabel(inv.estado)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{inv.totalProductos}</TableCell>
                        <TableCell className="text-center">
                          <span className={inv.productosContados < inv.totalProductos ? 'text-amber-600' : 'text-green-600'}>
                            {inv.productosContados}
                          </span>
                          <span className="text-muted-foreground">/{inv.totalProductos}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={
                            inv.valorDiferencia > 0 ? 'text-green-600' :
                            inv.valorDiferencia < 0 ? 'text-red-600' : ''
                          }>
                            {formatCurrency(inv.valorDiferencia)}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(inv.fechaCreacion)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Link href={`/almacenes/inventarios/${inv._id}`}>
                              <Button variant="ghost" size="icon" title="Ver detalle">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {inventariosService.puedeIniciar(inv.estado) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Iniciar conteo"
                                onClick={() => handleIniciar(inv)}
                                disabled={actionLoading}
                              >
                                <Play className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            {inventariosService.puedeAnular(inv.estado) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Anular"
                                onClick={() => {
                                  setInventarioToAnular(inv)
                                  setShowAnularDialog(true)
                                }}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} resultados
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo Anular */}
      <Dialog open={showAnularDialog} onOpenChange={setShowAnularDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Inventario</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El inventario será marcado como anulado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-700">
                Al anular el inventario no se aplicarán los ajustes pendientes.
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo de anulación *</Label>
              <Textarea
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Indique el motivo de la anulación..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnularDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleAnular}
              disabled={actionLoading || !motivoAnulacion.trim()}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Anulando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Anular Inventario
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
