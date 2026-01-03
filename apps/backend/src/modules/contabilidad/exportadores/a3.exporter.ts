/**
 * Exportador de Contabilidad a formato A3
 * Formato estándar de intercambio con software A3 Asesor/A3Con
 *
 * A3 utiliza archivos de texto plano con campos de posición fija
 * Formato principal: XDiario (para asientos contables)
 */

import { IAsientoContable, ILineaAsiento } from '../models/AsientoContable';

// Opciones de exportación A3
export interface IA3ExportOptions {
  codigoEmpresa?: string;       // Código empresa en A3 (max 5 chars)
  ejercicio?: number;           // Ejercicio fiscal
  incluirCabecera?: boolean;    // Incluir registro de cabecera
  formatoLineas?: 'xdiario' | 'xmayor';  // Formato de exportación
}

// Configuración por defecto
const defaultOptions: Required<IA3ExportOptions> = {
  codigoEmpresa: '00001',
  ejercicio: new Date().getFullYear(),
  incluirCabecera: true,
  formatoLineas: 'xdiario',
};

/**
 * Formatea un texto a longitud fija (rellena con espacios o trunca)
 */
function padText(texto: string | null | undefined, longitud: number, alineacion: 'left' | 'right' = 'left'): string {
  const str = (texto || '').substring(0, longitud);
  if (alineacion === 'right') {
    return str.padStart(longitud, ' ');
  }
  return str.padEnd(longitud, ' ');
}

/**
 * Formatea un número a longitud fija (sin decimales, alineado a la derecha)
 */
function padNumber(numero: number, longitud: number): string {
  // Multiplicar por 100 para incluir 2 decimales implícitos
  const entero = Math.round(Math.abs(numero) * 100);
  return entero.toString().padStart(longitud, '0');
}

/**
 * Formatea fecha en formato A3 (AAAAMMDD)
 */
function formatearFechaA3(fecha: Date): string {
  const d = new Date(fecha);
  const dia = d.getDate().toString().padStart(2, '0');
  const mes = (d.getMonth() + 1).toString().padStart(2, '0');
  const anio = d.getFullYear().toString();
  return `${anio}${mes}${dia}`;
}

/**
 * Indica el signo para A3 (D=Debe, H=Haber)
 */
function getSignoA3(debe: number, haber: number): string {
  if (debe > 0) return 'D';
  if (haber > 0) return 'H';
  return 'D';
}

/**
 * Limpia NIF para formato A3 (sin guiones ni espacios)
 */
function limpiarNIF(nif: string | null | undefined): string {
  if (!nif) return '';
  return nif.replace(/[-\s.]/g, '').toUpperCase();
}

/**
 * Genera registro de cabecera XDiario
 * Formato: Tipo(1) + CodEmpresa(5) + Ejercicio(4) + Relleno
 */
function generarCabeceraXDiario(codigoEmpresa: string, ejercicio: number): string {
  const campos = [
    '0',                              // Tipo registro: 0 = Cabecera
    padText(codigoEmpresa, 5),        // Código empresa
    ejercicio.toString(),             // Ejercicio
    padText('', 70),                  // Relleno
  ];
  return campos.join('');
}

/**
 * Genera registro de línea XDiario
 *
 * Estructura del registro XDiario (longitud total: 150 caracteres):
 * Pos 1:     Tipo registro (1) = "1"
 * Pos 2-6:   Código empresa (5)
 * Pos 7-10:  Ejercicio (4)
 * Pos 11-17: Número asiento (7)
 * Pos 18-25: Fecha asiento AAAAMMDD (8)
 * Pos 26-37: Código cuenta (12)
 * Pos 38-52: Importe en céntimos (15)
 * Pos 53:    Signo D/H (1)
 * Pos 54-93: Concepto (40)
 * Pos 94-108: Documento (15)
 * Pos 109-117: NIF tercero (9)
 * Pos 118-150: Nombre tercero (33)
 */
function generarLineaXDiario(
  asiento: IAsientoContable,
  linea: ILineaAsiento,
  codigoEmpresa: string,
  ejercicio: number
): string {
  const importe = linea.debe > 0 ? linea.debe : linea.haber;
  const signo = getSignoA3(linea.debe, linea.haber);
  const concepto = linea.concepto || asiento.concepto;

  const campos = [
    '1',                                          // Tipo registro: 1 = Datos
    padText(codigoEmpresa, 5),                    // Código empresa
    ejercicio.toString().padStart(4, '0'),        // Ejercicio
    asiento.numero.toString().padStart(7, '0'),   // Número asiento
    formatearFechaA3(asiento.fecha),              // Fecha
    padText(linea.cuentaCodigo, 12),              // Cuenta
    padNumber(importe, 15),                       // Importe en céntimos
    signo,                                        // Signo D/H
    padText(concepto, 40),                        // Concepto
    padText(linea.documentoRef, 15),              // Documento
    padText(limpiarNIF(linea.terceroNif), 9),     // NIF
    padText(linea.terceroNombre, 33),             // Nombre tercero
  ];

  return campos.join('');
}

/**
 * Genera registro de línea formato Mayor
 * Similar a XDiario pero con estructura diferente para el libro mayor
 */
function generarLineaXMayor(
  asiento: IAsientoContable,
  linea: ILineaAsiento,
  codigoEmpresa: string,
  ejercicio: number
): string {
  const importe = linea.debe > 0 ? linea.debe : linea.haber;
  const signo = getSignoA3(linea.debe, linea.haber);

  const campos = [
    '1',                                          // Tipo registro
    padText(codigoEmpresa, 5),                    // Código empresa
    ejercicio.toString().padStart(4, '0'),        // Ejercicio
    padText(linea.cuentaCodigo, 12),              // Cuenta
    formatearFechaA3(asiento.fecha),              // Fecha
    asiento.numero.toString().padStart(7, '0'),   // Número asiento
    padNumber(importe, 15),                       // Importe
    signo,                                        // Signo
    padText(linea.concepto || asiento.concepto, 40), // Concepto
    padText(linea.documentoRef, 15),              // Documento
    padText(limpiarNIF(linea.terceroNif), 9),     // NIF
  ];

  return campos.join('');
}

/**
 * Exporta asientos contables a formato XDiario de A3
 */
export function exportarAsientosA3(
  asientos: IAsientoContable[],
  opciones?: Partial<IA3ExportOptions>
): string {
  const options: Required<IA3ExportOptions> = {
    ...defaultOptions,
    ...opciones,
  };

  const lineas: string[] = [];

  // Agregar cabecera si está habilitada
  if (options.incluirCabecera) {
    lineas.push(generarCabeceraXDiario(options.codigoEmpresa, options.ejercicio));
  }

  // Generar líneas de datos según el formato
  const generarLinea = options.formatoLineas === 'xmayor' ? generarLineaXMayor : generarLineaXDiario;

  for (const asiento of asientos) {
    for (const linea of asiento.lineas) {
      lineas.push(generarLinea(asiento, linea, options.codigoEmpresa, options.ejercicio));
    }
  }

  // A3 espera líneas terminadas en CRLF
  return lineas.join('\r\n');
}

/**
 * Exporta plan de cuentas a formato A3
 *
 * Estructura del registro Plan Cuentas A3:
 * Pos 1:     Tipo registro (1)
 * Pos 2-6:   Código empresa (5)
 * Pos 7-10:  Ejercicio (4)
 * Pos 11-22: Código cuenta (12)
 * Pos 23-72: Descripción (50)
 * Pos 73:    Tipo cuenta (1) A=Activo, P=Pasivo, G=Gasto, I=Ingreso
 * Pos 74:    Es título S/N (1)
 */
export interface ICuentaA3Export {
  codigo: string;
  nombre: string;
  tipo?: 'A' | 'P' | 'G' | 'I' | 'N';  // A=Activo, P=Pasivo, G=Gasto, I=Ingreso, N=Neutro
  esTitulo?: boolean;
}

export function exportarPlanCuentasA3(
  cuentas: ICuentaA3Export[],
  opciones?: Partial<IA3ExportOptions>
): string {
  const options: Required<IA3ExportOptions> = {
    ...defaultOptions,
    ...opciones,
  };

  const lineas: string[] = [];

  // Cabecera
  if (options.incluirCabecera) {
    const cabecera = [
      '0',
      padText(options.codigoEmpresa, 5),
      options.ejercicio.toString(),
      padText('PLANCUENTAS', 20),
      padText('', 50),
    ];
    lineas.push(cabecera.join(''));
  }

  // Datos
  for (const cuenta of cuentas) {
    // Determinar tipo de cuenta basado en el código
    let tipoCuenta = cuenta.tipo || 'N';
    if (!cuenta.tipo && cuenta.codigo) {
      const primerDigito = cuenta.codigo.charAt(0);
      switch (primerDigito) {
        case '1': case '2': tipoCuenta = 'A'; break;  // Activo
        case '3': case '4': case '5': tipoCuenta = 'P'; break;  // Pasivo
        case '6': tipoCuenta = 'G'; break;  // Gastos
        case '7': tipoCuenta = 'I'; break;  // Ingresos
        default: tipoCuenta = 'N'; break;
      }
    }

    const campos = [
      '1',                                // Tipo registro
      padText(options.codigoEmpresa, 5),  // Código empresa
      options.ejercicio.toString().padStart(4, '0'),  // Ejercicio
      padText(cuenta.codigo, 12),         // Código cuenta
      padText(cuenta.nombre, 50),         // Descripción
      tipoCuenta,                         // Tipo cuenta
      cuenta.esTitulo ? 'S' : 'N',        // Es título
    ];
    lineas.push(campos.join(''));
  }

  return lineas.join('\r\n');
}

/**
 * Exporta registro de terceros (clientes/proveedores) a formato A3
 */
export interface ITerceroA3Export {
  nif: string;
  nombre: string;
  direccion?: string;
  poblacion?: string;
  codigoPostal?: string;
  provincia?: string;
  telefono?: string;
  cuentaContable?: string;
  tipo?: 'C' | 'P';  // C=Cliente, P=Proveedor
}

export function exportarTercerosA3(
  terceros: ITerceroA3Export[],
  opciones?: Partial<IA3ExportOptions>
): string {
  const options: Required<IA3ExportOptions> = {
    ...defaultOptions,
    ...opciones,
  };

  const lineas: string[] = [];

  // Cabecera
  if (options.incluirCabecera) {
    lineas.push(['0', padText(options.codigoEmpresa, 5), options.ejercicio.toString(), 'TERCEROS'].join(''));
  }

  for (const tercero of terceros) {
    const campos = [
      '1',                                        // Tipo registro
      padText(options.codigoEmpresa, 5),          // Código empresa
      padText(limpiarNIF(tercero.nif), 15),       // NIF
      padText(tercero.nombre, 40),                // Nombre
      padText(tercero.direccion, 40),             // Dirección
      padText(tercero.codigoPostal, 5),           // CP
      padText(tercero.poblacion, 25),             // Población
      padText(tercero.provincia, 20),             // Provincia
      padText(tercero.telefono, 15),              // Teléfono
      padText(tercero.cuentaContable, 12),        // Cuenta contable
      tercero.tipo || 'C',                        // Tipo
    ];
    lineas.push(campos.join(''));
  }

  return lineas.join('\r\n');
}

/**
 * Genera nombre de archivo según convenciones A3
 */
export function generarNombreArchivoA3(
  tipo: 'diario' | 'mayor' | 'cuentas' | 'terceros',
  codigoEmpresa: string,
  ejercicio: number
): string {
  const prefijos: Record<string, string> = {
    diario: 'XD',
    mayor: 'XM',
    cuentas: 'PC',
    terceros: 'TE',
  };
  const prefijo = prefijos[tipo] || 'XX';
  return `${prefijo}${codigoEmpresa.padStart(5, '0')}${ejercicio}.txt`;
}

export default {
  exportarAsientosA3,
  exportarPlanCuentasA3,
  exportarTercerosA3,
  generarNombreArchivoA3,
};
