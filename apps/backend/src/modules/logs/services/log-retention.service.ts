// backend/src/modules/logs/services/log-retention.service.ts

import AuditLog from '../schemas/audit-log.schema';
import SystemLog from '../schemas/system-log.schema';
import FiscalLog from '../schemas/fiscal-log.schema';
import { IRetentionPolicy, IRetentionStats } from '../interfaces/log.interface';
import { logInfo, logWarn, logError } from '../../../utils/logger/winston.config';

// ============================================
// SERVICIO DE RETENCIÓN DE LOGS
// ============================================

class LogRetentionService {
  /**
   * Política de retención por defecto (en días)
   */
  private readonly DEFAULT_RETENTION_POLICY: IRetentionPolicy = {
    auditLogs: 730,    // 2 años
    systemLogs: 90,    // 3 meses (TTL en MongoDB)
    fiscalLogs: 1460,  // 4 años (mínimo legal, NO se eliminan)
  };

  /**
   * Obtener política de retención actual
   */
  getRetentionPolicy(): IRetentionPolicy {
    return {
      auditLogs: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '730'),
      systemLogs: parseInt(process.env.SYSTEM_LOG_RETENTION_DAYS || '90'),
      fiscalLogs: parseInt(process.env.FISCAL_LOG_RETENTION_DAYS || '1460'),
    };
  }

  /**
   * Ejecutar limpieza de logs antiguos
   */
  async cleanOldLogs(): Promise<IRetentionStats> {
    const startTime = Date.now();
    
    logInfo('🧹 Iniciando limpieza de logs antiguos...');

    try {
      const policy = this.getRetentionPolicy();

      // Ejecutar limpiezas en paralelo
      const [auditDeleted, systemInfo, fiscalCount] = await Promise.all([
        this.cleanAuditLogs(policy.auditLogs),
        this.getSystemLogsInfo(),
        this.countFiscalLogs(),
      ]);

      const stats: IRetentionStats = {
        auditLogsDeleted: auditDeleted,
        systemLogsDeleted: 0, // TTL automático de MongoDB
        fiscalLogsRetained: fiscalCount,
        lastRun: new Date(),
      };

      const duration = Date.now() - startTime;

      logInfo('✅ Limpieza de logs completada', {
        duration: `${duration}ms`,
        auditLogsDeleted: auditDeleted,
        fiscalLogsRetained: fiscalCount,
        systemLogsInfo: systemInfo,
      });

      return stats;
    } catch (error: any) {
      logError('Error en limpieza de logs', error);
      throw new Error(`Error en limpieza de logs: ${error.message}`);
    }
  }

  /**
   * Limpiar Audit Logs antiguos
   */
  private async cleanAuditLogs(diasRetencion: number): Promise<number> {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasRetencion);

      logInfo(`Eliminando audit logs anteriores a ${fechaLimite.toISOString()}`);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: fechaLimite },
      });

      const deleted = result.deletedCount || 0;

      if (deleted > 0) {
        logInfo(`🗑️ ${deleted} audit logs eliminados`, {
          fechaLimite,
          diasRetencion,
        });
      }

      return deleted;
    } catch (error: any) {
      logError('Error limpiando audit logs', error);
      throw error;
    }
  }

  /**
   * Obtener información de System Logs (TTL automático)
   */
  private async getSystemLogsInfo(): Promise<{
    total: number;
    ttlDays: number;
    message: string;
  }> {
    try {
      const total = await SystemLog.countDocuments();

      return {
        total,
        ttlDays: 90,
        message: 'System logs se eliminan automáticamente por TTL de MongoDB (90 días)',
      };
    } catch (error: any) {
      logError('Error obteniendo info de system logs', error);
      throw error;
    }
  }

  /**
   * Contar Fiscal Logs (NO se eliminan)
   */
  private async countFiscalLogs(): Promise<number> {
    try {
      return await FiscalLog.countDocuments();
    } catch (error: any) {
      logError('Error contando fiscal logs', error);
      throw error;
    }
  }

  /**
   * Verificar logs próximos a expirar retención
   */
  async checkExpiringLogs(diasAntes: number = 30): Promise<{
    auditLogs: any[];
    fiscalLogs: any[];
  }> {
    try {
      const policy = this.getRetentionPolicy();
      const fechaLimiteAudit = new Date();
      fechaLimiteAudit.setDate(
        fechaLimiteAudit.getDate() - policy.auditLogs + diasAntes
      );

      const fechaLimiteFiscal = new Date();
      fechaLimiteFiscal.setDate(fechaLimiteFiscal.getDate() + diasAntes);

      const [auditLogs, fiscalLogs] = await Promise.all([
        AuditLog.find({
          timestamp: { $lte: fechaLimiteAudit },
        })
          .sort({ timestamp: 1 })
          .limit(100)
          .lean(),
        FiscalLog.find({
          retencionHasta: { $lte: fechaLimiteFiscal },
        })
          .sort({ retencionHasta: 1 })
          .limit(100)
          .lean(),
      ]);

      if (fiscalLogs.length > 0) {
        logWarn(
          `⚠️ Hay ${fiscalLogs.length} logs fiscales próximos a expirar retención`,
          {
            diasAntes,
            primeraExpiracion: fiscalLogs[0].retencionHasta,
          }
        );
      }

      return {
        auditLogs,
        fiscalLogs,
      };
    } catch (error: any) {
      logError('Error verificando logs próximos a expirar', error);
      throw new Error(`Error verificando expiración: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de retención
   */
  async getRetentionStats(): Promise<{
    policy: IRetentionPolicy;
    counts: {
      auditLogs: number;
      systemLogs: number;
      fiscalLogs: number;
    };
    oldestLogs: {
      audit?: Date;
      system?: Date;
      fiscal?: Date;
    };
    storage: {
      auditLogsSizeMB: number;
      systemLogsSizeMB: number;
      fiscalLogsSizeMB: number;
    };
  }> {
    try {
      const policy = this.getRetentionPolicy();

      // Contar documentos
      const [auditCount, systemCount, fiscalCount] = await Promise.all([
        AuditLog.countDocuments(),
        SystemLog.countDocuments(),
        FiscalLog.countDocuments(),
      ]);

      // Obtener logs más antiguos
      const [oldestAudit, oldestSystem, oldestFiscal] = await Promise.all([
        AuditLog.findOne().sort({ timestamp: 1 }).select('timestamp').lean(),
        SystemLog.findOne().sort({ timestamp: 1 }).select('timestamp').lean(),
        FiscalLog.findOne().sort({ timestamp: 1 }).select('timestamp').lean(),
      ]);

      // Obtener tamaño de colecciones (estimado)
      const storage = await this.estimateStorageSize();

      return {
        policy,
        counts: {
          auditLogs: auditCount,
          systemLogs: systemCount,
          fiscalLogs: fiscalCount,
        },
        oldestLogs: {
          audit: oldestAudit?.timestamp,
          system: oldestSystem?.timestamp,
          fiscal: oldestFiscal?.timestamp,
        },
        storage,
      };
    } catch (error: any) {
      logError('Error obteniendo estadísticas de retención', error);
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Estimar tamaño de almacenamiento (aproximado)
   */
  private async estimateStorageSize(): Promise<{
    auditLogsSizeMB: number;
    systemLogsSizeMB: number;
    fiscalLogsSizeMB: number;
  }> {
    try {
      // Estimación basada en tamaño promedio por documento
      const AVG_AUDIT_SIZE = 1024; // 1KB por audit log
      const AVG_SYSTEM_SIZE = 512;  // 0.5KB por system log
      const AVG_FISCAL_SIZE = 2048; // 2KB por fiscal log

      const [auditCount, systemCount, fiscalCount] = await Promise.all([
        AuditLog.countDocuments(),
        SystemLog.countDocuments(),
        FiscalLog.countDocuments(),
      ]);

      return {
        auditLogsSizeMB: Math.round((auditCount * AVG_AUDIT_SIZE) / (1024 * 1024) * 100) / 100,
        systemLogsSizeMB: Math.round((systemCount * AVG_SYSTEM_SIZE) / (1024 * 1024) * 100) / 100,
        fiscalLogsSizeMB: Math.round((fiscalCount * AVG_FISCAL_SIZE) / (1024 * 1024) * 100) / 100,
      };
    } catch (error: any) {
      logError('Error estimando tamaño de almacenamiento', error);
      return {
        auditLogsSizeMB: 0,
        systemLogsSizeMB: 0,
        fiscalLogsSizeMB: 0,
      };
    }
  }

  /**
   * Limpiar logs de una empresa específica (excepto fiscales)
   */
  async cleanCompanyLogs(empresaId: string, olderThanDays: number = 730): Promise<{
    auditLogsDeleted: number;
    fiscalLogsRetained: number;
  }> {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - olderThanDays);

      logInfo(`Limpiando logs de empresa ${empresaId}`, {
        fechaLimite,
        olderThanDays,
      });

      // Solo eliminar audit logs (fiscales NO se tocan)
      const auditResult = await AuditLog.deleteMany({
        empresaId,
        timestamp: { $lt: fechaLimite },
      });

      const fiscalCount = await FiscalLog.countDocuments({ empresaId });

      logInfo(`Logs de empresa limpiados`, {
        empresaId,
        auditLogsDeleted: auditResult.deletedCount || 0,
        fiscalLogsRetained: fiscalCount,
      });

      return {
        auditLogsDeleted: auditResult.deletedCount || 0,
        fiscalLogsRetained: fiscalCount,
      };
    } catch (error: any) {
      logError('Error limpiando logs de empresa', error);
      throw new Error(`Error limpiando logs de empresa: ${error.message}`);
    }
  }

  /**
   * Verificar integridad antes de limpieza
   */
  async verifyBeforeCleanup(empresaId?: string): Promise<{
    isValid: boolean;
    message: string;
    issues?: string[];
  }> {
    try {
      const issues: string[] = [];

      // Verificar que no hay logs fiscales huérfanos
      const query = empresaId ? { empresaId } : {};
      const orphanFiscalLogs = await FiscalLog.countDocuments({
        ...query,
        hashAnterior: { $ne: null },
      });

      if (orphanFiscalLogs > 0) {
        // Verificar integridad de la cadena
        const empresas = empresaId 
          ? [empresaId] 
          : await FiscalLog.distinct('empresaId');

        for (const empId of empresas) {
          const cadena = await FiscalLog.verificarCadena(empId.toString());
          if (!cadena.isValid) {
            issues.push(
              `Cadena fiscal rota para empresa ${empId}: ${cadena.message}`
            );
          }
        }
      }

      if (issues.length > 0) {
        logWarn('⚠️ Problemas detectados antes de limpieza', { issues });
        return {
          isValid: false,
          message: 'Se detectaron problemas de integridad',
          issues,
        };
      }

      return {
        isValid: true,
        message: '✅ Verificación exitosa, es seguro proceder con limpieza',
      };
    } catch (error: any) {
      logError('Error verificando integridad antes de limpieza', error);
      throw new Error(`Error en verificación: ${error.message}`);
    }
  }

  /**
   * Programar limpieza automática (cron job)
   * Este método debe ser llamado desde un cron job
   */
  async scheduledCleanup(): Promise<IRetentionStats> {
    try {
      logInfo('🕐 Iniciando limpieza programada de logs...');

      // Verificar integridad antes de limpiar
      const verification = await this.verifyBeforeCleanup();
      
      if (!verification.isValid) {
        logWarn('⚠️ Limpieza cancelada por problemas de integridad', {
          issues: verification.issues,
        });
        throw new Error('Limpieza cancelada: problemas de integridad detectados');
      }

      // Ejecutar limpieza
      const stats = await this.cleanOldLogs();

      logInfo('✅ Limpieza programada completada', stats);

      return stats;
    } catch (error: any) {
      logError('Error en limpieza programada', error);
      throw error;
    }
  }

  /**
   * Obtener recomendaciones de limpieza
   */
  async getCleanupRecommendations(): Promise<{
    shouldClean: boolean;
    recommendations: string[];
    estimatedSpaceSaved: number;
  }> {
    try {
      const stats = await this.getRetentionStats();
      const policy = this.getRetentionPolicy();
      const recommendations: string[] = [];
      let estimatedSpaceSaved = 0;

      // Calcular logs que se pueden eliminar
      const fechaLimiteAudit = new Date();
      fechaLimiteAudit.setDate(fechaLimiteAudit.getDate() - policy.auditLogs);

      const deletableAuditLogs = await AuditLog.countDocuments({
        timestamp: { $lt: fechaLimiteAudit },
      });

      if (deletableAuditLogs > 1000) {
        recommendations.push(
          `Se pueden eliminar ${deletableAuditLogs} audit logs antiguos (ahorraría ~${Math.round(deletableAuditLogs / 1024)} MB)`
        );
        estimatedSpaceSaved += Math.round(deletableAuditLogs / 1024);
      }

      if (stats.counts.fiscalLogs > 10000) {
        recommendations.push(
          `Hay ${stats.counts.fiscalLogs} logs fiscales (NO se eliminan por normativa)`
        );
      }

      return {
        shouldClean: deletableAuditLogs > 1000,
        recommendations,
        estimatedSpaceSaved,
      };
    } catch (error: any) {
      logError('Error obteniendo recomendaciones de limpieza', error);
      throw new Error(`Error obteniendo recomendaciones: ${error.message}`);
    }
  }
}

export default new LogRetentionService();