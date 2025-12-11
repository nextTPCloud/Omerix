import { api } from './api'
import {
  Proveedor,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  ProveedoresFilters,
  ProveedoresResponse,
  ProveedorResponse,
  ProveedorEstadisticas,
  ProveedorSelector,
} from '@/types/proveedor.types'

export const proveedoresService = {
  // ============================================
  // LISTAR PROVEEDORES CON FILTROS Y PAGINACIÓN
  // ============================================

  getAll: async (filters?: ProveedoresFilters): Promise<ProveedoresResponse> => {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.tipoProveedor) params.append('tipoProveedor', filters.tipoProveedor)
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo))
    if (filters?.formaPagoId) params.append('formaPagoId', filters.formaPagoId)
    if (filters?.terminoPagoId) params.append('terminoPagoId', filters.terminoPagoId)
    if (filters?.categoriaId) params.append('categoriaId', filters.categoriaId)
    if (filters?.zona) params.append('zona', filters.zona)
    if (filters?.calificacionMinima) params.append('calificacionMinima', String(filters.calificacionMinima))
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

    const response = await api.get(`/proveedores?${params.toString()}`)
    return response.data
  },

  // ============================================
  // OBTENER PROVEEDOR POR ID
  // ============================================

  getById: async (id: string): Promise<ProveedorResponse> => {
    const response = await api.get(`/proveedores/${id}`)
    return response.data
  },

  // ============================================
  // OBTENER PROVEEDOR POR CÓDIGO
  // ============================================

  getByCodigo: async (codigo: string): Promise<ProveedorResponse> => {
    const response = await api.get(`/proveedores/codigo/${codigo}`)
    return response.data
  },

  // ============================================
  // CREAR PROVEEDOR
  // ============================================

  create: async (data: CreateProveedorDTO): Promise<ProveedorResponse> => {
    const response = await api.post('/proveedores', data)
    return response.data
  },

  // ============================================
  // ACTUALIZAR PROVEEDOR
  // ============================================

  update: async (id: string, data: UpdateProveedorDTO): Promise<ProveedorResponse> => {
    const response = await api.put(`/proveedores/${id}`, data)
    return response.data
  },

  // ============================================
  // ELIMINAR PROVEEDOR
  // ============================================

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/proveedores/${id}`)
    return response.data
  },

  // ============================================
  // ELIMINAR MÚLTIPLES PROVEEDORES
  // ============================================

  deleteMany: async (ids: string[]): Promise<{ success: boolean; message: string; data: { eliminados: number } }> => {
    const response = await api.post('/proveedores/bulk/delete', { ids })
    return response.data
  },

  // ============================================
  // TOGGLE ESTADO
  // ============================================

  toggleEstado: async (id: string): Promise<ProveedorResponse> => {
    const response = await api.patch(`/proveedores/${id}/toggle-estado`)
    return response.data
  },

  // ============================================
  // ACTIVAR/DESACTIVAR MÚLTIPLES
  // ============================================

  setEstadoMultiples: async (ids: string[], activo: boolean): Promise<{ success: boolean; message: string; data: { modificados: number } }> => {
    const response = await api.post('/proveedores/bulk/estado', { ids, activo })
    return response.data
  },

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================

  getEstadisticas: async (): Promise<{ success: boolean; data: ProveedorEstadisticas }> => {
    const response = await api.get('/proveedores/estadisticas')
    return response.data
  },

  // ============================================
  // BÚSQUEDA PARA SELECTOR (AUTOCOMPLETADO)
  // ============================================

  buscarParaSelector: async (search: string, limit: number = 10): Promise<{ success: boolean; data: ProveedorSelector[] }> => {
    const params = new URLSearchParams()
    params.append('search', search)
    params.append('limit', String(limit))

    const response = await api.get(`/proveedores/selector?${params.toString()}`)
    return response.data
  },
}

export default proveedoresService
