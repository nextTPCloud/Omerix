import mongoose from 'mongoose';
import VistaGuardada, { IVistaGuardada } from './VistaGuardada';
import {
  CreateVistaGuardadaDto,
  UpdateVistaGuardadaDto,
  GetVistasGuardadasQueryDto,
} from './vistas-guardadas.dto';

/**
 * ============================================
 * VISTAS GUARDADAS SERVICE
 * ============================================
 */

class VistasGuardadasService {
  /**
   * Obtener todas las vistas de un usuario para un módulo específico
   */
  async findAll(
    usuarioId: string,
    empresaId: string,
    query: GetVistasGuardadasQueryDto
  ): Promise<IVistaGuardada[]> {
    const filter: any = {
      empresaId: new mongoose.Types.ObjectId(empresaId),
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

    // 🔧 CORREGIDO: Quitar .lean() para mantener compatibilidad de tipos
    const vistas = await VistaGuardada.find(filter)
      .sort({ esDefault: -1, createdAt: -1 });

    return vistas;
  }

  /**
   * Obtener una vista por ID
   */
  async findById(
    id: string,
    usuarioId: string,
    empresaId: string
  ): Promise<IVistaGuardada | null> {
    // 🔧 CORREGIDO: Quitar .lean()
    const vista = await VistaGuardada.findOne({
      _id: new mongoose.Types.ObjectId(id),
      $or: [
        { usuarioId: new mongoose.Types.ObjectId(usuarioId) },
        { compartida: true },
      ],
      empresaId: new mongoose.Types.ObjectId(empresaId),
    });

    return vista;
  }

  /**
   * Obtener la vista por defecto de un módulo
   */
  async findDefault(
    usuarioId: string,
    empresaId: string,
    modulo: string
  ): Promise<IVistaGuardada | null> {
    // 🔧 CORREGIDO: Quitar .lean()
    const vista = await VistaGuardada.findOne({
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      empresaId: new mongoose.Types.ObjectId(empresaId),
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
    data: CreateVistaGuardadaDto
  ): Promise<IVistaGuardada> {
    // Si se marca como default, quitar el default de las demás vistas
    if (data.esDefault) {
      await VistaGuardada.updateMany(
        {
          usuarioId: new mongoose.Types.ObjectId(usuarioId),
          empresaId: new mongoose.Types.ObjectId(empresaId),
          modulo: data.modulo,
        },
        { $set: { esDefault: false } }
      );
    }

    const vista = new VistaGuardada({
      _id: new mongoose.Types.ObjectId(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      empresaId: new mongoose.Types.ObjectId(empresaId),
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
    data: UpdateVistaGuardadaDto
  ): Promise<IVistaGuardada | null> {
    // Verificar que la vista existe y pertenece al usuario
    const vista = await VistaGuardada.findOne({
      _id: new mongoose.Types.ObjectId(id),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      empresaId: new mongoose.Types.ObjectId(empresaId),
    });

    if (!vista) {
      return null;
    }

    // Si se marca como default, quitar el default de las demás vistas
    if (data.esDefault && !vista.esDefault) {
      await VistaGuardada.updateMany(
        {
          usuarioId: new mongoose.Types.ObjectId(usuarioId),
          empresaId: new mongoose.Types.ObjectId(empresaId),
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
    empresaId: string
  ): Promise<boolean> {
    const result = await VistaGuardada.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      empresaId: new mongoose.Types.ObjectId(empresaId),
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
    nuevoNombre?: string
  ): Promise<IVistaGuardada | null> {
    const vistaOriginal = await this.findById(id, usuarioId, empresaId);

    if (!vistaOriginal) {
      return null;
    }

    const vistaDuplicada = new VistaGuardada({
      _id: new mongoose.Types.ObjectId(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      empresaId: new mongoose.Types.ObjectId(empresaId),
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
    empresaId: string
  ): Promise<IVistaGuardada | null> {
    const vista = await VistaGuardada.findOne({
      _id: new mongoose.Types.ObjectId(id),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      empresaId: new mongoose.Types.ObjectId(empresaId),
    });

    if (!vista) {
      return null;
    }

    // Quitar default de todas las demás vistas del módulo
    await VistaGuardada.updateMany(
      {
        usuarioId: new mongoose.Types.ObjectId(usuarioId),
        empresaId: new mongoose.Types.ObjectId(empresaId),
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