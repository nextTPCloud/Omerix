'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { impresorasService, Impresora } from '@/services/impresoras.service'
import vistasService from '@/services/vistas-guardadas.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  FileSpreadsheet,
  RefreshCw,
  Printer,
  XCircle,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TestTube,
  Wifi,
  Usb,
  Bluetooth,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { TableSelect } from '@/components/ui/tableSelect'
import { PrintButton } from '@/components/ui/PrintButton'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

interface ColumnFilters {
  [key: string]: string
}

const DEFAULT_IMPRESORAS_CONFIG = {
  columnas: [
    { key: 'nombre', visible: true, orden: 0 },
    { key: 'tipo', visible: true, orden: 1 },
    { key: 'tipoConexion', visible: true, orden: 2 },
    { key: 'ip', visible: true, orden: 3 },
    { key: 'activo', visible: true, orden: 4 },
  ] as ColumnaConfig[],
  sortConfig: { key: 'nombre', direction: 'asc' as const },
  columnFilters: { activo: 'true' },
  paginacion: { limit: 25 as const },
  densidad: 'normal' as const,
}

const TIPOS_IMPRESORA = [
  { value: 'ticket', label: 'Ticket', color: 'bg-blue-100 text-blue-800' },
  { value: 'cocina', label: 'Cocina', color: 'bg-orange-100 text-orange-800' },
  { value: 'etiquetas', label: 'Etiquetas', color: 'bg-purple-100 text-purple-800' },
  { value: 'fiscal', label: 'Fiscal', color: 'bg-green-100 text-green-800' },
]

const TIPOS_CONEXION = [
  { value: 'usb', label: 'USB', icon: Usb },
  { value: 'red', label: 'Red', icon: Wifi },
  { value: 'bluetooth', label: 'Bluetooth', icon: Bluetooth },
  { value: 'serie', label: 'Serie', icon: Usb },
]

export default function ImpresorasPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)

  const [impresoras, setImpresoras] = useState<Impresora[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImpresoras, setSelectedImpresoras] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    sortBy: 'nombre',
    sortOrder: 'asc' as 'asc' | 'desc',
    activo: true as boolean | undefined,
    tipo: undefined as string | undefined,
  })

  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 })
  const [showStats, setShowStats] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ids: string[]; nombres: string[] }>({
    open: false, ids: [], nombres: []
  })

  const [columnasDisponibles] = useState([
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'tipoConexion', label: 'Conexión', sortable: true },
    { key: 'ip', label: 'IP/Puerto', sortable: false },
    { key: 'activo', label: 'Estado', sortable: true },
  ])

  const {
    config: moduleConfig,
    isLoading: isLoadingConfig,
    updateColumnas,
    updateSortConfig,
    updateDensidad,
    resetConfig,
  } = useModuleConfig('impresoras', DEFAULT_IMPRESORAS_CONFIG, { autoSave: true, debounceMs: 1000 })

  const columnasVisibles = useMemo(() => {
    if (!moduleConfig) return []
    return moduleConfig.columnas.filter((col) => col.visible).sort((a, b) => a.orden - b.orden).map((col) => col.key)
  }, [moduleConfig])

  const sortConfig = useMemo(() => moduleConfig?.sortConfig || DEFAULT_IMPRESORAS_CONFIG.sortConfig, [moduleConfig])
  const densidad = useMemo(() => moduleConfig?.densidad || 'normal', [moduleConfig])
  const densityClasses = useDensityClasses(densidad)

  const stats = useMemo(() => {
    if (!impresoras?.length) return { total: 0, activos: 0, inactivos: 0 }
    return {
      total: pagination?.total || 0,
      activos: impresoras.filter(e => e?.activo).length,
      inactivos: impresoras.filter(e => !e?.activo).length,
    }
  }, [impresoras, pagination?.total])

  const cargarImpresoras = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = { page: filters.page, limit: filters.limit, sortBy: filters.sortBy, sortOrder: filters.sortOrder }
      if (filters.activo !== undefined) params.activo = filters.activo
      if (filters.tipo) params.tipo = filters.tipo

      const response = await impresorasService.getAll(params)
      if (response.success) {
        setImpresoras(response.data || [])
        setPagination(response.pagination || { page: 1, limit: 25, total: 0, pages: 0 })
      } else {
        setImpresoras([])
        toast.error('Error al cargar las impresoras')
      }
    } catch (error) {
      setImpresoras([])
      toast.error('Error al cargar las impresoras')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => { cargarImpresoras() }, [cargarImpresoras])

  useEffect(() => {
    const combinedFilters: any = {
      page: 1,
      sortBy: sortConfig.key,
      sortOrder: sortConfig.direction,
      limit: moduleConfig?.paginacion?.limit || 25,
    }

    if (debouncedColumnFilters.nombre) combinedFilters.q = debouncedColumnFilters.nombre
    if (debouncedColumnFilters.activo && debouncedColumnFilters.activo !== 'all') {
      combinedFilters.activo = debouncedColumnFilters.activo === 'true'
    }
    if (debouncedColumnFilters.tipo && debouncedColumnFilters.tipo !== 'all') {
      combinedFilters.tipo = debouncedColumnFilters.tipo
    }

    setFilters(combinedFilters)
  }, [debouncedColumnFilters, sortConfig, moduleConfig?.paginacion?.limit])

  useEffect(() => {
    if (!moduleConfig || isLoadingConfig || !isInitialLoad.current) return
    const initialFilters = moduleConfig?.columnFilters && Object.keys(moduleConfig.columnFilters).length > 0
      ? moduleConfig.columnFilters : { activo: 'true' }
    setColumnFiltersInput(initialFilters as any)
    isInitialLoad.current = false
  }, [moduleConfig, isLoadingConfig])

  const handleSort = (key: string) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    updateSortConfig({ key, direction })
  }

  const getSortIcon = (column: string) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
  }

  const handleColumnFilterInput = (column: string, value: string) => {
    const newFilters = { ...columnFiltersInput }
    if (value === '' || value === 'all') delete newFilters[column]
    else newFilters[column] = value
    setColumnFiltersInput(newFilters)
  }

  const handleSelectAll = () => {
    setSelectedImpresoras(selectAll ? [] : impresoras.map(e => e._id))
    setSelectAll(!selectAll)
  }

  const handleSelect = (id: string) => {
    setSelectedImpresoras(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleDeleteConfirm = async () => {
    try {
      await Promise.all(deleteDialog.ids.map(id => impresorasService.delete(id)))
      toast.success('Impresora(s) eliminada(s) correctamente')
      cargarImpresoras()
      setSelectedImpresoras([])
      setSelectAll(false)
      setDeleteDialog({ open: false, ids: [], nombres: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleAction = async (id: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/impresoras/${id}`)
        break
      case 'edit':
        router.push(`/impresoras/${id}/editar`)
        break
      case 'test':
        try {
          const response = await impresorasService.test(id)
          if (response.success) toast.success(response.message || 'Prueba enviada correctamente')
          else toast.error('Error en la prueba de impresión')
        } catch (error) {
          toast.error('Error al probar la impresora')
        }
        break
      case 'delete':
        const item = impresoras.find(e => e._id === id)
        if (item) setDeleteDialog({ open: true, ids: [id], nombres: [item.nombre] })
        break
    }
  }

  const toggleColumna = (key: string) => {
    if (!moduleConfig) return
    const newColumnas = moduleConfig.columnas.map((col) => {
      if (col.key === key) {
        const visibleCount = moduleConfig.columnas.filter((c) => c.visible).length
        if (col.visible && visibleCount <= 1) {
          toast.warning('Debe haber al menos una columna visible')
          return col
        }
        return { ...col, visible: !col.visible }
      }
      return col
    })
    updateColumnas(newColumnas)
  }

  const getPageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  if (isLoadingConfig) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando configuración...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Printer className="h-7 w-7 text-primary" />
              Impresoras
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona las impresoras del sistema</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
              {showStats ? <Eye className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button variant="outline" size="sm" onClick={cargarImpresoras}>
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            <Button asChild size="sm">
              <Link href="/impresoras/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nueva Impresora</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-green-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Printer className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Activas</p>
                  <p className="text-xl font-bold">{stats.activos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Inactivas</p>
                  <p className="text-xl font-bold">{stats.inactivos}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* BARRA DE HERRAMIENTAS */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <SettingsMenu
              densidad={densidad}
              onDensidadChange={(d) => { updateDensidad(d); toast.success(`Densidad cambiada a ${d}`) }}
              modulo="impresoras"
              configuracionActual={moduleConfig}
              onAplicarVista={() => {}}
              onGuardarVista={async () => {}}
              onRestablecer={async () => { await resetConfig(); toast.success('Configuración restablecida') }}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns className="h-4 w-4 sm:mr-2 shrink-0" />
                  <span className="hidden sm:inline">Columnas</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columnasDisponibles.map((columna) => (
                  <DropdownMenuCheckboxItem key={columna.key} checked={columnasVisibles.includes(columna.key)} onCheckedChange={() => toggleColumna(columna.key)}>
                    {columna.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <ExportButton data={impresoras} columns={columnasDisponibles.filter((col) => columnasVisibles.includes(col.key)).map((col) => ({ key: col.key, label: col.label }))} filename="impresoras" stats={[{ label: 'Total', value: stats.total }]} />
            <PrintButton data={impresoras} columns={columnasDisponibles.filter((col) => columnasVisibles.includes(col.key)).map((col) => ({ key: col.key, label: col.label }))} title="Listado de Impresoras" stats={[{ label: 'Total', value: stats.total }]} filters={columnFiltersInput} />
          </div>
        </div>

        {/* TABLA */}
        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className={`${densityClasses.header} sticky left-0 z-30 bg-muted/50 backdrop-blur-sm text-left w-10`}>
                    <div className="flex items-center justify-center">
                      <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                    </div>
                  </th>

                  {columnasVisibles.includes('nombre') && (
                    <th className={`${densityClasses.header} text-left`}>
                      <button onClick={() => handleSort('nombre')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Nombre {getSortIcon('nombre')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('tipo') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <button onClick={() => handleSort('tipo')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Tipo {getSortIcon('tipo')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('tipoConexion') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">Conexión</span>
                    </th>
                  )}

                  {columnasVisibles.includes('ip') && (
                    <th className={`${densityClasses.header} text-left w-[150px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">IP/Puerto</span>
                    </th>
                  )}

                  {columnasVisibles.includes('activo') && (
                    <th className={`${densityClasses.header} text-left w-[100px]`}>
                      <button onClick={() => handleSort('activo')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Estado {getSortIcon('activo')}
                      </button>
                    </th>
                  )}

                  <th className={`${densityClasses.header} sticky right-0 z-30 bg-muted/50 backdrop-blur-sm text-right min-w-[70px] text-xs font-semibold uppercase tracking-wider`}>
                    Acciones
                  </th>
                </tr>

                {/* FILTROS */}
                <tr className="border-b bg-card">
                  <th className="sticky left-0 z-30 bg-card px-3 py-1.5"></th>
                  {columnasVisibles.includes('nombre') && (
                    <th className="px-3 py-1.5">
                      <Input placeholder="Filtrar..." className="h-7 text-xs" value={columnFiltersInput.nombre || ''} onChange={(e) => handleColumnFilterInput('nombre', e.target.value)} />
                    </th>
                  )}
                  {columnasVisibles.includes('tipo') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.tipo || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('tipo', value)}
                        placeholder="Todos"
                        options={[{ value: 'all', label: 'Todos' }, ...TIPOS_IMPRESORA.map(t => ({ value: t.value, label: t.label }))]}
                      />
                    </th>
                  )}
                  {columnasVisibles.includes('tipoConexion') && <th className="px-3 py-1.5"></th>}
                  {columnasVisibles.includes('ip') && <th className="px-3 py-1.5"></th>}
                  {columnasVisibles.includes('activo') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.activo || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('activo', value)}
                        placeholder="Todos"
                        options={[{ value: 'all', label: 'Todos' }, { value: 'true', label: 'Activas' }, { value: 'false', label: 'Inactivas' }]}
                      />
                    </th>
                  )}
                  <th className="sticky right-0 z-30 bg-card px-3 py-1.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />Cargando impresoras...
                  </td></tr>
                ) : impresoras.length === 0 ? (
                  <tr><td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    <Printer className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">No se encontraron impresoras</p>
                  </td></tr>
                ) : (
                  impresoras.map((impresora) => {
                    const tipoInfo = TIPOS_IMPRESORA.find(t => t.value === impresora.tipo)
                    const conexionInfo = TIPOS_CONEXION.find(c => c.value === impresora.tipoConexion)
                    const ConexionIcon = conexionInfo?.icon || Wifi

                    return (
                      <tr key={impresora._id} className="hover:bg-muted/30 transition-colors group">
                        <td className={`${densityClasses.cell} sticky left-0 z-20 bg-card group-hover:bg-muted/50 transition-colors`}>
                          <div className="flex items-center justify-center">
                            <Checkbox checked={selectedImpresoras.includes(impresora._id)} onCheckedChange={() => handleSelect(impresora._id)} />
                          </div>
                        </td>

                        {columnasVisibles.includes('nombre') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>{impresora.nombre}</td>
                        )}

                        {columnasVisibles.includes('tipo') && (
                          <td className={`${densityClasses.cell}`}>
                            <Badge className={tipoInfo?.color}>{tipoInfo?.label || impresora.tipo}</Badge>
                          </td>
                        )}

                        {columnasVisibles.includes('tipoConexion') && (
                          <td className={`${densityClasses.cell}`}>
                            <div className="flex items-center gap-2">
                              <ConexionIcon className="h-4 w-4" />
                              <span className="text-sm">{conexionInfo?.label || impresora.tipoConexion}</span>
                            </div>
                          </td>
                        )}

                        {columnasVisibles.includes('ip') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} font-mono text-xs`}>
                            {impresora.tipoConexion === 'red' ? `${impresora.ip || '-'}:${impresora.puerto || '-'}` : impresora.puertoSerie || '-'}
                          </td>
                        )}

                        {columnasVisibles.includes('activo') && (
                          <td className={`${densityClasses.cell}`}>
                            <Badge variant={impresora.activo ? 'default' : 'secondary'} className={`text-xs font-medium ${impresora.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}>
                              {impresora.activo ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </td>
                        )}

                        <td className={`${densityClasses.cell} sticky right-0 z-20 bg-card group-hover:bg-muted/50 transition-colors text-right`}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleAction(impresora._id, 'view')}><Eye className="mr-2 h-4 w-4" />Ver</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(impresora._id, 'edit')}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(impresora._id, 'test')}><TestTube className="mr-2 h-4 w-4" />Probar impresión</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleAction(impresora._id, 'delete')}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* PAGINACIÓN */}
        {pagination.total > 0 && (
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar</span>
                <Select value={pagination.limit.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, limit: Number(value), page: 1 }))}>
                  <SelectTrigger className="w-[80px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">de <span className="font-medium">{pagination.total}</span> registros</span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: 1 }))} disabled={pagination.page === 1} className="h-9 w-9 p-0"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={pagination.page === 1} className="h-9 w-9 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                {getPageNumbers(pagination.page, pagination.pages).map((pageNum, idx) => pageNum === '...' ? (
                  <div key={`ellipsis-${idx}`} className="h-9 w-9 flex items-center justify-center"><span className="text-muted-foreground">...</span></div>
                ) : (
                  <Button key={pageNum} variant={pagination.page === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setFilters(prev => ({ ...prev, page: pageNum as number }))} className="h-9 w-9 p-0">{pageNum}</Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))} disabled={pagination.page === pagination.pages} className="h-9 w-9 p-0"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: pagination.pages }))} disabled={pagination.page === pagination.pages} className="h-9 w-9 p-0"><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        )}

        {/* DIALOG ELIMINAR */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar {deleteDialog.ids.length === 1 ? 'la siguiente impresora' : `las siguientes ${deleteDialog.ids.length} impresoras`}?
                <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                  {deleteDialog.nombres.map((nombre, index) => (<li key={index} className="text-sm font-medium">• {nombre}</li>))}
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, ids: [], nombres: [] })}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>Eliminar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
