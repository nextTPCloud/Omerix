'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Key, X, Delete } from 'lucide-react';
import { tpvApi } from '@/services/api';

interface PinVerificacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (usuario: { id: string; nombre: string }) => void;
  mensaje?: string;
}

export function PinVerificacionModal({
  isOpen,
  onClose,
  onSuccess,
  mensaje = 'Introduce tu PIN para continuar',
}: PinVerificacionModalProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  // Resetear al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  // Manejar teclas
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading) return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError('');
      } else if (e.key === 'Enter' && pin.length > 0) {
        handleVerificar();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, loading]);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError('');
    }
  }, [pin.length]);

  const handleVerificar = async () => {
    if (pin.length === 0) {
      setError('Introduce tu PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verificar PIN con el backend
      const response = await tpvApi.verificarPin(pin);

      if (response.ok) {
        onSuccess({
          id: response.usuario.id,
          nombre: response.usuario.nombre,
        });
        setPin('');
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setError('PIN incorrecto');
        setPin('');
      }
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setError('Error al verificar PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const renderPinDots = () => {
    return (
      <div className="flex justify-center gap-3 mb-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < pin.length
                ? 'bg-primary-600 border-primary-600'
                : 'bg-transparent border-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="p-6">
        {/* Icono */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Key className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        {/* Mensaje */}
        <p className="text-center text-gray-700 font-medium mb-6">{mensaje}</p>

        {/* Indicadores de PIN */}
        <div className={shake ? 'animate-pulse' : ''}>
          {renderPinDots()}
        </div>

        {/* Error */}
        {error && (
          <p className="text-center text-red-500 text-sm mb-4">{error}</p>
        )}

        {/* Teclado numerico */}
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(String(num))}
              disabled={loading}
              className="h-14 text-xl font-semibold bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          {/* Cancelar */}
          <button
            onClick={onClose}
            disabled={loading}
            className="h-14 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 0 */}
          <button
            onClick={() => handleDigit('0')}
            disabled={loading}
            className="h-14 text-xl font-semibold bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50"
          >
            0
          </button>

          {/* Borrar */}
          <button
            onClick={() => setPin((prev) => prev.slice(0, -1))}
            disabled={loading}
            className="h-14 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Boton confirmar */}
        <Button
          variant="primary"
          size="lg"
          className="w-full mt-4"
          onClick={handleVerificar}
          disabled={loading || pin.length === 0}
        >
          {loading ? 'Verificando...' : 'Confirmar'}
        </Button>
      </div>
    </Modal>
  );
}
