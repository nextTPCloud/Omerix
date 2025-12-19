import {
  EstadoParteTrabajo,
  TipoParteTrabajo,
  Prioridad,
  IDireccionTrabajo,
} from './ParteTrabajo';

// ============================================
// LINEAS DE PERSONAL
// ============================================

export interface LineaPersonalDTO {
  _id?: string;
  personalId?: string;
  personalCodigo?: string;
  personalNombre: string;
  categoria?: string;
  // Producto servicio para obtener precios
  productoServicioId?: string;
  productoServicioCodigo?: string;
  productoServicioNombre?: string;
  fecha?: Date | string;
  horaInicio?: string;
  horaFin?: string;
  horasTrabajadas: number;
  horasExtras?: number;
  tarifaHoraCoste?: number;
  tarifaHoraVenta?: number;
  descripcionTrabajo?: string;
  facturable?: boolean;
  incluidoEnAlbaran?: boolean;
}

// ============================================
// LINEAS DE MATERIAL
// ============================================

export interface LineaMaterialDTO {
  _id?: string;
  productoId?: string;
  productoCodigo?: string;
  productoNombre: string;
  descripcion?: string;
  cantidad: number;
  unidad?: string;
  precioCoste?: number;
  precioVenta?: number;
  descuento?: number;
  iva?: number;
  almacenId?: string;
  lote?: string;
  facturable?: boolean;
  incluidoEnAlbaran?: boolean;
}

// ============================================
// LINEAS DE MAQUINARIA
// ============================================

export interface LineaMaquinariaDTO {
  _id?: string;
  maquinariaId?: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  tipoUnidad?: 'horas' | 'dias' | 'km' | 'unidades';
  cantidad: number;
  tarifaCoste?: number;
  tarifaVenta?: number;
  operadorId?: string;
  operadorNombre?: string;
  fechaUso?: Date | string;
  observaciones?: string;
  facturable?: boolean;
  incluidoEnAlbaran?: boolean;
}

// ============================================
// LINEAS DE TRANSPORTE
// ============================================

export interface LineaTransporteDTO {
  _id?: string;
  vehiculoNombre: string;
  matricula?: string;
  conductorId?: string;
  conductorNombre?: string;
  fecha?: Date | string;
  origen?: string;
  destino?: string;
  kmRecorridos?: number;
  tarifaPorKm?: number;
  importeFijoViaje?: number;
  peajes?: number;
  combustible?: number;
  precioVenta?: number;
  observaciones?: string;
  facturable?: boolean;
  incluidoEnAlbaran?: boolean;
}

// ============================================
// LINEAS DE GASTOS
// ============================================

export interface LineaGastoDTO {
  _id?: string;
  tipoGastoId?: string;
  tipoGastoNombre: string;
  descripcion?: string;
  fecha?: Date | string;
  proveedor?: string;
  numeroFactura?: string;
  importe: number;
  margen?: number;
  iva?: number;
  adjunto?: string;
  facturable?: boolean;
  incluidoEnAlbaran?: boolean;
}

// ============================================
// CREAR PARTE DE TRABAJO
// ============================================

export interface CreateParteTrabajoDTO {
  serie?: string;
  tipo?: TipoParteTrabajo;
  estado?: EstadoParteTrabajo;
  prioridad?: Prioridad;

  // Fechas
  fecha?: Date | string;
  fechaInicio?: Date | string;
  fechaFin?: Date | string;
  fechaPrevista?: Date | string;

  // Cliente (requerido)
  clienteId: string;
  clienteNombre?: string;
  clienteNif?: string;
  clienteEmail?: string;
  clienteTelefono?: string;

  // Proyecto (opcional)
  proyectoId?: string;
  proyectoCodigo?: string;
  proyectoNombre?: string;

  // Direccion de trabajo
  direccionTrabajo?: IDireccionTrabajo;

  // Responsable
  responsableId?: string;
  responsableNombre?: string;

  // Descripcion
  titulo?: string;
  descripcion?: string;
  trabajoRealizado?: string;
  observacionesInternas?: string;

  // Lineas
  lineasPersonal?: LineaPersonalDTO[];
  lineasMaterial?: LineaMaterialDTO[];
  lineasMaquinaria?: LineaMaquinariaDTO[];
  lineasTransporte?: LineaTransporteDTO[];
  lineasGastos?: LineaGastoDTO[];

  // Descuento global
  descuentoGlobalPorcentaje?: number;
  descuentoGlobalImporte?: number;

  // Tags
  tags?: string[];

  // Configuracion visualizacion
  mostrarCostes?: boolean;
  mostrarMargenes?: boolean;
  mostrarPrecios?: boolean;
}

// ============================================
// ACTUALIZAR PARTE DE TRABAJO
// ============================================

export interface UpdateParteTrabajoDTO extends Partial<CreateParteTrabajoDTO> {}

// ============================================
// BUSCAR PARTES DE TRABAJO
// ============================================

export interface SearchPartesTrabajoDTO {
  search?: string;
  clienteId?: string;
  proyectoId?: string;
  responsableId?: string;
  estado?: EstadoParteTrabajo;
  estados?: string; // Separados por coma
  tipo?: TipoParteTrabajo;
  prioridad?: Prioridad;
  serie?: string;
  activo?: 'true' | 'false' | 'all';
  fechaDesde?: string;
  fechaHasta?: string;
  fechaInicioDesde?: string;
  fechaInicioHasta?: string;
  fechaFinDesde?: string;
  fechaFinHasta?: string;
  importeMin?: string;
  importeMax?: string;
  tags?: string;
  conFirmaCliente?: 'true' | 'false';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// CAMBIAR ESTADO
// ============================================

export interface CambiarEstadoParteDTO {
  estado: EstadoParteTrabajo;
  observaciones?: string;
}

// ============================================
// COMPLETAR PARTE (con firmas)
// ============================================

export interface CompletarParteDTO {
  trabajoRealizado?: string;
  firmaTecnico?: string;
  nombreTecnico?: string;
  firmaCliente?: string;
  nombreCliente?: string;
  dniCliente?: string;
  observaciones?: string;
}

// ============================================
// GENERAR ALBARAN
// ============================================

export interface OpcionesGenerarAlbaranDTO {
  incluirPersonal?: boolean;
  incluirMaterial?: boolean;
  incluirMaquinaria?: boolean;
  incluirTransporte?: boolean;
  incluirGastos?: boolean;
  soloFacturables?: boolean;
  agruparPorTipo?: boolean;
  // Datos adicionales para el albaran
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

// ============================================
// DUPLICAR PARTE
// ============================================

export interface DuplicarParteDTO {
  clienteId?: string;
  proyectoId?: string;
  fecha?: Date | string;
  incluirLineas?: boolean;
}

// ============================================
// AGREGAR/ACTUALIZAR LINEAS INDIVIDUALES
// ============================================

export interface AgregarLineaPersonalDTO extends LineaPersonalDTO {}
export interface AgregarLineaMaterialDTO extends LineaMaterialDTO {}
export interface AgregarLineaMaquinariaDTO extends LineaMaquinariaDTO {}
export interface AgregarLineaTransporteDTO extends LineaTransporteDTO {}
export interface AgregarLineaGastoDTO extends LineaGastoDTO {}

// ============================================
// RESPUESTAS
// ============================================

export interface ParteTrabajoResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface PartesTrabajoListResponse {
  success: boolean;
  data: any[];
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
    totalVenta: number;
    totalCoste: number;
    margenTotal: number;
    pendientesFacturar: number;
  };
}

// ============================================
// BULK OPERATIONS
// ============================================

export interface BulkDeletePartesDTO {
  ids: string[];
}

export interface BulkCambiarEstadoDTO {
  ids: string[];
  estado: EstadoParteTrabajo;
}
