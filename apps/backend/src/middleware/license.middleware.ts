import { Request, Response, NextFunction } from 'express';
import Licencia from '../modules/licencias/Licencia';

// Extender Request para incluir licencia
declare global {
  namespace Express {
    interface Request {
      licencia?: any;
      plan?: any;
    }
  }
}

/**
 * Middleware para cargar licencia y plan
 */
export const loadLicense = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const empresaId = req.empresaId;

    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'Empresa no identificada',
      });
    }

    // Buscar licencia
    const licencia = await Licencia.findOne({ empresaId }).populate('planId');

    if (!licencia) {
      return res.status(403).json({
        success: false,
        message: 'No se encontró licencia activa',
        code: 'NO_LICENSE',
      });
    }

    // Verificar si el trial expiró
    if (licencia.esTrial && licencia.isTrialExpired()) {
      licencia.estado = 'expirada';
      await licencia.save();

      return res.status(403).json({
        success: false,
        message: 'Tu período de prueba ha expirado',
        code: 'TRIAL_EXPIRED',
        data: {
          diasRestantes: 0,
        },
      });
    }

    // Verificar si la licencia está activa
    if (!licencia.isActive()) {
      return res.status(403).json({
        success: false,
        message: `Licencia ${licencia.estado}. Contacta con soporte.`,
        code: 'LICENSE_INACTIVE',
        data: {
          estado: licencia.estado,
        },
      });
    }

    // Añadir licencia y plan al request
    req.licencia = licencia;
    req.plan = licencia.planId;

    next();
  } catch (error: any) {
    console.error('Error en loadLicense:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando licencia',
      error: error.message,
    });
  }
};

/**
 * Middleware para verificar límite específico
 */
export const checkLimit = (limitType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const licencia = req.licencia;
      const plan = req.plan;

      if (!licencia || !plan) {
        return res.status(500).json({
          success: false,
          message: 'Licencia no cargada. Usar loadLicense primero.',
        });
      }

      const limite = plan.limites[limitType];
      const usoActual = licencia.usoActual[limitType];

      // -1 significa ilimitado
      if (limite === -1) {
        return next();
      }

      // Verificar si se alcanzó el límite
      if (usoActual >= limite) {
        return res.status(403).json({
          success: false,
          message: `Has alcanzado el límite de ${limitType}`,
          code: 'LIMIT_REACHED',
          data: {
            limite,
            usoActual,
            porcentaje: 100,
            planActual: plan.nombre,
          },
        });
      }

      // Advertencia si está cerca del límite (80%)
      const porcentaje = (usoActual / limite) * 100;
      if (porcentaje >= 80) {
        res.setHeader('X-License-Warning', `Cerca del límite de ${limitType}`);
        res.setHeader('X-License-Usage', `${usoActual}/${limite}`);
        res.setHeader('X-License-Percentage', porcentaje.toFixed(2));
      }

      next();
    } catch (error: any) {
      console.error('Error en checkLimit:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando límite',
        error: error.message,
      });
    }
  };
};

/**
 * Middleware para verificar acceso a módulo
 */
export const requireModule = (moduleName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = req.plan;

      if (!plan) {
        return res.status(500).json({
          success: false,
          message: 'Plan no cargado. Usar loadLicense primero.',
        });
      }

      // Si tiene todos los módulos (Enterprise)
      if (plan.modulosIncluidos.includes('*')) {
        return next();
      }

      // Verificar si el módulo está incluido
      if (!plan.modulosIncluidos.includes(moduleName)) {
        // Verificar si tiene el add-on
        const licencia = req.licencia;
        const tieneAddOn = licencia.addOns.some(
          (addon: any) => addon.nombre === moduleName && addon.activo
        );

        if (!tieneAddOn) {
          return res.status(403).json({
            success: false,
            message: `El módulo "${moduleName}" no está incluido en tu plan`,
            code: 'MODULE_NOT_INCLUDED',
            data: {
              modulo: moduleName,
              planActual: plan.nombre,
            },
          });
        }
      }

      next();
    } catch (error: any) {
      console.error('Error en requireModule:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando módulo',
        error: error.message,
      });
    }
  };
};

/**
 * Helper para incrementar uso
 */
export const incrementUsage = async (
  empresaId: string,
  limitType: string,
  amount: number = 1
) => {
  try {
    await Licencia.findOneAndUpdate(
      { empresaId },
      { $inc: { [`usoActual.${limitType}`]: amount } }
    );
  } catch (error) {
    console.error('Error incrementando uso:', error);
  }
};

/**
 * Helper para resetear contadores mensuales (ejecutar con cron)
 */
export const resetMonthlyCounters = async () => {
  try {
    await Licencia.updateMany(
      {},
      {
        $set: {
          'usoActual.facturasEsteMes': 0,
          'usoActual.emailsEsteMes': 0,
          'usoActual.smsEsteMes': 0,
          'usoActual.whatsappEsteMes': 0,
        },
      }
    );
    console.log('✅ Contadores mensuales reseteados');
  } catch (error) {
    console.error('Error reseteando contadores:', error);
  }
};

/**
 * Helper para resetear contadores diarios (ejecutar con cron)
 */
export const resetDailyCounters = async () => {
  try {
    await Licencia.updateMany(
      {},
      {
        $set: {
          'usoActual.llamadasAPIHoy': 0,
        },
      }
    );
    console.log('✅ Contadores diarios reseteados');
  } catch (error) {
    console.error('Error reseteando contadores:', error);
  }
};