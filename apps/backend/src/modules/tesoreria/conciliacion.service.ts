import mongoose, { Model, Types } from 'mongoose';
import { IDatabaseConfig } from '../../types/database.types';
import Empresa from '../empresa/Empresa';
import ImportacionExtracto, { IImportacionExtracto, EstadoImportacion } from './models/ImportacionExtracto';
import MovimientoExtracto, {
  IMovimientoExtracto,
  EstadoExtracto,
  OrigenExtracto,
  TipoMovimientoExtracto,
} from './models/MovimientoExtracto';
import {
  getMovimientoBancarioModel,
  getCuentaBancariaModel,
  getMovimientoExtractoModel,
  getImportacionExtractoModel,
} from '../../utils/dynamic-models.helper';
import { IMovimientoBancario, TipoMovimiento, EstadoMovimiento } from './models/MovimientoBancario';
import crypto from 'crypto';

// ============================================
// INTERFACES
// ============================================

// Resultado del parseo de un archivo
export interface ParsedExtracto {
  movimientos: ParsedMovimiento[];
  fechaInicio: Date;
  fechaFin: Date;
  saldoInicial?: number;
  saldoFinal?: number;
  formato: OrigenExtracto;
}

// Movimiento parseado del archivo
export interface ParsedMovimiento {
  fecha: Date;
  fechaValor?: Date;
  concepto: string;
  conceptoOriginal: string;
  importe: number;
  tipo: TipoMovimientoExtracto;
  saldo?: number;
  referenciaBanco?: string;
  codigoOperacion?: string;
}

// Configuracion para parsear CSV
export interface CSVConfig {
  separador: string;
  formatoFecha: string;
  columnaFecha: number;
  columnaConcepto: number;
  columnaImporte: number;
  columnaSaldo?: number;
  columnaReferencia?: number;
  tieneEncabezado: boolean;
  signoNegativoEntrada?: boolean; // Si los ingresos son negativos
}

// Resultado de matching
export interface MatchResult {
  movimientoExtractoId: string;
  movimientoBancarioId: string;
  confianza: number;
  motivo: string;
  criterios: string[];
}

// Estadisticas de importacion
export interface ImportacionStats {
  totalMovimientos: number;
  pendientes: number;
  sugeridos: number;
  conciliados: number;
  descartados: number;
  tasaConciliacion: number;
}

// ============================================
// SERVICIO DE CONCILIACION
// ============================================

class ConciliacionService {
  /**
   * Obtiene la configuracion de BD de una empresa
   */
  private async getDbConfig(empresaId: string): Promise<IDatabaseConfig> {
    const empresa = await Empresa.findById(empresaId).lean();
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }
    if (!empresa.databaseConfig) {
      throw new Error('Configuracion de base de datos no encontrada para esta empresa');
    }
    return empresa.databaseConfig;
  }

  /**
   * Parsear archivo CSV de extracto bancario
   */
  parseCSV(contenido: string, config: CSVConfig): ParsedExtracto {
    const lineas = contenido.split('\n').filter((l) => l.trim());
    const movimientos: ParsedMovimiento[] = [];

    let startIndex = config.tieneEncabezado ? 1 : 0;
    let fechaInicio: Date | null = null;
    let fechaFin: Date | null = null;

    for (let i = startIndex; i < lineas.length; i++) {
      const columnas = this.splitCSVLine(lineas[i], config.separador);

      if (columnas.length < Math.max(config.columnaFecha, config.columnaConcepto, config.columnaImporte)) {
        continue;
      }

      try {
        const fecha = this.parseDate(columnas[config.columnaFecha].trim(), config.formatoFecha);
        const conceptoOriginal = columnas[config.columnaConcepto].trim();
        const importeStr = columnas[config.columnaImporte].trim()
          .replace(/[^\d,.-]/g, '')
          .replace(',', '.');
        let importe = parseFloat(importeStr);

        if (isNaN(importe) || importe === 0) continue;

        // Determinar tipo segun signo
        let tipo: TipoMovimientoExtracto;
        if (config.signoNegativoEntrada) {
          tipo = importe < 0 ? TipoMovimientoExtracto.ABONO : TipoMovimientoExtracto.CARGO;
        } else {
          tipo = importe > 0 ? TipoMovimientoExtracto.ABONO : TipoMovimientoExtracto.CARGO;
        }
        importe = Math.abs(importe);

        const mov: ParsedMovimiento = {
          fecha,
          concepto: this.limpiarConcepto(conceptoOriginal),
          conceptoOriginal,
          importe,
          tipo,
        };

        // Saldo si disponible
        if (config.columnaSaldo !== undefined && columnas[config.columnaSaldo]) {
          const saldoStr = columnas[config.columnaSaldo].trim()
            .replace(/[^\d,.-]/g, '')
            .replace(',', '.');
          mov.saldo = parseFloat(saldoStr);
        }

        // Referencia si disponible
        if (config.columnaReferencia !== undefined && columnas[config.columnaReferencia]) {
          mov.referenciaBanco = columnas[config.columnaReferencia].trim();
        }

        movimientos.push(mov);

        // Actualizar rango de fechas
        if (!fechaInicio || fecha < fechaInicio) fechaInicio = fecha;
        if (!fechaFin || fecha > fechaFin) fechaFin = fecha;
      } catch (e) {
        console.warn(`Error parseando linea ${i + 1}:`, e);
      }
    }

    return {
      movimientos,
      fechaInicio: fechaInicio || new Date(),
      fechaFin: fechaFin || new Date(),
      saldoInicial: movimientos.length > 0 ? movimientos[0].saldo : undefined,
      saldoFinal: movimientos.length > 0 ? movimientos[movimientos.length - 1].saldo : undefined,
      formato: OrigenExtracto.CSV,
    };
  }

  /**
   * Parsear archivo Norma 43 (formato bancario espanol)
   */
  parseNorma43(contenido: string): ParsedExtracto {
    const lineas = contenido.split('\n').filter((l) => l.trim());
    const movimientos: ParsedMovimiento[] = [];
    let saldoInicial: number | undefined;
    let saldoFinal: number | undefined;
    let fechaInicio: Date | null = null;
    let fechaFin: Date | null = null;

    let conceptoActual = '';

    for (const linea of lineas) {
      const tipo = linea.substring(0, 2);

      switch (tipo) {
        case '11': {
          // Registro de cabecera de cuenta
          const saldoStr = linea.substring(33, 47);
          const signo = linea.substring(32, 33);
          saldoInicial = parseFloat(saldoStr) / 100;
          if (signo === '1') saldoInicial = -saldoInicial;
          break;
        }

        case '22': {
          // Registro de movimiento principal
          const fechaStr = linea.substring(10, 16); // AAMMDD
          const fechaValorStr = linea.substring(16, 22);
          const importeStr = linea.substring(28, 42);
          const signo = linea.substring(27, 28);
          const codigoOp = linea.substring(22, 27);

          const año = 2000 + parseInt(fechaStr.substring(0, 2));
          const mes = parseInt(fechaStr.substring(2, 4)) - 1;
          const dia = parseInt(fechaStr.substring(4, 6));
          const fecha = new Date(año, mes, dia);

          const añoValor = 2000 + parseInt(fechaValorStr.substring(0, 2));
          const mesValor = parseInt(fechaValorStr.substring(2, 4)) - 1;
          const diaValor = parseInt(fechaValorStr.substring(4, 6));
          const fechaValor = new Date(añoValor, mesValor, diaValor);

          let importe = parseFloat(importeStr) / 100;
          const tipoMov = signo === '1' ? TipoMovimientoExtracto.CARGO : TipoMovimientoExtracto.ABONO;
          importe = Math.abs(importe);

          conceptoActual = linea.substring(52, 92).trim();

          movimientos.push({
            fecha,
            fechaValor,
            concepto: this.limpiarConcepto(conceptoActual),
            conceptoOriginal: conceptoActual,
            importe,
            tipo: tipoMov,
            codigoOperacion: codigoOp,
          });

          if (!fechaInicio || fecha < fechaInicio) fechaInicio = fecha;
          if (!fechaFin || fecha > fechaFin) fechaFin = fecha;
          break;
        }

        case '23': {
          // Registro complementario de concepto
          if (movimientos.length > 0) {
            const textoAdicional = linea.substring(4, 42).trim();
            const ultimoMov = movimientos[movimientos.length - 1];
            ultimoMov.conceptoOriginal += ' ' + textoAdicional;
            ultimoMov.concepto = this.limpiarConcepto(ultimoMov.conceptoOriginal);
          }
          break;
        }

        case '33': {
          // Registro final de cuenta
          const saldoFinalStr = linea.substring(59, 73);
          const signoFinal = linea.substring(58, 59);
          saldoFinal = parseFloat(saldoFinalStr) / 100;
          if (signoFinal === '1') saldoFinal = -saldoFinal;
          break;
        }
      }
    }

    return {
      movimientos,
      fechaInicio: fechaInicio || new Date(),
      fechaFin: fechaFin || new Date(),
      saldoInicial,
      saldoFinal,
      formato: OrigenExtracto.NORMA43,
    };
  }

  /**
   * Detectar formato de archivo automaticamente
   */
  detectarFormato(contenido: string): OrigenExtracto {
    const primeraLinea = contenido.split('\n')[0] || '';

    // Norma 43: empieza con codigo de registro
    if (primeraLinea.startsWith('11') || primeraLinea.startsWith('00')) {
      return OrigenExtracto.NORMA43;
    }

    // OFX/QFX
    if (contenido.includes('OFXHEADER') || contenido.includes('<OFX>')) {
      return OrigenExtracto.OFX;
    }

    // Por defecto CSV
    return OrigenExtracto.CSV;
  }

  /**
   * Importar extracto bancario
   */
  async importarExtracto(
    empresaId: string,
    cuentaBancariaId: string,
    nombreArchivo: string,
    contenido: string,
    usuarioId: string,
    configCSV?: CSVConfig
  ): Promise<IImportacionExtracto> {
    const dbConfig = await this.getDbConfig(empresaId);
    const ImportacionExtractoModel = await getImportacionExtractoModel(empresaId, dbConfig);
    const MovimientoExtractoModel = await getMovimientoExtractoModel(empresaId, dbConfig);
    const CuentaBancaria = await getCuentaBancariaModel(empresaId, dbConfig);

    // Verificar cuenta bancaria
    const cuenta = await CuentaBancaria.findById(cuentaBancariaId).lean();
    if (!cuenta) {
      throw new Error('Cuenta bancaria no encontrada');
    }

    // Calcular hash del archivo para detectar duplicados
    const hashArchivo = crypto.createHash('md5').update(contenido).digest('hex');

    // Verificar si ya se importo este archivo
    const importacionExistente = await ImportacionExtractoModel.findOne({
      hashArchivo,
      cuentaBancariaId: new Types.ObjectId(cuentaBancariaId),
      estado: { $ne: EstadoImportacion.CANCELADA },
    }).lean();

    if (importacionExistente) {
      throw new Error('Este archivo ya fue importado anteriormente');
    }

    // Detectar formato y parsear
    const formato = this.detectarFormato(contenido);
    let extracto: ParsedExtracto;

    switch (formato) {
      case OrigenExtracto.NORMA43:
        extracto = this.parseNorma43(contenido);
        break;
      case OrigenExtracto.CSV:
        if (!configCSV) {
          // Configuracion por defecto para CSV
          configCSV = {
            separador: ';',
            formatoFecha: 'DD/MM/YYYY',
            columnaFecha: 0,
            columnaConcepto: 1,
            columnaImporte: 2,
            columnaSaldo: 3,
            tieneEncabezado: true,
          };
        }
        extracto = this.parseCSV(contenido, configCSV);
        break;
      default:
        throw new Error(`Formato ${formato} no soportado todavia`);
    }

    if (extracto.movimientos.length === 0) {
      throw new Error('No se encontraron movimientos en el archivo');
    }

    // Crear sesion de importacion
    const importacion = new ImportacionExtractoModel({
      _id: new Types.ObjectId(),
      nombreArchivo,
      formatoOrigen: formato,
      tamanoArchivo: Buffer.byteLength(contenido, 'utf8'),
      hashArchivo,
      cuentaBancariaId: new Types.ObjectId(cuentaBancariaId),
      cuentaBancariaNombre: cuenta.alias || `${cuenta.banco} - ...${cuenta.iban?.slice(-4)}`,
      fechaInicio: extracto.fechaInicio,
      fechaFin: extracto.fechaFin,
      saldoInicial: extracto.saldoInicial,
      saldoFinal: extracto.saldoFinal,
      totalMovimientos: extracto.movimientos.length,
      movimientosPendientes: extracto.movimientos.length,
      estado: EstadoImportacion.EN_PROCESO,
      configParseo: formato === OrigenExtracto.CSV ? configCSV : undefined,
      creadoPor: new Types.ObjectId(usuarioId),
      fechaCreacion: new Date(),
      activo: true,
    });

    await importacion.save();

    // Crear movimientos del extracto
    const movimientosExtracto = extracto.movimientos.map((mov, index) => ({
      _id: new Types.ObjectId(),
      importacionId: importacion._id,
      numeroLinea: index + 1,
      tipo: mov.tipo,
      fecha: mov.fecha,
      fechaValor: mov.fechaValor,
      concepto: mov.concepto,
      conceptoOriginal: mov.conceptoOriginal,
      importe: mov.importe,
      saldo: mov.saldo,
      referenciaBanco: mov.referenciaBanco,
      codigoOperacion: mov.codigoOperacion,
      cuentaBancariaId: new Types.ObjectId(cuentaBancariaId),
      cuentaBancariaNombre: importacion.cuentaBancariaNombre,
      estado: EstadoExtracto.PENDIENTE,
      creadoPor: new Types.ObjectId(usuarioId),
      fechaCreacion: new Date(),
      activo: true,
    }));

    await MovimientoExtractoModel.insertMany(movimientosExtracto);

    // Ejecutar matching automatico
    await this.ejecutarMatchingAutomatico(empresaId, importacion._id.toString());

    // Actualizar contadores
    const contadores = await this.getContadoresImportacion(empresaId, importacion._id.toString());
    await ImportacionExtractoModel.findByIdAndUpdate(importacion._id, {
      movimientosPendientes: contadores.pendientes,
      movimientosSugeridos: contadores.sugeridos,
      movimientosConciliados: contadores.conciliados,
    });

    return importacion;
  }

  /**
   * Ejecutar matching automatico para una importacion
   */
  async ejecutarMatchingAutomatico(empresaId: string, importacionId: string): Promise<MatchResult[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoExtractoModel = await getMovimientoExtractoModel(empresaId, dbConfig);
    const MovimientoBancario = await getMovimientoBancarioModel(empresaId, dbConfig);
    const ImportacionExtractoModel = await getImportacionExtractoModel(empresaId, dbConfig);

    const importacion = await ImportacionExtractoModel.findById(importacionId).lean();
    if (!importacion) {
      throw new Error('Importacion no encontrada');
    }

    // Obtener movimientos pendientes del extracto
    const movimientosExtracto = await MovimientoExtractoModel.find({
      importacionId: new Types.ObjectId(importacionId),
      estado: EstadoExtracto.PENDIENTE,
      activo: true,
    }).lean();

    // Obtener movimientos bancarios no conciliados del mismo periodo
    const margenDias = 5;
    const fechaInicio = new Date(importacion.fechaInicio);
    fechaInicio.setDate(fechaInicio.getDate() - margenDias);
    const fechaFin = new Date(importacion.fechaFin);
    fechaFin.setDate(fechaFin.getDate() + margenDias);

    const movimientosBancarios = await MovimientoBancario.find({
      cuentaBancariaId: importacion.cuentaBancariaId,
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      conciliado: false,
      estado: { $ne: EstadoMovimiento.ANULADO },
      activo: true,
    }).lean();

    const resultados: MatchResult[] = [];
    const movimientosBancariosUsados = new Set<string>();

    // Buscar matches
    for (const movExt of movimientosExtracto) {
      let mejorMatch: MatchResult | null = null;
      let mejorConfianza = 0;

      for (const movBanc of movimientosBancarios) {
        // Saltar si ya fue usado en otro match
        if (movimientosBancariosUsados.has(movBanc._id.toString())) continue;

        const resultado = this.calcularMatch(movExt as IMovimientoExtracto, movBanc as IMovimientoBancario);

        if (resultado.confianza > mejorConfianza && resultado.confianza >= 60) {
          mejorConfianza = resultado.confianza;
          mejorMatch = {
            movimientoExtractoId: movExt._id.toString(),
            movimientoBancarioId: movBanc._id.toString(),
            ...resultado,
          };
        }
      }

      if (mejorMatch && mejorConfianza >= 60) {
        resultados.push(mejorMatch);
        movimientosBancariosUsados.add(mejorMatch.movimientoBancarioId);

        // Actualizar movimiento del extracto como sugerido
        await MovimientoExtractoModel.findByIdAndUpdate(movExt._id, {
          estado: EstadoExtracto.SUGERIDO,
          movimientoBancarioId: new Types.ObjectId(mejorMatch.movimientoBancarioId),
          confianzaMatch: mejorMatch.confianza,
          motivoMatch: mejorMatch.motivo,
          criteriosMatch: mejorMatch.criterios,
        });
      }
    }

    return resultados;
  }

  /**
   * Calcular match entre movimiento del extracto y movimiento bancario
   */
  private calcularMatch(
    movExt: IMovimientoExtracto,
    movBanc: IMovimientoBancario
  ): { confianza: number; motivo: string; criterios: string[] } {
    let confianza = 0;
    const criterios: string[] = [];

    // 1. Verificar tipo (cargo = salida, abono = entrada)
    const tipoCoincide =
      (movExt.tipo === TipoMovimientoExtracto.ABONO && movBanc.tipo === TipoMovimiento.ENTRADA) ||
      (movExt.tipo === TipoMovimientoExtracto.CARGO && movBanc.tipo === TipoMovimiento.SALIDA);

    if (!tipoCoincide) {
      return { confianza: 0, motivo: 'Tipo no coincide', criterios: [] };
    }

    // 2. Importe exacto (+40 puntos)
    if (Math.abs(movExt.importe - movBanc.importe) < 0.01) {
      confianza += 40;
      criterios.push('Importe exacto');
    } else if (Math.abs(movExt.importe - movBanc.importe) < 1) {
      confianza += 20;
      criterios.push('Importe similar (diferencia < 1 EUR)');
    } else {
      // Importes muy diferentes, no es match
      return { confianza: 0, motivo: 'Importe no coincide', criterios: [] };
    }

    // 3. Fecha exacta (+30) o cercana (+15)
    const diffDias = Math.abs(
      (movExt.fecha.getTime() - new Date(movBanc.fecha).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDias === 0) {
      confianza += 30;
      criterios.push('Fecha exacta');
    } else if (diffDias <= 3) {
      confianza += 15;
      criterios.push(`Fecha cercana (${diffDias} dias)`);
    } else if (diffDias <= 7) {
      confianza += 5;
      criterios.push(`Fecha proxima (${diffDias} dias)`);
    }

    // 4. Referencia bancaria coincide (+20)
    if (movExt.referenciaBanco && movBanc.referenciaBancaria) {
      if (movExt.referenciaBanco === movBanc.referenciaBancaria) {
        confianza += 20;
        criterios.push('Referencia bancaria exacta');
      } else if (
        movExt.referenciaBanco.includes(movBanc.referenciaBancaria) ||
        movBanc.referenciaBancaria.includes(movExt.referenciaBanco)
      ) {
        confianza += 10;
        criterios.push('Referencia bancaria parcial');
      }
    }

    // 5. Concepto contiene numero de documento (+15)
    if (movBanc.documentoOrigenNumero) {
      const conceptoLower = movExt.concepto.toLowerCase();
      const docNumero = movBanc.documentoOrigenNumero.toLowerCase();
      if (conceptoLower.includes(docNumero)) {
        confianza += 15;
        criterios.push('Concepto contiene nro documento');
      }
    }

    // 6. Concepto contiene nombre del tercero (+10)
    if (movBanc.terceroNombre) {
      const conceptoLower = movExt.concepto.toLowerCase();
      const nombreLower = movBanc.terceroNombre.toLowerCase().split(' ')[0]; // Primera palabra
      if (nombreLower.length > 3 && conceptoLower.includes(nombreLower)) {
        confianza += 10;
        criterios.push('Concepto contiene nombre tercero');
      }
    }

    // Limitar a 100
    confianza = Math.min(confianza, 100);

    const motivo =
      confianza >= 90
        ? 'Match muy probable'
        : confianza >= 75
        ? 'Match probable'
        : confianza >= 60
        ? 'Match posible'
        : 'Match improbable';

    return { confianza, motivo, criterios };
  }

  /**
   * Aprobar match (conciliar)
   */
  async aprobarMatch(
    empresaId: string,
    movimientoExtractoId: string,
    usuarioId: string
  ): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoExtractoModel = await getMovimientoExtractoModel(empresaId, dbConfig);
    const MovimientoBancario = await getMovimientoBancarioModel(empresaId, dbConfig);

    const movExt = await MovimientoExtractoModel.findById(movimientoExtractoId);
    if (!movExt) {
      throw new Error('Movimiento de extracto no encontrado');
    }

    if (!movExt.movimientoBancarioId) {
      throw new Error('Este movimiento no tiene un match sugerido');
    }

    // Actualizar movimiento del extracto
    movExt.estado = EstadoExtracto.CONCILIADO;
    movExt.conciliadoPor = new Types.ObjectId(usuarioId);
    movExt.fechaConciliacion = new Date();
    await movExt.save();

    // Actualizar movimiento bancario
    await MovimientoBancario.findByIdAndUpdate(movExt.movimientoBancarioId, {
      conciliado: true,
      estado: EstadoMovimiento.CONCILIADO,
      fechaConciliacion: new Date(),
      movimientoExtractoId: movExt._id,
    });

    // Actualizar contadores de importacion
    await this.actualizarContadoresImportacion(empresaId, movExt.importacionId.toString());
  }

  /**
   * Rechazar match
   */
  async rechazarMatch(empresaId: string, movimientoExtractoId: string): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoExtractoModel = await getMovimientoExtractoModel(empresaId, dbConfig);

    const movExt = await MovimientoExtractoModel.findById(movimientoExtractoId);
    if (!movExt) {
      throw new Error('Movimiento de extracto no encontrado');
    }

    // Volver a pendiente y limpiar match
    movExt.estado = EstadoExtracto.PENDIENTE;
    movExt.movimientoBancarioId = undefined;
    movExt.confianzaMatch = undefined;
    movExt.motivoMatch = undefined;
    movExt.criteriosMatch = undefined;
    await movExt.save();

    await this.actualizarContadoresImportacion(empresaId, movExt.importacionId.toString());
  }

  /**
   * Conciliar manualmente (seleccionar match diferente)
   */
  async conciliarManual(
    empresaId: string,
    movimientoExtractoId: string,
    movimientoBancarioId: string,
    usuarioId: string
  ): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoExtractoModel = await getMovimientoExtractoModel(empresaId, dbConfig);
    const MovimientoBancario = await getMovimientoBancarioModel(empresaId, dbConfig);

    const movExt = await MovimientoExtractoModel.findById(movimientoExtractoId);
    if (!movExt) {
      throw new Error('Movimiento de extracto no encontrado');
    }

    const movBanc = await MovimientoBancario.findById(movimientoBancarioId);
    if (!movBanc) {
      throw new Error('Movimiento bancario no encontrado');
    }

    if (movBanc.conciliado) {
      throw new Error('El movimiento bancario ya esta conciliado');
    }

    // Actualizar movimiento del extracto
    movExt.estado = EstadoExtracto.CONCILIADO;
    movExt.movimientoBancarioId = new Types.ObjectId(movimientoBancarioId);
    movExt.confianzaMatch = 100;
    movExt.motivoMatch = 'Conciliacion manual';
    movExt.criteriosMatch = ['Seleccionado manualmente'];
    movExt.conciliadoPor = new Types.ObjectId(usuarioId);
    movExt.fechaConciliacion = new Date();
    await movExt.save();

    // Actualizar movimiento bancario
    movBanc.conciliado = true;
    movBanc.estado = EstadoMovimiento.CONCILIADO;
    movBanc.fechaConciliacion = new Date();
    movBanc.movimientoExtractoId = movExt._id;
    await movBanc.save();

    await this.actualizarContadoresImportacion(empresaId, movExt.importacionId.toString());
  }

  /**
   * Descartar movimiento del extracto
   */
  async descartarMovimiento(
    empresaId: string,
    movimientoExtractoId: string,
    motivo: string,
    usuarioId: string
  ): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoExtractoModel = await getMovimientoExtractoModel(empresaId, dbConfig);

    const movExt = await MovimientoExtractoModel.findById(movimientoExtractoId);
    if (!movExt) {
      throw new Error('Movimiento de extracto no encontrado');
    }

    movExt.estado = EstadoExtracto.DESCARTADO;
    movExt.movimientoBancarioId = undefined;
    movExt.descartadoPor = new Types.ObjectId(usuarioId);
    movExt.fechaDescarte = new Date();
    movExt.motivoDescarte = motivo;
    await movExt.save();

    await this.actualizarContadoresImportacion(empresaId, movExt.importacionId.toString());
  }

  /**
   * Obtener movimientos de extracto de una importacion
   */
  async getMovimientosExtracto(
    empresaId: string,
    importacionId: string,
    filtros: { estado?: EstadoExtracto; pagina?: number; limite?: number } = {}
  ): Promise<{
    movimientos: IMovimientoExtracto[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoExtractoModel = await getMovimientoExtractoModel(empresaId, dbConfig);

    const query: any = {
      importacionId: new Types.ObjectId(importacionId),
      activo: true,
    };

    if (filtros.estado) {
      query.estado = filtros.estado;
    }

    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 50;
    const skip = (pagina - 1) * limite;

    const [movimientos, total] = await Promise.all([
      MovimientoExtractoModel.find(query)
        .sort({ fecha: 1, numeroLinea: 1 })
        .skip(skip)
        .limit(limite)
        .lean(),
      MovimientoExtractoModel.countDocuments(query),
    ]);

    return {
      movimientos: movimientos as IMovimientoExtracto[],
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  /**
   * Obtener importaciones de una cuenta
   */
  async getImportaciones(
    empresaId: string,
    cuentaBancariaId?: string
  ): Promise<IImportacionExtracto[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const ImportacionExtractoModel = await getImportacionExtractoModel(empresaId, dbConfig);

    const query: any = { activo: true };
    if (cuentaBancariaId) {
      query.cuentaBancariaId = new Types.ObjectId(cuentaBancariaId);
    }

    return ImportacionExtractoModel.find(query)
      .sort({ fechaCreacion: -1 })
      .lean() as Promise<IImportacionExtracto[]>;
  }

  /**
   * Obtener una importacion por ID
   */
  async getImportacion(empresaId: string, importacionId: string): Promise<IImportacionExtracto | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const ImportacionExtractoModel = await getImportacionExtractoModel(empresaId, dbConfig);

    return ImportacionExtractoModel.findById(importacionId).lean() as Promise<IImportacionExtracto | null>;
  }

  /**
   * Buscar movimientos bancarios para conciliacion manual
   */
  async buscarMovimientosBancarios(
    empresaId: string,
    cuentaBancariaId: string,
    tipo: TipoMovimientoExtracto,
    importe: number,
    fecha: Date,
    margenDias: number = 10
  ): Promise<IMovimientoBancario[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoBancario = await getMovimientoBancarioModel(empresaId, dbConfig);

    const fechaInicio = new Date(fecha);
    fechaInicio.setDate(fechaInicio.getDate() - margenDias);
    const fechaFin = new Date(fecha);
    fechaFin.setDate(fechaFin.getDate() + margenDias);

    // Mapear tipo
    const tipoBanc =
      tipo === TipoMovimientoExtracto.ABONO ? TipoMovimiento.ENTRADA : TipoMovimiento.SALIDA;

    // Buscar con margen de importe
    const margenImporte = importe * 0.1; // 10% margen

    return MovimientoBancario.find({
      cuentaBancariaId: new Types.ObjectId(cuentaBancariaId),
      tipo: tipoBanc,
      importe: { $gte: importe - margenImporte, $lte: importe + margenImporte },
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      conciliado: false,
      estado: { $ne: EstadoMovimiento.ANULADO },
      activo: true,
    })
      .sort({ fecha: 1 })
      .limit(20)
      .lean() as Promise<IMovimientoBancario[]>;
  }

  /**
   * Finalizar importacion
   */
  async finalizarImportacion(empresaId: string, importacionId: string, usuarioId: string): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const ImportacionExtractoModel = await getImportacionExtractoModel(empresaId, dbConfig);

    const contadores = await this.getContadoresImportacion(empresaId, importacionId);

    await ImportacionExtractoModel.findByIdAndUpdate(importacionId, {
      estado: EstadoImportacion.COMPLETADA,
      movimientosPendientes: contadores.pendientes,
      movimientosSugeridos: contadores.sugeridos,
      movimientosConciliados: contadores.conciliados,
      movimientosDescartados: contadores.descartados,
      finalizadoPor: new Types.ObjectId(usuarioId),
      fechaFinalizacion: new Date(),
    });
  }

  // ============================================
  // UTILIDADES PRIVADAS
  // ============================================

  private splitCSVLine(line: string, separator: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private parseDate(dateStr: string, format: string): Date {
    let day: number, month: number, year: number;

    if (format === 'DD/MM/YYYY') {
      const parts = dateStr.split('/');
      day = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1;
      year = parseInt(parts[2]);
    } else if (format === 'MM/DD/YYYY') {
      const parts = dateStr.split('/');
      month = parseInt(parts[0]) - 1;
      day = parseInt(parts[1]);
      year = parseInt(parts[2]);
    } else if (format === 'YYYY-MM-DD') {
      const parts = dateStr.split('-');
      year = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1;
      day = parseInt(parts[2]);
    } else {
      // Intentar parseo automatico
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Formato de fecha no reconocido: ${dateStr}`);
      }
      return date;
    }

    return new Date(year, month, day);
  }

  private limpiarConcepto(concepto: string): string {
    return concepto
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-.,áéíóúñÁÉÍÓÚÑ€$]/gi, '')
      .trim()
      .substring(0, 200);
  }

  private async getContadoresImportacion(empresaId: string, importacionId: string): Promise<ImportacionStats> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoExtractoModel = await getMovimientoExtractoModel(empresaId, dbConfig);

    const contadores = await MovimientoExtractoModel.aggregate([
      { $match: { importacionId: new Types.ObjectId(importacionId), activo: true } },
      { $group: { _id: '$estado', count: { $sum: 1 } } },
    ]);

    const stats: ImportacionStats = {
      totalMovimientos: 0,
      pendientes: 0,
      sugeridos: 0,
      conciliados: 0,
      descartados: 0,
      tasaConciliacion: 0,
    };

    for (const c of contadores) {
      stats.totalMovimientos += c.count;
      switch (c._id) {
        case EstadoExtracto.PENDIENTE:
          stats.pendientes = c.count;
          break;
        case EstadoExtracto.SUGERIDO:
          stats.sugeridos = c.count;
          break;
        case EstadoExtracto.CONCILIADO:
          stats.conciliados = c.count;
          break;
        case EstadoExtracto.DESCARTADO:
          stats.descartados = c.count;
          break;
      }
    }

    if (stats.totalMovimientos > 0) {
      stats.tasaConciliacion = Math.round((stats.conciliados / stats.totalMovimientos) * 100);
    }

    return stats;
  }

  private async actualizarContadoresImportacion(empresaId: string, importacionId: string): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const ImportacionExtractoModel = await getImportacionExtractoModel(empresaId, dbConfig);

    const contadores = await this.getContadoresImportacion(empresaId, importacionId);

    await ImportacionExtractoModel.findByIdAndUpdate(importacionId, {
      movimientosPendientes: contadores.pendientes,
      movimientosSugeridos: contadores.sugeridos,
      movimientosConciliados: contadores.conciliados,
      movimientosDescartados: contadores.descartados,
    });
  }
}

export const conciliacionService = new ConciliacionService();
