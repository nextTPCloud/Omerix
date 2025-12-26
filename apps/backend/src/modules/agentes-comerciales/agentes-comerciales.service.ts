import { Model } from 'mongoose';
import { IAgenteComercial } from './AgenteComercial';
import { CreateAgenteComercialDto, UpdateAgenteComercialDto, GetAgentesQueryDto } from './agentes-comerciales.dto';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { getAgenteComercialModel } from '@/utils/dynamic-models.helper';
import {
  checkAgenteComercialIntegrity,
  ReferentialIntegrityError
} from '@/utils/referential-integrity.helper';

// ============================================
// SERVICIO
// ============================================

export class AgentesService {

  /**
   * Obtener modelo de AgenteComercial para una empresa específica
   */
  private async getModeloAgente(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IAgenteComercial>> {
    return await getAgenteComercialModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR
  // ============================================
  async crear(
    dto: CreateAgenteComercialDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IAgenteComercial> {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);

    // Generar código si no viene
    if (!dto.codigo) {
      dto.codigo = await (AgenteModel as any).generarCodigo();
    }

    const agente = new AgenteModel({
      ...dto,
      creadoPor: usuarioId,
      fechaCreacion: new Date()
    });

    return await agente.save();
  }

  // ============================================
  // LISTAR CON FILTROS
  // ============================================
  async findAll(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    query: GetAgentesQueryDto
  ) {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    const { search, sortBy, sortOrder, page, limit, activo, tipo, estado, zona, supervisorId, tags } = query;

    // Construir filtros
    const filtros: any = {};

    if (search) {
      filtros.$or = [
        { codigo: { $regex: search, $options: 'i' } },
        { nombre: { $regex: search, $options: 'i' } },
        { apellidos: { $regex: search, $options: 'i' } },
        { nif: { $regex: search, $options: 'i' } },
        { 'contacto.email': { $regex: search, $options: 'i' } }
      ];
    }

    if (activo !== undefined) filtros.activo = activo;
    if (tipo) filtros.tipo = tipo;
    if (estado) filtros.estado = estado;
    if (zona) filtros['zonasAsignadas.zona'] = { $regex: zona, $options: 'i' };
    if (supervisorId) filtros.supervisorId = supervisorId;
    if (tags && tags.length > 0) filtros.tags = { $in: tags };

    // Ordenamiento
    const sort: any = {};
    sort[sortBy || 'nombre'] = sortOrder === 'desc' ? -1 : 1;

    // Paginación
    const skip = ((page || 1) - 1) * (limit || 25);
    const limitNum = limit || 25;

    const [agentes, total] = await Promise.all([
      AgenteModel.find(filtros)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AgenteModel.countDocuments(filtros)
    ]);

    return {
      agentes,
      pagination: {
        total,
        page: page || 1,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  async findById(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IAgenteComercial | null> {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    // No hacer populate de clientesAsignados ya que el modelo Cliente
    // puede no estar registrado en esta conexión
    return AgenteModel.findById(id).lean();
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  async actualizar(
    id: string,
    dto: UpdateAgenteComercialDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IAgenteComercial | null> {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);

    return AgenteModel.findByIdAndUpdate(
      id,
      {
        ...dto,
        modificadoPor: usuarioId,
        fechaModificacion: new Date()
      },
      { new: true, runValidators: true }
    ).lean();
  }

  // ============================================
  // ELIMINAR
  // ============================================
  async eliminar(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    // Verificar integridad referencial antes de eliminar
    const integrityCheck = await checkAgenteComercialIntegrity(
      id,
      empresaId,
      dbConfig
    );

    if (!integrityCheck.canDelete) {
      throw new ReferentialIntegrityError(
        'el agente comercial',
        id,
        integrityCheck.relatedRecords
      );
    }

    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    const result = await AgenteModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  // ============================================
  // ELIMINAR MÚLTIPLES
  // ============================================
  async eliminarMultiples(
    ids: string[],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<{ deleted: number; errors: Array<{ id: string; error: string }> }> {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    const errors: Array<{ id: string; error: string }> = [];
    const idsToDelete: string[] = [];

    // Verificar integridad referencial de cada agente
    for (const id of ids) {
      try {
        const integrityCheck = await checkAgenteComercialIntegrity(
          id,
          empresaId,
          dbConfig
        );

        if (integrityCheck.canDelete) {
          idsToDelete.push(id);
        } else {
          const messages = integrityCheck.relatedRecords.map(r =>
            `${r.count} ${r.documentType}${r.count > 1 ? 's' : ''}`
          );
          errors.push({
            id,
            error: `Tiene ${messages.join(', ')} asociados`,
          });
        }
      } catch (error: any) {
        errors.push({ id, error: error.message });
      }
    }

    // Eliminar solo los que no tienen dependencias
    let deletedCount = 0;
    if (idsToDelete.length > 0) {
      const result = await AgenteModel.deleteMany({ _id: { $in: idsToDelete } });
      deletedCount = result.deletedCount || 0;
    }

    return { deleted: deletedCount, errors };
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================
  async cambiarEstado(
    id: string,
    activo: boolean,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IAgenteComercial | null> {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    return AgenteModel.findByIdAndUpdate(
      id,
      {
        activo,
        estado: activo ? 'activo' : 'inactivo',
        modificadoPor: usuarioId,
        fechaModificacion: new Date()
      },
      { new: true }
    ).lean();
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================
  async obtenerEstadisticas(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    return (AgenteModel as any).obtenerEstadisticas();
  }

  // ============================================
  // SUGERIR CÓDIGO
  // ============================================
  async sugerirSiguienteCodigo(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    prefijo?: string
  ): Promise<string> {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    const pref = prefijo || 'AG';

    const ultimoAgente = await AgenteModel.findOne({
      codigo: new RegExp(`^${pref}\\d+$`)
    }).sort({ codigo: -1 }).lean();

    let numero = 1;
    if (ultimoAgente && ultimoAgente.codigo) {
      const match = ultimoAgente.codigo.match(/\d+$/);
      if (match) {
        numero = parseInt(match[0], 10) + 1;
      }
    }

    return `${pref}${numero.toString().padStart(4, '0')}`;
  }

  // ============================================
  // VERIFICAR DUPLICADOS (NIF)
  // ============================================
  async verificarDuplicados(
    nif: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    excludeId?: string
  ): Promise<IAgenteComercial | null> {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    const filtros: any = { nif: nif.toUpperCase() };
    if (excludeId) {
      filtros._id = { $ne: excludeId };
    }
    return AgenteModel.findOne(filtros).lean();
  }

  // ============================================
  // DUPLICAR
  // ============================================
  async duplicar(
    id: string,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IAgenteComercial | null> {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    const original = await AgenteModel.findById(id).lean();

    if (!original) return null;

    const nuevoCodigo = await this.sugerirSiguienteCodigo(empresaId, dbConfig);

    // Eliminar campos que no deben duplicarse
    const { _id, codigo, nif, fechaCreacion, creadoPor, modificadoPor, fechaModificacion, ...datos } = original as any;

    const duplicado = new AgenteModel({
      ...datos,
      codigo: nuevoCodigo,
      nombre: `${datos.nombre} (Copia)`,
      nif: undefined,
      creadoPor: usuarioId,
      fechaCreacion: new Date()
    });

    return await duplicado.save();
  }

  // ============================================
  // ASIGNAR CLIENTES
  // ============================================
  async asignarClientes(
    id: string,
    clienteIds: string[],
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IAgenteComercial | null> {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    return AgenteModel.findByIdAndUpdate(
      id,
      {
        $addToSet: { clientesAsignados: { $each: clienteIds } },
        modificadoPor: usuarioId,
        fechaModificacion: new Date()
      },
      { new: true }
    ).lean();
  }

  // ============================================
  // DESASIGNAR CLIENTES
  // ============================================
  async desasignarClientes(
    id: string,
    clienteIds: string[],
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IAgenteComercial | null> {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    return AgenteModel.findByIdAndUpdate(
      id,
      {
        $pull: { clientesAsignados: { $in: clienteIds } },
        modificadoPor: usuarioId,
        fechaModificacion: new Date()
      },
      { new: true }
    ).lean();
  }

  // ============================================
  // REGISTRAR VENTA
  // ============================================
  async registrarVenta(
    id: string,
    importe: number,
    comision: number,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IAgenteComercial | null> {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    return AgenteModel.findByIdAndUpdate(
      id,
      {
        $inc: {
          ventasTotales: importe,
          comisionesAcumuladas: comision
        },
        modificadoPor: usuarioId,
        fechaModificacion: new Date()
      },
      { new: true }
    ).lean();
  }

  // ============================================
  // EXPORTAR CSV
  // ============================================
  async exportarCSV(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    filtros?: GetAgentesQueryDto
  ) {
    const AgenteModel = await this.getModeloAgente(empresaId, dbConfig);
    const query: any = {};

    if (filtros?.activo !== undefined) query.activo = filtros.activo;
    if (filtros?.tipo) query.tipo = filtros.tipo;
    if (filtros?.estado) query.estado = filtros.estado;

    return AgenteModel.find(query)
      .sort({ codigo: 1 })
      .lean();
  }
}

export const agentesService = new AgentesService();
