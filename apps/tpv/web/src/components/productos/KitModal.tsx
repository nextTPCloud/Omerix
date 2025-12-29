'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Package, Check, Plus, Minus, Layers } from 'lucide-react';
import type { Producto, ComponenteKit } from '../../stores/dataStore';

interface ComponenteConProducto extends ComponenteKit {
  producto?: Producto;
  seleccionado: boolean;
  cantidadSeleccionada: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: (componentes: ComponenteConProducto[], precioTotal: number) => void;
  producto: Producto | null;
  productos: Producto[]; // Lista de todos los productos para buscar componentes
}

export function KitModal({ isOpen, onClose, onConfirmar, producto, productos }: Props) {
  const [componentes, setComponentes] = useState<ComponenteConProducto[]>([]);

  // Inicializar componentes cuando se abre el modal
  useEffect(() => {
    if (isOpen && producto && producto.componentesKit) {
      const componentesIniciales = producto.componentesKit
        .sort((a, b) => a.orden - b.orden)
        .map((comp) => {
          const prod = productos.find((p) => p._id === comp.productoId);
          return {
            ...comp,
            producto: prod,
            seleccionado: !comp.opcional, // Los obligatorios están seleccionados por defecto
            cantidadSeleccionada: comp.cantidad,
          };
        });
      setComponentes(componentesIniciales);
    }
  }, [isOpen, producto, productos]);

  if (!isOpen || !producto) return null;

  // Calcular precio total del kit
  const precioTotal = useMemo(() => {
    // Si el kit tiene precio fijo, usarlo
    const precioBase = producto.precios?.venta ?? producto.precios?.pvp ?? producto.precioVenta ?? 0;
    if (precioBase > 0) return precioBase;

    // Si no, calcular sumando componentes seleccionados
    return componentes
      .filter((c) => c.seleccionado)
      .reduce((total, c) => {
        const precioUnitario = c.precioUnitario ??
          c.producto?.precios?.venta ??
          c.producto?.precios?.pvp ??
          c.producto?.precioVenta ?? 0;
        const descuento = (c.descuentoPorcentaje || 0) / 100;
        return total + (precioUnitario * c.cantidadSeleccionada * (1 - descuento));
      }, 0);
  }, [componentes, producto]);

  const toggleComponente = (index: number) => {
    setComponentes((prev) => {
      const nuevo = [...prev];
      // Solo permitir toggle si es opcional
      if (nuevo[index].opcional) {
        nuevo[index] = {
          ...nuevo[index],
          seleccionado: !nuevo[index].seleccionado,
        };
      }
      return nuevo;
    });
  };

  const modificarCantidad = (index: number, delta: number) => {
    setComponentes((prev) => {
      const nuevo = [...prev];
      const nuevaCantidad = nuevo[index].cantidadSeleccionada + delta;
      if (nuevaCantidad >= 1) {
        nuevo[index] = {
          ...nuevo[index],
          cantidadSeleccionada: nuevaCantidad,
        };
      }
      return nuevo;
    });
  };

  const handleConfirmar = () => {
    const componentesSeleccionados = componentes.filter((c) => c.seleccionado);
    onConfirmar(componentesSeleccionados, precioTotal);
    onClose();
  };

  const componentesObligatorios = componentes.filter((c) => !c.opcional);
  const componentesOpcionales = componentes.filter((c) => c.opcional);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-orange-50 px-4 py-3 flex items-center justify-between border-b border-orange-200">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="font-semibold text-gray-800 truncate max-w-[280px]">
                {producto.nombre}
              </h3>
              <p className="text-xs text-gray-500">Producto compuesto / Kit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-orange-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Componentes */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Componentes obligatorios */}
          {componentesObligatorios.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Incluye:</h4>
              <div className="space-y-2">
                {componentesObligatorios.map((comp, index) => (
                  <div
                    key={comp.productoId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {comp.producto?.nombre || 'Producto no encontrado'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {comp.cantidadSeleccionada} x {(
                            comp.precioUnitario ??
                            comp.producto?.precios?.venta ??
                            comp.producto?.precioVenta ?? 0
                          ).toFixed(2)} EUR
                          {(comp.descuentoPorcentaje || 0) > 0 && (
                            <span className="text-green-600 ml-1">
                              (-{comp.descuentoPorcentaje}%)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => modificarCantidad(index, -1)}
                        className="w-7 h-7 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                        disabled={comp.cantidadSeleccionada <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {comp.cantidadSeleccionada}
                      </span>
                      <button
                        onClick={() => modificarCantidad(index, 1)}
                        className="w-7 h-7 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Componentes opcionales */}
          {componentesOpcionales.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Extras opcionales:</h4>
              <div className="space-y-2">
                {componentesOpcionales.map((comp, index) => {
                  const realIndex = componentesObligatorios.length + index;
                  return (
                    <div
                      key={comp.productoId}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                        comp.seleccionado
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => toggleComponente(realIndex)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            comp.seleccionado
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {comp.seleccionado && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {comp.producto?.nombre || 'Producto no encontrado'}
                          </p>
                          <p className="text-xs text-gray-500">
                            +{(
                              comp.precioUnitario ??
                              comp.producto?.precios?.venta ??
                              comp.producto?.precioVenta ?? 0
                            ).toFixed(2)} EUR
                          </p>
                        </div>
                      </div>
                      {comp.seleccionado && (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => modificarCantidad(realIndex, -1)}
                            className="w-7 h-7 rounded bg-orange-200 flex items-center justify-center hover:bg-orange-300"
                            disabled={comp.cantidadSeleccionada <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {comp.cantidadSeleccionada}
                          </span>
                          <button
                            onClick={() => modificarCantidad(realIndex, 1)}
                            className="w-7 h-7 rounded bg-orange-200 flex items-center justify-center hover:bg-orange-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer con precio total */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600">Total del kit:</span>
            <span className="text-2xl font-bold text-orange-600">
              {precioTotal.toFixed(2)} EUR
            </span>
          </div>
          <button
            onClick={handleConfirmar}
            className="w-full py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors"
          >
            Añadir Kit
          </button>
        </div>
      </div>
    </div>
  );
}
