import { api } from './api'
import {
  PedidoCompra,
  CreatePedidoCompraDTO,
  UpdatePedidoCompraDTO,
  PedidosCompraFilters,
  PedidosCompraResponse,
  PedidoCompraResponse,
  PedidoCompraEstadisticas,
  EstadoPedidoCompra,
} from '@/types/pedido-compra.types'

export const pedidosCompraService = {
  // ============================================
  // LISTAR PEDIDOS DE COMPRA CON FILTROS Y PAGINACION
  // ============================================

  getAll: async (filters?: PedidosCompraFilters): Promise<PedidosCompraResponse> => {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.estado) params.append('estado', filters.estado)
    if (filters?.prioridad) params.append('prioridad', filters.prioridad)
    if (filters?.proveedorId) params.append('proveedorId', filters.proveedorId)
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo))
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.fechaEntregaDesde) params.append('fechaEntregaDesde', filters.fechaEntregaDesde)
    if (filters?.fechaEntregaHasta) params.append('fechaEntregaHasta', filters.fechaEntregaHasta)
    if (filters?.importeMinimo) params.append('importeMinimo', String(filters.importeMinimo))
    if (filters?.importeMaximo) params.append('importeMaximo', String(filters.importeMaximo))
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

    const response = await api.get(`/pedidos-compra?${params.toString()}`)
    return response.data
  },

  // ============================================
  // OBTENER PEDIDO DE COMPRA POR ID
  // ============================================

  getById: async (id: string): Promise<PedidoCompraResponse> => {
    const response = await api.get(`/pedidos-compra/${id}`)
    return response.data
  },

  // ============================================
  // OBTENER PEDIDO DE COMPRA POR CODIGO
  // ============================================

  getByCodigo: async (codigo: string): Promise<PedidoCompraResponse> => {
    const response = await api.get(`/pedidos-compra/codigo/${codigo}`)
    return response.data
  },

  // ============================================
  // CREAR PEDIDO DE COMPRA
  // ============================================

  create: async (data: CreatePedidoCompraDTO): Promise<PedidoCompraResponse> => {
    const response = await api.post('/pedidos-compra', data)
    return response.data
  },

  // ============================================
  // ACTUALIZAR PEDIDO DE COMPRA
  // ============================================

  update: async (id: string, data: UpdatePedidoCompraDTO): Promise<PedidoCompraResponse> => {
    const response = await api.put(`/pedidos-compra/${id}`, data)
    return response.data
  },

  // ============================================
  // ELIMINAR PEDIDO DE COMPRA
  // ============================================

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/pedidos-compra/${id}`)
    return response.data
  },

  // ============================================
  // ELIMINAR MULTIPLES PEDIDOS DE COMPRA
  // ============================================

  deleteMany: async (ids: string[]): Promise<{ success: boolean; message: string; data: { eliminados: number } }> => {
    const response = await api.post('/pedidos-compra/bulk/delete', { ids })
    return response.data
  },

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  cambiarEstado: async (id: string, estado: EstadoPedidoCompra): Promise<PedidoCompraResponse> => {
    const response = await api.patch(`/pedidos-compra/${id}/estado`, { estado })
    return response.data
  },

  // ============================================
  // REGISTRAR RECEPCION
  // ============================================

  registrarRecepcion: async (
    id: string,
    lineaId: string,
    cantidadRecibida: number
  ): Promise<PedidoCompraResponse> => {
    const response = await api.post(`/pedidos-compra/${id}/recepcion`, {
      lineaId,
      cantidadRecibida,
    })
    return response.data
  },

  // ============================================
  // DUPLICAR PEDIDO DE COMPRA
  // ============================================

  duplicar: async (id: string): Promise<PedidoCompraResponse> => {
    const response = await api.post(`/pedidos-compra/${id}/duplicar`)
    return response.data
  },

  // ============================================
  // OBTENER ESTADISTICAS
  // ============================================

  getEstadisticas: async (): Promise<{ success: boolean; data: PedidoCompraEstadisticas }> => {
    const response = await api.get('/pedidos-compra/estadisticas')
    return response.data
  },
}

export default pedidosCompraService
