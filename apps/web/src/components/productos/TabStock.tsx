import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Plus, Trash2, Warehouse, AlertCircle, Package, RefreshCw } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { almacenesService } from '@/services/almacenes.service'
import { Almacen } from '@/types/almacen.types'
import { toast } from 'sonner'

interface TabStockProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

export function TabStock({ formData, setFormData, isEditing }: TabStockProps) {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(true)

  useEffect(() => {
    const fetchAlmacenes = async () => {
      try {
        setLoadingAlmacenes(true)
        const response = await almacenesService.getAll({ limit: 1000, activo: 'true' })
        setAlmacenes(response.data || [])
      } catch (error) {
        console.error('Error al cargar almacenes:', error)
      } finally {
        setLoadingAlmacenes(false)
      }
    }
    fetchAlmacenes()
  }, [])

  // Convertir almacenes a opciones para el SearchableSelect
  const almacenesOptions = useMemo(() => {
    return almacenes.map((almacen) => ({
      value: almacen._id,
      label: almacen.nombre,
      description: almacen.codigo || (almacen.direccion?.ciudad ? almacen.direccion.ciudad : undefined),
    }))
  }, [almacenes])

  // Filtrar almacenes ya seleccionados
  const getAvailableAlmacenes = (currentIndex: number) => {
    const selectedIds = (formData.stockPorAlmacen || [])
      .filter((_: any, i: number) => i !== currentIndex)
      .map((s: any) => s.almacenId)

    return almacenesOptions.filter(opt => !selectedIds.includes(opt.value))
  }

  // Agregar un almacén al stock
  const addStockAlmacen = () => {
    setFormData({
      ...formData,
      stockPorAlmacen: [
        ...(formData.stockPorAlmacen || []),
        {
          almacenId: '',
          cantidad: 0,
          minimo: 0,
          maximo: 0,
          ubicacion: '',
          ultimaActualizacion: new Date(),
        },
      ],
    })
  }

  // Agregar todos los almacenes disponibles
  const addAllAlmacenes = () => {
    const existingIds = (formData.stockPorAlmacen || []).map((s: any) => s.almacenId)
    const nuevosAlmacenes = almacenes
      .filter(a => !existingIds.includes(a._id))
      .map(a => ({
        almacenId: a._id,
        cantidad: 0,
        minimo: 0,
        maximo: 0,
        ubicacion: '',
        ultimaActualizacion: new Date(),
      }))

    if (nuevosAlmacenes.length === 0) {
      toast.info('Todos los almacenes ya están agregados')
      return
    }

    setFormData({
      ...formData,
      stockPorAlmacen: [...(formData.stockPorAlmacen || []), ...nuevosAlmacenes],
    })
    toast.success(`${nuevosAlmacenes.length} almacenes agregados`)
  }

  // Eliminar un almacén del stock
  const removeStockAlmacen = (index: number) => {
    setFormData({
      ...formData,
      stockPorAlmacen: formData.stockPorAlmacen.filter((_: any, i: number) => i !== index),
    })
  }

  // Calcular stock total de variantes
  const calcularStockVariantes = () => {
    if (!formData.tieneVariantes || !formData.variantes?.length) return null

    const totalesPorAlmacen: Record<string, number> = {}
    let stockTotal = 0

    formData.variantes.forEach((variante: any) => {
      if (variante.activo !== false && variante.stockPorAlmacen) {
        variante.stockPorAlmacen.forEach((stock: any) => {
          const cantidad = stock.cantidad || 0
          stockTotal += cantidad
          if (stock.almacenId) {
            totalesPorAlmacen[stock.almacenId] = (totalesPorAlmacen[stock.almacenId] || 0) + cantidad
          }
        })
      }
    })

    return { stockTotal, totalesPorAlmacen }
  }

  // Sincronizar almacenes con las variantes
  const sincronizarAlmacenesConVariantes = () => {
    if (!formData.tieneVariantes || !formData.variantes?.length) return

    const nuevasVariantes = formData.variantes.map((variante: any) => {
      const stockPorAlmacen = almacenes.map(almacen => {
        const existente = (variante.stockPorAlmacen || []).find(
          (s: any) => s.almacenId === almacen._id
        )
        return existente || {
          almacenId: almacen._id,
          cantidad: 0,
          minimo: 0,
          maximo: 0,
        }
      })
      return { ...variante, stockPorAlmacen }
    })

    setFormData({ ...formData, variantes: nuevasVariantes })
    toast.success('Almacenes sincronizados con las variantes')
  }

  const stockVariantes = calcularStockVariantes()

  // Obtener nombre del almacén
  const getNombreAlmacen = (almacenId: string) => {
    const almacen = almacenes.find(a => a._id === almacenId)
    return almacen ? almacen.nombre : 'Desconocido'
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Gestión de Stock</h3>

        <div className="mb-6 space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="gestionaStock"
              checked={formData.gestionaStock}
              onCheckedChange={(checked) => setFormData({ ...formData, gestionaStock: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="gestionaStock" className="cursor-pointer">
              Gestionar inventario automáticamente
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="permitirStockNegativo"
              checked={formData.permitirStockNegativo}
              onCheckedChange={(checked) => setFormData({ ...formData, permitirStockNegativo: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="permitirStockNegativo" className="cursor-pointer">
              Permitir stock negativo
            </Label>
          </div>
        </div>

        {/* Resumen si tiene variantes */}
        {formData.tieneVariantes && formData.variantes?.length > 0 ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Producto con variantes
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    El stock se gestiona individualmente por cada variante en la pestaña "Variantes".
                  </p>

                  {stockVariantes && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="bg-white dark:bg-gray-900 rounded p-3 border">
                        <p className="text-xs text-muted-foreground">Stock Total</p>
                        <p className="text-2xl font-bold">{stockVariantes.stockTotal}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded p-3 border">
                        <p className="text-xs text-muted-foreground">Variantes Activas</p>
                        <p className="text-2xl font-bold">
                          {formData.variantes.filter((v: any) => v.activo !== false).length}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded p-3 border">
                        <p className="text-xs text-muted-foreground">Variantes Total</p>
                        <p className="text-2xl font-bold">{formData.variantes.length}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded p-3 border">
                        <p className="text-xs text-muted-foreground">Almacenes</p>
                        <p className="text-2xl font-bold">{Object.keys(stockVariantes.totalesPorAlmacen).length}</p>
                      </div>
                    </div>
                  )}

                  {/* Stock por almacén de variantes */}
                  {stockVariantes && Object.keys(stockVariantes.totalesPorAlmacen).length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Stock por almacén (total de todas las variantes):</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(stockVariantes.totalesPorAlmacen).map(([almacenId, cantidad]) => (
                          <Badge key={almacenId} variant="secondary" className="px-3 py-1">
                            <Warehouse className="h-3 w-3 mr-1" />
                            {getNombreAlmacen(almacenId)}: {cantidad}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={sincronizarAlmacenesConVariantes}
                      className="mt-3"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizar almacenes con variantes
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Stock para productos simples */
          formData.gestionaStock && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="cantidad">Cantidad Actual</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="0"
                  value={formData.stock?.cantidad || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock: { ...(formData.stock || {}), cantidad: parseInt(e.target.value) || 0 },
                    })
                  }
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="minimo">Stock Mínimo</Label>
                <Input
                  id="minimo"
                  type="number"
                  min="0"
                  value={formData.stock?.minimo || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock: { ...(formData.stock || {}), minimo: parseInt(e.target.value) || 0 },
                    })
                  }
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="maximo">Stock Máximo</Label>
                <Input
                  id="maximo"
                  type="number"
                  min="0"
                  value={formData.stock?.maximo || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock: { ...(formData.stock || {}), maximo: parseInt(e.target.value) || 0 },
                    })
                  }
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input
                  id="ubicacion"
                  value={formData.stock?.ubicacion || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock: { ...(formData.stock || {}), ubicacion: e.target.value },
                    })
                  }
                  disabled={!isEditing}
                  placeholder="Ej: A-12-3"
                />
              </div>
            </div>
          )
        )}
      </Card>

      {/* Stock por almacén (solo para productos simples) */}
      {!formData.tieneVariantes && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Stock por Almacenes</h3>
            {isEditing && almacenes.length > 0 && (
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={addAllAlmacenes}>
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar Todos
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={addStockAlmacen}>
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar Almacén
                </Button>
              </div>
            )}
          </div>

          {loadingAlmacenes ? (
            <p className="text-sm text-muted-foreground">Cargando almacenes...</p>
          ) : almacenes.length === 0 ? (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                No hay almacenes configurados. Crea almacenes desde el menú de configuración.
              </p>
            </div>
          ) : formData.stockPorAlmacen && formData.stockPorAlmacen.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Almacén</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Máximo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  {isEditing && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.stockPorAlmacen.map((stock: any, index: number) => {
                  const almacen = almacenes.find(a => a._id === stock.almacenId)
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        {stock.almacenId && almacen ? (
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-muted-foreground" />
                            <span>{almacen.nombre}</span>
                            {almacen.codigo && (
                              <Badge variant="outline" className="text-xs">{almacen.codigo}</Badge>
                            )}
                          </div>
                        ) : (
                          <SearchableSelect
                            options={getAvailableAlmacenes(index)}
                            value={stock.almacenId || ''}
                            onValueChange={(value) => {
                              const newStock = [...formData.stockPorAlmacen]
                              newStock[index].almacenId = value
                              setFormData({ ...formData, stockPorAlmacen: newStock })
                            }}
                            placeholder="Seleccionar almacén"
                            searchPlaceholder="Buscar almacén..."
                            emptyMessage="No hay almacenes disponibles"
                            disabled={!isEditing}
                            triggerClassName="w-48"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={stock.cantidad}
                          onChange={(e) => {
                            const newStock = [...formData.stockPorAlmacen]
                            newStock[index].cantidad = parseInt(e.target.value) || 0
                            setFormData({ ...formData, stockPorAlmacen: newStock })
                          }}
                          disabled={!isEditing}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={stock.minimo}
                          onChange={(e) => {
                            const newStock = [...formData.stockPorAlmacen]
                            newStock[index].minimo = parseInt(e.target.value) || 0
                            setFormData({ ...formData, stockPorAlmacen: newStock })
                          }}
                          disabled={!isEditing}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={stock.maximo}
                          onChange={(e) => {
                            const newStock = [...formData.stockPorAlmacen]
                            newStock[index].maximo = parseInt(e.target.value) || 0
                            setFormData({ ...formData, stockPorAlmacen: newStock })
                          }}
                          disabled={!isEditing}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={stock.ubicacion || ''}
                          onChange={(e) => {
                            const newStock = [...formData.stockPorAlmacen]
                            newStock[index].ubicacion = e.target.value
                            setFormData({ ...formData, stockPorAlmacen: newStock })
                          }}
                          disabled={!isEditing}
                          placeholder="Ubicación"
                          className="w-32"
                        />
                      </TableCell>
                      {isEditing && (
                        <TableCell>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeStockAlmacen(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4 border-2 border-dashed rounded-lg text-center">
              <Warehouse className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-2">
                No hay distribución de stock por almacenes
              </p>
              {isEditing && (
                <Button type="button" size="sm" variant="outline" onClick={addAllAlmacenes}>
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar todos los almacenes
                </Button>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
