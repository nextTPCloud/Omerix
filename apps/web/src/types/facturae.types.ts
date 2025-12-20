/**
 * Tipos para factura electrónica (FacturaE/FACE)
 */

// Estados de FACE
export enum EstadoFACE {
  REGISTRADA_REC = '1200',
  REGISTRADA_RCF = '1300',
  CONTABILIZADA = '2400',
  OBLIGACION_PAGO = '2500',
  PAGADA = '2600',
  RECHAZADA = '3100',
  ANULADA = '4100',
  PROPUESTA_PAGO = '4200',
  PAGO_REALIZADO = '4300',
}

// Tipos de entidad pública
export enum TipoEntidadPublica {
  AGE = 'AGE',
  CCAA = 'CCAA',
  LOCAL = 'LOCAL',
  OTRO = 'OTRO',
}

// Datos de facturación electrónica del cliente
export interface IFacturacionElectronica {
  activa: boolean;
  codigoOrganoGestor: string;
  codigoUnidadTramitadora: string;
  codigoOficinaContable: string;
  codigoPuntoEntrega?: string;
  tipoEntidad: TipoEntidadPublica;
  nombreOrganoGestor?: string;
  nombreUnidadTramitadora?: string;
  nombreOficinaContable?: string;
  observaciones?: string;
}

// Historial de factura electrónica
export interface IHistorialFacturaElectronica {
  fecha: string;
  accion: 'generada' | 'firmada' | 'enviada' | 'consultada' | 'rechazada' | 'anulada';
  detalle?: string;
  usuarioId: string;
  usuarioNombre?: string;
}

// Estado de factura electrónica en la factura
export interface IFacturaElectronica {
  generada: boolean;
  fechaGeneracion?: string;
  xmlGenerado?: string;
  firmada: boolean;
  fechaFirma?: string;
  xmlFirmado?: string;
  certificadoId?: string;
  enviadaFACE: boolean;
  fechaEnvio?: string;
  numeroRegistroFACE?: string;
  estadoFACE?: EstadoFACE;
  ultimaConsulta?: string;
  historial: IHistorialFacturaElectronica[];
}

// Información de certificado
export interface ICertificadoInfo {
  _id: string;
  asunto: string;
  emisor: string;
  numeroSerie: string;
  validoDesde: string;
  validoHasta: string;
  algoritmo: string;
  huella: string;
  esValido: boolean;
  diasRestantes: number;
}

// Resultado de generación de FacturaE
export interface IGenerarFacturaEResult {
  exito: boolean;
  xml?: string;
  nombreArchivo?: string;
  firmado?: boolean;
  errores?: string[];
  advertencias?: string[];
}

// Resultado de firma
export interface IFirmarFacturaEResult {
  exito: boolean;
  xmlFirmado?: string;
  datosFirma?: {
    firmante: string;
    fechaFirma: string;
    algoritmo: string;
    huella: string;
  };
  errores?: string[];
  advertencias?: string[];
}

// Resultado de envío a FACE
export interface IEnvioFACEResult {
  exito: boolean;
  numeroRegistro?: string;
  codigoResultado?: string;
  descripcionResultado?: string;
  fechaRecepcion?: string;
  errores?: string[];
}

// Estado de factura en FACE
export interface IConsultaEstadoFACE {
  exito: boolean;
  estado?: {
    codigo: EstadoFACE;
    descripcion: string;
    motivo?: string;
  };
  anulacion?: {
    codigo: string;
    descripcion: string;
    motivo?: string;
  };
  errores?: string[];
}

// Verificación de requisitos
export interface IVerificacionRequisitos {
  cumple: boolean;
  faltantes: string[];
}

// Labels para estados FACE
export const ESTADO_FACE_LABELS: Record<EstadoFACE, string> = {
  [EstadoFACE.REGISTRADA_REC]: 'Registrada en REC',
  [EstadoFACE.REGISTRADA_RCF]: 'Registrada en RCF',
  [EstadoFACE.CONTABILIZADA]: 'Contabilizada',
  [EstadoFACE.OBLIGACION_PAGO]: 'Obligación de pago reconocida',
  [EstadoFACE.PAGADA]: 'Pagada',
  [EstadoFACE.RECHAZADA]: 'Rechazada',
  [EstadoFACE.ANULADA]: 'Anulada',
  [EstadoFACE.PROPUESTA_PAGO]: 'Propuesta de pago',
  [EstadoFACE.PAGO_REALIZADO]: 'Pago realizado',
};

export const ESTADO_FACE_COLORS: Record<EstadoFACE, string> = {
  [EstadoFACE.REGISTRADA_REC]: 'bg-blue-100 text-blue-800',
  [EstadoFACE.REGISTRADA_RCF]: 'bg-blue-100 text-blue-800',
  [EstadoFACE.CONTABILIZADA]: 'bg-indigo-100 text-indigo-800',
  [EstadoFACE.OBLIGACION_PAGO]: 'bg-purple-100 text-purple-800',
  [EstadoFACE.PAGADA]: 'bg-green-100 text-green-800',
  [EstadoFACE.RECHAZADA]: 'bg-red-100 text-red-800',
  [EstadoFACE.ANULADA]: 'bg-gray-100 text-gray-800',
  [EstadoFACE.PROPUESTA_PAGO]: 'bg-yellow-100 text-yellow-800',
  [EstadoFACE.PAGO_REALIZADO]: 'bg-green-100 text-green-800',
};

export const TIPO_ENTIDAD_LABELS: Record<TipoEntidadPublica, string> = {
  [TipoEntidadPublica.AGE]: 'Administración General del Estado',
  [TipoEntidadPublica.CCAA]: 'Comunidad Autónoma',
  [TipoEntidadPublica.LOCAL]: 'Entidad Local',
  [TipoEntidadPublica.OTRO]: 'Otra entidad pública',
};
