import { api } from './api'
import {
  AlbaranCompra,
  CreateAlbaranCompraDTO,
  UpdateAlbaranCompraDTO,
  AlbaranesCompraFilters,
  AlbaranesCompraResponse,
  AlbaranCompraResponse,
  AlbaranCompraEstadisticas,
  EstadoAlbaranCompra,
} from '@/types/albaran-compra.types'

export const albaranesCompraService = {
  // ============================================
  // LISTAR ALBARANES DE COMPRA CON FILTROS Y PAGINACION
  // ============================================

  getAll: async (filters?: AlbaranesCompraFilters): Promise<AlbaranesCompraResponse> => {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.estado) params.append('estado', filters.estado)
    if (filters?.proveedorId) params.append('proveedorId', filters.proveedorId)
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo))
    if (filters?.facturado !== undefined) params.append('facturado', String(filters.facturado))
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.fechaRecepcionDesde) params.append('fechaRecepcionDesde', filters.fechaRecepcionDesde)
    if (filters?.fechaRecepcionHasta) params.append('fechaRecepcionHasta', filters.fechaRecepcionHasta)
    if (filters?.importeMinimo) params.append('importeMinimo', String(filters.importeMinimo))
    if (filters?.importeMaximo) params.append('importeMaximo', String(filters.importeMaximo))
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

    // Anadir filtros avanzados si existen
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (key.includes('_') && value !== undefined && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await api.get(`/albaranes-compra?${params.toString()}`)
    return response.data
  },

  // ============================================
  // OBTENER ALBARAN DE COMPRA POR ID
  // ============================================

  getById: async (id: string): Promise<AlbaranCompraResponse> => {
    const response = await api.get(`/albaranes-compra/${id}`)
    return response.data
  },

  // ============================================
  // CREAR ALBARAN DE COMPRA
  // ============================================

  create: async (data: CreateAlbaranCompraDTO): Promise<AlbaranCompraResponse> => {
    const response = await api.post('/albaranes-compra', data)
    return response.data
  },

  // ============================================
  // CREAR DESDE PEDIDO DE COMPRA
  // ============================================

  crearDesdePedido: async (pedidoCompraId: string): Promise<AlbaranCompraResponse> => {
    const response = await api.post('/albaranes-compra/desde-pedido', { pedidoCompraId })
    return response.data
  },

  // ============================================
  // ACTUALIZAR ALBARAN DE COMPRA
  // ============================================

  update: async (id: string, data: UpdateAlbaranCompraDTO): Promise<AlbaranCompraResponse> => {
    const response = await api.put(`/albaranes-compra/${id}`, data)
    return response.data
  },

  // ============================================
  // ELIMINAR ALBARAN DE COMPRA
  // ============================================

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/albaranes-compra/${id}`)
    return response.data
  },

  // ============================================
  // ELIMINAR MULTIPLES ALBARANES DE COMPRA
  // ============================================

  deleteMany: async (ids: string[]): Promise<{ success: boolean; message: string; data: { eliminados: number } }> => {
    const response = await api.post('/albaranes-compra/bulk/delete', { ids })
    return response.data
  },

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  cambiarEstado: async (id: string, estado: EstadoAlbaranCompra): Promise<AlbaranCompraResponse> => {
    const response = await api.patch(`/albaranes-compra/${id}/estado`, { estado })
    return response.data
  },

  // ============================================
  // REGISTRAR RECEPCION
  // ============================================

  registrarRecepcion: async (
    id: string,
    recepcion: {
      lineas: Array<{
        lineaId: string
        cantidadRecibida: number
        almacenId?: string
        lote?: string
        numeroSerie?: string
      }>
      fechaRecepcion?: string
      observaciones?: string
    }
  ): Promise<AlbaranCompraResponse> => {
    const response = await api.post(`/albaranes-compra/${id}/recepcion`, recepcion)
    return response.data
  },

  // ============================================
  // DUPLICAR ALBARAN DE COMPRA
  // ============================================

  duplicar: async (id: string): Promise<AlbaranCompraResponse> => {
    const response = await api.post(`/albaranes-compra/${id}/duplicar`)
    return response.data
  },

  // ============================================
  // OBTENER ESTADISTICAS
  // ============================================

  getEstadisticas: async (): Promise<{ success: boolean; data: AlbaranCompraEstadisticas }> => {
    const response = await api.get('/albaranes-compra/estadisticas')
    return response.data
  },

  // ============================================
  // OBTENER ALBARANES POR PROVEEDOR
  // ============================================

  getByProveedor: async (proveedorId: string, filters?: AlbaranesCompraFilters): Promise<AlbaranesCompraResponse> => {
    return albaranesCompraService.getAll({ ...filters, proveedorId })
  },

  // ============================================
  // OBTENER ALBARANES PENDIENTES DE FACTURAR
  // ============================================

  getPendientesFacturar: async (proveedorId?: string): Promise<AlbaranesCompraResponse> => {
    const params = new URLSearchParams()
    params.append('facturado', 'false')
    params.append('estado', 'recibido')
    if (proveedorId) params.append('proveedorId', proveedorId)

    const response = await api.get(`/albaranes-compra?${params.toString()}`)
    return response.data
  },
}

export default albaranesCompraService
