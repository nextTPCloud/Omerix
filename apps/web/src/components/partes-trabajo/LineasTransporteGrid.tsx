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
  Truck,
  Columns,
  RotateCcw,
  Save,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useParteTrabajoLineasConfig } from '@/hooks/useParteTrabajoLineasConfig'
import { formatCurrency } from '@/lib/utils'
import { LineaTransporte } from '@/types/parte-trabajo.types'

interface PersonalOption {
  value: string
  label: string
  description?: string
}

interface LineasTransporteGridProps {
  lineas: LineaTransporte[]
  personalOptions: PersonalOption[]
  personal: any[]
  mostrarCostes?: boolean

  onAddLinea: () => void
  onUpdateLinea: (index: number, campo: string, valor: any) => void
  onRemoveLinea: (index: number) => void

  stepPrecios?: number
}

export function LineasTransporteGrid({
  lineas,
  personalOptions,
  personal,
  mostrarCostes = false,
  onAddLinea,
  onUpdateLinea,
  onRemoveLinea,
  stepPrecios = 0.01,
}: LineasTransporteGridProps) {
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
  } = useParteTrabajoLineasConfig('transporte', { mostrarCostes })

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
    linea: LineaTransporte,
    index: number
  ) => {
    switch (key) {
      case 'vehiculo':
        return (
          <Input
            value={linea.vehiculoNombre || ''}
            onChange={(e) => onUpdateLinea(index, 'vehiculoNombre', e.target.value)}
            placeholder="Vehículo..."
            className="w-full text-sm h-8"
          />
        )

      case 'matricula':
        return (
          <Input
            value={linea.matricula || ''}
            onChange={(e) => onUpdateLinea(index, 'matricula', e.target.value)}
            placeholder="Matrícula"
            className="w-full text-center text-sm h-8"
          />
        )

      case 'conductor':
        return (
          <SearchableSelect
            options={personalOptions}
            value={linea.conductorId || ''}
            onValueChange={(value) => {
              const p = personal.find(x => x._id === value)
              onUpdateLinea(index, 'conductorId', value)
              if (p) {
                onUpdateLinea(index, 'conductorNombre', `${p.nombre} ${p.apellidos || ''}`.trim())
              }
            }}
            placeholder="Conductor..."
            searchPlaceholder="Buscar..."
            emptyMessage="No encontrado"
            triggerClassName="h-9"
            allowClear
          />
        )

      case 'origen':
        return (
          <Input
            value={linea.origen || ''}
            onChange={(e) => onUpdateLinea(index, 'origen', e.target.value)}
            placeholder="Origen"
            className="w-full text-sm h-8"
          />
        )

      case 'destino':
        return (
          <Input
            value={linea.destino || ''}
            onChange={(e) => onUpdateLinea(index, 'destino', e.target.value)}
            placeholder="Destino"
            className="w-full text-sm h-8"
          />
        )

      case 'kmRecorridos':
        return (
          <Input
            type="number"
            min="0"
            value={linea.kmRecorridos || 0}
            onChange={(e) => onUpdateLinea(index, 'kmRecorridos', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'tarifaKm':
        return (
          <Input
            type="number"
            min="0"
            step={stepPrecios}
            value={linea.tarifaPorKm || 0}
            onChange={(e) => onUpdateLinea(index, 'tarifaPorKm', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'importeFijo':
        return (
          <Input
            type="number"
            min="0"
            step={stepPrecios}
            value={linea.importeFijoViaje || 0}
            onChange={(e) => onUpdateLinea(index, 'importeFijoViaje', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'peajes':
        return (
          <Input
            type="number"
            min="0"
            step={stepPrecios}
            value={linea.peajes || 0}
            onChange={(e) => onUpdateLinea(index, 'peajes', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'combustible':
        return (
          <Input
            type="number"
            min="0"
            step={stepPrecios}
            value={linea.combustible || 0}
            onChange={(e) => onUpdateLinea(index, 'combustible', parseFloat(e.target.value) || 0)}
            className="w-full text-right text-sm h-8"
          />
        )

      case 'costeTotal':
        return (
          <span className="text-right text-sm">
            {formatCurrency(linea.costeTotal || 0)}
          </span>
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
    personal,
    lineas.length,
    stepPrecios,
    onUpdateLinea,
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
            <Truck className="h-5 w-5" />
            Líneas de Transporte
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
            <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay líneas de transporte</p>
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
