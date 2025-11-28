import { Model } from 'mongoose';
import { TipoImpuesto, ITipoImpuesto } from '../../models/TipoImpuesto';
import { CreateTipoImpuestoDTO, UpdateTipoImpuestoDTO, SearchTiposImpuestoDTO } from './tipos-impuesto.dto';
import { Types } from 'mongoose';
import { IDatabaseConfig } from '../../types/express';
import { getTiposImpuestoModel } from '../../utils/dynamic-models.helper';

/**
 * Servicio para gestionar tipos de impuesto
 */
export class TiposImpuestoService {
  private async getModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<ITipoImpuesto>> {
    return await getTiposImpuestoModel(empresaId, dbConfig);
  }

  /**
   * Obtener todos los tipos de impuesto con filtros y paginación
   */
  async findAll(empresaId: string, filters: SearchTiposImpuestoDTO, dbConfig: IDatabaseConfig) {
    const TipoImpuestoModel = await this.getModelo(empresaId, dbConfig);
    const { q, tipo, activo, predeterminado, recargoEquivalencia, page, limit, sortBy, sortOrder } = filters;

    // Construir query
    const query: any = {};

    // Filtro de búsqueda por texto
    if (q) {
      query.$or = [
        { codigo: { $regex: q, $options: 'i' } },
        { nombre: { $regex: q, $options: 'i' } },
        { descripcion: { $regex: q, $options: 'i' } },
      ];
    }

    // Filtro por tipo
    if (tipo) {
      query.tipo = tipo;
    }

    // Filtro por activo
    if (activo !== undefined) {
      query.activo = activo;
    }

    // Filtro por predeterminado
    if (predeterminado !== undefined) {
      query.predeterminado = predeterminado;
    }

    // Filtro por recargo de equivalencia
    if (recargoEquivalencia !== undefined) {
      query.recargoEquivalencia = recargoEquivalencia;
    }

    // Paginación
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar query
    const [data, total] = await Promise.all([
      TipoImpuestoModel.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      TipoImpuestoModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener un tipo de impuesto por ID
   */
  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const TipoImpuestoModel = await this.getModelo(empresaId, dbConfig);
    const tipoImpuesto = await TipoImpuestoModel.findById(id).lean();

    if (!tipoImpuesto) {
      throw new Error('Tipo de impuesto no encontrado');
    }

    return tipoImpuesto;
  }

  /**
   * Crear un nuevo tipo de impuesto
   */
  async create(empresaId: string, data: CreateTipoImpuestoDTO, dbConfig: IDatabaseConfig) {
    const TipoImpuestoModel = await this.getModelo(empresaId, dbConfig);

    // Verificar que no exista otro con el mismo código
    const existente = await TipoImpuestoModel.findOne({ codigo: data.codigo });

    if (existente) {
      throw new Error(`Ya existe un tipo de impuesto con el código ${data.codigo}`);
    }

    const tipoImpuesto = new TipoImpuestoModel(data);
    await tipoImpuesto.save();
    return tipoImpuesto.toObject();
  }

  /**
   * Actualizar un tipo de impuesto
   */
  async update(id: string, empresaId: string, data: UpdateTipoImpuestoDTO, dbConfig: IDatabaseConfig) {
    const TipoImpuestoModel = await this.getModelo(empresaId, dbConfig);

    // Si se está actualizando el código, verificar que no exista otro con el mismo
    if (data.codigo) {
      const existente = await TipoImpuestoModel.findOne({
        codigo: data.codigo,
        _id: { $ne: new Types.ObjectId(id) },
      });

      if (existente) {
        throw new Error(`Ya existe un tipo de impuesto con el código ${data.codigo}`);
      }
    }

    const tipoImpuesto = await TipoImpuestoModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    if (!tipoImpuesto) {
      throw new Error('Tipo de impuesto no encontrado');
    }

    return tipoImpuesto;
  }

  /**
   * Eliminar un tipo de impuesto
   */
  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const TipoImpuestoModel = await this.getModelo(empresaId, dbConfig);
    const tipoImpuesto = await TipoImpuestoModel.findByIdAndDelete(id);

    if (!tipoImpuesto) {
      throw new Error('Tipo de impuesto no encontrado');
    }

    return { message: 'Tipo de impuesto eliminado correctamente' };
  }

  /**
   * Establecer un tipo de impuesto como predeterminado
   */
  async setPredeterminado(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const TipoImpuestoModel = await this.getModelo(empresaId, dbConfig);
    const tipoImpuesto = await TipoImpuestoModel.findById(id);

    if (!tipoImpuesto) {
      throw new Error('Tipo de impuesto no encontrado');
    }

    tipoImpuesto.predeterminado = true;
    await tipoImpuesto.save();

    return tipoImpuesto.toObject();
  }

  /**
   * Buscar códigos existentes por prefijo (para auto-sugerencia)
   */
  async searchCodigos(empresaId: string, prefix: string, dbConfig: IDatabaseConfig): Promise<string[]> {
    const TipoImpuestoModel = await this.getModelo(empresaId, dbConfig);
    const tiposImpuesto = await TipoImpuestoModel.find(
      { codigo: { $regex: `^${prefix}`, $options: 'i' } },
      { codigo: 1 }
    ).lean();

    return tiposImpuesto.map(t => t.codigo);
  }
}

export const tiposImpuestoService = new TiposImpuestoService();
