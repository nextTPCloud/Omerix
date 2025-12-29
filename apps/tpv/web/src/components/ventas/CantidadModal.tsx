'use client';

import { useState, useEffect } from 'react';
import { X, Delete } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cantidad: number) => void;
  productoNombre: string;
  cantidadActual: number;
  permiteCambiarPrecio?: boolean;
  precioActual?: number;
  onCambiarPrecio?: (precio: number) => void;
}

export function CantidadModal({
  isOpen,
  onClose,
  onConfirm,
  productoNombre,
  cantidadActual,
  permiteCambiarPrecio = false,
  precioActual = 0,
  onCambiarPrecio,
}: Props) {
  const [modo, setModo] = useState<'cantidad' | 'precio'>('cantidad');
  const [valor, setValor] = useState('');
  const [primerDigito, setPrimerDigito] = useState(true); // Para borrar al primer dígito

  useEffect(() => {
    if (isOpen) {
      setValor(modo === 'cantidad' ? String(cantidadActual) : String(precioActual));
      setPrimerDigito(true); // Reset al abrir
    }
  }, [isOpen, modo, cantidadActual, precioActual]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (digit === '.' && valor.includes('.')) return;
    if (modo === 'cantidad' && digit === '.') return; // No decimales en cantidad

    if (primerDigito) {
      // Primer dígito: reemplazar el valor actual
      setValor(digit);
      setPrimerDigito(false);
    } else {
      // Siguientes dígitos: añadir al valor
      setValor((prev) => (prev === '0' ? digit : prev + digit));
    }
  };

  const handleBorrar = () => {
    setValor((prev) => prev.slice(0, -1) || '0');
  };

  const handleLimpiar = () => {
    setValor('0');
  };

  const handleConfirmar = () => {
    const num = parseFloat(valor) || 0;
    if (modo === 'cantidad') {
      if (num > 0) {
        onConfirm(num);
        onClose();
      }
    } else if (modo === 'precio' && onCambiarPrecio) {
      onCambiarPrecio(num);
      onClose();
    }
  };

  const valorNumerico = parseFloat(valor) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 truncate max-w-[250px]">
              {productoNombre}
            </h3>
            {permiteCambiarPrecio && (
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setModo('cantidad')}
                  className={`text-xs px-2 py-0.5 rounded ${
                    modo === 'cantidad'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  Cantidad
                </button>
                <button
                  onClick={() => setModo('precio')}
                  className={`text-xs px-2 py-0.5 rounded ${
                    modo === 'precio'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  Precio
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="text-right">
            <span className="text-sm text-gray-500">
              {modo === 'cantidad' ? 'Cantidad' : 'Precio'}
            </span>
            <div className="text-4xl font-bold text-gray-800">
              {valor || '0'}
              {modo === 'precio' && <span className="text-2xl ml-1">EUR</span>}
            </div>
          </div>
        </div>

        {/* Teclado numerico */}
        <div className="p-3 grid grid-cols-3 gap-2">
          {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(String(num))}
              className="h-14 text-xl font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              {num}
            </button>
          ))}

          {/* Fila inferior */}
          <button
            onClick={handleLimpiar}
            className="h-14 text-sm font-medium bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors text-red-600"
          >
            C
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-14 text-xl font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            0
          </button>
          <button
            onClick={handleBorrar}
            className="h-14 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>

          {/* Punto decimal solo para precio */}
          {modo === 'precio' && (
            <button
              onClick={() => handleDigit('.')}
              className="h-14 text-xl font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors col-span-3"
            >
              .
            </button>
          )}
        </div>

        {/* Boton confirmar */}
        <div className="p-3 pt-0">
          <button
            onClick={handleConfirmar}
            disabled={valorNumerico <= 0}
            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
          >
            {modo === 'cantidad'
              ? `Confirmar ${valorNumerico} unidad${valorNumerico !== 1 ? 'es' : ''}`
              : `Aplicar ${valorNumerico.toFixed(2)} EUR`}
          </button>
        </div>
      </div>
    </div>
  );
}
