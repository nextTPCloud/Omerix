// backend/src/modules/logs/middleware/log-capture.middleware.ts

import { Request, Response, NextFunction } from 'express';
import auditLogService from '../services/audit-log.service';
import systemLogService from '../services/system-log.service';
import { LogAction, LogModule, LogResult } from '../interfaces/log.interface';

// ============================================
// MIDDLEWARE DE CAPTURA AUTOMÁTICA DE LOGS
// ============================================

/**
 * Middleware global para capturar automáticamente todas las operaciones HTTP
 * Este middleware debe instalarse DESPUÉS de authMiddleware y tenantMiddleware
 */
export const logCaptureMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Guardar el método original res.json para interceptar respuestas
  const originalJson = res.json.bind(res);

  // Sobrescribir res.json para capturar la respuesta
  res.json = function (body: any) {
    const duration = Date.now() - startTime;

    // Capturar log después de enviar respuesta (no bloqueante)
    setImmediate(() => {
      captureHTTPLog(req, res, body, duration);
    });

    // Llamar al método original
    return originalJson(body);
  };

  next();
};

/**
 * Capturar log HTTP (llamado automáticamente por el middleware)
 */
const captureHTTPLog = async (
  req: Request,
  res: Response,
  responseBody: any,
  duration: number
) => {
  try {
    const method = req.method;
    const url = req.originalUrl || req.url;
    const statusCode = res.statusCode;
    const empresaId = (req as any).empresaId;
    const usuarioId = (req as any).userId;
    const ip = req.ip || req.connection.remoteAddress || '0.0.0.0';
    const userAgent = req.get('user-agent');

    // Excluir rutas que no necesitan log (health checks, etc.)
    if (shouldSkipLogging(url)) {
      return;
    }

    // Determinar si es un error
    const isError = statusCode >= 400;
    const isSuccess = statusCode >= 200 && statusCode < 300;

    // Log de sistema para todos los requests
    if (isError || duration > 5000) { // Solo errores o requests lentos
      await systemLogService.logHTTPRequest(req, statusCode, `${method} ${url}`);
    }

    // Log de auditoría solo para operaciones importantes
    if (shouldCreateAuditLog(method, url) && empresaId && usuarioId) {
      const accion = mapURLToAction(method, url);
      const modulo = mapURLToModule(url);

      if (accion && modulo) {
        await auditLogService.createFromRequest(
          req,
          accion,
          modulo,
          `${method} ${url}`,
          {
            resultado: isSuccess ? LogResult.SUCCESS : LogResult.FAILURE,
            mensajeError: isError ? responseBody?.message : undefined,
            metadata: {
              statusCode,
              duration: `${duration}ms`,
              method,
              url,
            },
          }
        );
      }
    }
  } catch (error) {
    // No fallar la request si hay error en logging
    console.error('Error capturando log HTTP:', error);
  }
};

/**
 * Determinar si una URL debe ser omitida del logging
 */
const shouldSkipLogging = (url: string): boolean => {
  const skipPatterns = [
    '/health',
    '/api-docs',
    '/favicon.ico',
    '/api/logs', // No crear logs de consultar logs
  ];

  return skipPatterns.some((pattern) => url.includes(pattern));
};

/**
 * Determinar si una operación debe crear un audit log
 */
const shouldCreateAuditLog = (method: string, url: string): boolean => {
  // Solo crear audit logs para operaciones de escritura
  const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!writeMethods.includes(method)) {
    return false;
  }

  // Y excluir algunas rutas
  const skipPatterns = [
    '/api/logs',
    '/api/auth/verify-2fa', // Ya se logea en el controller
    '/api/auth/resend-sms',
  ];

  return !skipPatterns.some((pattern) => url.includes(pattern));
};

/**
 * Mapear URL a LogAction
 */
const mapURLToAction = (method: string, url: string): LogAction | null => {
  // Auth
  if (url.includes('/api/auth/login')) return LogAction.USER_LOGIN;
  if (url.includes('/api/auth/logout')) return LogAction.USER_LOGOUT;
  if (url.includes('/api/auth/register')) return LogAction.USER_REGISTER;
  if (url.includes('/api/auth/2fa/enable')) return LogAction.TWO_FACTOR_ENABLE;
  if (url.includes('/api/auth/2fa/disable')) return LogAction.TWO_FACTOR_DISABLE;

  // Usuarios
  if (url.includes('/api/users') || url.includes('/api/usuarios')) {
    if (method === 'POST') return LogAction.USER_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.USER_UPDATE;
    if (method === 'DELETE') return LogAction.USER_DELETE;
  }

  // Productos
  if (url.includes('/api/products') || url.includes('/api/productos')) {
    if (method === 'POST') return LogAction.PRODUCT_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.PRODUCT_UPDATE;
    if (method === 'DELETE') return LogAction.PRODUCT_DELETE;
  }

  // Clientes
  if (url.includes('/api/clients') || url.includes('/api/clientes')) {
    if (method === 'POST') return LogAction.CLIENT_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.CLIENT_UPDATE;
    if (method === 'DELETE') return LogAction.CLIENT_DELETE;
  }

  // Ventas
  if (url.includes('/api/sales') || url.includes('/api/ventas')) {
    if (method === 'POST') return LogAction.SALE_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.SALE_UPDATE;
    if (method === 'DELETE') return LogAction.SALE_CANCEL;
  }

  // Facturas
  if (url.includes('/api/invoices') || url.includes('/api/facturas')) {
    if (method === 'POST') return LogAction.INVOICE_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.INVOICE_RECTIFY;
    if (method === 'DELETE') return LogAction.INVOICE_CANCEL;
  }

  // Empresa
  if (url.includes('/api/company') || url.includes('/api/empresa')) {
    if (method === 'PUT' || method === 'PATCH') return LogAction.COMPANY_UPDATE;
  }

  // Exportaciones
  if (url.includes('/export')) return LogAction.DATA_EXPORT;

  // Operaciones masivas
  if (url.includes('/bulk')) return LogAction.BULK_OPERATION;

  return null;
};

/**
 * Mapear URL a LogModule
 */
const mapURLToModule = (url: string): LogModule | null => {
  if (url.includes('/api/auth')) return LogModule.AUTH;
  if (url.includes('/api/users') || url.includes('/api/usuarios')) return LogModule.USERS;
  if (url.includes('/api/company') || url.includes('/api/empresa')) return LogModule.COMPANY;
  if (url.includes('/api/products') || url.includes('/api/productos')) return LogModule.PRODUCTS;
  if (url.includes('/api/clients') || url.includes('/api/clientes')) return LogModule.CLIENTS;
  if (url.includes('/api/sales') || url.includes('/api/ventas')) return LogModule.SALES;
  if (url.includes('/api/invoices') || url.includes('/api/facturas')) return LogModule.INVOICES;
  if (url.includes('/api/inventory') || url.includes('/api/inventario')) return LogModule.INVENTORY;
  if (url.includes('/api/reports') || url.includes('/api/reportes')) return LogModule.REPORTS;

  return LogModule.SYSTEM;
};

// ============================================
// MIDDLEWARE ESPECÍFICOS (para usar en rutas)
// ============================================

/**
 * Middleware para forzar log de auditoría en una ruta específica
 * Uso: router.post('/api/algo', forceAuditLog(LogAction.XXX, LogModule.XXX), controller)
 */
export const forceAuditLog = (accion: LogAction, modulo: LogModule, descripcion?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Guardar info para crear log después
    (req as any).forceAuditLog = {
      accion,
      modulo,
      descripcion: descripcion || `${accion} ejecutado`,
    };
    next();
  };
};

/**
 * Middleware para capturar datos antes de actualizar (para logs con before/after)
 */
export const captureBeforeData = (modelName: string, getIdFromRequest: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getIdFromRequest(req);
      
      // Aquí deberías buscar los datos actuales del modelo
      // Por ahora, guardamos solo el ID
      (req as any).beforeData = {
        modelName,
        id,
        // data: await Model.findById(id).lean(), // Implementar según tu modelo
      };
      
      next();
    } catch (error) {
      // Si falla, continuar sin los datos anteriores
      next();
    }
  };
};

/**
 * Middleware para crear log después de una operación exitosa
 */
export const logAfterSuccess = (accion: LogAction, modulo: LogModule) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Guardar el método original res.json
    const originalJson = res.json.bind(res);

    // Sobrescribir res.json
    res.json = function (body: any) {
      // Si la operación fue exitosa, crear log
      if (body.success && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            const beforeData = (req as any).beforeData;
            
            await auditLogService.createFromRequest(
              req,
              accion,
              modulo,
              `${accion} ejecutado`,
              {
                resultado: LogResult.SUCCESS,
                datosAnteriores: beforeData?.data,
                datosNuevos: body.data,
                entidadTipo: beforeData?.modelName,
                entidadId: beforeData?.id || body.data?.id,
              }
            );
          } catch (error) {
            console.error('Error creando log after success:', error);
          }
        });
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Middleware para omitir logging en rutas específicas
 */
export const skipLogging = (req: Request, res: Response, next: NextFunction) => {
  (req as any).skipLogging = true;
  next();
};

// ============================================
// EXPORTS
// ============================================

export default {
  logCaptureMiddleware,
  forceAuditLog,
  captureBeforeData,
  logAfterSuccess,
  skipLogging,
};