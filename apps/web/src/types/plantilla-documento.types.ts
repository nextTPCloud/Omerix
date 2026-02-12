// apps/web/src/types/plantilla-documento.types.ts
// Tipos para plantillas de diseño de documentos

// ============================================
// ENUMS
// ============================================

export enum TipoDocumentoPlantilla {
  FACTURA = 'factura',
  PRESUPUESTO = 'presupuesto',
  ALBARAN = 'albaran',
  PEDIDO = 'pedido',
  FACTURA_COMPRA = 'factura_compra',
  PEDIDO_COMPRA = 'pedido_compra',
  PARTE_TRABAJO = 'parte_trabajo',
}

export enum EstiloPlantilla {
  MODERNO = 'moderno',
  CLASICO = 'clasico',
  MINIMALISTA = 'minimalista',
  CORPORATIVO = 'corporativo',
  COLORIDO = 'colorido',
}

// ============================================
// INTERFACES DE CONFIGURACIÓN
// ============================================

export interface ConfiguracionColores {
  primario: string
  secundario: string
  texto: string
  textoClaro: string
  fondo: string
  fondoAlterno: string
  borde: string
  exito: string
  alerta: string
  error: string
}

export interface ConfiguracionFuentes {
  familia: string
  tamañoTitulo: number
  tamañoSubtitulo: number
  tamañoTexto: number
  tamañoPie: number
}

export interface ConfiguracionCabecera {
  mostrarLogo: boolean
  posicionLogo: 'izquierda' | 'centro' | 'derecha'
  anchoLogo: number
  mostrarDatosEmpresa: boolean
  mostrarNIF: boolean
  mostrarDireccion: boolean
  mostrarContacto: boolean
  mostrarWeb: boolean
  colorFondo?: string
}

export interface ConfiguracionCliente {
  posicion: 'izquierda' | 'derecha'
  mostrarTitulo: boolean
  mostrarCodigo: boolean
  mostrarNIF: boolean
  mostrarDireccion: boolean
  mostrarContacto: boolean
}

export interface ConfiguracionLineas {
  mostrarNumeroLinea: boolean
  mostrarReferencia: boolean
  mostrarDescripcion: boolean
  mostrarCantidad: boolean
  mostrarUnidad: boolean
  mostrarPrecioUnitario: boolean
  mostrarDescuento: boolean
  mostrarIVA: boolean
  mostrarSubtotal: boolean
  anchoReferencia?: number
  anchoDescripcion?: number
  anchoCantidad?: number
  filasZebra: boolean
}

export interface ConfiguracionTotales {
  posicion: 'derecha' | 'izquierda' | 'centrado'
  mostrarSubtotal: boolean
  mostrarDescuentoGlobal: boolean
  mostrarBaseImponible: boolean
  mostrarDetalleIVA: boolean
  mostrarRecargoEquivalencia: boolean
  mostrarRetencion: boolean
  mostrarTotal: boolean
  resaltarTotal: boolean
}

export interface ConfiguracionPie {
  mostrarCondiciones: boolean
  mostrarFormaPago: boolean
  mostrarVencimientos: boolean
  mostrarDatosBancarios: boolean
  mostrarFirma: boolean
  mostrarPagina: boolean
  textoLegal?: string
}

export interface TextosPlantilla {
  tituloDocumento?: string
  subtituloDocumento?: string
  encabezadoLineas?: string
  piePagina?: string
  condicionesPago?: string
  textosLegales?: string
}

export interface MargenesPapel {
  superior: number
  inferior: number
  izquierdo: number
  derecho: number
}

export interface ConfiguracionPapel {
  formato: 'A4' | 'Letter' | 'A5'
  orientacion: 'vertical' | 'horizontal'
}

// ============================================
// INTERFAZ PRINCIPAL
// ============================================

export interface PlantillaDocumento {
  _id: string
  empresaId: string
  nombre: string
  descripcion?: string
  codigo: string
  tipoDocumento: TipoDocumentoPlantilla
  estilo: EstiloPlantilla
  colores: ConfiguracionColores
  fuentes: ConfiguracionFuentes
  cabecera: ConfiguracionCabecera
  cliente: ConfiguracionCliente
  lineas: ConfiguracionLineas
  totales: ConfiguracionTotales
  pie: ConfiguracionPie
  textos: TextosPlantilla
  margenes: MargenesPapel
  papel: ConfiguracionPapel
  activa: boolean
  esPredeterminada: boolean
  esPlantillaSistema: boolean
  preview?: string
  creadoPor?: string
  modificadoPor?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// DTOs
// ============================================

export interface CreatePlantillaDTO {
  nombre: string
  descripcion?: string
  codigo: string
  tipoDocumento: TipoDocumentoPlantilla
  estilo?: EstiloPlantilla
  colores?: Partial<ConfiguracionColores>
  fuentes?: Partial<ConfiguracionFuentes>
  cabecera?: Partial<ConfiguracionCabecera>
  cliente?: Partial<ConfiguracionCliente>
  lineas?: Partial<ConfiguracionLineas>
  totales?: Partial<ConfiguracionTotales>
  pie?: Partial<ConfiguracionPie>
  textos?: Partial<TextosPlantilla>
  margenes?: Partial<MargenesPapel>
  papel?: Partial<ConfiguracionPapel>
  esPredeterminada?: boolean
}

export interface UpdatePlantillaDTO extends Partial<CreatePlantillaDTO> {}

export interface SearchPlantillasParams {
  tipoDocumento?: TipoDocumentoPlantilla
  estilo?: EstiloPlantilla
  activa?: boolean
  busqueda?: string
  page?: number
  limit?: number
}

// ============================================
// RESPONSES
// ============================================

export interface PlantillasResponse {
  success: boolean
  data: PlantillaDocumento[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface PlantillaResponse {
  success: boolean
  data: PlantillaDocumento
  message?: string
}

export interface EstiloOption {
  valor: EstiloPlantilla
  etiqueta: string
}

export interface TipoDocumentoOption {
  valor: TipoDocumentoPlantilla
  etiqueta: string
}

export interface EstilosResponse {
  success: boolean
  data: EstiloOption[]
}

export interface TiposDocumentoResponse {
  success: boolean
  data: TipoDocumentoOption[]
}

// ============================================
// HELPERS
// ============================================

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumentoPlantilla, string> = {
  [TipoDocumentoPlantilla.FACTURA]: 'Factura',
  [TipoDocumentoPlantilla.PRESUPUESTO]: 'Presupuesto',
  [TipoDocumentoPlantilla.ALBARAN]: 'Albarán',
  [TipoDocumentoPlantilla.PEDIDO]: 'Pedido',
  [TipoDocumentoPlantilla.FACTURA_COMPRA]: 'Factura de Compra',
  [TipoDocumentoPlantilla.PEDIDO_COMPRA]: 'Pedido de Compra',
  [TipoDocumentoPlantilla.PARTE_TRABAJO]: 'Parte de Trabajo',
}

export const ESTILO_LABELS: Record<EstiloPlantilla, string> = {
  [EstiloPlantilla.MODERNO]: 'Moderno',
  [EstiloPlantilla.CLASICO]: 'Clásico',
  [EstiloPlantilla.MINIMALISTA]: 'Minimalista',
  [EstiloPlantilla.CORPORATIVO]: 'Corporativo',
  [EstiloPlantilla.COLORIDO]: 'Colorido',
}

export const ESTILO_DESCRIPTIONS: Record<EstiloPlantilla, string> = {
  [EstiloPlantilla.MODERNO]: 'Diseño limpio con colores azules y líneas simples',
  [EstiloPlantilla.CLASICO]: 'Diseño tradicional con bordes definidos y tipografía serif',
  [EstiloPlantilla.MINIMALISTA]: 'Ultra limpio con mucho espacio en blanco',
  [EstiloPlantilla.CORPORATIVO]: 'Profesional con cabecera destacada',
  [EstiloPlantilla.COLORIDO]: 'Vibrante con colores llamativos',
}

export const ESTILO_ICONS: Record<EstiloPlantilla, string> = {
  [EstiloPlantilla.MODERNO]: '🔵',
  [EstiloPlantilla.CLASICO]: '📜',
  [EstiloPlantilla.MINIMALISTA]: '⬜',
  [EstiloPlantilla.CORPORATIVO]: '🏢',
  [EstiloPlantilla.COLORIDO]: '🎨',
}
