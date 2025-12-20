import { Model, Types } from 'mongoose';
import { Almacen, IAlmacen } from './Almacen';
import {
  CreateAlmacenDTO,
  UpdateAlmacenDTO,
  SearchAlmacenesDTO,
} from './almacenes.dto';
import { AppError } from '../../middleware/errorHandler.middleware';
import { IDatabaseConfig } from '../../types/express';
import { getAlmacenModel } from '../../utils/dynamic-models.helper';

export class AlmacenesService {
  /**
   * Obtener modelo de Almacen para una empresa específica
   */
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IAlmacen>> {
    return await getAlmacenModel(empresaId, dbConfig);
  }

  /**
   * Obtener todos los almacenes con filtros y paginación
   */
  async findAll(empresaId: string, filters: SearchAlmacenesDTO, dbConfig: IDatabaseConfig) {
    const AlmacenModel = await this.getModelo(empresaId, dbConfig);
    const {
      q,
      activo,
      esPrincipal,
      usarEnTPV,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    // Construir query
    const query: any = {};

    // Filtro de búsqueda de texto
    if (q) {
      query.$or = [
        { nombre: { $regex: q, $options: 'i' } },
        { codigo: { $regex: q, $options: 'i' } },
      ];
    }

    // Filtros booleanos
    if (activo !== undefined) {
      query.activo = activo === 'true';
    }

    if (esPrincipal !== undefined) {
      query.esPrincipal = esPrincipal === 'true';
    }

    if (usarEnTPV !== undefined) {
      query.usarEnTPV = usarEnTPV === 'true';
    }

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar query
    const [data, total] = await Promise.all([
      AlmacenModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      AlmacenModel.countDocuments(query),
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
   * Obtener un almacén por ID
   */
  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const AlmacenModel = await this.getModelo(empresaId, dbConfig);
    const almacen = await AlmacenModel.findById(id).lean();

    if (!almacen) {
      throw new AppError('Almacén no encontrado', 404);
    }

    return almacen;
  }

  /**
   * Crear un nuevo almacén
   */
  async create(empresaId: string, data: CreateAlmacenDTO, dbConfig: IDatabaseConfig) {
    const AlmacenModel = await this.getModelo(empresaId, dbConfig);

    // Verificar si ya existe un almacén con el mismo código
    const existente = await AlmacenModel.findOne({ codigo: data.codigo });

    if (existente) {
      throw new AppError('Ya existe un almacén con ese código', 400);
    }

    // Si es el primer almacén, marcarlo como principal
    const count = await AlmacenModel.countDocuments();
    if (count === 0) {
      data.esPrincipal = true;
    }

    const almacen = new AlmacenModel(data);
    await almacen.save();

    return almacen.toObject();
  }

  /**
   * Actualizar un almacén
   */
  async update(id: string, empresaId: string, data: UpdateAlmacenDTO, dbConfig: IDatabaseConfig) {
    const AlmacenModel = await this.getModelo(empresaId, dbConfig);
    const almacen = await AlmacenModel.findById(id);

    if (!almacen) {
      throw new AppError('Almacén no encontrado', 404);
    }

    // Si se está cambiando el código, verificar que no exista
    if (data.codigo && data.codigo !== almacen.codigo) {
      const existente = await AlmacenModel.findOne({
        codigo: data.codigo,
        _id: { $ne: id },
      });

      if (existente) {
        throw new AppError('Ya existe un almacén con ese código', 400);
      }
    }

    // Actualizar campos
    Object.assign(almacen, data);
    await almacen.save();

    return almacen.toObject();
  }

  /**
   * Eliminar un almacén
   */
  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const AlmacenModel = await this.getModelo(empresaId, dbConfig);
    const almacen = await AlmacenModel.findById(id);

    if (!almacen) {
      throw new AppError('Almacén no encontrado', 404);
    }

    // Verificar que no sea el almacén principal
    if (almacen.esPrincipal) {
      throw new AppError('No se puede eliminar el almacén principal', 400);
    }

    await almacen.deleteOne();

    return { message: 'Almacén eliminado correctamente' };
  }

  /**
   * Establecer un almacén como principal
   */
  async setPrincipal(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const AlmacenModel = await this.getModelo(empresaId, dbConfig);
    const almacen = await AlmacenModel.findById(id);

    if (!almacen) {
      throw new AppError('Almacén no encontrado', 404);
    }

    // Quitar principal a los demás
    await AlmacenModel.updateMany({}, { $set: { esPrincipal: false } });

    almacen.esPrincipal = true;
    await almacen.save();

    return almacen.toObject();
  }

  /**
   * Obtener almacén principal
   */
  async getPrincipal(empresaId: string, dbConfig: IDatabaseConfig) {
    const AlmacenModel = await this.getModelo(empresaId, dbConfig);
    const almacen = await AlmacenModel.findOne({
      esPrincipal: true,
      activo: true,
    }).lean();

    if (!almacen) {
      throw new AppError('No hay almacén principal definido', 404);
    }

    return almacen;
  }

  /**
   * Obtener almacenes activos
   */
  async getActivos(empresaId: string, dbConfig: IDatabaseConfig) {
    const AlmacenModel = await this.getModelo(empresaId, dbConfig);
    const almacenes = await AlmacenModel.find({ activo: true })
      .sort({ nombre: 1 })
      .lean();

    return almacenes;
  }

  /**
   * Buscar códigos que empiecen con un prefijo (para auto-sugerencia)
   */
  async searchCodigos(empresaId: string, prefix: string, dbConfig: IDatabaseConfig): Promise<string[]> {
    const AlmacenModel = await this.getModelo(empresaId, dbConfig);
    const almacenes = await AlmacenModel.find(
      { codigo: { $regex: `^${prefix}`, $options: 'i' } },
      { codigo: 1 }
    ).lean();

    return almacenes.map(a => a.codigo);
  }

  /**
   * Duplicar un almacén
   */
  async duplicar(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const AlmacenModel = await this.getModelo(empresaId, dbConfig);

    const original = await AlmacenModel.findById(id).lean();

    if (!original) {
      throw new AppError('Almacén no encontrado', 404);
    }

    // Generar nuevo código
    const baseCode = original.codigo.replace(/-COPIA(\d*)$/, '');
    let newCode = `${baseCode}-COPIA`;
    let counter = 1;

    while (await AlmacenModel.findOne({ codigo: newCode })) {
      newCode = `${baseCode}-COPIA${counter}`;
      counter++;
    }

    // Crear copia
    const { _id, createdAt, updatedAt, ...datosParaCopiar } = original as any;

    const copia = new AlmacenModel({
      ...datosParaCopiar,
      codigo: newCode,
      nombre: `${original.nombre} (Copia)`,
      esPrincipal: false,
      activo: false,
    });

    await copia.save();

    return copia.toObject();
  }
}

export const almacenesService = new AlmacenesService();
