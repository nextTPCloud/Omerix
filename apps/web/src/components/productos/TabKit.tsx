import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchableSelect, MultiSearchableSelect } from '@/components/ui/searchable-select'
import { Plus, Trash2, Package, Utensils, ChevronDown, ChevronUp, GripVertical, Lock, Unlock } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { productosService } from '@/services/productos.service'
import { Producto } from '@/types/producto.types'

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
  precioExtra?: number // Precio adicional si se elige esta opción
}

export function TabKit({ formData, setFormData, isEditing }: TabKitProps) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingProductos, setLoadingProductos] = useState(true)

  // Modo del kit: simple (como antes) o menú combinado (para restauración)
  const modoKit: ModoKit = formData.configuracionKit?.modo || 'kit_simple'

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoadingProductos(true)
        const response = await productosService.getAll({ limit: 1000, activo: true })
        setProductos(response.data || [])
      } catch (error) {
        console.error('Error al cargar productos:', error)
      } finally {
        setLoadingProductos(false)
      }
    }
    fetchProductos()
  }, [])

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

      {/* Resumen de componentes */}
      {conteoComponentes.total > 0 && (
        <Card className="p-4 bg-muted/30">
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
                  <div className="md:col-span-4">
                    <Label className="text-xs">
                      {componente.tipoComponente === 'seleccionable' ? 'Opción por defecto' : 'Producto'}
                    </Label>
                    <SearchableSelect
                      options={getAvailableProductos(index)}
                      value={componente.productoId || ''}
                      onValueChange={(value) => updateComponente(index, { productoId: value })}
                      placeholder="Seleccionar producto"
                      searchPlaceholder="Buscar producto..."
                      emptyMessage="No hay productos disponibles"
                      disabled={!isEditing}
                      loading={loadingProductos}
                    />
                  </div>

                  {/* Cantidad */}
                  <div className="md:col-span-2">
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={componente.cantidad}
                      onChange={(e) => updateComponente(index, { cantidad: parseInt(e.target.value) || 1 })}
                      disabled={!isEditing}
                    />
                  </div>

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
