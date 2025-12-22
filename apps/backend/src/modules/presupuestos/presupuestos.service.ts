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
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { getPresupuestoModel, getProductoModel, getClienteModel, getProyectoModel, getAgenteComercialModel, getFormaPagoModel, getTerminoPagoModel, getUserModel } from '@/utils/dynamic-models.helper';
import { presupuestosPDFService } from './presupuestos-pdf.service';
import { empresaService } from '../empresa/empresa.service';
import Empresa from '@/modules/empresa/Empresa';
import { parseAdvancedFilters, mergeFilters } from '@/utils/advanced-filters.helper';
import { preciosService } from '../precios/precios.service';

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
  // PROCESAR LÍNEAS CON PRECIOS DE TARIFAS/OFERTAS
  // ============================================

  /**
   * Procesa las líneas obteniendo precios de tarifas/ofertas cuando corresponde
   */
  private async procesarLineasConPrecios(
    lineas: any[],
    clienteId: string | undefined,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any[]> {
    const lineasProcesadas: any[] = [];

    for (const linea of lineas) {
      // Solo procesar líneas con producto y sin precio manual especificado
      if (linea.productoId && (linea.precioUnitario === undefined || linea.precioUnitario === null || linea.precioUnitario === 0)) {
        try {
          const precioCalculado = await preciosService.obtenerPrecioProducto({
            productoId: linea.productoId,
            varianteId: linea.variante?.varianteId,
            clienteId,
            cantidad: linea.cantidad || 1,
            empresaId,
            dbConfig,
          });

          lineasProcesadas.push({
            ...linea,
            precioUnitario: precioCalculado.precioFinal,
            infoPrecio: {
              origen: precioCalculado.origen,
              tarifaId: precioCalculado.detalleOrigen?.tarifaId,
              tarifaNombre: precioCalculado.detalleOrigen?.tarifaNombre,
              ofertaId: precioCalculado.detalleOrigen?.ofertaId,
              ofertaNombre: precioCalculado.detalleOrigen?.ofertaNombre,
              ofertaTipo: precioCalculado.detalleOrigen?.ofertaTipo,
              etiquetaOferta: precioCalculado.etiquetaOferta,
              precioOriginal: precioCalculado.precioBase,
              unidadesGratis: precioCalculado.unidadesGratis,
            },
          });
        } catch (error) {
          // Si falla obtener precio, usar la línea original
          lineasProcesadas.push(linea);
        }
      } else {
        // Si tiene precio manual, marcar origen como manual
        if (linea.precioUnitario !== undefined && linea.precioUnitario !== null && linea.precioUnitario > 0) {
          lineasProcesadas.push({
            ...linea,
            infoPrecio: { origen: 'manual' },
          });
        } else {
          lineasProcesadas.push(linea);
        }
      }
    }

    return lineasProcesadas;
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
    const ClienteModel = await getClienteModel(String(empresaId), dbConfig);

    // Generar código y número automáticamente
    const serie = createPresupuestoDto.serie || 'P';
    const { codigo, numero } = await this.generarCodigoNumero(PresupuestoModel, serie);

    // Obtener datos del cliente para aplicar descuentos
    let descuentoGlobal = createPresupuestoDto.descuentoGlobalPorcentaje || 0;
    let lineas = createPresupuestoDto.lineas || [];

    if (createPresupuestoDto.clienteId) {
      const cliente = await ClienteModel.findById(createPresupuestoDto.clienteId).lean();

      if (cliente && cliente.aplicarDescuentoAutomatico !== false) {
        // Aplicar descuento general del cliente si no se especifica uno
        if (cliente.descuentoGeneral && !createPresupuestoDto.descuentoGlobalPorcentaje) {
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

    // Procesar líneas con precios de tarifas/ofertas
    lineas = await this.procesarLineasConPrecios(
      lineas,
      createPresupuestoDto.clienteId,
      String(empresaId),
      dbConfig
    );

    // Calcular líneas
    const lineasCalculadas = lineas.map((linea, index) =>
      this.calcularLinea({ ...linea, orden: linea.orden ?? index })
    );

    // Calcular totales
    const totales = this.calcularTotales(
      lineasCalculadas,
      descuentoGlobal
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
      descuentoGlobalPorcentaje: descuentoGlobal,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Creación',
        descripcion: descuentoGlobal > 0
          ? `Presupuesto creado con ${descuentoGlobal}% de descuento aplicado`
          : 'Presupuesto creado',
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
      porCaducar,
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

    // Proximos a caducar (en los proximos 7 dias)
    if (porCaducar === 'true') {
      const en7Dias = new Date();
      en7Dias.setDate(en7Dias.getDate() + 7);
      filter.fechaValidez = { $gte: hoy, $lte: en7Dias };
      filter.estado = { $in: [EstadoPresupuesto.ENVIADO, EstadoPresupuesto.PENDIENTE] };
    }

    // Tags
    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim().toLowerCase());
      filter.tags = { $in: tagsArray };
    }

    // FILTROS AVANZADOS - Procesar operadores como _ne, _gt, _lt, etc.
    const allowedAdvancedFields = [
      'estado', 'codigo', 'clienteNombre', 'titulo', 'serie',
      'activo', 'agenteComercial', 'proyecto',
    ];
    const advancedFilters = parseAdvancedFilters(query, allowedAdvancedFields);

    // Combinar filtros existentes con filtros avanzados
    const finalFilter = mergeFilters(filter, advancedFilters);

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (pageNum - 1) * limitNum;

    // Ejecutar consulta
    const [presupuestos, total] = await Promise.all([
      PresupuestoModel.find(finalFilter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('clienteId', 'codigo nombre nombreComercial')
        .populate('proyectoId', 'codigo nombre')
        .populate('agenteComercialId', 'codigo nombre apellidos')
        .lean(),
      PresupuestoModel.countDocuments(finalFilter),
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
      .populate('modificadoPor', 'nombre email')
      .populate('historial.usuarioId', 'nombre email')
      .populate('notasSeguimiento.usuarioId', 'nombre email');

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

  // ============================================
  // ENVÍO POR EMAIL
  // ============================================

  /**
   * Enviar presupuesto por email con PDF adjunto
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
      pdfOptions?: {
        mostrarDescripcion?: 'ninguna' | 'corta' | 'larga';
        mostrarReferencias?: boolean;
        mostrarCondiciones?: boolean;
        mostrarFirmas?: boolean;
        mostrarCuentaBancaria?: boolean;
        mostrarLOPD?: boolean;
        mostrarRegistroMercantil?: boolean;
      };
    }
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    // Obtener presupuesto completo
    const presupuesto = await PresupuestoModel.findById(id)
      .populate('clienteId', 'nombre email')
      .lean();

    if (!presupuesto) {
      return { success: false, message: 'Presupuesto no encontrado' };
    }

    // Obtener email del cliente
    const clienteEmail = presupuesto.clienteEmail ||
      (typeof presupuesto.clienteId === 'object' ? (presupuesto.clienteId as any).email : null);

    if (!clienteEmail) {
      return { success: false, message: 'El cliente no tiene email configurado' };
    }

    // Obtener datos de la empresa
    const empresa = await Empresa.findById(empresaId).lean();
    if (!empresa) {
      return { success: false, message: 'Empresa no encontrada' };
    }

    try {
      // Generar PDF
      const pdfBuffer = await presupuestosPDFService.generarPDF(
        presupuesto as IPresupuesto,
        String(empresaId),
        opciones?.pdfOptions
      );

      // Formatear datos para el email
      const clienteNombre = typeof presupuesto.clienteId === 'object'
        ? (presupuesto.clienteId as any).nombre
        : presupuesto.clienteNombre;

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
      const asunto = opciones?.asunto || `Presupuesto ${presupuesto.codigo}`;
      const mensajePersonalizado = opciones?.mensaje || '';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1a1a1a; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">
            Presupuesto ${presupuesto.codigo}
          </h2>

          <p>Estimado/a ${clienteNombre},</p>

          ${mensajePersonalizado ? `<p>${mensajePersonalizado}</p>` : '<p>Adjunto le enviamos el presupuesto solicitado con los siguientes detalles:</p>'}

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Código</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${presupuesto.codigo}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Fecha</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(presupuesto.fecha)}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Válido hasta</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(presupuesto.fechaValidez)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Importe Total</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #3B82F6;">
                ${formatCurrency(presupuesto.totales?.totalPresupuesto || 0)}
              </td>
            </tr>
          </table>

          ${presupuesto.titulo ? `<p><strong>Concepto:</strong> ${presupuesto.titulo}</p>` : ''}

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
Presupuesto ${presupuesto.codigo}

Estimado/a ${clienteNombre},

${mensajePersonalizado || 'Adjunto le enviamos el presupuesto solicitado.'}

- Código: ${presupuesto.codigo}
- Fecha: ${formatDate(presupuesto.fecha)}
- Válido hasta: ${formatDate(presupuesto.fechaValidez)}
- Importe Total: ${formatCurrency(presupuesto.totales?.totalPresupuesto || 0)}

${presupuesto.titulo ? `Concepto: ${presupuesto.titulo}` : ''}

Quedamos a su disposición para cualquier consulta.

Saludos cordiales,
${empresa.nombreComercial || empresa.nombre}
${empresa.telefono ? `Tel: ${empresa.telefono}` : ''}
      `;

      // Enviar email con PDF adjunto
      const result = await empresaService.sendEmail(String(empresaId), {
        to: clienteEmail,
        subject: asunto,
        html: htmlContent,
        text: textContent,
        cc: opciones?.cc,
        bcc: opciones?.bcc,
        attachments: [
          {
            filename: `Presupuesto_${presupuesto.codigo}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      if (result.success) {
        // Actualizar estado a enviado si estaba en borrador
        if (presupuesto.estado === EstadoPresupuesto.BORRADOR) {
          await PresupuestoModel.findByIdAndUpdate(id, {
            estado: EstadoPresupuesto.ENVIADO,
            fechaEnvio: new Date(),
            modificadoPor: usuarioId,
            fechaModificacion: new Date(),
            $inc: { contadorEnvios: 1 },
            $push: {
              historial: {
                fecha: new Date(),
                usuarioId,
                accion: 'Envío por email',
                descripcion: `Presupuesto enviado por email a ${clienteEmail}`,
              },
            },
          });
        } else {
          // Registrar reenvío e incrementar contador
          await PresupuestoModel.findByIdAndUpdate(id, {
            $inc: { contadorEnvios: 1 },
            $push: {
              historial: {
                fecha: new Date(),
                usuarioId,
                accion: 'Reenvío por email',
                descripcion: `Presupuesto reenviado por email a ${clienteEmail}`,
              },
            },
          });
        }

        return {
          success: true,
          message: `Email enviado correctamente a ${clienteEmail}`,
          messageId: result.messageId,
        };
      }

      return { success: false, message: result.error || 'Error al enviar email' };
    } catch (error: any) {
      console.error('Error al enviar presupuesto por email:', error);
      return { success: false, message: error.message || 'Error al generar o enviar email' };
    }
  }

  /**
   * Enviar múltiples presupuestos por email (envío masivo)
   */
  async enviarMasivoPorEmail(
    ids: string[],
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    opciones?: {
      asunto?: string;
      mensaje?: string;
      pdfOptions?: {
        mostrarDescripcion?: 'ninguna' | 'corta' | 'larga';
        mostrarReferencias?: boolean;
        mostrarCondiciones?: boolean;
        mostrarFirmas?: boolean;
        mostrarCuentaBancaria?: boolean;
        mostrarLOPD?: boolean;
        mostrarRegistroMercantil?: boolean;
      };
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
        // Obtener código para el resultado
        const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);
        const presupuesto = await PresupuestoModel.findById(id).select('codigo').lean();
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

  /**
   * Generar URL para WhatsApp con el presupuesto
   */
  async generarURLWhatsApp(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{ success: boolean; url?: string; message?: string }> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    const presupuesto = await PresupuestoModel.findById(id)
      .select('codigo clienteNombre clienteTelefono totales.totalPresupuesto fechaValidez')
      .lean();

    if (!presupuesto) {
      return { success: false, message: 'Presupuesto no encontrado' };
    }

    let telefono = presupuesto.clienteTelefono?.replace(/\s/g, '').replace(/[^0-9+]/g, '');
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

    const mensaje = encodeURIComponent(
      `Hola ${presupuesto.clienteNombre},\n\n` +
      `Le enviamos el presupuesto *${presupuesto.codigo}* por un importe de *${formatCurrency(presupuesto.totales?.totalPresupuesto || 0)}*.\n\n` +
      `Válido hasta: ${formatDate(presupuesto.fechaValidez)}\n\n` +
      `Quedamos a su disposición para cualquier consulta.`
    );

    return {
      success: true,
      url: `https://wa.me/${telefono}?text=${mensaje}`,
    };
  }

  /**
   * Generar URLs de WhatsApp para múltiples presupuestos
   */
  async generarURLsWhatsAppMasivo(
    ids: string[],
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{
    success: boolean;
    resultados: Array<{ id: string; codigo: string; url?: string; telefono?: string; clienteNombre?: string; error?: string }>;
  }> {
    const resultados: Array<{ id: string; codigo: string; url?: string; telefono?: string; clienteNombre?: string; error?: string }> = [];
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    for (const id of ids) {
      try {
        const presupuesto = await PresupuestoModel.findById(id)
          .select('codigo clienteNombre clienteTelefono totales.totalPresupuesto fechaValidez')
          .lean();

        if (!presupuesto) {
          resultados.push({ id, codigo: id, error: 'No encontrado' });
          continue;
        }

        const result = await this.generarURLWhatsApp(id, empresaId, dbConfig);

        if (result.success) {
          resultados.push({
            id,
            codigo: presupuesto.codigo,
            url: result.url,
            telefono: presupuesto.clienteTelefono,
            clienteNombre: presupuesto.clienteNombre,
          });
        } else {
          resultados.push({
            id,
            codigo: presupuesto.codigo,
            error: result.message,
          });
        }
      } catch (error: any) {
        resultados.push({ id, codigo: id, error: error.message || 'Error' });
      }
    }

    return {
      success: resultados.some(r => r.url),
      resultados,
    };
  }

  /**
   * Añadir nota de seguimiento a un presupuesto
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
  ): Promise<IPresupuesto> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);
    const presupuesto = await PresupuestoModel.findByIdAndUpdate(
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

    if (!presupuesto) {
      throw new Error('Presupuesto no encontrado');
    }

    return presupuesto;
  }

  /**
   * Eliminar nota de seguimiento
   */
  async deleteNotaSeguimiento(
    id: string,
    notaId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPresupuesto> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);
    const presupuesto = await PresupuestoModel.findByIdAndUpdate(
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

    if (!presupuesto) {
      throw new Error('Presupuesto no encontrado');
    }

    return presupuesto;
  }

  // ============================================
  // ALERTAS DE VALIDEZ
  // ============================================

  /**
   * Obtener presupuestos próximos a expirar y expirados pendientes
   */
  async getAlertasValidez(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    diasAlerta: number = 7
  ): Promise<{
    proximosAExpirar: any[];
    expirados: any[];
    sinRespuesta: any[];
  }> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(fechaLimite.getDate() + diasAlerta);

    // Presupuestos próximos a expirar (enviados o pendientes, expiran en los próximos X días)
    const proximosAExpirar = await PresupuestoModel.find({
      estado: { $in: [EstadoPresupuesto.ENVIADO, EstadoPresupuesto.PENDIENTE] },
      fechaValidez: { $gte: hoy, $lte: fechaLimite },
      activo: true,
    })
      .select('codigo clienteNombre fechaValidez estado totales.totalPresupuesto fechaEnvio')
      .populate('clienteId', 'nombre')
      .sort({ fechaValidez: 1 })
      .limit(20)
      .lean();

    // Presupuestos expirados sin respuesta
    const expirados = await PresupuestoModel.find({
      estado: { $in: [EstadoPresupuesto.ENVIADO, EstadoPresupuesto.PENDIENTE] },
      fechaValidez: { $lt: hoy },
      activo: true,
    })
      .select('codigo clienteNombre fechaValidez estado totales.totalPresupuesto fechaEnvio')
      .populate('clienteId', 'nombre')
      .sort({ fechaValidez: -1 })
      .limit(20)
      .lean();

    // Presupuestos enviados hace más de X días sin respuesta
    const fechaEnvioLimite = new Date(hoy);
    fechaEnvioLimite.setDate(fechaEnvioLimite.getDate() - diasAlerta);

    const sinRespuesta = await PresupuestoModel.find({
      estado: EstadoPresupuesto.ENVIADO,
      fechaEnvio: { $lte: fechaEnvioLimite },
      fechaValidez: { $gte: hoy }, // Aún vigentes
      activo: true,
    })
      .select('codigo clienteNombre fechaValidez estado totales.totalPresupuesto fechaEnvio contadorEnvios')
      .populate('clienteId', 'nombre')
      .sort({ fechaEnvio: 1 })
      .limit(20)
      .lean();

    return {
      proximosAExpirar,
      expirados,
      sinRespuesta,
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
      aceptados: number;
      rechazados: number;
      pendientes: number;
      borradores: number;
      enviados: number;
      valorTotal: number;
      valorAceptados: number;
      tasaConversion: number;
      tiempoMedioRespuesta: number;
    };
    porEstado: Array<{ estado: string; cantidad: number; valor: number }>;
    evolucionMensual: Array<{
      mes: string;
      creados: number;
      aceptados: number;
      rechazados: number;
      valorCreados: number;
      valorAceptados: number;
    }>;
    topClientes: Array<{
      clienteId: string;
      clienteNombre: string;
      cantidad: number;
      valorTotal: number;
      aceptados: number;
    }>;
    topAgentes: Array<{
      agenteId: string;
      agenteNombre: string;
      cantidad: number;
      valorTotal: number;
      tasaConversion: number;
    }>;
  }> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    const hoy = new Date();
    const inicioAño = new Date(hoy.getFullYear(), 0, 1);
    const desde = periodo?.desde || inicioAño;
    const hasta = periodo?.hasta || hoy;

    // Filtro base
    const filtroFecha = { fecha: { $gte: desde, $lte: hasta } };

    // Obtener todos los presupuestos del periodo
    const presupuestos = await PresupuestoModel.find({
      ...filtroFecha,
      activo: true,
    })
      .select('estado fecha fechaEnvio fechaRespuesta clienteId clienteNombre agenteComercialId totales.totalPresupuesto')
      .populate('agenteComercialId', 'nombre apellidos')
      .lean();

    // Calcular resumen
    const total = presupuestos.length;
    const aceptados = presupuestos.filter(p => p.estado === EstadoPresupuesto.ACEPTADO).length;
    const rechazados = presupuestos.filter(p => p.estado === EstadoPresupuesto.RECHAZADO).length;
    const pendientes = presupuestos.filter(p => [EstadoPresupuesto.ENVIADO, EstadoPresupuesto.PENDIENTE].includes(p.estado as EstadoPresupuesto)).length;
    const borradores = presupuestos.filter(p => p.estado === EstadoPresupuesto.BORRADOR).length;
    const enviados = presupuestos.filter(p => p.estado === EstadoPresupuesto.ENVIADO).length;
    const valorTotal = presupuestos.reduce((sum, p) => sum + (p.totales?.totalPresupuesto || 0), 0);
    const valorAceptados = presupuestos
      .filter(p => p.estado === EstadoPresupuesto.ACEPTADO)
      .reduce((sum, p) => sum + (p.totales?.totalPresupuesto || 0), 0);

    const presupuestosConRespuesta = presupuestos.filter(
      p => p.fechaEnvio && p.fechaRespuesta &&
      [EstadoPresupuesto.ACEPTADO, EstadoPresupuesto.RECHAZADO].includes(p.estado as EstadoPresupuesto)
    );
    const tiempoMedioRespuesta = presupuestosConRespuesta.length > 0
      ? presupuestosConRespuesta.reduce((sum, p) => {
          const dias = Math.ceil(
            (new Date(p.fechaRespuesta!).getTime() - new Date(p.fechaEnvio!).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + dias;
        }, 0) / presupuestosConRespuesta.length
      : 0;

    const tasaConversion = (aceptados + rechazados) > 0
      ? (aceptados / (aceptados + rechazados)) * 100
      : 0;

    // Por estado
    const porEstado = Object.values(EstadoPresupuesto).map(estado => {
      const presupuestosEstado = presupuestos.filter(p => p.estado === estado);
      return {
        estado,
        cantidad: presupuestosEstado.length,
        valor: presupuestosEstado.reduce((sum, p) => sum + (p.totales?.totalPresupuesto || 0), 0),
      };
    }).filter(e => e.cantidad > 0);

    // Evolución mensual (últimos 12 meses)
    const evolucionMensual = [];
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      const mesKey = fecha.toISOString().substring(0, 7); // YYYY-MM

      const presupuestosMes = presupuestos.filter(p => {
        const fechaP = new Date(p.fecha);
        return fechaP >= fecha && fechaP <= finMes;
      });

      const aceptadosMes = presupuestosMes.filter(p => p.estado === EstadoPresupuesto.ACEPTADO);
      const rechazadosMes = presupuestosMes.filter(p => p.estado === EstadoPresupuesto.RECHAZADO);

      evolucionMensual.push({
        mes: mesKey,
        creados: presupuestosMes.length,
        aceptados: aceptadosMes.length,
        rechazados: rechazadosMes.length,
        valorCreados: presupuestosMes.reduce((sum, p) => sum + (p.totales?.totalPresupuesto || 0), 0),
        valorAceptados: aceptadosMes.reduce((sum, p) => sum + (p.totales?.totalPresupuesto || 0), 0),
      });
    }

    // Top clientes
    const clientesMap = new Map<string, { nombre: string; cantidad: number; valor: number; aceptados: number }>();
    presupuestos.forEach(p => {
      const clienteId = String(p.clienteId);
      const current = clientesMap.get(clienteId) || { nombre: p.clienteNombre, cantidad: 0, valor: 0, aceptados: 0 };
      current.cantidad++;
      current.valor += p.totales?.totalPresupuesto || 0;
      if (p.estado === EstadoPresupuesto.ACEPTADO) current.aceptados++;
      clientesMap.set(clienteId, current);
    });
    const topClientes = Array.from(clientesMap.entries())
      .map(([id, data]) => ({ clienteId: id, clienteNombre: data.nombre, ...data }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    // Top agentes
    const agentesMap = new Map<string, { nombre: string; cantidad: number; valor: number; aceptados: number; total: number }>();
    presupuestos.filter(p => p.agenteComercialId).forEach(p => {
      const agenteId = String((p.agenteComercialId as any)._id || p.agenteComercialId);
      const agente = p.agenteComercialId as any;
      const nombre = agente?.nombre ? `${agente.nombre} ${agente.apellidos || ''}`.trim() : 'Sin asignar';
      const current = agentesMap.get(agenteId) || { nombre, cantidad: 0, valor: 0, aceptados: 0, total: 0 };
      current.cantidad++;
      current.valor += p.totales?.totalPresupuesto || 0;
      if (p.estado === EstadoPresupuesto.ACEPTADO) current.aceptados++;
      if ([EstadoPresupuesto.ACEPTADO, EstadoPresupuesto.RECHAZADO].includes(p.estado as EstadoPresupuesto)) current.total++;
      agentesMap.set(agenteId, current);
    });
    const topAgentes = Array.from(agentesMap.entries())
      .map(([id, data]) => ({
        agenteId: id,
        agenteNombre: data.nombre,
        cantidad: data.cantidad,
        valorTotal: data.valor,
        tasaConversion: data.total > 0 ? (data.aceptados / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 5);

    return {
      resumen: {
        total,
        aceptados,
        rechazados,
        pendientes,
        borradores,
        enviados,
        valorTotal: Math.round(valorTotal * 100) / 100,
        valorAceptados: Math.round(valorAceptados * 100) / 100,
        tasaConversion: Math.round(tasaConversion * 10) / 10,
        tiempoMedioRespuesta: Math.round(tiempoMedioRespuesta * 10) / 10,
      },
      porEstado,
      evolucionMensual,
      topClientes,
      topAgentes,
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
    proximosAExpirar: number;
    expirados: number;
    sinRespuesta: number;
    total: number;
  }> {
    const PresupuestoModel = await this.getModeloPresupuesto(String(empresaId), dbConfig);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(fechaLimite.getDate() + diasAlerta);

    const fechaEnvioLimite = new Date(hoy);
    fechaEnvioLimite.setDate(fechaEnvioLimite.getDate() - diasAlerta);

    const [proximosAExpirar, expirados, sinRespuesta] = await Promise.all([
      PresupuestoModel.countDocuments({
        estado: { $in: [EstadoPresupuesto.ENVIADO, EstadoPresupuesto.PENDIENTE] },
        fechaValidez: { $gte: hoy, $lte: fechaLimite },
        activo: true,
      }),
      PresupuestoModel.countDocuments({
        estado: { $in: [EstadoPresupuesto.ENVIADO, EstadoPresupuesto.PENDIENTE] },
        fechaValidez: { $lt: hoy },
        activo: true,
      }),
      PresupuestoModel.countDocuments({
        estado: EstadoPresupuesto.ENVIADO,
        fechaEnvio: { $lte: fechaEnvioLimite },
        fechaValidez: { $gte: hoy },
        activo: true,
      }),
    ]);

    return {
      proximosAExpirar,
      expirados,
      sinRespuesta,
      total: proximosAExpirar + expirados + sinRespuesta,
    };
  }
}

export const presupuestosService = new PresupuestosService();
