import { Model } from 'mongoose';
import { ModificadorProducto, IModificadorProducto } from './ModificadorProducto';
import { CreateModificadorDTO, UpdateModificadorDTO, SearchModificadoresDTO } from './modificadores.dto';
import { Types } from 'mongoose';
import { IDatabaseConfig } from '../../types/express';
import { getModificadorProductoModel } from '../../utils/dynamic-models.helper';

export class ModificadoresService {
  private async getModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<IModificadorProducto>> {
    return await getModificadorProductoModel(empresaId, dbConfig);
  }

  async findAll(empresaId: string, filters: SearchModificadoresDTO, dbConfig: IDatabaseConfig) {
    const ModificadorModel = await this.getModelo(empresaId, dbConfig);
    const { q, grupoId, tipo, activo, aplicaA, page = 1, limit = 100, sortBy = 'orden', sortOrder = 'asc' } = filters;

    const query: any = {};

    if (q) {
      query.$or = [
        { nombre: { $regex: q, $options: 'i' } },
        { nombreCorto: { $regex: q, $options: 'i' } },
        { codigo: { $regex: q, $options: 'i' } },
      ];
    }

    if (grupoId) query.grupoId = new Types.ObjectId(grupoId);
    if (tipo) query.tipo = tipo;
    if (activo !== undefined) query.activo = activo;
    if (aplicaA) query.aplicaA = aplicaA;

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      ModificadorModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('grupoId', 'nombre color')
        .populate('familiasIds', 'nombre')
        .populate('productosIds', 'nombre sku')
        .lean(),
      ModificadorModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ModificadorModel = await this.getModelo(empresaId, dbConfig);
    const modificador = await ModificadorModel.findById(id)
      .populate('grupoId', 'nombre color')
      .populate('familiasIds', 'nombre')
      .populate('productosIds', 'nombre sku')
      .lean();

    if (!modificador) throw new Error('Modificador no encontrado');
    return modificador;
  }

  async create(empresaId: string, data: CreateModificadorDTO, dbConfig: IDatabaseConfig) {
    const ModificadorModel = await this.getModelo(empresaId, dbConfig);

    const existente = await ModificadorModel.findOne({ nombre: data.nombre });
    if (existente) throw new Error(`Ya existe un modificador con el nombre ${data.nombre}`);

    const modificador = new ModificadorModel({
      ...data,
      grupoId: data.grupoId ? new Types.ObjectId(data.grupoId) : undefined,
      familiasIds: data.familiasIds?.map(id => new Types.ObjectId(id)),
      productosIds: data.productosIds?.map(id => new Types.ObjectId(id)),
    });

    await modificador.save();
    return modificador.toObject();
  }

  async update(id: string, empresaId: string, data: UpdateModificadorDTO, dbConfig: IDatabaseConfig) {
    const ModificadorModel = await this.getModelo(empresaId, dbConfig);

    if (data.nombre) {
      const existente = await ModificadorModel.findOne({
        nombre: data.nombre,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existente) throw new Error(`Ya existe un modificador con el nombre ${data.nombre}`);
    }

    const updateData: any = { ...data };
    if (data.grupoId) updateData.grupoId = new Types.ObjectId(data.grupoId);
    if (data.familiasIds) updateData.familiasIds = data.familiasIds.map(id => new Types.ObjectId(id));
    if (data.productosIds) updateData.productosIds = data.productosIds.map(id => new Types.ObjectId(id));

    const modificador = await ModificadorModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!modificador) throw new Error('Modificador no encontrado');
    return modificador;
  }

  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ModificadorModel = await this.getModelo(empresaId, dbConfig);
    const modificador = await ModificadorModel.findByIdAndDelete(id);

    if (!modificador) throw new Error('Modificador no encontrado');
    return { message: 'Modificador eliminado correctamente' };
  }

  // Obtener modificadores por producto
  async findByProducto(productoId: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ModificadorModel = await this.getModelo(empresaId, dbConfig);
    const modificadores = await ModificadorModel.find({
      activo: true,
      $or: [
        { aplicaA: 'todos' },
        { productosIds: new Types.ObjectId(productoId) },
      ],
    })
      .populate('grupoId', 'nombre color tipoSeleccion')
      .sort({ orden: 1 })
      .lean();

    return modificadores;
  }

  async searchCodigos(empresaId: string, prefix: string, dbConfig: IDatabaseConfig): Promise<string[]> {
    const ModificadorModel = await this.getModelo(empresaId, dbConfig);
    const modificadores = await ModificadorModel.find({
      codigo: { $regex: `^${prefix}`, $options: 'i' }
    }).select('codigo').lean();
    return modificadores.map(m => m.codigo).filter(Boolean) as string[];
  }
}

export const modificadoresService = new ModificadoresService();
