import { Model } from 'mongoose';
import { TipoGasto, ITipoGasto } from './TipoGasto';
import {
  CreateTipoGastoDTO,
  UpdateTipoGastoDTO,
  SearchTiposGastoDTO,
} from './tipos-gasto.dto';
import { AppError } from '../../middleware/errorHandler.middleware';
import { IDatabaseConfig } from '../../types/express';
import { databaseManager } from '../../services/database-manager.service';

export class TiposGastoService {
  /**
   * Obtener modelo de TipoGasto para una empresa especifica
   */
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<ITipoGasto>> {
    return await databaseManager.getModel<ITipoGasto>(
      empresaId,
      dbConfig,
      'TipoGasto',
      TipoGasto.schema
    );
  }

  /**
   * Obtener todos los tipos de gasto con filtros y paginacion
   */
  async findAll(empresaId: string, filters: SearchTiposGastoDTO, dbConfig: IDatabaseConfig) {
    const TipoGastoModel = await this.getModelo(empresaId, dbConfig);
    const {
      q,
      search,
      activo,
      categoria,
      facturable,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    // Construir query
    const query: any = {};

    // Filtro de busqueda de texto
    const searchTerm = q || search;
    if (searchTerm) {
      query.$or = [
        { nombre: { $regex: searchTerm, $options: 'i' } },
        { codigo: { $regex: searchTerm, $options: 'i' } },
        { descripcion: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Filtro de activo
    if (activo !== undefined && activo !== '') {
      query.activo = activo === 'true';
    }

    // Filtro de categoria
    if (categoria && categoria !== 'all') {
      query.categoria = categoria;
    }

    // Filtro de facturable
    if (facturable !== undefined && facturable !== '') {
      query.facturable = facturable === 'true';
    }

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginacion
    const skip = (page - 1) * limit;

    // Ejecutar query
    const [data, total] = await Promise.all([
      TipoGastoModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      TipoGastoModel.countDocuments(query),
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

  /**
   * Obtener un tipo de gasto por ID
   */
  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const TipoGastoModel = await this.getModelo(empresaId, dbConfig);
    const tipoGasto = await TipoGastoModel.findById(id).lean();

    if (!tipoGasto) {
      throw new AppError('Tipo de gasto no encontrado', 404);
    }

    return tipoGasto;
  }

  /**
   * Crear un nuevo tipo de gasto
   */
  async create(empresaId: string, data: CreateTipoGastoDTO, usuarioId: string, dbConfig: IDatabaseConfig) {
    const TipoGastoModel = await this.getModelo(empresaId, dbConfig);

    // Verificar si ya existe un tipo de gasto con el mismo codigo
    const existente = await TipoGastoModel.findOne({ codigo: data.codigo });

    if (existente) {
      throw new AppError('Ya existe un tipo de gasto con ese codigo', 400);
    }

    // Si no se especifica orden, ponerla al final
    if (data.orden === undefined || data.orden === 0) {
      const maxOrden = await TipoGastoModel.findOne().sort({ orden: -1 }).select('orden').lean();
      data.orden = (maxOrden?.orden || 0) + 1;
    }

    const tipoGasto = new TipoGastoModel({
      ...data,
      creadoPor: usuarioId,
    });
    await tipoGasto.save();

    return tipoGasto.toObject();
  }

  /**
   * Actualizar un tipo de gasto
   */
  async update(id: string, empresaId: string, data: UpdateTipoGastoDTO, usuarioId: string, dbConfig: IDatabaseConfig) {
    const TipoGastoModel = await this.getModelo(empresaId, dbConfig);
    const tipoGasto = await TipoGastoModel.findById(id);

    if (!tipoGasto) {
      throw new AppError('Tipo de gasto no encontrado', 404);
    }

    // Si se esta cambiando el codigo, verificar que no exista
    if (data.codigo && data.codigo !== tipoGasto.codigo) {
      const existente = await TipoGastoModel.findOne({
        codigo: data.codigo,
        _id: { $ne: id },
      });

      if (existente) {
        throw new AppError('Ya existe un tipo de gasto con ese codigo', 400);
      }
    }

    // Actualizar campos
    Object.assign(tipoGasto, data, { modificadoPor: usuarioId });
    await tipoGasto.save();

    return tipoGasto.toObject();
  }

  /**
   * Eliminar un tipo de gasto
   */
  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const TipoGastoModel = await this.getModelo(empresaId, dbConfig);
    const tipoGasto = await TipoGastoModel.findById(id);

    if (!tipoGasto) {
      throw new AppError('Tipo de gasto no encontrado', 404);
    }

    // TODO: Verificar si hay partes de trabajo usando este tipo de gasto

    await tipoGasto.deleteOne();

    return { message: 'Tipo de gasto eliminado correctamente' };
  }

  /**
   * Eliminar multiples tipos de gasto
   */
  async deleteMany(ids: string[], empresaId: string, dbConfig: IDatabaseConfig) {
    const TipoGastoModel = await this.getModelo(empresaId, dbConfig);

    const result = await TipoGastoModel.deleteMany({ _id: { $in: ids } });

    return {
      message: `${result.deletedCount} tipos de gasto eliminados correctamente`,
      eliminados: result.deletedCount,
    };
  }

  /**
   * Obtener tipos de gasto activos
   */
  async getActivos(empresaId: string, dbConfig: IDatabaseConfig) {
    const TipoGastoModel = await this.getModelo(empresaId, dbConfig);
    const tiposGasto = await TipoGastoModel.find({ activo: true })
      .sort({ orden: 1, nombre: 1 })
      .lean();

    return tiposGasto;
  }

  /**
   * Buscar codigos que empiecen con un prefijo (para auto-sugerencia)
   */
  async searchCodigos(empresaId: string, prefix: string, dbConfig: IDatabaseConfig): Promise<string[]> {
    const TipoGastoModel = await this.getModelo(empresaId, dbConfig);
    const tiposGasto = await TipoGastoModel.find(
      { codigo: { $regex: `^${prefix}`, $options: 'i' } },
      { codigo: 1 }
    ).lean();

    return tiposGasto.map(t => t.codigo);
  }

  /**
   * Duplicar un tipo de gasto
   */
  async duplicar(id: string, empresaId: string, usuarioId: string, dbConfig: IDatabaseConfig) {
    const TipoGastoModel = await this.getModelo(empresaId, dbConfig);
    const original = await TipoGastoModel.findById(id).lean();

    if (!original) {
      throw new AppError('Tipo de gasto no encontrado', 404);
    }

    // Generar nuevo codigo
    const baseCode = original.codigo.replace(/-COPIA(\d*)$/, '');
    let newCode = `${baseCode}-COPIA`;
    let counter = 1;

    while (await TipoGastoModel.findOne({ codigo: newCode })) {
      newCode = `${baseCode}-COPIA${counter}`;
      counter++;
    }

    // Obtener siguiente orden
    const maxOrden = await TipoGastoModel.findOne().sort({ orden: -1 }).select('orden').lean();
    const nuevoOrden = (maxOrden?.orden || 0) + 1;

    // Crear copia
    const { _id, createdAt, updatedAt, creadoPor, modificadoPor, ...datosParaCopiar } = original as any;

    const copia = new TipoGastoModel({
      ...datosParaCopiar,
      codigo: newCode,
      nombre: `${original.nombre} (Copia)`,
      orden: nuevoOrden,
      activo: false,
      creadoPor: usuarioId,
    });

    await copia.save();

    return copia.toObject();
  }
}

export const tiposGastoService = new TiposGastoService();
