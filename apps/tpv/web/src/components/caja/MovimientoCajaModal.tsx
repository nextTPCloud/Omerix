'use client';

import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Numpad } from '../ui/Numpad';
import { Button } from '../ui/Button';
import { ArrowDownCircle, ArrowUpCircle, AlertCircle } from 'lucide-react';

interface MovimientoCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tipo: 'entrada' | 'salida', importe: number, descripcion: string) => void;
  efectivoActual: number;
}

export function MovimientoCajaModal({
  isOpen,
  onClose,
  onConfirm,
  efectivoActual,
}: MovimientoCajaModalProps) {
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [importe, setImporte] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  const importeNumerico = parseFloat(importe) || 0;

  const handleConfirm = () => {
    if (importeNumerico <= 0) {
      setError('El importe debe ser mayor que 0');
      return;
    }

    if (tipo === 'salida' && importeNumerico > efectivoActual) {
      setError(`No hay suficiente efectivo en caja (${efectivoActual.toFixed(2)} EUR)`);
      return;
    }

    if (!descripcion.trim()) {
      setError('Debe indicar un motivo');
      return;
    }

    onConfirm(tipo, importeNumerico, descripcion);
    handleClose();
  };

  const handleClose = () => {
    setTipo('entrada');
    setImporte('');
    setDescripcion('');
    setError('');
    onClose();
  };

  const motivosComunes = {
    entrada: ['Fondo de caja', 'Cambio', 'Préstamo', 'Otro'],
    salida: ['Gastos varios', 'Pago proveedor', 'Cambio a otra caja', 'Otro'],
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Movimiento de Caja" size="md">
      <div className="p-6">
        {/* Tipo de movimiento */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setTipo('entrada')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              tipo === 'entrada'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <ArrowDownCircle
              className={`w-8 h-8 ${tipo === 'entrada' ? 'text-green-600' : 'text-gray-400'}`}
            />
            <span className={`font-medium ${tipo === 'entrada' ? 'text-green-700' : 'text-gray-600'}`}>
              Entrada
            </span>
          </button>

          <button
            onClick={() => setTipo('salida')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              tipo === 'salida'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <ArrowUpCircle
              className={`w-8 h-8 ${tipo === 'salida' ? 'text-red-600' : 'text-gray-400'}`}
            />
            <span className={`font-medium ${tipo === 'salida' ? 'text-red-700' : 'text-gray-600'}`}>
              Salida
            </span>
          </button>
        </div>

        {/* Info efectivo actual */}
        {tipo === 'salida' && (
          <div className="mb-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
            Efectivo disponible: <strong>{efectivoActual.toFixed(2)} EUR</strong>
          </div>
        )}

        {/* Importe */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Importe</label>
          <div className="text-3xl font-bold text-center p-4 bg-gray-50 rounded-xl mb-4">
            {importe || '0'} <span className="text-xl text-gray-400">EUR</span>
          </div>
          <Numpad value={importe} onChange={setImporte} />
        </div>

        {/* Motivo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {motivosComunes[tipo].map((motivo) => (
              <button
                key={motivo}
                onClick={() => setDescripcion(motivo)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  descripcion === motivo
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {motivo}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción del movimiento..."
            className="w-full p-3 border rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant={tipo === 'entrada' ? 'success' : 'danger'}
            size="lg"
            className="flex-1"
            onClick={handleConfirm}
          >
            {tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
