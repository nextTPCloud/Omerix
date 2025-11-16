import rateLimit from 'express-rate-limit';
import { logger } from '../config/logger';
import { config } from '../config/env';

/**
 * Rate limiter general
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.isDevelopment ? 1000 : 100,
  message: {
    success: false,
    message: 'Demasiadas peticiones, intente de nuevo más tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit excedido', {
      ip: req.ip,
      path: req.path,
    });
    
    res.status(429).json({
      success: false,
      message: 'Demasiadas peticiones. Por favor, espere antes de intentar de nuevo.',
    });
  },
});

/**
 * Rate limiter para autenticación
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isDevelopment ? 100 : 5,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn('Rate limit de auth excedido', {
      ip: req.ip,
      email: req.body?.email,
    });
    
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente.',
    });
  },
});

/**
 * Rate limiter para 2FA
 */
export const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isDevelopment ? 50 : 10,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn('Rate limit de 2FA excedido', {
      ip: req.ip,
    });
    
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos de verificación.',
    });
  },
});

/**
 * Rate limiter para registro
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: config.isDevelopment ? 100 : 3,
  handler: (req, res) => {
    logger.warn('Rate limit de registro excedido', {
      ip: req.ip,
      email: req.body?.email,
    });
    
    res.status(429).json({
      success: false,
      message: 'Límite de registros excedido.',
    });
  },
});

/**
 * Rate limiter para recuperación de contraseña
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: config.isDevelopment ? 50 : 3,
  handler: (req, res) => {
    logger.warn('Rate limit de recuperación de contraseña excedido', {
      ip: req.ip,
      email: req.body?.email,
    });

    res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes de recuperación. Por favor, intenta de nuevo en 1 hora.',
    });
  },
});

export default {
  generalLimiter,
  authLimiter,
  twoFactorLimiter,
  registerLimiter,
  passwordResetLimiter,
};