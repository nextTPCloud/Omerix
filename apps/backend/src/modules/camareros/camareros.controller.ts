import { Request, Response } from 'express';
import { camarerosService } from './camareros.service';
import {
  CreateCamareroDTO,
  UpdateCamareroDTO,
  CambiarEstadoCamareroDTO,
  AsignarSalonesDTO,
  AsignarMesasDTO,
  RegistrarPropinaDTO,
  FiltrosCamarerosDTO,
} from './camareros.dto';

// ============================================
// CRUD CAMAREROS
// ============================================

export const getAllCamareros = async (req: Request, res: Response) => {
  try {
    const filtros: FiltrosCamarerosDTO = {
      estado: req.query.estado as any,
      salonId: req.query.salonId as string,
      activo: req.query.activo === 'false' ? false : req.query.activo === 'true' ? true : undefined,
      busqueda: req.query.busqueda as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await camarerosService.getAll(req.empresaId!, req.dbConfig!, filtros);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error obteniendo camareros:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCamareroById = async (req: Request, res: Response) => {
  try {
    const camarero = await camarerosService.getById(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, data: camarero });
  } catch (error: any) {
    console.error('Error obteniendo camarero:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const getCamareroByUsuario = async (req: Request, res: Response) => {
  try {
    const camarero = await camarerosService.getByUsuarioId(req.empresaId!, req.dbConfig!, req.params.usuarioId);
    res.json({ success: true, data: camarero });
  } catch (error: any) {
    console.error('Error obteniendo camarero por usuario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSiguienteCodigo = async (req: Request, res: Response) => {
  try {
    const prefijo = (req.query.prefijo as string) || 'CAM';
    const codigo = await camarerosService.sugerirSiguienteCodigo(
      req.empresaId!,
      req.dbConfig!,
      prefijo
    );
    res.json({ success: true, data: { codigo } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCamarero = async (req: Request, res: Response) => {
  try {
    const data: CreateCamareroDTO = req.body;
    const camarero = await camarerosService.create(req.empresaId!, req.dbConfig!, data);
    res.status(201).json({ success: true, data: camarero });
  } catch (error: any) {
    console.error('Error creando camarero:', error);
    const status = error.message.includes('Ya existe') ? 400 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const updateCamarero = async (req: Request, res: Response) => {
  try {
    const data: UpdateCamareroDTO = req.body;
    const camarero = await camarerosService.update(req.empresaId!, req.dbConfig!, req.params.id, data);
    res.json({ success: true, data: camarero });
  } catch (error: any) {
    console.error('Error actualizando camarero:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const deleteCamarero = async (req: Request, res: Response) => {
  try {
    await camarerosService.delete(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, message: 'Camarero eliminado correctamente' });
  } catch (error: any) {
    console.error('Error eliminando camarero:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

// ============================================
// ESTADO Y TURNOS
// ============================================

export const cambiarEstadoCamarero = async (req: Request, res: Response) => {
  try {
    const data: CambiarEstadoCamareroDTO = req.body;
    const camarero = await camarerosService.cambiarEstado(req.empresaId!, req.dbConfig!, req.params.id, data);
    res.json({ success: true, data: camarero });
  } catch (error: any) {
    console.error('Error cambiando estado:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const verificarPINCamarero = async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    const valido = await camarerosService.verificarPIN(req.empresaId!, req.dbConfig!, req.params.id, pin);
    res.json({ success: true, data: { valido } });
  } catch (error: any) {
    console.error('Error verificando PIN:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCamarerosActivos = async (req: Request, res: Response) => {
  try {
    const camareros = await camarerosService.getCamarerosActivos(req.empresaId!, req.dbConfig!);
    res.json({ success: true, data: camareros });
  } catch (error: any) {
    console.error('Error obteniendo camareros activos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCamarerosPorSalon = async (req: Request, res: Response) => {
  try {
    const camareros = await camarerosService.getCamarerosPorSalon(req.empresaId!, req.dbConfig!, req.params.salonId);
    res.json({ success: true, data: camareros });
  } catch (error: any) {
    console.error('Error obteniendo camareros por salón:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// ASIGNACIONES
// ============================================

export const asignarSalones = async (req: Request, res: Response) => {
  try {
    const data: AsignarSalonesDTO = req.body;
    const camarero = await camarerosService.asignarSalones(req.empresaId!, req.dbConfig!, req.params.id, data);
    res.json({ success: true, data: camarero });
  } catch (error: any) {
    console.error('Error asignando salones:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const asignarMesas = async (req: Request, res: Response) => {
  try {
    const data: AsignarMesasDTO = req.body;
    const camarero = await camarerosService.asignarMesas(req.empresaId!, req.dbConfig!, req.params.id, data);
    res.json({ success: true, data: camarero });
  } catch (error: any) {
    console.error('Error asignando mesas:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

// ============================================
// PROPINAS
// ============================================

export const registrarPropina = async (req: Request, res: Response) => {
  try {
    const data: RegistrarPropinaDTO = req.body;
    const camarero = await camarerosService.registrarPropina(req.empresaId!, req.dbConfig!, req.params.id, data);
    res.json({ success: true, data: camarero });
  } catch (error: any) {
    console.error('Error registrando propina:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const resetearPropinas = async (req: Request, res: Response) => {
  try {
    const result = await camarerosService.resetearPropinas(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error reseteando propinas:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

// ============================================
// ESTADÍSTICAS
// ============================================

export const getEstadisticasCamarero = async (req: Request, res: Response) => {
  try {
    const fecha = req.query.fecha ? new Date(req.query.fecha as string) : undefined;
    const estadisticas = await camarerosService.getEstadisticas(req.empresaId!, req.dbConfig!, req.params.id, fecha);
    res.json({ success: true, data: estadisticas });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const getResumenCamareros = async (req: Request, res: Response) => {
  try {
    const resumen = await camarerosService.getResumenGeneral(req.empresaId!, req.dbConfig!);
    res.json({ success: true, data: resumen });
  } catch (error: any) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
