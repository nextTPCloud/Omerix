import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { presupuestosCompraService } from './presupuestos-compra.service';
import {
  CreatePresupuestoCompraDTO,
  UpdatePresupuestoCompraDTO,
  GetPresupuestosCompraQuery,
  ConvertirAPedidoDTO,
} from './presupuestos-compra.dto';
import { EstadoPresupuestoCompra } from './PresupuestoCompra';

export class PresupuestosCompraController {
  // ============================================
  // CREAR
  // ============================================

  async create(req: Request, res: Response) {
    try {
      const { actualizarPrecios, ...dto }: CreatePresupuestoCompraDTO & { actualizarPrecios?: { precioCompra: boolean; precioVenta: boolean } } = req.body;

      if (!dto.proveedorId) {
        return res.status(400).json({
          success: false,
          message: 'El proveedor es obligatorio',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const presupuesto = await presupuestosCompraService.crear(
        dto,
        req.empresaId,
        req.userId!,
        req.dbConfig
      );

      // Si se solicitó actualizar precios, hacerlo después de crear
      let preciosActualizados = 0;
      if (actualizarPrecios && (actualizarPrecios.precioCompra || actualizarPrecios.precioVenta)) {
        const resultado = await presupuestosCompraService.actualizarPreciosProductos(
          req.empresaId,
          req.dbConfig,
          presupuesto.lineas || [],
          actualizarPrecios
        );
        preciosActualizados = resultado.actualizados;
      }

      res.status(201).json({
        success: true,
        message: preciosActualizados > 0
          ? `Presupuesto de compra creado correctamente. ${preciosActualizados} producto(s) actualizados.`
          : 'Presupuesto de compra creado correctamente',
        data: presupuesto,
        preciosActualizados,
      });
    } catch (error: any) {
      console.error('Error creando presupuesto de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando presupuesto de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // LISTAR
  // ============================================

  async findAll(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const query: GetPresupuestosCompraQuery = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 25,
        sortBy: req.query.sortBy as string || 'fechaCreacion',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        search: req.query.search as string,
        estado: req.query.estado as EstadoPresupuestoCompra,
        estados: req.query.estados as string,
        prioridad: req.query.prioridad as any,
        proveedorId: req.query.proveedorId as string,
        activo: req.query.activo as string,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        fechaValidezDesde: req.query.fechaValidezDesde as string,
        fechaValidezHasta: req.query.fechaValidezHasta as string,
        importeMinimo: req.query.importeMinimo ? Number(req.query.importeMinimo) : undefined,
        importeMaximo: req.query.importeMaximo ? Number(req.query.importeMaximo) : undefined,
        tags: req.query.tags as string,
        ...req.query,
      };

      const result = await presupuestosCompraService.findAll(
        req.empresaId,
        req.dbConfig,
        query
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error listando presupuestos de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error listando presupuestos de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no valido',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const presupuesto = await presupuestosCompraService.findById(
        req.empresaId,
        req.dbConfig,
        id
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto de compra no encontrado',
        });
      }

      res.json({
        success: true,
        data: presupuesto,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo presupuesto de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER POR CODIGO
  // ============================================

  async findByCodigo(req: Request, res: Response) {
    try {
      const { codigo } = req.params;

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const presupuesto = await presupuestosCompraService.findByCodigo(
        req.empresaId,
        req.dbConfig,
        codigo
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto de compra no encontrado',
        });
      }

      res.json({
        success: true,
        data: presupuesto,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo presupuesto de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { actualizarPrecios, ...dto }: UpdatePresupuestoCompraDTO & { actualizarPrecios?: { precioCompra: boolean; precioVenta: boolean } } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no valido',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const presupuesto = await presupuestosCompraService.update(
        req.empresaId,
        req.dbConfig,
        id,
        dto,
        req.userId!
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto de compra no encontrado',
        });
      }

      // Si se solicitó actualizar precios, hacerlo después de actualizar
      let preciosActualizados = 0;
      if (actualizarPrecios && (actualizarPrecios.precioCompra || actualizarPrecios.precioVenta)) {
        const resultado = await presupuestosCompraService.actualizarPreciosProductos(
          req.empresaId,
          req.dbConfig,
          presupuesto.lineas || [],
          actualizarPrecios
        );
        preciosActualizados = resultado.actualizados;
      }

      res.json({
        success: true,
        message: preciosActualizados > 0
          ? `Presupuesto de compra actualizado correctamente. ${preciosActualizados} producto(s) actualizados.`
          : 'Presupuesto de compra actualizado correctamente',
        data: presupuesto,
        preciosActualizados,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error actualizando presupuesto de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no valido',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const eliminado = await presupuestosCompraService.delete(
        req.empresaId,
        req.dbConfig,
        id,
        req.userId!
      );

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto de compra no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Presupuesto de compra eliminado correctamente',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando presupuesto de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { estado, motivoRechazo } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no valido',
        });
      }

      if (!estado) {
        return res.status(400).json({
          success: false,
          message: 'El estado es obligatorio',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const presupuesto = await presupuestosCompraService.cambiarEstado(
        req.empresaId,
        req.dbConfig,
        id,
        estado,
        req.userId!,
        motivoRechazo
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto de compra no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Estado actualizado correctamente',
        data: presupuesto,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error cambiando estado',
        error: error.message,
      });
    }
  }

  // ============================================
  // CONVERTIR A PEDIDO
  // ============================================

  async convertirAPedido(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto: Partial<ConvertirAPedidoDTO> = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no valido',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const resultado = await presupuestosCompraService.convertirAPedido(
        req.empresaId,
        req.dbConfig,
        { ...dto, presupuestoCompraId: id },
        req.userId!
      );

      res.json({
        success: true,
        message: `Presupuesto convertido a pedido ${resultado.pedido.codigo}`,
        data: resultado,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error convirtiendo a pedido',
        error: error.message,
      });
    }
  }

  // ============================================
  // DUPLICAR
  // ============================================

  async duplicar(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no valido',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const presupuesto = await presupuestosCompraService.duplicar(
        req.empresaId,
        req.dbConfig,
        id,
        req.userId!
      );

      res.status(201).json({
        success: true,
        message: 'Presupuesto de compra duplicado correctamente',
        data: presupuesto,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error duplicando presupuesto de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // ESTADISTICAS
  // ============================================

  async getEstadisticas(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const estadisticas = await presupuestosCompraService.getEstadisticas(
        req.empresaId,
        req.dbConfig
      );

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadisticas',
        error: error.message,
      });
    }
  }

  // ============================================
  // ALERTAS
  // ============================================

  async getAlertas(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const diasAlerta = req.query.diasAlerta ? Number(req.query.diasAlerta) : 7;

      const alertas = await presupuestosCompraService.getAlertas(
        req.empresaId,
        req.dbConfig,
        diasAlerta
      );

      res.json({
        success: true,
        data: alertas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo alertas',
        error: error.message,
      });
    }
  }

  // ============================================
  // ELIMINAR MULTIPLES
  // ============================================

  async deleteMany(req: Request, res: Response) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      let eliminados = 0;
      const errores: string[] = [];

      for (const id of ids) {
        try {
          const resultado = await presupuestosCompraService.delete(
            req.empresaId,
            req.dbConfig,
            id,
            req.userId!
          );
          if (resultado) eliminados++;
        } catch (e: any) {
          errores.push(`${id}: ${e.message}`);
        }
      }

      res.json({
        success: true,
        message: `${eliminados} presupuestos eliminados`,
        data: { eliminados, errores },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando presupuestos',
        error: error.message,
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
      const opciones = req.body;

      const result = await presupuestosCompraService.enviarPorEmail(
        id,
        String(empresaId),
        String(usuarioId),
        req.empresaDbConfig,
        opciones
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: { messageId: result.messageId },
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error: any) {
      console.error('Error enviando email:', error);
      res.status(500).json({
        success: false,
        message: 'Error al enviar email',
        error: error.message,
      });
    }
  }

  // ============================================
  // ENVÍO MASIVO POR EMAIL
  // ============================================

  async enviarMasivoPorEmail(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { ids, ...opciones } = req.body;
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un array de IDs',
        });
      }

      const result = await presupuestosCompraService.enviarMasivoPorEmail(
        ids,
        String(empresaId),
        String(usuarioId),
        req.empresaDbConfig,
        opciones
      );

      res.json({
        success: result.success,
        message: `${result.enviados} de ${result.total} emails enviados`,
        data: result,
      });
    } catch (error: any) {
      console.error('Error en envío masivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error en envío masivo',
        error: error.message,
      });
    }
  }

  // ============================================
  // GENERAR PDF
  // ============================================

  async generarPDF(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const empresaId = req.empresaId!;
      const pdfOptions = req.body;

      const result = await presupuestosCompraService.generarPDF(
        id,
        String(empresaId),
        req.empresaDbConfig,
        pdfOptions
      );

      if (result.success && result.pdf) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.pdf);
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error: any) {
      console.error('Error generando PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar PDF',
        error: error.message,
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

      const { ids, pdfOptions } = req.body;
      const empresaId = req.empresaId!;

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

      const result = await presupuestosCompraService.exportarPDFsMasivo(
        ids,
        String(empresaId),
        req.empresaDbConfig,
        pdfOptions
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message,
        });
      }

      // Si es un solo presupuesto, devolver PDF directamente
      if (ids.length === 1 && result.pdf) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        return res.send(result.pdf);
      }

      // Si son múltiples, devolver ZIP
      if (result.zip) {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        return res.send(result.zip);
      }

      return res.status(500).json({
        success: false,
        message: 'Error al generar archivos',
      });
    } catch (error: any) {
      console.error('Error exportando PDFs:', error);
      res.status(500).json({
        success: false,
        message: 'Error al exportar PDFs',
        error: error.message,
      });
    }
  }
}

export const presupuestosCompraController = new PresupuestosCompraController();
