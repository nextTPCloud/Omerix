import { Request, Response } from 'express';
import { LicenciasService } from './licencias.service';

const licenciasService = new LicenciasService();

// Obtener licencia actual
export const getLicencia = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    const result = await licenciasService.getLicenciaByEmpresa(empresaId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error obteniendo licencia:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo licencia',
    });
  }
};

// Listar planes disponibles
export const getPlanes = async (req: Request, res: Response) => {
  try {
    const planes = await licenciasService.getPlanes();

    res.json({
      success: true,
      data: planes,
    });
  } catch (error: any) {
    console.error('Error obteniendo planes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo planes',
    });
  }
};

// Listar add-ons disponibles
export const getAddOns = async (req: Request, res: Response) => {
  try {
    const addOns = await licenciasService.getAddOns();

    res.json({
      success: true,
      data: addOns,
    });
  } catch (error: any) {
    console.error('Error obteniendo add-ons:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo add-ons',
    });
  }
};

// Cambiar plan
export const cambiarPlan = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;
    const { planSlug, tipoSuscripcion } = req.body;

    if (!planSlug || !tipoSuscripcion) {
      return res.status(400).json({
        success: false,
        message: 'planSlug y tipoSuscripcion son requeridos',
      });
    }

    const result = await licenciasService.cambiarPlan(empresaId, planSlug, tipoSuscripcion);

    res.json(result);
  } catch (error: any) {
    console.error('Error cambiando plan:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error cambiando plan',
    });
  }
};

// Añadir add-on
export const addAddOn = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;
    const { addOnSlug, cantidad = 1 } = req.body;

    if (!addOnSlug) {
      return res.status(400).json({
        success: false,
        message: 'addOnSlug es requerido',
      });
    }

    const result = await licenciasService.addAddOn(empresaId, addOnSlug, cantidad);

    res.json(result);
  } catch (error: any) {
    console.error('Error añadiendo add-on:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error añadiendo add-on',
    });
  }
};

// Eliminar add-on
export const removeAddOn = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;
    const { addOnSlug } = req.body;

    if (!addOnSlug) {
      return res.status(400).json({
        success: false,
        message: 'addOnSlug es requerido',
      });
    }

    const result = await licenciasService.removeAddOn(empresaId, addOnSlug);

    res.json(result);
  } catch (error: any) {
    console.error('Error eliminando add-on:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error eliminando add-on',
    });
  }
};

// Obtener resumen de facturación
export const getResumenFacturacion = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    const result = await licenciasService.getResumenFacturacion(empresaId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo resumen de facturación',
    });
  }
};

// Toggle renovación automática
export const toggleRenovacionAutomatica = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;
    const { activar } = req.body;

    if (typeof activar !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El campo "activar" es requerido y debe ser booleano',
      });
    }

    const result = await licenciasService.toggleRenovacionAutomatica(empresaId, activar);

    res.json(result);
  } catch (error: any) {
    console.error('Error toggle renovación:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error actualizando renovación automática',
    });
  }
};

// Obtener estado de renovación
export const getEstadoRenovacion = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    const result = await licenciasService.getEstadoRenovacion(empresaId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error obteniendo estado renovación:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo estado de renovación',
    });
  }
};

// Obtener permisos disponibles según el plan
export const getPermisosDisponibles = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    const result = await licenciasService.getPermisosDisponibles(empresaId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error obteniendo permisos disponibles:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo permisos disponibles',
    });
  }
};