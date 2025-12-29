'use client';

import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';

interface Props {
  onActivado: () => void;
}

export default function ActivacionTPV({ onActivado }: Props) {
  const [token, setToken] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activarTPV = useAuthStore((state) => state.activarTPV);
  const sincronizarDatos = useDataStore((state) => state.sincronizarDatos);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validar campos
      if (!token || token.length !== 8) {
        throw new Error('El token debe tener 8 caracteres');
      }
      if (!nombre.trim()) {
        throw new Error('Introduce un nombre para el TPV');
      }

      // Activar TPV (sin almacenId - se configura despues)
      const exito = await activarTPV(token.toUpperCase(), nombre.trim());

      if (exito) {
        // Sincronizar datos iniciales
        await sincronizarDatos(false);
        onActivado();
      } else {
        throw new Error('No se pudo activar el TPV. Verifica el token.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Formatear token mientras se escribe (mayusculas, sin espacios)
  const handleTokenChange = (value: string) => {
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setToken(formatted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo con fuente GameOfSquids */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg
              width="220"
              height="56"
              viewBox="0 0 220 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-14 w-auto"
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
              {/* Anillo exterior - O estilizada */}
              <circle cx="28" cy="28" r="22" stroke="#1e40af" strokeWidth="2.5" fill="none" opacity="0.15"/>
              <circle cx="28" cy="28" r="22" stroke="#1e40af" strokeWidth="2.5" fill="none" strokeDasharray="105 35" strokeLinecap="round"/>

              {/* Barras de datos ascendentes */}
              <rect x="17" y="32" width="5" height="12" rx="1.5" fill="#1e40af"/>
              <rect x="24" y="26" width="5" height="18" rx="1.5" fill="#1e40af"/>
              <rect x="31" y="20" width="5" height="24" rx="1.5" fill="#1e40af"/>

              {/* Punto destacado (metrica/KPI) */}
              <circle cx="40" cy="17" r="3.5" fill="#1e40af"/>

              {/* Texto Tralok */}
              <text x="60" y="42" fontFamily="GameOfSquids" fontSize="38" fontWeight="700" fill="#1e3a8a" letterSpacing="1">Tralok</text>
            </svg>
          </div>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            TPV
          </span>
          <p className="text-gray-500 mt-3">Activar Terminal Punto de Venta</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Token de activacion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token de activacion
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => handleTokenChange(e.target.value)}
              placeholder="XXXXXXXX"
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={8}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Introduce el token de 8 caracteres generado en la web
            </p>
          </div>

          {/* Nombre del TPV */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del TPV
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Caja Principal"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Boton */}
          <button
            type="submit"
            disabled={loading || token.length !== 8 || !nombre.trim()}
            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Activando...
              </span>
            ) : (
              'Activar TPV'
            )}
          </button>
        </form>

        {/* Ayuda */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>¿No tienes un token?</p>
          <p className="mt-1">
            Genera uno desde <span className="text-blue-600">Configuracion → TPV</span> en la web
          </p>
        </div>
      </div>
    </div>
  );
}
