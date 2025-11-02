import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';

// Extender el tipo Request para incluir datos del usuario autenticado
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      empresaId?: string;
      userEmail?: string;
      userRole?: string;
    }
  }
}

/**
 * Middleware para verificar JWT y autenticar usuario
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token no proporcionado.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    let payload: JWTPayload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
      });
    }
    console.log('🔍 DEBUG PAYLOAD:', payload);
    console.log('🔍 DEBUG empresaId del payload:', payload.empresaId);
    console.log('🔍 DEBUG empresaId TYPE:', typeof payload.empresaId);

    // Añadir datos del usuario al request
    req.userId = payload.userId;
    req.empresaId = String(payload.empresaId);
    req.userEmail = payload.email;
    req.userRole = payload.rol;
    console.log('🔍 DEBUG req.empresaId después de asignar:', req.empresaId);
    next();
  } catch (error: any) {
    console.error('Error en authMiddleware:', error);
    res.status(500).json({
      success: false,
      message: 'Error en autenticación',
      error: error.message,
    });
  }
};

/**
 * Middleware para verificar roles específicos
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción',
        requiredRoles: roles,
        yourRole: req.userRole,
      });
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero añade datos si existe
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      try {
        const payload = verifyToken(token);
        req.userId = payload.userId;
        req.empresaId = payload.empresaId;
        req.userEmail = payload.email;
        req.userRole = payload.rol;
      } catch (error) {
        // Token inválido, pero no bloqueamos la petición
        console.log('Token inválido en optional auth, continuando sin auth');
      }
    }

    next();
  } catch (error: any) {
    next();
  }
};