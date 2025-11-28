import mongoose, { Model } from 'mongoose';
import { CreateEstadoDto, UpdateEstadoDto, GetEstadosQueryDto } from './estados.dto';
import { IEstado } from '@/modules/estados/Estado';
import { IDatabaseConfig } from '@/models/Empresa';
import { getEstadoModel } from '@/utils/dynamic-models.helper';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  estados: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class EstadosService {

  /**
   * Obtener modelo de Estado para una empresa específica
   */
  private async getModeloEstado(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IEstado>> {
    return await getEstadoModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR ESTADO
  // ============================================

  async crear(
    createEstadoDto: CreateEstadoDto,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IEstado> {
    const EstadoModel = await this.getModeloEstado(String(empresaId), dbConfig);

    const estadoData = {
      ...createEstadoDto,
      empresaId,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    };

    const estado = new EstadoModel(estadoData);
    await estado.save();

    return estado;
  }

  // ============================================
  // OBTENER TODOS CON FILTROS Y PAGINACIÓN
  // ============================================

  async findAll(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    query: Partial<GetEstadosQueryDto>
  ): Promise<FindAllResult> {
    const EstadoModel = await this.getModeloEstado(String(empresaId), dbConfig);

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
    const [estados, total] = await Promise.all([
      EstadoModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      EstadoModel.countDocuments(filter),
    ]);

    return {
      estados,
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
  ): Promise<IEstado | null> {
    const EstadoModel = await this.getModeloEstado(String(empresaId), dbConfig);

    const estado = await EstadoModel.findOne({
      _id: id,
    });

    return estado;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(
    id: string,
    updateEstadoDto: UpdateEstadoDto,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IEstado | null> {
    const EstadoModel = await this.getModeloEstado(String(empresaId), dbConfig);

    const estado = await EstadoModel.findOneAndUpdate(
      { _id: id },
      {
        ...updateEstadoDto,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true, runValidators: true }
    );

    return estado;
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const EstadoModel = await this.getModeloEstado(String(empresaId), dbConfig);

    const resultado = await EstadoModel.deleteOne({
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
    const EstadoModel = await this.getModeloEstado(String(empresaId), dbConfig);

    const resultado = await EstadoModel.deleteMany({
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
  ): Promise<IEstado | null> {
    const EstadoModel = await this.getModeloEstado(String(empresaId), dbConfig);

    const estado = await EstadoModel.findOneAndUpdate(
      { _id: id },
      {
        activo,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );

    return estado;
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const EstadoModel = await this.getModeloEstado(String(empresaId), dbConfig);

    const [totales, activos, inactivos] = await Promise.all([
      EstadoModel.countDocuments({}),
      EstadoModel.countDocuments({ activo: true }),
      EstadoModel.countDocuments({ activo: false }),
    ]);

    return {
      total: totales,
      activos,
      inactivos,
    };
  }
}

export const estadosService = new EstadosService();
