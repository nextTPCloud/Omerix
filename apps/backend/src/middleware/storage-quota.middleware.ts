import { Request, Response, NextFunction } from 'express';
import StorageUsage from '@/modules/archivos/StorageUsage';
import Licencia from '@/modules/licencias/Licencia';
import Plan from '@/modules/licencias/Plan';

/**
 * Middleware que verifica la cuota de almacenamiento antes de permitir un upload.
 * Adjunta storageUsage a req para actualizar despues del upload exitoso.
 */
export async function checkStorageQuota(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.empresaId) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    const empresaId = req.empresaId;

    // Obtener o crear registro de uso
    let usage = await StorageUsage.findOne({ empresaId });
    if (!usage) {
      // Obtener limite del plan
      let limitBytes = 1 * 1024 * 1024 * 1024; // 1GB default
      const licencia = await Licencia.findOne({ empresaId }).populate('planId');
      if (licencia && licencia.planId) {
        const plan = await Plan.findById(licencia.planId);
        if (plan && plan.limites?.almacenamientoGB) {
          limitBytes = plan.limites.almacenamientoGB * 1024 * 1024 * 1024;
        }
      }

      usage = await StorageUsage.create({
        empresaId,
        usedBytes: 0,
        limitBytes,
        fileCount: 0,
      });
    }

    // Estimar tamaño del archivo (Content-Length header)
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 0 && (usage.usedBytes + contentLength) > usage.limitBytes) {
      return res.status(413).json({
        success: false,
        code: 'STORAGE_QUOTA_EXCEEDED',
        message: 'Cuota de almacenamiento excedida',
        data: {
          usedBytes: usage.usedBytes,
          limitBytes: usage.limitBytes,
          usedGB: (usage.usedBytes / (1024 * 1024 * 1024)).toFixed(2),
          limitGB: (usage.limitBytes / (1024 * 1024 * 1024)).toFixed(2),
        },
      });
    }

    // Adjuntar al request para actualizar despues
    (req as any).storageUsage = usage;
    next();
  } catch (error: any) {
    console.error('Error verificando cuota de almacenamiento:', error);
    // No bloquear el upload si falla la verificacion de cuota
    next();
  }
}
