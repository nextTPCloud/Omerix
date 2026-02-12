/**
 * Configuración de columnas para líneas de partes de trabajo
 * Define las columnas disponibles para cada tipo de línea: Material, Personal, Maquinaria, Transporte, Gastos
 */

import { ColumnaConfig } from '@/services/configuracion.service'

/**
 * Definición de una columna de líneas de parte de trabajo
 */
export interface ColumnaParteTrabajoDefinition {
  key: string
  label: string
  width: number
  gridSpan: number
  align?: 'left' | 'center' | 'right'
  editable?: boolean
  requiereCostes?: boolean
}

// =============================================================================
// COLUMNAS PARA LÍNEAS DE MATERIAL
// =============================================================================

export const COLUMNAS_MATERIAL: ColumnaParteTrabajoDefinition[] = [
  { key: 'producto', label: 'Producto', width: 300, gridSpan: 3, align: 'left', editable: true },
  { key: 'codigo', label: 'Código', width: 80, gridSpan: 1, align: 'left' },
  { key: 'cantidad', label: 'Cantidad', width: 80, gridSpan: 1, align: 'right', editable: true },
  { key: 'unidad', label: 'Ud.', width: 60, gridSpan: 1, align: 'center' },
  { key: 'precioCoste', label: 'P. Coste', width: 90, gridSpan: 1, align: 'right', editable: true, requiereCostes: true },
  { key: 'precioVenta', label: 'P. Venta', width: 90, gridSpan: 1, align: 'right', editable: true },
  { key: 'descuento', label: 'Dto.%', width: 70, gridSpan: 1, align: 'right', editable: true },
  { key: 'costeTotal', label: 'Coste Total', width: 100, gridSpan: 1, align: 'right', requiereCostes: true },
  { key: 'ventaTotal', label: 'Total Venta', width: 100, gridSpan: 1, align: 'right' },
  { key: 'facturable', label: 'Fact.', width: 60, gridSpan: 1, align: 'center', editable: true },
  { key: 'acciones', label: '', width: 120, gridSpan: 1, align: 'center' },
]

export const DEFAULT_COLUMNAS_MATERIAL: string[] = [
  'producto', 'cantidad', 'unidad', 'precioVenta', 'descuento', 'ventaTotal', 'facturable', 'acciones'
]

// =============================================================================
// COLUMNAS PARA LÍNEAS DE PERSONAL
// =============================================================================

export const COLUMNAS_PERSONAL: ColumnaParteTrabajoDefinition[] = [
  { key: 'trabajador', label: 'Trabajador', width: 200, gridSpan: 2, align: 'left', editable: true },
  { key: 'servicio', label: 'Servicio', width: 180, gridSpan: 2, align: 'left', editable: true },
  { key: 'fecha', label: 'Fecha', width: 110, gridSpan: 1, align: 'center', editable: true },
  { key: 'horaInicio', label: 'Entrada', width: 80, gridSpan: 1, align: 'center', editable: true },
  { key: 'horaFin', label: 'Salida', width: 80, gridSpan: 1, align: 'center', editable: true },
  { key: 'horasTrabajadas', label: 'Horas', width: 70, gridSpan: 1, align: 'right', editable: true },
  { key: 'horasExtras', label: 'H. Extra', width: 70, gridSpan: 1, align: 'right', editable: true },
  { key: 'tarifaCoste', label: 'T. Coste/h', width: 90, gridSpan: 1, align: 'right', editable: true, requiereCostes: true },
  { key: 'tarifaVenta', label: 'T. Venta/h', width: 90, gridSpan: 1, align: 'right', editable: true },
  { key: 'costeTotal', label: 'Coste', width: 90, gridSpan: 1, align: 'right', requiereCostes: true },
  { key: 'ventaTotal', label: 'Venta', width: 90, gridSpan: 1, align: 'right' },
  { key: 'facturable', label: 'Fact.', width: 60, gridSpan: 1, align: 'center', editable: true },
  { key: 'acciones', label: '', width: 120, gridSpan: 1, align: 'center' },
]

export const DEFAULT_COLUMNAS_PERSONAL: string[] = [
  'trabajador', 'fecha', 'horaInicio', 'horaFin', 'horasTrabajadas', 'tarifaVenta', 'ventaTotal', 'facturable', 'acciones'
]

// =============================================================================
// COLUMNAS PARA LÍNEAS DE MAQUINARIA
// =============================================================================

export const COLUMNAS_MAQUINARIA: ColumnaParteTrabajoDefinition[] = [
  { key: 'maquinaria', label: 'Maquinaria', width: 250, gridSpan: 2, align: 'left', editable: true },
  { key: 'codigo', label: 'Código', width: 80, gridSpan: 1, align: 'left' },
  { key: 'operador', label: 'Operador', width: 180, gridSpan: 2, align: 'left', editable: true },
  { key: 'tipoUnidad', label: 'Tipo Ud.', width: 90, gridSpan: 1, align: 'center', editable: true },
  { key: 'cantidad', label: 'Cantidad', width: 80, gridSpan: 1, align: 'right', editable: true },
  { key: 'fechaUso', label: 'Fecha Uso', width: 110, gridSpan: 1, align: 'center', editable: true },
  { key: 'tarifaCoste', label: 'T. Coste', width: 90, gridSpan: 1, align: 'right', editable: true, requiereCostes: true },
  { key: 'tarifaVenta', label: 'T. Venta', width: 90, gridSpan: 1, align: 'right', editable: true },
  { key: 'costeTotal', label: 'Coste', width: 90, gridSpan: 1, align: 'right', requiereCostes: true },
  { key: 'ventaTotal', label: 'Venta', width: 90, gridSpan: 1, align: 'right' },
  { key: 'facturable', label: 'Fact.', width: 60, gridSpan: 1, align: 'center', editable: true },
  { key: 'acciones', label: '', width: 120, gridSpan: 1, align: 'center' },
]

export const DEFAULT_COLUMNAS_MAQUINARIA: string[] = [
  'maquinaria', 'tipoUnidad', 'cantidad', 'fechaUso', 'tarifaVenta', 'ventaTotal', 'facturable', 'acciones'
]

// =============================================================================
// COLUMNAS PARA LÍNEAS DE TRANSPORTE
// =============================================================================

export const COLUMNAS_TRANSPORTE: ColumnaParteTrabajoDefinition[] = [
  { key: 'vehiculo', label: 'Vehículo', width: 150, gridSpan: 1, align: 'left', editable: true },
  { key: 'matricula', label: 'Matrícula', width: 100, gridSpan: 1, align: 'center', editable: true },
  { key: 'conductor', label: 'Conductor', width: 180, gridSpan: 2, align: 'left', editable: true },
  { key: 'origen', label: 'Origen', width: 150, gridSpan: 1, align: 'left', editable: true },
  { key: 'destino', label: 'Destino', width: 150, gridSpan: 1, align: 'left', editable: true },
  { key: 'kmRecorridos', label: 'Km', width: 70, gridSpan: 1, align: 'right', editable: true },
  { key: 'tarifaKm', label: '€/Km', width: 70, gridSpan: 1, align: 'right', editable: true },
  { key: 'importeFijo', label: 'Imp. Fijo', width: 80, gridSpan: 1, align: 'right', editable: true },
  { key: 'peajes', label: 'Peajes', width: 80, gridSpan: 1, align: 'right', editable: true },
  { key: 'combustible', label: 'Comb.', width: 80, gridSpan: 1, align: 'right', editable: true },
  { key: 'costeTotal', label: 'Coste', width: 90, gridSpan: 1, align: 'right', requiereCostes: true },
  { key: 'precioVenta', label: 'P. Venta', width: 90, gridSpan: 1, align: 'right', editable: true },
  { key: 'facturable', label: 'Fact.', width: 60, gridSpan: 1, align: 'center', editable: true },
  { key: 'acciones', label: '', width: 120, gridSpan: 1, align: 'center' },
]

export const DEFAULT_COLUMNAS_TRANSPORTE: string[] = [
  'vehiculo', 'matricula', 'origen', 'destino', 'kmRecorridos', 'tarifaKm', 'precioVenta', 'facturable', 'acciones'
]

// =============================================================================
// COLUMNAS PARA LÍNEAS DE GASTOS
// =============================================================================

export const COLUMNAS_GASTOS: ColumnaParteTrabajoDefinition[] = [
  { key: 'tipoGasto', label: 'Tipo Gasto', width: 180, gridSpan: 2, align: 'left', editable: true },
  { key: 'descripcion', label: 'Descripción', width: 250, gridSpan: 2, align: 'left', editable: true },
  { key: 'fecha', label: 'Fecha', width: 110, gridSpan: 1, align: 'center', editable: true },
  { key: 'proveedor', label: 'Proveedor', width: 150, gridSpan: 1, align: 'left', editable: true },
  { key: 'numFactura', label: 'Nº Factura', width: 100, gridSpan: 1, align: 'left', editable: true },
  { key: 'importe', label: 'Importe', width: 90, gridSpan: 1, align: 'right', editable: true },
  { key: 'margen', label: 'Margen %', width: 80, gridSpan: 1, align: 'right', editable: true },
  { key: 'iva', label: 'IVA %', width: 70, gridSpan: 1, align: 'right', editable: true },
  { key: 'importeFacturable', label: 'Imp. Fact.', width: 100, gridSpan: 1, align: 'right' },
  { key: 'facturable', label: 'Fact.', width: 60, gridSpan: 1, align: 'center', editable: true },
  { key: 'acciones', label: '', width: 120, gridSpan: 1, align: 'center' },
]

export const DEFAULT_COLUMNAS_GASTOS: string[] = [
  'tipoGasto', 'descripcion', 'fecha', 'importe', 'margen', 'importeFacturable', 'facturable', 'acciones'
]

// =============================================================================
// FUNCIONES HELPER
// =============================================================================

export type TipoLineaParteTrabajo = 'material' | 'personal' | 'maquinaria' | 'transporte' | 'gastos'

/**
 * Obtener columnas disponibles según tipo de línea
 */
export function getColumnasPartesTrabajo(
  tipo: TipoLineaParteTrabajo,
  mostrarCostes: boolean = false
): ColumnaParteTrabajoDefinition[] {
  let columnas: ColumnaParteTrabajoDefinition[]

  switch (tipo) {
    case 'material':
      columnas = COLUMNAS_MATERIAL
      break
    case 'personal':
      columnas = COLUMNAS_PERSONAL
      break
    case 'maquinaria':
      columnas = COLUMNAS_MAQUINARIA
      break
    case 'transporte':
      columnas = COLUMNAS_TRANSPORTE
      break
    case 'gastos':
      columnas = COLUMNAS_GASTOS
      break
    default:
      columnas = COLUMNAS_MATERIAL
  }

  return columnas.filter(col => {
    if (col.requiereCostes && !mostrarCostes) return false
    return true
  })
}

/**
 * Obtener configuración por defecto para un tipo de línea
 */
export function getDefaultParteTrabajoConfig(tipo: TipoLineaParteTrabajo): ColumnaConfig[] {
  let columnas: ColumnaParteTrabajoDefinition[]
  let defaultKeys: string[]

  switch (tipo) {
    case 'material':
      columnas = COLUMNAS_MATERIAL
      defaultKeys = DEFAULT_COLUMNAS_MATERIAL
      break
    case 'personal':
      columnas = COLUMNAS_PERSONAL
      defaultKeys = DEFAULT_COLUMNAS_PERSONAL
      break
    case 'maquinaria':
      columnas = COLUMNAS_MAQUINARIA
      defaultKeys = DEFAULT_COLUMNAS_MAQUINARIA
      break
    case 'transporte':
      columnas = COLUMNAS_TRANSPORTE
      defaultKeys = DEFAULT_COLUMNAS_TRANSPORTE
      break
    case 'gastos':
      columnas = COLUMNAS_GASTOS
      defaultKeys = DEFAULT_COLUMNAS_GASTOS
      break
    default:
      columnas = COLUMNAS_MATERIAL
      defaultKeys = DEFAULT_COLUMNAS_MATERIAL
  }

  return columnas.map((col, index) => ({
    key: col.key,
    visible: defaultKeys.includes(col.key),
    orden: index,
    ancho: col.width,
  }))
}

/**
 * Obtener el nombre del módulo para guardar configuración
 */
export function getModuloNombreParteTrabajo(tipo: TipoLineaParteTrabajo): string {
  return `partes-trabajo-lineas-${tipo}`
}
