import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { presupuestosService } from './presupuestos.service';
import { recordatoriosService } from './recordatorios.service';
import { portalClienteService } from './portal-cliente.service';
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

  // ============================================
  // ENVIAR POR EMAIL
  // ============================================

  async enviarPorEmail(req: Request, res: Response) {
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

      const { asunto, mensaje, cc, bcc, pdfOptions } = req.body;

      const result = await presupuestosService.enviarPorEmail(
        id,
        empresaId,
        usuarioId,
        req.empresaDbConfig,
        { asunto, mensaje, cc, bcc, pdfOptions }
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        message: result.message,
        data: { messageId: result.messageId },
      });
    } catch (error: any) {
      console.error('Error al enviar presupuesto por email:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al enviar presupuesto por email',
      });
    }
  }

  // ============================================
  // ENVIAR MASIVO POR EMAIL
  // ============================================

  async enviarMasivoPorEmail(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      const { ids, asunto, mensaje, pdfOptions } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un array de IDs',
        });
      }

      if (ids.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'El envío masivo está limitado a 50 presupuestos por vez',
        });
      }

      const result = await presupuestosService.enviarMasivoPorEmail(
        ids,
        empresaId,
        usuarioId,
        req.empresaDbConfig,
        { asunto, mensaje, pdfOptions }
      );

      res.json({
        success: result.success,
        message: `${result.enviados} de ${result.total} emails enviados correctamente`,
        data: result,
      });
    } catch (error: any) {
      console.error('Error al enviar presupuestos masivamente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al enviar presupuestos masivamente',
      });
    }
  }

  // ============================================
  // GENERAR URL WHATSAPP
  // ============================================

  async generarURLWhatsApp(req: Request, res: Response) {
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

      const result = await presupuestosService.generarURLWhatsApp(
        id,
        empresaId,
        req.empresaDbConfig
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: { url: result.url },
      });
    } catch (error: any) {
      console.error('Error al generar URL WhatsApp:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al generar URL WhatsApp',
      });
    }
  }

  // ============================================
  // GENERAR URLs WHATSAPP MASIVO
  // ============================================

  async generarURLsWhatsAppMasivo(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un array de IDs',
        });
      }

      const result = await presupuestosService.generarURLsWhatsAppMasivo(
        ids,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: result.success,
        data: result.resultados,
      });
    } catch (error: any) {
      console.error('Error al generar URLs WhatsApp:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al generar URLs WhatsApp',
      });
    }
  }

  // ============================================
  // NOTAS DE SEGUIMIENTO
  // ============================================

  async addNotaSeguimiento(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;
      const usuarioId = req.usuarioId!;
      const { tipo, contenido, resultado, proximaAccion, fechaProximaAccion } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de presupuesto inválido',
        });
      }

      if (!tipo || !contenido) {
        return res.status(400).json({
          success: false,
          message: 'El tipo y contenido son obligatorios',
        });
      }

      const presupuesto = await presupuestosService.addNotaSeguimiento(
        id,
        usuarioId,
        {
          tipo,
          contenido,
          resultado,
          proximaAccion,
          fechaProximaAccion: fechaProximaAccion ? new Date(fechaProximaAccion) : undefined,
        },
        empresaId,
        dbConfig
      );

      res.json({
        success: true,
        message: 'Nota de seguimiento añadida correctamente',
        data: presupuesto,
      });
    } catch (error: any) {
      console.error('Error al añadir nota de seguimiento:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al añadir nota de seguimiento',
      });
    }
  }

  async deleteNotaSeguimiento(req: Request, res: Response) {
    try {
      const { id, notaId } = req.params;
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;

      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(notaId)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      const presupuesto = await presupuestosService.deleteNotaSeguimiento(id, notaId, empresaId, dbConfig);

      res.json({
        success: true,
        message: 'Nota de seguimiento eliminada correctamente',
        data: presupuesto,
      });
    } catch (error: any) {
      console.error('Error al eliminar nota de seguimiento:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar nota de seguimiento',
      });
    }
  }

  // ============================================
  // ALERTAS DE VALIDEZ
  // ============================================

  async getAlertasValidez(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const diasAlerta = parseInt(req.query.dias as string) || 7;

      const alertas = await presupuestosService.getAlertasValidez(
        empresaId,
        req.empresaDbConfig,
        diasAlerta
      );

      res.json({
        success: true,
        data: alertas,
      });
    } catch (error: any) {
      console.error('Error al obtener alertas de validez:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener alertas de validez',
      });
    }
  }

  async getResumenAlertas(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const diasAlerta = parseInt(req.query.dias as string) || 7;

      const resumen = await presupuestosService.getResumenAlertas(
        empresaId,
        req.empresaDbConfig,
        diasAlerta
      );

      res.json({
        success: true,
        data: resumen,
      });
    } catch (error: any) {
      console.error('Error al obtener resumen de alertas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener resumen de alertas',
      });
    }
  }

  // ============================================
  // KPIs DASHBOARD
  // ============================================

  async getKPIs(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;

      // Parsear fechas opcionales del periodo
      const desde = req.query.desde ? new Date(req.query.desde as string) : undefined;
      const hasta = req.query.hasta ? new Date(req.query.hasta as string) : undefined;

      const kpis = await presupuestosService.getKPIs(
        empresaId,
        req.empresaDbConfig,
        { desde, hasta }
      );

      res.json({
        success: true,
        data: kpis,
      });
    } catch (error: any) {
      console.error('Error al obtener KPIs:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener KPIs',
      });
    }
  }

  // ============================================
  // RECORDATORIOS
  // ============================================

  /**
   * Ejecutar recordatorios automáticos
   */
  async ejecutarRecordatorios(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { enviarExpiracion, enviarSeguimiento, notificarAgentes } = req.body;

      const resultado = await recordatoriosService.ejecutarRecordatorios(
        empresaId,
        req.empresaDbConfig,
        { enviarExpiracion, enviarSeguimiento, notificarAgentes }
      );

      res.json({
        success: true,
        data: resultado,
        message: `Recordatorios procesados: ${resultado.resumen.enviados} enviados, ${resultado.resumen.fallidos} fallidos`,
      });
    } catch (error: any) {
      console.error('Error al ejecutar recordatorios:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al ejecutar recordatorios',
      });
    }
  }

  /**
   * Obtener resumen de recordatorios pendientes
   */
  async getRecordatoriosPendientes(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;

      const resumen = await recordatoriosService.getResumenPendientes(
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: resumen,
      });
    } catch (error: any) {
      console.error('Error al obtener recordatorios pendientes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener recordatorios pendientes',
      });
    }
  }

  /**
   * Enviar recordatorio manual a un presupuesto
   */
  async enviarRecordatorioManual(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const empresaId = req.empresaId!;
      const { tipo } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de presupuesto inválido',
        });
      }

      if (!tipo || !['expiracion', 'seguimiento'].includes(tipo)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de recordatorio inválido. Use "expiracion" o "seguimiento"',
        });
      }

      const resultado = await recordatoriosService.enviarRecordatorioManual(
        empresaId,
        id,
        tipo,
        req.empresaDbConfig
      );

      res.json({
        success: resultado.success,
        data: resultado,
        message: resultado.message,
      });
    } catch (error: any) {
      console.error('Error al enviar recordatorio manual:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al enviar recordatorio manual',
      });
    }
  }

  /**
   * Obtener historial de recordatorios de un presupuesto
   */
  async getHistorialRecordatorios(req: Request, res: Response) {
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

      const historial = await recordatoriosService.getHistorialRecordatorios(
        empresaId,
        id,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: historial,
      });
    } catch (error: any) {
      console.error('Error al obtener historial de recordatorios:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener historial de recordatorios',
      });
    }
  }

  /**
   * Actualizar configuración de recordatorios de un presupuesto
   */
  async actualizarConfigRecordatorios(req: Request, res: Response) {
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

      const { activo, diasAntesExpiracion, enviarAlCliente, enviarAlAgente, maxRecordatorios } = req.body;

      const presupuesto = await recordatoriosService.actualizarConfigRecordatorios(
        empresaId,
        id,
        { activo, diasAntesExpiracion, enviarAlCliente, enviarAlAgente, maxRecordatorios },
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
        data: presupuesto.recordatoriosConfig,
        message: 'Configuración de recordatorios actualizada',
      });
    } catch (error: any) {
      console.error('Error al actualizar config de recordatorios:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar configuración de recordatorios',
      });
    }
  }

  // ============================================
  // PORTAL DE CLIENTE
  // ============================================

  /**
   * Generar enlace del portal para un presupuesto
   */
  async generarEnlacePortal(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const empresaId = req.empresaId!;
      const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;

      const resultado = await portalClienteService.generarEnlacePortal(
        id,
        String(empresaId),
        req.empresaDbConfig,
        baseUrl
      );

      res.json({
        success: true,
        data: resultado,
        message: 'Enlace del portal generado correctamente',
      });
    } catch (error: any) {
      console.error('Error al generar enlace del portal:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al generar enlace del portal',
      });
    }
  }

  /**
   * Regenerar token del portal (invalida el anterior)
   */
  async regenerarTokenPortal(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const empresaId = req.empresaId!;
      const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;

      const resultado = await portalClienteService.regenerarToken(
        id,
        String(empresaId),
        req.empresaDbConfig,
        baseUrl
      );

      res.json({
        success: true,
        data: resultado,
        message: 'Token regenerado correctamente. El enlace anterior ya no es válido.',
      });
    } catch (error: any) {
      console.error('Error al regenerar token del portal:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al regenerar token del portal',
      });
    }
  }

  /**
   * Invalidar token del portal
   */
  async invalidarTokenPortal(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const empresaId = req.empresaId!;

      await portalClienteService.invalidarToken(
        id,
        String(empresaId),
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: 'Token invalidado correctamente',
      });
    } catch (error: any) {
      console.error('Error al invalidar token del portal:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al invalidar token del portal',
      });
    }
  }

  // ============================================
  // EXPORTAR PDFs MASIVO
  // ============================================

  async exportarPDFsMasivo(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { ids, pdfOptions } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un array de IDs',
        });
      }

      if (ids.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'La exportación masiva está limitada a 50 presupuestos por vez',
        });
      }

      // Validar IDs
      for (const id of ids) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: `ID inválido: ${id}`,
          });
        }
      }

      const resultado = await presupuestosService.exportarPDFsMasivo(
        ids,
        empresaId,
        req.empresaDbConfig,
        pdfOptions
      );

      if (!resultado.success) {
        return res.status(500).json({
          success: false,
          message: resultado.message,
        });
      }

      // Si es un solo presupuesto, devolver el PDF directamente
      if (ids.length === 1 && resultado.pdf) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${resultado.filename}"`);
        return res.send(resultado.pdf);
      }

      // Si son múltiples, devolver el ZIP
      if (resultado.zip) {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${resultado.filename}"`);
        return res.send(resultado.zip);
      }

      return res.status(500).json({
        success: false,
        message: 'Error al generar los archivos',
      });
    } catch (error: any) {
      console.error('Error al exportar PDFs masivamente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al exportar PDFs masivamente',
      });
    }
  }
}

export const presupuestosController = new PresupuestosController();
