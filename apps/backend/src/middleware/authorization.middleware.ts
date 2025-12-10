// apps/backend/src/middleware/authorization.middleware.ts

import { Request, Response, NextFunction } from 'express';
import {
  Resource,
  Action,
  Role,
  hasPermission,
  hasRoleLevel,
} from '../types/permissions.types';
import Usuario from '../models/Usuario';
import mongoose from 'mongoose';

/**
 * Middleware para verificar permisos sobre un recurso específico
 * @param resource - El recurso al que se intenta acceder
 * @param action - La acción que se intenta realizar
 */
export const requirePermission = (resource: Resource, action: Action) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.userRole as Role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      // Verificar si el rol tiene el permiso
      if (!hasPermission(userRole, resource, action)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para realizar esta acción',
          required: {
            resource,
            action,
          },
          yourRole: userRole,
        });
      }

      next();
    } catch (error: any) {
      console.error('Error en requirePermission:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando permisos',
        error: error.message,
      });
    }
  };
};

/**
 * Middleware para verificar nivel de rol mínimo requerido
 * @param requiredRole - El rol mínimo requerido
 */
export const requireRoleLevel = (requiredRole: Role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.userRole as Role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!hasRoleLevel(userRole, requiredRole)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes el nivel de permisos suficiente',
          requiredRole,
          yourRole: userRole,
        });
      }

      next();
    } catch (error: any) {
      console.error('Error en requireRoleLevel:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando nivel de rol',
        error: error.message,
      });
    }
  };
};

/**
 * Middleware para verificar ownership de un recurso
 * Verifica que el recurso pertenezca a la misma empresa del usuario
 * @param Model - El modelo de Mongoose a verificar
 * @param paramName - El nombre del parámetro que contiene el ID (por defecto 'id')
 */
export const requireOwnership = (Model: any, paramName: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const empresaId = req.empresaId;
      const resourceId = req.params[paramName];

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `Parámetro ${paramName} requerido`,
        });
      }

      // Validar formato de ID
      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de recurso inválido',
        });
      }

      // Buscar el recurso
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Recurso no encontrado',
        });
      }

      // Verificar que pertenece a la empresa del usuario
      // Algunos modelos usan 'empresaId', otros pueden usar campos diferentes
      const resourceEmpresaId = String(resource.empresaId || resource.empresa || resource._empresaId);

      if (resourceEmpresaId !== empresaId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este recurso',
          reason: 'El recurso no pertenece a tu empresa',
        });
      }

      // Añadir el recurso al request para evitar buscarlo de nuevo
      req.resource = resource;

      next();
    } catch (error: any) {
      console.error('Error en requireOwnership:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando ownership',
        error: error.message,
      });
    }
  };
};

/**
 * Middleware para verificar que el usuario puede modificar otro usuario
 * Solo permite:
 * - Superadmin puede modificar a todos
 * - Admin puede modificar usuarios de su empresa (excepto superadmins)
 * - Los usuarios pueden modificarse a sí mismos (datos básicos)
 */
export const requireUserModificationPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.userId;
    const currentUserRole = req.userRole as Role;
    const currentUserEmpresaId = req.empresaId;
    const targetUserId = req.params.id || req.body.userId;

    if (!currentUserId || !currentUserRole) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    // Si es el mismo usuario, puede modificar datos básicos
    if (currentUserId === targetUserId) {
      // Verificar que solo modifica campos permitidos
      const allowedSelfFields = ['nombre', 'apellidos', 'telefono', 'avatar', 'preferencias'];
      const bodyKeys = Object.keys(req.body);
      const hasRestrictedFields = bodyKeys.some(
        (key) => !allowedSelfFields.includes(key)
      );

      if (hasRestrictedFields) {
        return res.status(403).json({
          success: false,
          message: 'No puedes modificar estos campos en tu propio perfil',
          allowedFields: allowedSelfFields,
        });
      }

      return next();
    }

    // Buscar el usuario objetivo
    const targetUser = await Usuario.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Superadmin puede modificar a todos
    if (currentUserRole === 'superadmin') {
      return next();
    }

    // Admin solo puede modificar usuarios de su empresa
    if (currentUserRole === 'admin') {
      // Verificar que el usuario objetivo no sea superadmin
      if (targetUser.rol === 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'No puedes modificar un superadmin',
        });
      }

      // Verificar que pertenece a la misma empresa
      if (String(targetUser.empresaId) !== currentUserEmpresaId) {
        return res.status(403).json({
          success: false,
          message: 'El usuario no pertenece a tu empresa',
        });
      }

      return next();
    }

    // Otros roles no pueden modificar usuarios
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para modificar usuarios',
    });
  } catch (error: any) {
    console.error('Error en requireUserModificationPermission:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando permisos de modificación',
      error: error.message,
    });
  }
};

/**
 * Middleware que combina autenticación + verificación de empresa
 * Útil para endpoints que requieren ambas validaciones
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId || !req.empresaId) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado',
    });
  }
  next();
};

/**
 * Middleware simplificado para verificar roles permitidos
 * @param allowedRoles - Array de roles permitidos
 */
export const roleMiddleware = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.userRole as Role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para realizar esta acción',
          requiredRoles: allowedRoles,
          yourRole: userRole,
        });
      }

      next();
    } catch (error: any) {
      console.error('Error en roleMiddleware:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando rol',
        error: error.message,
      });
    }
  };
};

// Extender el tipo Request para incluir el recurso
declare global {
  namespace Express {
    interface Request {
      resource?: any;
    }
  }
}
