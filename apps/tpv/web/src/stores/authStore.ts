// ===========================================
// STORE DE AUTENTICACION TPV
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tpvApi } from '../services/api';

// Permisos especiales del usuario (sincronizados con rol del backend)
export interface PermisosTPV {
  // Visibilidad
  verCostes: boolean;
  verMargenes: boolean;
  // Precios y descuentos
  modificarPVP: boolean;
  aplicarDescuentos: boolean;
  descuentoMaximo: number;
  // Operaciones
  anularDocumentos: boolean;
  // Accesos TPV
  accesoTPV: boolean;
  accesoCobroVencimientosTPV: boolean;
  accesoPagoVencimientosTPV: boolean;
}

// Permisos por defecto (vendedor básico)
const PERMISOS_TPV_DEFAULT: PermisosTPV = {
  verCostes: false,
  verMargenes: false,
  modificarPVP: false,
  aplicarDescuentos: true,
  descuentoMaximo: 15,
  anularDocumentos: false,
  accesoTPV: true,
  accesoCobroVencimientosTPV: false,
  accesoPagoVencimientosTPV: false,
};

// Tipos
interface Usuario {
  id: string;
  nombre: string;
  rol?: string;
  permisos: PermisosTPV;
}

interface TPVConfig {
  tpvId: string;
  tpvNombre: string;
  empresaId: string;
  empresaNombre: string;
  almacenId: string;
  serieFactura: string;
  permitirDescuentos: boolean;
  descuentoMaximo: number;
  permitirPrecioManual: boolean;
  modoOfflinePermitido: boolean;
  pinPorTicket?: boolean;
  // Vencimientos
  permitirCobroVencimientos?: boolean;
  permitirPagoVencimientos?: boolean;
  // Restauración
  permitirPropinas?: boolean;
  tieneRestauracion?: boolean;
  requiereMesaParaVenta?: boolean;
  requiereCamareroParaVenta?: boolean;
}

interface AuthState {
  // Estado de activacion del TPV
  activado: boolean;
  tpvConfig: TPVConfig | null;

  // Estado de sesion de usuario
  usuario: Usuario | null;
  sesionId: string | null;
  logueado: boolean;

  // Estado de conexion
  online: boolean;
  modoOffline: boolean;

  // Heartbeat
  heartbeatInterval: NodeJS.Timeout | null;

  // Acciones de TPV
  activarTPV: (token: string, nombre: string, almacenId?: string) => Promise<boolean>;
  desactivarTPV: () => void;

  // Acciones de usuario
  login: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // Conexion
  setOnline: (online: boolean) => void;
  setModoOffline: (offline: boolean) => void;

  // Heartbeat
  iniciarHeartbeat: () => void;
  detenerHeartbeat: () => void;
}

// Intervalo de heartbeat (30 segundos)
const HEARTBEAT_INTERVAL = 30000;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      activado: false,
      tpvConfig: null,
      usuario: null,
      sesionId: null,
      logueado: false,
      online: true,
      modoOffline: false,
      heartbeatInterval: null,

      // Activar TPV con token (almacenId opcional - se configura despues)
      activarTPV: async (token, nombre, almacenId) => {
        try {
          const response = await tpvApi.activarTPV({ token, nombre, almacenId });

          if (response.ok) {
            set({
              activado: true,
              tpvConfig: {
                tpvId: response.tpvId,
                tpvNombre: nombre,
                empresaId: response.empresaId,
                empresaNombre: response.empresaNombre,
                almacenId: almacenId || '',
                serieFactura: response.config?.serieFactura || 'FS',
                permitirDescuentos: response.config?.permitirDescuentos ?? true,
                descuentoMaximo: response.config?.descuentoMaximo ?? 100,
                permitirPrecioManual: response.config?.permitirPrecioManual ?? false,
                modoOfflinePermitido: response.config?.modoOfflinePermitido ?? true,
                // Restauración
                permitirPropinas: response.config?.permitirPropinas ?? false,
                tieneRestauracion: response.config?.tieneRestauracion ?? false,
              },
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error activando TPV:', error);
          return false;
        }
      },

      // Desactivar TPV
      desactivarTPV: () => {
        get().detenerHeartbeat();
        tpvApi.clearCredentials();
        set({
          activado: false,
          tpvConfig: null,
          usuario: null,
          sesionId: null,
          logueado: false,
        });
      },

      // Login de usuario con PIN
      login: async (pin) => {
        try {
          // Si estamos offline, intentar login local
          if (get().modoOffline) {
            // TODO: Implementar login offline con cache de usuarios
            console.warn('Login offline no implementado aun');
            return false;
          }

          const response = await tpvApi.loginUsuario(pin);

          if (response.ok) {
            // Mapear permisos del backend al formato local
            const permisosRaw = response.usuario?.permisos || {};
            const permisosMerged: PermisosTPV = {
              verCostes: permisosRaw.verCostes ?? PERMISOS_TPV_DEFAULT.verCostes,
              verMargenes: permisosRaw.verMargenes ?? PERMISOS_TPV_DEFAULT.verMargenes,
              modificarPVP: permisosRaw.modificarPVP ?? PERMISOS_TPV_DEFAULT.modificarPVP,
              aplicarDescuentos: permisosRaw.aplicarDescuentos ?? PERMISOS_TPV_DEFAULT.aplicarDescuentos,
              descuentoMaximo: permisosRaw.descuentoMaximo ?? PERMISOS_TPV_DEFAULT.descuentoMaximo,
              anularDocumentos: permisosRaw.anularDocumentos ?? PERMISOS_TPV_DEFAULT.anularDocumentos,
              accesoTPV: permisosRaw.accesoTPV ?? PERMISOS_TPV_DEFAULT.accesoTPV,
              accesoCobroVencimientosTPV: permisosRaw.accesoCobroVencimientosTPV ?? PERMISOS_TPV_DEFAULT.accesoCobroVencimientosTPV,
              accesoPagoVencimientosTPV: permisosRaw.accesoPagoVencimientosTPV ?? PERMISOS_TPV_DEFAULT.accesoPagoVencimientosTPV,
            };

            set({
              usuario: {
                id: response.usuario.id,
                nombre: response.usuario.nombre,
                rol: response.usuario.rol,
                permisos: permisosMerged,
              },
              sesionId: response.sesionId,
              logueado: true,
            });

            // Iniciar heartbeat
            get().iniciarHeartbeat();

            return true;
          }
          return false;
        } catch (error) {
          console.error('Error en login:', error);
          return false;
        }
      },

      // Logout
      logout: async () => {
        const { sesionId } = get();

        // Detener heartbeat
        get().detenerHeartbeat();

        // Notificar al servidor si hay sesion
        if (sesionId && get().online) {
          try {
            await tpvApi.logoutUsuario(sesionId);
          } catch (error) {
            console.error('Error en logout:', error);
          }
        }

        set({
          usuario: null,
          sesionId: null,
          logueado: false,
        });
      },

      // Set estado online
      setOnline: (online) => {
        set({ online });

        // Si volvemos online y hay sesion, reiniciar heartbeat
        if (online && get().sesionId) {
          get().iniciarHeartbeat();
        }
      },

      // Set modo offline
      setModoOffline: (modoOffline) => {
        const { tpvConfig } = get();

        // Solo permitir si esta habilitado en config
        if (modoOffline && !tpvConfig?.modoOfflinePermitido) {
          console.warn('Modo offline no permitido para este TPV');
          return;
        }

        set({ modoOffline });
      },

      // Iniciar heartbeat
      iniciarHeartbeat: () => {
        // Detener cualquier heartbeat anterior
        get().detenerHeartbeat();

        const interval = setInterval(async () => {
          const { sesionId, online } = get();

          if (!sesionId || !online) return;

          try {
            await tpvApi.heartbeat(sesionId);
          } catch (error) {
            console.error('Error en heartbeat:', error);
            // Si falla el heartbeat, marcar como offline
            set({ online: false });
          }
        }, HEARTBEAT_INTERVAL);

        set({ heartbeatInterval: interval });
      },

      // Detener heartbeat
      detenerHeartbeat: () => {
        const { heartbeatInterval } = get();
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          set({ heartbeatInterval: null });
        }
      },
    }),
    {
      name: 'tpv-auth-storage',
      partialize: (state) => ({
        activado: state.activado,
        tpvConfig: state.tpvConfig,
        // No persistir usuario ni sesion (requiere nuevo login)
      }),
    }
  )
);

// Verificar conexion al cargar y periodicamente
if (typeof window !== 'undefined') {
  const checkOnline = async () => {
    try {
      // Primero verificar si el navegador dice que hay conexion
      if (!navigator.onLine) {
        useAuthStore.getState().setOnline(false);
        return;
      }

      // Luego verificar si podemos conectar al servidor
      const cloudOk = await tpvApi.verificarConexionCloud();
      useAuthStore.getState().setOnline(cloudOk);
    } catch (error) {
      console.error('Error verificando conexion:', error);
      useAuthStore.getState().setOnline(false);
    }
  };

  window.addEventListener('online', checkOnline);
  window.addEventListener('offline', () => useAuthStore.getState().setOnline(false));

  // Verificar al iniciar (con delay para dar tiempo al servidor)
  setTimeout(checkOnline, 1000);

  // Verificar periodicamente cada 30 segundos
  setInterval(checkOnline, 30000);
}
