import { Model } from 'mongoose';
import { FormaPago, IFormaPago } from './FormaPago';
import {
  CreateFormaPagoDTO,
  UpdateFormaPagoDTO,
  SearchFormasPagoDTO,
} from './formas-pago.dto';
import { AppError } from '../../middleware/errorHandler.middleware';
import { IDatabaseConfig } from '../../types/express';
import { getFormaPagoModel } from '../../utils/dynamic-models.helper';

export class FormasPagoService {
  /**
   * Obtener modelo de FormaPago para una empresa específica
   */
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IFormaPago>> {
    return await getFormaPagoModel(empresaId, dbConfig);
  }

  /**
   * Obtener todas las formas de pago con filtros y paginación
   */
  async findAll(empresaId: string, filters: SearchFormasPagoDTO, dbConfig: IDatabaseConfig) {
    const FormaPagoModel = await this.getModelo(empresaId, dbConfig);
    const {
      q,
      activo,
      tipo,
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
        { descripcion: { $regex: q, $options: 'i' } },
      ];
    }

    // Filtro de activo
    if (activo !== undefined) {
      query.activo = activo === 'true';
    }

    // Filtro de tipo
    if (tipo && tipo !== 'all') {
      query.tipo = tipo;
    }

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar query
    const [data, total] = await Promise.all([
      FormaPagoModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      FormaPagoModel.countDocuments(query),
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
   * Obtener una forma de pago por ID
   */
  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const FormaPagoModel = await this.getModelo(empresaId, dbConfig);
    const formaPago = await FormaPagoModel.findById(id).lean();

    if (!formaPago) {
      throw new AppError('Forma de pago no encontrada', 404);
    }

    return formaPago;
  }

  /**
   * Crear una nueva forma de pago
   */
  async create(empresaId: string, data: CreateFormaPagoDTO, dbConfig: IDatabaseConfig) {
    const FormaPagoModel = await this.getModelo(empresaId, dbConfig);

    // Verificar si ya existe una forma de pago con el mismo código
    const existente = await FormaPagoModel.findOne({ codigo: data.codigo });

    if (existente) {
      throw new AppError('Ya existe una forma de pago con ese código', 400);
    }

    // Si no se especifica orden, ponerla al final
    if (data.orden === undefined || data.orden === 0) {
      const maxOrden = await FormaPagoModel.findOne().sort({ orden: -1 }).select('orden').lean();
      data.orden = (maxOrden?.orden || 0) + 1;
    }

    const formaPago = new FormaPagoModel(data);
    await formaPago.save();

    return formaPago.toObject();
  }

  /**
   * Actualizar una forma de pago
   */
  async update(id: string, empresaId: string, data: UpdateFormaPagoDTO, dbConfig: IDatabaseConfig) {
    const FormaPagoModel = await this.getModelo(empresaId, dbConfig);
    const formaPago = await FormaPagoModel.findById(id);

    if (!formaPago) {
      throw new AppError('Forma de pago no encontrada', 404);
    }

    // Si se está cambiando el código, verificar que no exista
    if (data.codigo && data.codigo !== formaPago.codigo) {
      const existente = await FormaPagoModel.findOne({
        codigo: data.codigo,
        _id: { $ne: id },
      });

      if (existente) {
        throw new AppError('Ya existe una forma de pago con ese código', 400);
      }
    }

    // Actualizar campos
    Object.assign(formaPago, data);
    await formaPago.save();

    return formaPago.toObject();
  }

  /**
   * Eliminar una forma de pago
   */
  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const FormaPagoModel = await this.getModelo(empresaId, dbConfig);
    const formaPago = await FormaPagoModel.findById(id);

    if (!formaPago) {
      throw new AppError('Forma de pago no encontrada', 404);
    }

    // TODO: Verificar si hay clientes usando esta forma de pago

    await formaPago.deleteOne();

    return { message: 'Forma de pago eliminada correctamente' };
  }

  /**
   * Obtener formas de pago activas
   */
  async getActivas(empresaId: string, dbConfig: IDatabaseConfig) {
    const FormaPagoModel = await this.getModelo(empresaId, dbConfig);
    const formasPago = await FormaPagoModel.find({ activo: true })
      .sort({ orden: 1, nombre: 1 })
      .lean();

    return formasPago;
  }

  /**
   * Buscar códigos que empiecen con un prefijo
   */
  async searchCodigos(empresaId: string, prefix: string, dbConfig: IDatabaseConfig): Promise<string[]> {
    const FormaPagoModel = await this.getModelo(empresaId, dbConfig);
    const formasPago = await FormaPagoModel.find(
      { codigo: { $regex: `^${prefix}`, $options: 'i' } },
      { codigo: 1 }
    ).lean();

    return formasPago.map(f => f.codigo);
  }

  /**
   * Duplicar una forma de pago
   */
  async duplicar(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const FormaPagoModel = await this.getModelo(empresaId, dbConfig);
    const original = await FormaPagoModel.findById(id).lean();

    if (!original) {
      throw new AppError('Forma de pago no encontrada', 404);
    }

    // Generar nuevo código
    const baseCode = original.codigo.replace(/-COPIA(\d*)$/, '');
    let newCode = `${baseCode}-COPIA`;
    let counter = 1;

    while (await FormaPagoModel.findOne({ codigo: newCode })) {
      newCode = `${baseCode}-COPIA${counter}`;
      counter++;
    }

    // Obtener siguiente orden
    const maxOrden = await FormaPagoModel.findOne().sort({ orden: -1 }).select('orden').lean();
    const nuevoOrden = (maxOrden?.orden || 0) + 1;

    // Crear copia
    const { _id, createdAt, updatedAt, ...datosParaCopiar } = original as any;

    const copia = new FormaPagoModel({
      ...datosParaCopiar,
      codigo: newCode,
      nombre: `${original.nombre} (Copia)`,
      orden: nuevoOrden,
      activo: false, // La copia se crea inactiva
    });

    await copia.save();

    return copia.toObject();
  }
}

export const formasPagoService = new FormasPagoService();
