'use client';

import { useState } from 'react';
import { useComanderoStore } from '../../stores/comanderoStore';

export default function ComanderoLoginPIN() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useComanderoStore(s => s.login);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('Introduce tu PIN');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(pin);
    if (!result.ok) {
      setError(result.error || 'PIN incorrecto');
      setPin('');
    }
    setLoading(false);
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Comandero</h1>
        <p className="text-gray-400">Introduce tu PIN de camarero</p>
      </div>

      {/* Indicador de PIN */}
      <div className="flex gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${
              i < pin.length ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-400 mb-4 text-sm">{error}</p>
      )}

      {/* Teclado numerico */}
      <div className="grid grid-cols-3 gap-3 max-w-[280px] w-full">
        {digits.map((digit, i) => {
          if (i === 9) {
            return (
              <button
                key="clear"
                onClick={handleDelete}
                className="h-16 rounded-xl bg-gray-800 text-lg font-medium active:bg-gray-700 transition-colors"
              >
                ←
              </button>
            );
          }
          if (i === 11) {
            return (
              <button
                key="enter"
                onClick={handleSubmit}
                disabled={loading || pin.length < 4}
                className="h-16 rounded-xl bg-blue-600 text-lg font-medium active:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {loading ? '...' : '→'}
              </button>
            );
          }
          return (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-16 rounded-xl bg-gray-800 text-2xl font-medium active:bg-gray-700 transition-colors"
            >
              {digit}
            </button>
          );
        })}
      </div>
    </div>
  );
}
