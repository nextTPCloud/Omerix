// ===========================================
// STORE DE VENTA TPV
// ===========================================

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// Tipos
interface LineaVenta {
  id: string;
  productoId: string;
  varianteId?: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tipoIva: number;
  importeIva: number;
  subtotal: number;
  total: number;
}

interface Cliente {
  id: string;
  nombre: string;
  nif?: string;
}

interface VentaState {
  // Estado de la venta actual
  localId: string;
  lineas: LineaVenta[];
  cliente: Cliente | null;
  descuentoGeneral: number;
  observaciones: string;

  // Calculados
  subtotal: number;
  totalDescuento: number;
  totalIva: number;
  total: number;

  // Acciones
  agregarProducto: (producto: {
    id: string;
    varianteId?: string;
    codigo: string;
    nombre: string;
    precio: number;
    tipoIva: number;
  }) => void;
  eliminarLinea: (lineaId: string) => void;
  modificarCantidad: (lineaId: string, cantidad: number) => void;
  aplicarDescuentoLinea: (lineaId: string, descuento: number) => void;
  aplicarDescuentoGeneral: (descuento: number) => void;
  setCliente: (cliente: Cliente | null) => void;
  setObservaciones: (obs: string) => void;
  limpiarVenta: () => void;
  nuevaVenta: () => void;
}

// Calcular totales de línea
function calcularLinea(linea: Omit<LineaVenta, 'subtotal' | 'importeIva' | 'total'>): LineaVenta {
  const subtotal = linea.precioUnitario * linea.cantidad;
  const subtotalConDescuento = subtotal - linea.descuento;
  const importeIva = subtotalConDescuento * (linea.tipoIva / 100);
  const total = subtotalConDescuento + importeIva;

  return {
    ...linea,
    subtotal: subtotalConDescuento,
    importeIva,
    total,
  };
}

// Calcular totales de venta
function calcularTotales(lineas: LineaVenta[], descuentoGeneral: number) {
  const subtotal = lineas.reduce((acc, l) => acc + l.subtotal, 0);
  const totalDescuento = lineas.reduce((acc, l) => acc + l.descuento, 0) + descuentoGeneral;
  const totalIva = lineas.reduce((acc, l) => acc + l.importeIva, 0);
  const total = subtotal + totalIva - descuentoGeneral;

  return { subtotal, totalDescuento, totalIva, total: Math.max(0, total) };
}

export const useVentaStore = create<VentaState>((set, get) => ({
  // Estado inicial
  localId: uuidv4(),
  lineas: [],
  cliente: null,
  descuentoGeneral: 0,
  observaciones: '',
  subtotal: 0,
  totalDescuento: 0,
  totalIva: 0,
  total: 0,

  // Agregar producto
  agregarProducto: (producto) => {
    const { lineas, descuentoGeneral } = get();

    // Buscar si ya existe
    const existente = lineas.find(
      (l) => l.productoId === producto.id && l.varianteId === producto.varianteId
    );

    let nuevasLineas: LineaVenta[];

    if (existente) {
      nuevasLineas = lineas.map((l) =>
        l.id === existente.id
          ? calcularLinea({ ...l, cantidad: l.cantidad + 1 })
          : l
      );
    } else {
      const nuevaLinea = calcularLinea({
        id: uuidv4(),
        productoId: producto.id,
        varianteId: producto.varianteId,
        codigo: producto.codigo,
        nombre: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precio,
        descuento: 0,
        tipoIva: producto.tipoIva,
      });
      nuevasLineas = [...lineas, nuevaLinea];
    }

    const totales = calcularTotales(nuevasLineas, descuentoGeneral);
    set({ lineas: nuevasLineas, ...totales });
  },

  // Eliminar línea
  eliminarLinea: (lineaId) => {
    const { lineas, descuentoGeneral } = get();
    const nuevasLineas = lineas.filter((l) => l.id !== lineaId);
    const totales = calcularTotales(nuevasLineas, descuentoGeneral);
    set({ lineas: nuevasLineas, ...totales });
  },

  // Modificar cantidad
  modificarCantidad: (lineaId, cantidad) => {
    const { lineas, descuentoGeneral } = get();

    if (cantidad <= 0) {
      get().eliminarLinea(lineaId);
      return;
    }

    const nuevasLineas = lineas.map((l) =>
      l.id === lineaId ? calcularLinea({ ...l, cantidad }) : l
    );
    const totales = calcularTotales(nuevasLineas, descuentoGeneral);
    set({ lineas: nuevasLineas, ...totales });
  },

  // Aplicar descuento a línea
  aplicarDescuentoLinea: (lineaId, descuento) => {
    const { lineas, descuentoGeneral } = get();
    const nuevasLineas = lineas.map((l) =>
      l.id === lineaId ? calcularLinea({ ...l, descuento }) : l
    );
    const totales = calcularTotales(nuevasLineas, descuentoGeneral);
    set({ lineas: nuevasLineas, ...totales });
  },

  // Aplicar descuento general
  aplicarDescuentoGeneral: (descuento) => {
    const { lineas } = get();
    const totales = calcularTotales(lineas, descuento);
    set({ descuentoGeneral: descuento, ...totales });
  },

  // Set cliente
  setCliente: (cliente) => set({ cliente }),

  // Set observaciones
  setObservaciones: (observaciones) => set({ observaciones }),

  // Limpiar venta
  limpiarVenta: () =>
    set({
      lineas: [],
      cliente: null,
      descuentoGeneral: 0,
      observaciones: '',
      subtotal: 0,
      totalDescuento: 0,
      totalIva: 0,
      total: 0,
    }),

  // Nueva venta
  nuevaVenta: () =>
    set({
      localId: uuidv4(),
      lineas: [],
      cliente: null,
      descuentoGeneral: 0,
      observaciones: '',
      subtotal: 0,
      totalDescuento: 0,
      totalIva: 0,
      total: 0,
    }),
}));
