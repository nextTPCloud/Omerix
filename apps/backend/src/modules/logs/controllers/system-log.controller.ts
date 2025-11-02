// backend/src/modules/logs/controllers/system-log.controller.ts

import { Request, Response } from 'express';
import systemLogService from '../services/system-log.service';
import logRetentionService from '../services/log-retention.service';
import {
  QuerySystemLogSchema,
  validateDTO,
  formatZodErrors,
  ExportSystemLogSchema,
} from '../dto/create-audit-log.dto';

// ============================================
// CONTROLADORES DE SYSTEM LOGS
// ============================================

/**
 * Obtener todos los system logs con filtros
 * GET /api/logs/system
 */
export const getSystemLogs = async (req: Request, res: Response) => {
  try {
    // Validar query params
    const validation = validateDTO(QuerySystemLogSchema, req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de búsqueda inválidos',
        errors: formatZodErrors(validation.errors),
      });
    }

    const queryData = validation.data;
    
    // Garantizar valores para campos requeridos
    const result = await systemLogService.findAll({
      nivel: queryData.nivel,
      modulo: queryData.modulo,
      empresaId: queryData.empresaId,
      errorCode: queryData.errorCode,
      fechaDesde: queryData.fechaDesde,
      fechaHasta: queryData.fechaHasta,
      page: queryData.page ?? 1,
      limit: queryData.limit ?? 20,
      sortBy: queryData.sortBy ?? 'timestamp',
      sortOrder: queryData.sortOrder ?? 'desc',
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error obteniendo system logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs de sistema',
      error: error.message,
    });
  }
};

/**
 * Exportar system logs (JSON)
 * GET /api/logs/system/export
 */
export const exportSystemLogs = async (req: Request, res: Response) => {
  try {
    // Validar con el schema de exportación
    const validation = validateDTO(ExportSystemLogSchema, req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de exportación inválidos',
        errors: formatZodErrors(validation.errors),
      });
    }

    const queryData = validation.data;
    
    // Garantizar valores para campos requeridos
    const result = await systemLogService.findAll({
      nivel: queryData.nivel,
      modulo: queryData.modulo,
      empresaId: queryData.empresaId,
      errorCode: queryData.errorCode,
      fechaDesde: queryData.fechaDesde,
      fechaHasta: queryData.fechaHasta,
      page: 1, // Siempre página 1 para exportación
      limit: queryData.limit ?? 10000,
      sortBy: queryData.sortBy ?? 'timestamp',
      sortOrder: queryData.sortOrder ?? 'desc',
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=system-logs.json');
    res.json({
      success: true,
      data: result.data,
      total: result.pagination.total,
      exportedAt: new Date(),
    });
  } catch (error: any) {
    console.error('Error exportando system logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error exportando logs',
      error: error.message,
    });
  }
};

/**
 * Obtener un system log por ID
 * GET /api/logs/system/:id
 */
export const getSystemLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const log = await systemLogService.findById(id);

    res.json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error('Error obteniendo system log:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Log no encontrado',
    });
  }
};

/**
 * Obtener errores recientes
 * GET /api/logs/system/errors/recent
 */
export const getRecentErrors = async (req: Request, res: Response) => {
  try {
    const minutosAtras = parseInt(req.query.minutosAtras as string) || 60;
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await systemLogService.findRecentErrors(minutosAtras, limit);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
      periodo: `Últimos ${minutosAtras} minutos`,
    });
  } catch (error: any) {
    console.error('Error obteniendo errores recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo errores recientes',
      error: error.message,
    });
  }
};

/**
 * Obtener logs por nivel
 * GET /api/logs/system/level/:nivel
 */
export const getLogsByLevel = async (req: Request, res: Response) => {
  try {
    const { nivel } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const logs = await systemLogService.findByLevel(nivel as any, limit);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error obteniendo logs por nivel:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs por nivel',
      error: error.message,
    });
  }
};

/**
 * Obtener logs por módulo
 * GET /api/logs/system/module/:modulo
 */
export const getLogsByModule = async (req: Request, res: Response) => {
  try {
    const { modulo } = req.params;
    const fechaDesde = req.query.fechaDesde ? new Date(req.query.fechaDesde as string) : undefined;
    const fechaHasta = req.query.fechaHasta ? new Date(req.query.fechaHasta as string) : undefined;

    const logs = await systemLogService.findByModule(modulo as any, fechaDesde, fechaHasta);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error obteniendo logs por módulo:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs por módulo',
      error: error.message,
    });
  }
};

/**
 * Obtener logs por código de error
 * GET /api/logs/system/error-code/:code
 */
export const getLogsByErrorCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await systemLogService.findByErrorCode(code, limit);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error obteniendo logs por código de error:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs por código de error',
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas de errores
 * GET /api/logs/system/stats/errors
 */
export const getErrorStats = async (req: Request, res: Response) => {
  try {
    const horasAtras = parseInt(req.query.horasAtras as string) || 24;

    const stats = await systemLogService.getErrorStats(horasAtras);

    res.json({
      success: true,
      data: stats,
      periodo: `Últimas ${horasAtras} horas`,
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas de errores:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas por módulo
 * GET /api/logs/system/stats/modules
 */
export const getModuleStats = async (req: Request, res: Response) => {
  try {
    const fechaDesde = req.query.fechaDesde 
      ? new Date(req.query.fechaDesde as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 días atrás por defecto
    
    const fechaHasta = req.query.fechaHasta
      ? new Date(req.query.fechaHasta as string)
      : new Date();

    const stats = await systemLogService.getModuleStats(fechaDesde, fechaHasta);

    res.json({
      success: true,
      data: stats,
      periodo: {
        desde: fechaDesde,
        hasta: fechaHasta,
      },
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas por módulo:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message,
    });
  }
};

/**
 * Verificar salud del sistema
 * GET /api/logs/system/health
 */
export const checkHealth = async (req: Request, res: Response) => {
  try {
    const health = await systemLogService.checkSystemHealth();

    const statusCode = health.status === 'critical' ? 503 : 200;

    res.status(statusCode).json({
      success: health.status !== 'critical',
      data: health,
    });
  } catch (error: any) {
    console.error('Error verificando salud del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando salud',
      error: error.message,
    });
  }
};

/**
 * Obtener resumen completo de salud
 * GET /api/logs/system/health/summary
 */
export const getHealthSummary = async (req: Request, res: Response) => {
  try {
    const summary = await systemLogService.getHealthSummary();

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error obteniendo resumen de salud:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo resumen',
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas de retención
 * GET /api/logs/system/retention/stats
 */
export const getRetentionStats = async (req: Request, res: Response) => {
  try {
    const stats = await logRetentionService.getRetentionStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas de retención:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message,
    });
  }
};

/**
 * Verificar logs próximos a expirar
 * GET /api/logs/system/retention/expiring
 */
export const getExpiringLogs = async (req: Request, res: Response) => {
  try {
    const diasAntes = parseInt(req.query.diasAntes as string) || 30;

    const logs = await logRetentionService.checkExpiringLogs(diasAntes);

    res.json({
      success: true,
      data: logs,
      diasAntes,
    });
  } catch (error: any) {
    console.error('Error obteniendo logs próximos a expirar:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs',
      error: error.message,
    });
  }
};

/**
 * Obtener recomendaciones de limpieza
 * GET /api/logs/system/retention/recommendations
 */
export const getCleanupRecommendations = async (req: Request, res: Response) => {
  try {
    const recommendations = await logRetentionService.getCleanupRecommendations();

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error('Error obteniendo recomendaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo recomendaciones',
      error: error.message,
    });
  }
};

/**
 * Ejecutar limpieza manual de logs
 * POST /api/logs/system/retention/cleanup
 * (Solo para administradores)
 */
export const executeCleanup = async (req: Request, res: Response) => {
  try {
    const rol = (req as any).userRole;

    // Solo admins pueden ejecutar limpieza manual
    if (rol !== 'admin' && rol !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ejecutar limpieza de logs',
      });
    }

    const stats = await logRetentionService.cleanOldLogs();

    res.json({
      success: true,
      message: 'Limpieza ejecutada correctamente',
      data: stats,
    });
  } catch (error: any) {
    console.error('Error ejecutando limpieza:', error);
    res.status(500).json({
      success: false,
      message: 'Error ejecutando limpieza',
      error: error.message,
    });
  }
};

