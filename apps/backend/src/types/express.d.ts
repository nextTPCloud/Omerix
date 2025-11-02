import { Request } from 'express';

/**
 * Extensión del Request de Express para incluir usuario autenticado
 */
declare global {
  namespace Express {
    interface Request {
      // Datos del usuario autenticado
      userId?: string;
      empresaId?: string;
      userEmail?: string;
      userRole?: string;
      
      // User completo (para el nuevo sistema)
      user?: {
        userId: string;
        empresaId: string;
        email: string;
        rol: string;
      };
    }
  }
}

export {};