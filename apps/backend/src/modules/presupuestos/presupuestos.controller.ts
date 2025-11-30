import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { presupuestosService } from './presupuestos.service';
import {
  CreatePresupuestoSchema,
  UpdatePresupuestoSchema,
  SearchPresupuestosSchema,
  CambiarEstadoPresupuestoSchema,
  AplicarMargenSchema,
  ImportarLineasSchema,
  DuplicarPresupuestoSchema,
} from './presupuestos.dto';
import { EstadoPresupuesto } from './Presupuesto';

export class PresupuestosController {
  // ============================================
  // CREAR PRESUPUESTO
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

      // Validar datos
      const validacion = CreatePresupuestoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const presupuesto = await presupuestosService.crear(
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: presupuesto,
        message: 'Presupuesto creado correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear presupuesto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear presupuesto',
      });
    }
  }

  // ============================================
  // OBTENER TODOS
  // ============================================

  async obtenerTodos(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;

      // Validar query params
      const validacion = SearchPresupuestosSchema.safeParse(req.query);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros de búsqueda inválidos',
          errors: validacion.error.errors,
        });
      }

      const result = await presupuestosService.findAll(
        empresaId,
        req.empresaDbConfig,
        validacion.data
      );

      res.json({
        success: true,
        data: result.presupuestos,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener presupuestos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener presupuestos',
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
      const ocultarCostes = req.query.ocultarCostes === 'true';

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de presupuesto inválido',
        });
      }

      const presupuesto = await presupuestosService.findById(
        id,
        empresaId,
        req.empresaDbConfig,
        ocultarCostes
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto no encontrado',
        });
      }

      res.json({
        success: true,
        data: presupuesto,
      });
    } catch (error: any) {
      console.error('Error al obtener presupuesto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener presupuesto',
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
          message: 'ID de presupuesto inválido',
        });
      }

      // Validar datos
      const validacion = UpdatePresupuestoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const presupuesto = await presupuestosService.actualizar(
        id,
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto no encontrado',
        });
      }

      res.json({
        success: true,
        data: presupuesto,
        message: 'Presupuesto actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar presupuesto:', error);

      if (error.message?.includes('bloqueado')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar presupuesto',
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
          message: 'ID de presupuesto inválido',
        });
      }

      const presupuesto = await presupuestosService.eliminar(
        id,
        empresaId,
        req.empresaDbConfig
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Presupuesto eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar presupuesto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar presupuesto',
      });
    }
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(req: Request, res: Response) {
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

      // Validar datos
      const validacion = CambiarEstadoPresupuestoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const fechaRespuesta = validacion.data.fechaRespuesta
        ? new Date(validacion.data.fechaRespuesta)
        : undefined;

      const presupuesto = await presupuestosService.cambiarEstado(
        id,
        validacion.data.estado as EstadoPresupuesto,
        usuarioId,
        empresaId,
        req.empresaDbConfig,
        validacion.data.observaciones,
        fechaRespuesta
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto no encontrado',
        });
      }

      res.json({
        success: true,
        data: presupuesto,
        message: `Estado cambiado a ${validacion.data.estado}`,
      });
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar estado',
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

      const validacion = DuplicarPresupuestoSchema.safeParse(req.body);
      const opciones = validacion.success ? validacion.data : {};

      const presupuesto = await presupuestosService.duplicar(
        id,
        opciones,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: presupuesto,
        message: 'Presupuesto duplicado correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar presupuesto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al duplicar presupuesto',
      });
    }
  }

  // ============================================
  // CREAR REVISIÓN
  // ============================================

  async crearRevision(req: Request, res: Response) {
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

      const revision = await presupuestosService.crearRevision(
        id,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: revision,
        message: 'Revisión creada correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear revisión:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear revisión',
      });
    }
  }

  // ============================================
  // APLICAR MARGEN
  // ============================================

  async aplicarMargen(req: Request, res: Response) {
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

      const validacion = AplicarMargenSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const presupuesto = await presupuestosService.aplicarMargen(
        id,
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto no encontrado',
        });
      }

      res.json({
        success: true,
        data: presupuesto,
        message: 'Margen aplicado correctamente',
      });
    } catch (error: any) {
      console.error('Error al aplicar margen:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al aplicar margen',
      });
    }
  }

  // ============================================
  // IMPORTAR LÍNEAS
  // ============================================

  async importarLineas(req: Request, res: Response) {
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

      const validacion = ImportarLineasSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const presupuesto = await presupuestosService.importarLineas(
        id,
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto no encontrado',
        });
      }

      res.json({
        success: true,
        data: presupuesto,
        message: 'Líneas importadas correctamente',
      });
    } catch (error: any) {
      console.error('Error al importar líneas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al importar líneas',
      });
    }
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;

      const estadisticas = await presupuestosService.obtenerEstadisticas(
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      });
    }
  }

  // ============================================
  // SUGERIR CÓDIGO
  // ============================================

  async sugerirCodigo(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const serie = (req.query.serie as string) || 'P';

      const resultado = await presupuestosService.sugerirCodigo(
        empresaId,
        req.empresaDbConfig,
        serie
      );

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error al sugerir código:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al sugerir código',
      });
    }
  }

  // ============================================
  // ELIMINAR EN LOTE
  // ============================================

  async eliminarVarios(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { ids } = req.body;
      const empresaId = req.empresaId!;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un array de IDs',
        });
      }

      const eliminados = await presupuestosService.eliminarVarios(
        ids,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: `${eliminados} presupuesto(s) eliminado(s)`,
        data: { eliminados },
      });
    } catch (error: any) {
      console.error('Error al eliminar presupuestos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar presupuestos',
      });
    }
  }

  // ============================================
  // OBTENER POR CLIENTE
  // ============================================

  async obtenerPorCliente(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { clienteId } = req.params;
      const empresaId = req.empresaId!;

      const presupuestos = await presupuestosService.findByClienteId(
        clienteId,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: presupuestos,
      });
    } catch (error: any) {
      console.error('Error al obtener presupuestos del cliente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener presupuestos del cliente',
      });
    }
  }

  // ============================================
  // OBTENER POR PROYECTO
  // ============================================

  async obtenerPorProyecto(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { proyectoId } = req.params;
      const empresaId = req.empresaId!;

      const presupuestos = await presupuestosService.findByProyectoId(
        proyectoId,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: presupuestos,
      });
    } catch (error: any) {
      console.error('Error al obtener presupuestos del proyecto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener presupuestos del proyecto',
      });
    }
  }

  // ============================================
  // TOGGLE MOSTRAR COSTES
  // ============================================

  async toggleMostrarCostes(req: Request, res: Response) {
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
      const { mostrarCostes } = req.body;

      const presupuesto = await presupuestosService.actualizar(
        id,
        { mostrarCostes },
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto no encontrado',
        });
      }

      res.json({
        success: true,
        data: { mostrarCostes: presupuesto.mostrarCostes },
        message: presupuesto.mostrarCostes ? 'Costes visibles' : 'Costes ocultos',
      });
    } catch (error: any) {
      console.error('Error al cambiar visibilidad de costes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar visibilidad de costes',
      });
    }
  }
}

export const presupuestosController = new PresupuestosController();
