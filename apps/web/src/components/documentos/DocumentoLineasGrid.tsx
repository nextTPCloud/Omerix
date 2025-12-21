'use client'

import React, { useMemo, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SearchableSelect, EditableSearchableSelect } from '@/components/ui/searchable-select'
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  Package,
  Layers,
  Tag,
  ShoppingCart,
  Columns,
  RotateCcw,
  Save,
  Loader2,
  PackageCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { useLineasConfig } from '@/hooks/useLineasConfig'
import { TipoLinea, TIPOS_LINEA_OPTIONS } from '@/types/documento-linea.types'
import { formatCurrency } from '@/lib/utils'

/**
 * Tipo de línea extendida con campos opcionales para precio/origen
 */
interface LineaDocumento {
  _id?: string
  orden: number
  tipo: TipoLinea
  productoId?: string
  codigo?: string
  nombre: string
  descripcion?: string
  descripcionLarga?: string
  sku?: string
  cantidad: number
  cantidadSolicitada?: number
  cantidadEntregada?: number
  unidad?: string
  peso?: number
  pesoTotal?: number
  precioUnitario: number
  precioOriginal?: number
  origenPrecio?: string
  detalleOrigenPrecio?: {
    tarifaNombre?: string
    ofertaNombre?: string
    descuentoAplicado?: number
  }
  descuento: number
  descuentoImporte: number
  subtotal: number
  iva: number
  ivaImporte: number
  total: number
  costeUnitario: number
  costeTotalLinea: number
  margenUnitario: number
  margenPorcentaje: number
  margenTotalLinea: number
  componentesKit?: any[]
  mostrarComponentes: boolean
  esEditable: boolean
  incluidoEnTotal: boolean
  notasInternas?: string
}

interface ProductoOption {
  value: string
  label: string
}

interface DocumentoLineasGridProps {
  // Identificador del módulo para persistir configuración
  moduloNombre: string

  // Líneas del documento
  lineas: LineaDocumento[]

  // Tipo de documento
  esVenta?: boolean
  esAlbaran?: boolean
  mostrarCostes?: boolean
  mostrarMargenes?: boolean

  // Opciones de productos para el selector
  productosOptions: ProductoOption[]

  // Handlers principales
  onAddLinea: (tipo?: TipoLinea) => void
  onUpdateLinea: (index: number, updates: Partial<LineaDocumento>) => void
  onRemoveLinea: (index: number) => void
  onDuplicateLinea: (index: number) => void
  onMoveLinea: (index: number, direction: 'up' | 'down') => void
  onProductoSelect: (index: number, productoId: string) => void
  onNombreChange: (index: number, nombre: string) => void
  onOpenDescripcionDialog?: (index: number) => void
  onProductEnterPress?: (index: number) => void

  // Permisos
  canModificarPVP?: () => boolean
  canAplicarDescuentos?: () => boolean
  getDescuentoMaximo?: () => number

  // Refs para inputs
  cantidadRefs?: React.MutableRefObject<Map<number, HTMLInputElement>>
  productoRefs?: React.MutableRefObject<Map<number, HTMLInputElement>>

  // Handlers de teclado
  onCantidadKeyDown?: (e: React.KeyboardEvent, index: number) => void

  // Handler específico para albaranes (entregar todo)
  onEntregarTodo?: (index: number) => void
}

// Tipos de IVA
const TIPOS_IVA = [
  { value: '21', label: '21%' },
  { value: '10', label: '10%' },
  { value: '4', label: '4%' },
  { value: '0', label: '0%' },
]

export function DocumentoLineasGrid({
  moduloNombre,
  lineas,
  esVenta = true,
  esAlbaran = false,
  mostrarCostes = false,
  mostrarMargenes = false,
  productosOptions,
  onAddLinea,
  onUpdateLinea,
  onRemoveLinea,
  onDuplicateLinea,
  onMoveLinea,
  onProductoSelect,
  onNombreChange,
  onOpenDescripcionDialog,
  onProductEnterPress,
  canModificarPVP = () => true,
  canAplicarDescuentos = () => true,
  getDescuentoMaximo = () => 100,
  cantidadRefs,
  productoRefs,
  onCantidadKeyDown,
  onEntregarTodo,
}: DocumentoLineasGridProps) {
  // Configuración de columnas
  const {
    isLoading,
    isSaving,
    columnasVisibles,
    columnasParaSelector,
    toggleColumna,
    esColumnaVisible,
    resetConfig,
    guardarColumnas,
    gridStyle,
  } = useLineasConfig(moduloNombre, { esVenta, mostrarCostes, esAlbaran })

  // Handler para guardar columnas con toast
  const handleGuardarColumnas = async () => {
    await guardarColumnas()
    toast.success('Configuración de columnas guardada')
  }

  // Tipos de línea para el selector
  const tiposLinea = TIPOS_LINEA_OPTIONS

  // Renderizar celda según tipo
  const renderCell = useCallback((
    key: string,
    linea: LineaDocumento,
    index: number
  ) => {
    const esTextoOSubtotal = linea.tipo === TipoLinea.TEXTO || linea.tipo === TipoLinea.SUBTOTAL

    switch (key) {
      case 'tipo':
        return (
          <select
            value={linea.tipo}
            onChange={(e) => onUpdateLinea(index, { tipo: e.target.value as TipoLinea })}
            className="h-9 w-full text-xs rounded-md border border-input bg-background px-2"
          >
            {tiposLinea.map(tipo => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </select>
        )

      case 'codigo':
        return (
          <span className="text-xs text-muted-foreground truncate">
            {linea.codigo || linea.sku || '-'}
          </span>
        )

      case 'nombre':
        return esTextoOSubtotal ? (
          <Input
            value={linea.nombre}
            onChange={(e) => onNombreChange(index, e.target.value)}
            placeholder={linea.tipo === TipoLinea.TEXTO ? 'Texto libre...' : 'Subtotal'}
            className="text-sm"
          />
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip delayDuration={500}>
                  <TooltipTrigger asChild>
                    <div className="flex-1">
                      <EditableSearchableSelect
                        inputRef={(el: HTMLInputElement | null) => {
                          if (el && productoRefs) productoRefs.current.set(index, el)
                        }}
                        options={productosOptions}
                        value={linea.productoId || ''}
                        displayValue={linea.nombre}
                        onValueChange={(value) => onProductoSelect(index, value)}
                        onDisplayValueChange={(value) => onNombreChange(index, value)}
                        onEnterPress={() => onProductEnterPress?.(index)}
                        placeholder="Buscar producto..."
                        className="w-full"
                      />
                    </div>
                  </TooltipTrigger>
                  {linea.nombre && linea.nombre.length > 30 && (
                    <TooltipContent side="top" className="max-w-md">
                      <p className="text-sm font-medium">{linea.nombre}</p>
                      {linea.codigo && <p className="text-xs text-muted-foreground">Ref: {linea.codigo}</p>}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              {onOpenDescripcionDialog && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => onOpenDescripcionDialog(index)}
                      >
                        <AlignLeft className={`h-4 w-4 ${linea.descripcionLarga ? 'text-primary' : 'text-muted-foreground'}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm">
                      {linea.descripcionLarga ? (
                        <div className="space-y-1">
                          <p className="font-medium text-xs">Descripción:</p>
                          <p className="text-xs whitespace-pre-wrap">{linea.descripcionLarga}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Click para añadir descripción</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {linea.descripcion && (
              <p className="text-xs text-muted-foreground truncate">{linea.descripcion}</p>
            )}
            {/* Indicador de kit */}
            {linea.tipo === TipoLinea.KIT && (
              <Badge variant="secondary" className="flex-shrink-0 gap-1 mt-1 w-fit">
                <Layers className="h-3 w-3" />
                Kit
              </Badge>
            )}
            {/* Componentes del kit */}
            {linea.tipo === TipoLinea.KIT && linea.mostrarComponentes && linea.componentesKit && linea.componentesKit.length > 0 && (
              <div className="ml-2 mt-2 space-y-1 border-l-2 border-primary/20 pl-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Componentes ({linea.componentesKit.length}):
                </div>
                {linea.componentesKit.map((comp, compIndex) => (
                  <div
                    key={compIndex}
                    className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${
                      comp.opcional ? 'bg-amber-50 border border-amber-200' : 'bg-muted/50'
                    }`}
                  >
                    <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 truncate">{comp.nombre}</span>
                    <span className="text-muted-foreground">x{comp.cantidad}</span>
                    {comp.opcional && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        Opcional
                      </Badge>
                    )}
                    <span className="font-medium">{formatCurrency(comp.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'cantidad':
        if (esTextoOSubtotal) return null
        return (
          <Input
            ref={(el) => {
              if (el && cantidadRefs) cantidadRefs.current.set(index, el)
            }}
            type="number"
            min="0"
            step="1"
            value={linea.cantidad}
            onChange={(e) => onUpdateLinea(index, { cantidad: parseFloat(e.target.value) || 0 })}
            onKeyDown={(e) => onCantidadKeyDown?.(e, index)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'cantidadSolicitada':
        if (esTextoOSubtotal) return null
        return (
          <Input
            type="number"
            min="0"
            step="1"
            value={linea.cantidadSolicitada ?? linea.cantidad ?? 0}
            onChange={(e) => onUpdateLinea(index, { cantidadSolicitada: parseFloat(e.target.value) || 0 })}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'cantidadEntregada':
        if (esTextoOSubtotal) return null
        return (
          <Input
            ref={(el) => {
              if (el && cantidadRefs) cantidadRefs.current.set(index, el)
            }}
            type="number"
            min="0"
            step="1"
            value={linea.cantidadEntregada ?? 0}
            onChange={(e) => onUpdateLinea(index, { cantidadEntregada: parseFloat(e.target.value) || 0 })}
            onKeyDown={(e) => onCantidadKeyDown?.(e, index)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'unidad':
        return (
          <span className="text-xs text-center text-muted-foreground">
            {linea.unidad || '-'}
          </span>
        )

      case 'peso':
        return (
          <span className="text-xs text-right text-muted-foreground">
            {linea.pesoTotal ? `${linea.pesoTotal.toFixed(2)} kg` : '-'}
          </span>
        )

      case 'precioUnitario':
        if (esTextoOSubtotal) return null
        return (
          <div className="flex flex-col items-end gap-0.5">
            {/* Indicador de origen de precio */}
            {linea.origenPrecio && linea.origenPrecio !== 'producto' && linea.origenPrecio !== 'manual' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      {linea.precioOriginal && linea.precioOriginal !== linea.precioUnitario && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatCurrency(linea.precioOriginal)}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1 py-0 h-4 ${
                          linea.origenPrecio === 'tarifa'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : linea.origenPrecio === 'oferta'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        <Tag className="h-2.5 w-2.5 mr-0.5" />
                        {linea.origenPrecio === 'tarifa' ? 'Tarifa' :
                         linea.origenPrecio === 'oferta' ? 'Oferta' :
                         linea.origenPrecio === 'precio_cantidad' ? 'Precio x Cant.' : ''}
                        {linea.detalleOrigenPrecio?.descuentoAplicado && linea.detalleOrigenPrecio.descuentoAplicado > 0 && (
                          <span className="ml-0.5">-{linea.detalleOrigenPrecio.descuentoAplicado.toFixed(0)}%</span>
                        )}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="space-y-1">
                      {linea.detalleOrigenPrecio?.tarifaNombre && (
                        <p><strong>Tarifa:</strong> {linea.detalleOrigenPrecio.tarifaNombre}</p>
                      )}
                      {linea.detalleOrigenPrecio?.ofertaNombre && (
                        <p><strong>Oferta:</strong> {linea.detalleOrigenPrecio.ofertaNombre}</p>
                      )}
                      {linea.precioOriginal && linea.precioOriginal !== linea.precioUnitario && (
                        <p>
                          <strong>Precio original:</strong> {formatCurrency(linea.precioOriginal)}
                          {' → '}
                          <strong>Aplicado:</strong> {formatCurrency(linea.precioUnitario)}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Input
              type="number"
              min="0"
              step="0.01"
              value={linea.precioUnitario}
              onChange={(e) => onUpdateLinea(index, { precioUnitario: parseFloat(e.target.value) || 0, origenPrecio: 'manual' })}
              className="w-full text-right text-sm h-8"
              disabled={!canModificarPVP()}
            />
          </div>
        )

      case 'costeUnitario':
        if (esTextoOSubtotal) return null
        return (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={linea.costeUnitario}
            onChange={(e) => onUpdateLinea(index, { costeUnitario: parseFloat(e.target.value) || 0 })}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'descuento':
        if (esTextoOSubtotal) return null
        return (
          <Input
            type="number"
            min="0"
            max={canAplicarDescuentos() ? getDescuentoMaximo() : 0}
            step="0.1"
            value={linea.descuento}
            onChange={(e) => {
              const valor = parseFloat(e.target.value) || 0
              const max = getDescuentoMaximo()
              onUpdateLinea(index, { descuento: Math.min(valor, max) })
            }}
            className="w-full text-right text-sm h-8"
            disabled={!canAplicarDescuentos()}
          />
        )

      case 'subtotalBruto':
        if (esTextoOSubtotal) return null
        return (
          <span className="text-right text-sm">
            {formatCurrency(linea.cantidad * linea.precioUnitario)}
          </span>
        )

      case 'iva':
        if (esTextoOSubtotal) return null
        return (
          <SearchableSelect
            options={TIPOS_IVA}
            value={linea.iva?.toString() || '21'}
            onValueChange={(value) => onUpdateLinea(index, { iva: parseInt(value) })}
          />
        )

      case 'ivaImporte':
        if (esTextoOSubtotal) return null
        return (
          <span className="text-right text-sm">
            {formatCurrency(linea.ivaImporte || 0)}
          </span>
        )

      case 'subtotal':
        if (linea.tipo === TipoLinea.TEXTO) return null
        return (
          <span className="text-right font-medium">
            {formatCurrency(linea.subtotal || 0)}
          </span>
        )

      case 'costeTotalLinea':
        if (esTextoOSubtotal) return null
        return (
          <span className="text-right text-sm">
            {formatCurrency(linea.costeTotalLinea || 0)}
          </span>
        )

      case 'margenPorcentaje':
        if (esTextoOSubtotal) return null
        return (
          <span className={`text-right text-sm ${linea.margenPorcentaje >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {linea.margenPorcentaje?.toFixed(1)}%
          </span>
        )

      case 'notasInternas':
        return (
          <Input
            value={linea.notasInternas || ''}
            onChange={(e) => onUpdateLinea(index, { notasInternas: e.target.value })}
            placeholder="Notas..."
            className="w-full text-xs h-8"
          />
        )

      case 'acciones':
        return (
          <div className="flex justify-end gap-0.5">
            {onEntregarTodo && !esTextoOSubtotal && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEntregarTodo(index)}
                title="Entregar todo"
              >
                <PackageCheck className="h-3.5 w-3.5 text-green-600" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onMoveLinea(index, 'up')}
              disabled={index === 0}
              title="Subir"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onMoveLinea(index, 'down')}
              disabled={index === lineas.length - 1}
              title="Bajar"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDuplicateLinea(index)}
              title="Duplicar"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onRemoveLinea(index)}
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )

      default:
        return null
    }
  }, [
    tiposLinea,
    productosOptions,
    lineas.length,
    onUpdateLinea,
    onNombreChange,
    onProductoSelect,
    onProductEnterPress,
    onOpenDescripcionDialog,
    onMoveLinea,
    onDuplicateLinea,
    onRemoveLinea,
    onEntregarTodo,
    cantidadRefs,
    productoRefs,
    onCantidadKeyDown,
    canModificarPVP,
    canAplicarDescuentos,
    getDescuentoMaximo,
  ])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Líneas del documento</CardTitle>
          <CardDescription>
            Pulse Ctrl+Enter o Enter en cantidad para añadir líneas rápidamente
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {/* Selector de columnas */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columnasParaSelector.map((columna) => (
                <DropdownMenuCheckboxItem
                  key={columna.key}
                  checked={esColumnaVisible(columna.key)}
                  onCheckedChange={() => toggleColumna(columna.key)}
                >
                  {columna.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="flex gap-1 p-1">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={handleGuardarColumnas}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetConfig()}
                  disabled={isSaving}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button type="button" variant="outline" onClick={() => onAddLinea(TipoLinea.PRODUCTO)}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Línea
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {(!lineas || lineas.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay líneas en este documento</p>
            <p className="text-sm">Pulse "Añadir línea" para comenzar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="space-y-2"
              style={{
                // Suma de anchos + gaps entre columnas (0.5rem = 8px por gap)
                minWidth: `${columnasVisibles.reduce((acc, col) => acc + (col.ancho || col.width), 0) + (columnasVisibles.length - 1) * 8}px`,
              }}
            >
              {/* Encabezados */}
              <div
                style={gridStyle}
                className="text-xs font-medium text-muted-foreground px-2 pb-2 border-b"
              >
                {columnasVisibles.map(col => (
                  <div
                    key={col.key}
                    className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  >
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Líneas */}
              {lineas.map((linea, index) => (
                <div
                  key={linea._id || index}
                  style={gridStyle}
                  className="items-center py-2 px-2 rounded hover:bg-muted/50"
                >
                  {columnasVisibles.map(col => (
                    <div key={col.key} className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}>
                      {renderCell(col.key, linea, index)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
