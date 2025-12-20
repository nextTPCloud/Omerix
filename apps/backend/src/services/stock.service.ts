import mongoose, { Model, ClientSession } from 'mongoose';
import { MovimientoStock, IMovimientoStock, TipoMovimiento, OrigenMovimiento } from '@/models/MovimientoStock';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { databaseManager } from '@/services/database-manager.service';

// ============================================
// INTERFACES
// ============================================

export interface RegistrarMovimientoDTO {
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  productoSku?: string;

  varianteId?: string;
  varianteSku?: string;
  varianteNombre?: string;

  almacenId: string;
  almacenNombre: string;

  almacenDestinoId?: string;
  almacenDestinoNombre?: string;

  tipo: TipoMovimiento;
  origen: OrigenMovimiento;

  documentoOrigenId?: string;
  documentoOrigenCodigo?: string;
  documentoOrigenTipo?: string;

  terceroId?: string;
  terceroNombre?: string;
  terceroTipo?: 'cliente' | 'proveedor';

  cantidad: number;
  precioUnitario?: number;
  costeUnitario?: number;

  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: Date;
  ubicacion?: string;

  motivo?: string;
  observaciones?: string;

  usuarioId: string;
  usuarioNombre: string;
}

export interface ActualizarStockProductoDTO {
  productoId: string;
  almacenId: string;
  varianteId?: string;
  cantidad: number;
  tipo: 'entrada' | 'salida' | 'ajuste';
}

export interface StockPorAlmacen {
  almacenId: string;
  almacenNombre: string;
  cantidad: number;
  valoracion: number;
  ultimoMovimiento?: Date;
}

export interface ResumenStock {
  stockTotal: number;
  stockPorAlmacen: StockPorAlmacen[];
  costeUltimo: number;
  costeMedio: number;
  valoracionTotal: number;
}

// ============================================
// HELPERS
// ============================================

const getMovimientoStockModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IMovimientoStock>> => {
  const MovimientoStockSchema = MovimientoStock.schema;
  return databaseManager.getModel<IMovimientoStock>(empresaId, dbConfig, 'MovimientoStock', MovimientoStockSchema);
};

const getProductoModel = async (empresaId: string, dbConfig: IDatabaseConfig) => {
  const { getProductoModel } = await import('@/utils/dynamic-models.helper');
  return getProductoModel(empresaId, dbConfig);
};

const getAlmacenModel = async (empresaId: string, dbConfig: IDatabaseConfig) => {
  const { getAlmacenModel } = await import('@/utils/dynamic-models.helper');
  return getAlmacenModel(empresaId, dbConfig);
};

// ============================================
// SERVICIO DE STOCK
// ============================================

export class StockService {
  // ============================================
  // REGISTRAR MOVIMIENTO DE STOCK
  // ============================================

  async registrarMovimiento(
    dto: RegistrarMovimientoDTO,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    session?: ClientSession
  ): Promise<IMovimientoStock> {
    const MovimientoModel = await getMovimientoStockModel(empresaId, dbConfig);
    const ProductoModel = await getProductoModel(empresaId, dbConfig);

    // Obtener stock anterior
    const stockAnterior = await this.obtenerStockActual(
      dto.productoId,
      dto.almacenId,
      empresaId,
      dbConfig,
      dto.varianteId
    );

    // Crear el movimiento
    const movimiento = new MovimientoModel({
      ...dto,
      productoId: new mongoose.Types.ObjectId(dto.productoId),
      almacenId: new mongoose.Types.ObjectId(dto.almacenId),
      almacenDestinoId: dto.almacenDestinoId ? new mongoose.Types.ObjectId(dto.almacenDestinoId) : undefined,
      documentoOrigenId: dto.documentoOrigenId ? new mongoose.Types.ObjectId(dto.documentoOrigenId) : undefined,
      terceroId: dto.terceroId ? new mongoose.Types.ObjectId(dto.terceroId) : undefined,
      usuarioId: new mongoose.Types.ObjectId(dto.usuarioId),
      stockAnterior,
      fecha: new Date(),
    });

    if (session) {
      await movimiento.save({ session });
    } else {
      await movimiento.save();
    }

    // Actualizar stock en el producto
    await this.actualizarStockEnProducto(
      dto.productoId,
      dto.almacenId,
      dto.varianteId,
      movimiento.stockPosterior,
      empresaId,
      dbConfig,
      session
    );

    // Si es una entrada de compra, actualizar costes del producto
    if (dto.tipo === TipoMovimiento.ENTRADA_COMPRA && dto.costeUnitario && dto.costeUnitario > 0) {
      await this.actualizarCostesProducto(dto.productoId, empresaId, dbConfig, session);
    }

    return movimiento;
  }

  // ============================================
  // ACTUALIZAR COSTES DEL PRODUCTO
  // ============================================

  async actualizarCostesProducto(
    productoId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    session?: ClientSession
  ): Promise<void> {
    const ProductoModel = await getProductoModel(empresaId, dbConfig);

    const costeUltimo = await this.calcularCosteUltimo(productoId, empresaId, dbConfig);
    const costeMedio = await this.calcularCosteMedio(productoId, empresaId, dbConfig);

    const updateOptions = session ? { session } : {};

    await ProductoModel.updateOne(
      { _id: new mongoose.Types.ObjectId(productoId) },
      {
        $set: {
          'costes.costeUltimo': costeUltimo,
          'costes.costeMedio': costeMedio,
          'costes.ultimaActualizacion': new Date(),
          'estadisticas.ultimaCompra': new Date(),
        },
        $inc: {
          'estadisticas.vecesComprado': 1,
        },
      },
      updateOptions
    );
  }

  // ============================================
  // OBTENER STOCK ACTUAL
  // ============================================

  async obtenerStockActual(
    productoId: string,
    almacenId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    varianteId?: string
  ): Promise<number> {
    const MovimientoModel = await getMovimientoStockModel(empresaId, dbConfig);

    const filter: any = {
      productoId: new mongoose.Types.ObjectId(productoId),
      almacenId: new mongoose.Types.ObjectId(almacenId),
      anulado: false,
    };

    if (varianteId) {
      filter.varianteId = varianteId;
    }

    const ultimoMovimiento = await MovimientoModel.findOne(filter)
      .sort({ fecha: -1, createdAt: -1 })
      .select('stockPosterior')
      .lean();

    return ultimoMovimiento?.stockPosterior || 0;
  }

  // ============================================
  // OBTENER RESUMEN DE STOCK DE UN PRODUCTO
  // ============================================

  async obtenerResumenStock(
    productoId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    varianteId?: string
  ): Promise<ResumenStock> {
    const MovimientoModel = await getMovimientoStockModel(empresaId, dbConfig);
    const AlmacenModel = await getAlmacenModel(empresaId, dbConfig);

    // Obtener todos los almacenes activos
    const almacenes = await AlmacenModel.find({ activo: true }).lean();

    // Obtener stock por almacén
    const stockPorAlmacen: StockPorAlmacen[] = [];
    let stockTotal = 0;
    let valoracionTotal = 0;

    for (const almacen of almacenes) {
      const filter: any = {
        productoId: new mongoose.Types.ObjectId(productoId),
        almacenId: almacen._id,
        anulado: false,
      };
      if (varianteId) filter.varianteId = varianteId;

      const ultimoMovimiento = await MovimientoModel.findOne(filter)
        .sort({ fecha: -1, createdAt: -1 })
        .lean();

      if (ultimoMovimiento) {
        const cantidad = ultimoMovimiento.stockPosterior;
        const valoracion = cantidad * (ultimoMovimiento.costeUnitario || 0);

        stockPorAlmacen.push({
          almacenId: almacen._id.toString(),
          almacenNombre: almacen.nombre,
          cantidad,
          valoracion,
          ultimoMovimiento: ultimoMovimiento.fecha,
        });

        stockTotal += cantidad;
        valoracionTotal += valoracion;
      }
    }

    // Calcular costes
    const costeUltimo = await this.calcularCosteUltimo(productoId, empresaId, dbConfig);
    const costeMedio = await this.calcularCosteMedio(productoId, empresaId, dbConfig);

    return {
      stockTotal,
      stockPorAlmacen,
      costeUltimo,
      costeMedio,
      valoracionTotal,
    };
  }

  // ============================================
  // CALCULAR COSTE ÚLTIMO
  // ============================================

  async calcularCosteUltimo(
    productoId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<number> {
    const MovimientoModel = await getMovimientoStockModel(empresaId, dbConfig);

    const ultimaEntrada = await MovimientoModel.findOne({
      productoId: new mongoose.Types.ObjectId(productoId),
      anulado: false,
      tipo: TipoMovimiento.ENTRADA_COMPRA,
      costeUnitario: { $gt: 0 },
    })
      .sort({ fecha: -1 })
      .select('costeUnitario')
      .lean();

    return ultimaEntrada?.costeUnitario || 0;
  }

  // ============================================
  // CALCULAR COSTE MEDIO PONDERADO
  // ============================================

  async calcularCosteMedio(
    productoId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    almacenId?: string
  ): Promise<number> {
    const MovimientoModel = await getMovimientoStockModel(empresaId, dbConfig);

    const filter: any = {
      productoId: new mongoose.Types.ObjectId(productoId),
      anulado: false,
      tipo: { $in: [TipoMovimiento.ENTRADA_COMPRA, TipoMovimiento.INVENTARIO_INICIAL] },
      costeUnitario: { $gt: 0 },
    };

    if (almacenId) {
      filter.almacenId = new mongoose.Types.ObjectId(almacenId);
    }

    const resultado = await MovimientoModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCantidad: { $sum: '$cantidad' },
          totalValor: { $sum: { $multiply: ['$cantidad', '$costeUnitario'] } },
        },
      },
    ]);

    if (resultado.length === 0 || resultado[0].totalCantidad === 0) {
      return 0;
    }

    return resultado[0].totalValor / resultado[0].totalCantidad;
  }

  // ============================================
  // OBTENER HISTORIAL DE MOVIMIENTOS
  // ============================================

  async obtenerHistorial(
    productoId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    opciones: {
      almacenId?: string;
      varianteId?: string;
      fechaDesde?: Date;
      fechaHasta?: Date;
      tipo?: TipoMovimiento;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ data: IMovimientoStock[]; total: number }> {
    const MovimientoModel = await getMovimientoStockModel(empresaId, dbConfig);

    const filter: any = {
      productoId: new mongoose.Types.ObjectId(productoId),
      anulado: false,
    };

    if (opciones.almacenId) {
      filter.almacenId = new mongoose.Types.ObjectId(opciones.almacenId);
    }
    if (opciones.varianteId) {
      filter.varianteId = opciones.varianteId;
    }
    if (opciones.tipo) {
      filter.tipo = opciones.tipo;
    }
    if (opciones.fechaDesde || opciones.fechaHasta) {
      filter.fecha = {};
      if (opciones.fechaDesde) filter.fecha.$gte = opciones.fechaDesde;
      if (opciones.fechaHasta) filter.fecha.$lte = opciones.fechaHasta;
    }

    const page = opciones.page || 1;
    const limit = opciones.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      MovimientoModel.find(filter)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MovimientoModel.countDocuments(filter),
    ]);

    return { data, total };
  }

  // ============================================
  // OBTENER MOVIMIENTOS POR DOCUMENTO
  // ============================================

  async obtenerMovimientosPorDocumento(
    documentoId: string,
    documentoTipo: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IMovimientoStock[]> {
    const MovimientoModel = await getMovimientoStockModel(empresaId, dbConfig);

    return MovimientoModel.find({
      documentoOrigenId: new mongoose.Types.ObjectId(documentoId),
      documentoOrigenTipo: documentoTipo,
      anulado: false,
    })
      .sort({ fecha: -1 })
      .lean();
  }

  // ============================================
  // OBTENER MOVIMIENTOS POR TERCERO
  // ============================================

  async obtenerMovimientosPorTercero(
    terceroId: string,
    terceroTipo: 'cliente' | 'proveedor',
    empresaId: string,
    dbConfig: IDatabaseConfig,
    opciones: {
      fechaDesde?: Date;
      fechaHasta?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ data: IMovimientoStock[]; total: number }> {
    const MovimientoModel = await getMovimientoStockModel(empresaId, dbConfig);

    const filter: any = {
      terceroId: new mongoose.Types.ObjectId(terceroId),
      terceroTipo,
      anulado: false,
    };

    if (opciones.fechaDesde || opciones.fechaHasta) {
      filter.fecha = {};
      if (opciones.fechaDesde) filter.fecha.$gte = opciones.fechaDesde;
      if (opciones.fechaHasta) filter.fecha.$lte = opciones.fechaHasta;
    }

    const page = opciones.page || 1;
    const limit = opciones.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      MovimientoModel.find(filter)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MovimientoModel.countDocuments(filter),
    ]);

    return { data, total };
  }

  // ============================================
  // ANULAR MOVIMIENTO
  // ============================================

  async anularMovimiento(
    movimientoId: string,
    empresaId: string,
    usuarioId: string,
    motivo: string,
    dbConfig: IDatabaseConfig
  ): Promise<IMovimientoStock> {
    const MovimientoModel = await getMovimientoStockModel(empresaId, dbConfig);

    const movimientoOriginal = await MovimientoModel.findById(movimientoId);
    if (!movimientoOriginal) {
      throw new Error('Movimiento no encontrado');
    }

    if (movimientoOriginal.anulado) {
      throw new Error('El movimiento ya está anulado');
    }

    // Marcar como anulado
    movimientoOriginal.anulado = true;
    movimientoOriginal.fechaAnulacion = new Date();
    movimientoOriginal.usuarioAnulacionId = new mongoose.Types.ObjectId(usuarioId);
    movimientoOriginal.motivoAnulacion = motivo;

    // Crear movimiento inverso
    const tipoInverso = this.obtenerTipoInverso(movimientoOriginal.tipo as TipoMovimiento);

    const movimientoInverso = new MovimientoModel({
      productoId: movimientoOriginal.productoId,
      productoCodigo: movimientoOriginal.productoCodigo,
      productoNombre: movimientoOriginal.productoNombre,
      productoSku: movimientoOriginal.productoSku,
      varianteId: movimientoOriginal.varianteId,
      varianteSku: movimientoOriginal.varianteSku,
      varianteNombre: movimientoOriginal.varianteNombre,
      almacenId: movimientoOriginal.almacenId,
      almacenNombre: movimientoOriginal.almacenNombre,
      tipo: tipoInverso,
      origen: movimientoOriginal.origen,
      documentoOrigenId: movimientoOriginal.documentoOrigenId,
      documentoOrigenCodigo: movimientoOriginal.documentoOrigenCodigo,
      documentoOrigenTipo: movimientoOriginal.documentoOrigenTipo,
      terceroId: movimientoOriginal.terceroId,
      terceroNombre: movimientoOriginal.terceroNombre,
      terceroTipo: movimientoOriginal.terceroTipo,
      cantidad: movimientoOriginal.cantidad,
      stockAnterior: movimientoOriginal.stockPosterior,
      precioUnitario: movimientoOriginal.precioUnitario,
      costeUnitario: movimientoOriginal.costeUnitario,
      lote: movimientoOriginal.lote,
      numeroSerie: movimientoOriginal.numeroSerie,
      ubicacion: movimientoOriginal.ubicacion,
      motivo: `Anulación: ${motivo}`,
      observaciones: `Anulación del movimiento ${movimientoOriginal._id}`,
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      usuarioNombre: 'Sistema',
      fecha: new Date(),
    });

    movimientoOriginal.movimientoAnulacionId = movimientoInverso._id;

    await Promise.all([
      movimientoOriginal.save(),
      movimientoInverso.save(),
    ]);

    // Actualizar stock en producto
    await this.actualizarStockEnProducto(
      movimientoOriginal.productoId.toString(),
      movimientoOriginal.almacenId.toString(),
      movimientoOriginal.varianteId,
      movimientoInverso.stockPosterior,
      empresaId,
      dbConfig
    );

    return movimientoInverso;
  }

  // ============================================
  // VALORACIÓN DE INVENTARIO
  // ============================================

  async obtenerValoracionInventario(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    almacenId?: string
  ): Promise<{
    totalProductos: number;
    valorTotal: number;
    detalle: { productoId: string; productoCodigo: string; productoNombre: string; cantidad: number; coste: number; valoracion: number }[];
  }> {
    const MovimientoModel = await getMovimientoStockModel(empresaId, dbConfig);

    const matchStage: any = { anulado: false };
    if (almacenId) {
      matchStage.almacenId = new mongoose.Types.ObjectId(almacenId);
    }

    const resultado = await MovimientoModel.aggregate([
      { $match: matchStage },
      { $sort: { productoId: 1, almacenId: 1, varianteId: 1, fecha: -1, createdAt: -1 } },
      {
        $group: {
          _id: {
            productoId: '$productoId',
            productoCodigo: '$productoCodigo',
            productoNombre: '$productoNombre',
            almacenId: '$almacenId',
            varianteId: '$varianteId',
          },
          stockActual: { $first: '$stockPosterior' },
          ultimoCoste: { $first: '$costeUnitario' },
        },
      },
      {
        $group: {
          _id: {
            productoId: '$_id.productoId',
            productoCodigo: '$_id.productoCodigo',
            productoNombre: '$_id.productoNombre',
          },
          cantidad: { $sum: '$stockActual' },
          coste: { $avg: '$ultimoCoste' },
        },
      },
      {
        $project: {
          productoId: '$_id.productoId',
          productoCodigo: '$_id.productoCodigo',
          productoNombre: '$_id.productoNombre',
          cantidad: 1,
          coste: 1,
          valoracion: { $multiply: ['$cantidad', '$coste'] },
          _id: 0,
        },
      },
      { $match: { cantidad: { $gt: 0 } } },
      { $sort: { productoNombre: 1 } },
    ]);

    const totalProductos = resultado.length;
    const valorTotal = resultado.reduce((sum, item) => sum + item.valoracion, 0);

    return {
      totalProductos,
      valorTotal,
      detalle: resultado,
    };
  }

  // ============================================
  // HELPERS PRIVADOS
  // ============================================

  private obtenerTipoInverso(tipo: TipoMovimiento): TipoMovimiento {
    const inversos: Record<TipoMovimiento, TipoMovimiento> = {
      [TipoMovimiento.ENTRADA_COMPRA]: TipoMovimiento.AJUSTE_NEGATIVO,
      [TipoMovimiento.SALIDA_VENTA]: TipoMovimiento.AJUSTE_POSITIVO,
      [TipoMovimiento.DEVOLUCION_CLIENTE]: TipoMovimiento.AJUSTE_NEGATIVO,
      [TipoMovimiento.DEVOLUCION_PROVEEDOR]: TipoMovimiento.AJUSTE_POSITIVO,
      [TipoMovimiento.AJUSTE_POSITIVO]: TipoMovimiento.AJUSTE_NEGATIVO,
      [TipoMovimiento.AJUSTE_NEGATIVO]: TipoMovimiento.AJUSTE_POSITIVO,
      [TipoMovimiento.TRANSFERENCIA_ENTRADA]: TipoMovimiento.TRANSFERENCIA_SALIDA,
      [TipoMovimiento.TRANSFERENCIA_SALIDA]: TipoMovimiento.TRANSFERENCIA_ENTRADA,
      [TipoMovimiento.INVENTARIO_INICIAL]: TipoMovimiento.AJUSTE_NEGATIVO,
      [TipoMovimiento.REGULARIZACION]: TipoMovimiento.REGULARIZACION,
      [TipoMovimiento.MERMA]: TipoMovimiento.AJUSTE_POSITIVO,
      [TipoMovimiento.PRODUCCION_ENTRADA]: TipoMovimiento.AJUSTE_NEGATIVO,
      [TipoMovimiento.PRODUCCION_SALIDA]: TipoMovimiento.AJUSTE_POSITIVO,
    };

    return inversos[tipo] || TipoMovimiento.REGULARIZACION;
  }

  private async actualizarStockEnProducto(
    productoId: string,
    almacenId: string,
    varianteId: string | undefined,
    nuevoStock: number,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    session?: ClientSession
  ): Promise<void> {
    const ProductoModel = await getProductoModel(empresaId, dbConfig);

    const updateOptions = session ? { session } : {};

    if (varianteId) {
      // Convertir varianteId a ObjectId para comparaciones en MongoDB
      const varianteObjectId = new mongoose.Types.ObjectId(varianteId);

      // Actualizar stock de variante específica
      const updateResult = await ProductoModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(productoId),
          'variantes._id': varianteObjectId,
          'variantes.stockPorAlmacen.almacenId': new mongoose.Types.ObjectId(almacenId),
        },
        {
          $set: {
            'variantes.$[v].stockPorAlmacen.$[a].cantidad': nuevoStock,
            'variantes.$[v].stockPorAlmacen.$[a].ultimaActualizacion': new Date(),
          },
        },
        {
          ...updateOptions,
          arrayFilters: [
            { 'v._id': varianteObjectId },
            { 'a.almacenId': new mongoose.Types.ObjectId(almacenId) },
          ],
        }
      );

      // Si no existe el almacén en la variante, agregarlo
      if (updateResult.modifiedCount === 0) {
        const producto = await ProductoModel.findById(productoId).lean();
        const variante = producto?.variantes?.find((v: any) => v._id?.toString() === varianteId);

        if (variante) {
          const almacenExiste = variante?.stockPorAlmacen?.some(
            (s: any) => s.almacenId?.toString() === almacenId
          );

          if (!almacenExiste) {
            await ProductoModel.updateOne(
              {
                _id: new mongoose.Types.ObjectId(productoId),
                'variantes._id': varianteObjectId,
              },
              {
                $push: {
                  'variantes.$.stockPorAlmacen': {
                    almacenId: new mongoose.Types.ObjectId(almacenId),
                    cantidad: nuevoStock,
                    minimo: 0,
                    maximo: 0,
                    ultimaActualizacion: new Date(),
                  },
                },
              },
              updateOptions
            );
          } else {
            // El almacén existe pero no se actualizó, intentar actualización directa
            await ProductoModel.updateOne(
              {
                _id: new mongoose.Types.ObjectId(productoId),
                'variantes._id': varianteObjectId,
              },
              {
                $set: {
                  'variantes.$.stockPorAlmacen.$[a].cantidad': nuevoStock,
                  'variantes.$.stockPorAlmacen.$[a].ultimaActualizacion': new Date(),
                },
              },
              {
                ...updateOptions,
                arrayFilters: [
                  { 'a.almacenId': new mongoose.Types.ObjectId(almacenId) },
                ],
              }
            );
          }
        }
      }

      // Recalcular y actualizar el stock total del producto (suma de todas las variantes)
      await this.recalcularStockTotalProducto(productoId, empresaId, dbConfig, session);
    } else {
      // Actualizar stock sin variante
      const resultado = await ProductoModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(productoId),
          'stockPorAlmacen.almacenId': new mongoose.Types.ObjectId(almacenId),
        },
        {
          $set: {
            'stockPorAlmacen.$.cantidad': nuevoStock,
            'stockPorAlmacen.$.ultimaActualizacion': new Date(),
          },
        },
        updateOptions
      );

      // Si no existe el almacén, agregarlo
      if (resultado.modifiedCount === 0) {
        await ProductoModel.updateOne(
          { _id: new mongoose.Types.ObjectId(productoId) },
          {
            $push: {
              stockPorAlmacen: {
                almacenId: new mongoose.Types.ObjectId(almacenId),
                cantidad: nuevoStock,
                minimo: 0,
                maximo: 0,
                ultimaActualizacion: new Date(),
              },
            },
          },
          updateOptions
        );
      }
    }
  }

  /**
   * Recalcula el stock total de un producto con variantes
   * Suma el stock de todas las variantes en todos los almacenes
   * y actualiza el campo stock.cantidad del producto
   */
  private async recalcularStockTotalProducto(
    productoId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    session?: ClientSession
  ): Promise<void> {
    const ProductoModel = await getProductoModel(empresaId, dbConfig);
    const updateOptions = session ? { session } : {};

    const producto = await ProductoModel.findById(productoId).lean();
    if (!producto || !producto.tieneVariantes) return;

    // Calcular el stock total sumando todas las variantes
    let stockTotal = 0;
    if (producto.variantes && producto.variantes.length > 0) {
      for (const variante of producto.variantes) {
        if (variante.stockPorAlmacen && variante.stockPorAlmacen.length > 0) {
          for (const almacen of variante.stockPorAlmacen) {
            stockTotal += almacen.cantidad || 0;
          }
        }
      }
    }

    // Actualizar el campo stock.cantidad del producto con el total
    await ProductoModel.updateOne(
      { _id: new mongoose.Types.ObjectId(productoId) },
      {
        $set: {
          'stock.cantidad': stockTotal,
        },
      },
      updateOptions
    );
  }
}

export const stockService = new StockService();
export default stockService;
