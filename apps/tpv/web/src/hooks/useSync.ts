// ===========================================
// HOOK DE SINCRONIZACIÓN TPV
// ===========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSyncStore } from '@/stores/syncStore';
import { tpvApi } from '@/services/api';

interface UseSyncOptions {
  autoSync?: boolean;
  syncInterval?: number; // ms
}

export function useSync(options: UseSyncOptions = {}) {
  const { autoSync = true, syncInterval = 30000 } = options;

  const {
    online,
    ultimaSync,
    cola,
    estado,
    sincronizando,
    pendientes,
    errores,
    setOnline,
    agregarACola,
    procesarCola,
    reintentar,
    eliminarDeCola,
    limpiarErrores,
  } = useSyncStore();

  const [checking, setChecking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar conexión con el servidor
  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      const health = await tpvApi.health();
      setOnline(health.status === 'ok' && health.cloud);
    } catch {
      setOnline(false);
    }
    setChecking(false);
  }, [setOnline]);

  // Verificar conexión al montar y cuando cambia el estado de red
  useEffect(() => {
    checkConnection();

    const handleOnline = () => checkConnection();
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection, setOnline]);

  // Sincronización automática
  useEffect(() => {
    if (autoSync && online) {
      // Sincronizar inmediatamente si hay pendientes
      if (pendientes > 0) {
        procesarCola();
      }

      // Configurar intervalo
      intervalRef.current = setInterval(() => {
        if (pendientes > 0) {
          procesarCola();
        }
      }, syncInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoSync, online, pendientes, syncInterval, procesarCola]);

  // Agregar venta a cola de sincronización
  const queueVenta = useCallback(
    (venta: any) => {
      agregarACola({
        entidad: 'venta',
        entidadId: venta.localId || venta._id,
        operacion: 'crear',
        datos: venta,
      });
    },
    [agregarACola]
  );

  // Agregar cierre de caja a cola
  const queueCierreCaja = useCallback(
    (cierre: any) => {
      agregarACola({
        entidad: 'caja',
        entidadId: cierre.localId || cierre._id,
        operacion: 'actualizar',
        datos: cierre,
      });
    },
    [agregarACola]
  );

  // Agregar VeriFactu a cola
  const queueVeriFactu = useCallback(
    (verifactu: any) => {
      agregarACola({
        entidad: 'verifactu',
        entidadId: verifactu.ventaId,
        operacion: 'crear',
        datos: verifactu,
      });
    },
    [agregarACola]
  );

  // Forzar sincronización
  const forceSync = useCallback(async () => {
    await checkConnection();
    if (online) {
      await procesarCola();
    }
  }, [checkConnection, online, procesarCola]);

  // Obtener items con error
  const itemsConError = cola.filter((item) => item.error);

  // Obtener items pendientes
  const itemsPendientes = cola.filter((item) => !item.error);

  return {
    // Estado
    online,
    checking,
    ultimaSync,
    estado,
    sincronizando,
    pendientes,
    errores,
    cola,
    itemsConError,
    itemsPendientes,

    // Acciones
    checkConnection,
    forceSync,
    queueVenta,
    queueCierreCaja,
    queueVeriFactu,
    reintentar,
    eliminarDeCola,
    limpiarErrores,

    // Utilidades
    hasPendingSync: pendientes > 0,
    hasErrors: errores > 0,
    isReady: online && !sincronizando,
  };
}

// Hook simplificado para mostrar estado
export function useSyncStatus() {
  const { online, pendientes, errores, sincronizando, ultimaSync } = useSyncStore();

  return {
    online,
    pendientes,
    errores,
    sincronizando,
    ultimaSync,
    statusText: online
      ? pendientes > 0
        ? `Pendientes: ${pendientes}`
        : 'Sincronizado'
      : 'Sin conexión',
    statusColor: online
      ? pendientes > 0
        ? 'amber'
        : 'green'
      : 'red',
  };
}
