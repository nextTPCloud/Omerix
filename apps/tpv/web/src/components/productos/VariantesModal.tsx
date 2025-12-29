'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Package, Check } from 'lucide-react';
import type { Producto, Variante, Atributo } from '../../stores/dataStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSeleccionar: (variante: Variante, producto: Producto) => void;
  producto: Producto | null;
  almacenId?: string;
}

export function VariantesModal({ isOpen, onClose, onSeleccionar, producto, almacenId }: Props) {
  // Estado de selección por atributo
  const [seleccion, setSeleccion] = useState<Record<string, string>>({});

  // Obtener atributos y variantes de forma segura
  const atributos = producto?.atributos || [];
  const variantes = producto?.variantes || [];

  // Reset selección cuando cambia el producto
  useEffect(() => {
    if (producto && isOpen) {
      setSeleccion({});
    }
  }, [producto, isOpen]);

  // Buscar variante que coincida con la selección actual
  const varianteSeleccionada = useMemo(() => {
    if (!producto || Object.keys(seleccion).length !== atributos.length) return null;

    return variantes.find((v) => {
      return atributos.every((attr) =>
        v.combinacion[attr.nombre.toLowerCase()] === seleccion[attr.nombre]
      );
    }) || null;
  }, [producto, seleccion, atributos, variantes]);

  // Obtener valores disponibles para cada atributo (basado en variantes activas)
  const valoresDisponibles = useMemo(() => {
    const disponibles: Record<string, Set<string>> = {};

    atributos.forEach((attr) => {
      disponibles[attr.nombre] = new Set();
    });

    variantes.forEach((v) => {
      if (!v.activo) return;

      // Verificar si esta variante es compatible con la selección actual
      let compatible = true;
      for (const attrNombre of Object.keys(seleccion)) {
        const valorSeleccionado = seleccion[attrNombre];
        const valorVariante = v.combinacion[attrNombre.toLowerCase()];
        if (valorVariante !== valorSeleccionado) {
          compatible = false;
          break;
        }
      }

      if (compatible) {
        atributos.forEach((attr) => {
          const valor = v.combinacion[attr.nombre.toLowerCase()];
          if (valor) {
            disponibles[attr.nombre].add(valor);
          }
        });
      }
    });

    return disponibles;
  }, [atributos, variantes, seleccion]);

  // Early return DESPUÉS de todos los hooks
  if (!isOpen || !producto) return null;

  // Obtener stock de una variante
  const getStockVariante = (variante: Variante) => {
    if (!variante.stockPorAlmacen || variante.stockPorAlmacen.length === 0) return 0;

    if (almacenId) {
      const stockAlmacen = variante.stockPorAlmacen.find((s) => s.almacenId === almacenId);
      return stockAlmacen?.cantidad || 0;
    }

    // Si no hay almacén específico, sumar todos
    return variante.stockPorAlmacen.reduce((sum, s) => sum + s.cantidad, 0);
  };

  // Obtener precio de la variante
  const getPrecioVariante = (variante: Variante) => {
    if (variante.precios.usarPrecioBase) {
      return producto.precios?.venta ?? producto.precios?.pvp ?? producto.precioVenta ?? 0;
    }
    return variante.precios.venta ?? variante.precios.pvp ?? 0;
  };

  const handleSeleccionarAtributo = (atributo: string, valor: string) => {
    setSeleccion((prev) => ({
      ...prev,
      [atributo]: valor,
    }));
  };

  const handleConfirmar = () => {
    if (varianteSeleccionada) {
      onSeleccionar(varianteSeleccionada, producto);
      onClose();
    }
  };

  const seleccionCompleta = Object.keys(seleccion).length === atributos.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-800 truncate max-w-[280px]">
                {producto.nombre}
              </h3>
              <p className="text-xs text-gray-500">Selecciona las opciones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Atributos */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {atributos.map((atributo) => (
            <div key={atributo.nombre}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {atributo.nombre}
                {atributo.obligatorio && <span className="text-red-500 ml-1">*</span>}
              </label>

              {atributo.tipoVisualizacion === 'colores' ? (
                // Vista de colores
                <div className="flex flex-wrap gap-2">
                  {atributo.valores
                    .filter((v) => v.activo && valoresDisponibles[atributo.nombre]?.has(v.valor))
                    .map((valor) => (
                      <button
                        key={valor.valor}
                        onClick={() => handleSeleccionarAtributo(atributo.nombre, valor.valor)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                          seleccion[atributo.nombre] === valor.valor
                            ? 'border-blue-600 ring-2 ring-blue-200'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: valor.hexColor || '#ccc' }}
                        title={valor.valor}
                      >
                        {seleccion[atributo.nombre] === valor.valor && (
                          <Check className="w-5 h-5 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                </div>
              ) : atributo.tipoVisualizacion === 'dropdown' ? (
                // Vista dropdown
                <select
                  value={seleccion[atributo.nombre] || ''}
                  onChange={(e) => handleSeleccionarAtributo(atributo.nombre, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  {atributo.valores
                    .filter((v) => v.activo && valoresDisponibles[atributo.nombre]?.has(v.valor))
                    .map((valor) => (
                      <option key={valor.valor} value={valor.valor}>
                        {valor.valor}
                      </option>
                    ))}
                </select>
              ) : (
                // Vista botones (default)
                <div className="flex flex-wrap gap-2">
                  {atributo.valores
                    .filter((v) => v.activo && valoresDisponibles[atributo.nombre]?.has(v.valor))
                    .map((valor) => (
                      <button
                        key={valor.valor}
                        onClick={() => handleSeleccionarAtributo(atributo.nombre, valor.valor)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          seleccion[atributo.nombre] === valor.valor
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white hover:border-gray-400 text-gray-700'
                        }`}
                      >
                        {valor.valor}
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}

          {/* Info de variante seleccionada */}
          {varianteSeleccionada && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">SKU: {varianteSeleccionada.sku}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {getStockVariante(varianteSeleccionada)} uds
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {getPrecioVariante(varianteSeleccionada).toFixed(2)} EUR
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleConfirmar}
            disabled={!seleccionCompleta || !varianteSeleccionada}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {seleccionCompleta && varianteSeleccionada
              ? `Añadir - ${getPrecioVariante(varianteSeleccionada).toFixed(2)} EUR`
              : 'Selecciona todas las opciones'}
          </button>
        </div>
      </div>
    </div>
  );
}
