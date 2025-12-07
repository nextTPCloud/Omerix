import { api } from './api'
import {
  FormaPago,
  CreateFormaPagoDTO,
  UpdateFormaPagoDTO,
  FormasPagoResponse,
  FormaPagoResponse,
} from '@/types/forma-pago.types'

interface SearchParams {
  q?: string
  activo?: string
  tipo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class FormasPagoService {
  private readonly BASE_URL = '/formas-pago'

  async getAll(params?: SearchParams): Promise<FormasPagoResponse> {
    const response = await api.get<FormasPagoResponse>(this.BASE_URL, {
      params,
    })
    return response.data
  }

  async getById(id: string): Promise<FormaPagoResponse> {
    const response = await api.get<FormaPagoResponse>(`${this.BASE_URL}/${id}`)
    return response.data
  }

  async create(data: CreateFormaPagoDTO): Promise<FormaPagoResponse> {
    const response = await api.post<FormaPagoResponse>(this.BASE_URL, data)
    return response.data
  }

  async update(id: string, data: UpdateFormaPagoDTO): Promise<FormaPagoResponse> {
    const response = await api.put<FormaPagoResponse>(`${this.BASE_URL}/${id}`, data)
    return response.data
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(
      `${this.BASE_URL}/${id}`
    )
    return response.data
  }

  async getActivas(): Promise<{ success: boolean; data: FormaPago[] }> {
    const response = await api.get<{ success: boolean; data: FormaPago[] }>(
      `${this.BASE_URL}/activas`
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

  async duplicar(id: string): Promise<FormaPagoResponse> {
    const response = await api.post<FormaPagoResponse>(`${this.BASE_URL}/${id}/duplicar`)
    return response.data
  }
}

export const formasPagoService = new FormasPagoService()
