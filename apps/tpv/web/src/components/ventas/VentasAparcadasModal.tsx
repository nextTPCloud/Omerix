'use client';

import { X, ShoppingCart, Clock, User, Trash2, ArrowRight } from 'lucide-react';
import { useVentasAparcadasStore } from '../../stores/ventasAparcadasStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRecuperar: (venta: {
    lineas: Array<{
      id: string;
      productoId: string;
      varianteId?: string;
      codigo: string;
      nombre: string;
      cantidad: number;
      precioUnitario: number;
      descuento: number;
      total: number;
    }>;
    clienteId?: string;
    clienteNombre?: string;
  }) => void;
}

export function VentasAparcadasModal({ isOpen, onClose, onRecuperar }: Props) {
  const ventas = useVentasAparcadasStore((state) => state.ventas);
  const recuperarVenta = useVentasAparcadasStore((state) => state.recuperarVenta);
  const eliminarVenta = useVentasAparcadasStore((state) => state.eliminarVenta);

  if (!isOpen) return null;

  const handleRecuperar = (id: string) => {
    const venta = recuperarVenta(id);
    if (venta) {
      onRecuperar({
        lineas: venta.lineas,
        clienteId: venta.clienteId,
        clienteNombre: venta.clienteNombre,
      });
      onClose();
    }
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Eliminar esta venta aparcada?')) {
      eliminarVenta(id);
    }
  };

  const formatFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    const hoy = new Date();
    const esHoy = fecha.toDateString() === hoy.toDateString();

    if (esHoy) {
      return `Hoy ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">
              Ventas Aparcadas ({ventas.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de ventas */}
        <div className="flex-1 overflow-y-auto p-2">
          {ventas.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-2" />
              <p>No hay ventas aparcadas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ventas.map((venta) => (
                <div
                  key={venta.id}
                  className="bg-gray-50 rounded-xl p-3 border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  {/* Cabecera de venta */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{formatFecha(venta.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      <span>{venta.usuarioNombre}</span>
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="text-sm text-gray-700 mb-2">
                    {venta.lineas.slice(0, 3).map((linea, idx) => (
                      <div key={idx} className="truncate">
                        {linea.cantidad}x {linea.nombre}
                      </div>
                    ))}
                    {venta.lineas.length > 3 && (
                      <div className="text-gray-400">
                        +{venta.lineas.length - 3} productos más
                      </div>
                    )}
                  </div>

                  {/* Nota si existe */}
                  {venta.nota && (
                    <div className="text-xs text-gray-500 italic mb-2 truncate">
                      Nota: {venta.nota}
                    </div>
                  )}

                  {/* Total y acciones */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="text-lg font-bold text-blue-600">
                      {venta.total.toFixed(2)} EUR
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEliminar(venta.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRecuperar(venta.id)}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        Recuperar
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
