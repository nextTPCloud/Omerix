import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/**
 * Middleware Multi-tenant
 * Asegura que todas las queries filtren por empresaId automáticamente
 */
export const tenantMiddleware = (
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

    // El empresaId ya está en req.empresaId (del authMiddleware)
    // Los controladores deberán usarlo para filtrar datos

    console.log(`🏢 Tenant: ${empresaId}`);
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