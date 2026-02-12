import { Request, Response } from 'express';
import { turnosServicioService } from './turnos-servicio.service';
import { CreateTurnoServicioDTO, UpdateTurnoServicioDTO, FiltrosTurnosServicioDTO } from './turnos-servicio.dto';

export const getAllTurnosServicio = async (req: Request, res: Response) => {
  try {
    const filtros: FiltrosTurnosServicioDTO = {
      activo: req.query.activo === 'false' ? false : req.query.activo === 'true' ? true : undefined,
      busqueda: req.query.busqueda as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await turnosServicioService.getAll(req.empresaId!, req.dbConfig!, filtros);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error obteniendo turnos de servicio:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTurnosServicioActivos = async (req: Request, res: Response) => {
  try {
    const turnos = await turnosServicioService.getActivos(req.empresaId!, req.dbConfig!);
    res.json({ success: true, data: turnos });
  } catch (error: any) {
    console.error('Error obteniendo turnos activos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTurnoServicioById = async (req: Request, res: Response) => {
  try {
    const turno = await turnosServicioService.getById(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, data: turno });
  } catch (error: any) {
    console.error('Error obteniendo turno de servicio:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const createTurnoServicio = async (req: Request, res: Response) => {
  try {
    const data: CreateTurnoServicioDTO = req.body;
    const turno = await turnosServicioService.create(req.empresaId!, req.dbConfig!, data);
    res.status(201).json({ success: true, data: turno });
  } catch (error: any) {
    console.error('Error creando turno de servicio:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTurnoServicio = async (req: Request, res: Response) => {
  try {
    const data: UpdateTurnoServicioDTO = req.body;
    const turno = await turnosServicioService.update(req.empresaId!, req.dbConfig!, req.params.id, data);
    res.json({ success: true, data: turno });
  } catch (error: any) {
    console.error('Error actualizando turno de servicio:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const deleteTurnoServicio = async (req: Request, res: Response) => {
  try {
    await turnosServicioService.delete(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, message: 'Turno de servicio eliminado correctamente' });
  } catch (error: any) {
    console.error('Error eliminando turno de servicio:', error);
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};
