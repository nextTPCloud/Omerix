import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { turnosService } from './turnos.service';
import {
  CreateTurnoDTO,
  UpdateTurnoDTO,
  SearchTurnosDTO,
  CreateHorarioPersonalDTO,
  UpdateHorarioPersonalDTO,
  SearchHorarioPersonalDTO,
} from './turnos.dto';

// ============================================
// CONTROLADORES
// ============================================

export const turnosController = {
  // ============================================
  // TURNOS
  // ============================================

  /**
   * Crear un nuevo turno
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
      const createDto: CreateTurnoDTO = req.body;

      const turno = await turnosService.crear(
        createDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: turno,
        message: 'Turno creado correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear turno:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear el turno',
      });
    }
  },

  /**
   * Buscar turnos
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

      const searchDto: SearchTurnosDTO = {
        search: req.query.search as string,
        activo: req.query.activo as 'true' | 'false' | 'all',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await turnosService.buscar(
        searchDto,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: result.turnos,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error: any) {
      console.error('Error al buscar turnos:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al buscar turnos',
      });
    }
  },

  /**
   * Obtener turno por ID
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

      const turno = await turnosService.obtenerPorId(
        id,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      if (!turno) {
        return res.status(404).json({
          success: false,
          error: 'Turno no encontrado',
        });
      }

      return res.json({
        success: true,
        data: turno,
      });
    } catch (error: any) {
      console.error('Error al obtener turno:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener el turno',
      });
    }
  },

  /**
   * Actualizar turno
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
      const updateDto: UpdateTurnoDTO = req.body;

      const turno = await turnosService.actualizar(
        id,
        updateDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!turno) {
        return res.status(404).json({
          success: false,
          error: 'Turno no encontrado',
        });
      }

      return res.json({
        success: true,
        data: turno,
        message: 'Turno actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar turno:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar el turno',
      });
    }
  },

  /**
   * Eliminar turno
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

      const eliminado = await turnosService.eliminar(
        id,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          error: 'Turno no encontrado',
        });
      }

      return res.json({
        success: true,
        message: 'Turno eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar turno:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar el turno',
      });
    }
  },

  /**
   * Obtener turnos activos
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

      const turnos = await turnosService.obtenerActivos(
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: turnos,
      });
    } catch (error: any) {
      console.error('Error al obtener turnos activos:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener turnos',
      });
    }
  },

  /**
   * Obtener turnos predefinidos
   */
  async obtenerPredefinidos(req: Request, res: Response) {
    try {
      const turnos = turnosService.obtenerPredefinidos();

      return res.json({
        success: true,
        data: turnos,
      });
    } catch (error: any) {
      console.error('Error al obtener turnos predefinidos:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener turnos predefinidos',
      });
    }
  },

  /**
   * Crear turnos predefinidos
   */
  async crearPredefinidos(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      const turnos = await turnosService.crearPredefinidos(
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: turnos,
        message: `${turnos.length} turnos predefinidos creados`,
      });
    } catch (error: any) {
      console.error('Error al crear turnos predefinidos:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear turnos predefinidos',
      });
    }
  },

  /**
   * Sugerir siguiente código
   */
  async sugerirCodigo(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;

      const codigo = await turnosService.generarCodigo(
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: { codigo },
      });
    } catch (error: any) {
      console.error('Error al sugerir código:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al sugerir código',
      });
    }
  },

  /**
   * Buscar códigos existentes
   */
  async searchCodigos(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const prefix = (req.query.prefix as string) || '';

      const codigos = await turnosService.searchCodigos(
        prefix,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: codigos,
      });
    } catch (error: any) {
      console.error('Error al buscar códigos:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al buscar códigos',
      });
    }
  },

  // ============================================
  // HORARIOS PERSONAL
  // ============================================

  /**
   * Crear horario de personal
   */
  async crearHorarioPersonal(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const createDto: CreateHorarioPersonalDTO = req.body;

      const horario = await turnosService.crearHorarioPersonal(
        createDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: horario,
        message: 'Horario asignado correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear horario:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear el horario',
      });
    }
  },

  /**
   * Buscar horarios de personal
   */
  async buscarHorariosPersonal(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;

      const searchDto: SearchHorarioPersonalDTO = {
        personalId: req.query.personalId as string,
        turnoId: req.query.turnoId as string,
        activo: req.query.activo as 'true' | 'false' | 'all',
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };

      const result = await turnosService.buscarHorariosPersonal(
        searchDto,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: result.horarios,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error: any) {
      console.error('Error al buscar horarios:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al buscar horarios',
      });
    }
  },

  /**
   * Obtener horario actual de personal
   */
  async obtenerHorarioActual(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { personalId } = req.params;

      const horario = await turnosService.obtenerHorarioActual(
        personalId,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: horario,
      });
    } catch (error: any) {
      console.error('Error al obtener horario actual:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener horario',
      });
    }
  },

  /**
   * Obtener turno actual de personal
   */
  async obtenerTurnoActualPersonal(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { personalId } = req.params;

      const turno = await turnosService.obtenerTurnoActualPersonal(
        personalId,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: turno,
      });
    } catch (error: any) {
      console.error('Error al obtener turno actual:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener turno',
      });
    }
  },

  /**
   * Actualizar horario de personal
   */
  async actualizarHorarioPersonal(req: Request, res: Response) {
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
      const updateDto: UpdateHorarioPersonalDTO = req.body;

      const horario = await turnosService.actualizarHorarioPersonal(
        id,
        updateDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!horario) {
        return res.status(404).json({
          success: false,
          error: 'Horario no encontrado',
        });
      }

      return res.json({
        success: true,
        data: horario,
        message: 'Horario actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar horario:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar el horario',
      });
    }
  },

  /**
   * Eliminar horario de personal
   */
  async eliminarHorarioPersonal(req: Request, res: Response) {
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

      const eliminado = await turnosService.eliminarHorarioPersonal(
        id,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          error: 'Horario no encontrado',
        });
      }

      return res.json({
        success: true,
        message: 'Horario eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar horario:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar el horario',
      });
    }
  },
};
