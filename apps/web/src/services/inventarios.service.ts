import { api } from './api';

// ============================================
// ENUMS Y TIPOS
// ============================================

export enum EstadoInventario {
  BORRADOR = 'borrador',
  EN_CONTEO = 'en_conteo',
  PENDIENTE_REVISION = 'pendiente_revision',
  REGULARIZADO = 'regularizado',
  ANULADO = 'anulado',
}

export enum TipoInventario {
  TOTAL = 'total',
  PARCIAL = 'parcial',
}

export enum EstadoLineaInventario {
  PENDIENTE = 'pendiente',
  CONTADO = 'contado',
  REVISADO = 'revisado',
  REGULARIZADO = 'regularizado',
}

export interface LineaInventario {
  _id?: string;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  productoSku?: string;
  varianteId?: string;
  varianteNombre?: string;
  ubicacion?: string;
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: string;
  stockTeorico: number;
  stockContado: number | null;
  diferencia: number;
  estadoLinea: EstadoLineaInventario;
  costeUnitario: number;
  valorDiferencia: number;
  fechaConteo?: string;
  usuarioConteoId?: string;
  usuarioConteoNombre?: string;
  aprobado: boolean | null;
  motivoAjuste?: string;
  observaciones?: string;
  fotoUrl?: string;
}

export interface Inventario {
  _id: string;
  codigo: string;
  almacenId: string;
  almacenNombre: string;
  tipo: TipoInventario;
  estado: EstadoInventario;
  familiaIds?: string[];
  ubicaciones?: string[];
  soloConStock?: boolean;
  fechaCreacion: string;
  fechaInicio?: string;
  fechaFinConteo?: string;
  fechaRegularizacion?: string;
  fechaAnulacion?: string;
  usuarioCreadorId: string;
  usuarioCreadorNombre: string;
  usuarioResponsableId?: string;
  usuarioResponsableNombre?: string;
  lineas: LineaInventario[];
  totalProductos: number;
  productosContados: number;
  productosConDiferencia: number;
  valorTeorico: number;
  valorContado: number;
  valorDiferencia: number;
  valorSobrante: number;
  valorFaltante: number;
  bloquearMovimientos: boolean;
  observaciones?: string;
  motivoAnulacion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventarioDTO {
  almacenId: string;
  tipo: 'total' | 'parcial';
  familiaIds?: string[];
  ubicaciones?: string[];
  soloConStock?: boolean;
  bloquearMovimientos?: boolean;
  observaciones?: string;
}

export interface IniciarInventarioDTO {
  usuarioResponsableId?: string;
}

export interface ConteoLineaDTO {
  stockContado: number;
  ubicacion?: string;
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: string;
  observaciones?: string;
  fotoUrl?: string;
}

export interface ActualizarConteosDTO {
  lineas: {
    lineaId: string;
    stockContado: number;
    ubicacion?: string;
    lote?: string;
    numeroSerie?: string;
    fechaCaducidad?: string;
    observaciones?: string;
    fotoUrl?: string;
  }[];
}

export interface RevisarDiferenciasDTO {
  lineas: {
    lineaId: string;
    aprobado: boolean;
    motivoAjuste?: string;
  }[];
}

export interface RegularizarInventarioDTO {
  observacionesRegularizacion?: string;
}

export interface SearchInventariosParams {
  q?: string;
  almacenId?: string;
  tipo?: TipoInventario;
  estado?: EstadoInventario;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EstadisticasInventarios {
  enConteo: number;
  pendienteRevision: number;
  regularizados: number;
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

class InventariosService {
  private readonly BASE_URL = '/inventarios';

  /**
   * Listar inventarios con filtros
   */
  async listar(params?: SearchInventariosParams): Promise<PaginatedResponse<Inventario>> {
    const response = await api.get<PaginatedResponse<Inventario>>(this.BASE_URL, { params });
    return response.data;
  }

  /**
   * Obtener inventario por ID
   */
  async obtenerPorId(id: string): Promise<SingleResponse<Inventario>> {
    const response = await api.get<SingleResponse<Inventario>>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Crear inventario
   */
  async crear(data: CreateInventarioDTO): Promise<SingleResponse<Inventario>> {
    const response = await api.post<SingleResponse<Inventario>>(this.BASE_URL, data);
    return response.data;
  }

  /**
   * Iniciar inventario
   */
  async iniciar(id: string, data?: IniciarInventarioDTO): Promise<SingleResponse<Inventario>> {
    const response = await api.post<SingleResponse<Inventario>>(`${this.BASE_URL}/${id}/iniciar`, data || {});
    return response.data;
  }

  /**
   * Actualizar conteos de múltiples líneas
   */
  async actualizarConteos(id: string, data: ActualizarConteosDTO): Promise<SingleResponse<Inventario>> {
    const response = await api.put<SingleResponse<Inventario>>(`${this.BASE_URL}/${id}/conteos`, data);
    return response.data;
  }

  /**
   * Actualizar conteo de una línea
   */
  async actualizarConteoLinea(id: string, lineaId: string, data: ConteoLineaDTO): Promise<SingleResponse<Inventario>> {
    const response = await api.put<SingleResponse<Inventario>>(`${this.BASE_URL}/${id}/lineas/${lineaId}/conteo`, data);
    return response.data;
  }

  /**
   * Finalizar conteo
   */
  async finalizarConteo(id: string): Promise<SingleResponse<Inventario>> {
    const response = await api.post<SingleResponse<Inventario>>(`${this.BASE_URL}/${id}/finalizar-conteo`);
    return response.data;
  }

  /**
   * Revisar diferencias
   */
  async revisarDiferencias(id: string, data: RevisarDiferenciasDTO): Promise<SingleResponse<Inventario>> {
    const response = await api.put<SingleResponse<Inventario>>(`${this.BASE_URL}/${id}/revisar-diferencias`, data);
    return response.data;
  }

  /**
   * Regularizar inventario
   */
  async regularizar(id: string, data?: RegularizarInventarioDTO): Promise<SingleResponse<Inventario>> {
    const response = await api.post<SingleResponse<Inventario>>(`${this.BASE_URL}/${id}/regularizar`, data || {});
    return response.data;
  }

  /**
   * Anular inventario
   */
  async anular(id: string, motivoAnulacion: string): Promise<SingleResponse<Inventario>> {
    const response = await api.post<SingleResponse<Inventario>>(`${this.BASE_URL}/${id}/anular`, { motivoAnulacion });
    return response.data;
  }

  /**
   * Obtener estadísticas
   */
  async estadisticas(): Promise<SingleResponse<EstadisticasInventarios>> {
    const response = await api.get<SingleResponse<EstadisticasInventarios>>(`${this.BASE_URL}/estadisticas`);
    return response.data;
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Obtener etiqueta del estado
   */
  getEstadoLabel(estado: EstadoInventario): string {
    const labels: Record<EstadoInventario, string> = {
      [EstadoInventario.BORRADOR]: 'Borrador',
      [EstadoInventario.EN_CONTEO]: 'En conteo',
      [EstadoInventario.PENDIENTE_REVISION]: 'Pendiente revisión',
      [EstadoInventario.REGULARIZADO]: 'Regularizado',
      [EstadoInventario.ANULADO]: 'Anulado',
    };
    return labels[estado] || estado;
  }

  /**
   * Obtener variante de badge para estado
   */
  getEstadoVariant(estado: EstadoInventario): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (estado) {
      case EstadoInventario.REGULARIZADO:
        return 'default';
      case EstadoInventario.EN_CONTEO:
      case EstadoInventario.PENDIENTE_REVISION:
        return 'secondary';
      case EstadoInventario.ANULADO:
        return 'destructive';
      default:
        return 'outline';
    }
  }

  /**
   * Obtener etiqueta del tipo
   */
  getTipoLabel(tipo: TipoInventario): string {
    return tipo === TipoInventario.TOTAL ? 'Total' : 'Parcial';
  }

  /**
   * Verificar si se puede iniciar
   */
  puedeIniciar(estado: EstadoInventario): boolean {
    return estado === EstadoInventario.BORRADOR;
  }

  /**
   * Verificar si se puede contar
   */
  puedeContar(estado: EstadoInventario): boolean {
    return estado === EstadoInventario.EN_CONTEO;
  }

  /**
   * Verificar si se puede finalizar conteo
   */
  puedeFinalizarConteo(estado: EstadoInventario): boolean {
    return estado === EstadoInventario.EN_CONTEO;
  }

  /**
   * Verificar si se puede revisar
   */
  puedeRevisar(estado: EstadoInventario): boolean {
    return estado === EstadoInventario.PENDIENTE_REVISION;
  }

  /**
   * Verificar si se puede regularizar
   */
  puedeRegularizar(estado: EstadoInventario): boolean {
    return estado === EstadoInventario.PENDIENTE_REVISION;
  }

  /**
   * Verificar si se puede anular
   */
  puedeAnular(estado: EstadoInventario): boolean {
    return estado !== EstadoInventario.ANULADO && estado !== EstadoInventario.REGULARIZADO;
  }

  /**
   * Obtener estado de línea label
   */
  getEstadoLineaLabel(estado: EstadoLineaInventario): string {
    const labels: Record<EstadoLineaInventario, string> = {
      [EstadoLineaInventario.PENDIENTE]: 'Pendiente',
      [EstadoLineaInventario.CONTADO]: 'Contado',
      [EstadoLineaInventario.REVISADO]: 'Revisado',
      [EstadoLineaInventario.REGULARIZADO]: 'Regularizado',
    };
    return labels[estado] || estado;
  }
}

export const inventariosService = new InventariosService();
export default inventariosService;
