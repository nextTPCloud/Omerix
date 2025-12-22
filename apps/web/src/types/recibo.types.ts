/**
 * Tipos para gestión de recibos bancarios
 */

export enum EstadoRecibo {
  EMITIDO = 'emitido',
  ENVIADO = 'enviado',
  COBRADO = 'cobrado',
  DEVUELTO = 'devuelto',
  ANULADO = 'anulado',
}

export enum TipoAdeudoSEPA {
  RCUR = 'RCUR',  // Recurrente
  FRST = 'FRST',  // Primera vez
  OOFF = 'OOFF',  // Único
  FNAL = 'FNAL',  // Final
}

export interface IDocumentoOrigenRecibo {
  tipo: 'factura' | 'vencimiento';
  id: string;
  numero: string;
}

export interface IMandatoSEPA {
  referencia: string;
  fechaFirma: string;
  tipoAdeudo: TipoAdeudoSEPA;
}

export interface IRecibo {
  _id: string;
  empresaId?: string;
  numero: string;
  serie: string;

  // Documento origen
  documentoOrigen?: IDocumentoOrigenRecibo;

  // Cliente
  clienteId: string;
  clienteNombre: string;
  clienteNIF: string;
  clienteDireccion?: string;

  // Datos del recibo
  concepto: string;
  importe: number;
  fechaEmision: string;
  fechaVencimiento: string;

  // Datos bancarios
  cuentaBancariaEmpresa?: string;
  cuentaBancariaCliente?: string;
  mandatoSEPA?: IMandatoSEPA;

  // Estado
  estado: EstadoRecibo;
  fechaEnvio?: string;
  fechaCobro?: string;
  fechaDevolucion?: string;
  motivoDevolucion?: string;
  comisionDevolucion?: number;

  // Remesa
  remesaId?: string;
  remesaNumero?: string;

  // Otros
  observaciones?: string;
  creadoPor: string;
  fechaCreacion: string;

  // Computed
  puedeEnviarABanco?: boolean;
}

export interface IReciboFilters {
  q?: string;
  estado?: EstadoRecibo;
  clienteId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  vencidos?: boolean;
  remesaId?: string;
  sinRemesa?: boolean;
  puedeEnviarABanco?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ICrearReciboDTO {
  clienteId: string;
  concepto: string;
  importe: number;
  fechaEmision?: string;
  fechaVencimiento: string;
  cuentaBancariaEmpresa?: string;
  cuentaBancariaCliente?: string;
  observaciones?: string;
  serie?: string;
}

export interface IGenerarRecibosDesdeFacturaDTO {
  facturaId: string;
  serie?: string;
}

export interface IGenerarRecibosDesdeVencimientosDTO {
  vencimientoIds: string[];
  serie?: string;
}

export interface ICrearRemesaDTO {
  nombre?: string;
  reciboIds: string[];
  fechaRemesa?: string;
  fechaCargo?: string;
  cuentaBancariaEmpresaId?: string;
}

export interface IRemesa {
  _id: string;
  numero: string;
  fechaRemesa: string;
  cuentaBancariaEmpresaId: string;
  totalRecibos: number;
  importeTotal: number;
  estado: 'pendiente' | 'enviada' | 'procesada';
  fechaEnvio?: string;
  ficheroGenerado?: string;
  recibos: IRecibo[];
  creadoPor: string;
  fechaCreacion: string;
}

// Colores para estados
export const ESTADO_RECIBO_COLORS: Record<EstadoRecibo, string> = {
  [EstadoRecibo.EMITIDO]: 'bg-yellow-100 text-yellow-800',
  [EstadoRecibo.ENVIADO]: 'bg-blue-100 text-blue-800',
  [EstadoRecibo.COBRADO]: 'bg-green-100 text-green-800',
  [EstadoRecibo.DEVUELTO]: 'bg-red-100 text-red-800',
  [EstadoRecibo.ANULADO]: 'bg-gray-100 text-gray-800',
};

export const ESTADO_RECIBO_LABELS: Record<EstadoRecibo, string> = {
  [EstadoRecibo.EMITIDO]: 'Emitido',
  [EstadoRecibo.ENVIADO]: 'Enviado al banco',
  [EstadoRecibo.COBRADO]: 'Cobrado',
  [EstadoRecibo.DEVUELTO]: 'Devuelto',
  [EstadoRecibo.ANULADO]: 'Anulado',
};

export const TIPO_ADEUDO_SEPA_LABELS: Record<TipoAdeudoSEPA, string> = {
  [TipoAdeudoSEPA.RCUR]: 'Recurrente',
  [TipoAdeudoSEPA.FRST]: 'Primera vez',
  [TipoAdeudoSEPA.OOFF]: 'Único',
  [TipoAdeudoSEPA.FNAL]: 'Final',
};
