import { TipoPagare, EstadoPagare, TipoDocumentoOrigenPagare } from './Pagare';

// ============================================
// DTOs para Pagarés
// ============================================

export interface CreatePagareDTO {
  tipo: TipoPagare;
  numeroPagare?: string;

  // Documento origen
  documentoOrigen?: {
    tipo: TipoDocumentoOrigenPagare;
    id?: string;
    numero?: string;
  };

  // Vencimiento asociado
  vencimientoId?: string;

  // Tercero
  terceroId: string;
  terceroTipo: 'cliente' | 'proveedor';
  terceroNombre: string;
  terceroNif?: string;

  // Datos del pagaré
  importe: number;
  fechaEmision: Date | string;
  fechaVencimiento: Date | string;

  // Datos bancarios
  bancoEmisor?: string;
  cuentaOrigen?: string;
  cuentaDestino?: string;

  observaciones?: string;
}

export interface UpdatePagareDTO {
  numeroPagare?: string;
  fechaVencimiento?: Date | string;
  bancoEmisor?: string;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  observaciones?: string;
}

export interface CrearPagareDesdeVencimientoDTO {
  vencimientoId: string;
  numeroPagare?: string;
  fechaVencimiento?: Date | string;
  bancoEmisor?: string;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  observaciones?: string;
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

export interface SearchPagaresDTO {
  q?: string;
  tipo?: TipoPagare;
  estado?: EstadoPagare;
  terceroId?: string;
  terceroTipo?: 'cliente' | 'proveedor';
  fechaDesde?: string;
  fechaHasta?: string;
  vencidos?: string;           // 'true' o 'false'
  remesaId?: string;
  sinRemesa?: string;          // 'true' o 'false'
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CrearRemesaPagaresDTO {
  pagareIds: string[];
  fechaRemesa?: Date | string;
}
