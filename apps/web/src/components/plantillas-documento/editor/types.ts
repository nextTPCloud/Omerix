// Tipos para el editor visual de plantillas de documentos

export type BlockType =
  | 'logo'
  | 'empresa-info'
  | 'documento-titulo'
  | 'documento-info'
  | 'cliente-info'
  | 'tabla-lineas'
  | 'totales'
  | 'forma-pago'
  | 'datos-bancarios'
  | 'condiciones'
  | 'firma'
  | 'texto-libre'
  | 'separador'
  | 'espacio'
  | 'imagen'
  | 'qr-code'

export interface BlockPosition {
  x: number // porcentaje del ancho (0-100)
  y: number // posición vertical en mm desde el margen superior
  width: number // porcentaje del ancho (0-100)
  height: 'auto' | number // altura en mm o auto
}

export interface BlockStyle {
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  textAlign?: 'left' | 'center' | 'right'
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  color?: string
}

export interface EditorBlock {
  id: string
  type: BlockType
  position: BlockPosition
  style: BlockStyle
  config: Record<string, any> // Configuración específica del tipo de bloque
  locked?: boolean // Si está bloqueado no se puede mover/redimensionar
  visible?: boolean
}

export interface EditorSection {
  id: string
  name: string
  blocks: EditorBlock[]
  height: 'auto' | number // altura en mm
}

export interface EditorLayout {
  sections: EditorSection[]
  globalStyles: {
    fontFamily: string
    primaryColor: string
    secondaryColor: string
    textColor: string
    backgroundColor: string
  }
}

// Configuraciones por defecto para cada tipo de bloque
export const BLOCK_DEFAULTS: Record<BlockType, Partial<EditorBlock>> = {
  'logo': {
    position: { x: 0, y: 0, width: 25, height: 'auto' },
    config: { showLogo: true, maxWidth: 150 },
  },
  'empresa-info': {
    position: { x: 0, y: 0, width: 40, height: 'auto' },
    config: { showNIF: true, showDireccion: true, showContacto: true, showWeb: false },
  },
  'documento-titulo': {
    position: { x: 60, y: 0, width: 40, height: 'auto' },
    style: { textAlign: 'right', fontWeight: 'bold', fontSize: 24 },
    config: { titulo: 'FACTURA' },
  },
  'documento-info': {
    position: { x: 60, y: 0, width: 40, height: 'auto' },
    style: { textAlign: 'right' },
    config: { showNumero: true, showFecha: true, showVencimiento: true },
  },
  'cliente-info': {
    position: { x: 55, y: 0, width: 45, height: 'auto' },
    config: { showTitulo: true, showCodigo: false, showNIF: true, showDireccion: true, showContacto: true },
  },
  'tabla-lineas': {
    position: { x: 0, y: 0, width: 100, height: 'auto' },
    config: {
      columnas: ['referencia', 'descripcion', 'cantidad', 'precio', 'descuento', 'iva', 'subtotal'],
      filasZebra: true,
    },
  },
  'totales': {
    position: { x: 60, y: 0, width: 40, height: 'auto' },
    style: { textAlign: 'right' },
    config: {
      showSubtotal: true,
      showDescuento: true,
      showBaseImponible: true,
      showIVA: true,
      showTotal: true,
      resaltarTotal: true,
    },
  },
  'forma-pago': {
    position: { x: 0, y: 0, width: 50, height: 'auto' },
    config: { showFormaPago: true, showVencimientos: true },
  },
  'datos-bancarios': {
    position: { x: 0, y: 0, width: 50, height: 'auto' },
    config: { showCuentaBancaria: true, showIBAN: true },
  },
  'condiciones': {
    position: { x: 0, y: 0, width: 100, height: 'auto' },
    config: { texto: '' },
  },
  'firma': {
    position: { x: 70, y: 0, width: 30, height: 40 },
    config: { showLinea: true, textoDebajo: 'Firma y sello' },
  },
  'texto-libre': {
    position: { x: 0, y: 0, width: 100, height: 'auto' },
    config: { texto: 'Texto personalizado', html: false },
  },
  'separador': {
    position: { x: 0, y: 0, width: 100, height: 1 },
    style: { borderWidth: 1 },
    config: { tipo: 'linea' },
  },
  'espacio': {
    position: { x: 0, y: 0, width: 100, height: 10 },
    config: {},
  },
  'imagen': {
    position: { x: 0, y: 0, width: 30, height: 'auto' },
    config: { url: '', alt: '' },
  },
  'qr-code': {
    position: { x: 85, y: 0, width: 15, height: 'auto' },
    config: { contenido: 'url', tamaño: 60 },
  },
}

// Metadatos de los bloques para el panel de herramientas
export interface BlockMetadata {
  type: BlockType
  label: string
  icon: string
  description: string
  category: 'cabecera' | 'cuerpo' | 'pie' | 'utilidades'
}

export const BLOCK_METADATA: BlockMetadata[] = [
  // Cabecera
  { type: 'logo', label: 'Logo', icon: 'Image', description: 'Logo de la empresa', category: 'cabecera' },
  { type: 'empresa-info', label: 'Datos Empresa', icon: 'Building2', description: 'Información de la empresa', category: 'cabecera' },
  { type: 'documento-titulo', label: 'Título Documento', icon: 'Type', description: 'Título del documento (FACTURA, etc.)', category: 'cabecera' },
  { type: 'documento-info', label: 'Info Documento', icon: 'FileText', description: 'Número, fecha, vencimiento', category: 'cabecera' },
  { type: 'cliente-info', label: 'Datos Cliente', icon: 'User', description: 'Información del cliente', category: 'cabecera' },

  // Cuerpo
  { type: 'tabla-lineas', label: 'Tabla de Líneas', icon: 'Table', description: 'Líneas del documento', category: 'cuerpo' },
  { type: 'totales', label: 'Totales', icon: 'Calculator', description: 'Subtotal, IVA, Total', category: 'cuerpo' },

  // Pie
  { type: 'forma-pago', label: 'Forma de Pago', icon: 'CreditCard', description: 'Método y vencimientos', category: 'pie' },
  { type: 'datos-bancarios', label: 'Datos Bancarios', icon: 'Landmark', description: 'Cuenta bancaria', category: 'pie' },
  { type: 'condiciones', label: 'Condiciones', icon: 'ScrollText', description: 'Condiciones y notas', category: 'pie' },
  { type: 'firma', label: 'Firma', icon: 'PenTool', description: 'Espacio para firma', category: 'pie' },

  // Utilidades
  { type: 'texto-libre', label: 'Texto Libre', icon: 'AlignLeft', description: 'Texto personalizado', category: 'utilidades' },
  { type: 'separador', label: 'Separador', icon: 'Minus', description: 'Línea separadora', category: 'utilidades' },
  { type: 'espacio', label: 'Espacio', icon: 'Square', description: 'Espacio en blanco', category: 'utilidades' },
  { type: 'imagen', label: 'Imagen', icon: 'ImagePlus', description: 'Imagen personalizada', category: 'utilidades' },
  { type: 'qr-code', label: 'Código QR', icon: 'QrCode', description: 'QR con enlace o datos', category: 'utilidades' },
]

// Estado del editor
export interface EditorState {
  layout: EditorLayout
  selectedBlockId: string | null
  zoom: number
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  history: EditorLayout[]
  historyIndex: number
  isDirty: boolean
}

// Acciones del editor
export type EditorAction =
  | { type: 'SET_LAYOUT'; payload: EditorLayout }
  | { type: 'SELECT_BLOCK'; payload: string | null }
  | { type: 'ADD_BLOCK'; payload: { sectionId: string; block: EditorBlock } }
  | { type: 'UPDATE_BLOCK'; payload: { blockId: string; updates: Partial<EditorBlock> } }
  | { type: 'REMOVE_BLOCK'; payload: string }
  | { type: 'MOVE_BLOCK'; payload: { blockId: string; position: Partial<BlockPosition> } }
  | { type: 'REORDER_BLOCKS'; payload: { sectionId: string; blockIds: string[] } }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'TOGGLE_GRID'; payload?: boolean }
  | { type: 'TOGGLE_SNAP'; payload?: boolean }
  | { type: 'SET_GRID_SIZE'; payload: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'UPDATE_GLOBAL_STYLES'; payload: Partial<EditorLayout['globalStyles']> }
  | { type: 'MARK_SAVED' }
