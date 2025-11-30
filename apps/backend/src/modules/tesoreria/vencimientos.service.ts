import { Model, Types } from 'mongoose';
import {
  Vencimiento,
  IVencimiento,
  TipoVencimiento,
  EstadoVencimiento,
} from '../../models/Vencimiento';
import {
  CreateVencimientoDTO,
  UpdateVencimientoDTO,
  SearchVencimientosDTO,
  RegistrarCobroDTO,
  CrearRemesaDTO,
} from './vencimientos.dto';
import { AppError } from '../../middleware/errorHandler.middleware';
import { IDatabaseConfig } from '../../types/express';
import { getVencimientoModel } from '../../utils/dynamic-models.helper';

export class VencimientosService {
  /**
   * Obtener modelo de Vencimiento para una empresa específica
   */
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IVencimiento>> {
    return await getVencimientoModel(empresaId, dbConfig);
  }

  /**
   * Generar número de vencimiento
   */
  private async generarNumero(
    VencimientoModel: Model<IVencimiento>,
    tipo: string
  ): Promise<string> {
    const prefijo = tipo === TipoVencimiento.COBRO ? 'VEN-C' : 'VEN-P';
    const año = new Date().getFullYear().toString().slice(-2);

    // Buscar el último número del mismo tipo y año
    const ultimo = await VencimientoModel.findOne({
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
   * Obtener todos los vencimientos con filtros y paginación
   */
  async findAll(empresaId: string, filters: SearchVencimientosDTO, dbConfig: IDatabaseConfig) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);
    const {
      q,
      tipo,
      estado,
      clienteId,
      proveedorId,
      formaPagoId,
      remesaId,
      fechaDesde,
      fechaHasta,
      vencidos,
      sinRemesa,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    // Construir query
    const query: any = {};

    // Filtro de búsqueda de texto
    if (q) {
      query.$or = [
        { numero: { $regex: q, $options: 'i' } },
        { terceroNombre: { $regex: q, $options: 'i' } },
        { documentoNumero: { $regex: q, $options: 'i' } },
        { terceroNif: { $regex: q, $options: 'i' } },
      ];
    }

    // Filtros específicos
    if (tipo) query.tipo = tipo;
    if (estado) query.estado = estado;
    if (clienteId) query.clienteId = new Types.ObjectId(clienteId);
    if (proveedorId) query.proveedorId = new Types.ObjectId(proveedorId);
    if (formaPagoId) query.formaPagoId = new Types.ObjectId(formaPagoId);
    if (remesaId) query.remesaId = new Types.ObjectId(remesaId);

    // Filtro por rango de fechas
    if (fechaDesde || fechaHasta) {
      query.fechaVencimiento = {};
      if (fechaDesde) query.fechaVencimiento.$gte = new Date(fechaDesde);
      if (fechaHasta) query.fechaVencimiento.$lte = new Date(fechaHasta);
    }

    // Filtro de vencidos
    if (vencidos === 'true') {
      query.fechaVencimiento = { ...query.fechaVencimiento, $lt: new Date() };
      query.estado = { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] };
    }

    // Filtro sin remesa
    if (sinRemesa === 'true') {
      query.remesaId = { $exists: false };
    }

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar query
    const [data, total] = await Promise.all([
      VencimientoModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      VencimientoModel.countDocuments(query),
    ]);

    // Calcular estadísticas
    const stats = await this.calcularEstadisticas(VencimientoModel, query);

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
   * Calcular estadísticas de vencimientos
   */
  private async calcularEstadisticas(
    VencimientoModel: Model<IVencimiento>,
    baseQuery: any
  ) {
    const [totales, vencidos] = await Promise.all([
      VencimientoModel.aggregate([
        { $match: { ...baseQuery, estado: { $in: ['pendiente', 'parcial'] } } },
        {
          $group: {
            _id: null,
            totalImporte: { $sum: '$importe' },
            totalPendiente: { $sum: '$importePendiente' },
            count: { $sum: 1 },
          },
        },
      ]),
      VencimientoModel.aggregate([
        {
          $match: {
            ...baseQuery,
            estado: { $in: ['pendiente', 'parcial'] },
            fechaVencimiento: { $lt: new Date() },
          },
        },
        {
          $group: {
            _id: null,
            totalImporte: { $sum: '$importe' },
            totalPendiente: { $sum: '$importePendiente' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      totalPendiente: totales[0]?.totalPendiente || 0,
      totalImporte: totales[0]?.totalImporte || 0,
      countPendientes: totales[0]?.count || 0,
      totalVencido: vencidos[0]?.totalPendiente || 0,
      countVencidos: vencidos[0]?.count || 0,
    };
  }

  /**
   * Obtener un vencimiento por ID
   */
  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);
    const vencimiento = await VencimientoModel.findById(id).lean();

    if (!vencimiento) {
      throw new AppError('Vencimiento no encontrado', 404);
    }

    return vencimiento;
  }

  /**
   * Crear un nuevo vencimiento
   */
  async create(empresaId: string, data: CreateVencimientoDTO, dbConfig: IDatabaseConfig) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);

    // Generar número
    const numero = await this.generarNumero(VencimientoModel, data.tipo);

    // Calcular importe pendiente
    const importePendiente = data.importe;

    const vencimiento = new VencimientoModel({
      ...data,
      numero,
      importeCobrado: 0,
      importePendiente,
      estado: EstadoVencimiento.PENDIENTE,
      cobrosParciales: [],
    });

    await vencimiento.save();
    return vencimiento.toObject();
  }

  /**
   * Crear múltiples vencimientos (desde factura)
   */
  async createMultiple(
    empresaId: string,
    vencimientos: CreateVencimientoDTO[],
    dbConfig: IDatabaseConfig
  ) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);
    const creados = [];

    for (const data of vencimientos) {
      const numero = await this.generarNumero(VencimientoModel, data.tipo);

      const vencimiento = new VencimientoModel({
        ...data,
        numero,
        importeCobrado: 0,
        importePendiente: data.importe,
        estado: EstadoVencimiento.PENDIENTE,
        cobrosParciales: [],
      });

      await vencimiento.save();
      creados.push(vencimiento.toObject());
    }

    return creados;
  }

  /**
   * Actualizar un vencimiento
   */
  async update(id: string, empresaId: string, data: UpdateVencimientoDTO, dbConfig: IDatabaseConfig) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);
    const vencimiento = await VencimientoModel.findById(id);

    if (!vencimiento) {
      throw new AppError('Vencimiento no encontrado', 404);
    }

    // No permitir editar si está cobrado/pagado
    if (
      vencimiento.estado === EstadoVencimiento.COBRADO ||
      vencimiento.estado === EstadoVencimiento.PAGADO
    ) {
      throw new AppError('No se puede editar un vencimiento ya cobrado/pagado', 400);
    }

    // Actualizar campos
    Object.assign(vencimiento, data);
    await vencimiento.save();

    return vencimiento.toObject();
  }

  /**
   * Registrar un cobro/pago (total o parcial)
   */
  async registrarCobro(
    id: string,
    empresaId: string,
    data: RegistrarCobroDTO,
    dbConfig: IDatabaseConfig
  ) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);
    const vencimiento = await VencimientoModel.findById(id);

    if (!vencimiento) {
      throw new AppError('Vencimiento no encontrado', 404);
    }

    // No permitir cobrar si está anulado
    if (vencimiento.estado === EstadoVencimiento.ANULADO) {
      throw new AppError('No se puede cobrar un vencimiento anulado', 400);
    }

    // Verificar que el importe no exceda lo pendiente
    if (data.importe > vencimiento.importePendiente) {
      throw new AppError(
        `El importe del cobro (${data.importe}) excede el pendiente (${vencimiento.importePendiente})`,
        400
      );
    }

    // Añadir cobro parcial
    vencimiento.cobrosParciales.push({
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
      importe: data.importe,
      formaPagoId: data.formaPagoId ? new Types.ObjectId(data.formaPagoId) : undefined,
      referencia: data.referencia,
      observaciones: data.observaciones,
    });

    // Actualizar importes
    vencimiento.importeCobrado += data.importe;
    // El middleware pre-save calculará importePendiente y actualizará estado

    await vencimiento.save();
    return vencimiento.toObject();
  }

  /**
   * Marcar como impagado
   */
  async marcarImpagado(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);
    const vencimiento = await VencimientoModel.findById(id);

    if (!vencimiento) {
      throw new AppError('Vencimiento no encontrado', 404);
    }

    if (
      vencimiento.estado === EstadoVencimiento.COBRADO ||
      vencimiento.estado === EstadoVencimiento.PAGADO
    ) {
      throw new AppError('No se puede marcar como impagado un vencimiento ya cobrado', 400);
    }

    vencimiento.estado = EstadoVencimiento.IMPAGADO;
    await vencimiento.save();

    return vencimiento.toObject();
  }

  /**
   * Anular un vencimiento
   */
  async anular(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);
    const vencimiento = await VencimientoModel.findById(id);

    if (!vencimiento) {
      throw new AppError('Vencimiento no encontrado', 404);
    }

    if (
      vencimiento.estado === EstadoVencimiento.COBRADO ||
      vencimiento.estado === EstadoVencimiento.PAGADO
    ) {
      throw new AppError('No se puede anular un vencimiento ya cobrado/pagado', 400);
    }

    vencimiento.estado = EstadoVencimiento.ANULADO;
    await vencimiento.save();

    return vencimiento.toObject();
  }

  /**
   * Eliminar un vencimiento
   */
  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);
    const vencimiento = await VencimientoModel.findById(id);

    if (!vencimiento) {
      throw new AppError('Vencimiento no encontrado', 404);
    }

    // No permitir eliminar si tiene cobros
    if (vencimiento.importeCobrado > 0) {
      throw new AppError('No se puede eliminar un vencimiento con cobros registrados', 400);
    }

    await vencimiento.deleteOne();
    return { message: 'Vencimiento eliminado correctamente' };
  }

  /**
   * Obtener vencimientos de un cliente
   */
  async getByCliente(clienteId: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);

    const vencimientos = await VencimientoModel.find({
      clienteId: new Types.ObjectId(clienteId),
      tipo: TipoVencimiento.COBRO,
    })
      .sort({ fechaVencimiento: 1 })
      .lean();

    return vencimientos;
  }

  /**
   * Obtener vencimientos de un proveedor
   */
  async getByProveedor(proveedorId: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);

    const vencimientos = await VencimientoModel.find({
      proveedorId: new Types.ObjectId(proveedorId),
      tipo: TipoVencimiento.PAGO,
    })
      .sort({ fechaVencimiento: 1 })
      .lean();

    return vencimientos;
  }

  /**
   * Crear remesa (agrupar vencimientos)
   */
  async crearRemesa(empresaId: string, data: CrearRemesaDTO, dbConfig: IDatabaseConfig) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);

    // Generar número de remesa
    const año = new Date().getFullYear().toString().slice(-2);
    const ultimaRemesa = await VencimientoModel.findOne({
      remesaNumero: { $regex: `^REM-${año}` },
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

    const remesaNumero = `REM-${año}-${siguienteNum.toString().padStart(5, '0')}`;
    const remesaId = new Types.ObjectId();
    const fechaRemesa = data.fechaRemesa ? new Date(data.fechaRemesa) : new Date();

    // Actualizar todos los vencimientos
    await VencimientoModel.updateMany(
      { _id: { $in: data.vencimientoIds.map(id => new Types.ObjectId(id)) } },
      {
        $set: {
          remesaId,
          remesaNumero,
          fechaRemesa,
        },
      }
    );

    // Obtener vencimientos actualizados
    const vencimientos = await VencimientoModel.find({
      _id: { $in: data.vencimientoIds.map(id => new Types.ObjectId(id)) },
    }).lean();

    const totalRemesa = vencimientos.reduce((sum, v) => sum + v.importePendiente, 0);

    return {
      remesaId: remesaId.toString(),
      remesaNumero,
      fechaRemesa,
      vencimientos,
      totalRemesa,
      countVencimientos: vencimientos.length,
    };
  }

  /**
   * Obtener resumen de tesorería
   */
  async getResumen(empresaId: string, tipo: string | undefined, dbConfig: IDatabaseConfig) {
    const VencimientoModel = await this.getModelo(empresaId, dbConfig);

    const matchQuery: any = {
      estado: { $in: ['pendiente', 'parcial'] },
    };

    if (tipo) {
      matchQuery.tipo = tipo;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [resumen] = await VencimientoModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPendiente: { $sum: '$importePendiente' },
          totalVencimientosHoy: {
            $sum: {
              $cond: [
                { $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$fechaVencimiento' } }, { $dateToString: { format: '%Y-%m-%d', date: hoy } }] },
                '$importePendiente',
                0,
              ],
            },
          },
          totalVencido: {
            $sum: {
              $cond: [{ $lt: ['$fechaVencimiento', hoy] }, '$importePendiente', 0],
            },
          },
          totalProximos7Dias: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$fechaVencimiento', hoy] },
                    { $lte: ['$fechaVencimiento', new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)] },
                  ],
                },
                '$importePendiente',
                0,
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalPendiente: resumen?.totalPendiente || 0,
      totalVencimientosHoy: resumen?.totalVencimientosHoy || 0,
      totalVencido: resumen?.totalVencido || 0,
      totalProximos7Dias: resumen?.totalProximos7Dias || 0,
      countPendientes: resumen?.count || 0,
    };
  }
}

export const vencimientosService = new VencimientosService();
