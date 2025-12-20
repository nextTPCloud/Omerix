import { Model } from 'mongoose';
import { ZonaPreparacion, IZonaPreparacion } from './ZonaPreparacion';
import { CreateZonaPreparacionDTO, UpdateZonaPreparacionDTO, SearchZonasPreparacionDTO } from './zonas-preparacion.dto';
import { Types } from 'mongoose';
import { IDatabaseConfig } from '../../types/express';
import { getZonaPreparacionModel } from '../../utils/dynamic-models.helper';

export class ZonasPreparacionService {
  private async getModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<IZonaPreparacion>> {
    return await getZonaPreparacionModel(empresaId, dbConfig);
  }

  async findAll(empresaId: string, filters: SearchZonasPreparacionDTO, dbConfig: IDatabaseConfig) {
    const ZonaModel = await this.getModelo(empresaId, dbConfig);
    const { q, activo, almacenId, tieneMonitor, page = 1, limit = 50, sortBy = 'orden', sortOrder = 'asc' } = filters;

    const query: any = {};

    if (q) {
      query.$or = [
        { nombre: { $regex: q, $options: 'i' } },
        { codigo: { $regex: q, $options: 'i' } },
      ];
    }

    if (activo !== undefined) query.activo = activo;
    if (almacenId) query.almacenId = new Types.ObjectId(almacenId);
    if (tieneMonitor !== undefined) query.tieneMonitor = tieneMonitor;

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      ZonaModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('impresoraId', 'nombre tipo')
        .populate('almacenId', 'nombre')
        .populate('familiasIds', 'nombre')
        .lean(),
      ZonaModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ZonaModel = await this.getModelo(empresaId, dbConfig);
    const zona = await ZonaModel.findById(id)
      .populate('impresoraId', 'nombre tipo')
      .populate('almacenId', 'nombre')
      .populate('familiasIds', 'nombre')
      .lean();

    if (!zona) throw new Error('Zona de preparación no encontrada');
    return zona;
  }

  async create(empresaId: string, data: CreateZonaPreparacionDTO, dbConfig: IDatabaseConfig) {
    const ZonaModel = await this.getModelo(empresaId, dbConfig);

    const existente = await ZonaModel.findOne({ nombre: data.nombre });
    if (existente) throw new Error(`Ya existe una zona con el nombre ${data.nombre}`);

    const zona = new ZonaModel({
      ...data,
      impresoraId: data.impresoraId ? new Types.ObjectId(data.impresoraId) : undefined,
      almacenId: data.almacenId ? new Types.ObjectId(data.almacenId) : undefined,
      familiasIds: data.familiasIds?.map(id => new Types.ObjectId(id)),
    });

    await zona.save();
    return zona.toObject();
  }

  async update(id: string, empresaId: string, data: UpdateZonaPreparacionDTO, dbConfig: IDatabaseConfig) {
    const ZonaModel = await this.getModelo(empresaId, dbConfig);

    if (data.nombre) {
      const existente = await ZonaModel.findOne({
        nombre: data.nombre,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existente) throw new Error(`Ya existe una zona con el nombre ${data.nombre}`);
    }

    const updateData: any = { ...data };
    if (data.impresoraId) updateData.impresoraId = new Types.ObjectId(data.impresoraId);
    if (data.almacenId) updateData.almacenId = new Types.ObjectId(data.almacenId);
    if (data.familiasIds) updateData.familiasIds = data.familiasIds.map(id => new Types.ObjectId(id));

    const zona = await ZonaModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!zona) throw new Error('Zona de preparación no encontrada');
    return zona;
  }

  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ZonaModel = await this.getModelo(empresaId, dbConfig);
    const zona = await ZonaModel.findByIdAndDelete(id);

    if (!zona) throw new Error('Zona de preparación no encontrada');
    return { message: 'Zona de preparación eliminada correctamente' };
  }

  async searchCodigos(empresaId: string, prefix: string, dbConfig: IDatabaseConfig): Promise<string[]> {
    const ZonaModel = await this.getModelo(empresaId, dbConfig);
    const zonas = await ZonaModel.find({
      codigo: { $regex: `^${prefix}`, $options: 'i' }
    }).select('codigo').lean();
    return zonas.map(z => z.codigo).filter(Boolean) as string[];
  }
}

export const zonasPreparacionService = new ZonasPreparacionService();
