'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { ActivacionKiosk } from '@/components/auth/ActivacionKiosk';
import { KioskMain } from '@/components/kiosk/KioskMain';

/**
 * Pagina principal del Kiosk
 * Maneja la activacion y muestra la interfaz segun el tipo de kiosk
 */
export default function Home() {
  const { isActivated, isLoading, checkActivation } = useAuthStore();
  const { productos, isSyncing, sincronizar } = useDataStore();
  const [mounted, setMounted] = useState(false);
  const syncAttempted = useRef(false);

  // Verificar activacion al montar
  useEffect(() => {
    setMounted(true);
    checkActivation();
  }, [checkActivation]);

  // Auto-sincronizar datos cuando el kiosk esta activado y no hay productos
  useEffect(() => {
    if (isActivated && productos.length === 0 && !isSyncing && !syncAttempted.current) {
      syncAttempted.current = true;
      console.log('[Kiosk] Sincronizando datos automaticamente...');
      sincronizar();
    }
  }, [isActivated, productos.length, isSyncing, sincronizar]);

  // Prevenir hidratacion incorrecta
  if (!mounted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-white text-2xl animate-pulse">Cargando...</div>
      </div>
    );
  }

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Conectando...</p>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras sincroniza datos inicialmente
  if (isActivated && isSyncing && productos.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Sincronizando datos...</p>
          <p className="text-white/70 text-sm mt-2">Cargando productos y configuracion</p>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de activacion si no esta activado
  if (!isActivated) {
    return <ActivacionKiosk />;
  }

  // Mostrar interfaz principal del kiosk
  return <KioskMain />;
}
