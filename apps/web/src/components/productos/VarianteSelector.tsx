'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Producto, Variante as IVariante } from '@/types/producto.types'
import { Package, Check, AlertCircle, Warehouse, Plus, Minus, ShoppingCart } from 'lucide-react'

export interface VarianteSeleccion {
  varianteId: string
  sku: string
  combinacion: Record<string, string>
  precioUnitario: number
  costeUnitario: number
  stockTotal: number
  cantidad: number
}

interface VarianteSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: Producto | null
  onSelect: (variante: VarianteSeleccion) => void
  onSelectMultiple?: (variantes: VarianteSeleccion[]) => void
  onSelectBase?: () => void
  multiSelect?: boolean
}

export function VarianteSelector({
  open,
  onOpenChange,
  producto,
  onSelect,
  onSelectMultiple,
  onSelectBase,
  multiSelect = true,
}: VarianteSelectorProps) {
  // Estado para selección múltiple con cantidades
  const [selecciones, setSelecciones] = useState<Record<string, number>>({})

  // Agrupar variantes por atributo para visualización
  const atributosUnicos = useMemo(() => {
    if (!producto?.variantes?.length) return {}

    const atributos: Record<string, Set<string>> = {}
    producto.variantes.forEach((v: IVariante) => {
      Object.entries(v.combinacion).forEach(([key, value]) => {
        if (!atributos[key]) atributos[key] = new Set()
        atributos[key].add(value)
      })
    })

    return Object.fromEntries(
      Object.entries(atributos).map(([key, values]) => [key, Array.from(values)])
    )
  }, [producto?.variantes])

  // Filtro por atributos seleccionados
  const [filtroAtributos, setFiltroAtributos] = useState<Record<string, string>>({})

  // Variantes filtradas
  const variantesFiltradas = useMemo(() => {
    if (!producto?.variantes?.length) return []

    return producto.variantes.filter((v: IVariante) => {
      if (!v.activo) return false
      return Object.entries(filtroAtributos).every(([key, value]) => {
        return !value || v.combinacion[key] === value
      })
    })
  }, [producto?.variantes, filtroAtributos])

  // Calcular stock total de una variante
  const calcularStock = (variante: IVariante) => {
    return (variante.stockPorAlmacen || []).reduce((sum, s) => sum + (s.cantidad || 0), 0)
  }

  // Obtener precio de una variante
  const obtenerPrecio = (variante: IVariante, tipo: 'venta' | 'compra'): number => {
    if (variante.precios?.usarPrecioBase !== false) {
      return producto?.precios?.[tipo] || 0
    }
    return variante.precios?.[tipo] || 0
  }

  // Contar total de variantes seleccionadas
  const totalSeleccionadas = useMemo(() => {
    return Object.values(selecciones).reduce((sum, cant) => sum + cant, 0)
  }, [selecciones])

  // Número de variantes diferentes seleccionadas
  const numVariantesSeleccionadas = useMemo(() => {
    return Object.values(selecciones).filter(cant => cant > 0).length
  }, [selecciones])

  // Actualizar cantidad de una variante
  const actualizarCantidad = (varianteId: string, cantidad: number) => {
    if (cantidad <= 0) {
      const { [varianteId]: _, ...rest } = selecciones
      setSelecciones(rest)
    } else {
      setSelecciones(prev => ({ ...prev, [varianteId]: cantidad }))
    }
  }

  // Incrementar/decrementar cantidad
  const incrementarCantidad = (varianteId: string) => {
    const actual = selecciones[varianteId] || 0
    actualizarCantidad(varianteId, actual + 1)
  }

  const decrementarCantidad = (varianteId: string) => {
    const actual = selecciones[varianteId] || 0
    if (actual > 0) {
      actualizarCantidad(varianteId, actual - 1)
    }
  }

  // Toggle selección (para checkbox)
  const toggleSeleccion = (varianteId: string) => {
    if (selecciones[varianteId]) {
      const { [varianteId]: _, ...rest } = selecciones
      setSelecciones(rest)
    } else {
      setSelecciones(prev => ({ ...prev, [varianteId]: 1 }))
    }
  }

  // Manejar confirmación de selección
  const handleConfirmar = () => {
    if (!producto) return

    const variantesSeleccionadas: VarianteSeleccion[] = []

    Object.entries(selecciones).forEach(([varianteId, cantidad]) => {
      if (cantidad > 0) {
        const variante = producto.variantes?.find((v: IVariante) => v._id === varianteId)
        if (variante) {
          variantesSeleccionadas.push({
            varianteId: variante._id || varianteId,
            sku: variante.sku,
            combinacion: variante.combinacion,
            precioUnitario: obtenerPrecio(variante, 'venta'),
            costeUnitario: obtenerPrecio(variante, 'compra'),
            stockTotal: calcularStock(variante),
            cantidad,
          })
        }
      }
    })

    if (variantesSeleccionadas.length === 0) return

    // Si es selección múltiple y hay callback
    if (multiSelect && onSelectMultiple && variantesSeleccionadas.length > 0) {
      onSelectMultiple(variantesSeleccionadas)
    } else if (variantesSeleccionadas.length === 1) {
      // Selección única
      onSelect(variantesSeleccionadas[0])
    } else if (onSelectMultiple) {
      // Múltiples pero sin callback específico, llamar onSelect por cada una
      onSelectMultiple(variantesSeleccionadas)
    } else {
      // Fallback: llamar onSelect para cada variante
      variantesSeleccionadas.forEach(v => onSelect(v))
    }

    // Reset
    setSelecciones({})
    setFiltroAtributos({})
    onOpenChange(false)
  }

  // Toggle filtro de atributo
  const toggleFiltroAtributo = (atributo: string, valor: string) => {
    setFiltroAtributos(prev => {
      if (prev[atributo] === valor) {
        const { [atributo]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [atributo]: valor }
    })
  }

  // Reset cuando se cierra
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelecciones({})
      setFiltroAtributos({})
    }
    onOpenChange(newOpen)
  }

  // Seleccionar todas las variantes filtradas
  const seleccionarTodas = () => {
    const nuevasSelecciones: Record<string, number> = { ...selecciones }
    variantesFiltradas.forEach((v: IVariante) => {
      if (!nuevasSelecciones[v._id || '']) {
        nuevasSelecciones[v._id || ''] = 1
      }
    })
    setSelecciones(nuevasSelecciones)
  }

  // Deseleccionar todas
  const deseleccionarTodas = () => {
    setSelecciones({})
  }

  if (!producto) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Seleccionar Variantes
          </DialogTitle>
          <DialogDescription>
            El producto <strong>{producto.nombre}</strong> tiene múltiples variantes.
            {multiSelect && ' Puedes seleccionar varias y especificar la cantidad de cada una.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Filtros por atributo */}
          {Object.keys(atributosUnicos).length > 0 && (
            <div className="space-y-3">
              {Object.entries(atributosUnicos).map(([atributo, valores]) => (
                <div key={atributo}>
                  <Label className="text-sm font-medium capitalize mb-2 block">
                    {atributo}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {valores.map((valor) => (
                      <Button
                        key={valor}
                        type="button"
                        size="sm"
                        variant={filtroAtributos[atributo] === valor ? 'default' : 'outline'}
                        onClick={() => toggleFiltroAtributo(atributo, valor)}
                        className="h-8"
                      >
                        {valor}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Acciones de selección masiva */}
          {multiSelect && variantesFiltradas.length > 0 && (
            <div className="flex items-center justify-between border-b pb-2">
              <Label className="text-sm font-medium">
                {variantesFiltradas.length} variante{variantesFiltradas.length !== 1 ? 's' : ''} disponible{variantesFiltradas.length !== 1 ? 's' : ''}
              </Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={seleccionarTodas}>
                  Seleccionar todas
                </Button>
                {numVariantesSeleccionadas > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={deseleccionarTodas}>
                    Limpiar selección
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Lista de variantes */}
          <div className="space-y-2">
            {variantesFiltradas.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground border rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay variantes que coincidan con los filtros</p>
              </div>
            ) : (
              <div className="grid gap-2 max-h-[350px] overflow-y-auto pr-2">
                {variantesFiltradas.map((variante: IVariante) => {
                  const stock = calcularStock(variante)
                  const precioVenta = obtenerPrecio(variante, 'venta')
                  const cantidad = selecciones[variante._id || ''] || 0
                  const isSelected = cantidad > 0

                  return (
                    <Card
                      key={variante._id}
                      className={`p-3 transition-all ${
                        isSelected
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Checkbox y datos de variante */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSeleccion(variante._id || '')}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-sm font-medium truncate">{variante.sku}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(variante.combinacion).map(([key, value]) => (
                                <Badge key={key} variant="secondary" className="text-xs">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Precio y stock */}
                        <div className="text-right shrink-0">
                          <div className="font-semibold">
                            {precioVenta.toFixed(2)} €
                            {variante.precios?.usarPrecioBase !== false && (
                              <span className="text-xs text-muted-foreground ml-1">(base)</span>
                            )}
                          </div>
                          <div className={`text-sm flex items-center gap-1 justify-end ${
                            stock > 0 ? 'text-green-600' : 'text-red-500'
                          }`}>
                            <Warehouse className="h-3 w-3" />
                            {stock} ud
                          </div>
                        </div>

                        {/* Control de cantidad */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => decrementarCantidad(variante._id || '')}
                            disabled={cantidad === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={cantidad}
                            onChange={(e) => actualizarCantidad(variante._id || '', parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => incrementarCantidad(variante._id || '')}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Resumen de selección */}
          {numVariantesSeleccionadas > 0 && (
            <Card className="p-3 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {numVariantesSeleccionadas} variante{numVariantesSeleccionadas !== 1 ? 's' : ''} seleccionada{numVariantesSeleccionadas !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total: <strong>{totalSeleccionadas}</strong> unidades
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {onSelectBase && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onSelectBase()
                handleOpenChange(false)
              }}
            >
              Usar producto base
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmar}
            disabled={totalSeleccionadas === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Agregar {totalSeleccionadas > 0 ? `(${totalSeleccionadas})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
