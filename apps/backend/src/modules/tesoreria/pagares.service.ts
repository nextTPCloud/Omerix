import { Model, Types, FilterQuery } from 'mongoose';
import { IPagare, TipoPagare, EstadoPagare, TipoDocumentoOrigenPagare } from './Pagare';
import { IDatabaseConfig } from '../empresa/Empresa';
import { getPagareModel, getVencimientoModel } from '../../utils/dynamic-models.helper';
import { AppError } from '../../middleware/errorHandler.middleware';
import {
  CreatePagareDTO,
  UpdatePagareDTO,
  SearchPagaresDTO,
  CrearPagareDesdeVencimientoDTO,
  MarcarCobradoDTO,
  MarcarDevueltoDTO,
  CrearRemesaPagaresDTO,
} from './pagares.dto';
import { IVencimiento, EstadoVencimiento, MetodoPagoVencimiento } from '../../models/Vencimiento';

export class PagaresService {
  /**
   * Obtener modelo de Pagaré para la empresa
   */
  private async getModel(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<IPagare>> {
    return getPagareModel(empresaId, dbConfig);
  }

  /**
   * Generar número de pagaré
   */
  private async generarNumero(
    PagareModel: Model<IPagare>,
    empresaId: string,
    tipo: TipoPagare
  ): Promise<string> {
    const prefijo = tipo === TipoPagare.EMITIDO ? 'PAG-E' : 'PAG-R';
    const año = new Date().getFullYear().toString().slice(-2);

    const ultimo = await PagareModel.findOne({
      empresaId: new Types.ObjectId(empresaId),
      numero: { $regex: `^${prefijo}-${año}` },
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

    return `${prefijo}-${año}-${siguiente.toString().padStart(5, '0')}`;
  }

  /**
   * Obtener todos los pagarés con filtros y paginación
   */
  async findAll(empresaId: string, filters: SearchPagaresDTO, dbConfig: IDatabaseConfig) {
    const PagareModel = await this.getModel(empresaId, dbConfig);
    const {
      q,
      tipo,
      estado,
      terceroId,
      terceroTipo,
      fechaDesde,
      fechaHasta,
      vencidos,
      remesaId,
      sinRemesa,
      page = 1,
      limit = 25,
      sortBy = 'fechaVencimiento',
      sortOrder = 'asc',
    } = filters;

    const query: FilterQuery<IPagare> = {
      empresaId: new Types.ObjectId(empresaId),
    };

    // Búsqueda de texto
    if (q) {
      query.$or = [
        { numero: { $regex: q, $options: 'i' } },
        { terceroNombre: { $regex: q, $options: 'i' } },
        { numeroPagare: { $regex: q, $options: 'i' } },
      ];
    }

    // Filtros específicos
    if (tipo) query.tipo = tipo;
    if (estado) query.estado = estado;
    if (terceroId) query.terceroId = new Types.ObjectId(terceroId);
    if (terceroTipo) query.terceroTipo = terceroTipo;

    // Filtro por fechas
    if (fechaDesde || fechaHasta) {
      query.fechaVencimiento = {};
      if (fechaDesde) query.fechaVencimiento.$gte = new Date(fechaDesde);
      if (fechaHasta) query.fechaVencimiento.$lte = new Date(fechaHasta);
    }

    // Filtro de vencidos
    if (vencidos === 'true') {
      query.fechaVencimiento = { ...query.fechaVencimiento, $lt: new Date() };
      query.estado = { $in: [EstadoPagare.PENDIENTE, EstadoPagare.EN_CARTERA] };
    }

    // Filtro de remesa
    if (remesaId) {
      query.remesaId = new Types.ObjectId(remesaId);
    }
    if (sinRemesa === 'true') {
      query.remesaId = { $exists: false };
    }

    // Ordenamiento
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar query
    const [data, total] = await Promise.all([
      PagareModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      PagareModel.countDocuments(query),
    ]);

    // Estadísticas
    const stats = await this.calcularEstadisticas(PagareModel, empresaId);

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
   * Calcular estadísticas de pagarés
   */
  private async calcularEstadisticas(PagareModel: Model<IPagare>, empresaId: string) {
    const hoy = new Date();

    const [pendientes, vencidos, devueltos] = await Promise.all([
      PagareModel.aggregate([
        {
          $match: {
            empresaId: new Types.ObjectId(empresaId),
            estado: { $in: [EstadoPagare.PENDIENTE, EstadoPagare.EN_CARTERA] },
          },
        },
        {
          $group: {
            _id: '$tipo',
            total: { $sum: '$importe' },
            count: { $sum: 1 },
          },
        },
      ]),
      PagareModel.aggregate([
        {
          $match: {
            empresaId: new Types.ObjectId(empresaId),
            estado: { $in: [EstadoPagare.PENDIENTE, EstadoPagare.EN_CARTERA] },
            fechaVencimiento: { $lt: hoy },
          },
        },
        {
          $group: {
            _id: '$tipo',
            total: { $sum: '$importe' },
            count: { $sum: 1 },
          },
        },
      ]),
      PagareModel.countDocuments({
        empresaId: new Types.ObjectId(empresaId),
        estado: EstadoPagare.DEVUELTO,
      }),
    ]);

    const pendientesRecibidos = pendientes.find(p => p._id === TipoPagare.RECIBIDO);
    const pendientesEmitidos = pendientes.find(p => p._id === TipoPagare.EMITIDO);
    const vencidosRecibidos = vencidos.find(p => p._id === TipoPagare.RECIBIDO);
    const vencidosEmitidos = vencidos.find(p => p._id === TipoPagare.EMITIDO);

    return {
      totalPendienteCobro: pendientesRecibidos?.total || 0,
      countPendientesCobro: pendientesRecibidos?.count || 0,
      totalPendientePago: pendientesEmitidos?.total || 0,
      countPendientesPago: pendientesEmitidos?.count || 0,
      totalVencidoCobro: vencidosRecibidos?.total || 0,
      countVencidosCobro: vencidosRecibidos?.count || 0,
      totalVencidoPago: vencidosEmitidos?.total || 0,
      countVencidosPago: vencidosEmitidos?.count || 0,
      countDevueltos: devueltos,
    };
  }

  /**
   * Obtener un pagaré por ID
   */
  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const PagareModel = await this.getModel(empresaId, dbConfig);
    const pagare = await PagareModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    }).lean();

    if (!pagare) {
      throw new AppError('Pagaré no encontrado', 404);
    }

    return pagare;
  }

  /**
   * Crear un nuevo pagaré
   */
  async create(
    empresaId: string,
    usuarioId: string,
    data: CreatePagareDTO,
    dbConfig: IDatabaseConfig
  ) {
    const PagareModel = await this.getModel(empresaId, dbConfig);

    const numero = await this.generarNumero(PagareModel, empresaId, data.tipo);

    const pagare = new PagareModel({
      ...data,
      empresaId: new Types.ObjectId(empresaId),
      numero,
      terceroId: new Types.ObjectId(data.terceroId),
      documentoOrigen: data.documentoOrigen
        ? {
            ...data.documentoOrigen,
            id: data.documentoOrigen.id
              ? new Types.ObjectId(data.documentoOrigen.id)
              : undefined,
          }
        : { tipo: TipoDocumentoOrigenPagare.MANUAL },
      vencimientoId: data.vencimientoId
        ? new Types.ObjectId(data.vencimientoId)
        : undefined,
      estado: EstadoPagare.PENDIENTE,
      historial: [
        {
          fecha: new Date(),
          estadoAnterior: EstadoPagare.PENDIENTE,
          estadoNuevo: EstadoPagare.PENDIENTE,
          usuarioId: new Types.ObjectId(usuarioId),
          observaciones: 'Pagaré creado',
        },
      ],
      creadoPor: new Types.ObjectId(usuarioId),
    });

    await pagare.save();
    return pagare.toObject();
  }

  /**
   * Crear pagaré desde un vencimiento
   */
  async crearDesdeVencimiento(
    empresaId: string,
    usuarioId: string,
    data: CrearPagareDesdeVencimientoDTO,
    dbConfig: IDatabaseConfig
  ) {
    const PagareModel = await this.getModel(empresaId, dbConfig);
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);

    // Obtener vencimiento
    const vencimiento = await VencimientoModel.findById(data.vencimientoId);
    if (!vencimiento) {
      throw new AppError('Vencimiento no encontrado', 404);
    }

    // Verificar que no tenga ya un pagaré asociado
    if (vencimiento.pagareId) {
      throw new AppError('El vencimiento ya tiene un pagaré asociado', 400);
    }

    // Determinar tipo basándose en el vencimiento
    const tipo =
      vencimiento.tipo === 'cobro' ? TipoPagare.RECIBIDO : TipoPagare.EMITIDO;

    const numero = await this.generarNumero(PagareModel, empresaId, tipo);

    const pagare = new PagareModel({
      empresaId: new Types.ObjectId(empresaId),
      numero,
      tipo,
      documentoOrigen: {
        tipo: TipoDocumentoOrigenPagare.VENCIMIENTO,
        id: vencimiento._id,
        numero: vencimiento.numero,
      },
      vencimientoId: vencimiento._id,
      terceroId: vencimiento.clienteId || vencimiento.proveedorId,
      terceroTipo: vencimiento.clienteId ? 'cliente' : 'proveedor',
      terceroNombre: vencimiento.terceroNombre,
      terceroNif: vencimiento.terceroNif,
      numeroPagare: data.numeroPagare,
      importe: vencimiento.importePendiente,
      fechaEmision: new Date(),
      fechaVencimiento: data.fechaVencimiento
        ? new Date(data.fechaVencimiento)
        : vencimiento.fechaVencimiento,
      bancoEmisor: data.bancoEmisor,
      cuentaOrigen: data.cuentaOrigen,
      cuentaDestino: data.cuentaDestino,
      estado: EstadoPagare.PENDIENTE,
      observaciones: data.observaciones,
      historial: [
        {
          fecha: new Date(),
          estadoAnterior: EstadoPagare.PENDIENTE,
          estadoNuevo: EstadoPagare.PENDIENTE,
          usuarioId: new Types.ObjectId(usuarioId),
          observaciones: `Creado desde vencimiento ${vencimiento.numero}`,
        },
      ],
      creadoPor: new Types.ObjectId(usuarioId),
    });

    await pagare.save();

    // Actualizar vencimiento con referencia al pagaré
    vencimiento.pagareId = pagare._id;
    vencimiento.metodoPago = MetodoPagoVencimiento.PAGARE;
    await vencimiento.save();

    return pagare.toObject();
  }

  /**
   * Actualizar un pagaré
   */
  async update(
    id: string,
    empresaId: string,
    usuarioId: string,
    data: UpdatePagareDTO,
    dbConfig: IDatabaseConfig
  ) {
    const PagareModel = await this.getModel(empresaId, dbConfig);

    const pagare = await PagareModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!pagare) {
      throw new AppError('Pagaré no encontrado', 404);
    }

    // No permitir editar si está cobrado/pagado/devuelto
    if (
      [EstadoPagare.COBRADO, EstadoPagare.PAGADO, EstadoPagare.DEVUELTO].includes(
        pagare.estado
      )
    ) {
      throw new AppError('No se puede editar un pagaré en este estado', 400);
    }

    Object.assign(pagare, data);
    pagare.modificadoPor = new Types.ObjectId(usuarioId);
    await pagare.save();

    return pagare.toObject();
  }

  /**
   * Marcar pagaré como cobrado/pagado
   */
  async marcarCobrado(
    id: string,
    empresaId: string,
    usuarioId: string,
    data: MarcarCobradoDTO,
    dbConfig: IDatabaseConfig
  ) {
    const PagareModel = await this.getModel(empresaId, dbConfig);
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);

    const pagare = await PagareModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!pagare) {
      throw new AppError('Pagaré no encontrado', 404);
    }

    if (pagare.estado === EstadoPagare.ANULADO) {
      throw new AppError('No se puede cobrar un pagaré anulado', 400);
    }

    const estadoAnterior = pagare.estado;
    const nuevoEstado =
      pagare.tipo === TipoPagare.RECIBIDO ? EstadoPagare.COBRADO : EstadoPagare.PAGADO;

    pagare.estado = nuevoEstado;
    pagare.fechaCobro = data.fechaCobro ? new Date(data.fechaCobro) : new Date();
    pagare.historial.push({
      fecha: new Date(),
      estadoAnterior,
      estadoNuevo: nuevoEstado,
      usuarioId: new Types.ObjectId(usuarioId),
      observaciones: data.observaciones || `Marcado como ${nuevoEstado}`,
    });
    pagare.modificadoPor = new Types.ObjectId(usuarioId);

    await pagare.save();

    // Si tiene vencimiento asociado, marcarlo también
    if (pagare.vencimientoId) {
      const vencimiento = await VencimientoModel.findById(pagare.vencimientoId);
      if (vencimiento) {
        vencimiento.importeCobrado = vencimiento.importe;
        vencimiento.fechaCobro = pagare.fechaCobro;
        await vencimiento.save(); // El middleware actualizará el estado
      }
    }

    return pagare.toObject();
  }

  /**
   * Marcar pagaré como devuelto
   */
  async marcarDevuelto(
    id: string,
    empresaId: string,
    usuarioId: string,
    data: MarcarDevueltoDTO,
    dbConfig: IDatabaseConfig
  ) {
    const PagareModel = await this.getModel(empresaId, dbConfig);
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);

    const pagare = await PagareModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!pagare) {
      throw new AppError('Pagaré no encontrado', 404);
    }

    if (
      [EstadoPagare.DEVUELTO, EstadoPagare.ANULADO].includes(pagare.estado)
    ) {
      throw new AppError('El pagaré ya está devuelto o anulado', 400);
    }

    const estadoAnterior = pagare.estado;

    pagare.estado = EstadoPagare.DEVUELTO;
    pagare.fechaDevolucion = new Date();
    pagare.motivoDevolucion = data.motivo;
    pagare.comisionDevolucion = data.comision;
    pagare.historial.push({
      fecha: new Date(),
      estadoAnterior,
      estadoNuevo: EstadoPagare.DEVUELTO,
      usuarioId: new Types.ObjectId(usuarioId),
      observaciones: data.observaciones || `Devuelto: ${data.motivo}`,
    });
    pagare.modificadoPor = new Types.ObjectId(usuarioId);

    await pagare.save();

    // Si tiene vencimiento asociado, marcarlo como devuelto
    if (pagare.vencimientoId) {
      const vencimiento = await VencimientoModel.findById(pagare.vencimientoId);
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

    return pagare.toObject();
  }

  /**
   * Anular un pagaré
   */
  async anular(
    id: string,
    empresaId: string,
    usuarioId: string,
    motivo: string,
    dbConfig: IDatabaseConfig
  ) {
    const PagareModel = await this.getModel(empresaId, dbConfig);

    const pagare = await PagareModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!pagare) {
      throw new AppError('Pagaré no encontrado', 404);
    }

    if (
      [EstadoPagare.COBRADO, EstadoPagare.PAGADO].includes(pagare.estado)
    ) {
      throw new AppError('No se puede anular un pagaré ya cobrado/pagado', 400);
    }

    const estadoAnterior = pagare.estado;

    pagare.estado = EstadoPagare.ANULADO;
    pagare.historial.push({
      fecha: new Date(),
      estadoAnterior,
      estadoNuevo: EstadoPagare.ANULADO,
      usuarioId: new Types.ObjectId(usuarioId),
      observaciones: motivo || 'Anulado',
    });
    pagare.modificadoPor = new Types.ObjectId(usuarioId);

    await pagare.save();

    return pagare.toObject();
  }

  /**
   * Obtener próximos vencimientos
   */
  async getProximosVencimientos(
    empresaId: string,
    dias: number,
    tipo: TipoPagare | undefined,
    dbConfig: IDatabaseConfig
  ) {
    const PagareModel = await this.getModel(empresaId, dbConfig);

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    const query: FilterQuery<IPagare> = {
      empresaId: new Types.ObjectId(empresaId),
      estado: { $in: [EstadoPagare.PENDIENTE, EstadoPagare.EN_CARTERA] },
      fechaVencimiento: { $lte: fechaLimite },
    };

    if (tipo) {
      query.tipo = tipo;
    }

    const pagares = await PagareModel.find(query)
      .sort({ fechaVencimiento: 1 })
      .lean();

    return pagares;
  }

  /**
   * Obtener pagarés devueltos
   */
  async getDevueltos(empresaId: string, dbConfig: IDatabaseConfig) {
    const PagareModel = await this.getModel(empresaId, dbConfig);

    const pagares = await PagareModel.find({
      empresaId: new Types.ObjectId(empresaId),
      estado: EstadoPagare.DEVUELTO,
    })
      .sort({ fechaDevolucion: -1 })
      .lean();

    return pagares;
  }

  /**
   * Crear remesa de pagarés
   */
  async crearRemesa(
    empresaId: string,
    usuarioId: string,
    data: CrearRemesaPagaresDTO,
    dbConfig: IDatabaseConfig
  ) {
    const PagareModel = await this.getModel(empresaId, dbConfig);

    // Generar número de remesa
    const año = new Date().getFullYear().toString().slice(-2);
    const ultimaRemesa = await PagareModel.findOne({
      empresaId: new Types.ObjectId(empresaId),
      remesaNumero: { $regex: `^REM-PAG-${año}` },
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

    const remesaNumero = `REM-PAG-${año}-${siguienteNum.toString().padStart(5, '0')}`;
    const remesaId = new Types.ObjectId();
    const fechaRemesa = data.fechaRemesa ? new Date(data.fechaRemesa) : new Date();

    // Actualizar pagarés
    await PagareModel.updateMany(
      {
        _id: { $in: data.pagareIds.map(id => new Types.ObjectId(id)) },
        empresaId: new Types.ObjectId(empresaId),
      },
      {
        $set: {
          remesaId,
          remesaNumero,
          estado: EstadoPagare.EN_CARTERA,
          modificadoPor: new Types.ObjectId(usuarioId),
        },
        $push: {
          historial: {
            fecha: new Date(),
            estadoAnterior: EstadoPagare.PENDIENTE,
            estadoNuevo: EstadoPagare.EN_CARTERA,
            usuarioId: new Types.ObjectId(usuarioId),
            observaciones: `Añadido a remesa ${remesaNumero}`,
          },
        },
      }
    );

    // Obtener pagarés actualizados
    const pagares = await PagareModel.find({
      _id: { $in: data.pagareIds.map(id => new Types.ObjectId(id)) },
    }).lean();

    const totalRemesa = pagares.reduce((sum, p) => sum + p.importe, 0);

    return {
      remesaId: remesaId.toString(),
      remesaNumero,
      fechaRemesa,
      pagares,
      totalRemesa,
      countPagares: pagares.length,
    };
  }

  /**
   * Eliminar un pagaré
   */
  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const PagareModel = await this.getModel(empresaId, dbConfig);
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);

    const pagare = await PagareModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!pagare) {
      throw new AppError('Pagaré no encontrado', 404);
    }

    // No permitir eliminar si está cobrado/pagado
    if (
      [EstadoPagare.COBRADO, EstadoPagare.PAGADO].includes(pagare.estado)
    ) {
      throw new AppError('No se puede eliminar un pagaré cobrado/pagado', 400);
    }

    // Si tiene vencimiento asociado, quitar la referencia
    if (pagare.vencimientoId) {
      await VencimientoModel.updateOne(
        { _id: pagare.vencimientoId },
        { $unset: { pagareId: 1 }, metodoPago: undefined }
      );
    }

    await pagare.deleteOne();

    return { message: 'Pagaré eliminado correctamente' };
  }
}

export const pagaresService = new PagaresService();
