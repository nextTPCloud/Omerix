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
import { SearchableSelect, MultiSearchableSelect } from '@/components/ui/searchable-select'
import { Plus, Trash2, X, Palette, List, Grid3X3, Image, Search, Settings2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { variantesService, Variante, ValorVariante, CreateVarianteDTO } from '@/services/variantes.service'
import { toast } from 'sonner'

interface AtributoProducto {
  varianteId: string        // ID de la variante del catálogo
  nombre: string            // Nombre de la variante (ej: Talla)
  tipoVisualizacion: 'botones' | 'dropdown' | 'colores' | 'imagenes'
  obligatorio: boolean
  valores: {                // Valores seleccionados para este producto
    valorId: string         // ID del valor en el catálogo
    valor: string           // El valor (ej: M, L, XL)
    hexColor?: string
    imagen?: string
    activo: boolean
  }[]
}

interface TabVariantesProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

export function TabVariantes({ formData, setFormData, isEditing }: TabVariantesProps) {
  // Estado para variantes del catálogo
  const [variantesCatalogo, setVariantesCatalogo] = useState<Variante[]>([])
  const [loadingVariantes, setLoadingVariantes] = useState(false)

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

  // Estado para expandir/colapsar atributos
  const [expandedAtributos, setExpandedAtributos] = useState<string[]>([])

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
        activo: true, // Por defecto todos activos
      })),
    }

    setFormData({
      ...formData,
      atributos: [...(formData.atributos || []), nuevoAtributo],
    })

    // Expandir el nuevo atributo
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

  // Crear nueva variante
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
        // Agregar al catálogo local
        setVariantesCatalogo([...variantesCatalogo, response.data])
        // Agregar al producto
        addVarianteFromCatalogo(response.data._id)
        // Cerrar diálogo y resetear
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

  // Toggle expandir/colapsar
  const toggleExpanded = (varianteId: string) => {
    setExpandedAtributos(prev =>
      prev.includes(varianteId)
        ? prev.filter(id => id !== varianteId)
        : [...prev, varianteId]
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

  // Contar valores activos
  const countActiveValues = (atributo: AtributoProducto) => {
    return atributo.valores.filter(v => v.activo).length
  }

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
              Las variantes se gestionan desde el catálogo y pueden reutilizarse en múltiples productos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Variante
                </Button>
              </div>
            )}

            {/* Lista de atributos del producto */}
            {formData.atributos && formData.atributos.length > 0 ? (
              <div className="space-y-3">
                {formData.atributos.map((atributo: AtributoProducto, aIndex: number) => {
                  const isExpanded = expandedAtributos.includes(atributo.varianteId)
                  const activeCount = countActiveValues(atributo)
                  const totalCount = atributo.valores.length

                  return (
                    <Card key={atributo.varianteId} className="overflow-hidden">
                      {/* Header del atributo */}
                      <div
                        className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleExpanded(atributo.varianteId)}
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
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Contenido expandible */}
                      {isExpanded && (
                        <div className="p-4 border-t">
                          {/* Acciones rápidas */}
                          {isEditing && (
                            <div className="flex gap-2 mb-3">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => toggleAllValores(aIndex, true)}
                              >
                                Seleccionar todos
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => toggleAllValores(aIndex, false)}
                              >
                                Deseleccionar todos
                              </Button>
                            </div>
                          )}

                          {/* Grid de valores */}
                          <div className={`grid gap-2 ${
                            atributo.tipoVisualizacion === 'colores'
                              ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8'
                              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                          }`}>
                            {atributo.valores.map((valor: any, vIndex: number) => (
                              <div
                                key={valor.valorId}
                                className={`
                                  relative flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all
                                  ${valor.activo
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                    : 'border-muted bg-muted/30 opacity-60'
                                  }
                                  ${isEditing ? 'hover:border-primary/50' : ''}
                                `}
                                onClick={() => isEditing && toggleValor(aIndex, vIndex)}
                              >
                                {atributo.tipoVisualizacion === 'colores' && valor.hexColor && (
                                  <div
                                    className="w-6 h-6 rounded-full border shadow-sm shrink-0"
                                    style={{ backgroundColor: valor.hexColor }}
                                  />
                                )}
                                <span className={`text-sm truncate ${valor.activo ? 'font-medium' : ''}`}>
                                  {valor.valor}
                                </span>
                                {valor.activo && (
                                  <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                                )}
                              </div>
                            ))}
                          </div>

                          {atributo.valores.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Esta variante no tiene valores definidos
                            </p>
                          )}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed rounded-lg">
                <Settings2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-2">
                  No hay variantes configuradas para este producto
                </p>
                <p className="text-sm text-muted-foreground">
                  Busca una variante existente o crea una nueva para comenzar
                </p>
              </div>
            )}

            {/* Resumen de combinaciones */}
            {formData.atributos && formData.atributos.length > 0 && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Grid3X3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Combinaciones posibles
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {formData.atributos.reduce((total: number, attr: AtributoProducto) => {
                        const activeCount = attr.valores.filter((v: any) => v.activo).length
                        return total === 0 ? activeCount : total * activeCount
                      }, 0)} variantes se generarán al guardar
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </Card>

      {/* Dialog para crear nueva variante */}
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
                  placeholder="Ej: Talla, Color, Material"
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <Label htmlFor="newObligatorio" className="cursor-pointer">
                    Obligatorio
                  </Label>
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
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 pl-2 pr-1 py-1"
                    >
                      {newVariante.tipoVisualizacion === 'colores' && valor.hexColor && (
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: valor.hexColor }}
                        />
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
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
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
