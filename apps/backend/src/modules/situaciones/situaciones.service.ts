import mongoose, { Model } from 'mongoose';
import { CreateSituacionDto, UpdateSituacionDto, GetSituacionesQueryDto } from './situaciones.dto';
import { ISituacion } from '@/modules/situaciones/Situacion';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { getSituacionModel } from '@/utils/dynamic-models.helper';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  situaciones: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class SituacionesService {

  /**
   * Obtener modelo de Situacion para una empresa específica
   */
  private async getModeloSituacion(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<ISituacion>> {
    return await getSituacionModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR SITUACION
  // ============================================

  async crear(
    createSituacionDto: CreateSituacionDto,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ISituacion> {
    const SituacionModel = await this.getModeloSituacion(String(empresaId), dbConfig);

    const situacionData = {
      ...createSituacionDto,
      empresaId,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    };

    const situacion = new SituacionModel(situacionData);
    await situacion.save();

    return situacion;
  }

  // ============================================
  // OBTENER TODOS CON FILTROS Y PAGINACIÓN
  // ============================================

  async findAll(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    query: Partial<GetSituacionesQueryDto>
  ): Promise<FindAllResult> {
    const SituacionModel = await this.getModeloSituacion(String(empresaId), dbConfig);

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
    const [situaciones, total] = await Promise.all([
      SituacionModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      SituacionModel.countDocuments(filter),
    ]);

    return {
      situaciones,
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
  ): Promise<ISituacion | null> {
    const SituacionModel = await this.getModeloSituacion(String(empresaId), dbConfig);

    const situacion = await SituacionModel.findOne({
      _id: id,
    });

    return situacion;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(
    id: string,
    updateSituacionDto: UpdateSituacionDto,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ISituacion | null> {
    const SituacionModel = await this.getModeloSituacion(String(empresaId), dbConfig);

    const situacion = await SituacionModel.findOneAndUpdate(
      { _id: id },
      {
        ...updateSituacionDto,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true, runValidators: true }
    );

    return situacion;
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const SituacionModel = await this.getModeloSituacion(String(empresaId), dbConfig);

    const resultado = await SituacionModel.deleteOne({
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
    const SituacionModel = await this.getModeloSituacion(String(empresaId), dbConfig);

    const resultado = await SituacionModel.deleteMany({
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
  ): Promise<ISituacion | null> {
    const SituacionModel = await this.getModeloSituacion(String(empresaId), dbConfig);

    const situacion = await SituacionModel.findOneAndUpdate(
      { _id: id },
      {
        activo,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );

    return situacion;
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const SituacionModel = await this.getModeloSituacion(String(empresaId), dbConfig);

    const [totales, activos, inactivos] = await Promise.all([
      SituacionModel.countDocuments({}),
      SituacionModel.countDocuments({ activo: true }),
      SituacionModel.countDocuments({ activo: false }),
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
  ): Promise<ISituacion> {
    const SituacionModel = await this.getModeloSituacion(String(empresaId), dbConfig);

    const original = await SituacionModel.findOne({ _id: id }).lean();

    if (!original) {
      throw new Error('Situación no encontrada');
    }

    let nuevoNombre = `${original.nombre} (Copia)`;
    let counter = 1;
    while (await SituacionModel.findOne({ nombre: nuevoNombre })) {
      nuevoNombre = `${original.nombre} (Copia ${counter})`;
      counter++;
    }

    const { _id, createdAt, updatedAt, creadoPor, fechaCreacion, ...datosParaCopiar } = original as any;

    const copia = new SituacionModel({
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

export const situacionesService = new SituacionesService();
