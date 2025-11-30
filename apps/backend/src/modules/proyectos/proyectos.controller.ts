import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { proyectosService } from './proyectos.service';
import {
  CreateProyectoSchema,
  UpdateProyectoSchema,
  SearchProyectosSchema,
  CambiarEstadoProyectoSchema,
  AgregarHitoSchema,
  ActualizarHitoSchema,
  AgregarParticipanteSchema,
} from './proyectos.dto';
import { EstadoProyecto } from './Proyecto';

export class ProyectosController {
  // ============================================
  // CREAR PROYECTO
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
      const validacion = CreateProyectoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const proyecto = await proyectosService.crear(
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: proyecto,
        message: 'Proyecto creado correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear proyecto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear proyecto',
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
      const validacion = SearchProyectosSchema.safeParse(req.query);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros de búsqueda inválidos',
          errors: validacion.error.errors,
        });
      }

      const result = await proyectosService.findAll(
        empresaId,
        req.empresaDbConfig,
        validacion.data
      );

      res.json({
        success: true,
        data: result.proyectos,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener proyectos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener proyectos',
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
          message: 'ID de proyecto inválido',
        });
      }

      const proyecto = await proyectosService.findById(
        id,
        empresaId,
        req.empresaDbConfig
      );

      if (!proyecto) {
        return res.status(404).json({
          success: false,
          message: 'Proyecto no encontrado',
        });
      }

      res.json({
        success: true,
        data: proyecto,
      });
    } catch (error: any) {
      console.error('Error al obtener proyecto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener proyecto',
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
          message: 'ID de proyecto inválido',
        });
      }

      // Validar datos
      const validacion = UpdateProyectoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const proyecto = await proyectosService.actualizar(
        id,
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!proyecto) {
        return res.status(404).json({
          success: false,
          message: 'Proyecto no encontrado',
        });
      }

      res.json({
        success: true,
        data: proyecto,
        message: 'Proyecto actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar proyecto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar proyecto',
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
          message: 'ID de proyecto inválido',
        });
      }

      const proyecto = await proyectosService.eliminar(
        id,
        empresaId,
        req.empresaDbConfig
      );

      if (!proyecto) {
        return res.status(404).json({
          success: false,
          message: 'Proyecto no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Proyecto eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar proyecto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar proyecto',
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
      const validacion = CambiarEstadoProyectoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const proyecto = await proyectosService.cambiarEstado(
        id,
        validacion.data.estado as EstadoProyecto,
        usuarioId,
        empresaId,
        req.empresaDbConfig,
        validacion.data.observaciones
      );

      if (!proyecto) {
        return res.status(404).json({
          success: false,
          message: 'Proyecto no encontrado',
        });
      }

      res.json({
        success: true,
        data: proyecto,
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

      const proyecto = await proyectosService.duplicar(
        id,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: proyecto,
        message: 'Proyecto duplicado correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar proyecto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al duplicar proyecto',
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

      const estadisticas = await proyectosService.obtenerEstadisticas(
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

      const codigo = await proyectosService.sugerirCodigo(
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: { codigo },
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

      const eliminados = await proyectosService.eliminarVarios(
        ids,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: `${eliminados} proyecto(s) eliminado(s)`,
        data: { eliminados },
      });
    } catch (error: any) {
      console.error('Error al eliminar proyectos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar proyectos',
      });
    }
  }

  // ============================================
  // GESTIÓN DE HITOS
  // ============================================

  async agregarHito(req: Request, res: Response) {
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

      const validacion = AgregarHitoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const proyecto = await proyectosService.agregarHito(
        id,
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!proyecto) {
        return res.status(404).json({
          success: false,
          message: 'Proyecto no encontrado',
        });
      }

      res.json({
        success: true,
        data: proyecto,
        message: 'Hito agregado correctamente',
      });
    } catch (error: any) {
      console.error('Error al agregar hito:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al agregar hito',
      });
    }
  }

  async actualizarHito(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id, hitoId } = req.params;
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      const validacion = ActualizarHitoSchema.partial().safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const proyecto = await proyectosService.actualizarHito(
        id,
        hitoId,
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!proyecto) {
        return res.status(404).json({
          success: false,
          message: 'Proyecto o hito no encontrado',
        });
      }

      res.json({
        success: true,
        data: proyecto,
        message: 'Hito actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar hito:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar hito',
      });
    }
  }

  async eliminarHito(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id, hitoId } = req.params;
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      const proyecto = await proyectosService.eliminarHito(
        id,
        hitoId,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!proyecto) {
        return res.status(404).json({
          success: false,
          message: 'Proyecto no encontrado',
        });
      }

      res.json({
        success: true,
        data: proyecto,
        message: 'Hito eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar hito:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar hito',
      });
    }
  }

  // ============================================
  // GESTIÓN DE PARTICIPANTES
  // ============================================

  async agregarParticipante(req: Request, res: Response) {
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

      const validacion = AgregarParticipanteSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const proyecto = await proyectosService.agregarParticipante(
        id,
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!proyecto) {
        return res.status(404).json({
          success: false,
          message: 'Proyecto no encontrado',
        });
      }

      res.json({
        success: true,
        data: proyecto,
        message: 'Participante agregado correctamente',
      });
    } catch (error: any) {
      console.error('Error al agregar participante:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al agregar participante',
      });
    }
  }

  async eliminarParticipante(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id, participanteId } = req.params;
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      const proyecto = await proyectosService.eliminarParticipante(
        id,
        participanteId,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!proyecto) {
        return res.status(404).json({
          success: false,
          message: 'Proyecto no encontrado',
        });
      }

      res.json({
        success: true,
        data: proyecto,
        message: 'Participante eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar participante:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar participante',
      });
    }
  }

  // ============================================
  // OBTENER PROYECTOS POR CLIENTE
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

      const proyectos = await proyectosService.findByClienteId(
        clienteId,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: proyectos,
      });
    } catch (error: any) {
      console.error('Error al obtener proyectos del cliente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener proyectos del cliente',
      });
    }
  }
}

export const proyectosController = new ProyectosController();
