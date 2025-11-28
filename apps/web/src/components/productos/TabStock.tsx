import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Plus, Trash2 } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { almacenesService } from '@/services/almacenes.service'
import { Almacen } from '@/types/almacen.types'

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
        const response = await almacenesService.getAll({ limit: 1000, activo: true })
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

  const removeStockAlmacen = (index: number) => {
    setFormData({
      ...formData,
      stockPorAlmacen: formData.stockPorAlmacen.filter((_: any, i: number) => i !== index),
    })
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

        {formData.gestionaStock && (
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
        )}
      </Card>

      {/* Stock por almacén */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Stock por Almacenes</h3>
          {isEditing && almacenes.length > 0 && (
            <Button type="button" size="sm" variant="outline" onClick={addStockAlmacen}>
              <Plus className="h-3 w-3 mr-1" />
              Agregar Almacén
            </Button>
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
              {formData.stockPorAlmacen.map((stock: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>
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
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay distribución de stock por almacenes. Haz clic en &quot;Agregar Almacén&quot; para configurar.
          </p>
        )}
      </Card>
    </div>
  )
}
