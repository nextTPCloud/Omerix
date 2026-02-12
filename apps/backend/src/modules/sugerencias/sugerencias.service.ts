import { Model, Types } from 'mongoose';
import { ISugerencia, TipoSugerencia, MomentoSugerencia } from './Sugerencia';
import { CreateSugerenciaDTO, UpdateSugerenciaDTO, FiltrosSugerenciasDTO } from './sugerencias.dto';
import { IDatabaseConfig } from '../../types/express';
import { getSugerenciaModel } from '../../utils/dynamic-models.helper';

export class SugerenciasService {
  private async getModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<ISugerencia>> {
    return await getSugerenciaModel(empresaId, dbConfig);
  }

  // ============================================
  // CRUD
  // ============================================

  async getAll(empresaId: string, dbConfig: IDatabaseConfig, filtros: FiltrosSugerenciasDTO = {}) {
    const SugerenciaModel = await this.getModelo(empresaId, dbConfig);
    const query: any = {};

    if (filtros.tipo) query.tipo = filtros.tipo;
    if (filtros.momento) query.momento = filtros.momento;
    if (filtros.activo !== undefined) query.activo = filtros.activo;
    if (filtros.productoId) query.productoBaseId = new Types.ObjectId(filtros.productoId);
    if (filtros.familiaId) query.familiaBaseId = new Types.ObjectId(filtros.familiaId);

    if (filtros.busqueda) {
      const regex = new RegExp(filtros.busqueda, 'i');
      query.$or = [{ nombre: regex }, { descripcion: regex }];
    }

    const page = filtros.page || 1;
    const limit = filtros.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      SugerenciaModel.find(query)
        .populate('productoBaseId', 'nombre codigo imagen')
        .populate('familiaBaseId', 'nombre')
        .populate('productosSugeridos.productoId', 'nombre codigo precioVenta imagen')
        .sort({ prioridad: -1, nombre: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SugerenciaModel.countDocuments(query),
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

  async getById(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const SugerenciaModel = await this.getModelo(empresaId, dbConfig);
    const sugerencia = await SugerenciaModel.findById(id)
      .populate('productoBaseId', 'nombre codigo imagen')
      .populate('familiaBaseId', 'nombre')
      .populate('productosSugeridos.productoId', 'nombre codigo precioVenta imagen')
      .lean();

    if (!sugerencia) {
      throw new Error('Sugerencia no encontrada');
    }

    return sugerencia;
  }

  async create(empresaId: string, dbConfig: IDatabaseConfig, data: CreateSugerenciaDTO) {
    const SugerenciaModel = await this.getModelo(empresaId, dbConfig);

    const sugerencia = new SugerenciaModel({
      ...data,
      productoBaseId: data.productoBaseId ? new Types.ObjectId(data.productoBaseId) : undefined,
      familiaBaseId: data.familiaBaseId ? new Types.ObjectId(data.familiaBaseId) : undefined,
      productosSugeridos: data.productosSugeridos.map(ps => ({
        ...ps,
        productoId: new Types.ObjectId(ps.productoId),
      })),
    });

    await sugerencia.save();
    return this.getById(empresaId, dbConfig, sugerencia._id.toString());
  }

  async update(empresaId: string, dbConfig: IDatabaseConfig, id: string, data: UpdateSugerenciaDTO) {
    const SugerenciaModel = await this.getModelo(empresaId, dbConfig);
    const sugerencia = await SugerenciaModel.findById(id);
    if (!sugerencia) {
      throw new Error('Sugerencia no encontrada');
    }

    const updateData: any = { ...data };
    if (data.productoBaseId) updateData.productoBaseId = new Types.ObjectId(data.productoBaseId);
    if (data.familiaBaseId) updateData.familiaBaseId = new Types.ObjectId(data.familiaBaseId);
    if (data.productosSugeridos) {
      updateData.productosSugeridos = data.productosSugeridos.map(ps => ({
        ...ps,
        productoId: new Types.ObjectId(ps.productoId),
      }));
    }

    await SugerenciaModel.findByIdAndUpdate(id, updateData);
    return this.getById(empresaId, dbConfig, id);
  }

  async delete(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const SugerenciaModel = await this.getModelo(empresaId, dbConfig);
    const sugerencia = await SugerenciaModel.findById(id);
    if (!sugerencia) {
      throw new Error('Sugerencia no encontrada');
    }

    await SugerenciaModel.findByIdAndDelete(id);
    return { success: true };
  }

  // ============================================
  // LÓGICA DE SUGERENCIAS
  // ============================================

  /**
   * Obtener sugerencias para un producto específico
   */
  async getSugerenciasParaProducto(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    productoId: string,
    familiaId?: string
  ) {
    const SugerenciaModel = await this.getModelo(empresaId, dbConfig);

    const now = new Date();
    const hora = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const diaSemana = now.getDay();

    const query: any = {
      activo: true,
      $or: [
        { productoBaseId: new Types.ObjectId(productoId) },
        ...(familiaId ? [{ familiaBaseId: new Types.ObjectId(familiaId) }] : []),
      ],
    };

    const sugerencias = await SugerenciaModel.find(query)
      .populate('productosSugeridos.productoId', 'nombre codigo precioVenta imagen')
      .sort({ prioridad: -1 })
      .limit(5)
      .lean();

    // Filtrar por horario si aplica
    const sugerenciasFiltradas = sugerencias.filter(s => {
      if (!s.condicionHoraria || !s.condicionHoraria.activo) return true;

      const { horaInicio, horaFin, diasSemana } = s.condicionHoraria;

      // Verificar día
      if (diasSemana && diasSemana.length > 0 && !diasSemana.includes(diaSemana)) {
        return false;
      }

      // Verificar hora
      if (hora < horaInicio || hora > horaFin) {
        return false;
      }

      return true;
    });

    // Incrementar contador de vistas
    if (sugerenciasFiltradas.length > 0) {
      await SugerenciaModel.updateMany(
        { _id: { $in: sugerenciasFiltradas.map(s => s._id) } },
        { $inc: { vecesVista: 1 } }
      );
    }

    return sugerenciasFiltradas;
  }

  /**
   * Obtener sugerencias al finalizar pedido
   */
  async getSugerenciasFinalizacion(empresaId: string, dbConfig: IDatabaseConfig) {
    const SugerenciaModel = await this.getModelo(empresaId, dbConfig);

    const sugerencias = await SugerenciaModel.find({
      activo: true,
      momento: MomentoSugerencia.AL_FINALIZAR,
    })
      .populate('productosSugeridos.productoId', 'nombre codigo precioVenta imagen')
      .sort({ prioridad: -1 })
      .limit(3)
      .lean();

    // Incrementar contador de vistas
    if (sugerencias.length > 0) {
      await SugerenciaModel.updateMany(
        { _id: { $in: sugerencias.map(s => s._id) } },
        { $inc: { vecesVista: 1 } }
      );
    }

    return sugerencias;
  }

  /**
   * Registrar aceptación de sugerencia
   */
  async registrarAceptacion(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const SugerenciaModel = await this.getModelo(empresaId, dbConfig);
    await SugerenciaModel.findByIdAndUpdate(id, { $inc: { vecesAceptada: 1 } });
    return { success: true };
  }

  /**
   * Obtener estadísticas de sugerencias
   */
  async getEstadisticas(empresaId: string, dbConfig: IDatabaseConfig) {
    const SugerenciaModel = await this.getModelo(empresaId, dbConfig);

    const stats = await SugerenciaModel.aggregate([
      { $match: { activo: true } },
      {
        $group: {
          _id: '$tipo',
          total: { $sum: 1 },
          vecesVista: { $sum: '$vecesVista' },
          vecesAceptada: { $sum: '$vecesAceptada' },
        },
      },
    ]);

    const totales = await SugerenciaModel.aggregate([
      { $match: { activo: true } },
      {
        $group: {
          _id: null,
          totalSugerencias: { $sum: 1 },
          totalVistas: { $sum: '$vecesVista' },
          totalAceptadas: { $sum: '$vecesAceptada' },
        },
      },
    ]);

    return {
      porTipo: stats,
      totales: totales[0] || { totalSugerencias: 0, totalVistas: 0, totalAceptadas: 0 },
      tasaAceptacionGlobal: totales[0]
        ? Math.round((totales[0].totalAceptadas / totales[0].totalVistas) * 100) || 0
        : 0,
    };
  }
}

export const sugerenciasService = new SugerenciasService();
