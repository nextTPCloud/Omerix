'use client';

import { useState, useEffect } from 'react';
import { useComanderoStore } from '../../stores/comanderoStore';
import { tpvApi } from '../../services/api';

interface ComandaCocina {
  _id: string;
  mesaId: string;
  mesaNumero?: string;
  estado: 'pendiente' | 'en_preparacion' | 'lista' | 'entregada';
  lineas: Array<{
    productoNombre: string;
    cantidad: number;
    notas?: string;
  }>;
  createdAt: string;
}

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-600' },
  en_preparacion: { label: 'Preparando', color: 'bg-blue-600' },
  lista: { label: 'Lista', color: 'bg-green-600' },
  entregada: { label: 'Entregada', color: 'bg-gray-600' },
};

export default function EstadoCocinaView() {
  const { mesas, camarero } = useComanderoStore();
  const [comandas, setComandas] = useState<ComandaCocina[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarComandas = async () => {
    try {
      const creds = tpvApi.getCredentials();
      if (!creds) return;

      // Obtener comandas de las mesas asignadas
      const mesaIds = mesas.map((m: any) => m._id);
      if (mesaIds.length === 0) return;

      // Usamos el endpoint general de comandas de cocina via TPV
      const res = await tpvApi.post<any>('/tpv/restauracion/comandas/estado', {
        empresaId: creds.empresaId,
        tpvId: creds.tpvId,
        tpvSecret: creds.tpvSecret,
        mesaIds,
      }, { useLocal: false });

      if (res.ok) {
        setComandas(res.data || []);
      }
    } catch (error) {
      console.error('Error cargando comandas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarComandas();
    const interval = setInterval(cargarComandas, 10000); // Refrescar cada 10s
    return () => clearInterval(interval);
  }, [mesas]);

  const formatTiempo = (fecha: string) => {
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const comandasActivas = comandas.filter(c => c.estado !== 'entregada');

  return (
    <div className="flex flex-col h-full p-2 sm:p-3">
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
        <h2 className="text-base sm:text-lg font-bold">Estado Cocina</h2>
        <button
          onClick={cargarComandas}
          className="px-2 sm:px-3 py-1 rounded-lg bg-gray-700 text-xs sm:text-sm"
        >
          Actualizar
        </button>
      </div>

      {comandasActivas.length === 0 ? (
        <div className="text-center text-gray-500 mt-12">
          <p className="text-base sm:text-lg">Sin comandas pendientes</p>
          <p className="text-xs sm:text-sm mt-1">Las comandas apareceran aqui</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 overflow-y-auto">
          {comandasActivas.map(comanda => {
            const mesa = mesas.find((m: any) => m._id === comanda.mesaId);
            const estadoInfo = ESTADO_LABEL[comanda.estado] || ESTADO_LABEL.pendiente;

            return (
              <div key={comanda._id} className="bg-gray-800 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base">
                      Mesa {mesa?.numero || mesa?.nombre || comanda.mesaNumero || '?'}
                    </span>
                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${estadoInfo.color}`}>
                      {estadoInfo.label}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    {formatTiempo(comanda.createdAt)}
                  </span>
                </div>
                <div className="space-y-1">
                  {comanda.lineas.map((linea, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                      <span className="font-medium text-blue-400">{linea.cantidad}x</span>
                      <span className="truncate">{linea.productoNombre}</span>
                      {linea.notas && (
                        <span className="text-yellow-400 text-[10px] sm:text-xs truncate">({linea.notas})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
