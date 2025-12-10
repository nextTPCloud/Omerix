import {
  EstadoFactura,
  TipoFactura,
  TipoLinea,
  MetodoPago,
  MotivoRectificacion,
  SistemaFiscal,
  IDireccion,
} from './Factura';

// ============================================
// LÍNEA DE FACTURA
// ============================================

export interface LineaFacturaDTO {
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
  cantidad?: number;
  unidad?: string;
  precioUnitario?: number;
  descuento?: number;
  iva?: number;
  recargoEquivalencia?: number;
  costeUnitario?: number;
  componentesKit?: {
    productoId: string;
    nombre: string;
    sku?: string;
    cantidad: number;
    precioUnitario: number;
    costeUnitario?: number;
    descuento?: number;
    iva?: number;
    subtotal: number;
    opcional?: boolean;
    seleccionado?: boolean;
  }[];
  mostrarComponentes?: boolean;
  esEditable?: boolean;
  incluidoEnTotal?: boolean;
  albaranLineaId?: string;
  pedidoLineaId?: string;
}

// ============================================
// VENCIMIENTO
// ============================================

export interface VencimientoDTO {
  numero?: number;
  fecha: Date | string;
  importe: number;
  metodoPago?: MetodoPago;
  cobrado?: boolean;
  fechaCobro?: Date | string;
  referenciaPago?: string;
  observaciones?: string;
}

// ============================================
// COBRO
// ============================================

export interface CobroDTO {
  fecha: Date | string;
  importe: number;
  metodoPago: MetodoPago;
  referencia?: string;
  cuentaDestino?: string;
  observaciones?: string;
}

// ============================================
// CREAR FACTURA
// ============================================

export interface CreateFacturaDTO {
  serie?: string;
  tipo?: TipoFactura;
  estado?: EstadoFactura;
  fecha?: Date | string;
  fechaOperacion?: Date | string;
  fechaVencimiento?: Date | string;
  periodoFacturacion?: {
    desde: Date | string;
    hasta: Date | string;
  };

  // Rectificativa
  esRectificativa?: boolean;
  facturaRectificadaId?: string;
  facturaRectificadaCodigo?: string;
  motivoRectificacion?: MotivoRectificacion;
  descripcionRectificacion?: string;

  // Cliente
  clienteId: string;
  clienteNombre?: string;
  clienteNif?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccion;

  // Orígenes
  albaranesOrigen?: string[];
  pedidosOrigen?: string[];
  presupuestosOrigen?: string[];

  // Relaciones
  proyectoId?: string;
  agenteComercialId?: string;

  // Referencias
  referenciaCliente?: string;

  // Título y descripción
  titulo?: string;
  descripcion?: string;

  // Líneas
  lineas?: LineaFacturaDTO[];

  // Descuento global
  descuentoGlobalPorcentaje?: number;

  // Vencimientos
  vencimientos?: VencimientoDTO[];

  // Datos fiscales
  regimenIva?: string;
  claveOperacion?: string;
  recargoEquivalencia?: boolean;
  retencionIRPF?: number;

  // Sistema fiscal
  sistemaFiscal?: SistemaFiscal;

  // Textos
  observaciones?: string;
  observacionesInternas?: string;
  condicionesPago?: string;
  pieFactura?: string;

  // Tags
  tags?: string[];

  // Configuración
  mostrarCostes?: boolean;
  mostrarMargenes?: boolean;
  mostrarComponentesKit?: boolean;
  mostrarPrecios?: boolean;
}

// ============================================
// ACTUALIZAR FACTURA
// ============================================

export interface UpdateFacturaDTO extends Partial<CreateFacturaDTO> {}

// ============================================
// BUSCAR FACTURAS
// ============================================

export interface SearchFacturasDTO {
  search?: string;
  clienteId?: string;
  proyectoId?: string;
  agenteComercialId?: string;
  estado?: EstadoFactura;
  estados?: string; // Separados por coma
  tipo?: TipoFactura;
  serie?: string;
  activo?: 'true' | 'false' | 'all';
  cobrada?: 'true' | 'false';
  vencida?: 'true' | 'false';
  rectificativa?: 'true' | 'false';
  fechaDesde?: string;
  fechaHasta?: string;
  fechaVencimientoDesde?: string;
  fechaVencimientoHasta?: string;
  importeMin?: string;
  importeMax?: string;
  albaranOrigenId?: string;
  pedidoOrigenId?: string;
  sistemaFiscal?: SistemaFiscal;
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// CREAR DESDE ALBARANES
// ============================================

export interface CrearDesdeAlbaranesDTO {
  albaranesIds: string[];
  agruparPorCliente?: boolean;
  fechaFactura?: Date | string;
  fechaVencimiento?: Date | string;
  serie?: string;
  observaciones?: string;
  metodoPago?: MetodoPago;
}

// ============================================
// CREAR FACTURA DIRECTA DESDE ALBARANES (EMITIDA)
// ============================================

export interface CrearFacturaDirectaDTO extends CrearDesdeAlbaranesDTO {
  // Si true, emite la factura directamente (estado EMITIDA, no BORRADOR)
  emitirDirectamente: boolean;
  // Sistema fiscal a usar
  sistemaFiscal?: SistemaFiscal;
  // Si true, envía automáticamente a AEAT (VeriFactu)
  enviarAAEAT?: boolean;
}

// ============================================
// CREAR FACTURA RECTIFICATIVA
// ============================================

export interface CrearRectificativaDTO {
  facturaOriginalId: string;
  motivoRectificacion: MotivoRectificacion;
  descripcionRectificacion: string;
  serie?: string;
  lineas?: LineaFacturaDTO[];
  importeRectificar?: number; // Si es rectificación parcial
}

// ============================================
// REGISTRAR COBRO
// ============================================

export interface RegistrarCobroDTO {
  fecha: Date | string;
  importe: number;
  metodoPago: MetodoPago;
  referencia?: string;
  cuentaDestino?: string;
  observaciones?: string;
  vencimientoId?: string; // Si se asocia a un vencimiento específico
}

// ============================================
// CAMBIAR ESTADO
// ============================================

export interface CambiarEstadoDTO {
  estado: EstadoFactura;
  observaciones?: string;
}

// ============================================
// EMITIR FACTURA (Con datos fiscales)
// ============================================

export interface EmitirFacturaDTO {
  sistemaFiscal?: SistemaFiscal;
  enviarAHacienda?: boolean;
  generarPDF?: boolean;
  enviarPorEmail?: boolean;
  emailDestino?: string;
  // VeriFactu - envío automático a AEAT
  entornoVeriFactu?: 'test' | 'production';
  certificadoId?: string;
}

// ============================================
// ANULAR FACTURA
// ============================================

export interface AnularFacturaDTO {
  motivo: string;
  crearRectificativa?: boolean;
  descripcion?: string;
}

// ============================================
// RESPUESTAS
// ============================================

export interface FacturaResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  error?: string;
}

export interface FacturasListResponse {
  success: boolean;
  data: unknown[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EstadisticasFacturasResponse {
  success: boolean;
  data: {
    total: number;
    porEstado: Record<string, number>;
    totalFacturado: number;
    totalCobrado: number;
    totalPendiente: number;
    totalVencido: number;
    porPeriodo?: {
      mes: number;
      año: number;
      cantidad: number;
      importe: number;
    }[];
  };
}

// ============================================
// VALIDACIONES CON SWAGGER DECORATORS
// ============================================

export const ESTADOS_FACTURA = Object.values(EstadoFactura);
export const TIPOS_FACTURA = Object.values(TipoFactura);
export const METODOS_PAGO = Object.values(MetodoPago);
export const MOTIVOS_RECTIFICACION = Object.values(MotivoRectificacion);
export const SISTEMAS_FISCALES = Object.values(SistemaFiscal);
