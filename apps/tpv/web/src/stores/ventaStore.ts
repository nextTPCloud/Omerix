// ===========================================
// STORE DE VENTA TPV
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { restauracionService } from '../services/restauracion.service';
import { useDataStore } from './dataStore';

// Tipos
export interface LineaVenta {
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

// Datos de venta que se guardan por mesa
export interface VentaMesa {
  localId: string;
  mesaId: string;
  mesaNumero: string;
  lineas: LineaVenta[];
  cliente: Cliente | null;
  descuentoGeneral: number;
  observaciones: string;
  subtotal: number;
  totalDescuento: number;
  totalIva: number;
  total: number;
  camareroId?: string;
  camareroNombre?: string;
  creadaEn: Date;
  actualizadaEn: Date;
}

interface VentaState {
  // Estado de la venta actual
  localId: string;
  lineas: LineaVenta[];
  cliente: Cliente | null;
  descuentoGeneral: number;
  observaciones: string;

  // Mesa actual asociada
  mesaActualId: string | null;
  mesaActualNumero: string | null;
  camareroActualId: string | null;
  camareroActualNombre: string | null;

  // Calculados
  subtotal: number;
  totalDescuento: number;
  totalIva: number;
  total: number;

  // Ventas pendientes por mesa (persistidas)
  ventasPorMesa: Record<string, VentaMesa>;

  // Acciones básicas
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

  // Acciones de mesa
  asignarMesa: (mesaId: string, mesaNumero: string) => void;
  asignarCamarero: (camareroId: string, camareroNombre: string) => void;
  guardarVentaEnMesa: () => void;
  cargarVentaDeMesa: (mesaId: string) => boolean;
  obtenerVentaMesa: (mesaId: string) => VentaMesa | null;
  eliminarVentaMesa: (mesaId: string) => void;
  cambiarMesa: (mesaId: string, mesaNumero: string) => void;

  // Comandas de cocina de la mesa actual
  comandasMesaActual: any[];
  cargarComandasMesa: (mesaId: string) => Promise<void>;

  // Incorporar lineas de comanda externa (del comandero) a la venta de una mesa
  incorporarLineasComanda: (data: {
    mesaId: string;
    mesaNumero: string;
    camareroId?: string;
    camareroNombre?: string;
    lineas: { productoId: string; nombre: string; cantidad: number }[];
  }) => void;

  // Acciones de dividir/unir mesas
  dividirMesa: (
    lineasAMover: { lineaId: string; cantidad: number }[],
    mesaDestinoId: string,
    mesaDestinoNumero: string
  ) => void;
  unirMesas: (mesasIdsAUnir: string[]) => void;
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

export const useVentaStore = create<VentaState>()(
  persist(
    (set, get) => ({
  // Estado inicial
  localId: uuidv4(),
  lineas: [],
  cliente: null,
  descuentoGeneral: 0,
  observaciones: '',
  mesaActualId: null,
  mesaActualNumero: null,
  camareroActualId: null,
  camareroActualNombre: null,
  subtotal: 0,
  totalDescuento: 0,
  totalIva: 0,
  total: 0,
  ventasPorMesa: {},
  comandasMesaActual: [],

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

  // Limpiar venta (mantiene mesa y camarero)
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

  // Nueva venta (limpia todo incluyendo mesa)
  nuevaVenta: () =>
    set({
      localId: uuidv4(),
      lineas: [],
      cliente: null,
      descuentoGeneral: 0,
      observaciones: '',
      mesaActualId: null,
      mesaActualNumero: null,
      camareroActualId: null,
      camareroActualNombre: null,
      subtotal: 0,
      totalDescuento: 0,
      totalIva: 0,
      total: 0,
    }),

  // ===========================================
  // ACCIONES DE MESA
  // ===========================================

  // Asignar mesa a la venta actual
  asignarMesa: (mesaId, mesaNumero) => {
    set({ mesaActualId: mesaId, mesaActualNumero: mesaNumero });
  },

  // Asignar camarero a la venta actual
  asignarCamarero: (camareroId, camareroNombre) => {
    set({ camareroActualId: camareroId, camareroActualNombre: camareroNombre });
  },

  // Guardar la venta actual en la mesa
  guardarVentaEnMesa: () => {
    const state = get();
    const { mesaActualId, mesaActualNumero, lineas } = state;

    // Solo guardar si hay mesa y hay líneas
    if (!mesaActualId || !mesaActualNumero || lineas.length === 0) {
      console.log('[VentaStore] No se guarda: sin mesa o sin líneas');
      return;
    }

    const ventaMesa: VentaMesa = {
      localId: state.localId,
      mesaId: mesaActualId,
      mesaNumero: mesaActualNumero,
      lineas: state.lineas,
      cliente: state.cliente,
      descuentoGeneral: state.descuentoGeneral,
      observaciones: state.observaciones,
      subtotal: state.subtotal,
      totalDescuento: state.totalDescuento,
      totalIva: state.totalIva,
      total: state.total,
      camareroId: state.camareroActualId || undefined,
      camareroNombre: state.camareroActualNombre || undefined,
      creadaEn: state.ventasPorMesa[mesaActualId]?.creadaEn || new Date(),
      actualizadaEn: new Date(),
    };

    set((s) => ({
      ventasPorMesa: {
        ...s.ventasPorMesa,
        [mesaActualId]: ventaMesa,
      },
    }));

    console.log('[VentaStore] Venta guardada en mesa:', mesaActualNumero, ventaMesa);
  },

  // Cargar venta desde una mesa
  cargarVentaDeMesa: (mesaId) => {
    const { ventasPorMesa } = get();
    const ventaMesa = ventasPorMesa[mesaId];

    if (!ventaMesa) {
      console.log('[VentaStore] No hay venta guardada para mesa:', mesaId);
      return false;
    }

    set({
      localId: ventaMesa.localId,
      lineas: ventaMesa.lineas,
      cliente: ventaMesa.cliente,
      descuentoGeneral: ventaMesa.descuentoGeneral,
      observaciones: ventaMesa.observaciones,
      subtotal: ventaMesa.subtotal,
      totalDescuento: ventaMesa.totalDescuento,
      totalIva: ventaMesa.totalIva,
      total: ventaMesa.total,
      mesaActualId: ventaMesa.mesaId,
      mesaActualNumero: ventaMesa.mesaNumero,
      camareroActualId: ventaMesa.camareroId || null,
      camareroActualNombre: ventaMesa.camareroNombre || null,
    });

    console.log('[VentaStore] Venta cargada de mesa:', ventaMesa.mesaNumero);
    return true;
  },

  // Obtener venta de una mesa sin cargarla
  obtenerVentaMesa: (mesaId) => {
    return get().ventasPorMesa[mesaId] || null;
  },

  // Eliminar venta de una mesa (después de cobrar)
  eliminarVentaMesa: (mesaId) => {
    set((state) => {
      const { [mesaId]: _, ...resto } = state.ventasPorMesa;
      return { ventasPorMesa: resto };
    });
    console.log('[VentaStore] Venta eliminada de mesa:', mesaId);
  },

  // Cambiar a otra mesa (guarda actual y carga la nueva)
  cambiarMesa: (mesaId, mesaNumero) => {
    const state = get();

    // 1. Guardar venta actual si hay líneas
    if (state.mesaActualId && state.lineas.length > 0) {
      state.guardarVentaEnMesa();
    }

    // 2. Intentar cargar venta de la nueva mesa
    const ventaCargada = state.cargarVentaDeMesa(mesaId);

    // 3. Si no hay venta guardada, iniciar nueva venta para esta mesa
    if (!ventaCargada) {
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
        mesaActualId: mesaId,
        mesaActualNumero: mesaNumero,
        // Mantener camarero actual
      });
      console.log('[VentaStore] Nueva venta iniciada para mesa:', mesaNumero);
    }
  },

  // Cargar comandas de cocina de una mesa
  // Compara las líneas de las comandas del backend con las de la venta local
  // e incorpora las que falten (fallback si SSE no las entregó)
  cargarComandasMesa: async (mesaId) => {
    try {
      const res = await restauracionService.getComandasMesa(mesaId);
      if (res.ok) {
        const comandas = res.data || [];
        set({ comandasMesaActual: comandas });

        // Recopilar todas las líneas de todas las comandas no canceladas
        const lineasComandas: { productoId: string; nombre: string; cantidad: number }[] = [];
        for (const comanda of comandas) {
          if (comanda.estado === 'cancelado') continue;
          for (const linea of (comanda.lineas || [])) {
            lineasComandas.push({
              productoId: linea.productoId,
              nombre: linea.nombreProducto || linea.nombre || '',
              cantidad: linea.cantidad || 1,
            });
          }
        }

        if (lineasComandas.length === 0) return;

        // Calcular totales esperados por producto desde las comandas
        const totalesPorProducto: Record<string, { nombre: string; cantidad: number }> = {};
        for (const l of lineasComandas) {
          if (!totalesPorProducto[l.productoId]) {
            totalesPorProducto[l.productoId] = { nombre: l.nombre, cantidad: 0 };
          }
          totalesPorProducto[l.productoId].cantidad += l.cantidad;
        }

        // Comparar con la venta local para encontrar líneas faltantes
        const ventaExistente = get().ventasPorMesa[mesaId];
        const lineasVenta = ventaExistente?.lineas || [];

        // Calcular totales actuales en la venta local
        const totalesVenta: Record<string, number> = {};
        for (const l of lineasVenta) {
          totalesVenta[l.productoId] = (totalesVenta[l.productoId] || 0) + l.cantidad;
        }

        // Encontrar líneas que faltan en la venta local
        const lineasFaltantes: { productoId: string; nombre: string; cantidad: number }[] = [];
        for (const [productoId, esperado] of Object.entries(totalesPorProducto)) {
          const enVenta = totalesVenta[productoId] || 0;
          if (enVenta < esperado.cantidad) {
            lineasFaltantes.push({
              productoId,
              nombre: esperado.nombre,
              cantidad: esperado.cantidad - enVenta,
            });
          }
        }

        if (lineasFaltantes.length > 0) {
          console.log('[VentaStore] Fallback: incorporando', lineasFaltantes.length, 'líneas faltantes a mesa', mesaId);
          const mesaNumero = get().mesaActualNumero || '';
          get().incorporarLineasComanda({
            mesaId,
            mesaNumero,
            lineas: lineasFaltantes,
          });
        }
      }
    } catch (error) {
      console.error('[VentaStore] Error cargando comandas mesa:', error);
    }
  },

  // Incorporar lineas de comanda externa (comandero) en la venta de una mesa
  incorporarLineasComanda: (data) => {
    const { ventasPorMesa } = get();
    const ventaExistente = ventasPorMesa[data.mesaId];

    // Resolver precios de cada producto desde el dataStore
    const { productos, calcularPrecioProducto, obtenerTipoImpuesto } = useDataStore.getState();

    const nuevasLineas: LineaVenta[] = data.lineas.map(l => {
      const prod = productos.find(p => p._id === l.productoId);
      const precio = prod ? calcularPrecioProducto(prod) : 0;
      // Resolver tipo IVA desde el tipo de impuesto del producto
      let tipoIva = 21;
      if (prod?.tipoImpuestoId) {
        const tipoImpuesto = obtenerTipoImpuesto(prod.tipoImpuestoId);
        if (tipoImpuesto) tipoIva = tipoImpuesto.porcentaje ?? 21;
      }
      return calcularLinea({
        id: uuidv4(),
        productoId: l.productoId,
        codigo: prod?.codigo || '',
        nombre: l.nombre,
        cantidad: l.cantidad,
        precioUnitario: precio,
        descuento: 0,
        tipoIva,
      });
    });

    if (ventaExistente) {
      // Agregar a venta existente
      const lineasActualizadas = [...ventaExistente.lineas, ...nuevasLineas];
      const totales = calcularTotales(lineasActualizadas, ventaExistente.descuentoGeneral);
      const ventaActualizada: VentaMesa = {
        ...ventaExistente,
        lineas: lineasActualizadas,
        ...totales,
        camareroId: data.camareroId || ventaExistente.camareroId,
        camareroNombre: data.camareroNombre || ventaExistente.camareroNombre,
        actualizadaEn: new Date(),
      };
      set(s => ({
        ventasPorMesa: { ...s.ventasPorMesa, [data.mesaId]: ventaActualizada },
      }));
      console.log('[VentaStore] Lineas comanda agregadas a venta existente mesa:', data.mesaNumero);
    } else {
      // Crear nueva venta para la mesa
      const totales = calcularTotales(nuevasLineas, 0);
      const nuevaVenta: VentaMesa = {
        localId: uuidv4(),
        mesaId: data.mesaId,
        mesaNumero: data.mesaNumero,
        lineas: nuevasLineas,
        cliente: null,
        descuentoGeneral: 0,
        observaciones: '',
        ...totales,
        camareroId: data.camareroId,
        camareroNombre: data.camareroNombre,
        creadaEn: new Date(),
        actualizadaEn: new Date(),
      };
      set(s => ({
        ventasPorMesa: { ...s.ventasPorMesa, [data.mesaId]: nuevaVenta },
      }));
      console.log('[VentaStore] Nueva venta creada desde comanda para mesa:', data.mesaNumero);
    }

    // Si es la mesa actual, recargar los datos en pantalla
    const currentMesaId = get().mesaActualId;
    if (currentMesaId === data.mesaId) {
      const ventaFinal = get().ventasPorMesa[data.mesaId];
      if (ventaFinal) {
        set({
          lineas: ventaFinal.lineas,
          subtotal: ventaFinal.subtotal,
          totalDescuento: ventaFinal.totalDescuento,
          totalIva: ventaFinal.totalIva,
          total: ventaFinal.total,
          camareroActualId: ventaFinal.camareroId || null,
          camareroActualNombre: ventaFinal.camareroNombre || null,
        });
      }
    }
  },

  // ===========================================
  // ACCIONES DE DIVIDIR/UNIR MESAS
  // ===========================================

  // Dividir mesa: mover líneas a otra mesa
  dividirMesa: (lineasAMover, mesaDestinoId, mesaDestinoNumero) => {
    const state = get();
    const { lineas, mesaActualId, ventasPorMesa, descuentoGeneral } = state;

    if (!mesaActualId) {
      console.log('[VentaStore] dividirMesa: No hay mesa actual');
      return;
    }

    // 1. Crear las líneas para la mesa destino
    const lineasParaDestino: LineaVenta[] = [];
    const lineasActualizadas: LineaVenta[] = [];

    lineas.forEach((linea) => {
      const mover = lineasAMover.find((l) => l.lineaId === linea.id);

      if (mover) {
        if (mover.cantidad >= linea.cantidad) {
          // Mover toda la línea
          lineasParaDestino.push({
            ...linea,
            id: uuidv4(), // Nuevo ID para la mesa destino
          });
        } else {
          // Dividir la línea: parte se queda, parte se va
          const cantidadRestante = linea.cantidad - mover.cantidad;

          // Línea que se queda (cantidad reducida)
          lineasActualizadas.push(
            calcularLinea({
              ...linea,
              cantidad: cantidadRestante,
              descuento: (linea.descuento * cantidadRestante) / linea.cantidad,
            })
          );

          // Línea que se mueve
          lineasParaDestino.push(
            calcularLinea({
              ...linea,
              id: uuidv4(),
              cantidad: mover.cantidad,
              descuento: (linea.descuento * mover.cantidad) / linea.cantidad,
            })
          );
        }
      } else {
        // La línea no se mueve, se queda igual
        lineasActualizadas.push(linea);
      }
    });

    // 2. Actualizar venta de mesa actual
    const totalesActual = calcularTotales(lineasActualizadas, descuentoGeneral);

    // 3. Crear/actualizar venta en mesa destino
    const ventaDestinoExistente = ventasPorMesa[mesaDestinoId];
    const lineasDestino = ventaDestinoExistente
      ? [...ventaDestinoExistente.lineas, ...lineasParaDestino]
      : lineasParaDestino;

    const totalesDestino = calcularTotales(lineasDestino, 0);

    const ventaDestino: VentaMesa = {
      localId: ventaDestinoExistente?.localId || uuidv4(),
      mesaId: mesaDestinoId,
      mesaNumero: mesaDestinoNumero,
      lineas: lineasDestino,
      cliente: ventaDestinoExistente?.cliente || null,
      descuentoGeneral: 0,
      observaciones: ventaDestinoExistente?.observaciones || '',
      ...totalesDestino,
      camareroId: state.camareroActualId || undefined,
      camareroNombre: state.camareroActualNombre || undefined,
      creadaEn: ventaDestinoExistente?.creadaEn || new Date(),
      actualizadaEn: new Date(),
    };

    // 4. Actualizar estado
    const nuevasVentasPorMesa = { ...ventasPorMesa };

    // Actualizar mesa actual si tiene líneas
    if (lineasActualizadas.length > 0) {
      nuevasVentasPorMesa[mesaActualId] = {
        ...ventasPorMesa[mesaActualId],
        lineas: lineasActualizadas,
        ...totalesActual,
        actualizadaEn: new Date(),
      };
    } else {
      // Si no quedan líneas, eliminar venta de mesa actual
      delete nuevasVentasPorMesa[mesaActualId];
    }

    // Agregar/actualizar mesa destino
    nuevasVentasPorMesa[mesaDestinoId] = ventaDestino;

    set({
      lineas: lineasActualizadas,
      ...totalesActual,
      ventasPorMesa: nuevasVentasPorMesa,
    });

    console.log(
      '[VentaStore] Mesa dividida:',
      lineasParaDestino.length,
      'líneas movidas a mesa',
      mesaDestinoNumero
    );
  },

  // Unir mesas: traer líneas de otras mesas a la actual
  unirMesas: (mesasIdsAUnir) => {
    const state = get();
    const { lineas, mesaActualId, mesaActualNumero, ventasPorMesa, descuentoGeneral } = state;

    if (!mesaActualId || !mesaActualNumero) {
      console.log('[VentaStore] unirMesas: No hay mesa actual');
      return;
    }

    // 1. Recolectar todas las líneas de las mesas a unir
    let lineasUnidas: LineaVenta[] = [...lineas];

    mesasIdsAUnir.forEach((mesaId) => {
      const ventaMesa = ventasPorMesa[mesaId];
      if (ventaMesa && ventaMesa.lineas.length > 0) {
        // Agregar líneas con nuevos IDs para evitar duplicados
        ventaMesa.lineas.forEach((linea) => {
          lineasUnidas.push({
            ...linea,
            id: uuidv4(), // Nuevo ID para evitar conflictos
          });
        });
      }
    });

    // 2. Calcular totales de la venta unida
    const totalesUnidos = calcularTotales(lineasUnidas, descuentoGeneral);

    // 3. Eliminar las ventas de las mesas unidas
    const nuevasVentasPorMesa = { ...ventasPorMesa };
    mesasIdsAUnir.forEach((mesaId) => {
      delete nuevasVentasPorMesa[mesaId];
    });

    // 4. Actualizar la venta de la mesa actual
    if (lineasUnidas.length > 0) {
      nuevasVentasPorMesa[mesaActualId] = {
        localId: state.localId,
        mesaId: mesaActualId,
        mesaNumero: mesaActualNumero,
        lineas: lineasUnidas,
        cliente: state.cliente,
        descuentoGeneral,
        observaciones: state.observaciones,
        ...totalesUnidos,
        camareroId: state.camareroActualId || undefined,
        camareroNombre: state.camareroActualNombre || undefined,
        creadaEn: ventasPorMesa[mesaActualId]?.creadaEn || new Date(),
        actualizadaEn: new Date(),
      };
    }

    // 5. Actualizar estado
    set({
      lineas: lineasUnidas,
      ...totalesUnidos,
      ventasPorMesa: nuevasVentasPorMesa,
    });

    console.log(
      '[VentaStore] Mesas unidas:',
      mesasIdsAUnir.length,
      'mesas fusionadas con mesa',
      mesaActualNumero
    );
  },
}),
    {
      name: 'tpv-venta-storage',
      partialize: (state) => ({
        // Solo persistir las ventas por mesa (tickets abiertos)
        ventasPorMesa: state.ventasPorMesa,
      }),
    }
  )
);
