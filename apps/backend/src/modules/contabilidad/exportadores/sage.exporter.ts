/**
 * Exportador de Contabilidad a formato Sage
 * Compatible con Sage 50 (ContaPlus), Sage Despachos y Sage 200
 *
 * Formatos soportados:
 * - Sage 50 / ContaPlus: archivos texto con campos separados
 * - Sage Despachos: formato XBase simplificado
 */

import { IAsientoContable, ILineaAsiento } from '../models/AsientoContable';

// Opciones de exportación Sage
export interface ISageExportOptions {
  codigoEmpresa?: string;       // Código empresa
  ejercicio?: number;           // Ejercicio fiscal
  formato?: 'sage50' | 'sagedespachos' | 'sage200';  // Formato de exportación
  separador?: string;           // Separador de campos (default: '\t' para Sage50)
  incluirCabecera?: boolean;    // Incluir fila de cabecera
  codificacion?: 'utf8' | 'latin1';  // Codificación de caracteres
}

// Configuración por defecto
const defaultOptions: Required<ISageExportOptions> = {
  codigoEmpresa: '001',
  ejercicio: new Date().getFullYear(),
  formato: 'sage50',
  separador: '\t',
  incluirCabecera: false,  // Sage normalmente no usa cabeceras
  codificacion: 'latin1',
};

/**
 * Formatea una fecha en formato Sage (DD/MM/YYYY o YYYYMMDD según formato)
 */
function formatearFechaSage(fecha: Date, formato: 'sage50' | 'sagedespachos' | 'sage200'): string {
  const d = new Date(fecha);
  const dia = d.getDate().toString().padStart(2, '0');
  const mes = (d.getMonth() + 1).toString().padStart(2, '0');
  const anio = d.getFullYear().toString();

  switch (formato) {
    case 'sage200':
      return `${anio}${mes}${dia}`;  // YYYYMMDD
    case 'sagedespachos':
    case 'sage50':
    default:
      return `${dia}/${mes}/${anio}`;  // DD/MM/YYYY
  }
}

/**
 * Formatea un número para Sage (2 decimales, punto o coma según config)
 */
function formatearNumeroSage(numero: number, usarComa: boolean = true): string {
  const str = Math.abs(numero).toFixed(2);
  return usarComa ? str.replace('.', ',') : str;
}

/**
 * Limpia texto para formato Sage (elimina caracteres especiales)
 */
function limpiarTextoSage(texto: string | null | undefined, maxLength: number = 40): string {
  if (!texto) return '';
  // Eliminar tabuladores y saltos de línea, truncar
  return texto
    .replace(/[\t\r\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, maxLength);
}

/**
 * Limpia NIF para Sage
 */
function limpiarNIFSage(nif: string | null | undefined): string {
  if (!nif) return '';
  return nif.replace(/[-\s.]/g, '').toUpperCase().substring(0, 15);
}

/**
 * Genera indicador Debe/Haber para Sage
 */
function getIndicadorDH(debe: number, haber: number): string {
  return debe > 0 ? 'D' : 'H';
}

// ============================================================================
// FORMATO SAGE 50 (ContaPlus)
// ============================================================================

/**
 * Genera cabecera para Sage 50
 */
function generarCabeceraSage50(separador: string): string {
  const campos = [
    'ASESSION',     // Número de sesión/asiento
    'FECHA',        // Fecha del asiento
    'CUENTA',       // Código de cuenta
    'DEBE',         // Importe debe
    'HABER',        // Importe haber
    'CONCEPTO',     // Concepto/descripción
    'DOCUMENTO',    // Número documento
    'NIF',          // NIF tercero
    'NOMBRE',       // Nombre tercero
    'CONTRAPAR',    // Cuenta contrapartida
    'FACTURA',      // Número factura
  ];
  return campos.join(separador);
}

/**
 * Genera línea de asiento para Sage 50
 */
function generarLineaSage50(
  asiento: IAsientoContable,
  linea: ILineaAsiento,
  separador: string
): string {
  const campos = [
    asiento.numero.toString(),                          // ASESSION
    formatearFechaSage(asiento.fecha, 'sage50'),        // FECHA
    linea.cuentaCodigo,                                 // CUENTA
    formatearNumeroSage(linea.debe || 0),               // DEBE
    formatearNumeroSage(linea.haber || 0),              // HABER
    limpiarTextoSage(linea.concepto || asiento.concepto, 50),  // CONCEPTO
    limpiarTextoSage(linea.documentoRef, 20),           // DOCUMENTO
    limpiarNIFSage(linea.terceroNif),                   // NIF
    limpiarTextoSage(linea.terceroNombre, 40),          // NOMBRE
    linea.cuentaContrapartida || '',                    // CONTRAPAR
    linea.documentoRef || '',                           // FACTURA (usamos documento como referencia)
  ];
  return campos.join(separador);
}

// ============================================================================
// FORMATO SAGE DESPACHOS
// ============================================================================

/**
 * Genera línea para Sage Despachos
 * Formato más simple, campos esenciales
 */
function generarLineaSageDespachos(
  asiento: IAsientoContable,
  linea: ILineaAsiento,
  codigoEmpresa: string,
  separador: string
): string {
  const importe = linea.debe > 0 ? linea.debe : linea.haber;
  const signo = getIndicadorDH(linea.debe, linea.haber);

  const campos = [
    codigoEmpresa,                                      // Código empresa
    asiento.ejercicio.toString(),                       // Ejercicio
    asiento.numero.toString().padStart(6, '0'),         // Número asiento
    formatearFechaSage(asiento.fecha, 'sagedespachos'), // Fecha
    linea.cuentaCodigo.padEnd(12, ' '),                 // Cuenta
    signo,                                              // D/H
    formatearNumeroSage(importe),                       // Importe
    limpiarTextoSage(linea.concepto || asiento.concepto, 40),  // Concepto
    limpiarNIFSage(linea.terceroNif),                   // NIF
    limpiarTextoSage(linea.terceroNombre, 35),          // Nombre
  ];
  return campos.join(separador);
}

// ============================================================================
// FORMATO SAGE 200
// ============================================================================

/**
 * Genera línea para Sage 200
 * Formato más completo con campos adicionales
 */
function generarLineaSage200(
  asiento: IAsientoContable,
  linea: ILineaAsiento,
  codigoEmpresa: string,
  ejercicio: number,
  separador: string
): string {
  const campos = [
    codigoEmpresa,                                      // CodigoEmpresa
    ejercicio.toString(),                               // Ejercicio
    asiento.periodo.toString().padStart(2, '0'),        // Periodo
    asiento.numero.toString(),                          // NumeroAsiento
    formatearFechaSage(asiento.fecha, 'sage200'),       // Fecha (YYYYMMDD)
    linea.cuentaCodigo,                                 // CodigoCuenta
    formatearNumeroSage(linea.debe || 0, false),        // ImporteDebe (con punto decimal)
    formatearNumeroSage(linea.haber || 0, false),       // ImporteHaber
    limpiarTextoSage(asiento.concepto, 50),             // ConceptoCabecera
    limpiarTextoSage(linea.concepto, 50),               // ConceptoLinea
    limpiarNIFSage(linea.terceroNif),                   // NIFTercero
    limpiarTextoSage(linea.terceroNombre, 40),          // NombreTercero
    limpiarTextoSage(linea.documentoRef, 20),           // NumeroDocumento
    asiento.tipoAsiento || 'N',                         // TipoAsiento (N=Normal)
    linea.cuentaContrapartida || '',                    // CuentaContrapartida
    '',                                                 // CodigoProyecto
    '',                                                 // CodigoDepartamento
    '',                                                 // CodigoSeccion
  ];
  return campos.join(separador);
}

/**
 * Genera cabecera para Sage 200
 */
function generarCabeceraSage200(separador: string): string {
  const campos = [
    'CodigoEmpresa',
    'Ejercicio',
    'Periodo',
    'NumeroAsiento',
    'Fecha',
    'CodigoCuenta',
    'ImporteDebe',
    'ImporteHaber',
    'ConceptoCabecera',
    'ConceptoLinea',
    'NIFTercero',
    'NombreTercero',
    'NumeroDocumento',
    'TipoAsiento',
    'CuentaContrapartida',
    'CodigoProyecto',
    'CodigoDepartamento',
    'CodigoSeccion',
  ];
  return campos.join(separador);
}

// ============================================================================
// FUNCIONES PRINCIPALES DE EXPORTACIÓN
// ============================================================================

/**
 * Exporta asientos contables a formato Sage
 */
export function exportarAsientosSage(
  asientos: IAsientoContable[],
  opciones?: Partial<ISageExportOptions>
): string {
  const options: Required<ISageExportOptions> = {
    ...defaultOptions,
    ...opciones,
  };

  const lineas: string[] = [];

  // Agregar cabecera si está habilitada
  if (options.incluirCabecera) {
    switch (options.formato) {
      case 'sage200':
        lineas.push(generarCabeceraSage200(options.separador));
        break;
      case 'sage50':
        lineas.push(generarCabeceraSage50(options.separador));
        break;
      // Sage Despachos no usa cabecera normalmente
    }
  }

  // Generar líneas según formato
  for (const asiento of asientos) {
    for (const linea of asiento.lineas) {
      switch (options.formato) {
        case 'sage200':
          lineas.push(generarLineaSage200(
            asiento,
            linea,
            options.codigoEmpresa,
            options.ejercicio,
            options.separador
          ));
          break;
        case 'sagedespachos':
          lineas.push(generarLineaSageDespachos(
            asiento,
            linea,
            options.codigoEmpresa,
            options.separador
          ));
          break;
        case 'sage50':
        default:
          lineas.push(generarLineaSage50(asiento, linea, options.separador));
          break;
      }
    }
  }

  return lineas.join('\r\n');
}

/**
 * Exporta plan de cuentas a formato Sage
 */
export interface ICuentaSageExport {
  codigo: string;
  nombre: string;
  nivel?: number;
  esTitulo?: boolean;
  activa?: boolean;
}

export function exportarPlanCuentasSage(
  cuentas: ICuentaSageExport[],
  opciones?: Partial<ISageExportOptions>
): string {
  const options: Required<ISageExportOptions> = {
    ...defaultOptions,
    ...opciones,
  };

  const lineas: string[] = [];

  // Cabecera
  if (options.incluirCabecera) {
    lineas.push(['Codigo', 'Nombre', 'Nivel', 'EsTitulo', 'Activa'].join(options.separador));
  }

  // Datos
  for (const cuenta of cuentas) {
    const campos = [
      cuenta.codigo,
      limpiarTextoSage(cuenta.nombre, 60),
      cuenta.nivel?.toString() || '1',
      cuenta.esTitulo ? 'S' : 'N',
      cuenta.activa !== false ? 'S' : 'N',
    ];
    lineas.push(campos.join(options.separador));
  }

  return lineas.join('\r\n');
}

/**
 * Exporta terceros (clientes/proveedores) a formato Sage
 */
export interface ITerceroSageExport {
  codigo: string;
  nif: string;
  nombre: string;
  direccion?: string;
  poblacion?: string;
  codigoPostal?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  cuentaContable?: string;
  tipo?: 'C' | 'P';  // C=Cliente, P=Proveedor
}

export function exportarTercerosSage(
  terceros: ITerceroSageExport[],
  opciones?: Partial<ISageExportOptions>
): string {
  const options: Required<ISageExportOptions> = {
    ...defaultOptions,
    ...opciones,
  };

  const lineas: string[] = [];

  // Cabecera
  if (options.incluirCabecera) {
    lineas.push([
      'Codigo', 'NIF', 'Nombre', 'Direccion', 'CP', 'Poblacion',
      'Provincia', 'Telefono', 'Email', 'CuentaContable', 'Tipo'
    ].join(options.separador));
  }

  // Datos
  for (const tercero of terceros) {
    const campos = [
      tercero.codigo,
      limpiarNIFSage(tercero.nif),
      limpiarTextoSage(tercero.nombre, 60),
      limpiarTextoSage(tercero.direccion, 60),
      tercero.codigoPostal || '',
      limpiarTextoSage(tercero.poblacion, 40),
      limpiarTextoSage(tercero.provincia, 30),
      tercero.telefono || '',
      tercero.email || '',
      tercero.cuentaContable || '',
      tercero.tipo || 'C',
    ];
    lineas.push(campos.join(options.separador));
  }

  return lineas.join('\r\n');
}

/**
 * Genera nombre de archivo según convenciones Sage
 */
export function generarNombreArchivoSage(
  tipo: 'asientos' | 'cuentas' | 'terceros',
  formato: 'sage50' | 'sagedespachos' | 'sage200',
  codigoEmpresa: string,
  ejercicio: number
): string {
  const extensiones: Record<string, string> = {
    sage50: 'txt',
    sagedespachos: 'dat',
    sage200: 'csv',
  };

  const prefijos: Record<string, Record<string, string>> = {
    sage50: { asientos: 'DIARIO', cuentas: 'SUBCTA', terceros: 'CLIEN' },
    sagedespachos: { asientos: 'ASI', cuentas: 'CTA', terceros: 'TER' },
    sage200: { asientos: 'Asientos', cuentas: 'PlanCuentas', terceros: 'Terceros' },
  };

  const ext = extensiones[formato];
  const prefijo = prefijos[formato][tipo];

  return `${prefijo}_${codigoEmpresa}_${ejercicio}.${ext}`;
}

/**
 * Obtiene información del formato Sage
 */
export function getInfoFormatoSage(formato: 'sage50' | 'sagedespachos' | 'sage200'): {
  nombre: string;
  descripcion: string;
  extension: string;
  separadorDefault: string;
  usaCabecera: boolean;
} {
  const info: Record<string, any> = {
    sage50: {
      nombre: 'Sage 50 / ContaPlus',
      descripcion: 'Formato para importación en Sage 50 (antiguo ContaPlus)',
      extension: 'txt',
      separadorDefault: '\t',
      usaCabecera: false,
    },
    sagedespachos: {
      nombre: 'Sage Despachos',
      descripcion: 'Formato para importación en Sage Despachos',
      extension: 'dat',
      separadorDefault: ';',
      usaCabecera: false,
    },
    sage200: {
      nombre: 'Sage 200',
      descripcion: 'Formato para importación en Sage 200',
      extension: 'csv',
      separadorDefault: ';',
      usaCabecera: true,
    },
  };

  return info[formato];
}

export default {
  exportarAsientosSage,
  exportarPlanCuentasSage,
  exportarTercerosSage,
  generarNombreArchivoSage,
  getInfoFormatoSage,
};
