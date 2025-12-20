import { Model } from 'mongoose';
import { Maquinaria, IMaquinaria } from './Maquinaria';
import {
  CreateMaquinariaDTO,
  UpdateMaquinariaDTO,
  SearchMaquinariaDTO,
  RegistrarMantenimientoDTO,
} from './maquinaria.dto';
import { AppError } from '../../middleware/errorHandler.middleware';
import { IDatabaseConfig } from '../../types/express';
import { databaseManager } from '../../services/database-manager.service';

export class MaquinariaService {
  /**
   * Obtener modelo de Maquinaria para una empresa especifica
   */
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IMaquinaria>> {
    return await databaseManager.getModel<IMaquinaria>(
      empresaId,
      dbConfig,
      'Maquinaria',
      Maquinaria.schema
    );
  }

  /**
   * Obtener toda la maquinaria con filtros y paginacion
   */
  async findAll(empresaId: string, filters: SearchMaquinariaDTO, dbConfig: IDatabaseConfig) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);
    const {
      q,
      search,
      activo,
      tipo,
      estado,
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
        { matricula: { $regex: searchTerm, $options: 'i' } },
        { marca: { $regex: searchTerm, $options: 'i' } },
        { modelo: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Filtro de activo
    if (activo !== undefined && activo !== '') {
      query.activo = activo === 'true';
    }

    // Filtro de tipo
    if (tipo && tipo !== 'all') {
      query.tipo = tipo;
    }

    // Filtro de estado
    if (estado && estado !== 'all') {
      query.estado = estado;
    }

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginacion
    const skip = (page - 1) * limit;

    // Ejecutar query
    const [data, total] = await Promise.all([
      MaquinariaModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      MaquinariaModel.countDocuments(query),
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
   * Obtener una maquinaria por ID
   */
  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);
    const maquinaria = await MaquinariaModel.findById(id).lean();

    if (!maquinaria) {
      throw new AppError('Maquinaria no encontrada', 404);
    }

    return maquinaria;
  }

  /**
   * Crear una nueva maquinaria
   */
  async create(empresaId: string, data: CreateMaquinariaDTO, usuarioId: string, dbConfig: IDatabaseConfig) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);

    // Verificar si ya existe una maquinaria con el mismo codigo
    const existente = await MaquinariaModel.findOne({ codigo: data.codigo });

    if (existente) {
      throw new AppError('Ya existe una maquinaria con ese codigo', 400);
    }

    // Si no se especifica orden, ponerla al final
    if (data.orden === undefined || data.orden === 0) {
      const maxOrden = await MaquinariaModel.findOne().sort({ orden: -1 }).select('orden').lean();
      data.orden = (maxOrden?.orden || 0) + 1;
    }

    const maquinaria = new MaquinariaModel({
      ...data,
      creadoPor: usuarioId,
    });
    await maquinaria.save();

    return maquinaria.toObject();
  }

  /**
   * Actualizar una maquinaria
   */
  async update(id: string, empresaId: string, data: UpdateMaquinariaDTO, usuarioId: string, dbConfig: IDatabaseConfig) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);
    const maquinaria = await MaquinariaModel.findById(id);

    if (!maquinaria) {
      throw new AppError('Maquinaria no encontrada', 404);
    }

    // Si se esta cambiando el codigo, verificar que no exista
    if (data.codigo && data.codigo !== maquinaria.codigo) {
      const existente = await MaquinariaModel.findOne({
        codigo: data.codigo,
        _id: { $ne: id },
      });

      if (existente) {
        throw new AppError('Ya existe una maquinaria con ese codigo', 400);
      }
    }

    // Actualizar campos
    Object.assign(maquinaria, data, { modificadoPor: usuarioId });
    await maquinaria.save();

    return maquinaria.toObject();
  }

  /**
   * Eliminar una maquinaria
   */
  async delete(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);
    const maquinaria = await MaquinariaModel.findById(id);

    if (!maquinaria) {
      throw new AppError('Maquinaria no encontrada', 404);
    }

    // TODO: Verificar si hay partes de trabajo usando esta maquinaria

    await maquinaria.deleteOne();

    return { message: 'Maquinaria eliminada correctamente' };
  }

  /**
   * Eliminar multiples maquinarias
   */
  async deleteMany(ids: string[], empresaId: string, dbConfig: IDatabaseConfig) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);

    const result = await MaquinariaModel.deleteMany({ _id: { $in: ids } });

    return {
      message: `${result.deletedCount} maquinarias eliminadas correctamente`,
      eliminados: result.deletedCount,
    };
  }

  /**
   * Obtener maquinaria activa
   */
  async getActivas(empresaId: string, dbConfig: IDatabaseConfig) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);
    const maquinarias = await MaquinariaModel.find({ activo: true })
      .sort({ orden: 1, nombre: 1 })
      .lean();

    return maquinarias;
  }

  /**
   * Obtener maquinaria disponible (activa y estado disponible)
   */
  async getDisponibles(empresaId: string, dbConfig: IDatabaseConfig) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);
    const maquinarias = await MaquinariaModel.find({
      activo: true,
      estado: 'disponible',
    })
      .sort({ orden: 1, nombre: 1 })
      .lean();

    return maquinarias;
  }

  /**
   * Registrar mantenimiento
   */
  async registrarMantenimiento(
    id: string,
    empresaId: string,
    data: RegistrarMantenimientoDTO,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);
    const maquinaria = await MaquinariaModel.findById(id);

    if (!maquinaria) {
      throw new AppError('Maquinaria no encontrada', 404);
    }

    // Agregar al historial de mantenimientos
    if (!maquinaria.historialMantenimientos) {
      maquinaria.historialMantenimientos = [];
    }

    maquinaria.historialMantenimientos.push(data as any);

    // Actualizar proximos mantenimientos si se especifican
    if (data.proximoMantenimientoFecha) {
      maquinaria.proximoMantenimientoFecha = new Date(data.proximoMantenimientoFecha);
    }
    if (data.proximoMantenimientoKm) {
      maquinaria.proximoMantenimientoKm = data.proximoMantenimientoKm;
    }
    if (data.proximoMantenimientoHoras) {
      maquinaria.proximoMantenimientoHoras = data.proximoMantenimientoHoras;
    }

    // Actualizar km/horas si se proporcionan
    if (data.kmEnMantenimiento) {
      maquinaria.kmActuales = data.kmEnMantenimiento;
    }
    if (data.horasEnMantenimiento) {
      maquinaria.horasUso = data.horasEnMantenimiento;
    }

    maquinaria.modificadoPor = usuarioId as any;
    await maquinaria.save();

    return maquinaria.toObject();
  }

  /**
   * Cambiar estado
   */
  async cambiarEstado(
    id: string,
    empresaId: string,
    estado: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);
    const maquinaria = await MaquinariaModel.findById(id);

    if (!maquinaria) {
      throw new AppError('Maquinaria no encontrada', 404);
    }

    maquinaria.estado = estado as any;
    maquinaria.modificadoPor = usuarioId as any;
    await maquinaria.save();

    return maquinaria.toObject();
  }

  /**
   * Duplicar maquinaria
   */
  async duplicar(id: string, empresaId: string, usuarioId: string, dbConfig: IDatabaseConfig) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);
    const original = await MaquinariaModel.findById(id).lean();

    if (!original) {
      throw new AppError('Maquinaria no encontrada', 404);
    }

    // Generar nuevo codigo
    const baseCode = original.codigo.replace(/-COPIA(\d*)$/, '');
    let newCode = `${baseCode}-COPIA`;
    let counter = 1;

    while (await MaquinariaModel.findOne({ codigo: newCode })) {
      newCode = `${baseCode}-COPIA${counter}`;
      counter++;
    }

    // Obtener siguiente orden
    const maxOrden = await MaquinariaModel.findOne().sort({ orden: -1 }).select('orden').lean();
    const nuevoOrden = (maxOrden?.orden || 0) + 1;

    // Crear copia
    const {
      _id,
      createdAt,
      updatedAt,
      creadoPor,
      modificadoPor,
      historialMantenimientos,
      ...datosParaCopiar
    } = original as any;

    const copia = new MaquinariaModel({
      ...datosParaCopiar,
      codigo: newCode,
      nombre: `${original.nombre} (Copia)`,
      matricula: undefined, // La matricula debe ser unica
      orden: nuevoOrden,
      activo: false,
      estado: 'disponible',
      historialMantenimientos: [],
      creadoPor: usuarioId,
    });

    await copia.save();

    return copia.toObject();
  }

  /**
   * Buscar codigos que empiecen con un prefijo (para auto-sugerencia)
   */
  async searchCodigos(empresaId: string, prefix: string, dbConfig: IDatabaseConfig): Promise<string[]> {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);
    const maquinarias = await MaquinariaModel.find(
      { codigo: { $regex: `^${prefix}`, $options: 'i' } },
      { codigo: 1 }
    ).lean();

    return maquinarias.map(m => m.codigo);
  }

  /**
   * Obtener estadisticas
   */
  async getEstadisticas(empresaId: string, dbConfig: IDatabaseConfig) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);

    const [
      total,
      activas,
      disponibles,
      enUso,
      enMantenimiento,
      porTipo,
    ] = await Promise.all([
      MaquinariaModel.countDocuments(),
      MaquinariaModel.countDocuments({ activo: true }),
      MaquinariaModel.countDocuments({ activo: true, estado: 'disponible' }),
      MaquinariaModel.countDocuments({ activo: true, estado: 'en_uso' }),
      MaquinariaModel.countDocuments({ activo: true, estado: 'mantenimiento' }),
      MaquinariaModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$tipo', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      activas,
      disponibles,
      enUso,
      enMantenimiento,
      porTipo: porTipo.reduce((acc: any, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  }

  /**
   * Obtener alertas (mantenimiento pendiente, documentacion vencida)
   */
  async getAlertas(empresaId: string, dbConfig: IDatabaseConfig) {
    const MaquinariaModel = await this.getModelo(empresaId, dbConfig);
    const ahora = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    const [
      mantenimientoVencido,
      mantenimientoProximo,
      itvVencida,
      itvProxima,
      seguroVencido,
      seguroProximo,
    ] = await Promise.all([
      MaquinariaModel.find({
        activo: true,
        proximoMantenimientoFecha: { $lte: ahora },
      }).lean(),
      MaquinariaModel.find({
        activo: true,
        proximoMantenimientoFecha: { $gt: ahora, $lte: en30Dias },
      }).lean(),
      MaquinariaModel.find({
        activo: true,
        fechaITV: { $lte: ahora },
      }).lean(),
      MaquinariaModel.find({
        activo: true,
        fechaITV: { $gt: ahora, $lte: en30Dias },
      }).lean(),
      MaquinariaModel.find({
        activo: true,
        fechaSeguro: { $lte: ahora },
      }).lean(),
      MaquinariaModel.find({
        activo: true,
        fechaSeguro: { $gt: ahora, $lte: en30Dias },
      }).lean(),
    ]);

    return {
      mantenimientoVencido,
      mantenimientoProximo,
      itvVencida,
      itvProxima,
      seguroVencido,
      seguroProximo,
      resumen: {
        mantenimientoVencido: mantenimientoVencido.length,
        mantenimientoProximo: mantenimientoProximo.length,
        itvVencida: itvVencida.length,
        itvProxima: itvProxima.length,
        seguroVencido: seguroVencido.length,
        seguroProximo: seguroProximo.length,
      },
    };
  }
}

export const maquinariaService = new MaquinariaService();
