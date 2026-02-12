'use client'

import React, { useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Wrench,
  Columns,
  RotateCcw,
  Save,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useParteTrabajoLineasConfig } from '@/hooks/useParteTrabajoLineasConfig'
import { formatCurrency } from '@/lib/utils'
import { LineaMaquinaria } from '@/types/parte-trabajo.types'

interface MaquinariaOption {
  value: string
  label: string
  description?: string
}

interface PersonalOption {
  value: string
  label: string
  description?: string
}

interface LineasMaquinariaGridProps {
  lineas: LineaMaquinaria[]
  maquinarias: any[]
  maquinariasOptions: MaquinariaOption[]
  personalOptions: PersonalOption[]
  personal: any[]
  mostrarCostes?: boolean

  onAddLinea: () => void
  onUpdateLinea: (index: number, campo: string, valor: any) => void
  onRemoveLinea: (index: number) => void
  onMaquinariaSelect: (index: number, maquinariaId: string, maquinaria?: any) => void

  stepPrecios?: number
  stepCantidad?: number
}

export function LineasMaquinariaGrid({
  lineas,
  maquinarias,
  maquinariasOptions,
  personalOptions,
  personal,
  mostrarCostes = false,
  onAddLinea,
  onUpdateLinea,
  onRemoveLinea,
  onMaquinariaSelect,
  stepPrecios = 0.01,
  stepCantidad = 1,
}: LineasMaquinariaGridProps) {
  // Refs para navegación con teclado
  const cantidadRefs = useRef<Map<number, HTMLInputElement>>(new Map())

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
  } = useParteTrabajoLineasConfig('maquinaria', { mostrarCostes })

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

  // Handler para Enter en cantidad
  const handleCantidadKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (index === lineas.length - 1) {
        onAddLinea()
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

  // Renderizar celda según tipo de columna
  const renderCell = useCallback((
    key: string,
    linea: LineaMaquinaria,
    index: number
  ) => {
    switch (key) {
      case 'maquinaria':
        return (
          <SearchableSelect
            options={maquinariasOptions}
            value={linea.maquinariaId || ''}
            onValueChange={(value) => {
              const m = maquinarias.find(x => x._id === value)
              onMaquinariaSelect(index, value, m)
            }}
            placeholder="Seleccionar maquinaria..."
            searchPlaceholder="Buscar maquinaria..."
            emptyMessage="No encontrado"
            triggerClassName="h-9"
            allowClear
          />
        )

      case 'codigo':
        return (
          <span className="text-xs text-muted-foreground truncate">
            {linea.codigo || '-'}
          </span>
        )

      case 'operador':
        return (
          <SearchableSelect
            options={personalOptions}
            value={linea.operadorId || ''}
            onValueChange={(value) => {
              const p = personal.find(x => x._id === value)
              onUpdateLinea(index, 'operadorId', value)
              if (p) {
                onUpdateLinea(index, 'operadorNombre', `${p.nombre} ${p.apellidos || ''}`.trim())
              }
            }}
            placeholder="Operador..."
            searchPlaceholder="Buscar..."
            emptyMessage="No encontrado"
            triggerClassName="h-9"
            allowClear
          />
        )

      case 'tipoUnidad':
        return (
          <Select
            value={linea.tipoUnidad || 'horas'}
            onValueChange={(value) => onUpdateLinea(index, 'tipoUnidad', value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horas">Horas</SelectItem>
              <SelectItem value="dias">Días</SelectItem>
              <SelectItem value="km">Km</SelectItem>
              <SelectItem value="unidades">Unidades</SelectItem>
            </SelectContent>
          </Select>
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

      case 'fechaUso':
        return (
          <Input
            type="date"
            value={linea.fechaUso?.split('T')[0] || ''}
            onChange={(e) => onUpdateLinea(index, 'fechaUso', e.target.value)}
            className="w-full text-sm h-8"
          />
        )

      case 'tarifaCoste':
        return (
          <Input
            type="number"
            min="0"
            step={stepPrecios}
            value={linea.tarifaCoste || 0}
            onChange={(e) => onUpdateLinea(index, 'tarifaCoste', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'tarifaVenta':
        return (
          <Input
            type="number"
            min="0"
            step={stepPrecios}
            value={linea.tarifaVenta || 0}
            onChange={(e) => onUpdateLinea(index, 'tarifaVenta', parseFloat(e.target.value) || 0)}
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
    maquinariasOptions,
    personalOptions,
    maquinarias,
    personal,
    lineas.length,
    stepCantidad,
    stepPrecios,
    handleCantidadKeyDown,
    onUpdateLinea,
    onMaquinariaSelect,
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
            <Wrench className="h-5 w-5" />
            Líneas de Maquinaria
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
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay líneas de maquinaria</p>
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
