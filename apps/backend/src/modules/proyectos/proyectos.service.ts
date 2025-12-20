import mongoose, { Model } from 'mongoose';
import { Proyecto, IProyecto, EstadoProyecto } from './Proyecto';
import {
  CreateProyectoDTO,
  UpdateProyectoDTO,
  SearchProyectosDTO,
  AgregarHitoDTO,
  ActualizarHitoDTO,
  AgregarParticipanteDTO,
} from './proyectos.dto';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { getProyectoModel, getClienteModel, getAgenteComercialModel, getPersonalModel, getUserModel } from '@/utils/dynamic-models.helper';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  proyectos: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProyectosService {
  /**
   * Obtener modelo de Proyecto para una empresa específica
   * También registra los modelos referenciados (Cliente, AgenteComercial, Personal)
   */
  private async getModeloProyecto(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IProyecto>> {
    // Registrar primero los modelos referenciados para que populate funcione
    await Promise.all([
      getClienteModel(empresaId, dbConfig),
      getAgenteComercialModel(empresaId, dbConfig),
      getPersonalModel(empresaId, dbConfig),
      getUserModel(empresaId, dbConfig),
    ]);

    return await getProyectoModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR PROYECTO
  // ============================================

  async crear(
    createProyectoDto: CreateProyectoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    const proyectoData = {
      ...createProyectoDto,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    };

    const proyecto = new ProyectoModel(proyectoData);
    await proyecto.save();

    return proyecto;
  }

  // ============================================
  // OBTENER TODOS CON FILTROS Y PAGINACIÓN
  // ============================================

  async findAll(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    query: Partial<SearchProyectosDTO>
  ): Promise<FindAllResult> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    const {
      search,
      sortBy = 'fechaCreacion',
      sortOrder = 'desc',
      page = '1',
      limit = '25',
      clienteId,
      agenteComercialId,
      tipo,
      estado,
      estados,
      prioridad,
      responsableId,
      activo,
      fechaInicioDesde,
      fechaInicioHasta,
      fechaFinDesde,
      fechaFinHasta,
      presupuestoMin,
      presupuestoMax,
      retrasados,
      tags,
    } = query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Construir filtro
    const filter: any = {};

    // Búsqueda por texto
    if (search) {
      filter.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { codigo: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
        { observaciones: { $regex: search, $options: 'i' } },
      ];
    }

    // Filtros específicos
    if (clienteId) {
      filter.clienteId = new mongoose.Types.ObjectId(clienteId);
    }

    if (agenteComercialId) {
      filter.agenteComercialId = new mongoose.Types.ObjectId(agenteComercialId);
    }

    if (tipo) {
      filter.tipo = tipo;
    }

    if (estado) {
      filter.estado = estado;
    }

    if (estados) {
      const estadosArray = estados.split(',').map(e => e.trim());
      filter.estado = { $in: estadosArray };
    }

    if (prioridad) {
      filter.prioridad = prioridad;
    }

    if (responsableId) {
      filter.responsableId = new mongoose.Types.ObjectId(responsableId);
    }

    if (activo !== undefined && activo !== 'all') {
      filter.activo = activo === 'true';
    }

    // Filtros de fecha
    if (fechaInicioDesde || fechaInicioHasta) {
      filter.fechaInicio = {};
      if (fechaInicioDesde) {
        filter.fechaInicio.$gte = new Date(fechaInicioDesde);
      }
      if (fechaInicioHasta) {
        filter.fechaInicio.$lte = new Date(fechaInicioHasta);
      }
    }

    if (fechaFinDesde || fechaFinHasta) {
      filter.fechaFinPrevista = {};
      if (fechaFinDesde) {
        filter.fechaFinPrevista.$gte = new Date(fechaFinDesde);
      }
      if (fechaFinHasta) {
        filter.fechaFinPrevista.$lte = new Date(fechaFinHasta);
      }
    }

    // Filtros de presupuesto
    if (presupuestoMin || presupuestoMax) {
      filter.presupuestoAprobado = {};
      if (presupuestoMin) {
        filter.presupuestoAprobado.$gte = parseFloat(presupuestoMin);
      }
      if (presupuestoMax) {
        filter.presupuestoAprobado.$lte = parseFloat(presupuestoMax);
      }
    }

    // Filtro de proyectos retrasados
    if (retrasados === 'true') {
      const hoy = new Date();
      filter.fechaFinPrevista = { $lt: hoy };
      filter.estado = {
        $nin: [EstadoProyecto.COMPLETADO, EstadoProyecto.CERRADO, EstadoProyecto.CANCELADO],
      };
    }

    // Tags
    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim().toLowerCase());
      filter.tags = { $in: tagsArray };
    }

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (pageNum - 1) * limitNum;

    // Ejecutar consulta
    const [proyectos, total] = await Promise.all([
      ProyectoModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('clienteId', 'codigo nombre nombreComercial')
        .populate('agenteComercialId', 'codigo nombre apellidos')
        .populate('responsableId', 'codigo nombre apellidos')
        .lean(),
      ProyectoModel.countDocuments(filter),
    ]);

    return {
      proyectos,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async findById(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto | null> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    return ProyectoModel.findById(id)
      .populate('clienteId', 'codigo nombre nombreComercial nif email telefono direcciones')
      .populate('agenteComercialId', 'codigo nombre apellidos email telefono')
      .populate('responsableId', 'codigo nombre apellidos email')
      .populate('participantes.personalId', 'codigo nombre apellidos')
      .populate('participantes.usuarioId', 'nombre email')
      .populate('creadoPor', 'nombre email')
      .populate('modificadoPor', 'nombre email');
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(
    id: string,
    updateProyectoDto: UpdateProyectoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto | null> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    const updateData = {
      ...updateProyectoDto,
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
    };

    return ProyectoModel.findByIdAndUpdate(id, updateData, { new: true })
      .populate('clienteId', 'codigo nombre nombreComercial')
      .populate('agenteComercialId', 'codigo nombre apellidos');
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto | null> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);
    return ProyectoModel.findByIdAndDelete(id);
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(
    id: string,
    estado: EstadoProyecto,
    usuarioId: mongoose.Types.ObjectId,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    observaciones?: string
  ): Promise<IProyecto | null> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    const updateData: any = {
      estado,
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
    };

    // Si se completa, establecer fecha fin real
    if (estado === EstadoProyecto.COMPLETADO || estado === EstadoProyecto.CERRADO) {
      updateData.fechaFinReal = new Date();
    }

    if (observaciones) {
      updateData.$push = { observaciones: `[${new Date().toISOString()}] Estado cambiado a ${estado}: ${observaciones}` };
    }

    return ProyectoModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  // ============================================
  // DUPLICAR PROYECTO
  // ============================================

  async duplicar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    const proyectoOriginal = await ProyectoModel.findById(id).lean();
    if (!proyectoOriginal) {
      throw new Error('Proyecto no encontrado');
    }

    // Crear copia sin campos que deben ser únicos o regenerados
    const { _id, codigo, fechaCreacion, fechaModificacion, modificadoPor, ...datosProyecto } = proyectoOriginal;

    const nuevoProyecto = new ProyectoModel({
      ...datosProyecto,
      nombre: `${proyectoOriginal.nombre} (Copia)`,
      estado: EstadoProyecto.BORRADOR,
      fechaFinReal: undefined,
      costeReal: 0,
      horasReales: 0,
      hitos: proyectoOriginal.hitos?.map((h: any) => ({
        ...h,
        _id: new mongoose.Types.ObjectId(),
        completado: false,
        fechaReal: undefined,
      })) || [],
      documentos: [], // No copiar documentos
      presupuestosIds: [],
      pedidosIds: [],
      facturasIds: [],
      partesTrabajoIds: [],
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    });

    await nuevoProyecto.save();
    return nuevoProyecto;
  }

  // ============================================
  // GESTIÓN DE HITOS
  // ============================================

  async agregarHito(
    proyectoId: string,
    hitoData: AgregarHitoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto | null> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    return ProyectoModel.findByIdAndUpdate(
      proyectoId,
      {
        $push: {
          hitos: {
            ...hitoData,
            _id: new mongoose.Types.ObjectId(),
            completado: false,
          },
        },
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );
  }

  async actualizarHito(
    proyectoId: string,
    hitoId: string,
    hitoData: Partial<ActualizarHitoDTO>,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto | null> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    const updateFields: any = {};
    Object.entries(hitoData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'hitoId') {
        updateFields[`hitos.$.${key}`] = value;
      }
    });

    return ProyectoModel.findOneAndUpdate(
      { _id: proyectoId, 'hitos._id': hitoId },
      {
        $set: {
          ...updateFields,
          modificadoPor: usuarioId,
          fechaModificacion: new Date(),
        },
      },
      { new: true }
    );
  }

  async eliminarHito(
    proyectoId: string,
    hitoId: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto | null> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    return ProyectoModel.findByIdAndUpdate(
      proyectoId,
      {
        $pull: { hitos: { _id: hitoId } },
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );
  }

  // ============================================
  // GESTIÓN DE PARTICIPANTES
  // ============================================

  async agregarParticipante(
    proyectoId: string,
    participanteData: AgregarParticipanteDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto | null> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    return ProyectoModel.findByIdAndUpdate(
      proyectoId,
      {
        $push: {
          participantes: {
            ...participanteData,
            _id: new mongoose.Types.ObjectId(),
            horasTrabajadas: 0,
            activo: true,
          },
        },
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );
  }

  async eliminarParticipante(
    proyectoId: string,
    participanteId: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto | null> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    return ProyectoModel.findByIdAndUpdate(
      proyectoId,
      {
        $pull: { participantes: { _id: participanteId } },
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    const hoy = new Date();

    const [
      total,
      activos,
      enCurso,
      completados,
      retrasados,
      porEstado,
      porTipo,
      totales,
    ] = await Promise.all([
      ProyectoModel.countDocuments(),
      ProyectoModel.countDocuments({ activo: true }),
      ProyectoModel.countDocuments({ estado: EstadoProyecto.EN_CURSO }),
      ProyectoModel.countDocuments({ estado: { $in: [EstadoProyecto.COMPLETADO, EstadoProyecto.CERRADO] } }),
      ProyectoModel.countDocuments({
        estado: { $nin: [EstadoProyecto.COMPLETADO, EstadoProyecto.CERRADO, EstadoProyecto.CANCELADO] },
        fechaFinPrevista: { $lt: hoy },
      }),
      ProyectoModel.aggregate([
        { $group: { _id: '$estado', count: { $sum: 1 } } },
      ]),
      ProyectoModel.aggregate([
        { $group: { _id: '$tipo', count: { $sum: 1 } } },
      ]),
      ProyectoModel.aggregate([
        {
          $group: {
            _id: null,
            presupuestoTotal: { $sum: '$presupuestoAprobado' },
            costeTotal: { $sum: '$costeReal' },
            horasEstimadas: { $sum: '$horasEstimadas' },
            horasReales: { $sum: '$horasReales' },
          },
        },
      ]),
    ]);

    const estadisticasPorEstado: Record<string, number> = {};
    porEstado.forEach((item: any) => {
      estadisticasPorEstado[item._id] = item.count;
    });

    const estadisticasPorTipo: Record<string, number> = {};
    porTipo.forEach((item: any) => {
      estadisticasPorTipo[item._id] = item.count;
    });

    return {
      total,
      activos,
      enCurso,
      completados,
      retrasados,
      porEstado: estadisticasPorEstado,
      porTipo: estadisticasPorTipo,
      presupuestoTotal: totales[0]?.presupuestoTotal || 0,
      costeTotal: totales[0]?.costeTotal || 0,
      horasEstimadas: totales[0]?.horasEstimadas || 0,
      horasReales: totales[0]?.horasReales || 0,
      margenGlobal: totales[0]?.presupuestoTotal
        ? Math.round(((totales[0].presupuestoTotal - (totales[0]?.costeTotal || 0)) / totales[0].presupuestoTotal) * 100)
        : 0,
    };
  }

  // ============================================
  // SUGERIR CÓDIGO
  // ============================================

  async sugerirCodigo(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<string> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);
    return (ProyectoModel as any).generarCodigo();
  }

  // ============================================
  // BUSCAR CÓDIGOS EXISTENTES (PARA AUTO-SUGERENCIA)
  // ============================================

  async searchCodigos(
    empresaId: mongoose.Types.ObjectId,
    prefix: string,
    dbConfig: IDatabaseConfig
  ): Promise<string[]> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    const proyectos = await ProyectoModel.find(
      {
        codigo: { $regex: `^${prefix}`, $options: 'i' }
      },
      { codigo: 1 }
    ).lean();

    return proyectos.map(p => p.codigo).filter(Boolean) as string[];
  }

  // ============================================
  // ELIMINAR EN LOTE
  // ============================================

  async eliminarVarios(
    ids: string[],
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<number> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    const result = await ProyectoModel.deleteMany({
      _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) },
    });

    return result.deletedCount || 0;
  }

  // ============================================
  // OBTENER PROYECTOS POR CLIENTE
  // ============================================

  async findByClienteId(
    clienteId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProyecto[]> {
    const ProyectoModel = await this.getModeloProyecto(String(empresaId), dbConfig);

    return ProyectoModel.find({
      clienteId: new mongoose.Types.ObjectId(clienteId),
      activo: true,
    })
      .sort({ fechaCreacion: -1 })
      .select('codigo nombre estado tipo fechaInicio fechaFinPrevista')
      .lean();
  }
}

export const proyectosService = new ProyectosService();
