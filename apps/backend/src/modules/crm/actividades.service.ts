import mongoose, { Model } from 'mongoose';
import { IActividad, TipoActividad, ResultadoActividad } from './Actividad';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { getActividadCRMModel } from '@/utils/dynamic-models.helper';
import {
  CreateActividadDTO,
  UpdateActividadDTO,
  CompletarActividadDTO,
  FiltroActividadesDTO,
} from './crm.dto';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  actividades: IActividad[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface EstadisticasActividades {
  total: number;
  completadas: number;
  pendientes: number;
  porTipo: { [key: string]: number };
  proximasHoy: number;
  vencidas: number;
}

export class ActividadesService {

  /**
   * Obtener modelo de Actividad para una empresa específica
   */
  private async getModeloActividad(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IActividad>> {
    return await getActividadCRMModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR ACTIVIDAD
  // ============================================

  async crear(
    data: CreateActividadDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IActividad> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    // Validar que al menos una relación esté presente
    if (!data.leadId && !data.oportunidadId && !data.clienteId) {
      throw new Error('Debe especificar al menos un lead, oportunidad o cliente');
    }

    const actividadData = {
      ...data,
      empresaId,
      creadoPor: usuarioId,
      completada: false,
      leadId: data.leadId ? new mongoose.Types.ObjectId(data.leadId) : undefined,
      oportunidadId: data.oportunidadId ? new mongoose.Types.ObjectId(data.oportunidadId) : undefined,
      clienteId: data.clienteId ? new mongoose.Types.ObjectId(data.clienteId) : undefined,
      asignadoA: data.asignadoA ? new mongoose.Types.ObjectId(data.asignadoA) : usuarioId,
      fechaProgramada: data.fechaProgramada ? new Date(data.fechaProgramada) : undefined,
      recordatorio: data.recordatorio ? new Date(data.recordatorio) : undefined,
    };

    const actividad = new ActividadModel(actividadData);
    await actividad.save();

    return actividad;
  }

  // ============================================
  // OBTENER TODAS CON FILTROS Y PAGINACIÓN
  // ============================================

  async obtenerTodas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    filtros: Partial<FiltroActividadesDTO>
  ): Promise<FindAllResult> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    const {
      leadId,
      oportunidadId,
      clienteId,
      tipo,
      completada,
      asignadoA,
      fechaDesde,
      fechaHasta,
      page = 1,
      limit = 50,
      sortBy = 'fechaProgramada',
      sortOrder = 'asc',
    } = filtros;

    const filter: any = {};

    if (leadId) filter.leadId = new mongoose.Types.ObjectId(leadId);
    if (oportunidadId) filter.oportunidadId = new mongoose.Types.ObjectId(oportunidadId);
    if (clienteId) filter.clienteId = new mongoose.Types.ObjectId(clienteId);
    if (tipo) filter.tipo = tipo;
    if (completada !== undefined) filter.completada = completada;
    if (asignadoA) filter.asignadoA = new mongoose.Types.ObjectId(asignadoA);

    if (fechaDesde || fechaHasta) {
      filter.fechaProgramada = {};
      if (fechaDesde) filter.fechaProgramada.$gte = new Date(fechaDesde);
      if (fechaHasta) filter.fechaProgramada.$lte = new Date(fechaHasta);
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [actividades, total] = await Promise.all([
      ActividadModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('leadId', 'nombre empresa')
        .populate('oportunidadId', 'nombre valorEstimado')
        .populate('clienteId', 'nombre')
        .populate('asignadoA', 'nombre email')
        .lean(),
      ActividadModel.countDocuments(filter),
    ]);

    return {
      actividades: actividades as IActividad[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // OBTENER POR ENTIDAD
  // ============================================

  async obtenerPorEntidad(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    tipoEntidad: 'lead' | 'oportunidad' | 'cliente',
    entidadId: string
  ): Promise<IActividad[]> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    const filter: any = {};
    switch (tipoEntidad) {
      case 'lead':
        filter.leadId = new mongoose.Types.ObjectId(entidadId);
        break;
      case 'oportunidad':
        filter.oportunidadId = new mongoose.Types.ObjectId(entidadId);
        break;
      case 'cliente':
        filter.clienteId = new mongoose.Types.ObjectId(entidadId);
        break;
    }

    const actividades = await ActividadModel.find(filter)
      .sort({ fechaProgramada: -1 })
      .populate('asignadoA', 'nombre email')
      .lean();

    return actividades as IActividad[];
  }

  // ============================================
  // OBTENER PENDIENTES
  // ============================================

  async obtenerPendientes(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    usuarioId?: string
  ): Promise<IActividad[]> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    const filter: any = {
      completada: false,
    };

    if (usuarioId) {
      filter.asignadoA = new mongoose.Types.ObjectId(usuarioId);
    }

    const actividades = await ActividadModel.find(filter)
      .sort({ fechaProgramada: 1 })
      .limit(100)
      .populate('leadId', 'nombre empresa')
      .populate('oportunidadId', 'nombre')
      .populate('clienteId', 'nombre')
      .populate('asignadoA', 'nombre')
      .lean();

    return actividades as IActividad[];
  }

  // ============================================
  // OBTENER PRÓXIMAS (HOY Y MAÑANA)
  // ============================================

  async obtenerProximas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    usuarioId?: string,
    dias: number = 2
  ): Promise<IActividad[]> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);
    const limite = new Date(ahora);
    limite.setDate(limite.getDate() + dias);
    limite.setHours(23, 59, 59, 999);

    const filter: any = {
      completada: false,
      fechaProgramada: {
        $gte: ahora,
        $lte: limite,
      },
    };

    if (usuarioId) {
      filter.asignadoA = new mongoose.Types.ObjectId(usuarioId);
    }

    const actividades = await ActividadModel.find(filter)
      .sort({ fechaProgramada: 1 })
      .populate('leadId', 'nombre empresa')
      .populate('oportunidadId', 'nombre')
      .populate('clienteId', 'nombre')
      .lean();

    return actividades as IActividad[];
  }

  // ============================================
  // OBTENER VENCIDAS
  // ============================================

  async obtenerVencidas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    usuarioId?: string
  ): Promise<IActividad[]> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    const ahora = new Date();

    const filter: any = {
      completada: false,
      fechaProgramada: { $lt: ahora },
    };

    if (usuarioId) {
      filter.asignadoA = new mongoose.Types.ObjectId(usuarioId);
    }

    const actividades = await ActividadModel.find(filter)
      .sort({ fechaProgramada: 1 })
      .populate('leadId', 'nombre empresa')
      .populate('oportunidadId', 'nombre')
      .populate('clienteId', 'nombre')
      .lean();

    return actividades as IActividad[];
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async obtenerPorId(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IActividad | null> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    const actividad = await ActividadModel.findOne({ _id: id })
      .populate('leadId', 'nombre empresa email')
      .populate('oportunidadId', 'nombre valorEstimado')
      .populate('clienteId', 'nombre email')
      .populate('asignadoA', 'nombre email')
      .populate('creadoPor', 'nombre');

    return actividad;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(
    id: string,
    data: UpdateActividadDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IActividad | null> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    const updateData: any = { ...data };

    if (data.leadId) updateData.leadId = new mongoose.Types.ObjectId(data.leadId);
    if (data.oportunidadId) updateData.oportunidadId = new mongoose.Types.ObjectId(data.oportunidadId);
    if (data.clienteId) updateData.clienteId = new mongoose.Types.ObjectId(data.clienteId);
    if (data.asignadoA) updateData.asignadoA = new mongoose.Types.ObjectId(data.asignadoA);
    if (data.fechaProgramada) updateData.fechaProgramada = new Date(data.fechaProgramada);
    if (data.recordatorio) updateData.recordatorio = new Date(data.recordatorio);

    const actividad = await ActividadModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('asignadoA', 'nombre email');

    return actividad;
  }

  // ============================================
  // COMPLETAR ACTIVIDAD
  // ============================================

  async completar(
    id: string,
    data: CompletarActividadDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IActividad | null> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    const updateData = {
      completada: true,
      fechaRealizacion: data.fechaRealizacion ? new Date(data.fechaRealizacion) : new Date(),
      resultado: data.resultado || ResultadoActividad.COMPLETADA,
      notasResultado: data.notasResultado,
    };

    const actividad = await ActividadModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true }
    );

    return actividad;
  }

  // ============================================
  // DESCOMPLETAR ACTIVIDAD
  // ============================================

  async descompletar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IActividad | null> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    const actividad = await ActividadModel.findOneAndUpdate(
      { _id: id },
      {
        completada: false,
        fechaRealizacion: null,
        resultado: null,
        notasResultado: null,
      },
      { new: true }
    );

    return actividad;
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    const resultado = await ActividadModel.deleteOne({ _id: id });

    return resultado.deletedCount > 0;
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    usuarioId?: string
  ): Promise<EstadisticasActividades> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    const baseFilter: any = {};
    if (usuarioId) {
      baseFilter.asignadoA = new mongoose.Types.ObjectId(usuarioId);
    }

    const ahora = new Date();
    const inicioDia = new Date(ahora);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(ahora);
    finDia.setHours(23, 59, 59, 999);

    const [
      total,
      completadas,
      porTipo,
      proximasHoy,
      vencidas,
    ] = await Promise.all([
      ActividadModel.countDocuments(baseFilter),
      ActividadModel.countDocuments({ ...baseFilter, completada: true }),
      ActividadModel.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$tipo', count: { $sum: 1 } } },
      ]),
      ActividadModel.countDocuments({
        ...baseFilter,
        completada: false,
        fechaProgramada: { $gte: inicioDia, $lte: finDia },
      }),
      ActividadModel.countDocuments({
        ...baseFilter,
        completada: false,
        fechaProgramada: { $lt: inicioDia },
      }),
    ]);

    const tipoMap: { [key: string]: number } = {};
    porTipo.forEach((t: any) => { tipoMap[t._id] = t.count; });

    return {
      total,
      completadas,
      pendientes: total - completadas,
      porTipo: tipoMap,
      proximasHoy,
      vencidas,
    };
  }

  // ============================================
  // OBTENER RECORDATORIOS PENDIENTES
  // ============================================

  async obtenerRecordatoriosPendientes(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IActividad[]> {
    const ActividadModel = await this.getModeloActividad(String(empresaId), dbConfig);

    const ahora = new Date();

    const actividades = await ActividadModel.find({
      completada: false,
      recordatorio: { $lte: ahora },
    })
      .sort({ recordatorio: 1 })
      .populate('asignadoA', 'nombre email')
      .populate('leadId', 'nombre')
      .populate('oportunidadId', 'nombre')
      .populate('clienteId', 'nombre')
      .lean();

    return actividades as IActividad[];
  }
}

export const actividadesService = new ActividadesService();
