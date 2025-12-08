import mongoose, { Model } from 'mongoose';
import { Pedido, IPedido, EstadoPedido, Prioridad, TipoLinea, ILineaPedido } from './Pedido';
import {
  CreatePedidoDTO,
  UpdatePedidoDTO,
  SearchPedidosDTO,
  AplicarMargenDTO,
  ImportarLineasDTO,
  DuplicarPedidoDTO,
  CrearDesdePresupuestoDTO,
} from './pedidos.dto';
import { IDatabaseConfig } from '@/models/Empresa';
import { getPedidoModel, getPresupuestoModel, getProductoModel, getClienteModel, getProyectoModel, getAgenteComercialModel, getFormaPagoModel, getTerminoPagoModel, getUserModel } from '@/utils/dynamic-models.helper';
import Empresa from '@/models/Empresa';
import { empresaService } from '../empresa/empresa.service';
import { EstadoPresupuesto } from '../presupuestos/Presupuesto';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  pedidos: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PedidosService {
  /**
   * Obtener modelo de Pedido para una empresa específica
   * También registra los modelos referenciados para que populate funcione
   */
  private async getModeloPedido(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IPedido>> {
    // Registrar primero los modelos referenciados para que populate funcione
    await Promise.all([
      getClienteModel(empresaId, dbConfig),
      getProyectoModel(empresaId, dbConfig),
      getAgenteComercialModel(empresaId, dbConfig),
      getProductoModel(empresaId, dbConfig),
      getFormaPagoModel(empresaId, dbConfig),
      getTerminoPagoModel(empresaId, dbConfig),
      getUserModel(empresaId, dbConfig),
      getPresupuestoModel(empresaId, dbConfig),
    ]);

    return await getPedidoModel(empresaId, dbConfig);
  }

  // ============================================
  // CÁLCULOS DE LÍNEAS Y TOTALES
  // ============================================

  /**
   * Calcular importes de una línea
   */
  calcularLinea(linea: Partial<ILineaPedido>): ILineaPedido {
    const cantidad = linea.cantidad || 0;
    const precioUnitario = linea.precioUnitario || 0;
    const costeUnitario = linea.costeUnitario || 0;
    const descuento = linea.descuento || 0;
    const iva = linea.iva || 21;
    const cantidadServida = linea.cantidadServida || 0;

    // Calcular subtotal (cantidad * precio - descuento)
    const subtotalBruto = cantidad * precioUnitario;
    const descuentoImporte = subtotalBruto * (descuento / 100);
    const subtotal = subtotalBruto - descuentoImporte;

    // Calcular IVA
    const ivaImporte = subtotal * (iva / 100);
    const total = subtotal + ivaImporte;

    // Calcular costes
    const costeTotalLinea = cantidad * costeUnitario;

    // Calcular márgenes
    const margenUnitario = precioUnitario - costeUnitario;
    const margenPorcentaje = costeUnitario > 0
      ? ((precioUnitario - costeUnitario) / costeUnitario) * 100
      : 0;
    const margenTotalLinea = subtotal - costeTotalLinea;

    // Calcular cantidad pendiente
    const cantidadPendiente = Math.max(0, cantidad - cantidadServida);

    return {
      ...linea,
      cantidad,
      cantidadServida,
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
    } as ILineaPedido;
  }

  /**
   * Calcular totales del pedido
   */
  calcularTotales(lineas: ILineaPedido[], descuentoGlobalPorcentaje: number = 0) {
    let subtotalBruto = 0;
    let totalDescuentos = 0;
    let costeTotalMateriales = 0;
    let costeTotalServicios = 0;
    let costeTotalKits = 0;

    const ivaAgrupado: Record<number, { base: number; cuota: number }> = {};

    for (const linea of lineas) {
      if (!linea.incluidoEnTotal) continue;

      subtotalBruto += linea.cantidad * linea.precioUnitario;
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

    // Recalcular IVA si hay descuento global (proporcionalmente)
    const factorDescuento = subtotalNeto > 0 ? subtotalNetoConDescuento / subtotalNeto : 1;
    const desgloseIva = Object.entries(ivaAgrupado).map(([tipo, valores]) => ({
      tipo: Number(tipo),
      base: Math.round(valores.base * factorDescuento * 100) / 100,
      cuota: Math.round(valores.cuota * factorDescuento * 100) / 100,
    }));

    const totalIva = desgloseIva.reduce((sum, item) => sum + item.cuota, 0);
    const totalPedido = subtotalNetoConDescuento + totalIva;

    const costeTotal = costeTotalMateriales + costeTotalServicios + costeTotalKits;
    const margenBruto = subtotalNetoConDescuento - costeTotal;
    const margenPorcentaje = costeTotal > 0 ? (margenBruto / costeTotal) * 100 : 0;

    return {
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round((totalDescuentos + descuentoGlobalImporte) * 100) / 100,
      subtotalNeto: Math.round(subtotalNetoConDescuento * 100) / 100,
      desgloseIva,
      totalIva: Math.round(totalIva * 100) / 100,
      totalPedido: Math.round(totalPedido * 100) / 100,
      costeTotalMateriales: Math.round(costeTotalMateriales * 100) / 100,
      costeTotalServicios: Math.round(costeTotalServicios * 100) / 100,
      costeTotalKits: Math.round(costeTotalKits * 100) / 100,
      costeTotal: Math.round(costeTotal * 100) / 100,
      margenBruto: Math.round(margenBruto * 100) / 100,
      margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
    };
  }

  // ============================================
  // CREAR PEDIDO
  // ============================================

  async crear(
    createPedidoDto: CreatePedidoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPedido> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);
    const ClienteModel = await getClienteModel(String(empresaId), dbConfig);

    // Generar código y número automáticamente
    const serie = createPedidoDto.serie || 'PV';
    const { codigo, numero } = await this.generarCodigoNumero(PedidoModel, serie);

    // Obtener datos del cliente para aplicar descuentos
    let descuentoGlobal = createPedidoDto.descuentoGlobalPorcentaje || 0;
    let lineas = createPedidoDto.lineas || [];

    if (createPedidoDto.clienteId) {
      const cliente = await ClienteModel.findById(createPedidoDto.clienteId).lean();

      if (cliente && cliente.aplicarDescuentoAutomatico !== false) {
        // Aplicar descuento general del cliente si no se especifica uno
        if (cliente.descuentoGeneral && !createPedidoDto.descuentoGlobalPorcentaje) {
          descuentoGlobal = cliente.descuentoGeneral;
        }

        // Aplicar descuentos por familia de productos a las líneas
        if (cliente.descuentosPorFamilia && cliente.descuentosPorFamilia.length > 0) {
          const ProductoModel = await getProductoModel(String(empresaId), dbConfig);

          // Obtener las familias de los productos en las líneas
          const productosIds = lineas
            .filter(l => l.productoId)
            .map(l => new mongoose.Types.ObjectId(l.productoId!));

          if (productosIds.length > 0) {
            const productos = await ProductoModel.find({
              _id: { $in: productosIds },
            }).select('_id familiaId').lean();

            const productoFamiliaMap = new Map<string, string>();
            productos.forEach((p: any) => {
              if (p.familiaId) {
                productoFamiliaMap.set(p._id.toString(), p.familiaId.toString());
              }
            });

            // Aplicar descuentos por familia
            lineas = lineas.map(linea => {
              if (linea.productoId && linea.descuento === undefined) {
                const familiaId = productoFamiliaMap.get(linea.productoId);
                if (familiaId) {
                  const descuentoFamilia = (cliente.descuentosPorFamilia || []).find(
                    (df: any) => df.familiaId.toString() === familiaId
                  );
                  if (descuentoFamilia) {
                    return { ...linea, descuento: descuentoFamilia.descuento };
                  }
                }
              }
              return linea;
            });
          }
        }
      }
    }

    // Calcular líneas
    const lineasCalculadas = lineas.map((linea, index) =>
      this.calcularLinea({ ...linea, orden: linea.orden ?? index })
    );

    // Calcular totales
    const totales = this.calcularTotales(
      lineasCalculadas,
      descuentoGlobal
    );

    // Fecha
    const fecha = createPedidoDto.fecha ? new Date(createPedidoDto.fecha) : new Date();

    const pedidoData = {
      ...createPedidoDto,
      codigo,
      serie,
      numero,
      lineas: lineasCalculadas,
      totales,
      fecha,
      prioridad: createPedidoDto.prioridad || Prioridad.MEDIA,
      descuentoGlobalPorcentaje: descuentoGlobal,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Creación',
        descripcion: descuentoGlobal > 0
          ? `Pedido creado con ${descuentoGlobal}% de descuento aplicado`
          : 'Pedido creado',
      }],
    };

    const pedido = new PedidoModel(pedidoData);
    await pedido.save();

    return pedido;
  }

  /**
   * Generar código y número para nuevo pedido
   */
  private async generarCodigoNumero(
    PedidoModel: mongoose.Model<IPedido>,
    serie: string = 'PV'
  ): Promise<{ codigo: string; numero: number }> {
    const año = new Date().getFullYear();

    const ultimoPedido = await PedidoModel.findOne({
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

  // ============================================
  // CREAR DESDE PRESUPUESTO
  // ============================================

  async crearDesdePresupuesto(
    presupuestoId: string,
    opciones: CrearDesdePresupuestoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPedido> {
    const PresupuestoModel = await getPresupuestoModel(String(empresaId), dbConfig);
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    const presupuesto = await PresupuestoModel.findById(presupuestoId).lean();
    if (!presupuesto) {
      throw new Error('Presupuesto no encontrado');
    }

    // Generar código
    const serie = 'PV';
    const { codigo, numero } = await this.generarCodigoNumero(PedidoModel, serie);

    // Copiar líneas del presupuesto
    const lineas = (presupuesto.lineas || []).map((linea: any, index: number) => {
      const nuevaLinea = { ...linea };
      delete nuevaLinea._id;
      nuevaLinea.orden = index;
      nuevaLinea.cantidadServida = 0;
      nuevaLinea.cantidadPendiente = linea.cantidad || 0;
      return this.calcularLinea(nuevaLinea);
    });

    // Calcular totales
    const totales = this.calcularTotales(lineas, presupuesto.descuentoGlobalPorcentaje || 0);

    // Copiar notas de seguimiento si se solicita
    let notasSeguimiento: any[] = [];
    if (opciones.copiarNotas && presupuesto.notasSeguimiento?.length) {
      notasSeguimiento = presupuesto.notasSeguimiento.map((nota: any) => ({
        ...nota,
        _id: new mongoose.Types.ObjectId(),
      }));
    }

    const pedidoData = {
      codigo,
      serie,
      numero,
      estado: EstadoPedido.BORRADOR,
      prioridad: opciones.prioridad || Prioridad.MEDIA,
      fecha: new Date(),
      fechaEntregaComprometida: opciones.fechaEntregaComprometida
        ? new Date(opciones.fechaEntregaComprometida)
        : undefined,

      // Origen
      presupuestoOrigenId: presupuesto._id,

      // Cliente
      clienteId: presupuesto.clienteId,
      clienteNombre: presupuesto.clienteNombre,
      clienteNif: presupuesto.clienteNif,
      clienteEmail: presupuesto.clienteEmail,
      clienteTelefono: presupuesto.clienteTelefono,

      // Direcciones
      direccionFacturacion: presupuesto.direccionEntrega,
      direccionEntrega: presupuesto.direccionEntrega,

      // Relaciones
      proyectoId: presupuesto.proyectoId,
      agenteComercialId: presupuesto.agenteComercialId,

      // Referencias
      referenciaCliente: presupuesto.referenciaCliente,

      // Contenido
      titulo: presupuesto.titulo,
      descripcion: presupuesto.descripcion,
      lineas,
      condiciones: presupuesto.condiciones,
      totales,

      // Descuentos
      descuentoGlobalPorcentaje: presupuesto.descuentoGlobalPorcentaje || 0,
      descuentoGlobalImporte: presupuesto.descuentoGlobalImporte || 0,

      // Textos
      introduccion: presupuesto.introduccion,
      piePagina: presupuesto.piePagina,
      condicionesLegales: presupuesto.condicionesLegales,
      observaciones: presupuesto.observaciones,

      // Tags
      tags: presupuesto.tags,

      // Seguimiento
      notasSeguimiento,
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Creación desde presupuesto',
        descripcion: `Pedido creado desde presupuesto ${presupuesto.codigo}`,
      }],

      // Configuración
      mostrarCostes: presupuesto.mostrarCostes ?? true,
      mostrarMargenes: presupuesto.mostrarMargenes ?? true,
      mostrarComponentesKit: presupuesto.mostrarComponentesKit ?? true,

      // Auditoría
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
      activo: true,
    };

    const pedido = new PedidoModel(pedidoData);
    await pedido.save();

    // Actualizar estado del presupuesto a convertido
    await PresupuestoModel.findByIdAndUpdate(presupuestoId, {
      estado: EstadoPresupuesto.CONVERTIDO,
      convertidoA: {
        tipo: 'pedido',
        documentoId: pedido._id,
        fecha: new Date(),
      },
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
      $push: {
        historial: {
          fecha: new Date(),
          usuarioId,
          accion: 'Convertido a pedido',
          descripcion: `Presupuesto convertido a pedido ${pedido.codigo}`,
        },
      },
    });

    return pedido;
  }

  // ============================================
  // OBTENER TODOS CON FILTROS Y PAGINACIÓN
  // ============================================

  async findAll(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    query: Partial<SearchPedidosDTO>
  ): Promise<FindAllResult> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    const {
      search,
      sortBy = 'fecha',
      sortOrder = 'desc',
      page = '1',
      limit = '25',
      clienteId,
      proyectoId,
      agenteComercialId,
      estado,
      estados,
      prioridad,
      serie,
      activo,
      fechaDesde,
      fechaHasta,
      fechaEntregaDesde,
      fechaEntregaHasta,
      importeMin,
      importeMax,
      pendientesEntrega,
      retrasados,
      tags,
    } = query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Construir filtro
    const filter: any = {};

    // Búsqueda por texto
    if (search) {
      filter.$or = [
        { codigo: { $regex: search, $options: 'i' } },
        { clienteNombre: { $regex: search, $options: 'i' } },
        { clienteNif: { $regex: search, $options: 'i' } },
        { titulo: { $regex: search, $options: 'i' } },
        { referenciaCliente: { $regex: search, $options: 'i' } },
        { pedidoCliente: { $regex: search, $options: 'i' } },
        { 'lineas.nombre': { $regex: search, $options: 'i' } },
      ];
    }

    // Filtros específicos
    if (clienteId) {
      filter.clienteId = new mongoose.Types.ObjectId(clienteId);
    }

    if (proyectoId) {
      filter.proyectoId = new mongoose.Types.ObjectId(proyectoId);
    }

    if (agenteComercialId) {
      filter.agenteComercialId = new mongoose.Types.ObjectId(agenteComercialId);
    }

    if (estado) {
      filter.estado = estado;
    }

    if (estados) {
      const estadosArray = estados.split(',').map(e => e.trim());
      filter.estado = { $in: estadosArray };
    }

    if (prioridad) {
      filter.prioridad = prioridad;
    }

    if (serie) {
      filter.serie = serie.toUpperCase();
    }

    if (activo !== undefined && activo !== 'all') {
      filter.activo = activo === 'true';
    }

    // Filtros de fecha
    if (fechaDesde || fechaHasta) {
      filter.fecha = {};
      if (fechaDesde) filter.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) filter.fecha.$lte = new Date(fechaHasta);
    }

    if (fechaEntregaDesde || fechaEntregaHasta) {
      filter.fechaEntregaComprometida = {};
      if (fechaEntregaDesde) filter.fechaEntregaComprometida.$gte = new Date(fechaEntregaDesde);
      if (fechaEntregaHasta) filter.fechaEntregaComprometida.$lte = new Date(fechaEntregaHasta);
    }

    // Filtros de importe
    if (importeMin || importeMax) {
      filter['totales.totalPedido'] = {};
      if (importeMin) filter['totales.totalPedido'].$gte = parseFloat(importeMin);
      if (importeMax) filter['totales.totalPedido'].$lte = parseFloat(importeMax);
    }

    // Pendientes de entrega
    const hoy = new Date();
    if (pendientesEntrega === 'true') {
      filter.estado = {
        $in: [EstadoPedido.CONFIRMADO, EstadoPedido.EN_PROCESO, EstadoPedido.PARCIALMENTE_SERVIDO],
      };
    }

    // Retrasados
    if (retrasados === 'true') {
      filter.fechaEntregaComprometida = { $lt: hoy };
      filter.estado = {
        $in: [EstadoPedido.CONFIRMADO, EstadoPedido.EN_PROCESO, EstadoPedido.PARCIALMENTE_SERVIDO],
      };
    }

    // Tags
    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim().toLowerCase());
      filter.tags = { $in: tagsArray };
    }

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (pageNum - 1) * limitNum;

    // Ejecutar consulta
    const [pedidos, total] = await Promise.all([
      PedidoModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('clienteId', 'codigo nombre nombreComercial')
        .populate('proyectoId', 'codigo nombre')
        .populate('agenteComercialId', 'codigo nombre apellidos')
        .populate('presupuestoOrigenId', 'codigo')
        .lean(),
      PedidoModel.countDocuments(filter),
    ]);

    return {
      pedidos,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async findById(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    ocultarCostes: boolean = false
  ): Promise<IPedido | null> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    const pedido = await PedidoModel.findById(id)
      .populate('clienteId', 'codigo nombre nombreComercial nif email telefono direcciones cuentasBancarias')
      .populate('proyectoId', 'codigo nombre estado')
      .populate('agenteComercialId', 'codigo nombre apellidos email telefono')
      .populate('presupuestoOrigenId', 'codigo fecha estado')
      .populate('condiciones.formaPagoId', 'nombre codigo')
      .populate('condiciones.terminoPagoId', 'nombre dias')
      .populate('creadoPor', 'nombre email')
      .populate('modificadoPor', 'nombre email')
      .populate('historial.usuarioId', 'nombre email')
      .populate('notasSeguimiento.usuarioId', 'nombre email');

    if (pedido && ocultarCostes) {
      pedido.mostrarCostes = false;
    }

    return pedido;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(
    id: string,
    updatePedidoDto: UpdatePedidoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPedido | null> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    const pedidoActual = await PedidoModel.findById(id);
    if (!pedidoActual) return null;

    // Verificar si está bloqueado
    if (pedidoActual.bloqueado) {
      throw new Error('El pedido está bloqueado y no puede modificarse');
    }

    // Recalcular líneas si se proporcionan
    let lineasCalculadas = pedidoActual.lineas;
    if (updatePedidoDto.lineas) {
      lineasCalculadas = updatePedidoDto.lineas.map((linea, index) =>
        this.calcularLinea({ ...linea, orden: linea.orden ?? index })
      );
    }

    // Recalcular totales
    const totales = this.calcularTotales(
      lineasCalculadas,
      updatePedidoDto.descuentoGlobalPorcentaje ?? pedidoActual.descuentoGlobalPorcentaje
    );

    const updateData = {
      ...updatePedidoDto,
      lineas: lineasCalculadas,
      totales,
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
      $push: {
        historial: {
          fecha: new Date(),
          usuarioId,
          accion: 'Modificación',
          descripcion: 'Pedido actualizado',
        },
      },
    };

    return PedidoModel.findByIdAndUpdate(id, updateData, { new: true })
      .populate('clienteId', 'codigo nombre nombreComercial')
      .populate('proyectoId', 'codigo nombre');
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPedido | null> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);
    return PedidoModel.findByIdAndDelete(id);
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(
    id: string,
    estado: EstadoPedido,
    usuarioId: mongoose.Types.ObjectId,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    observaciones?: string
  ): Promise<IPedido | null> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    const updateData: any = {
      estado,
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
      $push: {
        historial: {
          fecha: new Date(),
          usuarioId,
          accion: `Cambio de estado a ${estado}`,
          descripcion: observaciones,
        },
      },
    };

    // Fechas según estado
    if (estado === EstadoPedido.CONFIRMADO) {
      updateData.fechaConfirmacion = new Date();
    }

    if (estado === EstadoPedido.SERVIDO) {
      updateData.fechaEntregaReal = new Date();
    }

    // Bloquear si está facturado
    if (estado === EstadoPedido.FACTURADO) {
      updateData.bloqueado = true;
    }

    return PedidoModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  // ============================================
  // DUPLICAR PEDIDO
  // ============================================

  async duplicar(
    id: string,
    opciones: DuplicarPedidoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPedido> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    const pedidoOriginal = await PedidoModel.findById(id).lean();
    if (!pedidoOriginal) {
      throw new Error('Pedido no encontrado');
    }

    // Obtener datos del nuevo cliente si se especifica
    let clienteData = {
      clienteId: pedidoOriginal.clienteId,
      clienteNombre: pedidoOriginal.clienteNombre,
      clienteNif: pedidoOriginal.clienteNif,
      clienteEmail: pedidoOriginal.clienteEmail,
      clienteTelefono: pedidoOriginal.clienteTelefono,
    };

    if (opciones.nuevoCliente) {
      const ClienteModel = await getClienteModel(String(empresaId), dbConfig);
      const nuevoCliente = await ClienteModel.findById(opciones.nuevoCliente);
      if (nuevoCliente) {
        clienteData = {
          clienteId: nuevoCliente._id,
          clienteNombre: nuevoCliente.nombre,
          clienteNif: nuevoCliente.nif,
          clienteEmail: nuevoCliente.email,
          clienteTelefono: nuevoCliente.telefono,
        };
      }
    }

    // Limpiar líneas
    const lineasDuplicadas = pedidoOriginal.lineas.map((linea: any) => {
      const nuevaLinea = { ...linea };
      delete nuevaLinea._id;
      nuevaLinea.cantidadServida = 0;
      nuevaLinea.cantidadPendiente = linea.cantidad;

      if (!opciones.mantenerCostes) {
        nuevaLinea.costeUnitario = 0;
        nuevaLinea.costeTotalLinea = 0;
        nuevaLinea.margenUnitario = 0;
        nuevaLinea.margenPorcentaje = 0;
        nuevaLinea.margenTotalLinea = 0;
      }

      return nuevaLinea;
    });

    // Crear nuevo pedido
    const fechaNueva = opciones.nuevaFecha ? new Date(opciones.nuevaFecha) : new Date();

    const nuevoPedido = new PedidoModel({
      ...pedidoOriginal,
      _id: new mongoose.Types.ObjectId(),
      codigo: undefined, // Se generará automáticamente
      ...clienteData,
      estado: EstadoPedido.BORRADOR,
      fecha: fechaNueva,
      fechaConfirmacion: undefined,
      fechaEntregaComprometida: undefined,
      fechaEntregaReal: undefined,
      bloqueado: false,
      lineas: lineasDuplicadas,
      documentos: [],
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Duplicación',
        descripcion: `Duplicado del pedido ${pedidoOriginal.codigo}`,
      }],
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
      modificadoPor: undefined,
      fechaModificacion: undefined,
    });

    // Recalcular totales
    const totales = this.calcularTotales(
      nuevoPedido.lineas,
      nuevoPedido.descuentoGlobalPorcentaje
    );
    nuevoPedido.totales = totales as any;

    await nuevoPedido.save();
    return nuevoPedido;
  }

  // ============================================
  // APLICAR MARGEN
  // ============================================

  async aplicarMargen(
    id: string,
    opciones: AplicarMargenDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPedido | null> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    const pedido = await PedidoModel.findById(id);
    if (!pedido) return null;

    const lineasActualizadas = pedido.lineas.map((linea) => {
      // Verificar si aplica a esta línea
      let aplicar = false;

      switch (opciones.aplicarA) {
        case 'todas':
          aplicar = linea.tipo !== TipoLinea.TEXTO && linea.tipo !== TipoLinea.SUBTOTAL;
          break;
        case 'productos':
          aplicar = linea.tipo === TipoLinea.PRODUCTO || linea.tipo === TipoLinea.KIT;
          break;
        case 'servicios':
          aplicar = linea.tipo === TipoLinea.SERVICIO;
          break;
        case 'seleccionadas':
          aplicar = opciones.lineasIds?.includes(String(linea._id)) || false;
          break;
      }

      if (!aplicar) return linea;

      let nuevoPrecio = linea.precioUnitario;

      if (opciones.tipo === 'porcentaje') {
        if (opciones.sobreCoste) {
          // Margen sobre coste
          nuevoPrecio = linea.costeUnitario * (1 + opciones.valor / 100);
        } else {
          // Margen sobre precio actual
          nuevoPrecio = linea.precioUnitario * (1 + opciones.valor / 100);
        }
      } else {
        // Importe fijo
        nuevoPrecio = linea.precioUnitario + opciones.valor;
      }

      return this.calcularLinea({
        ...linea.toObject(),
        precioUnitario: Math.round(nuevoPrecio * 100) / 100,
      });
    });

    const totales = this.calcularTotales(lineasActualizadas, pedido.descuentoGlobalPorcentaje);

    pedido.lineas = lineasActualizadas as any;
    pedido.totales = totales as any;
    pedido.modificadoPor = usuarioId;
    pedido.fechaModificacion = new Date();
    pedido.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Aplicar margen',
      descripcion: `Margen ${opciones.tipo === 'porcentaje' ? opciones.valor + '%' : opciones.valor + '€'} aplicado a ${opciones.aplicarA}`,
    } as any);

    await pedido.save();
    return pedido;
  }

  // ============================================
  // IMPORTAR LÍNEAS
  // ============================================

  async importarLineas(
    id: string,
    opciones: ImportarLineasDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPedido | null> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);
    const ProductoModel = await getProductoModel(String(empresaId), dbConfig);

    const pedido = await PedidoModel.findById(id);
    if (!pedido) return null;

    let nuevasLineas: Partial<ILineaPedido>[] = [];
    const ordenBase = pedido.lineas.length;

    if (opciones.origen === 'productos' && opciones.productosIds) {
      // Importar desde productos
      const productos = await ProductoModel.find({
        _id: { $in: opciones.productosIds.map(pid => new mongoose.Types.ObjectId(pid)) },
      }).lean();

      nuevasLineas = productos.map((producto: any, index) => ({
        orden: ordenBase + index,
        tipo: producto.tipo === 'servicio' ? TipoLinea.SERVICIO : TipoLinea.PRODUCTO,
        productoId: producto._id,
        codigo: producto.sku,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        sku: producto.sku,
        cantidad: opciones.multiplicador || 1,
        cantidadServida: 0,
        cantidadPendiente: opciones.multiplicador || 1,
        unidad: producto.unidad || 'ud',
        precioUnitario: opciones.incluirPrecios ? (producto.precios?.pvp || 0) : 0,
        costeUnitario: opciones.incluirCostes ? (producto.precios?.coste || 0) : 0,
        descuento: 0,
        iva: producto.iva || 21,
        esEditable: true,
        incluidoEnTotal: true,
      }));
    } else if (opciones.origen === 'presupuesto' && opciones.documentoId) {
      // Importar desde presupuesto
      const PresupuestoModel = await getPresupuestoModel(String(empresaId), dbConfig);
      const presupuesto = await PresupuestoModel.findById(opciones.documentoId).lean();
      if (presupuesto) {
        nuevasLineas = (presupuesto.lineas || []).map((linea: any, index: number) => ({
          ...linea,
          _id: undefined,
          orden: ordenBase + index,
          cantidad: (linea.cantidad || 1) * (opciones.multiplicador || 1),
          cantidadServida: 0,
          cantidadPendiente: (linea.cantidad || 1) * (opciones.multiplicador || 1),
          precioUnitario: opciones.incluirPrecios ? linea.precioUnitario : 0,
          costeUnitario: opciones.incluirCostes ? linea.costeUnitario : 0,
          descuento: opciones.incluirDescuentos ? linea.descuento : 0,
        }));
      }
    } else if (opciones.origen === 'pedido' && opciones.documentoId) {
      // Importar desde otro pedido
      const otroPedido = await PedidoModel.findById(opciones.documentoId).lean();
      if (otroPedido) {
        nuevasLineas = otroPedido.lineas.map((linea: any, index) => ({
          ...linea,
          _id: undefined,
          orden: ordenBase + index,
          cantidad: (linea.cantidad || 1) * (opciones.multiplicador || 1),
          cantidadServida: 0,
          cantidadPendiente: (linea.cantidad || 1) * (opciones.multiplicador || 1),
          precioUnitario: opciones.incluirPrecios ? linea.precioUnitario : 0,
          costeUnitario: opciones.incluirCostes ? linea.costeUnitario : 0,
          descuento: opciones.incluirDescuentos ? linea.descuento : 0,
        }));
      }
    }

    // Calcular líneas importadas
    const lineasCalculadas = nuevasLineas.map(linea => this.calcularLinea(linea));

    // Agregar al pedido
    pedido.lineas.push(...lineasCalculadas as any);

    // Recalcular totales
    const totales = this.calcularTotales(pedido.lineas, pedido.descuentoGlobalPorcentaje);
    pedido.totales = totales as any;

    pedido.modificadoPor = usuarioId;
    pedido.fechaModificacion = new Date();
    pedido.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Importar líneas',
      descripcion: `${lineasCalculadas.length} líneas importadas desde ${opciones.origen}`,
    } as any);

    await pedido.save();
    return pedido;
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);
    return (PedidoModel as any).obtenerEstadisticas();
  }

  // ============================================
  // SUGERIR CÓDIGO
  // ============================================

  async sugerirCodigo(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    serie: string = 'PV'
  ): Promise<{ codigo: string; serie: string; numero: number }> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);
    return (PedidoModel as any).generarCodigo(serie);
  }

  // ============================================
  // ELIMINAR EN LOTE
  // ============================================

  async eliminarVarios(
    ids: string[],
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<number> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    const result = await PedidoModel.deleteMany({
      _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) },
      bloqueado: { $ne: true }, // No eliminar bloqueados
    });

    return result.deletedCount || 0;
  }

  // ============================================
  // OBTENER POR CLIENTE
  // ============================================

  async findByClienteId(
    clienteId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPedido[]> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    return PedidoModel.find({
      clienteId: new mongoose.Types.ObjectId(clienteId),
      activo: true,
    })
      .sort({ fecha: -1 })
      .select('codigo fecha estado prioridad totales.totalPedido fechaEntregaComprometida')
      .limit(50)
      .lean();
  }

  // ============================================
  // OBTENER POR PROYECTO
  // ============================================

  async findByProyectoId(
    proyectoId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPedido[]> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    return PedidoModel.find({
      proyectoId: new mongoose.Types.ObjectId(proyectoId),
      activo: true,
    })
      .sort({ fecha: -1 })
      .select('codigo fecha estado prioridad totales.totalPedido')
      .lean();
  }

  // ============================================
  // TOGGLE MOSTRAR COSTES
  // ============================================

  async toggleMostrarCostes(
    id: string,
    mostrar: boolean,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPedido | null> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    return PedidoModel.findByIdAndUpdate(
      id,
      {
        mostrarCostes: mostrar,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );
  }

  // ============================================
  // ENVÍO POR EMAIL
  // ============================================

  /**
   * Enviar pedido por email con PDF adjunto
   */
  async enviarPorEmail(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    opciones?: {
      asunto?: string;
      mensaje?: string;
      cc?: string[];
      bcc?: string[];
    }
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    // Obtener pedido completo
    const pedido = await PedidoModel.findById(id)
      .populate('clienteId', 'nombre email')
      .lean();

    if (!pedido) {
      return { success: false, message: 'Pedido no encontrado' };
    }

    // Obtener email del cliente
    const clienteEmail = pedido.clienteEmail ||
      (typeof pedido.clienteId === 'object' ? (pedido.clienteId as any).email : null);

    if (!clienteEmail) {
      return { success: false, message: 'El cliente no tiene email configurado' };
    }

    // Obtener datos de la empresa
    const empresa = await Empresa.findById(empresaId).lean();
    if (!empresa) {
      return { success: false, message: 'Empresa no encontrada' };
    }

    try {
      // Formatear datos para el email
      const clienteNombre = typeof pedido.clienteId === 'object'
        ? (pedido.clienteId as any).nombre
        : pedido.clienteNombre;

      const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }).format(value || 0);

      const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      // Generar HTML del email
      const asunto = opciones?.asunto || `Pedido ${pedido.codigo}`;
      const mensajePersonalizado = opciones?.mensaje || '';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1a1a1a; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
            Pedido ${pedido.codigo}
          </h2>

          <p>Estimado/a ${clienteNombre},</p>

          ${mensajePersonalizado ? `<p>${mensajePersonalizado}</p>` : '<p>Adjunto le enviamos la confirmación de su pedido con los siguientes detalles:</p>'}

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Código</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${pedido.codigo}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Fecha</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(pedido.fecha)}</td>
            </tr>
            ${pedido.fechaEntregaComprometida ? `
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Entrega prevista</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(pedido.fechaEntregaComprometida)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Importe Total</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #10B981;">
                ${formatCurrency(pedido.totales?.totalPedido || 0)}
              </td>
            </tr>
          </table>

          ${pedido.titulo ? `<p><strong>Concepto:</strong> ${pedido.titulo}</p>` : ''}

          <p>Quedamos a su disposición para cualquier consulta o aclaración.</p>

          <p style="margin-top: 30px;">Saludos cordiales,</p>
          <p><strong>${empresa.nombreComercial || empresa.nombre}</strong></p>
          ${empresa.telefono ? `<p style="color: #666; font-size: 14px;">Tel: ${empresa.telefono}</p>` : ''}

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            Este email ha sido enviado automáticamente desde ${empresa.nombre}.
          </p>
        </div>
      `;

      const textContent = `
Pedido ${pedido.codigo}

Estimado/a ${clienteNombre},

${mensajePersonalizado || 'Adjunto le enviamos la confirmación de su pedido.'}

- Código: ${pedido.codigo}
- Fecha: ${formatDate(pedido.fecha)}
${pedido.fechaEntregaComprometida ? `- Entrega prevista: ${formatDate(pedido.fechaEntregaComprometida)}` : ''}
- Importe Total: ${formatCurrency(pedido.totales?.totalPedido || 0)}

${pedido.titulo ? `Concepto: ${pedido.titulo}` : ''}

Quedamos a su disposición para cualquier consulta.

Saludos cordiales,
${empresa.nombreComercial || empresa.nombre}
${empresa.telefono ? `Tel: ${empresa.telefono}` : ''}
      `;

      // Enviar email (sin PDF por ahora, se añadirá después)
      const result = await empresaService.sendEmail(String(empresaId), {
        to: clienteEmail,
        subject: asunto,
        html: htmlContent,
        text: textContent,
        cc: opciones?.cc,
        bcc: opciones?.bcc,
      });

      if (result.success) {
        // Registrar envío e incrementar contador
        await PedidoModel.findByIdAndUpdate(id, {
          $inc: { contadorEnvios: 1 },
          $push: {
            historial: {
              fecha: new Date(),
              usuarioId,
              accion: 'Envío por email',
              descripcion: `Pedido enviado por email a ${clienteEmail}`,
            },
          },
        });

        return {
          success: true,
          message: `Email enviado correctamente a ${clienteEmail}`,
          messageId: result.messageId,
        };
      }

      return { success: false, message: result.error || 'Error al enviar email' };
    } catch (error: any) {
      console.error('Error al enviar pedido por email:', error);
      return { success: false, message: error.message || 'Error al generar o enviar email' };
    }
  }

  /**
   * Generar URL para WhatsApp con el pedido
   */
  async generarURLWhatsApp(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{ success: boolean; url?: string; message?: string }> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    const pedido = await PedidoModel.findById(id)
      .select('codigo clienteNombre clienteTelefono totales.totalPedido fechaEntregaComprometida')
      .lean();

    if (!pedido) {
      return { success: false, message: 'Pedido no encontrado' };
    }

    let telefono = pedido.clienteTelefono?.replace(/\s/g, '').replace(/[^0-9+]/g, '');
    if (!telefono) {
      return { success: false, message: 'El cliente no tiene teléfono configurado' };
    }

    // Formatear teléfono para WhatsApp
    if (!telefono.startsWith('+') && !telefono.startsWith('34') && telefono.length === 9) {
      telefono = '34' + telefono;
    }
    telefono = telefono.replace('+', '');

    const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);

    const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    let mensaje = `Hola ${pedido.clienteNombre},\n\n` +
      `Le confirmamos su pedido *${pedido.codigo}* por un importe de *${formatCurrency(pedido.totales?.totalPedido || 0)}*.`;

    if (pedido.fechaEntregaComprometida) {
      mensaje += `\n\nEntrega prevista: ${formatDate(pedido.fechaEntregaComprometida)}`;
    }

    mensaje += `\n\nQuedamos a su disposición para cualquier consulta.`;

    return {
      success: true,
      url: `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`,
    };
  }

  /**
   * Añadir nota de seguimiento a un pedido
   */
  async addNotaSeguimiento(
    id: string,
    usuarioId: mongoose.Types.ObjectId,
    nota: {
      tipo: 'llamada' | 'email' | 'reunion' | 'nota' | 'recordatorio';
      contenido: string;
      resultado?: string;
      proximaAccion?: string;
      fechaProximaAccion?: Date;
    },
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPedido> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);
    const pedido = await PedidoModel.findByIdAndUpdate(
      id,
      {
        $push: {
          notasSeguimiento: {
            fecha: new Date(),
            usuarioId,
            tipo: nota.tipo,
            contenido: nota.contenido,
            resultado: nota.resultado,
            proximaAccion: nota.proximaAccion,
            fechaProximaAccion: nota.fechaProximaAccion,
          },
        },
      },
      { new: true }
    )
      .populate('clienteId', 'codigo nombre nombreComercial')
      .populate('proyectoId', 'codigo nombre')
      .populate('agenteComercialId', 'codigo nombre apellidos')
      .populate('creadoPor', 'nombre email')
      .populate('modificadoPor', 'nombre email')
      .populate('historial.usuarioId', 'nombre email')
      .populate('notasSeguimiento.usuarioId', 'nombre email');

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    return pedido;
  }

  /**
   * Eliminar nota de seguimiento
   */
  async deleteNotaSeguimiento(
    id: string,
    notaId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPedido> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);
    const pedido = await PedidoModel.findByIdAndUpdate(
      id,
      {
        $pull: {
          notasSeguimiento: { _id: notaId },
        },
      },
      { new: true }
    )
      .populate('clienteId', 'codigo nombre nombreComercial')
      .populate('proyectoId', 'codigo nombre')
      .populate('agenteComercialId', 'codigo nombre apellidos')
      .populate('creadoPor', 'nombre email')
      .populate('modificadoPor', 'nombre email')
      .populate('historial.usuarioId', 'nombre email')
      .populate('notasSeguimiento.usuarioId', 'nombre email');

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    return pedido;
  }

  // ============================================
  // ALERTAS DE PEDIDOS
  // ============================================

  /**
   * Obtener alertas de pedidos (entregas retrasadas, pendientes, etc.)
   */
  async getAlertas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    diasAlerta: number = 7
  ): Promise<{
    pendientesConfirmar: any[];
    entregasRetrasadas: any[];
    enProcesoLargoTiempo: any[];
    pendientesFacturar: any[];
  }> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(fechaLimite.getDate() - diasAlerta);

    // Pedidos en borrador pendientes de confirmar
    const pendientesConfirmar = await PedidoModel.find({
      estado: EstadoPedido.BORRADOR,
      fecha: { $lt: fechaLimite },
      activo: true,
    })
      .select('codigo clienteNombre fecha prioridad totales.totalPedido')
      .populate('clienteId', 'nombre')
      .sort({ fecha: 1 })
      .limit(20)
      .lean();

    // Entregas retrasadas (fecha comprometida pasada y no servido)
    const entregasRetrasadas = await PedidoModel.find({
      estado: { $in: [EstadoPedido.CONFIRMADO, EstadoPedido.EN_PROCESO, EstadoPedido.PARCIALMENTE_SERVIDO] },
      fechaEntregaComprometida: { $lt: hoy },
      activo: true,
    })
      .select('codigo clienteNombre fecha fechaEntregaComprometida estado prioridad totales.totalPedido')
      .populate('clienteId', 'nombre')
      .sort({ fechaEntregaComprometida: 1 })
      .limit(20)
      .lean();

    // En proceso largo tiempo (más de X días en proceso)
    const fechaProcesoLargo = new Date(hoy);
    fechaProcesoLargo.setDate(fechaProcesoLargo.getDate() - 14); // 14 días

    const enProcesoLargoTiempo = await PedidoModel.find({
      estado: EstadoPedido.EN_PROCESO,
      fechaConfirmacion: { $lt: fechaProcesoLargo },
      activo: true,
    })
      .select('codigo clienteNombre fecha fechaConfirmacion prioridad totales.totalPedido')
      .populate('clienteId', 'nombre')
      .sort({ fechaConfirmacion: 1 })
      .limit(20)
      .lean();

    // Servidos pendientes de facturar
    const pendientesFacturar = await PedidoModel.find({
      estado: EstadoPedido.SERVIDO,
      activo: true,
    })
      .select('codigo clienteNombre fecha fechaEntregaReal totales.totalPedido')
      .populate('clienteId', 'nombre')
      .sort({ fechaEntregaReal: 1 })
      .limit(20)
      .lean();

    return {
      pendientesConfirmar,
      entregasRetrasadas,
      enProcesoLargoTiempo,
      pendientesFacturar,
    };
  }

  /**
   * Obtener resumen de alertas (solo contadores)
   */
  async getResumenAlertas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    diasAlerta: number = 7
  ): Promise<{
    pendientesConfirmar: number;
    entregasRetrasadas: number;
    enProcesoLargoTiempo: number;
    pendientesFacturar: number;
    total: number;
  }> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(fechaLimite.getDate() - diasAlerta);

    const fechaProcesoLargo = new Date(hoy);
    fechaProcesoLargo.setDate(fechaProcesoLargo.getDate() - 14);

    const [pendientesConfirmar, entregasRetrasadas, enProcesoLargoTiempo, pendientesFacturar] = await Promise.all([
      PedidoModel.countDocuments({
        estado: EstadoPedido.BORRADOR,
        fecha: { $lt: fechaLimite },
        activo: true,
      }),
      PedidoModel.countDocuments({
        estado: { $in: [EstadoPedido.CONFIRMADO, EstadoPedido.EN_PROCESO, EstadoPedido.PARCIALMENTE_SERVIDO] },
        fechaEntregaComprometida: { $lt: hoy },
        activo: true,
      }),
      PedidoModel.countDocuments({
        estado: EstadoPedido.EN_PROCESO,
        fechaConfirmacion: { $lt: fechaProcesoLargo },
        activo: true,
      }),
      PedidoModel.countDocuments({
        estado: EstadoPedido.SERVIDO,
        activo: true,
      }),
    ]);

    return {
      pendientesConfirmar,
      entregasRetrasadas,
      enProcesoLargoTiempo,
      pendientesFacturar,
      total: pendientesConfirmar + entregasRetrasadas + enProcesoLargoTiempo + pendientesFacturar,
    };
  }

  /**
   * Obtener KPIs detallados para dashboard
   */
  async getKPIs(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    periodo?: { desde?: Date; hasta?: Date }
  ): Promise<{
    resumen: {
      total: number;
      confirmados: number;
      enProceso: number;
      servidos: number;
      facturados: number;
      cancelados: number;
      valorTotal: number;
      valorServidos: number;
      tasaCompletado: number;
      tiempoMedioEntrega: number;
    };
    porEstado: Array<{ estado: string; cantidad: number; valor: number }>;
    porPrioridad: Array<{ prioridad: string; cantidad: number; valor: number }>;
    evolucionMensual: Array<{
      mes: string;
      confirmados: number;
      servidos: number;
      facturados: number;
      valorConfirmados: number;
      valorServidos: number;
    }>;
    topClientes: Array<{
      clienteId: string;
      clienteNombre: string;
      cantidad: number;
      valorTotal: number;
      servidos: number;
    }>;
    topAgentes: Array<{
      agenteId: string;
      agenteNombre: string;
      cantidad: number;
      valorTotal: number;
      tasaCompletado: number;
    }>;
  }> {
    const PedidoModel = await this.getModeloPedido(String(empresaId), dbConfig);

    const hoy = new Date();
    const inicioAño = new Date(hoy.getFullYear(), 0, 1);
    const desde = periodo?.desde || inicioAño;
    const hasta = periodo?.hasta || hoy;

    // Filtro base
    const filtroFecha = { fecha: { $gte: desde, $lte: hasta } };

    // Obtener todos los pedidos del periodo
    const pedidos = await PedidoModel.find({
      ...filtroFecha,
      activo: true,
    })
      .select('estado prioridad fecha fechaConfirmacion fechaEntregaReal clienteId clienteNombre agenteComercialId totales.totalPedido')
      .populate('agenteComercialId', 'nombre apellidos')
      .lean();

    // Calcular resumen
    const total = pedidos.length;
    const confirmados = pedidos.filter(p => p.estado === EstadoPedido.CONFIRMADO).length;
    const enProceso = pedidos.filter(p => p.estado === EstadoPedido.EN_PROCESO).length;
    const servidos = pedidos.filter(p => p.estado === EstadoPedido.SERVIDO).length;
    const facturados = pedidos.filter(p => p.estado === EstadoPedido.FACTURADO).length;
    const cancelados = pedidos.filter(p => p.estado === EstadoPedido.CANCELADO).length;
    const valorTotal = pedidos.reduce((sum, p) => sum + (p.totales?.totalPedido || 0), 0);
    const valorServidos = pedidos
      .filter(p => [EstadoPedido.SERVIDO, EstadoPedido.FACTURADO].includes(p.estado as EstadoPedido))
      .reduce((sum, p) => sum + (p.totales?.totalPedido || 0), 0);

    const pedidosCompletados = pedidos.filter(
      p => p.fechaConfirmacion && p.fechaEntregaReal &&
      [EstadoPedido.SERVIDO, EstadoPedido.FACTURADO].includes(p.estado as EstadoPedido)
    );
    const tiempoMedioEntrega = pedidosCompletados.length > 0
      ? pedidosCompletados.reduce((sum, p) => {
          const dias = Math.ceil(
            (new Date(p.fechaEntregaReal!).getTime() - new Date(p.fechaConfirmacion!).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + dias;
        }, 0) / pedidosCompletados.length
      : 0;

    const tasaCompletado = total > 0
      ? ((servidos + facturados) / total) * 100
      : 0;

    // Por estado
    const porEstado = Object.values(EstadoPedido).map(estado => {
      const pedidosEstado = pedidos.filter(p => p.estado === estado);
      return {
        estado,
        cantidad: pedidosEstado.length,
        valor: pedidosEstado.reduce((sum, p) => sum + (p.totales?.totalPedido || 0), 0),
      };
    }).filter(e => e.cantidad > 0);

    // Por prioridad
    const porPrioridad = Object.values(Prioridad).map(prioridad => {
      const pedidosPrioridad = pedidos.filter(p => p.prioridad === prioridad);
      return {
        prioridad,
        cantidad: pedidosPrioridad.length,
        valor: pedidosPrioridad.reduce((sum, p) => sum + (p.totales?.totalPedido || 0), 0),
      };
    }).filter(e => e.cantidad > 0);

    // Evolución mensual (últimos 12 meses)
    const evolucionMensual = [];
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      const mesKey = fecha.toISOString().substring(0, 7);

      const pedidosMes = pedidos.filter(p => {
        const fechaP = new Date(p.fecha);
        return fechaP >= fecha && fechaP <= finMes;
      });

      const confirmadosMes = pedidosMes.filter(p =>
        [EstadoPedido.CONFIRMADO, EstadoPedido.EN_PROCESO, EstadoPedido.PARCIALMENTE_SERVIDO, EstadoPedido.SERVIDO, EstadoPedido.FACTURADO].includes(p.estado as EstadoPedido)
      );
      const servidosMes = pedidosMes.filter(p =>
        [EstadoPedido.SERVIDO, EstadoPedido.FACTURADO].includes(p.estado as EstadoPedido)
      );
      const facturadosMes = pedidosMes.filter(p => p.estado === EstadoPedido.FACTURADO);

      evolucionMensual.push({
        mes: mesKey,
        confirmados: confirmadosMes.length,
        servidos: servidosMes.length,
        facturados: facturadosMes.length,
        valorConfirmados: confirmadosMes.reduce((sum, p) => sum + (p.totales?.totalPedido || 0), 0),
        valorServidos: servidosMes.reduce((sum, p) => sum + (p.totales?.totalPedido || 0), 0),
      });
    }

    // Top clientes
    const clientesMap = new Map<string, { nombre: string; cantidad: number; valor: number; servidos: number }>();
    pedidos.forEach(p => {
      const clienteId = String(p.clienteId);
      const current = clientesMap.get(clienteId) || { nombre: p.clienteNombre, cantidad: 0, valor: 0, servidos: 0 };
      current.cantidad++;
      current.valor += p.totales?.totalPedido || 0;
      if ([EstadoPedido.SERVIDO, EstadoPedido.FACTURADO].includes(p.estado as EstadoPedido)) current.servidos++;
      clientesMap.set(clienteId, current);
    });
    const topClientes = Array.from(clientesMap.entries())
      .map(([id, data]) => ({ clienteId: id, clienteNombre: data.nombre, ...data }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    // Top agentes
    const agentesMap = new Map<string, { nombre: string; cantidad: number; valor: number; servidos: number; total: number }>();
    pedidos.filter(p => p.agenteComercialId).forEach(p => {
      const agenteId = String((p.agenteComercialId as any)._id || p.agenteComercialId);
      const agente = p.agenteComercialId as any;
      const nombre = agente?.nombre ? `${agente.nombre} ${agente.apellidos || ''}`.trim() : 'Sin asignar';
      const current = agentesMap.get(agenteId) || { nombre, cantidad: 0, valor: 0, servidos: 0, total: 0 };
      current.cantidad++;
      current.valor += p.totales?.totalPedido || 0;
      if ([EstadoPedido.SERVIDO, EstadoPedido.FACTURADO].includes(p.estado as EstadoPedido)) current.servidos++;
      if (p.estado !== EstadoPedido.BORRADOR && p.estado !== EstadoPedido.CANCELADO) current.total++;
      agentesMap.set(agenteId, current);
    });
    const topAgentes = Array.from(agentesMap.entries())
      .map(([id, data]) => ({
        agenteId: id,
        agenteNombre: data.nombre,
        cantidad: data.cantidad,
        valorTotal: data.valor,
        tasaCompletado: data.total > 0 ? (data.servidos / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 5);

    return {
      resumen: {
        total,
        confirmados,
        enProceso,
        servidos,
        facturados,
        cancelados,
        valorTotal: Math.round(valorTotal * 100) / 100,
        valorServidos: Math.round(valorServidos * 100) / 100,
        tasaCompletado: Math.round(tasaCompletado * 10) / 10,
        tiempoMedioEntrega: Math.round(tiempoMedioEntrega * 10) / 10,
      },
      porEstado,
      porPrioridad,
      evolucionMensual,
      topClientes,
      topAgentes,
    };
  }
}

export const pedidosService = new PedidosService();
