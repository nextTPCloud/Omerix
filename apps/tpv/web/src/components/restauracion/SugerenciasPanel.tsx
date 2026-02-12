'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, X, Plus, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { useRestauracionStore } from '@/stores/restauracionStore';
import { Sugerencia, restauracionService } from '@/services/restauracion.service';

interface SugerenciasPanelProps {
  productoId: string | null;
  onAgregarProducto: (productoId: string, nombre: string, precio: number) => void;
  visible?: boolean;
}

export function SugerenciasPanel({
  productoId,
  onAgregarProducto,
  visible = true,
}: SugerenciasPanelProps) {
  const { sugerenciasActuales, cargarSugerencias, limpiarSugerencias } = useRestauracionStore();
  const [minimizado, setMinimizado] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Cargar sugerencias cuando cambia el producto
  useEffect(() => {
    if (productoId && visible) {
      setCargando(true);
      cargarSugerencias(productoId).finally(() => setCargando(false));
    } else {
      limpiarSugerencias();
    }
  }, [productoId, visible, cargarSugerencias, limpiarSugerencias]);

  const handleAgregar = async (sugerencia: Sugerencia) => {
    // Registrar aceptación
    restauracionService.aceptarSugerencia(sugerencia._id);

    // Agregar producto
    onAgregarProducto(
      sugerencia.productoSugeridoId,
      sugerencia.productoSugeridoNombre,
      sugerencia.productoSugeridoPrecio
    );
  };

  const getTipoLabel = (tipo: Sugerencia['tipo']) => {
    const labels: Record<Sugerencia['tipo'], string> = {
      complementario: 'Complemento',
      upgrade: 'Mejora',
      alternativa: 'Alternativa',
      acompanamiento: 'Acompañamiento',
      postre: 'Postre',
      bebida: 'Bebida',
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: Sugerencia['tipo']) => {
    const colores: Record<Sugerencia['tipo'], string> = {
      complementario: 'bg-blue-100 text-blue-700',
      upgrade: 'bg-purple-100 text-purple-700',
      alternativa: 'bg-gray-100 text-gray-700',
      acompanamiento: 'bg-green-100 text-green-700',
      postre: 'bg-pink-100 text-pink-700',
      bebida: 'bg-cyan-100 text-cyan-700',
    };
    return colores[tipo] || 'bg-gray-100 text-gray-700';
  };

  // No mostrar si no hay sugerencias y no está cargando
  if (!visible || (sugerenciasActuales.length === 0 && !cargando)) {
    return null;
  }

  return (
    <div
      className={`
        fixed bottom-20 right-4 z-40 w-80 bg-white rounded-xl shadow-lg border border-amber-200
        transition-all duration-300 ease-in-out
        ${minimizado ? 'h-12' : 'max-h-80'}
      `}
    >
      {/* Header */}
      <button
        onClick={() => setMinimizado(!minimizado)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-t-xl border-b border-amber-200"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="font-medium text-amber-800">Sugerencias</span>
          {sugerenciasActuales.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
              {sugerenciasActuales.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {minimizado ? (
            <ChevronUp className="w-4 h-4 text-amber-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-600" />
          )}
        </div>
      </button>

      {/* Contenido */}
      {!minimizado && (
        <div className="overflow-y-auto max-h-64 p-2">
          {cargando ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse flex items-center gap-2 text-amber-600">
                <Lightbulb className="w-5 h-5" />
                <span className="text-sm">Cargando sugerencias...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {sugerenciasActuales.map((sugerencia) => (
                <div
                  key={sugerencia._id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-amber-50 transition-colors group"
                >
                  {/* Info del producto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getTipoColor(sugerencia.tipo)}`}>
                        {getTipoLabel(sugerencia.tipo)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {sugerencia.productoSugeridoNombre}
                    </p>
                    {sugerencia.mensaje && (
                      <p className="text-xs text-gray-500 truncate">{sugerencia.mensaje}</p>
                    )}
                  </div>

                  {/* Precio y botón */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary-600">
                      {sugerencia.productoSugeridoPrecio.toFixed(2)} €
                    </span>
                    <button
                      onClick={() => handleAgregar(sugerencia)}
                      className="w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center transition-colors opacity-70 group-hover:opacity-100"
                      title="Añadir a la venta"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
