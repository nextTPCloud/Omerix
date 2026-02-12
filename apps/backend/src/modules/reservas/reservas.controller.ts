import { Request, Response } from 'express';
import { reservasService } from './reservas.service';
import { CreateReservaDTO, UpdateReservaDTO, FiltrosReservasDTO, DisponibilidadDTO } from './reservas.dto';

// ============================================
// CRUD
// ============================================

export const getAllReservas = async (req: Request, res: Response) => {
  try {
    const filtros: FiltrosReservasDTO = {
      fecha: req.query.fecha as string,
      fechaDesde: req.query.fechaDesde as string,
      fechaHasta: req.query.fechaHasta as string,
      estado: req.query.estado as string,
      salonId: req.query.salonId as string,
      busqueda: req.query.busqueda as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await reservasService.getAll(req.empresaId!, req.dbConfig!, filtros);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error obteniendo reservas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReservaById = async (req: Request, res: Response) => {
  try {
    const reserva = await reservasService.getById(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, data: reserva });
  } catch (error: any) {
    console.error('Error obteniendo reserva:', error);
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const createReserva = async (req: Request, res: Response) => {
  try {
    const data: CreateReservaDTO = req.body;
    const reserva = await reservasService.create(req.empresaId!, req.dbConfig!, data, (req as any).user?.id);
    res.status(201).json({ success: true, data: reserva });
  } catch (error: any) {
    console.error('Error creando reserva:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateReserva = async (req: Request, res: Response) => {
  try {
    const data: UpdateReservaDTO = req.body;
    const reserva = await reservasService.update(req.empresaId!, req.dbConfig!, req.params.id, data);
    res.json({ success: true, data: reserva });
  } catch (error: any) {
    console.error('Error actualizando reserva:', error);
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const deleteReserva = async (req: Request, res: Response) => {
  try {
    await reservasService.delete(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, message: 'Reserva eliminada correctamente' });
  } catch (error: any) {
    console.error('Error eliminando reserva:', error);
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

// ============================================
// CAMBIOS DE ESTADO
// ============================================

export const confirmarReserva = async (req: Request, res: Response) => {
  try {
    const reserva = await reservasService.confirmar(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, data: reserva });
  } catch (error: any) {
    console.error('Error confirmando reserva:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const iniciarReserva = async (req: Request, res: Response) => {
  try {
    const reserva = await reservasService.iniciar(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, data: reserva });
  } catch (error: any) {
    console.error('Error iniciando reserva:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const completarReserva = async (req: Request, res: Response) => {
  try {
    const reserva = await reservasService.completar(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, data: reserva });
  } catch (error: any) {
    console.error('Error completando reserva:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cancelarReserva = async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    const reserva = await reservasService.cancelar(req.empresaId!, req.dbConfig!, req.params.id, motivo);
    res.json({ success: true, data: reserva });
  } catch (error: any) {
    console.error('Error cancelando reserva:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const marcarNoShow = async (req: Request, res: Response) => {
  try {
    const reserva = await reservasService.marcarNoShow(req.empresaId!, req.dbConfig!, req.params.id);
    res.json({ success: true, data: reserva });
  } catch (error: any) {
    console.error('Error marcando no-show:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// DISPONIBILIDAD
// ============================================

export const verificarDisponibilidad = async (req: Request, res: Response) => {
  try {
    const params: DisponibilidadDTO = {
      fecha: req.query.fecha as string,
      comensales: parseInt(req.query.comensales as string),
      duracionMinutos: req.query.duracionMinutos ? parseInt(req.query.duracionMinutos as string) : undefined,
      salonId: req.query.salonId as string,
    };

    const disponibilidad = await reservasService.verificarDisponibilidad(
      req.empresaId!,
      req.dbConfig!,
      params,
      req.query.horaInicio as string
    );

    res.json({ success: true, data: disponibilidad });
  } catch (error: any) {
    console.error('Error verificando disponibilidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReservasDelDia = async (req: Request, res: Response) => {
  try {
    const fecha = req.params.fecha || new Date().toISOString().split('T')[0];
    const reservas = await reservasService.getReservasDelDia(req.empresaId!, req.dbConfig!, fecha);
    res.json({ success: true, data: reservas });
  } catch (error: any) {
    console.error('Error obteniendo reservas del día:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// ESTADÍSTICAS
// ============================================

export const getEstadisticasReservas = async (req: Request, res: Response) => {
  try {
    const estadisticas = await reservasService.getEstadisticas(
      req.empresaId!,
      req.dbConfig!,
      req.query.fechaDesde as string,
      req.query.fechaHasta as string
    );
    res.json({ success: true, data: estadisticas });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
