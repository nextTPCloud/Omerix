import { api } from './api'
import {
  FacturaCompra,
  CreateFacturaCompraDTO,
  UpdateFacturaCompraDTO,
  FacturasCompraFilters,
  FacturasCompraResponse,
  FacturaCompraResponse,
  FacturaCompraEstadisticas,
  EstadoFacturaCompra,
  RegistrarPagoDTO,
} from '@/types/factura-compra.types'

export const facturasCompraService = {
  // ============================================
  // LISTAR FACTURAS DE COMPRA CON FILTROS Y PAGINACION
  // ============================================

  getAll: async (filters?: FacturasCompraFilters): Promise<FacturasCompraResponse> => {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.estado) params.append('estado', filters.estado)
    if (filters?.estados) params.append('estados', filters.estados)
    if (filters?.proveedorId) params.append('proveedorId', filters.proveedorId)
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo))
    if (filters?.contabilizada !== undefined) params.append('contabilizada', String(filters.contabilizada))
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.fechaVencimientoDesde) params.append('fechaVencimientoDesde', filters.fechaVencimientoDesde)
    if (filters?.fechaVencimientoHasta) params.append('fechaVencimientoHasta', filters.fechaVencimientoHasta)
    if (filters?.importeMin) params.append('importeMin', String(filters.importeMin))
    if (filters?.importeMax) params.append('importeMax', String(filters.importeMax))
    if (filters?.numeroFacturaProveedor) params.append('numeroFacturaProveedor', filters.numeroFacturaProveedor)
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

    const response = await api.get(`/facturas-compra?${params.toString()}`)
    return response.data
  },

  // ============================================
  // OBTENER FACTURA DE COMPRA POR ID
  // ============================================

  getById: async (id: string): Promise<FacturaCompraResponse> => {
    const response = await api.get(`/facturas-compra/${id}`)
    return response.data
  },

  // ============================================
  // CREAR FACTURA DE COMPRA
  // ============================================

  create: async (data: CreateFacturaCompraDTO): Promise<FacturaCompraResponse> => {
    const response = await api.post('/facturas-compra', data)
    return response.data
  },

  // ============================================
  // CREAR DESDE ALBARANES DE COMPRA
  // ============================================

  crearDesdeAlbaranes: async (
    albaranesCompraIds: string[],
    numeroFacturaProveedor: string,
    fechaFacturaProveedor: string
  ): Promise<FacturaCompraResponse> => {
    const response = await api.post('/facturas-compra/desde-albaranes', {
      albaranesCompraIds,
      numeroFacturaProveedor,
      fechaFacturaProveedor,
    })
    return response.data
  },

  // ============================================
  // ACTUALIZAR FACTURA DE COMPRA
  // ============================================

  update: async (id: string, data: UpdateFacturaCompraDTO): Promise<FacturaCompraResponse> => {
    const response = await api.put(`/facturas-compra/${id}`, data)
    return response.data
  },

  // ============================================
  // ELIMINAR FACTURA DE COMPRA
  // ============================================

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/facturas-compra/${id}`)
    return response.data
  },

  // ============================================
  // ELIMINAR MULTIPLES FACTURAS DE COMPRA
  // ============================================

  deleteMany: async (ids: string[]): Promise<{ success: boolean; message: string; data: { eliminados: number } }> => {
    const response = await api.post('/facturas-compra/bulk/delete', { ids })
    return response.data
  },

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  cambiarEstado: async (id: string, estado: EstadoFacturaCompra): Promise<FacturaCompraResponse> => {
    const response = await api.patch(`/facturas-compra/${id}/estado`, { estado })
    return response.data
  },

  // ============================================
  // REGISTRAR PAGO
  // ============================================

  registrarPago: async (id: string, pago: RegistrarPagoDTO): Promise<FacturaCompraResponse> => {
    const response = await api.post(`/facturas-compra/${id}/pago`, pago)
    return response.data
  },

  // ============================================
  // OBTENER ESTADISTICAS
  // ============================================

  getEstadisticas: async (): Promise<{ success: boolean; data: FacturaCompraEstadisticas }> => {
    const response = await api.get('/facturas-compra/estadisticas')
    return response.data
  },

  // ============================================
  // OBTENER FACTURAS POR PROVEEDOR
  // ============================================

  getByProveedor: async (proveedorId: string, filters?: FacturasCompraFilters): Promise<FacturasCompraResponse> => {
    return facturasCompraService.getAll({ ...filters, proveedorId })
  },

  // ============================================
  // OBTENER FACTURAS PENDIENTES DE PAGO
  // ============================================

  getPendientesPago: async (proveedorId?: string): Promise<FacturasCompraResponse> => {
    const params: FacturasCompraFilters = {
      estados: 'pendiente_pago,parcialmente_pagada,vencida',
    }
    if (proveedorId) params.proveedorId = proveedorId

    return facturasCompraService.getAll(params)
  },

  // ============================================
  // OBTENER FACTURAS VENCIDAS
  // ============================================

  getVencidas: async (proveedorId?: string): Promise<FacturasCompraResponse> => {
    const params: FacturasCompraFilters = {
      estado: 'vencida',
    }
    if (proveedorId) params.proveedorId = proveedorId

    return facturasCompraService.getAll(params)
  },
}

export default facturasCompraService
