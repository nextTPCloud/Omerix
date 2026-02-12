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

  // Exportaciones (antes de las rutas específicas)
  if (url.includes('/export')) return LogAction.DATA_EXPORT;
  // Operaciones masivas
  if (url.includes('/bulk')) return LogAction.BULK_OPERATION;

  // Usuarios
  if (url.includes('/api/users') || url.includes('/api/usuarios')) {
    if (method === 'POST') return LogAction.USER_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.USER_UPDATE;
    if (method === 'DELETE') return LogAction.USER_DELETE;
  }

  // Productos
  if (url.includes('/api/productos')) {
    if (method === 'POST') return LogAction.PRODUCT_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.PRODUCT_UPDATE;
    if (method === 'DELETE') return LogAction.PRODUCT_DELETE;
  }

  // Clientes
  if (url.includes('/api/clientes')) {
    if (method === 'POST') return LogAction.CLIENT_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.CLIENT_UPDATE;
    if (method === 'DELETE') return LogAction.CLIENT_DELETE;
  }

  // Facturas (ventas) - antes de facturas-compra
  if (url.includes('/api/facturas') && !url.includes('/api/facturas-compra')) {
    if (method === 'POST') return LogAction.INVOICE_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.INVOICE_RECTIFY;
    if (method === 'DELETE') return LogAction.INVOICE_CANCEL;
  }

  // Albaranes (ventas) - antes de albaranes-compra
  if (url.includes('/api/albaranes') && !url.includes('/api/albaranes-compra')) {
    if (method === 'POST') return LogAction.DELIVERY_NOTE_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.DELIVERY_NOTE_UPDATE;
    if (method === 'DELETE') return LogAction.DELIVERY_NOTE_DELETE;
  }

  // Pedidos (ventas) - antes de pedidos-compra
  if (url.includes('/api/pedidos') && !url.includes('/api/pedidos-compra')) {
    if (method === 'POST') return LogAction.ORDER_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.ORDER_UPDATE;
    if (method === 'DELETE') return LogAction.ORDER_DELETE;
  }

  // Presupuestos (ventas) - antes de presupuestos-compra
  if (url.includes('/api/presupuestos') && !url.includes('/api/presupuestos-compra')) {
    if (method === 'POST') return LogAction.QUOTE_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.QUOTE_UPDATE;
    if (method === 'DELETE') return LogAction.QUOTE_DELETE;
  }

  // Proveedores
  if (url.includes('/api/proveedores')) {
    if (method === 'POST') return LogAction.SUPPLIER_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.SUPPLIER_UPDATE;
    if (method === 'DELETE') return LogAction.SUPPLIER_DELETE;
  }

  // Compras (facturas-compra, pedidos-compra, albaranes-compra, presupuestos-compra)
  if (url.includes('/api/facturas-compra') || url.includes('/api/pedidos-compra') ||
      url.includes('/api/albaranes-compra') || url.includes('/api/presupuestos-compra')) {
    if (method === 'POST') return LogAction.PURCHASE_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.PURCHASE_UPDATE;
    if (method === 'DELETE') return LogAction.PURCHASE_DELETE;
  }

  // Empresa
  if (url.includes('/api/empresa')) {
    if (method === 'PUT' || method === 'PATCH') return LogAction.COMPANY_UPDATE;
  }

  // Roles
  if (url.includes('/api/roles')) {
    if (method === 'POST') return LogAction.ROLE_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.ROLE_UPDATE;
    if (method === 'DELETE') return LogAction.ROLE_DELETE;
  }

  // Personal / RRHH
  if (url.includes('/api/personal')) {
    if (method === 'POST') return LogAction.EMPLOYEE_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.EMPLOYEE_UPDATE;
    if (method === 'DELETE') return LogAction.EMPLOYEE_DELETE;
  }
  if (url.includes('/api/fichajes')) {
    return LogAction.ATTENDANCE_CLOCK;
  }

  // Proyectos
  if (url.includes('/api/proyectos')) {
    if (method === 'POST') return LogAction.PROJECT_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.PROJECT_UPDATE;
    if (method === 'DELETE') return LogAction.PROJECT_DELETE;
  }

  // Partes de trabajo
  if (url.includes('/api/partes-trabajo')) {
    if (method === 'POST') return LogAction.WORK_ORDER_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.WORK_ORDER_UPDATE;
    if (method === 'DELETE') return LogAction.WORK_ORDER_DELETE;
  }

  // Stock / Inventario
  if (url.includes('/api/stock')) return LogAction.STOCK_ADJUST;
  if (url.includes('/api/traspasos')) {
    if (method === 'POST') return LogAction.TRANSFER_CREATE;
  }
  if (url.includes('/api/inventarios')) {
    if (method === 'POST') return LogAction.INVENTORY_CREATE;
  }

  // Tesorería
  if (url.includes('/api/vencimientos') || url.includes('/api/pagares') ||
      url.includes('/api/recibos') || url.includes('/api/movimientos-bancarios') ||
      url.includes('/api/conciliacion') || url.includes('/api/previsiones') ||
      url.includes('/api/cuentas-bancarias')) {
    if (url.includes('/api/recibos') && method === 'POST') return LogAction.RECEIPT_CREATE;
    if (method === 'POST') return LogAction.PAYMENT_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.PAYMENT_UPDATE;
  }

  // CRM
  if (url.includes('/api/crm')) {
    if (url.includes('/leads')) {
      if (method === 'POST') return LogAction.LEAD_CREATE;
      if (method === 'PUT' || method === 'PATCH') return LogAction.LEAD_UPDATE;
    }
    if (url.includes('/oportunidades')) {
      if (method === 'POST') return LogAction.OPPORTUNITY_CREATE;
      if (method === 'PUT' || method === 'PATCH') return LogAction.OPPORTUNITY_UPDATE;
    }
  }

  // TPV
  if (url.includes('/api/tpv')) {
    if (method === 'POST') return LogAction.TPV_SALE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.TPV_CONFIG;
  }

  // Contabilidad
  if (url.includes('/api/contabilidad')) {
    if (method === 'POST') return LogAction.RECORD_CREATE;
    if (method === 'PUT' || method === 'PATCH') return LogAction.RECORD_UPDATE;
    if (method === 'DELETE') return LogAction.RECORD_DELETE;
  }

  // Configuración general (series-documentos, tipos-impuesto, estados, etc.)
  if (url.includes('/api/series-documentos') || url.includes('/api/tipos-impuesto') ||
      url.includes('/api/estados') || url.includes('/api/situaciones') ||
      url.includes('/api/clasificaciones') || url.includes('/api/configuraciones') ||
      url.includes('/api/plantillas-documento') || url.includes('/api/formas-pago') ||
      url.includes('/api/terminos-pago')) {
    return LogAction.CONFIG_UPDATE;
  }

  // Fallback genérico para escritura
  if (method === 'POST') return LogAction.RECORD_CREATE;
  if (method === 'PUT' || method === 'PATCH') return LogAction.RECORD_UPDATE;
  if (method === 'DELETE') return LogAction.RECORD_DELETE;

  return null;
};

/**
 * Mapear URL a LogModule
 */
const mapURLToModule = (url: string): LogModule | null => {
  if (url.includes('/api/auth')) return LogModule.AUTH;
  if (url.includes('/api/users') || url.includes('/api/usuarios')) return LogModule.USERS;
  if (url.includes('/api/empresa')) return LogModule.COMPANY;
  if (url.includes('/api/productos') || url.includes('/api/familias') || url.includes('/api/variantes')) return LogModule.PRODUCTS;
  if (url.includes('/api/clientes')) return LogModule.CLIENTS;

  // Facturas de compra antes que facturas de venta
  if (url.includes('/api/facturas-compra') || url.includes('/api/pedidos-compra') ||
      url.includes('/api/albaranes-compra') || url.includes('/api/presupuestos-compra')) return LogModule.PURCHASES;
  if (url.includes('/api/proveedores')) return LogModule.SUPPLIERS;

  // Documentos de venta
  if (url.includes('/api/facturas')) return LogModule.INVOICES;
  if (url.includes('/api/albaranes')) return LogModule.DELIVERY_NOTES;
  if (url.includes('/api/pedidos')) return LogModule.ORDERS;
  if (url.includes('/api/presupuestos')) return LogModule.QUOTES;

  // Stock / Inventario
  if (url.includes('/api/stock') || url.includes('/api/almacenes') ||
      url.includes('/api/traspasos') || url.includes('/api/inventarios')) return LogModule.STOCK;

  // RRHH
  if (url.includes('/api/personal') || url.includes('/api/departamentos') ||
      url.includes('/api/turnos') || url.includes('/api/calendarios') ||
      url.includes('/api/fichajes') || url.includes('/api/terminales')) return LogModule.HR;

  // Tesorería
  if (url.includes('/api/vencimientos') || url.includes('/api/pagares') ||
      url.includes('/api/recibos') || url.includes('/api/movimientos-bancarios') ||
      url.includes('/api/conciliacion') || url.includes('/api/previsiones') ||
      url.includes('/api/cuentas-bancarias') || url.includes('/api/formas-pago') ||
      url.includes('/api/terminos-pago')) return LogModule.TREASURY;

  // Contabilidad
  if (url.includes('/api/contabilidad')) return LogModule.ACCOUNTING;

  // CRM
  if (url.includes('/api/crm')) return LogModule.CRM;

  // Proyectos y partes de trabajo
  if (url.includes('/api/proyectos') || url.includes('/api/partes-trabajo') ||
      url.includes('/api/tipos-gasto') || url.includes('/api/maquinaria')) return LogModule.PROJECTS;

  // TPV y restauración
  if (url.includes('/api/tpv') || url.includes('/api/kiosk')) return LogModule.TPV;
  if (url.includes('/api/salones') || url.includes('/api/mesas') ||
      url.includes('/api/comandas-cocina') || url.includes('/api/camareros') ||
      url.includes('/api/reservas') || url.includes('/api/sugerencias') ||
      url.includes('/api/zonas-preparacion') || url.includes('/api/impresoras') ||
      url.includes('/api/alergenos') || url.includes('/api/modificadores') ||
      url.includes('/api/grupos-modificadores')) return LogModule.RESTAURANT;

  // Roles
  if (url.includes('/api/roles')) return LogModule.ROLES;

  // Informes
  if (url.includes('/api/informes') || url.includes('/api/reports') ||
      url.includes('/api/reportes')) return LogModule.REPORTS;

  // Configuración general
  if (url.includes('/api/series-documentos') || url.includes('/api/tipos-impuesto') ||
      url.includes('/api/estados') || url.includes('/api/situaciones') ||
      url.includes('/api/clasificaciones') || url.includes('/api/configuraciones') ||
      url.includes('/api/plantillas-documento') || url.includes('/api/agentes-comerciales') ||
      url.includes('/api/tarifas') || url.includes('/api/ofertas') ||
      url.includes('/api/precios') || url.includes('/api/certificados') ||
      url.includes('/api/verifactu') || url.includes('/api/facturae') ||
      url.includes('/api/dashboard') || url.includes('/api/licencias') ||
      url.includes('/api/pagos') || url.includes('/api/admin')) return LogModule.CONFIG;

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