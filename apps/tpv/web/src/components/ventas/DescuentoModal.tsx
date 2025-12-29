'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Percent, Check, X } from 'lucide-react';

interface DescuentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (descuentoPorcentaje: number) => void;
  lineaNombre: string;
  descuentoActual: number;
  maxDescuento?: number;
}

export function DescuentoModal({
  isOpen,
  onClose,
  onConfirm,
  lineaNombre,
  descuentoActual,
  maxDescuento = 100,
}: DescuentoModalProps) {
  const [porcentaje, setPorcentaje] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPorcentaje(descuentoActual > 0 ? String(descuentoActual) : '');
    }
  }, [isOpen, descuentoActual]);

  const porcentajeNum = parseFloat(porcentaje) || 0;
  const esValido = porcentajeNum >= 0 && porcentajeNum <= maxDescuento;

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setPorcentaje('');
    } else if (key === '⌫') {
      setPorcentaje(porcentaje.slice(0, -1));
    } else if (key === '.') {
      if (!porcentaje.includes('.')) {
        setPorcentaje(porcentaje === '' ? '0.' : porcentaje + '.');
      }
    } else {
      const newValue = porcentaje + key;
      const num = parseFloat(newValue);
      if (!isNaN(num) && num <= maxDescuento) {
        setPorcentaje(newValue);
      }
    }
  };

  const handleConfirm = () => {
    if (esValido) {
      onConfirm(porcentajeNum);
    }
  };

  const handleQuitar = () => {
    onConfirm(0);
  };

  const descuentosRapidos = [5, 10, 15, 20, 25, 50];
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aplicar Descuento" size="md">
      <div className="p-4">
        {/* Info de la linea */}
        <div className="p-3 bg-gray-50 rounded-lg mb-4">
          <p className="text-sm text-gray-500">Producto:</p>
          <p className="font-medium">{lineaNombre}</p>
        </div>

        {/* Display porcentaje */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 text-4xl font-bold p-4 bg-primary-50 rounded-xl">
            <span className={porcentajeNum > maxDescuento ? 'text-red-500' : 'text-primary-700'}>
              {porcentaje || '0'}
            </span>
            <Percent className="w-8 h-8 text-primary-500" />
          </div>
          {porcentajeNum > maxDescuento && (
            <p className="text-sm text-red-500 mt-2">
              Maximo permitido: {maxDescuento}%
            </p>
          )}
        </div>

        {/* Descuentos rapidos */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {descuentosRapidos.map((d) => (
            <button
              key={d}
              onClick={() => setPorcentaje(String(d))}
              disabled={d > maxDescuento}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                d > maxDescuento
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {d}%
            </button>
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
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

        {/* Acciones */}
        <div className="flex gap-3">
          {descuentoActual > 0 && (
            <Button variant="danger" size="lg" onClick={handleQuitar} icon={<X className="w-4 h-4" />}>
              Quitar
            </Button>
          )}
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={handleConfirm}
            disabled={!esValido || porcentajeNum === 0}
            icon={<Check className="w-4 h-4" />}
          >
            Aplicar {porcentajeNum}%
          </Button>
        </div>
      </div>
    </Modal>
  );
}
