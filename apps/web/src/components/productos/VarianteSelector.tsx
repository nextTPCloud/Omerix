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
import { Card } from '@/components/ui/card'
import { Producto, Variante as IVariante } from '@/types/producto.types'
import { Package, Check, AlertCircle, Warehouse } from 'lucide-react'

interface VarianteSeleccion {
  varianteId: string
  sku: string
  combinacion: Record<string, string>
  precioUnitario: number
  costeUnitario: number
  stockTotal: number
}

interface VarianteSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: Producto | null
  onSelect: (variante: VarianteSeleccion) => void
  onSelectBase?: () => void // Si permite seleccionar el producto sin variante
}

export function VarianteSelector({
  open,
  onOpenChange,
  producto,
  onSelect,
  onSelectBase,
}: VarianteSelectorProps) {
  const [selectedVarianteId, setSelectedVarianteId] = useState<string | null>(null)

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

  // Manejar selección de variante
  const handleSelect = () => {
    if (!selectedVarianteId || !producto) return

    const variante = producto.variantes?.find((v: IVariante) => v._id === selectedVarianteId)
    if (!variante) return

    onSelect({
      varianteId: variante._id || selectedVarianteId,
      sku: variante.sku,
      combinacion: variante.combinacion,
      precioUnitario: obtenerPrecio(variante, 'venta'),
      costeUnitario: obtenerPrecio(variante, 'compra'),
      stockTotal: calcularStock(variante),
    })

    // Reset
    setSelectedVarianteId(null)
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
      setSelectedVarianteId(null)
      setFiltroAtributos({})
    }
    onOpenChange(newOpen)
  }

  if (!producto) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Seleccionar Variante
          </DialogTitle>
          <DialogDescription>
            El producto <strong>{producto.nombre}</strong> tiene múltiples variantes.
            Selecciona la que deseas agregar.
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

          {/* Lista de variantes */}
          <div className="space-y-2 mt-4">
            <Label className="text-sm font-medium">
              {variantesFiltradas.length} variante{variantesFiltradas.length !== 1 ? 's' : ''} disponible{variantesFiltradas.length !== 1 ? 's' : ''}
            </Label>

            {variantesFiltradas.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground border rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay variantes que coincidan con los filtros</p>
              </div>
            ) : (
              <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                {variantesFiltradas.map((variante: IVariante) => {
                  const stock = calcularStock(variante)
                  const precioVenta = obtenerPrecio(variante, 'venta')
                  const isSelected = selectedVarianteId === variante._id

                  return (
                    <Card
                      key={variante._id}
                      className={`p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedVarianteId(variante._id || '')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div>
                            <div className="font-mono text-sm font-medium">{variante.sku}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(variante.combinacion).map(([key, value]) => (
                                <Badge key={key} variant="secondary" className="text-xs">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
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
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
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
            onClick={handleSelect}
            disabled={!selectedVarianteId}
          >
            Seleccionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
