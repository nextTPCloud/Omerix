import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { proyectosService } from './proyectos.service';
import { proyectosRecurrenciaService } from './proyectos-recurrencia.service';
import { proyectosDashboardService } from './proyectos-dashboard.service';
import {
  CreateProyectoSchema,
  UpdateProyectoSchema,
  SearchProyectosSchema,
  CambiarEstadoProyectoSchema,
  AgregarHitoSchema,
  ActualizarHitoSchema,
  AgregarParticipanteSchema,
} from './proyectos.dto';
import { EstadoProyecto, FrecuenciaRecurrencia } from './Proyecto';
import { z } from 'zod';

// Schema de validación para configurar recurrencia
const ConfigurarRecurrenciaSchema = z.object({
  activo: z.boolean(),
  frecuencia: z.enum(['semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual']),
  diaGeneracion: z.number().min(1).max(31),
  fechaInicio: z.string().or(z.date()),
  fechaFin: z.string().or(z.date()).optional(),
  generarParteTrabajo: z.boolean(),
  generarAlbaran: z.boolean(),
  generarFactura: z.boolean(),
  lineasPlantilla: z.array(z.object({
    tipo: z.enum(['mano_obra', 'material', 'gasto', 'maquinaria', 'transporte']),
    descripcion: z.string(),
    cantidad: z.number(),
    unidad: z.string(),
    precioUnitario: z.number(),
    productoId: z.string().optional(),
    personalId: z.string().optional(),
    incluirEnAlbaran: z.boolean(),
  })).optional(),
});

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
  // BUSCAR CÓDIGOS EXISTENTES
  // ============================================

  async searchCodigos(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { prefix = '' } = req.query;

      const codigos = await proyectosService.searchCodigos(
        empresaId,
        String(prefix),
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: codigos,
      });
    } catch (error: any) {
      console.error('Error al buscar códigos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al buscar códigos',
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

  // ============================================
  // OBTENER PERSONAL DISPONIBLE (Para asignar a proyectos)
  // ============================================

  async obtenerPersonalDisponible(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { search } = req.query;

      const personal = await proyectosService.obtenerPersonalDisponible(
        empresaId,
        req.empresaDbConfig,
        search as string | undefined
      );

      res.json({
        success: true,
        data: personal,
      });
    } catch (error: any) {
      console.error('Error al obtener personal disponible:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener personal disponible',
      });
    }
  }

  // ============================================
  // RECURRENCIA - Configurar recurrencia de proyecto
  // ============================================

  async configurarRecurrencia(req: Request, res: Response) {
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

      const validacion = ConfigurarRecurrenciaSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const proyecto = await proyectosRecurrenciaService.configurarRecurrencia(
        id,
        {
          ...validacion.data,
          frecuencia: validacion.data.frecuencia as FrecuenciaRecurrencia,
          fechaInicio: new Date(validacion.data.fechaInicio),
          fechaFin: validacion.data.fechaFin ? new Date(validacion.data.fechaFin) : undefined,
        },
        String(empresaId),
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
        message: 'Configuración de recurrencia actualizada correctamente',
      });
    } catch (error: any) {
      console.error('Error al configurar recurrencia:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al configurar recurrencia',
      });
    }
  }

  // ============================================
  // RECURRENCIA - Obtener proyectos pendientes de generación
  // ============================================

  async obtenerProyectosPendientesGeneracion(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;

      const proyectos = await proyectosRecurrenciaService.obtenerProyectosPendientes(
        String(empresaId),
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: proyectos,
        total: proyectos.length,
      });
    } catch (error: any) {
      console.error('Error al obtener proyectos pendientes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener proyectos pendientes',
      });
    }
  }

  // ============================================
  // RECURRENCIA - Ejecutar generación masiva
  // ============================================

  async ejecutarGeneracionMasiva(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      const resumen = await proyectosRecurrenciaService.ejecutarGeneracionMasiva(
        String(empresaId),
        usuarioId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: resumen,
        message: `Generación completada: ${resumen.totalExitos} éxitos, ${resumen.totalErrores} errores`,
      });
    } catch (error: any) {
      console.error('Error en generación masiva:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error en generación masiva',
      });
    }
  }

  // ============================================
  // RECURRENCIA - Procesar proyecto individual
  // ============================================

  async procesarProyectoRecurrente(req: Request, res: Response) {
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

      // Obtener proyecto
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

      if (!proyecto.esRecurrente || !proyecto.recurrencia?.activo) {
        return res.status(400).json({
          success: false,
          message: 'El proyecto no tiene recurrencia activa',
        });
      }

      const resultado = await proyectosRecurrenciaService.procesarProyectoRecurrente(
        proyecto,
        String(empresaId),
        usuarioId,
        req.empresaDbConfig
      );

      res.json({
        success: resultado.exito,
        data: resultado,
        message: resultado.exito
          ? 'Generación completada correctamente'
          : `Error: ${resultado.error}`,
      });
    } catch (error: any) {
      console.error('Error al procesar proyecto recurrente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al procesar proyecto recurrente',
      });
    }
  }

  // ============================================
  // RECURRENCIA - Obtener historial de generaciones
  // ============================================

  async obtenerHistorialGeneraciones(req: Request, res: Response) {
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

      const historial = await proyectosRecurrenciaService.obtenerHistorialGeneraciones(
        id,
        String(empresaId),
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: historial,
      });
    } catch (error: any) {
      console.error('Error al obtener historial de generaciones:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener historial de generaciones',
      });
    }
  }
  // ============================================
  // DASHBOARD
  // ============================================

  async obtenerDashboard(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const dashboardData = await proyectosDashboardService.getDashboardData(
        req.empresaId!,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error: any) {
      console.error('Error al obtener dashboard de proyectos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener dashboard',
      });
    }
  }
}

export const proyectosController = new ProyectosController();
