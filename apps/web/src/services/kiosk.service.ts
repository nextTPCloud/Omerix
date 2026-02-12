import { api } from './api'

// Tipos de kiosk
export type TipoKiosk = 'totem' | 'qr_mesa' | 'tablet_mesa' | 'menu_digital'

// Configuracion de tema
export interface KioskTema {
  colorPrimario: string
  colorSecundario?: string
  logoUrl?: string
  fondoUrl?: string
  idiomas: string[]
}

// Configuracion de pagos
export interface KioskPagos {
  permitePago: boolean
  formasPagoIds: string[]
  pagoObligatorio: boolean
  tpvDestinoId?: string
}

// Configuracion general
export interface KioskConfig {
  familiasVisibles?: string[]
  tiempoInactividad: number
  permitirComentarios: boolean
  qrSessionDuration: number
  mostrarPrecios: boolean
  mostrarAlergenos: boolean
  requiereNombreCliente?: boolean
  requiereTelefono?: boolean
  permitirParaLlevar?: boolean
}

// Kiosk registrado
export interface KioskRegistrado {
  _id: string
  empresaId: string
  codigo: string
  nombre: string
  tipo: TipoKiosk
  salonId?: string
  salon?: { _id: string; nombre: string }
  mesaId?: string
  mesa?: { _id: string; numero: number }
  tema: KioskTema
  pagos: KioskPagos
  config: KioskConfig
  estado: 'activo' | 'suspendido' | 'desactivado'
  ultimaConexion?: Date
  createdAt: Date
  updatedAt: Date
}

// Token de activacion
export interface TokenActivacionKiosk {
  token: string
  expiraEn: Date
  mensaje: string
}

// Servicio Kiosk
class KioskService {
  // Generar token de activacion para un kiosk especifico
  async generarToken(kioskId: string): Promise<{ success: boolean; data?: TokenActivacionKiosk; error?: string }> {
    try {
      const response = await api.post('/kiosk/generar-token', { kioskId })
      return {
        success: true,
        data: {
          token: response.data.token,
          expiraEn: new Date(response.data.expiraEn),
          mensaje: response.data.mensaje,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Listar kioskos de la empresa
  async listarKiosks(): Promise<{ success: boolean; data?: KioskRegistrado[]; error?: string }> {
    try {
      const response = await api.get('/kiosk/lista')
      return {
        success: true,
        data: response.data.kiosks,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Obtener un kiosk
  async obtenerKiosk(id: string): Promise<{ success: boolean; data?: KioskRegistrado; error?: string }> {
    try {
      const response = await api.get(`/kiosk/${id}`)
      return {
        success: true,
        data: response.data.kiosk,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Crear kiosk manualmente
  async crearKiosk(datos: Partial<KioskRegistrado>): Promise<{ success: boolean; data?: KioskRegistrado; error?: string }> {
    try {
      const response = await api.post('/kiosk/crear', datos)
      return {
        success: true,
        data: response.data.kiosk,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Actualizar kiosk
  async actualizarKiosk(id: string, datos: Partial<KioskRegistrado>): Promise<{ success: boolean; data?: KioskRegistrado; error?: string }> {
    try {
      const response = await api.put(`/kiosk/${id}`, datos)
      return {
        success: true,
        data: response.data.kiosk,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Desactivar kiosk
  async desactivarKiosk(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post(`/kiosk/${id}/desactivar`)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Activar kiosk
  async activarKiosk(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post(`/kiosk/${id}/activar`)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Eliminar kiosk
  async eliminarKiosk(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.delete(`/kiosk/${id}`)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Generar QR para mesa
  async generarQRMesa(kioskId: string, mesaId: string): Promise<{ success: boolean; data?: { qrUrl: string; sessionUrl: string }; error?: string }> {
    try {
      const response = await api.post(`/kiosk/${kioskId}/generar-qr/${mesaId}`)
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

  // Obtener URL de acceso al kiosk
  getKioskUrl(kioskId: string, kioskSecret?: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_KIOSK_URL || 'http://localhost:3012'
    if (kioskSecret) {
      return `${baseUrl}?kioskId=${kioskId}&secret=${kioskSecret}`
    }
    return `${baseUrl}?kioskId=${kioskId}`
  }
}

export const kioskService = new KioskService()
