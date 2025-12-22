import { api } from './api';

// ============================================
// ENUMS Y TIPOS
// ============================================

export enum EstadoTarea {
  PENDIENTE = 'pendiente',
  EN_PROGRESO = 'en_progreso',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
  VENCIDA = 'vencida',
}

export enum PrioridadTarea {
  BAJA = 'baja',
  NORMAL = 'normal',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum TipoTarea {
  GENERAL = 'general',
  RECORDATORIO = 'recordatorio',
  SEGUIMIENTO_CLIENTE = 'seguimiento_cliente',
  SEGUIMIENTO_PROVEEDOR = 'seguimiento_proveedor',
  COBRO = 'cobro',
  PAGO = 'pago',
  LLAMADA = 'llamada',
  REUNION = 'reunion',
  VISITA = 'visita',
  REVISION = 'revision',
  MANTENIMIENTO = 'mantenimiento',
  INVENTARIO = 'inventario',
  ENTREGA = 'entrega',
  OTRO = 'otro',
}

export enum RecurrenciaTarea {
  NINGUNA = 'ninguna',
  DIARIA = 'diaria',
  SEMANAL = 'semanal',
  QUINCENAL = 'quincenal',
  MENSUAL = 'mensual',
  TRIMESTRAL = 'trimestral',
  ANUAL = 'anual',
}

export interface ComentarioTarea {
  _id?: string;
  usuarioId: string;
  usuarioNombre: string;
  texto: string;
  fecha: string;
}

export interface Tarea {
  _id: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoTarea;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  fechaCreacion: string;
  fechaVencimiento?: string;
  fechaRecordatorio?: string;
  fechaInicio?: string;
  fechaCompletada?: string;
  recurrencia: RecurrenciaTarea;
  tareaOrigenId?: string;
  proximaRecurrencia?: string;
  creadoPorId: string;
  creadoPorNombre: string;
  asignadoAId?: string;
  asignadoANombre?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  clienteId?: string;
  clienteNombre?: string;
  proveedorId?: string;
  proveedorNombre?: string;
  proyectoId?: string;
  proyectoNombre?: string;
  documentoTipo?: string;
  documentoId?: string;
  documentoCodigo?: string;
  porcentajeCompletado: number;
  horasEstimadas?: number;
  horasReales?: number;
  enviarRecordatorio: boolean;
  recordatorioEnviado: boolean;
  notificarAlCompletar: boolean;
  etiquetas?: string[];
  color?: string;
  comentarios: ComentarioTarea[];
  archivos?: {
    nombre: string;
    url: string;
    tipo: string;
    tamanio: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTareaDTO {
  titulo: string;
  descripcion?: string;
  tipo?: TipoTarea;
  prioridad?: PrioridadTarea;
  fechaVencimiento?: string;
  fechaRecordatorio?: string;
  fechaInicio?: string;
  recurrencia?: RecurrenciaTarea;
  asignadoAId?: string;
  departamentoId?: string;
  clienteId?: string;
  proveedorId?: string;
  proyectoId?: string;
  documentoTipo?: string;
  documentoId?: string;
  documentoCodigo?: string;
  horasEstimadas?: number;
  enviarRecordatorio?: boolean;
  notificarAlCompletar?: boolean;
  etiquetas?: string[];
  color?: string;
}

export interface UpdateTareaDTO extends Partial<CreateTareaDTO> {
  horasReales?: number;
  porcentajeCompletado?: number;
}

export interface CambiarEstadoDTO {
  estado: EstadoTarea;
  comentario?: string;
}

export interface SearchTareasParams {
  q?: string;
  estado?: EstadoTarea;
  prioridad?: PrioridadTarea;
  tipo?: TipoTarea;
  asignadoAId?: string;
  creadoPorId?: string;
  clienteId?: string;
  proyectoId?: string;
  departamentoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  vencidas?: boolean;
  hoy?: boolean;
  semana?: boolean;
  misTareas?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EstadisticasTareas {
  pendientes: number;
  enProgreso: number;
  completadasHoy: number;
  vencidas: number;
  paraHoy: number;
  paraSemana: number;
  urgentes: number;
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

// ============================================
// SERVICIO
// ============================================

class TareasService {
  private readonly BASE_URL = '/tareas';

  /**
   * Listar tareas con filtros
   */
  async listar(params?: SearchTareasParams): Promise<PaginatedResponse<Tarea>> {
    const response = await api.get<PaginatedResponse<Tarea>>(this.BASE_URL, { params });
    return response.data;
  }

  /**
   * Obtener tarea por ID
   */
  async obtenerPorId(id: string): Promise<SingleResponse<Tarea>> {
    const response = await api.get<SingleResponse<Tarea>>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Crear tarea
   */
  async crear(data: CreateTareaDTO): Promise<SingleResponse<Tarea>> {
    const response = await api.post<SingleResponse<Tarea>>(this.BASE_URL, data);
    return response.data;
  }

  /**
   * Actualizar tarea
   */
  async actualizar(id: string, data: UpdateTareaDTO): Promise<SingleResponse<Tarea>> {
    const response = await api.put<SingleResponse<Tarea>>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * Cambiar estado
   */
  async cambiarEstado(id: string, data: CambiarEstadoDTO): Promise<SingleResponse<Tarea>> {
    const response = await api.post<SingleResponse<Tarea>>(`${this.BASE_URL}/${id}/estado`, data);
    return response.data;
  }

  /**
   * Agregar comentario
   */
  async agregarComentario(id: string, texto: string): Promise<SingleResponse<Tarea>> {
    const response = await api.post<SingleResponse<Tarea>>(`${this.BASE_URL}/${id}/comentarios`, { texto });
    return response.data;
  }

  /**
   * Eliminar tarea
   */
  async eliminar(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }

  /**
   * Obtener estadísticas
   */
  async estadisticas(): Promise<SingleResponse<EstadisticasTareas>> {
    const response = await api.get<SingleResponse<EstadisticasTareas>>(`${this.BASE_URL}/estadisticas`);
    return response.data;
  }

  /**
   * Obtener tareas para widget
   */
  async widget(): Promise<SingleResponse<Tarea[]>> {
    const response = await api.get<SingleResponse<Tarea[]>>(`${this.BASE_URL}/widget`);
    return response.data;
  }

  // ============================================
  // HELPERS
  // ============================================

  getEstadoLabel(estado: EstadoTarea): string {
    const labels: Record<EstadoTarea, string> = {
      [EstadoTarea.PENDIENTE]: 'Pendiente',
      [EstadoTarea.EN_PROGRESO]: 'En progreso',
      [EstadoTarea.COMPLETADA]: 'Completada',
      [EstadoTarea.CANCELADA]: 'Cancelada',
      [EstadoTarea.VENCIDA]: 'Vencida',
    };
    return labels[estado] || estado;
  }

  getEstadoVariant(estado: EstadoTarea): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (estado) {
      case EstadoTarea.COMPLETADA:
        return 'default';
      case EstadoTarea.EN_PROGRESO:
        return 'secondary';
      case EstadoTarea.CANCELADA:
      case EstadoTarea.VENCIDA:
        return 'destructive';
      default:
        return 'outline';
    }
  }

  getPrioridadLabel(prioridad: PrioridadTarea): string {
    const labels: Record<PrioridadTarea, string> = {
      [PrioridadTarea.BAJA]: 'Baja',
      [PrioridadTarea.NORMAL]: 'Normal',
      [PrioridadTarea.ALTA]: 'Alta',
      [PrioridadTarea.URGENTE]: 'Urgente',
    };
    return labels[prioridad] || prioridad;
  }

  getPrioridadColor(prioridad: PrioridadTarea): string {
    switch (prioridad) {
      case PrioridadTarea.URGENTE:
        return 'text-red-600 bg-red-50';
      case PrioridadTarea.ALTA:
        return 'text-orange-600 bg-orange-50';
      case PrioridadTarea.NORMAL:
        return 'text-blue-600 bg-blue-50';
      case PrioridadTarea.BAJA:
        return 'text-gray-600 bg-gray-50';
      default:
        return '';
    }
  }

  getTipoLabel(tipo: TipoTarea): string {
    const labels: Record<TipoTarea, string> = {
      [TipoTarea.GENERAL]: 'General',
      [TipoTarea.RECORDATORIO]: 'Recordatorio',
      [TipoTarea.SEGUIMIENTO_CLIENTE]: 'Seguimiento cliente',
      [TipoTarea.SEGUIMIENTO_PROVEEDOR]: 'Seguimiento proveedor',
      [TipoTarea.COBRO]: 'Cobro',
      [TipoTarea.PAGO]: 'Pago',
      [TipoTarea.LLAMADA]: 'Llamada',
      [TipoTarea.REUNION]: 'Reunión',
      [TipoTarea.VISITA]: 'Visita',
      [TipoTarea.REVISION]: 'Revisión',
      [TipoTarea.MANTENIMIENTO]: 'Mantenimiento',
      [TipoTarea.INVENTARIO]: 'Inventario',
      [TipoTarea.ENTREGA]: 'Entrega',
      [TipoTarea.OTRO]: 'Otro',
    };
    return labels[tipo] || tipo;
  }

  getRecurrenciaLabel(recurrencia: RecurrenciaTarea): string {
    const labels: Record<RecurrenciaTarea, string> = {
      [RecurrenciaTarea.NINGUNA]: 'Sin recurrencia',
      [RecurrenciaTarea.DIARIA]: 'Diaria',
      [RecurrenciaTarea.SEMANAL]: 'Semanal',
      [RecurrenciaTarea.QUINCENAL]: 'Quincenal',
      [RecurrenciaTarea.MENSUAL]: 'Mensual',
      [RecurrenciaTarea.TRIMESTRAL]: 'Trimestral',
      [RecurrenciaTarea.ANUAL]: 'Anual',
    };
    return labels[recurrencia] || recurrencia;
  }

  isVencida(tarea: Tarea): boolean {
    if (!tarea.fechaVencimiento) return false;
    if (tarea.estado === EstadoTarea.COMPLETADA || tarea.estado === EstadoTarea.CANCELADA) return false;
    return new Date(tarea.fechaVencimiento) < new Date();
  }

  isHoy(fecha: string): boolean {
    const hoy = new Date();
    const fechaTarea = new Date(fecha);
    return fechaTarea.toDateString() === hoy.toDateString();
  }
}

export const tareasService = new TareasService();
export default tareasService;
