'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus, Trash2, X, Palette, List, Grid3X3, Image, Settings2,
  ChevronDown, ChevronUp, RefreshCw, Package, Euro, Warehouse,
  Edit, Check, Barcode, Copy
} from 'lucide-react'
import { variantesService, Variante as VarianteCatalogo, CreateVarianteDTO } from '@/services/variantes.service'
import { almacenesService } from '@/services/almacenes.service'
import { toast } from 'sonner'
import { Variante, PrecioVariante, StockVarianteAlmacen } from '@/types/producto.types'

interface AtributoProducto {
  varianteId: string
  nombre: string
  tipoVisualizacion: 'botones' | 'dropdown' | 'colores' | 'imagenes'
  obligatorio: boolean
  valores: {
    valorId: string
    valor: string
    hexColor?: string
    imagen?: string
    activo: boolean
  }[]
}

interface Almacen {
  _id: string
  nombre: string
  codigo: string
}

interface TabVariantesProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

export function TabVariantes({ formData, setFormData, isEditing }: TabVariantesProps) {
  const [activeTab, setActiveTab] = useState('atributos')

  // Estado para variantes del catálogo
  const [variantesCatalogo, setVariantesCatalogo] = useState<VarianteCatalogo[]>([])
  const [loadingVariantes, setLoadingVariantes] = useState(false)

  // Estado para almacenes
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(false)

  // Estado para crear nueva variante
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newVariante, setNewVariante] = useState<CreateVarianteDTO>({
    nombre: '',
    codigo: '',
    tipoVisualizacion: 'botones',
    obligatorio: true,
    valores: [],
  })
  const [newValor, setNewValor] = useState({ valor: '', hexColor: '#000000' })
  const [isCreating, setIsCreating] = useState(false)

  // Estado para expandir/colapsar
  const [expandedAtributos, setExpandedAtributos] = useState<string[]>([])
  const [expandedVariantes, setExpandedVariantes] = useState<string[]>([])

  // Cargar variantes del catálogo
  useEffect(() => {
    const cargarVariantes = async () => {
      setLoadingVariantes(true)
      try {
        const response = await variantesService.getAll({ activo: true, limit: 100 })
        if (response.success) {
          setVariantesCatalogo(response.data || [])
        }
      } catch (error) {
        console.error('Error al cargar variantes:', error)
      } finally {
        setLoadingVariantes(false)
      }
    }
    cargarVariantes()
  }, [])

  // Cargar almacenes
  useEffect(() => {
    const cargarAlmacenes = async () => {
      setLoadingAlmacenes(true)
      try {
        const response = await almacenesService.getAll({ activo: 'true', limit: 100 })
        if (response.success) {
          setAlmacenes(response.data || [])
        }
      } catch (error) {
        console.error('Error al cargar almacenes:', error)
      } finally {
        setLoadingAlmacenes(false)
      }
    }
    cargarAlmacenes()
  }, [])

  // Opciones para el selector de variantes (excluir las ya seleccionadas)
  const variantesOptions = useMemo(() => {
    const selectedIds = (formData.atributos || []).map((a: AtributoProducto) => a.varianteId)
    return variantesCatalogo
      .filter(v => !selectedIds.includes(v._id))
      .map(v => ({
        value: v._id,
        label: v.nombre,
        description: `${v.valores.length} valores - ${v.tipoVisualizacion}`,
      }))
  }, [variantesCatalogo, formData.atributos])

  // Agregar variante del catálogo al producto
  const addVarianteFromCatalogo = (varianteId: string) => {
    const variante = variantesCatalogo.find(v => v._id === varianteId)
    if (!variante) return

    const nuevoAtributo: AtributoProducto = {
      varianteId: variante._id,
      nombre: variante.nombre,
      tipoVisualizacion: variante.tipoVisualizacion,
      obligatorio: variante.obligatorio,
      valores: variante.valores.filter(v => v.activo).map(v => ({
        valorId: v._id || '',
        valor: v.valor,
        hexColor: v.hexColor,
        imagen: v.imagen,
        activo: true,
      })),
    }

    setFormData({
      ...formData,
      atributos: [...(formData.atributos || []), nuevoAtributo],
    })
    setExpandedAtributos([...expandedAtributos, varianteId])
  }

  // Eliminar atributo
  const removeAtributo = (index: number) => {
    const atributo = formData.atributos[index]
    setFormData({
      ...formData,
      atributos: formData.atributos.filter((_: any, i: number) => i !== index),
    })
    setExpandedAtributos(expandedAtributos.filter(id => id !== atributo.varianteId))
  }

  // Toggle valor activo/inactivo
  const toggleValor = (atributoIndex: number, valorIndex: number) => {
    const newAtributos = [...formData.atributos]
    newAtributos[atributoIndex].valores[valorIndex].activo =
      !newAtributos[atributoIndex].valores[valorIndex].activo
    setFormData({ ...formData, atributos: newAtributos })
  }

  // Toggle todos los valores
  const toggleAllValores = (atributoIndex: number, activo: boolean) => {
    const newAtributos = [...formData.atributos]
    newAtributos[atributoIndex].valores = newAtributos[atributoIndex].valores.map((v: any) => ({
      ...v,
      activo,
    }))
    setFormData({ ...formData, atributos: newAtributos })
  }

  // Generar combinaciones de variantes
  const generarCombinaciones = () => {
    const atributos = formData.atributos || []
    if (atributos.length === 0) return []

    // Obtener solo valores activos de cada atributo
    const valoresActivos = atributos.map((attr: AtributoProducto) =>
      attr.valores.filter(v => v.activo).map(v => ({ nombre: attr.nombre, valor: v.valor }))
    )

    // Si algún atributo no tiene valores activos, no hay combinaciones
    if (valoresActivos.some((vals: any[]) => vals.length === 0)) return []

    // Generar producto cartesiano
    const cartesian = (arrays: any[][]): any[][] => {
      if (arrays.length === 0) return [[]]
      const [first, ...rest] = arrays
      const restCombinations = cartesian(rest)
      return first.flatMap(item => restCombinations.map(combo => [item, ...combo]))
    }

    return cartesian(valoresActivos).map(combo => {
      const combinacion: Record<string, string> = {}
      combo.forEach((item: { nombre: string; valor: string }) => {
        combinacion[item.nombre.toLowerCase()] = item.valor
      })
      return combinacion
    })
  }

  // Generar SKU para una combinación
  const generarSku = (combinacion: Record<string, string>) => {
    const baseSku = formData.sku || 'PROD'
    const sufijo = Object.values(combinacion).map(v => v.substring(0, 2).toUpperCase()).join('-')
    return `${baseSku}-${sufijo}`
  }

  // Generar variantes automáticamente
  const handleGenerarVariantes = () => {
    const combinaciones = generarCombinaciones()
    if (combinaciones.length === 0) {
      toast.error('No hay combinaciones válidas para generar')
      return
    }

    const nuevasVariantes: Variante[] = combinaciones.map(combinacion => {
      // Verificar si ya existe esta combinación
      const existente = (formData.variantes || []).find((v: Variante) =>
        JSON.stringify(v.combinacion) === JSON.stringify(combinacion)
      )

      if (existente) return existente

      return {
        sku: generarSku(combinacion),
        combinacion,
        precios: {
          compra: 0,
          venta: 0,
          pvp: 0,
          margen: 0,
          usarPrecioBase: true,
        },
        stockPorAlmacen: almacenes.map(alm => ({
          almacenId: alm._id,
          cantidad: 0,
          minimo: 0,
          maximo: 0,
        })),
        activo: true,
      }
    })

    setFormData({
      ...formData,
      variantes: nuevasVariantes,
    })

    toast.success(`${combinaciones.length} variantes generadas`)
    setActiveTab('variantes')
  }

  // Actualizar variante específica
  const updateVariante = (index: number, updates: Partial<Variante>) => {
    const newVariantes = [...(formData.variantes || [])]
    newVariantes[index] = { ...newVariantes[index], ...updates }
    setFormData({ ...formData, variantes: newVariantes })
  }

  // Actualizar precios de variante con cálculo automático de PVP
  const updateVariantePrecios = (index: number, precios: Partial<PrecioVariante>) => {
    const variante = formData.variantes[index]
    const iva = formData.iva || 21

    let newPrecios = { ...variante.precios, ...precios }

    // Si cambia el precio de venta, calcular PVP automáticamente
    if ('venta' in precios) {
      newPrecios.pvp = Math.round((precios.venta || 0) * (1 + iva / 100) * 100) / 100
    }

    // Si cambia compra o venta, calcular margen
    if ('compra' in precios || 'venta' in precios) {
      const compra = newPrecios.compra || 0
      const venta = newPrecios.venta || 0
      newPrecios.margen = compra > 0 ? Math.round(((venta - compra) / compra) * 100 * 100) / 100 : 0
    }

    updateVariante(index, { precios: newPrecios })
  }

  // Actualizar stock de variante en almacén
  const updateVarianteStock = (varianteIndex: number, almacenId: string, updates: Partial<StockVarianteAlmacen>) => {
    const variante = formData.variantes[varianteIndex]
    const stockPorAlmacen = [...(variante.stockPorAlmacen || [])]
    const stockIndex = stockPorAlmacen.findIndex(s => s.almacenId === almacenId)

    if (stockIndex >= 0) {
      stockPorAlmacen[stockIndex] = { ...stockPorAlmacen[stockIndex], ...updates }
    } else {
      stockPorAlmacen.push({ almacenId, cantidad: 0, minimo: 0, maximo: 0, ...updates })
    }

    updateVariante(varianteIndex, { stockPorAlmacen })
  }

  // Eliminar variante
  const removeVariante = (index: number) => {
    setFormData({
      ...formData,
      variantes: formData.variantes.filter((_: any, i: number) => i !== index),
    })
  }

  // Copiar precios base a variante
  const copiarPreciosBase = (index: number) => {
    const iva = formData.iva || 21
    const compra = formData.precios?.compra || 0
    const venta = formData.precios?.venta || 0
    const pvp = Math.round(venta * (1 + iva / 100) * 100) / 100
    const margen = compra > 0 ? Math.round(((venta - compra) / compra) * 100 * 100) / 100 : 0

    updateVariante(index, {
      precios: { compra, venta, pvp, margen, usarPrecioBase: false }
    })
    toast.success('Precios base copiados')
  }

  // Aplicar precios a todas las variantes
  const aplicarPreciosATodas = () => {
    const iva = formData.iva || 21
    const compra = formData.precios?.compra || 0
    const venta = formData.precios?.venta || 0
    const pvp = Math.round(venta * (1 + iva / 100) * 100) / 100
    const margen = compra > 0 ? Math.round(((venta - compra) / compra) * 100 * 100) / 100 : 0

    const variantes = formData.variantes || []
    const newVariantes = variantes.map((v: Variante) => ({
      ...v,
      precios: { compra, venta, pvp, margen, usarPrecioBase: false }
    }))
    setFormData({ ...formData, variantes: newVariantes })
    toast.success('Precios aplicados a todas las variantes')
  }

  // Crear nueva variante en catálogo
  const handleCreateVariante = async () => {
    if (!newVariante.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!newVariante.valores || newVariante.valores.length === 0) {
      toast.error('Debe agregar al menos un valor')
      return
    }

    setIsCreating(true)
    try {
      const response = await variantesService.create(newVariante)
      if (response.success) {
        toast.success('Variante creada correctamente')
        setVariantesCatalogo([...variantesCatalogo, response.data])
        addVarianteFromCatalogo(response.data._id)
        setShowCreateDialog(false)
        setNewVariante({
          nombre: '',
          codigo: '',
          tipoVisualizacion: 'botones',
          obligatorio: true,
          valores: [],
        })
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear la variante')
    } finally {
      setIsCreating(false)
    }
  }

  // Agregar valor a nueva variante
  const addValorToNewVariante = () => {
    if (!newValor.valor.trim()) return
    setNewVariante({
      ...newVariante,
      valores: [
        ...(newVariante.valores || []),
        {
          valor: newValor.valor,
          hexColor: newVariante.tipoVisualizacion === 'colores' ? newValor.hexColor : undefined,
          orden: (newVariante.valores?.length || 0),
          activo: true,
        },
      ],
    })
    setNewValor({ valor: '', hexColor: '#000000' })
  }

  // Eliminar valor de nueva variante
  const removeValorFromNewVariante = (index: number) => {
    setNewVariante({
      ...newVariante,
      valores: newVariante.valores?.filter((_, i) => i !== index),
    })
  }

  // Toggle expandir/colapsar atributo
  const toggleExpandedAtributo = (varianteId: string) => {
    setExpandedAtributos(prev =>
      prev.includes(varianteId)
        ? prev.filter(id => id !== varianteId)
        : [...prev, varianteId]
    )
  }

  // Toggle expandir/colapsar variante
  const toggleExpandedVariante = (index: number) => {
    const key = `var-${index}`
    setExpandedVariantes(prev =>
      prev.includes(key) ? prev.filter(id => id !== key) : [...prev, key]
    )
  }

  // Icono según tipo de visualización
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'colores': return <Palette className="h-4 w-4" />
      case 'dropdown': return <List className="h-4 w-4" />
      case 'imagenes': return <Image className="h-4 w-4" />
      default: return <Grid3X3 className="h-4 w-4" />
    }
  }

  // Formatear combinación para mostrar
  const formatCombinacion = (combinacion: Record<string, string>) => {
    return Object.entries(combinacion).map(([key, value]) => (
      <Badge key={key} variant="outline" className="text-xs mr-1">
        {key}: {value}
      </Badge>
    ))
  }

  // Calcular stock total de una variante
  const calcularStockTotal = (variante: Variante) => {
    return (variante.stockPorAlmacen || []).reduce((sum, s) => sum + (s.cantidad || 0), 0)
  }

  // Número de combinaciones posibles
  const numCombinaciones = useMemo(() => {
    return generarCombinaciones().length
  }, [formData.atributos])

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración de Variantes</h3>

        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tieneVariantes"
              checked={formData.tieneVariantes}
              onCheckedChange={(checked) => setFormData({ ...formData, tieneVariantes: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="tieneVariantes" className="cursor-pointer">
              Este producto tiene variantes (tallas, colores, etc.)
            </Label>
          </div>
        </div>

        {!formData.tieneVariantes ? (
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Activa esta opción si el producto tiene variantes como tallas, colores, materiales, etc.
              Cada variante puede tener su propio SKU, precio y stock por almacén.
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="atributos" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Atributos
                {formData.atributos?.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{formData.atributos.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="variantes" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Variantes
                {formData.variantes?.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{formData.variantes.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* TAB: ATRIBUTOS */}
            <TabsContent value="atributos" className="space-y-4">
              {/* Selector de variantes existentes */}
              {isEditing && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={variantesOptions}
                      value=""
                      onValueChange={addVarianteFromCatalogo}
                      placeholder="Buscar y agregar variante del catálogo..."
                      searchPlaceholder="Buscar por nombre..."
                      emptyMessage={loadingVariantes ? 'Cargando...' : 'No hay más variantes disponibles'}
                      disabled={loadingVariantes}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva
                  </Button>
                </div>
              )}

              {/* Lista de atributos del producto */}
              {formData.atributos && formData.atributos.length > 0 ? (
                <div className="space-y-3">
                  {formData.atributos.map((atributo: AtributoProducto, aIndex: number) => {
                    const isExpanded = expandedAtributos.includes(atributo.varianteId)
                    const activeCount = atributo.valores.filter(v => v.activo).length
                    const totalCount = atributo.valores.length

                    return (
                      <Card key={atributo.varianteId} className="overflow-hidden">
                        <div
                          className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleExpandedAtributo(atributo.varianteId)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              {getTipoIcon(atributo.tipoVisualizacion)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{atributo.nombre}</span>
                                {atributo.obligatorio && (
                                  <Badge variant="secondary" className="text-xs">Obligatorio</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {activeCount} de {totalCount} valores activos
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isEditing && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); removeAtributo(aIndex) }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 border-t">
                            {isEditing && (
                              <div className="flex gap-2 mb-3">
                                <Button type="button" size="sm" variant="outline" onClick={() => toggleAllValores(aIndex, true)}>
                                  Seleccionar todos
                                </Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => toggleAllValores(aIndex, false)}>
                                  Deseleccionar todos
                                </Button>
                              </div>
                            )}

                            <div className={`grid gap-2 ${
                              atributo.tipoVisualizacion === 'colores' ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                            }`}>
                              {atributo.valores.map((valor: any, vIndex: number) => (
                                <div
                                  key={valor.valorId}
                                  className={`relative flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all
                                    ${valor.activo ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-muted bg-muted/30 opacity-60'}
                                    ${isEditing ? 'hover:border-primary/50' : ''}`}
                                  onClick={() => isEditing && toggleValor(aIndex, vIndex)}
                                >
                                  {atributo.tipoVisualizacion === 'colores' && valor.hexColor && (
                                    <div className="w-6 h-6 rounded-full border shadow-sm shrink-0" style={{ backgroundColor: valor.hexColor }} />
                                  )}
                                  <span className={`text-sm truncate ${valor.activo ? 'font-medium' : ''}`}>{valor.valor}</span>
                                  {valor.activo && <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed rounded-lg">
                  <Settings2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-2">No hay atributos configurados</p>
                  <p className="text-sm text-muted-foreground">Busca un atributo existente o crea uno nuevo</p>
                </div>
              )}

              {/* Resumen y botón generar */}
              {formData.atributos && formData.atributos.length > 0 && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Grid3X3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          {numCombinaciones} combinaciones posibles
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Se generarán variantes para cada combinación
                        </p>
                      </div>
                    </div>
                    {isEditing && numCombinaciones > 0 && (
                      <Button type="button" onClick={handleGenerarVariantes}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generar Variantes
                      </Button>
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* TAB: VARIANTES GENERADAS */}
            <TabsContent value="variantes" className="space-y-4">
              {formData.variantes && formData.variantes.length > 0 ? (
                <>
                  {/* Acciones masivas */}
                  {isEditing && (
                    <div className="flex gap-2 mb-4">
                      <Button type="button" variant="outline" size="sm" onClick={aplicarPreciosATodas}>
                        <Copy className="h-4 w-4 mr-2" />
                        Aplicar precios base a todas
                      </Button>
                    </div>
                  )}

                  {/* Lista de variantes */}
                  <div className="space-y-3">
                    {formData.variantes.map((variante: Variante, vIndex: number) => {
                      const isExpanded = expandedVariantes.includes(`var-${vIndex}`)
                      const stockTotal = calcularStockTotal(variante)
                      const usaPrecioBase = variante.precios?.usarPrecioBase !== false

                      return (
                        <Card key={vIndex} className="overflow-hidden">
                          {/* Header de la variante */}
                          <div
                            className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleExpandedVariante(vIndex)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                {isEditing && (
                                  <Checkbox
                                    checked={variante.activo !== false}
                                    onCheckedChange={(checked) => updateVariante(vIndex, { activo: !!checked })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-semibold">{variante.sku}</span>
                                    {!variante.activo && <Badge variant="secondary">Inactivo</Badge>}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {formatCombinacion(variante.combinacion)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-medium">
                                  {usaPrecioBase ? (
                                    <span className="text-muted-foreground">{(formData.precios?.venta || 0).toFixed(2)} € (base)</span>
                                  ) : (
                                    <span>{(variante.precios?.venta || 0).toFixed(2)} €</span>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Warehouse className="h-3 w-3" />
                                  Stock: {stockTotal}
                                </div>
                              </div>
                              {isEditing && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={(e) => { e.stopPropagation(); removeVariante(vIndex) }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </div>
                          </div>

                          {/* Contenido expandido */}
                          {isExpanded && (
                            <div className="p-4 border-t space-y-4">
                              {/* Identificación */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-xs text-muted-foreground">SKU</Label>
                                  <Input
                                    value={variante.sku}
                                    onChange={(e) => updateVariante(vIndex, { sku: e.target.value.toUpperCase() })}
                                    disabled={!isEditing}
                                    className="font-mono"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Código de barras</Label>
                                  <Input
                                    value={variante.codigoBarras || ''}
                                    onChange={(e) => updateVariante(vIndex, { codigoBarras: e.target.value })}
                                    disabled={!isEditing}
                                    placeholder="EAN/UPC"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Ref. proveedor</Label>
                                  <Input
                                    value={variante.referenciaProveedor || ''}
                                    onChange={(e) => updateVariante(vIndex, { referenciaProveedor: e.target.value })}
                                    disabled={!isEditing}
                                  />
                                </div>
                              </div>

                              {/* Precios */}
                              <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="font-semibold flex items-center gap-2">
                                    <Euro className="h-4 w-4" />
                                    Precios
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    {isEditing && (
                                      <>
                                        <Checkbox
                                          id={`usarBase-${vIndex}`}
                                          checked={usaPrecioBase}
                                          onCheckedChange={(checked) => updateVariantePrecios(vIndex, { usarPrecioBase: !!checked })}
                                        />
                                        <Label htmlFor={`usarBase-${vIndex}`} className="text-sm cursor-pointer">
                                          Usar precio base del producto
                                        </Label>
                                        {!usaPrecioBase && (
                                          <Button type="button" size="sm" variant="ghost" onClick={() => copiarPreciosBase(vIndex)}>
                                            <Copy className="h-3 w-3 mr-1" />
                                            Copiar base
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>

                                {usaPrecioBase ? (
                                  <div className="bg-muted/50 rounded p-3 text-sm text-muted-foreground">
                                    Esta variante usa los precios del producto base:
                                    <span className="font-medium ml-2">
                                      Compra: {(formData.precios?.compra || 0).toFixed(2)} € |
                                      Venta: {(formData.precios?.venta || 0).toFixed(2)} € |
                                      PVP: {(formData.precios?.pvp || 0).toFixed(2)} €
                                    </span>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Precio compra</Label>
                                      <div className="relative">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={variante.precios?.compra || 0}
                                          onChange={(e) => updateVariantePrecios(vIndex, { compra: parseFloat(e.target.value) || 0 })}
                                          disabled={!isEditing}
                                          className="pr-8"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Precio venta</Label>
                                      <div className="relative">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={variante.precios?.venta || 0}
                                          onChange={(e) => updateVariantePrecios(vIndex, { venta: parseFloat(e.target.value) || 0 })}
                                          disabled={!isEditing}
                                          className="pr-8"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">PVP</Label>
                                      <div className="relative">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={variante.precios?.pvp || 0}
                                          onChange={(e) => updateVariantePrecios(vIndex, { pvp: parseFloat(e.target.value) || 0 })}
                                          disabled={!isEditing}
                                          className="pr-8"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Stock por almacén */}
                              <div className="border rounded-lg p-4">
                                <Label className="font-semibold flex items-center gap-2 mb-3">
                                  <Warehouse className="h-4 w-4" />
                                  Stock por almacén
                                </Label>
                                {almacenes.length > 0 ? (
                                  <div className="space-y-2">
                                    {almacenes.map((almacen) => {
                                      const stockAlmacen = (variante.stockPorAlmacen || []).find(s => s.almacenId === almacen._id)
                                      return (
                                        <div key={almacen._id} className="grid grid-cols-5 gap-2 items-center">
                                          <div className="col-span-2">
                                            <span className="text-sm font-medium">{almacen.nombre}</span>
                                            <span className="text-xs text-muted-foreground ml-2">({almacen.codigo})</span>
                                          </div>
                                          <div>
                                            <Input
                                              type="number"
                                              min="0"
                                              value={stockAlmacen?.cantidad || 0}
                                              onChange={(e) => updateVarianteStock(vIndex, almacen._id, { cantidad: parseInt(e.target.value) || 0 })}
                                              disabled={!isEditing}
                                              placeholder="Cantidad"
                                              className="h-8"
                                            />
                                          </div>
                                          <div>
                                            <Input
                                              type="number"
                                              min="0"
                                              value={stockAlmacen?.minimo || 0}
                                              onChange={(e) => updateVarianteStock(vIndex, almacen._id, { minimo: parseInt(e.target.value) || 0 })}
                                              disabled={!isEditing}
                                              placeholder="Mín"
                                              className="h-8"
                                            />
                                          </div>
                                          <div>
                                            <Input
                                              type="number"
                                              min="0"
                                              value={stockAlmacen?.maximo || 0}
                                              onChange={(e) => updateVarianteStock(vIndex, almacen._id, { maximo: parseInt(e.target.value) || 0 })}
                                              disabled={!isEditing}
                                              placeholder="Máx"
                                              className="h-8"
                                            />
                                          </div>
                                        </div>
                                      )
                                    })}
                                    <div className="text-xs text-muted-foreground mt-2">
                                      Columnas: Almacén | Cantidad | Mínimo | Máximo
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">
                                    No hay almacenes configurados. Crea almacenes para gestionar el stock.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center border-2 border-dashed rounded-lg">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-2">No hay variantes generadas</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configura los atributos y genera las variantes
                  </p>
                  {formData.atributos?.length > 0 && isEditing && (
                    <Button type="button" onClick={() => { setActiveTab('atributos') }}>
                      <Settings2 className="h-4 w-4 mr-2" />
                      Ir a Atributos
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </Card>

      {/* Dialog para crear nueva variante en catálogo */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Nueva Variante</DialogTitle>
            <DialogDescription>
              Crea una nueva variante que estará disponible para todos tus productos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={newVariante.nombre}
                  onChange={(e) => setNewVariante({ ...newVariante, nombre: e.target.value })}
                  placeholder="Ej: Talla, Color"
                />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={newVariante.codigo}
                  onChange={(e) => setNewVariante({ ...newVariante, codigo: e.target.value.toUpperCase() })}
                  placeholder="Ej: TAL, COL"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de visualización</Label>
                <Select
                  value={newVariante.tipoVisualizacion}
                  onValueChange={(value: any) => setNewVariante({ ...newVariante, tipoVisualizacion: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="botones">Botones</SelectItem>
                    <SelectItem value="dropdown">Desplegable</SelectItem>
                    <SelectItem value="colores">Selector de colores</SelectItem>
                    <SelectItem value="imagenes">Imágenes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newObligatorio"
                    checked={newVariante.obligatorio}
                    onCheckedChange={(checked) => setNewVariante({ ...newVariante, obligatorio: !!checked })}
                  />
                  <Label htmlFor="newObligatorio" className="cursor-pointer">Obligatorio</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Valores</Label>
              <div className="flex gap-2">
                <Input
                  value={newValor.valor}
                  onChange={(e) => setNewValor({ ...newValor, valor: e.target.value })}
                  placeholder="Ej: S, M, L, XL"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValorToNewVariante())}
                />
                {newVariante.tipoVisualizacion === 'colores' && (
                  <Input
                    type="color"
                    value={newValor.hexColor}
                    onChange={(e) => setNewValor({ ...newValor, hexColor: e.target.value })}
                    className="w-16"
                  />
                )}
                <Button type="button" onClick={addValorToNewVariante}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {newVariante.valores && newVariante.valores.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newVariante.valores.map((valor, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-1">
                      {newVariante.tipoVisualizacion === 'colores' && valor.hexColor && (
                        <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: valor.hexColor }} />
                      )}
                      {valor.valor}
                      <button
                        type="button"
                        onClick={() => removeValorFromNewVariante(index)}
                        className="ml-1 p-0.5 hover:bg-muted rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateVariante} disabled={isCreating}>
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Variante
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
