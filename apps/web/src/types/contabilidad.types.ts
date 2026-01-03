/**
 * Tipos para el módulo de Contabilidad
 */

// ============================================
// ENUMS
// ============================================

export enum TipoCuenta {
  ACTIVO = 'activo',
  PASIVO = 'pasivo',
  PATRIMONIO = 'patrimonio',
  INGRESO = 'ingreso',
  GASTO = 'gasto',
}

export enum NaturalezaCuenta {
  DEUDORA = 'deudora',
  ACREEDORA = 'acreedora',
}

export enum TipoTercero {
  CLIENTE = 'cliente',
  PROVEEDOR = 'proveedor',
}

export enum OrigenAsiento {
  MANUAL = 'manual',
  FACTURA_VENTA = 'factura_venta',
  FACTURA_COMPRA = 'factura_compra',
  COBRO = 'cobro',
  PAGO = 'pago',
  NOMINA = 'nomina',
  AMORTIZACION = 'amortizacion',
  REGULARIZACION = 'regularizacion',
  CIERRE = 'cierre',
  APERTURA = 'apertura',
  AJUSTE = 'ajuste',
}

export enum EstadoAsiento {
  BORRADOR = 'borrador',
  CONTABILIZADO = 'contabilizado',
  ANULADO = 'anulado',
}

// ============================================
// CUENTA CONTABLE
// ============================================

export interface CuentaContable {
  _id: string
  codigo: string
  nombre: string
  descripcion?: string
  nivel: number
  tipo: TipoCuenta
  naturaleza: NaturalezaCuenta
  esMovimiento: boolean
  esSistema: boolean
  activa: boolean
  cuentaPadreId?: string
  codigoPadre?: string
  terceroId?: string
  terceroTipo?: TipoTercero
  terceroNombre?: string
  terceroNif?: string
  saldoDebe: number
  saldoHaber: number
  saldo: number
  numeroMovimientos: number
  ultimoMovimiento?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateCuentaDTO {
  codigo: string
  nombre: string
  descripcion?: string
  terceroId?: string
  terceroTipo?: TipoTercero
}

export interface UpdateCuentaDTO {
  nombre?: string
  descripcion?: string
}

export interface CuentasFilters {
  nivel?: number
  tipo?: TipoCuenta
  esMovimiento?: boolean
  activa?: boolean
  busqueda?: string
  codigoPadre?: string
}

// ============================================
// ASIENTO CONTABLE
// ============================================

export interface LineaAsiento {
  orden: number
  cuentaId: string
  cuentaCodigo: string
  cuentaNombre: string
  debe: number
  haber: number
  concepto?: string
  terceroId?: string
  terceroNif?: string
  terceroNombre?: string
  documentoRef?: string
  cuentaContrapartida?: string
}

export interface AsientoContable {
  _id: string
  numero: number
  fecha: Date
  periodo: number
  ejercicio: number
  concepto: string
  lineas: LineaAsiento[]
  totalDebe: number
  totalHaber: number
  cuadrado: boolean
  diferencia: number
  origenTipo: OrigenAsiento
  origenId?: string
  origenNumero?: string
  tipoAsiento?: string
  estado: EstadoAsiento
  bloqueado: boolean
  asientoAnuladoId?: string
  asientoAnulacionId?: string
  motivoAnulacion?: string
  creadoPor: string
  fechaCreacion: Date
  contabilizadoPor?: string
  fechaContabilizacion?: Date
  anuladoPor?: string
  fechaAnulacion?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateAsientoDTO {
  fecha: Date | string
  concepto: string
  lineas: Array<{
    cuentaCodigo: string
    debe: number
    haber: number
    concepto?: string
    terceroId?: string
    documentoRef?: string
  }>
  origenTipo?: OrigenAsiento
  origenId?: string
  origenNumero?: string
}

export interface AsientosFilters {
  fechaDesde?: string
  fechaHasta?: string
  ejercicio?: number
  periodo?: number
  cuentaCodigo?: string
  origenTipo?: OrigenAsiento
  estado?: EstadoAsiento
  concepto?: string
  pagina?: number
  limite?: number
}

export interface AsientosListResponse {
  success: boolean
  asientos: AsientoContable[]
  total: number
  paginas: number
}

// ============================================
// CONFIGURACIÓN CONTABLE
// ============================================

export interface ConfigContable {
  _id: string
  ejercicioActivo: number
  proximoNumeroAsiento: number
  reiniciarNumeracionAnual: boolean
  generarAsientosAutomaticos: boolean
  permitirAsientosDescuadrados: boolean
  bloquearPeriodosCerrados: boolean
  prefijoCuentaCliente: string
  prefijoCuentaProveedor: string
  longitudSubcuentaCliente: number
  longitudSubcuentaProveedor: number
  cuentaVentasPorDefecto?: string
  cuentaComprasPorDefecto?: string
  cuentaIVARepercutido?: string
  cuentaIVASoportado?: string
  cuentaBanco?: string
  cuentaCaja?: string
  ejercicios: Array<{
    ejercicio: number
    cerrado: boolean
    fechaCierre?: Date
    periodos: Array<{
      mes: number
      cerrado: boolean
      fechaCierre?: Date
    }>
  }>
}

// ============================================
// INFORMES
// ============================================

export interface FiltrosInformes {
  fechaDesde?: string
  fechaHasta?: string
  ejercicio?: number
  periodo?: number
  nivel?: number
  cuentaDesde?: string
  cuentaHasta?: string
  incluirCuentasSinMovimiento?: boolean
}

export interface LibroDiarioItem {
  numero: number
  fecha: Date
  concepto: string
  lineas: LineaAsiento[]
  totalDebe: number
  totalHaber: number
  estado: EstadoAsiento
}

export interface LibroDiarioResponse {
  asientos: LibroDiarioItem[]
  totales: {
    debe: number
    haber: number
  }
  filtros: FiltrosInformes
  generadoEn: Date
}

export interface LibroMayorMovimiento {
  fecha: Date
  asientoNumero: number
  concepto: string
  debe: number
  haber: number
  saldoParcial: number
  documentoRef?: string
  terceroNombre?: string
}

export interface LibroMayorCuenta {
  cuentaCodigo: string
  cuentaNombre: string
  naturaleza: string
  saldoInicial: number
  movimientos: LibroMayorMovimiento[]
  totalDebe: number
  totalHaber: number
  saldoFinal: number
}

export interface LibroMayorResponse {
  cuentas: LibroMayorCuenta[]
  resumen: {
    totalCuentas: number
    totalDebe: number
    totalHaber: number
  }
  filtros: FiltrosInformes
}

export interface SumasSaldosItem {
  codigo: string
  nombre: string
  nivel: number
  sumaDebe: number
  sumaHaber: number
  saldoDeudor: number
  saldoAcreedor: number
}

export interface SumasSaldosResponse {
  lineas: SumasSaldosItem[]
  totales: {
    sumaDebe: number
    sumaHaber: number
    saldoDeudor: number
    saldoAcreedor: number
  }
  filtros: FiltrosInformes
  generadoEn: Date
}

export interface BalanceSituacionResponse {
  activo: {
    lineas: Array<{ codigo: string; nombre: string; importe: number; nivel: number }>
    total: number
  }
  pasivo: {
    lineas: Array<{ codigo: string; nombre: string; importe: number; nivel: number }>
    total: number
  }
  patrimonio: {
    lineas: Array<{ codigo: string; nombre: string; importe: number; nivel: number }>
    total: number
  }
  resultado: number
  filtros: FiltrosInformes
  generadoEn: Date
}

export interface CuentaResultadosResponse {
  ingresos: {
    lineas: Array<{ codigo: string; nombre: string; importe: number; nivel: number }>
    total: number
  }
  gastos: {
    lineas: Array<{ codigo: string; nombre: string; importe: number; nivel: number }>
    total: number
  }
  resultado: number
  filtros: FiltrosInformes
  generadoEn: Date
}

// ============================================
// EXPORTACIÓN
// ============================================

export type ExportFormat = 'csv' | 'a3' | 'sage50' | 'sagedespachos' | 'sage200'

export interface ExportFormatInfo {
  nombre: string
  descripcion: string
  extension: string
}

export interface ExportFilters {
  formato: ExportFormat
  ejercicio?: number
  fechaDesde?: string
  fechaHasta?: string
  codigoEmpresa?: string
}
