import { TipoImpuesto } from '../../models/TipoImpuesto';
import { CreateTipoImpuestoDTO, UpdateTipoImpuestoDTO, SearchTiposImpuestoDTO } from './tipos-impuesto.dto';
import { Types } from 'mongoose';

/**
 * Servicio para gestionar tipos de impuesto
 */
export class TiposImpuestoService {
  /**
   * Obtener todos los tipos de impuesto con filtros y paginación
   */
  async findAll(empresaId: string, filters: SearchTiposImpuestoDTO) {
    const { q, tipo, activo, page, limit, sortBy, sortOrder } = filters;

    // Construir query
    const query: any = { empresaId: new Types.ObjectId(empresaId) };

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

    // Paginación
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar query
    const [data, total] = await Promise.all([
      TipoImpuesto.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      TipoImpuesto.countDocuments(query),
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
   * Obtener un tipo de impuesto por ID
   */
  async findOne(id: string, empresaId: string) {
    const tipoImpuesto = await TipoImpuesto.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    }).lean();

    if (!tipoImpuesto) {
      throw new Error('Tipo de impuesto no encontrado');
    }

    return tipoImpuesto;
  }

  /**
   * Crear un nuevo tipo de impuesto
   */
  async create(empresaId: string, data: CreateTipoImpuestoDTO) {
    // Verificar que no exista otro con el mismo código
    const existente = await TipoImpuesto.findOne({
      empresaId: new Types.ObjectId(empresaId),
      codigo: data.codigo,
    });

    if (existente) {
      throw new Error(`Ya existe un tipo de impuesto con el código ${data.codigo}`);
    }

    const tipoImpuesto = new TipoImpuesto({
      ...data,
      empresaId: new Types.ObjectId(empresaId),
    });

    await tipoImpuesto.save();
    return tipoImpuesto.toObject();
  }

  /**
   * Actualizar un tipo de impuesto
   */
  async update(id: string, empresaId: string, data: UpdateTipoImpuestoDTO) {
    // Si se está actualizando el código, verificar que no exista otro con el mismo
    if (data.codigo) {
      const existente = await TipoImpuesto.findOne({
        empresaId: new Types.ObjectId(empresaId),
        codigo: data.codigo,
        _id: { $ne: new Types.ObjectId(id) },
      });

      if (existente) {
        throw new Error(`Ya existe un tipo de impuesto con el código ${data.codigo}`);
      }
    }

    const tipoImpuesto = await TipoImpuesto.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        empresaId: new Types.ObjectId(empresaId),
      },
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
  async delete(id: string, empresaId: string) {
    const tipoImpuesto = await TipoImpuesto.findOneAndDelete({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!tipoImpuesto) {
      throw new Error('Tipo de impuesto no encontrado');
    }

    return { message: 'Tipo de impuesto eliminado correctamente' };
  }

  /**
   * Establecer un tipo de impuesto como predeterminado
   */
  async setPredeterminado(id: string, empresaId: string) {
    const tipoImpuesto = await TipoImpuesto.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!tipoImpuesto) {
      throw new Error('Tipo de impuesto no encontrado');
    }

    tipoImpuesto.predeterminado = true;
    await tipoImpuesto.save();

    return tipoImpuesto.toObject();
  }
}

export const tiposImpuestoService = new TiposImpuestoService();
