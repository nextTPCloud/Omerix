// ===========================================
// STORE DE SINCRONIZACIÓN TPV
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos
type EstadoSync = 'pendiente' | 'sincronizando' | 'sincronizado' | 'error';
type TipoEntidad = 'venta' | 'caja' | 'movimiento' | 'verifactu';
type Operacion = 'crear' | 'actualizar' | 'eliminar';

interface ItemCola {
  id: string;
  entidad: TipoEntidad;
  entidadId: string;
  operacion: Operacion;
  datos: any;
  intentos: number;
  ultimoIntento?: Date;
  error?: string;
  createdAt: Date;
}

interface SyncState {
  // Estado de conexión
  online: boolean;
  ultimaSync: Date | null;

  // Cola de sincronización
  cola: ItemCola[];

  // Estado general
  estado: EstadoSync;
  sincronizando: boolean;

  // Estadísticas
  pendientes: number;
  errores: number;
  sincronizados: number;

  // Acciones
  setOnline: (online: boolean) => void;
  agregarACola: (item: Omit<ItemCola, 'id' | 'intentos' | 'createdAt'>) => void;
  procesarCola: () => Promise<void>;
  reintentar: (id: string) => void;
  eliminarDeCola: (id: string) => void;
  limpiarErrores: () => void;
}

// Intervalo de sincronización (ms)
const SYNC_INTERVAL = 30000;
const MAX_INTENTOS = 5;

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      online: true,
      ultimaSync: null,
      cola: [],
      estado: 'sincronizado',
      sincronizando: false,
      pendientes: 0,
      errores: 0,
      sincronizados: 0,

      // Set estado de conexión
      setOnline: (online) => {
        set({ online });
        if (online) {
          // Intentar sincronizar al reconectar
          get().procesarCola();
        }
      },

      // Agregar item a cola
      agregarACola: (item) => {
        const nuevoItem: ItemCola = {
          ...item,
          id: Date.now().toString(),
          intentos: 0,
          createdAt: new Date(),
        };

        set((state) => ({
          cola: [...state.cola, nuevoItem],
          pendientes: state.pendientes + 1,
          estado: 'pendiente',
        }));

        // Intentar sincronizar inmediatamente si online
        if (get().online) {
          get().procesarCola();
        }
      },

      // Procesar cola de sincronización
      procesarCola: async () => {
        const { online, sincronizando, cola } = get();

        if (!online || sincronizando || cola.length === 0) {
          return;
        }

        set({ sincronizando: true, estado: 'sincronizando' });

        const pendientes = cola.filter((item) => item.intentos < MAX_INTENTOS && !item.error);

        for (const item of pendientes) {
          try {
            // Actualizar intentos
            set((state) => ({
              cola: state.cola.map((i) =>
                i.id === item.id
                  ? { ...i, intentos: i.intentos + 1, ultimoIntento: new Date() }
                  : i
              ),
            }));

            // Enviar al servidor
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                entidad: item.entidad,
                entidadId: item.entidadId,
                operacion: item.operacion,
                datos: item.datos,
              }),
            });

            if (!response.ok) {
              throw new Error(`Error ${response.status}`);
            }

            // Eliminar de la cola
            set((state) => ({
              cola: state.cola.filter((i) => i.id !== item.id),
              pendientes: state.pendientes - 1,
              sincronizados: state.sincronizados + 1,
            }));
          } catch (error) {
            // Marcar error
            set((state) => ({
              cola: state.cola.map((i) =>
                i.id === item.id
                  ? { ...i, error: error instanceof Error ? error.message : 'Error desconocido' }
                  : i
              ),
              errores: state.errores + 1,
            }));
          }
        }

        set({
          sincronizando: false,
          ultimaSync: new Date(),
          estado: get().cola.length === 0 ? 'sincronizado' : get().errores > 0 ? 'error' : 'pendiente',
        });
      },

      // Reintentar item
      reintentar: (id) => {
        set((state) => ({
          cola: state.cola.map((i) =>
            i.id === id ? { ...i, intentos: 0, error: undefined } : i
          ),
          errores: Math.max(0, state.errores - 1),
        }));
        get().procesarCola();
      },

      // Eliminar de cola
      eliminarDeCola: (id) => {
        set((state) => ({
          cola: state.cola.filter((i) => i.id !== id),
          pendientes: Math.max(0, state.pendientes - 1),
        }));
      },

      // Limpiar errores
      limpiarErrores: () => {
        set((state) => ({
          cola: state.cola.filter((i) => !i.error),
          errores: 0,
        }));
      },
    }),
    {
      name: 'tpv-sync-storage',
      partialize: (state) => ({
        cola: state.cola,
        ultimaSync: state.ultimaSync,
        pendientes: state.pendientes,
        errores: state.errores,
        sincronizados: state.sincronizados,
      }),
    }
  )
);

// Iniciar verificación de conexión y sincronización periódica
if (typeof window !== 'undefined') {
  // Verificar conexión
  const checkOnline = () => {
    useSyncStore.getState().setOnline(navigator.onLine);
  };

  window.addEventListener('online', checkOnline);
  window.addEventListener('offline', checkOnline);

  // Sincronización periódica
  setInterval(() => {
    if (useSyncStore.getState().online) {
      useSyncStore.getState().procesarCola();
    }
  }, SYNC_INTERVAL);
}
