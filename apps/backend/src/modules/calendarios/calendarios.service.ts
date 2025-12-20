import mongoose from 'mongoose';
import { IDatabaseConfig } from '@/models/Empresa';
import {
  getModeloCalendarioLaboral,
  ICalendarioLaboral,
  IFestivo,
  FESTIVOS_NACIONALES_2025,
  FESTIVOS_NACIONALES_2026,
} from './CalendarioLaboral';
import {
  CreateCalendarioDTO,
  UpdateCalendarioDTO,
  SearchCalendariosDTO,
  CreateFestivoDTO,
} from './calendarios.dto';

// ============================================
// SERVICIO DE CALENDARIOS
// ============================================

export const calendariosService = {
  /**
   * Crear un nuevo calendario con festivos nacionales
   */
  async crear(
    data: CreateCalendarioDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICalendarioLaboral> {
    const Calendario = await getModeloCalendarioLaboral(empresaId, dbConfig);

    // Si es por defecto, desmarcar otros
    if (data.esDefecto) {
      await Calendario.updateMany(
        { anio: data.anio, esDefecto: true },
        { esDefecto: false }
      );
    }

    // Incluir festivos nacionales si no se proporcionan
    let festivos = data.festivos || [];
    if (festivos.length === 0) {
      const festivosNacionales =
        data.anio === 2026 ? FESTIVOS_NACIONALES_2026 : FESTIVOS_NACIONALES_2025;
      festivos = festivosNacionales.map((f) => ({
        fecha: f.fecha.toISOString().split('T')[0],
        nombre: f.nombre,
        tipo: f.tipo,
        sustituible: f.sustituible,
      }));
    }

    const calendario = new Calendario({
      ...data,
      festivos: festivos.map((f) => ({
        ...f,
        fecha: new Date(f.fecha),
      })),
      creadoPor: usuarioId,
      modificadoPor: usuarioId,
    });

    await calendario.save();
    return calendario;
  },

  /**
   * Buscar calendarios con filtros
   */
  async buscar(
    params: SearchCalendariosDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{
    calendarios: ICalendarioLaboral[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const Calendario = await getModeloCalendarioLaboral(empresaId, dbConfig);

    const {
      anio,
      region,
      activo = 'true',
      page = 1,
      limit = 50,
      sortBy = 'anio',
      sortOrder = 'desc',
    } = params;

    const query: any = {};

    if (anio) {
      query.anio = anio;
    }

    if (region) {
      query.region = { $regex: region, $options: 'i' };
    }

    if (activo !== 'all') {
      query.activo = activo === 'true';
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [calendarios, total] = await Promise.all([
      Calendario.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Calendario.countDocuments(query),
    ]);

    return {
      calendarios: calendarios as ICalendarioLaboral[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Obtener calendario por ID
   */
  async obtenerPorId(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICalendarioLaboral | null> {
    const Calendario = await getModeloCalendarioLaboral(empresaId, dbConfig);
    return Calendario.findById(id).lean() as Promise<ICalendarioLaboral | null>;
  },

  /**
   * Obtener calendario por defecto de un año
   */
  async obtenerPorDefecto(
    anio: number,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICalendarioLaboral | null> {
    const Calendario = await getModeloCalendarioLaboral(empresaId, dbConfig);
    return Calendario.findOne({ anio, esDefecto: true, activo: true }).lean() as Promise<
      ICalendarioLaboral | null
    >;
  },

  /**
   * Actualizar calendario
   */
  async actualizar(
    id: string,
    data: UpdateCalendarioDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICalendarioLaboral | null> {
    const Calendario = await getModeloCalendarioLaboral(empresaId, dbConfig);

    // Si se marca como defecto, desmarcar otros
    if (data.esDefecto) {
      const current = await Calendario.findById(id);
      if (current) {
        await Calendario.updateMany(
          { anio: current.anio, esDefecto: true, _id: { $ne: id } },
          { esDefecto: false }
        );
      }
    }

    // Procesar festivos si se proporcionan
    const updateData: any = {
      ...data,
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
    };

    if (data.festivos) {
      updateData.festivos = data.festivos.map((f) => ({
        ...f,
        fecha: new Date(f.fecha),
      }));
    }

    const calendario = await Calendario.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();

    return calendario as ICalendarioLaboral | null;
  },

  /**
   * Eliminar calendario (soft delete)
   */
  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const Calendario = await getModeloCalendarioLaboral(empresaId, dbConfig);

    const result = await Calendario.findByIdAndUpdate(id, {
      activo: false,
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
    });

    return !!result;
  },

  /**
   * Agregar festivo a calendario
   */
  async agregarFestivo(
    calendarioId: string,
    festivo: CreateFestivoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICalendarioLaboral | null> {
    const Calendario = await getModeloCalendarioLaboral(empresaId, dbConfig);

    const nuevoFestivo: IFestivo = {
      fecha: new Date(festivo.fecha),
      nombre: festivo.nombre,
      tipo: festivo.tipo || 'empresa',
      sustituible: festivo.sustituible || false,
    };

    const calendario = await Calendario.findByIdAndUpdate(
      calendarioId,
      {
        $push: { festivos: nuevoFestivo },
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    ).lean();

    return calendario as ICalendarioLaboral | null;
  },

  /**
   * Eliminar festivo de calendario
   */
  async eliminarFestivo(
    calendarioId: string,
    festivoId: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICalendarioLaboral | null> {
    const Calendario = await getModeloCalendarioLaboral(empresaId, dbConfig);

    const calendario = await Calendario.findByIdAndUpdate(
      calendarioId,
      {
        $pull: { festivos: { _id: new mongoose.Types.ObjectId(festivoId) } },
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    ).lean();

    return calendario as ICalendarioLaboral | null;
  },

  /**
   * Verificar si una fecha es festivo
   */
  async esFestivo(
    fecha: Date,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{ esFestivo: boolean; festivo?: IFestivo }> {
    const anio = fecha.getFullYear();
    const calendario = await this.obtenerPorDefecto(anio, empresaId, dbConfig);

    if (!calendario) {
      return { esFestivo: false };
    }

    const fechaStr = fecha.toISOString().split('T')[0];
    const festivo = calendario.festivos.find((f) => {
      const fStr = new Date(f.fecha).toISOString().split('T')[0];
      return fStr === fechaStr;
    });

    return {
      esFestivo: !!festivo,
      festivo: festivo,
    };
  },

  /**
   * Obtener festivos nacionales predefinidos
   */
  obtenerFestivosNacionales(anio: number): IFestivo[] {
    if (anio === 2026) {
      return FESTIVOS_NACIONALES_2026;
    }
    return FESTIVOS_NACIONALES_2025;
  },

  /**
   * Obtener calendarios activos
   */
  async obtenerActivos(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICalendarioLaboral[]> {
    const Calendario = await getModeloCalendarioLaboral(empresaId, dbConfig);

    return Calendario.find({ activo: true })
      .sort({ anio: -1, esDefecto: -1 })
      .lean() as Promise<ICalendarioLaboral[]>;
  },
};
