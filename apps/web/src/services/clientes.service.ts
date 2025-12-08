import { api } from './api'
import {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
  ClientesFilters,
  ClientesListResponse,
  ClienteDetailResponse,
  EstadisticasClientes,
} from '@/types/cliente.types'

export const clientesService = {
  // ============================================
  // LISTAR CLIENTES CON FILTROS Y PAGINACIÓN
  // ============================================
  
  getAll: async (filters?: ClientesFilters): Promise<ClientesListResponse> => {
    const params = new URLSearchParams()
    
    if (filters?.search) params.append('search', filters.search)
    if (filters?.tipoCliente) params.append('tipoCliente', filters.tipoCliente)
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo))
    if (filters?.formaPago) params.append('formaPago', filters.formaPago)
    if (filters?.categoriaId) params.append('categoriaId', filters.categoriaId)
    if (filters?.vendedorId) params.append('vendedorId', filters.vendedorId)
    if (filters?.zona) params.append('zona', filters.zona)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

    const response = await api.get(`/clientes?${params.toString()}`)
    return response.data
  },

  // ============================================
  // OBTENER CLIENTE POR ID
  // ============================================
  
  getById: async (id: string): Promise<ClienteDetailResponse> => {
    const response = await api.get(`/clientes/${id}`)
    return response.data
  },

  // ============================================
  // CREAR CLIENTE
  // ============================================
  
  create: async (data: CreateClienteDTO): Promise<ClienteDetailResponse> => {
    const response = await api.post('/clientes', data)
    return response.data
  },

  // ============================================
  // ACTUALIZAR CLIENTE
  // ============================================
  
  update: async (id: string, data: UpdateClienteDTO): Promise<ClienteDetailResponse> => {
    const response = await api.put(`/clientes/${id}`, data)
    return response.data
  },

  // ============================================
  // DESACTIVAR CLIENTE (SOFT DELETE)
  // ============================================
  
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/clientes/${id}`)
    return response.data
  },

  // ============================================
  // ELIMINAR MÚLTIPLES CLIENTES
  // ============================================
  
  deleteMany: async (ids: string[]): Promise<{ success: boolean; message: string; count: number }> => {
    const response = await api.post('/clientes/delete-many', { ids })
    return response.data
  },

  // ============================================
  // ACTIVAR/REACTIVAR CLIENTE
  // ============================================
  
  activate: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/clientes/${id}/activate`)
    return response.data
  },

  // ============================================
  // BÚSQUEDA RÁPIDA
  // ============================================
  
  search: async (query: string): Promise<{ success: boolean; data: Cliente[] }> => {
    const response = await api.get(`/clientes/search?q=${encodeURIComponent(query)}`)
    return response.data
  },

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================
  
  getStats: async (): Promise<{ success: boolean; data: EstadisticasClientes }> => {
    const response = await api.get('/clientes/stats')
    return response.data
  },

  // ============================================
  // EXPORTAR A CSV
  // ============================================
  
  exportToCSV: async (filters?: ClientesFilters): Promise<Blob> => {
    const params = new URLSearchParams()
    
    if (filters?.search) params.append('search', filters.search)
    if (filters?.tipoCliente) params.append('tipoCliente', filters.tipoCliente)
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo))
    if (filters?.formaPago) params.append('formaPago', filters.formaPago)

    const response = await api.get(`/clientes/export/csv?${params.toString()}`, {
      responseType: 'blob',
    })
    return response.data
  },

  // ============================================
  // EXPORTAR A EXCEL
  // ============================================
  
  exportToExcel: async (filters?: ClientesFilters): Promise<Blob> => {
    const params = new URLSearchParams()
    
    if (filters?.search) params.append('search', filters.search)
    if (filters?.tipoCliente) params.append('tipoCliente', filters.tipoCliente)
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo))

    const response = await api.get(`/clientes/export/excel?${params.toString()}`, {
      responseType: 'blob',
    })
    return response.data
  },

  // ============================================
  // EXPORTAR DOMICILIACIÓN SEPA
  // ============================================
  
  exportSEPA: async (clienteIds: string[]): Promise<Blob> => {
    const response = await api.post(
      '/clientes/export/sepa',
      { clienteIds },
      { responseType: 'blob' }
    )
    return response.data
  },

  // ============================================
  // SUBIR ARCHIVO A CLIENTE
  // ============================================
  
  uploadFile: async (
    clienteId: string,
    file: File
  ): Promise<{ success: boolean; data: any }> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post(`/clientes/${clienteId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // ============================================
  // ELIMINAR ARCHIVO DE CLIENTE
  // ============================================
  
  deleteFile: async (
    clienteId: string,
    fileId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/clientes/${clienteId}/files/${fileId}`)
    return response.data
  },

  // ============================================
  // OBTENER ARCHIVOS DE CLIENTE
  // ============================================
  
  getFiles: async (clienteId: string): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(`/clientes/${clienteId}/files`)
    return response.data
  },

  // ============================================
  // CALCULAR RIESGO ACTUAL
  // ============================================
  
  calculateRiesgo: async (clienteId: string): Promise<{ 
    success: boolean
    data: {
      riesgoActual: number
      limiteCredito: number
      riesgoDisponible: number
      porcentajeUtilizado: number
    }
  }> => {
    const response = await api.get(`/clientes/${clienteId}/riesgo`)
    return response.data
  },

  // ============================================
  // OBTENER HISTORIAL DE TRANSACCIONES
  // ============================================
  
  getTransactions: async (
    clienteId: string,
    params?: {
      tipo?: 'pedido' | 'albaran' | 'factura'
      desde?: string
      hasta?: string
      page?: number
      limit?: number
    }
  ): Promise<{
    success: boolean
    data: any[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> => {
    const queryParams = new URLSearchParams()
    
    if (params?.tipo) queryParams.append('tipo', params.tipo)
    if (params?.desde) queryParams.append('desde', params.desde)
    if (params?.hasta) queryParams.append('hasta', params.hasta)
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.limit) queryParams.append('limit', String(params.limit))

    const response = await api.get(
      `/clientes/${clienteId}/transactions?${queryParams.toString()}`
    )
    return response.data
  },

  // ============================================
  // OBTENER VENCIMIENTOS PENDIENTES
  // ============================================
  
  getPendingPayments: async (clienteId: string): Promise<{
    success: boolean
    data: {
      total: number
      vencido: number
      porVencer: number
      detalles: any[]
    }
  }> => {
    const response = await api.get(`/clientes/${clienteId}/vencimientos`)
    return response.data
  },

  // ============================================
  // VERIFICAR NIF DUPLICADO
  // ============================================

  checkNIF: async (nif: string, excludeId?: string): Promise<{
    success: boolean
    exists: boolean
    message?: string
  }> => {
    const params = new URLSearchParams({ nif })
    if (excludeId) params.append('excludeId', excludeId)

    const response = await api.get(`/clientes/check-nif?${params.toString()}`)
    return response.data
  },

  // ============================================
  // SUGERIR SIGUIENTE CÓDIGO
  // ============================================

  sugerirSiguienteCodigo: async (prefijo?: string): Promise<{
    success: boolean
    data: { codigo: string }
  }> => {
    const params = new URLSearchParams()
    if (prefijo) params.append('prefijo', prefijo)

    const response = await api.get(`/clientes/sugerir-codigo?${params.toString()}`)
    return response.data
  },

  // ============================================
  // DUPLICAR CLIENTE
  // ============================================

  duplicar: async (id: string): Promise<ClienteDetailResponse> => {
    const response = await api.post(`/clientes/${id}/duplicar`)
    return response.data
  },

  // ============================================
  // OBTENER DESCUENTOS POR FAMILIA
  // ============================================

  getDescuentos: async (id: string): Promise<{
    success: boolean
    data: {
      descuentoGeneral: number
      aplicarDescuentoAutomatico: boolean
      descuentosPorFamilia: Array<{
        familiaId: string
        nombreFamilia?: string
        descuento: number
      }>
    }
  }> => {
    const response = await api.get(`/clientes/${id}/descuentos`)
    return response.data
  },

  // ============================================
  // ACTUALIZAR DESCUENTOS
  // ============================================

  actualizarDescuentos: async (id: string, data: {
    descuentoGeneral?: number
    aplicarDescuentoAutomatico?: boolean
    descuentosPorFamilia?: Array<{
      familiaId: string
      nombreFamilia?: string
      descuento: number
    }>
  }): Promise<{
    success: boolean
    data: {
      descuentoGeneral: number
      aplicarDescuentoAutomatico: boolean
      descuentosPorFamilia: Array<{
        familiaId: string
        nombreFamilia?: string
        descuento: number
      }>
    }
    message?: string
  }> => {
    const response = await api.put(`/clientes/${id}/descuentos`, data)
    return response.data
  },
}

// Exportar también como default para compatibilidad
export default clientesService

// Re-exportar tipos para facilitar las importaciones
export type { Cliente, CreateClienteDTO, UpdateClienteDTO, ClientesFilters }