import mongoose, { Model, SortOrder } from 'mongoose';
import { IPedidoCompra, EstadoPedidoCompra, PedidoCompra } from './PedidoCompra';
import { CreatePedidoCompraDTO, UpdatePedidoCompraDTO, GetPedidosCompraQuery } from './pedidos-compra.dto';
import { IDatabaseConfig } from '@/types/database.types';
import { databaseManager } from '@/services/database-manager.service';
import { parseAdvancedFilters, mergeFilters } from '@/utils/advanced-filters.helper';
import { getProveedorModel, getProductoModel } from '@/utils/dynamic-models.helper';

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

    // Generar codigo y numero
    const serie = (createPedidoCompraDto as any).serie || 'PC';
    const { codigo, numero } = await this.generarCodigoNumero(PedidoCompraModel, serie);

    // Procesar lineas y calcular totales
    const lineas = this.procesarLineas(createPedidoCompraDto.lineas || []);
    const totales = this.calcularTotales(lineas, createPedidoCompraDto.descuentoGlobalPorcentaje || 0);

    // Crear pedido
    const pedidoCompra = new PedidoCompraModel({
      ...createPedidoCompraDto,
      serie,
      codigo,
      numero,
      lineas,
      totales,
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

    // Procesar lineas y recalcular totales si se actualizan
    if (updatePedidoCompraDto.lineas) {
      updatePedidoCompraDto.lineas = this.procesarLineas(updatePedidoCompraDto.lineas);
      const descuentoGlobal = updatePedidoCompraDto.descuentoGlobalPorcentaje ?? pedido.descuentoGlobalPorcentaje ?? 0;
      (updatePedidoCompraDto as any).totales = this.calcularTotales(updatePedidoCompraDto.lineas, descuentoGlobal);
    }

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

    // Generar nuevo codigo y numero
    const serie = pedidoOriginal.serie || 'PC';
    const { codigo, numero } = await this.generarCodigoNumero(PedidoCompraModel, serie);

    // Preparar datos para nuevo pedido
    const nuevoPedido = new PedidoCompraModel({
      ...pedidoOriginal,
      _id: new mongoose.Types.ObjectId(),
      serie,
      codigo,
      numero,
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

  // ============================================
  // ALERTAS DE PEDIDOS DE COMPRA
  // ============================================

  /**
   * Obtener alertas de pedidos de compra:
   * - Pendientes de recibir (enviados, confirmados, parcialmente recibidos)
   * - Retrasados (fecha entrega pasada)
   * - Próximos a recibir (entrega en los próximos X días)
   */
  async getAlertas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    diasAlerta: number = 7
  ): Promise<{
    alertas: {
      pendientesRecibir: any[];
      retrasados: any[];
      proximosRecibir: any[];
    };
    resumen: {
      pendientesRecibir: number;
      retrasados: number;
      proximosRecibir: number;
      total: number;
    };
  }> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId.toString(), dbConfig);

    // Registrar modelo de Proveedor para populate
    await getProveedorModel(empresaId.toString(), dbConfig);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaAlerta = new Date();
    fechaAlerta.setDate(fechaAlerta.getDate() + diasAlerta);

    // Pendientes de recibir
    const pendientesRecibir = await PedidoCompraModel.find({
      activo: true,
      estado: {
        $in: [
          EstadoPedidoCompra.ENVIADO,
          EstadoPedidoCompra.CONFIRMADO,
          EstadoPedidoCompra.PARCIALMENTE_RECIBIDO,
        ],
      },
    })
      .populate('proveedorId', 'nombre nombreComercial')
      .sort({ fechaEntregaPrevista: 1, fecha: 1 })
      .limit(50)
      .lean();

    // Retrasados: fecha de entrega pasada y no recibidos
    const retrasados = await PedidoCompraModel.find({
      activo: true,
      estado: {
        $in: [
          EstadoPedidoCompra.ENVIADO,
          EstadoPedidoCompra.CONFIRMADO,
          EstadoPedidoCompra.PARCIALMENTE_RECIBIDO,
        ],
      },
      fechaEntregaPrevista: { $lt: hoy },
    })
      .populate('proveedorId', 'nombre nombreComercial')
      .sort({ fechaEntregaPrevista: 1 })
      .limit(50)
      .lean();

    // Próximos a recibir: entrega en los próximos X días
    const proximosRecibir = await PedidoCompraModel.find({
      activo: true,
      estado: {
        $in: [
          EstadoPedidoCompra.ENVIADO,
          EstadoPedidoCompra.CONFIRMADO,
          EstadoPedidoCompra.PARCIALMENTE_RECIBIDO,
        ],
      },
      fechaEntregaPrevista: {
        $gte: hoy,
        $lte: fechaAlerta,
      },
    })
      .populate('proveedorId', 'nombre nombreComercial')
      .sort({ fechaEntregaPrevista: 1 })
      .limit(50)
      .lean();

    // Formatear datos para el frontend
    const formatPedido = (p: any) => ({
      _id: p._id,
      codigo: p.codigo,
      proveedorNombre:
        p.proveedorId?.nombreComercial ||
        p.proveedorId?.nombre ||
        p.proveedorNombre ||
        'Sin proveedor',
      fecha: p.fecha,
      fechaEntregaPrevista: p.fechaEntregaPrevista,
      estado: p.estado,
      prioridad: p.prioridad,
      totales: p.totales,
    });

    return {
      alertas: {
        pendientesRecibir: pendientesRecibir.map(formatPedido),
        retrasados: retrasados.map(formatPedido),
        proximosRecibir: proximosRecibir.map(formatPedido),
      },
      resumen: {
        pendientesRecibir: pendientesRecibir.length,
        retrasados: retrasados.length,
        proximosRecibir: proximosRecibir.length,
        total: pendientesRecibir.length + retrasados.length,
      },
    };
  }

  // ============================================
  // PREPARAR PARA RECEPCIÓN
  // ============================================

  /**
   * Prepara las líneas de un pedido para la recepción, expandiendo kits
   * y obteniendo información de variantes
   */
  async prepararParaRecepcion(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<{
    pedido: IPedidoCompra;
    lineasRecepcion: Array<{
      lineaId: string;
      productoId?: string;
      codigo?: string;
      nombre: string;
      descripcion?: string;
      sku?: string;
      cantidadPedida: number;
      cantidadRecibida: number;
      cantidadPendiente: number;
      precioUnitario: number;
      unidad?: string;
      esKit: boolean;
      tieneVariantes: boolean;
      variantes?: Array<{
        varianteId: string;
        sku: string;
        combinacion: Record<string, string>;
        stockActual: number;
      }>;
      varianteSeleccionada?: {
        varianteId: string;
        sku: string;
        valores: Record<string, string>;
      };
      componentesKit?: Array<{
        productoId: string;
        codigo?: string;
        nombre: string;
        cantidad: number;
        cantidadPorRecibir: number;
      }>;
    }>;
  } | null> {
    const PedidoCompraModel = await getPedidoCompraModel(empresaId, dbConfig);
    const { getProductoModel } = await import('@/utils/dynamic-models.helper');
    const ProductoModel = await getProductoModel(empresaId, dbConfig);

    const pedido = await PedidoCompraModel.findById(id).lean();
    if (!pedido) return null;

    const lineasRecepcion: any[] = [];

    for (const linea of pedido.lineas) {
      if (linea.tipo !== 'producto' || !linea.productoId) {
        // Líneas que no son productos se pasan tal cual
        lineasRecepcion.push({
          lineaId: linea._id?.toString(),
          productoId: linea.productoId?.toString(),
          codigo: linea.codigo,
          nombre: linea.nombre,
          descripcion: linea.descripcion,
          sku: linea.sku,
          cantidadPedida: linea.cantidad,
          cantidadRecibida: linea.cantidadRecibida || 0,
          cantidadPendiente: linea.cantidadPendiente || (linea.cantidad - (linea.cantidadRecibida || 0)),
          precioUnitario: linea.precioUnitario,
          unidad: linea.unidad,
          esKit: false,
          tieneVariantes: false,
          varianteSeleccionada: linea.variante ? {
            varianteId: linea.variante.varianteId?.toString() || '',
            sku: linea.variante.sku || '',
            valores: linea.variante.valores || {},
          } : undefined,
        });
        continue;
      }

      // Obtener información del producto
      const producto = await ProductoModel.findById(linea.productoId).lean();

      if (!producto) {
        // Producto no encontrado, usar datos de la línea
        lineasRecepcion.push({
          lineaId: linea._id?.toString(),
          productoId: linea.productoId?.toString(),
          codigo: linea.codigo,
          nombre: linea.nombre,
          descripcion: linea.descripcion,
          sku: linea.sku,
          cantidadPedida: linea.cantidad,
          cantidadRecibida: linea.cantidadRecibida || 0,
          cantidadPendiente: linea.cantidadPendiente || (linea.cantidad - (linea.cantidadRecibida || 0)),
          precioUnitario: linea.precioUnitario,
          unidad: linea.unidad,
          esKit: false,
          tieneVariantes: false,
        });
        continue;
      }

      // Verificar si es un kit/compuesto
      const esKit = producto.tipo === 'compuesto' && producto.componentesKit && producto.componentesKit.length > 0;

      // Verificar si tiene variantes
      const tieneVariantes = producto.tieneVariantes && producto.variantes && producto.variantes.length > 0;

      // Preparar variantes si existen
      let variantes: any[] | undefined = undefined;
      if (tieneVariantes) {
        variantes = producto.variantes.map((v: any) => ({
          varianteId: v._id?.toString(),
          sku: v.sku,
          combinacion: v.combinacion,
          stockActual: v.stockPorAlmacen?.reduce((sum: number, a: any) => sum + (a.cantidad || 0), 0) || 0,
        }));
      }

      // Preparar componentes del kit si es un kit
      let componentesKit: any[] | undefined = undefined;
      if (esKit) {
        componentesKit = [];
        for (const comp of producto.componentesKit) {
          const productoComponente = await ProductoModel.findById(comp.productoId).lean();
          componentesKit.push({
            productoId: comp.productoId?.toString(),
            codigo: productoComponente?.sku || '',
            nombre: productoComponente?.nombre || 'Producto no encontrado',
            cantidad: comp.cantidad,
            cantidadPorRecibir: comp.cantidad * linea.cantidad, // Cantidad total a recibir
          });
        }
      }

      lineasRecepcion.push({
        lineaId: linea._id?.toString(),
        productoId: linea.productoId?.toString(),
        codigo: linea.codigo || producto.sku,
        nombre: linea.nombre || producto.nombre,
        descripcion: linea.descripcion || producto.descripcion,
        sku: linea.sku || producto.sku,
        cantidadPedida: linea.cantidad,
        cantidadRecibida: linea.cantidadRecibida || 0,
        cantidadPendiente: linea.cantidadPendiente || (linea.cantidad - (linea.cantidadRecibida || 0)),
        precioUnitario: linea.precioUnitario,
        unidad: linea.unidad || producto.unidadMedida,
        esKit,
        tieneVariantes,
        variantes,
        varianteSeleccionada: linea.variante ? {
          varianteId: linea.variante.varianteId?.toString() || '',
          sku: linea.variante.sku || '',
          valores: linea.variante.valores || {},
        } : undefined,
        componentesKit,
      });
    }

    return {
      pedido,
      lineasRecepcion,
    };
  }

  // ============================================
  // ACTUALIZAR PRECIOS DE PRODUCTOS
  // ============================================

  /**
   * Actualizar precios de productos basándose en las líneas del documento
   */
  async actualizarPreciosProductos(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    lineas: any[],
    opciones: { precioCompra: boolean; precioVenta: boolean }
  ): Promise<{ actualizados: number; errores: string[] }> {
    if (!opciones.precioCompra && !opciones.precioVenta) {
      return { actualizados: 0, errores: [] };
    }

    const ProductoModel = await getProductoModel(empresaId, dbConfig);
    let actualizados = 0;
    const errores: string[] = [];

    // Agrupar actualizaciones por producto
    const actualizacionesPorProducto = new Map<string, {
      precioCompra?: number;
      precioVenta?: number;
      varianteId?: string;
    }>();

    for (const linea of lineas) {
      if (!linea.productoId) continue;

      const productoId = linea.productoId.toString();
      const key = linea.variante?.varianteId
        ? `${productoId}:${linea.variante.varianteId}`
        : productoId;

      const actualizacion: any = {};
      if (opciones.precioCompra && linea.precioUnitario > 0) {
        actualizacion.precioCompra = linea.precioUnitario;
      }
      if (opciones.precioVenta && linea.precioVenta > 0) {
        actualizacion.precioVenta = linea.precioVenta;
      }
      if (linea.variante?.varianteId) {
        actualizacion.varianteId = linea.variante.varianteId;
      }

      if (Object.keys(actualizacion).length > 0) {
        actualizacionesPorProducto.set(key, {
          ...actualizacionesPorProducto.get(key),
          ...actualizacion,
        });
      }
    }

    // Aplicar actualizaciones
    for (const [key, actualizacion] of actualizacionesPorProducto) {
      try {
        const [productoId, varianteId] = key.split(':');

        if (varianteId) {
          // Actualizar variante específica
          const updateFields: any = {};
          if (actualizacion.precioCompra !== undefined) {
            updateFields['variantes.$.costeUnitario'] = actualizacion.precioCompra;
          }
          if (actualizacion.precioVenta !== undefined) {
            updateFields['variantes.$.precioUnitario'] = actualizacion.precioVenta;
          }

          const result = await ProductoModel.updateOne(
            { _id: productoId, 'variantes._id': varianteId },
            { $set: updateFields }
          );

          if (result.modifiedCount > 0) {
            actualizados++;
          }
        } else {
          // Actualizar producto base
          const updateFields: any = {};
          if (actualizacion.precioCompra !== undefined) {
            updateFields['precios.compra'] = actualizacion.precioCompra;
          }
          if (actualizacion.precioVenta !== undefined) {
            updateFields['precios.pvp'] = actualizacion.precioVenta;
            updateFields['precios.venta'] = actualizacion.precioVenta;
          }

          const result = await ProductoModel.updateOne(
            { _id: productoId },
            { $set: updateFields }
          );

          if (result.modifiedCount > 0) {
            actualizados++;
          }
        }
      } catch (error: any) {
        errores.push(`Error actualizando producto ${key}: ${error.message}`);
      }
    }

    return { actualizados, errores };
  }

  // ============================================
  // HELPERS PRIVADOS
  // ============================================

  /**
   * Generar código y número para nuevo pedido de compra
   */
  private async generarCodigoNumero(
    PedidoCompraModel: mongoose.Model<IPedidoCompra>,
    serie: string = 'PC'
  ): Promise<{ codigo: string; numero: number }> {
    const año = new Date().getFullYear();

    const ultimoPedido = await PedidoCompraModel.findOne({
      serie,
      codigo: new RegExp(`^${serie}${año}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    let numero = 1;
    if (ultimoPedido && ultimoPedido.numero) {
      numero = ultimoPedido.numero + 1;
    }

    const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

    return { codigo, numero };
  }

  /**
   * Procesar lineas calculando importes derivados
   */
  private procesarLineas(lineas: any[]): any[] {
    return lineas.map((linea, index) => {
      const cantidad = linea.cantidad || 1;
      const precioUnitario = linea.precioUnitario || 0;
      const descuento = linea.descuento || 0;
      const iva = linea.iva !== undefined ? linea.iva : 21;

      const subtotalBruto = cantidad * precioUnitario;
      const descuentoImporte = subtotalBruto * (descuento / 100);
      const subtotal = subtotalBruto - descuentoImporte;
      const ivaImporte = subtotal * (iva / 100);
      const total = subtotal + ivaImporte;

      return {
        ...linea,
        orden: linea.orden || index + 1,
        tipo: linea.tipo || 'producto',
        cantidad,
        cantidadRecibida: linea.cantidadRecibida || 0,
        cantidadPendiente: linea.cantidadPendiente ?? cantidad,
        precioUnitario,
        descuento,
        descuentoImporte: Math.round(descuentoImporte * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        iva,
        ivaImporte: Math.round(ivaImporte * 100) / 100,
        total: Math.round(total * 100) / 100,
        esEditable: linea.esEditable !== false,
        incluidoEnTotal: linea.incluidoEnTotal !== false,
      };
    });
  }

  /**
   * Calcular totales del pedido a partir de las lineas
   */
  private calcularTotales(lineas: any[], descuentoGlobalPorcentaje: number = 0) {
    let subtotalBruto = 0;
    let totalDescuentosLineas = 0;
    const ivaAgrupado: Record<number, { base: number; cuota: number }> = {};

    for (const linea of lineas) {
      if (!linea.incluidoEnTotal) continue;

      subtotalBruto += linea.cantidad * linea.precioUnitario;
      totalDescuentosLineas += linea.descuentoImporte || 0;

      const tipoIva = linea.iva || 21;
      if (!ivaAgrupado[tipoIva]) {
        ivaAgrupado[tipoIva] = { base: 0, cuota: 0 };
      }
      ivaAgrupado[tipoIva].base += linea.subtotal || 0;
      ivaAgrupado[tipoIva].cuota += linea.ivaImporte || 0;
    }

    // Aplicar descuento global
    const descuentoGlobalImporte = (subtotalBruto - totalDescuentosLineas) * (descuentoGlobalPorcentaje / 100);
    const totalDescuentos = totalDescuentosLineas + descuentoGlobalImporte;
    const subtotalNeto = subtotalBruto - totalDescuentos;

    // Ajustar desglose IVA con descuento global
    if (descuentoGlobalPorcentaje > 0) {
      const factorDescuento = 1 - (descuentoGlobalPorcentaje / 100);
      for (const tipo in ivaAgrupado) {
        ivaAgrupado[tipo].base *= factorDescuento;
        ivaAgrupado[tipo].cuota *= factorDescuento;
      }
    }

    const desgloseIva = Object.entries(ivaAgrupado).map(([tipo, valores]) => ({
      tipo: Number(tipo),
      base: Math.round(valores.base * 100) / 100,
      cuota: Math.round(valores.cuota * 100) / 100,
    }));

    const totalIva = desgloseIva.reduce((sum, item) => sum + item.cuota, 0);
    const totalPedido = subtotalNeto + totalIva;

    return {
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round(totalDescuentos * 100) / 100,
      subtotalNeto: Math.round(subtotalNeto * 100) / 100,
      desgloseIva,
      totalIva: Math.round(totalIva * 100) / 100,
      totalPedido: Math.round(totalPedido * 100) / 100,
    };
  }
}

export const pedidosCompraService = new PedidosCompraService();
export default pedidosCompraService;
