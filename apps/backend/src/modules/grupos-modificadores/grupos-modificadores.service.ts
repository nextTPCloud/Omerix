import { Model } from 'mongoose';
import { GrupoModificadores, IGrupoModificadores } from './GrupoModificadores';
import { ModificadorProducto, IModificadorProducto } from '../modificadores/ModificadorProducto';
import { CreateGrupoModificadoresDTO, UpdateGrupoModificadoresDTO, SearchGruposModificadoresDTO } from './grupos-modificadores.dto';
import { Types } from 'mongoose';
import { IDatabaseConfig } from '../../types/express';
import { getGrupoModificadoresModel, getModificadorProductoModel } from '../../utils/dynamic-models.helper';

export class GruposModificadoresService {
  private async getModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<IGrupoModificadores>> {
    return await getGrupoModificadoresModel(empresaId, dbConfig);
  }

  private async getModificadorModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<IModificadorProducto>> {
    return await getModificadorProductoModel(empresaId, dbConfig);
  }

  async findAll(empresaId: string, filters: SearchGruposModificadoresDTO, dbConfig: IDatabaseConfig) {
    const GrupoModel = await this.getModelo(empresaId, dbConfig);
    const { q, activo, aplicaA, page = 1, limit = 50, sortBy = 'orden', sortOrder = 'asc' } = filters;

    const query: any = {};

    if (q) {
      query.$or = [
        { nombre: { $regex: q, $options: 'i' } },
        { codigo: { $regex: q, $options: 'i' } },
      ];
    }

    if (activo !== undefined) query.activo = activo;
    if (aplicaA) query.aplicaA = aplicaA;

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      GrupoModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('familiasIds', 'nombre')
        .populate('productosIds', 'nombre sku')
        .lean(),
      GrupoModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const GrupoModel = await this.getModelo(empresaId, dbConfig);
    const grupo = await GrupoModel.findById(id)
      .populate('familiasIds', 'nombre')
      .populate('productosIds', 'nombre sku')
      .lean();

    if (!grupo) throw new Error('Grupo de modificadores no encontrado');
    return grupo;
  }

  async findOneWithModificadores(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const grupo = await this.findOne(id, empresaId, dbConfig);
    const ModificadorModel = await this.getModificadorModelo(empresaId, dbConfig);

    const modificadores = await ModificadorModel.find({
      grupoId: new Types.ObjectId(id),
      activo: true,
    }).sort({ orden: 1 }).lean();

    return { ...grupo, modificadores };
  }

  async create(empresaId: string, data: CreateGrupoModificadoresDTO, dbConfig: IDatabaseConfig) {
    const GrupoModel = await this.getModelo(empresaId, dbConfig);

    const existente = await GrupoModel.findOne({ nombre: data.nombre });
    if (existente) throw new Error(`Ya existe un grupo con el nombre ${data.nombre}`);

    const grupo = new GrupoModel({
      ...data,
      familiasIds: data.familiasIds?.map(id => new Types.ObjectId(id)),
      productosIds: data.productosIds?.map(id => new Types.ObjectId(id)),
    });

    await grupo.save();
    return grupo.toObject();
  }

  async update(id: string, empresaId: string, data: UpdateGrupoModificadoresDTO, dbConfig: IDatabaseConfig) {
    const GrupoModel = await this.getModelo(empresaId, dbConfig);

    if (data.nombre) {
      const existente = await GrupoModel.findOne({
        nombre: data.nombre,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existente) throw new Error(`Ya existe un grupo con el nombre ${data.nombre}`);
    }

    const updateData: any = { ...data };
    if (data.familiasIds) updateData.familiasIds = data.familiasIds.map(id => new Types.ObjectId(id));
    if (data.productosIds) updateData.productosIds = data.productosIds.map(id => new Types.ObjectId(id));

    const grupo = await GrupoModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!grupo) throw new Error('Grupo de modificadores no encontrado');
    return grupo;
  }

  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const GrupoModel = await this.getModelo(empresaId, dbConfig);
    const ModificadorModel = await this.getModificadorModelo(empresaId, dbConfig);

    // Verificar si hay modificadores asociados
    const modificadoresCount = await ModificadorModel.countDocuments({
      grupoId: new Types.ObjectId(id),
    });

    if (modificadoresCount > 0) {
      throw new Error(`No se puede eliminar el grupo porque tiene ${modificadoresCount} modificador(es) asociado(s)`);
    }

    const grupo = await GrupoModel.findByIdAndDelete(id);
    if (!grupo) throw new Error('Grupo de modificadores no encontrado');
    return { message: 'Grupo de modificadores eliminado correctamente' };
  }

  async searchCodigos(empresaId: string, prefix: string, dbConfig: IDatabaseConfig): Promise<string[]> {
    const GrupoModel = await this.getModelo(empresaId, dbConfig);
    const grupos = await GrupoModel.find({
      codigo: { $regex: `^${prefix}`, $options: 'i' }
    }).select('codigo').lean();
    return grupos.map(g => g.codigo).filter(Boolean) as string[];
  }
}

export const gruposModificadoresService = new GruposModificadoresService();
