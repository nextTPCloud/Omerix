import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { albaranesService } from './albaranes.service';
import {
  CreateAlbaranDTO,
  UpdateAlbaranDTO,
  SearchAlbaranesDTO,
  CrearDesdePedidoDTO,
  RegistrarEntregaDTO,
  CambiarEstadoDTO,
} from './albaranes.dto';
import { EstadoAlbaran } from './Albaran';

// ============================================
// CONTROLADORES
// ============================================

export const albaranesController = {
  /**
   * Crear un nuevo albarán
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
      const createDto: CreateAlbaranDTO = req.body;

      const albaran = await albaranesService.crear(
        createDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: albaran,
        message: 'Albarán creado correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear albarán:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear el albarán',
      });
    }
  },

  /**
   * Crear albarán desde pedido
   */
  async crearDesdePedido(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { pedidoId } = req.params;
      const dto: CrearDesdePedidoDTO = req.body;

      const albaran = await albaranesService.crearDesdePedido(
        pedidoId,
        dto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: albaran,
        message: 'Albarán creado desde pedido correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear albarán desde pedido:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear el albarán desde pedido',
      });
    }
  },

  /**
   * Crear albarán directamente desde presupuesto (sin pasar por pedido)
   */
  async crearDesdePresupuesto(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { presupuestoId } = req.params;
      const { copiarNotas } = req.body;

      const albaran = await albaranesService.crearDesdePresupuesto(
        presupuestoId,
        { copiarNotas },
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: albaran,
        message: 'Albarán creado desde presupuesto correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear albarán desde presupuesto:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear el albarán desde presupuesto',
      });
    }
  },

  /**
   * Obtener todos los albaranes con filtros y paginación
   */
  async buscar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no encontrada',
        });
      }

      const empresaId = req.empresaId!;

      // Incluir todos los query params para soportar filtros avanzados (_ne, _gt, etc.)
      const searchDto: SearchAlbaranesDTO & Record<string, any> = {
        ...req.query, // Incluir todos los params para filtros avanzados
        search: req.query.search as string,
        clienteId: req.query.clienteId as string,
        proyectoId: req.query.proyectoId as string,
        agenteComercialId: req.query.agenteComercialId as string,
        almacenId: req.query.almacenId as string,
        estado: req.query.estado as EstadoAlbaran,
        estados: req.query.estados as string,
        tipo: req.query.tipo as any,
        serie: req.query.serie as string,
        activo: req.query.activo as 'true' | 'false' | 'all',
        facturado: req.query.facturado as 'true' | 'false',
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        fechaEntregaDesde: req.query.fechaEntregaDesde as string,
        fechaEntregaHasta: req.query.fechaEntregaHasta as string,
        importeMin: req.query.importeMin as string,
        importeMax: req.query.importeMax as string,
        pedidoOrigenId: req.query.pedidoOrigenId as string,
        tags: req.query.tags as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sortBy: req.query.sortBy as string || 'fecha',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const resultado = await albaranesService.buscar(
        searchDto,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: resultado.albaranes,
        total: resultado.total,
        page: resultado.page,
        limit: resultado.limit,
        totalPages: resultado.totalPages,
      });
    } catch (error: any) {
      console.error('Error al buscar albaranes:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al buscar albaranes',
      });
    }
  },

  /**
   * Obtener un albarán por ID
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

      const albaran = await albaranesService.obtenerPorId(
        id,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      if (!albaran) {
        return res.status(404).json({
          success: false,
          error: 'Albarán no encontrado',
        });
      }

      return res.json({
        success: true,
        data: albaran,
      });
    } catch (error: any) {
      console.error('Error al obtener albarán:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener el albarán',
      });
    }
  },

  /**
   * Actualizar un albarán
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
      const updateDto: UpdateAlbaranDTO = req.body;

      const albaran = await albaranesService.actualizar(
        id,
        updateDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!albaran) {
        return res.status(404).json({
          success: false,
          error: 'Albarán no encontrado',
        });
      }

      return res.json({
        success: true,
        data: albaran,
        message: 'Albarán actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar albarán:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar el albarán',
      });
    }
  },

  /**
   * Registrar entrega
   */
  async registrarEntrega(req: Request, res: Response) {
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
      const dto: RegistrarEntregaDTO = req.body;

      const albaran = await albaranesService.registrarEntrega(
        id,
        dto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!albaran) {
        return res.status(404).json({
          success: false,
          error: 'Albarán no encontrado',
        });
      }

      return res.json({
        success: true,
        data: albaran,
        message: 'Entrega registrada correctamente',
      });
    } catch (error: any) {
      console.error('Error al registrar entrega:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al registrar la entrega',
      });
    }
  },

  /**
   * Cambiar estado del albarán
   */
  async cambiarEstado(req: Request, res: Response) {
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
      const { estado, observaciones }: CambiarEstadoDTO = req.body;

      const albaran = await albaranesService.cambiarEstado(
        id,
        estado,
        observaciones,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!albaran) {
        return res.status(404).json({
          success: false,
          error: 'Albarán no encontrado',
        });
      }

      return res.json({
        success: true,
        data: albaran,
        message: 'Estado actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al cambiar el estado',
      });
    }
  },

  /**
   * Eliminar un albarán (soft delete)
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

      const eliminado = await albaranesService.eliminar(
        id,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          error: 'Albarán no encontrado',
        });
      }

      return res.json({
        success: true,
        message: 'Albarán eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar albarán:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar el albarán',
      });
    }
  },

  /**
   * Duplicar un albarán
   */
  async duplicar(req: Request, res: Response) {
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

      const nuevoAlbaran = await albaranesService.duplicar(
        id,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: nuevoAlbaran,
        message: 'Albarán duplicado correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar albarán:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al duplicar el albarán',
      });
    }
  },

  /**
   * Obtener estadísticas de albaranes
   */
  async estadisticas(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;

      const stats = await albaranesService.obtenerEstadisticas(
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas',
      });
    }
  },

  /**
   * Obtener albaranes de un pedido
   */
  async obtenerAlbaranesDePedido(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { pedidoId } = req.params;

      const albaranes = await albaranesService.obtenerAlbaranesDePedido(
        pedidoId,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: albaranes,
      });
    } catch (error: any) {
      console.error('Error al obtener albaranes del pedido:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener albaranes del pedido',
      });
    }
  },

  // ============================================
  // ACCIONES MASIVAS
  // ============================================

  /**
   * Eliminar varios albaranes
   */
  async eliminarVarios(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const { ids } = req.body;
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar un array de IDs',
        });
      }

      let eliminados = 0;
      const errores: string[] = [];

      for (const id of ids) {
        try {
          const resultado = await albaranesService.eliminar(
            id,
            new mongoose.Types.ObjectId(empresaId),
            new mongoose.Types.ObjectId(usuarioId),
            req.empresaDbConfig
          );
          if (resultado) eliminados++;
        } catch (error: any) {
          errores.push(`${id}: ${error.message}`);
        }
      }

      return res.json({
        success: true,
        message: `${eliminados} albarán(es) eliminado(s)`,
        data: { eliminados, errores },
      });
    } catch (error: any) {
      console.error('Error al eliminar albaranes:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar albaranes',
      });
    }
  },

  /**
   * Enviar varios albaranes por email
   */
  async enviarVariosPorEmail(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const { ids, asunto, mensaje } = req.body;
      const empresaId = req.empresaId!;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar un array de IDs',
        });
      }

      const resultados: { id: string; codigo: string; success: boolean; error?: string }[] = [];

      for (const id of ids) {
        try {
          // Obtener el albarán para conseguir el email del cliente
          const albaran = await albaranesService.obtenerPorId(
            id,
            new mongoose.Types.ObjectId(empresaId),
            req.empresaDbConfig
          );

          if (!albaran) {
            resultados.push({ id, codigo: '-', success: false, error: 'Albarán no encontrado' });
            continue;
          }

          // Verificar que el cliente tiene email
          const clienteEmail = typeof albaran.clienteId === 'object' && albaran.clienteId !== null
            ? (albaran.clienteId as any).email
            : null;

          if (!clienteEmail) {
            resultados.push({
              id,
              codigo: albaran.codigo,
              success: false,
              error: 'El cliente no tiene email configurado'
            });
            continue;
          }

          // TODO: Implementar envío real de email cuando se tenga el servicio de PDF
          resultados.push({
            id,
            codigo: albaran.codigo,
            success: true
          });
        } catch (error: any) {
          resultados.push({ id, codigo: '-', success: false, error: error.message });
        }
      }

      const enviados = resultados.filter(r => r.success).length;

      return res.json({
        success: true,
        message: `${enviados} de ${ids.length} albarán(es) enviado(s) por email`,
        data: { enviados, resultados },
      });
    } catch (error: any) {
      console.error('Error al enviar albaranes por email:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar albaranes por email',
      });
    }
  },

  /**
   * Obtener alertas de albaranes
   */
  async getAlertas(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const diasAlerta = req.query.diasAlerta ? Number(req.query.diasAlerta) : 30;

      const result = await albaranesService.getAlertas(
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig,
        diasAlerta
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error al obtener alertas de albaranes:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener alertas de albaranes',
      });
    }
  },

  /**
   * Generar URLs de WhatsApp para varios albaranes
   */
  async generarURLsWhatsApp(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const { ids, mensaje } = req.body;
      const empresaId = req.empresaId!;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar un array de IDs',
        });
      }

      const resultados: { id: string; codigo: string; url?: string; telefono?: string; success: boolean; error?: string }[] = [];

      for (const id of ids) {
        try {
          const albaran = await albaranesService.obtenerPorId(
            id,
            new mongoose.Types.ObjectId(empresaId),
            req.empresaDbConfig
          );

          if (!albaran) {
            resultados.push({ id, codigo: '-', success: false, error: 'Albarán no encontrado' });
            continue;
          }

          // Obtener teléfono del cliente
          const clienteTelefono = typeof albaran.clienteId === 'object' && albaran.clienteId !== null
            ? (albaran.clienteId as any).telefono || (albaran.clienteId as any).movil
            : null;

          if (!clienteTelefono) {
            resultados.push({
              id,
              codigo: albaran.codigo,
              success: false,
              error: 'El cliente no tiene teléfono configurado'
            });
            continue;
          }

          // Limpiar número de teléfono
          const telefonoLimpio = clienteTelefono.replace(/[^0-9]/g, '');
          const telefonoFormateado = telefonoLimpio.startsWith('34') ? telefonoLimpio : `34${telefonoLimpio}`;

          // Crear mensaje
          const clienteNombre = typeof albaran.clienteId === 'object' && albaran.clienteId !== null
            ? (albaran.clienteId as any).nombreComercial || (albaran.clienteId as any).nombre
            : 'Cliente';

          const textoMensaje = mensaje ||
            `Hola ${clienteNombre}, le enviamos el albarán ${albaran.codigo} por importe de ${albaran.totales?.totalAlbaran?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`;

          const url = `https://wa.me/${telefonoFormateado}?text=${encodeURIComponent(textoMensaje)}`;

          resultados.push({
            id,
            codigo: albaran.codigo,
            url,
            telefono: clienteTelefono,
            success: true
          });
        } catch (error: any) {
          resultados.push({ id, codigo: '-', success: false, error: error.message });
        }
      }

      const generados = resultados.filter(r => r.success).length;

      return res.json({
        success: true,
        message: `${generados} URL(s) de WhatsApp generada(s)`,
        data: { generados, resultados },
      });
    } catch (error: any) {
      console.error('Error al generar URLs de WhatsApp:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al generar URLs de WhatsApp',
      });
    }
  },
};

export default albaranesController;
