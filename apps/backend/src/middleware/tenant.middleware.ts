import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Empresa from '../modules/empresa/Empresa';

// Extender Request para incluir propiedades de tenant
declare global {
  namespace Express {
    interface Request {
      empresaDbConfig?: any;
      dbConfig?: any;
      esPlatforma?: boolean;
    }
  }
}

/**
 * Middleware Multi-tenant con soporte para múltiples bases de datos
 * Carga la configuración de base de datos de la empresa y la adjunta al request
 */
export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let empresaId: any = req.empresaId;
    console.log('🔍 DEBUG empresaId ORIGINAL:', empresaId);
    console.log('🔍 DEBUG empresaId TYPE:', typeof empresaId);

    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'Empresa no identificada. Autenticación requerida.',
      });
    }

    // Si empresaId es un objeto (populate), extraer el _id
    if (typeof empresaId === 'object' && empresaId._id) {
      console.log('🔍 Es un objeto, extrayendo _id');
      empresaId = String(empresaId._id);
      req.empresaId = empresaId;
    }

    // Convertir a string si es ObjectId
    if (empresaId instanceof mongoose.Types.ObjectId) {
      console.log('🔍 Es un ObjectId, convirtiendo a string');
      empresaId = String(empresaId);
      req.empresaId = empresaId;
    }

    // Asegurar que sea string
    empresaId = String(empresaId);
    req.empresaId = empresaId;

    console.log('🔍 DEBUG empresaId FINAL:', empresaId);
    console.log('🔍 DEBUG isValid:', mongoose.Types.ObjectId.isValid(empresaId));

    // Validar que empresaId es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(empresaId)) {
      console.error('❌ ID de empresa inválido:', empresaId);
      return res.status(400).json({
        success: false,
        message: 'ID de empresa inválido',
        debug: {
          empresaId: empresaId,
          type: typeof empresaId,
        },
      });
    }

    // Cargar configuración de base de datos de la empresa desde DB principal
    // IMPORTANTE: Necesitamos el password, por eso usamos select('+databaseConfig.password')
    const empresa = await Empresa.findById(empresaId)
      .select('+databaseConfig.password +databaseConfig.uri')
      .lean();

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada',
      });
    }

    if (empresa.estado !== 'activa') {
      return res.status(403).json({
        success: false,
        message: `Empresa ${empresa.estado}. Contacte con soporte.`,
      });
    }

    // Bypass para empresa plataforma (Tralok) + superadmin
    // La empresa plataforma no tiene base de datos propia
    if (!empresa.databaseConfig) {
      // Si es empresa plataforma Y el usuario es superadmin, permitir acceso
      if (empresa.esPlatforma && req.userRole === 'superadmin') {
        console.log('🔓 Bypass: Superadmin accediendo a empresa plataforma');
        req.empresaDbConfig = null as any;
        req.dbConfig = null as any;
        req.esPlatforma = true;
        return next();
      }

      return res.status(500).json({
        success: false,
        message: 'Configuración de base de datos no encontrada para esta empresa',
      });
    }

    // Adjuntar configuración de DB al request para que los servicios la usen
    req.empresaDbConfig = empresa.databaseConfig;
    req.dbConfig = empresa.databaseConfig; // Alias para compatibilidad

    console.log(`🏢 Tenant: ${empresaId} | DB: ${empresa.databaseConfig.name}`);
    next();
  } catch (error: any) {
    console.error('Error en tenantMiddleware:', error);
    res.status(500).json({
      success: false,
      message: 'Error en verificación de tenant',
      error: error.message,
    });
  }
};

/**
 * Helper para añadir automáticamente empresaId a queries
 * @deprecated Ya no se usa con la arquitectura multi-DB, cada empresa tiene su propia DB
 */
export const addTenantToQuery = (req: Request, query: any = {}) => {
  return {
    ...query,
    empresaId: req.empresaId,
  };
};

/**
 * Helper para verificar que un recurso pertenece al tenant actual
 */
export const verifyTenantOwnership = (
  recursoEmpresaId: string,
  requestEmpresaId: string | undefined
): boolean => {
  if (!requestEmpresaId) {
    return false;
  }

  return recursoEmpresaId === requestEmpresaId;
};

/**
 * Middleware para bloquear rutas de negocio en empresa plataforma
 * Usar en rutas que requieren base de datos de empresa (clientes, productos, etc.)
 */
export const requireBusinessDatabase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Si es empresa plataforma, bloquear acceso a rutas de negocio
  if (req.esPlatforma) {
    return res.status(403).json({
      success: false,
      message: 'Esta función no está disponible desde la empresa plataforma. Selecciona una empresa de negocio para acceder a este módulo.',
      code: 'PLATFORM_COMPANY_ACCESS',
      requiresBusinessCompany: true,
    });
  }

  // Verificar que hay configuración de base de datos
  if (!req.dbConfig) {
    return res.status(500).json({
      success: false,
      message: 'Configuración de base de datos no disponible',
    });
  }

  next();
};