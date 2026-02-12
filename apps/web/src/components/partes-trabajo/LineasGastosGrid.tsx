'use client'

import React, { useCallback } from 'react'
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
  Wallet,
  Columns,
  RotateCcw,
  Save,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useParteTrabajoLineasConfig } from '@/hooks/useParteTrabajoLineasConfig'
import { formatCurrency } from '@/lib/utils'
import { LineaGasto } from '@/types/parte-trabajo.types'

interface TipoGastoOption {
  value: string
  label: string
  description?: string
}

interface LineasGastosGridProps {
  lineas: LineaGasto[]
  tiposGasto: any[]
  tiposGastoOptions: TipoGastoOption[]
  mostrarCostes?: boolean

  onAddLinea: () => void
  onUpdateLinea: (index: number, campo: string, valor: any) => void
  onRemoveLinea: (index: number) => void
  onTipoGastoSelect: (index: number, tipoGastoId: string, tipoGasto?: any) => void

  stepPrecios?: number
}

export function LineasGastosGrid({
  lineas,
  tiposGasto,
  tiposGastoOptions,
  mostrarCostes = false,
  onAddLinea,
  onUpdateLinea,
  onRemoveLinea,
  onTipoGastoSelect,
  stepPrecios = 0.01,
}: LineasGastosGridProps) {
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
  } = useParteTrabajoLineasConfig('gastos', { mostrarCostes })

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

  // Renderizar celda según tipo de columna
  const renderCell = useCallback((
    key: string,
    linea: LineaGasto,
    index: number
  ) => {
    switch (key) {
      case 'tipoGasto':
        return (
          <SearchableSelect
            options={tiposGastoOptions}
            value={linea.tipoGastoId || ''}
            onValueChange={(value) => {
              const t = tiposGasto.find(x => x._id === value)
              onTipoGastoSelect(index, value, t)
            }}
            placeholder="Tipo de gasto..."
            searchPlaceholder="Buscar tipo..."
            emptyMessage="No encontrado"
            triggerClassName="h-9"
            allowClear
          />
        )

      case 'descripcion':
        return (
          <Input
            value={linea.descripcion || ''}
            onChange={(e) => onUpdateLinea(index, 'descripcion', e.target.value)}
            placeholder="Descripción del gasto..."
            className="w-full text-sm h-8"
          />
        )

      case 'fecha':
        return (
          <Input
            type="date"
            value={linea.fecha?.split('T')[0] || ''}
            onChange={(e) => onUpdateLinea(index, 'fecha', e.target.value)}
            className="w-full text-sm h-8"
          />
        )

      case 'proveedor':
        return (
          <Input
            value={linea.proveedor || ''}
            onChange={(e) => onUpdateLinea(index, 'proveedor', e.target.value)}
            placeholder="Proveedor..."
            className="w-full text-sm h-8"
          />
        )

      case 'numFactura':
        return (
          <Input
            value={linea.numFactura || ''}
            onChange={(e) => onUpdateLinea(index, 'numFactura', e.target.value)}
            placeholder="Nº Factura"
            className="w-full text-sm h-8"
          />
        )

      case 'importe':
        return (
          <Input
            type="number"
            min="0"
            step={stepPrecios}
            value={linea.importe || 0}
            onChange={(e) => onUpdateLinea(index, 'importe', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'margen':
        return (
          <Input
            type="number"
            min="0"
            step="1"
            value={linea.margen || 0}
            onChange={(e) => onUpdateLinea(index, 'margen', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'iva':
        return (
          <Input
            type="number"
            min="0"
            value={linea.iva || 21}
            onChange={(e) => onUpdateLinea(index, 'iva', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'importeFacturable':
        return (
          <span className="text-right text-sm font-medium text-green-600">
            {formatCurrency(linea.importeFacturable || 0)}
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
    tiposGastoOptions,
    tiposGasto,
    lineas.length,
    stepPrecios,
    onUpdateLinea,
    onTipoGastoSelect,
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
            <Wallet className="h-5 w-5" />
            Líneas de Gastos
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
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay líneas de gastos</p>
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
