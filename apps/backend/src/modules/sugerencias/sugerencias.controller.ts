import { Request, Response } from 'express';
import { sugerenciasService } from './sugerencias.service';
import { CreateSugerenciaDTO, UpdateSugerenciaDTO, FiltrosSugerenciasDTO } from './sugerencias.dto';

// ============================================
// CRUD
// ============================================

export const getAllSugerencias = async (req: Request, res: Response) => {
  try {
    const filtros: FiltrosSugerenciasDTO = {
      tipo: req.query.tipo as string,
      momento: req.query.momento as string,
      productoId: req.query.productoId as string,
      familiaId: req.query.familiaId as string,
      activo: req.query.activo === 'false' ? false : req.query.activo === 'true' ? true : undefined,
      busqueda: req.query.busqueda as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await sugerenciasService.getAll(req.empresaId!, req.dbConfig!, filtros);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error obteniendo sugerencias:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSugerenciaById = async (req: Request, res: Response) => {
  try {
    const sugerencia = await sugerenciasService.getById(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, data: sugerencia });
  } catch (error: any) {
    console.error('Error obteniendo sugerencia:', error);
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const createSugerencia = async (req: Request, res: Response) => {
  try {
    const data: CreateSugerenciaDTO = req.body;
    const sugerencia = await sugerenciasService.create(req.empresaId!, req.dbConfig!, data);
    res.status(201).json({ success: true, data: sugerencia });
  } catch (error: any) {
    console.error('Error creando sugerencia:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSugerencia = async (req: Request, res: Response) => {
  try {
    const data: UpdateSugerenciaDTO = req.body;
    const sugerencia = await sugerenciasService.update(req.empresaId!, req.dbConfig!, req.params.id, data);
    res.json({ success: true, data: sugerencia });
  } catch (error: any) {
    console.error('Error actualizando sugerencia:', error);
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const deleteSugerencia = async (req: Request, res: Response) => {
  try {
    await sugerenciasService.delete(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, message: 'Sugerencia eliminada correctamente' });
  } catch (error: any) {
    console.error('Error eliminando sugerencia:', error);
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

// ============================================
// LÓGICA DE SUGERENCIAS
// ============================================

export const getSugerenciasParaProducto = async (req: Request, res: Response) => {
  try {
    const { productoId } = req.params;
    const { familiaId } = req.query;

    const sugerencias = await sugerenciasService.getSugerenciasParaProducto(
      req.empresaId!,
      req.dbConfig!,
      productoId,
      familiaId as string
    );

    res.json({ success: true, data: sugerencias });
  } catch (error: any) {
    console.error('Error obteniendo sugerencias para producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSugerenciasFinalizacion = async (req: Request, res: Response) => {
  try {
    const sugerencias = await sugerenciasService.getSugerenciasFinalizacion(
      req.empresaId!,
      req.dbConfig!
    );

    res.json({ success: true, data: sugerencias });
  } catch (error: any) {
    console.error('Error obteniendo sugerencias de finalización:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const registrarAceptacion = async (req: Request, res: Response) => {
  try {
    await sugerenciasService.registrarAceptacion(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error registrando aceptación:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEstadisticasSugerencias = async (req: Request, res: Response) => {
  try {
    const estadisticas = await sugerenciasService.getEstadisticas(req.empresaId!, req.dbConfig!);
    res.json({ success: true, data: estadisticas });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
