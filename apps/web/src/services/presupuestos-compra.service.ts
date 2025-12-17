import { api } from './api'
import {
  PresupuestoCompra,
  CreatePresupuestoCompraDTO,
  UpdatePresupuestoCompraDTO,
  PresupuestosCompraFilters,
  PresupuestosCompraResponse,
  PresupuestoCompraResponse,
  PresupuestoCompraEstadisticas,
  EstadoPresupuestoCompra,
} from '@/types/presupuesto-compra.types'

export const presupuestosCompraService = {
  // ============================================
  // LISTAR PRESUPUESTOS DE COMPRA CON FILTROS Y PAGINACION
  // ============================================

  getAll: async (filters?: PresupuestosCompraFilters): Promise<PresupuestosCompraResponse> => {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.estado) params.append('estado', filters.estado)
    if (filters?.estados) params.append('estados', filters.estados)
    if (filters?.prioridad) params.append('prioridad', filters.prioridad)
    if (filters?.proveedorId) params.append('proveedorId', filters.proveedorId)
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo))
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.fechaValidezDesde) params.append('fechaValidezDesde', filters.fechaValidezDesde)
    if (filters?.fechaValidezHasta) params.append('fechaValidezHasta', filters.fechaValidezHasta)
    if (filters?.importeMinimo) params.append('importeMinimo', String(filters.importeMinimo))
    if (filters?.importeMaximo) params.append('importeMaximo', String(filters.importeMaximo))
    if (filters?.tags) params.append('tags', filters.tags)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

    // Añadir filtros avanzados si existen
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (key.includes('_') && value !== undefined && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await api.get(`/presupuestos-compra?${params.toString()}`)
    return response.data
  },

  // ============================================
  // OBTENER PRESUPUESTO DE COMPRA POR ID
  // ============================================

  getById: async (id: string): Promise<PresupuestoCompraResponse> => {
    const response = await api.get(`/presupuestos-compra/${id}`)
    return response.data
  },

  // ============================================
  // OBTENER PRESUPUESTO DE COMPRA POR CODIGO
  // ============================================

  getByCodigo: async (codigo: string): Promise<PresupuestoCompraResponse> => {
    const response = await api.get(`/presupuestos-compra/codigo/${codigo}`)
    return response.data
  },

  // ============================================
  // CREAR PRESUPUESTO DE COMPRA
  // ============================================

  create: async (data: CreatePresupuestoCompraDTO): Promise<PresupuestoCompraResponse> => {
    const response = await api.post('/presupuestos-compra', data)
    return response.data
  },

  // ============================================
  // ACTUALIZAR PRESUPUESTO DE COMPRA
  // ============================================

  update: async (id: string, data: UpdatePresupuestoCompraDTO): Promise<PresupuestoCompraResponse> => {
    const response = await api.put(`/presupuestos-compra/${id}`, data)
    return response.data
  },

  // ============================================
  // ELIMINAR PRESUPUESTO DE COMPRA
  // ============================================

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/presupuestos-compra/${id}`)
    return response.data
  },

  // ============================================
  // ELIMINAR MULTIPLES PRESUPUESTOS DE COMPRA
  // ============================================

  deleteMany: async (ids: string[]): Promise<{ success: boolean; message: string; data: { eliminados: number } }> => {
    const response = await api.post('/presupuestos-compra/bulk/delete', { ids })
    return response.data
  },

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  cambiarEstado: async (
    id: string,
    estado: EstadoPresupuestoCompra,
    motivoRechazo?: string
  ): Promise<PresupuestoCompraResponse> => {
    const response = await api.patch(`/presupuestos-compra/${id}/estado`, { estado, motivoRechazo })
    return response.data
  },

  // ============================================
  // CONVERTIR A PEDIDO DE COMPRA
  // ============================================

  convertirAPedido: async (
    id: string,
    opciones?: {
      lineasIds?: string[]
      fechaEntregaPrevista?: string
      observaciones?: string
    }
  ): Promise<{
    success: boolean
    data: { presupuesto: PresupuestoCompra; pedido: any }
    message: string
  }> => {
    const response = await api.post(`/presupuestos-compra/${id}/convertir`, opciones || {})
    return response.data
  },

  // ============================================
  // DUPLICAR PRESUPUESTO DE COMPRA
  // ============================================

  duplicar: async (id: string): Promise<PresupuestoCompraResponse> => {
    const response = await api.post(`/presupuestos-compra/${id}/duplicar`)
    return response.data
  },

  // ============================================
  // OBTENER ESTADISTICAS
  // ============================================

  getEstadisticas: async (): Promise<{ success: boolean; data: PresupuestoCompraEstadisticas }> => {
    const response = await api.get('/presupuestos-compra/estadisticas')
    return response.data
  },

  // ============================================
  // OBTENER ALERTAS
  // ============================================

  getAlertas: async (diasAlerta: number = 7): Promise<{
    success: boolean
    data: {
      alertas: {
        pendientesAceptar: PresupuestoCompra[]
        proximosExpirar: PresupuestoCompra[]
        expirados: PresupuestoCompra[]
      }
      resumen: {
        pendientesAceptar: number
        proximosExpirar: number
        expirados: number
        total: number
      }
    }
  }> => {
    const response = await api.get(`/presupuestos-compra/alertas?diasAlerta=${diasAlerta}`)
    return response.data
  },
}

export default presupuestosCompraService
