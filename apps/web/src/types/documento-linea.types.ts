/**
 * Tipos compartidos para líneas de documentos (presupuestos, pedidos, albaranes, facturas)
 * Tanto de ventas como de compras
 */

/**
 * Tipos de línea disponibles
 */
export enum TipoLinea {
  PRODUCTO = 'producto',
  SERVICIO = 'servicio',
  KIT = 'kit',
  TEXTO = 'texto',
  SUBTOTAL = 'subtotal',
  DESCUENTO = 'descuento',
}

/**
 * Componente de un kit
 */
export interface IComponenteKit {
  productoId: string;
  nombre: string;
  sku?: string;
  cantidad: number;
  precioUnitario: number;
  costeUnitario: number;
  descuento: number;
  iva: number;
  subtotal: number;
  opcional: boolean;
  seleccionado: boolean;
}

/**
 * Variante seleccionada en una línea
 */
export interface IVarianteSeleccionada {
  varianteId?: string;
  sku: string;
  combinacion: Record<string, string>;
  precioAdicional: number;
  costeAdicional: number;
}

/**
 * Interfaz base para líneas de documentos
 */
export interface ILineaDocumentoBase {
  _id?: string;
  orden: number;
  tipo: TipoLinea;
  productoId?: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  descripcionLarga?: string;
  sku?: string;
  variante?: IVarianteSeleccionada;
  cantidad: number;
  unidad?: string;
  // Peso
  peso?: number; // Peso unitario en kg
  pesoTotal?: number; // Peso total de la línea (peso * cantidad)
  precioUnitario: number;
  descuento: number;
  descuentoImporte: number;
  subtotal: number;
  iva: number;
  ivaImporte: number;
  total: number;
  costeUnitario: number;
  costeTotalLinea: number;
  margenUnitario: number;
  margenPorcentaje: number;
  margenTotalLinea: number;
  componentesKit?: IComponenteKit[];
  mostrarComponentes: boolean;
  esEditable: boolean;
  incluidoEnTotal: boolean;
  notasInternas?: string;
}

/**
 * Línea específica para documentos de venta
 */
export interface ILineaVenta extends ILineaDocumentoBase {
  // Precio de venta al público
  pvpUnitario?: number;
  pvpConIva?: number;
}

/**
 * Línea específica para documentos de compra
 */
export interface ILineaCompra extends ILineaDocumentoBase {
  // En compras, precioUnitario es el precio de compra
  // No hay PVP ni margen (o el margen es negativo/diferente)
}

/**
 * Tipos de IVA comunes
 */
export const TIPOS_IVA = [
  { value: 21, label: '21%' },
  { value: 10, label: '10%' },
  { value: 4, label: '4%' },
  { value: 0, label: '0%' },
];

/**
 * Tipos de línea para select
 */
export const TIPOS_LINEA_OPTIONS = [
  { value: TipoLinea.PRODUCTO, label: 'Producto' },
  { value: TipoLinea.SERVICIO, label: 'Servicio' },
  { value: TipoLinea.KIT, label: 'Kit' },
  { value: TipoLinea.TEXTO, label: 'Texto' },
  { value: TipoLinea.SUBTOTAL, label: 'Subtotal' },
  { value: TipoLinea.DESCUENTO, label: 'Descuento' },
];

/**
 * Crear una línea vacía
 */
export function crearLineaVacia(orden: number = 1, tipo: TipoLinea = TipoLinea.PRODUCTO): ILineaDocumentoBase {
  return {
    orden,
    tipo,
    nombre: '',
    cantidad: 1,
    precioUnitario: 0,
    descuento: 0,
    descuentoImporte: 0,
    subtotal: 0,
    iva: 21,
    ivaImporte: 0,
    total: 0,
    costeUnitario: 0,
    costeTotalLinea: 0,
    margenUnitario: 0,
    margenPorcentaje: 0,
    margenTotalLinea: 0,
    mostrarComponentes: true,
    esEditable: true,
    incluidoEnTotal: true,
  };
}

/**
 * Calcular los valores derivados de una línea
 */
export function calcularLinea<T extends ILineaDocumentoBase>(linea: T): T {
  const subtotalBruto = linea.cantidad * linea.precioUnitario;
  const descuentoImporte = subtotalBruto * (linea.descuento / 100);
  const subtotal = subtotalBruto - descuentoImporte;
  const ivaImporte = subtotal * (linea.iva / 100);
  const total = subtotal + ivaImporte;

  // Peso total
  const pesoTotal = (linea.peso || 0) * linea.cantidad;

  // Costes
  const costeTotalLinea = linea.cantidad * linea.costeUnitario;

  // Márgenes (solo si hay coste)
  let margenUnitario = 0;
  let margenPorcentaje = 0;
  let margenTotalLinea = 0;

  if (linea.costeUnitario > 0) {
    margenUnitario = linea.precioUnitario - linea.costeUnitario;
    margenPorcentaje = ((linea.precioUnitario - linea.costeUnitario) / linea.costeUnitario) * 100;
    margenTotalLinea = subtotal - costeTotalLinea;
  } else if (linea.precioUnitario > 0) {
    // Si no hay coste pero hay precio, el margen es 100%
    margenUnitario = linea.precioUnitario;
    margenPorcentaje = 100;
    margenTotalLinea = subtotal;
  }

  return {
    ...linea,
    descuentoImporte,
    subtotal,
    ivaImporte,
    total,
    pesoTotal,
    costeTotalLinea,
    margenUnitario,
    margenPorcentaje,
    margenTotalLinea,
  };
}

/**
 * Calcular totales de un array de líneas
 */
export function calcularTotales(lineas: ILineaDocumentoBase[]): {
  subtotalBruto: number;
  totalDescuentos: number;
  subtotalNeto: number;
  totalIva: number;
  total: number;
  costeTotal: number;
  margenBruto: number;
  margenPorcentaje: number;
} {
  const lineasEnTotal = lineas.filter(l => l.incluidoEnTotal && l.tipo !== TipoLinea.TEXTO && l.tipo !== TipoLinea.SUBTOTAL);

  const subtotalBruto = lineasEnTotal.reduce((acc, l) => acc + (l.cantidad * l.precioUnitario), 0);
  const totalDescuentos = lineasEnTotal.reduce((acc, l) => acc + l.descuentoImporte, 0);
  const subtotalNeto = lineasEnTotal.reduce((acc, l) => acc + l.subtotal, 0);
  const totalIva = lineasEnTotal.reduce((acc, l) => acc + l.ivaImporte, 0);
  const total = subtotalNeto + totalIva;
  const costeTotal = lineasEnTotal.reduce((acc, l) => acc + l.costeTotalLinea, 0);
  const margenBruto = subtotalNeto - costeTotal;
  const margenPorcentaje = costeTotal > 0 ? ((margenBruto / costeTotal) * 100) : (subtotalNeto > 0 ? 100 : 0);

  return {
    subtotalBruto,
    totalDescuentos,
    subtotalNeto,
    totalIva,
    total,
    costeTotal,
    margenBruto,
    margenPorcentaje,
  };
}
