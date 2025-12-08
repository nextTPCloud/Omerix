import mongoose, { Model } from 'mongoose';
import { Albaran, IAlbaran, EstadoAlbaran, TipoAlbaran, TipoLinea, ILineaAlbaran } from './Albaran';
import {
  CreateAlbaranDTO,
  UpdateAlbaranDTO,
  SearchAlbaranesDTO,
  RegistrarEntregaDTO,
  CrearDesdePedidoDTO,
} from './albaranes.dto';
import { IDatabaseConfig } from '@/models/Empresa';
import { getAlbaranModel, getPedidoModel, getProductoModel, getClienteModel, getProyectoModel, getAgenteComercialModel, getAlmacenModel, getUserModel } from '@/utils/dynamic-models.helper';
import { EstadoPedido } from '../pedidos/Pedido';

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

export class AlbaranesService {
  /**
   * Obtener modelo de Albaran para una empresa específica
   */
  private async getModeloAlbaran(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IAlbaran>> {
    // Registrar modelos referenciados para que populate funcione
    await Promise.all([
      getClienteModel(empresaId, dbConfig),
      getProyectoModel(empresaId, dbConfig),
      getAgenteComercialModel(empresaId, dbConfig),
      getProductoModel(empresaId, dbConfig),
      getAlmacenModel(empresaId, dbConfig),
      getUserModel(empresaId, dbConfig),
      getPedidoModel(empresaId, dbConfig),
    ]);

    return await getAlbaranModel(empresaId, dbConfig);
  }

  // ============================================
  // CÁLCULOS DE LÍNEAS Y TOTALES
  // ============================================

  /**
   * Calcular importes de una línea
   */
  calcularLinea(linea: Partial<ILineaAlbaran>): ILineaAlbaran {
    const cantidadSolicitada = linea.cantidadSolicitada || 0;
    const cantidadEntregada = linea.cantidadEntregada || 0;
    const precioUnitario = linea.precioUnitario || 0;
    const costeUnitario = linea.costeUnitario || 0;
    const descuento = linea.descuento || 0;
    const iva = linea.iva || 21;

    // Calcular en base a cantidad entregada
    const subtotalBruto = cantidadEntregada * precioUnitario;
    const descuentoImporte = subtotalBruto * (descuento / 100);
    const subtotal = subtotalBruto - descuentoImporte;

    // Calcular IVA
    const ivaImporte = subtotal * (iva / 100);
    const total = subtotal + ivaImporte;

    // Calcular costes
    const costeTotalLinea = cantidadEntregada * costeUnitario;

    // Calcular márgenes
    const margenUnitario = precioUnitario - costeUnitario;
    const margenPorcentaje = costeUnitario > 0
      ? ((precioUnitario - costeUnitario) / costeUnitario) * 100
      : 0;
    const margenTotalLinea = subtotal - costeTotalLinea;

    // Calcular cantidad pendiente
    const cantidadPendiente = Math.max(0, cantidadSolicitada - cantidadEntregada);

    return {
      ...linea,
      cantidadSolicitada,
      cantidadEntregada,
      cantidadPendiente,
      precioUnitario,
      costeUnitario,
      descuento,
      descuentoImporte,
      subtotal,
      iva,
      ivaImporte,
      total,
      costeTotalLinea,
      margenUnitario,
      margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
      margenTotalLinea,
    } as ILineaAlbaran;
  }

  /**
   * Calcular totales del albarán
   */
  calcularTotales(lineas: ILineaAlbaran[], descuentoGlobalPorcentaje: number = 0) {
    let subtotalBruto = 0;
    let totalDescuentos = 0;
    let costeTotalMateriales = 0;
    let costeTotalServicios = 0;
    let costeTotalKits = 0;

    const ivaAgrupado: Record<number, { base: number; cuota: number }> = {};

    for (const linea of lineas) {
      if (!linea.incluidoEnTotal) continue;

      subtotalBruto += linea.cantidadEntregada * linea.precioUnitario;
      totalDescuentos += linea.descuentoImporte;

      // Agrupar IVA
      const tipoIva = linea.iva || 21;
      if (!ivaAgrupado[tipoIva]) {
        ivaAgrupado[tipoIva] = { base: 0, cuota: 0 };
      }
      ivaAgrupado[tipoIva].base += linea.subtotal;
      ivaAgrupado[tipoIva].cuota += linea.ivaImporte;

      // Costes por tipo
      switch (linea.tipo) {
        case TipoLinea.SERVICIO:
          costeTotalServicios += linea.costeTotalLinea;
          break;
        case TipoLinea.KIT:
          costeTotalKits += linea.costeTotalLinea;
          break;
        default:
          costeTotalMateriales += linea.costeTotalLinea;
      }
    }

    // Aplicar descuento global
    const subtotalNeto = subtotalBruto - totalDescuentos;
    const descuentoGlobalImporte = subtotalNeto * (descuentoGlobalPorcentaje / 100);
    const subtotalNetoConDescuento = subtotalNeto - descuentoGlobalImporte;

    // Recalcular IVA si hay descuento global
    const factorDescuento = subtotalNeto > 0 ? subtotalNetoConDescuento / subtotalNeto : 1;
    const desgloseIva = Object.entries(ivaAgrupado).map(([tipo, valores]) => ({
      tipo: Number(tipo),
      base: Math.round(valores.base * factorDescuento * 100) / 100,
      cuota: Math.round(valores.cuota * factorDescuento * 100) / 100,
    }));

    const totalIva = desgloseIva.reduce((sum, item) => sum + item.cuota, 0);
    const totalAlbaran = subtotalNetoConDescuento + totalIva;

    const costeTotal = costeTotalMateriales + costeTotalServicios + costeTotalKits;
    const margenBruto = subtotalNetoConDescuento - costeTotal;
    const margenPorcentaje = costeTotal > 0 ? (margenBruto / costeTotal) * 100 : 0;

    return {
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round((totalDescuentos + descuentoGlobalImporte) * 100) / 100,
      subtotalNeto: Math.round(subtotalNetoConDescuento * 100) / 100,
      desgloseIva,
      totalIva: Math.round(totalIva * 100) / 100,
      totalAlbaran: Math.round(totalAlbaran * 100) / 100,
      costeTotalMateriales: Math.round(costeTotalMateriales * 100) / 100,
      costeTotalServicios: Math.round(costeTotalServicios * 100) / 100,
      costeTotalKits: Math.round(costeTotalKits * 100) / 100,
      costeTotal: Math.round(costeTotal * 100) / 100,
      margenBruto: Math.round(margenBruto * 100) / 100,
      margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
    };
  }

  // ============================================
  // CREAR ALBARÁN
  // ============================================

  async crear(
    createAlbaranDto: CreateAlbaranDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IAlbaran> {
    const AlbaranModel = await this.getModeloAlbaran(String(empresaId), dbConfig);
    const ClienteModel = await getClienteModel(String(empresaId), dbConfig);

    // Generar código
    const serie = createAlbaranDto.serie || 'ALB';
    const año = new Date().getFullYear();

    const ultimoAlbaran = await AlbaranModel.findOne({
      serie,
      codigo: new RegExp(`^${serie}${año}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    let numero = 1;
    if (ultimoAlbaran && ultimoAlbaran.numero) {
      numero = ultimoAlbaran.numero + 1;
    }

    const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

    // Obtener datos del cliente si se proporciona clienteId
    let clienteData: any = {
      clienteNombre: createAlbaranDto.clienteNombre,
      clienteNif: createAlbaranDto.clienteNif,
      clienteEmail: createAlbaranDto.clienteEmail,
      clienteTelefono: createAlbaranDto.clienteTelefono,
    };

    if (createAlbaranDto.clienteId) {
      const cliente = await ClienteModel.findById(createAlbaranDto.clienteId);
      if (cliente) {
        clienteData = {
          clienteNombre: cliente.nombre || cliente.nombreComercial,
          clienteNif: cliente.nif || cliente.cif,
          clienteEmail: cliente.email,
          clienteTelefono: cliente.telefono,
        };
      }
    }

    // Procesar líneas
    let lineasProcesadas: ILineaAlbaran[] = [];
    if (createAlbaranDto.lineas && createAlbaranDto.lineas.length > 0) {
      lineasProcesadas = createAlbaranDto.lineas.map((linea, index) => {
        const lineaConOrden = {
          ...linea,
          orden: linea.orden || index + 1,
          cantidadSolicitada: linea.cantidadSolicitada || linea.cantidadEntregada || 0,
          cantidadEntregada: linea.cantidadEntregada || 0,
          cantidadPendiente: 0,
          esEditable: linea.esEditable !== false,
          incluidoEnTotal: linea.incluidoEnTotal !== false,
          mostrarComponentes: linea.mostrarComponentes !== false,
        };
        return this.calcularLinea(lineaConOrden);
      });
    }

    // Calcular totales
    const descuentoGlobalPorcentaje = createAlbaranDto.descuentoGlobalPorcentaje || 0;
    const totales = this.calcularTotales(lineasProcesadas, descuentoGlobalPorcentaje);

    // Crear albarán
    const albaran = new AlbaranModel({
      _id: new mongoose.Types.ObjectId(),
      codigo,
      serie,
      numero,
      tipo: createAlbaranDto.tipo || TipoAlbaran.VENTA,
      pedidoOrigenId: createAlbaranDto.pedidoOrigenId,
      presupuestoOrigenId: createAlbaranDto.presupuestoOrigenId,
      estado: createAlbaranDto.estado || EstadoAlbaran.BORRADOR,
      fecha: createAlbaranDto.fecha || new Date(),
      fechaVencimiento: createAlbaranDto.fechaVencimiento,
      clienteId: createAlbaranDto.clienteId,
      ...clienteData,
      direccionFacturacion: createAlbaranDto.direccionFacturacion,
      direccionEntrega: createAlbaranDto.direccionEntrega,
      datosTransporte: createAlbaranDto.datosTransporte,
      datosEntrega: createAlbaranDto.datosEntrega,
      bultos: createAlbaranDto.bultos,
      proyectoId: createAlbaranDto.proyectoId,
      almacenId: createAlbaranDto.almacenId,
      agenteComercialId: createAlbaranDto.agenteComercialId,
      referenciaCliente: createAlbaranDto.referenciaCliente,
      pedidoCliente: createAlbaranDto.pedidoCliente,
      titulo: createAlbaranDto.titulo,
      descripcion: createAlbaranDto.descripcion,
      lineas: lineasProcesadas,
      totales,
      descuentoGlobalPorcentaje,
      descuentoGlobalImporte: totales.totalDescuentos,
      observaciones: createAlbaranDto.observaciones,
      observacionesInternas: createAlbaranDto.observacionesInternas,
      condicionesEntrega: createAlbaranDto.condicionesEntrega,
      tags: createAlbaranDto.tags,
      mostrarCostes: createAlbaranDto.mostrarCostes !== false,
      mostrarMargenes: createAlbaranDto.mostrarMargenes !== false,
      mostrarComponentesKit: createAlbaranDto.mostrarComponentesKit !== false,
      mostrarPrecios: createAlbaranDto.mostrarPrecios !== false,
      creadoPor: usuarioId,
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Albarán creado',
        descripcion: `Albarán ${codigo} creado`,
      }],
    });

    await albaran.save();

    return albaran;
  }

  // ============================================
  // CREAR DESDE PEDIDO
  // ============================================

  async crearDesdePedido(
    pedidoId: string,
    dto: CrearDesdePedidoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IAlbaran> {
    const PedidoModel = await getPedidoModel(String(empresaId), dbConfig);
    const pedido = await PedidoModel.findById(pedidoId);

    if (!pedido) {
      throw new Error('Pedido no encontrado');
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
      const cantidadPendiente = lineaPedido.cantidadPendiente || (lineaPedido.cantidad - (lineaPedido.cantidadServida || 0));
      const cantidadAEntregar = dto.entregarTodo ? cantidadPendiente : 0;

      return {
        orden: index + 1,
        tipo: lineaPedido.tipo,
        productoId: lineaPedido.productoId,
        codigo: lineaPedido.codigo,
        nombre: lineaPedido.nombre,
        descripcion: lineaPedido.descripcion,
        descripcionLarga: lineaPedido.descripcionLarga,
        sku: lineaPedido.sku,
        variante: lineaPedido.variante,
        cantidadSolicitada: cantidadPendiente,
        cantidadEntregada: cantidadAEntregar,
        unidad: lineaPedido.unidad,
        precioUnitario: lineaPedido.precioUnitario,
        descuento: lineaPedido.descuento,
        iva: lineaPedido.iva,
        costeUnitario: lineaPedido.costeUnitario,
        componentesKit: lineaPedido.componentesKit,
        mostrarComponentes: lineaPedido.mostrarComponentes,
        esEditable: true,
        incluidoEnTotal: lineaPedido.incluidoEnTotal,
        lineaPedidoId: lineaPedido._id,
        notasInternas: lineaPedido.notasInternas,
      };
    });

    // Crear el albarán
    const albaran = await this.crear({
      tipo: TipoAlbaran.VENTA,
      pedidoOrigenId: pedidoId,
      presupuestoOrigenId: pedido.presupuestoOrigenId?.toString(),
      clienteId: pedido.clienteId.toString(),
      clienteNombre: pedido.clienteNombre,
      clienteNif: pedido.clienteNif,
      clienteEmail: pedido.clienteEmail,
      clienteTelefono: pedido.clienteTelefono,
      direccionFacturacion: pedido.direccionFacturacion,
      direccionEntrega: pedido.direccionEntrega || dto.direccionEntrega,
      proyectoId: pedido.proyectoId?.toString(),
      agenteComercialId: pedido.agenteComercialId?.toString(),
      almacenId: dto.almacenId,
      referenciaCliente: pedido.referenciaCliente,
      pedidoCliente: pedido.pedidoCliente,
      titulo: pedido.titulo,
      descripcion: pedido.descripcion,
      lineas: lineas as any,
      descuentoGlobalPorcentaje: pedido.descuentoGlobalPorcentaje,
      observaciones: pedido.observaciones,
      mostrarCostes: pedido.mostrarCostes,
      mostrarMargenes: pedido.mostrarMargenes,
      mostrarComponentesKit: pedido.mostrarComponentesKit,
      datosTransporte: dto.datosTransporte,
      datosEntrega: {
        fechaProgramada: dto.fechaEntregaProgramada,
      },
    }, empresaId, usuarioId, dbConfig);

    // Registrar en historial del pedido
    pedido.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Albarán generado',
      descripcion: `Se ha generado el albarán ${albaran.codigo}`,
    });
    await pedido.save();

    return albaran;
  }

  // ============================================
  // ACTUALIZAR ALBARÁN
  // ============================================

  async actualizar(
    id: string,
    updateAlbaranDto: UpdateAlbaranDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IAlbaran | null> {
    const AlbaranModel = await this.getModeloAlbaran(String(empresaId), dbConfig);

    const albaran = await AlbaranModel.findById(id);
    if (!albaran) {
      return null;
    }

    if (albaran.bloqueado) {
      throw new Error('El albarán está bloqueado y no se puede modificar');
    }

    if (albaran.facturado) {
      throw new Error('El albarán ya ha sido facturado y no se puede modificar');
    }

    // Guardar estado anterior para historial
    const estadoAnterior = albaran.estado;

    // Procesar líneas si se envían
    if (updateAlbaranDto.lineas) {
      const lineasProcesadas = updateAlbaranDto.lineas.map((linea, index) => {
        const lineaConOrden = {
          ...linea,
          orden: linea.orden || index + 1,
          cantidadSolicitada: linea.cantidadSolicitada || linea.cantidadEntregada || 0,
          cantidadEntregada: linea.cantidadEntregada || 0,
          esEditable: linea.esEditable !== false,
          incluidoEnTotal: linea.incluidoEnTotal !== false,
          mostrarComponentes: linea.mostrarComponentes !== false,
        };
        return this.calcularLinea(lineaConOrden);
      });

      const descuentoGlobal = updateAlbaranDto.descuentoGlobalPorcentaje ?? albaran.descuentoGlobalPorcentaje;
      const totales = this.calcularTotales(lineasProcesadas, descuentoGlobal);

      albaran.lineas = lineasProcesadas as any;
      albaran.totales = totales as any;
      albaran.descuentoGlobalPorcentaje = descuentoGlobal;
      albaran.descuentoGlobalImporte = totales.totalDescuentos;
    }

    // Actualizar campos
    const camposActualizables = [
      'tipo', 'estado', 'fecha', 'fechaVencimiento',
      'clienteId', 'clienteNombre', 'clienteNif', 'clienteEmail', 'clienteTelefono',
      'direccionFacturacion', 'direccionEntrega', 'datosTransporte', 'datosEntrega', 'bultos',
      'proyectoId', 'almacenId', 'agenteComercialId',
      'referenciaCliente', 'pedidoCliente', 'titulo', 'descripcion',
      'observaciones', 'observacionesInternas', 'condicionesEntrega',
      'tags', 'mostrarCostes', 'mostrarMargenes', 'mostrarComponentesKit', 'mostrarPrecios',
    ];

    camposActualizables.forEach(campo => {
      if ((updateAlbaranDto as any)[campo] !== undefined) {
        (albaran as any)[campo] = (updateAlbaranDto as any)[campo];
      }
    });

    // Registrar cambio de estado en historial
    if (updateAlbaranDto.estado && updateAlbaranDto.estado !== estadoAnterior) {
      albaran.historial.push({
        fecha: new Date(),
        usuarioId,
        accion: 'Cambio de estado',
        descripcion: `Estado cambiado de "${estadoAnterior}" a "${updateAlbaranDto.estado}"`,
        datosAnteriores: { estado: estadoAnterior },
      });
    }

    albaran.modificadoPor = usuarioId;
    albaran.fechaModificacion = new Date();

    await albaran.save();

    return albaran;
  }

  // ============================================
  // REGISTRAR ENTREGA
  // ============================================

  async registrarEntrega(
    id: string,
    dto: RegistrarEntregaDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IAlbaran | null> {
    const AlbaranModel = await this.getModeloAlbaran(String(empresaId), dbConfig);

    const albaran = await AlbaranModel.findById(id);
    if (!albaran) {
      return null;
    }

    // Actualizar datos de entrega
    albaran.datosEntrega = {
      ...albaran.datosEntrega,
      fechaEntrega: dto.fechaEntrega || new Date(),
      horaEntrega: dto.horaEntrega,
      receptorNombre: dto.receptorNombre,
      receptorDni: dto.receptorDni,
      firmaDigital: dto.firmaDigital,
      observacionesEntrega: dto.observaciones,
      fotosEntrega: dto.fotosEntrega,
      incidencias: dto.incidencias,
    };

    // Actualizar cantidades entregadas si se especifican
    if (dto.lineasEntregadas && dto.lineasEntregadas.length > 0) {
      dto.lineasEntregadas.forEach(lineaDto => {
        const linea = albaran.lineas.find(l => l._id?.toString() === lineaDto.lineaId);
        if (linea) {
          linea.cantidadEntregada = lineaDto.cantidadEntregada;
          linea.lote = lineaDto.lote;
          linea.numeroSerie = lineaDto.numeroSerie;
          linea.notasEntrega = lineaDto.observaciones;
        }
      });

      // Recalcular líneas y totales
      albaran.lineas = albaran.lineas.map(linea => this.calcularLinea(linea as any)) as any;
      albaran.totales = this.calcularTotales(albaran.lineas as any, albaran.descuentoGlobalPorcentaje) as any;
    }

    // Determinar estado según entrega
    const todasEntregadas = albaran.lineas.every(l =>
      l.cantidadEntregada >= l.cantidadSolicitada || !l.incluidoEnTotal
    );
    const algunaEntregada = albaran.lineas.some(l => l.cantidadEntregada > 0);

    if (dto.incidencias) {
      albaran.estado = EstadoAlbaran.RECHAZADO;
    } else if (todasEntregadas) {
      albaran.estado = EstadoAlbaran.ENTREGADO;
    } else if (algunaEntregada) {
      albaran.estado = EstadoAlbaran.ENTREGA_PARCIAL;
    }

    // Registrar en historial
    albaran.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Entrega registrada',
      descripcion: dto.incidencias
        ? `Entrega con incidencias: ${dto.incidencias}`
        : `Entrega registrada. Receptor: ${dto.receptorNombre || 'No especificado'}`,
    });

    // Actualizar pedido origen si existe
    if (albaran.pedidoOrigenId) {
      const PedidoModel = await getPedidoModel(String(empresaId), dbConfig);
      const pedido = await PedidoModel.findById(albaran.pedidoOrigenId);

      if (pedido) {
        // Actualizar cantidades servidas en el pedido
        albaran.lineas.forEach(lineaAlbaran => {
          if (lineaAlbaran.lineaPedidoId) {
            const lineaPedido = pedido.lineas.find(
              (lp: any) => lp._id?.toString() === lineaAlbaran.lineaPedidoId?.toString()
            );
            if (lineaPedido) {
              (lineaPedido as any).cantidadServida = ((lineaPedido as any).cantidadServida || 0) + lineaAlbaran.cantidadEntregada;
              (lineaPedido as any).cantidadPendiente = Math.max(0, (lineaPedido as any).cantidad - (lineaPedido as any).cantidadServida);
            }
          }
        });

        // Actualizar estado del pedido
        const todoServido = pedido.lineas.every((l: any) => (l.cantidadServida || 0) >= l.cantidad);
        const algoServido = pedido.lineas.some((l: any) => (l.cantidadServida || 0) > 0);

        if (todoServido) {
          pedido.estado = EstadoPedido.SERVIDO;
          pedido.fechaEntregaReal = new Date();
        } else if (algoServido) {
          pedido.estado = EstadoPedido.PARCIALMENTE_SERVIDO;
        }

        pedido.historial.push({
          fecha: new Date(),
          usuarioId,
          accion: 'Entrega recibida',
          descripcion: `Entrega del albarán ${albaran.codigo} registrada`,
        });

        await pedido.save();
      }
    }

    albaran.modificadoPor = usuarioId;
    albaran.fechaModificacion = new Date();

    await albaran.save();

    return albaran;
  }

  // ============================================
  // BUSCAR ALBARANES
  // ============================================

  async buscar(
    searchDto: SearchAlbaranesDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<FindAllResult> {
    const AlbaranModel = await this.getModeloAlbaran(String(empresaId), dbConfig);

    const {
      search,
      clienteId,
      proyectoId,
      agenteComercialId,
      almacenId,
      estado,
      estados,
      tipo,
      serie,
      activo = 'true',
      facturado,
      fechaDesde,
      fechaHasta,
      fechaEntregaDesde,
      fechaEntregaHasta,
      importeMin,
      importeMax,
      pedidoOrigenId,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'fecha',
      sortOrder = 'desc',
    } = searchDto;

    // Construir filtros
    const filtros: any = {};

    if (search) {
      filtros.$or = [
        { codigo: { $regex: search, $options: 'i' } },
        { clienteNombre: { $regex: search, $options: 'i' } },
        { titulo: { $regex: search, $options: 'i' } },
        { referenciaCliente: { $regex: search, $options: 'i' } },
        { 'datosTransporte.numeroSeguimiento': { $regex: search, $options: 'i' } },
      ];
    }

    if (clienteId) filtros.clienteId = new mongoose.Types.ObjectId(clienteId);
    if (proyectoId) filtros.proyectoId = new mongoose.Types.ObjectId(proyectoId);
    if (agenteComercialId) filtros.agenteComercialId = new mongoose.Types.ObjectId(agenteComercialId);
    if (almacenId) filtros.almacenId = new mongoose.Types.ObjectId(almacenId);
    if (pedidoOrigenId) filtros.pedidoOrigenId = new mongoose.Types.ObjectId(pedidoOrigenId);

    if (estado) filtros.estado = estado;
    if (estados) filtros.estado = { $in: estados.split(',') };
    if (tipo) filtros.tipo = tipo;
    if (serie) filtros.serie = serie;

    if (activo !== 'all') filtros.activo = activo === 'true';
    if (facturado !== undefined) filtros.facturado = facturado === 'true';

    if (fechaDesde || fechaHasta) {
      filtros.fecha = {};
      if (fechaDesde) filtros.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) filtros.fecha.$lte = new Date(fechaHasta);
    }

    if (fechaEntregaDesde || fechaEntregaHasta) {
      filtros['datosEntrega.fechaProgramada'] = {};
      if (fechaEntregaDesde) filtros['datosEntrega.fechaProgramada'].$gte = new Date(fechaEntregaDesde);
      if (fechaEntregaHasta) filtros['datosEntrega.fechaProgramada'].$lte = new Date(fechaEntregaHasta);
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

    // Ejecutar consulta
    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [albaranes, total] = await Promise.all([
      AlbaranModel.find(filtros)
        .populate('clienteId', 'codigo nombre nombreComercial')
        .populate('proyectoId', 'codigo nombre')
        .populate('agenteComercialId', 'codigo nombre apellidos')
        .populate('almacenId', 'codigo nombre')
        .populate('pedidoOrigenId', 'codigo')
        .populate('creadoPor', 'nombre email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      AlbaranModel.countDocuments(filtros),
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
  ): Promise<IAlbaran | null> {
    const AlbaranModel = await this.getModeloAlbaran(String(empresaId), dbConfig);

    return AlbaranModel.findById(id)
      .populate('clienteId', 'codigo nombre nombreComercial nif cif email telefono direcciones')
      .populate('proyectoId', 'codigo nombre')
      .populate('agenteComercialId', 'codigo nombre apellidos email telefono')
      .populate('almacenId', 'codigo nombre direccion')
      .populate('pedidoOrigenId', 'codigo estado')
      .populate('presupuestoOrigenId', 'codigo')
      .populate('facturaId', 'codigo')
      .populate('creadoPor', 'nombre email')
      .populate('modificadoPor', 'nombre email')
      .populate('historial.usuarioId', 'nombre email')
      .lean();
  }

  // ============================================
  // ELIMINAR ALBARÁN
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const AlbaranModel = await this.getModeloAlbaran(String(empresaId), dbConfig);

    const albaran = await AlbaranModel.findById(id);
    if (!albaran) {
      return false;
    }

    if (albaran.facturado) {
      throw new Error('No se puede eliminar un albarán facturado');
    }

    if (albaran.estado === EstadoAlbaran.ENTREGADO) {
      throw new Error('No se puede eliminar un albarán ya entregado');
    }

    // Soft delete
    albaran.activo = false;
    albaran.modificadoPor = usuarioId;
    albaran.fechaModificacion = new Date();
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
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(
    id: string,
    nuevoEstado: EstadoAlbaran,
    observaciones: string | undefined,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IAlbaran | null> {
    const AlbaranModel = await this.getModeloAlbaran(String(empresaId), dbConfig);

    const albaran = await AlbaranModel.findById(id);
    if (!albaran) {
      return null;
    }

    const estadoAnterior = albaran.estado;

    // Validar transiciones de estado
    const transicionesValidas: Record<EstadoAlbaran, EstadoAlbaran[]> = {
      [EstadoAlbaran.BORRADOR]: [EstadoAlbaran.PENDIENTE_ENTREGA, EstadoAlbaran.ANULADO],
      [EstadoAlbaran.PENDIENTE_ENTREGA]: [EstadoAlbaran.EN_TRANSITO, EstadoAlbaran.ENTREGADO, EstadoAlbaran.ANULADO],
      [EstadoAlbaran.EN_TRANSITO]: [EstadoAlbaran.ENTREGADO, EstadoAlbaran.ENTREGA_PARCIAL, EstadoAlbaran.RECHAZADO],
      [EstadoAlbaran.ENTREGA_PARCIAL]: [EstadoAlbaran.EN_TRANSITO, EstadoAlbaran.ENTREGADO],
      [EstadoAlbaran.ENTREGADO]: [EstadoAlbaran.FACTURADO],
      [EstadoAlbaran.RECHAZADO]: [EstadoAlbaran.PENDIENTE_ENTREGA, EstadoAlbaran.ANULADO],
      [EstadoAlbaran.FACTURADO]: [],
      [EstadoAlbaran.ANULADO]: [],
    };

    if (!transicionesValidas[estadoAnterior]?.includes(nuevoEstado)) {
      throw new Error(`No se puede cambiar de estado "${estadoAnterior}" a "${nuevoEstado}"`);
    }

    albaran.estado = nuevoEstado;
    albaran.modificadoPor = usuarioId;
    albaran.fechaModificacion = new Date();

    albaran.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Cambio de estado',
      descripcion: observaciones || `Estado cambiado de "${estadoAnterior}" a "${nuevoEstado}"`,
      datosAnteriores: { estado: estadoAnterior },
    });

    await albaran.save();

    return albaran;
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const AlbaranModel = await this.getModeloAlbaran(String(empresaId), dbConfig);

    const [
      total,
      porEstado,
      porTipo,
      totales,
      ultimoMes,
    ] = await Promise.all([
      AlbaranModel.countDocuments({ activo: true }),
      AlbaranModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$estado', count: { $sum: 1 } } },
      ]),
      AlbaranModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$tipo', count: { $sum: 1 } } },
      ]),
      AlbaranModel.aggregate([
        { $match: { activo: true } },
        {
          $group: {
            _id: null,
            totalImporte: { $sum: '$totales.totalAlbaran' },
            totalFacturado: {
              $sum: {
                $cond: ['$facturado', '$totales.totalAlbaran', 0],
              },
            },
            totalPendienteFacturar: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$estado', EstadoAlbaran.ENTREGADO] }, { $eq: ['$facturado', false] }] },
                  '$totales.totalAlbaran',
                  0,
                ],
              },
            },
          },
        },
      ]),
      AlbaranModel.countDocuments({
        activo: true,
        fechaCreacion: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const estadisticasPorEstado: Record<string, number> = {};
    porEstado.forEach((item: any) => {
      estadisticasPorEstado[item._id] = item.count;
    });

    const estadisticasPorTipo: Record<string, number> = {};
    porTipo.forEach((item: any) => {
      estadisticasPorTipo[item._id] = item.count;
    });

    return {
      total,
      porEstado: estadisticasPorEstado,
      porTipo: estadisticasPorTipo,
      totalImporte: totales[0]?.totalImporte || 0,
      totalFacturado: totales[0]?.totalFacturado || 0,
      totalPendienteFacturar: totales[0]?.totalPendienteFacturar || 0,
      ultimoMes,
    };
  }

  // ============================================
  // DUPLICAR ALBARÁN
  // ============================================

  async duplicar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IAlbaran> {
    const albaran = await this.obtenerPorId(id, empresaId, dbConfig);
    if (!albaran) {
      throw new Error('Albarán no encontrado');
    }

    // Crear DTO para nuevo albarán
    const createDto: CreateAlbaranDTO = {
      tipo: albaran.tipo,
      clienteId: albaran.clienteId?.toString() || '',
      clienteNombre: albaran.clienteNombre,
      clienteNif: albaran.clienteNif,
      clienteEmail: albaran.clienteEmail,
      clienteTelefono: albaran.clienteTelefono,
      direccionFacturacion: albaran.direccionFacturacion,
      direccionEntrega: albaran.direccionEntrega,
      proyectoId: albaran.proyectoId?.toString(),
      almacenId: albaran.almacenId?.toString(),
      agenteComercialId: albaran.agenteComercialId?.toString(),
      titulo: albaran.titulo ? `${albaran.titulo} (copia)` : undefined,
      descripcion: albaran.descripcion,
      lineas: albaran.lineas.map((l: any) => ({
        ...l,
        _id: undefined,
        cantidadEntregada: 0, // Reset cantidades
        cantidadPendiente: l.cantidadSolicitada,
      })),
      descuentoGlobalPorcentaje: albaran.descuentoGlobalPorcentaje,
      observaciones: albaran.observaciones,
      mostrarCostes: albaran.mostrarCostes,
      mostrarMargenes: albaran.mostrarMargenes,
      mostrarComponentesKit: albaran.mostrarComponentesKit,
      mostrarPrecios: albaran.mostrarPrecios,
      tags: albaran.tags,
    };

    return this.crear(createDto, empresaId, usuarioId, dbConfig);
  }

  // ============================================
  // OBTENER ALBARANES DE UN PEDIDO
  // ============================================

  async obtenerAlbaranesDePedido(
    pedidoId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IAlbaran[]> {
    const AlbaranModel = await this.getModeloAlbaran(String(empresaId), dbConfig);

    return AlbaranModel.find({
      pedidoOrigenId: new mongoose.Types.ObjectId(pedidoId),
      activo: true,
    })
      .sort({ fecha: -1 })
      .lean();
  }
}

export const albaranesService = new AlbaranesService();
