import { api } from './api'
import {
  TerminoPago,
  CreateTerminoPagoDTO,
  UpdateTerminoPagoDTO,
  TerminosPagoResponse,
  TerminoPagoResponse,
} from '@/types/termino-pago.types'

interface SearchParams {
  q?: string
  activo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class TerminosPagoService {
  private readonly BASE_URL = '/terminos-pago'

  async getAll(params?: SearchParams): Promise<TerminosPagoResponse> {
    const response = await api.get<TerminosPagoResponse>(this.BASE_URL, {
      params,
    })
    return response.data
  }

  async getById(id: string): Promise<TerminoPagoResponse> {
    const response = await api.get<TerminoPagoResponse>(`${this.BASE_URL}/${id}`)
    return response.data
  }

  async create(data: CreateTerminoPagoDTO): Promise<TerminoPagoResponse> {
    const response = await api.post<TerminoPagoResponse>(this.BASE_URL, data)
    return response.data
  }

  async update(id: string, data: UpdateTerminoPagoDTO): Promise<TerminoPagoResponse> {
    const response = await api.put<TerminoPagoResponse>(`${this.BASE_URL}/${id}`, data)
    return response.data
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(
      `${this.BASE_URL}/${id}`
    )
    return response.data
  }

  async getActivos(): Promise<{ success: boolean; data: TerminoPago[] }> {
    const response = await api.get<{ success: boolean; data: TerminoPago[] }>(
      `${this.BASE_URL}/activos`
    )
    return response.data
  }

  async searchCodigos(prefix: string): Promise<string[]> {
    const response = await api.get<{ success: boolean; data: string[] }>(
      `${this.BASE_URL}/codigos`,
      { params: { prefix } }
    )
    return response.data.data
  }

  async duplicar(id: string): Promise<TerminoPagoResponse> {
    const response = await api.post<TerminoPagoResponse>(`${this.BASE_URL}/${id}/duplicar`)
    return response.data
  }
}

export const terminosPagoService = new TerminosPagoService()
