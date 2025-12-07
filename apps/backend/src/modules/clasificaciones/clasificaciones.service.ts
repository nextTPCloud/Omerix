import mongoose, { Model } from 'mongoose';
import { CreateClasificacionDto, UpdateClasificacionDto, GetClasificacionesQueryDto } from './clasificaciones.dto';
import { IClasificacion } from '@/modules/clasificaciones/Clasificacion';
import { IDatabaseConfig } from '@/models/Empresa';
import { getClasificacionModel } from '@/utils/dynamic-models.helper';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  clasificaciones: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ClasificacionesService {

  /**
   * Obtener modelo de Clasificacion para una empresa específica
   */
  private async getModeloClasificacion(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IClasificacion>> {
    return await getClasificacionModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR CLASIFICACION
  // ============================================

  async crear(
    createClasificacionDto: CreateClasificacionDto,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IClasificacion> {
    const ClasificacionModel = await this.getModeloClasificacion(String(empresaId), dbConfig);

    const clasificacionData = {
      ...createClasificacionDto,
      empresaId,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    };

    const clasificacion = new ClasificacionModel(clasificacionData);
    await clasificacion.save();

    return clasificacion;
  }

  // ============================================
  // OBTENER TODOS CON FILTROS Y PAGINACIÓN
  // ============================================

  async findAll(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    query: Partial<GetClasificacionesQueryDto>
  ): Promise<FindAllResult> {
    const ClasificacionModel = await this.getModeloClasificacion(String(empresaId), dbConfig);

    const {
      search,
      sortBy = 'nombre',
      sortOrder = 'asc',
      page = 1,
      limit = 25,
      activo,
    } = query;

    // Construir filtro
    const filter: any = {};

    // Búsqueda por texto
    if (search) {
      filter.$or = [
        { nombre: { $regex: search, $options: 'i' } },
      ];
    }

    // Filtros adicionales
    if (activo !== undefined) {
      filter.activo = activo;
    }

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar consulta
    const [clasificaciones, total] = await Promise.all([
      ClasificacionModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      ClasificacionModel.countDocuments(filter),
    ]);

    return {
      clasificaciones,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async findById(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IClasificacion | null> {
    const ClasificacionModel = await this.getModeloClasificacion(String(empresaId), dbConfig);

    const clasificacion = await ClasificacionModel.findOne({
      _id: id,
    });

    return clasificacion;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(
    id: string,
    updateClasificacionDto: UpdateClasificacionDto,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IClasificacion | null> {
    const ClasificacionModel = await this.getModeloClasificacion(String(empresaId), dbConfig);

    const clasificacion = await ClasificacionModel.findOneAndUpdate(
      { _id: id },
      {
        ...updateClasificacionDto,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true, runValidators: true }
    );

    return clasificacion;
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const ClasificacionModel = await this.getModeloClasificacion(String(empresaId), dbConfig);

    const resultado = await ClasificacionModel.deleteOne({
      _id: id,
    });

    return resultado.deletedCount > 0;
  }

  // ============================================
  // ELIMINACIÓN MÚLTIPLE
  // ============================================

  async eliminarMultiples(
    ids: string[],
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<number> {
    const ClasificacionModel = await this.getModeloClasificacion(String(empresaId), dbConfig);

    const resultado = await ClasificacionModel.deleteMany({
      _id: { $in: ids },
    });

    return resultado.deletedCount || 0;
  }

  // ============================================
  // ACTIVAR/DESACTIVAR
  // ============================================

  async cambiarEstado(
    id: string,
    activo: boolean,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IClasificacion | null> {
    const ClasificacionModel = await this.getModeloClasificacion(String(empresaId), dbConfig);

    const clasificacion = await ClasificacionModel.findOneAndUpdate(
      { _id: id },
      {
        activo,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );

    return clasificacion;
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const ClasificacionModel = await this.getModeloClasificacion(String(empresaId), dbConfig);

    const [totales, activos, inactivos] = await Promise.all([
      ClasificacionModel.countDocuments({}),
      ClasificacionModel.countDocuments({ activo: true }),
      ClasificacionModel.countDocuments({ activo: false }),
    ]);

    return {
      total: totales,
      activos,
      inactivos,
    };
  }

  // ============================================
  // DUPLICAR
  // ============================================

  async duplicar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IClasificacion> {
    const ClasificacionModel = await this.getModeloClasificacion(String(empresaId), dbConfig);

    const original = await ClasificacionModel.findOne({ _id: id }).lean();

    if (!original) {
      throw new Error('Clasificación no encontrada');
    }

    let nuevoNombre = `${original.nombre} (Copia)`;
    let counter = 1;
    while (await ClasificacionModel.findOne({ nombre: nuevoNombre })) {
      nuevoNombre = `${original.nombre} (Copia ${counter})`;
      counter++;
    }

    const { _id, createdAt, updatedAt, creadoPor, fechaCreacion, ...datosParaCopiar } = original as any;

    const copia = new ClasificacionModel({
      ...datosParaCopiar,
      nombre: nuevoNombre,
      activo: false,
      empresaId,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    });

    await copia.save();

    return copia;
  }
}

export const clasificacionesService = new ClasificacionesService();
