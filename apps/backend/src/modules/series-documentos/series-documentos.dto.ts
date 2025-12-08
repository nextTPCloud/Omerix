import { TipoDocumentoSerie } from './SerieDocumento';

// ============================================
// DTOs PARA SERIES DE DOCUMENTOS
// ============================================

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

export interface SearchSeriesDocumentosDTO {
  q?: string; // Búsqueda general
  tipoDocumento?: TipoDocumentoSerie;
  activo?: string; // 'true' | 'false' | 'all'
  predeterminada?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Tipos para respuestas
export interface SerieDocumentoResponse {
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
  previsualizacion?: string; // Previsualización del próximo código
  createdAt: string;
  updatedAt: string;
}

// Labels para tipos de documento
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

export const TIPOS_DOCUMENTO_OPTIONS = Object.entries(TIPOS_DOCUMENTO_LABELS).map(([value, label]) => ({
  value,
  label,
}));
