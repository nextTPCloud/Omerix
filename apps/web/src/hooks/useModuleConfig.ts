import { useState, useEffect, useCallback, useRef } from 'react';
import { configuracionService, ModuleConfig, ColumnaConfig, SortConfig, ColumnFilters, SavedAdvancedFilter } from '@/services/configuracion.service';
import { toast } from 'sonner';

/**
 * ============================================
 * CUSTOM HOOK: useModuleConfig
 * ============================================
 * 
 * Hook para gestionar la configuración de un módulo específico
 * con persistencia automática y debouncing
 * 
 * @param moduloNombre - Nombre del módulo (ej: 'clientes', 'productos')
 * @param defaultConfig - Configuración por defecto si no existe
 */

interface UseModuleConfigOptions {
  autoSave?: boolean; // Si debe guardar automáticamente los cambios
  debounceMs?: number; // Milisegundos de debounce para autosave
}

export function useModuleConfig(
  moduloNombre: string,
  defaultConfig?: Partial<ModuleConfig>,
  options: UseModuleConfigOptions = {}
) {
  const { autoSave = true, debounceMs = 1000 } = options;

  // Estados
  const [config, setConfig] = useState<ModuleConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref para el timer de debounce
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);

  /**
   * Cargar configuración inicial desde el servidor
   */
  const loadConfig = useCallback(async () => {
    if (hasLoadedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const serverConfig = await configuracionService.getModuleConfig(moduloNombre);

      if (serverConfig) {
        setConfig(serverConfig);
      } else if (defaultConfig) {
        // Si no existe configuración, usar la default
        setConfig({
          columnas: defaultConfig.columnas || [],
          sortConfig: defaultConfig.sortConfig,
          columnFilters: defaultConfig.columnFilters || {},
          advancedFilters: defaultConfig.advancedFilters || [],
          paginacion: defaultConfig.paginacion || { limit: 25 },
          filtrosAdicionales: defaultConfig.filtrosAdicionales || {},
          densidad: defaultConfig.densidad,
        });
      }

      hasLoadedRef.current = true;
    } catch (err: any) {
      console.error(`[useModuleConfig] Error al cargar configuración de ${moduloNombre}:`, err);
      setError(err.message);

      // Si falla, usar configuración por defecto
      if (defaultConfig) {
        setConfig({
          columnas: defaultConfig.columnas || [],
          sortConfig: defaultConfig.sortConfig,
          columnFilters: defaultConfig.columnFilters || {},
          advancedFilters: defaultConfig.advancedFilters || [],
          paginacion: defaultConfig.paginacion || { limit: 25 },
          filtrosAdicionales: defaultConfig.filtrosAdicionales || {},
          densidad: defaultConfig.densidad,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [moduloNombre, defaultConfig]);

  /**
   * Guardar configuración en el servidor
   */
  const saveConfig = useCallback(
    async (newConfig: ModuleConfig, showToast = false) => {
      try {
        setIsSaving(true);
        await configuracionService.updateModuleConfig(moduloNombre, newConfig);

        if (showToast) {
          toast.success('Configuración guardada');
        }
      } catch (err: any) {
        console.error(`Error al guardar configuración de ${moduloNombre}:`, err);
        toast.error('Error al guardar la configuración');
      } finally {
        setIsSaving(false);
      }
    },
    [moduloNombre]
  );

  /**
   * Guardar con debounce (para autosave)
   */
  const debouncedSave = useCallback(
    (newConfig: ModuleConfig) => {
      if (!autoSave) return;

      // Limpiar timer anterior
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Crear nuevo timer
      saveTimerRef.current = setTimeout(() => {
        saveConfig(newConfig, false);
      }, debounceMs);
    },
    [autoSave, debounceMs, saveConfig]
  );



  /**
   * Actualizar configuración localmente y opcionalmente guardar
   */
  const updateConfig = useCallback(
    (updates: Partial<ModuleConfig>) => {
      setConfig((prev) => {
        if (!prev) return null;

        const newConfig = {
          ...prev,
          ...updates,
        };

        // Guardar automáticamente si está habilitado
        if (autoSave) {
          debouncedSave(newConfig);
        }

        return newConfig;
      });
    },
    [autoSave, debouncedSave]
  );

    /**
   * Update Densidad
   */
  const updateDensidad = useCallback(
    (densidad: 'compact' | 'normal' | 'comfortable') => {
      updateConfig({ densidad });
    },
    [updateConfig]
  );

  /**
   * Actualizar columnas
   */
  const updateColumnas = useCallback(
    (columnas: ColumnaConfig[]) => {
      updateConfig({ columnas });
    },
    [updateConfig]
  );

  /**
   * Guardar columnas directamente al servidor (sin esperar debounce)
   * Útil para cambios que deben persistir inmediatamente
   */
  const saveColumnasDirectly = useCallback(
    async (columnas: ColumnaConfig[]) => {
      try {
        setIsSaving(true);
        const newConfig: ModuleConfig = {
          ...(config || { columnas: [] }),
          columnas,
        };
        await configuracionService.updateModuleConfig(moduloNombre, newConfig);
        // También actualizar el estado local
        setConfig(newConfig);
      } catch (err: any) {
        console.error(`Error al guardar columnas:`, err);
        toast.error('Error al guardar las columnas');
      } finally {
        setIsSaving(false);
      }
    },
    [config, moduloNombre]
  );

  /**
   * Actualizar ordenamiento
   */
  const updateSortConfig = useCallback(
    (sortConfig: SortConfig) => {
      updateConfig({ sortConfig });
    },
    [updateConfig]
  );

  /**
   * Actualizar filtros de columna
   */
  const updateColumnFilters = useCallback(
    (columnFilters: ColumnFilters) => {
      updateConfig({ columnFilters });
    },
    [updateConfig]
  );

  /**
   * Actualizar filtros avanzados
   */
  const updateAdvancedFilters = useCallback(
    (advancedFilters: SavedAdvancedFilter[]) => {
      updateConfig({ advancedFilters });
    },
    [updateConfig]
  );

  /**
   * Actualizar límite de paginación
   */
  const updatePaginationLimit = useCallback(
    (limit: 10 | 25 | 50 | 100) => {
      updateConfig({ paginacion: { limit } });
    },
    [updateConfig]
  );

  /**
   * Restablecer configuración (eliminarla del servidor y usar default)
   */
  const resetConfig = useCallback(async () => {
    try {
      setIsSaving(true);
      await configuracionService.resetModuleConfig(moduloNombre);

      // Restablecer a configuración por defecto
      if (defaultConfig) {
        setConfig({
          columnas: defaultConfig.columnas || [],
          sortConfig: defaultConfig.sortConfig,
          columnFilters: defaultConfig.columnFilters || {},
          advancedFilters: defaultConfig.advancedFilters || [],
          paginacion: defaultConfig.paginacion || { limit: 25 },
          filtrosAdicionales: defaultConfig.filtrosAdicionales || {},
          densidad: defaultConfig.densidad,
        });
      } else {
        setConfig(null);
      }

      toast.success('Configuración restablecida');
    } catch (err: any) {
      console.error(`Error al restablecer configuración de ${moduloNombre}:`, err);
      toast.error('Error al restablecer la configuración');
    } finally {
      setIsSaving(false);
    }
  }, [moduloNombre, defaultConfig]);

  /**
   * Guardar manualmente (para cuando autoSave está deshabilitado)
   */
  const saveManually = useCallback(async () => {
    if (!config) return;

    // Cancelar cualquier guardado pendiente
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    await saveConfig(config, true);
  }, [config, saveConfig]);

  /**
   * Cargar configuración al montar
   */
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /**
   * Limpiar timer al desmontar
   */
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    // Estado
    config,
    isLoading,
    isSaving,
    error,

    // Métodos de actualización
    updateConfig,
    updateColumnas,
    saveColumnasDirectly,
    updateSortConfig,
    updateColumnFilters,
    updateAdvancedFilters,
    updatePaginationLimit,
    updateDensidad,

    // Métodos de gestión
    resetConfig,
    saveManually,
    reloadConfig: loadConfig,
  };
}