import { Request } from 'express';
import { IDatabaseConfig } from '../modules/empresa/Empresa';

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

      // Configuración de base de datos de la empresa (multi-tenant)
      empresaDbConfig?: IDatabaseConfig;
      // Alias para compatibilidad con controladores
      dbConfig?: IDatabaseConfig;
    }
  }
}

// Exportar la interfaz para poder usarla en otros archivos
export { IDatabaseConfig };