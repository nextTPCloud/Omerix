// ===========================================
// STORE DE VENTAS APARCADAS TPV
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  total: number;
}

interface VentaAparcada {
  id: string;
  lineas: LineaVenta[];
  subtotal: number;
  descuento: number;
  total: number;
  clienteId?: string;
  clienteNombre?: string;
  usuarioId: string;
  usuarioNombre: string;
  nota?: string;
  fecha: string; // ISO string para serialización
}

interface VentasAparcadasState {
  ventas: VentaAparcada[];

  // Acciones
  aparcarVenta: (params: {
    lineas: LineaVenta[];
    subtotal: number;
    descuento: number;
    total: number;
    usuarioId: string;
    usuarioNombre: string;
    clienteId?: string;
    clienteNombre?: string;
    nota?: string;
  }) => string; // Retorna ID de la venta aparcada

  recuperarVenta: (id: string) => VentaAparcada | null;
  eliminarVenta: (id: string) => void;
  listarVentas: () => VentaAparcada[];
  contarVentas: () => number;
}

export const useVentasAparcadasStore = create<VentasAparcadasState>()(
  persist(
    (set, get) => ({
      ventas: [],

      aparcarVenta: ({ lineas, subtotal, descuento, total, usuarioId, usuarioNombre, clienteId, clienteNombre, nota }) => {
        const id = `APR-${Date.now()}`;
        const ventaAparcada: VentaAparcada = {
          id,
          lineas,
          subtotal,
          descuento,
          total,
          clienteId,
          clienteNombre,
          usuarioId,
          usuarioNombre,
          nota,
          fecha: new Date().toISOString(),
        };

        set((state) => ({
          ventas: [...state.ventas, ventaAparcada],
        }));

        return id;
      },

      recuperarVenta: (id: string) => {
        const venta = get().ventas.find((v) => v.id === id);
        if (venta) {
          // Eliminar de la lista al recuperar
          set((state) => ({
            ventas: state.ventas.filter((v) => v.id !== id),
          }));
          return venta;
        }
        return null;
      },

      eliminarVenta: (id: string) => {
        set((state) => ({
          ventas: state.ventas.filter((v) => v.id !== id),
        }));
      },

      listarVentas: () => {
        return get().ventas;
      },

      contarVentas: () => {
        return get().ventas.length;
      },
    }),
    {
      name: 'tpv-ventas-aparcadas-storage',
    }
  )
);
