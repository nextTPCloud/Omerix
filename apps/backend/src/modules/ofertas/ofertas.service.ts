import { Model, Types, FilterQuery } from 'mongoose';
import { IDatabaseConfig } from '../empresa/Empresa';
import { IOferta, TipoOferta } from './Oferta';
import { getOfertaModel } from '../../utils/dynamic-models.helper';
import {
  CreateOfertaDto,
  UpdateOfertaDto,
  GetOfertasQueryDto,
} from './ofertas.dto';

class OfertasService {
  /**
   * Obtener modelo de Oferta para la empresa
   */
  private async getModel(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<IOferta>> {
    return getOfertaModel(empresaId, dbConfig);
  }

  /**
   * Obtener todas las ofertas con paginacion y filtros
   */
  async getAll(
    query: GetOfertasQueryDto,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const OfertaModel = await this.getModel(empresaId, dbConfig);

    const {
      search,
      sortBy = 'nombre',
      sortOrder = 'asc',
      page = 1,
      limit = 25,
      activo,
      tipo,
      vigente,
    } = query;

    // Construir filtro
    const filter: FilterQuery<IOferta> = {
      empresaId: new Types.ObjectId(empresaId),
    };

    if (search) {
      filter.$or = [
        { codigo: { $regex: search, $options: 'i' } },
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
        { etiqueta: { $regex: search, $options: 'i' } },
      ];
    }

    if (activo !== undefined) {
      filter.activo = activo;
    }

    if (tipo) {
      filter.tipo = tipo;
    }

    if (vigente !== undefined) {
      const ahora = new Date();
      if (vigente) {
        filter.activo = true;
        filter.fechaDesde = { $lte: ahora };
        filter.$or = [
          { fechaHasta: { $exists: false } },
          { fechaHasta: null },
          { fechaHasta: { $gte: ahora } },
        ];
      }
    }

    // Contar total
    const total = await OfertaModel.countDocuments(filter);

    // Obtener datos paginados
    const ofertas = await OfertaModel.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      data: ofertas,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener oferta por ID
   */
  async getById(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const OfertaModel = await this.getModel(empresaId, dbConfig);

    const oferta = await OfertaModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    return oferta;
  }

  /**
   * Obtener ofertas vigentes (filtra también por hora y día de la semana)
   */
  async getVigentes(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const OfertaModel = await this.getModel(empresaId, dbConfig);
    const ahora = new Date();

    const ofertas = await OfertaModel.find({
      empresaId: new Types.ObjectId(empresaId),
      activo: true,
      fechaDesde: { $lte: ahora },
      $or: [
        { fechaHasta: { $exists: false } },
        { fechaHasta: null },
        { fechaHasta: { $gte: ahora } },
      ],
    })
      .sort({ prioridad: 1, nombre: 1 })
      .lean();

    // Filtrar por restricción horaria en memoria (HH:mm no es filtrable en MongoDB fácilmente)
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    const diaActual = ahora.getDay();

    return ofertas.filter((oferta: any) => {
      // Verificar día de la semana
      if (oferta.diasSemana && oferta.diasSemana.length > 0) {
        if (!oferta.diasSemana.includes(diaActual)) return false;
      }
      // Verificar rango horario
      if (oferta.horaDesde) {
        const [h, m] = oferta.horaDesde.split(':').map(Number);
        if (horaActual < h * 60 + m) return false;
      }
      if (oferta.horaHasta) {
        const [h, m] = oferta.horaHasta.split(':').map(Number);
        if (horaActual > h * 60 + m) return false;
      }
      return true;
    });
  }

  /**
   * Obtener happy hours activas en este momento
   */
  async getHappyHoursActivas(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const OfertaModel = await this.getModel(empresaId, dbConfig);
    const ahora = new Date();

    const ofertas = await OfertaModel.find({
      empresaId: new Types.ObjectId(empresaId),
      activo: true,
      esHappyHour: true,
      fechaDesde: { $lte: ahora },
      $or: [
        { fechaHasta: { $exists: false } },
        { fechaHasta: null },
        { fechaHasta: { $gte: ahora } },
      ],
    })
      .sort({ prioridad: 1, nombre: 1 })
      .lean();

    // Filtrar por horario actual
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    const diaActual = ahora.getDay();

    return ofertas.filter((oferta: any) => {
      if (oferta.diasSemana && oferta.diasSemana.length > 0) {
        if (!oferta.diasSemana.includes(diaActual)) return false;
      }
      if (oferta.horaDesde) {
        const [h, m] = oferta.horaDesde.split(':').map(Number);
        if (horaActual < h * 60 + m) return false;
      }
      if (oferta.horaHasta) {
        const [h, m] = oferta.horaHasta.split(':').map(Number);
        if (horaActual > h * 60 + m) return false;
      }
      return true;
    });
  }

  /**
   * Crear nueva oferta
   */
  async create(
    createDto: CreateOfertaDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ) {
    const OfertaModel = await this.getModel(empresaId, dbConfig);

    // Verificar codigo unico si se proporciona
    if (createDto.codigo) {
      const existente = await OfertaModel.findOne({
        empresaId: new Types.ObjectId(empresaId),
        codigo: createDto.codigo,
      });

      if (existente) {
        throw new Error(`Ya existe una oferta con el codigo ${createDto.codigo}`);
      }
    }

    // Convertir arrays de IDs a ObjectIds
    const ofertaData: any = {
      ...createDto,
      empresaId: new Types.ObjectId(empresaId),
      creadoPor: new Types.ObjectId(usuarioId),
    };

    if (createDto.productosIncluidos) {
      ofertaData.productosIncluidos = createDto.productosIncluidos.map(id => new Types.ObjectId(id));
    }
    if (createDto.productosExcluidos) {
      ofertaData.productosExcluidos = createDto.productosExcluidos.map(id => new Types.ObjectId(id));
    }
    if (createDto.familiasIncluidas) {
      ofertaData.familiasIncluidas = createDto.familiasIncluidas.map(id => new Types.ObjectId(id));
    }
    if (createDto.familiasExcluidas) {
      ofertaData.familiasExcluidas = createDto.familiasExcluidas.map(id => new Types.ObjectId(id));
    }
    if (createDto.clientesIncluidos) {
      ofertaData.clientesIncluidos = createDto.clientesIncluidos.map(id => new Types.ObjectId(id));
    }
    if (createDto.clientesExcluidos) {
      ofertaData.clientesExcluidos = createDto.clientesExcluidos.map(id => new Types.ObjectId(id));
    }
    if (createDto.tarifasIncluidas) {
      ofertaData.tarifasIncluidas = createDto.tarifasIncluidas.map(id => new Types.ObjectId(id));
    }

    const oferta = new OfertaModel(ofertaData);
    await oferta.save();

    return oferta;
  }

  /**
   * Actualizar oferta
   */
  async update(
    id: string,
    updateDto: UpdateOfertaDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ) {
    const OfertaModel = await this.getModel(empresaId, dbConfig);

    // Verificar que existe
    const oferta = await OfertaModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!oferta) {
      throw new Error('Oferta no encontrada');
    }

    // Verificar codigo unico si se cambia
    if (updateDto.codigo && updateDto.codigo !== oferta.codigo) {
      const existente = await OfertaModel.findOne({
        empresaId: new Types.ObjectId(empresaId),
        codigo: updateDto.codigo,
        _id: { $ne: new Types.ObjectId(id) },
      });

      if (existente) {
        throw new Error(`Ya existe una oferta con el codigo ${updateDto.codigo}`);
      }
    }

    // Convertir arrays de IDs a ObjectIds
    const updateData: any = { ...updateDto };

    if (updateDto.productosIncluidos) {
      updateData.productosIncluidos = updateDto.productosIncluidos.map(id => new Types.ObjectId(id));
    }
    if (updateDto.productosExcluidos) {
      updateData.productosExcluidos = updateDto.productosExcluidos.map(id => new Types.ObjectId(id));
    }
    if (updateDto.familiasIncluidas) {
      updateData.familiasIncluidas = updateDto.familiasIncluidas.map(id => new Types.ObjectId(id));
    }
    if (updateDto.familiasExcluidas) {
      updateData.familiasExcluidas = updateDto.familiasExcluidas.map(id => new Types.ObjectId(id));
    }
    if (updateDto.clientesIncluidos) {
      updateData.clientesIncluidos = updateDto.clientesIncluidos.map(id => new Types.ObjectId(id));
    }
    if (updateDto.clientesExcluidos) {
      updateData.clientesExcluidos = updateDto.clientesExcluidos.map(id => new Types.ObjectId(id));
    }
    if (updateDto.tarifasIncluidas) {
      updateData.tarifasIncluidas = updateDto.tarifasIncluidas.map(id => new Types.ObjectId(id));
    }

    // Actualizar
    Object.assign(oferta, updateData);
    oferta.modificadoPor = new Types.ObjectId(usuarioId);
    await oferta.save();

    return oferta;
  }

  /**
   * Eliminar oferta
   */
  async delete(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const OfertaModel = await this.getModel(empresaId, dbConfig);

    const result = await OfertaModel.deleteOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (result.deletedCount === 0) {
      throw new Error('Oferta no encontrada');
    }

    return { success: true };
  }

  /**
   * Eliminar multiples ofertas
   */
  async bulkDelete(
    ids: string[],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const OfertaModel = await this.getModel(empresaId, dbConfig);

    const result = await OfertaModel.deleteMany({
      _id: { $in: ids.map(id => new Types.ObjectId(id)) },
      empresaId: new Types.ObjectId(empresaId),
    });

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  }

  /**
   * Cambiar estado activo
   */
  async changeStatus(
    id: string,
    activo: boolean,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ) {
    const OfertaModel = await this.getModel(empresaId, dbConfig);

    const oferta = await OfertaModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        empresaId: new Types.ObjectId(empresaId),
      },
      {
        activo,
        modificadoPor: new Types.ObjectId(usuarioId),
      },
      { new: true }
    );

    if (!oferta) {
      throw new Error('Oferta no encontrada');
    }

    return oferta;
  }

  /**
   * Incrementar contador de usos
   */
  async incrementarUso(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const OfertaModel = await this.getModel(empresaId, dbConfig);

    const oferta = await OfertaModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        empresaId: new Types.ObjectId(empresaId),
      },
      {
        $inc: { usosActuales: 1 },
      },
      { new: true }
    );

    return oferta;
  }

  /**
   * Duplicar oferta
   */
  async duplicar(
    id: string,
    nuevoNombre: string,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ) {
    const OfertaModel = await this.getModel(empresaId, dbConfig);

    const original = await OfertaModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!original) {
      throw new Error('Oferta no encontrada');
    }

    const count = await OfertaModel.countDocuments({ empresaId: new Types.ObjectId(empresaId) });

    const nuevaOferta = new OfertaModel({
      ...original.toObject(),
      _id: new Types.ObjectId(),
      codigo: `OFE-${String(count + 1).padStart(3, '0')}`,
      nombre: nuevoNombre || `${original.nombre} (copia)`,
      usosActuales: 0,
      creadoPor: new Types.ObjectId(usuarioId),
      modificadoPor: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await nuevaOferta.save();
    return nuevaOferta;
  }
}

export const ofertasService = new OfertasService();
export default ofertasService;
