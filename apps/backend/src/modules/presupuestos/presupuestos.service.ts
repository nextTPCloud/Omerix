import mongoose, { Model } from 'mongoose';
import { Presupuesto, IPresupuesto, EstadoPresupuesto, TipoLinea, ILineaPresupuesto } from './Presupuesto';
import {
  CreatePresupuestoDTO,
  UpdatePresupuestoDTO,
  SearchPresupuestosDTO,
  AplicarMargenDTO,
  ImportarLineasDTO,
  DuplicarPresupuestoDTO,
} from './presupuestos.dto';
import { IDatabaseConfig } from '@/models/Empresa';
import { getPresupuestoModel, getProductoModel, getClienteModel, getProyectoModel, getAgenteComercialModel, getFormaPagoModel, getTerminoPagoModel, getUserModel } from '@/utils/dynamic-models.helper';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  presupuestos: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PresupuestosService {
  /**
   * Obtener modelo de Presupuesto para una empresa específica
   * También registra los modelos referenciados para que populate funcione
   */
  private async getModeloPresupuesto(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IPresupuesto>> {
    // Registrar primero los modelos referenciados para que populate funcione
    await Promise.all([
      getClienteModel(empresaId, dbConfig),
      getProyectoModel(empresaId, dbConfig),
      getAgenteComercialModel(empresaId, dbConfig),
      getProductoModel(empresaId, dbConfig),
      getFormaPagoModel(empresaId, dbConfig),
      getTerminoPagoModel(empresaId, dbConfig),
      getUserModel(empresaId, dbConfig),
    ]);

    return await getPresupuestoModel(empresaId, dbConfig);
  }

  // ============================================
  // CÁLCULOS DE LÍNEAS Y TOTALES
  // ============================================

  /**
   * Calcular importes de una línea
   */
  calcularLinea(linea: Partial<ILineaPresupuesto>): ILineaPresupuesto {
    const cantidad = linea.cantidad || 0;
    const precioUnitario = linea.precioUnitario || 0;
    const costeUnitario = linea.costeUnitario || 0;
    const descuento = linea.descuento || 0;
    const iva = linea.iva || 21;

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

    return {
      ...linea,
      cantidad,
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
    } as ILineaPresupuesto;
  }

  /**
   * Calcular totales del presupuesto
   */
  calcularTotales(lineas: ILineaPresupuesto[], descuentoGlobalPorcentaje: number = 0) {
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
    const totalPresupuesto = subtotalNetoConDescuento + totalIva;

    const costeTotal = costeTotalMateriales + costeTotalServicios + costeTotalKits;
    const margenBruto = subtotalNetoConDescuento - costeTotal;
    const margenPorcentaje = costeTotal > 0 ? (margenBruto / costeTotal) * 100 : 0;

    return {
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round((totalDescuentos + descuentoGlobalImporte) * 100) / 100,
      subtotalNeto: Math.round(subtotalNetoConDescuento * 100) / 100,
      desgloseIva,
      totalIva: Math.round(totalIva * 100) / 100,
      totalPresupuesto: Math.round(totalPresupuesto * 100) / 100,
      costeTotalMateriales: Math.round(costeTotalMateriales * 100) / 100,
      costeTotalServicios: Math.round(costeTotalServicios * 100) / 100,
      costeTotalKits: Math.round(costeTotalKits * 100) / 100,
      costeTotal: Math.round(costeTotal * 100) / 100,
      margenBruto: Math.round(margenBruto * 100) / 100,
      margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
    };
  }

  // ============================================
  // CREAR PRESUPUESTO
  // ============================================

  async crear(
    createPresupuestoDto: CreatePresupuestoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPresupuesto> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    // Generar código y número automáticamente
    const serie = createPresupuestoDto.serie || 'P';
    const { codigo, numero } = await this.generarCodigoNumero(PresupuestoModel, serie);

    // Calcular líneas
    const lineasCalculadas = (createPresupuestoDto.lineas || []).map((linea, index) =>
      this.calcularLinea({ ...linea, orden: linea.orden ?? index })
    );

    // Calcular totales
    const totales = this.calcularTotales(
      lineasCalculadas,
      createPresupuestoDto.descuentoGlobalPorcentaje || 0
    );

    // Calcular fecha de validez si no viene
    const fecha = createPresupuestoDto.fecha ? new Date(createPresupuestoDto.fecha) : new Date();
    const validezDias = createPresupuestoDto.condiciones?.validezDias || 30;
    const fechaValidez = createPresupuestoDto.fechaValidez
      ? new Date(createPresupuestoDto.fechaValidez)
      : new Date(fecha.getTime() + validezDias * 24 * 60 * 60 * 1000);

    const presupuestoData = {
      ...createPresupuestoDto,
      codigo,
      serie,
      numero,
      version: 1,
      lineas: lineasCalculadas,
      totales,
      fecha,
      fechaValidez,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Creación',
        descripcion: 'Presupuesto creado',
      }],
    };

    const presupuesto = new PresupuestoModel(presupuestoData);
    await presupuesto.save();

    return presupuesto;
  }

  /**
   * Generar código y número para nuevo presupuesto
   */
  private async generarCodigoNumero(
    PresupuestoModel: mongoose.Model<IPresupuesto>,
    serie: string = 'P'
  ): Promise<{ codigo: string; numero: number }> {
    const año = new Date().getFullYear();

    const ultimoPresupuesto = await PresupuestoModel.findOne({
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

  // ============================================
  // OBTENER TODOS CON FILTROS Y PAGINACIÓN
  // ============================================

  async findAll(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    query: Partial<SearchPresupuestosDTO>
  ): Promise<FindAllResult> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

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
      serie,
      activo,
      fechaDesde,
      fechaHasta,
      fechaValidezDesde,
      fechaValidezHasta,
      importeMin,
      importeMax,
      vigentes,
      caducados,
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

    if (fechaValidezDesde || fechaValidezHasta) {
      filter.fechaValidez = {};
      if (fechaValidezDesde) filter.fechaValidez.$gte = new Date(fechaValidezDesde);
      if (fechaValidezHasta) filter.fechaValidez.$lte = new Date(fechaValidezHasta);
    }

    // Filtros de importe
    if (importeMin || importeMax) {
      filter['totales.totalPresupuesto'] = {};
      if (importeMin) filter['totales.totalPresupuesto'].$gte = parseFloat(importeMin);
      if (importeMax) filter['totales.totalPresupuesto'].$lte = parseFloat(importeMax);
    }

    // Vigentes/Caducados
    const hoy = new Date();
    if (vigentes === 'true') {
      filter.fechaValidez = { $gte: hoy };
      filter.estado = { $nin: [EstadoPresupuesto.CADUCADO, EstadoPresupuesto.RECHAZADO] };
    }

    if (caducados === 'true') {
      filter.$or = [
        { estado: EstadoPresupuesto.CADUCADO },
        { fechaValidez: { $lt: hoy }, estado: { $in: [EstadoPresupuesto.ENVIADO, EstadoPresupuesto.PENDIENTE] } },
      ];
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
    const [presupuestos, total] = await Promise.all([
      PresupuestoModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('clienteId', 'codigo nombre nombreComercial')
        .populate('proyectoId', 'codigo nombre')
        .populate('agenteComercialId', 'codigo nombre apellidos')
        .lean(),
      PresupuestoModel.countDocuments(filter),
    ]);

    return {
      presupuestos,
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
  ): Promise<IPresupuesto | null> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    const presupuesto = await PresupuestoModel.findById(id)
      .populate('clienteId', 'codigo nombre nombreComercial nif email telefono direcciones cuentasBancarias')
      .populate('proyectoId', 'codigo nombre estado')
      .populate('agenteComercialId', 'codigo nombre apellidos email telefono')
      .populate('condiciones.formaPagoId', 'nombre codigo')
      .populate('condiciones.terminoPagoId', 'nombre dias')
      .populate('creadoPor', 'nombre email')
      .populate('modificadoPor', 'nombre email');

    if (presupuesto && ocultarCostes) {
      presupuesto.mostrarCostes = false;
    }

    return presupuesto;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(
    id: string,
    updatePresupuestoDto: UpdatePresupuestoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPresupuesto | null> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    const presupuestoActual = await PresupuestoModel.findById(id);
    if (!presupuestoActual) return null;

    // Verificar si está bloqueado
    if (presupuestoActual.bloqueado) {
      throw new Error('El presupuesto está bloqueado y no puede modificarse');
    }

    // Recalcular líneas si se proporcionan
    let lineasCalculadas = presupuestoActual.lineas;
    if (updatePresupuestoDto.lineas) {
      lineasCalculadas = updatePresupuestoDto.lineas.map((linea, index) =>
        this.calcularLinea({ ...linea, orden: linea.orden ?? index })
      );
    }

    // Recalcular totales
    const totales = this.calcularTotales(
      lineasCalculadas,
      updatePresupuestoDto.descuentoGlobalPorcentaje ?? presupuestoActual.descuentoGlobalPorcentaje
    );

    const updateData = {
      ...updatePresupuestoDto,
      lineas: lineasCalculadas,
      totales,
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
      $push: {
        historial: {
          fecha: new Date(),
          usuarioId,
          accion: 'Modificación',
          descripcion: 'Presupuesto actualizado',
        },
      },
    };

    return PresupuestoModel.findByIdAndUpdate(id, updateData, { new: true })
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
  ): Promise<IPresupuesto | null> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);
    return PresupuestoModel.findByIdAndDelete(id);
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(
    id: string,
    estado: EstadoPresupuesto,
    usuarioId: mongoose.Types.ObjectId,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    observaciones?: string,
    fechaRespuesta?: Date
  ): Promise<IPresupuesto | null> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

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
    if (estado === EstadoPresupuesto.ENVIADO && !fechaRespuesta) {
      updateData.fechaEnvio = new Date();
    }

    if ([EstadoPresupuesto.ACEPTADO, EstadoPresupuesto.RECHAZADO].includes(estado)) {
      updateData.fechaRespuesta = fechaRespuesta || new Date();
    }

    // Bloquear si está aceptado o convertido
    if ([EstadoPresupuesto.ACEPTADO, EstadoPresupuesto.CONVERTIDO].includes(estado)) {
      updateData.bloqueado = true;
    }

    return PresupuestoModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  // ============================================
  // DUPLICAR PRESUPUESTO
  // ============================================

  async duplicar(
    id: string,
    opciones: DuplicarPresupuestoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPresupuesto> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    const presupuestoOriginal = await PresupuestoModel.findById(id).lean();
    if (!presupuestoOriginal) {
      throw new Error('Presupuesto no encontrado');
    }

    // Obtener datos del nuevo cliente si se especifica
    let clienteData = {
      clienteId: presupuestoOriginal.clienteId,
      clienteNombre: presupuestoOriginal.clienteNombre,
      clienteNif: presupuestoOriginal.clienteNif,
      clienteEmail: presupuestoOriginal.clienteEmail,
      clienteTelefono: presupuestoOriginal.clienteTelefono,
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
    const lineasDuplicadas = presupuestoOriginal.lineas.map((linea: any) => {
      const nuevaLinea = { ...linea };
      delete nuevaLinea._id;

      if (!opciones.mantenerCostes) {
        nuevaLinea.costeUnitario = 0;
        nuevaLinea.costeTotalLinea = 0;
        nuevaLinea.margenUnitario = 0;
        nuevaLinea.margenPorcentaje = 0;
        nuevaLinea.margenTotalLinea = 0;
      }

      return nuevaLinea;
    });

    // Crear nuevo presupuesto
    const fechaNueva = opciones.nuevaFecha ? new Date(opciones.nuevaFecha) : new Date();
    const fechaValidez = new Date(fechaNueva);
    fechaValidez.setDate(fechaValidez.getDate() + (presupuestoOriginal.condiciones?.validezDias || 30));

    const nuevoPresupuesto = new PresupuestoModel({
      ...presupuestoOriginal,
      _id: new mongoose.Types.ObjectId(),
      codigo: undefined, // Se generará automáticamente
      ...clienteData,
      estado: EstadoPresupuesto.BORRADOR,
      fecha: fechaNueva,
      fechaValidez,
      fechaEnvio: undefined,
      fechaRespuesta: undefined,
      convertidoA: undefined,
      bloqueado: false,
      lineas: lineasDuplicadas,
      documentos: [], // No copiar documentos
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Duplicación',
        descripcion: `Duplicado del presupuesto ${presupuestoOriginal.codigo}`,
      }],
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
      modificadoPor: undefined,
      fechaModificacion: undefined,
    });

    // Recalcular totales
    const totales = this.calcularTotales(
      nuevoPresupuesto.lineas,
      nuevoPresupuesto.descuentoGlobalPorcentaje
    );
    nuevoPresupuesto.totales = totales as any;

    await nuevoPresupuesto.save();
    return nuevoPresupuesto;
  }

  // ============================================
  // CREAR REVISIÓN
  // ============================================

  async crearRevision(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPresupuesto> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    const presupuestoOriginal = await PresupuestoModel.findById(id).lean();
    if (!presupuestoOriginal) {
      throw new Error('Presupuesto no encontrado');
    }

    // Contar revisiones existentes
    const revisionesCount = await PresupuestoModel.countDocuments({
      presupuestoOrigenId: presupuestoOriginal._id,
    });

    const nuevaVersion = (presupuestoOriginal.version || 1) + revisionesCount + 1;

    const revision = new PresupuestoModel({
      ...presupuestoOriginal,
      _id: new mongoose.Types.ObjectId(),
      codigo: undefined,
      presupuestoOrigenId: presupuestoOriginal._id,
      version: nuevaVersion,
      estado: EstadoPresupuesto.BORRADOR,
      fecha: new Date(),
      fechaEnvio: undefined,
      fechaRespuesta: undefined,
      convertidoA: undefined,
      bloqueado: false,
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Revisión',
        descripcion: `Revisión ${nuevaVersion} del presupuesto ${presupuestoOriginal.codigo}`,
      }],
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    });

    await revision.save();
    return revision;
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
  ): Promise<IPresupuesto | null> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    const presupuesto = await PresupuestoModel.findById(id);
    if (!presupuesto) return null;

    const lineasActualizadas = presupuesto.lineas.map((linea) => {
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

    const totales = this.calcularTotales(lineasActualizadas, presupuesto.descuentoGlobalPorcentaje);

    presupuesto.lineas = lineasActualizadas as any;
    presupuesto.totales = totales as any;
    presupuesto.modificadoPor = usuarioId;
    presupuesto.fechaModificacion = new Date();
    presupuesto.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Aplicar margen',
      descripcion: `Margen ${opciones.tipo === 'porcentaje' ? opciones.valor + '%' : opciones.valor + '€'} aplicado a ${opciones.aplicarA}`,
    } as any);

    await presupuesto.save();
    return presupuesto;
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
  ): Promise<IPresupuesto | null> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);
    const ProductoModel = await getProductoModel(String(empresaId), dbConfig);

    const presupuesto = await PresupuestoModel.findById(id);
    if (!presupuesto) return null;

    let nuevasLineas: Partial<ILineaPresupuesto>[] = [];
    const ordenBase = presupuesto.lineas.length;

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
        unidad: producto.unidad || 'ud',
        precioUnitario: opciones.incluirPrecios ? (producto.precios?.pvp || 0) : 0,
        costeUnitario: opciones.incluirCostes ? (producto.precios?.coste || 0) : 0,
        descuento: 0,
        iva: producto.iva || 21,
        esEditable: true,
        incluidoEnTotal: true,
      }));
    } else if (opciones.origen === 'presupuesto' && opciones.documentoId) {
      // Importar desde otro presupuesto
      const otroPresupuesto = await PresupuestoModel.findById(opciones.documentoId).lean();
      if (otroPresupuesto) {
        nuevasLineas = otroPresupuesto.lineas.map((linea: any, index) => ({
          ...linea,
          _id: undefined,
          orden: ordenBase + index,
          cantidad: (linea.cantidad || 1) * (opciones.multiplicador || 1),
          precioUnitario: opciones.incluirPrecios ? linea.precioUnitario : 0,
          costeUnitario: opciones.incluirCostes ? linea.costeUnitario : 0,
          descuento: opciones.incluirDescuentos ? linea.descuento : 0,
        }));
      }
    }

    // Calcular líneas importadas
    const lineasCalculadas = nuevasLineas.map(linea => this.calcularLinea(linea));

    // Agregar al presupuesto
    presupuesto.lineas.push(...lineasCalculadas as any);

    // Recalcular totales
    const totales = this.calcularTotales(presupuesto.lineas, presupuesto.descuentoGlobalPorcentaje);
    presupuesto.totales = totales as any;

    presupuesto.modificadoPor = usuarioId;
    presupuesto.fechaModificacion = new Date();
    presupuesto.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Importar líneas',
      descripcion: `${lineasCalculadas.length} líneas importadas desde ${opciones.origen}`,
    } as any);

    await presupuesto.save();
    return presupuesto;
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);
    return (PresupuestoModel as any).obtenerEstadisticas();
  }

  // ============================================
  // SUGERIR CÓDIGO
  // ============================================

  async sugerirCodigo(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    serie: string = 'P'
  ): Promise<{ codigo: string; serie: string; numero: number }> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);
    return (PresupuestoModel as any).generarCodigo(serie);
  }

  // ============================================
  // ELIMINAR EN LOTE
  // ============================================

  async eliminarVarios(
    ids: string[],
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<number> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    const result = await PresupuestoModel.deleteMany({
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
  ): Promise<IPresupuesto[]> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    return PresupuestoModel.find({
      clienteId: new mongoose.Types.ObjectId(clienteId),
      activo: true,
    })
      .sort({ fecha: -1 })
      .select('codigo fecha estado totales.totalPresupuesto fechaValidez')
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
  ): Promise<IPresupuesto[]> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    return PresupuestoModel.find({
      proyectoId: new mongoose.Types.ObjectId(proyectoId),
      activo: true,
    })
      .sort({ fecha: -1 })
      .select('codigo fecha estado totales.totalPresupuesto')
      .lean();
  }
}

export const presupuestosService = new PresupuestosService();
