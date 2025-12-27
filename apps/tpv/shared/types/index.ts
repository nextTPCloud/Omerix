// ===========================================
// TIPOS COMPARTIDOS TPV OMERIX
// ===========================================

// Identificadores
export type ObjectId = string;

// ===========================================
// ENUMS
// ===========================================

export enum EstadoVenta {
  PENDIENTE = 'pendiente',
  PAGADA = 'pagada',
  PARCIAL = 'parcial',
  ANULADA = 'anulada',
}

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TARJETA = 'tarjeta',
  TRANSFERENCIA = 'transferencia',
  BIZUM = 'bizum',
  MIXTO = 'mixto',
}

export enum EstadoSync {
  PENDIENTE = 'pendiente',
  SINCRONIZADO = 'sincronizado',
  ERROR = 'error',
}

export enum TipoMovimientoCaja {
  APERTURA = 'apertura',
  CIERRE = 'cierre',
  VENTA = 'venta',
  DEVOLUCION = 'devolucion',
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  COBRO_FACTURA = 'cobro_factura',
}

export enum EstadoCaja {
  ABIERTA = 'abierta',
  CERRADA = 'cerrada',
}

// ===========================================
// PRODUCTOS
// ===========================================

export interface IVariante {
  _id: ObjectId;
  nombre: string;
  sku?: string;
  codigoBarras?: string;
  precio?: number; // Si difiere del producto base
  stock: number;
  atributos: Record<string, string>; // { talla: 'M', color: 'Rojo' }
}

export interface IProductoTPV {
  _id: ObjectId;
  empresaId: ObjectId;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  familia?: string;
  codigoBarras?: string;
  precio: number;
  precioConIva: number;
  tipoIva: number;

  // Variantes
  tieneVariantes: boolean;
  variantes?: IVariante[];

  // Kit
  esKit: boolean;
  componentesKit?: Array<{
    productoId: ObjectId;
    varianteId?: ObjectId;
    cantidad: number;
  }>;

  // Stock por almacén
  stocks: Array<{
    almacenId: ObjectId;
    almacenNombre: string;
    stock: number;
    stockMinimo?: number;
  }>;

  // Imagen
  imagen?: string;

  // Sincronización
  syncEstado: EstadoSync;
  syncFecha?: Date;

  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// VENTAS
// ===========================================

export interface ILineaVenta {
  _id: ObjectId;
  productoId: ObjectId;
  varianteId?: ObjectId;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tipoIva: number;
  importeIva: number;
  subtotal: number;
  total: number;
}

export interface IPago {
  _id: ObjectId;
  metodo: MetodoPago;
  importe: number;
  referencia?: string; // Número autorización tarjeta, etc.
  fecha: Date;
}

export interface IVenta {
  _id: ObjectId;
  empresaId: ObjectId;

  // Identificación local
  localId: string; // UUID generado localmente
  numero: string; // TPV-001-000001
  serie: string;

  // Caja
  cajaId: ObjectId;
  cajaNombre: string;

  // Cliente (opcional)
  clienteId?: ObjectId;
  clienteNombre?: string;
  clienteNif?: string;

  // Almacén origen
  almacenId: ObjectId;
  almacenNombre: string;

  // Líneas
  lineas: ILineaVenta[];

  // Totales
  baseImponible: number;
  totalIva: number;
  totalDescuento: number;
  total: number;

  // Pagos
  pagos: IPago[];
  totalPagado: number;
  cambio: number;

  // Estado
  estado: EstadoVenta;

  // VeriFactu
  verifactu?: {
    hash: string;
    hashAnterior?: string;
    fechaGeneracion: Date;
    xml?: string;
    enviado: boolean;
    fechaEnvio?: Date;
    respuesta?: string;
  };

  // Sincronización
  syncEstado: EstadoSync;
  syncFecha?: Date;
  syncError?: string;

  // Auditoría
  vendedorId: ObjectId;
  vendedorNombre: string;

  // Ticket relacionado
  ticketImpreso: boolean;

  // Factura relacionada
  facturaId?: ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// CAJA
// ===========================================

export interface IMovimientoCaja {
  _id: ObjectId;
  tipo: TipoMovimientoCaja;
  importe: number;
  descripcion?: string;
  ventaId?: ObjectId;
  facturaId?: ObjectId;
  metodoPago?: MetodoPago;
  fecha: Date;
  usuarioId: ObjectId;
  usuarioNombre: string;
}

export interface IArqueoCaja {
  efectivo: number;
  tarjeta: number;
  otros: number;
  total: number;
}

export interface ICaja {
  _id: ObjectId;
  empresaId: ObjectId;
  localId: string;

  codigo: string;
  nombre: string;
  almacenId: ObjectId;
  almacenNombre: string;

  estado: EstadoCaja;

  // Apertura
  apertura?: {
    fecha: Date;
    usuarioId: ObjectId;
    usuarioNombre: string;
    importeInicial: number;
  };

  // Cierre
  cierre?: {
    fecha: Date;
    usuarioId: ObjectId;
    usuarioNombre: string;
    arqueoTeorico: IArqueoCaja;
    arqueoReal: IArqueoCaja;
    diferencia: number;
    observaciones?: string;
  };

  // Movimientos
  movimientos: IMovimientoCaja[];

  // Totales actuales
  totalEfectivo: number;
  totalTarjeta: number;
  totalOtros: number;
  totalVentas: number;
  numeroVentas: number;

  // Sincronización
  syncEstado: EstadoSync;
  syncFecha?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// SINCRONIZACIÓN
// ===========================================

export interface ISyncQueue {
  _id: ObjectId;
  entidad: 'venta' | 'caja' | 'movimiento' | 'verifactu';
  entidadId: ObjectId;
  operacion: 'crear' | 'actualizar' | 'eliminar';
  datos: any;
  intentos: number;
  ultimoIntento?: Date;
  error?: string;
  createdAt: Date;
}

export interface ISyncStatus {
  online: boolean;
  ultimaSync: Date | null;
  pendientes: number;
  errores: number;
}

// ===========================================
// CONFIGURACIÓN TPV
// ===========================================

export interface IConfigTPV {
  _id: ObjectId;
  empresaId: ObjectId;

  // General
  nombreTPV: string;
  serie: string;

  // Almacén por defecto
  almacenId: ObjectId;
  almacenNombre: string;

  // Impresora
  impresora: {
    tipo: 'usb' | 'serial' | 'network' | 'none';
    puerto?: string;
    ip?: string;
    anchoTicket: 58 | 80;
    cortarPapel: boolean;
    abrirCajon: boolean;
  };

  // Visor cliente
  visor: {
    habilitado: boolean;
    puerto?: string;
  };

  // Cajón portamonedas
  cajon: {
    habilitado: boolean;
    abrirConVenta: boolean;
  };

  // Báscula
  bascula: {
    habilitada: boolean;
    puerto?: string;
  };

  // Terminal de pago
  datáfono: {
    habilitado: boolean;
    tipo?: 'ingenico' | 'verifone' | 'redsys';
    puerto?: string;
  };

  // Opciones venta
  ventaRapida: boolean;
  permitirVentaSinStock: boolean;
  permitirDescuentos: boolean;
  descuentoMaximo: number;
  requiereCliente: boolean;

  // Sincronización
  syncIntervalo: number; // segundos

  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// PERIFÉRICOS
// ===========================================

export interface IPrinterStatus {
  connected: boolean;
  paperEnd: boolean;
  error?: string;
}

export interface ICashDrawerStatus {
  connected: boolean;
  open: boolean;
}

export interface IDisplayStatus {
  connected: boolean;
  lines: [string, string];
}

export interface IPeripheralsStatus {
  printer: IPrinterStatus;
  cashDrawer: ICashDrawerStatus;
  display: IDisplayStatus;
  scale: { connected: boolean; weight: number };
  paymentTerminal: { connected: boolean; ready: boolean };
}

// ===========================================
// RESPUESTAS API
// ===========================================

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
