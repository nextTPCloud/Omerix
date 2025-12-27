// ===========================================
// HOOK DE PERIFÉRICOS TPV
// ===========================================

import { useState, useEffect, useCallback } from 'react';
import { tpvApi } from '@/services/api';

interface PrinterStatus {
  connected: boolean;
  paperEnd: boolean;
  error?: string;
}

interface CashDrawerStatus {
  connected: boolean;
  open: boolean;
}

interface DisplayStatus {
  connected: boolean;
  lines: [string, string];
}

interface ScaleStatus {
  connected: boolean;
  weight: number;
}

interface PaymentTerminalStatus {
  connected: boolean;
  ready: boolean;
}

interface PeripheralsStatus {
  printer: PrinterStatus;
  cashDrawer: CashDrawerStatus;
  display: DisplayStatus;
  scale: ScaleStatus;
  paymentTerminal: PaymentTerminalStatus;
}

const DEFAULT_STATUS: PeripheralsStatus = {
  printer: { connected: false, paperEnd: false },
  cashDrawer: { connected: false, open: false },
  display: { connected: false, lines: ['', ''] },
  scale: { connected: false, weight: 0 },
  paymentTerminal: { connected: false, ready: false },
};

export function usePeripherals() {
  const [status, setStatus] = useState<PeripheralsStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener estado de periféricos
  const refreshStatus = useCallback(async () => {
    try {
      const newStatus = await tpvApi.obtenerEstadoPerifericos();
      setStatus(newStatus);
      setError(null);
    } catch (err) {
      setError('Error al obtener estado de periféricos');
      console.error('Error peripherals:', err);
    }
  }, []);

  // Cargar estado inicial
  useEffect(() => {
    const loadStatus = async () => {
      setLoading(true);
      await refreshStatus();
      setLoading(false);
    };
    loadStatus();

    // Actualizar cada 10 segundos
    const interval = setInterval(refreshStatus, 10000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  // Abrir cajón
  const openCashDrawer = useCallback(async () => {
    try {
      await tpvApi.abrirCajon();
      // Actualizar estado
      setStatus((prev) => ({
        ...prev,
        cashDrawer: { ...prev.cashDrawer, open: true },
      }));
      return true;
    } catch (err) {
      console.error('Error opening drawer:', err);
      return false;
    }
  }, []);

  // Mostrar mensaje en visor
  const showOnDisplay = useCallback(async (line1: string, line2: string) => {
    try {
      await tpvApi.mostrarEnVisor(line1, line2);
      setStatus((prev) => ({
        ...prev,
        display: { ...prev.display, lines: [line1, line2] },
      }));
      return true;
    } catch (err) {
      console.error('Error display:', err);
      return false;
    }
  }, []);

  // Limpiar visor
  const clearDisplay = useCallback(async () => {
    return showOnDisplay('', '');
  }, [showOnDisplay]);

  // Mostrar total en visor
  const showTotalOnDisplay = useCallback(
    async (total: number) => {
      const line1 = 'TOTAL A PAGAR';
      const line2 = `${total.toFixed(2)} EUR`;
      return showOnDisplay(line1, line2);
    },
    [showOnDisplay]
  );

  // Mostrar cambio en visor
  const showChangeOnDisplay = useCallback(
    async (cambio: number) => {
      const line1 = 'CAMBIO';
      const line2 = `${cambio.toFixed(2)} EUR`;
      return showOnDisplay(line1, line2);
    },
    [showOnDisplay]
  );

  // Obtener peso de báscula
  const getWeight = useCallback(async (): Promise<number> => {
    try {
      const result = await tpvApi.obtenerPesoBascula();
      setStatus((prev) => ({
        ...prev,
        scale: { ...prev.scale, weight: result.peso },
      }));
      return result.peso;
    } catch (err) {
      console.error('Error scale:', err);
      return 0;
    }
  }, []);

  // Test de impresora
  const testPrinter = useCallback(async () => {
    try {
      await tpvApi.post('/perifericos/impresora/test', {});
      return true;
    } catch (err) {
      console.error('Error test printer:', err);
      return false;
    }
  }, []);

  return {
    status,
    loading,
    error,
    refreshStatus,
    openCashDrawer,
    showOnDisplay,
    clearDisplay,
    showTotalOnDisplay,
    showChangeOnDisplay,
    getWeight,
    testPrinter,
    // Accesos directos
    isPrinterReady: status.printer.connected && !status.printer.paperEnd,
    isCashDrawerConnected: status.cashDrawer.connected,
    isDisplayConnected: status.display.connected,
    isScaleConnected: status.scale.connected,
    isTerminalReady: status.paymentTerminal.connected && status.paymentTerminal.ready,
  };
}

// Hook simplificado solo para estado
export function usePeripheralsStatus() {
  const { status, loading, error, refreshStatus } = usePeripherals();
  return { status, loading, error, refreshStatus };
}
