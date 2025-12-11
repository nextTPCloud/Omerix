import mongoose, { Model, SortOrder } from 'mongoose';
import { IPedidoCompra, EstadoPedidoCompra, PedidoCompra } from './PedidoCompra';
import { CreatePedidoCompraDTO, UpdatePedidoCompraDTO, GetPedidosCompraQuery } from './pedidos-compra.dto';
import { IDatabaseConfig } from '@/types/database.types';
import { databaseManager } from '@/services/database-manager.service';
import { parseAdvancedFilters, mergeFilters } from '@/utils/advanced-filters.helper';

// ============================================
// HELPER PARA OBTENER MODELO DINAMICO
// ============================================

const getPedidoCompraModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IPedidoCompra>> => {
  const PedidoCompraSchema = PedidoCompra.schema;
  return databaseManager.getModel<IPedidoCompra>(empresaId, dbConfig, 'PedidoCompra', PedidoCompraSchema);
};

// ============================================
// SERVICIO DE PEDIDOS DE COMPRA
// ============================================

export class PedidosCompraService {
  // ============================================
  // CREAR PEDIDO DE COMPRA
  // ============================================

  async crear(
    createPedidoCompraDto: CreatePedidoCompraDTO,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPedidoCompra> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId, dbConfig);

    // Completar datos del proveedor si no vienen
    if (!createPedidoCompraDto.proveedorNombre || !createPedidoCompraDto.proveedorNif) {
      const { getProveedorModel } = await import('@/utils/dynamic-models.helper');
      const ProveedorModel = await getProveedorModel(empresaId, dbConfig);
      const proveedor = await ProveedorModel.findById(createPedidoCompraDto.proveedorId).lean();
      if (proveedor) {
        createPedidoCompraDto.proveedorNombre = createPedidoCompraDto.proveedorNombre || proveedor.nombre;
        createPedidoCompraDto.proveedorNif = createPedidoCompraDto.proveedorNif || proveedor.nif;
        createPedidoCompraDto.proveedorEmail = createPedidoCompraDto.proveedorEmail || proveedor.email;
        createPedidoCompraDto.proveedorTelefono = createPedidoCompraDto.proveedorTelefono || proveedor.telefono;
      }
    }

    // Crear pedido
    const pedidoCompra = new PedidoCompraModel({
      ...createPedidoCompraDto,
      creadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaCreacion: new Date(),
    });

    // Agregar al historial
    pedidoCompra.historial.push({
      fecha: new Date(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      accion: 'Creacion',
      descripcion: 'Pedido de compra creado',
    });

    await pedidoCompra.save();
    return pedidoCompra;
  }

  // ============================================
  // OBTENER TODOS CON FILTROS Y PAGINACION
  // ============================================

  async findAll(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    query: GetPedidosCompraQuery
  ): Promise<{
    data: IPedidoCompra[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId, dbConfig);

    const {
      page = 1,
      limit = 25,
      sortBy = 'fecha',
      sortOrder = 'desc',
      search,
      estado,
      prioridad,
      proveedorId,
      activo,
      fechaDesde,
      fechaHasta,
      fechaEntregaDesde,
      fechaEntregaHasta,
      importeMinimo,
      importeMaximo,
      ...advancedParams
    } = query;

    // Construir filtro base
    const baseFilter: any = {};

    // Busqueda por texto
    if (search) {
      baseFilter.$or = [
        { codigo: { $regex: search, $options: 'i' } },
        { proveedorNombre: { $regex: search, $options: 'i' } },
        { proveedorNif: { $regex: search, $options: 'i' } },
        { referenciaProveedor: { $regex: search, $options: 'i' } },
        { titulo: { $regex: search, $options: 'i' } },
      ];
    }

    // Filtros simples
    if (estado) baseFilter.estado = estado;
    if (prioridad) baseFilter.prioridad = prioridad;
    if (proveedorId) baseFilter.proveedorId = new mongoose.Types.ObjectId(proveedorId);
    if (activo !== undefined) baseFilter.activo = activo;

    // Filtros de fecha
    if (fechaDesde || fechaHasta) {
      baseFilter.fecha = {};
      if (fechaDesde) baseFilter.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) baseFilter.fecha.$lte = new Date(fechaHasta);
    }

    if (fechaEntregaDesde || fechaEntregaHasta) {
      baseFilter.fechaEntregaPrevista = {};
      if (fechaEntregaDesde) baseFilter.fechaEntregaPrevista.$gte = new Date(fechaEntregaDesde);
      if (fechaEntregaHasta) baseFilter.fechaEntregaPrevista.$lte = new Date(fechaEntregaHasta);
    }

    // Filtros de importe
    if (importeMinimo !== undefined || importeMaximo !== undefined) {
      baseFilter['totales.totalPedido'] = {};
      if (importeMinimo !== undefined) baseFilter['totales.totalPedido'].$gte = importeMinimo;
      if (importeMaximo !== undefined) baseFilter['totales.totalPedido'].$lte = importeMaximo;
    }

    // Parsear filtros avanzados
    const advancedFilters = parseAdvancedFilters(advancedParams);
    const filter = mergeFilters(baseFilter, advancedFilters);

    // Ejecutar consulta
    const skip = (page - 1) * limit;
    const sortOptions: { [key: string]: SortOrder } = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [pedidos, total] = await Promise.all([
      PedidoCompraModel.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      PedidoCompraModel.countDocuments(filter),
    ]);

    return {
      data: pedidos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async findById(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPedidoCompra | null> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId, dbConfig);
    return PedidoCompraModel.findById(id).lean();
  }

  // ============================================
  // OBTENER POR CODIGO
  // ============================================

  async findByCodigo(
    codigo: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPedidoCompra | null> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId, dbConfig);
    return PedidoCompraModel.findOne({ codigo: codigo.toUpperCase() }).lean();
  }

  // ============================================
  // ACTUALIZAR PEDIDO DE COMPRA
  // ============================================

  async update(
    id: string,
    updatePedidoCompraDto: UpdatePedidoCompraDTO,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPedidoCompra | null> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId, dbConfig);

    const pedido = await PedidoCompraModel.findById(id);
    if (!pedido) return null;

    // Verificar si esta bloqueado
    if (pedido.bloqueado) {
      throw new Error('El pedido esta bloqueado y no puede modificarse');
    }

    // Guardar datos anteriores para historial
    const datosAnteriores = {
      estado: pedido.estado,
      totales: pedido.totales,
      lineas: pedido.lineas?.length,
    };

    // Actualizar campos
    Object.assign(pedido, {
      ...updatePedidoCompraDto,
      modificadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaModificacion: new Date(),
    });

    // Agregar al historial
    pedido.historial.push({
      fecha: new Date(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      accion: 'Modificacion',
      descripcion: 'Pedido de compra modificado',
      datosAnteriores,
    });

    await pedido.save();
    return pedido;
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(
    id: string,
    nuevoEstado: EstadoPedidoCompra,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPedidoCompra | null> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId, dbConfig);

    const pedido = await PedidoCompraModel.findById(id);
    if (!pedido) return null;

    const estadoAnterior = pedido.estado;
    pedido.estado = nuevoEstado;
    pedido.modificadoPor = new mongoose.Types.ObjectId(usuarioId);
    pedido.fechaModificacion = new Date();

    // Actualizar fechas segun estado
    if (nuevoEstado === EstadoPedidoCompra.ENVIADO && !pedido.fechaEnvio) {
      pedido.fechaEnvio = new Date();
    }
    if (nuevoEstado === EstadoPedidoCompra.CONFIRMADO && !pedido.fechaConfirmacion) {
      pedido.fechaConfirmacion = new Date();
    }
    if (nuevoEstado === EstadoPedidoCompra.RECIBIDO && !pedido.fechaRecepcion) {
      pedido.fechaRecepcion = new Date();
    }

    // Historial
    pedido.historial.push({
      fecha: new Date(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      accion: 'Cambio de estado',
      descripcion: `Estado cambiado de "${estadoAnterior}" a "${nuevoEstado}"`,
      datosAnteriores: { estado: estadoAnterior },
    });

    await pedido.save();
    return pedido;
  }

  // ============================================
  // ELIMINAR PEDIDO DE COMPRA
  // ============================================

  async delete(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId, dbConfig);
    const result = await PedidoCompraModel.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    return result.deletedCount > 0;
  }

  // ============================================
  // ELIMINAR MULTIPLES
  // ============================================

  async deleteMany(
    ids: string[],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<number> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId, dbConfig);
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
    const result = await PedidoCompraModel.deleteMany({ _id: { $in: objectIds } });
    return result.deletedCount;
  }

  // ============================================
  // OBTENER ESTADISTICAS
  // ============================================

  async getEstadisticas(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<{
    total: number;
    porEstado: Record<string, number>;
    totalImporte: number;
    pendientesRecibir: number;
  }> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId, dbConfig);

    const [
      total,
      porEstado,
      totales,
      pendientes,
    ] = await Promise.all([
      PedidoCompraModel.countDocuments(),
      PedidoCompraModel.aggregate([
        { $group: { _id: '$estado', count: { $sum: 1 } } },
      ]),
      PedidoCompraModel.aggregate([
        { $match: { activo: true } },
        {
          $group: {
            _id: null,
            totalImporte: { $sum: '$totales.totalPedido' },
          },
        },
      ]),
      PedidoCompraModel.countDocuments({
        estado: {
          $in: [
            EstadoPedidoCompra.ENVIADO,
            EstadoPedidoCompra.CONFIRMADO,
            EstadoPedidoCompra.PARCIALMENTE_RECIBIDO,
          ],
        },
      }),
    ]);

    const estadisticasPorEstado: Record<string, number> = {};
    porEstado.forEach((item: any) => {
      estadisticasPorEstado[item._id] = item.count;
    });

    return {
      total,
      porEstado: estadisticasPorEstado,
      totalImporte: totales[0]?.totalImporte || 0,
      pendientesRecibir: pendientes,
    };
  }

  // ============================================
  // REGISTRAR RECEPCION DE LINEA
  // ============================================

  async registrarRecepcion(
    id: string,
    lineaId: string,
    cantidadRecibida: number,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPedidoCompra | null> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId, dbConfig);

    const pedido = await PedidoCompraModel.findById(id);
    if (!pedido) return null;

    const linea = pedido.lineas.find(l => l._id?.toString() === lineaId);
    if (!linea) throw new Error('Linea no encontrada');

    const cantidadAnterior = linea.cantidadRecibida || 0;
    linea.cantidadRecibida = (linea.cantidadRecibida || 0) + cantidadRecibida;
    linea.cantidadPendiente = Math.max(0, linea.cantidad - linea.cantidadRecibida);

    if (linea.cantidadRecibida >= linea.cantidad) {
      linea.fechaRecepcion = new Date();
    }

    // Verificar si todas las lineas estan recibidas
    const todasRecibidas = pedido.lineas
      .filter(l => l.incluidoEnTotal)
      .every(l => (l.cantidadRecibida || 0) >= l.cantidad);

    const algunaRecibida = pedido.lineas
      .filter(l => l.incluidoEnTotal)
      .some(l => (l.cantidadRecibida || 0) > 0);

    if (todasRecibidas) {
      pedido.estado = EstadoPedidoCompra.RECIBIDO;
      pedido.fechaRecepcion = new Date();
    } else if (algunaRecibida) {
      pedido.estado = EstadoPedidoCompra.PARCIALMENTE_RECIBIDO;
    }

    pedido.modificadoPor = new mongoose.Types.ObjectId(usuarioId);
    pedido.fechaModificacion = new Date();

    // Historial
    pedido.historial.push({
      fecha: new Date(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      accion: 'Recepcion',
      descripcion: `Recibidas ${cantidadRecibida} unidades de "${linea.nombre}"`,
      datosAnteriores: { cantidadRecibida: cantidadAnterior },
    });

    await pedido.save();
    return pedido;
  }

  // ============================================
  // DUPLICAR PEDIDO
  // ============================================

  async duplicar(
    id: string,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPedidoCompra> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId, dbConfig);

    const pedidoOriginal = await PedidoCompraModel.findById(id).lean();
    if (!pedidoOriginal) {
      throw new Error('Pedido no encontrado');
    }

    // Preparar datos para nuevo pedido
    const nuevoPedido = new PedidoCompraModel({
      ...pedidoOriginal,
      _id: new mongoose.Types.ObjectId(),
      codigo: undefined, // Se generara automaticamente
      estado: EstadoPedidoCompra.BORRADOR,
      fecha: new Date(),
      fechaEnvio: undefined,
      fechaConfirmacion: undefined,
      fechaEntregaPrevista: undefined,
      fechaRecepcion: undefined,
      referenciaProveedor: undefined,
      numeroConfirmacion: undefined,
      documentos: [],
      historial: [{
        fecha: new Date(),
        usuarioId: new mongoose.Types.ObjectId(usuarioId),
        accion: 'Duplicacion',
        descripcion: `Duplicado del pedido ${pedidoOriginal.codigo}`,
      }],
      creadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaCreacion: new Date(),
      modificadoPor: undefined,
      fechaModificacion: undefined,
      bloqueado: false,
    });

    // Resetear cantidades recibidas en lineas
    nuevoPedido.lineas = nuevoPedido.lineas.map((linea: any) => ({
      ...linea,
      _id: new mongoose.Types.ObjectId(),
      cantidadRecibida: 0,
      cantidadPendiente: linea.cantidad,
      fechaRecepcion: undefined,
    }));

    await nuevoPedido.save();
    return nuevoPedido;
  }
}

export const pedidosCompraService = new PedidosCompraService();
export default pedidosCompraService;
