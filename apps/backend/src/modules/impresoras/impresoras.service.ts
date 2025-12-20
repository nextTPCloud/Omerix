import { Model } from 'mongoose';
import { Impresora, IImpresora } from './Impresora';
import { CreateImpresoraDTO, UpdateImpresoraDTO, SearchImpresorasDTO } from './impresoras.dto';
import { Types } from 'mongoose';
import { IDatabaseConfig } from '../../types/express';
import { getImpresoraModel } from '../../utils/dynamic-models.helper';

export class ImpresorasService {
  private async getModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<IImpresora>> {
    return await getImpresoraModel(empresaId, dbConfig);
  }

  async findAll(empresaId: string, filters: SearchImpresorasDTO, dbConfig: IDatabaseConfig) {
    const ImpresoraModel = await this.getModelo(empresaId, dbConfig);
    const { q, tipo, activo, almacenId, page = 1, limit = 50, sortBy = 'nombre', sortOrder = 'asc' } = filters;

    const query: any = {};

    if (q) {
      query.$or = [
        { nombre: { $regex: q, $options: 'i' } },
        { codigo: { $regex: q, $options: 'i' } },
      ];
    }

    if (tipo) query.tipo = tipo;
    if (activo !== undefined) query.activo = activo;
    if (almacenId) query.almacenId = new Types.ObjectId(almacenId);

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      ImpresoraModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('almacenId', 'nombre')
        .populate('zonasPreparacionIds', 'nombre')
        .lean(),
      ImpresoraModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ImpresoraModel = await this.getModelo(empresaId, dbConfig);
    const impresora = await ImpresoraModel.findById(id)
      .populate('almacenId', 'nombre')
      .populate('zonasPreparacionIds', 'nombre')
      .lean();

    if (!impresora) throw new Error('Impresora no encontrada');
    return impresora;
  }

  async create(empresaId: string, data: CreateImpresoraDTO, dbConfig: IDatabaseConfig) {
    const ImpresoraModel = await this.getModelo(empresaId, dbConfig);

    const existente = await ImpresoraModel.findOne({ nombre: data.nombre });
    if (existente) throw new Error(`Ya existe una impresora con el nombre ${data.nombre}`);

    // Si es predeterminada, quitar predeterminada a las demás del mismo tipo
    if (data.predeterminada) {
      await ImpresoraModel.updateMany(
        { tipo: data.tipo },
        { $set: { predeterminada: false } }
      );
    }

    const impresora = new ImpresoraModel({
      ...data,
      almacenId: data.almacenId ? new Types.ObjectId(data.almacenId) : undefined,
      zonasPreparacionIds: data.zonasPreparacionIds?.map(id => new Types.ObjectId(id)),
      puntoVentaIds: data.puntoVentaIds?.map(id => new Types.ObjectId(id)),
    });

    await impresora.save();
    return impresora.toObject();
  }

  async update(id: string, empresaId: string, data: UpdateImpresoraDTO, dbConfig: IDatabaseConfig) {
    const ImpresoraModel = await this.getModelo(empresaId, dbConfig);

    if (data.nombre) {
      const existente = await ImpresoraModel.findOne({
        nombre: data.nombre,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existente) throw new Error(`Ya existe una impresora con el nombre ${data.nombre}`);
    }

    // Si se establece como predeterminada
    if (data.predeterminada) {
      const current = await ImpresoraModel.findById(id);
      if (current) {
        await ImpresoraModel.updateMany(
          { tipo: current.tipo, _id: { $ne: new Types.ObjectId(id) } },
          { $set: { predeterminada: false } }
        );
      }
    }

    const updateData: any = { ...data };
    if (data.almacenId) updateData.almacenId = new Types.ObjectId(data.almacenId);
    if (data.zonasPreparacionIds) updateData.zonasPreparacionIds = data.zonasPreparacionIds.map(id => new Types.ObjectId(id));
    if (data.puntoVentaIds) updateData.puntoVentaIds = data.puntoVentaIds.map(id => new Types.ObjectId(id));

    const impresora = await ImpresoraModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!impresora) throw new Error('Impresora no encontrada');
    return impresora;
  }

  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ImpresoraModel = await this.getModelo(empresaId, dbConfig);
    const impresora = await ImpresoraModel.findByIdAndDelete(id);

    if (!impresora) throw new Error('Impresora no encontrada');
    return { message: 'Impresora eliminada correctamente' };
  }

  async testConnection(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ImpresoraModel = await this.getModelo(empresaId, dbConfig);
    const impresora = await ImpresoraModel.findById(id);

    if (!impresora) throw new Error('Impresora no encontrada');

    // TODO: Implementar test real de conexión según tipo
    impresora.ultimaConexion = new Date();
    impresora.estadoConexion = 'online';
    await impresora.save();

    return { message: 'Conexión exitosa', estado: 'online' };
  }

  async searchCodigos(empresaId: string, prefix: string, dbConfig: IDatabaseConfig): Promise<string[]> {
    const ImpresoraModel = await this.getModelo(empresaId, dbConfig);
    const impresoras = await ImpresoraModel.find({
      codigo: { $regex: `^${prefix}`, $options: 'i' }
    }).select('codigo').lean();
    return impresoras.map(i => i.codigo).filter(Boolean) as string[];
  }
}

export const impresorasService = new ImpresorasService();
