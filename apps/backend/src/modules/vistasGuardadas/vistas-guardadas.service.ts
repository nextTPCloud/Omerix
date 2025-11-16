import mongoose from 'mongoose';
import { IVistaGuardada } from './VistaGuardada';
import {
  CreateVistaGuardadaDto,
  UpdateVistaGuardadaDto,
  GetVistasGuardadasQueryDto,
} from './vistas-guardadas.dto';
import { getVistaGuardadaModel } from '@/utils/dynamic-models.helper';
import { IDatabaseConfig } from '@/models/Empresa';

/**
 * ============================================
 * VISTAS GUARDADAS SERVICE (Multi-DB)
 * ============================================
 */

class VistasGuardadasService {
  /**
   * Obtener todas las vistas de un usuario para un módulo específico
   */
  async findAll(
    usuarioId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    query: GetVistasGuardadasQueryDto
  ): Promise<IVistaGuardada[]> {
    const VistaGuardadaModel = await getVistaGuardadaModel(empresaId, dbConfig);

    const filter: any = {
      modulo: query.modulo,
    };

    // Si se incluyen compartidas, usar $or
    if (query.incluirCompartidas) {
      filter.$or = [
        { usuarioId: new mongoose.Types.ObjectId(usuarioId) },
        { compartida: true },
      ];
    } else {
      filter.usuarioId = new mongoose.Types.ObjectId(usuarioId);
    }

    const vistas = await VistaGuardadaModel.find(filter)
      .sort({ esDefault: -1, createdAt: -1 });

    return vistas;
  }

  /**
   * Obtener una vista por ID
   */
  async findById(
    id: string,
    usuarioId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IVistaGuardada | null> {
    const VistaGuardadaModel = await getVistaGuardadaModel(empresaId, dbConfig);

    const vista = await VistaGuardadaModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      $or: [
        { usuarioId: new mongoose.Types.ObjectId(usuarioId) },
        { compartida: true },
      ],
    });

    return vista;
  }

  /**
   * Obtener la vista por defecto de un módulo
   */
  async findDefault(
    usuarioId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    modulo: string
  ): Promise<IVistaGuardada | null> {
    const VistaGuardadaModel = await getVistaGuardadaModel(empresaId, dbConfig);

    const vista = await VistaGuardadaModel.findOne({
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      modulo,
      esDefault: true,
    });

    return vista;
  }

  /**
   * Crear una nueva vista guardada
   */
  async create(
    usuarioId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    data: CreateVistaGuardadaDto
  ): Promise<IVistaGuardada> {
    const VistaGuardadaModel = await getVistaGuardadaModel(empresaId, dbConfig);

    // Si se marca como default, quitar el default de las demás vistas
    if (data.esDefault) {
      await VistaGuardadaModel.updateMany(
        {
          usuarioId: new mongoose.Types.ObjectId(usuarioId),
          modulo: data.modulo,
        },
        { $set: { esDefault: false } }
      );
    }

    const vista = new VistaGuardadaModel({
      _id: new mongoose.Types.ObjectId(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      ...data,
    });

    await vista.save();
    return vista;
  }

  /**
   * Actualizar una vista guardada
   */
  async update(
    id: string,
    usuarioId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    data: UpdateVistaGuardadaDto
  ): Promise<IVistaGuardada | null> {
    const VistaGuardadaModel = await getVistaGuardadaModel(empresaId, dbConfig);

    // Verificar que la vista existe y pertenece al usuario
    const vista = await VistaGuardadaModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
    });

    if (!vista) {
      return null;
    }

    // Si se marca como default, quitar el default de las demás vistas
    if (data.esDefault && !vista.esDefault) {
      await VistaGuardadaModel.updateMany(
        {
          usuarioId: new mongoose.Types.ObjectId(usuarioId),
          modulo: vista.modulo,
          _id: { $ne: vista._id },
        },
        { $set: { esDefault: false } }
      );
    }

    // Actualizar la vista
    Object.assign(vista, data);
    await vista.save();

    return vista;
  }

  /**
   * Eliminar una vista guardada
   */
  async delete(
    id: string,
    usuarioId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const VistaGuardadaModel = await getVistaGuardadaModel(empresaId, dbConfig);

    const result = await VistaGuardadaModel.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
    });

    return result.deletedCount > 0;
  }

  /**
   * Duplicar una vista guardada
   */
  async duplicate(
    id: string,
    usuarioId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    nuevoNombre?: string
  ): Promise<IVistaGuardada | null> {
    const VistaGuardadaModel = await getVistaGuardadaModel(empresaId, dbConfig);

    const vistaOriginal = await this.findById(id, usuarioId, empresaId, dbConfig);

    if (!vistaOriginal) {
      return null;
    }

    const vistaDuplicada = new VistaGuardadaModel({
      _id: new mongoose.Types.ObjectId(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      modulo: vistaOriginal.modulo,
      nombre: nuevoNombre || `${vistaOriginal.nombre} (copia)`,
      descripcion: vistaOriginal.descripcion,
      configuracion: vistaOriginal.configuracion,
      esDefault: false, // La copia nunca es default
      compartida: false,
      icono: vistaOriginal.icono,
      color: vistaOriginal.color,
    });

    await vistaDuplicada.save();
    return vistaDuplicada;
  }

  /**
   * Establecer una vista como predeterminada
   */
  async setDefault(
    id: string,
    usuarioId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IVistaGuardada | null> {
    const VistaGuardadaModel = await getVistaGuardadaModel(empresaId, dbConfig);

    const vista = await VistaGuardadaModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
    });

    if (!vista) {
      return null;
    }

    // Quitar default de todas las demás vistas del módulo
    await VistaGuardadaModel.updateMany(
      {
        usuarioId: new mongoose.Types.ObjectId(usuarioId),
        modulo: vista.modulo,
        _id: { $ne: vista._id },
      },
      { $set: { esDefault: false } }
    );

    // Establecer esta vista como default
    vista.esDefault = true;
    await vista.save();

    return vista;
  }
}

export default new VistasGuardadasService();