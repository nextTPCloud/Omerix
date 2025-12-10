// web/src/services/verifactu.service.ts

import {api} from './api'

// ============================================
// TIPOS
// ============================================

export interface ResultadoEnvioVeriFactu {
  exito: boolean
  codigo: string
  mensaje: string
  csv?: string
  fechaEnvio: string
  errores?: Array<{
    codigo: string
    descripcion: string
  }>
}

export interface EstadoConexionAEAT {
  conectado: boolean
  entorno: 'test' | 'production'
  mensaje: string
}

// ============================================
// SERVICIO
// ============================================

export const verifactuService = {
  /**
   * Enviar factura a AEAT
   */
  async enviarFactura(
    facturaId: string,
    options?: {
      certificadoId?: string
      entorno?: 'test' | 'production'
    }
  ): Promise<{ success: boolean; data: ResultadoEnvioVeriFactu; message: string }> {
    const response = await api.post(`/verifactu/facturas/${facturaId}/enviar`, options || {})
    return response.data
  },

  /**
   * Consultar estado de factura en AEAT
   */
  async consultarFactura(
    facturaId: string,
    entorno?: 'test' | 'production'
  ): Promise<{ success: boolean; data: ResultadoEnvioVeriFactu }> {
    const params = entorno ? `?entorno=${entorno}` : ''
    const response = await api.get(`/verifactu/facturas/${facturaId}/consultar${params}`)
    return response.data
  },

  /**
   * Dar de baja factura en AEAT
   */
  async bajaFactura(
    facturaId: string,
    motivo: string,
    options?: {
      certificadoId?: string
      entorno?: 'test' | 'production'
    }
  ): Promise<{ success: boolean; data: ResultadoEnvioVeriFactu; message: string }> {
    const response = await api.post(`/verifactu/facturas/${facturaId}/baja`, {
      motivo,
      ...options,
    })
    return response.data
  },

  /**
   * Verificar conexión con AEAT
   */
  async verificarConexion(
    entorno?: 'test' | 'production'
  ): Promise<{ success: boolean; data: EstadoConexionAEAT }> {
    const params = entorno ? `?entorno=${entorno}` : ''
    const response = await api.get(`/verifactu/conexion${params}`)
    return response.data
  },

  /**
   * Obtener URL de verificación para QR
   */
  async obtenerURLVerificacion(
    facturaId: string
  ): Promise<{
    success: boolean
    data: {
      url: string
      facturaId: string
      codigo: string
    }
  }> {
    const response = await api.get(`/verifactu/facturas/${facturaId}/url-verificacion`)
    return response.data
  },

  /**
   * Configurar entorno VeriFactu
   */
  async configurarEntorno(
    entorno: 'test' | 'production'
  ): Promise<{ success: boolean; data: { entorno: string }; message: string }> {
    const response = await api.post('/verifactu/entorno', { entorno })
    return response.data
  },
}

export default verifactuService
