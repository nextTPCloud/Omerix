import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { pedidosService } from './pedidos.service';
import {
  CreatePedidoSchema,
  UpdatePedidoSchema,
  SearchPedidosSchema,
  CambiarEstadoPedidoSchema,
  AplicarMargenSchema,
  ImportarLineasSchema,
  DuplicarPedidoSchema,
  CrearDesdePresupuestoSchema,
} from './pedidos.dto';
import { EstadoPedido } from './Pedido';

export class PedidosController {
  // ============================================
  // CREAR PEDIDO
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
      const validacion = CreatePedidoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const pedido = await pedidosService.crear(
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: pedido,
        message: 'Pedido creado correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear pedido:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear pedido',
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
      const empresaId = req.empresaId;
      const usuarioId = req.userId;

      // Validar que empresaId y usuarioId estén presentes
      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'empresaId is required',
        });
      }

      if (!usuarioId) {
        return res.status(401).json({
          success: false,
          message: 'userId is required',
        });
      }

      if (!mongoose.Types.ObjectId.isValid(presupuestoId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de presupuesto inválido',
        });
      }

      // Validar opciones
      const validacion = CrearDesdePresupuestoSchema.safeParse({
        ...req.body,
        presupuestoId,
      });
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const pedido = await pedidosService.crearDesdePresupuesto(
        presupuestoId,
        validacion.data,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: pedido,
        message: 'Pedido creado desde presupuesto correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear pedido desde presupuesto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear pedido desde presupuesto',
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
      const validacion = SearchPedidosSchema.safeParse(req.query);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros de búsqueda inválidos',
          errors: validacion.error.errors,
        });
      }

      const result = await pedidosService.findAll(
        empresaId,
        req.empresaDbConfig,
        validacion.data
      );

      res.json({
        success: true,
        data: result.pedidos,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener pedidos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener pedidos',
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
          message: 'ID de pedido inválido',
        });
      }

      const pedido = await pedidosService.findById(
        id,
        empresaId,
        req.empresaDbConfig,
        ocultarCostes
      );

      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado',
        });
      }

      res.json({
        success: true,
        data: pedido,
      });
    } catch (error: any) {
      console.error('Error al obtener pedido:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener pedido',
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
          message: 'ID de pedido inválido',
        });
      }

      // Validar datos
      const validacion = UpdatePedidoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const pedido = await pedidosService.actualizar(
        id,
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado',
        });
      }

      res.json({
        success: true,
        data: pedido,
        message: 'Pedido actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar pedido:', error);

      if (error.message?.includes('bloqueado')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar pedido',
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
          message: 'ID de pedido inválido',
        });
      }

      const pedido = await pedidosService.eliminar(
        id,
        empresaId,
        req.empresaDbConfig
      );

      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Pedido eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar pedido:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar pedido',
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
      const validacion = CambiarEstadoPedidoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const pedido = await pedidosService.cambiarEstado(
        id,
        validacion.data.estado as EstadoPedido,
        usuarioId,
        empresaId,
        req.empresaDbConfig,
        validacion.data.observaciones
      );

      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado',
        });
      }

      res.json({
        success: true,
        data: pedido,
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

      const validacion = DuplicarPedidoSchema.safeParse(req.body);
      const opciones = validacion.success ? validacion.data : {};

      const pedido = await pedidosService.duplicar(
        id,
        opciones,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: pedido,
        message: 'Pedido duplicado correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar pedido:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al duplicar pedido',
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

      const pedido = await pedidosService.aplicarMargen(
        id,
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado',
        });
      }

      res.json({
        success: true,
        data: pedido,
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

      const pedido = await pedidosService.importarLineas(
        id,
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado',
        });
      }

      res.json({
        success: true,
        data: pedido,
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

      const estadisticas = await pedidosService.obtenerEstadisticas(
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
      const serie = (req.query.serie as string) || 'PV';

      const resultado = await pedidosService.sugerirCodigo(
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

      const eliminados = await pedidosService.eliminarVarios(
        ids,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: `${eliminados} pedido(s) eliminado(s)`,
        data: { eliminados },
      });
    } catch (error: any) {
      console.error('Error al eliminar pedidos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar pedidos',
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

      const pedidos = await pedidosService.findByClienteId(
        clienteId,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: pedidos,
      });
    } catch (error: any) {
      console.error('Error al obtener pedidos del cliente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener pedidos del cliente',
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

      const pedidos = await pedidosService.findByProyectoId(
        proyectoId,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: pedidos,
      });
    } catch (error: any) {
      console.error('Error al obtener pedidos del proyecto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener pedidos del proyecto',
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

      const pedido = await pedidosService.toggleMostrarCostes(
        id,
        mostrarCostes,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado',
        });
      }

      res.json({
        success: true,
        data: { mostrarCostes: pedido.mostrarCostes },
        message: pedido.mostrarCostes ? 'Costes visibles' : 'Costes ocultos',
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
          message: 'ID de pedido inválido',
        });
      }

      const { asunto, mensaje, cc, bcc } = req.body;

      const result = await pedidosService.enviarPorEmail(
        id,
        empresaId,
        usuarioId,
        req.empresaDbConfig,
        { asunto, mensaje, cc, bcc }
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
      console.error('Error al enviar pedido por email:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al enviar pedido por email',
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
          message: 'ID de pedido inválido',
        });
      }

      const result = await pedidosService.generarURLWhatsApp(
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
  // NOTAS DE SEGUIMIENTO
  // ============================================

  async addNotaSeguimiento(req: Request, res: Response) {
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
      const { tipo, contenido, resultado, proximaAccion, fechaProximaAccion } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de pedido inválido',
        });
      }

      if (!tipo || !contenido) {
        return res.status(400).json({
          success: false,
          message: 'El tipo y contenido son obligatorios',
        });
      }

      const pedido = await pedidosService.addNotaSeguimiento(
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
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: 'Nota de seguimiento añadida correctamente',
        data: pedido,
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
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id, notaId } = req.params;
      const empresaId = req.empresaId!;

      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(notaId)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      const pedido = await pedidosService.deleteNotaSeguimiento(
        id,
        notaId,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: 'Nota de seguimiento eliminada correctamente',
        data: pedido,
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
  // ALERTAS
  // ============================================

  async getAlertas(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const diasAlerta = parseInt(req.query.dias as string) || 7;

      const alertas = await pedidosService.getAlertas(
        empresaId,
        req.empresaDbConfig,
        diasAlerta
      );

      res.json({
        success: true,
        data: alertas,
      });
    } catch (error: any) {
      console.error('Error al obtener alertas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener alertas',
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

      const resumen = await pedidosService.getResumenAlertas(
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

      const kpis = await pedidosService.getKPIs(
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
}

export const pedidosController = new PedidosController();
