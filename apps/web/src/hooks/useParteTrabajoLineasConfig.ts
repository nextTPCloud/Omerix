/**
 * Hook para gestionar la configuración de columnas en líneas de partes de trabajo
 * Wrapper sobre useModuleConfig específico para líneas de PT
 */

import { useMemo, useCallback } from 'react'
import { useModuleConfig } from './useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'
import {
  ColumnaParteTrabajoDefinition,
  TipoLineaParteTrabajo,
  getColumnasPartesTrabajo,
  getDefaultParteTrabajoConfig,
  getModuloNombreParteTrabajo,
} from '@/config/partes-trabajo-columnas.config'

interface UseParteTrabajoLineasConfigOptions {
  mostrarCostes?: boolean
}

export function useParteTrabajoLineasConfig(
  tipo: TipoLineaParteTrabajo,
  options: UseParteTrabajoLineasConfigOptions = {}
) {
  const { mostrarCostes = false } = options
  const moduloNombre = getModuloNombreParteTrabajo(tipo)

  // Obtener columnas disponibles para este tipo de línea
  const columnasDisponibles = useMemo(
    () => getColumnasPartesTrabajo(tipo, mostrarCostes),
    [tipo, mostrarCostes]
  )

  // Configuración por defecto
  const defaultConfig = useMemo(
    () => ({
      columnas: getDefaultParteTrabajoConfig(tipo),
    }),
    [tipo]
  )

  // Usar el hook genérico de configuración
  const {
    config,
    isLoading,
    isSaving,
    updateColumnas,
    saveColumnasDirectly,
    resetConfig,
  } = useModuleConfig(moduloNombre, defaultConfig, {
    autoSave: false,
    debounceMs: 0,
  })

  // Columnas visibles ordenadas
  const columnasVisibles = useMemo(() => {
    if (!config?.columnas) return []

    return config.columnas
      .filter(col => col.visible)
      .sort((a, b) => a.orden - b.orden)
      .map(col => {
        const def = columnasDisponibles.find(d => d.key === col.key)
        return def ? { ...def, ancho: col.ancho || def.width } : null
      })
      .filter((col): col is ColumnaParteTrabajoDefinition & { ancho: number } => col !== null)
  }, [config?.columnas, columnasDisponibles])

  // Keys de columnas visibles
  const columnasVisiblesKeys = useMemo(
    () => columnasVisibles.map(col => col.key),
    [columnasVisibles]
  )

  // Toggle visibilidad de columna (solo actualiza estado local)
  const toggleColumna = useCallback(
    (key: string) => {
      if (!config?.columnas) return

      const newColumnas = config.columnas.map(col => {
        if (col.key === key) {
          return { ...col, visible: !col.visible }
        }
        return col
      })
      updateColumnas(newColumnas)
    },
    [config?.columnas, updateColumnas]
  )

  // Guardar configuración de columnas
  const guardarColumnas = useCallback(
    async () => {
      if (!config?.columnas) return
      await saveColumnasDirectly(config.columnas)
    },
    [config?.columnas, saveColumnasDirectly]
  )

  // Verificar si una columna es visible
  const esColumnaVisible = useCallback(
    (key: string) => columnasVisiblesKeys.includes(key),
    [columnasVisiblesKeys]
  )

  // Generar estilos de grid dinámico
  const gridStyle = useMemo(() => {
    const widths = columnasVisibles.map(col => `${col.ancho || col.width}px`)
    return {
      display: 'grid',
      gridTemplateColumns: widths.join(' '),
      gap: '0.5rem',
    }
  }, [columnasVisibles])

  // Columnas disponibles para el selector (excluyendo acciones)
  const columnasParaSelector = useMemo(
    () => columnasDisponibles.filter(col => col.key !== 'acciones'),
    [columnasDisponibles]
  )

  return {
    // Estado
    isLoading,
    isSaving,

    // Columnas
    columnasDisponibles,
    columnasVisibles,
    columnasVisiblesKeys,
    columnasParaSelector,

    // Helpers
    toggleColumna,
    esColumnaVisible,
    resetConfig,
    guardarColumnas,

    // Grid
    gridStyle,
  }
}
