import mongoose, { Model } from 'mongoose';
import { FacturaCompra, IFacturaCompra, EstadoFacturaCompra, TipoLineaFacturaCompra, ILineaFacturaCompra } from './FacturaCompra';
import {
  CreateFacturaCompraDTO,
  UpdateFacturaCompraDTO,
  SearchFacturasCompraDTO,
  RegistrarPagoDTO,
  CrearDesdeAlbaranesDTO,
} from './facturas-compra.dto';
import { IDatabaseConfig } from '@/models/Empresa';
import {
  getProveedorModel,
  getProductoModel,
  getUserModel,
  getAlbaranCompraModel,
  getPedidoCompraModel,
} from '@/utils/dynamic-models.helper';
import { databaseManager } from '@/services/database-manager.service';
import { parseAdvancedFilters, mergeFilters } from '@/utils/advanced-filters.helper';
import { EstadoAlbaranCompra } from '../albaranes-compra/AlbaranCompra';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  facturas: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// HELPER PARA OBTENER MODELO
// ============================================

const getFacturaCompraModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IFacturaCompra>> => {
  const FacturaCompraSchema = FacturaCompra.schema;
  return databaseManager.getModel<IFacturaCompra>(
    empresaId,
    dbConfig,
    'FacturaCompra',
    FacturaCompraSchema
  );
};

// ============================================
// SERVICIO
// ============================================

export class FacturasCompraService {
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IFacturaCompra>> {
    await Promise.all([
      getProveedorModel(empresaId, dbConfig),
      getProductoModel(empresaId, dbConfig),
      getUserModel(empresaId, dbConfig),
      getAlbaranCompraModel(empresaId, dbConfig),
      getPedidoCompraModel(empresaId, dbConfig),
    ]);

    return getFacturaCompraModel(empresaId, dbConfig);
  }

  // ============================================
  // CÁLCULOS DE LÍNEAS Y TOTALES
  // ============================================

  calcularLinea(linea: Partial<ILineaFacturaCompra>): ILineaFacturaCompra {
    const cantidad = linea.cantidad || 1;
    const precioUnitario = linea.precioUnitario || 0;
    const descuento = linea.descuento || 0;
    const iva = linea.iva || 21;

    const subtotalBruto = cantidad * precioUnitario;
    const descuentoImporte = subtotalBruto * (descuento / 100);
    const subtotal = subtotalBruto - descuentoImporte;
    const ivaImporte = subtotal * (iva / 100);
    const total = subtotal + ivaImporte;

    return {
      ...linea,
      cantidad,
      precioUnitario,
      descuento,
      descuentoImporte,
      subtotal,
      iva,
      ivaImporte,
      total,
    } as ILineaFacturaCompra;
  }

  calcularTotales(lineas: ILineaFacturaCompra[], descuentoGlobalPorcentaje: number = 0) {
    let subtotalBruto = 0;
    let totalDescuentos = 0;

    const ivaAgrupado: Record<number, { base: number; cuota: number }> = {};

    for (const linea of lineas) {
      if (!linea.incluidoEnTotal) continue;

      subtotalBruto += linea.cantidad * linea.precioUnitario;
      totalDescuentos += linea.descuentoImporte;

      const tipoIva = linea.iva || 21;
      if (!ivaAgrupado[tipoIva]) {
        ivaAgrupado[tipoIva] = { base: 0, cuota: 0 };
      }
      ivaAgrupado[tipoIva].base += linea.subtotal;
      ivaAgrupado[tipoIva].cuota += linea.ivaImporte;
    }

    const subtotalNeto = subtotalBruto - totalDescuentos;
    const descuentoGlobalImporte = subtotalNeto * (descuentoGlobalPorcentaje / 100);
    const subtotalNetoConDescuento = subtotalNeto - descuentoGlobalImporte;

    const factorDescuento = subtotalNeto > 0 ? subtotalNetoConDescuento / subtotalNeto : 1;
    const desgloseIva = Object.entries(ivaAgrupado).map(([tipo, valores]) => ({
      tipo: Number(tipo),
      base: Math.round(valores.base * factorDescuento * 100) / 100,
      cuota: Math.round(valores.cuota * factorDescuento * 100) / 100,
    }));

    const totalIva = desgloseIva.reduce((sum, item) => sum + item.cuota, 0);
    const totalFactura = subtotalNetoConDescuento + totalIva;

    return {
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round((totalDescuentos + descuentoGlobalImporte) * 100) / 100,
      subtotalNeto: Math.round(subtotalNetoConDescuento * 100) / 100,
      desgloseIva,
      totalIva: Math.round(totalIva * 100) / 100,
      totalFactura: Math.round(totalFactura * 100) / 100,
    };
  }

  // ============================================
  // CREAR FACTURA DE COMPRA
  // ============================================

  async crear(
    dto: CreateFacturaCompraDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFacturaCompra> {
    const FacturaCompraModel = await this.getModelo(String(empresaId), dbConfig);
    const ProveedorModel = await getProveedorModel(String(empresaId), dbConfig);

    // Generar código
    const serie = dto.serie || 'FRC';
    const año = new Date().getFullYear();

    const ultimaFactura = await FacturaCompraModel.findOne({
      serie,
      codigo: new RegExp(`^${serie}${año}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    let numero = 1;
    if (ultimaFactura && ultimaFactura.numero) {
      numero = ultimaFactura.numero + 1;
    }

    const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

    // Obtener datos del proveedor
    let proveedorData: any = {
      proveedorNombre: dto.proveedorNombre,
      proveedorNif: dto.proveedorNif,
      proveedorEmail: dto.proveedorEmail,
      proveedorTelefono: dto.proveedorTelefono,
      proveedorDireccion: dto.proveedorDireccion,
    };

    if (dto.proveedorId) {
      const proveedor = await ProveedorModel.findById(dto.proveedorId);
      if (proveedor) {
        proveedorData = {
          proveedorNombre: proveedor.nombre || proveedor.nombreComercial,
          proveedorNif: proveedor.nif || proveedor.cif,
          proveedorEmail: proveedor.email,
          proveedorTelefono: proveedor.telefono,
          proveedorDireccion: proveedor.direcciones?.[0] ?
            `${proveedor.direcciones[0].calle}, ${proveedor.direcciones[0].ciudad}` : undefined,
        };
      }
    }

    // Procesar líneas
    let lineasProcesadas: ILineaFacturaCompra[] = [];
    if (dto.lineas && dto.lineas.length > 0) {
      lineasProcesadas = dto.lineas.map((linea, index) => {
        const lineaConOrden = {
          ...linea,
          orden: linea.orden || index + 1,
          cantidad: linea.cantidad || 1,
          esEditable: linea.esEditable !== false,
          incluidoEnTotal: linea.incluidoEnTotal !== false,
        };
        return this.calcularLinea(lineaConOrden);
      });
    }

    // Calcular totales
    const descuentoGlobalPorcentaje = dto.descuentoGlobalPorcentaje || 0;
    const totales = this.calcularTotales(lineasProcesadas, descuentoGlobalPorcentaje);

    // Generar vencimientos si no se proporcionan
    let vencimientos = dto.vencimientos || [];
    if (vencimientos.length === 0) {
      // Un solo vencimiento con el total de la factura
      const fechaVencimiento = dto.fechaVencimiento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      vencimientos = [{
        numero: 1,
        fechaVencimiento,
        importe: totales.totalFactura,
        formaPagoId: dto.formaPagoId,
      }];
    }

    // Crear factura
    const factura = new FacturaCompraModel({
      _id: new mongoose.Types.ObjectId(),
      codigo,
      serie,
      numero,
      numeroFacturaProveedor: dto.numeroFacturaProveedor,
      fechaFacturaProveedor: dto.fechaFacturaProveedor,
      estado: dto.estado || EstadoFacturaCompra.PENDIENTE_PAGO,
      fecha: dto.fecha || new Date(),
      fechaVencimiento: dto.fechaVencimiento,
      fechaContabilizacion: dto.fechaContabilizacion,
      proveedorId: dto.proveedorId,
      ...proveedorData,
      albaranesCompraIds: dto.albaranesCompraIds,
      pedidosCompraIds: dto.pedidosCompraIds,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      lineas: lineasProcesadas,
      totales,
      descuentoGlobalPorcentaje,
      descuentoGlobalImporte: totales.totalDescuentos,
      vencimientos: vencimientos.map((v, i) => ({
        ...v,
        numero: v.numero || i + 1,
        importePagado: 0,
        importePendiente: v.importe,
        estado: 'pendiente',
      })),
      formaPagoId: dto.formaPagoId,
      terminoPagoId: dto.terminoPagoId,
      cuentaBancariaId: dto.cuentaBancariaId,
      observaciones: dto.observaciones,
      observacionesInternas: dto.observacionesInternas,
      tags: dto.tags,
      creadoPor: usuarioId,
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Factura de compra creada',
        descripcion: `Factura ${codigo} creada`,
      }],
    });

    await factura.save();

    return factura;
  }

  // ============================================
  // CREAR DESDE ALBARANES DE COMPRA
  // ============================================

  async crearDesdeAlbaranes(
    dto: CrearDesdeAlbaranesDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFacturaCompra> {
    const AlbaranCompraModel = await getAlbaranCompraModel(String(empresaId), dbConfig);

    // Obtener albaranes
    const albaranes = await AlbaranCompraModel.find({
      _id: { $in: dto.albaranesCompraIds.map(id => new mongoose.Types.ObjectId(id)) },
      facturado: false,
      activo: true,
    });

    if (albaranes.length === 0) {
      throw new Error('No se encontraron albaranes válidos para facturar');
    }

    // Verificar que todos los albaranes sean del mismo proveedor
    const proveedorId = albaranes[0].proveedorId.toString();
    const mismoProv = albaranes.every(a => a.proveedorId.toString() === proveedorId);
    if (!mismoProv) {
      throw new Error('Todos los albaranes deben ser del mismo proveedor');
    }

    // Combinar líneas de todos los albaranes
    const lineas: any[] = [];
    let ordenActual = 0;

    for (const albaran of albaranes) {
      for (const linea of albaran.lineas) {
        ordenActual++;
        lineas.push({
          orden: ordenActual,
          tipo: linea.tipo,
          productoId: linea.productoId?.toString(),
          codigo: linea.codigo,
          nombre: linea.nombre,
          descripcion: linea.descripcion,
          sku: linea.sku,
          codigoProveedor: linea.codigoProveedor,
          variante: linea.variante,
          cantidad: linea.cantidadRecibida || linea.cantidadPedida || 0,
          unidad: linea.unidad,
          precioUnitario: linea.precioUnitario,
          descuento: linea.descuento,
          iva: linea.iva,
          esEditable: true,
          incluidoEnTotal: linea.incluidoEnTotal,
          lineaAlbaranCompraId: linea._id?.toString(),
        });
      }
    }

    // Crear la factura
    const factura = await this.crear({
      proveedorId,
      proveedorNombre: albaranes[0].proveedorNombre,
      proveedorNif: albaranes[0].proveedorNif,
      proveedorEmail: albaranes[0].proveedorEmail,
      proveedorTelefono: albaranes[0].proveedorTelefono,
      numeroFacturaProveedor: dto.numeroFacturaProveedor,
      fechaFacturaProveedor: dto.fechaFacturaProveedor,
      albaranesCompraIds: dto.albaranesCompraIds,
      lineas,
      formaPagoId: dto.formaPagoId,
      terminoPagoId: dto.terminoPagoId,
      titulo: `Factura de ${albaranes.length} albarán(es)`,
    }, empresaId, usuarioId, dbConfig);

    // Marcar albaranes como facturados
    for (const albaran of albaranes) {
      albaran.facturado = true;
      albaran.facturaId = factura._id;
      albaran.estado = EstadoAlbaranCompra.FACTURADO;
      albaran.historial.push({
        fecha: new Date(),
        usuarioId,
        accion: 'Facturado',
        descripcion: `Incluido en factura ${factura.codigo}`,
      });
      await albaran.save();
    }

    return factura;
  }

  // ============================================
  // REGISTRAR PAGO
  // ============================================

  async registrarPago(
    facturaId: string,
    dto: RegistrarPagoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFacturaCompra | null> {
    const FacturaCompraModel = await this.getModelo(String(empresaId), dbConfig);

    const factura = await FacturaCompraModel.findById(facturaId);
    if (!factura) {
      return null;
    }

    let importeRestante = dto.importe;

    if (dto.vencimientoId) {
      // Aplicar a vencimiento específico
      const vencimiento = factura.vencimientos.find(v => v._id?.toString() === dto.vencimientoId);
      if (vencimiento) {
        const aplicar = Math.min(importeRestante, vencimiento.importePendiente);
        vencimiento.importePagado += aplicar;
        vencimiento.importePendiente -= aplicar;
        if (dto.fechaPago) vencimiento.fechaPago = dto.fechaPago;
        if (dto.referenciaPago) vencimiento.referenciaPago = dto.referenciaPago;
        if (dto.formaPagoId) vencimiento.formaPagoId = new mongoose.Types.ObjectId(dto.formaPagoId);
        importeRestante -= aplicar;
      }
    } else {
      // Aplicar a vencimientos pendientes por orden de fecha
      const vencimientosPendientes = factura.vencimientos
        .filter(v => v.importePendiente > 0)
        .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());

      for (const vencimiento of vencimientosPendientes) {
        if (importeRestante <= 0) break;

        const aplicar = Math.min(importeRestante, vencimiento.importePendiente);
        vencimiento.importePagado += aplicar;
        vencimiento.importePendiente -= aplicar;
        if (dto.fechaPago) vencimiento.fechaPago = dto.fechaPago;
        if (dto.referenciaPago) vencimiento.referenciaPago = dto.referenciaPago;
        if (dto.formaPagoId) vencimiento.formaPagoId = new mongoose.Types.ObjectId(dto.formaPagoId);
        importeRestante -= aplicar;
      }
    }

    // Registrar en historial
    factura.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Pago registrado',
      descripcion: `Pago de ${dto.importe}€ registrado${dto.referenciaPago ? ` (Ref: ${dto.referenciaPago})` : ''}`,
    });

    factura.modificadoPor = usuarioId;

    await factura.save();

    return factura;
  }

  // ============================================
  // BUSCAR
  // ============================================

  async buscar(
    searchDto: SearchFacturasCompraDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<FindAllResult> {
    const FacturaCompraModel = await this.getModelo(String(empresaId), dbConfig);

    const {
      search,
      proveedorId,
      estado,
      estados,
      serie,
      activo = 'true',
      contabilizada,
      fechaDesde,
      fechaHasta,
      fechaVencimientoDesde,
      fechaVencimientoHasta,
      importeMin,
      importeMax,
      numeroFacturaProveedor,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'fecha',
      sortOrder = 'desc',
    } = searchDto;

    const filtros: any = {};

    if (search) {
      filtros.$or = [
        { codigo: { $regex: search, $options: 'i' } },
        { proveedorNombre: { $regex: search, $options: 'i' } },
        { titulo: { $regex: search, $options: 'i' } },
        { numeroFacturaProveedor: { $regex: search, $options: 'i' } },
      ];
    }

    if (proveedorId) filtros.proveedorId = new mongoose.Types.ObjectId(proveedorId);
    if (numeroFacturaProveedor) filtros.numeroFacturaProveedor = { $regex: numeroFacturaProveedor, $options: 'i' };

    if (estado) filtros.estado = estado;
    if (estados) filtros.estado = { $in: estados.split(',') };
    if (serie) filtros.serie = serie;

    if (activo !== 'all') filtros.activo = activo === 'true';
    if (contabilizada !== undefined) filtros.contabilizada = contabilizada === 'true';

    if (fechaDesde || fechaHasta) {
      filtros.fecha = {};
      if (fechaDesde) filtros.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) filtros.fecha.$lte = new Date(fechaHasta);
    }

    if (fechaVencimientoDesde || fechaVencimientoHasta) {
      filtros.fechaVencimiento = {};
      if (fechaVencimientoDesde) filtros.fechaVencimiento.$gte = new Date(fechaVencimientoDesde);
      if (fechaVencimientoHasta) filtros.fechaVencimiento.$lte = new Date(fechaVencimientoHasta);
    }

    if (importeMin || importeMax) {
      filtros['totales.totalFactura'] = {};
      if (importeMin) filtros['totales.totalFactura'].$gte = Number(importeMin);
      if (importeMax) filtros['totales.totalFactura'].$lte = Number(importeMax);
    }

    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim().toLowerCase());
      filtros.tags = { $in: tagsArray };
    }

    const allowedAdvancedFields = [
      'estado', 'codigo', 'proveedorNombre', 'titulo', 'serie',
      'activo', 'contabilizada', 'numeroFacturaProveedor',
    ];
    const advancedFilters = parseAdvancedFilters(searchDto, allowedAdvancedFields);
    const finalFilter = mergeFilters(filtros, advancedFilters);

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [facturas, total] = await Promise.all([
      FacturaCompraModel.find(finalFilter)
        .populate('proveedorId', 'codigo nombre nombreComercial')
        .populate('creadoPor', 'nombre email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      FacturaCompraModel.countDocuments(finalFilter),
    ]);

    return {
      facturas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async obtenerPorId(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFacturaCompra | null> {
    const FacturaCompraModel = await this.getModelo(String(empresaId), dbConfig);

    return FacturaCompraModel.findById(id)
      .populate('proveedorId', 'codigo nombre nombreComercial nif cif email telefono direcciones')
      .populate('albaranesCompraIds', 'codigo fecha')
      .populate('pedidosCompraIds', 'codigo fecha')
      .populate('formaPagoId', 'nombre')
      .populate('terminoPagoId', 'nombre')
      .populate('creadoPor', 'nombre email')
      .populate('modificadoPor', 'nombre email')
      .populate('historial.usuarioId', 'nombre email')
      .lean();
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(
    id: string,
    dto: UpdateFacturaCompraDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFacturaCompra | null> {
    const FacturaCompraModel = await this.getModelo(String(empresaId), dbConfig);

    const factura = await FacturaCompraModel.findById(id);
    if (!factura) {
      return null;
    }

    if (factura.bloqueado) {
      throw new Error('La factura está bloqueada y no se puede modificar');
    }

    if (factura.contabilizada) {
      throw new Error('La factura ya ha sido contabilizada y no se puede modificar');
    }

    const estadoAnterior = factura.estado;

    if (dto.lineas) {
      const lineasProcesadas = dto.lineas.map((linea, index) => {
        const lineaConOrden = {
          ...linea,
          orden: linea.orden || index + 1,
          cantidad: linea.cantidad || 1,
          esEditable: linea.esEditable !== false,
          incluidoEnTotal: linea.incluidoEnTotal !== false,
        };
        return this.calcularLinea(lineaConOrden);
      });

      const descuentoGlobal = dto.descuentoGlobalPorcentaje ?? factura.descuentoGlobalPorcentaje;
      const totales = this.calcularTotales(lineasProcesadas, descuentoGlobal);

      factura.lineas = lineasProcesadas as any;
      factura.totales = totales as any;
      factura.descuentoGlobalPorcentaje = descuentoGlobal;
      factura.descuentoGlobalImporte = totales.totalDescuentos;
    }

    const camposActualizables = [
      'estado', 'fecha', 'fechaVencimiento', 'fechaContabilizacion',
      'numeroFacturaProveedor', 'fechaFacturaProveedor',
      'proveedorId', 'proveedorNombre', 'proveedorNif', 'proveedorEmail', 'proveedorTelefono', 'proveedorDireccion',
      'titulo', 'descripcion', 'observaciones', 'observacionesInternas',
      'formaPagoId', 'terminoPagoId', 'cuentaBancariaId', 'tags',
    ];

    camposActualizables.forEach(campo => {
      if ((dto as any)[campo] !== undefined) {
        (factura as any)[campo] = (dto as any)[campo];
      }
    });

    if (dto.estado && dto.estado !== estadoAnterior) {
      factura.historial.push({
        fecha: new Date(),
        usuarioId,
        accion: 'Cambio de estado',
        descripcion: `Estado cambiado de "${estadoAnterior}" a "${dto.estado}"`,
        datosAnteriores: { estado: estadoAnterior },
      });
    }

    factura.modificadoPor = usuarioId;

    await factura.save();

    return factura;
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const FacturaCompraModel = await this.getModelo(String(empresaId), dbConfig);

    const factura = await FacturaCompraModel.findById(id);
    if (!factura) {
      return false;
    }

    if (factura.contabilizada) {
      throw new Error('No se puede eliminar una factura contabilizada');
    }

    const hayPagos = factura.vencimientos.some(v => v.importePagado > 0);
    if (hayPagos) {
      throw new Error('No se puede eliminar una factura con pagos registrados');
    }

    // Desmarcar albaranes
    if (factura.albaranesCompraIds && factura.albaranesCompraIds.length > 0) {
      const AlbaranCompraModel = await getAlbaranCompraModel(String(empresaId), dbConfig);
      await AlbaranCompraModel.updateMany(
        { _id: { $in: factura.albaranesCompraIds } },
        {
          $set: { facturado: false, facturaId: null, estado: EstadoAlbaranCompra.RECIBIDO },
          $push: {
            historial: {
              fecha: new Date(),
              usuarioId,
              accion: 'Factura eliminada',
              descripcion: `La factura ${factura.codigo} ha sido eliminada`,
            },
          },
        }
      );
    }

    factura.activo = false;
    factura.modificadoPor = usuarioId;
    factura.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Factura eliminada',
      descripcion: 'La factura ha sido marcada como eliminada',
    });

    await factura.save();

    return true;
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const FacturaCompraModel = await this.getModelo(String(empresaId), dbConfig);

    const [total, porEstado, totales, ultimoMes, vencidas] = await Promise.all([
      FacturaCompraModel.countDocuments({ activo: true }),
      FacturaCompraModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$estado', count: { $sum: 1 } } },
      ]),
      FacturaCompraModel.aggregate([
        { $match: { activo: true } },
        {
          $group: {
            _id: null,
            totalImporte: { $sum: '$totales.totalFactura' },
            totalPagado: { $sum: { $sum: '$vencimientos.importePagado' } },
            totalPendiente: { $sum: { $sum: '$vencimientos.importePendiente' } },
          },
        },
      ]),
      FacturaCompraModel.countDocuments({
        activo: true,
        fechaCreacion: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      FacturaCompraModel.countDocuments({
        activo: true,
        estado: EstadoFacturaCompra.VENCIDA,
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
      totalPagado: totales[0]?.totalPagado || 0,
      totalPendiente: totales[0]?.totalPendiente || 0,
      ultimoMes,
      vencidas,
    };
  }
}

export const facturasCompraService = new FacturasCompraService();
