// ===========================================
// STORE DE PERFIL TPV
// Configura qué familias/productos mostrar y en qué orden
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FamiliaPerfil {
  familiaId: string;
  visible: boolean;
  orden: number;
}

interface ProductoPerfil {
  productoId: string;
  visible: boolean;
  orden: number;
  destacado: boolean; // Productos favoritos que aparecen primero
}

interface PerfilState {
  // Configuración de familias
  familias: FamiliaPerfil[];

  // Productos destacados (favoritos que aparecen sin seleccionar familia)
  productosDestacados: ProductoPerfil[];

  // Acciones de familias
  setFamiliaVisible: (familiaId: string, visible: boolean) => void;
  setFamiliaOrden: (familiaId: string, orden: number) => void;
  moverFamilia: (familiaId: string, direccion: 'up' | 'down') => void;
  resetFamilias: () => void;
  inicializarFamilias: (familiaIds: string[]) => void;

  // Acciones de productos destacados
  toggleProductoDestacado: (productoId: string) => void;
  esProductoDestacado: (productoId: string) => boolean;
  getProductosDestacados: () => string[];

  // Obtener familias ordenadas y filtradas
  getFamiliasOrdenadas: () => FamiliaPerfil[];
  esFamiliaVisible: (familiaId: string) => boolean;
}

export const usePerfilStore = create<PerfilState>()(
  persist(
    (set, get) => ({
      familias: [],
      productosDestacados: [],

      // Set visibilidad de familia
      setFamiliaVisible: (familiaId, visible) => {
        set((state) => {
          const index = state.familias.findIndex((f) => f.familiaId === familiaId);
          if (index >= 0) {
            const newFamilias = [...state.familias];
            newFamilias[index] = { ...newFamilias[index], visible };
            return { familias: newFamilias };
          }
          // Si no existe, crear nueva entrada
          return {
            familias: [
              ...state.familias,
              { familiaId, visible, orden: state.familias.length },
            ],
          };
        });
      },

      // Set orden de familia
      setFamiliaOrden: (familiaId, orden) => {
        set((state) => {
          const index = state.familias.findIndex((f) => f.familiaId === familiaId);
          if (index >= 0) {
            const newFamilias = [...state.familias];
            newFamilias[index] = { ...newFamilias[index], orden };
            return { familias: newFamilias };
          }
          return state;
        });
      },

      // Mover familia arriba o abajo
      moverFamilia: (familiaId, direccion) => {
        set((state) => {
          const familiasOrdenadas = [...state.familias].sort((a, b) => a.orden - b.orden);
          const index = familiasOrdenadas.findIndex((f) => f.familiaId === familiaId);

          if (index < 0) return state;

          const newIndex = direccion === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= familiasOrdenadas.length) return state;

          // Intercambiar órdenes
          const temp = familiasOrdenadas[index].orden;
          familiasOrdenadas[index].orden = familiasOrdenadas[newIndex].orden;
          familiasOrdenadas[newIndex].orden = temp;

          return { familias: familiasOrdenadas };
        });
      },

      // Reset familias (mostrar todas en orden original)
      resetFamilias: () => {
        set({ familias: [] });
      },

      // Inicializar familias con las que vienen del servidor
      inicializarFamilias: (familiaIds) => {
        set((state) => {
          // Mantener configuración existente, agregar nuevas
          const existentes = new Set(state.familias.map((f) => f.familiaId));
          const nuevas = familiaIds
            .filter((id) => !existentes.has(id))
            .map((id, idx) => ({
              familiaId: id,
              visible: true,
              orden: state.familias.length + idx,
            }));

          return { familias: [...state.familias, ...nuevas] };
        });
      },

      // Toggle producto destacado
      toggleProductoDestacado: (productoId) => {
        set((state) => {
          const index = state.productosDestacados.findIndex(
            (p) => p.productoId === productoId
          );

          if (index >= 0) {
            // Quitar de destacados
            return {
              productosDestacados: state.productosDestacados.filter(
                (p) => p.productoId !== productoId
              ),
            };
          }

          // Agregar a destacados
          return {
            productosDestacados: [
              ...state.productosDestacados,
              {
                productoId,
                visible: true,
                orden: state.productosDestacados.length,
                destacado: true,
              },
            ],
          };
        });
      },

      // Verificar si producto es destacado
      esProductoDestacado: (productoId) => {
        return get().productosDestacados.some((p) => p.productoId === productoId);
      },

      // Obtener IDs de productos destacados
      getProductosDestacados: () => {
        return get()
          .productosDestacados
          .sort((a, b) => a.orden - b.orden)
          .map((p) => p.productoId);
      },

      // Obtener familias ordenadas
      getFamiliasOrdenadas: () => {
        return [...get().familias]
          .filter((f) => f.visible)
          .sort((a, b) => a.orden - b.orden);
      },

      // Verificar si familia es visible
      esFamiliaVisible: (familiaId) => {
        const familia = get().familias.find((f) => f.familiaId === familiaId);
        // Si no está configurada, es visible por defecto
        return familia ? familia.visible : true;
      },
    }),
    {
      name: 'tpv-perfil-storage',
    }
  )
);
