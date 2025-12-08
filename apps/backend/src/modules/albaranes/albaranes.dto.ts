import { EstadoAlbaran, TipoAlbaran, TipoLinea, IDireccionEntrega, IDatosTransporte, IDatosEntrega, IBultos } from './Albaran';

// ============================================
// LÍNEA DE ALBARÁN
// ============================================

export interface LineaAlbaranDTO {
  orden?: number;
  tipo?: TipoLinea;
  productoId?: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  descripcionLarga?: string;
  sku?: string;
  variante?: {
    varianteId?: string;
    sku: string;
    combinacion: Record<string, string>;
    precioAdicional?: number;
    costeAdicional?: number;
  };
  cantidadSolicitada?: number;
  cantidadEntregada?: number;
  unidad?: string;
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: Date | string;
  precioUnitario?: number;
  descuento?: number;
  iva?: number;
  costeUnitario?: number;
  componentesKit?: {
    productoId: string;
    nombre: string;
    sku?: string;
    cantidad: number;
    cantidadEntregada?: number;
    precioUnitario: number;
    costeUnitario?: number;
    descuento?: number;
    iva?: number;
    subtotal: number;
    opcional?: boolean;
    seleccionado?: boolean;
  }[];
  mostrarComponentes?: boolean;
  almacenId?: string;
  ubicacion?: string;
  esEditable?: boolean;
  incluidoEnTotal?: boolean;
  lineaPedidoId?: string;
  notasInternas?: string;
  notasEntrega?: string;
}

// ============================================
// CREAR ALBARÁN
// ============================================

export interface CreateAlbaranDTO {
  serie?: string;
  tipo?: TipoAlbaran;
  pedidoOrigenId?: string;
  presupuestoOrigenId?: string;
  estado?: EstadoAlbaran;
  fecha?: Date | string;
  fechaVencimiento?: Date | string;
  clienteId: string;
  clienteNombre?: string;
  clienteNif?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccionEntrega;
  direccionEntrega?: IDireccionEntrega;
  datosTransporte?: IDatosTransporte;
  datosEntrega?: IDatosEntrega;
  bultos?: IBultos;
  proyectoId?: string;
  almacenId?: string;
  agenteComercialId?: string;
  referenciaCliente?: string;
  pedidoCliente?: string;
  titulo?: string;
  descripcion?: string;
  lineas?: LineaAlbaranDTO[];
  descuentoGlobalPorcentaje?: number;
  observaciones?: string;
  observacionesInternas?: string;
  condicionesEntrega?: string;
  tags?: string[];
  mostrarCostes?: boolean;
  mostrarMargenes?: boolean;
  mostrarComponentesKit?: boolean;
  mostrarPrecios?: boolean;
}

// ============================================
// ACTUALIZAR ALBARÁN
// ============================================

export interface UpdateAlbaranDTO extends Partial<CreateAlbaranDTO> {}

// ============================================
// BUSCAR ALBARANES
// ============================================

export interface SearchAlbaranesDTO {
  search?: string;
  clienteId?: string;
  proyectoId?: string;
  agenteComercialId?: string;
  almacenId?: string;
  estado?: EstadoAlbaran;
  estados?: string; // Separados por coma
  tipo?: TipoAlbaran;
  serie?: string;
  activo?: 'true' | 'false' | 'all';
  facturado?: 'true' | 'false';
  fechaDesde?: string;
  fechaHasta?: string;
  fechaEntregaDesde?: string;
  fechaEntregaHasta?: string;
  importeMin?: string;
  importeMax?: string;
  pedidoOrigenId?: string;
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// CREAR DESDE PEDIDO
// ============================================

export interface CrearDesdePedidoDTO {
  lineasIds?: string[]; // IDs de líneas específicas, vacío = todas
  entregarTodo?: boolean; // Si true, pone cantidadEntregada = cantidadPendiente
  almacenId?: string;
  direccionEntrega?: IDireccionEntrega;
  datosTransporte?: IDatosTransporte;
  fechaEntregaProgramada?: Date | string;
  observaciones?: string;
}

// ============================================
// REGISTRAR ENTREGA
// ============================================

export interface LineaEntregadaDTO {
  lineaId: string;
  cantidadEntregada: number;
  lote?: string;
  numeroSerie?: string;
  observaciones?: string;
}

export interface RegistrarEntregaDTO {
  fechaEntrega?: Date | string;
  horaEntrega?: string;
  receptorNombre?: string;
  receptorDni?: string;
  firmaDigital?: string;
  observaciones?: string;
  fotosEntrega?: string[];
  incidencias?: string;
  lineasEntregadas?: LineaEntregadaDTO[];
}

// ============================================
// CAMBIAR ESTADO
// ============================================

export interface CambiarEstadoDTO {
  estado: EstadoAlbaran;
  observaciones?: string;
}

// ============================================
// RESPUESTAS
// ============================================

export interface AlbaranResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface AlbaranesListResponse {
  success: boolean;
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
