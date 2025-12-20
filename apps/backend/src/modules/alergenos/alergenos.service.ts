import { Model } from 'mongoose';
import { Alergeno, IAlergeno, ALERGENOS_UE } from './Alergeno';
import { CreateAlergenoDTO, UpdateAlergenoDTO, SearchAlergenosDTO } from './alergenos.dto';
import { Types } from 'mongoose';
import { IDatabaseConfig } from '../../types/express';
import { getAlergenoModel } from '../../utils/dynamic-models.helper';

export class AlergenosService {
  private async getModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<IAlergeno>> {
    return await getAlergenoModel(empresaId, dbConfig);
  }

  async findAll(empresaId: string, filters: SearchAlergenosDTO, dbConfig: IDatabaseConfig) {
    const AlergenoModel = await this.getModelo(empresaId, dbConfig);
    const { q, activo, esObligatorioUE, page = 1, limit = 50, sortBy = 'orden', sortOrder = 'asc' } = filters;

    const query: any = {};

    if (q) {
      query.$or = [
        { nombre: { $regex: q, $options: 'i' } },
        { codigo: { $regex: q, $options: 'i' } },
      ];
    }

    if (activo !== undefined) query.activo = activo;
    if (esObligatorioUE !== undefined) query.esObligatorioUE = esObligatorioUE;

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      AlergenoModel.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      AlergenoModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const AlergenoModel = await this.getModelo(empresaId, dbConfig);
    const alergeno = await AlergenoModel.findById(id).lean();

    if (!alergeno) throw new Error('Alérgeno no encontrado');
    return alergeno;
  }

  async create(empresaId: string, data: CreateAlergenoDTO, dbConfig: IDatabaseConfig) {
    const AlergenoModel = await this.getModelo(empresaId, dbConfig);

    const existente = await AlergenoModel.findOne({ codigo: data.codigo });
    if (existente) throw new Error(`Ya existe un alérgeno con el código ${data.codigo}`);

    const alergeno = new AlergenoModel(data);
    await alergeno.save();
    return alergeno.toObject();
  }

  async update(id: string, empresaId: string, data: UpdateAlergenoDTO, dbConfig: IDatabaseConfig) {
    const AlergenoModel = await this.getModelo(empresaId, dbConfig);

    if (data.codigo) {
      const existente = await AlergenoModel.findOne({
        codigo: data.codigo,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existente) throw new Error(`Ya existe un alérgeno con el código ${data.codigo}`);
    }

    const alergeno = await AlergenoModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    if (!alergeno) throw new Error('Alérgeno no encontrado');
    return alergeno;
  }

  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const AlergenoModel = await this.getModelo(empresaId, dbConfig);
    const alergeno = await AlergenoModel.findByIdAndDelete(id);

    if (!alergeno) throw new Error('Alérgeno no encontrado');
    return { message: 'Alérgeno eliminado correctamente' };
  }

  // Inicializar con los 14 alérgenos obligatorios de la UE
  async initializeUE(empresaId: string, dbConfig: IDatabaseConfig) {
    const AlergenoModel = await this.getModelo(empresaId, dbConfig);

    const existentes = await AlergenoModel.countDocuments({ esObligatorioUE: true });

    if (existentes > 0) {
      return { message: 'Los alérgenos UE ya están inicializados', count: existentes };
    }

    const alergenos = ALERGENOS_UE.map(a => ({
      ...a,
      esObligatorioUE: true,
      activo: true,
    }));

    await AlergenoModel.insertMany(alergenos);
    return { message: 'Alérgenos UE inicializados correctamente', count: alergenos.length };
  }

  async searchCodigos(empresaId: string, prefix: string, dbConfig: IDatabaseConfig): Promise<string[]> {
    const AlergenoModel = await this.getModelo(empresaId, dbConfig);
    const alergenos = await AlergenoModel.find({
      codigo: { $regex: `^${prefix}`, $options: 'i' }
    }).select('codigo').lean();
    return alergenos.map(a => a.codigo).filter(Boolean) as string[];
  }
}

export const alergenosService = new AlergenosService();
