'use client';

import { useEffect } from 'react';
import { X, Zap, Clock, User, Trash2, ArrowRight } from 'lucide-react';
import { usePedidosRapidosStore } from '../../stores/pedidosRapidosStore';
import { useDataStore } from '../../stores/dataStore';
import { v4 as uuidv4 } from 'uuid';

// Tipo de línea de venta local del TPV (page.tsx)
interface LineaVenta {
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRecuperar: (pedido: { lineas: LineaVenta[] }) => void;
}

const TIPO_COLORES: Record<string, { bg: string; text: string; label: string }> = {
  barra: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'BARRA' },
  llevar: { bg: 'bg-green-100', text: 'text-green-700', label: 'LLEVAR' },
  recoger: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'RECOGER' },
};

export function PedidosRapidosModal({ isOpen, onClose, onRecuperar }: Props) {
  const pedidos = usePedidosRapidosStore((state) => state.pedidos);
  const recuperarPedido = usePedidosRapidosStore((state) => state.recuperarPedido);
  const eliminarPedido = usePedidosRapidosStore((state) => state.eliminarPedido);
  const marcarTodosLeidos = usePedidosRapidosStore((state) => state.marcarTodosLeidos);

  // Al abrir el modal, marcar todos como leídos
  useEffect(() => {
    if (isOpen && pedidos.some((p) => !p.leido)) {
      marcarTodosLeidos();
    }
  }, [isOpen, pedidos, marcarTodosLeidos]);

  if (!isOpen) return null;

  const handleRecuperar = (id: string) => {
    const pedido = recuperarPedido(id);
    if (pedido) {
      // Convertir líneas del pedido a formato LineaVenta
      const { productos, calcularPrecioProducto, obtenerTipoImpuesto } = useDataStore.getState();

      const lineasVenta: LineaVenta[] = pedido.lineas.map((l) => {
        const prod = productos.find((p) => p._id === l.productoId);
        const precio = prod ? calcularPrecioProducto(prod) : 0;
        let tipoIva = 21;
        if (prod?.tipoImpuestoId) {
          const tipoImpuesto = obtenerTipoImpuesto(prod.tipoImpuestoId);
          if (tipoImpuesto) tipoIva = tipoImpuesto.porcentaje ?? 21;
        }
        const total = precio * l.cantidad;
        return {
          id: uuidv4(),
          productoId: l.productoId,
          codigo: prod?.codigo || '',
          nombre: l.nombre,
          cantidad: l.cantidad,
          precioUnitario: precio,
          descuento: 0,
          total,
          iva: tipoIva,
        };
      });

      onRecuperar({ lineas: lineasVenta });
      onClose();
    }
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Eliminar este pedido rápido?')) {
      eliminarPedido(id);
    }
  };

  const formatFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    const hoy = new Date();
    const esHoy = fecha.toDateString() === hoy.toDateString();

    if (esHoy) {
      return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
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
            <Zap className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-800">
              Pedidos Rápidos ({pedidos.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de pedidos */}
        <div className="flex-1 overflow-y-auto p-2">
          {pedidos.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <Zap className="w-12 h-12 mb-2" />
              <p>No hay pedidos rápidos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pedidos.map((pedido) => {
                const tipo = TIPO_COLORES[pedido.tipoServicio] || TIPO_COLORES.barra;
                return (
                  <div
                    key={pedido.id}
                    className={`bg-gray-50 rounded-xl p-3 border transition-colors ${
                      pedido.leido ? 'border-gray-200' : 'border-emerald-300 bg-emerald-50'
                    }`}
                  >
                    {/* Cabecera del pedido */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tipo.bg} ${tipo.text}`}>
                          {tipo.label}
                        </span>
                        {!pedido.leido && (
                          <span className="w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatFecha(pedido.fecha)}
                        </span>
                        {pedido.camareroNombre && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {pedido.camareroNombre}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Productos */}
                    <div className="text-sm text-gray-700 mb-2">
                      {pedido.lineas.slice(0, 4).map((linea, idx) => (
                        <div key={idx} className="truncate">
                          {linea.cantidad}x {linea.nombre}
                        </div>
                      ))}
                      {pedido.lineas.length > 4 && (
                        <div className="text-gray-400">
                          +{pedido.lineas.length - 4} productos más
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleEliminar(pedido.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRecuperar(pedido.id)}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        Recuperar
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
