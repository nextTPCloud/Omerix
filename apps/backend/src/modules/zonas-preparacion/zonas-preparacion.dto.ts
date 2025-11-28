/**
 * DTOs para el módulo de Zonas de Preparación
 */

export interface CreateZonaPreparacionDTO {
  nombre: string;
  codigo?: string;
  descripcion?: string;
  color?: string;
  impresoraId?: string;
  imprimirComanda?: boolean;
  copias?: number;
  tieneMonitor?: boolean;
  configuracionMonitor?: {
    sonidoNuevaComanda?: boolean;
    sonidoUrgente?: boolean;
    tiempoAlertaMinutos?: number;
    mostrarTiempoPreparacion?: boolean;
    ordenVisualizacion?: 'fifo' | 'prioridad' | 'mesa';
    columnas?: number;
  };
  almacenId?: string;
  familiasIds?: string[];
  orden?: number;
  activo?: boolean;
}

export interface UpdateZonaPreparacionDTO extends Partial<CreateZonaPreparacionDTO> {}

export interface SearchZonasPreparacionDTO {
  q?: string;
  activo?: boolean;
  almacenId?: string;
  tieneMonitor?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
