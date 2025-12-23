import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { AuthorizationHelper } from '../utils/authorization.helper';
import Usuario from '../modules/usuarios/Usuario';
import {
  Resource,
  Action,
  ModuloAcceso,
  hasPermission,
  canAccesoModulo,
  IUsuarioConPermisos,
  Role,
} from '../types/permissions.types';
import { IPermisosEspeciales } from '../modules/roles/Rol';

// Extender el tipo Request para incluir datos del usuario autenticado
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      usuarioId?: string; // Alias para compatibilidad
      empresaId?: string;
      userEmail?: string;
      userRole?: string;
      user?: any; // Usuario completo (opcional)
      usuarioNombre?: string; // Nombre del usuario para auditoría
    }
  }
}

/**
 * Middleware para verificar JWT y autenticar usuario
 * Incluye validaciones de seguridad adicionales
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

    // Validar que el token no esté vacío
    if (!token || token.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    // Verificar token
    let payload: JWTPayload;
    try {
      payload = verifyToken(token);
    } catch (error: any) {
      console.error('❌ Error verificando token:', error.message);
      console.error('❌ Token recibido (primeros 50 chars):', token.substring(0, 50) + '...');
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        error: error.message === 'jwt expired' ? 'Token expirado' : 'Token inválido',
      });
    }

    // Validar que el payload contenga los datos necesarios
    if (!payload.userId || !payload.empresaId || !payload.rol) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido: datos incompletos',
      });
    }

    // Validar formato de IDs
    if (!AuthorizationHelper.isValidObjectId(payload.userId)) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido: userId no válido',
      });
    }

    if (!AuthorizationHelper.isValidObjectId(payload.empresaId)) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido: empresaId no válido',
      });
    }

    // 🔒 VALIDACIÓN ADICIONAL: Verificar que el usuario aún existe y está activo
    const usuario = await Usuario.findById(payload.userId)
      .select('activo rol empresaId email personalId')
      .populate('personalId', 'nombre apellidos');

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario desactivado. Contacte al administrador.',
      });
    }

    // 🔒 VALIDACIÓN: Verificar que los datos del token coincidan con la BD
    if (String(usuario.empresaId) !== String(payload.empresaId)) {
      AuthorizationHelper.logSecurityEvent(
        payload.userId,
        'TOKEN_EMPRESA_MISMATCH',
        'auth',
        {
          tokenEmpresaId: payload.empresaId,
          dbEmpresaId: usuario.empresaId,
        }
      );

      return res.status(401).json({
        success: false,
        message: 'Token inválido: datos inconsistentes',
      });
    }

    // 🔒 RATE LIMITING POR USUARIO
    const rateLimitCheck = AuthorizationHelper.checkUserRateLimit(
      payload.userId,
      1000, // 1000 requests por ventana
      60000 // 1 minuto
    );

    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
        resetIn: rateLimitCheck.resetIn,
      });
    }

    // Añadir datos del usuario al request
    req.userId = payload.userId;
    req.usuarioId = payload.userId; // Alias para compatibilidad
    req.empresaId = String(payload.empresaId);
    req.userEmail = payload.email;
    req.userRole = payload.rol;
    req.user = usuario; // Usuario completo para evitar consultas adicionales
    // Nombre del usuario para auditoría (usar personal si existe, sino email)
    req.usuarioNombre = usuario.personalId
      ? `${(usuario as any).personalId?.nombre || ''} ${(usuario as any).personalId?.apellidos || ''}`.trim() || usuario.email
      : usuario.email;

    next();
  } catch (error: any) {
    console.error('❌ Error en authMiddleware:', error);
    res.status(500).json({
      success: false,
      message: 'Error en autenticación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

/**
 * Middleware para verificar acceso a un módulo específico
 * Verifica permisos especiales de acceso a módulos (accesoRRHH, accesoInformes, etc.)
 */
export const requireModuleAccess = (modulo: ModuloAcceso) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userRole) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      // Superadmin siempre tiene acceso
      if (req.userRole === 'superadmin' || req.userRole === 'admin') {
        return next();
      }

      // Construir objeto de usuario para verificar permisos
      const usuarioPermisos: IUsuarioConPermisos = {
        rol: req.userRole as Role,
        permisos: req.user?.permisos,
      };

      // Verificar acceso al módulo
      if (!canAccesoModulo(usuarioPermisos, modulo)) {
        return res.status(403).json({
          success: false,
          message: `No tienes acceso al módulo ${modulo.replace('acceso', '')}`,
          requiredPermission: modulo,
        });
      }

      next();
    } catch (error: any) {
      console.error('❌ Error en requireModuleAccess:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando permisos',
      });
    }
  };
};

/**
 * Middleware para verificar permiso sobre un recurso
 * Verifica si el usuario puede realizar una acción específica sobre un recurso
 */
export const requirePermission = (resource: Resource, action: Action) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userRole) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      // Superadmin siempre tiene acceso
      if (req.userRole === 'superadmin' || req.userRole === 'admin') {
        return next();
      }

      // Verificar permiso
      if (!hasPermission(req.userRole as Role, resource, action)) {
        return res.status(403).json({
          success: false,
          message: `No tienes permiso para ${action} en ${resource}`,
          requiredPermission: { resource, action },
        });
      }

      next();
    } catch (error: any) {
      console.error('❌ Error en requirePermission:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando permisos',
      });
    }
  };
};

/**
 * Middleware para verificar un permiso especial
 * Verifica permisos como verCostes, modificarPVP, exportarDatos, etc.
 */
export const requireSpecialPermission = (permiso: keyof IPermisosEspeciales) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userRole) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      // Superadmin siempre tiene acceso
      if (req.userRole === 'superadmin' || req.userRole === 'admin') {
        return next();
      }

      // Para permisos especiales, verificar en permisos del usuario
      const permisos = req.user?.permisos?.especiales;
      if (!permisos || !permisos[permiso]) {
        return res.status(403).json({
          success: false,
          message: `No tienes el permiso especial: ${permiso}`,
          requiredPermission: permiso,
        });
      }

      next();
    } catch (error: any) {
      console.error('❌ Error en requireSpecialPermission:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando permisos',
      });
    }
  };
};

/**
 * Middleware combinado: verifica acceso a módulo Y permiso sobre recurso
 */
export const requireModuleAndPermission = (
  modulo: ModuloAcceso,
  resource: Resource,
  action: Action
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userRole) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      // Superadmin/Admin siempre tiene acceso
      if (req.userRole === 'superadmin' || req.userRole === 'admin') {
        return next();
      }

      const usuarioPermisos: IUsuarioConPermisos = {
        rol: req.userRole as Role,
        permisos: req.user?.permisos,
      };

      // Verificar acceso al módulo
      if (!canAccesoModulo(usuarioPermisos, modulo)) {
        return res.status(403).json({
          success: false,
          message: `No tienes acceso al módulo ${modulo.replace('acceso', '')}`,
          requiredPermission: modulo,
        });
      }

      // Verificar permiso sobre el recurso
      if (!hasPermission(req.userRole as Role, resource, action)) {
        return res.status(403).json({
          success: false,
          message: `No tienes permiso para ${action} en ${resource}`,
          requiredPermission: { resource, action },
        });
      }

      next();
    } catch (error: any) {
      console.error('❌ Error en requireModuleAndPermission:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando permisos',
      });
    }
  };
};