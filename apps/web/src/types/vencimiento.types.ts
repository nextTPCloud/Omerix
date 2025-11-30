// ============================================
// TIPOS DE VENCIMIENTO
// ============================================

export type TipoVencimiento = 'cobro' | 'pago';
export type EstadoVencimiento = 'pendiente' | 'parcial' | 'cobrado' | 'pagado' | 'impagado' | 'anulado';
export type TipoDocumentoOrigen = 'factura_venta' | 'factura_compra' | 'manual';

// ============================================
// CONSTANTES
// ============================================

export const TIPOS_VENCIMIENTO = [
  { value: 'cobro' as const, label: 'Cobro', color: 'green' },
  { value: 'pago' as const, label: 'Pago', color: 'red' },
];

export const ESTADOS_VENCIMIENTO = [
  { value: 'pendiente' as const, label: 'Pendiente', color: 'yellow' },
  { value: 'parcial' as const, label: 'Cobro parcial', color: 'blue' },
  { value: 'cobrado' as const, label: 'Cobrado', color: 'green' },
  { value: 'pagado' as const, label: 'Pagado', color: 'green' },
  { value: 'impagado' as const, label: 'Impagado', color: 'red' },
  { value: 'anulado' as const, label: 'Anulado', color: 'gray' },
];

export const TIPOS_DOCUMENTO_ORIGEN = [
  { value: 'factura_venta' as const, label: 'Factura de venta' },
  { value: 'factura_compra' as const, label: 'Factura de compra' },
  { value: 'manual' as const, label: 'Manual' },
];

// ============================================
// INTERFACES
// ============================================

export interface CobroParcial {
  _id?: string;
  fecha: Date | string;
  importe: number;
  formaPagoId?: string;
  referencia?: string;
  observaciones?: string;
}

export interface Vencimiento {
  _id: string;
  tipo: TipoVencimiento;
  numero: string;

  // Documento origen
  documentoOrigen: TipoDocumentoOrigen;
  documentoId?: string;
  documentoNumero?: string;

  // Tercero
  clienteId?: string;
  proveedorId?: string;
  terceroNombre: string;
  terceroNif?: string;

  // Importes
  importe: number;
  importeCobrado: number;
  importePendiente: number;

  // Fechas
  fechaEmision: Date | string;
  fechaVencimiento: Date | string;
  fechaCobro?: Date | string;

  // Forma de pago
  formaPagoId?: string;
  formaPagoNombre?: string;

  // Cuenta bancaria
  cuentaBancariaId?: string;
  iban?: string;

  // Remesa
  remesaId?: string;
  remesaNumero?: string;
  fechaRemesa?: Date | string;

  // Estado
  estado: EstadoVencimiento;

  // Cobros parciales
  cobrosParciales: CobroParcial[];

  // Virtuals
  diasVencido?: number;
  estaVencido?: boolean;
  porcentajeCobrado?: number;
  estadoLabel?: string;
  tipoLabel?: string;

  // Metadata
  observaciones?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// DTOs
// ============================================

export interface CreateVencimientoDTO {
  tipo: TipoVencimiento;
  documentoOrigen?: TipoDocumentoOrigen;
  documentoId?: string;
  documentoNumero?: string;
  clienteId?: string;
  proveedorId?: string;
  terceroNombre: string;
  terceroNif?: string;
  importe: number;
  fechaEmision: Date | string;
  fechaVencimiento: Date | string;
  formaPagoId?: string;
  formaPagoNombre?: string;
  cuentaBancariaId?: string;
  iban?: string;
  observaciones?: string;
}

export interface UpdateVencimientoDTO {
  terceroNombre?: string;
  terceroNif?: string;
  fechaVencimiento?: Date | string;
  formaPagoId?: string | null;
  formaPagoNombre?: string;
  cuentaBancariaId?: string | null;
  iban?: string;
  estado?: EstadoVencimiento;
  observaciones?: string;
}

export interface RegistrarCobroDTO {
  fecha?: Date | string;
  importe: number;
  formaPagoId?: string;
  referencia?: string;
  observaciones?: string;
}

export interface CrearRemesaDTO {
  vencimientoIds: string[];
  fechaRemesa?: Date | string;
  observaciones?: string;
}

// ============================================
// FILTROS
// ============================================

export interface VencimientoFilters {
  q?: string;
  tipo?: TipoVencimiento;
  estado?: EstadoVencimiento;
  clienteId?: string;
  proveedorId?: string;
  formaPagoId?: string;
  remesaId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  vencidos?: boolean;
  sinRemesa?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// ESTADÍSTICAS
// ============================================

export interface VencimientoStats {
  totalPendiente: number;
  totalImporte: number;
  countPendientes: number;
  totalVencido: number;
  countVencidos: number;
}

export interface ResumenTesoreria {
  totalPendiente: number;
  totalVencimientosHoy: number;
  totalVencido: number;
  totalProximos7Dias: number;
  countPendientes: number;
}

// ============================================
// REMESA
// ============================================

export interface Remesa {
  remesaId: string;
  remesaNumero: string;
  fechaRemesa: Date | string;
  vencimientos: Vencimiento[];
  totalRemesa: number;
  countVencimientos: number;
}
