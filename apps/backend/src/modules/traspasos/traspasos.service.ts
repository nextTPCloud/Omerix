import mongoose, { Model, ClientSession } from 'mongoose';
import { Traspaso, ITraspaso, EstadoTraspaso, ILineaTraspaso } from './Traspaso';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { databaseManager } from '@/services/database-manager.service';
import { stockService } from '@/services/stock.service';
import { TipoMovimiento, OrigenMovimiento } from '@/models/MovimientoStock';
import {
  CreateTraspasoDTO,
  UpdateTraspasoDTO,
  ConfirmarSalidaDTO,
  ConfirmarRecepcionDTO,
  AnularTraspasoDTO,
  SearchTraspasosDTO,
} from './traspasos.dto';

// ============================================
// HELPERS
// ============================================

const getTraspasoModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<ITraspaso>> => {
  return databaseManager.getModel<ITraspaso>(empresaId, dbConfig, 'Traspaso', Traspaso.schema);
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
// SERVICIO
// ============================================

export class TraspasosService {
  /**
   * Crear un nuevo traspaso
   */
  async crear(
    dto: CreateTraspasoDTO,
    usuarioId: string,
    usuarioNombre: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<ITraspaso> {
    const TraspasoModel = await getTraspasoModel(empresaId, dbConfig);
    const ProductoModel = await getProductoModel(empresaId, dbConfig);
    const AlmacenModel = await getAlmacenModel(empresaId, dbConfig);

    // Obtener datos de almacenes
    const [almacenOrigen, almacenDestino] = await Promise.all([
      AlmacenModel.findById(dto.almacenOrigenId).lean(),
      AlmacenModel.findById(dto.almacenDestinoId).lean(),
    ]);

    if (!almacenOrigen) {
      throw new Error('Almacén de origen no encontrado');
    }
    if (!almacenDestino) {
      throw new Error('Almacén de destino no encontrado');
    }

    // Generar código
    const codigo = await this.generarCodigo(empresaId, dbConfig);

    // Procesar líneas con datos de productos
    const lineasProcesadas: ILineaTraspaso[] = [];
    for (const linea of dto.lineas) {
      const producto = await ProductoModel.findById(linea.productoId).lean();
      if (!producto) {
        throw new Error(`Producto ${linea.productoId} no encontrado`);
      }

      lineasProcesadas.push({
        productoId: new mongoose.Types.ObjectId(linea.productoId),
        productoCodigo: producto.codigo || producto.sku || '',
        productoNombre: producto.nombre,
        productoSku: producto.sku,
        varianteId: linea.varianteId,
        varianteNombre: linea.varianteNombre,
        cantidadSolicitada: linea.cantidadSolicitada,
        cantidadEnviada: 0,
        cantidadRecibida: 0,
        ubicacionOrigen: linea.ubicacionOrigen,
        ubicacionDestino: linea.ubicacionDestino,
        lote: linea.lote,
        numeroSerie: linea.numeroSerie,
        fechaCaducidad: linea.fechaCaducidad ? new Date(linea.fechaCaducidad) : undefined,
        costeUnitario: linea.costeUnitario || producto.costes?.costeUltimo || 0,
        observaciones: linea.observaciones,
      });
    }

    const traspaso = new TraspasoModel({
      codigo,
      almacenOrigenId: new mongoose.Types.ObjectId(dto.almacenOrigenId),
      almacenOrigenNombre: almacenOrigen.nombre,
      almacenDestinoId: new mongoose.Types.ObjectId(dto.almacenDestinoId),
      almacenDestinoNombre: almacenDestino.nombre,
      estado: EstadoTraspaso.BORRADOR,
      fechaCreacion: new Date(),
      usuarioCreadorId: new mongoose.Types.ObjectId(usuarioId),
      usuarioCreadorNombre: usuarioNombre,
      lineas: lineasProcesadas,
      motivoTraspaso: dto.motivoTraspaso,
      observaciones: dto.observaciones,
      prioridad: dto.prioridad || 'normal',
    });

    await traspaso.save();
    return traspaso;
  }

  /**
   * Actualizar traspaso (solo en borrador)
   */
  async actualizar(
    id: string,
    dto: UpdateTraspasoDTO,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<ITraspaso> {
    const TraspasoModel = await getTraspasoModel(empresaId, dbConfig);
    const ProductoModel = await getProductoModel(empresaId, dbConfig);
    const AlmacenModel = await getAlmacenModel(empresaId, dbConfig);

    const traspaso = await TraspasoModel.findById(id);
    if (!traspaso) {
      throw new Error('Traspaso no encontrado');
    }
    if (traspaso.estado !== EstadoTraspaso.BORRADOR) {
      throw new Error('Solo se pueden editar traspasos en estado borrador');
    }

    // Actualizar almacenes si se proporcionan
    if (dto.almacenOrigenId) {
      const almacen = await AlmacenModel.findById(dto.almacenOrigenId).lean();
      if (!almacen) throw new Error('Almacén de origen no encontrado');
      traspaso.almacenOrigenId = new mongoose.Types.ObjectId(dto.almacenOrigenId);
      traspaso.almacenOrigenNombre = almacen.nombre;
    }
    if (dto.almacenDestinoId) {
      const almacen = await AlmacenModel.findById(dto.almacenDestinoId).lean();
      if (!almacen) throw new Error('Almacén de destino no encontrado');
      traspaso.almacenDestinoId = new mongoose.Types.ObjectId(dto.almacenDestinoId);
      traspaso.almacenDestinoNombre = almacen.nombre;
    }

    // Actualizar líneas si se proporcionan
    if (dto.lineas) {
      const lineasProcesadas: ILineaTraspaso[] = [];
      for (const linea of dto.lineas) {
        const producto = await ProductoModel.findById(linea.productoId).lean();
        if (!producto) continue;

        lineasProcesadas.push({
          productoId: new mongoose.Types.ObjectId(linea.productoId),
          productoCodigo: producto.codigo || producto.sku || '',
          productoNombre: producto.nombre,
          productoSku: producto.sku,
          varianteId: linea.varianteId,
          varianteNombre: linea.varianteNombre,
          cantidadSolicitada: linea.cantidadSolicitada,
          cantidadEnviada: 0,
          cantidadRecibida: 0,
          ubicacionOrigen: linea.ubicacionOrigen,
          ubicacionDestino: linea.ubicacionDestino,
          lote: linea.lote,
          numeroSerie: linea.numeroSerie,
          fechaCaducidad: linea.fechaCaducidad ? new Date(linea.fechaCaducidad) : undefined,
          costeUnitario: linea.costeUnitario || producto.costes?.costeUltimo || 0,
          observaciones: linea.observaciones,
        });
      }
      traspaso.lineas = lineasProcesadas;
    }

    if (dto.motivoTraspaso !== undefined) traspaso.motivoTraspaso = dto.motivoTraspaso;
    if (dto.observaciones !== undefined) traspaso.observaciones = dto.observaciones;
    if (dto.prioridad) traspaso.prioridad = dto.prioridad;

    await traspaso.save();
    return traspaso;
  }

  /**
   * Confirmar salida del almacén origen
   */
  async confirmarSalida(
    id: string,
    dto: ConfirmarSalidaDTO,
    usuarioId: string,
    usuarioNombre: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<ITraspaso> {
    const TraspasoModel = await getTraspasoModel(empresaId, dbConfig);

    const traspaso = await TraspasoModel.findById(id);
    if (!traspaso) {
      throw new Error('Traspaso no encontrado');
    }
    if (traspaso.estado !== EstadoTraspaso.BORRADOR && traspaso.estado !== EstadoTraspaso.PENDIENTE_SALIDA) {
      throw new Error(`No se puede confirmar salida en estado ${traspaso.estado}`);
    }

    // Actualizar cantidades enviadas
    if (dto.lineas) {
      for (const lineaDto of dto.lineas) {
        const linea = traspaso.lineas.find(l => l._id?.toString() === lineaDto.lineaId);
        if (linea) {
          linea.cantidadEnviada = lineaDto.cantidadEnviada;
        }
      }
    } else {
      // Si no se especifican cantidades, enviar todo lo solicitado
      for (const linea of traspaso.lineas) {
        linea.cantidadEnviada = linea.cantidadSolicitada;
      }
    }

    // Generar movimientos de salida
    const movimientosSalidaIds: mongoose.Types.ObjectId[] = [];
    for (const linea of traspaso.lineas) {
      if (linea.cantidadEnviada > 0) {
        const movimiento = await stockService.registrarMovimiento(
          {
            productoId: linea.productoId.toString(),
            productoCodigo: linea.productoCodigo,
            productoNombre: linea.productoNombre,
            productoSku: linea.productoSku,
            varianteId: linea.varianteId,
            almacenId: traspaso.almacenOrigenId.toString(),
            almacenNombre: traspaso.almacenOrigenNombre,
            almacenDestinoId: traspaso.almacenDestinoId.toString(),
            almacenDestinoNombre: traspaso.almacenDestinoNombre,
            tipo: TipoMovimiento.TRANSFERENCIA_SALIDA,
            origen: OrigenMovimiento.TRANSFERENCIA,
            documentoOrigenId: traspaso._id.toString(),
            documentoOrigenCodigo: traspaso.codigo,
            documentoOrigenTipo: 'traspaso',
            cantidad: linea.cantidadEnviada,
            costeUnitario: linea.costeUnitario,
            lote: linea.lote,
            numeroSerie: linea.numeroSerie,
            ubicacion: linea.ubicacionOrigen,
            motivo: `Traspaso a ${traspaso.almacenDestinoNombre}`,
            usuarioId,
            usuarioNombre,
          },
          empresaId,
          dbConfig
        );
        movimientosSalidaIds.push(movimiento._id);
      }
    }

    traspaso.estado = EstadoTraspaso.EN_TRANSITO;
    traspaso.fechaSalida = new Date();
    traspaso.usuarioSalidaId = new mongoose.Types.ObjectId(usuarioId);
    traspaso.usuarioSalidaNombre = usuarioNombre;
    traspaso.observacionesSalida = dto.observacionesSalida;
    traspaso.movimientosSalidaIds = movimientosSalidaIds;

    await traspaso.save();
    return traspaso;
  }

  /**
   * Confirmar recepción en almacén destino
   */
  async confirmarRecepcion(
    id: string,
    dto: ConfirmarRecepcionDTO,
    usuarioId: string,
    usuarioNombre: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<ITraspaso> {
    const TraspasoModel = await getTraspasoModel(empresaId, dbConfig);

    const traspaso = await TraspasoModel.findById(id);
    if (!traspaso) {
      throw new Error('Traspaso no encontrado');
    }
    if (traspaso.estado !== EstadoTraspaso.EN_TRANSITO && traspaso.estado !== EstadoTraspaso.RECIBIDO_PARCIAL) {
      throw new Error(`No se puede confirmar recepción en estado ${traspaso.estado}`);
    }

    // Actualizar cantidades recibidas
    if (dto.lineas) {
      for (const lineaDto of dto.lineas) {
        const linea = traspaso.lineas.find(l => l._id?.toString() === lineaDto.lineaId);
        if (linea) {
          linea.cantidadRecibida = lineaDto.cantidadRecibida;
          if (lineaDto.ubicacionDestino) linea.ubicacionDestino = lineaDto.ubicacionDestino;
          if (lineaDto.observaciones) linea.observaciones = lineaDto.observaciones;
        }
      }
    } else {
      // Si no se especifican cantidades, recibir todo lo enviado
      for (const linea of traspaso.lineas) {
        linea.cantidadRecibida = linea.cantidadEnviada;
      }
    }

    // Generar movimientos de entrada
    const movimientosEntradaIds: mongoose.Types.ObjectId[] = [];
    for (const linea of traspaso.lineas) {
      if (linea.cantidadRecibida > 0) {
        const movimiento = await stockService.registrarMovimiento(
          {
            productoId: linea.productoId.toString(),
            productoCodigo: linea.productoCodigo,
            productoNombre: linea.productoNombre,
            productoSku: linea.productoSku,
            varianteId: linea.varianteId,
            almacenId: traspaso.almacenDestinoId.toString(),
            almacenNombre: traspaso.almacenDestinoNombre,
            tipo: TipoMovimiento.TRANSFERENCIA_ENTRADA,
            origen: OrigenMovimiento.TRANSFERENCIA,
            documentoOrigenId: traspaso._id.toString(),
            documentoOrigenCodigo: traspaso.codigo,
            documentoOrigenTipo: 'traspaso',
            cantidad: linea.cantidadRecibida,
            costeUnitario: linea.costeUnitario,
            lote: linea.lote,
            numeroSerie: linea.numeroSerie,
            ubicacion: linea.ubicacionDestino,
            motivo: `Traspaso desde ${traspaso.almacenOrigenNombre}`,
            usuarioId,
            usuarioNombre,
          },
          empresaId,
          dbConfig
        );
        movimientosEntradaIds.push(movimiento._id);
      }
    }

    // Determinar si es recepción completa o parcial
    const totalEnviado = traspaso.lineas.reduce((sum, l) => sum + l.cantidadEnviada, 0);
    const totalRecibido = traspaso.lineas.reduce((sum, l) => sum + l.cantidadRecibida, 0);

    if (totalRecibido >= totalEnviado) {
      traspaso.estado = EstadoTraspaso.RECIBIDO;
    } else {
      traspaso.estado = EstadoTraspaso.RECIBIDO_PARCIAL;
    }

    traspaso.fechaRecepcion = new Date();
    traspaso.usuarioRecepcionId = new mongoose.Types.ObjectId(usuarioId);
    traspaso.usuarioRecepcionNombre = usuarioNombre;
    traspaso.observacionesRecepcion = dto.observacionesRecepcion;
    traspaso.movimientosEntradaIds = [
      ...(traspaso.movimientosEntradaIds || []),
      ...movimientosEntradaIds,
    ];

    await traspaso.save();
    return traspaso;
  }

  /**
   * Anular traspaso
   */
  async anular(
    id: string,
    dto: AnularTraspasoDTO,
    usuarioId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<ITraspaso> {
    const TraspasoModel = await getTraspasoModel(empresaId, dbConfig);

    const traspaso = await TraspasoModel.findById(id);
    if (!traspaso) {
      throw new Error('Traspaso no encontrado');
    }
    if (traspaso.estado === EstadoTraspaso.ANULADO) {
      throw new Error('El traspaso ya está anulado');
    }
    if (traspaso.estado === EstadoTraspaso.RECIBIDO) {
      throw new Error('No se puede anular un traspaso ya recibido');
    }

    // Si ya tiene movimientos de salida, anularlos
    if (traspaso.movimientosSalidaIds && traspaso.movimientosSalidaIds.length > 0) {
      for (const movId of traspaso.movimientosSalidaIds) {
        try {
          await stockService.anularMovimiento(
            movId.toString(),
            empresaId,
            usuarioId,
            `Anulación de traspaso: ${dto.motivoAnulacion}`,
            dbConfig
          );
        } catch (error) {
          console.error(`Error anulando movimiento ${movId}:`, error);
        }
      }
    }

    traspaso.estado = EstadoTraspaso.ANULADO;
    traspaso.fechaAnulacion = new Date();
    traspaso.usuarioAnulacionId = new mongoose.Types.ObjectId(usuarioId);
    traspaso.motivoAnulacion = dto.motivoAnulacion;

    await traspaso.save();
    return traspaso;
  }

  /**
   * Obtener traspaso por ID
   */
  async obtenerPorId(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<ITraspaso | null> {
    const TraspasoModel = await getTraspasoModel(empresaId, dbConfig);
    return TraspasoModel.findById(id).lean();
  }

  /**
   * Listar traspasos con filtros
   */
  async listar(
    filters: SearchTraspasosDTO,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<{ data: ITraspaso[]; total: number }> {
    const TraspasoModel = await getTraspasoModel(empresaId, dbConfig);

    const query: any = {};

    if (filters.q) {
      query.$or = [
        { codigo: { $regex: filters.q, $options: 'i' } },
        { almacenOrigenNombre: { $regex: filters.q, $options: 'i' } },
        { almacenDestinoNombre: { $regex: filters.q, $options: 'i' } },
      ];
    }
    if (filters.almacenOrigenId) {
      query.almacenOrigenId = new mongoose.Types.ObjectId(filters.almacenOrigenId);
    }
    if (filters.almacenDestinoId) {
      query.almacenDestinoId = new mongoose.Types.ObjectId(filters.almacenDestinoId);
    }
    if (filters.estado) {
      query.estado = filters.estado;
    }
    if (filters.prioridad) {
      query.prioridad = filters.prioridad;
    }
    if (filters.fechaDesde || filters.fechaHasta) {
      query.fechaCreacion = {};
      if (filters.fechaDesde) {
        query.fechaCreacion.$gte = new Date(filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        const fechaHasta = new Date(filters.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        query.fechaCreacion.$lte = fechaHasta;
      }
    }

    const skip = (filters.page - 1) * filters.limit;
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      TraspasoModel.find(query)
        .sort({ [filters.sortBy]: sortOrder })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      TraspasoModel.countDocuments(query),
    ]);

    return { data, total };
  }

  /**
   * Generar código de traspaso
   */
  private async generarCodigo(empresaId: string, dbConfig: IDatabaseConfig): Promise<string> {
    const TraspasoModel = await getTraspasoModel(empresaId, dbConfig);
    const year = new Date().getFullYear();
    const prefix = `TR${year}-`;

    const ultimo = await TraspasoModel.findOne({
      codigo: { $regex: `^${prefix}` },
    })
      .sort({ codigo: -1 })
      .select('codigo')
      .lean();

    let numero = 1;
    if (ultimo?.codigo) {
      const match = ultimo.codigo.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match) {
        numero = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${numero.toString().padStart(5, '0')}`;
  }

  /**
   * Obtener estadísticas de traspasos
   */
  async obtenerEstadisticas(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<{
    pendientes: number;
    enTransito: number;
    completados: number;
    anulados: number;
  }> {
    const TraspasoModel = await getTraspasoModel(empresaId, dbConfig);

    const [pendientes, enTransito, completados, anulados] = await Promise.all([
      TraspasoModel.countDocuments({ estado: { $in: [EstadoTraspaso.BORRADOR, EstadoTraspaso.PENDIENTE_SALIDA] } }),
      TraspasoModel.countDocuments({ estado: EstadoTraspaso.EN_TRANSITO }),
      TraspasoModel.countDocuments({ estado: { $in: [EstadoTraspaso.RECIBIDO, EstadoTraspaso.RECIBIDO_PARCIAL] } }),
      TraspasoModel.countDocuments({ estado: EstadoTraspaso.ANULADO }),
    ]);

    return { pendientes, enTransito, completados, anulados };
  }
}

export const traspasosService = new TraspasosService();
export default traspasosService;
