'use client';

import { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, Settings2 } from 'lucide-react';
import type { Producto, Modificador } from '@/stores/dataStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    modificadores: Array<{ modificador: Modificador; cantidad: number }>,
    comentario?: string
  ) => void;
  producto: Producto;
  modificadores: Modificador[];
  allowComments?: boolean;
}

/**
 * Modal para seleccionar modificadores del producto
 */
export function ModificadoresModal({
  isOpen,
  onClose,
  onConfirm,
  producto,
  modificadores,
  allowComments = true,
}: Props) {
  // Estado de seleccion
  const [seleccion, setSeleccion] = useState<Map<string, number>>(new Map());
  const [comentario, setComentario] = useState('');

  // Agrupar modificadores por grupo
  const modificadoresPorGrupo = useMemo(() => {
    const grupos = new Map<string, { nombre: string; color?: string; modificadores: Modificador[] }>();
    const sinGrupo: Modificador[] = [];

    modificadores.forEach((mod) => {
      if (mod.grupoId && typeof mod.grupoId === 'object') {
        const grupoId = mod.grupoId._id;
        if (!grupos.has(grupoId)) {
          grupos.set(grupoId, {
            nombre: mod.grupoId.nombre,
            color: mod.grupoId.color,
            modificadores: [],
          });
        }
        grupos.get(grupoId)!.modificadores.push(mod);
      } else {
        sinGrupo.push(mod);
      }
    });

    return { grupos, sinGrupo };
  }, [modificadores]);

  if (!isOpen) return null;

  // Calcular precio extra
  const calcularPrecioExtra = () => {
    let total = 0;
    seleccion.forEach((cantidad, modId) => {
      const mod = modificadores.find((m) => m._id === modId);
      if (mod && cantidad > 0) {
        if (mod.tipo === 'cargo') {
          total += mod.precioExtra * cantidad;
        } else if (mod.tipo === 'descuento') {
          total -= mod.precioExtra * cantidad;
        }
      }
    });
    return total;
  };

  // Toggle modificador simple
  const toggleModificador = (mod: Modificador) => {
    setSeleccion((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(mod._id)) {
        newMap.delete(mod._id);
      } else {
        newMap.set(mod._id, 1);
      }
      return newMap;
    });
  };

  // Incrementar/decrementar
  const incrementar = (mod: Modificador) => {
    setSeleccion((prev) => {
      const newMap = new Map(prev);
      const actual = newMap.get(mod._id) || 0;
      const max = mod.cantidadMaxima || 10;
      if (actual < max) {
        newMap.set(mod._id, actual + 1);
      }
      return newMap;
    });
  };

  const decrementar = (mod: Modificador) => {
    setSeleccion((prev) => {
      const newMap = new Map(prev);
      const actual = newMap.get(mod._id) || 0;
      if (actual > 1) {
        newMap.set(mod._id, actual - 1);
      } else {
        newMap.delete(mod._id);
      }
      return newMap;
    });
  };

  // Confirmar
  const handleConfirmar = () => {
    const modificadoresSeleccionados: Array<{ modificador: Modificador; cantidad: number }> = [];
    seleccion.forEach((cantidad, modId) => {
      const mod = modificadores.find((m) => m._id === modId);
      if (mod && cantidad > 0) {
        modificadoresSeleccionados.push({ modificador: mod, cantidad });
      }
    });
    onConfirm(modificadoresSeleccionados, comentario || undefined);
  };

  // Omitir (sin modificadores)
  const handleOmitir = () => {
    onConfirm([], comentario || undefined);
  };

  const precioExtra = calcularPrecioExtra();
  const haySeleccion = seleccion.size > 0;

  // Renderizar modificador
  const renderModificador = (mod: Modificador) => {
    const estaSeleccionado = seleccion.has(mod._id);
    const cantidad = seleccion.get(mod._id) || 0;

    return (
      <div
        key={mod._id}
        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
          estaSeleccionado
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-3">
          {mod.color && (
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mod.color }} />
          )}
          <div>
            <span className="font-medium text-gray-800">{mod.nombre}</span>
            {mod.tipo !== 'gratis' && mod.precioExtra > 0 && (
              <span className={`ml-2 text-sm ${mod.tipo === 'cargo' ? 'text-orange-600' : 'text-green-600'}`}>
                {mod.tipo === 'cargo' ? '+' : '-'}{mod.precioExtra.toFixed(2)} €
              </span>
            )}
          </div>
        </div>

        {mod.esMultiple ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => decrementar(mod)}
              disabled={cantidad === 0}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="w-8 text-center font-semibold text-lg">{cantidad}</span>
            <button
              onClick={() => incrementar(mod)}
              disabled={cantidad >= (mod.cantidadMaxima || 10)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => toggleModificador(mod)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all ${
              estaSeleccionado
                ? 'border-primary bg-primary text-white'
                : 'border-gray-300 bg-white'
            }`}
          >
            {estaSeleccionado && <Check className="w-6 h-6" />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings2 className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{producto.nombre}</h3>
              <p className="text-sm text-gray-500">Personaliza tu producto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Grupos */}
          {Array.from(modificadoresPorGrupo.grupos.entries()).map(([grupoId, grupo]) => (
            <div key={grupoId}>
              <div className="flex items-center gap-2 mb-3">
                {grupo.color && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: grupo.color }} />
                )}
                <h4 className="font-semibold text-gray-700">{grupo.nombre}</h4>
              </div>
              <div className="space-y-2">
                {grupo.modificadores.map(renderModificador)}
              </div>
            </div>
          ))}

          {/* Sin grupo */}
          {modificadoresPorGrupo.sinGrupo.length > 0 && (
            <div>
              {modificadoresPorGrupo.grupos.size > 0 && (
                <h4 className="font-semibold text-gray-700 mb-3">Otros</h4>
              )}
              <div className="space-y-2">
                {modificadoresPorGrupo.sinGrupo.map(renderModificador)}
              </div>
            </div>
          )}

          {/* Comentario */}
          {allowComments && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios especiales
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Ej: Sin cebolla, poco hecho..."
                className="w-full p-3 border border-gray-300 rounded-xl resize-none h-24 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Precio extra */}
        {precioExtra !== 0 && (
          <div className="px-6 py-3 bg-primary/5 border-t border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Precio extra:</span>
              <span className={`font-bold ${precioExtra > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {precioExtra > 0 ? '+' : ''}{precioExtra.toFixed(2)} €
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={handleOmitir}
            className="flex-1 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
          >
            Sin modificar
          </button>
          <button
            onClick={handleConfirmar}
            className="flex-1 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            {haySeleccion
              ? `Agregar ${precioExtra !== 0 ? `(${precioExtra > 0 ? '+' : ''}${precioExtra.toFixed(2)} €)` : ''}`
              : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}
