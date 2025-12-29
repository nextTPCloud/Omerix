import { api } from './api'

// Tipos de configuracion de perifericos
export interface ImpresoraConfig {
  activa: boolean
  tipo?: 'usb' | 'red' | 'bluetooth' | 'serial'
  conexion?: string
  anchoTicket?: 58 | 80
}

export interface VisorClienteConfig {
  activo: boolean
  tipo?: 'serial' | 'usb' | 'red'
  conexion?: string
  lineas?: number
}

export interface CajonPortamonedasConfig {
  activo: boolean
  tipo?: 'impresora' | 'serial' | 'usb'
  conexion?: string
  abrirAlCobrar?: boolean
  abrirAlAbrirCaja?: boolean
}

export interface LectorCodigoBarrasConfig {
  activo: boolean
  tipo?: 'usb' | 'serial' | 'bluetooth'
  prefijo?: string
  sufijo?: string
}

export interface BasculaConfig {
  activa: boolean
  tipo?: 'serial' | 'usb'
  conexion?: string
  protocolo?: 'epelsa' | 'dibal' | 'marques' | 'generico'
}

export interface TPVConfig {
  // Opciones de venta
  permitirDescuentos?: boolean
  descuentoMaximo?: number
  permitirPrecioManual?: boolean
  modoOfflinePermitido?: boolean
  diasCacheProductos?: number

  // Perifericos
  impresoraTicket?: ImpresoraConfig
  impresoraCocina?: ImpresoraConfig
  visorCliente?: VisorClienteConfig
  cajonPortamonedas?: CajonPortamonedasConfig
  lectorCodigoBarras?: LectorCodigoBarrasConfig
  bascula?: BasculaConfig
}

// Tipos
export interface TPVRegistrado {
  _id: string
  empresaId: string
  codigo: string
  nombre: string
  almacenId?: string
  almacen?: { _id: string; codigo: string; nombre: string }
  serieFactura: string
  estado: 'activo' | 'inactivo' | 'pendiente' | 'desactivado' | 'suspendido'
  ultimoAcceso?: Date
  ultimaConexion?: Date
  ultimaSync?: Date
  ultimaIP?: string
  versionApp?: string
  config: TPVConfig
  createdAt: Date
  updatedAt: Date
}

export interface TokenActivacion {
  token: string
  expiraEn: Date
  mensaje: string
}

export interface SesionTPV {
  _id: string
  tpvId: string
  usuarioId: string
  usuario?: {
    nombre: string
    apellidos: string
  }
  cajaId?: string
  estado: 'activa' | 'cerrada'
  inicioSesion: Date
  finSesion?: Date
  ultimoHeartbeat: Date
  ventasRealizadas: number
  totalVentas: number
}

// Servicio TPV
class TpvService {
  // Generar token de activacion
  async generarToken(): Promise<{ success: boolean; data?: TokenActivacion; error?: string }> {
    try {
      const response = await api.post('/tpv/generar-token')
      return {
        success: true,
        data: response.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Listar TPVs de la empresa
  async listarTPVs(): Promise<{ success: boolean; data?: TPVRegistrado[]; error?: string }> {
    try {
      const response = await api.get('/tpv/lista')
      return {
        success: true,
        data: response.data.tpvs,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Obtener un TPV
  async obtenerTPV(id: string): Promise<{ success: boolean; data?: TPVRegistrado; error?: string }> {
    try {
      const response = await api.get(`/tpv/${id}`)
      return {
        success: true,
        data: response.data.tpv,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Actualizar TPV
  async actualizarTPV(id: string, datos: Partial<TPVRegistrado>): Promise<{ success: boolean; data?: TPVRegistrado; error?: string }> {
    try {
      const response = await api.put(`/tpv/${id}`, datos)
      return {
        success: true,
        data: response.data.tpv,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Desactivar TPV
  async desactivarTPV(id: string, motivo?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post(`/tpv/${id}/desactivar`, { motivo })
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Revocar token del TPV
  async revocarToken(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post(`/tpv/${id}/revocar-token`)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Eliminar TPV permanentemente
  async eliminarTPV(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.delete(`/tpv/${id}`)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Obtener sesiones activas
  async obtenerSesiones(): Promise<{ success: boolean; data?: SesionTPV[]; error?: string }> {
    try {
      const response = await api.get('/tpv/sesiones')
      return {
        success: true,
        data: response.data.sesiones,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Forzar cierre de sesion
  async forzarCierreSesion(sesionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post(`/tpv/sesiones/${sesionId}/cerrar`)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }
}

export const tpvService = new TpvService()
