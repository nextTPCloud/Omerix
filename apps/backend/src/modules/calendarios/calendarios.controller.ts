import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { calendariosService } from './calendarios.service';
import {
  CreateCalendarioDTO,
  UpdateCalendarioDTO,
  SearchCalendariosDTO,
  CreateFestivoDTO,
} from './calendarios.dto';

// ============================================
// CONTROLADORES
// ============================================

export const calendariosController = {
  /**
   * Crear un nuevo calendario
   */
  async crear(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const createDto: CreateCalendarioDTO = req.body;

      const calendario = await calendariosService.crear(
        createDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: calendario,
        message: 'Calendario creado correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear calendario:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear el calendario',
      });
    }
  },

  /**
   * Buscar calendarios
   */
  async buscar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;

      const searchDto: SearchCalendariosDTO = {
        anio: req.query.anio ? parseInt(req.query.anio as string) : undefined,
        region: req.query.region as string,
        activo: req.query.activo as 'true' | 'false' | 'all',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await calendariosService.buscar(
        searchDto,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: result.calendarios,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error: any) {
      console.error('Error al buscar calendarios:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al buscar calendarios',
      });
    }
  },

  /**
   * Obtener calendario por ID
   */
  async obtenerPorId(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { id } = req.params;

      const calendario = await calendariosService.obtenerPorId(
        id,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      if (!calendario) {
        return res.status(404).json({
          success: false,
          error: 'Calendario no encontrado',
        });
      }

      return res.json({
        success: true,
        data: calendario,
      });
    } catch (error: any) {
      console.error('Error al obtener calendario:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener el calendario',
      });
    }
  },

  /**
   * Obtener calendario por defecto de un año
   */
  async obtenerPorDefecto(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const anio = parseInt(req.params.anio);

      const calendario = await calendariosService.obtenerPorDefecto(
        anio,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      if (!calendario) {
        return res.status(404).json({
          success: false,
          error: `No hay calendario por defecto para el año ${anio}`,
        });
      }

      return res.json({
        success: true,
        data: calendario,
      });
    } catch (error: any) {
      console.error('Error al obtener calendario por defecto:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener el calendario',
      });
    }
  },

  /**
   * Actualizar calendario
   */
  async actualizar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { id } = req.params;
      const updateDto: UpdateCalendarioDTO = req.body;

      const calendario = await calendariosService.actualizar(
        id,
        updateDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!calendario) {
        return res.status(404).json({
          success: false,
          error: 'Calendario no encontrado',
        });
      }

      return res.json({
        success: true,
        data: calendario,
        message: 'Calendario actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar calendario:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar el calendario',
      });
    }
  },

  /**
   * Eliminar calendario
   */
  async eliminar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { id } = req.params;

      const eliminado = await calendariosService.eliminar(
        id,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          error: 'Calendario no encontrado',
        });
      }

      return res.json({
        success: true,
        message: 'Calendario eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar calendario:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar el calendario',
      });
    }
  },

  /**
   * Agregar festivo a calendario
   */
  async agregarFestivo(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { id } = req.params;
      const festivo: CreateFestivoDTO = req.body;

      const calendario = await calendariosService.agregarFestivo(
        id,
        festivo,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!calendario) {
        return res.status(404).json({
          success: false,
          error: 'Calendario no encontrado',
        });
      }

      return res.json({
        success: true,
        data: calendario,
        message: 'Festivo agregado correctamente',
      });
    } catch (error: any) {
      console.error('Error al agregar festivo:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al agregar festivo',
      });
    }
  },

  /**
   * Eliminar festivo de calendario
   */
  async eliminarFestivo(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { id, festivoId } = req.params;

      const calendario = await calendariosService.eliminarFestivo(
        id,
        festivoId,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!calendario) {
        return res.status(404).json({
          success: false,
          error: 'Calendario no encontrado',
        });
      }

      return res.json({
        success: true,
        data: calendario,
        message: 'Festivo eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar festivo:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar festivo',
      });
    }
  },

  /**
   * Verificar si una fecha es festivo
   */
  async esFestivo(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const fecha = new Date(req.query.fecha as string);

      const resultado = await calendariosService.esFestivo(
        fecha,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error al verificar festivo:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al verificar festivo',
      });
    }
  },

  /**
   * Obtener festivos nacionales predefinidos
   */
  async obtenerFestivosNacionales(req: Request, res: Response) {
    try {
      const anio = parseInt(req.params.anio);
      const festivos = calendariosService.obtenerFestivosNacionales(anio);

      return res.json({
        success: true,
        data: festivos,
      });
    } catch (error: any) {
      console.error('Error al obtener festivos nacionales:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener festivos nacionales',
      });
    }
  },

  /**
   * Obtener calendarios activos
   */
  async obtenerActivos(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;

      const calendarios = await calendariosService.obtenerActivos(
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: calendarios,
      });
    } catch (error: any) {
      console.error('Error al obtener calendarios activos:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener calendarios',
      });
    }
  },
};
