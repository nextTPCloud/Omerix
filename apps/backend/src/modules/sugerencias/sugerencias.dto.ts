// ============================================
// DTOs SUGERENCIAS
// ============================================

export interface ProductoSugeridoDTO {
  productoId: string;
  orden?: number;
  descuento?: number;
  textoPersonalizado?: string;
}

export interface CreateSugerenciaDTO {
  nombre: string;
  descripcion?: string;
  tipo: 'complementario' | 'upgrade' | 'alternativa' | 'acompanamiento' | 'postre' | 'bebida';
  momento?: 'al_agregar' | 'al_finalizar' | 'automatico';
  productoBaseId?: string;
  familiaBaseId?: string;
  productosSugeridos: ProductoSugeridoDTO[];
  condicionHoraria?: {
    horaInicio: string;
    horaFin: string;
    diasSemana: number[];
    activo?: boolean;
  };
  prioridad?: number;
}

export interface UpdateSugerenciaDTO extends Partial<CreateSugerenciaDTO> {
  activo?: boolean;
}

export interface FiltrosSugerenciasDTO {
  tipo?: string;
  momento?: string;
  productoId?: string;
  familiaId?: string;
  activo?: boolean;
  busqueda?: string;
  page?: number;
  limit?: number;
}
