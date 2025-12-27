'use client';

import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Wallet, AlertCircle } from 'lucide-react';

interface AperturaCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (importeInicial: number) => void;
  cajaNombre: string;
}

export function AperturaCajaModal({
  isOpen,
  onClose,
  onConfirm,
  cajaNombre,
}: AperturaCajaModalProps) {
  const [importe, setImporte] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const valor = parseFloat(importe) || 0;
    if (valor < 0) {
      setError('El importe no puede ser negativo');
      return;
    }
    onConfirm(valor);
    setImporte('');
    setError('');
  };

  const handleClose = () => {
    setImporte('');
    setError('');
    onClose();
  };

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setImporte('');
    } else if (key === '⌫') {
      setImporte(importe.slice(0, -1));
    } else if (key === '.') {
      if (!importe.includes('.')) {
        setImporte(importe === '' ? '0.' : importe + '.');
      }
    } else {
      // Validar decimales
      const newValue = importe + key;
      if (newValue.includes('.')) {
        const parts = newValue.split('.');
        if (parts[1].length > 2) return;
      }
      setImporte(newValue);
    }
  };

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'];
  const importesRapidos = [50, 100, 150, 200, 250, 300];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Abrir Caja" size="2xl">
      <div className="p-4">
        <div className="flex gap-4">
          {/* Columna izquierda - Info y display */}
          <div className="flex-1">
            {/* Info de caja */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-primary-50 rounded-xl">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-primary-600">Abriendo caja</p>
                <p className="text-base font-bold text-primary-800">{cajaNombre}</p>
              </div>
            </div>

            {/* Importe inicial */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Importe inicial en caja
              </label>
              <div className="text-4xl font-bold text-center p-3 bg-gray-50 rounded-xl">
                {importe || '0'} <span className="text-xl text-gray-400">EUR</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-2 mb-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Botones rápidos */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {importesRapidos.map((valor) => (
                <button
                  key={valor}
                  onClick={() => setImporte(String(valor))}
                  className="py-2 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {valor} EUR
                </button>
              ))}
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              <Button variant="secondary" size="lg" className="flex-1" onClick={handleClose}>
                Cancelar
              </Button>
              <Button variant="success" size="lg" className="flex-1" onClick={handleConfirm}>
                Abrir Caja
              </Button>
            </div>
          </div>

          {/* Columna derecha - Numpad */}
          <div className="w-48">
            <div className="grid grid-cols-3 gap-1">
              {keys.map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="h-12 text-xl font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>
            <button
              onClick={() => setImporte('')}
              className="w-full h-10 mt-1 text-sm font-medium rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            >
              Borrar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
