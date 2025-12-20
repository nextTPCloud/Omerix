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
import { getProveedorModel, getProductoModel, getUserModel } from '@/utils/dynamic-models.helper';
import { presupuestosCompraPDFService, PDFOptions } from './presupuestos-compra-pdf.service';
import { empresaService } from '@/modules/empresa/empresa.service';
import Empresa from '@/modules/empresa/Empresa';

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

    // Registrar modelo de Proveedor para populate
    await getProveedorModel(empresaId, dbConfig);

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

    // Registrar modelo de Proveedor para populate
    await getProveedorModel(empresaId, dbConfig);

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

    // Obtener ID del proveedor (puede estar populado o ser ObjectId)
    const proveedorId = typeof presupuesto.proveedorId === 'object' && presupuesto.proveedorId._id
      ? presupuesto.proveedorId._id.toString()
      : presupuesto.proveedorId?.toString() || '';

    // Crear copia sin campos de identificacion
    const nuevoPresupuesto = await this.crear({
      proveedorId,
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

    // Registrar modelo de Proveedor para populate
    await getProveedorModel(empresaId, dbConfig);

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

    // Agrupar actualizaciones por producto (para evitar actualizaciones duplicadas)
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

  // ============================================
  // ENVIAR POR EMAIL
  // ============================================

  /**
   * Enviar solicitud de presupuesto por email al proveedor con PDF adjunto
   */
  async enviarPorEmail(
    id: string,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig,
    opciones?: {
      asunto?: string;
      mensaje?: string;
      cc?: string[];
      bcc?: string[];
      pdfOptions?: PDFOptions;
    }
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);

    // Obtener presupuesto completo
    await getProveedorModel(empresaId, dbConfig);
    const presupuesto = await PresupuestoCompraModel.findById(id)
      .populate('proveedorId', 'nombre email')
      .lean();

    if (!presupuesto) {
      return { success: false, message: 'Presupuesto de compra no encontrado' };
    }

    // Obtener email del proveedor
    const proveedorEmail = presupuesto.proveedorEmail ||
      (typeof presupuesto.proveedorId === 'object' ? (presupuesto.proveedorId as any).email : null);

    if (!proveedorEmail) {
      return { success: false, message: 'El proveedor no tiene email configurado' };
    }

    // Obtener datos de la empresa
    const empresa = await Empresa.findById(empresaId).lean();
    if (!empresa) {
      return { success: false, message: 'Empresa no encontrada' };
    }

    try {
      // Generar PDF
      const pdfBuffer = await presupuestosCompraPDFService.generarPDF(
        presupuesto as IPresupuestoCompra,
        empresaId,
        opciones?.pdfOptions
      );

      // Formatear datos para el email
      const proveedorNombre = typeof presupuesto.proveedorId === 'object'
        ? (presupuesto.proveedorId as any).nombre
        : presupuesto.proveedorNombre;

      const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }).format(value || 0);

      // Asunto del email
      const asunto = opciones?.asunto ||
        `Solicitud de Presupuesto ${presupuesto.codigo} - ${empresa.nombre}`;

      // Mensaje personalizado o por defecto
      const mensajePersonalizado = opciones?.mensaje || '';

      // Contenido HTML del email
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .info-box { background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .footer { background: #F9FAFB; padding: 15px; text-align: center; font-size: 12px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Solicitud de Presupuesto</h1>
    <p>${presupuesto.codigo}</p>
  </div>
  <div class="content">
    <p>Estimado/a ${proveedorNombre || 'Proveedor'},</p>

    ${mensajePersonalizado ? `<p>${mensajePersonalizado}</p>` : `
    <p>Le adjuntamos nuestra solicitud de presupuesto para los productos/servicios detallados en el documento PDF adjunto.</p>
    `}

    <div class="info-box">
      <p><strong>Código:</strong> ${presupuesto.codigo}</p>
      <p><strong>Fecha:</strong> ${new Date(presupuesto.fecha).toLocaleDateString('es-ES')}</p>
      ${presupuesto.fechaValidez ? `<p><strong>Respuesta antes de:</strong> ${new Date(presupuesto.fechaValidez).toLocaleDateString('es-ES')}</p>` : ''}
      ${presupuesto.fechaEntregaDeseada ? `<p><strong>Entrega deseada:</strong> ${new Date(presupuesto.fechaEntregaDeseada).toLocaleDateString('es-ES')}</p>` : ''}
    </div>

    <p>Por favor, envíenos su cotización con los precios y condiciones de entrega.</p>

    <p>Quedamos a la espera de su respuesta.</p>

    <p>Saludos cordiales,<br>
    <strong>${empresa.nombre}</strong></p>
  </div>
  <div class="footer">
    <p>${empresa.nombre}</p>
    ${empresa.direccion ? `<p>${empresa.direccion}</p>` : ''}
    ${empresa.telefono ? `<p>Tel: ${empresa.telefono}</p>` : ''}
    ${empresa.email ? `<p>${empresa.email}</p>` : ''}
  </div>
</body>
</html>
      `;

      // Contenido en texto plano
      const textContent = `
Solicitud de Presupuesto ${presupuesto.codigo}

Estimado/a ${proveedorNombre || 'Proveedor'},

${mensajePersonalizado || 'Le adjuntamos nuestra solicitud de presupuesto para los productos/servicios detallados en el documento PDF adjunto.'}

Código: ${presupuesto.codigo}
Fecha: ${new Date(presupuesto.fecha).toLocaleDateString('es-ES')}
${presupuesto.fechaValidez ? `Respuesta antes de: ${new Date(presupuesto.fechaValidez).toLocaleDateString('es-ES')}` : ''}
${presupuesto.fechaEntregaDeseada ? `Entrega deseada: ${new Date(presupuesto.fechaEntregaDeseada).toLocaleDateString('es-ES')}` : ''}

Por favor, envíenos su cotización con los precios y condiciones de entrega.

Saludos cordiales,
${empresa.nombre}
${empresa.telefono ? `Tel: ${empresa.telefono}` : ''}
      `;

      // Enviar email con PDF adjunto
      const result = await empresaService.sendEmail(empresaId, {
        to: proveedorEmail,
        subject: asunto,
        html: htmlContent,
        text: textContent,
        cc: opciones?.cc,
        bcc: opciones?.bcc,
        attachments: [
          {
            filename: `Solicitud_Presupuesto_${presupuesto.codigo}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      if (result.success) {
        // Actualizar estado a enviado si estaba en borrador
        if (presupuesto.estado === EstadoPresupuestoCompra.BORRADOR) {
          await PresupuestoCompraModel.findByIdAndUpdate(id, {
            estado: EstadoPresupuestoCompra.ENVIADO,
            fechaEnvio: new Date(),
            modificadoPor: new mongoose.Types.ObjectId(usuarioId),
            fechaModificacion: new Date(),
            $push: {
              historial: {
                fecha: new Date(),
                usuarioId: new mongoose.Types.ObjectId(usuarioId),
                accion: 'Envío por email',
                descripcion: `Solicitud enviada por email a ${proveedorEmail}`,
              },
            },
          });
        } else {
          // Registrar reenvío
          await PresupuestoCompraModel.findByIdAndUpdate(id, {
            $push: {
              historial: {
                fecha: new Date(),
                usuarioId: new mongoose.Types.ObjectId(usuarioId),
                accion: 'Reenvío por email',
                descripcion: `Solicitud reenviada por email a ${proveedorEmail}`,
              },
            },
          });
        }

        return {
          success: true,
          message: `Email enviado correctamente a ${proveedorEmail}`,
          messageId: result.messageId,
        };
      }

      return { success: false, message: result.error || 'Error al enviar email' };
    } catch (error: any) {
      console.error('Error al enviar solicitud de presupuesto por email:', error);
      return { success: false, message: error.message || 'Error al generar o enviar email' };
    }
  }

  /**
   * Enviar múltiples solicitudes de presupuesto por email (envío masivo)
   */
  async enviarMasivoPorEmail(
    ids: string[],
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig,
    opciones?: {
      asunto?: string;
      mensaje?: string;
      pdfOptions?: PDFOptions;
    }
  ): Promise<{
    success: boolean;
    total: number;
    enviados: number;
    fallidos: number;
    resultados: Array<{ id: string; codigo: string; success: boolean; message: string }>;
  }> {
    const resultados: Array<{ id: string; codigo: string; success: boolean; message: string }> = [];
    let enviados = 0;
    let fallidos = 0;

    for (const id of ids) {
      try {
        const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);
        const presupuesto = await PresupuestoCompraModel.findById(id).select('codigo').lean();
        const codigo = presupuesto?.codigo || id;

        const result = await this.enviarPorEmail(id, empresaId, usuarioId, dbConfig, opciones);

        resultados.push({
          id,
          codigo,
          success: result.success,
          message: result.message,
        });

        if (result.success) {
          enviados++;
        } else {
          fallidos++;
        }

        // Pequeña pausa para no saturar el servidor de email
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        fallidos++;
        resultados.push({
          id,
          codigo: id,
          success: false,
          message: error.message || 'Error desconocido',
        });
      }
    }

    return {
      success: fallidos === 0,
      total: ids.length,
      enviados,
      fallidos,
      resultados,
    };
  }

  // ============================================
  // GENERAR PDF
  // ============================================

  /**
   * Generar PDF de solicitud de presupuesto
   */
  async generarPDF(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    pdfOptions?: PDFOptions
  ): Promise<{ success: boolean; pdf?: Buffer; filename?: string; message?: string }> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);
    const presupuesto = await PresupuestoCompraModel.findById(id).lean();

    if (!presupuesto) {
      return { success: false, message: 'Presupuesto de compra no encontrado' };
    }

    try {
      const pdf = await presupuestosCompraPDFService.generarPDF(
        presupuesto as IPresupuestoCompra,
        empresaId,
        pdfOptions
      );

      return {
        success: true,
        pdf,
        filename: `Solicitud_Presupuesto_${presupuesto.codigo}.pdf`,
      };
    } catch (error: any) {
      console.error('Error generando PDF:', error);
      return { success: false, message: error.message || 'Error al generar PDF' };
    }
  }

  /**
   * Exportar múltiples PDFs (devuelve ZIP si hay más de uno)
   */
  async exportarPDFsMasivo(
    ids: string[],
    empresaId: string,
    dbConfig: IDatabaseConfig,
    pdfOptions?: PDFOptions
  ): Promise<{
    success: boolean;
    pdf?: Buffer;
    zip?: Buffer;
    filename?: string;
    message?: string;
  }> {
    const PresupuestoCompraModel = await getPresupuestoCompraModel(empresaId, dbConfig);

    if (ids.length === 1) {
      // Si es solo uno, devolver PDF directamente
      return this.generarPDF(ids[0], empresaId, dbConfig, pdfOptions);
    }

    // Múltiples: generar ZIP
    try {
      const archiver = (await import('archiver')).default;
      const { PassThrough } = await import('stream');

      const passthrough = new PassThrough();
      const archive = archiver('zip', { zlib: { level: 9 } });

      const chunks: Buffer[] = [];
      passthrough.on('data', chunk => chunks.push(chunk));

      archive.pipe(passthrough);

      for (const id of ids) {
        const presupuesto = await PresupuestoCompraModel.findById(id).lean();
        if (presupuesto) {
          const pdf = await presupuestosCompraPDFService.generarPDF(
            presupuesto as IPresupuestoCompra,
            empresaId,
            pdfOptions
          );
          archive.append(pdf, { name: `Solicitud_${presupuesto.codigo}.pdf` });
        }
      }

      await archive.finalize();

      // Esperar a que termine
      await new Promise<void>((resolve, reject) => {
        passthrough.on('end', resolve);
        passthrough.on('error', reject);
      });

      return {
        success: true,
        zip: Buffer.concat(chunks),
        filename: `Solicitudes_Presupuesto_${new Date().toISOString().split('T')[0]}.zip`,
      };
    } catch (error: any) {
      console.error('Error exportando PDFs masivamente:', error);
      return { success: false, message: error.message || 'Error al exportar PDFs' };
    }
  }
}

export const presupuestosCompraService = new PresupuestosCompraService();
