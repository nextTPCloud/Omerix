// backend/src/modules/logs/controllers/audit-log.controller.ts

import { Request, Response } from 'express';
import auditLogService from '../services/audit-log.service';
import {
  QueryAuditLogSchema,
  GetStatsSchema,
  validateDTO,
  formatZodErrors,
  ExportAuditLogSchema,
} from '../dto/create-audit-log.dto';

// ============================================
// CONTROLADORES DE AUDIT LOGS
// ============================================

/**
 * Obtener todos los audit logs con filtros
 * GET /api/logs/audit
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    
    // Validar query params
    const validation = validateDTO(QueryAuditLogSchema, {
      ...req.query,
      empresaId,
    });
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de búsqueda inválidos',
        errors: formatZodErrors(validation.errors),
      });
    }
    
    const queryData = validation.data;
    
    // Garantizar valores para campos requeridos
    const result = await auditLogService.findAll({
      empresaId: queryData.empresaId,
      usuarioId: queryData.usuarioId,
      accion: queryData.accion,
      modulo: queryData.modulo,
      entidadTipo: queryData.entidadTipo,
      entidadId: queryData.entidadId,
      resultado: queryData.resultado,
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
    console.error('Error obteniendo audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs de auditoría',
      error: error.message,
    });
  }
};

/**
 * Obtener un audit log por ID
 * GET /api/logs/audit/:id
 */
export const getAuditLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;

    const log = await auditLogService.findById(id);

    if (log.empresaId.toString() !== empresaId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este log',
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error('Error obteniendo audit log:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Log no encontrado',
    });
  }
};

/**
 * Obtener logs de una entidad específica
 * GET /api/logs/audit/entity/:tipo/:id
 */
export const getLogsByEntity = async (req: Request, res: Response) => {
  try {
    const { tipo, id } = req.params;
    const empresaId = (req as any).empresaId;

    const logs = await auditLogService.findByEntity(empresaId, tipo, id);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error obteniendo logs de entidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs de la entidad',
      error: error.message,
    });
  }
};

/**
 * Obtener logs de un usuario
 * GET /api/logs/audit/user/:userId
 */
export const getLogsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const empresaId = (req as any).empresaId;
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await auditLogService.findByUser(empresaId, userId, limit);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error obteniendo logs de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs del usuario',
      error: error.message,
    });
  }
};

/**
 * Obtener logs por módulo
 * GET /api/logs/audit/module/:modulo
 */
export const getLogsByModule = async (req: Request, res: Response) => {
  try {
    const { modulo } = req.params;
    const empresaId = (req as any).empresaId;
    const limit = parseInt(req.query.limit as string) || 100;

    const logs = await auditLogService.findByModule(empresaId, modulo as any, limit);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error obteniendo logs por módulo:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs del módulo',
      error: error.message,
    });
  }
};

/**
 * Obtener logs de errores
 * GET /api/logs/audit/errors
 */
export const getErrors = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const fechaDesde = req.query.fechaDesde ? new Date(req.query.fechaDesde as string) : undefined;
    const fechaHasta = req.query.fechaHasta ? new Date(req.query.fechaHasta as string) : undefined;

    const logs = await auditLogService.findErrors(empresaId, fechaDesde, fechaHasta);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error obteniendo logs de errores:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs de errores',
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas de auditoría
 * GET /api/logs/audit/stats
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;

    const validation = validateDTO(GetStatsSchema, {
      empresaId,
      fechaDesde: req.query.fechaDesde,
      fechaHasta: req.query.fechaHasta,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: formatZodErrors(validation.errors),
      });
    }

    const stats = await auditLogService.getStats(
      empresaId,
      validation.data.fechaDesde,
      validation.data.fechaHasta
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message,
    });
  }
};

/**
 * Obtener actividad de usuarios
 * GET /api/logs/audit/activity
 */
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;

    const validation = validateDTO(GetStatsSchema, {
      empresaId,
      fechaDesde: req.query.fechaDesde,
      fechaHasta: req.query.fechaHasta,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: formatZodErrors(validation.errors),
      });
    }

    const activity = await auditLogService.getUserActivity(
      empresaId,
      validation.data.fechaDesde,
      validation.data.fechaHasta
    );

    res.json({
      success: true,
      data: activity,
    });
  } catch (error: any) {
    console.error('Error obteniendo actividad de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo actividad',
      error: error.message,
    });
  }
};

/**
 * Obtener mis logs (logs del usuario autenticado)
 * GET /api/logs/audit/me
 */
export const getMyLogs = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const usuarioId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await auditLogService.findByUser(empresaId, usuarioId, limit);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error obteniendo mis logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tus logs',
      error: error.message,
    });
  }
};

/**
 * Exportar logs de auditoría (CSV o JSON)
 * GET /api/logs/audit/export
 */

export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const validation = validateDTO(ExportAuditLogSchema, {
      ...req.query,
      empresaId,
    });
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de exportación inválidos',
        errors: formatZodErrors(validation.errors),
      });
    }

    const queryData = validation.data;
    
    // Construir el objeto con valores garantizados (nunca undefined)
    const result = await auditLogService.findAll({
      empresaId: queryData.empresaId,
      usuarioId: queryData.usuarioId,
      accion: queryData.accion,
      modulo: queryData.modulo,
      entidadTipo: queryData.entidadTipo,
      entidadId: queryData.entidadId,
      resultado: queryData.resultado,
      fechaDesde: queryData.fechaDesde,
      fechaHasta: queryData.fechaHasta,
      page: 1,
      limit: queryData.limit ?? 10000,
      sortBy: queryData.sortBy ?? 'timestamp',
      sortOrder: queryData.sortOrder ?? 'desc',
    });
    
    const format = queryData.format ?? 'json';
    
    if (format === 'csv') {
      const csv = convertToCSV(result.data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
      res.json({
        success: true,
        data: result.data,
        total: result.pagination.total,
        exportedAt: new Date(),
      });
    }
  } catch (error: any) {
    console.error('Error exportando audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error exportando logs',
      error: error.message,
    });
  }
};

/**
 * Convertir logs a formato CSV
 */
const convertToCSV = (logs: any[]): string => {
  if (logs.length === 0) return '';

  const headers = [
    'Timestamp',
    'Acción',
    'Módulo',
    'Descripción',
    'Usuario',
    'Email',
    'IP',
    'Resultado',
  ];

  const rows = logs.map((log) => [
    new Date(log.timestamp).toISOString(),
    log.accion,
    log.modulo,
    log.descripcion,
    log.usuarioId ? `${log.usuarioId.nombre} ${log.usuarioId.apellidos}` : 'N/A',
    log.usuarioId?.email || 'N/A',
    log.ip,
    log.resultado,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
};