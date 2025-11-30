import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchableSelect, MultiSearchableSelect } from '@/components/ui/searchable-select'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Trash2, Package, Utensils, ChevronDown, ChevronUp, GripVertical, Lock, Unlock, Calculator, Percent, Euro, Info } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { productosService } from '@/services/productos.service'
import { tiposImpuestoService } from '@/services/tipos-impuesto.service'
import { Producto } from '@/types/producto.types'
import { TipoImpuesto } from '@/types/tipo-impuesto.types'

interface TabKitProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

type TipoComponente = 'fijo' | 'seleccionable'
type ModoKit = 'kit_simple' | 'menu_combinado'

interface ComponenteKit {
  productoId: string
  cantidad: number
  opcional: boolean
  orden: number
  tipoComponente: TipoComponente
  grupoSeleccion?: string // Para agrupar opciones seleccionables (ej: "primer plato", "segundo", "postre")
  productosAlternativos?: string[] // IDs de productos que pueden elegirse en lugar del principal
  precioExtra?: number // Precio adicional si se elige esta opcion
  // Precios del componente
  precioUnitarioOriginal?: number // Precio original del producto
  precioUnitario?: number // Precio modificado para el kit
  descuentoPorcentaje?: number // Descuento aplicado (%)
}

export function TabKit({ formData, setFormData, isEditing }: TabKitProps) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingProductos, setLoadingProductos] = useState(true)
  const [autoCalcularPrecio, setAutoCalcularPrecio] = useState(true)
  const [tiposImpuesto, setTiposImpuesto] = useState<TipoImpuesto[]>([])
  const [mostrarPVP, setMostrarPVP] = useState(true) // Mostrar columna PVP

  // Modo del kit: simple (como antes) o menú combinado (para restauración)
  const modoKit: ModoKit = formData.configuracionKit?.modo || 'kit_simple'

  // Obtener porcentaje de impuesto actual del producto
  const getCurrentTaxRate = useCallback((): number => {
    if (formData.tipoImpuestoId) {
      const tipoImpuesto = tiposImpuesto.find(t => t._id === formData.tipoImpuestoId)
      if (tipoImpuesto) {
        return tipoImpuesto.porcentaje
      }
    }
    return formData.iva || 21
  }, [formData.tipoImpuestoId, formData.iva, tiposImpuesto])

  // Obtener precio de venta (sin impuestos) de un producto por ID
  const getProductoPrecio = useCallback((productoId: string): number => {
    const producto = productos.find(p => p._id === productoId)
    return producto?.precios?.venta || 0
  }, [productos])

  // Obtener PVP (con impuestos) de un producto por ID
  const getProductoPVP = useCallback((productoId: string): number => {
    const producto = productos.find(p => p._id === productoId)
    return producto?.precios?.pvp || producto?.precios?.venta || 0
  }, [productos])

  // Obtener nombre de un producto por ID
  const getProductoNombre = useCallback((productoId: string): string => {
    const producto = productos.find(p => p._id === productoId)
    return producto?.nombre || ''
  }, [productos])

  // Calcular subtotal de un componente (precio venta sin impuestos)
  const calcularSubtotalComponente = useCallback((componente: ComponenteKit): number => {
    const precioBase = componente.precioUnitario ?? componente.precioUnitarioOriginal ?? 0
    return precioBase * componente.cantidad
  }, [])

  // Calcular subtotal PVP de un componente (con impuestos del producto componente)
  const calcularSubtotalPVP = useCallback((componente: ComponenteKit): number => {
    if (!componente.productoId) return 0
    const producto = productos.find(p => p._id === componente.productoId)
    const pvpOriginal = producto?.precios?.pvp || producto?.precios?.venta || 0
    const precioOriginal = producto?.precios?.venta || 0

    // Calcular el ratio de descuento aplicado al componente
    const descuentoRatio = precioOriginal > 0
      ? (componente.precioUnitario ?? componente.precioUnitarioOriginal ?? precioOriginal) / precioOriginal
      : 1

    // Aplicar el mismo ratio al PVP
    const pvpConDescuento = pvpOriginal * descuentoRatio
    return pvpConDescuento * componente.cantidad
  }, [productos])

  // Calcular precio total del kit sin impuestos (solo componentes no opcionales)
  const precioTotalKit = useMemo(() => {
    const componentesKit = formData.componentesKit || []
    return componentesKit
      .filter((c: ComponenteKit) => !c.opcional)
      .reduce((total: number, c: ComponenteKit) => {
        return total + calcularSubtotalComponente(c)
      }, 0)
  }, [formData.componentesKit, calcularSubtotalComponente])

  // Calcular PVP total del kit (con impuestos de cada componente)
  const pvpTotalKit = useMemo(() => {
    const componentesKit = formData.componentesKit || []
    return componentesKit
      .filter((c: ComponenteKit) => !c.opcional)
      .reduce((total: number, c: ComponenteKit) => {
        return total + calcularSubtotalPVP(c)
      }, 0)
  }, [formData.componentesKit, calcularSubtotalPVP])

  // Calcular ahorro total vs comprar por separado (en PVP)
  const ahorroTotal = useMemo(() => {
    const componentesKit = formData.componentesKit || []
    const pvpOriginal = componentesKit
      .filter((c: ComponenteKit) => !c.opcional)
      .reduce((total: number, c: ComponenteKit) => {
        const producto = productos.find(p => p._id === c.productoId)
        const pvp = producto?.precios?.pvp || producto?.precios?.venta || 0
        return total + pvp * c.cantidad
      }, 0)
    return pvpOriginal - pvpTotalKit
  }, [formData.componentesKit, pvpTotalKit, productos])

  // Actualizar precios del producto principal cuando cambian los componentes
  const actualizarPreciosProducto = useCallback((precioVenta: number, pvp: number) => {
    if (autoCalcularPrecio && precioVenta >= 0) {
      setFormData((prev: any) => ({
        ...prev,
        precios: {
          ...prev.precios,
          venta: parseFloat(precioVenta.toFixed(2)),
          pvp: parseFloat(pvp.toFixed(2)),
        }
      }))
    }
  }, [autoCalcularPrecio, setFormData])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingProductos(true)
        const [productosRes, tiposRes] = await Promise.all([
          productosService.getAll({ limit: 1000, activo: true }),
          tiposImpuestoService.getAll({ limit: 1000, activo: true })
        ])
        setProductos(productosRes.data || [])
        setTiposImpuesto(tiposRes.data || [])
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoadingProductos(false)
      }
    }
    fetchData()
  }, [])

  // Actualizar precios del producto cuando cambia el precio total del kit
  useEffect(() => {
    if (autoCalcularPrecio && formData.tipo === 'compuesto' && (formData.componentesKit || []).length > 0) {
      actualizarPreciosProducto(precioTotalKit, pvpTotalKit)
    }
  }, [precioTotalKit, pvpTotalKit, autoCalcularPrecio, formData.tipo])

  // Convertir productos a opciones para el SearchableSelect (excluyendo el producto actual)
  const productosOptions = useMemo(() => {
    return productos
      .filter((p) => p._id !== formData._id)
      .map((producto) => ({
        value: producto._id,
        label: producto.nombre,
        description: producto.sku ? `SKU: ${producto.sku}` : (producto.precios?.venta ? `${producto.precios.venta.toFixed(2)}€` : undefined),
      }))
  }, [productos, formData._id])

  // Obtener productos disponibles para un componente específico
  const getAvailableProductos = (currentIndex: number, excludeAlternatives: boolean = true) => {
    const componentesKit = formData.componentesKit || []
    let selectedIds: string[] = []

    if (excludeAlternatives) {
      // Excluir productos ya usados como principales o alternativos en otros componentes
      componentesKit.forEach((c: ComponenteKit, i: number) => {
        if (i !== currentIndex) {
          if (c.productoId) selectedIds.push(c.productoId)
          if (c.productosAlternativos) selectedIds.push(...c.productosAlternativos)
        }
      })
    } else {
      // Solo excluir el producto principal del componente actual
      const currentComponent = componentesKit[currentIndex]
      if (currentComponent?.productoId) {
        selectedIds.push(currentComponent.productoId)
      }
    }

    return productosOptions.filter(opt => !selectedIds.includes(opt.value))
  }

  const updateConfiguracionKit = (updates: Record<string, any>) => {
    setFormData({
      ...formData,
      configuracionKit: { ...(formData.configuracionKit || {}), ...updates },
    })
  }

  const addComponenteKit = (tipoComponente: TipoComponente = 'fijo') => {
    setFormData({
      ...formData,
      componentesKit: [
        ...(formData.componentesKit || []),
        {
          productoId: '',
          cantidad: 1,
          opcional: tipoComponente === 'seleccionable',
          orden: (formData.componentesKit || []).length,
          tipoComponente,
          grupoSeleccion: tipoComponente === 'seleccionable' ? '' : undefined,
          productosAlternativos: tipoComponente === 'seleccionable' ? [] : undefined,
          precioExtra: 0,
          precioUnitarioOriginal: 0,
          precioUnitario: 0,
          descuentoPorcentaje: 0,
        },
      ],
    })
  }

  const removeComponenteKit = (index: number) => {
    setFormData({
      ...formData,
      componentesKit: formData.componentesKit.filter((_: any, i: number) => i !== index),
    })
  }

  const updateComponente = (index: number, updates: Partial<ComponenteKit>) => {
    const newComponentes = [...(formData.componentesKit || [])]
    newComponentes[index] = { ...newComponentes[index], ...updates }
    setFormData({ ...formData, componentesKit: newComponentes })
  }

  // Funcion especial para cuando se selecciona un producto - obtiene automaticamente el precio
  const handleProductoChange = (index: number, productoId: string) => {
    const precio = getProductoPrecio(productoId)
    updateComponente(index, {
      productoId,
      precioUnitarioOriginal: precio,
      precioUnitario: precio,
      descuentoPorcentaje: 0,
    })
  }

  // Funcion para aplicar descuento y recalcular precio
  const handleDescuentoChange = (index: number, descuento: number) => {
    const componente = formData.componentesKit[index]
    const precioOriginal = componente.precioUnitarioOriginal || 0
    const nuevoPrecio = precioOriginal * (1 - descuento / 100)
    updateComponente(index, {
      descuentoPorcentaje: descuento,
      precioUnitario: Math.round(nuevoPrecio * 100) / 100, // Redondear a 2 decimales
    })
  }

  // Funcion para modificar precio directamente y calcular descuento
  const handlePrecioChange = (index: number, nuevoPrecio: number) => {
    const componente = formData.componentesKit[index]
    const precioOriginal = componente.precioUnitarioOriginal || 0
    const descuento = precioOriginal > 0 ? ((precioOriginal - nuevoPrecio) / precioOriginal) * 100 : 0
    updateComponente(index, {
      precioUnitario: nuevoPrecio,
      descuentoPorcentaje: Math.max(0, Math.round(descuento * 100) / 100),
    })
  }

  // Obtener grupos de selección únicos
  const gruposSeleccion = useMemo(() => {
    const grupos = new Set<string>()
    ;(formData.componentesKit || []).forEach((c: ComponenteKit) => {
      if (c.grupoSeleccion) grupos.add(c.grupoSeleccion)
    })
    return Array.from(grupos)
  }, [formData.componentesKit])

  // Contar componentes por tipo
  const conteoComponentes = useMemo(() => {
    const componentesKit = formData.componentesKit || []
    return {
      fijos: componentesKit.filter((c: ComponenteKit) => c.tipoComponente === 'fijo').length,
      seleccionables: componentesKit.filter((c: ComponenteKit) => c.tipoComponente === 'seleccionable').length,
      total: componentesKit.length,
    }
  }, [formData.componentesKit])

  if (formData.tipo !== 'compuesto') {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Este producto no es de tipo &quot;Compuesto/Kit&quot;. Cambia el tipo en la pestaña General.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Configuración del modo de kit */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tipo de Composición</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              modoKit === 'kit_simple'
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-muted-foreground/50'
            } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => isEditing && updateConfiguracionKit({ modo: 'kit_simple' })}
          >
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="font-medium">Kit/Pack Simple</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Productos fijos que siempre van juntos. Ideal para packs, lotes o kits predefinidos.
            </p>
          </div>

          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              modoKit === 'menu_combinado'
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-muted-foreground/50'
            } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => isEditing && updateConfiguracionKit({ modo: 'menu_combinado' })}
          >
            <div className="flex items-center gap-3 mb-2">
              <Utensils className="h-6 w-6 text-orange-500" />
              <span className="font-medium">Menú/Combinado</span>
            </div>
            <p className="text-sm text-muted-foreground">
              El cliente puede elegir entre opciones. Ideal para menús del día, combos con elecciones.
            </p>
          </div>
        </div>

        {modoKit === 'menu_combinado' && (
          <div className="mt-4 p-4 bg-muted/50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="permitirRepetir"
                  checked={formData.configuracionKit?.permitirRepetirGrupo ?? false}
                  onCheckedChange={(checked) => updateConfiguracionKit({ permitirRepetirGrupo: !!checked })}
                  disabled={!isEditing}
                />
                <Label htmlFor="permitirRepetir" className="cursor-pointer text-sm">
                  Permitir repetir selección del mismo grupo
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="precioFijoMenu"
                  checked={formData.configuracionKit?.precioFijoMenu ?? true}
                  onCheckedChange={(checked) => updateConfiguracionKit({ precioFijoMenu: !!checked })}
                  disabled={!isEditing}
                />
                <Label htmlFor="precioFijoMenu" className="cursor-pointer text-sm">
                  Precio fijo del menú (ignorar precio de componentes)
                </Label>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Resumen de componentes y precios */}
      {conteoComponentes.total > 0 && (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>
                <strong>{conteoComponentes.total}</strong> componente{conteoComponentes.total !== 1 ? 's' : ''}
              </span>
              {modoKit === 'menu_combinado' && (
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <Lock className="h-4 w-4 text-blue-500" />
                    {conteoComponentes.fijos} fijo{conteoComponentes.fijos !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Unlock className="h-4 w-4 text-green-500" />
                    {conteoComponentes.seleccionables} seleccionable{conteoComponentes.seleccionables !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Resumen de precios para kit simple */}
            {modoKit === 'kit_simple' && (
              <div className="pt-3 border-t">
                <div className="flex flex-col gap-3">
                  {/* Totales */}
                  <div className="flex flex-wrap items-center gap-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Precio Venta:</span>
                            <span className="text-lg font-bold">{precioTotalKit.toFixed(2)} €</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Precio sin impuestos (base imponible)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <Euro className="h-4 w-4 text-primary" />
                            <span className="text-sm">PVP:</span>
                            <span className="text-lg font-bold text-primary">{pvpTotalKit.toFixed(2)} €</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Precio con impuestos incluidos</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {ahorroTotal > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Ahorro: {ahorroTotal.toFixed(2)} €
                      </Badge>
                    )}
                  </div>

                  {/* Checkbox auto-calcular */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="autoCalcular"
                        checked={autoCalcularPrecio}
                        onCheckedChange={(checked) => setAutoCalcularPrecio(!!checked)}
                        disabled={!isEditing}
                      />
                      <Label htmlFor="autoCalcular" className="text-xs cursor-pointer">
                        Actualizar precios automaticamente
                      </Label>
                    </div>
                    {autoCalcularPrecio && (
                      <span className="text-xs text-muted-foreground">
                        Venta: {precioTotalKit.toFixed(2)}€ | PVP: {pvpTotalKit.toFixed(2)}€
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Componentes del kit */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              {modoKit === 'kit_simple' ? 'Componentes del Kit' : 'Elementos del Menú'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {modoKit === 'kit_simple'
                ? 'Define los productos que componen este kit'
                : 'Define los elementos fijos y las opciones seleccionables'}
            </p>
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => addComponenteKit('fijo')}>
                <Lock className="h-3 w-3 mr-1" />
                {modoKit === 'kit_simple' ? 'Agregar' : 'Fijo'}
              </Button>
              {modoKit === 'menu_combinado' && (
                <Button type="button" size="sm" variant="outline" onClick={() => addComponenteKit('seleccionable')}>
                  <Unlock className="h-3 w-3 mr-1" />
                  Seleccionable
                </Button>
              )}
            </div>
          )}
        </div>

        {formData.componentesKit && formData.componentesKit.length > 0 ? (
          <div className="space-y-3">
            {formData.componentesKit.map((componente: ComponenteKit, index: number) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  componente.tipoComponente === 'seleccionable'
                    ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                    : 'border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20'
                }`}
              >
                {/* Cabecera del componente */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {componente.tipoComponente === 'seleccionable' ? (
                      <Unlock className="h-4 w-4 text-green-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="text-sm font-medium">
                      {componente.tipoComponente === 'seleccionable' ? 'Seleccionable' : 'Fijo'}
                    </span>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                  {isEditing && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeComponenteKit(index)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                {/* Contenido del componente */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Producto principal */}
                  <div className="md:col-span-3">
                    <Label className="text-xs">
                      {componente.tipoComponente === 'seleccionable' ? 'Opcion por defecto' : 'Producto'}
                    </Label>
                    <SearchableSelect
                      options={getAvailableProductos(index)}
                      value={componente.productoId || ''}
                      onValueChange={(value) => handleProductoChange(index, value)}
                      placeholder="Seleccionar producto"
                      searchPlaceholder="Buscar producto..."
                      emptyMessage="No hay productos disponibles"
                      disabled={!isEditing}
                      loading={loadingProductos}
                    />
                  </div>

                  {/* Cantidad */}
                  <div className="md:col-span-1">
                    <Label className="text-xs">Cant.</Label>
                    <Input
                      type="number"
                      min="1"
                      value={componente.cantidad}
                      onChange={(e) => updateComponente(index, { cantidad: parseInt(e.target.value) || 1 })}
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Precio Original (solo lectura) - muestra venta y PVP */}
                  {modoKit === 'kit_simple' && componente.productoId && (
                    <div className="md:col-span-2">
                      <Label className="text-xs text-muted-foreground">P. Original</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="h-10 flex items-center justify-between px-3 border rounded-md bg-muted/50 text-sm cursor-help">
                              <span>{(componente.precioUnitarioOriginal || 0).toFixed(2)} €</span>
                              <span className="text-xs text-muted-foreground">
                                PVP: {getProductoPVP(componente.productoId).toFixed(2)}€
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Venta: {(componente.precioUnitarioOriginal || 0).toFixed(2)}€ (sin imp.)</p>
                            <p>PVP: {getProductoPVP(componente.productoId).toFixed(2)}€ (con imp.)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}

                  {/* Descuento */}
                  {modoKit === 'kit_simple' && componente.productoId && (
                    <div className="md:col-span-2">
                      <Label className="text-xs">Dto. %</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={componente.descuentoPorcentaje || 0}
                          onChange={(e) => handleDescuentoChange(index, parseFloat(e.target.value) || 0)}
                          disabled={!isEditing}
                          className="pr-8"
                        />
                        <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {/* Precio Kit (editable) */}
                  {modoKit === 'kit_simple' && componente.productoId && (
                    <div className="md:col-span-2">
                      <Label className="text-xs">P. Kit</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={componente.precioUnitario || 0}
                          onChange={(e) => handlePrecioChange(index, parseFloat(e.target.value) || 0)}
                          disabled={!isEditing}
                          className="pr-8"
                        />
                        <Euro className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {/* Subtotal - muestra venta y PVP */}
                  {modoKit === 'kit_simple' && componente.productoId && (
                    <div className="md:col-span-2">
                      <Label className="text-xs text-muted-foreground">Subtotal</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="h-10 flex items-center justify-between px-3 border rounded-md bg-primary/5 text-sm font-medium cursor-help">
                              <div className="flex flex-col leading-tight">
                                <span>{calcularSubtotalComponente(componente).toFixed(2)} €</span>
                                <span className="text-xs text-primary font-normal">
                                  PVP: {calcularSubtotalPVP(componente).toFixed(2)}€
                                </span>
                              </div>
                              {(componente.descuentoPorcentaje || 0) > 0 && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  -{componente.descuentoPorcentaje}%
                                </Badge>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Subtotal Venta: {calcularSubtotalComponente(componente).toFixed(2)}€</p>
                            <p>Subtotal PVP: {calcularSubtotalPVP(componente).toFixed(2)}€</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}

                  {/* Grupo de selección (solo para seleccionables en modo menú) */}
                  {modoKit === 'menu_combinado' && componente.tipoComponente === 'seleccionable' && (
                    <div className="md:col-span-3">
                      <Label className="text-xs">Grupo</Label>
                      <Select
                        value={componente.grupoSeleccion || '_nuevo_'}
                        onValueChange={(value) => {
                          if (value === '_nuevo_') {
                            const nuevoGrupo = prompt('Nombre del nuevo grupo:')
                            if (nuevoGrupo) {
                              updateComponente(index, { grupoSeleccion: nuevoGrupo })
                            }
                          } else {
                            updateComponente(index, { grupoSeleccion: value })
                          }
                        }}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin grupo</SelectItem>
                          {gruposSeleccion.map((grupo) => (
                            <SelectItem key={grupo} value={grupo}>
                              {grupo}
                            </SelectItem>
                          ))}
                          <SelectItem value="_nuevo_" className="text-primary">
                            + Crear nuevo grupo...
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Precio extra */}
                  {modoKit === 'menu_combinado' && (
                    <div className="md:col-span-2">
                      <Label className="text-xs">Suplemento</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={componente.precioExtra || 0}
                          onChange={(e) => updateComponente(index, { precioExtra: parseFloat(e.target.value) || 0 })}
                          disabled={!isEditing}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs">
                          €
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Orden */}
                  <div className={modoKit === 'kit_simple' ? 'md:col-span-2' : 'md:col-span-1'}>
                    <Label className="text-xs">Orden</Label>
                    <Input
                      type="number"
                      min="0"
                      value={componente.orden}
                      onChange={(e) => updateComponente(index, { orden: parseInt(e.target.value) || 0 })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Productos alternativos (solo para seleccionables) */}
                {modoKit === 'menu_combinado' && componente.tipoComponente === 'seleccionable' && (
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <Label className="text-xs mb-2 block">Opciones alternativas (el cliente puede elegir)</Label>
                    <MultiSearchableSelect
                      options={getAvailableProductos(index, false)}
                      values={componente.productosAlternativos || []}
                      onValuesChange={(values) => updateComponente(index, { productosAlternativos: values })}
                      placeholder="Agregar opciones alternativas..."
                      searchPlaceholder="Buscar productos..."
                      emptyMessage="No hay más productos disponibles"
                      disabled={!isEditing}
                    />
                  </div>
                )}

                {/* Checkbox opcional (para kit simple) */}
                {modoKit === 'kit_simple' && (
                  <div className="mt-3 flex items-center space-x-2">
                    <Checkbox
                      checked={componente.opcional}
                      onCheckedChange={(checked) => updateComponente(index, { opcional: !!checked })}
                      disabled={!isEditing}
                    />
                    <Label className="text-xs cursor-pointer">Este componente es opcional</Label>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed rounded-lg">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay componentes agregados
            </p>
            {isEditing && (
              <p className="text-xs text-muted-foreground mt-1">
                Haz clic en los botones de arriba para agregar componentes
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
