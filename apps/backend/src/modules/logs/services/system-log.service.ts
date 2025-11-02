// backend/src/modules/logs/services/system-log.service.ts

import SystemLog from '../schemas/system-log.schema';
import {
  CreateSystemLogDTO,
  QuerySystemLogDTO,
} from '../dto/create-audit-log.dto';
import {
  LogLevel,
  LogModule,
} from '../interfaces/log.interface';
import { logError as winstonLogError, logInfo } from '../../../utils/logger/winston.config';

// ============================================
// SERVICIO DE SYSTEM LOGS
// ============================================

class SystemLogService {
  /**
   * Crear un nuevo log de sistema
   */
  async create(logData: CreateSystemLogDTO): Promise<any> {
    try {
      const systemLog = await SystemLog.create({
        ...logData,
        timestamp: new Date(),
      });

      return systemLog;
    } catch (error: any) {
      winstonLogError('Error creando system log', error);
      throw new Error(`Error creando system log: ${error.message}`);
    }
  }

  /**
   * Buscar logs con filtros y paginación
   */
  async findAll(query: QuerySystemLogDTO): Promise<{
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
        nivel,
        modulo,
        empresaId,
        errorCode,
        fechaDesde,
        fechaHasta,
        page = 1,
        limit = 20,
        sortBy = 'timestamp',
        sortOrder = 'desc',
      } = query;

      // Construir query
      const filter: any = {};

      if (nivel) filter.nivel = nivel;
      if (modulo) filter.modulo = modulo;
      if (empresaId) filter.empresaId = empresaId;
      if (errorCode) filter.errorCode = errorCode;

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
        SystemLog.find(filter)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(limit)
          .populate('usuarioId', 'nombre apellidos email')
          .populate('empresaId', 'nombre')
          .lean(),
        SystemLog.countDocuments(filter),
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
      winstonLogError('Error buscando system logs', error);
      throw new Error(`Error buscando system logs: ${error.message}`);
    }
  }

  /**
   * Buscar un log por ID
   */
  async findById(id: string): Promise<any> {
    try {
      const log = await SystemLog.findById(id)
        .populate('usuarioId', 'nombre apellidos email')
        .populate('empresaId', 'nombre')
        .lean();

      if (!log) {
        throw new Error('Log no encontrado');
      }

      return log;
    } catch (error: any) {
      winstonLogError('Error buscando system log por ID', error);
      throw new Error(`Error buscando log: ${error.message}`);
    }
  }

  /**
   * Buscar logs por nivel
   */
  async findByLevel(nivel: LogLevel, limit: number = 100): Promise<any[]> {
    try {
      return await SystemLog.findByLevel(nivel, limit);
    } catch (error: any) {
      winstonLogError('Error buscando logs por nivel', error);
      throw new Error(`Error buscando logs: ${error.message}`);
    }
  }

  /**
   * Buscar errores recientes
   */
  async findRecentErrors(minutosAtras: number = 60, limit: number = 50): Promise<any[]> {
    try {
      return await SystemLog.findRecentErrors(minutosAtras, limit);
    } catch (error: any) {
      winstonLogError('Error buscando errores recientes', error);
      throw new Error(`Error buscando errores: ${error.message}`);
    }
  }

  /**
   * Buscar logs por módulo
   */
  async findByModule(
    modulo: LogModule,
    fechaDesde?: Date,
    fechaHasta?: Date
  ): Promise<any[]> {
    try {
      return await SystemLog.findByModule(modulo, fechaDesde, fechaHasta);
    } catch (error: any) {
      winstonLogError('Error buscando logs por módulo', error);
      throw new Error(`Error buscando logs: ${error.message}`);
    }
  }

  /**
   * Buscar logs por código de error
   */
  async findByErrorCode(errorCode: string, limit: number = 50): Promise<any[]> {
    try {
      return await SystemLog.findByErrorCode(errorCode, limit);
    } catch (error: any) {
      winstonLogError('Error buscando logs por código de error', error);
      throw new Error(`Error buscando logs: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de errores
   */
  async getErrorStats(horasAtras: number = 24): Promise<any[]> {
    try {
      return await SystemLog.getErrorStats(horasAtras);
    } catch (error: any) {
      winstonLogError('Error obteniendo estadísticas de errores', error);
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por módulo
   */
  async getModuleStats(fechaDesde: Date, fechaHasta: Date): Promise<any[]> {
    try {
      return await SystemLog.getModuleStats(fechaDesde, fechaHasta);
    } catch (error: any) {
      winstonLogError('Error obteniendo estadísticas por módulo', error);
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Verificar salud del sistema
   */
  async checkSystemHealth(): Promise<any> {
    try {
      return await SystemLog.checkSystemHealth();
    } catch (error: any) {
      winstonLogError('Error verificando salud del sistema', error);
      throw new Error(`Error verificando salud: ${error.message}`);
    }
  }

  /**
   * Método helper: Log de información
   */
  async logInfo(
    mensaje: string,
    modulo: LogModule,
    contexto?: any
  ): Promise<any> {
    return await this.create({
      nivel: LogLevel.INFO,
      mensaje,
      modulo,
      contexto,
    });
  }

  /**
   * Método helper: Log de advertencia
   */
  async logWarn(
    mensaje: string,
    modulo: LogModule,
    contexto?: any
  ): Promise<any> {
    return await this.create({
      nivel: LogLevel.WARN,
      mensaje,
      modulo,
      contexto,
    });
  }

  /**
   * Método helper: Log de error
   */
  async logError(
    mensaje: string,
    modulo: LogModule,
    error?: Error,
    contexto?: any
  ): Promise<any> {
    return await this.create({
      nivel: LogLevel.ERROR,
      mensaje,
      modulo,
      stack: error?.stack,
      errorCode: (error as any)?.code,
      contexto: {
        ...contexto,
        errorMessage: error?.message,
      },
    });
  }

  /**
   * Método helper: Log de error fatal
   */
  async logFatal(
    mensaje: string,
    modulo: LogModule,
    error?: Error,
    contexto?: any
  ): Promise<any> {
    return await this.create({
      nivel: LogLevel.FATAL,
      mensaje,
      modulo,
      stack: error?.stack,
      errorCode: (error as any)?.code,
      contexto: {
        ...contexto,
        errorMessage: error?.message,
      },
    });
  }

  /**
   * Método helper: Log de debug
   */
  async logDebug(
    mensaje: string,
    modulo: LogModule,
    contexto?: any
  ): Promise<any> {
    // Solo crear logs de debug en desarrollo
    if (process.env.NODE_ENV === 'production') {
      return null;
    }

    return await this.create({
      nivel: LogLevel.DEBUG,
      mensaje,
      modulo,
      contexto,
    });
  }

  /**
   * Método helper: Log de request HTTP
   */
  async logHTTPRequest(
    req: any,
    statusCode: number,
    mensaje?: string
  ): Promise<any> {
    const nivel = statusCode >= 500 
      ? LogLevel.ERROR 
      : statusCode >= 400 
      ? LogLevel.WARN 
      : LogLevel.INFO;

    return await this.create({
      nivel,
      mensaje: mensaje || `HTTP ${req.method} ${req.originalUrl}`,
      modulo: LogModule.SYSTEM,
      ip: req.ip || req.connection.remoteAddress,
      url: req.originalUrl,
      method: req.method,
      empresaId: req.empresaId,
      usuarioId: req.userId,
      contexto: {
        statusCode,
        userAgent: req.get('user-agent'),
      },
    });
  }

  /**
   * Método helper: Log de error de base de datos
   */
  async logDatabaseError(
    operacion: string,
    error: Error,
    contexto?: any
  ): Promise<any> {
    return await this.create({
      nivel: LogLevel.ERROR,
      mensaje: `Error en operación de BD: ${operacion}`,
      modulo: LogModule.SYSTEM,
      stack: error.stack,
      errorCode: (error as any).code,
      contexto: {
        ...contexto,
        operacion,
        errorMessage: error.message,
      },
    });
  }

  /**
   * Método helper: Log de llamada a API externa
   */
  async logExternalAPICall(
    apiName: string,
    endpoint: string,
    success: boolean,
    responseTime?: number,
    error?: any
  ): Promise<any> {
    return await this.create({
      nivel: success ? LogLevel.INFO : LogLevel.ERROR,
      mensaje: `Llamada a API externa: ${apiName}`,
      modulo: LogModule.SYSTEM,
      accion: 'EXTERNAL_API_CALL',
      stack: error?.stack,
      contexto: {
        apiName,
        endpoint,
        success,
        responseTime: responseTime ? `${responseTime}ms` : undefined,
        errorMessage: error?.message,
      },
    });
  }

  /**
   * Método helper: Log de tarea programada (cron job)
   */
  async logCronJob(
    jobName: string,
    success: boolean,
    duration?: number,
    error?: any
  ): Promise<any> {
    return await this.create({
      nivel: success ? LogLevel.INFO : LogLevel.ERROR,
      mensaje: `Cron job: ${jobName}`,
      modulo: LogModule.SYSTEM,
      accion: 'CRON_JOB_RUN',
      stack: error?.stack,
      contexto: {
        jobName,
        success,
        duration: duration ? `${duration}ms` : undefined,
        errorMessage: error?.message,
      },
    });
  }

  /**
   * Limpiar logs antiguos (automático por TTL de MongoDB)
   * Este método es informativo, la limpieza real la hace MongoDB con el índice TTL
   */
  async cleanOldLogs(): Promise<{
    message: string;
    ttlDays: number;
  }> {
    return {
      message: 'Los logs de sistema se eliminan automáticamente por TTL de MongoDB',
      ttlDays: 90,
    };
  }

  /**
   * Obtener resumen de salud del sistema (últimas 24h)
   */
  async getHealthSummary(): Promise<any> {
    try {
      const ultimas24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [health, errorStats, totalLogs] = await Promise.all([
        this.checkSystemHealth(),
        this.getErrorStats(24),
        SystemLog.countDocuments({
          timestamp: { $gte: ultimas24h },
        }),
      ]);

      return {
        ...health,
        errorStats,
        totalLogs,
        periodo: '24 horas',
      };
    } catch (error: any) {
      winstonLogError('Error obteniendo resumen de salud', error);
      throw new Error(`Error obteniendo resumen: ${error.message}`);
    }
  }
}

export default new SystemLogService();