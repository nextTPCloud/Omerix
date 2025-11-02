// backend/src/modules/logs/controllers/fiscal-log.controller.ts

import { Request, Response } from 'express';
import fiscalLogService from '../services/fiscal-log.service';
import {
  CreateFiscalLogSchema,
  QueryFiscalLogSchema,
  VerifyChainSchema,
  GetStatsSchema,
  validateDTO,
  formatZodErrors,
  ExportFiscalLogSchema,
  } from '../dto/create-audit-log.dto';

// ============================================
// CONTROLADORES DE FISCAL LOGS
// ============================================

/**
 * Crear un nuevo log fiscal
 * POST /api/logs/fiscal
 */
export const createFiscalLog = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;

    // Validar datos
    const validation = validateDTO(CreateFiscalLogSchema, {
      ...req.body,
      empresaId,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: formatZodErrors(validation.errors),
      });
    }

    const log = await fiscalLogService.create(validation.data);

    res.status(201).json({
      success: true,
      message: '✅ Log fiscal creado correctamente',
      data: log,
    });
  } catch (error: any) {
    console.error('Error creando log fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando log fiscal',
      error: error.message,
    });
  }
};

/**
 * Crear log fiscal con TicketBAI
 * POST /api/logs/fiscal/ticketbai
 */
export const createWithTicketBAI = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const empresaNIF = (req as any).empresaNIF; // Asumiendo que viene del middleware

    const validation = validateDTO(CreateFiscalLogSchema, {
      ...req.body,
      empresaId,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: formatZodErrors(validation.errors),
      });
    }

    const log = await fiscalLogService.createWithTicketBAI(
      validation.data,
      empresaNIF
    );

    res.status(201).json({
      success: true,
      message: '✅ Log fiscal con TicketBAI creado',
      data: log,
    });
  } catch (error: any) {
    console.error('Error creando log con TicketBAI:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando log con TicketBAI',
      error: error.message,
    });
  }
};

/**
 * Crear log fiscal con Verifactu
 * POST /api/logs/fiscal/verifactu
 */
export const createWithVerifactu = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const empresaNIF = (req as any).empresaNIF;

    const validation = validateDTO(CreateFiscalLogSchema, {
      ...req.body,
      empresaId,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: formatZodErrors(validation.errors),
      });
    }

    const log = await fiscalLogService.createWithVerifactu(
      validation.data,
      empresaNIF
    );

    res.status(201).json({
      success: true,
      message: '✅ Log fiscal con Verifactu creado',
      data: log,
    });
  } catch (error: any) {
    console.error('Error creando log con Verifactu:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando log con Verifactu',
      error: error.message,
    });
  }
};

/**
 * Obtener todos los logs fiscales con filtros
 * GET /api/logs/fiscal
 */
export const getFiscalLogs = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;

    // Validar query params
    const validation = validateDTO(QueryFiscalLogSchema, {
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
    const result = await fiscalLogService.findAll({
      empresaId: queryData.empresaId,
      documentoTipo: queryData.documentoTipo,
      numeroDocumento: queryData.numeroDocumento,
      serie: queryData.serie,
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
    console.error('Error obteniendo logs fiscales:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs fiscales',
      error: error.message,
    });
  }
};

/**
 * Obtener un log fiscal por ID
 * GET /api/logs/fiscal/:id
 */
export const getFiscalLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const log = await fiscalLogService.findById(id);

    res.json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error('Error obteniendo log fiscal:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Log no encontrado',
    });
  }
};

/**
 * Buscar log por número de documento
 * GET /api/logs/fiscal/documento/:numero
 */
export const getByNumeroDocumento = async (req: Request, res: Response) => {
  try {
    const { numero } = req.params;
    const empresaId = (req as any).empresaId;

    const log = await fiscalLogService.findByNumeroDocumento(empresaId, numero);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado',
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error('Error buscando documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error buscando documento',
      error: error.message,
    });
  }
};

/**
 * Obtener logs por tipo de documento
 * GET /api/logs/fiscal/tipo/:tipo
 */
export const getByDocumentType = async (req: Request, res: Response) => {
  try {
    const { tipo } = req.params;
    const empresaId = (req as any).empresaId;
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await fiscalLogService.findByDocumentType(
      empresaId,
      tipo as any,
      limit
    );

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error obteniendo logs por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs',
      error: error.message,
    });
  }
};

/**
 * Verificar integridad de un documento específico
 * GET /api/logs/fiscal/:id/verificar
 */
export const verificarDocumento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resultado = await fiscalLogService.verificarDocumento(id);

    const statusCode = resultado.isValid ? 200 : 409;

    res.status(statusCode).json({
      success: resultado.isValid,
      data: resultado,
    });
  } catch (error: any) {
    console.error('Error verificando documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando documento',
      error: error.message,
    });
  }
};

/**
 * Verificar integridad de la cadena blockchain
 * POST /api/logs/fiscal/verificar-cadena
 */
export const verificarCadena = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;

    const validation = validateDTO(VerifyChainSchema, {
      empresaId,
      fechaDesde: req.body.fechaDesde,
      fechaHasta: req.body.fechaHasta,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: formatZodErrors(validation.errors),
      });
    }

    const resultado = await fiscalLogService.verificarCadena(
      empresaId,
      validation.data.fechaDesde,
      validation.data.fechaHasta
    );

    const statusCode = resultado.isValid ? 200 : 409;

    res.status(statusCode).json({
      success: resultado.isValid,
      data: resultado,
    });
  } catch (error: any) {
    console.error('Error verificando cadena:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando cadena',
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas fiscales
 * GET /api/logs/fiscal/stats
 */
export const getEstadisticas = async (req: Request, res: Response) => {
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

    const stats = await fiscalLogService.getEstadisticas(
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
 * Contar documentos por periodo
 * GET /api/logs/fiscal/periodo
 */
export const contarPorPeriodo = async (req: Request, res: Response) => {
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

    const resultado = await fiscalLogService.contarPorPeriodo(
      empresaId,
      validation.data.fechaDesde,
      validation.data.fechaHasta
    );

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    console.error('Error contando por periodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error contando documentos',
      error: error.message,
    });
  }
};

/**
 * Obtener logs próximos a expirar retención
 * GET /api/logs/fiscal/expirando
 */
export const getProximosAExpirar = async (req: Request, res: Response) => {
  try {
    const diasAntes = parseInt(req.query.diasAntes as string) || 30;

    const logs = await fiscalLogService.getLogsProximosAExpirar(diasAntes);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
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
 * Exportar logs para auditoría
 * GET /api/logs/fiscal/export/auditoria
 */
export const exportarParaAuditoria = async (req: Request, res: Response) => {
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

    const resultado = await fiscalLogService.exportarParaAuditoria(
      empresaId,
      validation.data.fechaDesde,
      validation.data.fechaHasta
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=auditoria-fiscal.json'
    );
    res.json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    console.error('Error exportando para auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error exportando datos',
      error: error.message,
    });
  }
};

/**
 * Obtener resumen fiscal anual
 * GET /api/logs/fiscal/resumen/:year
 */
export const getResumenFiscal = async (req: Request, res: Response) => {
  try {
    const { year } = req.params;
    const empresaId = (req as any).empresaId;

    const resumen = await fiscalLogService.getResumenFiscal(
      empresaId,
      parseInt(year)
    );

    res.json({
      success: true,
      data: resumen,
    });
  } catch (error: any) {
    console.error('Error obteniendo resumen fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo resumen',
      error: error.message,
    });
  }
};

/**
 * Consultar información de retención
 * GET /api/logs/fiscal/retencion
 */
export const consultarRetencion = async (req: Request, res: Response) => {
  try {
    const info = await fiscalLogService.consultarRetencion();

    res.json({
      success: true,
      data: info,
    });
  } catch (error: any) {
    console.error('Error consultando retención:', error);
    res.status(500).json({
      success: false,
      message: 'Error consultando retención',
      error: error.message,
    });
  }
};

/**
 * Exportar logs fiscales (JSON)
 * GET /api/logs/fiscal/export
 */
export const exportFiscalLogs = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;

    // Validar con el schema de exportación
    const validation = validateDTO(ExportFiscalLogSchema, {
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

    const result = await fiscalLogService.findAll({
      empresaId: queryData.empresaId,
      documentoTipo: queryData.documentoTipo,
      numeroDocumento: queryData.numeroDocumento,
      serie: queryData.serie,
      fechaDesde: queryData.fechaDesde,
      fechaHasta: queryData.fechaHasta,
      page: 1,
      limit: queryData.limit ?? 10000,
      sortBy: queryData.sortBy ?? 'timestamp',
      sortOrder: queryData.sortOrder ?? 'desc',
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=fiscal-logs.json'
    );
    res.json({
      success: true,
      data: result.data,
      total: result.pagination.total,
      exportedAt: new Date(),
    });
  } catch (error: any) {
    console.error('Error exportando logs fiscales:', error);
    res.status(500).json({
      success: false,
      message: 'Error exportando logs',
      error: error.message,
    });
  }
};