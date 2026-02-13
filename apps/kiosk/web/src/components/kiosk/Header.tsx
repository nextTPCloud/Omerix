'use client';

import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useDataStore } from '@/stores/dataStore';

interface Props {
  kioskConfig: any;
  empresaLogo?: string | null;
  onBackToWelcome: () => void;
}

/**
 * Header del Kiosk
 * Muestra logo, nombre y boton de cancelar
 */
export function Header({ kioskConfig, empresaLogo, onBackToWelcome }: Props) {
  const { sincronizar, isSyncing } = useDataStore();
  const kioskLogo = kioskConfig?.tema?.logoUrl;
  const nombre = kioskConfig?.nombre || 'Kiosk';

  // Prioridad: 1) logo del kiosk, 2) logo de la empresa
  const logoUrl = kioskLogo || empresaLogo;

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
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
        ) : (
          <svg className="h-8 w-8 text-blue-500" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.15"/>
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="95 31" strokeLinecap="round"/>
            <rect x="14" y="28" width="4" height="10" rx="1.5" fill="currentColor"/>
            <rect x="20" y="23" width="4" height="15" rx="1.5" fill="currentColor"/>
            <rect x="26" y="18" width="4" height="20" rx="1.5" fill="currentColor"/>
            <circle cx="34" cy="15" r="3" fill="currentColor"/>
          </svg>
        )}
        <h1 className="text-xl font-bold text-gray-800">{nombre}</h1>
      </div>

      {/* Lado derecho: sync + badge Tralok */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => sincronizar()}
          disabled={isSyncing}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
        <span className="text-[10px] text-gray-300 font-medium">Tralok</span>
      </div>
    </header>
  );
}
