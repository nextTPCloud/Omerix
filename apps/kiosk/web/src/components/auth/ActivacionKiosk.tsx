'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Pantalla de activacion del Kiosk
 * Solo requiere el token de 8 caracteres
 */
export function ActivacionKiosk() {
  const { activarConToken, isLoading, error, clearError } = useAuthStore();

  const [token, setToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!token || token.length !== 8) {
      return;
    }

    try {
      await activarConToken(token.toUpperCase());
    } catch (err) {
      // Error ya manejado en el store
    }
  };

  // Formatear token mientras se escribe (mayusculas, sin espacios)
  const handleTokenChange = (value: string) => {
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setToken(formatted);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        {/* Logo Tralok - igual que en la web */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg
              width="180"
              height="48"
              viewBox="0 0 200 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-auto"
            >
              <style>{`
                @font-face {
                  font-family: 'GameOfSquids';
                  src: url('/fonts/GameOfSquids.woff2') format('woff2'),
                      url('/fonts/GameOfSquids.woff') format('woff');
                  font-weight: 700;
                  font-style: bold;
                }
              `}</style>
              {/* Anillo exterior */}
              <circle cx="24" cy="24" r="20" stroke="#1e40af" strokeWidth="2.5" fill="none" opacity="0.15"/>
              <circle cx="24" cy="24" r="20" stroke="#1e40af" strokeWidth="2.5" fill="none" strokeDasharray="95 31" strokeLinecap="round"/>
              {/* Barras de datos */}
              <rect x="14" y="28" width="4" height="10" rx="1.5" fill="#1e40af"/>
              <rect x="20" y="23" width="4" height="15" rx="1.5" fill="#1e40af"/>
              <rect x="26" y="18" width="4" height="20" rx="1.5" fill="#1e40af"/>
              {/* Punto destacado */}
              <circle cx="34" cy="15" r="3" fill="#2563eb"/>
              {/* Texto */}
              <text x="54" y="38" fontFamily="GameOfSquids, sans-serif" fontSize="36" fontWeight="700" fill="#1e40af" letterSpacing="1">Tralok</text>
            </svg>
          </div>
          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
            KIOSK
          </span>
          <p className="text-gray-500 mt-3">Activar Terminal de Autoservicio</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token de activacion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token de activacion
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => handleTokenChange(e.target.value)}
              placeholder="XXXXXXXX"
              className="w-full px-4 py-4 text-center text-3xl font-mono tracking-[0.3em] border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              maxLength={8}
              autoFocus
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Introduce el token de 8 caracteres generado en la web
            </p>
          </div>

          {/* Boton */}
          <button
            type="submit"
            disabled={isLoading || token.length !== 8}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Activando...
              </>
            ) : (
              'Activar Kiosk'
            )}
          </button>
        </form>

        {/* Ayuda */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>¿No tienes un token?</p>
          <p className="mt-1">
            Genera uno desde <span className="text-purple-600 font-medium">Configuracion → Kioskos</span>
          </p>
        </div>
      </div>
    </div>
  );
}
