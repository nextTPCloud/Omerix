// backend/src/modules/logs/services/audit-log.service.ts

import AuditLog from '../schemas/audit-log.schema';
import {
  CreateAuditLogDTO,
  QueryAuditLogDTO,
} from '../dto/create-audit-log.dto';
import {
  ICreateAuditLog,
  LogAction,
  LogModule,
  LogResult,
} from '../interfaces/log.interface';
import { logError, logInfo } from '../../../utils/logger/winston.config';

// ============================================
// SERVICIO DE AUDIT LOGS
// ============================================

class AuditLogService {
  /**
   * Crear un nuevo log de auditoría
   */
  async create(logData: CreateAuditLogDTO): Promise<any> {
    try {
      const auditLog = await AuditLog.create({
        ...logData,
        timestamp: new Date(),
      });

      // Log en Winston también (opcional)
      logInfo('Audit log creado', {
        accion: logData.accion,
        modulo: logData.modulo,
        empresaId: logData.empresaId,
      });

      return auditLog;
    } catch (error: any) {
      logError('Error creando audit log', error);
      throw new Error(`Error creando audit log: ${error.message}`);
    }
  }

  /**
   * Buscar logs con filtros y paginación
   */
  async findAll(query: QueryAuditLogDTO): Promise<{
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
        usuarioId,
        accion,
        modulo,
        entidadTipo,
        entidadId,
        resultado,
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
      if (usuarioId) filter.usuarioId = usuarioId;
      if (accion) filter.accion = accion;
      if (modulo) filter.modulo = modulo;
      if (entidadTipo) filter.entidadTipo = entidadTipo;
      if (entidadId) filter.entidadId = entidadId;
      if (resultado) filter.resultado = resultado;

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
        AuditLog.find(filter)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(limit)
          .populate('usuarioId', 'nombre apellidos email')
          .populate('empresaId', 'nombre nif')
          .lean(),
        AuditLog.countDocuments(filter),
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
      logError('Error buscando audit logs', error);
      throw new Error(`Error buscando audit logs: ${error.message}`);
    }
  }

  /**
   * Buscar un log por ID
   */
  async findById(id: string): Promise<any> {
    try {
      const log = await AuditLog.findById(id)
        .populate('usuarioId', 'nombre apellidos email')
        .populate('empresaId', 'nombre nif')
        .lean();

      if (!log) {
        throw new Error('Log no encontrado');
      }

      return log;
    } catch (error: any) {
      logError('Error buscando audit log por ID', error);
      throw new Error(`Error buscando log: ${error.message}`);
    }
  }

  /**
   * Buscar logs de una entidad específica
   */
  async findByEntity(
    empresaId: string,
    entidadTipo: string,
    entidadId: string
  ): Promise<any[]> {
    try {
      return await AuditLog.findByEntity(empresaId, entidadTipo, entidadId);
    } catch (error: any) {
      logError('Error buscando logs por entidad', error);
      throw new Error(`Error buscando logs de entidad: ${error.message}`);
    }
  }

  /**
   * Buscar logs de un usuario
   */
  async findByUser(
    empresaId: string,
    usuarioId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      return await AuditLog.findByUser(empresaId, usuarioId, limit);
    } catch (error: any) {
      logError('Error buscando logs por usuario', error);
      throw new Error(`Error buscando logs de usuario: ${error.message}`);
    }
  }

  /**
   * Buscar logs por módulo
   */
  async findByModule(
    empresaId: string,
    modulo: LogModule,
    limit: number = 100
  ): Promise<any[]> {
    try {
      return await AuditLog.findByModule(empresaId, modulo, limit);
    } catch (error: any) {
      logError('Error buscando logs por módulo', error);
      throw new Error(`Error buscando logs de módulo: ${error.message}`);
    }
  }

  /**
   * Buscar logs con errores
   */
  async findErrors(
    empresaId: string,
    fechaDesde?: Date,
    fechaHasta?: Date
  ): Promise<any[]> {
    try {
      return await AuditLog.findErrors(empresaId, fechaDesde, fechaHasta);
    } catch (error: any) {
      logError('Error buscando logs de errores', error);
      throw new Error(`Error buscando errores: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de logs
   */
  async getStats(
    empresaId: string,
    fechaDesde: Date,
    fechaHasta: Date
  ): Promise<any[]> {
    try {
      return await AuditLog.getStats(empresaId, fechaDesde, fechaHasta);
    } catch (error: any) {
      logError('Error obteniendo estadísticas', error);
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener actividad por usuario
   */
  async getUserActivity(
    empresaId: string,
    fechaDesde: Date,
    fechaHasta: Date
  ): Promise<any[]> {
    try {
      return await AuditLog.getUserActivity(empresaId, fechaDesde, fechaHasta);
    } catch (error: any) {
      logError('Error obteniendo actividad de usuarios', error);
      throw new Error(`Error obteniendo actividad: ${error.message}`);
    }
  }

  /**
   * Método helper: Crear log desde Request de Express
   */
  async createFromRequest(
    req: any,
    accion: LogAction,
    modulo: LogModule,
    descripcion: string,
    options?: {
      entidadTipo?: string;
      entidadId?: string;
      datosAnteriores?: any;
      datosNuevos?: any;
      resultado?: LogResult;
      mensajeError?: string;
      metadata?: any;
    }
  ): Promise<any> {
    try {
      const empresaId = req.empresaId || req.user?.empresaId;
      const usuarioId = req.userId || req.user?.id;
      const ip = req.ip || req.connection.remoteAddress || '0.0.0.0';
      const userAgent = req.get('user-agent');

      if (!empresaId || !usuarioId) {
        throw new Error('EmpresaId y UsuarioId son obligatorios');
      }

      return await this.create({
        empresaId,
        usuarioId,
        accion,
        modulo,
        descripcion,
        ip,
        userAgent,
        resultado: options?.resultado || LogResult.SUCCESS,
        entidadTipo: options?.entidadTipo,
        entidadId: options?.entidadId,
        datosAnteriores: options?.datosAnteriores,
        datosNuevos: options?.datosNuevos,
        mensajeError: options?.mensajeError,
        metadata: options?.metadata,
      });
    } catch (error: any) {
      logError('Error creando log desde request', error);
      throw error;
    }
  }

  /**
   * Método helper: Log de login exitoso
   */
  async logLogin(usuarioId: string, empresaId: string, ip: string, userAgent?: string): Promise<any> {
    return await this.create({
      empresaId,
      usuarioId,
      accion: LogAction.USER_LOGIN,
      modulo: LogModule.AUTH,
      descripcion: 'Usuario inició sesión',
      ip,
      userAgent,
      resultado: LogResult.SUCCESS,
    });
  }

  /**
   * Método helper: Log de login fallido
   */
  async logLoginFailed(email: string, ip: string, razon: string, userAgent?: string): Promise<any> {
    return await this.create({
      empresaId: 'SYSTEM', // Login fallido no tiene empresa
      usuarioId: 'SYSTEM',
      accion: LogAction.USER_LOGIN,
      modulo: LogModule.AUTH,
      descripcion: `Intento de login fallido para ${email}`,
      ip,
      userAgent,
      resultado: LogResult.FAILURE,
      mensajeError: razon,
      metadata: { email },
    });
  }

  /**
   * Método helper: Log de logout
   */
  async logLogout(usuarioId: string, empresaId: string, ip: string): Promise<any> {
    return await this.create({
      empresaId,
      usuarioId,
      accion: LogAction.USER_LOGOUT,
      modulo: LogModule.AUTH,
      descripcion: 'Usuario cerró sesión',
      ip,
      resultado: LogResult.SUCCESS,
    });
  }

  /**
   * Método helper: Log de creación de entidad
   */
  async logCreate(
    req: any,
    modulo: LogModule,
    entidadTipo: string,
    entidadId: string,
    datosNuevos: any
  ): Promise<any> {
    return await this.createFromRequest(
      req,
      LogAction[`${entidadTipo.toUpperCase()}_CREATE` as keyof typeof LogAction] || LogAction.USER_CREATE,
      modulo,
      `${entidadTipo} creado`,
      {
        entidadTipo,
        entidadId,
        datosNuevos,
      }
    );
  }

  /**
   * Método helper: Log de actualización de entidad
   */
  async logUpdate(
    req: any,
    modulo: LogModule,
    entidadTipo: string,
    entidadId: string,
    datosAnteriores: any,
    datosNuevos: any
  ): Promise<any> {
    return await this.createFromRequest(
      req,
      LogAction[`${entidadTipo.toUpperCase()}_UPDATE` as keyof typeof LogAction] || LogAction.USER_UPDATE,
      modulo,
      `${entidadTipo} actualizado`,
      {
        entidadTipo,
        entidadId,
        datosAnteriores,
        datosNuevos,
      }
    );
  }

  /**
   * Método helper: Log de eliminación de entidad
   */
  async logDelete(
    req: any,
    modulo: LogModule,
    entidadTipo: string,
    entidadId: string,
    datosAnteriores: any
  ): Promise<any> {
    return await this.createFromRequest(
      req,
      LogAction[`${entidadTipo.toUpperCase()}_DELETE` as keyof typeof LogAction] || LogAction.USER_DELETE,
      modulo,
      `${entidadTipo} eliminado`,
      {
        entidadTipo,
        entidadId,
        datosAnteriores,
      }
    );
  }

  /**
   * Eliminar logs antiguos (según política de retención)
   * Por defecto: 2 años (730 días)
   */
  async cleanOldLogs(diasRetencion: number = 730): Promise<number> {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasRetencion);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: fechaLimite },
      });

      logInfo(`Logs antiguos eliminados: ${result.deletedCount}`, {
        fechaLimite,
        diasRetencion,
      });

      return result.deletedCount || 0;
    } catch (error: any) {
      logError('Error limpiando logs antiguos', error);
      throw new Error(`Error limpiando logs: ${error.message}`);
    }
  }
}

export default new AuditLogService();