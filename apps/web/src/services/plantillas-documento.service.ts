// Servicio para gestión de Plantillas de Documentos

import { api } from './api'
import {
  PlantillaDocumento,
  CreatePlantillaDTO,
  UpdatePlantillaDTO,
  PlantillasResponse,
  PlantillaResponse,
  SearchPlantillasParams,
  EstilosResponse,
  TiposDocumentoResponse,
  TipoDocumentoPlantilla,
} from '@/types/plantilla-documento.types'

class PlantillasDocumentoService {
  private baseUrl = '/plantillas-documento'

  /**
   * Obtener todas las plantillas con filtros opcionales
   */
  async getAll(params?: SearchPlantillasParams): Promise<PlantillasResponse> {
    const response = await api.get<PlantillasResponse>(this.baseUrl, { params })
    return response.data
  }

  /**
   * Obtener una plantilla por ID
   */
  async getById(id: string): Promise<PlantillaResponse> {
    const response = await api.get<PlantillaResponse>(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Obtener plantillas por tipo de documento
   */
  async getByTipo(tipoDocumento: TipoDocumentoPlantilla): Promise<PlantillasResponse> {
    const response = await api.get<PlantillasResponse>(`${this.baseUrl}/tipo/${tipoDocumento}`)
    return { ...response.data, data: response.data.data || [] }
  }

  /**
   * Obtener plantilla predeterminada por tipo de documento
   */
  async getPredeterminada(tipoDocumento: TipoDocumentoPlantilla): Promise<PlantillaResponse> {
    const response = await api.get<PlantillaResponse>(`${this.baseUrl}/predeterminada/${tipoDocumento}`)
    return response.data
  }

  /**
   * Obtener estilos disponibles
   */
  async getEstilos(): Promise<EstilosResponse> {
    const response = await api.get<EstilosResponse>(`${this.baseUrl}/estilos`)
    return response.data
  }

  /**
   * Obtener tipos de documento disponibles
   */
  async getTiposDocumento(): Promise<TiposDocumentoResponse> {
    const response = await api.get<TiposDocumentoResponse>(`${this.baseUrl}/tipos-documento`)
    return response.data
  }

  /**
   * Crear una nueva plantilla
   */
  async create(data: CreatePlantillaDTO): Promise<PlantillaResponse> {
    const response = await api.post<PlantillaResponse>(this.baseUrl, data)
    return response.data
  }

  /**
   * Actualizar una plantilla existente
   */
  async update(id: string, data: UpdatePlantillaDTO): Promise<PlantillaResponse> {
    const response = await api.put<PlantillaResponse>(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  /**
   * Eliminar una plantilla
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Duplicar una plantilla
   */
  async duplicar(id: string): Promise<PlantillaResponse> {
    const response = await api.post<PlantillaResponse>(`${this.baseUrl}/${id}/duplicar`)
    return response.data
  }

  /**
   * Establecer plantilla como predeterminada
   */
  async establecerPredeterminada(id: string): Promise<PlantillaResponse> {
    const response = await api.post<PlantillaResponse>(`${this.baseUrl}/${id}/predeterminada`)
    return response.data
  }

  /**
   * Inicializar plantillas predefinidas
   */
  async inicializar(): Promise<{ success: boolean; data: { insertadas: number; existentes: number }; message: string }> {
    const response = await api.post(`${this.baseUrl}/inicializar`)
    return response.data
  }
}

export const plantillasDocumentoService = new PlantillasDocumentoService()
