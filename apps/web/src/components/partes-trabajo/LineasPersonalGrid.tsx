'use client'

import React, { useMemo, useCallback, useRef } from 'react'
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
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Users,
  Columns,
  RotateCcw,
  Save,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useParteTrabajoLineasConfig } from '@/hooks/useParteTrabajoLineasConfig'
import { formatCurrency } from '@/lib/utils'
import { LineaPersonal } from '@/types/parte-trabajo.types'

interface PersonalOption {
  value: string
  label: string
  description?: string
}

interface ProductoOption {
  value: string
  label: string
  description?: string
}

interface LineasPersonalGridProps {
  lineas: LineaPersonal[]
  personal: any[]
  personalOptions: PersonalOption[]
  productosServicioOptions: ProductoOption[]
  productos: any[]
  mostrarCostes?: boolean
  fechaParte?: string

  onAddLinea: () => void
  onUpdateLinea: (index: number, campo: string, valor: any) => void
  onRemoveLinea: (index: number) => void
  onPersonalSelect: (index: number, personalId: string, persona?: any) => void
  onServicioSelect: (index: number, servicioId: string, servicio?: any) => void

  // Validación de disponibilidad
  conflictosPersonal?: Array<{
    personalId: string
    personalNombre: string
    parteId: string
    parteCodigo: string
    horaInicio: string
    horaFin: string
    lineaIndex: number
  }>
}

export function LineasPersonalGrid({
  lineas,
  personal,
  personalOptions,
  productosServicioOptions,
  productos,
  mostrarCostes = false,
  fechaParte,
  onAddLinea,
  onUpdateLinea,
  onRemoveLinea,
  onPersonalSelect,
  onServicioSelect,
  conflictosPersonal = [],
}: LineasPersonalGridProps) {
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
  } = useParteTrabajoLineasConfig('personal', { mostrarCostes })

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

  // Verificar si una línea tiene conflicto
  const tieneConflicto = useCallback((index: number) => {
    return conflictosPersonal.some(c => c.lineaIndex === index)
  }, [conflictosPersonal])

  // Renderizar celda según tipo de columna
  const renderCell = useCallback((
    key: string,
    linea: LineaPersonal,
    index: number
  ) => {
    const hayConflicto = tieneConflicto(index)

    switch (key) {
      case 'trabajador':
        return (
          <SearchableSelect
            options={personalOptions}
            value={linea.personalId || ''}
            onValueChange={(value) => {
              const p = personal.find(x => x._id === value)
              onPersonalSelect(index, value, p)
            }}
            placeholder="Seleccionar trabajador..."
            searchPlaceholder="Buscar trabajador..."
            emptyMessage="No encontrado"
            triggerClassName={`h-9 ${hayConflicto ? 'border-amber-500' : ''}`}
            allowClear
          />
        )

      case 'servicio':
        return (
          <SearchableSelect
            options={productosServicioOptions}
            value={linea.productoServicioId || ''}
            onValueChange={(value) => {
              const s = productos.find(x => x._id === value)
              onServicioSelect(index, value, s)
            }}
            placeholder="Servicio (precios)..."
            searchPlaceholder="Buscar servicio..."
            emptyMessage="No hay servicios"
            triggerClassName="h-9"
            allowClear
          />
        )

      case 'fecha':
        return (
          <Input
            type="date"
            value={linea.fecha?.split('T')[0] || fechaParte?.split('T')[0] || ''}
            onChange={(e) => onUpdateLinea(index, 'fecha', e.target.value)}
            className={`w-full text-sm h-8 ${hayConflicto ? 'border-amber-500' : ''}`}
          />
        )

      case 'horaInicio':
        return (
          <Input
            type="time"
            value={linea.horaInicio || ''}
            onChange={(e) => onUpdateLinea(index, 'horaInicio', e.target.value)}
            className={`w-full text-sm h-8 ${hayConflicto ? 'border-amber-500' : ''}`}
          />
        )

      case 'horaFin':
        return (
          <Input
            type="time"
            value={linea.horaFin || ''}
            onChange={(e) => onUpdateLinea(index, 'horaFin', e.target.value)}
            className={`w-full text-sm h-8 ${hayConflicto ? 'border-amber-500' : ''}`}
          />
        )

      case 'horasTrabajadas':
        return (
          <Input
            type="number"
            min="0"
            step="0.25"
            value={linea.horasTrabajadas || 0}
            onChange={(e) => onUpdateLinea(index, 'horasTrabajadas', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8 bg-muted"
          />
        )

      case 'horasExtras':
        return (
          <Input
            type="number"
            min="0"
            step="0.25"
            value={linea.horasExtras || 0}
            onChange={(e) => onUpdateLinea(index, 'horasExtras', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'tarifaCoste':
        return (
          <Input
            type="number"
            min="0"
            step="any"
            value={linea.tarifaHoraCoste || 0}
            onChange={(e) => onUpdateLinea(index, 'tarifaHoraCoste', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'tarifaVenta':
        return (
          <Input
            type="number"
            min="0"
            step="any"
            value={linea.tarifaHoraVenta || 0}
            onChange={(e) => onUpdateLinea(index, 'tarifaHoraVenta', parseFloat(e.target.value) || 0)}
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
    personalOptions,
    productosServicioOptions,
    personal,
    productos,
    lineas.length,
    fechaParte,
    tieneConflicto,
    onUpdateLinea,
    onPersonalSelect,
    onServicioSelect,
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
            <Users className="h-5 w-5" />
            Líneas de Personal
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
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay líneas de personal</p>
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
                  className={`items-center py-2 px-2 rounded hover:bg-muted/50 ${tieneConflicto(index) ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}
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
