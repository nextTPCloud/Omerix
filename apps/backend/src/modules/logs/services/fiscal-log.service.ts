// backend/src/modules/logs/services/fiscal-log.service.ts

import FiscalLog from '../schemas/fiscal-log.schema';
import {
  CreateFiscalLogDTO,
  QueryFiscalLogDTO,
} from '../dto/create-audit-log.dto';
import {
  DocumentType,
} from '../interfaces/log.interface';
import {
  generateDocumentHash,
  verifyDocumentHash,
} from '../../../utils/crypto/hash.util';
import {
  signFiscalDocument,
  generateTicketBAISignature,
  generateVerifactuSignature,
  generateFiscalDocumentId,
} from '../../../utils/crypto/signature.util';
import { logError, logFiscal, logInfo } from '../../../utils/logger/winston.config';

// ============================================
// SERVICIO DE FISCAL LOGS (INMUTABLES)
// ============================================

class FiscalLogService {
  /**
   * Crear un nuevo log fiscal (con blockchain)
   */
  async create(logData: CreateFiscalLogDTO): Promise<any> {
    try {
      // 1. Obtener el último log de la empresa (para blockchain)
      const ultimoLog = await FiscalLog.getUltimoLog(logData.empresaId);
      const hashAnterior = ultimoLog?.hash || null;

      // 2. Generar timestamp
      const timestamp = new Date();

      // 3. Generar hash del documento
      const hash = generateDocumentHash({
        empresaId: logData.empresaId,
        documentoTipo: logData.documentoTipo,
        numeroDocumento: logData.numeroDocumento,
        serie: logData.serie,
        importe: logData.importe,
        iva: logData.iva,
        total: logData.total,
        timestamp,
        hashAnterior: hashAnterior || 'GENESIS',
      });

      // 4. Generar firma digital
      const { firma } = signFiscalDocument({
        empresaId: logData.empresaId,
        documentoTipo: logData.documentoTipo,
        numeroDocumento: logData.numeroDocumento,
        serie: logData.serie,
        importe: logData.importe,
        iva: logData.iva,
        total: logData.total,
        timestamp,
      });

      // 5. Calcular fecha de retención (4 años mínimo)
      const retencionHasta = new Date();
      retencionHasta.setFullYear(retencionHasta.getFullYear() + 4);

      // 6. Crear log fiscal
      const fiscalLog = await FiscalLog.create({
        ...logData,
        hash,
        hashAnterior,
        firma,
        timestamp,
        retencionHasta,
        inmutable: true,
      });

      // 7. Log en Winston
      logFiscal(
        'DOCUMENTO_FISCAL_CREADO',
        logData.documentoTipo,
        logData.numeroDocumento,
        {
          empresaId: logData.empresaId,
          total: logData.total,
          hash: hash.substring(0, 16),
        }
      );

      logInfo('✅ Log fiscal creado y encadenado correctamente', {
        documentoTipo: logData.documentoTipo,
        numeroDocumento: logData.numeroDocumento,
        hash: hash.substring(0, 16),
      });

      return fiscalLog;
    } catch (error: any) {
      logError('Error creando log fiscal', error, {
        documentoTipo: logData.documentoTipo,
        numeroDocumento: logData.numeroDocumento,
      });
      throw new Error(`Error creando log fiscal: ${error.message}`);
    }
  }

  /**
   * Crear log fiscal con TicketBAI (País Vasco)
   */
  async createWithTicketBAI(
    logData: CreateFiscalLogDTO,
    empresaNIF: string
  ): Promise<any> {
    try {
      // Generar firma TicketBAI
      const tbaiId = generateFiscalDocumentId(
        logData.documentoTipo,
        logData.serie || 'A',
        logData.numeroDocumento,
        logData.empresaId
      );

      const ticketBAIData = generateTicketBAISignature({
        tbaiId,
        empresaNIF,
        serie: logData.serie || 'A',
        numero: logData.numeroDocumento,
        fecha: new Date(),
        importe: logData.total,
      });

      // Crear log con datos TicketBAI
      return await this.create({
        ...logData,
        ticketBAI: {
          tbaiId,
          qr: ticketBAIData.qr,
          firma: ticketBAIData.firma,
        },
      });
    } catch (error: any) {
      logError('Error creando log fiscal con TicketBAI', error);
      throw new Error(`Error creando log TicketBAI: ${error.message}`);
    }
  }

  /**
   * Crear log fiscal con Verifactu (Nacional)
   */
  async createWithVerifactu(
    logData: CreateFiscalLogDTO,
    empresaNIF: string
  ): Promise<any> {
    try {
      // Generar firma Verifactu
      const idFactura = generateFiscalDocumentId(
        logData.documentoTipo,
        logData.serie || 'A',
        logData.numeroDocumento,
        logData.empresaId
      );

      const verifactuData = generateVerifactuSignature({
        idFactura,
        empresaNIF,
        fechaExpedicion: new Date(),
        importe: logData.total,
        numeroFactura: logData.numeroDocumento,
      });

      // Crear log con datos Verifactu
      return await this.create({
        ...logData,
        verifactu: {
          idFactura,
          hash: verifactuData.hash,
          fechaExpedicion: new Date(),
        },
      });
    } catch (error: any) {
      logError('Error creando log fiscal con Verifactu', error);
      throw new Error(`Error creando log Verifactu: ${error.message}`);
    }
  }

  /**
   * Buscar logs con filtros y paginación
   */
  async findAll(query: QueryFiscalLogDTO): Promise<{
    data: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const {
        empresaId,
        documentoTipo,
        numeroDocumento,
        serie,
        fechaDesde,
        fechaHasta,
        page = 1,
        limit = 20,
        sortBy = 'timestamp',
        sortOrder = 'desc',
      } = query;

      // Construir query
      const filter: any = {};

      if (empresaId) filter.empresaId = empresaId;
      if (documentoTipo) filter.documentoTipo = documentoTipo;
      if (numeroDocumento) filter.numeroDocumento = numeroDocumento;
      if (serie) filter.serie = serie;

      // Filtros de fecha
      if (fechaDesde || fechaHasta) {
        filter.timestamp = {};
        if (fechaDesde) filter.timestamp.$gte = fechaDesde;
        if (fechaHasta) filter.timestamp.$lte = fechaHasta;
      }

      // Calcular skip
      const skip = (page - 1) * limit;

      // Ejecutar query con paginación
      const [data, total] = await Promise.all([
        FiscalLog.find(filter)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(limit)
          .populate('usuarioId', 'nombre apellidos email')
          .populate('empresaId', 'nombre nif')
          .lean(),
        FiscalLog.countDocuments(filter),
      ]);

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logError('Error buscando logs fiscales', error);
      throw new Error(`Error buscando logs fiscales: ${error.message}`);
    }
  }

  /**
   * Buscar un log por ID
   */
  async findById(id: string): Promise<any> {
    try {
      const log = await FiscalLog.findById(id)
        .populate('usuarioId', 'nombre apellidos email')
        .populate('empresaId', 'nombre nif')
        .lean();

      if (!log) {
        throw new Error('Log fiscal no encontrado');
      }

      return log;
    } catch (error: any) {
      logError('Error buscando log fiscal por ID', error);
      throw new Error(`Error buscando log: ${error.message}`);
    }
  }

  /**
   * Buscar log por número de documento
   */
  async findByNumeroDocumento(
    empresaId: string,
    numeroDocumento: string
  ): Promise<any> {
    try {
      return await FiscalLog.findByNumeroDocumento(empresaId, numeroDocumento);
    } catch (error: any) {
      logError('Error buscando log fiscal por número', error);
      throw new Error(`Error buscando log: ${error.message}`);
    }
  }

  /**
   * Buscar logs por tipo de documento
   */
  async findByDocumentType(
    empresaId: string,
    documentoTipo: DocumentType,
    limit: number = 50
  ): Promise<any[]> {
    try {
      return await FiscalLog.findByDocumentType(empresaId, documentoTipo, limit);
    } catch (error: any) {
      logError('Error buscando logs por tipo de documento', error);
      throw new Error(`Error buscando logs: ${error.message}`);
    }
  }

  /**
   * Verificar integridad de un documento específico
   */
  async verificarDocumento(id: string): Promise<{
    isValid: boolean;
    log: any;
    verificacion: {
      hashValido: boolean;
      cadenaValida: boolean;
    };
    message: string;
  }> {
    try {
      const log = await FiscalLog.findById(id).lean();

      if (!log) {
        throw new Error('Log fiscal no encontrado');
      }

      // Verificar hash del documento
      const hashValido = verifyDocumentHash(
        {
          empresaId: log.empresaId.toString(),
          documentoTipo: log.documentoTipo,
          numeroDocumento: log.numeroDocumento,
          serie: log.serie,
          importe: log.importe,
          iva: log.iva,
          total: log.total,
          timestamp: log.timestamp,
          hashAnterior: log.hashAnterior,
        },
        log.hash
      );

      // Verificar que el siguiente documento apunte a este
      let cadenaValida = true;
      const siguienteLog = await FiscalLog.findOne({
        empresaId: log.empresaId,
        hashAnterior: log.hash,
      }).lean();

      if (siguienteLog) {
        cadenaValida = siguienteLog.hashAnterior === log.hash;
      }

      const isValid = hashValido && cadenaValida;

      return {
        isValid,
        log,
        verificacion: {
          hashValido,
          cadenaValida,
        },
        message: isValid
          ? '✅ Documento verificado correctamente'
          : '❌ Documento ha sido alterado o la cadena está rota',
      };
    } catch (error: any) {
      logError('Error verificando documento fiscal', error);
      throw new Error(`Error verificando documento: ${error.message}`);
    }
  }

  /**
   * Verificar integridad de toda la cadena blockchain
   */
  async verificarCadena(
    empresaId: string,
    fechaDesde?: Date,
    fechaHasta?: Date
  ): Promise<any> {
    try {
      const resultado = await FiscalLog.verificarCadena(
        empresaId,
        fechaDesde,
        fechaHasta
      );

      if (resultado.isValid) {
        logInfo('✅ Cadena blockchain verificada correctamente', {
          empresaId,
          totalLogs: resultado.totalLogs,
        });
      } else {
        logError('❌ Cadena blockchain ROTA', null, {
          empresaId,
          brokenAt: resultado.brokenAt,
          brokenLog: resultado.brokenLog,
        });
      }

      return resultado;
    } catch (error: any) {
      logError('Error verificando cadena blockchain', error);
      throw new Error(`Error verificando cadena: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas fiscales
   */
  async getEstadisticas(
    empresaId: string,
    fechaDesde: Date,
    fechaHasta: Date
  ): Promise<any[]> {
    try {
      return await FiscalLog.getEstadisticas(empresaId, fechaDesde, fechaHasta);
    } catch (error: any) {
      logError('Error obteniendo estadísticas fiscales', error);
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Contar documentos por periodo
   */
  async contarPorPeriodo(
    empresaId: string,
    fechaDesde: Date,
    fechaHasta: Date
  ): Promise<any[]> {
    try {
      return await FiscalLog.contarPorPeriodo(empresaId, fechaDesde, fechaHasta);
    } catch (error: any) {
      logError('Error contando documentos por periodo', error);
      throw new Error(`Error contando documentos: ${error.message}`);
    }
  }

  /**
   * Obtener logs próximos a expirar retención
   */
  async getLogsProximosAExpirar(diasAntes: number = 30): Promise<any[]> {
    try {
      return await FiscalLog.getLogsProximosAExpirar(diasAntes);
    } catch (error: any) {
      logError('Error obteniendo logs próximos a expirar', error);
      throw new Error(`Error obteniendo logs: ${error.message}`);
    }
  }

  /**
   * Exportar logs fiscales para auditoría
   */
  async exportarParaAuditoria(
    empresaId: string,
    fechaDesde: Date,
    fechaHasta: Date
  ): Promise<any> {
    try {
      const logs = await FiscalLog.find({
        empresaId,
        timestamp: { $gte: fechaDesde, $lte: fechaHasta },
      })
        .sort({ timestamp: 1 })
        .populate('usuarioId', 'nombre apellidos email')
        .populate('empresaId', 'nombre nif')
        .lean();

      // Verificar integridad de la cadena
      const verificacion = await this.verificarCadena(empresaId, fechaDesde, fechaHasta);

      return {
        empresa: logs[0]?.empresaId,
        periodo: {
          desde: fechaDesde,
          hasta: fechaHasta,
        },
        totalDocumentos: logs.length,
        documentos: logs,
        verificacion,
        generadoEn: new Date(),
      };
    } catch (error: any) {
      logError('Error exportando logs para auditoría', error);
      throw new Error(`Error exportando logs: ${error.message}`);
    }
  }

  /**
   * Obtener resumen fiscal de una empresa
   */
  async getResumenFiscal(empresaId: string, year: number): Promise<any> {
    try {
      const fechaDesde = new Date(year, 0, 1); // 1 enero
      const fechaHasta = new Date(year, 11, 31, 23, 59, 59); // 31 diciembre

      const [stats, total, verificacion] = await Promise.all([
        this.getEstadisticas(empresaId, fechaDesde, fechaHasta),
        FiscalLog.countDocuments({
          empresaId,
          timestamp: { $gte: fechaDesde, $lte: fechaHasta },
        }),
        this.verificarCadena(empresaId, fechaDesde, fechaHasta),
      ]);

      return {
        year,
        totalDocumentos: total,
        estadisticas: stats,
        integridad: verificacion,
        generadoEn: new Date(),
      };
    } catch (error: any) {
      logError('Error obteniendo resumen fiscal', error);
      throw new Error(`Error obteniendo resumen: ${error.message}`);
    }
  }

  /**
   * CRÍTICO: Los logs fiscales NO se pueden eliminar
   * Este método solo sirve para consultar retención
   */
  async consultarRetencion(): Promise<any> {
    return {
      message: '🚨 Los logs fiscales son INMUTABLES y NO pueden eliminarse',
      retencionMinima: '4 años',
      normativa: 'Ley 11/2021 Anti-fraude',
      nota: 'Los logs se mantienen indefinidamente o hasta que expire su periodo de retención legal',
    };
  }
}

export default new FiscalLogService();