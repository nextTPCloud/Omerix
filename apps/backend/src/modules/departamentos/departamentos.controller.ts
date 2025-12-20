import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { departamentosService } from './departamentos.service';
import {
  CreateDepartamentoDTO,
  UpdateDepartamentoDTO,
  SearchDepartamentosDTO,
} from './departamentos.dto';

// ============================================
// CONTROLADORES
// ============================================

export const departamentosController = {
  /**
   * Crear un nuevo departamento
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
      const createDto: CreateDepartamentoDTO = req.body;

      const departamento = await departamentosService.crear(
        createDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: departamento,
        message: 'Departamento creado correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear departamento:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear el departamento',
      });
    }
  },

  /**
   * Buscar departamentos con filtros
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

      const searchDto: SearchDepartamentosDTO = {
        search: req.query.search as string,
        activo: req.query.activo as 'true' | 'false' | 'all',
        responsableId: req.query.responsableId as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await departamentosService.buscar(
        searchDto,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: result.departamentos,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error: any) {
      console.error('Error al buscar departamentos:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al buscar departamentos',
      });
    }
  },

  /**
   * Obtener un departamento por ID
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

      const departamento = await departamentosService.obtenerPorId(
        id,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      if (!departamento) {
        return res.status(404).json({
          success: false,
          error: 'Departamento no encontrado',
        });
      }

      return res.json({
        success: true,
        data: departamento,
      });
    } catch (error: any) {
      console.error('Error al obtener departamento:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener el departamento',
      });
    }
  },

  /**
   * Actualizar un departamento
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
      const updateDto: UpdateDepartamentoDTO = req.body;

      const departamento = await departamentosService.actualizar(
        id,
        updateDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!departamento) {
        return res.status(404).json({
          success: false,
          error: 'Departamento no encontrado',
        });
      }

      return res.json({
        success: true,
        data: departamento,
        message: 'Departamento actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar departamento:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar el departamento',
      });
    }
  },

  /**
   * Eliminar un departamento (soft delete)
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

      const eliminado = await departamentosService.eliminar(
        id,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          error: 'Departamento no encontrado',
        });
      }

      return res.json({
        success: true,
        message: 'Departamento eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar departamento:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar el departamento',
      });
    }
  },

  /**
   * Obtener departamentos activos (para selects)
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

      const departamentos = await departamentosService.obtenerActivos(
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: departamentos,
      });
    } catch (error: any) {
      console.error('Error al obtener departamentos activos:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener departamentos',
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

      const codigo = await departamentosService.sugerirCodigo(
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

      const codigos = await departamentosService.searchCodigos(
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
};
