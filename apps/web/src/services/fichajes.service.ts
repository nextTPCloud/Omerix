import { api } from './api';
import {
  Fichaje,
  FichajeResponse,
  FichajesListResponse,
  RegistrarFichajeDTO,
  UpdateFichajeDTO,
  EstadoFichajeResponse,
  ResumenFichajeResponse,
  Ubicacion,
} from '@/types/fichaje.types';

const BASE_URL = '/fichajes';

export interface SearchFichajesParams {
  personalId?: string;
  departamentoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
  tipo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class FichajesService {
  /**
   * Obtener lista de fichajes con filtros
   */
  async getAll(params?: SearchFichajesParams): Promise<FichajesListResponse> {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  }

  /**
   * Obtener un fichaje por ID
   */
  async getById(id: string): Promise<FichajeResponse> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Obtener estado actual de fichaje
   */
  async getEstadoActual(personalId?: string): Promise<EstadoFichajeResponse> {
    const url = personalId ? `${BASE_URL}/estado/${personalId}` : `${BASE_URL}/estado`;
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Fichar rapido (entrada o salida automatica)
   */
  async ficharRapido(data: RegistrarFichajeDTO): Promise<FichajeResponse> {
    const response = await api.post(`${BASE_URL}/fichar`, data);
    return response.data;
  }

  /**
   * Registrar entrada
   */
  async registrarEntrada(data: RegistrarFichajeDTO): Promise<FichajeResponse> {
    const response = await api.post(`${BASE_URL}/entrada`, data);
    return response.data;
  }

  /**
   * Registrar salida
   */
  async registrarSalida(
    fichajeId: string,
    ubicacion?: Ubicacion,
    observaciones?: string
  ): Promise<FichajeResponse> {
    const response = await api.post(`${BASE_URL}/${fichajeId}/salida`, {
      ubicacion,
      observaciones,
    });
    return response.data;
  }

  /**
   * Registrar pausa
   */
  async registrarPausa(
    fichajeId: string,
    tipo: 'inicio' | 'fin'
  ): Promise<FichajeResponse> {
    const response = await api.post(`${BASE_URL}/${fichajeId}/pausa`, { tipo });
    return response.data;
  }

  /**
   * Actualizar fichaje
   */
  async update(id: string, data: UpdateFichajeDTO): Promise<FichajeResponse> {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar fichaje
   */
  async delete(id: string): Promise<FichajeResponse> {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Aprobar fichaje
   */
  async aprobar(id: string): Promise<FichajeResponse> {
    const response = await api.put(`${BASE_URL}/${id}/aprobar`);
    return response.data;
  }

  /**
   * Rechazar fichaje
   */
  async rechazar(id: string, motivo?: string): Promise<FichajeResponse> {
    const response = await api.put(`${BASE_URL}/${id}/rechazar`, { motivo });
    return response.data;
  }

  /**
   * Obtener resumen mensual
   */
  async getResumen(
    personalId?: string,
    mes?: number,
    anio?: number
  ): Promise<ResumenFichajeResponse> {
    const url = personalId ? `${BASE_URL}/resumen/${personalId}` : `${BASE_URL}/resumen`;
    const params = { mes, anio };
    const response = await api.get(url, { params });
    return response.data;
  }

  /**
   * Obtener ubicacion actual del navegador
   */
  async obtenerUbicacion(): Promise<Ubicacion | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }

  /**
   * Formatear tiempo transcurrido
   */
  formatTiempoTranscurrido(horaEntrada: string): string {
    const entrada = new Date(horaEntrada);
    const ahora = new Date();
    const diff = ahora.getTime() - entrada.getTime();

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${horas}h ${minutos}m`;
  }
}

export const fichajesService = new FichajesService();
