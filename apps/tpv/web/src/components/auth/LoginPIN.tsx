'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  onLogin: () => void;
  onCambiarTPV?: () => void;
}

export default function LoginPIN({ onLogin, onCambiarTPV }: Props) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const login = useAuthStore((state) => state.login);
  const tpvConfig = useAuthStore((state) => state.tpvConfig);
  const online = useAuthStore((state) => state.online);

  // Manejar teclas numericas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading) return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBorrar();
      } else if (e.key === 'Enter' && pin.length > 0) {
        handleLogin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, loading]);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nuevoPin = pin + digit;
      setPin(nuevoPin);
      setError('');
      // No hay auto-login - el usuario debe pulsar Enter o el boton Entrar
    }
  };

  const handleBorrar = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleLimpiar = () => {
    setPin('');
    setError('');
  };

  const handleLogin = async (pinOverride?: string) => {
    const pinToUse = pinOverride || pin;

    if (pinToUse.length === 0) {
      setError('Introduce tu PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const exito = await login(pinToUse);

      if (exito) {
        onLogin();
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setError('PIN incorrecto');
        setPin('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexion');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar indicadores de PIN
  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < 6; i++) {
      dots.push(
        <div
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-all ${
            i < pin.length
              ? 'bg-blue-600 border-blue-600'
              : 'bg-transparent border-gray-400'
          }`}
        />
      );
    }
    return dots;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      {/* Info del TPV */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">{tpvConfig?.tpvNombre || 'TPV'}</h1>
        <p className="text-blue-200 mt-1">{tpvConfig?.empresaNombre}</p>
        {!online && (
          <span className="inline-block mt-2 px-3 py-1 bg-yellow-500 text-yellow-900 text-sm font-medium rounded-full">
            Modo Offline
          </span>
        )}
      </div>

      {/* Caja de login */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        {/* Icono usuario */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-14 h-14 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        {/* Indicadores de PIN */}
        <div className={`flex justify-center gap-3 mb-6 ${shake ? 'animate-shake' : ''}`}>
          {renderPinDots()}
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-500 text-center text-sm mb-4">
            {error}
          </div>
        )}

        {/* Teclado numerico */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(String(num))}
              disabled={loading}
              className="h-16 text-2xl font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          {/* Limpiar */}
          <button
            onClick={handleLimpiar}
            disabled={loading}
            className="h-16 text-sm font-medium bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Limpiar
          </button>

          {/* 0 */}
          <button
            onClick={() => handleDigit('0')}
            disabled={loading}
            className="h-16 text-2xl font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50"
          >
            0
          </button>

          {/* Borrar */}
          <button
            onClick={handleBorrar}
            disabled={loading}
            className="h-16 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
        </div>

        {/* Boton de confirmar */}
        <button
          onClick={() => handleLogin()}
          disabled={loading}
          className="w-full mt-4 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </div>

      {/* Cambiar TPV */}
      {onCambiarTPV && (
        <button
          onClick={onCambiarTPV}
          className="mt-6 text-blue-200 hover:text-white text-sm transition-colors"
        >
          Cambiar TPV
        </button>
      )}

      {/* Estilos para animacion shake */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
