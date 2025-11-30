'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { FormattedText } from '@/components/ui/formatted-text'
import { Plus, Trash2, Sparkles, TrendingUp, TrendingDown, Minus, Loader2, Info, ExternalLink } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { tiposImpuestoService } from '@/services/tipos-impuesto.service'
import { aiService, PriceSuggestion } from '@/services/ai.service'
import { TipoImpuesto } from '@/types/tipo-impuesto.types'
import { toast } from 'sonner'

interface TabPreciosProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

export function TabPrecios({ formData, setFormData, isEditing }: TabPreciosProps) {
  const [tiposImpuesto, setTiposImpuesto] = useState<TipoImpuesto[]>([])
  const [loadingTiposImpuesto, setLoadingTiposImpuesto] = useState(true)

  // Estado para IA
  const [loadingAI, setLoadingAI] = useState(false)
  const [priceSuggestion, setPriceSuggestion] = useState<PriceSuggestion | null>(null)
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    const fetchTiposImpuesto = async () => {
      try {
        setLoadingTiposImpuesto(true)
        const response = await tiposImpuestoService.getAll({ limit: 1000, activo: true })
        setTiposImpuesto(response.data || [])
      } catch (error) {
        console.error('Error al cargar tipos de impuesto:', error)
      } finally {
        setLoadingTiposImpuesto(false)
      }
    }
    fetchTiposImpuesto()
  }, [])

  // Verificar disponibilidad de IA
  useEffect(() => {
    const checkAI = async () => {
      try {
        const status = await aiService.getStatus()
        setAiAvailable(status.available)
      } catch {
        setAiAvailable(false)
      }
    }
    checkAI()
  }, [])

  // Convertir tipos de impuesto a opciones para el SearchableSelect
  const tiposImpuestoOptions = useMemo(() => {
    return tiposImpuesto.map((tipo) => ({
      value: tipo._id,
      label: `${tipo.nombre} - ${tipo.porcentaje}%`,
      description: tipo.tipo?.toUpperCase() || undefined,
    }))
  }, [tiposImpuesto])

  const addPrecioPorCantidad = () => {
    setFormData({
      ...formData,
      preciosPorCantidad: [
        ...(formData.preciosPorCantidad || []),
        { cantidadMinima: 1, precio: 0, descuentoPorcentaje: 0 },
      ],
    })
  }

  const removePrecioPorCantidad = (index: number) => {
    setFormData({
      ...formData,
      preciosPorCantidad: formData.preciosPorCantidad.filter((_: any, i: number) => i !== index),
    })
  }

  // Calcular margen: ((venta - compra) / venta) * 100
  const calculateMargin = (precioVenta: number, precioCompra: number): number => {
    if (precioVenta <= 0) return 0
    return ((precioVenta - precioCompra) / precioVenta) * 100
  }

  // Calcular PVP desde precio venta (añadir impuestos)
  const calculatePVP = (precioVenta: number): number => {
    const taxRate = getCurrentTaxRate()
    return precioVenta * (1 + taxRate / 100)
  }

  // Actualizar precio y recalcular margen + precios relacionados
  const updatePrice = (field: 'compra' | 'venta' | 'pvp', value: number) => {
    const newPrecios = { ...(formData.precios || {}), [field]: value }
    const taxRate = getCurrentTaxRate()

    if (field === 'venta') {
      // Si cambia precio venta -> recalcular PVP
      newPrecios.pvp = parseFloat((value * (1 + taxRate / 100)).toFixed(2))
    } else if (field === 'pvp') {
      // Si cambia PVP -> recalcular precio venta
      newPrecios.venta = parseFloat((value / (1 + taxRate / 100)).toFixed(2))
    }

    // Recalcular margen
    const precioVenta = newPrecios.venta || 0
    const precioCompra = field === 'compra' ? value : (newPrecios.compra || 0)
    newPrecios.margen = calculateMargin(precioVenta, precioCompra)

    setFormData({
      ...formData,
      precios: newPrecios,
    })
  }

  // Sugerir precio con IA
  const handleSuggestPrice = async () => {
    if (!formData.nombre) {
      toast.error('Introduce primero el nombre del producto')
      return
    }

    setLoadingAI(true)
    setPriceSuggestion(null)

    try {
      const suggestion = await aiService.suggestPrice({
        productName: formData.nombre,
        description: formData.descripcion || formData.descripcionCorta,
        purchasePrice: formData.precios?.compra,
        category: formData.familiaId ? 'Categoría del producto' : undefined,
      })

      setPriceSuggestion(suggestion)
      toast.success('Análisis de precios completado')
    } catch (error: any) {
      console.error('Error al sugerir precio:', error)
      toast.error(error.message || 'Error al analizar precios de mercado')
    } finally {
      setLoadingAI(false)
    }
  }

  // Obtener porcentaje de impuesto actual
  const getCurrentTaxRate = (): number => {
    // Primero intentar obtener del tipo de impuesto seleccionado
    if (formData.tipoImpuestoId) {
      const tipoImpuesto = tiposImpuesto.find(t => t._id === formData.tipoImpuestoId)
      if (tipoImpuesto) {
        return tipoImpuesto.porcentaje
      }
    }
    // Fallback al IVA manual
    return formData.iva || 21
  }

  // Calcular precio sin impuestos desde precio con impuestos
  const calculatePriceWithoutTax = (priceWithTax: number): number => {
    const taxRate = getCurrentTaxRate()
    return priceWithTax / (1 + taxRate / 100)
  }

  // Aplicar precio sugerido (convertido a precio sin impuestos)
  const applyPrice = (priceWithTax: number) => {
    const priceWithoutTax = parseFloat(calculatePriceWithoutTax(priceWithTax).toFixed(2))
    const precioCompra = formData.precios?.compra || 0
    const margen = calculateMargin(priceWithoutTax, precioCompra)

    setFormData({
      ...formData,
      precios: {
        ...(formData.precios || {}),
        venta: priceWithoutTax,
        pvp: priceWithTax,
        margen: margen,
      },
    })
    const taxRate = getCurrentTaxRate()
    toast.success(`Precio venta: ${priceWithoutTax.toFixed(2)}€ (PVP con ${taxRate}% imp: ${priceWithTax.toFixed(2)}€)`)
  }

  // Calcular diferencia de precio
  const getPriceDifference = (suggestedPrice: number) => {
    const currentPrice = formData.precios?.venta || 0
    if (currentPrice === 0) return null
    const diff = ((suggestedPrice - currentPrice) / currentPrice) * 100
    return diff
  }

  // Color de confianza
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'alta': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'media': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'baja': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Impuestos - PRIMERO para poder calcular precios */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Impuestos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipoImpuestoId">Tipo de Impuesto</Label>
            <SearchableSelect
              options={tiposImpuestoOptions}
              value={formData.tipoImpuestoId || ''}
              onValueChange={(value) => {
                // Actualizar tipoImpuestoId y también el campo iva para compatibilidad
                const tipoSeleccionado = tiposImpuesto.find(t => t._id === value)
                setFormData({
                  ...formData,
                  tipoImpuestoId: value,
                  iva: tipoSeleccionado?.porcentaje || 21,
                  tipoImpuesto: tipoSeleccionado?.tipo?.toLowerCase() || 'iva'
                })
              }}
              placeholder="Seleccionar tipo de impuesto"
              searchPlaceholder="Buscar tipo de impuesto..."
              emptyMessage="No se encontraron tipos de impuesto"
              disabled={!isEditing}
              loading={loadingTiposImpuesto}
              allowClear
            />
            <p className="text-xs text-muted-foreground mt-1">
              Impuesto aplicado: {getCurrentTaxRate()}%
            </p>
          </div>

          <div>
            <Label>Información del Impuesto</Label>
            <div className="p-3 bg-muted/50 rounded-md border mt-1">
              {formData.tipoImpuestoId ? (
                (() => {
                  const tipoSeleccionado = tiposImpuesto.find(t => t._id === formData.tipoImpuestoId)
                  if (tipoSeleccionado) {
                    return (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tipo:</span>
                          <Badge variant="outline">{tipoSeleccionado.tipo}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Porcentaje:</span>
                          <span className="font-semibold">{tipoSeleccionado.porcentaje}%</span>
                        </div>
                        {tipoSeleccionado.recargoEquivalencia && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Recargo equiv.:</span>
                            <span className="font-semibold">{tipoSeleccionado.porcentajeRecargo}%</span>
                          </div>
                        )}
                      </div>
                    )
                  }
                  return <span className="text-muted-foreground text-sm">Tipo no encontrado</span>
                })()
              ) : (
                <span className="text-muted-foreground text-sm">
                  Selecciona un tipo de impuesto para ver los detalles
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Precios Base */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Precios Base</h3>
          {isEditing && aiAvailable && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSuggestPrice}
                    disabled={loadingAI || !formData.nombre}
                    className="gap-2"
                  >
                    {loadingAI ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-purple-500" />
                    )}
                    <span className="hidden sm:inline">
                      {loadingAI ? 'Analizando...' : 'Sugerir precio con IA'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Analiza precios de mercado y sugiere un PVP competitivo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="precioCompra">Precio Compra</Label>
            <div className="relative">
              <Input
                id="precioCompra"
                type="number"
                step="0.01"
                min="0"
                value={formData.precios?.compra || 0}
                onChange={(e) => updatePrice('compra', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                €
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="precioVenta">Precio Venta *</Label>
            <div className="relative">
              <Input
                id="precioVenta"
                type="number"
                step="0.01"
                min="0"
                value={formData.precios?.venta || 0}
                onChange={(e) => updatePrice('venta', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                €
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="pvp">PVP (Recomendado)</Label>
            <div className="relative">
              <Input
                id="pvp"
                type="number"
                step="0.01"
                min="0"
                value={formData.precios?.pvp || 0}
                onChange={(e) => updatePrice('pvp', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                €
              </span>
            </div>
          </div>

          <div>
            <Label>Margen</Label>
            <div className="relative">
              <Input
                value={formData.precios?.margen?.toFixed(2) || '0.00'}
                disabled
                className="bg-muted"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                %
              </span>
            </div>
          </div>
        </div>

        {/* Panel de sugerencia de IA */}
        {priceSuggestion && (
          <div className="mt-6 p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                    Análisis de Precios de Mercado
                  </h4>
                  <Badge className={getConfidenceColor(priceSuggestion.confidence)}>
                    Confianza {priceSuggestion.confidence}
                  </Badge>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {priceSuggestion.reasoning}
                </p>
              </div>
            </div>

            {/* Precios sugeridos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div
                className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-purple-200 dark:border-purple-800 cursor-pointer hover:border-purple-400 transition-colors"
                onClick={() => isEditing && applyPrice(priceSuggestion.suggestedPrice)}
              >
                <p className="text-xs text-muted-foreground mb-1">Precio Sugerido</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {priceSuggestion.suggestedPrice.toFixed(2)}€
                  </p>
                  {getPriceDifference(priceSuggestion.suggestedPrice) !== null && (
                    <span className={`text-xs flex items-center ${getPriceDifference(priceSuggestion.suggestedPrice)! > 0 ? 'text-green-600' : getPriceDifference(priceSuggestion.suggestedPrice)! < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {getPriceDifference(priceSuggestion.suggestedPrice)! > 0 ? <TrendingUp className="h-3 w-3" /> : getPriceDifference(priceSuggestion.suggestedPrice)! < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {Math.abs(getPriceDifference(priceSuggestion.suggestedPrice)!).toFixed(0)}%
                    </span>
                  )}
                </div>
                {isEditing && <p className="text-xs text-purple-500 mt-1">Click para aplicar</p>}
              </div>

              <div
                className="p-3 bg-white dark:bg-gray-900 rounded-lg border cursor-pointer hover:border-green-400 transition-colors"
                onClick={() => isEditing && applyPrice(priceSuggestion.minPrice)}
              >
                <p className="text-xs text-muted-foreground mb-1">Precio Mínimo</p>
                <p className="text-lg font-semibold text-green-600">
                  {priceSuggestion.minPrice.toFixed(2)}€
                </p>
              </div>

              <div
                className="p-3 bg-white dark:bg-gray-900 rounded-lg border cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => isEditing && applyPrice(priceSuggestion.avgPrice)}
              >
                <p className="text-xs text-muted-foreground mb-1">Precio Medio</p>
                <p className="text-lg font-semibold text-blue-600">
                  {priceSuggestion.avgPrice.toFixed(2)}€
                </p>
              </div>

              <div
                className="p-3 bg-white dark:bg-gray-900 rounded-lg border cursor-pointer hover:border-orange-400 transition-colors"
                onClick={() => isEditing && applyPrice(priceSuggestion.maxPrice)}
              >
                <p className="text-xs text-muted-foreground mb-1">Precio Máximo</p>
                <p className="text-lg font-semibold text-orange-600">
                  {priceSuggestion.maxPrice.toFixed(2)}€
                </p>
              </div>
            </div>

            {/* Análisis de mercado */}
            {priceSuggestion.marketAnalysis && (
              <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Análisis de mercado</p>
                </div>
                <FormattedText text={priceSuggestion.marketAnalysis} className="text-muted-foreground" />
              </div>
            )}

            {/* Fuentes */}
            {priceSuggestion.sources && priceSuggestion.sources.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Fuentes consultadas:</p>
                <div className="flex flex-wrap gap-2">
                  {priceSuggestion.sources.map((source, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {source.name}: {source.price.toFixed(2)}€
                      {source.url && (
                        <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPriceSuggestion(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Precios por cantidad */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Precios por Cantidad</h3>
          {isEditing && (
            <Button type="button" size="sm" variant="outline" onClick={addPrecioPorCantidad}>
              <Plus className="h-3 w-3 mr-1" />
              Agregar
            </Button>
          )}
        </div>

        {formData.preciosPorCantidad && formData.preciosPorCantidad.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cantidad Mínima</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Descuento %</TableHead>
                {isEditing && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.preciosPorCantidad.map((precio: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={precio.cantidadMinima}
                      onChange={(e) => {
                        const newPrecios = [...formData.preciosPorCantidad]
                        newPrecios[index].cantidadMinima = parseInt(e.target.value) || 1
                        setFormData({ ...formData, preciosPorCantidad: newPrecios })
                      }}
                      disabled={!isEditing}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={precio.precio}
                      onChange={(e) => {
                        const newPrecios = [...formData.preciosPorCantidad]
                        newPrecios[index].precio = parseFloat(e.target.value) || 0
                        setFormData({ ...formData, preciosPorCantidad: newPrecios })
                      }}
                      disabled={!isEditing}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={precio.descuentoPorcentaje || 0}
                      onChange={(e) => {
                        const newPrecios = [...formData.preciosPorCantidad]
                        newPrecios[index].descuentoPorcentaje = parseFloat(e.target.value) || 0
                        setFormData({ ...formData, preciosPorCantidad: newPrecios })
                      }}
                      disabled={!isEditing}
                      className="w-24"
                    />
                  </TableCell>
                  {isEditing && (
                    <TableCell>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removePrecioPorCantidad(index)}
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
          <p className="text-sm text-muted-foreground">No hay precios por cantidad configurados</p>
        )}
      </Card>
    </div>
  )
}
