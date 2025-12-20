import { Model, Types, FilterQuery } from 'mongoose';
import { IRecibo, EstadoRecibo, TipoDocumentoOrigenRecibo } from './Recibo';
import { IDatabaseConfig } from '../empresa/Empresa';
import { getReciboModel, getVencimientoModel, getFacturaModel, getClienteModel } from '../../utils/dynamic-models.helper';
import { AppError } from '../../middleware/errorHandler.middleware';
import {
  CreateReciboDTO,
  UpdateReciboDTO,
  SearchRecibosDTO,
  GenerarRecibosDesdeFacturaDTO,
  GenerarRecibosDesdeVencimientosDTO,
  MarcarEnviadoDTO,
  MarcarCobradoDTO,
  MarcarDevueltoDTO,
  CrearRemesaRecibosDTO,
} from './recibos.dto';
import { EstadoVencimiento, MetodoPagoVencimiento } from '../../models/Vencimiento';

export class RecibosService {
  /**
   * Obtener modelo de Recibo para la empresa
   */
  private async getModel(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<IRecibo>> {
    return getReciboModel(empresaId, dbConfig);
  }

  /**
   * Generar número de recibo
   */
  private async generarNumero(
    ReciboModel: Model<IRecibo>,
    empresaId: string,
    serie: string = 'REC'
  ): Promise<string> {
    const año = new Date().getFullYear().toString().slice(-2);

    const ultimo = await ReciboModel.findOne({
      empresaId: new Types.ObjectId(empresaId),
      numero: { $regex: `^${serie}-${año}` },
    })
      .sort({ numero: -1 })
      .lean();

    let siguiente = 1;
    if (ultimo && ultimo.numero) {
      const partes = ultimo.numero.split('-');
      const ultimoNum = parseInt(partes[partes.length - 1], 10);
      if (!isNaN(ultimoNum)) {
        siguiente = ultimoNum + 1;
      }
    }

    return `${serie}-${año}-${siguiente.toString().padStart(5, '0')}`;
  }

  /**
   * Obtener todos los recibos con filtros y paginación
   */
  async findAll(empresaId: string, filters: SearchRecibosDTO, dbConfig: IDatabaseConfig) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);
    const {
      q,
      estado,
      clienteId,
      fechaDesde,
      fechaHasta,
      vencidos,
      remesaId,
      sinRemesa,
      puedeEnviarABanco,
      page = 1,
      limit = 25,
      sortBy = 'fechaVencimiento',
      sortOrder = 'asc',
    } = filters;

    const query: FilterQuery<IRecibo> = {
      empresaId: new Types.ObjectId(empresaId),
    };

    // Búsqueda de texto
    if (q) {
      query.$or = [
        { numero: { $regex: q, $options: 'i' } },
        { clienteNombre: { $regex: q, $options: 'i' } },
        { concepto: { $regex: q, $options: 'i' } },
      ];
    }

    // Filtros específicos
    if (estado) query.estado = estado;
    if (clienteId) query.clienteId = new Types.ObjectId(clienteId);

    // Filtro por fechas
    if (fechaDesde || fechaHasta) {
      query.fechaVencimiento = {};
      if (fechaDesde) query.fechaVencimiento.$gte = new Date(fechaDesde);
      if (fechaHasta) query.fechaVencimiento.$lte = new Date(fechaHasta);
    }

    // Filtro de vencidos
    if (vencidos === 'true') {
      query.fechaVencimiento = { ...query.fechaVencimiento, $lt: new Date() };
      query.estado = { $in: [EstadoRecibo.EMITIDO, EstadoRecibo.ENVIADO] };
    }

    // Filtro de remesa
    if (remesaId) {
      query.remesaId = new Types.ObjectId(remesaId);
    }
    if (sinRemesa === 'true') {
      query.remesaId = { $exists: false };
    }

    // Filtro de puede enviar a banco
    if (puedeEnviarABanco === 'true') {
      query.estado = EstadoRecibo.EMITIDO;
      query['mandatoSEPA.activo'] = true;
      query.ibanCliente = { $exists: true, $ne: null, $ne: '' };
    }

    // Ordenamiento
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar query
    const [data, total] = await Promise.all([
      ReciboModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      ReciboModel.countDocuments(query),
    ]);

    // Estadísticas
    const stats = await this.calcularEstadisticas(ReciboModel, empresaId);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    };
  }

  /**
   * Calcular estadísticas de recibos
   */
  private async calcularEstadisticas(ReciboModel: Model<IRecibo>, empresaId: string) {
    const hoy = new Date();

    const [porEstado, vencidos] = await Promise.all([
      ReciboModel.aggregate([
        { $match: { empresaId: new Types.ObjectId(empresaId) } },
        {
          $group: {
            _id: '$estado',
            total: { $sum: '$importe' },
            count: { $sum: 1 },
          },
        },
      ]),
      ReciboModel.aggregate([
        {
          $match: {
            empresaId: new Types.ObjectId(empresaId),
            estado: { $in: [EstadoRecibo.EMITIDO, EstadoRecibo.ENVIADO] },
            fechaVencimiento: { $lt: hoy },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$importe' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const emitidos = porEstado.find(p => p._id === EstadoRecibo.EMITIDO);
    const enviados = porEstado.find(p => p._id === EstadoRecibo.ENVIADO);
    const cobrados = porEstado.find(p => p._id === EstadoRecibo.COBRADO);
    const devueltos = porEstado.find(p => p._id === EstadoRecibo.DEVUELTO);

    return {
      totalEmitidos: emitidos?.total || 0,
      countEmitidos: emitidos?.count || 0,
      totalEnviados: enviados?.total || 0,
      countEnviados: enviados?.count || 0,
      totalCobrados: cobrados?.total || 0,
      countCobrados: cobrados?.count || 0,
      totalDevueltos: devueltos?.total || 0,
      countDevueltos: devueltos?.count || 0,
      totalVencido: vencidos[0]?.total || 0,
      countVencidos: vencidos[0]?.count || 0,
    };
  }

  /**
   * Obtener un recibo por ID
   */
  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);
    const recibo = await ReciboModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    }).lean();

    if (!recibo) {
      throw new AppError('Recibo no encontrado', 404);
    }

    return recibo;
  }

  /**
   * Crear un nuevo recibo
   */
  async create(
    empresaId: string,
    usuarioId: string,
    data: CreateReciboDTO,
    dbConfig: IDatabaseConfig
  ) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);

    const numero = await this.generarNumero(ReciboModel, empresaId, data.serie || 'REC');

    const recibo = new ReciboModel({
      ...data,
      empresaId: new Types.ObjectId(empresaId),
      numero,
      serie: data.serie || 'REC',
      clienteId: new Types.ObjectId(data.clienteId),
      documentoOrigen: data.documentoOrigen
        ? {
            ...data.documentoOrigen,
            id: data.documentoOrigen.id
              ? new Types.ObjectId(data.documentoOrigen.id)
              : undefined,
          }
        : { tipo: TipoDocumentoOrigenRecibo.MANUAL },
      vencimientoId: data.vencimientoId
        ? new Types.ObjectId(data.vencimientoId)
        : undefined,
      estado: EstadoRecibo.EMITIDO,
      creadoPor: new Types.ObjectId(usuarioId),
    });

    await recibo.save();
    return recibo.toObject();
  }

  /**
   * Generar recibos desde una factura
   */
  async generarDesdeFactura(
    empresaId: string,
    usuarioId: string,
    data: GenerarRecibosDesdeFacturaDTO,
    dbConfig: IDatabaseConfig
  ) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);
    const FacturaModel = await getFacturaModel(empresaId, dbConfig);
    const ClienteModel = await getClienteModel(empresaId, dbConfig);

    // Obtener factura
    const factura = await FacturaModel.findById(data.facturaId);
    if (!factura) {
      throw new AppError('Factura no encontrada', 404);
    }

    // Obtener cliente para datos adicionales
    const cliente = await ClienteModel.findById(factura.clienteId);

    // Obtener vencimientos de la factura
    const vencimientos = await VencimientoModel.find({
      documentoId: factura._id,
      tipo: 'cobro',
      estado: { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] },
      reciboId: { $exists: false },
    });

    if (vencimientos.length === 0) {
      throw new AppError('No hay vencimientos pendientes para generar recibos', 400);
    }

    const recibosCreados = [];

    for (const vencimiento of vencimientos) {
      const numero = await this.generarNumero(ReciboModel, empresaId, data.serie || 'REC');

      const recibo = new ReciboModel({
        empresaId: new Types.ObjectId(empresaId),
        numero,
        serie: data.serie || 'REC',
        documentoOrigen: {
          tipo: TipoDocumentoOrigenRecibo.FACTURA,
          id: factura._id,
          numero: factura.numero,
        },
        vencimientoId: vencimiento._id,
        clienteId: factura.clienteId,
        clienteNombre: factura.clienteNombre || cliente?.nombre || 'Sin nombre',
        clienteNIF: cliente?.nif,
        clienteDireccion: cliente?.direccion,
        clienteLocalidad: cliente?.localidad,
        clienteProvincia: cliente?.provincia,
        clienteCodigoPostal: cliente?.codigoPostal,
        concepto: `Factura ${factura.numero}`,
        importe: vencimiento.importePendiente,
        fechaEmision: new Date(),
        fechaVencimiento: vencimiento.fechaVencimiento,
        ibanCliente: cliente?.iban,
        bicCliente: cliente?.bic,
        mandatoSEPA: cliente?.mandatoSEPA
          ? {
              referencia: cliente.mandatoSEPA.referencia,
              fechaFirma: cliente.mandatoSEPA.fechaFirma,
              tipoAdeudo: cliente.mandatoSEPA.tipoAdeudo || 'RCUR',
              activo: true,
            }
          : undefined,
        estado: EstadoRecibo.EMITIDO,
        creadoPor: new Types.ObjectId(usuarioId),
      });

      await recibo.save();

      // Actualizar vencimiento
      vencimiento.reciboId = recibo._id;
      vencimiento.metodoPago = MetodoPagoVencimiento.DOMICILIACION;
      await vencimiento.save();

      recibosCreados.push(recibo.toObject());
    }

    return recibosCreados;
  }

  /**
   * Generar recibos desde vencimientos
   */
  async generarDesdeVencimientos(
    empresaId: string,
    usuarioId: string,
    data: GenerarRecibosDesdeVencimientosDTO,
    dbConfig: IDatabaseConfig
  ) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);
    const ClienteModel = await getClienteModel(empresaId, dbConfig);

    const recibosCreados = [];

    for (const vencimientoId of data.vencimientoIds) {
      const vencimiento = await VencimientoModel.findById(vencimientoId);
      if (!vencimiento) continue;

      // Verificar que no tenga recibo
      if (vencimiento.reciboId) continue;

      // Obtener cliente
      const cliente = vencimiento.clienteId
        ? await ClienteModel.findById(vencimiento.clienteId)
        : null;

      const numero = await this.generarNumero(ReciboModel, empresaId, data.serie || 'REC');

      const recibo = new ReciboModel({
        empresaId: new Types.ObjectId(empresaId),
        numero,
        serie: data.serie || 'REC',
        documentoOrigen: {
          tipo: TipoDocumentoOrigenRecibo.VENCIMIENTO,
          id: vencimiento._id,
          numero: vencimiento.numero,
        },
        vencimientoId: vencimiento._id,
        clienteId: vencimiento.clienteId,
        clienteNombre: vencimiento.terceroNombre,
        clienteNIF: vencimiento.terceroNif || cliente?.nif,
        clienteDireccion: cliente?.direccion,
        clienteLocalidad: cliente?.localidad,
        clienteProvincia: cliente?.provincia,
        clienteCodigoPostal: cliente?.codigoPostal,
        concepto: `Vencimiento ${vencimiento.numero}${vencimiento.documentoNumero ? ` - ${vencimiento.documentoNumero}` : ''}`,
        importe: vencimiento.importePendiente,
        fechaEmision: new Date(),
        fechaVencimiento: vencimiento.fechaVencimiento,
        ibanCliente: cliente?.iban,
        bicCliente: cliente?.bic,
        mandatoSEPA: cliente?.mandatoSEPA
          ? {
              referencia: cliente.mandatoSEPA.referencia,
              fechaFirma: cliente.mandatoSEPA.fechaFirma,
              tipoAdeudo: cliente.mandatoSEPA.tipoAdeudo || 'RCUR',
              activo: true,
            }
          : undefined,
        estado: EstadoRecibo.EMITIDO,
        creadoPor: new Types.ObjectId(usuarioId),
      });

      await recibo.save();

      // Actualizar vencimiento
      vencimiento.reciboId = recibo._id;
      vencimiento.metodoPago = MetodoPagoVencimiento.DOMICILIACION;
      await vencimiento.save();

      recibosCreados.push(recibo.toObject());
    }

    return recibosCreados;
  }

  /**
   * Actualizar un recibo
   */
  async update(
    id: string,
    empresaId: string,
    usuarioId: string,
    data: UpdateReciboDTO,
    dbConfig: IDatabaseConfig
  ) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);

    const recibo = await ReciboModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!recibo) {
      throw new AppError('Recibo no encontrado', 404);
    }

    // No permitir editar si no está en estado emitido
    if (recibo.estado !== EstadoRecibo.EMITIDO) {
      throw new AppError('Solo se pueden editar recibos en estado emitido', 400);
    }

    Object.assign(recibo, data);
    recibo.modificadoPor = new Types.ObjectId(usuarioId);
    await recibo.save();

    return recibo.toObject();
  }

  /**
   * Marcar recibo como enviado
   */
  async marcarEnviado(
    id: string,
    empresaId: string,
    usuarioId: string,
    data: MarcarEnviadoDTO,
    dbConfig: IDatabaseConfig
  ) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);

    const recibo = await ReciboModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!recibo) {
      throw new AppError('Recibo no encontrado', 404);
    }

    if (recibo.estado !== EstadoRecibo.EMITIDO) {
      throw new AppError('Solo se pueden enviar recibos en estado emitido', 400);
    }

    recibo.estado = EstadoRecibo.ENVIADO;
    recibo.fechaEnvio = data.fechaEnvio ? new Date(data.fechaEnvio) : new Date();
    recibo.modificadoPor = new Types.ObjectId(usuarioId);

    await recibo.save();

    return recibo.toObject();
  }

  /**
   * Marcar recibo como cobrado
   */
  async marcarCobrado(
    id: string,
    empresaId: string,
    usuarioId: string,
    data: MarcarCobradoDTO,
    dbConfig: IDatabaseConfig
  ) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);

    const recibo = await ReciboModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!recibo) {
      throw new AppError('Recibo no encontrado', 404);
    }

    if (recibo.estado === EstadoRecibo.ANULADO) {
      throw new AppError('No se puede cobrar un recibo anulado', 400);
    }

    recibo.estado = EstadoRecibo.COBRADO;
    recibo.fechaCobro = data.fechaCobro ? new Date(data.fechaCobro) : new Date();
    recibo.modificadoPor = new Types.ObjectId(usuarioId);

    await recibo.save();

    // Si tiene vencimiento asociado, marcarlo también
    if (recibo.vencimientoId) {
      const vencimiento = await VencimientoModel.findById(recibo.vencimientoId);
      if (vencimiento) {
        vencimiento.importeCobrado = vencimiento.importe;
        vencimiento.fechaCobro = recibo.fechaCobro;
        await vencimiento.save();
      }
    }

    return recibo.toObject();
  }

  /**
   * Marcar recibo como devuelto
   */
  async marcarDevuelto(
    id: string,
    empresaId: string,
    usuarioId: string,
    data: MarcarDevueltoDTO,
    dbConfig: IDatabaseConfig
  ) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);

    const recibo = await ReciboModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!recibo) {
      throw new AppError('Recibo no encontrado', 404);
    }

    if ([EstadoRecibo.DEVUELTO, EstadoRecibo.ANULADO].includes(recibo.estado)) {
      throw new AppError('El recibo ya está devuelto o anulado', 400);
    }

    recibo.estado = EstadoRecibo.DEVUELTO;
    recibo.fechaDevolucion = new Date();
    recibo.motivoDevolucion = data.motivo;
    recibo.comisionDevolucion = data.comision;
    recibo.modificadoPor = new Types.ObjectId(usuarioId);

    await recibo.save();

    // Si tiene vencimiento asociado, marcarlo como devuelto
    if (recibo.vencimientoId) {
      const vencimiento = await VencimientoModel.findById(recibo.vencimientoId);
      if (vencimiento) {
        vencimiento.estado = EstadoVencimiento.DEVUELTO;
        vencimiento.devolucion = {
          fecha: new Date(),
          motivo: data.motivo,
          comision: data.comision,
          reemitido: false,
        };
        await vencimiento.save();
      }
    }

    return recibo.toObject();
  }

  /**
   * Anular un recibo
   */
  async anular(
    id: string,
    empresaId: string,
    usuarioId: string,
    motivo: string,
    dbConfig: IDatabaseConfig
  ) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);

    const recibo = await ReciboModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!recibo) {
      throw new AppError('Recibo no encontrado', 404);
    }

    if (recibo.estado === EstadoRecibo.COBRADO) {
      throw new AppError('No se puede anular un recibo ya cobrado', 400);
    }

    recibo.estado = EstadoRecibo.ANULADO;
    recibo.observaciones = motivo
      ? `${recibo.observaciones || ''} [Anulado: ${motivo}]`.trim()
      : recibo.observaciones;
    recibo.modificadoPor = new Types.ObjectId(usuarioId);

    await recibo.save();

    // Quitar referencia del vencimiento
    if (recibo.vencimientoId) {
      await VencimientoModel.updateOne(
        { _id: recibo.vencimientoId },
        { $unset: { reciboId: 1 } }
      );
    }

    return recibo.toObject();
  }

  /**
   * Obtener recibos pendientes de envío a banco
   */
  async getPendientesEnvio(empresaId: string, dbConfig: IDatabaseConfig) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);

    const recibos = await ReciboModel.find({
      empresaId: new Types.ObjectId(empresaId),
      estado: EstadoRecibo.EMITIDO,
      'mandatoSEPA.activo': true,
      ibanCliente: { $exists: true, $ne: null, $ne: '' },
    })
      .sort({ fechaVencimiento: 1 })
      .lean();

    return recibos;
  }

  /**
   * Crear remesa de recibos
   */
  async crearRemesa(
    empresaId: string,
    usuarioId: string,
    data: CrearRemesaRecibosDTO,
    dbConfig: IDatabaseConfig
  ) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);

    // Generar número de remesa
    const año = new Date().getFullYear().toString().slice(-2);
    const ultimaRemesa = await ReciboModel.findOne({
      empresaId: new Types.ObjectId(empresaId),
      remesaNumero: { $regex: `^REM-REC-${año}` },
    })
      .sort({ remesaNumero: -1 })
      .lean();

    let siguienteNum = 1;
    if (ultimaRemesa && ultimaRemesa.remesaNumero) {
      const partes = ultimaRemesa.remesaNumero.split('-');
      const ultimoNum = parseInt(partes[partes.length - 1], 10);
      if (!isNaN(ultimoNum)) {
        siguienteNum = ultimoNum + 1;
      }
    }

    const remesaNumero = `REM-REC-${año}-${siguienteNum.toString().padStart(5, '0')}`;
    const remesaId = new Types.ObjectId();
    const fechaRemesa = data.fechaRemesa ? new Date(data.fechaRemesa) : new Date();

    // Actualizar recibos
    await ReciboModel.updateMany(
      {
        _id: { $in: data.reciboIds.map(id => new Types.ObjectId(id)) },
        empresaId: new Types.ObjectId(empresaId),
        estado: EstadoRecibo.EMITIDO,
      },
      {
        $set: {
          remesaId,
          remesaNumero,
          fechaRemesa,
          estado: EstadoRecibo.ENVIADO,
          fechaEnvio: new Date(),
          cuentaBancariaEmpresaId: data.cuentaBancariaEmpresaId
            ? new Types.ObjectId(data.cuentaBancariaEmpresaId)
            : undefined,
          modificadoPor: new Types.ObjectId(usuarioId),
        },
      }
    );

    // Obtener recibos actualizados
    const recibos = await ReciboModel.find({
      _id: { $in: data.reciboIds.map(id => new Types.ObjectId(id)) },
    }).lean();

    const totalRemesa = recibos.reduce((sum, r) => sum + r.importe, 0);

    return {
      remesaId: remesaId.toString(),
      remesaNumero,
      fechaRemesa,
      recibos,
      totalRemesa,
      countRecibos: recibos.length,
    };
  }

  /**
   * Eliminar un recibo
   */
  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ReciboModel = await this.getModel(empresaId, dbConfig);
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);

    const recibo = await ReciboModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!recibo) {
      throw new AppError('Recibo no encontrado', 404);
    }

    if (recibo.estado !== EstadoRecibo.EMITIDO) {
      throw new AppError('Solo se pueden eliminar recibos en estado emitido', 400);
    }

    // Quitar referencia del vencimiento
    if (recibo.vencimientoId) {
      await VencimientoModel.updateOne(
        { _id: recibo.vencimientoId },
        { $unset: { reciboId: 1 } }
      );
    }

    await recibo.deleteOne();

    return { message: 'Recibo eliminado correctamente' };
  }
}

export const recibosService = new RecibosService();
