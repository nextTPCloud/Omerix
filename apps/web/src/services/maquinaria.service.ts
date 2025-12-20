import { api } from './api'
import {
  Maquinaria,
  CreateMaquinariaDTO,
  UpdateMaquinariaDTO,
  RegistrarMantenimientoDTO,
  MaquinariaResponse,
  MaquinariaDetailResponse,
  MaquinariaEstadisticas,
  MaquinariaAlertas,
  EstadoMaquinaria,
} from '@/types/maquinaria.types'

interface SearchParams {
  q?: string
  activo?: string
  tipo?: string
  estado?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class MaquinariaService {
  private readonly BASE_URL = '/maquinaria'

  async getAll(params?: SearchParams): Promise<MaquinariaResponse> {
    const response = await api.get<MaquinariaResponse>(this.BASE_URL, {
      params,
    })
    return response.data
  }

  async getById(id: string): Promise<MaquinariaDetailResponse> {
    const response = await api.get<MaquinariaDetailResponse>(`${this.BASE_URL}/${id}`)
    return response.data
  }

  async create(data: CreateMaquinariaDTO): Promise<MaquinariaDetailResponse> {
    const response = await api.post<MaquinariaDetailResponse>(this.BASE_URL, data)
    return response.data
  }

  async update(id: string, data: UpdateMaquinariaDTO): Promise<MaquinariaDetailResponse> {
    const response = await api.put<MaquinariaDetailResponse>(`${this.BASE_URL}/${id}`, data)
    return response.data
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(
      `${this.BASE_URL}/${id}`
    )
    return response.data
  }

  async deleteMany(ids: string[]): Promise<{ success: boolean; message: string; eliminados: number }> {
    const response = await api.post<{ success: boolean; message: string; eliminados: number }>(
      `${this.BASE_URL}/bulk/delete`,
      { ids }
    )
    return response.data
  }

  async getActivas(): Promise<{ success: boolean; data: Maquinaria[] }> {
    const response = await api.get<{ success: boolean; data: Maquinaria[] }>(
      `${this.BASE_URL}/activas`
    )
    return response.data
  }

  async getDisponibles(): Promise<{ success: boolean; data: Maquinaria[] }> {
    const response = await api.get<{ success: boolean; data: Maquinaria[] }>(
      `${this.BASE_URL}/disponibles`
    )
    return response.data
  }

  async getEstadisticas(): Promise<{ success: boolean; data: MaquinariaEstadisticas }> {
    const response = await api.get<{ success: boolean; data: MaquinariaEstadisticas }>(
      `${this.BASE_URL}/estadisticas`
    )
    return response.data
  }

  async getAlertas(): Promise<{ success: boolean; data: MaquinariaAlertas }> {
    const response = await api.get<{ success: boolean; data: MaquinariaAlertas }>(
      `${this.BASE_URL}/alertas`
    )
    return response.data
  }

  async registrarMantenimiento(id: string, data: RegistrarMantenimientoDTO): Promise<MaquinariaDetailResponse> {
    const response = await api.post<MaquinariaDetailResponse>(
      `${this.BASE_URL}/${id}/mantenimiento`,
      data
    )
    return response.data
  }

  async cambiarEstado(id: string, estado: EstadoMaquinaria): Promise<MaquinariaDetailResponse> {
    const response = await api.patch<MaquinariaDetailResponse>(
      `${this.BASE_URL}/${id}/estado`,
      { estado }
    )
    return response.data
  }

  async duplicar(id: string): Promise<MaquinariaDetailResponse> {
    const response = await api.post<MaquinariaDetailResponse>(`${this.BASE_URL}/${id}/duplicar`)
    return response.data
  }

  async searchCodigos(prefix: string): Promise<string[]> {
    try {
      const response = await api.get<{ success: boolean; data: string[] }>(
        `${this.BASE_URL}/codigos`,
        { params: { prefix } }
      )
      return response.data.data
    } catch (error) {
      console.error('Error al buscar codigos:', error)
      return []
    }
  }
}

export const maquinariaService = new MaquinariaService()
