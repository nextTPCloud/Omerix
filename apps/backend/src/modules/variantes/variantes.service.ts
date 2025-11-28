import { Model } from 'mongoose';
import { Variante, IVariante } from '../../models/Variante';
import { CreateVarianteDTO, UpdateVarianteDTO, SearchVariantesDTO } from './variantes.dto';
import { Types } from 'mongoose';
import { IDatabaseConfig } from '../../types/express';
import { getVarianteModel, getFamiliaModel } from '../../utils/dynamic-models.helper';

export class VariantesService {
  /**
   * Obtener modelo de Variante para una empresa específica
   */
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IVariante>> {
    return await getVarianteModel(empresaId, dbConfig);
  }

  async findAll(empresaId: string, filters: SearchVariantesDTO, dbConfig: IDatabaseConfig) {
    const VarianteModel = await this.getModelo(empresaId, dbConfig);
    // Registrar modelo Familia para que el populate funcione
    await getFamiliaModel(empresaId, dbConfig);
    const { q, activo, tipoVisualizacion, aplicaA, page = 1, limit = 50, sortBy = 'orden', sortOrder = 'asc' } = filters;

    const query: any = {};

    if (q) {
      query.$or = [
        { nombre: { $regex: q, $options: 'i' } },
        { codigo: { $regex: q, $options: 'i' } },
      ];
    }

    if (activo !== undefined) query.activo = activo;
    if (tipoVisualizacion) query.tipoVisualizacion = tipoVisualizacion;
    if (aplicaA) query.aplicaA = aplicaA;

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      VarianteModel.find(query).sort(sortOptions).skip(skip).limit(limit).populate('familiasIds', 'nombre').lean(),
      VarianteModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const VarianteModel = await this.getModelo(empresaId, dbConfig);
    // Registrar modelo Familia para que el populate funcione
    await getFamiliaModel(empresaId, dbConfig);
    const variante = await VarianteModel.findById(id).populate('familiasIds', 'nombre').lean();

    if (!variante) throw new Error('Variante no encontrada');
    return variante;
  }

  async create(empresaId: string, data: CreateVarianteDTO, dbConfig: IDatabaseConfig) {
    const VarianteModel = await this.getModelo(empresaId, dbConfig);

    const existente = await VarianteModel.findOne({ nombre: data.nombre });

    if (existente) throw new Error(`Ya existe una variante con el nombre ${data.nombre}`);

    const variante = new VarianteModel({
      ...data,
      familiasIds: data.familiasIds?.map(id => new Types.ObjectId(id)),
    });

    await variante.save();
    return variante.toObject();
  }

  async update(id: string, empresaId: string, data: UpdateVarianteDTO, dbConfig: IDatabaseConfig) {
    const VarianteModel = await this.getModelo(empresaId, dbConfig);

    if (data.nombre) {
      const existente = await VarianteModel.findOne({
        nombre: data.nombre,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existente) throw new Error(`Ya existe una variante con el nombre ${data.nombre}`);
    }

    const updateData: any = { ...data };
    if (data.familiasIds) {
      updateData.familiasIds = data.familiasIds.map(id => new Types.ObjectId(id));
    }

    const variante = await VarianteModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!variante) throw new Error('Variante no encontrada');
    return variante;
  }

  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const VarianteModel = await this.getModelo(empresaId, dbConfig);
    const variante = await VarianteModel.findByIdAndDelete(id);

    if (!variante) throw new Error('Variante no encontrada');
    return { message: 'Variante eliminada correctamente' };
  }

  // Agregar valor a una variante
  async addValor(varianteId: string, empresaId: string, valor: any, dbConfig: IDatabaseConfig) {
    const VarianteModel = await this.getModelo(empresaId, dbConfig);
    const variante = await VarianteModel.findById(varianteId);

    if (!variante) throw new Error('Variante no encontrada');

    variante.valores.push(valor);
    await variante.save();
    return variante.toObject();
  }

  // Eliminar valor de una variante
  async removeValor(varianteId: string, empresaId: string, valorId: string, dbConfig: IDatabaseConfig) {
    const VarianteModel = await this.getModelo(empresaId, dbConfig);
    const variante = await VarianteModel.findByIdAndUpdate(
      varianteId,
      { $pull: { valores: { _id: new Types.ObjectId(valorId) } } },
      { new: true }
    ).lean();

    if (!variante) throw new Error('Variante no encontrada');
    return variante;
  }

  async searchCodigos(empresaId: string, prefix: string, dbConfig: IDatabaseConfig): Promise<string[]> {
    const VarianteModel = await this.getModelo(empresaId, dbConfig);
    const variantes = await VarianteModel.find({
      codigo: { $regex: `^${prefix}`, $options: 'i' }
    }).select('codigo').lean();
    return variantes.map(v => v.codigo).filter(Boolean) as string[];
  }
}

export const variantesService = new VariantesService();
