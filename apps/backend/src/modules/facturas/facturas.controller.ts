import { Request, Response } from 'express';
import mongoose from 'mongoose';
import facturasService from './facturas.service';
import {
  CreateFacturaDTO,
  UpdateFacturaDTO,
  SearchFacturasDTO,
  RegistrarCobroDTO,
  CrearDesdeAlbaranesDTO,
  CrearFacturaDirectaDTO,
  CrearRectificativaDTO,
  EmitirFacturaDTO,
  AnularFacturaDTO,
  CambiarEstadoDTO,
} from './facturas.dto';
import { EstadoFactura, SistemaFiscal } from './Factura';

// ============================================
// CONTROLADORES
// ============================================

export const facturasController = {
  /**
   * Crear una nueva factura
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
      const createDto: CreateFacturaDTO = req.body;

      const factura = await facturasService.crear(
        createDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: factura,
        message: 'Factura creada correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear factura:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear la factura',
      });
    }
  },

  /**
   * Crear facturas desde albaranes
   */
  async crearDesdeAlbaranes(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const dto: CrearDesdeAlbaranesDTO = req.body;

      const facturas = await facturasService.crearDesdeAlbaranes(
        dto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: facturas,
        message: `${facturas.length} factura(s) creada(s) correctamente`,
      });
    } catch (error: any) {
      console.error('Error al crear facturas desde albaranes:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear las facturas desde albaranes',
      });
    }
  },

  /**
   * Crear factura directamente desde presupuesto (sin pasar por albarán)
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
      const { copiarNotas, emitirDirectamente } = req.body;

      const factura = await facturasService.crearDesdePresupuesto(
        presupuestoId,
        { copiarNotas, emitirDirectamente },
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: factura,
        message: 'Factura creada desde presupuesto correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear factura desde presupuesto:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear la factura desde presupuesto',
      });
    }
  },

  /**
   * Crear factura directa desde albaranes (emitida, no borrador)
   * Útil para facturación rápida donde se quiere factura emitida inmediatamente
   */
  async crearFacturaDirecta(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const dto: CrearFacturaDirectaDTO = req.body;

      // Forzar emitir directamente
      dto.emitirDirectamente = true;

      const facturas = await facturasService.crearDesdeAlbaranesYEmitir(
        dto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: facturas,
        message: `${facturas.length} factura(s) creada(s) y emitida(s) correctamente`,
      });
    } catch (error: any) {
      console.error('Error al crear factura directa:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear la factura directa',
      });
    }
  },

  /**
   * Crear factura rectificativa
   */
  async crearRectificativa(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const dto: CrearRectificativaDTO = req.body;

      const factura = await facturasService.crearRectificativa(
        dto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: factura,
        message: 'Factura rectificativa creada correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear factura rectificativa:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear la factura rectificativa',
      });
    }
  },

  /**
   * Obtener todas las facturas con filtros y paginación
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
      const searchDto: SearchFacturasDTO & Record<string, any> = {
        ...req.query, // Incluir todos los params para filtros avanzados
        search: req.query.search as string,
        clienteId: req.query.clienteId as string,
        proyectoId: req.query.proyectoId as string,
        agenteComercialId: req.query.agenteComercialId as string,
        estado: req.query.estado as EstadoFactura,
        estados: req.query.estados as string,
        tipo: req.query.tipo as any,
        serie: req.query.serie as string,
        activo: req.query.activo as 'true' | 'false' | 'all',
        cobrada: req.query.cobrada as 'true' | 'false',
        vencida: req.query.vencida as 'true' | 'false',
        rectificativa: req.query.rectificativa as 'true' | 'false',
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        fechaVencimientoDesde: req.query.fechaVencimientoDesde as string,
        fechaVencimientoHasta: req.query.fechaVencimientoHasta as string,
        importeMin: req.query.importeMin as string,
        importeMax: req.query.importeMax as string,
        albaranOrigenId: req.query.albaranOrigenId as string,
        pedidoOrigenId: req.query.pedidoOrigenId as string,
        sistemaFiscal: req.query.sistemaFiscal as SistemaFiscal,
        tags: req.query.tags as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sortBy: req.query.sortBy as string || 'fecha',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const resultado = await facturasService.buscar(
        searchDto,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: resultado.facturas,
        total: resultado.total,
        page: resultado.page,
        limit: resultado.limit,
        totalPages: resultado.totalPages,
      });
    } catch (error: any) {
      console.error('Error al buscar facturas:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al buscar facturas',
      });
    }
  },

  /**
   * Obtener una factura por ID
   */
  async obtenerPorId(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no encontrada',
        });
      }

      const empresaId = req.empresaId!;
      const { id } = req.params;

      const factura = await facturasService.obtenerPorId(
        id,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      if (!factura) {
        return res.status(404).json({
          success: false,
          error: 'Factura no encontrada',
        });
      }

      return res.json({
        success: true,
        data: factura,
      });
    } catch (error: any) {
      console.error('Error al obtener factura:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener la factura',
      });
    }
  },

  /**
   * Actualizar una factura
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
      const updateDto: UpdateFacturaDTO = req.body;

      const factura = await facturasService.actualizar(
        id,
        updateDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!factura) {
        return res.status(404).json({
          success: false,
          error: 'Factura no encontrada',
        });
      }

      return res.json({
        success: true,
        data: factura,
        message: 'Factura actualizada correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar factura:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar la factura',
      });
    }
  },

  /**
   * Emitir factura (generar datos fiscales)
   */
  async emitir(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const empresaNif = req.empresaNif || '';
      const { id } = req.params;
      const emitirDto: EmitirFacturaDTO = req.body;

      const factura = await facturasService.emitir(
        id,
        emitirDto,
        new mongoose.Types.ObjectId(empresaId),
        empresaNif,
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: factura,
        message: 'Factura emitida correctamente',
      });
    } catch (error: any) {
      console.error('Error al emitir factura:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al emitir la factura',
      });
    }
  },

  /**
   * Registrar cobro
   */
  async registrarCobro(req: Request, res: Response) {
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
      const cobroDto: RegistrarCobroDTO = req.body;

      const factura = await facturasService.registrarCobro(
        id,
        cobroDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: factura,
        message: 'Cobro registrado correctamente',
      });
    } catch (error: any) {
      console.error('Error al registrar cobro:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al registrar el cobro',
      });
    }
  },

  /**
   * Anular factura
   */
  async anular(req: Request, res: Response) {
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
      const anularDto: AnularFacturaDTO = req.body;

      const factura = await facturasService.anular(
        id,
        anularDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: factura,
        message: 'Factura anulada correctamente',
      });
    } catch (error: any) {
      console.error('Error al anular factura:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al anular la factura',
      });
    }
  },

  /**
   * Obtener estadísticas
   */
  async estadisticas(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no encontrada',
        });
      }

      const empresaId = req.empresaId!;

      const estadisticas = await facturasService.obtenerEstadisticas(
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: estadisticas,
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
   * Eliminar factura (solo borradores)
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
      const { id } = req.params;

      await facturasService.eliminar(
        id,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        message: 'Factura eliminada correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar factura:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar la factura',
      });
    }
  },

  /**
   * Cambiar estado de factura
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

      const factura = await facturasService.actualizar(
        id,
        { estado },
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      if (!factura) {
        return res.status(404).json({
          success: false,
          error: 'Factura no encontrada',
        });
      }

      return res.json({
        success: true,
        data: factura,
        message: `Estado cambiado a ${estado}`,
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
   * Obtener código QR de la factura
   */
  async obtenerQR(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no encontrada',
        });
      }

      const empresaId = req.empresaId!;
      const { id } = req.params;

      const factura = await facturasService.obtenerPorId(
        id,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      if (!factura) {
        return res.status(404).json({
          success: false,
          error: 'Factura no encontrada',
        });
      }

      if (!factura.codigoQR) {
        return res.status(400).json({
          success: false,
          error: 'La factura no tiene código QR. Debe emitirse primero.',
        });
      }

      return res.json({
        success: true,
        data: {
          codigoQR: factura.codigoQR,
          urlVerificacion: factura.urlVerificacion,
          verifactu: factura.verifactu,
          ticketbai: factura.ticketbai,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener QR:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener el código QR',
      });
    }
  },

  /**
   * Duplicar factura
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

      const factura = await facturasService.duplicar(
        id,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: factura,
        message: 'Factura duplicada correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar factura:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al duplicar la factura',
      });
    }
  },

  /**
   * Enviar factura por email
   */
  async enviarPorEmail(req: Request, res: Response) {
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
      const options = req.body;

      const resultado = await facturasService.enviarPorEmail(
        id,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig,
        options
      );

      return res.json({
        success: true,
        data: resultado,
        message: resultado.mensaje,
      });
    } catch (error: any) {
      console.error('Error al enviar factura por email:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar factura por email',
      });
    }
  },
};

export default facturasController;
