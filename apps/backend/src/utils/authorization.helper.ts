// apps/backend/src/utils/authorization.helper.ts

import mongoose from 'mongoose';
import { Role, hasPermission, hasRoleLevel, Resource, Action } from '../types/permissions.types';

/**
 * Clase helper para validaciones de autorización
 */
export class AuthorizationHelper {
  /**
   * Valida que un ID tenga formato válido de MongoDB ObjectId
   */
  static isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * Valida que múltiples IDs tengan formato válido
   */
  static areValidObjectIds(ids: string[]): boolean {
    return ids.every((id) => this.isValidObjectId(id));
  }

  /**
   * Valida que un recurso pertenezca a una empresa específica
   */
  static validateResourceOwnership(
    resource: any,
    empresaId: string,
    resourceName: string = 'recurso'
  ): { valid: boolean; error?: string } {
    if (!resource) {
      return {
        valid: false,
        error: `${resourceName} no encontrado`,
      };
    }

    const resourceEmpresaId = String(
      resource.empresaId || resource.empresa || resource._empresaId
    );

    if (resourceEmpresaId !== empresaId) {
      return {
        valid: false,
        error: `No tienes permisos para acceder a este ${resourceName}`,
      };
    }

    return { valid: true };
  }

  /**
   * Valida permisos de usuario para una acción en un recurso
   */
  static validateUserPermission(
    userRole: Role,
    resource: Resource,
    action: Action
  ): { valid: boolean; error?: string } {
    if (!hasPermission(userRole, resource, action)) {
      return {
        valid: false,
        error: `No tienes permisos para ${this.getActionText(action)} ${resource}`,
      };
    }

    return { valid: true };
  }

  /**
   * Valida nivel de rol de usuario
   */
  static validateRoleLevel(
    userRole: Role,
    requiredRole: Role
  ): { valid: boolean; error?: string } {
    if (!hasRoleLevel(userRole, requiredRole)) {
      return {
        valid: false,
        error: `Se requiere rol de nivel ${requiredRole} o superior`,
      };
    }

    return { valid: true };
  }

  /**
   * Valida que un usuario pueda acceder a recursos de una empresa
   */
  static validateEmpresaAccess(
    userEmpresaId: string,
    targetEmpresaId: string
  ): { valid: boolean; error?: string } {
    if (userEmpresaId !== targetEmpresaId) {
      return {
        valid: false,
        error: 'No tienes acceso a recursos de esta empresa',
      };
    }

    return { valid: true };
  }

  /**
   * Sanitiza campos sensibles antes de devolver al cliente
   */
  static sanitizeUserData(user: any): any {
    const sanitized = { ...user };
    delete sanitized.password;
    delete sanitized.twoFactorSecret;
    delete sanitized.resetPasswordToken;
    delete sanitized.resetPasswordExpires;
    return sanitized;
  }

  /**
   * Sanitiza múltiples objetos de usuario
   */
  static sanitizeUsersData(users: any[]): any[] {
    return users.map((user) => this.sanitizeUserData(user));
  }

  /**
   * Verifica si un usuario puede modificar otro usuario
   */
  static canModifyUser(
    currentUserRole: Role,
    currentUserEmpresaId: string,
    targetUserRole: Role,
    targetUserEmpresaId: string,
    isSelf: boolean = false
  ): { valid: boolean; error?: string; allowedFields?: string[] } {
    // Puede modificarse a sí mismo (campos limitados)
    if (isSelf) {
      return {
        valid: true,
        allowedFields: ['nombre', 'apellidos', 'telefono', 'avatar', 'preferencias'],
      };
    }

    // Superadmin puede modificar a todos
    if (currentUserRole === 'superadmin') {
      return { valid: true };
    }

    // Admin puede modificar usuarios de su empresa (excepto superadmin)
    if (currentUserRole === 'admin') {
      if (targetUserRole === 'superadmin') {
        return {
          valid: false,
          error: 'No puedes modificar un superadmin',
        };
      }

      if (currentUserEmpresaId !== targetUserEmpresaId) {
        return {
          valid: false,
          error: 'El usuario no pertenece a tu empresa',
        };
      }

      return { valid: true };
    }

    return {
      valid: false,
      error: 'No tienes permisos para modificar usuarios',
    };
  }

  /**
   * Valida datos de entrada contra inyección
   */
  static validateInput(input: any): { valid: boolean; error?: string } {
    // Verificar que no contenga operadores de MongoDB
    const dangerousOperators = ['$where', '$regex', '$ne', '$gt', '$lt', '$in', '$nin'];
    const inputString = JSON.stringify(input);

    for (const op of dangerousOperators) {
      if (inputString.includes(op)) {
        return {
          valid: false,
          error: 'Entrada contiene operadores no permitidos',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Genera log de auditoría para acciones sensibles
   */
  static logSecurityEvent(
    userId: string,
    action: string,
    resource: string,
    details?: any
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resource,
      details,
    };

    console.log('[SECURITY AUDIT]', JSON.stringify(logEntry));

    // TODO: Aquí podrías enviar a un servicio de logging centralizado
    // o guardar en una colección de auditoría
  }

  /**
   * Verifica rate limiting por usuario
   * (Complementa el rate limiting global)
   */
  private static userRequestCounts = new Map<string, { count: number; resetAt: number }>();

  static checkUserRateLimit(
    userId: string,
    maxRequests: number = 100,
    windowMs: number = 60000
  ): { allowed: boolean; resetIn?: number } {
    const now = Date.now();
    const userLimit = this.userRequestCounts.get(userId);

    if (!userLimit || now > userLimit.resetAt) {
      // Crear o resetear contador
      this.userRequestCounts.set(userId, {
        count: 1,
        resetAt: now + windowMs,
      });
      return { allowed: true };
    }

    if (userLimit.count >= maxRequests) {
      return {
        allowed: false,
        resetIn: Math.ceil((userLimit.resetAt - now) / 1000),
      };
    }

    // Incrementar contador
    userLimit.count++;
    return { allowed: true };
  }

  /**
   * Convierte acción a texto legible en español
   */
  private static getActionText(action: Action): string {
    const actionTexts: Record<Action, string> = {
      create: 'crear',
      read: 'leer',
      update: 'actualizar',
      delete: 'eliminar',
      export: 'exportar',
      import: 'importar',
    };

    return actionTexts[action] || action;
  }

  /**
   * Limpia periódicamente el caché de rate limiting
   */
  static cleanupRateLimitCache(): void {
    const now = Date.now();
    for (const [userId, limit] of this.userRequestCounts.entries()) {
      if (now > limit.resetAt) {
        this.userRequestCounts.delete(userId);
      }
    }
  }
}

// Ejecutar limpieza cada 5 minutos
setInterval(() => {
  AuthorizationHelper.cleanupRateLimitCache();
}, 5 * 60 * 1000);

/**
 * Decorator para validar ownership en métodos de controlador
 * (Para uso futuro si migras a TypeScript decorators)
 */
export function ValidateOwnership(Model: any, paramName: string = 'id') {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args[0];
      const res = args[1];
      const empresaId = req.empresaId;
      const resourceId = req.params[paramName];

      if (!AuthorizationHelper.isValidObjectId(resourceId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de recurso inválido',
        });
      }

      const resource = await Model.findById(resourceId);
      const validation = AuthorizationHelper.validateResourceOwnership(
        resource,
        empresaId,
        Model.modelName
      );

      if (!validation.valid) {
        return res.status(403).json({
          success: false,
          message: validation.error,
        });
      }

      req.resource = resource;
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
