import mongoose, { Model } from 'mongoose';
import { AlbaranCompra, IAlbaranCompra, EstadoAlbaranCompra, TipoLineaCompra, ILineaAlbaranCompra } from './AlbaranCompra';
import {
  CreateAlbaranCompraDTO,
  UpdateAlbaranCompraDTO,
  SearchAlbaranesCompraDTO,
  RegistrarRecepcionDTO,
  CrearDesdePedidoCompraDTO,
} from './albaranes-compra.dto';
import { IDatabaseConfig } from '@/models/Empresa';
import {
  getProveedorModel,
  getProductoModel,
  getAlmacenModel,
  getUserModel,
  getPedidoCompraModel,
  getMovimientoStockModel,
} from '@/utils/dynamic-models.helper';
import { databaseManager } from '@/services/database-manager.service';
import { stockService } from '@/services/stock.service';
import { TipoMovimiento, OrigenMovimiento } from '@/models/MovimientoStock';
import { parseAdvancedFilters, mergeFilters } from '@/utils/advanced-filters.helper';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  albaranes: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// HELPER PARA OBTENER MODELO
// ============================================

const getAlbaranCompraModel = async (
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<Model<IAlbaranCompra>> => {
  const AlbaranCompraSchema = AlbaranCompra.schema;
  return databaseManager.getModel<IAlbaranCompra>(
    empresaId,
    dbConfig,
    'AlbaranCompra',
    AlbaranCompraSchema
  );
};

// ============================================
// SERVICIO
// ============================================

export class AlbaranesCompraService {
  /**
   * Obtener modelo con dependencias registradas
   */
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IAlbaranCompra>> {
    // Registrar modelos referenciados
    await Promise.all([
      getProveedorModel(empresaId, dbConfig),
      getProductoModel(empresaId, dbConfig),
      getAlmacenModel(empresaId, dbConfig),
      getUserModel(empresaId, dbConfig),
      getPedidoCompraModel(empresaId, dbConfig),
    ]);

    return getAlbaranCompraModel(empresaId, dbConfig);
  }

  // ============================================
  // CÁLCULOS DE LÍNEAS Y TOTALES
  // ============================================

  calcularLinea(linea: Partial<ILineaAlbaranCompra>): ILineaAlbaranCompra {
    const cantidadPedida = linea.cantidadPedida || 0;
    const cantidadRecibida = linea.cantidadRecibida || 0;
    const precioUnitario = linea.precioUnitario || 0;
    const descuento = linea.descuento || 0;
    const iva = linea.iva || 21;

    const subtotalBruto = cantidadRecibida * precioUnitario;
    const descuentoImporte = subtotalBruto * (descuento / 100);
    const subtotal = subtotalBruto - descuentoImporte;
    const ivaImporte = subtotal * (iva / 100);
    const total = subtotal + ivaImporte;
    const cantidadPendiente = Math.max(0, cantidadPedida - cantidadRecibida);

    return {
      ...linea,
      cantidadPedida,
      cantidadRecibida,
      cantidadPendiente,
      precioUnitario,
      descuento,
      descuentoImporte,
      subtotal,
      iva,
      ivaImporte,
      total,
    } as ILineaAlbaranCompra;
  }

  calcularTotales(lineas: ILineaAlbaranCompra[], descuentoGlobalPorcentaje: number = 0) {
    let subtotalBruto = 0;
    let totalDescuentos = 0;

    const ivaAgrupado: Record<number, { base: number; cuota: number }> = {};

    for (const linea of lineas) {
      if (!linea.incluidoEnTotal) continue;

      subtotalBruto += linea.cantidadRecibida * linea.precioUnitario;
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
    const totalAlbaran = subtotalNetoConDescuento + totalIva;

    return {
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round((totalDescuentos + descuentoGlobalImporte) * 100) / 100,
      subtotalNeto: Math.round(subtotalNetoConDescuento * 100) / 100,
      desgloseIva,
      totalIva: Math.round(totalIva * 100) / 100,
      totalAlbaran: Math.round(totalAlbaran * 100) / 100,
    };
  }

  // ============================================
  // CREAR ALBARÁN DE COMPRA
  // ============================================

  async crear(
    dto: CreateAlbaranCompraDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IAlbaranCompra> {
    const AlbaranCompraModel = await this.getModelo(String(empresaId), dbConfig);
    const ProveedorModel = await getProveedorModel(String(empresaId), dbConfig);

    // Generar código
    const serie = dto.serie || 'ALC';
    const año = new Date().getFullYear();

    const ultimoAlbaran = await AlbaranCompraModel.findOne({
      serie,
      codigo: new RegExp(`^${serie}${año}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    let numero = 1;
    if (ultimoAlbaran && ultimoAlbaran.numero) {
      numero = ultimoAlbaran.numero + 1;
    }

    const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

    // Obtener datos del proveedor
    let proveedorData: any = {
      proveedorNombre: dto.proveedorNombre,
      proveedorNif: dto.proveedorNif,
      proveedorEmail: dto.proveedorEmail,
      proveedorTelefono: dto.proveedorTelefono,
    };

    if (dto.proveedorId) {
      const proveedor = await ProveedorModel.findById(dto.proveedorId);
      if (proveedor) {
        proveedorData = {
          proveedorNombre: proveedor.nombre || proveedor.nombreComercial,
          proveedorNif: proveedor.nif || proveedor.cif,
          proveedorEmail: proveedor.email,
          proveedorTelefono: proveedor.telefono,
        };
      }
    }

    // Procesar líneas
    let lineasProcesadas: ILineaAlbaranCompra[] = [];
    if (dto.lineas && dto.lineas.length > 0) {
      lineasProcesadas = dto.lineas.map((linea, index) => {
        const lineaConOrden = {
          ...linea,
          orden: linea.orden || index + 1,
          cantidadPedida: linea.cantidadPedida || linea.cantidadRecibida || 0,
          cantidadRecibida: linea.cantidadRecibida || 0,
          esEditable: linea.esEditable !== false,
          incluidoEnTotal: linea.incluidoEnTotal !== false,
        };
        return this.calcularLinea(lineaConOrden);
      });
    }

    // Calcular totales
    const descuentoGlobalPorcentaje = dto.descuentoGlobalPorcentaje || 0;
    const totales = this.calcularTotales(lineasProcesadas, descuentoGlobalPorcentaje);

    // Crear albarán
    const albaran = new AlbaranCompraModel({
      _id: new mongoose.Types.ObjectId(),
      codigo,
      serie,
      numero,
      estado: dto.estado || EstadoAlbaranCompra.BORRADOR,
      fecha: dto.fecha || new Date(),
      fechaRecepcion: dto.fechaRecepcion,
      fechaPrevistaRecepcion: dto.fechaPrevistaRecepcion,
      proveedorId: dto.proveedorId,
      ...proveedorData,
      pedidoCompraId: dto.pedidoCompraId,
      datosTransporte: dto.datosTransporte,
      almacenId: dto.almacenId,
      referenciaProveedor: dto.referenciaProveedor,
      numeroAlbaranProveedor: dto.numeroAlbaranProveedor,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      lineas: lineasProcesadas,
      totales,
      descuentoGlobalPorcentaje,
      descuentoGlobalImporte: totales.totalDescuentos,
      observaciones: dto.observaciones,
      observacionesInternas: dto.observacionesInternas,
      tags: dto.tags,
      creadoPor: usuarioId,
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Albarán de compra creado',
        descripcion: `Albarán ${codigo} creado`,
      }],
    });

    await albaran.save();

    return albaran;
  }

  // ============================================
  // CREAR DESDE PEDIDO DE COMPRA
  // ============================================

  async crearDesdePedidoCompra(
    dto: CrearDesdePedidoCompraDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IAlbaranCompra> {
    const PedidoCompraModel = await getPedidoCompraModel(String(empresaId), dbConfig);
    const pedido = await PedidoCompraModel.findById(dto.pedidoCompraId);

    if (!pedido) {
      throw new Error('Pedido de compra no encontrado');
    }

    // Determinar qué líneas incluir
    let lineasParaAlbaran = pedido.lineas;
    if (dto.lineasIds && dto.lineasIds.length > 0) {
      lineasParaAlbaran = pedido.lineas.filter((l: any) =>
        dto.lineasIds!.includes(l._id?.toString())
      );
    }

    // Convertir líneas de pedido a líneas de albarán
    const lineas = lineasParaAlbaran.map((lineaPedido: any, index: number) => {
      const cantidadPendiente = lineaPedido.cantidadPendiente || (lineaPedido.cantidad - (lineaPedido.cantidadRecibida || 0));
      const cantidadARecibir = dto.recibirTodo ? cantidadPendiente : 0;

      return {
        orden: index + 1,
        tipo: lineaPedido.tipo,
        productoId: lineaPedido.productoId,
        codigo: lineaPedido.codigo,
        nombre: lineaPedido.nombre,
        descripcion: lineaPedido.descripcion,
        sku: lineaPedido.sku,
        codigoProveedor: lineaPedido.codigoProveedor,
        cantidadPedida: cantidadPendiente,
        cantidadRecibida: cantidadARecibir,
        unidad: lineaPedido.unidad,
        precioUnitario: lineaPedido.precioUnitario,
        descuento: lineaPedido.descuento,
        iva: lineaPedido.iva,
        almacenDestinoId: lineaPedido.almacenDestinoId || dto.almacenId,
        esEditable: true,
        incluidoEnTotal: lineaPedido.incluidoEnTotal,
        lineaPedidoCompraId: lineaPedido._id,
        notasInternas: lineaPedido.notasInternas,
      };
    });

    // Obtener almacén
    const almacenId = dto.almacenId || pedido.direccionRecepcion?.almacenId?.toString();
    if (!almacenId) {
      throw new Error('Es necesario especificar un almacén de recepción');
    }

    // Crear el albarán
    const albaran = await this.crear({
      pedidoCompraId: dto.pedidoCompraId,
      proveedorId: pedido.proveedorId.toString(),
      proveedorNombre: pedido.proveedorNombre,
      proveedorNif: pedido.proveedorNif,
      proveedorEmail: pedido.proveedorEmail,
      proveedorTelefono: pedido.proveedorTelefono,
      almacenId,
      referenciaProveedor: pedido.referenciaProveedor,
      titulo: pedido.titulo,
      descripcion: pedido.descripcion,
      lineas: lineas as any,
      descuentoGlobalPorcentaje: pedido.descuentoGlobalPorcentaje,
      observaciones: pedido.observaciones,
      fechaPrevistaRecepcion: dto.fechaPrevistaRecepcion || pedido.fechaEntregaPrevista,
      datosTransporte: dto.datosTransporte,
    }, empresaId, usuarioId, dbConfig);

    // Registrar en historial del pedido
    pedido.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Albarán de compra generado',
      descripcion: `Se ha generado el albarán de compra ${albaran.codigo}`,
    });
    await pedido.save();

    return albaran;
  }

  // ============================================
  // REGISTRAR RECEPCIÓN (CON ACTUALIZACIÓN DE STOCK)
  // ============================================

  async registrarRecepcion(
    id: string,
    dto: RegistrarRecepcionDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IAlbaranCompra | null> {
    const AlbaranCompraModel = await this.getModelo(String(empresaId), dbConfig);
    const AlmacenModel = await getAlmacenModel(String(empresaId), dbConfig);
    const ProductoModel = await getProductoModel(String(empresaId), dbConfig);
    const UserModel = await getUserModel(String(empresaId), dbConfig);

    const albaran = await AlbaranCompraModel.findById(id);
    if (!albaran) {
      return null;
    }

    // Obtener usuario
    const usuario = await UserModel.findById(usuarioId).lean();
    const usuarioNombre = usuario?.nombre || 'Sistema';

    // Guardar cantidades anteriores
    const cantidadesAnteriores: Record<string, number> = {};
    albaran.lineas.forEach(linea => {
      cantidadesAnteriores[linea._id?.toString() || ''] = linea.cantidadRecibida || 0;
    });

    // Actualizar datos de transporte si se proporcionan
    if (dto.datosTransporte) {
      albaran.datosTransporte = {
        ...albaran.datosTransporte,
        ...dto.datosTransporte,
      };
    }

    // Actualizar cantidades recibidas
    if (dto.lineasRecibidas && dto.lineasRecibidas.length > 0) {
      dto.lineasRecibidas.forEach(lineaDto => {
        const linea = albaran.lineas.find(l => l._id?.toString() === lineaDto.lineaId);
        if (linea) {
          linea.cantidadRecibida = lineaDto.cantidadRecibida;
          linea.lote = lineaDto.lote;
          linea.numeroSerie = lineaDto.numeroSerie;
          linea.fechaCaducidad = lineaDto.fechaCaducidad;
          linea.ubicacion = lineaDto.ubicacion;
          linea.notasRecepcion = lineaDto.observaciones;
        }
      });

      // Recalcular líneas y totales
      albaran.lineas = albaran.lineas.map(linea => this.calcularLinea(linea as any)) as any;
      albaran.totales = this.calcularTotales(albaran.lineas as any, albaran.descuentoGlobalPorcentaje) as any;
    }

    // Actualizar fecha de recepción
    albaran.fechaRecepcion = dto.fechaRecepcion || new Date();

    // ============================================
    // REGISTRAR MOVIMIENTOS DE STOCK
    // ============================================

    // Obtener almacén
    const almacenInfo = await AlmacenModel.findById(albaran.almacenId).lean();

    if (almacenInfo) {
      for (const linea of albaran.lineas) {
        if (linea.productoId && linea.tipo === TipoLineaCompra.PRODUCTO) {
          const cantidadAnterior = cantidadesAnteriores[linea._id?.toString() || ''] || 0;
          const cantidadNueva = linea.cantidadRecibida || 0;
          const incremento = cantidadNueva - cantidadAnterior;

          // Solo registrar si hay un incremento en la cantidad recibida
          if (incremento > 0) {
            try {
              const producto = await ProductoModel.findById(linea.productoId).lean();

              if (producto && producto.gestionaStock) {
                // Registrar entrada de stock
                await stockService.registrarMovimiento({
                  productoId: linea.productoId.toString(),
                  productoCodigo: linea.codigo || producto.sku || '',
                  productoNombre: linea.nombre || producto.nombre,
                  productoSku: linea.sku || producto.sku,
                  varianteId: linea.variante?.varianteId?.toString(),
                  varianteSku: linea.variante?.sku,
                  varianteNombre: linea.variante?.valores ? Object.values(linea.variante.valores).join(' / ') : undefined,
                  almacenId: (linea.almacenDestinoId || albaran.almacenId).toString(),
                  almacenNombre: almacenInfo.nombre,
                  tipo: TipoMovimiento.ENTRADA_COMPRA,
                  origen: OrigenMovimiento.ALBARAN_COMPRA,
                  documentoOrigenId: albaran._id.toString(),
                  documentoOrigenCodigo: albaran.codigo,
                  documentoOrigenTipo: 'albaran_compra',
                  terceroId: albaran.proveedorId?.toString(),
                  terceroNombre: albaran.proveedorNombre,
                  terceroTipo: 'proveedor',
                  cantidad: incremento,
                  precioUnitario: linea.precioUnitario,
                  costeUnitario: linea.precioUnitario, // En compras, el precio es el coste
                  lote: linea.lote,
                  numeroSerie: linea.numeroSerie,
                  fechaCaducidad: linea.fechaCaducidad,
                  ubicacion: linea.ubicacion,
                  usuarioId: usuarioId.toString(),
                  usuarioNombre,
                  observaciones: `Recepción desde albarán de compra ${albaran.codigo}`,
                }, String(empresaId), dbConfig);
              }
            } catch (error) {
              console.error(`Error registrando movimiento de stock para producto ${linea.productoId}:`, error);
            }
          }
        }
      }
    }

    // Determinar estado
    const todasRecibidas = albaran.lineas.every(l =>
      l.cantidadRecibida >= l.cantidadPedida || !l.incluidoEnTotal
    );
    const algunaRecibida = albaran.lineas.some(l => l.cantidadRecibida > 0);

    if (dto.incidencias) {
      // Mantener estado actual pero registrar incidencia
    } else if (todasRecibidas) {
      albaran.estado = EstadoAlbaranCompra.RECIBIDO;
    } else if (algunaRecibida) {
      albaran.estado = EstadoAlbaranCompra.RECIBIDO_PARCIAL;
    }

    // Registrar en historial
    albaran.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Recepción registrada',
      descripcion: dto.incidencias
        ? `Recepción con incidencias: ${dto.incidencias}`
        : `Recepción registrada correctamente`,
    });

    // Actualizar pedido de compra origen si existe
    if (albaran.pedidoCompraId) {
      const PedidoCompraModel = await getPedidoCompraModel(String(empresaId), dbConfig);
      const pedido = await PedidoCompraModel.findById(albaran.pedidoCompraId);

      if (pedido) {
        // Actualizar cantidades recibidas en el pedido
        albaran.lineas.forEach(lineaAlbaran => {
          if (lineaAlbaran.lineaPedidoCompraId) {
            const lineaPedido = pedido.lineas.find(
              (lp: any) => lp._id?.toString() === lineaAlbaran.lineaPedidoCompraId?.toString()
            );
            if (lineaPedido) {
              const incremento = (lineaAlbaran.cantidadRecibida || 0) - (cantidadesAnteriores[lineaAlbaran._id?.toString() || ''] || 0);
              (lineaPedido as any).cantidadRecibida = ((lineaPedido as any).cantidadRecibida || 0) + incremento;
              (lineaPedido as any).cantidadPendiente = Math.max(0, (lineaPedido as any).cantidad - (lineaPedido as any).cantidadRecibida);
            }
          }
        });

        // Actualizar estado del pedido
        const todoRecibido = pedido.lineas.every((l: any) => (l.cantidadRecibida || 0) >= l.cantidad);
        const algoRecibido = pedido.lineas.some((l: any) => (l.cantidadRecibida || 0) > 0);

        if (todoRecibido) {
          pedido.estado = 'recibido';
          pedido.fechaRecepcion = new Date();
        } else if (algoRecibido) {
          pedido.estado = 'parcialmente_recibido';
        }

        pedido.historial.push({
          fecha: new Date(),
          usuarioId,
          accion: 'Recepción registrada',
          descripcion: `Recepción del albarán de compra ${albaran.codigo} registrada`,
        });

        await pedido.save();
      }
    }

    albaran.modificadoPor = usuarioId;

    await albaran.save();

    return albaran;
  }

  // ============================================
  // BUSCAR ALBARANES DE COMPRA
  // ============================================

  async buscar(
    searchDto: SearchAlbaranesCompraDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<FindAllResult> {
    const AlbaranCompraModel = await this.getModelo(String(empresaId), dbConfig);

    const {
      search,
      proveedorId,
      almacenId,
      estado,
      estados,
      serie,
      activo = 'true',
      facturado,
      fechaDesde,
      fechaHasta,
      fechaRecepcionDesde,
      fechaRecepcionHasta,
      importeMin,
      importeMax,
      pedidoCompraId,
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
        { referenciaProveedor: { $regex: search, $options: 'i' } },
        { numeroAlbaranProveedor: { $regex: search, $options: 'i' } },
      ];
    }

    if (proveedorId) filtros.proveedorId = new mongoose.Types.ObjectId(proveedorId);
    if (almacenId) filtros.almacenId = new mongoose.Types.ObjectId(almacenId);
    if (pedidoCompraId) filtros.pedidoCompraId = new mongoose.Types.ObjectId(pedidoCompraId);

    if (estado) filtros.estado = estado;
    if (estados) filtros.estado = { $in: estados.split(',') };
    if (serie) filtros.serie = serie;

    if (activo !== 'all') filtros.activo = activo === 'true';
    if (facturado !== undefined) filtros.facturado = facturado === 'true';

    if (fechaDesde || fechaHasta) {
      filtros.fecha = {};
      if (fechaDesde) filtros.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) filtros.fecha.$lte = new Date(fechaHasta);
    }

    if (fechaRecepcionDesde || fechaRecepcionHasta) {
      filtros.fechaRecepcion = {};
      if (fechaRecepcionDesde) filtros.fechaRecepcion.$gte = new Date(fechaRecepcionDesde);
      if (fechaRecepcionHasta) filtros.fechaRecepcion.$lte = new Date(fechaRecepcionHasta);
    }

    if (importeMin || importeMax) {
      filtros['totales.totalAlbaran'] = {};
      if (importeMin) filtros['totales.totalAlbaran'].$gte = Number(importeMin);
      if (importeMax) filtros['totales.totalAlbaran'].$lte = Number(importeMax);
    }

    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim().toLowerCase());
      filtros.tags = { $in: tagsArray };
    }

    // Filtros avanzados
    const allowedAdvancedFields = [
      'estado', 'codigo', 'proveedorNombre', 'titulo', 'serie',
      'activo', 'facturado',
    ];
    const advancedFilters = parseAdvancedFilters(searchDto, allowedAdvancedFields);
    const finalFilter = mergeFilters(filtros, advancedFilters);

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [albaranes, total] = await Promise.all([
      AlbaranCompraModel.find(finalFilter)
        .populate('proveedorId', 'codigo nombre nombreComercial')
        .populate('almacenId', 'codigo nombre')
        .populate('pedidoCompraId', 'codigo')
        .populate('creadoPor', 'nombre email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      AlbaranCompraModel.countDocuments(finalFilter),
    ]);

    return {
      albaranes,
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
  ): Promise<IAlbaranCompra | null> {
    const AlbaranCompraModel = await this.getModelo(String(empresaId), dbConfig);

    return AlbaranCompraModel.findById(id)
      .populate('proveedorId', 'codigo nombre nombreComercial nif cif email telefono direcciones')
      .populate('almacenId', 'codigo nombre direccion')
      .populate('pedidoCompraId', 'codigo estado')
      .populate('facturaId', 'codigo')
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
    dto: UpdateAlbaranCompraDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IAlbaranCompra | null> {
    const AlbaranCompraModel = await this.getModelo(String(empresaId), dbConfig);

    const albaran = await AlbaranCompraModel.findById(id);
    if (!albaran) {
      return null;
    }

    if (albaran.bloqueado) {
      throw new Error('El albarán está bloqueado y no se puede modificar');
    }

    if (albaran.facturado) {
      throw new Error('El albarán ya ha sido facturado y no se puede modificar');
    }

    const estadoAnterior = albaran.estado;

    // Procesar líneas si se envían
    if (dto.lineas) {
      const lineasProcesadas = dto.lineas.map((linea, index) => {
        const lineaConOrden = {
          ...linea,
          orden: linea.orden || index + 1,
          cantidadPedida: linea.cantidadPedida || linea.cantidadRecibida || 0,
          cantidadRecibida: linea.cantidadRecibida || 0,
          esEditable: linea.esEditable !== false,
          incluidoEnTotal: linea.incluidoEnTotal !== false,
        };
        return this.calcularLinea(lineaConOrden);
      });

      const descuentoGlobal = dto.descuentoGlobalPorcentaje ?? albaran.descuentoGlobalPorcentaje;
      const totales = this.calcularTotales(lineasProcesadas, descuentoGlobal);

      albaran.lineas = lineasProcesadas as any;
      albaran.totales = totales as any;
      albaran.descuentoGlobalPorcentaje = descuentoGlobal;
      albaran.descuentoGlobalImporte = totales.totalDescuentos;
    }

    // Actualizar campos
    const camposActualizables = [
      'estado', 'fecha', 'fechaRecepcion', 'fechaPrevistaRecepcion',
      'proveedorId', 'proveedorNombre', 'proveedorNif', 'proveedorEmail', 'proveedorTelefono',
      'datosTransporte', 'almacenId', 'referenciaProveedor', 'numeroAlbaranProveedor',
      'titulo', 'descripcion', 'observaciones', 'observacionesInternas', 'tags',
    ];

    camposActualizables.forEach(campo => {
      if ((dto as any)[campo] !== undefined) {
        (albaran as any)[campo] = (dto as any)[campo];
      }
    });

    if (dto.estado && dto.estado !== estadoAnterior) {
      albaran.historial.push({
        fecha: new Date(),
        usuarioId,
        accion: 'Cambio de estado',
        descripcion: `Estado cambiado de "${estadoAnterior}" a "${dto.estado}"`,
        datosAnteriores: { estado: estadoAnterior },
      });
    }

    albaran.modificadoPor = usuarioId;

    await albaran.save();

    return albaran;
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
    const AlbaranCompraModel = await this.getModelo(String(empresaId), dbConfig);

    const albaran = await AlbaranCompraModel.findById(id);
    if (!albaran) {
      return false;
    }

    if (albaran.facturado) {
      throw new Error('No se puede eliminar un albarán facturado');
    }

    if (albaran.estado === EstadoAlbaranCompra.RECIBIDO) {
      throw new Error('No se puede eliminar un albarán ya recibido');
    }

    // Soft delete
    albaran.activo = false;
    albaran.modificadoPor = usuarioId;
    albaran.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Albarán eliminado',
      descripcion: 'El albarán ha sido marcado como eliminado',
    });

    await albaran.save();

    return true;
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const AlbaranCompraModel = await this.getModelo(String(empresaId), dbConfig);

    const [total, porEstado, totales, ultimoMes] = await Promise.all([
      AlbaranCompraModel.countDocuments({ activo: true }),
      AlbaranCompraModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$estado', count: { $sum: 1 } } },
      ]),
      AlbaranCompraModel.aggregate([
        { $match: { activo: true } },
        {
          $group: {
            _id: null,
            totalImporte: { $sum: '$totales.totalAlbaran' },
            totalFacturado: {
              $sum: { $cond: ['$facturado', '$totales.totalAlbaran', 0] },
            },
            totalPendienteFacturar: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$estado', EstadoAlbaranCompra.RECIBIDO] }, { $eq: ['$facturado', false] }] },
                  '$totales.totalAlbaran',
                  0,
                ],
              },
            },
          },
        },
      ]),
      AlbaranCompraModel.countDocuments({
        activo: true,
        fechaCreacion: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
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
      totalFacturado: totales[0]?.totalFacturado || 0,
      totalPendienteFacturar: totales[0]?.totalPendienteFacturar || 0,
      ultimoMes,
    };
  }

  // ============================================
  // DUPLICAR
  // ============================================

  async duplicar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IAlbaranCompra> {
    const albaran = await this.obtenerPorId(id, empresaId, dbConfig);
    if (!albaran) {
      throw new Error('Albarán de compra no encontrado');
    }

    const createDto: CreateAlbaranCompraDTO = {
      proveedorId: albaran.proveedorId?.toString() || '',
      proveedorNombre: albaran.proveedorNombre,
      proveedorNif: albaran.proveedorNif,
      proveedorEmail: albaran.proveedorEmail,
      proveedorTelefono: albaran.proveedorTelefono,
      almacenId: albaran.almacenId?.toString() || '',
      referenciaProveedor: albaran.referenciaProveedor,
      titulo: albaran.titulo ? `${albaran.titulo} (copia)` : undefined,
      descripcion: albaran.descripcion,
      lineas: albaran.lineas.map((l: any) => ({
        ...l,
        _id: undefined,
        cantidadRecibida: 0,
        cantidadPendiente: l.cantidadPedida,
      })),
      descuentoGlobalPorcentaje: albaran.descuentoGlobalPorcentaje,
      observaciones: albaran.observaciones,
      tags: albaran.tags,
    };

    return this.crear(createDto, empresaId, usuarioId, dbConfig);
  }
}

export const albaranesCompraService = new AlbaranesCompraService();
