// backend/src/utils/logger/winston.config.ts

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// ============================================
// CONFIGURACIÓN DE NIVELES Y COLORES
// ============================================

const logLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  },
  colors: {
    fatal: 'red bold',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
  },
};

winston.addColors(logLevels.colors);

// ============================================
// FORMATOS PERSONALIZADOS
// ============================================

// Formato para consola (desarrollo)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Si hay metadata adicional, mostrarla
    if (Object.keys(meta).length > 0) {
      msg += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return msg;
  })
);

// Formato para archivos (producción)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ============================================
// TRANSPORTES (DESTINOS DE LOGS)
// ============================================

const transports: winston.transport[] = [];

// 1. CONSOLA (siempre activa en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  );
}

// 2. ARCHIVO DE ERRORES (todos los entornos)
transports.push(
  new DailyRotateFile({
    filename: path.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '30d', // Retener 30 días
    zippedArchive: true,
  })
);

// 3. ARCHIVO COMBINADO (info, warn, error)
transports.push(
  new DailyRotateFile({
    filename: path.join('logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d', // Retener 14 días
    zippedArchive: true,
  })
);

// 4. ARCHIVO DE DEBUG (solo desarrollo)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'debug-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'debug',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '7d', // Retener 7 días
      zippedArchive: true,
    })
  );
}

// ============================================
// CREAR LOGGER
// ============================================

const logger = winston.createLogger({
  levels: logLevels.levels,
  transports,
  exitOnError: false,
});

// ============================================
// MÉTODOS DE AYUDA
// ============================================

/**
 * Log de información general
 */
const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

/**
 * Log de advertencia
 */
const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

/**
 * Log de error
 */
const logError = (message: string, error?: any, meta?: any) => {
  const errorData = {
    ...meta,
    error: error?.message,
    stack: error?.stack,
  };
  logger.error(message, errorData);
};

/**
 * Log de error fatal (crítico)
 */
const logFatal = (message: string, error?: any, meta?: any) => {
  const errorData = {
    ...meta,
    error: error?.message,
    stack: error?.stack,
  };
  logger.log('fatal', message, errorData);
};

/**
 * Log de debug (solo desarrollo)
 */
const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

/**
 * Log de operación HTTP
 */
const logHTTP = (req: any, res: any, duration?: number) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    statusCode: res.statusCode,
    duration: duration ? `${duration}ms` : undefined,
    userId: (req as any).userId,
    empresaId: (req as any).empresaId,
  };

  if (res.statusCode >= 500) {
    logger.error('HTTP Request', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

/**
 * Log de operación de base de datos
 */
const logDatabase = (
  operation: string,
  collection: string,
  meta?: any
) => {
  logger.info('Database Operation', {
    operation,
    collection,
    ...meta,
  });
};

/**
 * Log de operación fiscal (crítica)
 */
const logFiscal = (
  operation: string,
  documentType: string,
  documentId: string,
  meta?: any
) => {
  logger.info('Fiscal Operation', {
    operation,
    documentType,
    documentId,
    ...meta,
    critical: true,
  });
};

/**
 * Log de autenticación
 */
const logAuth = (
  event: string,
  userId?: string,
  success: boolean = true,
  meta?: any
) => {
  const level = success ? 'info' : 'warn';
  logger.log(level, `Auth: ${event}`, {
    userId,
    success,
    ...meta,
  });
};

/**
 * Log de operación crítica con contexto completo
 */
const logCritical = (
  message: string,
  context: {
    empresaId?: string;
    usuarioId?: string;
    accion: string;
    entidad?: string;
    ip?: string;
  }
) => {
  logger.log('fatal', message, {
    ...context,
    critical: true,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log de inicio de aplicación
 */
const logStartup = (port: number, env: string) => {
  logger.info('🚀 Servidor iniciado', {
    port,
    environment: env,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log de cierre de aplicación
 */
const logShutdown = (reason?: string) => {
  logger.info('🛑 Servidor detenido', {
    reason: reason || 'Normal shutdown',
    timestamp: new Date().toISOString(),
  });
};

// ============================================
// MIDDLEWARE PARA EXPRESS
// ============================================

/**
 * Middleware de logging HTTP para Express
 */
const httpLoggerMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();

  // Capturar cuando la respuesta termina
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logHTTP(req, res, duration);
  });

  next();
};

// ============================================
// MANEJADOR DE ERRORES NO CAPTURADOS
// ============================================

// Capturar errores no manejados
process.on('uncaughtException', (error: Error) => {
  logFatal('Uncaught Exception', error);
  // En producción, podrías querer reiniciar el proceso
  process.exit(1);
});

// Capturar promesas rechazadas no manejadas
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logFatal('Unhandled Promise Rejection', reason);
});

// ============================================
// EXPORTS
// ============================================

export default logger;

export {
  logger,
  logInfo,
  logWarn,
  logError,
  logFatal,
  logDebug,
  logHTTP,
  logDatabase,
  logFiscal,
  logAuth,
  logCritical,
  logStartup,
  logShutdown,
  httpLoggerMiddleware,
};