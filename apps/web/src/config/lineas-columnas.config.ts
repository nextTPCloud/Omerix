/**
 * Configuración de columnas para líneas de documentos
 * Define las columnas disponibles, sus anchos y valores por defecto
 */

import { ColumnaConfig } from '@/services/configuracion.service'

/**
 * Definición de una columna de líneas
 */
export interface ColumnaLineaDefinition {
  key: string
  label: string
  width: number // Ancho en píxeles (mínimo 50 para validación del backend)
  gridSpan: number // Unidades de grid para el layout (1-12)
  align?: 'left' | 'center' | 'right'
  soloVentas?: boolean // Si es true, solo se muestra en documentos de venta
  soloCompras?: boolean // Si es true, solo se muestra en documentos de compra
  soloAlbaranes?: boolean // Si es true, solo se muestra en albaranes
  editable?: boolean // Si la columna tiene un input editable
  requiereCostes?: boolean // Si es true, solo se muestra cuando mostrarCostes=true
}

/**
 * Columnas disponibles para líneas de documentos
 */
export const COLUMNAS_LINEAS: ColumnaLineaDefinition[] = [
  {
    key: 'tipo',
    label: 'Tipo',
    width: 75,
    gridSpan: 1,
    align: 'left',
    editable: true,
  },
  {
    key: 'codigo',
    label: 'Código',
    width: 75,
    gridSpan: 1,
    align: 'left',
    editable: false,
  },
  {
    key: 'nombre',
    label: 'Producto / Descripción',
    width: 320,
    gridSpan: 4,
    align: 'left',
    editable: true,
  },
  {
    key: 'cantidad',
    label: 'Cant.',
    width: 65,
    gridSpan: 1,
    align: 'right',
    editable: true,
  },
  {
    key: 'cantidadSolicitada',
    label: 'Solicitada',
    width: 80,
    gridSpan: 1,
    align: 'right',
    editable: true,
    soloAlbaranes: true,
  },
  {
    key: 'cantidadEntregada',
    label: 'Entregada',
    width: 80,
    gridSpan: 1,
    align: 'right',
    editable: true,
    soloAlbaranes: true,
  },
  {
    key: 'unidad',
    label: 'Ud.',
    width: 60,
    gridSpan: 1,
    align: 'center',
    editable: false,
  },
  {
    key: 'peso',
    label: 'Peso',
    width: 70,
    gridSpan: 1,
    align: 'right',
    editable: false,
  },
  {
    key: 'precioUnitario',
    label: 'Precio',
    width: 90,
    gridSpan: 1,
    align: 'right',
    editable: true,
  },
  {
    key: 'costeUnitario',
    label: 'Coste',
    width: 90,
    gridSpan: 1,
    align: 'right',
    editable: true,
    soloVentas: true,
    requiereCostes: true,
  },
  {
    key: 'descuento',
    label: 'Dto.%',
    width: 70,
    gridSpan: 1,
    align: 'right',
    editable: true,
  },
  {
    key: 'subtotalBruto',
    label: 'Subt. bruto',
    width: 90,
    gridSpan: 1,
    align: 'right',
    editable: false,
  },
  {
    key: 'iva',
    label: 'IVA%',
    width: 70,
    gridSpan: 1,
    align: 'right',
    editable: true,
  },
  {
    key: 'ivaImporte',
    label: 'IVA €',
    width: 80,
    gridSpan: 1,
    align: 'right',
    editable: false,
  },
  {
    key: 'subtotal',
    label: 'Subtotal',
    width: 90,
    gridSpan: 1,
    align: 'right',
    editable: false,
  },
  {
    key: 'costeTotalLinea',
    label: 'Coste total',
    width: 90,
    gridSpan: 1,
    align: 'right',
    editable: false,
    soloVentas: true,
    requiereCostes: true,
  },
  {
    key: 'margenPorcentaje',
    label: 'Margen %',
    width: 80,
    gridSpan: 1,
    align: 'right',
    editable: false,
    soloVentas: true,
    requiereCostes: true,
  },
  {
    key: 'notasInternas',
    label: 'Notas',
    width: 100,
    gridSpan: 1,
    align: 'left',
    editable: true,
  },
  {
    key: 'acciones',
    label: '',
    width: 160,
    gridSpan: 1,
    align: 'center',
    editable: false,
  },
]

/**
 * Columnas visibles por defecto para documentos de venta
 */
export const DEFAULT_COLUMNAS_VENTAS: string[] = [
  'tipo',
  'nombre',
  'cantidad',
  'precioUnitario',
  'descuento',
  'iva',
  'subtotal',
  'acciones',
]

/**
 * Columnas visibles por defecto para documentos de compra
 */
export const DEFAULT_COLUMNAS_COMPRAS: string[] = [
  'tipo',
  'nombre',
  'cantidad',
  'precioUnitario',
  'descuento',
  'iva',
  'subtotal',
  'acciones',
]

/**
 * Columnas visibles por defecto para albaranes (incluye cantidad solicitada/entregada)
 */
export const DEFAULT_COLUMNAS_ALBARANES: string[] = [
  'tipo',
  'nombre',
  'cantidadSolicitada',
  'cantidadEntregada',
  'precioUnitario',
  'descuento',
  'iva',
  'subtotal',
  'acciones',
]

/**
 * Obtener columnas disponibles según el tipo de documento
 */
export function getColumnasDisponibles(
  esVenta: boolean,
  mostrarCostes: boolean = false,
  esAlbaran: boolean = false
): ColumnaLineaDefinition[] {
  return COLUMNAS_LINEAS.filter(col => {
    // Filtrar columnas solo para ventas
    if (col.soloVentas && !esVenta) return false
    // Filtrar columnas solo para compras
    if (col.soloCompras && esVenta) return false
    // Filtrar columnas que requieren costes
    if (col.requiereCostes && !mostrarCostes) return false
    // Filtrar columnas solo para albaranes
    if (col.soloAlbaranes && !esAlbaran) return false
    return true
  })
}

/**
 * Obtener configuración por defecto para un módulo
 */
export function getDefaultConfig(esVenta: boolean, esAlbaran: boolean = false): ColumnaConfig[] {
  let defaultKeys: string[]
  if (esAlbaran) {
    defaultKeys = DEFAULT_COLUMNAS_ALBARANES
  } else if (esVenta) {
    defaultKeys = DEFAULT_COLUMNAS_VENTAS
  } else {
    defaultKeys = DEFAULT_COLUMNAS_COMPRAS
  }

  return COLUMNAS_LINEAS.map((col, index) => ({
    key: col.key,
    visible: defaultKeys.includes(col.key),
    orden: index,
    ancho: col.width,
  }))
}

/**
 * Calcular el ancho total del grid según columnas visibles (en unidades de grid)
 */
export function calcularAnchoGrid(columnasVisibles: string[]): number {
  return COLUMNAS_LINEAS
    .filter(col => columnasVisibles.includes(col.key))
    .reduce((total, col) => total + col.gridSpan, 0)
}

/**
 * Generar clase CSS de grid según columnas visibles
 */
export function generarGridCols(columnasVisibles: ColumnaLineaDefinition[]): string {
  const totalSpan = columnasVisibles.reduce((total, col) => total + col.gridSpan, 0)
  return `grid-cols-${Math.min(totalSpan, 12)}`
}
