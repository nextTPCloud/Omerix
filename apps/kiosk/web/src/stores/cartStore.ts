import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Producto, Modificador } from './dataStore';

// Item del carrito
export interface CartItem {
  id: string;                    // ID unico del item en carrito
  producto: Producto;
  cantidad: number;
  modificadores: Array<{
    modificador: Modificador;
    cantidad: number;
  }>;
  comentario?: string;
  precioUnitario: number;        // Precio base + modificadores
  precioTotal: number;           // precioUnitario * cantidad
}

// Datos del cliente
export interface ClienteInfo {
  nombre?: string;
  telefono?: string;
  email?: string;
}

interface CartState {
  // Items del carrito
  items: CartItem[];

  // Tipo de servicio
  tipoServicio: 'en_local' | 'para_llevar';

  // Datos del cliente
  cliente: ClienteInfo;

  // Totales
  subtotal: number;
  impuestos: number;
  total: number;

  // Acciones
  addItem: (
    producto: Producto,
    cantidad: number,
    modificadores: Array<{ modificador: Modificador; cantidad: number }>,
    comentario?: string
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, cantidad: number) => void;
  updateComentario: (itemId: string, comentario: string) => void;
  setTipoServicio: (tipo: 'en_local' | 'para_llevar') => void;
  setCliente: (cliente: ClienteInfo) => void;
  clear: () => void;
  getItemCount: () => number;
}

// Generar ID unico para item
const generateItemId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Calcular precio de item
const calcularPrecioItem = (
  producto: Producto,
  modificadores: Array<{ modificador: Modificador; cantidad: number }>,
  cantidad: number
): { precioUnitario: number; precioTotal: number } => {
  let precioUnitario = producto.precios?.venta ?? 0;

  // Sumar/restar modificadores
  for (const { modificador, cantidad: modCantidad } of modificadores) {
    if (modificador.tipo === 'cargo') {
      precioUnitario += modificador.precioExtra * modCantidad;
    } else if (modificador.tipo === 'descuento') {
      precioUnitario -= modificador.precioExtra * modCantidad;
    }
  }

  return {
    precioUnitario,
    precioTotal: precioUnitario * cantidad,
  };
};

// Calcular totales del carrito
const calcularTotales = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.precioTotal, 0);
  // TODO: Calcular impuestos segun tipoImpuesto de cada producto
  const impuestos = subtotal * 0.10; // Simplificado: 10%
  const total = subtotal + impuestos;
  return { subtotal, impuestos, total };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      items: [],
      tipoServicio: 'en_local',
      cliente: {},
      subtotal: 0,
      impuestos: 0,
      total: 0,

      // Agregar item al carrito
      addItem: (producto, cantidad, modificadores, comentario) => {
        const { precioUnitario, precioTotal } = calcularPrecioItem(
          producto,
          modificadores,
          cantidad
        );

        const newItem: CartItem = {
          id: generateItemId(),
          producto,
          cantidad,
          modificadores,
          comentario,
          precioUnitario,
          precioTotal,
        };

        set((state) => {
          const newItems = [...state.items, newItem];
          const totales = calcularTotales(newItems);
          return {
            items: newItems,
            ...totales,
          };
        });
      },

      // Eliminar item
      removeItem: (itemId) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== itemId);
          const totales = calcularTotales(newItems);
          return {
            items: newItems,
            ...totales,
          };
        });
      },

      // Actualizar cantidad
      updateQuantity: (itemId, cantidad) => {
        if (cantidad < 1) {
          get().removeItem(itemId);
          return;
        }

        set((state) => {
          const newItems = state.items.map((item) => {
            if (item.id === itemId) {
              const { precioUnitario, precioTotal } = calcularPrecioItem(
                item.producto,
                item.modificadores,
                cantidad
              );
              return { ...item, cantidad, precioUnitario, precioTotal };
            }
            return item;
          });
          const totales = calcularTotales(newItems);
          return {
            items: newItems,
            ...totales,
          };
        });
      },

      // Actualizar comentario
      updateComentario: (itemId, comentario) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, comentario } : item
          ),
        }));
      },

      // Cambiar tipo de servicio
      setTipoServicio: (tipo) => {
        set({ tipoServicio: tipo });
      },

      // Actualizar datos del cliente
      setCliente: (cliente) => {
        set({ cliente });
      },

      // Limpiar carrito
      clear: () => {
        set({
          items: [],
          tipoServicio: 'en_local',
          cliente: {},
          subtotal: 0,
          impuestos: 0,
          total: 0,
        });
      },

      // Obtener cantidad total de items
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.cantidad, 0);
      },
    }),
    {
      name: 'kiosk-cart',
      partialize: (state) => ({
        items: state.items,
        tipoServicio: state.tipoServicio,
        cliente: state.cliente,
        subtotal: state.subtotal,
        impuestos: state.impuestos,
        total: state.total,
      }),
    }
  )
);
