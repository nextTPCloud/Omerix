'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ILineaDocumentoBase,
  TipoLinea,
  crearLineaVacia,
  calcularLinea,
  calcularTotales,
  IComponenteKit,
  IVarianteSeleccionada,
} from '@/types/documento-linea.types';
import { Producto, Variante } from '@/types/producto.types';

interface UseDocumentoLineasOptions<T extends ILineaDocumentoBase> {
  lineasIniciales?: T[];
  modoCompra?: boolean;
  onLineasChange?: (lineas: T[]) => void;
}

interface UseDocumentoLineasReturn<T extends ILineaDocumentoBase> {
  // Estado
  lineas: T[];
  totales: ReturnType<typeof calcularTotales>;

  // Acciones
  addLinea: (tipo?: TipoLinea) => void;
  removeLinea: (index: number) => void;
  updateLinea: (index: number, updates: Partial<T>) => void;
  duplicateLinea: (index: number) => void;
  moveLineaUp: (index: number) => void;
  moveLineaDown: (index: number) => void;
  setLineas: (lineas: T[]) => void;

  // Producto
  handleProductoSelect: (index: number, producto: Producto, variante?: Variante) => void;

  // Kit
  toggleKitComponent: (lineaIndex: number, componenteIndex: number) => void;
  toggleMostrarComponentes: (index: number) => void;

  // Refs para navegación
  cantidadRefs: React.MutableRefObject<Map<number, HTMLInputElement>>;
  productoRefs: React.MutableRefObject<Map<number, HTMLInputElement>>;

  // Handlers de teclado
  handleCantidadKeyDown: (e: React.KeyboardEvent, index: number) => void;
  handleLineaKeyDown: (e: React.KeyboardEvent, index: number) => void;

  // Estado selector variantes
  varianteSelectorState: {
    isOpen: boolean;
    producto: Producto | null;
    lineaIndex: number | null;
  };
  openVarianteSelector: (producto: Producto, lineaIndex: number) => void;
  closeVarianteSelector: () => void;
  handleVarianteSelected: (variante: Variante) => void;
}

/**
 * Hook reutilizable para manejar líneas de documentos (presupuestos, pedidos, albaranes, facturas)
 * Funciona tanto para ventas como para compras
 */
export function useDocumentoLineas<T extends ILineaDocumentoBase = ILineaDocumentoBase>(
  options: UseDocumentoLineasOptions<T> = {}
): UseDocumentoLineasReturn<T> {
  const { lineasIniciales = [], modoCompra = false, onLineasChange } = options;

  const [lineas, setLineasState] = useState<T[]>(lineasIniciales);

  // Refs para navegación con teclado
  const cantidadRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const productoRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  // Estado para selector de variantes
  const [varianteSelectorState, setVarianteSelectorState] = useState<{
    isOpen: boolean;
    producto: Producto | null;
    lineaIndex: number | null;
  }>({
    isOpen: false,
    producto: null,
    lineaIndex: null,
  });

  // Calcular totales
  const totales = calcularTotales(lineas);

  // Notificar cambios
  const notifyChange = useCallback((newLineas: T[]) => {
    if (onLineasChange) {
      onLineasChange(newLineas);
    }
  }, [onLineasChange]);

  // Wrapper para setLineas que notifica cambios
  const setLineas = useCallback((newLineas: T[]) => {
    setLineasState(newLineas);
    notifyChange(newLineas);
  }, [notifyChange]);

  // Añadir línea
  const addLinea = useCallback((tipo: TipoLinea = TipoLinea.PRODUCTO) => {
    const newIndex = lineas.length;
    const newLinea = {
      ...crearLineaVacia(newIndex + 1, tipo),
    } as T;

    const newLineas = [...lineas, newLinea];
    setLineas(newLineas);

    // Enfocar el selector de producto de la nueva línea
    setTimeout(() => {
      const productoRef = productoRefs.current.get(newIndex);
      if (productoRef) {
        productoRef.focus();
      }
    }, 100);
  }, [lineas, setLineas]);

  // Eliminar línea
  const removeLinea = useCallback((index: number) => {
    const newLineas = lineas.filter((_, i) => i !== index);
    // Reordenar
    const reordenadas = newLineas.map((linea, i) => ({
      ...linea,
      orden: i + 1,
    }));
    setLineas(reordenadas);
  }, [lineas, setLineas]);

  // Actualizar línea
  const updateLinea = useCallback((index: number, updates: Partial<T>) => {
    const newLineas = [...lineas];
    const lineaActualizada = calcularLinea({ ...newLineas[index], ...updates });
    newLineas[index] = lineaActualizada as T;
    setLineas(newLineas);
  }, [lineas, setLineas]);

  // Duplicar línea
  const duplicateLinea = useCallback((index: number) => {
    const lineaDuplicada = {
      ...lineas[index],
      _id: undefined,
      orden: lineas.length + 1,
    } as T;
    const newLineas = [...lineas, lineaDuplicada];
    setLineas(newLineas);
  }, [lineas, setLineas]);

  // Mover línea arriba
  const moveLineaUp = useCallback((index: number) => {
    if (index === 0) return;

    const newLineas = [...lineas];
    [newLineas[index - 1], newLineas[index]] = [newLineas[index], newLineas[index - 1]];

    // Actualizar orden
    const reordenadas = newLineas.map((linea, i) => ({
      ...linea,
      orden: i + 1,
    }));
    setLineas(reordenadas);
  }, [lineas, setLineas]);

  // Mover línea abajo
  const moveLineaDown = useCallback((index: number) => {
    if (index === lineas.length - 1) return;

    const newLineas = [...lineas];
    [newLineas[index], newLineas[index + 1]] = [newLineas[index + 1], newLineas[index]];

    // Actualizar orden
    const reordenadas = newLineas.map((linea, i) => ({
      ...linea,
      orden: i + 1,
    }));
    setLineas(reordenadas);
  }, [lineas, setLineas]);

  // Seleccionar producto
  const handleProductoSelect = useCallback((
    index: number,
    producto: Producto,
    variante?: Variante
  ) => {
    // Determinar precio según modo (compra/venta)
    let precioUnitario = modoCompra
      ? producto.precios?.compra || 0
      : producto.precios?.pvp || 0;

    let varianteSeleccionada: IVarianteSeleccionada | undefined;

    // Si hay variante seleccionada, usar precio de la variante
    if (variante) {
      // Calcular precios adicionales como diferencia con el producto base
      const precioAdicional = (variante.precios?.pvp || 0) - (producto.precios?.pvp || 0);
      const costeAdicional = (variante.precios?.compra || 0) - (producto.precios?.compra || 0);

      varianteSeleccionada = {
        varianteId: variante._id,
        sku: variante.sku,
        combinacion: variante.combinacion,
        precioAdicional,
        costeAdicional,
      };

      // Usar precio directo de la variante
      precioUnitario = modoCompra
        ? variante.precios?.compra || 0
        : variante.precios?.pvp || 0;
    }

    // Preparar componentes del kit si es un compuesto
    let componentesKit: IComponenteKit[] | undefined;
    if (producto.tipo === 'compuesto' && producto.componentesKit) {
      componentesKit = producto.componentesKit.map(comp => ({
        productoId: comp.productoId,
        nombre: comp.producto?.nombre || '',
        sku: comp.producto?.sku || '',
        cantidad: comp.cantidad,
        precioUnitario: 0,
        costeUnitario: 0,
        descuento: 0,
        iva: producto.iva || 21,
        subtotal: 0,
        opcional: comp.opcional || false,
        seleccionado: !comp.opcional,
      }));
    }

    const updates: Partial<T> = {
      productoId: producto._id,
      codigo: producto.sku,
      nombre: producto.nombre,
      descripcion: producto.descripcionCorta,
      descripcionLarga: producto.descripcion,
      sku: variante?.sku || producto.sku,
      variante: varianteSeleccionada,
      precioUnitario,
      costeUnitario: producto.precios?.compra || 0,
      iva: producto.iva || 21,
      unidad: producto.unidadMedida || 'ud',
      tipo: producto.tipo === 'compuesto' ? TipoLinea.KIT : TipoLinea.PRODUCTO,
      componentesKit,
      mostrarComponentes: true,
    } as Partial<T>;

    updateLinea(index, updates);

    // Enfocar cantidad
    setTimeout(() => {
      const cantidadRef = cantidadRefs.current.get(index);
      if (cantidadRef) {
        cantidadRef.focus();
        cantidadRef.select();
      }
    }, 50);
  }, [modoCompra, updateLinea]);

  // Toggle componente de kit
  const toggleKitComponent = useCallback((lineaIndex: number, componenteIndex: number) => {
    const linea = lineas[lineaIndex];
    if (!linea.componentesKit) return;

    const newComponentes = [...linea.componentesKit];
    newComponentes[componenteIndex] = {
      ...newComponentes[componenteIndex],
      seleccionado: !newComponentes[componenteIndex].seleccionado,
    };

    updateLinea(lineaIndex, {
      componentesKit: newComponentes,
    } as Partial<T>);
  }, [lineas, updateLinea]);

  // Toggle mostrar componentes
  const toggleMostrarComponentes = useCallback((index: number) => {
    updateLinea(index, {
      mostrarComponentes: !lineas[index].mostrarComponentes,
    } as Partial<T>);
  }, [lineas, updateLinea]);

  // Handler de teclado genérico para cualquier campo de línea
  // Ctrl+Enter siempre añade nueva línea
  const handleLineaKeyDown = useCallback((
    e: React.KeyboardEvent,
    index: number
  ) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      addLinea(TipoLinea.PRODUCTO);
    }
  }, [addLinea]);

  // Handler de teclado específico para cantidad
  const handleCantidadKeyDown = useCallback((
    e: React.KeyboardEvent,
    index: number
  ) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      // Ctrl+Enter siempre añade nueva línea
      e.preventDefault();
      addLinea(TipoLinea.PRODUCTO);
    } else if (e.key === 'Enter' && !e.ctrlKey) {
      // Enter solo añade línea si estamos en el último registro
      if (index === lineas.length - 1) {
        e.preventDefault();
        addLinea(TipoLinea.PRODUCTO);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Ir a la cantidad de la siguiente línea
      const nextInput = cantidadRefs.current.get(index + 1);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Ir a la cantidad de la línea anterior
      const prevInput = cantidadRefs.current.get(index - 1);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  }, [addLinea, lineas.length]);

  // Funciones para selector de variantes
  const openVarianteSelector = useCallback((producto: Producto, lineaIndex: number) => {
    setVarianteSelectorState({
      isOpen: true,
      producto,
      lineaIndex,
    });
  }, []);

  const closeVarianteSelector = useCallback(() => {
    setVarianteSelectorState({
      isOpen: false,
      producto: null,
      lineaIndex: null,
    });
  }, []);

  const handleVarianteSelected = useCallback((variante: Variante) => {
    const { producto, lineaIndex } = varianteSelectorState;
    if (producto && lineaIndex !== null) {
      handleProductoSelect(lineaIndex, producto, variante);
    }
    closeVarianteSelector();
  }, [varianteSelectorState, handleProductoSelect, closeVarianteSelector]);

  return {
    lineas,
    totales,
    addLinea,
    removeLinea,
    updateLinea,
    duplicateLinea,
    moveLineaUp,
    moveLineaDown,
    setLineas,
    handleProductoSelect,
    toggleKitComponent,
    toggleMostrarComponentes,
    cantidadRefs,
    productoRefs,
    handleCantidadKeyDown,
    handleLineaKeyDown,
    varianteSelectorState,
    openVarianteSelector,
    closeVarianteSelector,
    handleVarianteSelected,
  };
}

export default useDocumentoLineas;
