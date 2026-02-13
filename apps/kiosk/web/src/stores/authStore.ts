import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';

interface KioskConfig {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'totem' | 'qr_mesa' | 'tablet_mesa' | 'menu_digital';
  salonId?: string;
  mesaId?: string;
  pagos: {
    permitePago: boolean;
    formasPagoIds: string[];
    pagoObligatorio: boolean;
    tpvDestinoId?: string;
  };
  tema: {
    colorPrimario?: string;
    colorSecundario?: string;
    logoUrl?: string;
    fondoUrl?: string;
    idiomas: string[];
    idiomaPorDefecto: string;
  };
  config: {
    familiasVisibles?: string[];
    tiempoInactividad: number;
    permitirComentarios: boolean;
    mostrarPrecios: boolean;
    mostrarAlergenos: boolean;
    mostrarCalorias: boolean;
    qrSessionDuration: number;
    requiereNombreCliente: boolean;
    requiereTelefono: boolean;
    permitirParaLlevar: boolean;
  };
}

interface AuthState {
  // Credenciales
  empresaId: string | null;
  kioskId: string | null;
  kioskSecret: string | null;
  empresaNombre: string | null;
  kioskNombre: string | null;
  empresaLogo: string | null;

  // Config del kiosk
  kioskConfig: KioskConfig | null;

  // Estado
  isActivated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  checkActivation: () => Promise<void>;
  activar: (empresaId: string, kioskId: string, kioskSecret: string) => Promise<void>;
  activarConToken: (token: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      empresaId: null,
      kioskId: null,
      kioskSecret: null,
      empresaNombre: null,
      kioskNombre: null,
      empresaLogo: null,
      kioskConfig: null,
      isActivated: false,
      isLoading: false,
      error: null,

      // Verificar si hay credenciales guardadas
      checkActivation: async () => {
        const { empresaId, kioskId, kioskSecret } = get();

        if (!empresaId || !kioskId || !kioskSecret) {
          set({ isActivated: false, isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await api.post('/kiosk/activar', {
            empresaId,
            kioskId,
            kioskSecret,
          });

          if (response.data.success) {
            set({
              isActivated: true,
              kioskConfig: response.data.kiosk,
              empresaLogo: response.data.empresaLogo || null,
              isLoading: false,
            });
          } else {
            throw new Error(response.data.error || 'Error de activacion');
          }
        } catch (error: any) {
          console.error('[Auth] Error verificando activacion:', error);
          set({
            isActivated: false,
            kioskConfig: null,
            isLoading: false,
            error: error.response?.data?.error || error.message,
          });
        }
      },

      // Activar kiosk con credenciales directas
      activar: async (empresaId: string, kioskId: string, kioskSecret: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post('/kiosk/activar', {
            empresaId,
            kioskId,
            kioskSecret,
          });

          if (response.data.success) {
            set({
              empresaId,
              kioskId,
              kioskSecret,
              kioskConfig: response.data.kiosk,
              empresaLogo: response.data.empresaLogo || null,
              isActivated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.data.error || 'Error de activacion');
          }
        } catch (error: any) {
          console.error('[Auth] Error activando:', error);
          set({
            isLoading: false,
            error: error.response?.data?.error || error.message,
          });
          throw error;
        }
      },

      // Activar kiosk con token de 8 caracteres
      activarConToken: async (token: string) => {
        set({ isLoading: true, error: null });

        try {
          // 1. Activar con token y obtener credenciales
          const tokenResponse = await api.post('/kiosk/activar-token', { token });

          if (!tokenResponse.data.success) {
            throw new Error(tokenResponse.data.error || 'Token invalido o expirado');
          }

          const { kioskId, kioskSecret, empresaId, empresaNombre, kioskNombre } = tokenResponse.data;

          // 2. Verificar credenciales y obtener config
          const configResponse = await api.post('/kiosk/activar', {
            empresaId,
            kioskId,
            kioskSecret,
          });

          if (configResponse.data.success) {
            set({
              empresaId,
              kioskId,
              kioskSecret,
              empresaNombre,
              kioskNombre,
              empresaLogo: configResponse.data.empresaLogo || null,
              kioskConfig: configResponse.data.kiosk,
              isActivated: true,
              isLoading: false,
            });
          } else {
            throw new Error(configResponse.data.error || 'Error al obtener configuracion');
          }
        } catch (error: any) {
          console.error('[Auth] Error activando con token:', error);
          set({
            isLoading: false,
            error: error.response?.data?.error || error.message,
          });
          throw error;
        }
      },

      // Cerrar sesion
      logout: () => {
        set({
          empresaId: null,
          kioskId: null,
          kioskSecret: null,
          empresaNombre: null,
          kioskNombre: null,
          empresaLogo: null,
          kioskConfig: null,
          isActivated: false,
          error: null,
        });
      },

      // Limpiar error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'kiosk-auth',
      partialize: (state) => ({
        empresaId: state.empresaId,
        kioskId: state.kioskId,
        kioskSecret: state.kioskSecret,
        empresaNombre: state.empresaNombre,
        kioskNombre: state.kioskNombre,
        empresaLogo: state.empresaLogo,
      }),
    }
  )
);
