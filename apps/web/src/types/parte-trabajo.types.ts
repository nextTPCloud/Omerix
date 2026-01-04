// ============================================
// ENUMS Y TIPOS
// ============================================

export type EstadoParteTrabajo =
  | 'borrador'
  | 'planificado'
  | 'en_curso'
  | 'pausado'
  | 'completado'
  | 'facturado'
  | 'anulado';

export type TipoParteTrabajo =
  | 'mantenimiento'
  | 'instalacion'
  | 'reparacion'
  | 'servicio'
  | 'proyecto'
  | 'otro';

export type Prioridad = 'baja' | 'media' | 'alta' | 'urgente';

export type TipoUnidadMaquinaria = 'horas' | 'dias' | 'km' | 'unidades';

// ============================================
// CONSTANTES PARA UI
// ============================================

export const ESTADOS_PARTE_TRABAJO = [
  { value: 'borrador', label: 'Borrador', color: 'gray' },
  { value: 'planificado', label: 'Planificado', color: 'blue' },
  { value: 'en_curso', label: 'En Curso', color: 'yellow' },
  { value: 'pausado', label: 'Pausado', color: 'orange' },
  { value: 'completado', label: 'Completado', color: 'green' },
  { value: 'facturado', label: 'Facturado', color: 'purple' },
  { value: 'anulado', label: 'Anulado', color: 'red' },
] as const;

export const TIPOS_PARTE_TRABAJO = [
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'instalacion', label: 'Instalacion' },
  { value: 'reparacion', label: 'Reparacion' },
  { value: 'servicio', label: 'Servicio' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'otro', label: 'Otro' },
] as const;

export const PRIORIDADES = [
  { value: 'baja', label: 'Baja', color: 'gray' },
  { value: 'media', label: 'Media', color: 'blue' },
  { value: 'alta', label: 'Alta', color: 'orange' },
  { value: 'urgente', label: 'Urgente', color: 'red' },
] as const;

export const TIPOS_UNIDAD_MAQUINARIA = [
  { value: 'horas', label: 'Horas', abbr: 'h' },
  { value: 'dias', label: 'Dias', abbr: 'd' },
  { value: 'km', label: 'Kilometros', abbr: 'km' },
  { value: 'unidades', label: 'Unidades', abbr: 'ud' },
] as const;

// ============================================
// INTERFACES DE LINEAS
// ============================================

export interface LineaPersonal {
  _id?: string;
  personalId?: string;
  personalCodigo?: string;
  personalNombre: string;
  categoria?: string;
  // Producto servicio para obtener precios
  productoServicioId?: string;
  productoServicioCodigo?: string;
  productoServicioNombre?: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  horasTrabajadas: number;
  horasExtras?: number;
  tarifaHoraCoste: number;
  tarifaHoraVenta: number;
  costeTotal: number;
  ventaTotal: number;
  descripcionTrabajo?: string;
  facturable: boolean;
  incluidoEnAlbaran: boolean;
}

export interface LineaMaterial {
  _id?: string;
  productoId?: string;
  productoCodigo?: string;
  productoNombre: string;
  descripcion?: string;
  cantidad: number;
  unidad: string;
  precioCoste: number;
  precioVenta: number;
  descuento: number;
  iva: number;
  costeTotal: number;
  ventaTotal: number;
  almacenId?: string;
  lote?: string;
  facturable: boolean;
  incluidoEnAlbaran: boolean;
}

export interface LineaMaquinaria {
  _id?: string;
  maquinariaId?: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  tipoUnidad: TipoUnidadMaquinaria;
  cantidad: number;
  tarifaCoste: number;
  tarifaVenta: number;
  costeTotal: number;
  ventaTotal: number;
  operadorId?: string;
  operadorNombre?: string;
  fechaUso: string;
  observaciones?: string;
  facturable: boolean;
  incluidoEnAlbaran: boolean;
}

export interface LineaTransporte {
  _id?: string;
  vehiculoNombre: string;
  matricula?: string;
  conductorId?: string;
  conductorNombre?: string;
  fecha: string;
  origen?: string;
  destino?: string;
  kmRecorridos: number;
  tarifaPorKm: number;
  importeFijoViaje: number;
  peajes: number;
  combustible: number;
  costeTotal: number;
  precioVenta: number;
  observaciones?: string;
  facturable: boolean;
  incluidoEnAlbaran: boolean;
}

export interface LineaGasto {
  _id?: string;
  tipoGastoId?: string;
  tipoGastoNombre: string;
  descripcion?: string;
  fecha: string;
  proveedor?: string;
  numeroFactura?: string;
  importe: number;
  margen: number;
  importeFacturable: number;
  iva: number;
  adjunto?: string;
  facturable: boolean;
  incluidoEnAlbaran: boolean;
}

// ============================================
// JORNADAS DE TRABAJO (Multi-día)
// ============================================

export type EstadoJornada = 'planificada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada';

export const ESTADOS_JORNADA = [
  { value: 'planificada', label: 'Planificada', color: 'blue' },
  { value: 'confirmada', label: 'Confirmada', color: 'cyan' },
  { value: 'en_curso', label: 'En Curso', color: 'yellow' },
  { value: 'completada', label: 'Completada', color: 'green' },
  { value: 'cancelada', label: 'Cancelada', color: 'red' },
] as const;

export interface PersonalJornada {
  personalId: string;
  usuarioId?: string;
  nombre: string;
  cargo?: string;
  confirmado: boolean;
  horaEntrada?: string;
  horaSalida?: string;
  horasTrabajadas?: number;
  notas?: string;
  // Google Calendar sync
  googleEventId?: string;
  googleCalendarId?: string;
}

export interface VehiculoJornada {
  vehiculoId?: string;
  nombre: string;
  matricula?: string;
  conductorId?: string;
  conductorNombre?: string;
  kmInicio?: number;
  kmFin?: number;
}

export interface MaquinariaJornada {
  maquinariaId?: string;
  nombre: string;
  codigo?: string;
  operadorId?: string;
  operadorNombre?: string;
  horasUso?: number;
}

export interface JornadaTrabajo {
  _id?: string;
  parteTrabajoId?: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  duracionEstimada?: string;
  estado: EstadoJornada;
  personal: PersonalJornada[];
  vehiculos: VehiculoJornada[];
  maquinaria: MaquinariaJornada[];
  trabajoRealizado?: string;
  notas?: string;
  incidencias?: string;
  // Para sincronización
  sincronizadoCalendar: boolean;
  ultimaSyncCalendar?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// INTERFACES DE SOPORTE
// ============================================

export interface DireccionTrabajo {
  calle?: string;
  numero?: string;
  codigoPostal?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
  observaciones?: string;
}

export interface TotalesParteTrabajo {
  costePersonal: number;
  costeMaterial: number;
  costeMaquinaria: number;
  costeTransporte: number;
  costeGastos: number;
  costeTotal: number;
  ventaPersonal: number;
  ventaMaterial: number;
  ventaMaquinaria: number;
  ventaTransporte: number;
  ventaGastos: number;
  subtotalVenta: number;
  totalIva: number;
  totalVenta: number;
  margenBruto: number;
  margenPorcentaje: number;
}

export interface DocumentoParteTrabajo {
  _id?: string;
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  fechaSubida: string;
  subidoPor: string;
}

export interface HistorialParteTrabajo {
  _id?: string;
  fecha: string;
  usuarioId: string;
  accion: string;
  descripcion?: string;
  datosAnteriores?: any;
}

// ============================================
// INTERFACE PRINCIPAL
// ============================================

export interface ParteTrabajo {
  _id: string;

  // Identificacion
  codigo: string;
  serie: string;
  numero: number;

  // Tipo y clasificacion
  tipo: TipoParteTrabajo;
  estado: EstadoParteTrabajo;
  prioridad: Prioridad;

  // Fechas
  fecha: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaPrevista?: string;

  // Cliente
  clienteId: string;
  clienteNombre: string;
  clienteNif: string;
  clienteEmail?: string;
  clienteTelefono?: string;

  // Proyecto
  proyectoId?: string;
  proyectoCodigo?: string;
  proyectoNombre?: string;

  // Direccion de trabajo
  direccionTrabajo?: DireccionTrabajo;

  // Responsable
  responsableId?: string;
  responsableNombre?: string;

  // Descripcion
  titulo?: string;
  descripcion?: string;
  trabajoRealizado?: string;
  observacionesInternas?: string;

  // Lineas
  lineasPersonal: LineaPersonal[];
  lineasMaterial: LineaMaterial[];
  lineasMaquinaria: LineaMaquinaria[];
  lineasTransporte: LineaTransporte[];
  lineasGastos: LineaGasto[];

  // Jornadas de trabajo (multi-día)
  jornadas: JornadaTrabajo[];
  esMultiDia: boolean;

  // Totales
  totales: TotalesParteTrabajo;

  // Descuento global
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;

  // Documentos generados
  albaranesGeneradosIds: string[];

  // Firmas
  firmaTecnico?: string;
  nombreTecnico?: string;
  fechaFirmaTecnico?: string;
  firmaCliente?: string;
  nombreCliente?: string;
  fechaFirmaCliente?: string;
  dniCliente?: string;

  // Historial y documentos
  historial: HistorialParteTrabajo[];
  documentos: DocumentoParteTrabajo[];
  tags?: string[];

  // Control
  activo: boolean;
  bloqueado: boolean;
  mostrarCostes: boolean;
  mostrarMargenes: boolean;
  mostrarPrecios: boolean;

  // Auditoria
  creadoPor: string;
  modificadoPor?: string;
  fechaCreacion: string;
  fechaModificacion?: string;

  // Virtuals
  totalHorasTrabajadas?: number;
  diasDesdeCreacion?: number;
  estaCompletado?: boolean;
}

// ============================================
// DTOs
// ============================================

export interface CreateParteTrabajoDTO {
  serie?: string;
  tipo?: TipoParteTrabajo;
  estado?: EstadoParteTrabajo;
  prioridad?: Prioridad;
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaPrevista?: string;
  clienteId: string;
  clienteNombre?: string;
  clienteNif?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  proyectoId?: string;
  proyectoCodigo?: string;
  proyectoNombre?: string;
  direccionTrabajo?: DireccionTrabajo;
  responsableId?: string;
  responsableNombre?: string;
  titulo?: string;
  descripcion?: string;
  trabajoRealizado?: string;
  observacionesInternas?: string;
  lineasPersonal?: Partial<LineaPersonal>[];
  lineasMaterial?: Partial<LineaMaterial>[];
  lineasMaquinaria?: Partial<LineaMaquinaria>[];
  lineasTransporte?: Partial<LineaTransporte>[];
  lineasGastos?: Partial<LineaGasto>[];
  jornadas?: Partial<JornadaTrabajo>[];
  esMultiDia?: boolean;
  descuentoGlobalPorcentaje?: number;
  descuentoGlobalImporte?: number;
  tags?: string[];
  mostrarCostes?: boolean;
  mostrarMargenes?: boolean;
  mostrarPrecios?: boolean;
}

export interface UpdateParteTrabajoDTO extends Partial<CreateParteTrabajoDTO> {}

export interface CambiarEstadoParteDTO {
  estado: EstadoParteTrabajo;
  observaciones?: string;
}

export interface CompletarParteDTO {
  trabajoRealizado?: string;
  firmaTecnico?: string;
  nombreTecnico?: string;
  firmaCliente?: string;
  nombreCliente?: string;
  dniCliente?: string;
  observaciones?: string;
}

export interface OpcionesGenerarAlbaranDTO {
  incluirPersonal?: boolean;
  incluirMaterial?: boolean;
  incluirMaquinaria?: boolean;
  incluirTransporte?: boolean;
  incluirGastos?: boolean;
  soloFacturables?: boolean;
  agruparPorTipo?: boolean;
  almacenId?: string;
  direccionEntrega?: {
    tipo?: 'cliente' | 'personalizada' | 'recogida';
    calle?: string;
    numero?: string;
    codigoPostal?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
  };
  observaciones?: string;
}

export interface DuplicarParteDTO {
  clienteId?: string;
  proyectoId?: string;
  fecha?: string;
  incluirLineas?: boolean;
}

// ============================================
// RESPUESTAS
// ============================================

export interface ParteTrabajoResponse {
  success: boolean;
  data?: ParteTrabajo;
  message?: string;
  error?: string;
}

export interface PartesTrabajoListResponse {
  success: boolean;
  data: ParteTrabajo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EstadisticasPartesResponse {
  success: boolean;
  data: {
    total: number;
    porEstado: Record<string, number>;
    porTipo: Record<string, number>;
    porPrioridad: Record<string, number>;
    totalVenta: number;
    totalCoste: number;
    margenTotal: number;
    totalHoras: number;
    completadosEsteMes: number;
    pendientesFacturar: number;
    enCurso: number;
    urgentes: number;
  };
}

// ============================================
// HELPERS
// ============================================

export const getEstadoParteColor = (estado: EstadoParteTrabajo): string => {
  const estadoObj = ESTADOS_PARTE_TRABAJO.find(e => e.value === estado);
  return estadoObj?.color || 'gray';
};

export const getEstadoParteLabel = (estado: EstadoParteTrabajo): string => {
  const estadoObj = ESTADOS_PARTE_TRABAJO.find(e => e.value === estado);
  return estadoObj?.label || estado;
};

export const getPrioridadColor = (prioridad: Prioridad): string => {
  const prioridadObj = PRIORIDADES.find(p => p.value === prioridad);
  return prioridadObj?.color || 'gray';
};

export const getPrioridadLabel = (prioridad: Prioridad): string => {
  const prioridadObj = PRIORIDADES.find(p => p.value === prioridad);
  return prioridadObj?.label || prioridad;
};

export const getTipoParteLabel = (tipo: TipoParteTrabajo): string => {
  const tipoObj = TIPOS_PARTE_TRABAJO.find(t => t.value === tipo);
  return tipoObj?.label || tipo;
};

export const getTipoUnidadLabel = (tipoUnidad: TipoUnidadMaquinaria): string => {
  const tipoObj = TIPOS_UNIDAD_MAQUINARIA.find(t => t.value === tipoUnidad);
  return tipoObj?.label || tipoUnidad;
};

export const getTipoUnidadAbbr = (tipoUnidad: TipoUnidadMaquinaria): string => {
  const tipoObj = TIPOS_UNIDAD_MAQUINARIA.find(t => t.value === tipoUnidad);
  return tipoObj?.abbr || tipoUnidad;
};

// Crear linea vacia de personal
export const crearLineaPersonalVacia = (): Partial<LineaPersonal> => ({
  personalNombre: '',
  productoServicioId: undefined,
  productoServicioCodigo: undefined,
  productoServicioNombre: undefined,
  fecha: new Date().toISOString().split('T')[0],
  horasTrabajadas: 0,
  horasExtras: 0,
  tarifaHoraCoste: 0,
  tarifaHoraVenta: 0,
  costeTotal: 0,
  ventaTotal: 0,
  facturable: true,
  incluidoEnAlbaran: false,
});

// Crear linea vacia de material
export const crearLineaMaterialVacia = (): Partial<LineaMaterial> => ({
  productoNombre: '',
  cantidad: 1,
  unidad: 'ud',
  precioCoste: 0,
  precioVenta: 0,
  descuento: 0,
  iva: 21,
  costeTotal: 0,
  ventaTotal: 0,
  facturable: true,
  incluidoEnAlbaran: false,
});

// Crear linea vacia de maquinaria
export const crearLineaMaquinariaVacia = (): Partial<LineaMaquinaria> => ({
  nombre: '',
  tipoUnidad: 'horas',
  cantidad: 1,
  tarifaCoste: 0,
  tarifaVenta: 0,
  costeTotal: 0,
  ventaTotal: 0,
  fechaUso: new Date().toISOString().split('T')[0],
  facturable: true,
  incluidoEnAlbaran: false,
});

// Crear linea vacia de transporte
export const crearLineaTransporteVacia = (): Partial<LineaTransporte> => ({
  vehiculoNombre: '',
  fecha: new Date().toISOString().split('T')[0],
  kmRecorridos: 0,
  tarifaPorKm: 0,
  importeFijoViaje: 0,
  peajes: 0,
  combustible: 0,
  costeTotal: 0,
  precioVenta: 0,
  facturable: true,
  incluidoEnAlbaran: false,
});

// Crear linea vacia de gasto
export const crearLineaGastoVacia = (): Partial<LineaGasto> => ({
  tipoGastoNombre: '',
  fecha: new Date().toISOString().split('T')[0],
  importe: 0,
  margen: 0,
  importeFacturable: 0,
  iva: 21,
  facturable: true,
  incluidoEnAlbaran: false,
});
