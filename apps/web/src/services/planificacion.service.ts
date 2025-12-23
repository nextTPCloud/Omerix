import { api } from './api';

// ============================================
// ENUMS Y TIPOS
// ============================================

export enum EstadoPlanificacion {
  BORRADOR = 'borrador',
  PUBLICADA = 'publicada',
  CERRADA = 'cerrada',
  CANCELADA = 'cancelada'
}

export enum TipoPlanificacion {
  SEMANAL = 'semanal',
  MENSUAL = 'mensual',
  TRIMESTRAL = 'trimestral',
  ANUAL = 'anual',
  PERSONALIZADA = 'personalizada'
}

export enum EstadoAsignacion {
  PLANIFICADA = 'planificada',
  CONFIRMADA = 'confirmada',
  EN_CURSO = 'en_curso',
  COMPLETADA = 'completada',
  AUSENCIA = 'ausencia',
  CANCELADA = 'cancelada'
}

export enum TipoAusencia {
  VACACIONES = 'vacaciones',
  BAJA_MEDICA = 'baja_medica',
  PERMISO_PERSONAL = 'permiso_personal',
  FORMACION = 'formacion',
  COMPENSACION = 'compensacion',
  FESTIVO = 'festivo',
  OTRO = 'otro'
}

export interface AsignacionJornada {
  _id?: string;
  fecha: string;
  personalId: string;
  personalNombre: string;
  turnoId?: string;
  turnoNombre?: string;
  horaInicio: string;
  horaFin: string;
  horasPlanificadas: number;
  horasReales?: number;
  ubicacion?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  estado: EstadoAsignacion;
  esAusencia: boolean;
  tipoAusencia?: TipoAusencia;
  motivoAusencia?: string;
  notas?: string;
  color?: string;
}

export interface ResumenPlanificacion {
  totalHorasPlanificadas: number;
  totalEmpleadosPlanificados: number;
  horasPorDia: {
    fecha: string;
    horas: number;
    empleados: number;
  }[];
  horasPorEmpleado: {
    personalId: string;
    nombre: string;
    horas: number;
    dias: number;
  }[];
  ausencias: number;
  horasExtras: number;
}

export interface Planificacion {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoPlanificacion;
  estado: EstadoPlanificacion;
  fechaInicio: string;
  fechaFin: string;
  departamentoId?: string;
  departamentoNombre?: string;
  asignaciones: AsignacionJornada[];
  resumen?: ResumenPlanificacion;
  creadoPorId: string;
  creadoPorNombre: string;
  publicadoPorId?: string;
  publicadoPorNombre?: string;
  fechaPublicacion?: string;
  notas?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanificacionDTO {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  tipo?: TipoPlanificacion;
  fechaInicio: string;
  fechaFin: string;
  departamentoId?: string;
  asignaciones?: Partial<AsignacionJornada>[];
  notas?: string;
}

export interface UpdatePlanificacionDTO extends Partial<CreatePlanificacionDTO> {}

export interface SearchPlanificacionesParams {
  q?: string;
  estado?: EstadoPlanificacion;
  tipo?: TipoPlanificacion;
  departamentoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CambiarEstadoDTO {
  estado: EstadoPlanificacion;
  comentario?: string;
}

export interface CopiarSemanaDTO {
  semanaOrigen: string;
  semanaDestino: string;
  sobreescribir?: boolean;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Vista completa de la semana con partes de trabajo y tareas
export interface ParteTrabajoDia {
  _id: string;
  codigo: string;
  titulo?: string;
  cliente: string;
  direccion?: string;
  estado: string;
  prioridad: string;
  rol: 'responsable' | 'asignado';
  horaInicio?: string;
  horaFin?: string;
  descripcionTrabajo?: string;
}

export interface TareaDia {
  _id: string;
  titulo: string;
  tipo: string;
  prioridad: string;
  estado: string;
  cliente?: string;
}

export interface DiaEmpleado {
  fecha: string;
  asignacion: {
    horaInicio: string;
    horaFin: string;
    horas: number;
    turnoNombre?: string;
    ubicacion?: string;
    estado: string;
    esAusencia: boolean;
    tipoAusencia?: string;
    notas?: string;
  } | null;
  partesTrabajo: ParteTrabajoDia[];
  tareas: TareaDia[];
}

export interface EmpleadoVista {
  _id: string;
  nombre: string;
  apellidos?: string;
  nombreCompleto: string;
  cargo?: string;
  dias: Record<string, DiaEmpleado>;
}

export interface VistaCompletaSemana {
  fechaInicio: string;
  fechaFin: string;
  empleados: EmpleadoVista[];
  resumen: {
    totalEmpleados: number;
    totalPartesTrabajo: number;
    totalTareas: number;
  };
}

// ============================================
// SERVICIO
// ============================================

class PlanificacionService {
  private readonly BASE_URL = '/planificacion';

  /**
   * Listar planificaciones
   */
  async listar(params?: SearchPlanificacionesParams): Promise<PaginatedResponse<Planificacion>> {
    const response = await api.get<PaginatedResponse<Planificacion>>(this.BASE_URL, { params });
    return response.data;
  }

  /**
   * Obtener planificacion por ID
   */
  async obtenerPorId(id: string): Promise<SingleResponse<Planificacion>> {
    const response = await api.get<SingleResponse<Planificacion>>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Crear planificacion
   */
  async crear(data: CreatePlanificacionDTO): Promise<SingleResponse<Planificacion>> {
    const response = await api.post<SingleResponse<Planificacion>>(this.BASE_URL, data);
    return response.data;
  }

  /**
   * Actualizar planificacion
   */
  async actualizar(id: string, data: UpdatePlanificacionDTO): Promise<SingleResponse<Planificacion>> {
    const response = await api.put<SingleResponse<Planificacion>>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * Agregar asignaciones
   */
  async agregarAsignaciones(id: string, asignaciones: Partial<AsignacionJornada>[]): Promise<SingleResponse<Planificacion>> {
    const response = await api.post<SingleResponse<Planificacion>>(
      `${this.BASE_URL}/${id}/asignaciones`,
      { asignaciones }
    );
    return response.data;
  }

  /**
   * Actualizar asignacion
   */
  async actualizarAsignacion(
    planId: string,
    asignacionId: string,
    data: Partial<AsignacionJornada>
  ): Promise<SingleResponse<Planificacion>> {
    const response = await api.put<SingleResponse<Planificacion>>(
      `${this.BASE_URL}/${planId}/asignaciones/${asignacionId}`,
      data
    );
    return response.data;
  }

  /**
   * Eliminar asignacion
   */
  async eliminarAsignacion(planId: string, asignacionId: string): Promise<SingleResponse<Planificacion>> {
    const response = await api.delete<SingleResponse<Planificacion>>(
      `${this.BASE_URL}/${planId}/asignaciones/${asignacionId}`
    );
    return response.data;
  }

  /**
   * Cambiar estado
   */
  async cambiarEstado(id: string, data: CambiarEstadoDTO): Promise<SingleResponse<Planificacion>> {
    const response = await api.post<SingleResponse<Planificacion>>(
      `${this.BASE_URL}/${id}/estado`,
      data
    );
    return response.data;
  }

  /**
   * Copiar semana
   */
  async copiarSemana(id: string, data: CopiarSemanaDTO): Promise<SingleResponse<Planificacion>> {
    const response = await api.post<SingleResponse<Planificacion>>(
      `${this.BASE_URL}/${id}/copiar-semana`,
      data
    );
    return response.data;
  }

  /**
   * Eliminar planificacion
   */
  async eliminar(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }

  /**
   * Obtener planificacion de un empleado
   */
  async obtenerPlanificacionEmpleado(
    personalId: string,
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<SingleResponse<AsignacionJornada[]>> {
    const response = await api.get<SingleResponse<AsignacionJornada[]>>(
      `${this.BASE_URL}/empleado/${personalId}`,
      { params: { fechaDesde, fechaHasta } }
    );
    return response.data;
  }

  /**
   * Obtener resumen semanal
   */
  async obtenerResumenSemanal(fechaInicio: string): Promise<SingleResponse<{
    fecha: string;
    empleados: { id: string; nombre: string; horas: number }[];
    totalHoras: number;
  }[]>> {
    const response = await api.get<SingleResponse<any>>(
      `${this.BASE_URL}/resumen-semanal`,
      { params: { fechaInicio } }
    );
    return response.data;
  }

  /**
   * Sugerir proximo codigo
   */
  async sugerirCodigo(): Promise<SingleResponse<{ codigo: string }>> {
    const response = await api.get<SingleResponse<{ codigo: string }>>(
      `${this.BASE_URL}/sugerir-codigo`
    );
    return response.data;
  }

  /**
   * Obtener vista completa de la semana con partes de trabajo y tareas
   */
  async obtenerVistaCompleta(fechaInicio: string, fechaFin: string): Promise<SingleResponse<VistaCompletaSemana>> {
    const response = await api.get<SingleResponse<VistaCompletaSemana>>(
      `${this.BASE_URL}/vista-completa`,
      { params: { fechaInicio, fechaFin } }
    );
    return response.data;
  }

  // ============================================
  // HELPERS
  // ============================================

  getEstadoLabel(estado: EstadoPlanificacion): string {
    const labels: Record<EstadoPlanificacion, string> = {
      [EstadoPlanificacion.BORRADOR]: 'Borrador',
      [EstadoPlanificacion.PUBLICADA]: 'Publicada',
      [EstadoPlanificacion.CERRADA]: 'Cerrada',
      [EstadoPlanificacion.CANCELADA]: 'Cancelada',
    };
    return labels[estado] || estado;
  }

  getEstadoColor(estado: EstadoPlanificacion): string {
    switch (estado) {
      case EstadoPlanificacion.BORRADOR:
        return 'bg-yellow-100 text-yellow-800';
      case EstadoPlanificacion.PUBLICADA:
        return 'bg-green-100 text-green-800';
      case EstadoPlanificacion.CERRADA:
        return 'bg-gray-100 text-gray-800';
      case EstadoPlanificacion.CANCELADA:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTipoLabel(tipo: TipoPlanificacion): string {
    const labels: Record<TipoPlanificacion, string> = {
      [TipoPlanificacion.SEMANAL]: 'Semanal',
      [TipoPlanificacion.MENSUAL]: 'Mensual',
      [TipoPlanificacion.TRIMESTRAL]: 'Trimestral',
      [TipoPlanificacion.ANUAL]: 'Anual',
      [TipoPlanificacion.PERSONALIZADA]: 'Personalizada',
    };
    return labels[tipo] || tipo;
  }

  getEstadoAsignacionLabel(estado: EstadoAsignacion): string {
    const labels: Record<EstadoAsignacion, string> = {
      [EstadoAsignacion.PLANIFICADA]: 'Planificada',
      [EstadoAsignacion.CONFIRMADA]: 'Confirmada',
      [EstadoAsignacion.EN_CURSO]: 'En Curso',
      [EstadoAsignacion.COMPLETADA]: 'Completada',
      [EstadoAsignacion.AUSENCIA]: 'Ausencia',
      [EstadoAsignacion.CANCELADA]: 'Cancelada',
    };
    return labels[estado] || estado;
  }

  getTipoAusenciaLabel(tipo: TipoAusencia): string {
    const labels: Record<TipoAusencia, string> = {
      [TipoAusencia.VACACIONES]: 'Vacaciones',
      [TipoAusencia.BAJA_MEDICA]: 'Baja Medica',
      [TipoAusencia.PERMISO_PERSONAL]: 'Permiso Personal',
      [TipoAusencia.FORMACION]: 'Formacion',
      [TipoAusencia.COMPENSACION]: 'Compensacion',
      [TipoAusencia.FESTIVO]: 'Festivo',
      [TipoAusencia.OTRO]: 'Otro',
    };
    return labels[tipo] || tipo;
  }

  // Helpers para fechas
  getInicioSemana(fecha: Date): Date {
    const d = new Date(fecha);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  getFinSemana(fecha: Date): Date {
    const inicio = this.getInicioSemana(fecha);
    return new Date(inicio.getTime() + 6 * 24 * 60 * 60 * 1000);
  }

  formatearRangoFechas(inicio: string, fin: string): string {
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const inicioStr = fechaInicio.toLocaleDateString('es-ES', opciones);
    const finStr = fechaFin.toLocaleDateString('es-ES', {
      ...opciones,
      year: 'numeric'
    });

    return `${inicioStr} - ${finStr}`;
  }
}

export const planificacionService = new PlanificacionService();
export default planificacionService;
