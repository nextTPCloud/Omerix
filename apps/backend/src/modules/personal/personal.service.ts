import { Model } from 'mongoose';
import { IPersonal } from './Personal';
import { CreatePersonalDto, UpdatePersonalDto, GetPersonalQueryDto, RegistrarAusenciaDto, RegistrarVacacionesDto, RegistrarEvaluacionDto } from './personal.dto';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { getPersonalModel } from '@/utils/dynamic-models.helper';

// ============================================
// SERVICIO
// ============================================

export class PersonalService {

  /**
   * Obtener modelo de Personal para una empresa específica
   */
  private async getModeloPersonal(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IPersonal>> {
    return await getPersonalModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR
  // ============================================
  async crear(
    dto: CreatePersonalDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPersonal> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);

    // Generar código si no viene
    if (!dto.codigo) {
      dto.codigo = await (PersonalModel as any).generarCodigo();
    }

    const empleado = new PersonalModel({
      ...dto,
      creadoPor: usuarioId,
      fechaCreacion: new Date()
    });

    return await empleado.save();
  }

  // ============================================
  // LISTAR CON FILTROS
  // ============================================
  async findAll(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    query: GetPersonalQueryDto
  ) {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    const { search, sortBy, sortOrder, page, limit, activo, estado, tipoContrato, departamentoId, responsableId, puesto, tags } = query;

    // Construir filtros
    const filtros: any = {};

    if (search) {
      filtros.$or = [
        { codigo: { $regex: search, $options: 'i' } },
        { nombre: { $regex: search, $options: 'i' } },
        { apellidos: { $regex: search, $options: 'i' } },
        { 'documentacion.nif': { $regex: search, $options: 'i' } },
        { 'contacto.email': { $regex: search, $options: 'i' } },
        { 'contacto.emailCorporativo': { $regex: search, $options: 'i' } },
        { 'datosLaborales.puesto': { $regex: search, $options: 'i' } }
      ];
    }

    if (activo !== undefined) filtros.activo = activo;
    if (estado) filtros.estado = estado;
    if (tipoContrato) filtros['datosLaborales.tipoContrato'] = tipoContrato;
    if (departamentoId) filtros['datosLaborales.departamentoId'] = departamentoId;
    if (responsableId) filtros.responsableId = responsableId;
    if (puesto) filtros['datosLaborales.puesto'] = { $regex: puesto, $options: 'i' };
    if (tags && tags.length > 0) filtros.tags = { $in: tags };

    // Ordenamiento
    const sort: any = {};
    sort[sortBy || 'apellidos'] = sortOrder === 'desc' ? -1 : 1;

    // Paginación
    const skip = ((page || 1) - 1) * (limit || 25);
    const limitNum = limit || 25;

    const [personal, total] = await Promise.all([
      PersonalModel.find(filtros)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PersonalModel.countDocuments(filtros)
    ]);

    return {
      personal,
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
  ): Promise<IPersonal | null> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    return PersonalModel.findById(id).lean();
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  async actualizar(
    id: string,
    dto: UpdatePersonalDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPersonal | null> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);

    return PersonalModel.findByIdAndUpdate(
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
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    const result = await PersonalModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  // ============================================
  // ELIMINAR MÚLTIPLES
  // ============================================
  async eliminarMultiples(
    ids: string[],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<number> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    const result = await PersonalModel.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
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
  ): Promise<IPersonal | null> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    return PersonalModel.findByIdAndUpdate(
      id,
      {
        activo,
        estado: activo ? 'activo' : 'baja_temporal',
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
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    return (PersonalModel as any).obtenerEstadisticas();
  }

  // ============================================
  // SUGERIR CÓDIGO
  // ============================================
  async sugerirSiguienteCodigo(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    prefijo?: string
  ): Promise<string> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    const pref = prefijo || 'EMP';

    const ultimoEmpleado = await PersonalModel.findOne({
      codigo: new RegExp(`^${pref}\\d+$`)
    }).sort({ codigo: -1 }).lean();

    let numero = 1;
    if (ultimoEmpleado && ultimoEmpleado.codigo) {
      const match = ultimoEmpleado.codigo.match(/\d+$/);
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
  ): Promise<IPersonal | null> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    const filtros: any = { 'documentacion.nif': nif.toUpperCase() };
    if (excludeId) {
      filtros._id = { $ne: excludeId };
    }
    return PersonalModel.findOne(filtros).lean();
  }

  // ============================================
  // DUPLICAR
  // ============================================
  async duplicar(
    id: string,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPersonal | null> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    const original = await PersonalModel.findById(id).lean();

    if (!original) return null;

    const nuevoCodigo = await this.sugerirSiguienteCodigo(empresaId, dbConfig);

    // Eliminar campos que no deben duplicarse
    const { _id, codigo, documentacion, fechaCreacion, creadoPor, modificadoPor, fechaModificacion, usuarioId: uId, ...datos } = original as any;

    const duplicado = new PersonalModel({
      ...datos,
      codigo: nuevoCodigo,
      nombre: `${datos.nombre} (Copia)`,
      documentacion: { ...documentacion, nif: undefined },
      usuarioId: undefined,
      creadoPor: usuarioId,
      fechaCreacion: new Date()
    });

    return await duplicado.save();
  }

  // ============================================
  // REGISTRAR AUSENCIA
  // ============================================
  async registrarAusencia(
    id: string,
    ausencia: RegistrarAusenciaDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPersonal | null> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    return PersonalModel.findByIdAndUpdate(
      id,
      {
        $push: { ausencias: ausencia },
        modificadoPor: usuarioId,
        fechaModificacion: new Date()
      },
      { new: true }
    ).lean();
  }

  // ============================================
  // ACTUALIZAR VACACIONES
  // ============================================
  async actualizarVacaciones(
    id: string,
    vacaciones: RegistrarVacacionesDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPersonal | null> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);

    // Buscar si ya existe vacaciones para ese año
    const empleado = await PersonalModel.findById(id).lean();
    if (!empleado) return null;

    const existeAnio = empleado.vacaciones?.find(v => v.anio === vacaciones.anio);

    if (existeAnio) {
      // Actualizar
      return PersonalModel.findOneAndUpdate(
        { _id: id, 'vacaciones.anio': vacaciones.anio },
        {
          $set: {
            'vacaciones.$.diasTotales': vacaciones.diasTotales,
            'vacaciones.$.diasDisfrutados': vacaciones.diasDisfrutados || 0
          },
          modificadoPor: usuarioId,
          fechaModificacion: new Date()
        },
        { new: true }
      ).lean();
    } else {
      // Crear nuevo
      return PersonalModel.findByIdAndUpdate(
        id,
        {
          $push: {
            vacaciones: {
              ...vacaciones,
              diasDisfrutados: vacaciones.diasDisfrutados || 0
            }
          },
          modificadoPor: usuarioId,
          fechaModificacion: new Date()
        },
        { new: true }
      ).lean();
    }
  }

  // ============================================
  // ELIMINAR VACACIONES
  // ============================================
  async eliminarVacaciones(
    id: string,
    anio: number,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPersonal | null> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    return PersonalModel.findByIdAndUpdate(
      id,
      {
        $pull: { vacaciones: { anio } },
        modificadoPor: usuarioId,
        fechaModificacion: new Date()
      },
      { new: true }
    ).lean();
  }

  // ============================================
  // ACTUALIZAR AUSENCIA
  // ============================================
  async actualizarAusencia(
    id: string,
    ausenciaId: string,
    ausencia: RegistrarAusenciaDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPersonal | null> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    return PersonalModel.findOneAndUpdate(
      { _id: id, 'ausencias._id': ausenciaId },
      {
        $set: {
          'ausencias.$.tipo': ausencia.tipo,
          'ausencias.$.fechaInicio': ausencia.fechaInicio,
          'ausencias.$.fechaFin': ausencia.fechaFin,
          'ausencias.$.motivo': ausencia.motivo,
          'ausencias.$.aprobada': ausencia.aprobada
        },
        modificadoPor: usuarioId,
        fechaModificacion: new Date()
      },
      { new: true }
    ).lean();
  }

  // ============================================
  // ELIMINAR AUSENCIA
  // ============================================
  async eliminarAusencia(
    id: string,
    ausenciaId: string,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPersonal | null> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    return PersonalModel.findByIdAndUpdate(
      id,
      {
        $pull: { ausencias: { _id: ausenciaId } },
        modificadoPor: usuarioId,
        fechaModificacion: new Date()
      },
      { new: true }
    ).lean();
  }

  // ============================================
  // REGISTRAR EVALUACIÓN
  // ============================================
  async registrarEvaluacion(
    id: string,
    evaluacion: RegistrarEvaluacionDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPersonal | null> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    return PersonalModel.findByIdAndUpdate(
      id,
      {
        $push: { evaluaciones: evaluacion },
        modificadoPor: usuarioId,
        fechaModificacion: new Date()
      },
      { new: true }
    ).lean();
  }

  // ============================================
  // OBTENER SUBORDINADOS
  // ============================================
  async obtenerSubordinados(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IPersonal[]> {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    return PersonalModel.find({ responsableId: id })
      .select('codigo nombre apellidos datosLaborales.puesto activo')
      .lean();
  }

  // ============================================
  // EXPORTAR CSV
  // ============================================
  async exportarCSV(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    filtros?: GetPersonalQueryDto
  ) {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    const query: any = {};

    if (filtros?.activo !== undefined) query.activo = filtros.activo;
    if (filtros?.estado) query.estado = filtros.estado;
    if (filtros?.tipoContrato) query['datosLaborales.tipoContrato'] = filtros.tipoContrato;

    return PersonalModel.find(query)
      .sort({ codigo: 1 })
      .lean();
  }

  // ============================================
  // OBTENER CALENDARIO AUSENCIAS
  // ============================================
  async obtenerCalendarioAusencias(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    mes: number,
    anio: number
  ) {
    const PersonalModel = await this.getModeloPersonal(empresaId, dbConfig);
    const inicioMes = new Date(anio, mes - 1, 1);
    const finMes = new Date(anio, mes, 0);

    return PersonalModel.aggregate([
      { $match: { activo: true } },
      { $unwind: { path: '$ausencias', preserveNullAndEmptyArrays: false } },
      {
        $match: {
          'ausencias.fechaInicio': { $lte: finMes },
          $or: [
            { 'ausencias.fechaFin': { $gte: inicioMes } },
            { 'ausencias.fechaFin': null }
          ]
        }
      },
      {
        $project: {
          codigo: 1,
          nombre: 1,
          apellidos: 1,
          ausencia: '$ausencias'
        }
      }
    ]);
  }
}

export const personalService = new PersonalService();
