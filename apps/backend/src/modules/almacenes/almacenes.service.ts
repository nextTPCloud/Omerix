import { Types } from 'mongoose';
import { Almacen, IAlmacen } from '../../models/Almacen';
import {
  CreateAlmacenDTO,
  UpdateAlmacenDTO,
  SearchAlmacenesDTO,
} from './almacenes.dto';
import { AppError } from '../../middleware/error.middleware';

export class AlmacenesService {
  /**
   * Obtener todos los almacenes con filtros y paginación
   */
  async findAll(empresaId: Types.ObjectId, filters: SearchAlmacenesDTO) {
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
    const query: any = { empresaId };

    // Filtro de búsqueda de texto
    if (q) {
      query.$text = { $search: q };
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
    if (q) {
      sort.score = { $meta: 'textScore' };
    }
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar query
    const [data, total] = await Promise.all([
      Almacen.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Almacen.countDocuments(query),
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
  async findOne(id: string, empresaId: Types.ObjectId) {
    const almacen = await Almacen.findOne({
      _id: id,
      empresaId,
    }).lean();

    if (!almacen) {
      throw new AppError('Almacén no encontrado', 404);
    }

    return almacen;
  }

  /**
   * Crear un nuevo almacén
   */
  async create(empresaId: Types.ObjectId, data: CreateAlmacenDTO) {
    // Verificar si ya existe un almacén con el mismo código
    const existente = await Almacen.findOne({
      empresaId,
      codigo: data.codigo,
    });

    if (existente) {
      throw new AppError('Ya existe un almacén con ese código', 400);
    }

    // Si es el primer almacén, marcarlo como principal
    const count = await Almacen.countDocuments({ empresaId });
    if (count === 0) {
      data.esPrincipal = true;
    }

    const almacen = new Almacen({
      ...data,
      empresaId,
    });

    await almacen.save();

    return almacen.toObject();
  }

  /**
   * Actualizar un almacén
   */
  async update(
    id: string,
    empresaId: Types.ObjectId,
    data: UpdateAlmacenDTO
  ) {
    const almacen = await Almacen.findOne({ _id: id, empresaId });

    if (!almacen) {
      throw new AppError('Almacén no encontrado', 404);
    }

    // Si se está cambiando el código, verificar que no exista
    if (data.codigo && data.codigo !== almacen.codigo) {
      const existente = await Almacen.findOne({
        empresaId,
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
  async delete(id: string, empresaId: Types.ObjectId) {
    const almacen = await Almacen.findOne({ _id: id, empresaId });

    if (!almacen) {
      throw new AppError('Almacén no encontrado', 404);
    }

    // Verificar que no sea el almacén principal
    if (almacen.esPrincipal) {
      throw new AppError('No se puede eliminar el almacén principal', 400);
    }

    // TODO: Verificar que no tenga stock asignado

    await almacen.deleteOne();

    return { message: 'Almacén eliminado correctamente' };
  }

  /**
   * Establecer un almacén como principal
   */
  async setPrincipal(id: string, empresaId: Types.ObjectId) {
    const almacen = await Almacen.findOne({ _id: id, empresaId });

    if (!almacen) {
      throw new AppError('Almacén no encontrado', 404);
    }

    almacen.esPrincipal = true;
    await almacen.save();

    return almacen.toObject();
  }

  /**
   * Obtener almacén principal
   */
  async getPrincipal(empresaId: Types.ObjectId) {
    const almacen = await Almacen.findOne({
      empresaId,
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
  async getActivos(empresaId: Types.ObjectId) {
    const almacenes = await Almacen.find({
      empresaId,
      activo: true,
    })
      .sort({ nombre: 1 })
      .lean();

    return almacenes;
  }
}

export const almacenesService = new AlmacenesService();
