'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Settings2, Check, Plus, Minus } from 'lucide-react';
import type { Producto, Modificador } from '../../stores/dataStore';

// Modificador seleccionado con cantidad
export interface ModificadorSeleccionado {
  modificador: Modificador;
  cantidad: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: (modificadores: ModificadorSeleccionado[]) => void;
  producto: Producto | null;
  modificadoresDisponibles: Modificador[];
}

export function ModificadoresModal({
  isOpen,
  onClose,
  onConfirmar,
  producto,
  modificadoresDisponibles,
}: Props) {
  // Estado de selección de modificadores con cantidad
  const [seleccion, setSeleccion] = useState<Map<string, number>>(new Map());

  // Reset selección cuando cambia el producto
  useEffect(() => {
    if (producto && isOpen) {
      setSeleccion(new Map());
    }
  }, [producto, isOpen]);

  // Agrupar modificadores por grupo
  const modificadoresPorGrupo = useMemo(() => {
    const grupos = new Map<string, { nombre: string; color?: string; modificadores: Modificador[] }>();
    const sinGrupo: Modificador[] = [];

    modificadoresDisponibles.forEach((mod) => {
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
  }, [modificadoresDisponibles]);

  // Early return DESPUÉS de todos los hooks
  if (!isOpen || !producto) return null;

  // Calcular precio extra total
  const calcularPrecioExtra = () => {
    let total = 0;
    seleccion.forEach((cantidad, modId) => {
      const mod = modificadoresDisponibles.find((m) => m._id === modId);
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

  // Incrementar cantidad de modificador múltiple
  const incrementarModificador = (mod: Modificador) => {
    setSeleccion((prev) => {
      const newMap = new Map(prev);
      const cantidadActual = newMap.get(mod._id) || 0;
      const maxCantidad = mod.cantidadMaxima || 10;
      if (cantidadActual < maxCantidad) {
        newMap.set(mod._id, cantidadActual + 1);
      }
      return newMap;
    });
  };

  // Decrementar cantidad de modificador múltiple
  const decrementarModificador = (mod: Modificador) => {
    setSeleccion((prev) => {
      const newMap = new Map(prev);
      const cantidadActual = newMap.get(mod._id) || 0;
      if (cantidadActual > 1) {
        newMap.set(mod._id, cantidadActual - 1);
      } else {
        newMap.delete(mod._id);
      }
      return newMap;
    });
  };

  const handleConfirmar = () => {
    const modificadoresSeleccionados: ModificadorSeleccionado[] = [];
    seleccion.forEach((cantidad, modId) => {
      const mod = modificadoresDisponibles.find((m) => m._id === modId);
      if (mod && cantidad > 0) {
        modificadoresSeleccionados.push({ modificador: mod, cantidad });
      }
    });
    onConfirmar(modificadoresSeleccionados);
    onClose();
  };

  // Omitir modificadores (sin selección)
  const handleOmitir = () => {
    onConfirmar([]);
    onClose();
  };

  const precioExtra = calcularPrecioExtra();
  const haySeleccion = seleccion.size > 0;

  // Renderizar un modificador
  const renderModificador = (mod: Modificador) => {
    const estaSeleccionado = seleccion.has(mod._id);
    const cantidad = seleccion.get(mod._id) || 0;

    return (
      <div
        key={mod._id}
        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
          estaSeleccionado
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Color indicator */}
          {mod.color && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: mod.color }}
            />
          )}
          <div>
            <span className="font-medium text-gray-800">{mod.nombre}</span>
            {mod.tipo !== 'gratis' && mod.precioExtra > 0 && (
              <span className={`ml-2 text-sm ${mod.tipo === 'cargo' ? 'text-orange-600' : 'text-green-600'}`}>
                {mod.tipo === 'cargo' ? '+' : '-'}{mod.precioExtra.toFixed(2)} EUR
              </span>
            )}
          </div>
        </div>

        {/* Controles de selección */}
        {mod.esMultiple ? (
          // Modificador múltiple con cantidad
          <div className="flex items-center gap-2">
            <button
              onClick={() => decrementarModificador(mod)}
              disabled={cantidad === 0}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-semibold">{cantidad}</span>
            <button
              onClick={() => incrementarModificador(mod)}
              disabled={cantidad >= (mod.cantidadMaxima || 10)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // Modificador simple con checkbox
          <button
            onClick={() => toggleModificador(mod)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border-2 transition-all ${
              estaSeleccionado
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            {estaSeleccionado && <Check className="w-5 h-5" />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-800 truncate max-w-[280px]">
                {producto.nombre}
              </h3>
              <p className="text-xs text-gray-500">Selecciona modificadores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Modificadores por grupo */}
          {Array.from(modificadoresPorGrupo.grupos.entries()).map(([grupoId, grupo]) => (
            <div key={grupoId}>
              <div className="flex items-center gap-2 mb-2">
                {grupo.color && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: grupo.color }}
                  />
                )}
                <label className="text-sm font-medium text-gray-700">
                  {grupo.nombre}
                </label>
              </div>
              <div className="space-y-2">
                {grupo.modificadores.map(renderModificador)}
              </div>
            </div>
          ))}

          {/* Modificadores sin grupo */}
          {modificadoresPorGrupo.sinGrupo.length > 0 && (
            <div>
              {modificadoresPorGrupo.grupos.size > 0 && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Otros
                </label>
              )}
              <div className="space-y-2">
                {modificadoresPorGrupo.sinGrupo.map(renderModificador)}
              </div>
            </div>
          )}
        </div>

        {/* Info de precio extra */}
        {precioExtra !== 0 && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Precio extra:</span>
              <span className={`font-bold ${precioExtra > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {precioExtra > 0 ? '+' : ''}{precioExtra.toFixed(2)} EUR
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <button
            onClick={handleOmitir}
            className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
          >
            Sin modificadores
          </button>
          <button
            onClick={handleConfirmar}
            className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
          >
            {haySeleccion
              ? `Confirmar${precioExtra !== 0 ? ` (${precioExtra > 0 ? '+' : ''}${precioExtra.toFixed(2)})` : ''}`
              : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
