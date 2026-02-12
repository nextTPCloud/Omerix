import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';
import { useAuthStore } from './authStore';

// Tipos de datos
export interface Familia {
  _id: string;
  nombre: string;
  descripcion?: string;
  color?: string;
  imagen?: string;
  orden?: number;
}

export interface Producto {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  familiaId: string;
  precios?: {
    compra?: number;
    venta?: number;
    pvp?: number;
    margen?: number;
  };
  tipoImpuestoId?: {
    _id: string;
    codigo: string;
    nombre: string;
    porcentaje: number;
  };
  imagen?: string;
  imagenPrincipal?: string;
  color?: string;
  alergenos?: Alergeno[];
  modificadoresDisponibles?: string[];
}

export interface Modificador {
  _id: string;
  codigo: string;
  nombre: string;
  tipo: 'cargo' | 'descuento' | 'gratis';
  precioExtra: number;
  esMultiple?: boolean;
  cantidadMaxima?: number;
  color?: string;
  grupoId?: {
    _id: string;
    nombre: string;
    color?: string;
  };
}

export interface GrupoModificadores {
  _id: string;
  codigo: string;
  nombre: string;
  color?: string;
  orden?: number;
}

export interface Alergeno {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
}

export interface FormaPago {
  _id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  icono?: string;
}

export interface Mesa {
  _id: string;
  numero: string;
  nombre?: string;
  capacidad?: number;
  estado: string;
  salonId: string;
}

interface DataState {
  // Datos
  familias: Familia[];
  productos: Producto[];
  modificadores: Modificador[];
  gruposModificadores: GrupoModificadores[];
  alergenos: Alergeno[];
  formasPago: FormaPago[];
  mesas: Mesa[];

  // Estado de sincronizacion
  isLoading: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  error: string | null;

  // Acciones
  sincronizar: () => Promise<void>;
  getProductosByFamilia: (familiaId: string) => Producto[];
  getModificadoresParaProducto: (producto: Producto) => Modificador[];
  clearData: () => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      familias: [],
      productos: [],
      modificadores: [],
      gruposModificadores: [],
      alergenos: [],
      formasPago: [],
      mesas: [],
      isLoading: false,
      isSyncing: false,
      lastSync: null,
      error: null,

      // Sincronizar datos del servidor
      sincronizar: async () => {
        // Evitar llamadas concurrentes
        if (get().isSyncing) {
          console.log('[Data] Sincronizacion ya en curso, ignorando...');
          return;
        }

        const auth = useAuthStore.getState();
        console.log('[Data] Iniciando sincronizacion...', {
          empresaId: auth.empresaId,
          kioskId: auth.kioskId,
          hasSecret: !!auth.kioskSecret,
        });

        if (!auth.empresaId || !auth.kioskId || !auth.kioskSecret) {
          console.error('[Data] Faltan credenciales de kiosk');
          set({ error: 'No hay credenciales de kiosk' });
          return;
        }

        set({ isSyncing: true, error: null });

        try {
          const response = await api.post('/kiosk/sync/descargar', {
            empresaId: auth.empresaId,
            kioskId: auth.kioskId,
            kioskSecret: auth.kioskSecret,
            ultimaSync: get().lastSync?.toISOString(),
          });

          console.log('[Data] Respuesta del servidor:', {
            success: response.data.success,
            familias: response.data.familias?.length || 0,
            productos: response.data.productos?.length || 0,
            modificadores: response.data.modificadores?.length || 0,
          });

          if (response.data.success) {
            set({
              familias: response.data.familias || [],
              productos: response.data.productos || [],
              modificadores: response.data.modificadores || [],
              gruposModificadores: response.data.gruposModificadores || [],
              alergenos: response.data.alergenos || [],
              formasPago: response.data.formasPago || [],
              mesas: response.data.mesas || [],
              lastSync: new Date(response.data.timestamp),
              isSyncing: false,
            });
            console.log('[Data] Sincronizacion completada');
          } else {
            throw new Error(response.data.error || 'Error de sincronizacion');
          }
        } catch (error: any) {
          console.error('[Data] Error sincronizando:', error);
          set({
            isSyncing: false,
            error: error.response?.data?.error || error.message,
          });
        }
      },

      // Obtener productos de una familia
      getProductosByFamilia: (familiaId: string) => {
        return get().productos.filter((p) => p.familiaId === familiaId);
      },

      // Obtener modificadores disponibles para un producto
      getModificadoresParaProducto: (producto: Producto) => {
        const { modificadores } = get();
        if (!producto.modificadoresDisponibles || producto.modificadoresDisponibles.length === 0) {
          // Si no tiene modificadores especificos, devolver todos
          return modificadores;
        }
        return modificadores.filter((m) =>
          producto.modificadoresDisponibles?.includes(m._id)
        );
      },

      // Limpiar datos
      clearData: () => {
        set({
          familias: [],
          productos: [],
          modificadores: [],
          gruposModificadores: [],
          alergenos: [],
          formasPago: [],
          mesas: [],
          lastSync: null,
          error: null,
        });
      },
    }),
    {
      name: 'kiosk-data',
      partialize: (state) => ({
        familias: state.familias,
        productos: state.productos,
        modificadores: state.modificadores,
        gruposModificadores: state.gruposModificadores,
        alergenos: state.alergenos,
        formasPago: state.formasPago,
        mesas: state.mesas,
        lastSync: state.lastSync,
      }),
    }
  )
);
