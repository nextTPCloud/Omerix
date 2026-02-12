// ===========================================
// STORE DE PEDIDOS RÁPIDOS TPV
// Cola de pedidos de barra/llevar/recoger
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PedidoRapido {
  id: string;
  comandaId?: string;
  tipoServicio: 'barra' | 'llevar' | 'recoger';
  camareroNombre?: string;
  lineas: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
  }>;
  fecha: string; // ISO string
  leido: boolean;
}

interface PedidosRapidosState {
  pedidos: PedidoRapido[];
  agregarPedido: (pedido: Omit<PedidoRapido, 'id' | 'fecha' | 'leido'>) => string;
  recuperarPedido: (id: string) => PedidoRapido | null;
  eliminarPedido: (id: string) => void;
  marcarLeido: (id: string) => void;
  marcarTodosLeidos: () => void;
  contarPedidos: () => number;
  contarNoLeidos: () => number;
}

export const usePedidosRapidosStore = create<PedidosRapidosState>()(
  persist(
    (set, get) => ({
      pedidos: [],

      agregarPedido: (pedido) => {
        const id = `PED-${Date.now()}`;
        const nuevoPedido: PedidoRapido = {
          ...pedido,
          id,
          fecha: new Date().toISOString(),
          leido: false,
        };

        set((state) => ({
          pedidos: [...state.pedidos, nuevoPedido],
        }));

        return id;
      },

      recuperarPedido: (id: string) => {
        const pedido = get().pedidos.find((p) => p.id === id);
        if (pedido) {
          set((state) => ({
            pedidos: state.pedidos.filter((p) => p.id !== id),
          }));
          return pedido;
        }
        return null;
      },

      eliminarPedido: (id: string) => {
        set((state) => ({
          pedidos: state.pedidos.filter((p) => p.id !== id),
        }));
      },

      marcarLeido: (id: string) => {
        set((state) => ({
          pedidos: state.pedidos.map((p) =>
            p.id === id ? { ...p, leido: true } : p
          ),
        }));
      },

      marcarTodosLeidos: () => {
        set((state) => ({
          pedidos: state.pedidos.map((p) => ({ ...p, leido: true })),
        }));
      },

      contarPedidos: () => {
        return get().pedidos.length;
      },

      contarNoLeidos: () => {
        return get().pedidos.filter((p) => !p.leido).length;
      },
    }),
    {
      name: 'tpv-pedidos-rapidos-storage',
    }
  )
);
