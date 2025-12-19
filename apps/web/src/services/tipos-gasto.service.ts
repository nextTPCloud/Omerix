import { api } from './api'
import {
  TipoGasto,
  CreateTipoGastoDTO,
  UpdateTipoGastoDTO,
  TiposGastoResponse,
  TipoGastoResponse,
} from '@/types/tipo-gasto.types'

interface SearchParams {
  q?: string
  activo?: string
  categoria?: string
  facturable?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class TiposGastoService {
  private readonly BASE_URL = '/tipos-gasto'

  async getAll(params?: SearchParams): Promise<TiposGastoResponse> {
    const response = await api.get<TiposGastoResponse>(this.BASE_URL, {
      params,
    })
    return response.data
  }

  async getById(id: string): Promise<TipoGastoResponse> {
    const response = await api.get<TipoGastoResponse>(`${this.BASE_URL}/${id}`)
    return response.data
  }

  async create(data: CreateTipoGastoDTO): Promise<TipoGastoResponse> {
    const response = await api.post<TipoGastoResponse>(this.BASE_URL, data)
    return response.data
  }

  async update(id: string, data: UpdateTipoGastoDTO): Promise<TipoGastoResponse> {
    const response = await api.put<TipoGastoResponse>(`${this.BASE_URL}/${id}`, data)
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

  async getActivos(): Promise<{ success: boolean; data: TipoGasto[] }> {
    const response = await api.get<{ success: boolean; data: TipoGasto[] }>(
      `${this.BASE_URL}/activos`
    )
    return response.data
  }

  async duplicar(id: string): Promise<TipoGastoResponse> {
    const response = await api.post<TipoGastoResponse>(`${this.BASE_URL}/${id}/duplicar`)
    return response.data
  }
}

export const tiposGastoService = new TiposGastoService()
