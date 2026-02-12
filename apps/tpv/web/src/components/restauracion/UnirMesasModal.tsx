'use client';

import { useState, useMemo } from 'react';
import {
  X,
  Merge,
  Check,
  Users,
  Package,
  Calculator,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRestauracionStore } from '@/stores/restauracionStore';
import { useVentaStore, type VentaMesa } from '@/stores/ventaStore';
import { Mesa } from '@/services/restauracion.service';

interface UnirMesasModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesaActual: Mesa | null;
  onUnir: (mesasAUnir: Mesa[]) => void;
}

export function UnirMesasModal({
  isOpen,
  onClose,
  mesaActual,
  onUnir,
}: UnirMesasModalProps) {
  const { salones, mesas } = useRestauracionStore();
  const { ventasPorMesa } = useVentaStore();

  const [mesasSeleccionadas, setMesasSeleccionadas] = useState<Set<string>>(new Set());
  const [salonSeleccionado, setSalonSeleccionado] = useState<string | null>(null);

  // Mesas ocupadas con tickets (excluyendo la actual)
  const mesasConTickets = useMemo(() => {
    return mesas.filter((m) => {
      if (m._id === mesaActual?._id) return false;
      if (m.activa === false) return false;
      if (salonSeleccionado && m.salonId !== salonSeleccionado) return false;
      // Tiene ticket en el store
      return ventasPorMesa[m._id] && ventasPorMesa[m._id].lineas.length > 0;
    });
  }, [mesas, mesaActual, salonSeleccionado, ventasPorMesa]);

  // Calcular totales de mesas seleccionadas
  const resumenSeleccion = useMemo(() => {
    let totalProductos = 0;
    let totalImporte = 0;

    mesasSeleccionadas.forEach((mesaId) => {
      const venta = ventasPorMesa[mesaId];
      if (venta) {
        totalProductos += venta.lineas.reduce((acc, l) => acc + l.cantidad, 0);
        totalImporte += venta.total;
      }
    });

    return { totalProductos, totalImporte };
  }, [mesasSeleccionadas, ventasPorMesa]);

  // Toggle selección de mesa
  const toggleMesa = (mesaId: string) => {
    const newSet = new Set(mesasSeleccionadas);
    if (newSet.has(mesaId)) {
      newSet.delete(mesaId);
    } else {
      newSet.add(mesaId);
    }
    setMesasSeleccionadas(newSet);
  };

  // Seleccionar todas las mesas con tickets
  const seleccionarTodas = () => {
    const allIds = new Set(mesasConTickets.map((m) => m._id));
    setMesasSeleccionadas(allIds);
  };

  // Deseleccionar todas
  const deseleccionarTodas = () => {
    setMesasSeleccionadas(new Set());
  };

  // Confirmar unión
  const confirmarUnion = () => {
    if (mesasSeleccionadas.size === 0) return;

    const mesasAUnir = mesas.filter((m) => mesasSeleccionadas.has(m._id));
    onUnir(mesasAUnir);
    handleClose();
  };

  // Cerrar y resetear
  const handleClose = () => {
    setMesasSeleccionadas(new Set());
    setSalonSeleccionado(null);
    onClose();
  };

  // Obtener info de venta para una mesa
  const getVentaInfo = (mesaId: string): { productos: number; total: number } | null => {
    const venta = ventasPorMesa[mesaId];
    if (!venta) return null;
    return {
      productos: venta.lineas.reduce((acc, l) => acc + l.cantidad, 0),
      total: venta.total,
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Merge className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Unir Mesas</h2>
              <p className="text-sm text-gray-500">
                {mesaActual
                  ? `Unir tickets a Mesa ${mesaActual.numero}`
                  : 'Selecciona mesas para unir'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Tabs de salones */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSalonSeleccionado(null)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  !salonSeleccionado
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {salones.map((salon) => (
                <button
                  key={salon._id}
                  onClick={() => setSalonSeleccionado(salon._id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    salonSeleccionado === salon._id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {salon.nombre}
                </button>
              ))}
            </div>

            {/* Acciones rápidas */}
            {mesasConTickets.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={seleccionarTodas}
                >
                  Seleccionar todas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deseleccionarTodas}
                >
                  Deseleccionar
                </Button>
              </div>
            )}

            {/* Grid de mesas con tickets */}
            <div className="grid grid-cols-3 gap-3">
              {mesasConTickets.map((mesa) => {
                const isSelected = mesasSeleccionadas.has(mesa._id);
                const ventaInfo = getVentaInfo(mesa._id);
                const salon = salones.find((s) => s._id === mesa.salonId);

                return (
                  <button
                    key={mesa._id}
                    onClick={() => toggleMesa(mesa._id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {mesa.numero}
                        </p>
                        {salon && (
                          <p className="text-xs text-gray-500">{salon.nombre}</p>
                        )}
                      </div>
                      {/* Checkbox visual */}
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>

                    {/* Info del ticket */}
                    {ventaInfo && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <ShoppingCart className="w-3 h-3" />
                            {ventaInfo.productos} prod.
                          </span>
                          <span className="font-semibold text-gray-900">
                            {ventaInfo.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {mesasConTickets.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No hay mesas con tickets</p>
                <p className="text-sm">Las mesas deben tener productos para poder unirlas</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            {/* Resumen */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{mesasSeleccionadas.size} mesas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="w-4 h-4" />
                <span>{resumenSeleccion.totalProductos} productos</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Calculator className="w-4 h-4" />
                <span>{resumenSeleccion.totalImporte.toFixed(2)}</span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={confirmarUnion}
                disabled={mesasSeleccionadas.size === 0}
              >
                <Merge className="w-4 h-4 mr-1" />
                Unir {mesasSeleccionadas.size > 0 && `(${mesasSeleccionadas.size})`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
