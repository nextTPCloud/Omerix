'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Columns, RotateCcw, Save, Loader2 } from 'lucide-react'
import { useLineasConfig } from '@/hooks/useLineasConfig'
import { toast } from 'sonner'

interface ColumnasSelectorProps {
  moduloNombre: string
  esVenta?: boolean
  mostrarCostes?: boolean
}

/**
 * Selector de columnas para líneas de documentos
 * Se usa como componente independiente para añadir a los CardHeader existentes
 */
export function ColumnasSelector({
  moduloNombre,
  esVenta = true,
  mostrarCostes = false,
}: ColumnasSelectorProps) {
  const {
    columnasParaSelector,
    toggleColumna,
    esColumnaVisible,
    resetConfig,
    guardarColumnas,
    isLoading,
    isSaving,
  } = useLineasConfig(moduloNombre, { esVenta, mostrarCostes })

  const handleGuardar = async () => {
    await guardarColumnas()
    toast.success('Configuración de columnas guardada')
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Columns className="h-4 w-4 mr-2" />
        Columnas
      </Button>
    )
  }

  return (
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
            onClick={handleGuardar}
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
  )
}
