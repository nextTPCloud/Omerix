import { api } from './api';
import {
  ParteTrabajo,
  ParteTrabajoResponse,
  PartesTrabajoListResponse,
  EstadisticasPartesResponse,
  CreateParteTrabajoDTO,
  UpdateParteTrabajoDTO,
  CambiarEstadoParteDTO,
  CompletarParteDTO,
  OpcionesGenerarAlbaranDTO,
  DuplicarParteDTO,
  EstadoParteTrabajo,
  TipoParteTrabajo,
  Prioridad,
} from '@/types/parte-trabajo.types';

const BASE_URL = '/partes-trabajo';

export interface SearchPartesTrabajoParams {
  search?: string;
  clienteId?: string;
  proyectoId?: string;
  responsableId?: string;
  estado?: EstadoParteTrabajo;
  estados?: string;
  tipo?: TipoParteTrabajo;
  prioridad?: Prioridad;
  serie?: string;
  activo?: 'true' | 'false' | 'all';
  fechaDesde?: string;
  fechaHasta?: string;
  fechaInicioDesde?: string;
  fechaInicioHasta?: string;
  importeMin?: string;
  importeMax?: string;
  tags?: string;
  conFirmaCliente?: 'true' | 'false';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class PartesTrabajoService {
  /**
   * Obtener lista de partes de trabajo con filtros y paginacion
   */
  async getAll(params?: SearchPartesTrabajoParams): Promise<PartesTrabajoListResponse> {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  }

  /**
   * Obtener un parte de trabajo por ID
   */
  async getById(id: string): Promise<ParteTrabajoResponse> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Crear un nuevo parte de trabajo
   */
  async create(data: CreateParteTrabajoDTO): Promise<ParteTrabajoResponse> {
    const response = await api.post(BASE_URL, data);
    return response.data;
  }

  /**
   * Actualizar un parte de trabajo
   */
  async update(id: string, data: UpdateParteTrabajoDTO): Promise<ParteTrabajoResponse> {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar un parte de trabajo (soft delete)
   */
  async delete(id: string): Promise<ParteTrabajoResponse> {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Eliminar multiples partes de trabajo
   */
  async deleteMany(ids: string[]): Promise<{ success: boolean; count: number; message: string }> {
    const response = await api.post(`${BASE_URL}/bulk/delete`, { ids });
    return response.data;
  }

  /**
   * Cambiar el estado de un parte de trabajo
   */
  async cambiarEstado(id: string, data: CambiarEstadoParteDTO): Promise<ParteTrabajoResponse> {
    const response = await api.patch(`${BASE_URL}/${id}/estado`, data);
    return response.data;
  }

  /**
   * Completar un parte de trabajo con firmas
   */
  async completar(id: string, data: CompletarParteDTO): Promise<ParteTrabajoResponse> {
    const response = await api.post(`${BASE_URL}/${id}/completar`, data);
    return response.data;
  }

  /**
   * Generar albaran desde parte de trabajo
   */
  async generarAlbaran(id: string, opciones?: OpcionesGenerarAlbaranDTO): Promise<ParteTrabajoResponse> {
    const response = await api.post(`${BASE_URL}/${id}/generar-albaran`, opciones || {});
    return response.data;
  }

  /**
   * Duplicar un parte de trabajo
   */
  async duplicar(id: string, data?: DuplicarParteDTO): Promise<ParteTrabajoResponse> {
    const response = await api.post(`${BASE_URL}/${id}/duplicar`, data || {});
    return response.data;
  }

  /**
   * Obtener estadisticas de partes de trabajo
   */
  async getEstadisticas(): Promise<EstadisticasPartesResponse> {
    const response = await api.get(`${BASE_URL}/estadisticas`);
    return response.data;
  }

  /**
   * Obtener partes de trabajo de un proyecto
   */
  async getByProyecto(proyectoId: string): Promise<{ success: boolean; data: ParteTrabajo[] }> {
    const response = await api.get(`${BASE_URL}/proyecto/${proyectoId}`);
    return response.data;
  }

  /**
   * Obtener partes de trabajo de un cliente
   */
  async getByCliente(clienteId: string): Promise<{ success: boolean; data: ParteTrabajo[] }> {
    const response = await api.get(`${BASE_URL}/cliente/${clienteId}`);
    return response.data;
  }

  /**
   * Obtener partes activos
   */
  async getActivos(params?: Omit<SearchPartesTrabajoParams, 'activo'>): Promise<PartesTrabajoListResponse> {
    return this.getAll({ ...params, activo: 'true' });
  }

  /**
   * Obtener partes en curso
   */
  async getEnCurso(params?: Omit<SearchPartesTrabajoParams, 'estado'>): Promise<PartesTrabajoListResponse> {
    return this.getAll({ ...params, estado: 'en_curso' });
  }

  /**
   * Obtener partes completados pendientes de facturar
   */
  async getPendientesFacturar(params?: Omit<SearchPartesTrabajoParams, 'estado'>): Promise<PartesTrabajoListResponse> {
    return this.getAll({ ...params, estado: 'completado' });
  }

  /**
   * Obtener partes urgentes
   */
  async getUrgentes(params?: Omit<SearchPartesTrabajoParams, 'prioridad'>): Promise<PartesTrabajoListResponse> {
    return this.getAll({ ...params, prioridad: 'urgente', activo: 'true' });
  }

  /**
   * Iniciar un parte de trabajo (cambiar a en_curso)
   */
  async iniciar(id: string, observaciones?: string): Promise<ParteTrabajoResponse> {
    return this.cambiarEstado(id, { estado: 'en_curso', observaciones });
  }

  /**
   * Pausar un parte de trabajo
   */
  async pausar(id: string, observaciones?: string): Promise<ParteTrabajoResponse> {
    return this.cambiarEstado(id, { estado: 'pausado', observaciones });
  }

  /**
   * Reanudar un parte de trabajo pausado
   */
  async reanudar(id: string, observaciones?: string): Promise<ParteTrabajoResponse> {
    return this.cambiarEstado(id, { estado: 'en_curso', observaciones });
  }

  /**
   * Anular un parte de trabajo
   */
  async anular(id: string, observaciones?: string): Promise<ParteTrabajoResponse> {
    return this.cambiarEstado(id, { estado: 'anulado', observaciones });
  }

  /**
   * Enviar parte de trabajo por email
   */
  async enviarEmail(
    id: string,
    data: {
      destinatarios: string[];
      cc?: string[];
      asunto?: string;
      mensaje?: string;
      urlParte?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    enviados?: number;
    errores?: number;
    detalles?: { email: string; success: boolean; message: string }[];
  }> {
    const response = await api.post(`${BASE_URL}/${id}/enviar-email`, data);
    return response.data;
  }

  /**
   * Sincronizar jornadas de un parte con Google Calendar
   */
  async syncCalendar(id: string): Promise<{
    success: boolean;
    message: string;
    stats?: {
      jornadasProcesadas: number;
      eventosSincronizados: number;
      errores: number;
    };
  }> {
    const response = await api.post(`${BASE_URL}/${id}/sync-calendar`);
    return response.data;
  }

  /**
   * Sincronizar una jornada específica con Google Calendar
   */
  async syncJornadaCalendar(id: string, jornadaIndex: number): Promise<{
    success: boolean;
    message: string;
    data?: {
      jornadaId: string;
      fecha: string;
      sincronizadoCalendar: boolean;
      resultados: {
        personalId: string;
        personalNombre: string;
        success: boolean;
        googleEventId?: string;
        error?: string;
      }[];
    };
  }> {
    const response = await api.post(`${BASE_URL}/${id}/jornadas/${jornadaIndex}/sync-calendar`);
    return response.data;
  }

  /**
   * Obtener partes para planificación (calendario)
   */
  async getPlanificacion(params: {
    fechaDesde: string;
    fechaHasta: string;
    personalId?: string;
    tipo?: string;
  }): Promise<{
    success: boolean;
    data: any[];
    total: number;
  }> {
    const response = await api.get(`${BASE_URL}/planificacion`, { params });
    return response.data;
  }

  /**
   * Verificar disponibilidad de personal
   */
  async verificarDisponibilidad(data: {
    personalIds: string[];
    fecha: string;
    horaInicio: string;
    horaFin: string;
    parteIdExcluir?: string;
  }): Promise<{
    success: boolean;
    data: {
      disponible: boolean;
      conflictos: Array<{
        personalId: string;
        personalNombre: string;
        parteId: string;
        parteCodigo: string;
        horaInicio: string;
        horaFin: string;
      }>;
    };
  }> {
    const response = await api.post(`${BASE_URL}/verificar-disponibilidad`, data);
    return response.data;
  }

  // ============================================
  // DOCUMENTOS ADJUNTOS
  // ============================================

  async subirDocumento(id: string, file: File, nombre?: string): Promise<ParteTrabajoResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (nombre) formData.append('nombre', nombre);
    const response = await api.post(`${BASE_URL}/${id}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async eliminarDocumento(id: string, docId: string): Promise<ParteTrabajoResponse> {
    const response = await api.delete(`${BASE_URL}/${id}/documentos/${docId}`);
    return response.data;
  }
}

export const partesTrabajoService = new PartesTrabajoService();
