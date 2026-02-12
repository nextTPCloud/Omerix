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
  Gift,
  Printer,
  Heart,
} from 'lucide-react';

type MetodoPago = 'efectivo' | 'tarjeta' | 'bizum';

interface Pago {
  metodo: MetodoPago;
  importe: number;
}

interface CobroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pagos: Pago[], cambio: number, opciones: { esTicketRegalo?: boolean; imprimir?: boolean; propina?: number }) => void;
  total: number;
  permitirPropina?: boolean;
}

export function CobroModal({ isOpen, onClose, onConfirm, total, permitirPropina = false }: CobroModalProps) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [metodoPagoActual, setMetodoPagoActual] = useState<MetodoPago>('efectivo');
  const [importeActual, setImporteActual] = useState('');
  const [esTicketRegalo, setEsTicketRegalo] = useState(false);
  const [propina, setPropina] = useState(0);
  const [mostrarPropina, setMostrarPropina] = useState(false);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setPagos([]);
      setMetodoPagoActual('efectivo');
      setImporteActual('');
      setEsTicketRegalo(false);
      setPropina(0);
      setMostrarPropina(false);
    }
  }, [isOpen]);

  // Total incluyendo propina
  const totalConPropina = total + propina;

  const importeNumerico = parseFloat(importeActual) || 0;
  const totalPagado = pagos.reduce((acc, p) => acc + p.importe, 0);
  const pendiente = Math.max(0, totalConPropina - totalPagado);

  // Calcular cambio solo del efectivo
  const efectivoTotal = pagos
    .filter(p => p.metodo === 'efectivo')
    .reduce((acc, p) => acc + p.importe, 0) + (metodoPagoActual === 'efectivo' ? importeNumerico : 0);
  const efectivoNecesario = Math.max(0, totalConPropina - pagos.filter(p => p.metodo !== 'efectivo').reduce((acc, p) => acc + p.importe, 0));
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

  const handleConfirmar = (imprimir: boolean) => {
    // Si hay importe en el input, agregarlo primero
    let pagosFinales = [...pagos];
    if (importeNumerico > 0) {
      pagosFinales.push({ metodo: metodoPagoActual, importe: importeNumerico });
    }

    const totalFinal = pagosFinales.reduce((acc, p) => acc + p.importe, 0);
    if (totalFinal < totalConPropina) return;

    onConfirm(pagosFinales, cambio, { esTicketRegalo, imprimir, propina: propina > 0 ? propina : undefined });
  };

  // Aplicar propina por porcentaje
  const aplicarPropinaPorcentaje = (porcentaje: number) => {
    const importePropina = Math.round(total * porcentaje) / 100;
    setPropina(importePropina);
  };

  const puedeConfirmar = totalPagado + importeNumerico >= totalConPropina;
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'];

  const getMetodoInfo = (metodo: MetodoPago) => metodosPago.find(m => m.id === metodo)!;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cobrar" size="full">
      <div className="p-3">
        {/* Layout principal horizontal */}
        <div className="flex gap-3">
          {/* Columna 1 - Total + Pagos rápidos + Pagos registrados */}
          <div className="w-[220px] flex-shrink-0 flex flex-col gap-3">
            {/* Total a cobrar */}
            <div className="p-3 bg-primary-50 rounded-xl text-center">
              <p className="text-xs text-primary-600">Total a cobrar</p>
              <p className="text-2xl font-bold text-primary-700">{totalConPropina.toFixed(2)} €</p>
              {propina > 0 && (
                <p className="text-xs text-pink-600">({total.toFixed(2)} + {propina.toFixed(2)} propina)</p>
              )}
            </div>

            {/* Pendiente / Cambio */}
            {totalPagado > 0 && (
              <div className={`p-3 rounded-xl text-center ${pendiente > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                <p className="text-xs text-gray-600">{pendiente > 0 ? 'Pendiente' : 'Pagado'}</p>
                <p className={`text-xl font-bold ${pendiente > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  {pendiente > 0 ? pendiente.toFixed(2) : totalPagado.toFixed(2)} €
                </p>
              </div>
            )}
            {cambio > 0 && (
              <div className="p-3 bg-green-100 rounded-xl text-center">
                <p className="text-xs text-green-600">Cambio</p>
                <p className="text-xl font-bold text-green-700">{cambio.toFixed(2)} €</p>
              </div>
            )}

            {/* Pagos rápidos */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Pago rápido (total)</p>
              <div className="space-y-1">
                {metodosPago.map((metodo) => {
                  const Icon = metodo.icon;
                  return (
                    <button
                      key={metodo.id}
                      onClick={() => handlePagoRapido(metodo.id)}
                      disabled={pendiente <= 0}
                      className={`w-full p-2 rounded-lg border-2 flex items-center gap-2 transition-all text-sm ${
                        pendiente <= 0
                          ? 'opacity-50 cursor-not-allowed border-gray-200'
                          : `${metodo.bgColor} ${metodo.borderColor} hover:opacity-80`
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${metodo.textColor}`} />
                      <span className={`font-medium ${metodo.textColor}`}>{metodo.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pagos registrados */}
            {pagos.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pagos</p>
                <div className="space-y-1">
                  {pagos.map((pago, idx) => {
                    const info = getMetodoInfo(pago.metodo);
                    const Icon = info.icon;
                    return (
                      <div key={idx} className="flex items-center justify-between p-1.5 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-4 h-4 ${info.textColor}`} />
                          <span>{info.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold">{pago.importe.toFixed(2)} €</span>
                          <button
                            onClick={() => handleEliminarPago(idx)}
                            className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center"
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

          {/* Columna 2 - Pago parcial */}
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-500">Pago parcial / con importe</p>

            {/* Selector de método */}
            <div className="flex gap-1">
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
            <div className="text-3xl font-bold text-center p-2 bg-gray-50 rounded-xl">
              {importeActual || '0'} <span className="text-lg text-gray-400">€</span>
            </div>

            {/* Importes rápidos (solo efectivo) */}
            {metodoPagoActual === 'efectivo' && (
              <div className="flex flex-wrap gap-1">
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

          {/* Columna 3 - Teclado numérico */}
          <div className="w-[180px] flex-shrink-0">
            <p className="text-xs font-medium text-gray-500 mb-1">Teclado</p>
            <div className="grid grid-cols-3 gap-1">
              {keys.map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="h-11 text-lg font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>
            <button
              onClick={() => setImporteActual('')}
              className="w-full h-9 mt-1 text-sm font-medium rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            >
              Borrar
            </button>
          </div>
        </div>

        {/* Fila inferior: Propina + Ticket Regalo + Acciones */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t">
          {/* Propina */}
          {permitirPropina && (
            <button
              onClick={() => setMostrarPropina(!mostrarPropina)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                propina > 0
                  ? 'bg-pink-50 border-pink-300 text-pink-700'
                  : 'bg-gray-50 border-gray-200 hover:border-pink-300 text-gray-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${propina > 0 ? 'text-pink-600 fill-pink-600' : 'text-gray-400'}`} />
              {propina > 0 ? `${propina.toFixed(2)} €` : 'Propina'}
            </button>
          )}

          {/* Ticket Regalo */}
          <label className="flex items-center gap-2 px-3 py-2 bg-pink-50 rounded-lg border border-pink-200 cursor-pointer text-sm">
            <Gift className="w-4 h-4 text-pink-600" />
            <span className="text-pink-700">Regalo</span>
            <input
              type="checkbox"
              checked={esTicketRegalo}
              onChange={(e) => setEsTicketRegalo(e.target.checked)}
              className="w-4 h-4 accent-pink-600"
            />
          </label>

          <div className="flex-1" />

          {/* Botones de acción */}
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleConfirmar(false)}
            disabled={!puedeConfirmar}
            icon={<Check className="w-5 h-5" />}
          >
            Confirmar
          </Button>
          <Button
            variant="success"
            size="lg"
            onClick={() => handleConfirmar(true)}
            disabled={!puedeConfirmar}
            icon={<Printer className="w-5 h-5" />}
          >
            Cobrar e Imprimir
          </Button>
        </div>

        {/* Panel propina expandido */}
        {permitirPropina && mostrarPropina && (
          <div className="mt-2 p-3 bg-pink-50 rounded-xl border border-pink-200">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => aplicarPropinaPorcentaje(pct)}
                    className={`py-1.5 px-3 rounded-lg font-medium text-sm transition-all ${
                      propina === Math.round(total * pct) / 100
                        ? 'bg-pink-500 text-white'
                        : 'bg-white border border-pink-300 text-pink-700 hover:bg-pink-100'
                    }`}
                  >
                    {pct}% ({(total * pct / 100).toFixed(2)}€)
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="0.50"
                min="0"
                value={propina || ''}
                onChange={(e) => setPropina(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="Importe"
                className="w-28 px-3 py-1.5 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-500 outline-none text-sm"
              />
              <button
                onClick={() => { setPropina(0); setMostrarPropina(false); }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                Quitar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
