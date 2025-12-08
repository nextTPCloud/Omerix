import { api } from './api';
import {
  ISerieDocumento,
  CreateSerieDocumentoDTO,
  UpdateSerieDocumentoDTO,
  SearchSeriesDocumentosParams,
  SerieDocumentoResponse,
  SeriesDocumentosResponse,
  SugerirCodigoResponse,
  TipoDocumentoSerie,
} from '@/types/serie-documento.types';

// ============================================
// SERVICIO DE SERIES DE DOCUMENTOS
// ============================================

class SeriesDocumentosService {
  private baseUrl = '/series-documentos';

  // ============================================
  // CRUD BÁSICO
  // ============================================

  /**
   * Obtener todas las series con filtros y paginación
   */
  async getAll(params?: SearchSeriesDocumentosParams): Promise<SeriesDocumentosResponse> {
    try {
      const response = await api.get<SeriesDocumentosResponse>(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener series:', error);
      throw error;
    }
  }

  /**
   * Obtener una serie por ID
   */
  async getById(id: string): Promise<SerieDocumentoResponse> {
    try {
      const response = await api.get<SerieDocumentoResponse>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener serie:', error);
      throw error;
    }
  }

  /**
   * Crear una nueva serie
   */
  async create(data: CreateSerieDocumentoDTO): Promise<SerieDocumentoResponse> {
    try {
      const response = await api.post<SerieDocumentoResponse>(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error al crear serie:', error);
      throw error;
    }
  }

  /**
   * Actualizar una serie
   */
  async update(id: string, data: UpdateSerieDocumentoDTO): Promise<SerieDocumentoResponse> {
    try {
      const response = await api.put<SerieDocumentoResponse>(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar serie:', error);
      throw error;
    }
  }

  /**
   * Eliminar una serie
   */
  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete<{ success: boolean; message?: string }>(
        `${this.baseUrl}/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Error al eliminar serie:', error);
      throw error;
    }
  }

  // ============================================
  // OPERACIONES ESPECIALES
  // ============================================

  /**
   * Obtener series por tipo de documento
   */
  async getByTipoDocumento(
    tipoDocumento: TipoDocumentoSerie,
    soloActivas: boolean = true
  ): Promise<SeriesDocumentosResponse> {
    try {
      const response = await api.get<SeriesDocumentosResponse>(
        `${this.baseUrl}/tipo/${tipoDocumento}`,
        { params: { soloActivas } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener series por tipo:', error);
      throw error;
    }
  }

  /**
   * Establecer serie como predeterminada
   */
  async setPredeterminada(id: string): Promise<SerieDocumentoResponse> {
    try {
      const response = await api.post<SerieDocumentoResponse>(
        `${this.baseUrl}/${id}/predeterminada`
      );
      return response.data;
    } catch (error) {
      console.error('Error al establecer predeterminada:', error);
      throw error;
    }
  }

  /**
   * Sugerir próximo código (sin incrementar contador)
   */
  async sugerirCodigo(
    tipoDocumento: TipoDocumentoSerie,
    serieId?: string
  ): Promise<SugerirCodigoResponse> {
    try {
      const params: any = { tipoDocumento };
      if (serieId) params.serieId = serieId;

      const response = await api.get<SugerirCodigoResponse>(
        `${this.baseUrl}/sugerir-codigo`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error al sugerir código:', error);
      throw error;
    }
  }

  /**
   * Generar código (incrementa el contador)
   */
  async generarCodigo(
    tipoDocumento: TipoDocumentoSerie,
    serieId?: string
  ): Promise<SugerirCodigoResponse> {
    try {
      const response = await api.post<SugerirCodigoResponse>(
        `${this.baseUrl}/generar-codigo`,
        { tipoDocumento, serieId }
      );
      return response.data;
    } catch (error) {
      console.error('Error al generar código:', error);
      throw error;
    }
  }

  /**
   * Duplicar una serie
   */
  async duplicar(id: string): Promise<SerieDocumentoResponse> {
    try {
      const response = await api.post<SerieDocumentoResponse>(
        `${this.baseUrl}/${id}/duplicar`
      );
      return response.data;
    } catch (error) {
      console.error('Error al duplicar serie:', error);
      throw error;
    }
  }

  /**
   * Crear series por defecto para la empresa
   */
  async crearSeriesPorDefecto(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post<{ success: boolean; message?: string }>(
        `${this.baseUrl}/crear-por-defecto`
      );
      return response.data;
    } catch (error) {
      console.error('Error al crear series por defecto:', error);
      throw error;
    }
  }
}

export const seriesDocumentosService = new SeriesDocumentosService();
export default seriesDocumentosService;
