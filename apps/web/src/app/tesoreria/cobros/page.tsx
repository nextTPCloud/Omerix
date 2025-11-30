'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { vencimientosService } from '@/services/vencimientos.service'
import { Vencimiento, ESTADOS_VENCIMIENTO } from '@/types/vencimiento.types'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'

export default function CobrosPage() {
  const router = useRouter()
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<string>('pendiente')
  const [sortBy, setSortBy] = useState('fechaVencimiento')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Estadísticas
  const [stats, setStats] = useState({
    totalPendiente: 0,
    totalVencido: 0,
    countPendientes: 0,
    countVencidos: 0,
  })

  // Dialog de cobro
  const [cobroDialog, setCobroDialog] = useState<{
    open: boolean;
    vencimiento: Vencimiento | null;
  }>({ open: false, vencimiento: null })
  const [importeCobro, setImporteCobro] = useState('')
  const [referenciaCobro, setReferenciaCobro] = useState('')

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  })

  // Cargar vencimientos
  const cargarVencimientos = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = {
        tipo: 'cobro',
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      }

      if (searchTerm) params.q = searchTerm
      if (estadoFilter && estadoFilter !== 'all') params.estado = estadoFilter

      const response = await vencimientosService.getCobros(params)
      setVencimientos(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
      }))

      if (response.stats) {
        setStats({
          totalPendiente: response.stats.totalPendiente,
          totalVencido: response.stats.totalVencido,
          countPendientes: response.stats.countPendientes,
          countVencidos: response.stats.countVencidos,
        })
      }
    } catch (error) {
      console.error('Error al cargar cobros:', error)
      toast.error('Error al cargar los cobros')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm, estadoFilter, sortBy, sortOrder])

  useEffect(() => {
    cargarVencimientos()
  }, [cargarVencimientos])

  // Handlers
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />
    return sortOrder === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
  }

  const handleRegistrarCobro = async () => {
    if (!cobroDialog.vencimiento || !importeCobro) return

    try {
      await vencimientosService.registrarCobro(cobroDialog.vencimiento._id, {
        importe: parseFloat(importeCobro),
        referencia: referenciaCobro || undefined,
      })
      toast.success('Cobro registrado correctamente')
      setCobroDialog({ open: false, vencimiento: null })
      setImporteCobro('')
      setReferenciaCobro('')
      cargarVencimientos()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar el cobro')
    }
  }

  const handleMarcarImpagado = async (id: string) => {
    try {
      await vencimientosService.marcarImpagado(id)
      toast.success('Marcado como impagado')
      cargarVencimientos()
    } catch (error) {
      toast.error('Error al marcar como impagado')
    }
  }

  const getEstadoBadge = (estado: string, estaVencido?: boolean) => {
    const config: Record<string, { color: string; icon: any }> = {
      pendiente: { color: estaVencido ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800', icon: estaVencido ? AlertTriangle : Clock },
      parcial: { color: 'bg-blue-100 text-blue-800', icon: DollarSign },
      cobrado: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      impagado: { color: 'bg-red-100 text-red-800', icon: XCircle },
      anulado: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    }

    const { color, icon: Icon } = config[estado] || config.pendiente
    const label = ESTADOS_VENCIMIENTO.find(e => e.value === estado)?.label || estado

    return (
      <Badge className={`${color} text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES')
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wallet className="h-7 w-7 text-green-600" />
              Cobros Pendientes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestión de vencimientos de clientes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cargarVencimientos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button size="sm" onClick={() => router.push('/tesoreria/cobros/nuevo')}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cobro
            </Button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendiente Total</p>
                <p className="text-lg font-bold">{formatCurrency(stats.totalPendiente)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 border-l-4 border-l-red-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencido</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalVencido)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 border-l-4 border-l-yellow-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Efectos Pendientes</p>
                <p className="text-lg font-bold">{stats.countPendientes}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 border-l-4 border-l-orange-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Efectos Vencidos</p>
                <p className="text-lg font-bold">{stats.countVencidos}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* FILTROS */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, número, factura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="parcial">Parciales</SelectItem>
              <SelectItem value="cobrado">Cobrados</SelectItem>
              <SelectItem value="impagado">Impagados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* TABLA */}
        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('numero')} className="flex items-center text-xs font-semibold uppercase">
                      Número {getSortIcon('numero')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('terceroNombre')} className="flex items-center text-xs font-semibold uppercase">
                      Cliente {getSortIcon('terceroNombre')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Factura</th>
                  <th className="px-4 py-3 text-right">
                    <button onClick={() => handleSort('importe')} className="flex items-center justify-end text-xs font-semibold uppercase w-full">
                      Importe {getSortIcon('importe')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Pendiente</th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('fechaVencimiento')} className="flex items-center text-xs font-semibold uppercase">
                      Vencimiento {getSortIcon('fechaVencimiento')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando cobros...
                    </td>
                  </tr>
                ) : vencimientos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Wallet className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron cobros</p>
                    </td>
                  </tr>
                ) : (
                  vencimientos.map((venc) => (
                    <tr key={venc._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{venc.numero}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{venc.terceroNombre}</div>
                        {venc.terceroNif && (
                          <div className="text-xs text-muted-foreground">{venc.terceroNif}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{venc.documentoNumero || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(venc.importe)}</td>
                      <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(venc.importePendiente)}</td>
                      <td className="px-4 py-3">
                        <div className={venc.estaVencido ? 'text-red-600 font-medium' : ''}>
                          {formatDate(venc.fechaVencimiento)}
                        </div>
                        {venc.diasVencido !== undefined && venc.diasVencido > 0 && (
                          <div className="text-xs text-red-500">{venc.diasVencido} días vencido</div>
                        )}
                      </td>
                      <td className="px-4 py-3">{getEstadoBadge(venc.estado, venc.estaVencido)}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/tesoreria/cobros/${venc._id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            {(venc.estado === 'pendiente' || venc.estado === 'parcial') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setCobroDialog({ open: true, vencimiento: venc })
                                  setImporteCobro(venc.importePendiente.toString())
                                }}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  Registrar cobro
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarcarImpagado(venc._id)}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Marcar impagado
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* PAGINACIÓN */}
        {pagination.total > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* DIALOG REGISTRAR COBRO */}
        <Dialog open={cobroDialog.open} onOpenChange={(open) => setCobroDialog({ open, vencimiento: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Cobro</DialogTitle>
              <DialogDescription>
                {cobroDialog.vencimiento && (
                  <div className="mt-2 space-y-1">
                    <p><strong>Cliente:</strong> {cobroDialog.vencimiento.terceroNombre}</p>
                    <p><strong>Pendiente:</strong> {formatCurrency(cobroDialog.vencimiento.importePendiente)}</p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Importe a cobrar</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={importeCobro}
                  onChange={(e) => setImporteCobro(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Referencia (opcional)</Label>
                <Input
                  value={referenciaCobro}
                  onChange={(e) => setReferenciaCobro(e.target.value)}
                  placeholder="Nº transferencia, cheque..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCobroDialog({ open: false, vencimiento: null })}>
                Cancelar
              </Button>
              <Button onClick={handleRegistrarCobro}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Registrar Cobro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
