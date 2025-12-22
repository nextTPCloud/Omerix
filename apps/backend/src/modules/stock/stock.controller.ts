import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { stockService } from '@/services/stock.service';
import { TipoMovimiento, OrigenMovimiento } from '@/models/MovimientoStock';
import { databaseManager } from '@/services/database-manager.service';
import {
  SearchMovimientosSchema,
  CreateAjusteSchema,
  SearchStockSchema,
  ValoracionInventarioSchema,
} from './stock.dto';

// Helper para obtener modelo dinámico
const getMovimientoStockModel = async (empresaId: string, dbConfig: any) => {
  const { MovimientoStock } = await import('@/models/MovimientoStock');
  return databaseManager.getModel(empresaId, dbConfig, 'MovimientoStock', MovimientoStock.schema);
};

const getProductoModel = async (empresaId: string, dbConfig: any) => {
  const { getProductoModel } = await import('@/utils/dynamic-models.helper');
  return getProductoModel(empresaId, dbConfig);
};

const getAlmacenModel = async (empresaId: string, dbConfig: any) => {
  const { getAlmacenModel } = await import('@/utils/dynamic-models.helper');
  return getAlmacenModel(empresaId, dbConfig);
};

export class StockController {
  /**
   * Obtener listado de movimientos con filtros y paginación
   */
  async getMovimientos(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const filters = SearchMovimientosSchema.parse(req.query);
      const MovimientoModel = await getMovimientoStockModel(empresaId, req.empresaDbConfig);

      // Construir filtro
      const query: any = {};

      if (!filters.incluirAnulados || filters.incluirAnulados !== 'true') {
        query.anulado = false;
      }

      if (filters.productoId) {
        query.productoId = new mongoose.Types.ObjectId(filters.productoId);
      }
      if (filters.almacenId) {
        query.almacenId = new mongoose.Types.ObjectId(filters.almacenId);
      }
      if (filters.tipo) {
        query.tipo = filters.tipo;
      }
      if (filters.origen) {
        query.origen = filters.origen;
      }
      if (filters.terceroId) {
        query.terceroId = new mongoose.Types.ObjectId(filters.terceroId);
      }
      if (filters.terceroTipo) {
        query.terceroTipo = filters.terceroTipo;
      }
      if (filters.documentoOrigenId) {
        query.documentoOrigenId = new mongoose.Types.ObjectId(filters.documentoOrigenId);
      }
      if (filters.lote) {
        query.lote = { $regex: filters.lote, $options: 'i' };
      }
      if (filters.numeroSerie) {
        query.numeroSerie = { $regex: filters.numeroSerie, $options: 'i' };
      }

      // Filtro de fechas
      if (filters.fechaDesde || filters.fechaHasta) {
        query.fecha = {};
        if (filters.fechaDesde) {
          query.fecha.$gte = new Date(filters.fechaDesde);
        }
        if (filters.fechaHasta) {
          const fechaHasta = new Date(filters.fechaHasta);
          fechaHasta.setHours(23, 59, 59, 999);
          query.fecha.$lte = fechaHasta;
        }
      }

      // Paginación
      const skip = (filters.page - 1) * filters.limit;
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

      const [data, total] = await Promise.all([
        MovimientoModel.find(query)
          .sort({ [filters.sortBy]: sortOrder })
          .skip(skip)
          .limit(filters.limit)
          .lean(),
        MovimientoModel.countDocuments(query),
      ]);

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(total / filters.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener detalle de un movimiento
   */
  async getMovimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const MovimientoModel = await getMovimientoStockModel(empresaId, req.empresaDbConfig);
      const movimiento = await MovimientoModel.findById(req.params.id).lean();

      if (!movimiento) {
        return res.status(404).json({ success: false, message: 'Movimiento no encontrado' });
      }

      res.json({ success: true, data: movimiento });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear ajuste manual de stock
   */
  async crearAjuste(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = CreateAjusteSchema.parse(req.body);

      // Obtener datos del producto y almacén
      const ProductoModel = await getProductoModel(empresaId, req.empresaDbConfig);
      const AlmacenModel = await getAlmacenModel(empresaId, req.empresaDbConfig);

      const [producto, almacen] = await Promise.all([
        ProductoModel.findById(data.productoId).lean(),
        AlmacenModel.findById(data.almacenId).lean(),
      ]);

      if (!producto) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }
      if (!almacen) {
        return res.status(404).json({ success: false, message: 'Almacén no encontrado' });
      }

      // Determinar tipo de movimiento
      let tipoMovimiento: TipoMovimiento;
      switch (data.tipo) {
        case 'entrada':
          tipoMovimiento = TipoMovimiento.AJUSTE_POSITIVO;
          break;
        case 'salida':
          tipoMovimiento = TipoMovimiento.AJUSTE_NEGATIVO;
          break;
        case 'merma':
          tipoMovimiento = TipoMovimiento.MERMA;
          break;
        default:
          tipoMovimiento = TipoMovimiento.AJUSTE_POSITIVO;
      }

      // Registrar el movimiento
      const movimiento = await stockService.registrarMovimiento(
        {
          productoId: data.productoId,
          productoCodigo: producto.codigo || producto.sku || '',
          productoNombre: producto.nombre,
          productoSku: producto.sku,
          varianteId: data.varianteId,
          almacenId: data.almacenId,
          almacenNombre: almacen.nombre,
          tipo: tipoMovimiento,
          origen: OrigenMovimiento.AJUSTE_MANUAL,
          cantidad: data.cantidad,
          costeUnitario: data.costeUnitario || producto.costes?.costeUltimo || 0,
          motivo: data.motivo,
          observaciones: data.observaciones,
          lote: data.lote,
          numeroSerie: data.numeroSerie,
          fechaCaducidad: data.fechaCaducidad ? new Date(data.fechaCaducidad) : undefined,
          ubicacion: data.ubicacion,
          usuarioId,
          usuarioNombre: req.usuario?.nombre || 'Sistema',
        },
        empresaId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: movimiento,
        message: 'Ajuste de stock registrado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener resumen de stock por producto
   */
  async getResumenStock(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const productoId = req.params.productoId;
      const varianteId = req.query.varianteId as string | undefined;

      const resumen = await stockService.obtenerResumenStock(
        productoId,
        empresaId,
        req.empresaDbConfig,
        varianteId
      );

      res.json({ success: true, data: resumen });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener vista de stock actual (todos los productos)
   */
  async getStockActual(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const filters = SearchStockSchema.parse(req.query);
      const ProductoModel = await getProductoModel(empresaId, req.empresaDbConfig);

      // Construir query
      const query: any = { activo: true };

      if (filters.q) {
        query.$or = [
          { nombre: { $regex: filters.q, $options: 'i' } },
          { sku: { $regex: filters.q, $options: 'i' } },
          { codigo: { $regex: filters.q, $options: 'i' } },
          { codigoBarras: { $regex: filters.q, $options: 'i' } },
        ];
      }

      if (filters.familiaId) {
        query.familiaId = new mongoose.Types.ObjectId(filters.familiaId);
      }

      // Filtros de stock
      if (filters.sinStock === 'true') {
        query['stock.cantidad'] = { $lte: 0 };
      } else if (filters.conStock === 'true') {
        query['stock.cantidad'] = { $gt: 0 };
      }

      if (filters.stockBajo === 'true') {
        query.$expr = { $lt: ['$stock.cantidad', '$stock.minimo'] };
      }

      // Filtrar por almacén si se especifica
      if (filters.almacenId) {
        query['stockPorAlmacen.almacenId'] = new mongoose.Types.ObjectId(filters.almacenId);
      }

      const skip = (filters.page - 1) * filters.limit;
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

      const [productos, total] = await Promise.all([
        ProductoModel.find(query)
          .select('codigo sku nombre familiaNombre stock stockPorAlmacen costes precio')
          .sort({ [filters.sortBy]: sortOrder })
          .skip(skip)
          .limit(filters.limit)
          .lean(),
        ProductoModel.countDocuments(query),
      ]);

      // Si hay filtro de almacén, calcular stock específico
      let data = productos;
      if (filters.almacenId) {
        data = productos.map((p: any) => {
          const stockAlmacen = p.stockPorAlmacen?.find(
            (s: any) => s.almacenId?.toString() === filters.almacenId
          );
          return {
            ...p,
            stockEnAlmacen: stockAlmacen?.cantidad || 0,
            minimoEnAlmacen: stockAlmacen?.minimo || 0,
            maximoEnAlmacen: stockAlmacen?.maximo || 0,
            ubicacionEnAlmacen: stockAlmacen?.ubicacion || '',
          };
        });
      }

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(total / filters.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener valoración de inventario
   */
  async getValoracion(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const filters = ValoracionInventarioSchema.parse(req.query);

      const valoracion = await stockService.obtenerValoracionInventario(
        empresaId,
        req.empresaDbConfig,
        filters.almacenId
      );

      res.json({ success: true, data: valoracion });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener historial de movimientos de un producto
   */
  async getHistorialProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const productoId = req.params.productoId;
      const almacenId = req.query.almacenId as string | undefined;
      const varianteId = req.query.varianteId as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await stockService.obtenerHistorial(
        productoId,
        empresaId,
        req.empresaDbConfig,
        { almacenId, varianteId, page, limit }
      );

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Anular un movimiento de stock
   */
  async anularMovimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { motivo } = req.body;
      if (!motivo || motivo.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'El motivo de anulación es obligatorio (mínimo 3 caracteres)',
        });
      }

      const movimiento = await stockService.anularMovimiento(
        req.params.id,
        empresaId,
        usuarioId,
        motivo,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: movimiento,
        message: 'Movimiento anulado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener tipos de movimiento
   */
  async getTiposMovimiento(req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        tipos: Object.entries(TipoMovimiento).map(([key, value]) => ({
          key,
          value,
          label: this.formatTipoLabel(value),
        })),
        origenes: Object.entries(OrigenMovimiento).map(([key, value]) => ({
          key,
          value,
          label: this.formatOrigenLabel(value),
        })),
      },
    });
  }

  private formatTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      entrada_compra: 'Entrada por compra',
      salida_venta: 'Salida por venta',
      devolucion_cliente: 'Devolución de cliente',
      devolucion_proveedor: 'Devolución a proveedor',
      ajuste_positivo: 'Ajuste positivo',
      ajuste_negativo: 'Ajuste negativo',
      transferencia_entrada: 'Transferencia entrada',
      transferencia_salida: 'Transferencia salida',
      inventario_inicial: 'Inventario inicial',
      regularizacion: 'Regularización',
      merma: 'Merma',
      produccion_entrada: 'Producción entrada',
      produccion_salida: 'Producción salida',
    };
    return labels[tipo] || tipo;
  }

  private formatOrigenLabel(origen: string): string {
    const labels: Record<string, string> = {
      albaran_venta: 'Albarán de venta',
      albaran_compra: 'Albarán de compra',
      pedido_venta: 'Pedido de venta',
      pedido_compra: 'Pedido de compra',
      factura_venta: 'Factura de venta',
      factura_compra: 'Factura de compra',
      ajuste_manual: 'Ajuste manual',
      transferencia: 'Transferencia',
      inventario: 'Inventario',
      devolucion: 'Devolución',
      produccion: 'Producción',
    };
    return labels[origen] || origen;
  }
}

export const stockController = new StockController();
