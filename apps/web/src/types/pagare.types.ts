/**
 * Tipos para gestión de pagarés
 */

export enum TipoPagare {
  EMITIDO = 'emitido',
  RECIBIDO = 'recibido',
}

export enum EstadoPagare {
  PENDIENTE = 'pendiente',
  EN_CARTERA = 'en_cartera',
  COBRADO = 'cobrado',
  PAGADO = 'pagado',
  DEVUELTO = 'devuelto',
  ANULADO = 'anulado',
}

export interface IDocumentoOrigenPagare {
  tipo: 'factura' | 'albaran' | 'pedido';
  id: string;
  numero: string;
}

export interface IHistorialPagare {
  fecha: string;
  estadoAnterior: EstadoPagare;
  estadoNuevo: EstadoPagare;
  usuarioId: string;
  usuarioNombre?: string;
  observaciones?: string;
}

export interface IPagare {
  _id: string;
  empresaId?: string;
  numero: string;
  tipo: TipoPagare;

  // Documento origen
  documentoOrigen?: IDocumentoOrigenPagare;

  // Tercero
  terceroId: string;
  terceroTipo: 'cliente' | 'proveedor';
  terceroNombre: string;
  terceroNif?: string;

  // Datos del pagaré
  importe: number;
  fechaEmision: string;
  fechaVencimiento: string;

  // Datos bancarios
  bancoEmisor?: string;
  cuentaOrigen?: string;
  cuentaDestino?: string;

  // Estado
  estado: EstadoPagare;
  fechaCobro?: string;
  fechaPago?: string;
  fechaDevolucion?: string;
  motivoDevolucion?: string;

  // Remesa
  remesaId?: string;
  remesaNumero?: string;

  // Historial
  historial: IHistorialPagare[];

  // Otros
  observaciones?: string;
  creadoPor: string;
  modificadoPor?: string;
  fechaCreacion: string;
  fechaModificacion?: string;
}

export interface IPagareFilters {
  q?: string;
  tipo?: TipoPagare;
  estado?: EstadoPagare;
  terceroId?: string;
  terceroTipo?: 'cliente' | 'proveedor';
  fechaDesde?: string;
  fechaHasta?: string;
  vencidos?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ICrearPagareDTO {
  tipo: TipoPagare;
  documentoOrigen?: IDocumentoOrigenPagare;
  terceroId: string;
  terceroTipo: 'cliente' | 'proveedor';
  importe: number;
  fechaEmision: string;
  fechaVencimiento: string;
  bancoEmisor?: string;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  observaciones?: string;
}

export interface IActualizarPagareDTO {
  fechaVencimiento?: string;
  bancoEmisor?: string;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  observaciones?: string;
}

export interface IMarcarCobradoDTO {
  fechaCobro?: string;
  observaciones?: string;
}

export interface IMarcarDevueltoDTO {
  motivo: string;
  comision?: number;
  observaciones?: string;
}

// Colores para estados
export const ESTADO_PAGARE_COLORS: Record<EstadoPagare, string> = {
  [EstadoPagare.PENDIENTE]: 'bg-yellow-100 text-yellow-800',
  [EstadoPagare.EN_CARTERA]: 'bg-blue-100 text-blue-800',
  [EstadoPagare.COBRADO]: 'bg-green-100 text-green-800',
  [EstadoPagare.PAGADO]: 'bg-green-100 text-green-800',
  [EstadoPagare.DEVUELTO]: 'bg-red-100 text-red-800',
  [EstadoPagare.ANULADO]: 'bg-gray-100 text-gray-800',
};

export const ESTADO_PAGARE_LABELS: Record<EstadoPagare, string> = {
  [EstadoPagare.PENDIENTE]: 'Pendiente',
  [EstadoPagare.EN_CARTERA]: 'En cartera',
  [EstadoPagare.COBRADO]: 'Cobrado',
  [EstadoPagare.PAGADO]: 'Pagado',
  [EstadoPagare.DEVUELTO]: 'Devuelto',
  [EstadoPagare.ANULADO]: 'Anulado',
};

export const TIPO_PAGARE_LABELS: Record<TipoPagare, string> = {
  [TipoPagare.EMITIDO]: 'Emitido',
  [TipoPagare.RECIBIDO]: 'Recibido',
};
