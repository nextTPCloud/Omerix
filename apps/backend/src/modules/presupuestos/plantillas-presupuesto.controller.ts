import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { plantillasPresupuestoService } from './plantillas-presupuesto.service';

export class PlantillasPresupuestoController {
  // ============================================
  // CREAR
  // ============================================

  async crear(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      const plantilla = await plantillasPresupuestoService.crear(
        req.body,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: plantilla,
        message: 'Plantilla creada correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear plantilla:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear plantilla',
      });
    }
  }

  // ============================================
  // CREAR DESDE PRESUPUESTO
  // ============================================

  async crearDesdePresupuesto(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { presupuestoId } = req.params;
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      if (!mongoose.Types.ObjectId.isValid(presupuestoId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de presupuesto inválido',
        });
      }

      const { nombre, descripcion, categoria, mantenerPrecios, mantenerCostes, esPublica } = req.body;

      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio',
        });
      }

      // Importar servicio de presupuestos para obtener el presupuesto
      const { presupuestosService } = await import('./presupuestos.service');
      const presupuesto = await presupuestosService.findById(
        presupuestoId,
        empresaId,
        req.empresaDbConfig
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto no encontrado',
        });
      }

      const plantilla = await plantillasPresupuestoService.crearDesdePresupuesto(
        presupuesto,
        nombre,
        empresaId,
        usuarioId,
        req.empresaDbConfig,
        { descripcion, categoria, mantenerPrecios, mantenerCostes, esPublica }
      );

      res.status(201).json({
        success: true,
        data: plantilla,
        message: 'Plantilla creada desde presupuesto correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear plantilla desde presupuesto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear plantilla desde presupuesto',
      });
    }
  }

  // ============================================
  // OBTENER TODAS
  // ============================================

  async obtenerTodas(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      const result = await plantillasPresupuestoService.findAll(
        empresaId,
        usuarioId,
        req.empresaDbConfig,
        req.query
      );

      res.json({
        success: true,
        data: result.plantillas,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener plantillas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener plantillas',
      });
    }
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async obtenerPorId(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const empresaId = req.empresaId!;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de plantilla inválido',
        });
      }

      const plantilla = await plantillasPresupuestoService.findById(
        id,
        empresaId,
        req.empresaDbConfig
      );

      if (!plantilla) {
        return res.status(404).json({
          success: false,
          message: 'Plantilla no encontrada',
        });
      }

      res.json({
        success: true,
        data: plantilla,
      });
    } catch (error: any) {
      console.error('Error al obtener plantilla:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener plantilla',
      });
    }
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de plantilla inválido',
        });
      }

      const plantilla = await plantillasPresupuestoService.actualizar(
        id,
        req.body,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!plantilla) {
        return res.status(404).json({
          success: false,
          message: 'Plantilla no encontrada',
        });
      }

      res.json({
        success: true,
        data: plantilla,
        message: 'Plantilla actualizada correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar plantilla:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar plantilla',
      });
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const empresaId = req.empresaId!;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de plantilla inválido',
        });
      }

      const plantilla = await plantillasPresupuestoService.eliminar(
        id,
        empresaId,
        req.empresaDbConfig
      );

      if (!plantilla) {
        return res.status(404).json({
          success: false,
          message: 'Plantilla no encontrada',
        });
      }

      res.json({
        success: true,
        message: 'Plantilla eliminada correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar plantilla:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar plantilla',
      });
    }
  }

  // ============================================
  // DUPLICAR
  // ============================================

  async duplicar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { nombre } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de plantilla inválido',
        });
      }

      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio',
        });
      }

      const plantilla = await plantillasPresupuestoService.duplicar(
        id,
        nombre,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: plantilla,
        message: 'Plantilla duplicada correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar plantilla:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al duplicar plantilla',
      });
    }
  }

  // ============================================
  // REGISTRAR USO
  // ============================================

  async registrarUso(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const empresaId = req.empresaId!;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de plantilla inválido',
        });
      }

      await plantillasPresupuestoService.registrarUso(
        id,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: 'Uso registrado',
      });
    } catch (error: any) {
      console.error('Error al registrar uso:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al registrar uso',
      });
    }
  }

  // ============================================
  // OBTENER CATEGORÍAS
  // ============================================

  async getCategorias(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;

      const categorias = await plantillasPresupuestoService.getCategorias(
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: categorias,
      });
    } catch (error: any) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener categorías',
      });
    }
  }

  // ============================================
  // OBTENER MÁS USADAS
  // ============================================

  async getMasUsadas(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const limite = parseInt(req.query.limite as string) || 5;

      const plantillas = await plantillasPresupuestoService.getMasUsadas(
        empresaId,
        usuarioId,
        req.empresaDbConfig,
        limite
      );

      res.json({
        success: true,
        data: plantillas,
      });
    } catch (error: any) {
      console.error('Error al obtener plantillas más usadas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener plantillas más usadas',
      });
    }
  }
}

export const plantillasPresupuestoController = new PlantillasPresupuestoController();
