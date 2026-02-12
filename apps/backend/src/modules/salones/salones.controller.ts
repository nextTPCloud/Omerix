import { Request, Response } from 'express';
import { salonesService } from './salones.service';
import {
  CreateSalonDTO,
  UpdateSalonDTO,
  SearchSalonesDTO,
  CreateMesaDTO,
  UpdateMesaDTO,
  SearchMesasDTO,
  CambiarEstadoMesaDTO,
  MoverMesaDTO,
  AgruparMesasDTO,
} from './salones.dto';

// ============================================
// SALONES
// ============================================

export const getAllSalones = async (req: Request, res: Response) => {
  try {
    const filters: SearchSalonesDTO = {
      q: req.query.q as string,
      activo: req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : undefined,
      almacenId: req.query.almacenId as string,
      tpvId: req.query.tpvId as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      sortBy: (req.query.sortBy as string) || 'orden',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };

    const result = await salonesService.findAllSalones(
      req.empresaId!,
      filters,
      req.dbConfig!
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSalonById = async (req: Request, res: Response) => {
  try {
    const salon = await salonesService.findOneSalon(
      req.params.id,
      req.empresaId!,
      req.dbConfig!
    );
    res.json({ success: true, data: salon });
  } catch (error: any) {
    res.status(error.message.includes('no encontrado') ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const createSalon = async (req: Request, res: Response) => {
  try {
    const data: CreateSalonDTO = req.body;
    const salon = await salonesService.createSalon(
      req.empresaId!,
      data,
      req.dbConfig!
    );
    res.status(201).json({ success: true, data: salon });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateSalon = async (req: Request, res: Response) => {
  try {
    const data: UpdateSalonDTO = req.body;
    const salon = await salonesService.updateSalon(
      req.params.id,
      req.empresaId!,
      data,
      req.dbConfig!
    );
    res.json({ success: true, data: salon });
  } catch (error: any) {
    res.status(error.message.includes('no encontrado') ? 404 : 400).json({
      success: false,
      error: error.message,
    });
  }
};

export const deleteSalon = async (req: Request, res: Response) => {
  try {
    const result = await salonesService.deleteSalon(
      req.params.id,
      req.empresaId!,
      req.dbConfig!
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(error.message.includes('no encontrado') ? 404 : 400).json({
      success: false,
      error: error.message,
    });
  }
};

export const getSiguienteCodigoSalon = async (req: Request, res: Response) => {
  try {
    const prefijo = (req.query.prefijo as string) || 'SAL';
    const codigo = await salonesService.sugerirSiguienteCodigo(
      req.empresaId!,
      req.dbConfig!,
      prefijo
    );
    res.json({ success: true, data: { codigo } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// MESAS
// ============================================

export const getAllMesas = async (req: Request, res: Response) => {
  try {
    const filters: SearchMesasDTO = {
      q: req.query.q as string,
      salonId: req.query.salonId as string,
      estado: req.query.estado as any,
      activo: req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : undefined,
      esVIP: req.query.esVIP === 'true' ? true : req.query.esVIP === 'false' ? false : undefined,
      camareroId: req.query.camareroId as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 100,
      sortBy: (req.query.sortBy as string) || 'orden',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };

    const result = await salonesService.findAllMesas(
      req.empresaId!,
      filters,
      req.dbConfig!
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMesasBySalon = async (req: Request, res: Response) => {
  try {
    const mesas = await salonesService.findMesasBySalon(
      req.params.salonId,
      req.empresaId!,
      req.dbConfig!
    );
    res.json({ success: true, data: mesas });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMesaById = async (req: Request, res: Response) => {
  try {
    const mesa = await salonesService.findOneMesa(
      req.params.id,
      req.empresaId!,
      req.dbConfig!
    );
    res.json({ success: true, data: mesa });
  } catch (error: any) {
    res.status(error.message.includes('no encontrada') ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const createMesa = async (req: Request, res: Response) => {
  try {
    const data: CreateMesaDTO = req.body;
    const mesa = await salonesService.createMesa(
      req.empresaId!,
      data,
      req.dbConfig!
    );
    res.status(201).json({ success: true, data: mesa });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const createMesasBulk = async (req: Request, res: Response) => {
  try {
    const { salonId, cantidad, prefijo = '' } = req.body;
    const result = await salonesService.createMesasBulk(
      req.empresaId!,
      salonId,
      cantidad,
      prefijo,
      req.dbConfig!
    );
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateMesa = async (req: Request, res: Response) => {
  try {
    const data: UpdateMesaDTO = req.body;
    const mesa = await salonesService.updateMesa(
      req.params.id,
      req.empresaId!,
      data,
      req.dbConfig!
    );
    res.json({ success: true, data: mesa });
  } catch (error: any) {
    res.status(error.message.includes('no encontrada') ? 404 : 400).json({
      success: false,
      error: error.message,
    });
  }
};

export const deleteMesa = async (req: Request, res: Response) => {
  try {
    const result = await salonesService.deleteMesa(
      req.params.id,
      req.empresaId!,
      req.dbConfig!
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(error.message.includes('no encontrada') ? 404 : 400).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// OPERACIONES DE ESTADO
// ============================================

export const cambiarEstadoMesa = async (req: Request, res: Response) => {
  try {
    const data: CambiarEstadoMesaDTO = req.body;
    const mesa = await salonesService.cambiarEstadoMesa(
      req.params.id,
      req.empresaId!,
      data,
      req.dbConfig!
    );
    res.json({ success: true, data: mesa });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const moverMesa = async (req: Request, res: Response) => {
  try {
    const data: MoverMesaDTO = req.body;
    const mesa = await salonesService.moverMesa(
      req.params.id,
      req.empresaId!,
      data,
      req.dbConfig!
    );
    res.json({ success: true, data: mesa });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const actualizarPosicionesMesas = async (req: Request, res: Response) => {
  try {
    const { mesas } = req.body;
    const result = await salonesService.actualizarPosicionesMesas(
      req.empresaId!,
      mesas,
      req.dbConfig!
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const agruparMesas = async (req: Request, res: Response) => {
  try {
    const data: AgruparMesasDTO = req.body;
    const result = await salonesService.agruparMesas(
      req.empresaId!,
      data,
      req.dbConfig!
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const desagruparMesas = async (req: Request, res: Response) => {
  try {
    const result = await salonesService.desagruparMesas(
      req.params.grupoId,
      req.empresaId!,
      req.dbConfig!
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ============================================
// ESTADISTICAS
// ============================================

export const getEstadisticasSalon = async (req: Request, res: Response) => {
  try {
    const stats = await salonesService.getEstadisticasSalon(
      req.params.salonId,
      req.empresaId!,
      req.dbConfig!
    );
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
