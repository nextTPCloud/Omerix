import mongoose, { Model, Types } from 'mongoose';
import { Inventario, IInventario, EstadoInventario, TipoInventario, EstadoLineaInventario, ILineaInventario } from './Inventario';
import { stockService } from '@/services/stock.service';
import { TipoMovimiento, OrigenMovimiento } from '@/models/MovimientoStock';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { databaseManager } from '@/services/database-manager.service';
import {
  CreateInventarioDTO,
  IniciarInventarioDTO,
  ActualizarConteoDTO,
  ConteoLineaDTO,
  RevisarDiferenciasDTO,
  RegularizarInventarioDTO,
  AnularInventarioDTO,
  SearchInventariosDTO,
} from './inventarios.dto';

// ============================================
// HELPERS
// ============================================

const getInventarioModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IInventario>> => {
  return databaseManager.getModel<IInventario>(empresaId, dbConfig, 'Inventario', Inventario.schema);
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

class InventariosService {
  /**
   * Listar inventarios con filtros
   */
  async listar(filters: SearchInventariosDTO, empresaId: string, dbConfig: IDatabaseConfig) {
    const Model = await getInventarioModel(empresaId, dbConfig);

    const query: any = {};

    if (filters.q) {
      query.$or = [
        { codigo: { $regex: filters.q, $options: 'i' } },
        { almacenNombre: { $regex: filters.q, $options: 'i' } },
      ];
    }

    if (filters.almacenId) {
      query.almacenId = new Types.ObjectId(filters.almacenId);
    }

    if (filters.tipo) {
      query.tipo = filters.tipo;
    }

    if (filters.estado) {
      query.estado = filters.estado;
    }

    if (filters.fechaDesde || filters.fechaHasta) {
      query.fechaCreacion = {};
      if (filters.fechaDesde) {
        query.fechaCreacion.$gte = new Date(filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        query.fechaCreacion.$lte = new Date(filters.fechaHasta + 'T23:59:59');
      }
    }

    const sort: any = {};
    sort[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;

    const skip = (filters.page - 1) * filters.limit;

    const [data, total] = await Promise.all([
      Model.find(query)
        .sort(sort)
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      Model.countDocuments(query),
    ]);

    return { data, total };
  }

  /**
   * Obtener inventario por ID
   */
  async obtenerPorId(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const Model = await getInventarioModel(empresaId, dbConfig);
    return Model.findById(id).lean();
  }

  /**
   * Crear inventario
   */
  async crear(
    data: CreateInventarioDTO,
    usuarioId: string,
    usuarioNombre: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const Model = await getInventarioModel(empresaId, dbConfig);
    const AlmacenModel = await getAlmacenModel(empresaId, dbConfig);
    const ProductoModel = await getProductoModel(empresaId, dbConfig);

    // Obtener almacen
    const almacen = await AlmacenModel.findById(data.almacenId).lean() as any;
    if (!almacen) {
      throw new Error('Almacen no encontrado');
    }

    // Generar codigo
    const year = new Date().getFullYear();
    const count = await Model.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    const codigo = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

    // Construir query para obtener productos
    const productosQuery: any = { activo: true };

    // Si es parcial, aplicar filtros
    if (data.tipo === 'parcial') {
      if (data.familiaIds && data.familiaIds.length > 0) {
        productosQuery.familiaId = { $in: data.familiaIds.map(id => new Types.ObjectId(id)) };
      }
    }

    // Obtener productos del almacen
    const productos = await ProductoModel.find(productosQuery).lean() as any[];

    // Filtrar por stock si es necesario
    const lineas: ILineaInventario[] = [];

    for (const producto of productos) {
      const stockAlmacen = producto.stockPorAlmacen?.find(
        (s: any) => s.almacenId.toString() === data.almacenId
      );
      const stockActual = stockAlmacen?.cantidad || 0;

      // Si solo con stock, omitir productos sin stock
      if (data.soloConStock && stockActual <= 0) {
        continue;
      }

      // Si hay filtro de ubicaciones, verificar
      if (data.ubicaciones && data.ubicaciones.length > 0) {
        const ubicacionProducto = stockAlmacen?.ubicacion || '';
        if (!data.ubicaciones.some(u => ubicacionProducto.startsWith(u))) {
          continue;
        }
      }

      lineas.push({
        productoId: producto._id,
        productoCodigo: producto.codigo || producto.sku || '',
        productoNombre: producto.nombre,
        productoSku: producto.sku,
        ubicacion: stockAlmacen?.ubicacion,
        stockTeorico: stockActual,
        stockContado: null,
        diferencia: 0,
        estadoLinea: EstadoLineaInventario.PENDIENTE,
        costeUnitario: producto.costes?.costeUltimo || producto.costes?.costeMedio || 0,
        valorDiferencia: 0,
        aprobado: null,
      });
    }

    // Crear inventario
    const inventario = new Model({
      codigo,
      almacenId: new Types.ObjectId(data.almacenId),
      almacenNombre: almacen.nombre,
      tipo: data.tipo,
      estado: EstadoInventario.BORRADOR,
      familiaIds: data.familiaIds?.map(id => new Types.ObjectId(id)),
      ubicaciones: data.ubicaciones,
      soloConStock: data.soloConStock,
      bloquearMovimientos: data.bloquearMovimientos,
      fechaCreacion: new Date(),
      usuarioCreadorId: new Types.ObjectId(usuarioId),
      usuarioCreadorNombre: usuarioNombre,
      lineas,
      observaciones: data.observaciones,
    });

    await inventario.save();
    return inventario.toObject();
  }

  /**
   * Iniciar inventario (pasar a estado EN_CONTEO)
   */
  async iniciar(
    id: string,
    data: IniciarInventarioDTO,
    usuarioId: string,
    usuarioNombre: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const Model = await getInventarioModel(empresaId, dbConfig);

    const inventario = await Model.findById(id);
    if (!inventario) {
      throw new Error('Inventario no encontrado');
    }

    if (inventario.estado !== EstadoInventario.BORRADOR) {
      throw new Error('Solo se puede iniciar un inventario en estado borrador');
    }

    inventario.estado = EstadoInventario.EN_CONTEO;
    inventario.fechaInicio = new Date();

    if (data.usuarioResponsableId) {
      inventario.usuarioResponsableId = new Types.ObjectId(data.usuarioResponsableId);
    }

    await inventario.save();
    return inventario.toObject();
  }

  /**
   * Actualizar conteos de multiples lineas
   */
  async actualizarConteos(
    id: string,
    data: ActualizarConteoDTO,
    usuarioId: string,
    usuarioNombre: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const Model = await getInventarioModel(empresaId, dbConfig);

    const inventario = await Model.findById(id);
    if (!inventario) {
      throw new Error('Inventario no encontrado');
    }

    if (inventario.estado !== EstadoInventario.EN_CONTEO) {
      throw new Error('Solo se puede contar en inventarios en estado EN_CONTEO');
    }

    for (const conteo of data.lineas) {
      const linea = inventario.lineas.find(l => l._id?.toString() === conteo.lineaId);
      if (linea) {
        linea.stockContado = conteo.stockContado;
        linea.diferencia = conteo.stockContado - linea.stockTeorico;
        linea.valorDiferencia = linea.diferencia * linea.costeUnitario;
        linea.estadoLinea = EstadoLineaInventario.CONTADO;
        linea.fechaConteo = new Date();
        linea.usuarioConteoId = new Types.ObjectId(usuarioId);
        linea.usuarioConteoNombre = usuarioNombre;

        if (conteo.ubicacion) linea.ubicacion = conteo.ubicacion;
        if (conteo.lote) linea.lote = conteo.lote;
        if (conteo.numeroSerie) linea.numeroSerie = conteo.numeroSerie;
        if (conteo.fechaCaducidad) linea.fechaCaducidad = new Date(conteo.fechaCaducidad);
        if (conteo.observaciones) linea.observaciones = conteo.observaciones;
        if (conteo.fotoUrl) linea.fotoUrl = conteo.fotoUrl;
      }
    }

    await inventario.save();
    return inventario.toObject();
  }

  /**
   * Actualizar conteo de una linea individual
   */
  async actualizarConteoLinea(
    id: string,
    lineaId: string,
    data: ConteoLineaDTO,
    usuarioId: string,
    usuarioNombre: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const Model = await getInventarioModel(empresaId, dbConfig);

    const inventario = await Model.findById(id);
    if (!inventario) {
      throw new Error('Inventario no encontrado');
    }

    if (inventario.estado !== EstadoInventario.EN_CONTEO) {
      throw new Error('Solo se puede contar en inventarios en estado EN_CONTEO');
    }

    const linea = inventario.lineas.find(l => l._id?.toString() === lineaId);
    if (!linea) {
      throw new Error('Linea no encontrada');
    }

    linea.stockContado = data.stockContado;
    linea.diferencia = data.stockContado - linea.stockTeorico;
    linea.valorDiferencia = linea.diferencia * linea.costeUnitario;
    linea.estadoLinea = EstadoLineaInventario.CONTADO;
    linea.fechaConteo = new Date();
    linea.usuarioConteoId = new Types.ObjectId(usuarioId);
    linea.usuarioConteoNombre = usuarioNombre;

    if (data.ubicacion) linea.ubicacion = data.ubicacion;
    if (data.lote) linea.lote = data.lote;
    if (data.numeroSerie) linea.numeroSerie = data.numeroSerie;
    if (data.fechaCaducidad) linea.fechaCaducidad = new Date(data.fechaCaducidad);
    if (data.observaciones) linea.observaciones = data.observaciones;
    if (data.fotoUrl) linea.fotoUrl = data.fotoUrl;

    await inventario.save();
    return inventario.toObject();
  }

  /**
   * Finalizar conteo (pasar a PENDIENTE_REVISION)
   */
  async finalizarConteo(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const Model = await getInventarioModel(empresaId, dbConfig);

    const inventario = await Model.findById(id);
    if (!inventario) {
      throw new Error('Inventario no encontrado');
    }

    if (inventario.estado !== EstadoInventario.EN_CONTEO) {
      throw new Error('Solo se puede finalizar conteo en inventarios en estado EN_CONTEO');
    }

    // Verificar que todos los productos esten contados
    const sinContar = inventario.lineas.filter(l => l.stockContado === null);
    if (sinContar.length > 0) {
      throw new Error(`Hay ${sinContar.length} productos sin contar`);
    }

    inventario.estado = EstadoInventario.PENDIENTE_REVISION;
    inventario.fechaFinConteo = new Date();

    await inventario.save();
    return inventario.toObject();
  }

  /**
   * Revisar diferencias (aprobar/rechazar ajustes)
   */
  async revisarDiferencias(
    id: string,
    data: RevisarDiferenciasDTO,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const Model = await getInventarioModel(empresaId, dbConfig);

    const inventario = await Model.findById(id);
    if (!inventario) {
      throw new Error('Inventario no encontrado');
    }

    if (inventario.estado !== EstadoInventario.PENDIENTE_REVISION) {
      throw new Error('Solo se pueden revisar diferencias en inventarios en estado PENDIENTE_REVISION');
    }

    for (const revision of data.lineas) {
      const linea = inventario.lineas.find(l => l._id?.toString() === revision.lineaId);
      if (linea) {
        linea.aprobado = revision.aprobado;
        linea.motivoAjuste = revision.motivoAjuste;
        linea.estadoLinea = EstadoLineaInventario.REVISADO;
      }
    }

    await inventario.save();
    return inventario.toObject();
  }

  /**
   * Regularizar inventario (aplicar diferencias aprobadas)
   */
  async regularizar(
    id: string,
    data: RegularizarInventarioDTO,
    usuarioId: string,
    usuarioNombre: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const Model = await getInventarioModel(empresaId, dbConfig);

    const inventario = await Model.findById(id);
    if (!inventario) {
      throw new Error('Inventario no encontrado');
    }

    if (inventario.estado !== EstadoInventario.PENDIENTE_REVISION) {
      throw new Error('Solo se pueden regularizar inventarios en estado PENDIENTE_REVISION');
    }

    // Aplicar ajustes aprobados
    for (const linea of inventario.lineas) {
      if (linea.diferencia !== 0 && linea.aprobado === true) {
        // Generar movimiento de regularizacion
        await stockService.registrarMovimiento(
          {
            productoId: linea.productoId.toString(),
            productoCodigo: linea.productoCodigo,
            productoNombre: linea.productoNombre,
            productoSku: linea.productoSku,
            almacenId: inventario.almacenId.toString(),
            almacenNombre: inventario.almacenNombre,
            tipo: TipoMovimiento.REGULARIZACION,
            origen: OrigenMovimiento.INVENTARIO,
            cantidad: linea.diferencia,
            costeUnitario: linea.costeUnitario,
            documentoOrigenTipo: 'inventario',
            documentoOrigenId: inventario._id.toString(),
            documentoOrigenCodigo: inventario.codigo,
            ubicacion: linea.ubicacion,
            lote: linea.lote,
            numeroSerie: linea.numeroSerie,
            fechaCaducidad: linea.fechaCaducidad,
            observaciones: `Regularizacion inventario ${inventario.codigo}: ${linea.motivoAjuste || 'Sin motivo'}`,
            usuarioId,
            usuarioNombre,
          },
          empresaId,
          dbConfig
        );

        linea.estadoLinea = EstadoLineaInventario.REGULARIZADO;
      }
    }

    inventario.estado = EstadoInventario.REGULARIZADO;
    inventario.fechaRegularizacion = new Date();
    inventario.bloquearMovimientos = false;

    if (data.observacionesRegularizacion) {
      inventario.observaciones = (inventario.observaciones || '') + '\n' + data.observacionesRegularizacion;
    }

    await inventario.save();
    return inventario.toObject();
  }

  /**
   * Anular inventario
   */
  async anular(
    id: string,
    data: AnularInventarioDTO,
    usuarioId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const Model = await getInventarioModel(empresaId, dbConfig);

    const inventario = await Model.findById(id);
    if (!inventario) {
      throw new Error('Inventario no encontrado');
    }

    if (inventario.estado === EstadoInventario.ANULADO) {
      throw new Error('El inventario ya esta anulado');
    }

    if (inventario.estado === EstadoInventario.REGULARIZADO) {
      throw new Error('No se puede anular un inventario ya regularizado');
    }

    inventario.estado = EstadoInventario.ANULADO;
    inventario.fechaAnulacion = new Date();
    inventario.motivoAnulacion = data.motivoAnulacion;
    inventario.bloquearMovimientos = false;

    await inventario.save();
    return inventario.toObject();
  }

  /**
   * Obtener estadisticas
   */
  async obtenerEstadisticas(empresaId: string, dbConfig: IDatabaseConfig) {
    const Model = await getInventarioModel(empresaId, dbConfig);

    const [enConteo, pendienteRevision, regularizados, anulados] = await Promise.all([
      Model.countDocuments({ estado: EstadoInventario.EN_CONTEO }),
      Model.countDocuments({ estado: EstadoInventario.PENDIENTE_REVISION }),
      Model.countDocuments({ estado: EstadoInventario.REGULARIZADO }),
      Model.countDocuments({ estado: EstadoInventario.ANULADO }),
    ]);

    return {
      enConteo,
      pendienteRevision,
      regularizados,
      anulados,
    };
  }
}

export const inventariosService = new InventariosService();
export default inventariosService;
