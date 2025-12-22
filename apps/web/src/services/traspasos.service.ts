import { api } from './api';

// ============================================
// ENUMS Y TIPOS
// ============================================

export enum EstadoTraspaso {
  BORRADOR = 'borrador',
  PENDIENTE_SALIDA = 'pendiente_salida',
  EN_TRANSITO = 'en_transito',
  RECIBIDO_PARCIAL = 'recibido_parcial',
  RECIBIDO = 'recibido',
  ANULADO = 'anulado',
}

export interface LineaTraspaso {
  _id?: string;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  productoSku?: string;
  varianteId?: string;
  varianteNombre?: string;
  cantidadSolicitada: number;
  cantidadEnviada: number;
  cantidadRecibida: number;
  ubicacionOrigen?: string;
  ubicacionDestino?: string;
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: string;
  costeUnitario: number;
  observaciones?: string;
}

export interface Traspaso {
  _id: string;
  codigo: string;
  almacenOrigenId: string;
  almacenOrigenNombre: string;
  almacenDestinoId: string;
  almacenDestinoNombre: string;
  estado: EstadoTraspaso;
  fechaCreacion: string;
  fechaSalida?: string;
  fechaRecepcion?: string;
  fechaAnulacion?: string;
  usuarioCreadorId: string;
  usuarioCreadorNombre: string;
  usuarioSalidaId?: string;
  usuarioSalidaNombre?: string;
  usuarioRecepcionId?: string;
  usuarioRecepcionNombre?: string;
  lineas: LineaTraspaso[];
  totalProductos: number;
  totalUnidades: number;
  valorTotal: number;
  motivoTraspaso?: string;
  observaciones?: string;
  observacionesSalida?: string;
  observacionesRecepcion?: string;
  motivoAnulacion?: string;
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTraspasoDTO {
  almacenOrigenId: string;
  almacenDestinoId: string;
  lineas: {
    productoId: string;
    cantidadSolicitada: number;
    ubicacionOrigen?: string;
    ubicacionDestino?: string;
    lote?: string;
    numeroSerie?: string;
    fechaCaducidad?: string;
    costeUnitario?: number;
    observaciones?: string;
  }[];
  motivoTraspaso?: string;
  observaciones?: string;
  prioridad?: 'baja' | 'normal' | 'alta' | 'urgente';
}

export interface UpdateTraspasoDTO {
  almacenOrigenId?: string;
  almacenDestinoId?: string;
  lineas?: CreateTraspasoDTO['lineas'];
  motivoTraspaso?: string;
  observaciones?: string;
  prioridad?: 'baja' | 'normal' | 'alta' | 'urgente';
}

export interface ConfirmarSalidaDTO {
  lineas?: { lineaId: string; cantidadEnviada: number }[];
  observacionesSalida?: string;
}

export interface ConfirmarRecepcionDTO {
  lineas?: { lineaId: string; cantidadRecibida: number; ubicacionDestino?: string; observaciones?: string }[];
  observacionesRecepcion?: string;
}

export interface SearchTraspasosParams {
  q?: string;
  almacenOrigenId?: string;
  almacenDestinoId?: string;
  estado?: EstadoTraspaso;
  fechaDesde?: string;
  fechaHasta?: string;
  prioridad?: 'baja' | 'normal' | 'alta' | 'urgente';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EstadisticasTraspasos {
  pendientes: number;
  enTransito: number;
  completados: number;
  anulados: number;
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

class TraspasosService {
  private readonly BASE_URL = '/traspasos';

  /**
   * Listar traspasos con filtros
   */
  async listar(params?: SearchTraspasosParams): Promise<PaginatedResponse<Traspaso>> {
    const response = await api.get<PaginatedResponse<Traspaso>>(this.BASE_URL, { params });
    return response.data;
  }

  /**
   * Obtener traspaso por ID
   */
  async obtenerPorId(id: string): Promise<SingleResponse<Traspaso>> {
    const response = await api.get<SingleResponse<Traspaso>>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Crear traspaso
   */
  async crear(data: CreateTraspasoDTO): Promise<SingleResponse<Traspaso>> {
    const response = await api.post<SingleResponse<Traspaso>>(this.BASE_URL, data);
    return response.data;
  }

  /**
   * Actualizar traspaso
   */
  async actualizar(id: string, data: UpdateTraspasoDTO): Promise<SingleResponse<Traspaso>> {
    const response = await api.put<SingleResponse<Traspaso>>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * Confirmar salida
   */
  async confirmarSalida(id: string, data?: ConfirmarSalidaDTO): Promise<SingleResponse<Traspaso>> {
    const response = await api.post<SingleResponse<Traspaso>>(`${this.BASE_URL}/${id}/confirmar-salida`, data || {});
    return response.data;
  }

  /**
   * Confirmar recepción
   */
  async confirmarRecepcion(id: string, data?: ConfirmarRecepcionDTO): Promise<SingleResponse<Traspaso>> {
    const response = await api.post<SingleResponse<Traspaso>>(`${this.BASE_URL}/${id}/confirmar-recepcion`, data || {});
    return response.data;
  }

  /**
   * Anular traspaso
   */
  async anular(id: string, motivoAnulacion: string): Promise<SingleResponse<Traspaso>> {
    const response = await api.post<SingleResponse<Traspaso>>(`${this.BASE_URL}/${id}/anular`, { motivoAnulacion });
    return response.data;
  }

  /**
   * Obtener estadísticas
   */
  async estadisticas(): Promise<SingleResponse<EstadisticasTraspasos>> {
    const response = await api.get<SingleResponse<EstadisticasTraspasos>>(`${this.BASE_URL}/estadisticas`);
    return response.data;
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Obtener etiqueta del estado
   */
  getEstadoLabel(estado: EstadoTraspaso): string {
    const labels: Record<EstadoTraspaso, string> = {
      [EstadoTraspaso.BORRADOR]: 'Borrador',
      [EstadoTraspaso.PENDIENTE_SALIDA]: 'Pendiente salida',
      [EstadoTraspaso.EN_TRANSITO]: 'En tránsito',
      [EstadoTraspaso.RECIBIDO_PARCIAL]: 'Recibido parcial',
      [EstadoTraspaso.RECIBIDO]: 'Recibido',
      [EstadoTraspaso.ANULADO]: 'Anulado',
    };
    return labels[estado] || estado;
  }

  /**
   * Obtener variante de badge para estado
   */
  getEstadoVariant(estado: EstadoTraspaso): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (estado) {
      case EstadoTraspaso.RECIBIDO:
        return 'default';
      case EstadoTraspaso.EN_TRANSITO:
      case EstadoTraspaso.RECIBIDO_PARCIAL:
        return 'secondary';
      case EstadoTraspaso.ANULADO:
        return 'destructive';
      default:
        return 'outline';
    }
  }

  /**
   * Obtener color de prioridad
   */
  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'urgente':
        return 'text-red-600';
      case 'alta':
        return 'text-orange-600';
      case 'normal':
        return 'text-blue-600';
      case 'baja':
        return 'text-gray-500';
      default:
        return '';
    }
  }

  /**
   * Verificar si se puede editar
   */
  puedeEditar(estado: EstadoTraspaso): boolean {
    return estado === EstadoTraspaso.BORRADOR;
  }

  /**
   * Verificar si se puede confirmar salida
   */
  puedeConfirmarSalida(estado: EstadoTraspaso): boolean {
    return estado === EstadoTraspaso.BORRADOR || estado === EstadoTraspaso.PENDIENTE_SALIDA;
  }

  /**
   * Verificar si se puede confirmar recepción
   */
  puedeConfirmarRecepcion(estado: EstadoTraspaso): boolean {
    return estado === EstadoTraspaso.EN_TRANSITO || estado === EstadoTraspaso.RECIBIDO_PARCIAL;
  }

  /**
   * Verificar si se puede anular
   */
  puedeAnular(estado: EstadoTraspaso): boolean {
    return estado !== EstadoTraspaso.ANULADO && estado !== EstadoTraspaso.RECIBIDO;
  }
}

export const traspasosService = new TraspasosService();
export default traspasosService;
