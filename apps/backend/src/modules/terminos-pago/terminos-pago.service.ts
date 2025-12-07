import { Model } from 'mongoose';
import { TerminoPago, ITerminoPago } from '../../models/TerminoPago';
import {
  CreateTerminoPagoDTO,
  UpdateTerminoPagoDTO,
  SearchTerminosPagoDTO,
} from './terminos-pago.dto';
import { AppError } from '../../middleware/errorHandler.middleware';
import { IDatabaseConfig } from '../../types/express';
import { getTerminoPagoModel } from '../../utils/dynamic-models.helper';

export class TerminosPagoService {
  /**
   * Obtener modelo de TerminoPago para una empresa específica
   */
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<ITerminoPago>> {
    return await getTerminoPagoModel(empresaId, dbConfig);
  }

  /**
   * Obtener todos los términos de pago con filtros y paginación
   */
  async findAll(empresaId: string, filters: SearchTerminosPagoDTO, dbConfig: IDatabaseConfig) {
    const TerminoPagoModel = await this.getModelo(empresaId, dbConfig);
    const {
      q,
      activo,
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

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar query
    const [data, total] = await Promise.all([
      TerminoPagoModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      TerminoPagoModel.countDocuments(query),
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
   * Obtener un término de pago por ID
   */
  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const TerminoPagoModel = await this.getModelo(empresaId, dbConfig);
    const terminoPago = await TerminoPagoModel.findById(id).lean();

    if (!terminoPago) {
      throw new AppError('Término de pago no encontrado', 404);
    }

    return terminoPago;
  }

  /**
   * Crear un nuevo término de pago
   */
  async create(empresaId: string, data: CreateTerminoPagoDTO, dbConfig: IDatabaseConfig) {
    const TerminoPagoModel = await this.getModelo(empresaId, dbConfig);

    // Verificar si ya existe un término con el mismo código
    const existente = await TerminoPagoModel.findOne({ codigo: data.codigo });

    if (existente) {
      throw new AppError('Ya existe un término de pago con ese código', 400);
    }

    const terminoPago = new TerminoPagoModel(data);
    await terminoPago.save();

    return terminoPago.toObject();
  }

  /**
   * Actualizar un término de pago
   */
  async update(id: string, empresaId: string, data: UpdateTerminoPagoDTO, dbConfig: IDatabaseConfig) {
    const TerminoPagoModel = await this.getModelo(empresaId, dbConfig);
    const terminoPago = await TerminoPagoModel.findById(id);

    if (!terminoPago) {
      throw new AppError('Término de pago no encontrado', 404);
    }

    // Si se está cambiando el código, verificar que no exista
    if (data.codigo && data.codigo !== terminoPago.codigo) {
      const existente = await TerminoPagoModel.findOne({
        codigo: data.codigo,
        _id: { $ne: id },
      });

      if (existente) {
        throw new AppError('Ya existe un término de pago con ese código', 400);
      }
    }

    // Actualizar campos
    Object.assign(terminoPago, data);
    await terminoPago.save();

    return terminoPago.toObject();
  }

  /**
   * Eliminar un término de pago
   */
  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const TerminoPagoModel = await this.getModelo(empresaId, dbConfig);
    const terminoPago = await TerminoPagoModel.findById(id);

    if (!terminoPago) {
      throw new AppError('Término de pago no encontrado', 404);
    }

    // TODO: Verificar si hay clientes usando este término de pago

    await terminoPago.deleteOne();

    return { message: 'Término de pago eliminado correctamente' };
  }

  /**
   * Obtener términos de pago activos
   */
  async getActivos(empresaId: string, dbConfig: IDatabaseConfig) {
    const TerminoPagoModel = await this.getModelo(empresaId, dbConfig);
    const terminosPago = await TerminoPagoModel.find({ activo: true })
      .sort({ nombre: 1 })
      .lean();

    return terminosPago;
  }

  /**
   * Buscar códigos que empiecen con un prefijo (para auto-sugerencia)
   */
  async searchCodigos(empresaId: string, prefix: string, dbConfig: IDatabaseConfig): Promise<string[]> {
    const TerminoPagoModel = await this.getModelo(empresaId, dbConfig);
    const terminosPago = await TerminoPagoModel.find(
      { codigo: { $regex: `^${prefix}`, $options: 'i' } },
      { codigo: 1 }
    ).lean();

    return terminosPago.map(t => t.codigo);
  }

  /**
   * Duplicar un término de pago
   */
  async duplicar(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const TerminoPagoModel = await this.getModelo(empresaId, dbConfig);

    const original = await TerminoPagoModel.findById(id).lean();

    if (!original) {
      throw new AppError('Término de pago no encontrado', 404);
    }

    // Generar nuevo código
    const baseCode = original.codigo.replace(/-COPIA(\d*)$/, '');
    let newCode = `${baseCode}-COPIA`;
    let counter = 1;

    while (await TerminoPagoModel.findOne({ codigo: newCode })) {
      newCode = `${baseCode}-COPIA${counter}`;
      counter++;
    }

    // Crear copia
    const { _id, createdAt, updatedAt, ...datosParaCopiar } = original as any;

    const copia = new TerminoPagoModel({
      ...datosParaCopiar,
      codigo: newCode,
      nombre: `${original.nombre} (Copia)`,
      activo: false,
    });

    await copia.save();

    return copia.toObject();
  }
}

export const terminosPagoService = new TerminosPagoService();
