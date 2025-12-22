'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { stockService, StockProducto, SearchStockParams } from '@/services/stock.service'
import { almacenesService } from '@/services/almacenes.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  Warehouse,
  AlertTriangle,
  XCircle,
  TrendingDown,
  PackageX,
  BarChart3,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { ExportButton } from '@/components/ui/ExportButton'

// Hook de debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function StockActualPage() {
  const router = useRouter()

  // Estado de datos
  const [productos, setProductos] = useState<StockProducto[]>([])
  const [almacenes, setAlmacenes] = useState<{ _id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 })

  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [almacenFilter, setAlmacenFilter] = useState<string>('')
  const [stockFilter, setStockFilter] = useState<'todos' | 'stockBajo' | 'sinStock' | 'conStock'>('todos')
  const [sortBy, setSortBy] = useState('nombre')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Estadísticas
  const [stats, setStats] = useState({ total: 0, sinStock: 0, stockBajo: 0, valorTotal: 0 })

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Cargar almacenes
  useEffect(() => {
    const loadAlmacenes = async () => {
      try {
        const res = await almacenesService.getActivos()
        setAlmacenes(res.data || [])
      } catch (error) {
        console.error('Error cargando almacenes:', error)
      }
    }
    loadAlmacenes()
  }, [])

  // Cargar productos con stock
  const loadStock = useCallback(async () => {
    setLoading(true)
    try {
      const params: SearchStockParams = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        q: debouncedSearch || undefined,
      }

      if (almacenFilter) params.almacenId = almacenFilter
      if (stockFilter === 'stockBajo') params.stockBajo = true
      if (stockFilter === 'sinStock') params.sinStock = true
      if (stockFilter === 'conStock') params.conStock = true

      const response = await stockService.getStockActual(params)
      setProductos(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
      }))

      // Calcular estadísticas
      const prods = response.data || []
      const sinStock = prods.filter(p => (p.stock?.cantidad || 0) <= 0).length
      const stockBajo = prods.filter(p => (p.stock?.cantidad || 0) > 0 && (p.stock?.cantidad || 0) < (p.stock?.minimo || 0)).length
      const valorTotal = prods.reduce((sum, p) => sum + ((p.stock?.cantidad || 0) * (p.costes?.costeUltimo || p.precio?.base || 0)), 0)

      setStats({
        total: response.pagination?.total || 0,
        sinStock,
        stockBajo,
        valorTotal,
      })
    } catch (error) {
      console.error('Error cargando stock:', error)
      toast.error('Error al cargar el stock')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, almacenFilter, stockFilter, debouncedSearch])

  useEffect(() => {
    loadStock()
  }, [loadStock])

  // Manejar ordenación
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  // Limpiar filtros
  const clearFilters = () => {
    setSearchQuery('')
    setAlmacenFilter('')
    setStockFilter('todos')
  }

  // Obtener estado del stock
  const getStockStatus = (producto: StockProducto) => {
    const cantidad = almacenFilter ? (producto.stockEnAlmacen || 0) : (producto.stock?.cantidad || 0)
    const minimo = almacenFilter ? (producto.minimoEnAlmacen || 0) : (producto.stock?.minimo || 0)

    if (cantidad <= 0) {
      return { label: 'Sin stock', variant: 'destructive' as const, icon: PackageX }
    }
    if (cantidad < minimo) {
      return { label: 'Stock bajo', variant: 'secondary' as const, icon: AlertTriangle }
    }
    return { label: 'OK', variant: 'default' as const, icon: Package }
  }

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 opacity-50" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Vista de Stock
            </h1>
            <p className="text-muted-foreground">Stock actual de todos los productos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadStock}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Link href="/almacenes/ajustes/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Ajuste
              </Button>
            </Link>
            <ExportButton
              data={productos.map(p => ({
                Codigo: p.codigo || p.sku,
                Nombre: p.nombre,
                Familia: p.familiaNombre || '',
                Stock: almacenFilter ? (p.stockEnAlmacen || 0) : (p.stock?.cantidad || 0),
                Minimo: almacenFilter ? (p.minimoEnAlmacen || 0) : (p.stock?.minimo || 0),
                Maximo: almacenFilter ? (p.maximoEnAlmacen || 0) : (p.stock?.maximo || 0),
                Ubicacion: almacenFilter ? (p.ubicacionEnAlmacen || '') : '',
                'Coste Ultimo': p.costes?.costeUltimo || 0,
                'Coste Medio': p.costes?.costeMedio || 0,
                'Valor Stock': ((almacenFilter ? (p.stockEnAlmacen || 0) : (p.stock?.cantidad || 0)) * (p.costes?.costeUltimo || 0)),
              }))}
              filename="stock-actual"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Productos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <PackageX className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sin Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.sinStock}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold text-amber-600">{stats.stockBajo}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.valorTotal)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={almacenFilter} onValueChange={setAlmacenFilter}>
              <SelectTrigger>
                <Warehouse className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos los almacenes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los almacenes</SelectItem>
                {almacenes.map(a => (
                  <SelectItem key={a._id} value={a._id}>{a.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="conStock">Con stock</SelectItem>
                <SelectItem value="sinStock">Sin stock</SelectItem>
                <SelectItem value="stockBajo">Stock bajo mínimo</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" onClick={clearFilters}>
              <XCircle className="h-4 w-4 mr-1" />
              Limpiar filtros
            </Button>
          </div>
        </Card>

        {/* Tabla */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-left cursor-pointer hover:bg-muted" onClick={() => handleSort('codigo')}>
                    <div className="flex items-center gap-1">Código {renderSortIcon('codigo')}</div>
                  </th>
                  <th className="p-3 text-left cursor-pointer hover:bg-muted" onClick={() => handleSort('nombre')}>
                    <div className="flex items-center gap-1">Producto {renderSortIcon('nombre')}</div>
                  </th>
                  <th className="p-3 text-left">Familia</th>
                  <th className="p-3 text-right cursor-pointer hover:bg-muted" onClick={() => handleSort('stock.cantidad')}>
                    <div className="flex items-center justify-end gap-1">Stock {renderSortIcon('stock.cantidad')}</div>
                  </th>
                  <th className="p-3 text-right">Mínimo</th>
                  <th className="p-3 text-right">Máximo</th>
                  {almacenFilter && <th className="p-3 text-left">Ubicación</th>}
                  <th className="p-3 text-right">Coste Unit.</th>
                  <th className="p-3 text-right">Valor</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={almacenFilter ? 11 : 10} className="p-8 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : productos.length === 0 ? (
                  <tr>
                    <td colSpan={almacenFilter ? 11 : 10} className="p-8 text-center text-muted-foreground">
                      No hay productos que mostrar
                    </td>
                  </tr>
                ) : (
                  productos.map((prod) => {
                    const stock = almacenFilter ? (prod.stockEnAlmacen || 0) : (prod.stock?.cantidad || 0)
                    const minimo = almacenFilter ? (prod.minimoEnAlmacen || 0) : (prod.stock?.minimo || 0)
                    const maximo = almacenFilter ? (prod.maximoEnAlmacen || 0) : (prod.stock?.maximo || 0)
                    const coste = prod.costes?.costeUltimo || 0
                    const valor = stock * coste
                    const status = getStockStatus(prod)
                    const StatusIcon = status.icon

                    return (
                      <tr key={prod._id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-mono text-xs">{prod.codigo || prod.sku}</td>
                        <td className="p-3">
                          <div className="font-medium">{prod.nombre}</div>
                        </td>
                        <td className="p-3 text-muted-foreground">{prod.familiaNombre || '-'}</td>
                        <td className={`p-3 text-right font-bold ${stock <= 0 ? 'text-red-600' : stock < minimo ? 'text-amber-600' : ''}`}>
                          {stock}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{minimo}</td>
                        <td className="p-3 text-right text-muted-foreground">{maximo || '-'}</td>
                        {almacenFilter && (
                          <td className="p-3">{prod.ubicacionEnAlmacen || '-'}</td>
                        )}
                        <td className="p-3 text-right">{formatCurrency(coste)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(valor)}</td>
                        <td className="p-3 text-center">
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Link href={`/productos/${prod._id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/almacenes/ajustes/nuevo?productoId=${prod._id}`}>
                              <Button variant="ghost" size="sm">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {productos.length} de {pagination.total} productos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: 1 }))}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                Página {pagination.page} de {pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.totalPages }))}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
