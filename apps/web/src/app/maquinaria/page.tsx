'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { maquinariaService } from '@/services/maquinaria.service'
import vistasService from '@/services/vistas-guardadas.service'
import { Maquinaria, TIPOS_MAQUINARIA, ESTADOS_MAQUINARIA } from '@/types/maquinaria.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowUp, ArrowDown, ArrowUpDown, Plus, Search, Edit, Eye, Trash2, MoreHorizontal,
  RefreshCw, Columns, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle, XCircle, Copy, Truck, Wrench, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { usePermissions } from '@/hooks/usePermissions'
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

interface ColumnFilters { [key: string]: string }
interface MaquinariaFilters {
  page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc'
  q?: string; activo?: boolean; tipo?: string; estado?: string
}

const DEFAULT_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'tipo', visible: true, orden: 2 },
    { key: 'matricula', visible: true, orden: 3 },
    { key: 'estado', visible: true, orden: 4 },
    { key: 'tarifaHoraVenta', visible: true, orden: 5 },
    { key: 'activo', visible: true, orden: 6 },
  ] as ColumnaConfig[],
  sortConfig: { key: 'orden', direction: 'asc' as const },
  columnFilters: { activo: 'true' },
  paginacion: { limit: 25 as const },
  densidad: 'normal' as const,
}

export default function MaquinariaPage() {
  const router = useRouter()
  const { canCreate, canDelete } = usePermissions()
  const isInitialLoad = useRef(true)
  const [maquinarias, setMaquinarias] = useState<Maquinaria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)
  const [filters, setFilters] = useState<MaquinariaFilters>({ page: 1, limit: 25, sortBy: 'orden', sortOrder: 'asc', activo: true })
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 })
  const [showStats, setShowStats] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ids: string[]; nombres: string[] }>({ open: false, ids: [], nombres: [] })

  const columnasDisponibles = [
    { key: 'codigo', label: 'Codigo', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'matricula', label: 'Matricula', sortable: true },
    { key: 'estado', label: 'Estado Op.', sortable: true },
    { key: 'tarifaHoraVenta', label: 'Tarifa/h', sortable: true },
    { key: 'activo', label: 'Activo', sortable: true },
  ]

  const { config: moduleConfig, isLoading: isLoadingConfig, updateColumnas, updateSortConfig, updateDensidad, resetConfig } = useModuleConfig('maquinaria', DEFAULT_CONFIG, { autoSave: true, debounceMs: 1000 })

  const columnasVisibles = useMemo(() => moduleConfig?.columnas.filter(col => col.visible).sort((a, b) => a.orden - b.orden).map(col => col.key) || [], [moduleConfig])
  const sortConfig = useMemo(() => moduleConfig?.sortConfig || DEFAULT_CONFIG.sortConfig, [moduleConfig])
  const densidad = useMemo(() => moduleConfig?.densidad || 'normal', [moduleConfig])
  const densityClasses = useDensityClasses(densidad)
  const currentLimit = useMemo(() => moduleConfig?.paginacion?.limit || 25, [moduleConfig?.paginacion?.limit])

  const stats = useMemo(() => ({
    total: pagination?.total || 0,
    disponibles: maquinarias.filter(m => m?.estado === 'disponible').length,
    enUso: maquinarias.filter(m => m?.estado === 'en_uso').length,
    mantenimiento: maquinarias.filter(m => m?.estado === 'mantenimiento').length,
  }), [maquinarias, pagination?.total])

  const cargarMaquinarias = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = { page: filters.page, limit: filters.limit, sortBy: filters.sortBy, sortOrder: filters.sortOrder }
      if (filters.q) params.q = filters.q
      if (filters.activo !== undefined) params.activo = filters.activo
      if (filters.tipo) params.tipo = filters.tipo
      if (filters.estado) params.estado = filters.estado
      const response = await maquinariaService.getAll(params)
      if (response.data) {
        setMaquinarias(response.data || [])
        const pag = response.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      } else {
        setMaquinarias([])
        toast.error('Error al cargar la maquinaria')
      }
    } catch (error) {
      setMaquinarias([])
      toast.error('Error al cargar la maquinaria')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => { cargarMaquinarias() }, [cargarMaquinarias])

  useEffect(() => {
    const combinedFilters: any = { page: 1, sortBy: sortConfig.key, sortOrder: sortConfig.direction, limit: currentLimit }
    const searchableFields = ['codigo', 'nombre', 'matricula']
    const searchTerms: string[] = []
    searchableFields.forEach(field => { if (debouncedColumnFilters[field]) searchTerms.push(debouncedColumnFilters[field]) })
    if (searchTerms.length > 0) combinedFilters.q = searchTerms.join(' ')
    if (debouncedColumnFilters.activo && debouncedColumnFilters.activo !== 'all') combinedFilters.activo = debouncedColumnFilters.activo === 'true'
    if (debouncedColumnFilters.tipo && debouncedColumnFilters.tipo !== 'all') combinedFilters.tipo = debouncedColumnFilters.tipo
    if (debouncedColumnFilters.estado && debouncedColumnFilters.estado !== 'all') combinedFilters.estado = debouncedColumnFilters.estado
    setFilters(combinedFilters)
  }, [debouncedColumnFilters, sortConfig, currentLimit])

  useEffect(() => {
    if (!moduleConfig || isLoadingConfig || !isInitialLoad.current) return
    const initialFilters = moduleConfig?.columnFilters && Object.keys(moduleConfig.columnFilters).length > 0 ? moduleConfig.columnFilters : { activo: 'true' }
    setColumnFiltersInput(initialFilters as any)
    isInitialLoad.current = false
  }, [moduleConfig, isLoadingConfig])

  const handleAplicarVista = useCallback((config: any) => {
    if (config.columnas) updateColumnas(config.columnas)
    if (config.sortConfig) updateSortConfig(config.sortConfig)
    if (config.columnFilters) setColumnFiltersInput(config.columnFilters as any)
    if (config.densidad) updateDensidad(config.densidad)
    if (config.paginacion?.limit) setFilters(prev => ({ ...prev, limit: config.paginacion.limit }))
    toast.success('Vista aplicada correctamente')
  }, [updateColumnas, updateSortConfig, updateDensidad])

  const handleGuardarVista = useCallback(async (nombre: string, descripcion?: string, esDefault?: boolean, vistaId?: string) => {
    try {
      if (vistaId) {
        await vistasService.update(vistaId, { modulo: 'maquinaria', nombre, descripcion, configuracion: moduleConfig, esDefault: esDefault || false })
        toast.success(`Vista "${nombre}" actualizada`)
      } else {
        await vistasService.create({ modulo: 'maquinaria', nombre, descripcion, configuracion: moduleConfig, esDefault: esDefault || false })
        toast.success(`Vista "${nombre}" guardada`)
      }
    } catch (error) { toast.error('Error al guardar la vista'); throw error }
  }, [moduleConfig])

  useEffect(() => {
    const cargarVistaDefault = async () => {
      try {
        const vistas = await vistasService.getAll('maquinaria', true)
        const vistaDefault = vistas?.find((v: any) => v.esDefault)
        if (vistaDefault?.configuracion) handleAplicarVista(vistaDefault.configuracion)
      } catch (error) { console.error('Error al cargar vista por defecto:', error) }
    }
    cargarVistaDefault()
  }, [handleAplicarVista])

  const handleSearch = (value: string) => { setSearchTerm(value); setFilters(prev => ({ ...prev, q: value, page: 1 })) }
  const handleSort = (key: string) => { const dir = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'; updateSortConfig({ key, direction: dir }) }
  const getSortIcon = (col: string) => sortConfig.key !== col ? <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" /> : sortConfig.direction === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
  const handleColumnFilterInput = (col: string, val: string) => { const newF = { ...columnFiltersInput }; if (val === '' || val === 'all') delete newF[col]; else newF[col] = val; setColumnFiltersInput(newF) }
  const handleSelectAll = () => { if (selectAll) setSelectedItems([]); else setSelectedItems(maquinarias.map(f => f._id)); setSelectAll(!selectAll) }
  const handleSelectItem = (id: string) => { if (selectedItems.includes(id)) setSelectedItems(selectedItems.filter(i => i !== id)); else setSelectedItems([...selectedItems, id]) }
  const toggleColumna = (key: string) => { if (!moduleConfig) return; const newCols = moduleConfig.columnas.map(col => { if (col.key === key) { const visCount = moduleConfig.columnas.filter(c => c.visible).length; if (col.visible && visCount <= 1) { toast.warning('Debe haber al menos una columna visible'); return col } return { ...col, visible: !col.visible } } return col }); updateColumnas(newCols) }
  const handleDeleteConfirm = async () => { try { await maquinariaService.deleteMany(deleteDialog.ids); toast.success('Maquinaria(s) eliminada(s)'); cargarMaquinarias(); setSelectedItems([]); setSelectAll(false); setDeleteDialog({ open: false, ids: [], nombres: [] }) } catch { toast.error('Error al eliminar') } }
  const handleDuplicar = async (id: string) => {
    try {
      const response = await maquinariaService.duplicar(id)
      if (response.success && response.data) {
        toast.success('Maquinaria duplicada correctamente')
        router.push(`/maquinaria/${response.data._id}/editar`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al duplicar')
    }
  }
  const handleAction = async (id: string, action: string) => {
    switch (action) {
      case 'view': router.push(`/maquinaria/${id}`); break
      case 'edit': router.push(`/maquinaria/${id}/editar`); break
      case 'duplicate': handleDuplicar(id); break
      case 'delete': const f = maquinarias.find(fp => fp._id === id); if (f) setDeleteDialog({ open: true, ids: [id], nombres: [f.nombre] }); break
    }
  }
  const handleBulkAction = (action: string) => {
    if (action === 'delete' && selectedItems.length > 0) {
      const nombres = maquinarias.filter(f => selectedItems.includes(f._id)).map(f => f.nombre)
      setDeleteDialog({ open: true, ids: selectedItems, nombres })
    }
  }
  const getPageNumbers = (cur: number, total: number): (number | string)[] => {
    const pages: (number | string)[] = []; if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i) } else { pages.push(1); if (cur > 3) pages.push('...'); const start = Math.max(2, cur - 1); const end = Math.min(total - 1, cur + 1); for (let i = start; i <= end; i++) pages.push(i); if (cur < total - 2) pages.push('...'); pages.push(total) }
    return pages
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'disponible': return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Disponible</Badge>
      case 'en_uso': return <Badge variant="default" className="bg-blue-100 text-blue-800"><Truck className="h-3 w-3 mr-1" />En uso</Badge>
      case 'mantenimiento': return <Badge variant="default" className="bg-yellow-100 text-yellow-800"><Wrench className="h-3 w-3 mr-1" />Mantenimiento</Badge>
      case 'baja': return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Baja</Badge>
      default: return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (isLoadingConfig) return <DashboardLayout><div className="flex items-center justify-center h-[calc(100vh-4rem)]"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Truck className="h-7 w-7 text-primary" />Maquinaria</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestion de vehiculos, maquinaria y equipos</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}><Eye className="h-4 w-4" /><span className="ml-2 hidden sm:inline">Estadisticas</span></Button>
            <Button variant="outline" size="sm" onClick={cargarMaquinarias}><RefreshCw className="h-4 w-4" /><span className="ml-2 hidden sm:inline">Actualizar</span></Button>
            {canCreate('maquinaria') && (
              <Button asChild size="sm"><Link href="/maquinaria/nuevo"><Plus className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Nueva</span></Link></Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg"><Truck className="h-4 w-4 text-blue-600" /></div><div><p className="text-xs text-muted-foreground font-medium">Total</p><p className="text-xl font-bold">{stats.total}</p></div></div></Card>
            <Card className="p-3 border-l-4 border-l-green-500"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg"><CheckCircle className="h-4 w-4 text-green-600" /></div><div><p className="text-xs text-muted-foreground font-medium">Disponibles</p><p className="text-xl font-bold">{stats.disponibles}</p></div></div></Card>
            <Card className="p-3 border-l-4 border-l-blue-500"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg"><Truck className="h-4 w-4 text-blue-600" /></div><div><p className="text-xs text-muted-foreground font-medium">En uso</p><p className="text-xl font-bold">{stats.enUso}</p></div></div></Card>
            <Card className="p-3 border-l-4 border-l-yellow-500"><div className="flex items-center gap-3"><div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg"><Wrench className="h-4 w-4 text-yellow-600" /></div><div><p className="text-xs text-muted-foreground font-medium">Mantenimiento</p><p className="text-xl font-bold">{stats.mantenimiento}</p></div></div></Card>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por codigo, nombre, matricula..." value={searchTerm} onChange={(e) => handleSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <SettingsMenu densidad={densidad} onDensidadChange={(d) => { updateDensidad(d); toast.success(`Densidad: ${d}`) }} modulo="maquinaria" configuracionActual={moduleConfig} onAplicarVista={handleAplicarVista} onGuardarVista={handleGuardarVista} onRestablecer={async () => { await resetConfig(); toast.success('Configuracion restablecida') }} />
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Columns className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Columnas</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel>Columnas visibles</DropdownMenuLabel><DropdownMenuSeparator />{columnasDisponibles.map(col => (<DropdownMenuCheckboxItem key={col.key} checked={columnasVisibles.includes(col.key)} onCheckedChange={() => toggleColumna(col.key)}>{col.label}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu>
            <ExportButton data={maquinarias} columns={columnasDisponibles.filter(c => columnasVisibles.includes(c.key)).map(c => ({ key: c.key, label: c.label }))} filename="maquinaria" stats={[{ label: 'Total', value: stats.total }, { label: 'Disponibles', value: stats.disponibles }]} />
            <PrintButton data={maquinarias} columns={columnasDisponibles.filter(c => columnasVisibles.includes(c.key)).map(c => ({ key: c.key, label: c.label }))} title="Listado de Maquinaria" stats={[{ label: 'Total', value: stats.total }, { label: 'Disponibles', value: stats.disponibles }]} filters={columnFiltersInput} />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{selectedItems.length} seleccionado(s)</span>
              <div className="flex-1" />
              {canDelete('maquinaria') && (
                <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
              )}
            </div>
          </Card>
        )}

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className={`${densityClasses.header} sticky left-0 z-30 bg-muted/50 text-left w-10`}><Checkbox checked={selectAll} onCheckedChange={handleSelectAll} /></th>
                  {columnasVisibles.includes('codigo') && <th className={`${densityClasses.header} text-left w-[100px]`}><button onClick={() => handleSort('codigo')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider">Codigo{getSortIcon('codigo')}</button></th>}
                  {columnasVisibles.includes('nombre') && <th className={`${densityClasses.header} text-left w-[200px]`}><button onClick={() => handleSort('nombre')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider">Nombre{getSortIcon('nombre')}</button></th>}
                  {columnasVisibles.includes('tipo') && <th className={`${densityClasses.header} text-left w-[120px]`}><button onClick={() => handleSort('tipo')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider">Tipo{getSortIcon('tipo')}</button></th>}
                  {columnasVisibles.includes('matricula') && <th className={`${densityClasses.header} text-left w-[100px]`}><button onClick={() => handleSort('matricula')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider">Matricula{getSortIcon('matricula')}</button></th>}
                  {columnasVisibles.includes('estado') && <th className={`${densityClasses.header} text-left w-[130px]`}><button onClick={() => handleSort('estado')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider">Estado Op.{getSortIcon('estado')}</button></th>}
                  {columnasVisibles.includes('tarifaHoraVenta') && <th className={`${densityClasses.header} text-left w-[100px]`}><button onClick={() => handleSort('tarifaHoraVenta')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider">Tarifa/h{getSortIcon('tarifaHoraVenta')}</button></th>}
                  {columnasVisibles.includes('activo') && <th className={`${densityClasses.header} text-left w-[80px]`}><button onClick={() => handleSort('activo')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider">Activo{getSortIcon('activo')}</button></th>}
                  <th className={`${densityClasses.header} sticky right-0 z-30 bg-muted/50 text-right min-w-[70px]`}>Acciones</th>
                </tr>
                <tr className="border-b bg-card">
                  <th className="sticky left-0 z-30 bg-card px-3 py-1.5"></th>
                  {columnasVisibles.includes('codigo') && <th className="px-3 py-1.5"><Input placeholder="Filtrar..." className="h-7 text-xs" value={columnFiltersInput.codigo || ''} onChange={(e) => handleColumnFilterInput('codigo', e.target.value)} /></th>}
                  {columnasVisibles.includes('nombre') && <th className="px-3 py-1.5"><Input placeholder="Filtrar..." className="h-7 text-xs" value={columnFiltersInput.nombre || ''} onChange={(e) => handleColumnFilterInput('nombre', e.target.value)} /></th>}
                  {columnasVisibles.includes('tipo') && <th className="px-3 py-1.5"><TableSelect value={columnFiltersInput.tipo || 'all'} onValueChange={(v) => handleColumnFilterInput('tipo', v)} placeholder="Todos" options={[{ value: 'all', label: 'Todos' }, ...TIPOS_MAQUINARIA]} /></th>}
                  {columnasVisibles.includes('matricula') && <th className="px-3 py-1.5"><Input placeholder="Filtrar..." className="h-7 text-xs" value={columnFiltersInput.matricula || ''} onChange={(e) => handleColumnFilterInput('matricula', e.target.value)} /></th>}
                  {columnasVisibles.includes('estado') && <th className="px-3 py-1.5"><TableSelect value={columnFiltersInput.estado || 'all'} onValueChange={(v) => handleColumnFilterInput('estado', v)} placeholder="Todos" options={[{ value: 'all', label: 'Todos' }, ...ESTADOS_MAQUINARIA]} /></th>}
                  {columnasVisibles.includes('tarifaHoraVenta') && <th className="px-3 py-1.5"></th>}
                  {columnasVisibles.includes('activo') && <th className="px-3 py-1.5"><TableSelect value={columnFiltersInput.activo || 'all'} onValueChange={(v) => handleColumnFilterInput('activo', v)} placeholder="Todos" options={[{ value: 'all', label: 'Todos' }, { value: 'true', label: 'Activos' }, { value: 'false', label: 'Inactivos' }]} /></th>}
                  <th className="sticky right-0 z-30 bg-card px-3 py-1.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />Cargando...</td></tr>
                ) : maquinarias.length === 0 ? (
                  <tr><td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center"><Truck className="h-12 w-12 mx-auto mb-2 opacity-20" /><p className="font-medium">No se encontro maquinaria</p></td></tr>
                ) : maquinarias.map((m) => (
                  <tr key={m._id} className="hover:bg-muted/30 transition-colors group">
                    <td className={`${densityClasses.cell} sticky left-0 z-20 bg-card group-hover:bg-muted/50`}><Checkbox checked={selectedItems.includes(m._id)} onCheckedChange={() => handleSelectItem(m._id)} /></td>
                    {columnasVisibles.includes('codigo') && <td className={`${densityClasses.cell} font-mono font-medium`}>{m.codigo}</td>}
                    {columnasVisibles.includes('nombre') && <td className={`${densityClasses.cell} font-medium`}><Link href={`/maquinaria/${m._id}`} className="hover:text-primary hover:underline">{m.nombre}</Link>{m.necesitaMantenimiento && <AlertTriangle className="inline ml-2 h-4 w-4 text-yellow-500" title="Requiere mantenimiento" />}</td>}
                    {columnasVisibles.includes('tipo') && <td className={`${densityClasses.cell}`}><Badge variant="outline" className="font-normal">{TIPOS_MAQUINARIA.find(t => t.value === m.tipo)?.label || m.tipo}</Badge></td>}
                    {columnasVisibles.includes('matricula') && <td className={`${densityClasses.cell} font-mono`}>{m.matricula || '-'}</td>}
                    {columnasVisibles.includes('estado') && <td className={`${densityClasses.cell}`}>{getEstadoBadge(m.estado)}</td>}
                    {columnasVisibles.includes('tarifaHoraVenta') && <td className={`${densityClasses.cell} font-mono`}>{m.tarifaHoraVenta?.toFixed(2) || '0.00'} EUR</td>}
                    {columnasVisibles.includes('activo') && <td className={`${densityClasses.cell}`}>{m.activo ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</td>}
                    <td className={`${densityClasses.cell} sticky right-0 z-20 bg-card group-hover:bg-muted/50 text-right`}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleAction(m._id, 'view')}><Eye className="mr-2 h-4 w-4" />Ver detalle</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(m._id, 'edit')}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(m._id, 'duplicate')}><Copy className="mr-2 h-4 w-4" />Duplicar</DropdownMenuItem>
                          {canDelete('maquinaria') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleAction(m._id, 'delete')}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        {pagination.total > 0 && (
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mostrar</span>
                <Select value={pagination.limit.toString()} onValueChange={(v) => setFilters(p => ({ ...p, limit: Number(v), page: 1 }))}><SelectTrigger className="w-[80px] h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem></SelectContent></Select>
                <span className="text-sm text-muted-foreground">de <span className="font-medium">{pagination.total}</span></span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setFilters(p => ({ ...p, page: 1 }))} disabled={pagination.page === 1} className="h-9 w-9 p-0"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setFilters(p => ({ ...p, page: Math.max(1, p.page! - 1) }))} disabled={pagination.page === 1} className="h-9 w-9 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                {getPageNumbers(pagination.page, pagination.pages).map((pn, i) => pn === '...' ? <div key={`e-${i}`} className="h-9 w-9 flex items-center justify-center">...</div> : <Button key={pn} variant={pagination.page === pn ? 'default' : 'outline'} size="sm" onClick={() => setFilters(p => ({ ...p, page: pn as number }))} className="h-9 w-9 p-0">{pn}</Button>)}
                <Button variant="outline" size="sm" onClick={() => setFilters(p => ({ ...p, page: Math.min(pagination.pages, p.page! + 1) }))} disabled={pagination.page === pagination.pages} className="h-9 w-9 p-0"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setFilters(p => ({ ...p, page: pagination.pages }))} disabled={pagination.page === pagination.pages} className="h-9 w-9 p-0"><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        )}

        {/* Delete Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(o) => setDeleteDialog({ ...deleteDialog, open: o })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminacion</DialogTitle>
              <DialogDescription>¿Eliminar {deleteDialog.ids.length === 1 ? 'la maquinaria' : `${deleteDialog.ids.length} maquinarias`}?</DialogDescription>
              <ul className="mt-3">{deleteDialog.nombres.map((n, i) => <li key={i}>• {n}</li>)}</ul>
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
