'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { productosService } from '@/services/productos.service'
import { familiasService } from '@/services/familias.service'
import vistasService from '@/services/vistas-guardadas.service'
import { Producto } from '@/types/producto.types'
import { Familia } from '@/types/familia.types'
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
  RefreshCw,
  Package,
  AlertCircle,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'

// Componentes reutilizables
import { DensitySelector, useDensityClasses } from '@/components/ui/DensitySelector'
import { VistasGuardadasManager } from '@/components/ui/VistasGuardadasManager'
import { ExportButton } from '@/components/ui/ExportButton'
import { TableSelect } from '@/components/ui/tableSelect'
import { PrintButton } from '@/components/ui/PrintButton'

// ============================================
// HOOK PARA DEBOUNCE
// ============================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// ============================================
// INTERFACES Y TIPOS
// ============================================

interface ColumnFilters {
  [key: string]: string
}

// ============================================
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO PRODUCTOS
// ============================================

const DEFAULT_PRODUCTOS_CONFIG = {
  columnas: [
    { key: 'sku', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'descripcion', visible: false, orden: 2 },
    { key: 'familia', visible: true, orden: 3 },
    { key: 'codigoBarras', visible: false, orden: 4 },
    { key: 'precioBase', visible: false, orden: 5 },
    { key: 'precioVenta', visible: true, orden: 6 },
    { key: 'stockCantidad', visible: true, orden: 7 },
    { key: 'stockMinimo', visible: false, orden: 8 },
    { key: 'activo', visible: true, orden: 9 },
    { key: 'visible', visible: false, orden: 10 },
  ] as ColumnaConfig[],
  sortConfig: {
    key: 'createdAt',
    direction: 'desc' as const,
  },
  columnFilters: {
    activo: 'true',
  },
  paginacion: {
    limit: 25 as const,
  },
  densidad: 'normal' as const,
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ProductosPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)

  // Estados de datos
  const [productos, setProductos] = useState<Producto[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selección múltiple
  const [selectedProductos, setSelectedProductos] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})

  // Aplicar debounce a los filtros de columna
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  })

  // UI States
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    productoIds: string[]
    productoNombres: string[]
  }>({
    open: false,
    productoIds: [],
    productoNombres: [],
  })

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'descripcion', label: 'Descripción', sortable: false },
    { key: 'familia', label: 'Familia', sortable: false },
    { key: 'codigoBarras', label: 'Código de Barras', sortable: false },
    { key: 'precioBase', label: 'Precio Base', sortable: true },
    { key: 'precioVenta', label: 'Precio Venta', sortable: true },
    { key: 'stockCantidad', label: 'Stock', sortable: true },
    { key: 'stockMinimo', label: 'Stock Mínimo', sortable: false },
    { key: 'activo', label: 'Activo', sortable: false },
    { key: 'visible', label: 'Visible', sortable: false },
  ])

  // Hook de configuración del módulo
  const {
    config: moduleConfig,
    updateColumnas,
    updateColumnFilters,
    updateSortConfig,
    updateDensidad,
    resetConfig,
  } = useModuleConfig('productos', DEFAULT_PRODUCTOS_CONFIG, {
    autoSave: true,
    debounceMs: 1000,
  })

  // Derivar valores desde la configuración
  const columnas = useMemo(() => moduleConfig?.columnas || DEFAULT_PRODUCTOS_CONFIG.columnas, [moduleConfig])
  const sortConfig = useMemo(() => moduleConfig?.sortConfig || DEFAULT_PRODUCTOS_CONFIG.sortConfig, [moduleConfig])
  const columnFilters = useMemo(() => moduleConfig?.columnFilters || DEFAULT_PRODUCTOS_CONFIG.columnFilters, [moduleConfig])
  const densidad = useMemo(() => moduleConfig?.densidad || DEFAULT_PRODUCTOS_CONFIG.densidad, [moduleConfig])

  const densityClasses = useDensityClasses(densidad)

  // ============================================
  // CARGAR DATOS
  // ============================================

  const fetchProductos = useCallback(async () => {
    try {
      setIsLoading(true)

      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      }

      // Búsqueda general
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }

      // Filtros por columna
      Object.entries(columnFilters).forEach(([key, value]) => {
        if (value) {
          if (key === 'familiaId') {
            params.familiaId = value
          } else if (key === 'activo') {
            params.activo = value === 'true'
          }
        }
      })

      const response = await productosService.getAll(params)

      setProductos(response.data)

      if (response.pagination) {
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          pages: response.pagination.totalPages || Math.ceil(response.pagination.total / response.pagination.limit),
        })
      }
    } catch (error: any) {
      console.error('Error al cargar productos:', error)
      toast.error(error.response?.data?.message || 'Error al cargar los productos')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, sortConfig, searchTerm, columnFilters])

  // Cargar familias para el filtro
  useEffect(() => {
    const fetchFamilias = async () => {
      try {
        const response = await familiasService.getAll({ limit: 1000 })
        setFamilias(response.data)
      } catch (error) {
        console.error('Error al cargar familias:', error)
      }
    }
    fetchFamilias()
  }, [])

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      return
    }
    fetchProductos()
  }, [fetchProductos])

  useEffect(() => {
    fetchProductos()
  }, [])

  // ============================================
  // HANDLERS
  // ============================================

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleSort = (key: string) => {
    const newDirection =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'

    updateSortConfig({
      key,
      direction: newDirection,
    })
  }

  const handleColumnFilterChange = (columnKey: string, value: string) => {
    const newFilters = { ...columnFilters, [columnKey]: value }
    updateColumnFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleDelete = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await productosService.delete(id)
      }

      toast.success(`${ids.length} producto(s) eliminado(s)`)
      setSelectedProductos([])
      setSelectAll(false)
      setDeleteDialog({ open: false, productoIds: [], productoNombres: [] })
      fetchProductos()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar productos')
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProductos([])
    } else {
      setSelectedProductos(productos.map(p => p._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectProducto = (id: string) => {
    setSelectedProductos(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    )
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Productos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tu catálogo de productos
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/productos/nuevo')}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Barra de herramientas */}
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, SKU o código de barras..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Vistas Guardadas */}
                <VistasGuardadasManager
                  modulo="productos"
                  onAplicarVista={(configuracion) => {
                    if (configuracion.columnas) updateColumnas(configuracion.columnas)
                    if (configuracion.sortConfig) updateSortConfig(configuracion.sortConfig)
                    if (configuracion.columnFilters) updateColumnFilters(configuracion.columnFilters)
                    if (configuracion.paginacion) setPagination(prev => ({ ...prev, limit: configuracion.paginacion.limit }))
                    if (configuracion.densidad) updateDensidad(configuracion.densidad)
                  }}
                  onGuardarVista={async (nombre, descripcion, esDefault, vistaIdActualizar) => {
                    // Esta función es manejada internamente por VistasGuardadasManager
                  }}
                  configuracionActual={{
                    columnas,
                    sortConfig,
                    columnFilters,
                    paginacion: { limit: pagination.limit },
                    densidad,
                  }}
                />

                {/* Selector de densidad */}
                <DensitySelector
                  value={densidad}
                  onChange={updateDensidad}
                />

                {/* Selector de columnas */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Columns className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columnasDisponibles.map((col) => {
                      const columna = columnas?.find(c => c.key === col.key)
                      return (
                        <DropdownMenuCheckboxItem
                          key={col.key}
                          checked={columna?.visible ?? false}
                          onCheckedChange={(checked) => {
                            if (!columnas) return
                            const newColumnas = columnas.map(c =>
                              c.key === col.key ? { ...c, visible: checked } : c
                            )
                            updateColumnas(newColumnas)
                          }}
                        >
                          {col.label}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Exportar */}
                <ExportButton
                  data={productos}
                  columns={(columnas || []).filter(c => c.visible).map(c => ({
                    key: c.key,
                    label: columnasDisponibles.find(cd => cd.key === c.key)?.label || c.key,
                  }))}
                  filename="productos"
                />

                {/* Imprimir */}
                <PrintButton />

                {/* Refrescar */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchProductos()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Acciones en lote */}
            {selectedProductos.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <span className="text-sm font-medium">
                  {selectedProductos.length} seleccionado(s)
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const productosAEliminar = productos.filter(p =>
                      selectedProductos.includes(p._id)
                    )
                    setDeleteDialog({
                      open: true,
                      productoIds: selectedProductos,
                      productoNombres: productosAEliminar.map(p => p.nombre),
                    })
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar seleccionados
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Tabla */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className={`${densityClasses.header} text-left`}>
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  {(columnas || [])
                    .filter(c => c.visible)
                    .sort((a, b) => a.orden - b.orden)
                    .map((columna) => {
                      const colDef = columnasDisponibles.find(c => c.key === columna.key)
                      return (
                        <th
                          key={columna.key}
                          className={`${densityClasses.header} text-left`}
                        >
                          {colDef?.sortable ? (
                            <button
                              onClick={() => handleSort(columna.key)}
                              className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                            >
                              {colDef.label}
                              {sortConfig.key === columna.key && (
                                sortConfig.direction === 'asc' ? (
                                  <ArrowUp className="h-3 w-3 ml-1" />
                                ) : (
                                  <ArrowDown className="h-3 w-3 ml-1" />
                                )
                              )}
                              {sortConfig.key !== columna.key && (
                                <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                              )}
                            </button>
                          ) : (
                            <span className="text-xs font-semibold uppercase tracking-wider">{colDef?.label}</span>
                          )}
                        </th>
                      )
                    })}
                  <th className={`${densityClasses.header} text-right`}>
                    <span className="text-xs font-semibold uppercase tracking-wider">Acciones</span>
                  </th>
                </tr>

                {/* Fila de filtros */}
                <tr className="border-b">
                  <th className={densityClasses.header}></th>
                  {(columnas || [])
                    .filter(c => c.visible)
                    .sort((a, b) => a.orden - b.orden)
                    .map((columna) => (
                      <th key={`filter-${columna.key}`} className={`${densityClasses.header}`}>
                        {columna.key === 'familia' && (
                          <TableSelect
                            value={String(columnFilters['familiaId'] || '')}
                            onValueChange={(value) =>
                              handleColumnFilterChange('familiaId', value)
                            }
                            placeholder="Todas"
                            options={familias.map(f => ({
                              value: f._id,
                              label: f.nombre,
                            }))}
                          />
                        )}
                        {columna.key === 'activo' && (
                          <TableSelect
                            value={String(columnFilters[columna.key] || '')}
                            onValueChange={(value) =>
                              handleColumnFilterChange(columna.key, value)
                            }
                            placeholder="Todos"
                            options={[
                              { value: 'true', label: 'Activos' },
                              { value: 'false', label: 'Inactivos' },
                            ]}
                          />
                        )}
                      </th>
                    ))}
                  <th className={densityClasses.header}></th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={(columnas || []).filter(c => c.visible).length + 2} className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : productos.length === 0 ? (
                  <tr>
                    <td colSpan={(columnas || []).filter(c => c.visible).length + 2} className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No se encontraron productos</p>
                    </td>
                  </tr>
                ) : (
                  productos.map((producto) => (
                    <tr
                      key={producto._id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className={densityClasses.cell}>
                        <Checkbox
                          checked={selectedProductos.includes(producto._id)}
                          onCheckedChange={() => handleSelectProducto(producto._id)}
                        />
                      </td>
                      {(columnas || [])
                        .filter(c => c.visible)
                        .sort((a, b) => a.orden - b.orden)
                        .map((columna) => (
                          <td key={`${producto._id}-${columna.key}`} className={densityClasses.cell}>
                            {columna.key === 'sku' && producto.sku}
                            {columna.key === 'nombre' && (
                              <div className="font-medium">{producto.nombre}</div>
                            )}
                            {columna.key === 'descripcion' && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {producto.descripcion || '-'}
                              </div>
                            )}
                            {columna.key === 'familia' && (
                              <span className="text-sm">{producto.familia?.nombre || '-'}</span>
                            )}
                            {columna.key === 'codigoBarras' && (
                              <span className="text-sm font-mono">{producto.codigoBarras || '-'}</span>
                            )}
                            {columna.key === 'precioBase' && (
                              <span className="text-sm">{producto.precio.base.toFixed(2)} €</span>
                            )}
                            {columna.key === 'precioVenta' && (
                              <span className="font-medium">{producto.precio.venta.toFixed(2)} €</span>
                            )}
                            {columna.key === 'stockCantidad' && (
                              <div className="flex items-center gap-2">
                                <span>{producto.stock.cantidad}</span>
                                {producto.stock.cantidad <= producto.stock.minimo && (
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                )}
                              </div>
                            )}
                            {columna.key === 'stockMinimo' && (
                              <span className="text-sm">{producto.stock.minimo}</span>
                            )}
                            {columna.key === 'activo' && (
                              <Badge variant={producto.activo ? 'default' : 'secondary'}>
                                {producto.activo ? 'Activo' : 'Inactivo'}
                              </Badge>
                            )}
                            {columna.key === 'visible' && (
                              <Badge variant={producto.visible ? 'default' : 'outline'}>
                                {producto.visible ? 'Visible' : 'Oculto'}
                              </Badge>
                            )}
                          </td>
                        ))}
                      <td className={`text-right ${densityClasses.cell}`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/productos/${producto._id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/productos/${producto._id}/editar`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  productoIds: [producto._id],
                                  productoNombres: [producto.nombre],
                                })
                              }
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} productos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                  disabled={pagination.page === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, page: pagination.pages }))}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, productoIds: [], productoNombres: [] })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar {deleteDialog.productoIds.length === 1 ? 'este producto' : 'estos productos'}?
              {deleteDialog.productoNombres.length > 0 && (
                <ul className="mt-2 list-disc list-inside">
                  {deleteDialog.productoNombres.map((nombre, i) => (
                    <li key={i}>{nombre}</li>
                  ))}
                </ul>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, productoIds: [], productoNombres: [] })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(deleteDialog.productoIds)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}