/**
 * Hook para gestionar la configuración de columnas en líneas de documentos
 * Wrapper sobre useModuleConfig específico para líneas
 */

import { useMemo, useCallback } from 'react'
import { useModuleConfig } from './useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'
import {
  COLUMNAS_LINEAS,
  ColumnaLineaDefinition,
  getColumnasDisponibles,
  getDefaultConfig,
} from '@/config/lineas-columnas.config'

interface UseLineasConfigOptions {
  esVenta?: boolean
  mostrarCostes?: boolean
  esAlbaran?: boolean
}

export function useLineasConfig(
  moduloNombre: string,
  options: UseLineasConfigOptions = {}
) {
  const { esVenta = true, mostrarCostes = false, esAlbaran = false } = options

  // Obtener columnas disponibles para este tipo de documento
  const columnasDisponibles = useMemo(
    () => getColumnasDisponibles(esVenta, mostrarCostes, esAlbaran),
    [esVenta, mostrarCostes, esAlbaran]
  )

  // Configuración por defecto
  const defaultConfig = useMemo(
    () => ({
      columnas: getDefaultConfig(esVenta, esAlbaran),
    }),
    [esVenta, esAlbaran]
  )

  // Usar el hook genérico de configuración
  // autoSave: false - el usuario guarda manualmente con botón
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
      .filter((col): col is ColumnaLineaDefinition & { ancho: number } => col !== null)
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

  // Guardar configuración de columnas (llamar desde botón)
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

  // Calcular ancho total del grid (en unidades de gridSpan)
  const anchoTotalGrid = useMemo(
    () => columnasVisibles.reduce((total, col) => total + col.gridSpan, 0),
    [columnasVisibles]
  )

  // Generar estilos de grid dinámico (usa anchos fijos para evitar compresión)
  const gridStyle = useMemo(() => {
    // Usar anchos en píxeles para evitar que se compriman las columnas
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
    anchoTotalGrid,
    gridStyle,
  }
}
