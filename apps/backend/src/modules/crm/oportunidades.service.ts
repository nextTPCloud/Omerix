import mongoose, { Model } from 'mongoose';
import { IOportunidad, EstadoOportunidad } from './Oportunidad';
import { IEtapaPipeline } from './EtapaPipeline';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import {
  getOportunidadModel,
  getEtapaPipelineModel,
  getClienteModel,
  getLeadModel,
} from '@/utils/dynamic-models.helper';
import {
  CreateOportunidadDTO,
  UpdateOportunidadDTO,
  CambiarEtapaOportunidadDTO,
  CerrarOportunidadDTO,
  FiltroOportunidadesDTO,
} from './crm.dto';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  oportunidades: IOportunidad[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface OportunidadPorEtapa {
  etapa: IEtapaPipeline;
  oportunidades: IOportunidad[];
  total: number;
  valorTotal: number;
}

interface EstadisticasOportunidades {
  total: number;
  abiertas: number;
  ganadas: number;
  perdidas: number;
  valorTotalAbierto: number;
  valorPonderadoTotal: number;
  tasaConversion: number;
  valorPromedioGanado: number;
}

interface ForecastData {
  mes: string;
  valorEstimado: number;
  valorPonderado: number;
  cantidad: number;
}

export class OportunidadesService {

  /**
   * Obtener modelo de Oportunidad para una empresa específica
   */
  private async getModeloOportunidad(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IOportunidad>> {
    return await getOportunidadModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR OPORTUNIDAD
  // ============================================

  async crear(
    data: CreateOportunidadDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IOportunidad> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);

    // Obtener probabilidad de la etapa si no se especifica
    let probabilidad = data.probabilidad;
    if (probabilidad === undefined || probabilidad === 0) {
      const EtapaModel = await getEtapaPipelineModel(String(empresaId), dbConfig);
      const etapa = await EtapaModel.findById(data.etapaId);
      if (etapa) {
        probabilidad = etapa.probabilidadDefecto;
      }
    }

    const oportunidadData = {
      ...data,
      probabilidad,
      empresaId,
      creadoPor: usuarioId,
      clienteId: data.clienteId ? new mongoose.Types.ObjectId(data.clienteId) : undefined,
      leadId: data.leadId ? new mongoose.Types.ObjectId(data.leadId) : undefined,
      etapaId: new mongoose.Types.ObjectId(data.etapaId),
      asignadoA: data.asignadoA ? new mongoose.Types.ObjectId(data.asignadoA) : undefined,
      fechaCierreEstimada: data.fechaCierreEstimada ? new Date(data.fechaCierreEstimada) : undefined,
    };

    const oportunidad = new OportunidadModel(oportunidadData);
    await oportunidad.save();

    return oportunidad;
  }

  // ============================================
  // OBTENER TODAS CON FILTROS Y PAGINACIÓN
  // ============================================

  async obtenerTodas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    filtros: Partial<FiltroOportunidadesDTO>
  ): Promise<FindAllResult> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);

    const {
      busqueda,
      estado,
      etapaId,
      clienteId,
      asignadoA,
      fechaDesde,
      fechaHasta,
      valorMinimo,
      valorMaximo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filtros;

    // Construir filtro
    const filter: any = {};

    if (busqueda) {
      filter.$or = [
        { nombre: { $regex: busqueda, $options: 'i' } },
        { descripcion: { $regex: busqueda, $options: 'i' } },
      ];
    }

    if (estado) filter.estado = estado;
    if (etapaId) filter.etapaId = new mongoose.Types.ObjectId(etapaId);
    if (clienteId) filter.clienteId = new mongoose.Types.ObjectId(clienteId);
    if (asignadoA) filter.asignadoA = new mongoose.Types.ObjectId(asignadoA);

    if (fechaDesde || fechaHasta) {
      filter.fechaCierreEstimada = {};
      if (fechaDesde) filter.fechaCierreEstimada.$gte = new Date(fechaDesde);
      if (fechaHasta) filter.fechaCierreEstimada.$lte = new Date(fechaHasta);
    }

    if (valorMinimo !== undefined) {
      filter.valorEstimado = { ...filter.valorEstimado, $gte: valorMinimo };
    }
    if (valorMaximo !== undefined) {
      filter.valorEstimado = { ...filter.valorEstimado, $lte: valorMaximo };
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [oportunidades, total] = await Promise.all([
      OportunidadModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('clienteId', 'nombre nif')
        .populate('leadId', 'nombre empresa')
        .populate('etapaId', 'nombre color')
        .populate('asignadoA', 'nombre email')
        .lean(),
      OportunidadModel.countDocuments(filter),
    ]);

    return {
      oportunidades: oportunidades as IOportunidad[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // OBTENER POR ETAPA (PARA KANBAN)
  // ============================================

  async obtenerPorEtapa(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    filtros?: { asignadoA?: string; clienteId?: string }
  ): Promise<OportunidadPorEtapa[]> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);
    const EtapaModel = await getEtapaPipelineModel(String(empresaId), dbConfig);

    // Obtener etapas activas ordenadas
    const etapas = await EtapaModel.find({ activo: true }).sort({ orden: 1 }).lean();

    // Construir filtro base (solo oportunidades abiertas)
    const baseFilter: any = { estado: EstadoOportunidad.ABIERTA };
    if (filtros?.asignadoA) {
      baseFilter.asignadoA = new mongoose.Types.ObjectId(filtros.asignadoA);
    }
    if (filtros?.clienteId) {
      baseFilter.clienteId = new mongoose.Types.ObjectId(filtros.clienteId);
    }

    // Obtener oportunidades agrupadas por etapa
    const resultado: OportunidadPorEtapa[] = [];

    for (const etapa of etapas) {
      const filter = { ...baseFilter, etapaId: etapa._id };

      const [oportunidades, agregado] = await Promise.all([
        OportunidadModel.find(filter)
          .sort({ valorEstimado: -1 })
          .populate('clienteId', 'nombre')
          .populate('asignadoA', 'nombre')
          .lean(),
        OportunidadModel.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              valorTotal: { $sum: '$valorEstimado' },
            },
          },
        ]),
      ]);

      resultado.push({
        etapa: etapa as IEtapaPipeline,
        oportunidades: oportunidades as IOportunidad[],
        total: agregado[0]?.total || 0,
        valorTotal: agregado[0]?.valorTotal || 0,
      });
    }

    return resultado;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async obtenerPorId(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IOportunidad | null> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);

    const oportunidad = await OportunidadModel.findOne({ _id: id })
      .populate('clienteId', 'nombre nif email telefono')
      .populate('leadId', 'nombre empresa email')
      .populate('etapaId', 'nombre color probabilidadDefecto')
      .populate('asignadoA', 'nombre email')
      .populate('creadoPor', 'nombre email');

    return oportunidad;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(
    id: string,
    data: UpdateOportunidadDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IOportunidad | null> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);

    const updateData: any = {
      ...data,
      actualizadoPor: usuarioId,
    };

    if (data.clienteId) updateData.clienteId = new mongoose.Types.ObjectId(data.clienteId);
    if (data.leadId) updateData.leadId = new mongoose.Types.ObjectId(data.leadId);
    if (data.etapaId) updateData.etapaId = new mongoose.Types.ObjectId(data.etapaId);
    if (data.asignadoA) updateData.asignadoA = new mongoose.Types.ObjectId(data.asignadoA);
    if (data.fechaCierreEstimada) updateData.fechaCierreEstimada = new Date(data.fechaCierreEstimada);

    const oportunidad = await OportunidadModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('clienteId', 'nombre')
      .populate('etapaId', 'nombre color');

    return oportunidad;
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);

    const resultado = await OportunidadModel.deleteOne({ _id: id });

    return resultado.deletedCount > 0;
  }

  // ============================================
  // CAMBIAR ETAPA
  // ============================================

  async cambiarEtapa(
    id: string,
    data: CambiarEtapaOportunidadDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IOportunidad | null> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);
    const EtapaModel = await getEtapaPipelineModel(String(empresaId), dbConfig);

    // Obtener la nueva etapa
    const etapa = await EtapaModel.findById(data.etapaId);
    if (!etapa) {
      throw new Error('Etapa no encontrada');
    }

    // Determinar probabilidad
    const probabilidad = data.probabilidad !== undefined
      ? data.probabilidad
      : etapa.probabilidadDefecto;

    const updateData: any = {
      etapaId: new mongoose.Types.ObjectId(data.etapaId),
      probabilidad,
      actualizadoPor: usuarioId,
    };

    // Si es etapa final con cierre positivo, marcar como ganada
    if (etapa.esFinal && etapa.esCierrePositivo) {
      updateData.estado = EstadoOportunidad.GANADA;
      updateData.fechaCierreReal = new Date();
    }
    // Si es etapa final sin cierre positivo, marcar como perdida
    else if (etapa.esFinal && !etapa.esCierrePositivo) {
      updateData.estado = EstadoOportunidad.PERDIDA;
      updateData.fechaCierreReal = new Date();
    }

    const oportunidad = await OportunidadModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true }
    )
      .populate('etapaId', 'nombre color')
      .populate('clienteId', 'nombre');

    return oportunidad;
  }

  // ============================================
  // CERRAR OPORTUNIDAD
  // ============================================

  async cerrar(
    id: string,
    data: CerrarOportunidadDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IOportunidad | null> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);

    const estado = data.estado === 'ganada'
      ? EstadoOportunidad.GANADA
      : EstadoOportunidad.PERDIDA;

    const updateData: any = {
      estado,
      fechaCierreReal: data.fechaCierreReal ? new Date(data.fechaCierreReal) : new Date(),
      actualizadoPor: usuarioId,
    };

    if (data.estado === 'perdida') {
      if (data.motivoPerdida) updateData.motivoPerdida = data.motivoPerdida;
      if (data.competidor) updateData.competidor = data.competidor;
    }

    const oportunidad = await OportunidadModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true }
    )
      .populate('etapaId', 'nombre color')
      .populate('clienteId', 'nombre');

    return oportunidad;
  }

  // ============================================
  // REABRIR OPORTUNIDAD
  // ============================================

  async reabrir(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IOportunidad | null> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);

    const oportunidad = await OportunidadModel.findOneAndUpdate(
      { _id: id },
      {
        estado: EstadoOportunidad.ABIERTA,
        fechaCierreReal: null,
        motivoPerdida: null,
        competidor: null,
        actualizadoPor: usuarioId,
      },
      { new: true }
    );

    return oportunidad;
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<EstadisticasOportunidades> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);

    const [
      total,
      porEstado,
      valorAbierto,
      valorPonderado,
      valorGanado,
    ] = await Promise.all([
      OportunidadModel.countDocuments({}),
      OportunidadModel.aggregate([
        { $group: { _id: '$estado', count: { $sum: 1 } } },
      ]),
      OportunidadModel.aggregate([
        { $match: { estado: EstadoOportunidad.ABIERTA } },
        { $group: { _id: null, total: { $sum: '$valorEstimado' } } },
      ]),
      OportunidadModel.aggregate([
        { $match: { estado: EstadoOportunidad.ABIERTA } },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$valorEstimado', { $divide: ['$probabilidad', 100] }] } },
          },
        },
      ]),
      OportunidadModel.aggregate([
        { $match: { estado: EstadoOportunidad.GANADA } },
        {
          $group: {
            _id: null,
            total: { $sum: '$valorEstimado' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const estadoMap: { [key: string]: number } = {};
    porEstado.forEach((e: any) => { estadoMap[e._id] = e.count; });

    const abiertas = estadoMap[EstadoOportunidad.ABIERTA] || 0;
    const ganadas = estadoMap[EstadoOportunidad.GANADA] || 0;
    const perdidas = estadoMap[EstadoOportunidad.PERDIDA] || 0;
    const cerradas = ganadas + perdidas;
    const tasaConversion = cerradas > 0 ? (ganadas / cerradas) * 100 : 0;

    return {
      total,
      abiertas,
      ganadas,
      perdidas,
      valorTotalAbierto: valorAbierto[0]?.total || 0,
      valorPonderadoTotal: valorPonderado[0]?.total || 0,
      tasaConversion: Math.round(tasaConversion * 100) / 100,
      valorPromedioGanado: ganadas > 0 ? (valorGanado[0]?.total || 0) / ganadas : 0,
    };
  }

  // ============================================
  // CALCULAR FORECAST
  // ============================================

  async calcularForecast(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    meses: number = 6
  ): Promise<ForecastData[]> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);

    const ahora = new Date();
    const fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() + meses, 0);

    const forecast = await OportunidadModel.aggregate([
      {
        $match: {
          estado: EstadoOportunidad.ABIERTA,
          fechaCierreEstimada: { $gte: ahora, $lte: fechaFin },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$fechaCierreEstimada' },
            month: { $month: '$fechaCierreEstimada' },
          },
          valorEstimado: { $sum: '$valorEstimado' },
          valorPonderado: {
            $sum: { $multiply: ['$valorEstimado', { $divide: ['$probabilidad', 100] }] },
          },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return forecast.map((f: any) => ({
      mes: `${f._id.year}-${String(f._id.month).padStart(2, '0')}`,
      valorEstimado: f.valorEstimado,
      valorPonderado: Math.round(f.valorPonderado * 100) / 100,
      cantidad: f.cantidad,
    }));
  }

  // ============================================
  // OBTENER OPORTUNIDADES POR CLIENTE
  // ============================================

  async obtenerPorCliente(
    clienteId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IOportunidad[]> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);

    const oportunidades = await OportunidadModel.find({
      clienteId: new mongoose.Types.ObjectId(clienteId),
    })
      .sort({ createdAt: -1 })
      .populate('etapaId', 'nombre color')
      .lean();

    return oportunidades as IOportunidad[];
  }

  // ============================================
  // OBTENER OPORTUNIDADES POR LEAD
  // ============================================

  async obtenerPorLead(
    leadId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IOportunidad[]> {
    const OportunidadModel = await this.getModeloOportunidad(String(empresaId), dbConfig);

    const oportunidades = await OportunidadModel.find({
      leadId: new mongoose.Types.ObjectId(leadId),
    })
      .sort({ createdAt: -1 })
      .populate('etapaId', 'nombre color')
      .lean();

    return oportunidades as IOportunidad[];
  }
}

export const oportunidadesService = new OportunidadesService();
