'use client';

import { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Wallet,
  CreditCard,
  Banknote,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Minus,
  Plus,
} from 'lucide-react';

interface ArqueoCaja {
  efectivo: number;
  tarjeta: number;
  otros: number;
  total: number;
}

interface CierreCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (arqueoReal: ArqueoCaja, observaciones: string, desgloseBilletes: Record<string, number>) => void;
  arqueoTeorico: ArqueoCaja;
  cajaNombre: string;
  numeroVentas: number;
  totalVentas: number;
}

// Billetes y monedas en euros
const DENOMINACIONES = [
  { valor: 500, tipo: 'billete', label: '500 €' },
  { valor: 200, tipo: 'billete', label: '200 €' },
  { valor: 100, tipo: 'billete', label: '100 €' },
  { valor: 50, tipo: 'billete', label: '50 €' },
  { valor: 20, tipo: 'billete', label: '20 €' },
  { valor: 10, tipo: 'billete', label: '10 €' },
  { valor: 5, tipo: 'billete', label: '5 €' },
  { valor: 2, tipo: 'moneda', label: '2 €' },
  { valor: 1, tipo: 'moneda', label: '1 €' },
  { valor: 0.5, tipo: 'moneda', label: '50 cts' },
  { valor: 0.2, tipo: 'moneda', label: '20 cts' },
  { valor: 0.1, tipo: 'moneda', label: '10 cts' },
  { valor: 0.05, tipo: 'moneda', label: '5 cts' },
  { valor: 0.02, tipo: 'moneda', label: '2 cts' },
  { valor: 0.01, tipo: 'moneda', label: '1 ct' },
];

export function CierreCajaModal({
  isOpen,
  onClose,
  onConfirm,
  arqueoTeorico,
  cajaNombre,
  numeroVentas,
  totalVentas,
}: CierreCajaModalProps) {
  const [conteo, setConteo] = useState<Record<number, number>>({});
  const [tarjeta, setTarjeta] = useState('');
  const [otros, setOtros] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Calcular efectivo desde el conteo de billetes/monedas
  const efectivoContado = useMemo(() => {
    return Object.entries(conteo).reduce((total, [valor, cantidad]) => {
      return total + (parseFloat(valor) * cantidad);
    }, 0);
  }, [conteo]);

  const arqueoReal: ArqueoCaja = {
    efectivo: efectivoContado,
    tarjeta: parseFloat(tarjeta) || arqueoTeorico.tarjeta,
    otros: parseFloat(otros) || arqueoTeorico.otros,
    total: efectivoContado + (parseFloat(tarjeta) || arqueoTeorico.tarjeta) + (parseFloat(otros) || arqueoTeorico.otros),
  };

  const diferencia = arqueoReal.total - arqueoTeorico.total;
  const diferenciaEfectivo = efectivoContado - arqueoTeorico.efectivo;

  const handleConteoChange = (valor: number, delta: number) => {
    setConteo(prev => {
      const current = prev[valor] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        const { [valor]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [valor]: newValue };
    });
  };

  // Verificar si se requiere justificación (hay diferencia significativa)
  const requiereJustificacion = Math.abs(diferencia) > 0.01; // Tolerancia de 1 céntimo
  const puedeConfirmar = !requiereJustificacion || observaciones.trim().length >= 10;

  const handleConfirm = () => {
    if (requiereJustificacion && observaciones.trim().length < 10) {
      return; // No permitir cierre sin justificación
    }
    onConfirm(arqueoReal, observaciones, conteo);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setConteo({});
    setTarjeta('');
    setOtros('');
    setObservaciones('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cerrar Caja" size="full">
      <div className="p-4">
        {/* Resumen del día - más compacto */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <p className="text-xs text-purple-600">Caja</p>
            <p className="text-lg font-bold text-purple-800">{cajaNombre}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-600">Ventas</p>
            <p className="text-lg font-bold text-blue-800">{numeroVentas}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-xl">
            <p className="text-xs text-green-600">Total vendido</p>
            <p className="text-lg font-bold text-green-800">{totalVentas.toFixed(2)} €</p>
          </div>
          <div className={`p-3 rounded-xl ${
            diferencia === 0 ? 'bg-green-50' : Math.abs(diferencia) <= 1 ? 'bg-amber-50' : 'bg-red-50'
          }`}>
            <p className="text-xs text-gray-600">Diferencia</p>
            <p className={`text-lg font-bold ${
              diferencia === 0 ? 'text-green-700' : diferencia > 0 ? 'text-blue-700' : 'text-red-700'
            }`}>
              {diferencia >= 0 ? '+' : ''}{diferencia.toFixed(2)} €
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Columna 1 - Conteo de efectivo (billetes) */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-green-600" />
              Billetes
            </h3>
            <div className="space-y-1">
              {DENOMINACIONES.filter(d => d.tipo === 'billete').map(denom => (
                <div key={denom.valor} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium w-16">{denom.label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConteoChange(denom.valor, -1)}
                      className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">
                      {conteo[denom.valor] || 0}
                    </span>
                    <button
                      onClick={() => handleConteoChange(denom.valor, 1)}
                      className="w-7 h-7 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-700 flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="w-16 text-right text-xs text-gray-500">
                      {((conteo[denom.valor] || 0) * denom.valor).toFixed(2)} €
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 2 - Conteo de monedas */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-600" />
              Monedas
            </h3>
            <div className="space-y-1">
              {DENOMINACIONES.filter(d => d.tipo === 'moneda').map(denom => (
                <div key={denom.valor} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium w-16">{denom.label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConteoChange(denom.valor, -1)}
                      className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">
                      {conteo[denom.valor] || 0}
                    </span>
                    <button
                      onClick={() => handleConteoChange(denom.valor, 1)}
                      className="w-7 h-7 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-700 flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="w-16 text-right text-xs text-gray-500">
                      {((conteo[denom.valor] || 0) * denom.valor).toFixed(2)} €
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 3 - Resumen y otros medios de pago */}
          <div className="space-y-3">
            {/* Total efectivo contado */}
            <div className={`p-3 rounded-xl border-2 ${
              diferenciaEfectivo === 0 ? 'border-green-300 bg-green-50' :
              Math.abs(diferenciaEfectivo) <= 1 ? 'border-amber-300 bg-amber-50' :
              'border-red-300 bg-red-50'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Efectivo contado</span>
                <span className="text-xs text-gray-500">
                  Teórico: {arqueoTeorico.efectivo.toFixed(2)} €
                </span>
              </div>
              <div className="text-2xl font-bold">
                {efectivoContado.toFixed(2)} €
              </div>
              <div className={`text-xs mt-1 ${
                diferenciaEfectivo === 0 ? 'text-green-600' :
                diferenciaEfectivo > 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                {diferenciaEfectivo === 0 ? '✓ Cuadrado' :
                 diferenciaEfectivo > 0 ? `+${diferenciaEfectivo.toFixed(2)} € sobrante` :
                 `${diferenciaEfectivo.toFixed(2)} € faltante`}
              </div>
            </div>

            {/* Tarjeta */}
            <div className="p-3 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Tarjeta</span>
                <span className="text-xs text-gray-500 ml-auto">
                  Teórico: {arqueoTeorico.tarjeta.toFixed(2)} €
                </span>
              </div>
              <input
                type="number"
                value={tarjeta}
                onChange={(e) => setTarjeta(e.target.value)}
                placeholder={arqueoTeorico.tarjeta.toFixed(2)}
                className="w-full p-2 text-lg font-bold border rounded-lg text-center"
              />
            </div>

            {/* Otros */}
            <div className="p-3 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Otros (Bizum, etc.)</span>
                <span className="text-xs text-gray-500 ml-auto">
                  Teórico: {arqueoTeorico.otros.toFixed(2)} €
                </span>
              </div>
              <input
                type="number"
                value={otros}
                onChange={(e) => setOtros(e.target.value)}
                placeholder={arqueoTeorico.otros.toFixed(2)}
                className="w-full p-2 text-lg font-bold border rounded-lg text-center"
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${requiereJustificacion ? 'text-red-600' : 'text-gray-700'}`}>
                Observaciones {requiereJustificacion && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder={requiereJustificacion ? "OBLIGATORIO: Explica el motivo del descuadre (min. 10 caracteres)..." : "Notas sobre el cierre..."}
                className={`w-full p-2 border rounded-lg resize-none h-16 text-sm ${
                  requiereJustificacion && observaciones.trim().length < 10
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
                    : ''
                }`}
              />
              {requiereJustificacion && observaciones.trim().length < 10 && (
                <p className="text-xs text-red-500 mt-1">
                  Debes justificar el descuadre de {diferencia >= 0 ? '+' : ''}{diferencia.toFixed(2)} € (mín. 10 caracteres)
                </p>
              )}
            </div>

            {/* Estado final */}
            <div className={`p-3 rounded-xl flex items-center gap-3 ${
              diferencia === 0 ? 'bg-green-100' :
              Math.abs(diferencia) <= 1 ? 'bg-amber-100' : 'bg-red-100'
            }`}>
              {diferencia === 0 ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : Math.abs(diferencia) <= 1 ? (
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <p className="text-xs text-gray-600">Total arqueo</p>
                <p className="text-xl font-bold">{arqueoReal.total.toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 mt-4 pt-4 border-t">
          <Button variant="secondary" size="lg" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="lg"
            className="flex-1"
            onClick={handleConfirm}
            disabled={!puedeConfirmar}
          >
            {requiereJustificacion && !puedeConfirmar ? 'Justifica el descuadre' : 'Cerrar Caja'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
