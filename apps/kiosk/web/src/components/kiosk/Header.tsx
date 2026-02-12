'use client';

import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useDataStore } from '@/stores/dataStore';

interface Props {
  kioskConfig: any;
  onBackToWelcome: () => void;
}

/**
 * Header del Kiosk
 * Muestra logo, nombre y boton de cancelar
 */
export function Header({ kioskConfig, onBackToWelcome }: Props) {
  const { sincronizar, isSyncing } = useDataStore();
  const logo = kioskConfig?.tema?.logoUrl;
  const nombre = kioskConfig?.nombre || 'Kiosk';

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Boton cancelar */}
      <button
        onClick={onBackToWelcome}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Cancelar</span>
      </button>

      {/* Logo/Nombre */}
      <div className="flex items-center gap-3">
        {logo && (
          <img src={logo} alt="Logo" className="h-10 object-contain" />
        )}
        <h1 className="text-xl font-bold text-gray-800">{nombre}</h1>
      </div>

      {/* Boton sincronizar (oculto en produccion) */}
      <button
        onClick={() => sincronizar()}
        disabled={isSyncing}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 disabled:opacity-50"
      >
        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
      </button>
    </header>
  );
}
