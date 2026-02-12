import { Model, Types } from 'mongoose';
import { ITurnoServicio } from './TurnoServicio';
import { CreateTurnoServicioDTO, UpdateTurnoServicioDTO, FiltrosTurnosServicioDTO } from './turnos-servicio.dto';
import { IDatabaseConfig } from '../../types/express';
import { getTurnoServicioModel, getSalonModel } from '../../utils/dynamic-models.helper';

export class TurnosServicioService {
  private async getModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<ITurnoServicio>> {
    await getSalonModel(empresaId, dbConfig);
    return await getTurnoServicioModel(empresaId, dbConfig);
  }

  async getAll(empresaId: string, dbConfig: IDatabaseConfig, filtros: FiltrosTurnosServicioDTO = {}) {
    const TurnoModel = await this.getModelo(empresaId, dbConfig);
    const query: any = {};

    if (filtros.activo !== undefined) {
      query.activo = filtros.activo;
    }

    if (filtros.busqueda) {
      const regex = new RegExp(filtros.busqueda, 'i');
      query.$or = [
        { nombre: regex },
        { codigo: regex },
      ];
    }

    const page = filtros.page || 1;
    const limit = filtros.limit || 50;
    const skip = (page - 1) * limit;

    const [turnos, total] = await Promise.all([
      TurnoModel.find(query)
        .populate('salonesIds', 'nombre color')
        .sort({ nombre: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TurnoModel.countDocuments(query),
    ]);

    return {
      data: turnos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActivos(empresaId: string, dbConfig: IDatabaseConfig) {
    const TurnoModel = await this.getModelo(empresaId, dbConfig);
    return TurnoModel.find({ activo: true })
      .populate('salonesIds', 'nombre color')
      .sort({ nombre: 1 })
      .lean();
  }

  async getById(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const TurnoModel = await this.getModelo(empresaId, dbConfig);
    const turno = await TurnoModel.findById(id)
      .populate('salonesIds', 'nombre color')
      .lean();

    if (!turno) {
      throw new Error('Turno de servicio no encontrado');
    }

    return turno;
  }

  async create(empresaId: string, dbConfig: IDatabaseConfig, data: CreateTurnoServicioDTO) {
    const TurnoModel = await this.getModelo(empresaId, dbConfig);

    const turno = new TurnoModel({
      ...data,
      salonesIds: data.salonesIds?.map(id => new Types.ObjectId(id)) || [],
    });

    await turno.save();
    return this.getById(empresaId, dbConfig, turno._id.toString());
  }

  async update(empresaId: string, dbConfig: IDatabaseConfig, id: string, data: UpdateTurnoServicioDTO) {
    const TurnoModel = await this.getModelo(empresaId, dbConfig);
    const turno = await TurnoModel.findById(id);
    if (!turno) {
      throw new Error('Turno de servicio no encontrado');
    }

    const updateData: any = { ...data };
    if (data.salonesIds) {
      updateData.salonesIds = data.salonesIds.map(id => new Types.ObjectId(id));
    }

    await TurnoModel.findByIdAndUpdate(id, updateData);
    return this.getById(empresaId, dbConfig, id);
  }

  async delete(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const TurnoModel = await this.getModelo(empresaId, dbConfig);
    const turno = await TurnoModel.findById(id);
    if (!turno) {
      throw new Error('Turno de servicio no encontrado');
    }

    await TurnoModel.findByIdAndDelete(id);
    return { success: true };
  }
}

export const turnosServicioService = new TurnosServicioService();
