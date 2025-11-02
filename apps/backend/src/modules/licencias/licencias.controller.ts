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
    const { addOnSlug } = req.body;

    if (!addOnSlug) {
      return res.status(400).json({
        success: false,
        message: 'addOnSlug es requerido',
      });
    }

    const result = await licenciasService.addAddOn(empresaId, addOnSlug);

    res.json(result);
  } catch (error: any) {
    console.error('Error añadiendo add-on:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error añadiendo add-on',
    });
  }
};