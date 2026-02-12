import { Model, Types } from 'mongoose';
import { IReserva, EstadoReserva, OrigenReserva } from './Reserva';
import { CreateReservaDTO, UpdateReservaDTO, FiltrosReservasDTO, DisponibilidadDTO } from './reservas.dto';
import { IDatabaseConfig } from '../../types/express';
import { getReservaModel, getMesaModel } from '../../utils/dynamic-models.helper';

export class ReservasService {
  private async getModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<IReserva>> {
    return await getReservaModel(empresaId, dbConfig);
  }

  // ============================================
  // CRUD
  // ============================================

  async getAll(empresaId: string, dbConfig: IDatabaseConfig, filtros: FiltrosReservasDTO = {}) {
    const ReservaModel = await this.getModelo(empresaId, dbConfig);
    const query: any = {};

    if (filtros.fecha) {
      const fecha = new Date(filtros.fecha);
      fecha.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);
      query.fecha = { $gte: fecha, $lt: fechaFin };
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      query.fecha = {};
      if (filtros.fechaDesde) query.fecha.$gte = new Date(filtros.fechaDesde);
      if (filtros.fechaHasta) query.fecha.$lte = new Date(filtros.fechaHasta);
    }

    if (filtros.estado) query.estado = filtros.estado;
    if (filtros.salonId) query.salonId = new Types.ObjectId(filtros.salonId);

    if (filtros.busqueda) {
      const regex = new RegExp(filtros.busqueda, 'i');
      query.$or = [
        { clienteNombre: regex },
        { clienteTelefono: regex },
        { clienteEmail: regex },
      ];
    }

    const page = filtros.page || 1;
    const limit = filtros.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ReservaModel.find(query)
        .populate('salonId', 'nombre color')
        .populate('mesasIds', 'numero capacidad')
        .populate('camareroId', 'nombre alias')
        .sort({ fecha: 1, horaInicio: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReservaModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const ReservaModel = await this.getModelo(empresaId, dbConfig);
    const reserva = await ReservaModel.findById(id)
      .populate('clienteId', 'nombre email telefono')
      .populate('salonId', 'nombre color')
      .populate('mesasIds', 'numero capacidad forma')
      .populate('camareroId', 'nombre alias')
      .lean();

    if (!reserva) {
      throw new Error('Reserva no encontrada');
    }

    return reserva;
  }

  async create(empresaId: string, dbConfig: IDatabaseConfig, data: CreateReservaDTO, userId?: string) {
    const ReservaModel = await this.getModelo(empresaId, dbConfig);

    // Verificar disponibilidad antes de crear
    const disponible = await this.verificarDisponibilidad(empresaId, dbConfig, {
      fecha: data.fecha,
      comensales: data.comensales,
      duracionMinutos: data.duracionMinutos,
      salonId: data.salonId,
    }, data.horaInicio);

    if (!disponible.disponible) {
      throw new Error('El horario seleccionado no está disponible');
    }

    const reserva = new ReservaModel({
      ...data,
      fecha: new Date(data.fecha),
      clienteId: data.clienteId ? new Types.ObjectId(data.clienteId) : undefined,
      salonId: data.salonId ? new Types.ObjectId(data.salonId) : undefined,
      mesasIds: data.mesasIds?.map(id => new Types.ObjectId(id)) || [],
      camareroId: data.camareroId ? new Types.ObjectId(data.camareroId) : undefined,
      creadoPor: userId ? new Types.ObjectId(userId) : undefined,
    });

    await reserva.save();
    return this.getById(empresaId, dbConfig, reserva._id.toString());
  }

  async update(empresaId: string, dbConfig: IDatabaseConfig, id: string, data: UpdateReservaDTO) {
    const ReservaModel = await this.getModelo(empresaId, dbConfig);
    const reserva = await ReservaModel.findById(id);
    if (!reserva) {
      throw new Error('Reserva no encontrada');
    }

    const updateData: any = { ...data };
    if (data.fecha) updateData.fecha = new Date(data.fecha);
    if (data.clienteId) updateData.clienteId = new Types.ObjectId(data.clienteId);
    if (data.salonId) updateData.salonId = new Types.ObjectId(data.salonId);
    if (data.mesasIds) updateData.mesasIds = data.mesasIds.map(id => new Types.ObjectId(id));
    if (data.camareroId) updateData.camareroId = new Types.ObjectId(data.camareroId);

    await ReservaModel.findByIdAndUpdate(id, updateData);
    return this.getById(empresaId, dbConfig, id);
  }

  async delete(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const ReservaModel = await this.getModelo(empresaId, dbConfig);
    const reserva = await ReservaModel.findById(id);
    if (!reserva) {
      throw new Error('Reserva no encontrada');
    }

    await ReservaModel.findByIdAndDelete(id);
    return { success: true };
  }

  // ============================================
  // CAMBIOS DE ESTADO
  // ============================================

  async confirmar(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const ReservaModel = await this.getModelo(empresaId, dbConfig);
    await ReservaModel.findByIdAndUpdate(id, {
      estado: EstadoReserva.CONFIRMADA,
      confirmadaEn: new Date(),
    });
    return this.getById(empresaId, dbConfig, id);
  }

  async iniciar(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const ReservaModel = await this.getModelo(empresaId, dbConfig);
    const MesaModel = await getMesaModel(empresaId, dbConfig);

    const reserva = await ReservaModel.findById(id);
    if (!reserva) throw new Error('Reserva no encontrada');

    // Marcar mesas como ocupadas
    if (reserva.mesasIds?.length) {
      await MesaModel.updateMany(
        { _id: { $in: reserva.mesasIds } },
        {
          estado: 'ocupada',
          reservaActual: reserva._id,
        }
      );
    }

    await ReservaModel.findByIdAndUpdate(id, {
      estado: EstadoReserva.EN_CURSO,
      llegadaReal: new Date(),
    });

    return this.getById(empresaId, dbConfig, id);
  }

  async completar(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const ReservaModel = await this.getModelo(empresaId, dbConfig);
    const MesaModel = await getMesaModel(empresaId, dbConfig);

    const reserva = await ReservaModel.findById(id);
    if (!reserva) throw new Error('Reserva no encontrada');

    // Liberar mesas
    if (reserva.mesasIds?.length) {
      await MesaModel.updateMany(
        { _id: { $in: reserva.mesasIds } },
        {
          estado: 'libre',
          reservaActual: null,
        }
      );
    }

    await ReservaModel.findByIdAndUpdate(id, {
      estado: EstadoReserva.COMPLETADA,
    });

    return this.getById(empresaId, dbConfig, id);
  }

  async cancelar(empresaId: string, dbConfig: IDatabaseConfig, id: string, motivo?: string) {
    const ReservaModel = await this.getModelo(empresaId, dbConfig);
    await ReservaModel.findByIdAndUpdate(id, {
      estado: EstadoReserva.CANCELADA,
      canceladaEn: new Date(),
      motivoCancelacion: motivo,
    });
    return this.getById(empresaId, dbConfig, id);
  }

  async marcarNoShow(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const ReservaModel = await this.getModelo(empresaId, dbConfig);
    await ReservaModel.findByIdAndUpdate(id, {
      estado: EstadoReserva.NO_SHOW,
    });
    return this.getById(empresaId, dbConfig, id);
  }

  // ============================================
  // DISPONIBILIDAD
  // ============================================

  async verificarDisponibilidad(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    params: DisponibilidadDTO,
    horaInicio?: string
  ) {
    // Lógica básica de disponibilidad
    // En producción se verificarían las reservas existentes y capacidad de mesas
    return {
      disponible: true,
      horasDisponibles: [
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
      ],
    };
  }

  async getReservasDelDia(empresaId: string, dbConfig: IDatabaseConfig, fecha: string) {
    const ReservaModel = await this.getModelo(empresaId, dbConfig);

    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 1);

    return ReservaModel.find({
      fecha: { $gte: fechaInicio, $lt: fechaFin },
      estado: { $nin: [EstadoReserva.CANCELADA] },
    })
      .populate('salonId', 'nombre color')
      .populate('mesasIds', 'numero')
      .sort({ horaInicio: 1 })
      .lean();
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async getEstadisticas(empresaId: string, dbConfig: IDatabaseConfig, fechaDesde?: string, fechaHasta?: string) {
    const ReservaModel = await this.getModelo(empresaId, dbConfig);

    const query: any = {};
    if (fechaDesde || fechaHasta) {
      query.fecha = {};
      if (fechaDesde) query.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) query.fecha.$lte = new Date(fechaHasta);
    }

    const [
      total,
      confirmadas,
      completadas,
      canceladas,
      noShows,
      porOrigen,
    ] = await Promise.all([
      ReservaModel.countDocuments(query),
      ReservaModel.countDocuments({ ...query, estado: EstadoReserva.CONFIRMADA }),
      ReservaModel.countDocuments({ ...query, estado: EstadoReserva.COMPLETADA }),
      ReservaModel.countDocuments({ ...query, estado: EstadoReserva.CANCELADA }),
      ReservaModel.countDocuments({ ...query, estado: EstadoReserva.NO_SHOW }),
      ReservaModel.aggregate([
        { $match: query },
        { $group: { _id: '$origen', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      confirmadas,
      completadas,
      canceladas,
      noShows,
      tasaCancelacion: total > 0 ? Math.round((canceladas / total) * 100) : 0,
      tasaNoShow: total > 0 ? Math.round((noShows / total) * 100) : 0,
      porOrigen,
    };
  }
}

export const reservasService = new ReservasService();
