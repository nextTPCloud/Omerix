import mongoose, { Model, SortOrder } from 'mongoose';
import { IPresupuestoCompra, EstadoPresupuestoCompra, PresupuestoCompra } from './PresupuestoCompra';
import {
  CreatePresupuestoCompraDTO,
  UpdatePresupuestoCompraDTO,
  GetPresupuestosCompraQuery,
  ConvertirAPedidoDTO,
} from './presupuestos-compra.dto';
import { IDatabaseConfig } from '@/types/database.types';
import { databaseManager } from '@/services/database-manager.service';
import { parseAdvancedFilters, mergeFilters } from '@/utils/advanced-filters.helper';

// ============================================
// HELPER PARA OBTENER MODELO DINAMICO
// ============================================

const getPresupuestoCompraModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IPresupuestoCompra>> => {
  const PresupuestoCompraSchema = PresupuestoCompra.schema;
  return databaseManager.getModel<IPresupuestoCompra>(empresaId, dbConfig, 'PresupuestoCompra', PresupuestoCompraSchema);
};

// ============================================
// SERVICIO DE PRESUPUESTOS DE COMPRA
// ============================================

export class PresupuestosCompraService {
  // ============================================
  // CREAR PRESUPUESTO DE COMPRA
  // ============================================

  async crear(
    createDto: CreatePresupuestoCompraDTO,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPresupuestoCompra> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);

    // Completar datos del proveedor si no vienen
    if (!createDto.proveedorNombre || !createDto.proveedorNif) {
      const { getProveedorModel } = await import('@/utils/dynamic-models.helper');
      const ProveedorModel = await getProveedorModel(empresaId, dbConfig);
      const proveedor = await ProveedorModel.findById(createDto.proveedorId).lean();
      if (proveedor) {
        createDto.proveedorNombre = createDto.proveedorNombre || proveedor.nombre;
        createDto.proveedorNif = createDto.proveedorNif || proveedor.nif;
        createDto.proveedorEmail = createDto.proveedorEmail || proveedor.email;
        createDto.proveedorTelefono = createDto.proveedorTelefono || proveedor.telefono;
      }
    }

    // Generar codigo y numero
    const serie = createDto.serie || 'PSC';
    const { codigo, numero } = await this.generarCodigoNumero(PresupuestoCompraModel, serie);

    // Procesar lineas y calcular totales
    const lineas = this.procesarLineas(createDto.lineas || []);
    const totales = this.calcularTotales(lineas, createDto.descuentoGlobalPorcentaje || 0);

    // Crear presupuesto
    const presupuesto = new PresupuestoCompraModel({
      ...createDto,
      serie,
      codigo,
      numero,
      lineas,
      totales,
      creadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaCreacion: new Date(),
    });

    // Agregar al historial
    presupuesto.historial.push({
      fecha: new Date(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      accion: 'Creacion',
      descripcion: 'Presupuesto de compra creado',
    });

    await presupuesto.save();
    return presupuesto;
  }

  // ============================================
  // OBTENER TODOS CON FILTROS Y PAGINACION
  // ============================================

  async findAll(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    query: GetPresupuestosCompraQuery
  ): Promise<{
    data: IPresupuestoCompra[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);

    const {
      page = 1,
      limit = 25,
      sortBy = 'fecha',
      sortOrder = 'desc',
      search,
      estado,
      estados,
      prioridad,
      proveedorId,
      activo,
      fechaDesde,
      fechaHasta,
      fechaValidezDesde,
      fechaValidezHasta,
      importeMinimo,
      importeMaximo,
      tags,
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
        { numeroPresupuestoProveedor: { $regex: search, $options: 'i' } },
        { titulo: { $regex: search, $options: 'i' } },
      ];
    }

    // Filtros simples
    if (estado) baseFilter.estado = estado;
    if (estados) {
      baseFilter.estado = { $in: estados.split(',').map(e => e.trim()) };
    }
    if (prioridad) baseFilter.prioridad = prioridad;
    if (proveedorId) baseFilter.proveedorId = new mongoose.Types.ObjectId(proveedorId);

    // Filtro activo
    if (activo !== undefined) {
      baseFilter.activo = activo === 'true' || activo === true;
    }

    // Filtros de fecha
    if (fechaDesde || fechaHasta) {
      baseFilter.fecha = {};
      if (fechaDesde) baseFilter.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) baseFilter.fecha.$lte = new Date(fechaHasta);
    }

    if (fechaValidezDesde || fechaValidezHasta) {
      baseFilter.fechaValidez = {};
      if (fechaValidezDesde) baseFilter.fechaValidez.$gte = new Date(fechaValidezDesde);
      if (fechaValidezHasta) baseFilter.fechaValidez.$lte = new Date(fechaValidezHasta);
    }

    // Filtros de importe
    if (importeMinimo !== undefined || importeMaximo !== undefined) {
      baseFilter['totales.totalPresupuesto'] = {};
      if (importeMinimo !== undefined) baseFilter['totales.totalPresupuesto'].$gte = importeMinimo;
      if (importeMaximo !== undefined) baseFilter['totales.totalPresupuesto'].$lte = importeMaximo;
    }

    // Filtro por tags
    if (tags) {
      baseFilter.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };
    }

    // Parsear filtros avanzados
    const advancedFilters = parseAdvancedFilters(advancedParams);
    const filter = mergeFilters(baseFilter, advancedFilters);

    // Ordenamiento
    const sort: { [key: string]: SortOrder } = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginacion
    const skip = (page - 1) * limit;

    // Ejecutar consultas
    const [data, total] = await Promise.all([
      PresupuestoCompraModel.find(filter)
        .populate('proveedorId', 'nombre nombreComercial nif email telefono')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      PresupuestoCompraModel.countDocuments(filter),
    ]);

    return {
      data: data as IPresupuestoCompra[],
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
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string
  ): Promise<IPresupuestoCompra | null> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);

    // Registrar modelos referenciados para populate
    const { getProveedorModel, getProductoModel, getUserModel } = await import('@/utils/dynamic-models.helper');
    await Promise.all([
      getProveedorModel(empresaId, dbConfig),
      getProductoModel(empresaId, dbConfig),
      getUserModel(empresaId, dbConfig),
    ]);

    return PresupuestoCompraModel.findById(id)
      .populate('proveedorId', 'nombre nombreComercial nif email telefono direccion')
      .populate('creadoPor', 'nombre email')
      .populate('modificadoPor', 'nombre email')
      .populate('lineas.productoId', 'nombre codigo sku precioCompra precioVenta')
      .lean() as Promise<IPresupuestoCompra | null>;
  }

  // ============================================
  // OBTENER POR CODIGO
  // ============================================

  async findByCodigo(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    codigo: string
  ): Promise<IPresupuestoCompra | null> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);

    return PresupuestoCompraModel.findOne({ codigo: codigo.toUpperCase() })
      .populate('proveedorId', 'nombre nombreComercial nif email telefono direccion')
      .lean() as Promise<IPresupuestoCompra | null>;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async update(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string,
    updateDto: UpdatePresupuestoCompraDTO,
    usuarioId: string
  ): Promise<IPresupuestoCompra | null> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);

    const presupuesto = await PresupuestoCompraModel.findById(id);
    if (!presupuesto) return null;

    // Guardar datos anteriores para historial
    const datosAnteriores = {
      estado: presupuesto.estado,
      totales: presupuesto.totales,
    };

    // Actualizar campos
    Object.assign(presupuesto, updateDto);

    // Si se actualizan lineas, recalcular totales
    if (updateDto.lineas) {
      presupuesto.lineas = this.procesarLineas(updateDto.lineas);
      presupuesto.totales = this.calcularTotales(
        presupuesto.lineas,
        presupuesto.descuentoGlobalPorcentaje
      );
    }

    presupuesto.modificadoPor = new mongoose.Types.ObjectId(usuarioId);
    presupuesto.fechaModificacion = new Date();

    // Agregar al historial
    presupuesto.historial.push({
      fecha: new Date(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      accion: 'Modificacion',
      descripcion: 'Presupuesto de compra actualizado',
      datosAnteriores,
    });

    await presupuesto.save();
    return presupuesto;
  }

  // ============================================
  // ELIMINAR (SOFT DELETE)
  // ============================================

  async delete(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string,
    usuarioId: string
  ): Promise<boolean> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);

    const presupuesto = await PresupuestoCompraModel.findById(id);
    if (!presupuesto) return false;

    // No permitir eliminar si esta convertido
    if (presupuesto.pedidoCompraId) {
      throw new Error('No se puede eliminar un presupuesto que ha sido convertido a pedido');
    }

    presupuesto.activo = false;
    presupuesto.modificadoPor = new mongoose.Types.ObjectId(usuarioId);
    presupuesto.fechaModificacion = new Date();

    presupuesto.historial.push({
      fecha: new Date(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      accion: 'Eliminacion',
      descripcion: 'Presupuesto de compra eliminado (soft delete)',
    });

    await presupuesto.save();
    return true;
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string,
    nuevoEstado: EstadoPresupuestoCompra,
    usuarioId: string,
    motivoRechazo?: string
  ): Promise<IPresupuestoCompra | null> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);

    const presupuesto = await PresupuestoCompraModel.findById(id);
    if (!presupuesto) return null;

    const estadoAnterior = presupuesto.estado;
    presupuesto.estado = nuevoEstado;

    // Registrar fecha de decision si aplica
    if (nuevoEstado === EstadoPresupuestoCompra.ACEPTADO ||
        nuevoEstado === EstadoPresupuestoCompra.RECHAZADO) {
      presupuesto.fechaDecision = new Date();
    }

    // Guardar motivo de rechazo
    if (nuevoEstado === EstadoPresupuestoCompra.RECHAZADO && motivoRechazo) {
      presupuesto.motivoRechazo = motivoRechazo;
    }

    presupuesto.modificadoPor = new mongoose.Types.ObjectId(usuarioId);
    presupuesto.fechaModificacion = new Date();

    presupuesto.historial.push({
      fecha: new Date(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      accion: 'Cambio de estado',
      descripcion: `Estado cambiado de ${estadoAnterior} a ${nuevoEstado}`,
      datosAnteriores: { estado: estadoAnterior },
    });

    await presupuesto.save();
    return presupuesto;
  }

  // ============================================
  // CONVERTIR A PEDIDO DE COMPRA
  // ============================================

  async convertirAPedido(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    convertirDto: ConvertirAPedidoDTO,
    usuarioId: string
  ): Promise<any> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);

    // No hacer populate para evitar que proveedorId sea un objeto
    const presupuesto = await PresupuestoCompraModel.findById(convertirDto.presupuestoCompraId);

    if (!presupuesto) {
      throw new Error('Presupuesto de compra no encontrado');
    }

    if (presupuesto.pedidoCompraId) {
      throw new Error('Este presupuesto ya ha sido convertido a pedido');
    }

    if (presupuesto.estado === EstadoPresupuestoCompra.RECHAZADO ||
        presupuesto.estado === EstadoPresupuestoCompra.CANCELADO ||
        presupuesto.estado === EstadoPresupuestoCompra.EXPIRADO) {
      throw new Error(`No se puede convertir un presupuesto en estado ${presupuesto.estado}`);
    }

    // Importar servicio de pedidos de compra
    const { pedidosCompraService } = await import('@/modules/pedidos-compra/pedidos-compra.service');

    // Filtrar lineas si se especifican
    let lineas = presupuesto.lineas;
    if (convertirDto.lineasIds && convertirDto.lineasIds.length > 0) {
      lineas = lineas.filter(l => convertirDto.lineasIds!.includes(l._id!.toString()));
    }

    // Obtener el ID del proveedor correctamente (puede estar populado o ser ObjectId)
    const proveedorId = typeof presupuesto.proveedorId === 'object' && presupuesto.proveedorId._id
      ? presupuesto.proveedorId._id.toString()
      : presupuesto.proveedorId.toString();

    // Crear pedido de compra
    const pedido = await pedidosCompraService.crear({
      proveedorId,
      proveedorNombre: presupuesto.proveedorNombre,
      proveedorNif: presupuesto.proveedorNif,
      proveedorEmail: presupuesto.proveedorEmail,
      proveedorTelefono: presupuesto.proveedorTelefono,
      titulo: presupuesto.titulo,
      descripcion: presupuesto.descripcion,
      fechaEntregaPrevista: convertirDto.fechaEntregaPrevista,
      lineas: lineas.map((l, index) => ({
        orden: l.orden || index + 1,
        tipo: l.tipo,
        productoId: l.productoId?.toString(),
        codigo: l.codigo,
        nombre: l.nombre,
        descripcion: l.descripcion,
        sku: l.sku,
        codigoProveedor: l.codigoProveedor,
        cantidad: l.cantidad,
        unidad: l.unidad,
        precioUnitario: l.precioUnitario,
        descuento: l.descuento,
        iva: l.iva,
        almacenDestinoId: l.almacenDestinoId?.toString(),
      })),
      condiciones: presupuesto.condiciones,
      direccionRecepcion: presupuesto.direccionEntrega,
      descuentoGlobalPorcentaje: presupuesto.descuentoGlobalPorcentaje,
      observaciones: convertirDto.observaciones || presupuesto.observaciones,
      tags: presupuesto.tags,
    }, empresaId, usuarioId, dbConfig);

    // Actualizar presupuesto
    presupuesto.estado = EstadoPresupuestoCompra.CONVERTIDO;
    presupuesto.pedidoCompraId = pedido._id;
    presupuesto.fechaDecision = new Date();
    presupuesto.modificadoPor = new mongoose.Types.ObjectId(usuarioId);
    presupuesto.fechaModificacion = new Date();

    presupuesto.historial.push({
      fecha: new Date(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      accion: 'Conversion a pedido',
      descripcion: `Convertido a pedido de compra ${pedido.codigo}`,
    });

    await presupuesto.save();

    return {
      presupuesto,
      pedido,
    };
  }

  // ============================================
  // DUPLICAR
  // ============================================

  async duplicar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string,
    usuarioId: string
  ): Promise<IPresupuestoCompra> {
    const presupuesto = await this.findById(empresaId, dbConfig, id);
    if (!presupuesto) {
      throw new Error('Presupuesto de compra no encontrado');
    }

    // Crear copia sin campos de identificacion
    const nuevoPresupuesto = await this.crear({
      proveedorId: presupuesto.proveedorId?.toString() || '',
      proveedorNombre: presupuesto.proveedorNombre,
      proveedorNif: presupuesto.proveedorNif,
      proveedorEmail: presupuesto.proveedorEmail,
      proveedorTelefono: presupuesto.proveedorTelefono,
      contactoProveedor: presupuesto.contactoProveedor,
      titulo: `Copia de ${presupuesto.titulo || presupuesto.codigo}`,
      descripcion: presupuesto.descripcion,
      lineas: presupuesto.lineas.map(l => ({
        tipo: l.tipo,
        productoId: l.productoId?.toString(),
        codigo: l.codigo,
        nombre: l.nombre,
        descripcion: l.descripcion,
        sku: l.sku,
        codigoProveedor: l.codigoProveedor,
        cantidad: l.cantidad,
        unidad: l.unidad,
        precioUnitario: l.precioUnitario,
        descuento: l.descuento,
        iva: l.iva,
        precioAlternativo: l.precioAlternativo,
        notasPrecio: l.notasPrecio,
        almacenDestinoId: l.almacenDestinoId?.toString(),
        notasInternas: l.notasInternas,
      })),
      condiciones: presupuesto.condiciones,
      descuentoGlobalPorcentaje: presupuesto.descuentoGlobalPorcentaje,
      observaciones: presupuesto.observaciones,
      tags: presupuesto.tags,
    }, empresaId, usuarioId, dbConfig);

    return nuevoPresupuesto;
  }

  // ============================================
  // ESTADISTICAS
  // ============================================

  async getEstadisticas(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<{
    total: number;
    porEstado: Record<string, number>;
    totalImporte: number;
    pendientesDecision: number;
    vigentes: number;
    expiradosEsteMes: number;
  }> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [total, porEstado, totales, pendientes, vigentes, expirados] = await Promise.all([
      PresupuestoCompraModel.countDocuments({ activo: true }),
      PresupuestoCompraModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$estado', count: { $sum: 1 } } },
      ]),
      PresupuestoCompraModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: null, totalImporte: { $sum: '$totales.totalPresupuesto' } } },
      ]),
      PresupuestoCompraModel.countDocuments({
        activo: true,
        estado: { $in: [EstadoPresupuestoCompra.ENVIADO, EstadoPresupuestoCompra.RECIBIDO] },
      }),
      PresupuestoCompraModel.countDocuments({
        activo: true,
        estado: { $nin: [EstadoPresupuestoCompra.EXPIRADO, EstadoPresupuestoCompra.CANCELADO, EstadoPresupuestoCompra.RECHAZADO, EstadoPresupuestoCompra.CONVERTIDO] },
        $or: [
          { fechaValidez: { $gte: hoy } },
          { fechaValidez: { $exists: false } },
          { fechaValidez: null },
        ],
      }),
      PresupuestoCompraModel.countDocuments({
        activo: true,
        estado: EstadoPresupuestoCompra.EXPIRADO,
        fechaModificacion: { $gte: inicioMes },
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
      pendientesDecision: pendientes,
      vigentes,
      expiradosEsteMes: expirados,
    };
  }

  // ============================================
  // ALERTAS
  // ============================================

  async getAlertas(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    diasAlerta: number = 7
  ): Promise<{
    alertas: {
      pendientesDecision: any[];
      proximosExpirar: any[];
      expirados: any[];
    };
    resumen: {
      pendientesDecision: number;
      proximosExpirar: number;
      expirados: number;
      total: number;
    };
  }> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaAlerta = new Date();
    fechaAlerta.setDate(fechaAlerta.getDate() + diasAlerta);

    // Pendientes de decision
    const pendientesDecision = await PresupuestoCompraModel.find({
      activo: true,
      estado: { $in: [EstadoPresupuestoCompra.ENVIADO, EstadoPresupuestoCompra.RECIBIDO] },
    })
      .populate('proveedorId', 'nombre nombreComercial')
      .sort({ fecha: 1 })
      .limit(50)
      .lean();

    // Proximos a expirar
    const proximosExpirar = await PresupuestoCompraModel.find({
      activo: true,
      estado: {
        $nin: [
          EstadoPresupuestoCompra.EXPIRADO,
          EstadoPresupuestoCompra.CANCELADO,
          EstadoPresupuestoCompra.RECHAZADO,
          EstadoPresupuestoCompra.CONVERTIDO,
        ],
      },
      fechaValidez: {
        $gte: hoy,
        $lte: fechaAlerta,
      },
    })
      .populate('proveedorId', 'nombre nombreComercial')
      .sort({ fechaValidez: 1 })
      .limit(50)
      .lean();

    // Expirados recientemente
    const expirados = await PresupuestoCompraModel.find({
      activo: true,
      estado: EstadoPresupuestoCompra.EXPIRADO,
    })
      .populate('proveedorId', 'nombre nombreComercial')
      .sort({ fechaValidez: -1 })
      .limit(20)
      .lean();

    return {
      alertas: {
        pendientesDecision,
        proximosExpirar,
        expirados,
      },
      resumen: {
        pendientesDecision: pendientesDecision.length,
        proximosExpirar: proximosExpirar.length,
        expirados: expirados.length,
        total: pendientesDecision.length + proximosExpirar.length + expirados.length,
      },
    };
  }

  // ============================================
  // HELPERS PRIVADOS
  // ============================================

  /**
   * Generar código y número para nuevo presupuesto de compra
   */
  private async generarCodigoNumero(
    PresupuestoCompraModel: mongoose.Model<IPresupuestoCompra>,
    serie: string = 'PSC'
  ): Promise<{ codigo: string; numero: number }> {
    const año = new Date().getFullYear();

    const ultimoPresupuesto = await PresupuestoCompraModel.findOne({
      serie,
      codigo: new RegExp(`^${serie}${año}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    let numero = 1;
    if (ultimoPresupuesto && ultimoPresupuesto.numero) {
      numero = ultimoPresupuesto.numero + 1;
    }

    const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

    return { codigo, numero };
  }

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

      // Calcular margen y precio de venta
      let precioVenta = linea.precioVenta || 0;
      let margenPorcentaje = linea.margenPorcentaje || 0;
      let margenImporte = linea.margenImporte || 0;

      // Si hay precio de venta, calcular margen
      if (precioVenta > 0 && precioUnitario > 0) {
        margenImporte = precioVenta - precioUnitario;
        margenPorcentaje = (margenImporte / precioUnitario) * 100;
      }
      // Si hay margen %, calcular precio de venta
      else if (margenPorcentaje > 0 && precioUnitario > 0) {
        margenImporte = precioUnitario * (margenPorcentaje / 100);
        precioVenta = precioUnitario + margenImporte;
      }

      return {
        ...linea,
        orden: linea.orden || index + 1,
        tipo: linea.tipo || 'producto',
        cantidad,
        precioUnitario,
        descuento,
        descuentoImporte: Math.round(descuentoImporte * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        iva,
        ivaImporte: Math.round(ivaImporte * 100) / 100,
        total: Math.round(total * 100) / 100,
        precioVenta: Math.round(precioVenta * 100) / 100,
        margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
        margenImporte: Math.round(margenImporte * 100) / 100,
        esEditable: linea.esEditable !== false,
        incluidoEnTotal: linea.incluidoEnTotal !== false,
      };
    });
  }

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
    const totalPresupuesto = subtotalNeto + totalIva;

    return {
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round(totalDescuentos * 100) / 100,
      subtotalNeto: Math.round(subtotalNeto * 100) / 100,
      desgloseIva,
      totalIva: Math.round(totalIva * 100) / 100,
      totalPresupuesto: Math.round(totalPresupuesto * 100) / 100,
    };
  }
}

export const presupuestosCompraService = new PresupuestosCompraService();
