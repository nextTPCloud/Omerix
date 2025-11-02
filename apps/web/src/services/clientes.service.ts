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
  // LISTAR CLIENTES CON FILTROS
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
  // BÚSQUEDA RÁPIDA
  // ============================================
  
  search: async (query: string): Promise<{ success: boolean; data: Cliente[] }> => {
    const response = await api.get(`/clientes/search?q=${encodeURIComponent(query)}`)
    return response.data
  },

  // ============================================
  // ESTADÍSTICAS
  // ============================================
  
  getEstadisticas: async (): Promise<{ success: boolean; data: EstadisticasClientes }> => {
    const response = await api.get('/clientes/estadisticas')
    return response.data
  },

  // ============================================
  // CLIENTES CON RIESGO EXCEDIDO
  // ============================================
  
  getConRiesgo: async (): Promise<{ success: boolean; data: Cliente[]; count: number }> => {
    const response = await api.get('/clientes/riesgo')
    return response.data
  },

  // ============================================
  // EXPORTAR A CSV
  // ============================================
  
  exportToCSV: async (): Promise<Blob> => {
    const response = await api.get('/clientes/export/csv', {
      responseType: 'blob',
    })
    return response.data
  },

  // ============================================
  // VERIFICAR NIF
  // ============================================
  
  verificarNIF: async (nif: string): Promise<{ success: boolean; existe: boolean }> => {
    const response = await api.get(`/clientes/verificar-nif/${nif}`)
    return response.data
  },
}