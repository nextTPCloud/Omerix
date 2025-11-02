// backend/src/modules/logs/logs.routes.ts

import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

// Controladores de Audit Logs
import {
  getAuditLogs,
  getAuditLogById,
  getLogsByEntity,
  getLogsByUser,
  getLogsByModule,
  getErrors,
  getStats,
  getUserActivity,
  getMyLogs,
  exportAuditLogs,
} from './controllers/audit-log.controller';

// Controladores de System Logs
import {
  getSystemLogs,
  getSystemLogById,
  getRecentErrors,
  getLogsByLevel,
  getLogsByModule as getSystemLogsByModule,
  getLogsByErrorCode,
  getErrorStats,
  getModuleStats,
  checkHealth,
  getHealthSummary,
  getRetentionStats,
  getExpiringLogs,
  getCleanupRecommendations,
  executeCleanup,
  exportSystemLogs,
} from './controllers/system-log.controller';

// Controladores de Fiscal Logs
import {
  createFiscalLog,
  createWithTicketBAI,
  createWithVerifactu,
  getFiscalLogs,
  getFiscalLogById,
  getByNumeroDocumento,
  getByDocumentType,
  verificarDocumento,
  verificarCadena,
  getEstadisticas,
  contarPorPeriodo,
  getProximosAExpirar,
  exportarParaAuditoria,
  getResumenFiscal,
  consultarRetencion,
  exportFiscalLogs,
} from './controllers/fiscal-log.controller';

const router = Router();

// ============================================
// MIDDLEWARE: Todas las rutas requieren autenticación
// ============================================
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS DE AUDIT LOGS
// ============================================

/**
 * @swagger
 * /api/logs/audit:
 *   get:
 *     summary: Obtener logs de auditoría con filtros
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: accion
 *         schema:
 *           type: string
 *       - in: query
 *         name: modulo
 *         schema:
 *           type: string
 *       - in: query
 *         name: resultado
 *         schema:
 *           type: string
 *           enum: [exito, fallo]
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de logs de auditoría
 */
router.get('/audit', getAuditLogs);

/**
 * @swagger
 * /api/logs/audit/me:
 *   get:
 *     summary: Obtener mis propios logs
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Logs del usuario autenticado
 */
router.get('/audit/me', getMyLogs);

/**
 * @swagger
 * /api/logs/audit/stats:
 *   get:
 *     summary: Obtener estadísticas de auditoría
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaDesde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Estadísticas de logs
 */
router.get('/audit/stats', getStats);

/**
 * @swagger
 * /api/logs/audit/activity:
 *   get:
 *     summary: Obtener actividad de usuarios
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaDesde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Actividad por usuario
 */
router.get('/audit/activity', getUserActivity);

/**
 * @swagger
 * /api/logs/audit/errors:
 *   get:
 *     summary: Obtener logs de errores
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de errores
 */
router.get('/audit/errors', getErrors);

/**
 * @swagger
 * /api/logs/audit/export:
 *   get:
 *     summary: Exportar logs de auditoría
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Archivo de exportación
 */
router.get('/audit/export', exportAuditLogs);

/**
 * @swagger
 * /api/logs/audit/entity/{tipo}/{id}:
 *   get:
 *     summary: Obtener logs de una entidad específica
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logs de la entidad
 */
router.get('/audit/entity/:tipo/:id', getLogsByEntity);

/**
 * @swagger
 * /api/logs/audit/user/{userId}:
 *   get:
 *     summary: Obtener logs de un usuario
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Logs del usuario
 */
router.get('/audit/user/:userId', getLogsByUser);

/**
 * @swagger
 * /api/logs/audit/module/{modulo}:
 *   get:
 *     summary: Obtener logs por módulo
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modulo
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Logs del módulo
 */
router.get('/audit/module/:modulo', getLogsByModule);

/**
 * @swagger
 * /api/logs/audit/{id}:
 *   get:
 *     summary: Obtener detalle de un log de auditoría
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle del log
 *       404:
 *         description: Log no encontrado
 */
router.get('/audit/:id', getAuditLogById);

// ============================================
// RUTAS DE SYSTEM LOGS (Solo Admin)
// ============================================

/**
 * @swagger
 * /api/logs/system/health:
 *   get:
 *     summary: Verificar salud del sistema
 *     tags: [System Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sistema saludable
 *       503:
 *         description: Sistema en estado crítico
 */
router.get('/system/health', checkHealth);

/**
 * @swagger
 * /api/logs/system/health/summary:
 *   get:
 *     summary: Obtener resumen completo de salud
 *     tags: [System Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de salud
 */
router.get('/system/health/summary', getHealthSummary);

/**
 * @swagger
 * /api/logs/system:
 *   get:
 *     summary: Obtener logs de sistema
 *     tags: [System Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nivel
 *         schema:
 *           type: string
 *           enum: [info, warn, error, fatal, debug]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista de logs de sistema
 */
router.get('/system', getSystemLogs);

/**
 * @swagger
 * /api/logs/system/errors/recent:
 *   get:
 *     summary: Obtener errores recientes
 *     tags: [System Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minutosAtras
 *         schema:
 *           type: integer
 *           default: 60
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Errores recientes
 */
router.get('/system/errors/recent', getRecentErrors);

/**
 * @swagger
 * /api/logs/system/stats/errors:
 *   get:
 *     summary: Estadísticas de errores
 *     tags: [System Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: horasAtras
 *         schema:
 *           type: integer
 *           default: 24
 *     responses:
 *       200:
 *         description: Estadísticas de errores
 */
router.get('/system/stats/errors', getErrorStats);

/**
 * @swagger
 * /api/logs/system/stats/modules:
 *   get:
 *     summary: Estadísticas por módulo
 *     tags: [System Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas por módulo
 */
router.get('/system/stats/modules', getModuleStats);

/**
 * @swagger
 * /api/logs/system/retention/stats:
 *   get:
 *     summary: Estadísticas de retención
 *     tags: [System Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de retención
 */
router.get('/system/retention/stats', getRetentionStats);

/**
 * @swagger
 * /api/logs/system/retention/expiring:
 *   get:
 *     summary: Logs próximos a expirar
 *     tags: [System Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: diasAntes
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Logs próximos a expirar
 */
router.get('/system/retention/expiring', getExpiringLogs);

/**
 * @swagger
 * /api/logs/system/retention/recommendations:
 *   get:
 *     summary: Recomendaciones de limpieza
 *     tags: [System Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recomendaciones
 */
router.get('/system/retention/recommendations', getCleanupRecommendations);

/**
 * @swagger
 * /api/logs/system/retention/cleanup:
 *   post:
 *     summary: Ejecutar limpieza de logs (Solo Admin)
 *     tags: [System Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Limpieza ejecutada
 *       403:
 *         description: Sin permisos
 */
router.post('/system/retention/cleanup', executeCleanup);

/**
 * @swagger
 * /api/logs/system/export:
 *   get:
 *     summary: Exportar logs de sistema
 *     tags: [System Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivo de exportación
 */
router.get('/system/export', exportSystemLogs);

router.get('/system/level/:nivel', getLogsByLevel);
router.get('/system/module/:modulo', getSystemLogsByModule);
router.get('/system/error-code/:code', getLogsByErrorCode);
router.get('/system/:id', getSystemLogById);

// ============================================
// NOTA: Rutas de Fiscal Logs se añadirán en el futuro
// cuando se integren con el módulo de ventas/facturas
// ============================================

// ============================================
// RUTAS DE FISCAL LOGS (INMUTABLES - BLOCKCHAIN)
// ============================================

/**
 * @swagger
 * /api/logs/fiscal:
 *   post:
 *     summary: Crear un nuevo log fiscal (inmutable)
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentoTipo
 *               - documentoId
 *               - numeroDocumento
 *               - importe
 *               - iva
 *               - total
 *             properties:
 *               documentoTipo:
 *                 type: string
 *                 enum: [factura, ticket, rectificativa, abono]
 *               documentoId:
 *                 type: string
 *               numeroDocumento:
 *                 type: string
 *               serie:
 *                 type: string
 *               importe:
 *                 type: number
 *               iva:
 *                 type: number
 *               total:
 *                 type: number
 *     responses:
 *       201:
 *         description: Log fiscal creado correctamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/fiscal', createFiscalLog);

/**
 * @swagger
 * /api/logs/fiscal/ticketbai:
 *   post:
 *     summary: Crear log fiscal con TicketBAI (País Vasco)
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Log con TicketBAI creado
 */
router.post('/fiscal/ticketbai', createWithTicketBAI);

/**
 * @swagger
 * /api/logs/fiscal/verifactu:
 *   post:
 *     summary: Crear log fiscal con Verifactu (Nacional)
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Log con Verifactu creado
 */
router.post('/fiscal/verifactu', createWithVerifactu);

/**
 * @swagger
 * /api/logs/fiscal:
 *   get:
 *     summary: Obtener logs fiscales con filtros
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: documentoTipo
 *         schema:
 *           type: string
 *           enum: [factura, ticket, rectificativa, abono]
 *       - in: query
 *         name: numeroDocumento
 *         schema:
 *           type: string
 *       - in: query
 *         name: serie
 *         schema:
 *           type: string
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de logs fiscales
 */
router.get('/fiscal', getFiscalLogs);

/**
 * @swagger
 * /api/logs/fiscal/stats:
 *   get:
 *     summary: Obtener estadísticas fiscales
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaDesde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Estadísticas fiscales
 */
router.get('/fiscal/stats', getEstadisticas);

/**
 * @swagger
 * /api/logs/fiscal/periodo:
 *   get:
 *     summary: Contar documentos por periodo
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaDesde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Conteo por periodo
 */
router.get('/fiscal/periodo', contarPorPeriodo);

/**
 * @swagger
 * /api/logs/fiscal/expirando:
 *   get:
 *     summary: Obtener logs próximos a expirar retención
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: diasAntes
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Logs próximos a expirar
 */
router.get('/fiscal/expirando', getProximosAExpirar);

/**
 * @swagger
 * /api/logs/fiscal/retencion:
 *   get:
 *     summary: Consultar información de retención
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información de retención
 */
router.get('/fiscal/retencion', consultarRetencion);

/**
 * @swagger
 * /api/logs/fiscal/export:
 *   get:
 *     summary: Exportar logs fiscales
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivo de exportación
 */
router.get('/fiscal/export', exportFiscalLogs);

/**
 * @swagger
 * /api/logs/fiscal/export/auditoria:
 *   get:
 *     summary: Exportar logs para auditoría (con verificación de blockchain)
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaDesde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Archivo de auditoría
 */
router.get('/fiscal/export/auditoria', exportarParaAuditoria);

/**
 * @swagger
 * /api/logs/fiscal/verificar-cadena:
 *   post:
 *     summary: Verificar integridad de la cadena blockchain
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fechaDesde:
 *                 type: string
 *                 format: date
 *               fechaHasta:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Cadena válida
 *       409:
 *         description: Cadena rota
 */
router.post('/fiscal/verificar-cadena', verificarCadena);

/**
 * @swagger
 * /api/logs/fiscal/resumen/{year}:
 *   get:
 *     summary: Obtener resumen fiscal anual
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resumen fiscal del año
 */
router.get('/fiscal/resumen/:year', getResumenFiscal);

/**
 * @swagger
 * /api/logs/fiscal/documento/{numero}:
 *   get:
 *     summary: Buscar log por número de documento
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Log fiscal encontrado
 *       404:
 *         description: Documento no encontrado
 */
router.get('/fiscal/documento/:numero', getByNumeroDocumento);

/**
 * @swagger
 * /api/logs/fiscal/tipo/{tipo}:
 *   get:
 *     summary: Obtener logs por tipo de documento
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [factura, ticket, rectificativa, abono]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Logs por tipo
 */
router.get('/fiscal/tipo/:tipo', getByDocumentType);

/**
 * @swagger
 * /api/logs/fiscal/{id}/verificar:
 *   get:
 *     summary: Verificar integridad de un documento específico
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documento verificado
 *       409:
 *         description: Documento alterado
 */
router.get('/fiscal/:id/verificar', verificarDocumento);

/**
 * @swagger
 * /api/logs/fiscal/{id}:
 *   get:
 *     summary: Obtener detalle de un log fiscal
 *     tags: [Fiscal Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle del log fiscal
 *       404:
 *         description: Log no encontrado
 */
router.get('/fiscal/:id', getFiscalLogById);

export default router;