import mongoose, { Model } from 'mongoose';
import { ILead, EstadoLead } from './Lead';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import {
  getLeadModel,
  getClienteModel,
  getOportunidadModel,
  getEtapaPipelineModel,
} from '@/utils/dynamic-models.helper';
import {
  CreateLeadDTO,
  UpdateLeadDTO,
  ConvertirLeadDTO,
  FiltroLeadsDTO,
} from './crm.dto';
import { pipelineService } from './pipeline.service';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  leads: ILead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ConversionResult {
  lead: ILead;
  clienteId?: string;
  oportunidadId?: string;
}

interface EstadisticasLeads {
  total: number;
  porEstado: { [key: string]: number };
  porOrigen: { [key: string]: number };
  porInteres: { [key: string]: number };
  convertidos: number;
  tasaConversion: number;
}

export class LeadsService {

  /**
   * Obtener modelo de Lead para una empresa específica
   */
  private async getModeloLead(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<ILead>> {
    return await getLeadModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR LEAD
  // ============================================

  async crear(
    data: CreateLeadDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ILead> {
    const LeadModel = await this.getModeloLead(String(empresaId), dbConfig);

    const leadData = {
      ...data,
      empresaId,
      creadoPor: usuarioId,
      proximoContacto: data.proximoContacto ? new Date(data.proximoContacto) : undefined,
    };

    const lead = new LeadModel(leadData);
    await lead.save();

    return lead;
  }

  // ============================================
  // OBTENER TODOS CON FILTROS Y PAGINACIÓN
  // ============================================

  async obtenerTodos(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    filtros: Partial<FiltroLeadsDTO>
  ): Promise<FindAllResult> {
    const LeadModel = await this.getModeloLead(String(empresaId), dbConfig);

    const {
      busqueda,
      estado,
      origen,
      interes,
      asignadoA,
      fechaDesde,
      fechaHasta,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filtros;

    // Construir filtro
    const filter: any = {};

    // Búsqueda por texto
    if (busqueda) {
      filter.$or = [
        { nombre: { $regex: busqueda, $options: 'i' } },
        { apellidos: { $regex: busqueda, $options: 'i' } },
        { empresa: { $regex: busqueda, $options: 'i' } },
        { email: { $regex: busqueda, $options: 'i' } },
      ];
    }

    // Filtros específicos
    if (estado) filter.estado = estado;
    if (origen) filter.origen = origen;
    if (interes) filter.interes = interes;
    if (asignadoA) filter.asignadoA = new mongoose.Types.ObjectId(asignadoA);

    // Filtro por fecha
    if (fechaDesde || fechaHasta) {
      filter.createdAt = {};
      if (fechaDesde) filter.createdAt.$gte = new Date(fechaDesde);
      if (fechaHasta) filter.createdAt.$lte = new Date(fechaHasta);
    }

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar consulta
    const [leads, total] = await Promise.all([
      LeadModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('asignadoA', 'nombre email')
        .lean(),
      LeadModel.countDocuments(filter),
    ]);

    return {
      leads: leads as ILead[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async obtenerPorId(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ILead | null> {
    const LeadModel = await this.getModeloLead(String(empresaId), dbConfig);

    const lead = await LeadModel.findOne({ _id: id })
      .populate('asignadoA', 'nombre email')
      .populate('creadoPor', 'nombre email');

    return lead;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(
    id: string,
    data: UpdateLeadDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ILead | null> {
    const LeadModel = await this.getModeloLead(String(empresaId), dbConfig);

    const updateData: any = {
      ...data,
      actualizadoPor: usuarioId,
    };

    if (data.proximoContacto) {
      updateData.proximoContacto = new Date(data.proximoContacto);
    }

    const lead = await LeadModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true, runValidators: true }
    ).populate('asignadoA', 'nombre email');

    return lead;
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const LeadModel = await this.getModeloLead(String(empresaId), dbConfig);

    const resultado = await LeadModel.deleteOne({ _id: id });

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
    const LeadModel = await this.getModeloLead(String(empresaId), dbConfig);

    const resultado = await LeadModel.deleteMany({
      _id: { $in: ids },
    });

    return resultado.deletedCount || 0;
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(
    id: string,
    nuevoEstado: EstadoLead,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ILead | null> {
    const LeadModel = await this.getModeloLead(String(empresaId), dbConfig);

    const lead = await LeadModel.findOneAndUpdate(
      { _id: id },
      {
        estado: nuevoEstado,
        actualizadoPor: usuarioId,
      },
      { new: true }
    );

    return lead;
  }

  // ============================================
  // ASIGNAR A USUARIO
  // ============================================

  async asignar(
    id: string,
    usuarioAsignadoId: string | null,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ILead | null> {
    const LeadModel = await this.getModeloLead(String(empresaId), dbConfig);

    const lead = await LeadModel.findOneAndUpdate(
      { _id: id },
      {
        asignadoA: usuarioAsignadoId ? new mongoose.Types.ObjectId(usuarioAsignadoId) : null,
        actualizadoPor: usuarioId,
      },
      { new: true }
    ).populate('asignadoA', 'nombre email');

    return lead;
  }

  // ============================================
  // CONVERTIR A CLIENTE/OPORTUNIDAD
  // ============================================

  async convertir(
    id: string,
    data: ConvertirLeadDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ConversionResult> {
    const LeadModel = await this.getModeloLead(String(empresaId), dbConfig);

    // Obtener el lead
    const lead = await LeadModel.findOne({ _id: id });
    if (!lead) {
      throw new Error('Lead no encontrado');
    }

    // Verificar que no esté ya convertido
    if (lead.estado === EstadoLead.CONVERTIDO) {
      throw new Error('El lead ya ha sido convertido');
    }

    const result: ConversionResult = { lead };

    // Crear cliente si se solicita
    if (data.crearCliente) {
      const ClienteModel = await getClienteModel(String(empresaId), dbConfig);

      const clienteData = {
        nombre: data.datosCliente?.nombre || `${lead.nombre} ${lead.apellidos || ''}`.trim(),
        nif: data.datosCliente?.nif || '',
        tipo: data.datosCliente?.tipoCliente || 'empresa',
        email: lead.email,
        telefono: lead.telefono || lead.movil,
        direccion: lead.direccion ? {
          calle: lead.direccion.calle,
          ciudad: lead.direccion.ciudad,
          provincia: lead.direccion.provincia,
          codigoPostal: lead.direccion.codigoPostal,
          pais: lead.direccion.pais,
        } : undefined,
        personaContacto: `${lead.nombre} ${lead.apellidos || ''}`.trim(),
        empresaId,
        creadoPor: usuarioId,
        activo: true,
      };

      const cliente = new ClienteModel(clienteData);
      await cliente.save();
      result.clienteId = String(cliente._id);
    }

    // Crear oportunidad si se solicita
    if (data.crearOportunidad) {
      const OportunidadModel = await getOportunidadModel(String(empresaId), dbConfig);

      // Obtener etapa inicial
      let etapaId = data.datosOportunidad?.etapaId;
      if (!etapaId) {
        const etapaInicial = await pipelineService.obtenerEtapaInicial(empresaId, dbConfig);
        if (!etapaInicial) {
          // Inicializar pipeline si no existe
          const etapas = await pipelineService.inicializarPipelineDefault(empresaId, dbConfig);
          etapaId = String(etapas[0]._id);
        } else {
          etapaId = String(etapaInicial._id);
        }
      }

      const oportunidadData = {
        nombre: data.datosOportunidad?.nombre || `Oportunidad - ${lead.nombre}`,
        leadId: lead._id,
        clienteId: result.clienteId ? new mongoose.Types.ObjectId(result.clienteId) : undefined,
        etapaId: new mongoose.Types.ObjectId(etapaId),
        valorEstimado: data.datosOportunidad?.valorEstimado || 0,
        estado: 'abierta',
        empresaId,
        creadoPor: usuarioId,
      };

      const oportunidad = new OportunidadModel(oportunidadData);
      await oportunidad.save();
      result.oportunidadId = String(oportunidad._id);
    }

    // Actualizar lead como convertido
    lead.estado = EstadoLead.CONVERTIDO;
    lead.convertidoA = {
      clienteId: result.clienteId ? new mongoose.Types.ObjectId(result.clienteId) : undefined,
      oportunidadId: result.oportunidadId ? new mongoose.Types.ObjectId(result.oportunidadId) : undefined,
      fecha: new Date(),
    };
    lead.actualizadoPor = usuarioId;
    await lead.save();

    result.lead = lead;

    return result;
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<EstadisticasLeads> {
    const LeadModel = await this.getModeloLead(String(empresaId), dbConfig);

    const [
      total,
      porEstado,
      porOrigen,
      porInteres,
    ] = await Promise.all([
      LeadModel.countDocuments({}),
      LeadModel.aggregate([
        { $group: { _id: '$estado', count: { $sum: 1 } } },
      ]),
      LeadModel.aggregate([
        { $group: { _id: '$origen', count: { $sum: 1 } } },
      ]),
      LeadModel.aggregate([
        { $group: { _id: '$interes', count: { $sum: 1 } } },
      ]),
    ]);

    const estadoMap: { [key: string]: number } = {};
    porEstado.forEach((e: any) => { estadoMap[e._id] = e.count; });

    const origenMap: { [key: string]: number } = {};
    porOrigen.forEach((o: any) => { origenMap[o._id] = o.count; });

    const interesMap: { [key: string]: number } = {};
    porInteres.forEach((i: any) => { interesMap[i._id] = i.count; });

    const convertidos = estadoMap[EstadoLead.CONVERTIDO] || 0;
    const tasaConversion = total > 0 ? (convertidos / total) * 100 : 0;

    return {
      total,
      porEstado: estadoMap,
      porOrigen: origenMap,
      porInteres: interesMap,
      convertidos,
      tasaConversion: Math.round(tasaConversion * 100) / 100,
    };
  }

  // ============================================
  // OBTENER LEADS PENDIENTES DE CONTACTO
  // ============================================

  async obtenerPendientesContacto(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    usuarioId?: string
  ): Promise<ILead[]> {
    const LeadModel = await this.getModeloLead(String(empresaId), dbConfig);

    const ahora = new Date();
    const filter: any = {
      proximoContacto: { $lte: ahora },
      estado: { $nin: [EstadoLead.CONVERTIDO, EstadoLead.DESCALIFICADO] },
    };

    if (usuarioId) {
      filter.asignadoA = new mongoose.Types.ObjectId(usuarioId);
    }

    const leads = await LeadModel.find(filter)
      .sort({ proximoContacto: 1 })
      .limit(50)
      .populate('asignadoA', 'nombre email')
      .lean();

    return leads as ILead[];
  }

  // ============================================
  // DUPLICAR LEAD
  // ============================================

  async duplicar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ILead> {
    const LeadModel = await this.getModeloLead(String(empresaId), dbConfig);

    const original = await LeadModel.findOne({ _id: id }).lean();

    if (!original) {
      throw new Error('Lead no encontrado');
    }

    // Generar nuevo nombre
    let nuevoNombre = `${original.nombre} (Copia)`;

    // Crear copia
    const {
      _id,
      createdAt,
      updatedAt,
      creadoPor,
      actualizadoPor,
      convertidoA,
      estado,
      ...datosParaCopiar
    } = original as any;

    const copia = new LeadModel({
      ...datosParaCopiar,
      nombre: nuevoNombre,
      estado: EstadoLead.NUEVO,
      empresaId,
      creadoPor: usuarioId,
    });

    await copia.save();

    return copia;
  }
}

export const leadsService = new LeadsService();
