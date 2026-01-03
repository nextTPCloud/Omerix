/**
 * Exportador de Contabilidad a CSV
 * Formato genérico para importación en otras aplicaciones
 */

import { IAsientoContable, ILineaAsiento } from '../models/AsientoContable';

// Opciones de exportación CSV
export interface ICSVExportOptions {
  separador?: string;           // Separador de campos (default: ';')
  delimitadorTexto?: string;    // Delimitador de texto (default: '"')
  formatoFecha?: 'iso' | 'es' | 'us';  // Formato de fecha
  incluirCabecera?: boolean;    // Incluir fila de cabecera
  decimalSeparator?: '.' | ','; // Separador decimal
  // Campos a incluir
  campos?: {
    asiento?: boolean;
    fecha?: boolean;
    ejercicio?: boolean;
    periodo?: boolean;
    cuenta?: boolean;
    nombreCuenta?: boolean;
    debe?: boolean;
    haber?: boolean;
    concepto?: boolean;
    conceptoLinea?: boolean;
    terceroNif?: boolean;
    terceroNombre?: boolean;
    documentoRef?: boolean;
  };
}

// Configuración por defecto
const defaultOptions: Required<ICSVExportOptions> = {
  separador: ';',
  delimitadorTexto: '"',
  formatoFecha: 'es',
  incluirCabecera: true,
  decimalSeparator: ',',
  campos: {
    asiento: true,
    fecha: true,
    ejercicio: true,
    periodo: true,
    cuenta: true,
    nombreCuenta: true,
    debe: true,
    haber: true,
    concepto: true,
    conceptoLinea: true,
    terceroNif: true,
    terceroNombre: true,
    documentoRef: true,
  },
};

/**
 * Formatea una fecha según el formato especificado
 */
function formatearFecha(fecha: Date, formato: 'iso' | 'es' | 'us'): string {
  const d = new Date(fecha);
  const dia = d.getDate().toString().padStart(2, '0');
  const mes = (d.getMonth() + 1).toString().padStart(2, '0');
  const anio = d.getFullYear();

  switch (formato) {
    case 'iso':
      return `${anio}-${mes}-${dia}`;
    case 'us':
      return `${mes}/${dia}/${anio}`;
    case 'es':
    default:
      return `${dia}/${mes}/${anio}`;
  }
}

/**
 * Formatea un número según el separador decimal
 */
function formatearNumero(numero: number, separador: '.' | ','): string {
  const str = numero.toFixed(2);
  if (separador === ',') {
    return str.replace('.', ',');
  }
  return str;
}

/**
 * Escapa un valor para CSV
 */
function escaparCSV(valor: string | null | undefined, delimitador: string, separador: string): string {
  if (valor == null) return '';

  const str = String(valor);
  // Si contiene el delimitador, separador, o saltos de línea, envolver en delimitadores
  if (str.includes(delimitador) || str.includes(separador) || str.includes('\n') || str.includes('\r')) {
    // Escapar delimitadores duplicándolos
    return delimitador + str.replace(new RegExp(delimitador, 'g'), delimitador + delimitador) + delimitador;
  }
  return str;
}

/**
 * Genera las cabeceras del CSV según los campos configurados
 */
function generarCabeceras(campos: Required<ICSVExportOptions>['campos'], separador: string): string {
  const headers: string[] = [];

  if (campos.asiento) headers.push('Asiento');
  if (campos.fecha) headers.push('Fecha');
  if (campos.ejercicio) headers.push('Ejercicio');
  if (campos.periodo) headers.push('Periodo');
  if (campos.cuenta) headers.push('Cuenta');
  if (campos.nombreCuenta) headers.push('NombreCuenta');
  if (campos.debe) headers.push('Debe');
  if (campos.haber) headers.push('Haber');
  if (campos.concepto) headers.push('Concepto');
  if (campos.conceptoLinea) headers.push('ConceptoLinea');
  if (campos.terceroNif) headers.push('NIF');
  if (campos.terceroNombre) headers.push('NombreTercero');
  if (campos.documentoRef) headers.push('Documento');

  return headers.join(separador);
}

/**
 * Genera una línea de datos para el CSV
 */
function generarLineaDatos(
  asiento: IAsientoContable,
  linea: ILineaAsiento,
  options: Required<ICSVExportOptions>
): string {
  const { separador, delimitadorTexto, formatoFecha, decimalSeparator, campos } = options;
  const valores: string[] = [];

  if (campos.asiento) {
    valores.push(asiento.numero.toString());
  }
  if (campos.fecha) {
    valores.push(formatearFecha(asiento.fecha, formatoFecha));
  }
  if (campos.ejercicio) {
    valores.push(asiento.ejercicio.toString());
  }
  if (campos.periodo) {
    valores.push(asiento.periodo.toString());
  }
  if (campos.cuenta) {
    valores.push(escaparCSV(linea.cuentaCodigo, delimitadorTexto, separador));
  }
  if (campos.nombreCuenta) {
    valores.push(escaparCSV(linea.cuentaNombre, delimitadorTexto, separador));
  }
  if (campos.debe) {
    valores.push(formatearNumero(linea.debe || 0, decimalSeparator));
  }
  if (campos.haber) {
    valores.push(formatearNumero(linea.haber || 0, decimalSeparator));
  }
  if (campos.concepto) {
    valores.push(escaparCSV(asiento.concepto, delimitadorTexto, separador));
  }
  if (campos.conceptoLinea) {
    valores.push(escaparCSV(linea.concepto || '', delimitadorTexto, separador));
  }
  if (campos.terceroNif) {
    valores.push(escaparCSV(linea.terceroNif || '', delimitadorTexto, separador));
  }
  if (campos.terceroNombre) {
    valores.push(escaparCSV(linea.terceroNombre || '', delimitadorTexto, separador));
  }
  if (campos.documentoRef) {
    valores.push(escaparCSV(linea.documentoRef || '', delimitadorTexto, separador));
  }

  return valores.join(separador);
}

/**
 * Exporta asientos contables a formato CSV
 */
export function exportarAsientosCSV(
  asientos: IAsientoContable[],
  opciones?: Partial<ICSVExportOptions>
): string {
  // Combinar opciones con defaults
  const options: Required<ICSVExportOptions> = {
    ...defaultOptions,
    ...opciones,
    campos: {
      ...defaultOptions.campos,
      ...opciones?.campos,
    },
  };

  const lineas: string[] = [];

  // Agregar cabecera si está habilitada
  if (options.incluirCabecera) {
    lineas.push(generarCabeceras(options.campos, options.separador));
  }

  // Generar líneas de datos
  for (const asiento of asientos) {
    for (const linea of asiento.lineas) {
      lineas.push(generarLineaDatos(asiento, linea, options));
    }
  }

  return lineas.join('\r\n');
}

/**
 * Exporta el plan de cuentas a CSV
 */
export interface ICuentaContableBasica {
  codigo: string;
  nombre: string;
  tipo?: string;
  nivel?: number;
  esTitulo?: boolean;
  activa?: boolean;
}

export function exportarPlanCuentasCSV(
  cuentas: ICuentaContableBasica[],
  opciones?: Partial<ICSVExportOptions>
): string {
  const options = {
    separador: opciones?.separador || ';',
    delimitadorTexto: opciones?.delimitadorTexto || '"',
    incluirCabecera: opciones?.incluirCabecera !== false,
  };

  const lineas: string[] = [];

  // Cabecera
  if (options.incluirCabecera) {
    lineas.push(['Codigo', 'Nombre', 'Tipo', 'Nivel', 'EsTitulo', 'Activa'].join(options.separador));
  }

  // Datos
  for (const cuenta of cuentas) {
    const valores = [
      escaparCSV(cuenta.codigo, options.delimitadorTexto, options.separador),
      escaparCSV(cuenta.nombre, options.delimitadorTexto, options.separador),
      cuenta.tipo || '',
      cuenta.nivel?.toString() || '',
      cuenta.esTitulo ? 'S' : 'N',
      cuenta.activa !== false ? 'S' : 'N',
    ];
    lineas.push(valores.join(options.separador));
  }

  return lineas.join('\r\n');
}

/**
 * Exporta el libro diario resumido a CSV
 */
export interface ILibroDiarioResumen {
  numero: number;
  fecha: Date;
  concepto: string;
  totalDebe: number;
  totalHaber: number;
  estado: string;
}

export function exportarLibroDiarioCSV(
  registros: ILibroDiarioResumen[],
  opciones?: Partial<ICSVExportOptions>
): string {
  const options = {
    separador: opciones?.separador || ';',
    delimitadorTexto: opciones?.delimitadorTexto || '"',
    formatoFecha: opciones?.formatoFecha || 'es',
    decimalSeparator: opciones?.decimalSeparator || ',',
    incluirCabecera: opciones?.incluirCabecera !== false,
  };

  const lineas: string[] = [];

  // Cabecera
  if (options.incluirCabecera) {
    lineas.push(['Asiento', 'Fecha', 'Concepto', 'Debe', 'Haber', 'Estado'].join(options.separador));
  }

  // Datos
  for (const reg of registros) {
    const valores = [
      reg.numero.toString(),
      formatearFecha(reg.fecha, options.formatoFecha as 'es'),
      escaparCSV(reg.concepto, options.delimitadorTexto, options.separador),
      formatearNumero(reg.totalDebe, options.decimalSeparator as '.'),
      formatearNumero(reg.totalHaber, options.decimalSeparator as '.'),
      reg.estado,
    ];
    lineas.push(valores.join(options.separador));
  }

  return lineas.join('\r\n');
}

export default {
  exportarAsientosCSV,
  exportarPlanCuentasCSV,
  exportarLibroDiarioCSV,
};
