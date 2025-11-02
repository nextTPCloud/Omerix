import winston from 'winston';
import path from 'path';
import { config } from './env';

/**
 * Formato personalizado para logs
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Formato para consola (más legible)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata, null, 2)}`;
    }
    
    return msg;
  })
);

/**
 * Configuración de transports
 */
const transports: winston.transport[] = [
  // Consola (siempre activa)
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Archivos de logs (solo en producción)
if (config.isProduction) {
  // Logs de errores
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Logs combinados
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

/**
 * Instancia del logger
 */
export const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  format: customFormat,
  transports,
  exitOnError: false,
});

/**
 * Stream para Morgan (HTTP logs)
 */
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

/**
 * Helper para logs de auditoría
 */
export const auditLogger = {
  log: (action: string, userId: string, empresaId: string, details: any) => {
    logger.info('AUDIT', {
      action,
      userId,
      empresaId,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

export default logger;