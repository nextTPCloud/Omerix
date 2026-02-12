import { Model, Types } from 'mongoose';
import { ICamarero, EstadoCamarero } from './Camarero';
import {
  CreateCamareroDTO,
  UpdateCamareroDTO,
  CambiarEstadoCamareroDTO,
  AsignarSalonesDTO,
  AsignarMesasDTO,
  RegistrarPropinaDTO,
  FiltrosCamarerosDTO,
} from './camareros.dto';
import { IDatabaseConfig } from '../../types/express';
import { getCamareroModel, getSalonModel, getMesaModel, getPersonalModel } from '../../utils/dynamic-models.helper';
import bcrypt from 'bcryptjs';

// Import dinámico de Turno para populate
const getTurnoModel = async (empresaId: string, dbConfig: IDatabaseConfig) => {
  try {
    const { default: Turno } = await import('../turnos/Turno');
    const { databaseManager } = await import('../../services/database-manager.service');
    return databaseManager.getModel(empresaId, dbConfig, 'Turno', Turno.schema);
  } catch {
    return null;
  }
};

export class CamarerosService {
  private async getModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<ICamarero>> {
    // Registrar modelos referenciados para que populate funcione
    await Promise.all([
      getSalonModel(empresaId, dbConfig),
      getMesaModel(empresaId, dbConfig),
      getPersonalModel(empresaId, dbConfig),
      getTurnoModel(empresaId, dbConfig),
    ]);
    return await getCamareroModel(empresaId, dbConfig);
  }

  // ============================================
  // CRUD CAMAREROS
  // ============================================

  async getAll(empresaId: string, dbConfig: IDatabaseConfig, filtros: FiltrosCamarerosDTO = {}) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const query: any = {};

    if (filtros.estado) {
      query.estado = filtros.estado;
    }

    if (filtros.activo !== undefined) {
      query.activo = filtros.activo;
    }

    if (filtros.salonId) {
      query.salonesAsignados = new Types.ObjectId(filtros.salonId);
    }

    if (filtros.busqueda) {
      const regex = new RegExp(filtros.busqueda, 'i');
      query.$or = [
        { nombre: regex },
        { apellidos: regex },
        { alias: regex },
        { codigo: regex },
      ];
    }

    const page = filtros.page || 1;
    const limit = filtros.limit || 50;
    const skip = (page - 1) * limit;

    const [camareros, total] = await Promise.all([
      CamareroModel.find(query)
        // No hacer populate de usuarioId porque está en BD principal, no en BD de empresa
        .populate('salonesAsignados', 'nombre color')
        .populate('personalId', 'nombre apellidos')
        .sort({ nombre: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CamareroModel.countDocuments(query),
    ]);

    return {
      data: camareros,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const camarero = await CamareroModel.findById(id)
      // No hacer populate de usuarioId porque está en BD principal, no en BD de empresa
      .populate('salonesAsignados', 'nombre color')
      .populate('mesasAsignadas', 'numero estado')
      .populate('personalId', 'nombre apellidos email telefono')
      .populate('turnosRRHHIds', 'nombre codigo horaInicio horaFin diasSemana color')
      .lean();

    if (!camarero) {
      throw new Error('Camarero no encontrado');
    }

    return camarero;
  }

  async getByUsuarioId(empresaId: string, dbConfig: IDatabaseConfig, usuarioId: string) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const camarero = await CamareroModel.findOne({ usuarioId })
      .populate('salonesAsignados', 'nombre color')
      .lean();

    return camarero;
  }

  /**
   * Sugerir el siguiente codigo de camarero
   */
  async sugerirSiguienteCodigo(empresaId: string, dbConfig: IDatabaseConfig, prefijo: string = 'CAM') {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);

    // Buscar el ultimo codigo con el prefijo dado
    const ultimoCamarero = await CamareroModel.findOne({
      codigo: { $regex: `^${prefijo}`, $options: 'i' }
    })
      .sort({ codigo: -1 })
      .select('codigo')
      .lean();

    if (!ultimoCamarero || !ultimoCamarero.codigo) {
      return `${prefijo}001`;
    }

    // Extraer el numero del codigo
    const match = ultimoCamarero.codigo.match(/(\d+)$/);
    if (!match) {
      return `${prefijo}001`;
    }

    const numero = parseInt(match[1], 10) + 1;
    const longitudNumero = match[1].length;
    return `${prefijo}${numero.toString().padStart(longitudNumero, '0')}`;
  }

  async create(empresaId: string, dbConfig: IDatabaseConfig, data: CreateCamareroDTO) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);

    // Verificar que no existe un camarero con ese usuarioId (si se proporciona)
    if (data.usuarioId) {
      const existente = await CamareroModel.findOne({ usuarioId: data.usuarioId });
      if (existente) {
        throw new Error('Ya existe un camarero para este usuario');
      }
    }

    // Hash del PIN si se proporciona
    let pinHash: string | undefined;
    if (data.pin) {
      const salt = await bcrypt.genSalt(10);
      pinHash = await bcrypt.hash(data.pin, salt);
    }

    const camarero = new CamareroModel({
      ...data,
      pin: pinHash,
      usuarioId: data.usuarioId ? new Types.ObjectId(data.usuarioId) : undefined,
      personalId: data.personalId ? new Types.ObjectId(data.personalId) : undefined,
      salonesAsignados: data.salonesAsignados?.map(id => new Types.ObjectId(id)) || [],
      mesasAsignadas: data.mesasAsignadas?.map(id => new Types.ObjectId(id)) || [],
      zonasPreparacion: data.zonasPreparacion?.map(id => new Types.ObjectId(id)) || [],
      turnosRRHHIds: data.turnosRRHHIds?.map(id => new Types.ObjectId(id)) || [],
    });

    await camarero.save();
    return this.getById(empresaId, dbConfig, camarero._id.toString());
  }

  async update(empresaId: string, dbConfig: IDatabaseConfig, id: string, data: UpdateCamareroDTO) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const camarero = await CamareroModel.findById(id);
    if (!camarero) {
      throw new Error('Camarero no encontrado');
    }

    // Hash del PIN si se proporciona
    const updateData: any = { ...data };
    if (data.pin) {
      const salt = await bcrypt.genSalt(10);
      updateData.pin = await bcrypt.hash(data.pin, salt);
    }

    // Convertir IDs a ObjectId
    if (data.salonesAsignados) {
      updateData.salonesAsignados = data.salonesAsignados.map(id => new Types.ObjectId(id));
    }
    if (data.mesasAsignadas) {
      updateData.mesasAsignadas = data.mesasAsignadas.map(id => new Types.ObjectId(id));
    }
    if (data.zonasPreparacion) {
      updateData.zonasPreparacion = data.zonasPreparacion.map(id => new Types.ObjectId(id));
    }
    if (data.personalId !== undefined) {
      updateData.personalId = data.personalId ? new Types.ObjectId(data.personalId) : null;
    }
    if (data.turnosRRHHIds) {
      updateData.turnosRRHHIds = data.turnosRRHHIds.map(id => new Types.ObjectId(id));
    }

    await CamareroModel.findByIdAndUpdate(id, updateData);
    return this.getById(empresaId, dbConfig, id);
  }

  async delete(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const camarero = await CamareroModel.findById(id);
    if (!camarero) {
      throw new Error('Camarero no encontrado');
    }

    // Soft delete
    await CamareroModel.findByIdAndUpdate(id, {
      activo: false,
      fechaBaja: new Date(),
      estado: EstadoCamarero.INACTIVO,
    });

    return { success: true };
  }

  // ============================================
  // ESTADO Y TURNOS
  // ============================================

  async cambiarEstado(empresaId: string, dbConfig: IDatabaseConfig, id: string, data: CambiarEstadoCamareroDTO) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const camarero = await CamareroModel.findById(id);
    if (!camarero) {
      throw new Error('Camarero no encontrado');
    }

    await CamareroModel.findByIdAndUpdate(id, { estado: data.estado });
    return this.getById(empresaId, dbConfig, id);
  }

  async verificarPIN(empresaId: string, dbConfig: IDatabaseConfig, id: string, pin: string): Promise<boolean> {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const camarero = await CamareroModel.findById(id).select('+pin');
    if (!camarero || !camarero.pin) {
      return false;
    }

    return bcrypt.compare(pin, camarero.pin);
  }

  async getCamarerosActivos(empresaId: string, dbConfig: IDatabaseConfig) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    return CamareroModel.find({
      activo: true,
      estado: EstadoCamarero.ACTIVO,
    })
      .populate('salonesAsignados', 'nombre color')
      .sort({ nombre: 1 })
      .lean();
  }

  async getCamarerosPorSalon(empresaId: string, dbConfig: IDatabaseConfig, salonId: string) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    return CamareroModel.find({
      activo: true,
      salonesAsignados: new Types.ObjectId(salonId),
    })
      .sort({ nombre: 1 })
      .lean();
  }

  // ============================================
  // ASIGNACIONES
  // ============================================

  async asignarSalones(empresaId: string, dbConfig: IDatabaseConfig, id: string, data: AsignarSalonesDTO) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const camarero = await CamareroModel.findById(id);
    if (!camarero) {
      throw new Error('Camarero no encontrado');
    }

    await CamareroModel.findByIdAndUpdate(id, {
      salonesAsignados: data.salonesIds.map(id => new Types.ObjectId(id)),
    });

    return this.getById(empresaId, dbConfig, id);
  }

  async asignarMesas(empresaId: string, dbConfig: IDatabaseConfig, id: string, data: AsignarMesasDTO) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const camarero = await CamareroModel.findById(id);
    if (!camarero) {
      throw new Error('Camarero no encontrado');
    }

    await CamareroModel.findByIdAndUpdate(id, {
      mesasAsignadas: data.mesasIds.map(id => new Types.ObjectId(id)),
    });

    return this.getById(empresaId, dbConfig, id);
  }

  // ============================================
  // PROPINAS
  // ============================================

  async registrarPropina(empresaId: string, dbConfig: IDatabaseConfig, id: string, data: RegistrarPropinaDTO) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const camarero = await CamareroModel.findById(id);
    if (!camarero) {
      throw new Error('Camarero no encontrado');
    }

    await CamareroModel.findByIdAndUpdate(id, {
      $inc: { propinasAcumuladas: data.importe },
    });

    return this.getById(empresaId, dbConfig, id);
  }

  async resetearPropinas(empresaId: string, dbConfig: IDatabaseConfig, id: string) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const camarero = await CamareroModel.findById(id);
    if (!camarero) {
      throw new Error('Camarero no encontrado');
    }

    const propinasAnteriores = camarero.propinasAcumuladas;

    await CamareroModel.findByIdAndUpdate(id, {
      propinasAcumuladas: 0,
    });

    return {
      success: true,
      propinasResetadas: propinasAnteriores,
    };
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async getEstadisticas(empresaId: string, dbConfig: IDatabaseConfig, id: string, fecha?: Date) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const camarero = await CamareroModel.findById(id);
    if (!camarero) {
      throw new Error('Camarero no encontrado');
    }

    // TODO: Implementar agregaciones reales con ventas
    return {
      camareroId: id,
      nombre: camarero.nombre,
      propinasAcumuladas: camarero.propinasAcumuladas,
      estado: camarero.estado,
      salonesAsignados: camarero.salonesAsignados.length,
      ventasHoy: 0,
      propinasHoy: 0,
      mesasAtendidas: 0,
      tiempoMedioServicio: 0,
    };
  }

  async getResumenGeneral(empresaId: string, dbConfig: IDatabaseConfig) {
    const CamareroModel = await this.getModelo(empresaId, dbConfig);
    const [
      totalCamareros,
      activos,
      enDescanso,
      fueraTurno,
      totalPropinas,
    ] = await Promise.all([
      CamareroModel.countDocuments({ activo: true }),
      CamareroModel.countDocuments({ activo: true, estado: EstadoCamarero.ACTIVO }),
      CamareroModel.countDocuments({ activo: true, estado: EstadoCamarero.EN_DESCANSO }),
      CamareroModel.countDocuments({ activo: true, estado: EstadoCamarero.FUERA_TURNO }),
      CamareroModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: null, total: { $sum: '$propinasAcumuladas' } } },
      ]),
    ]);

    return {
      totalCamareros,
      activos,
      enDescanso,
      fueraTurno,
      totalPropinas: totalPropinas[0]?.total || 0,
    };
  }
}

// Exportar instancia singleton
export const camarerosService = new CamarerosService();
