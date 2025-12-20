import mongoose from 'mongoose';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import {
  getModeloTurno,
  getModeloHorarioPersonal,
  ITurno,
  IHorarioPersonal,
  TURNOS_PREDEFINIDOS,
} from './Turno';
import {
  CreateTurnoDTO,
  UpdateTurnoDTO,
  SearchTurnosDTO,
  CreateHorarioPersonalDTO,
  UpdateHorarioPersonalDTO,
  SearchHorarioPersonalDTO,
} from './turnos.dto';

// ============================================
// SERVICIO DE TURNOS
// ============================================

export const turnosService = {
  // ============================================
  // TURNOS
  // ============================================

  /**
   * Crear un nuevo turno
   */
  async crear(
    data: CreateTurnoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ITurno> {
    const Turno = await getModeloTurno(empresaId, dbConfig);

    // Generar código si no se proporciona
    let codigo = data.codigo;
    if (!codigo) {
      codigo = await this.generarCodigo(empresaId, dbConfig);
    }

    const turno = new Turno({
      ...data,
      codigo,
      diasSemana: data.diasSemana || [1, 2, 3, 4, 5],
      creadoPor: usuarioId,
      modificadoPor: usuarioId,
    });

    await turno.save();
    return turno;
  },

  /**
   * Generar código automático
   */
  async generarCodigo(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<string> {
    const Turno = await getModeloTurno(empresaId, dbConfig);
    const ultimo = await Turno.findOne({}, {}, { sort: { codigo: -1 } });

    if (!ultimo) {
      return 'TUR001';
    }

    const match = ultimo.codigo.match(/TUR(\d+)/);
    if (match) {
      const numero = parseInt(match[1]) + 1;
      return `TUR${numero.toString().padStart(3, '0')}`;
    }

    return `TUR${Date.now().toString().slice(-3)}`;
  },

  /**
   * Buscar turnos con filtros
   */
  async buscar(
    params: SearchTurnosDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{
    turnos: ITurno[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const Turno = await getModeloTurno(empresaId, dbConfig);

    const {
      search,
      activo = 'true',
      page = 1,
      limit = 50,
      sortBy = 'nombre',
      sortOrder = 'asc',
    } = params;

    const query: any = {};

    if (search) {
      query.$or = [
        { codigo: { $regex: search, $options: 'i' } },
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
      ];
    }

    if (activo !== 'all') {
      query.activo = activo === 'true';
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [turnos, total] = await Promise.all([
      Turno.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Turno.countDocuments(query),
    ]);

    return {
      turnos: turnos as ITurno[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Obtener turno por ID
   */
  async obtenerPorId(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ITurno | null> {
    const Turno = await getModeloTurno(empresaId, dbConfig);
    return Turno.findById(id).lean() as Promise<ITurno | null>;
  },

  /**
   * Actualizar turno
   */
  async actualizar(
    id: string,
    data: UpdateTurnoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ITurno | null> {
    const Turno = await getModeloTurno(empresaId, dbConfig);

    const turno = await Turno.findByIdAndUpdate(
      id,
      {
        ...data,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    ).lean();

    return turno as ITurno | null;
  },

  /**
   * Eliminar turno (soft delete)
   */
  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const Turno = await getModeloTurno(empresaId, dbConfig);

    const result = await Turno.findByIdAndUpdate(id, {
      activo: false,
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
    });

    return !!result;
  },

  /**
   * Obtener turnos activos
   */
  async obtenerActivos(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ITurno[]> {
    const Turno = await getModeloTurno(empresaId, dbConfig);

    return Turno.find({ activo: true })
      .sort({ nombre: 1 })
      .lean() as Promise<ITurno[]>;
  },

  /**
   * Obtener turnos predefinidos
   */
  obtenerPredefinidos() {
    return TURNOS_PREDEFINIDOS;
  },

  /**
   * Buscar códigos existentes por prefijo
   */
  async searchCodigos(
    prefix: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<string[]> {
    const Turno = await getModeloTurno(empresaId, dbConfig);

    // Si no hay prefijo, sugerir el siguiente código
    if (!prefix) {
      const codigo = await this.generarCodigo(empresaId, dbConfig);
      return [codigo];
    }

    // Buscar códigos que coincidan con el prefijo
    const turnos = await Turno.find({
      codigo: { $regex: `^${prefix}`, $options: 'i' },
    })
      .select('codigo')
      .sort({ codigo: 1 })
      .limit(10)
      .lean();

    const codigos = turnos.map((t) => t.codigo);

    // Si no hay resultados, sugerir el siguiente código basado en el prefijo
    if (codigos.length === 0) {
      return [`${prefix.toUpperCase()}001`];
    }

    // Agregar sugerencia del siguiente código
    const ultimoCodigo = codigos[codigos.length - 1];
    const match = ultimoCodigo.match(/(\D+)(\d+)$/);
    if (match) {
      const baseCode = match[1];
      const numero = parseInt(match[2]) + 1;
      const siguienteCodigo = `${baseCode}${numero.toString().padStart(match[2].length, '0')}`;
      if (!codigos.includes(siguienteCodigo)) {
        codigos.push(siguienteCodigo);
      }
    }

    return codigos;
  },

  /**
   * Crear turnos predefinidos
   */
  async crearPredefinidos(
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ITurno[]> {
    const Turno = await getModeloTurno(empresaId, dbConfig);
    const turnosCreados: ITurno[] = [];

    for (const turnoData of TURNOS_PREDEFINIDOS) {
      const existe = await Turno.findOne({ codigo: turnoData.codigo });
      if (!existe) {
        const turno = new Turno({
          ...turnoData,
          duracionPausaMinutos: turnoData.duracionPausaMinutos || 0,
          activo: true,
          creadoPor: usuarioId,
          modificadoPor: usuarioId,
        });
        await turno.save();
        turnosCreados.push(turno);
      }
    }

    return turnosCreados;
  },

  // ============================================
  // HORARIOS PERSONAL
  // ============================================

  /**
   * Crear horario de personal
   */
  async crearHorarioPersonal(
    data: CreateHorarioPersonalDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IHorarioPersonal> {
    const HorarioPersonal = await getModeloHorarioPersonal(empresaId, dbConfig);

    // Desactivar horarios anteriores del mismo personal sin fecha fin
    await HorarioPersonal.updateMany(
      {
        personalId: new mongoose.Types.ObjectId(data.personalId),
        fechaFin: null,
        activo: true,
      },
      {
        fechaFin: new Date(data.fechaInicio),
        modificadoPor: usuarioId,
      }
    );

    const horario = new HorarioPersonal({
      ...data,
      personalId: new mongoose.Types.ObjectId(data.personalId),
      turnoId: new mongoose.Types.ObjectId(data.turnoId),
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
      creadoPor: usuarioId,
      modificadoPor: usuarioId,
    });

    await horario.save();
    return horario;
  },

  /**
   * Buscar horarios de personal
   */
  async buscarHorariosPersonal(
    params: SearchHorarioPersonalDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{
    horarios: IHorarioPersonal[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const HorarioPersonal = await getModeloHorarioPersonal(empresaId, dbConfig);

    const { personalId, turnoId, activo = 'true', page = 1, limit = 50 } = params;

    const query: any = {};

    if (personalId) {
      query.personalId = new mongoose.Types.ObjectId(personalId);
    }

    if (turnoId) {
      query.turnoId = new mongoose.Types.ObjectId(turnoId);
    }

    if (activo !== 'all') {
      query.activo = activo === 'true';
    }

    const skip = (page - 1) * limit;

    const [horarios, total] = await Promise.all([
      HorarioPersonal.find(query)
        .sort({ fechaInicio: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HorarioPersonal.countDocuments(query),
    ]);

    return {
      horarios: horarios as IHorarioPersonal[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Obtener horario actual de personal
   */
  async obtenerHorarioActual(
    personalId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IHorarioPersonal | null> {
    const HorarioPersonal = await getModeloHorarioPersonal(empresaId, dbConfig);
    const ahora = new Date();

    const horario = await HorarioPersonal.findOne({
      personalId: new mongoose.Types.ObjectId(personalId),
      fechaInicio: { $lte: ahora },
      $or: [{ fechaFin: null }, { fechaFin: { $gte: ahora } }],
      activo: true,
    })
      .sort({ fechaInicio: -1 })
      .lean();

    return horario as IHorarioPersonal | null;
  },

  /**
   * Obtener turno actual de personal
   */
  async obtenerTurnoActualPersonal(
    personalId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ITurno | null> {
    const horario = await this.obtenerHorarioActual(personalId, empresaId, dbConfig);
    if (!horario) {
      return null;
    }

    return this.obtenerPorId(horario.turnoId.toString(), empresaId, dbConfig);
  },

  /**
   * Actualizar horario de personal
   */
  async actualizarHorarioPersonal(
    id: string,
    data: UpdateHorarioPersonalDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IHorarioPersonal | null> {
    const HorarioPersonal = await getModeloHorarioPersonal(empresaId, dbConfig);

    const updateData: any = {
      ...data,
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
    };

    if (data.personalId) {
      updateData.personalId = new mongoose.Types.ObjectId(data.personalId);
    }
    if (data.turnoId) {
      updateData.turnoId = new mongoose.Types.ObjectId(data.turnoId);
    }
    if (data.fechaInicio) {
      updateData.fechaInicio = new Date(data.fechaInicio);
    }
    if (data.fechaFin) {
      updateData.fechaFin = new Date(data.fechaFin);
    }

    const horario = await HorarioPersonal.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();

    return horario as IHorarioPersonal | null;
  },

  /**
   * Eliminar horario de personal
   */
  async eliminarHorarioPersonal(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const HorarioPersonal = await getModeloHorarioPersonal(empresaId, dbConfig);

    const result = await HorarioPersonal.findByIdAndUpdate(id, {
      activo: false,
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
    });

    return !!result;
  },
};
