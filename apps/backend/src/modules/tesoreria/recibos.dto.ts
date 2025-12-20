import { EstadoRecibo, TipoDocumentoOrigenRecibo, TipoAdeudoSEPA } from './Recibo';

// ============================================
// DTOs para Recibos
// ============================================

export interface CreateReciboDTO {
  serie?: string;

  // Documento origen
  documentoOrigen?: {
    tipo: TipoDocumentoOrigenRecibo;
    id?: string;
    numero?: string;
  };

  // Vencimiento asociado
  vencimientoId?: string;

  // Cliente
  clienteId: string;
  clienteNombre: string;
  clienteNIF?: string;
  clienteDireccion?: string;
  clienteLocalidad?: string;
  clienteProvincia?: string;
  clienteCodigoPostal?: string;

  // Datos del recibo
  concepto: string;
  importe: number;
  fechaEmision?: Date | string;
  fechaVencimiento: Date | string;

  // Datos bancarios
  cuentaBancariaEmpresaId?: string;
  ibanEmpresa?: string;
  ibanCliente?: string;
  bicCliente?: string;

  // Mandato SEPA
  mandatoSEPA?: {
    referencia: string;
    fechaFirma: Date | string;
    tipoAdeudo: TipoAdeudoSEPA;
  };

  observaciones?: string;
}

export interface UpdateReciboDTO {
  concepto?: string;
  fechaVencimiento?: Date | string;
  ibanCliente?: string;
  bicCliente?: string;
  mandatoSEPA?: {
    referencia: string;
    fechaFirma: Date | string;
    tipoAdeudo: TipoAdeudoSEPA;
    activo: boolean;
  };
  observaciones?: string;
}

export interface GenerarRecibosDesdeFacturaDTO {
  facturaId: string;
  serie?: string;
}

export interface GenerarRecibosDesdeVencimientosDTO {
  vencimientoIds: string[];
  serie?: string;
}

export interface MarcarEnviadoDTO {
  fechaEnvio?: Date | string;
}

export interface MarcarCobradoDTO {
  fechaCobro?: Date | string;
  observaciones?: string;
}

export interface MarcarDevueltoDTO {
  motivo: string;
  comision?: number;
  observaciones?: string;
}

export interface SearchRecibosDTO {
  q?: string;
  estado?: EstadoRecibo;
  clienteId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  vencidos?: string;           // 'true' o 'false'
  remesaId?: string;
  sinRemesa?: string;          // 'true' o 'false'
  puedeEnviarABanco?: string;  // 'true' o 'false' - tiene mandato SEPA activo
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CrearRemesaRecibosDTO {
  reciboIds: string[];
  fechaRemesa?: Date | string;
  cuentaBancariaEmpresaId?: string;
}
