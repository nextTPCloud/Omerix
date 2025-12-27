'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Check,
  X,
  Plus,
} from 'lucide-react';

type MetodoPago = 'efectivo' | 'tarjeta' | 'bizum';

interface Pago {
  metodo: MetodoPago;
  importe: number;
}

interface CobroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pagos: Pago[], cambio: number) => void;
  total: number;
}

export function CobroModal({ isOpen, onClose, onConfirm, total }: CobroModalProps) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [metodoPagoActual, setMetodoPagoActual] = useState<MetodoPago>('efectivo');
  const [importeActual, setImporteActual] = useState('');

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setPagos([]);
      setMetodoPagoActual('efectivo');
      setImporteActual('');
    }
  }, [isOpen]);

  const importeNumerico = parseFloat(importeActual) || 0;
  const totalPagado = pagos.reduce((acc, p) => acc + p.importe, 0);
  const pendiente = Math.max(0, total - totalPagado);

  // Calcular cambio solo del efectivo
  const efectivoTotal = pagos
    .filter(p => p.metodo === 'efectivo')
    .reduce((acc, p) => acc + p.importe, 0) + (metodoPagoActual === 'efectivo' ? importeNumerico : 0);
  const efectivoNecesario = Math.max(0, total - pagos.filter(p => p.metodo !== 'efectivo').reduce((acc, p) => acc + p.importe, 0));
  const cambio = Math.max(0, efectivoTotal - efectivoNecesario);

  const metodosPago = [
    { id: 'efectivo' as MetodoPago, label: 'Efectivo', icon: Banknote, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-500', textColor: 'text-green-700' },
    { id: 'tarjeta' as MetodoPago, label: 'Tarjeta', icon: CreditCard, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-500', textColor: 'text-blue-700' },
    { id: 'bizum' as MetodoPago, label: 'Bizum', icon: Smartphone, color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-500', textColor: 'text-purple-700' },
  ];

  const importesRapidos = [5, 10, 20, 50, 100];

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setImporteActual('');
    } else if (key === '⌫') {
      setImporteActual(importeActual.slice(0, -1));
    } else if (key === '.') {
      if (!importeActual.includes('.')) {
        setImporteActual(importeActual === '' ? '0.' : importeActual + '.');
      }
    } else {
      const newValue = importeActual + key;
      if (newValue.includes('.')) {
        const parts = newValue.split('.');
        if (parts[1].length > 2) return;
      }
      setImporteActual(newValue);
    }
  };

  const handleAgregarPago = () => {
    if (importeNumerico <= 0) return;

    setPagos([...pagos, { metodo: metodoPagoActual, importe: importeNumerico }]);
    setImporteActual('');
  };

  const handleEliminarPago = (index: number) => {
    setPagos(pagos.filter((_, i) => i !== index));
  };

  const handlePagoRapido = (metodo: MetodoPago) => {
    // Pago rápido: pagar todo el pendiente con este método
    if (pendiente <= 0) return;
    setPagos([...pagos, { metodo, importe: pendiente }]);
  };

  const handleConfirmar = () => {
    // Si hay importe en el input, agregarlo primero
    let pagosFinales = [...pagos];
    if (importeNumerico > 0) {
      pagosFinales.push({ metodo: metodoPagoActual, importe: importeNumerico });
    }

    const totalFinal = pagosFinales.reduce((acc, p) => acc + p.importe, 0);
    if (totalFinal < total) return;

    onConfirm(pagosFinales, cambio);
  };

  const puedeConfirmar = totalPagado + importeNumerico >= total;
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'];

  const getMetodoInfo = (metodo: MetodoPago) => metodosPago.find(m => m.id === metodo)!;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cobrar" size="3xl">
      <div className="p-4">
        {/* Header con total y pendiente */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 p-4 bg-primary-50 rounded-xl text-center">
            <p className="text-xs text-primary-600">Total a cobrar</p>
            <p className="text-3xl font-bold text-primary-700">{total.toFixed(2)} €</p>
          </div>
          {totalPagado > 0 && (
            <div className={`flex-1 p-4 rounded-xl text-center ${pendiente > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
              <p className="text-xs text-gray-600">{pendiente > 0 ? 'Pendiente' : 'Pagado'}</p>
              <p className={`text-3xl font-bold ${pendiente > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                {pendiente > 0 ? pendiente.toFixed(2) : totalPagado.toFixed(2)} €
              </p>
            </div>
          )}
          {cambio > 0 && (
            <div className="flex-1 p-4 bg-green-100 rounded-xl text-center">
              <p className="text-xs text-green-600">Cambio</p>
              <p className="text-3xl font-bold text-green-700">{cambio.toFixed(2)} €</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Columna 1 - Pagos rápidos por método */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Pago rápido (total)</p>
            <div className="space-y-2">
              {metodosPago.map((metodo) => {
                const Icon = metodo.icon;
                return (
                  <button
                    key={metodo.id}
                    onClick={() => handlePagoRapido(metodo.id)}
                    disabled={pendiente <= 0}
                    className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                      pendiente <= 0
                        ? 'opacity-50 cursor-not-allowed border-gray-200'
                        : `${metodo.bgColor} ${metodo.borderColor} hover:opacity-80`
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${metodo.textColor}`} />
                    <div className="flex-1 text-left">
                      <span className={`font-medium ${metodo.textColor}`}>{metodo.label}</span>
                      <p className="text-xs text-gray-500">Pagar {pendiente.toFixed(2)} €</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagos registrados */}
            {pagos.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Pagos registrados</p>
                <div className="space-y-1">
                  {pagos.map((pago, idx) => {
                    const info = getMetodoInfo(pago.metodo);
                    const Icon = info.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${info.textColor}`} />
                          <span className="text-sm">{info.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{pago.importe.toFixed(2)} €</span>
                          <button
                            onClick={() => handleEliminarPago(idx)}
                            className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center"
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Columna 2 - Pago parcial con importe */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Pago parcial / con importe</p>

            {/* Selector de método */}
            <div className="flex gap-1 mb-3">
              {metodosPago.map((metodo) => {
                const Icon = metodo.icon;
                const isActive = metodoPagoActual === metodo.id;
                return (
                  <button
                    key={metodo.id}
                    onClick={() => setMetodoPagoActual(metodo.id)}
                    className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                      isActive
                        ? `${metodo.bgColor} ${metodo.borderColor} border-2`
                        : 'border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? metodo.textColor : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium ${isActive ? metodo.textColor : 'text-gray-500'}`}>
                      {metodo.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Display importe */}
            <div className="text-3xl font-bold text-center p-3 bg-gray-50 rounded-xl mb-3">
              {importeActual || '0'} <span className="text-lg text-gray-400">€</span>
            </div>

            {/* Importes rápidos (solo efectivo) */}
            {metodoPagoActual === 'efectivo' && (
              <div className="flex flex-wrap gap-1 mb-3">
                <button
                  onClick={() => setImporteActual(pendiente.toFixed(2))}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                >
                  Exacto
                </button>
                {importesRapidos.map((valor) => (
                  <button
                    key={valor}
                    onClick={() => setImporteActual(String(valor))}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    {valor}€
                  </button>
                ))}
              </div>
            )}

            {/* Botón agregar pago */}
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleAgregarPago}
              disabled={importeNumerico <= 0}
              icon={<Plus className="w-4 h-4" />}
            >
              Agregar {getMetodoInfo(metodoPagoActual).label}: {importeNumerico.toFixed(2)} €
            </Button>
          </div>

          {/* Columna 3 - Numpad */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Teclado</p>
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
              onClick={() => setImporteActual('')}
              className="w-full h-10 mt-1 text-sm font-medium rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            >
              Borrar
            </button>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 mt-4 pt-4 border-t">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="success"
            size="lg"
            className="flex-1"
            onClick={handleConfirmar}
            disabled={!puedeConfirmar}
            icon={<Check className="w-5 h-5" />}
          >
            Confirmar Cobro
          </Button>
        </div>
      </div>
    </Modal>
  );
}
