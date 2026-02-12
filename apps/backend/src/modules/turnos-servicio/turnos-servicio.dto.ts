export interface CreateTurnoServicioDTO {
  nombre: string;
  codigo: string;
  horaInicio: string;
  horaFin: string;
  diasSemana: ('lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo')[];
  salonesIds?: string[];
  maxCamareros?: number;
  color?: string;
  descripcion?: string;
}

export interface UpdateTurnoServicioDTO {
  nombre?: string;
  codigo?: string;
  horaInicio?: string;
  horaFin?: string;
  diasSemana?: ('lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo')[];
  salonesIds?: string[];
  maxCamareros?: number;
  activo?: boolean;
  color?: string;
  descripcion?: string;
}

export interface FiltrosTurnosServicioDTO {
  activo?: boolean;
  busqueda?: string;
  page?: number;
  limit?: number;
}
