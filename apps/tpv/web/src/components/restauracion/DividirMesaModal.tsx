'use client';

import { useState, useMemo } from 'react';
import {
  X,
  Split,
  Check,
  ChevronRight,
  Users,
  Package,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRestauracionStore } from '@/stores/restauracionStore';
import { useVentaStore, type VentaMesa, type LineaVenta } from '@/stores/ventaStore';
import { Mesa } from '@/services/restauracion.service';

interface LineaVentaLocal {
  id: string;
  productoId: string;
  varianteId?: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  total: number;
  iva: number;
}

interface DividirMesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineas: LineaVentaLocal[];
  mesaActual: Mesa | null;
  onDividir: (lineasParaMover: LineaVentaLocal[], mesaDestino: Mesa) => void;
}

type ModoDivision = 'seleccionar' | 'mesa';

export function DividirMesaModal({
  isOpen,
  onClose,
  lineas,
  mesaActual,
  onDividir,
}: DividirMesaModalProps) {
  const { salones, mesas } = useRestauracionStore();
  const { ventasPorMesa } = useVentaStore();

  const [modo, setModo] = useState<ModoDivision>('seleccionar');
  const [lineasSeleccionadas, setLineasSeleccionadas] = useState<Set<string>>(new Set());
  const [cantidadesAMover, setCantidadesAMover] = useState<Record<string, number>>({});
  const [mesaDestino, setMesaDestino] = useState<Mesa | null>(null);
  const [salonSeleccionado, setSalonSeleccionado] = useState<string | null>(null);

  // Mesas libres disponibles (excluyendo la actual)
  const mesasDisponibles = useMemo(() => {
    return mesas.filter(
      (m) =>
        m._id !== mesaActual?._id &&
        m.activa !== false &&
        m.estado === 'libre' &&
        (salonSeleccionado ? m.salonId === salonSeleccionado : true)
    );
  }, [mesas, mesaActual, salonSeleccionado]);

  // Calcular total de líneas seleccionadas
  const totalSeleccionado = useMemo(() => {
    let total = 0;
    lineasSeleccionadas.forEach((id) => {
      const linea = lineas.find((l) => l.id === id);
      if (linea) {
        const cantidadAMover = cantidadesAMover[id] || linea.cantidad;
        total += (linea.precioUnitario * cantidadAMover) - (linea.descuento * cantidadAMover / linea.cantidad);
      }
    });
    return total;
  }, [lineasSeleccionadas, lineas, cantidadesAMover]);

  // Toggle selección de línea
  const toggleLinea = (lineaId: string) => {
    const newSet = new Set(lineasSeleccionadas);
    if (newSet.has(lineaId)) {
      newSet.delete(lineaId);
      const newCantidades = { ...cantidadesAMover };
      delete newCantidades[lineaId];
      setCantidadesAMover(newCantidades);
    } else {
      newSet.add(lineaId);
      const linea = lineas.find((l) => l.id === lineaId);
      if (linea) {
        setCantidadesAMover((prev) => ({ ...prev, [lineaId]: linea.cantidad }));
      }
    }
    setLineasSeleccionadas(newSet);
  };

  // Cambiar cantidad a mover
  const cambiarCantidad = (lineaId: string, cantidad: number) => {
    const linea = lineas.find((l) => l.id === lineaId);
    if (linea) {
      const cantidadValida = Math.max(1, Math.min(cantidad, linea.cantidad));
      setCantidadesAMover((prev) => ({ ...prev, [lineaId]: cantidadValida }));
    }
  };

  // Seleccionar todas las líneas
  const seleccionarTodas = () => {
    const allIds = new Set(lineas.map((l) => l.id));
    setLineasSeleccionadas(allIds);
    const cantidades: Record<string, number> = {};
    lineas.forEach((l) => {
      cantidades[l.id] = l.cantidad;
    });
    setCantidadesAMover(cantidades);
  };

  // Deseleccionar todas
  const deseleccionarTodas = () => {
    setLineasSeleccionadas(new Set());
    setCantidadesAMover({});
  };

  // Continuar a selección de mesa
  const continuarAMesa = () => {
    if (lineasSeleccionadas.size === 0) return;
    setModo('mesa');
  };

  // Volver a selección de líneas
  const volverALineas = () => {
    setModo('seleccionar');
    setMesaDestino(null);
  };

  // Confirmar división
  const confirmarDivision = () => {
    if (!mesaDestino || lineasSeleccionadas.size === 0) return;

    // Crear las líneas a mover con las cantidades correctas
    const lineasParaMover: LineaVentaLocal[] = [];
    lineasSeleccionadas.forEach((id) => {
      const linea = lineas.find((l) => l.id === id);
      if (linea) {
        const cantidadAMover = cantidadesAMover[id] || linea.cantidad;
        lineasParaMover.push({
          ...linea,
          id: `${linea.id}-split-${Date.now()}`, // Nuevo ID para la línea dividida
          cantidad: cantidadAMover,
          total: (linea.precioUnitario * cantidadAMover) - (linea.descuento * cantidadAMover / linea.cantidad),
        });
      }
    });

    onDividir(lineasParaMover, mesaDestino);
    handleClose();
  };

  // Cerrar y resetear
  const handleClose = () => {
    setModo('seleccionar');
    setLineasSeleccionadas(new Set());
    setCantidadesAMover({});
    setMesaDestino(null);
    setSalonSeleccionado(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Split className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Dividir Mesa</h2>
              <p className="text-sm text-gray-500">
                {mesaActual ? `Mesa ${mesaActual.numero}` : 'Sin mesa'}
                {modo === 'seleccionar' ? ' - Selecciona productos' : ' - Elige mesa destino'}
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
          {modo === 'seleccionar' ? (
            /* Selección de líneas */
            <div className="space-y-4">
              {/* Acciones rápidas */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={seleccionarTodas}
                >
                  Seleccionar todo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deseleccionarTodas}
                >
                  Deseleccionar
                </Button>
              </div>

              {/* Lista de líneas */}
              <div className="space-y-2">
                {lineas.map((linea) => {
                  const isSelected = lineasSeleccionadas.has(linea.id);
                  const cantidadAMover = cantidadesAMover[linea.id] || linea.cantidad;

                  return (
                    <div
                      key={linea.id}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleLinea(linea.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox visual */}
                        <div
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>

                        {/* Info del producto */}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{linea.nombre}</p>
                          <p className="text-sm text-gray-500">
                            {linea.precioUnitario.toFixed(2)} x {linea.cantidad}
                          </p>
                        </div>

                        {/* Cantidad a mover (si está seleccionada y tiene más de 1) */}
                        {isSelected && linea.cantidad > 1 && (
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs text-gray-500">Mover:</span>
                            <input
                              type="number"
                              min={1}
                              max={linea.cantidad}
                              value={cantidadAMover}
                              onChange={(e) => cambiarCantidad(linea.id, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 border rounded text-center text-sm"
                            />
                            <span className="text-xs text-gray-500">/ {linea.cantidad}</span>
                          </div>
                        )}

                        {/* Total */}
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {linea.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {lineas.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay productos para dividir</p>
                </div>
              )}
            </div>
          ) : (
            /* Selección de mesa destino */
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

              {/* Grid de mesas */}
              <div className="grid grid-cols-4 gap-3">
                {mesasDisponibles.map((mesa) => (
                  <button
                    key={mesa._id}
                    onClick={() => setMesaDestino(mesa)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      mesaDestino?._id === mesa._id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-2xl font-bold text-gray-900">{mesa.numero}</p>
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" />
                      {mesa.capacidad}
                    </p>
                  </button>
                ))}
              </div>

              {mesasDisponibles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay mesas libres disponibles</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            {/* Resumen */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="w-4 h-4" />
                <span>{lineasSeleccionadas.size} productos</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Calculator className="w-4 h-4" />
                <span>{totalSeleccionado.toFixed(2)}</span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              {modo === 'mesa' && (
                <Button variant="secondary" onClick={volverALineas}>
                  Volver
                </Button>
              )}
              <Button variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
              {modo === 'seleccionar' ? (
                <Button
                  variant="primary"
                  onClick={continuarAMesa}
                  disabled={lineasSeleccionadas.size === 0}
                >
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={confirmarDivision}
                  disabled={!mesaDestino}
                >
                  <Split className="w-4 h-4 mr-1" />
                  Dividir
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
