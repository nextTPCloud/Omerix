'use client'

import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditableSearchableSelect } from '@/components/ui/searchable-select'
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Package,
  Columns,
  RotateCcw,
  Save,
  Loader2,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { useParteTrabajoLineasConfig } from '@/hooks/useParteTrabajoLineasConfig'
import { formatCurrency } from '@/lib/utils'
import { LineaMaterial } from '@/types/parte-trabajo.types'

interface ProductoOption {
  value: string
  label: string
  description?: string
}

interface LineasMaterialGridProps {
  lineas: LineaMaterial[]
  productos: any[]
  productosOptions: ProductoOption[]
  mostrarCostes?: boolean

  onAddLinea: () => void
  onUpdateLinea: (index: number, campo: string, valor: any) => void
  onRemoveLinea: (index: number) => void
  onProductoSelect: (index: number, productoId: string, producto?: any) => void

  // Steps para decimales
  stepPrecios?: number
  stepCantidad?: number
}

export function LineasMaterialGrid({
  lineas,
  productos,
  productosOptions,
  mostrarCostes = false,
  onAddLinea,
  onUpdateLinea,
  onRemoveLinea,
  onProductoSelect,
  stepPrecios = 0.01,
  stepCantidad = 1,
}: LineasMaterialGridProps) {
  // Refs para navegación con teclado
  const cantidadRefs = useRef<Map<number, HTMLInputElement>>(new Map())
  const productoRefs = useRef<Map<number, HTMLInputElement>>(new Map())

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
  } = useParteTrabajoLineasConfig('material', { mostrarCostes })

  // Handler para guardar columnas
  const handleGuardarColumnas = async () => {
    await guardarColumnas()
    toast.success('Configuración de columnas guardada')
  }

  // Handler global para Ctrl+Enter
  const handleGridKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      e.stopPropagation()
      onAddLinea()
    }
  }, [onAddLinea])

  // Handler para Enter en cantidad - añadir línea si es la última
  const handleCantidadKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (index === lineas.length - 1) {
        onAddLinea()
        setTimeout(() => {
          const newIndex = lineas.length
          const input = productoRefs.current.get(newIndex)
          if (input) input.focus()
        }, 100)
      }
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onAddLinea()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextInput = cantidadRefs.current.get(index + 1)
      if (nextInput) {
        nextInput.focus()
        nextInput.select()
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevInput = cantidadRefs.current.get(index - 1)
      if (prevInput) {
        prevInput.focus()
        prevInput.select()
      }
    }
  }, [lineas.length, onAddLinea])

  // Mover línea hacia arriba
  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return
    // No tenemos acceso directo a setLineas, pero podemos simular intercambio
    // En el padre se manejará esto
  }, [])

  // Mover línea hacia abajo
  const handleMoveDown = useCallback((index: number) => {
    if (index === lineas.length - 1) return
  }, [lineas.length])

  // Duplicar línea
  const handleDuplicate = useCallback((index: number) => {
    // Se manejará en el padre
  }, [])

  // Renderizar celda según tipo de columna
  const renderCell = useCallback((
    key: string,
    linea: LineaMaterial,
    index: number
  ) => {
    switch (key) {
      case 'producto':
        return (
          <div className="space-y-1">
            <EditableSearchableSelect
              inputRef={(el: HTMLInputElement | null) => {
                if (el) productoRefs.current.set(index, el)
              }}
              options={productosOptions}
              value={linea.productoId || ''}
              displayValue={linea.nombre || linea.productoNombre || ''}
              onValueChange={(value) => {
                const p = productos.find(x => x._id === value)
                onProductoSelect(index, value, p)
              }}
              onDisplayValueChange={(value) => onUpdateLinea(index, 'nombre', value)}
              onEnterPress={() => {
                const input = cantidadRefs.current.get(index)
                if (input) {
                  input.focus()
                  input.select()
                }
              }}
              placeholder="Buscar producto..."
              className="w-full"
            />
            {/* Indicador de kit si el producto tiene componentes */}
            {linea.componentesKit && linea.componentesKit.length > 0 && (
              <div className="ml-2 space-y-1 border-l-2 border-primary/20 pl-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  <Badge variant="secondary" className="gap-1">
                    <Layers className="h-3 w-3" />
                    Kit ({linea.componentesKit.length})
                  </Badge>
                </div>
                {linea.componentesKit.map((comp: any, compIndex: number) => (
                  <div
                    key={compIndex}
                    className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-muted/50"
                  >
                    <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 truncate">{comp.nombre}</span>
                    <span className="text-muted-foreground">x{comp.cantidad}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'codigo':
        return (
          <span className="text-xs text-muted-foreground truncate">
            {linea.productoCodigo || linea.codigo || '-'}
          </span>
        )

      case 'cantidad':
        return (
          <Input
            ref={(el) => {
              if (el) cantidadRefs.current.set(index, el)
            }}
            type="number"
            min="0"
            step={stepCantidad}
            value={linea.cantidad || 1}
            onChange={(e) => onUpdateLinea(index, 'cantidad', parseFloat(e.target.value) || 0)}
            onKeyDown={(e) => handleCantidadKeyDown(e, index)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'unidad':
        return (
          <Input
            value={linea.unidad || 'ud'}
            onChange={(e) => onUpdateLinea(index, 'unidad', e.target.value)}
            className="w-full text-center text-sm h-8"
          />
        )

      case 'precioCoste':
        return (
          <Input
            type="number"
            min="0"
            step={stepPrecios}
            value={linea.precioCoste || 0}
            onChange={(e) => onUpdateLinea(index, 'precioCoste', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'precioVenta':
        return (
          <Input
            type="number"
            min="0"
            step={stepPrecios}
            value={linea.precioVenta || 0}
            onChange={(e) => onUpdateLinea(index, 'precioVenta', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'descuento':
        return (
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={linea.descuento || 0}
            onChange={(e) => onUpdateLinea(index, 'descuento', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'costeTotal':
        return (
          <span className="text-right text-sm">
            {formatCurrency(linea.costeTotal || 0)}
          </span>
        )

      case 'ventaTotal':
        return (
          <span className="text-right text-sm font-medium text-green-600">
            {formatCurrency(linea.ventaTotal || 0)}
          </span>
        )

      case 'facturable':
        return (
          <div className="flex justify-center">
            <Switch
              checked={linea.facturable !== false}
              onCheckedChange={(checked) => onUpdateLinea(index, 'facturable', checked)}
            />
          </div>
        )

      case 'acciones':
        return (
          <div className="flex justify-end gap-0.5 flex-nowrap">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleMoveUp(index)}
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
              onClick={() => handleMoveDown(index)}
              disabled={index === lineas.length - 1}
              title="Bajar"
            >
              <ArrowDown className="h-3.5 w-3.5" />
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
    productosOptions,
    productos,
    lineas.length,
    stepCantidad,
    stepPrecios,
    handleCantidadKeyDown,
    onUpdateLinea,
    onProductoSelect,
    onRemoveLinea,
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
    <Card onKeyDown={handleGridKeyDown}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Líneas de Material
          </CardTitle>
          <CardDescription>
            Pulse Ctrl+Enter para añadir líneas rápidamente
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

          <Button type="button" variant="outline" size="sm" onClick={onAddLinea}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {(!lineas || lineas.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay líneas de material</p>
            <p className="text-sm">Haz clic en "Agregar" o pulsa Ctrl+Enter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="space-y-2"
              style={{
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
                  key={index}
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
