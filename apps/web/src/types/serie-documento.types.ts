// ============================================
// TIPOS DE SERIES DE DOCUMENTOS
// ============================================

// Tipos de documento que pueden tener series
export type TipoDocumentoSerie =
  | 'presupuesto'
  | 'pedido'
  | 'albaran'
  | 'factura'
  | 'factura_rectificativa'
  | 'pedido_proveedor'
  | 'albaran_proveedor'
  | 'factura_proveedor';

// Interfaz principal de Serie de Documento
export interface ISerieDocumento {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoDocumento: TipoDocumentoSerie;
  prefijo?: string;
  sufijo?: string;
  longitudNumero: number;
  siguienteNumero: number;
  incluirAnio: boolean;
  separadorAnio: string;
  reiniciarAnualmente: boolean;
  ultimoAnioReinicio?: number;
  activo: boolean;
  predeterminada: boolean;
  previsualizacion?: string;
  createdAt: string;
  updatedAt: string;
}

// DTOs
export interface CreateSerieDocumentoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoDocumento: TipoDocumentoSerie;
  prefijo?: string;
  sufijo?: string;
  longitudNumero?: number;
  siguienteNumero?: number;
  incluirAnio?: boolean;
  separadorAnio?: string;
  reiniciarAnualmente?: boolean;
  activo?: boolean;
  predeterminada?: boolean;
}

export interface UpdateSerieDocumentoDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  prefijo?: string;
  sufijo?: string;
  longitudNumero?: number;
  siguienteNumero?: number;
  incluirAnio?: boolean;
  separadorAnio?: string;
  reiniciarAnualmente?: boolean;
  activo?: boolean;
  predeterminada?: boolean;
}

export interface SearchSeriesDocumentosParams {
  q?: string;
  tipoDocumento?: TipoDocumentoSerie;
  activo?: string;
  predeterminada?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Respuestas
export interface SerieDocumentoResponse {
  success: boolean;
  data?: ISerieDocumento;
  message?: string;
  error?: string;
}

export interface SeriesDocumentosResponse {
  success: boolean;
  data?: ISerieDocumento[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  message?: string;
  error?: string;
}

export interface SugerirCodigoResponse {
  success: boolean;
  data?: {
    codigo: string;
    serieId: string;
    siguienteNumero: number;
  };
  error?: string;
}

// Labels y opciones para UI
export const TIPOS_DOCUMENTO_LABELS: Record<TipoDocumentoSerie, string> = {
  presupuesto: 'Presupuesto',
  pedido: 'Pedido de Venta',
  albaran: 'Albarán de Entrega',
  factura: 'Factura',
  factura_rectificativa: 'Factura Rectificativa',
  pedido_proveedor: 'Pedido a Proveedor',
  albaran_proveedor: 'Albarán de Proveedor',
  factura_proveedor: 'Factura de Proveedor',
};

export const TIPOS_DOCUMENTO_OPTIONS = Object.entries(TIPOS_DOCUMENTO_LABELS).map(
  ([value, label]) => ({
    value: value as TipoDocumentoSerie,
    label,
  })
);

// Helper para obtener label del tipo de documento
export const getTipoDocumentoLabel = (tipo: TipoDocumentoSerie): string => {
  return TIPOS_DOCUMENTO_LABELS[tipo] || tipo;
};
