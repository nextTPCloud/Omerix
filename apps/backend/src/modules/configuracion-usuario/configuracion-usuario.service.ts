import mongoose from 'mongoose';
import ConfiguracionUsuario, {
  IConfiguracionUsuario,
  IModuleConfig,
} from '@/modules/configuracion-usuario/ConfiguracionUsuario';
import {
  UpdateModuleConfigBodyDto,
  ResetModuleConfigBodyDto,
  UpdateColumnasBodyDto,
  UpdateSortConfigBodyDto,
  UpdateColumnFiltersBodyDto,
  UpdatePaginationLimitBodyDto,
} from './configuracion-usuario.dto';

/**
 * ============================================
 * CONFIGURACION USUARIO SERVICE
 * ============================================
 */

class ConfiguracionUsuarioService {
  /**
   * Obtener la configuración completa de un usuario
   */
  async findByUserId(
    usuarioId: string,
    empresaId: string
  ): Promise<IConfiguracionUsuario | null> {
    const configuracion = await ConfiguracionUsuario.findOne({
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      empresaId: new mongoose.Types.ObjectId(empresaId),
    });

    return configuracion;
  }

  /**
   * Obtener la configuración de un módulo específico
   */
  async findModuleConfig(
    usuarioId: string,
    empresaId: string,
    modulo: string
  ): Promise<IModuleConfig | null> {
    const configuracion = await this.findByUserId(usuarioId, empresaId);

    if (!configuracion) {
      return null;
    }

    // Retornar la configuración del módulo si existe
    return (configuracion.configuraciones as any)[modulo] || null;
  }

  /**
   * Crear configuración inicial para un usuario
   */
  async create(
    usuarioId: string,
    empresaId: string
  ): Promise<IConfiguracionUsuario> {
    const configuracion = new ConfiguracionUsuario({
      _id: new mongoose.Types.ObjectId(),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      empresaId: new mongoose.Types.ObjectId(empresaId),
      configuraciones: {},
    });

    await configuracion.save();
    return configuracion;
  }

  /**
   * Obtener o crear configuración de usuario
   */
  async findOrCreate(
    usuarioId: string,
    empresaId: string
  ): Promise<IConfiguracionUsuario> {
    let configuracion = await this.findByUserId(usuarioId, empresaId);

    if (!configuracion) {
      configuracion = await this.create(usuarioId, empresaId);
    }

    return configuracion;
  }

  /**
   * Actualizar configuración completa de un módulo
   */
  async updateModuleConfig(
    usuarioId: string,
    empresaId: string,
    data: UpdateModuleConfigBodyDto
  ): Promise<IConfiguracionUsuario> {
    const configuracion = await this.findOrCreate(usuarioId, empresaId);

    // Actualizar el módulo específico
    (configuracion.configuraciones as any)[data.modulo] = data.configuracion;

    // Marcar como modificado para que Mongoose detecte el cambio
    configuracion.markModified('configuraciones');

    await configuracion.save();
    return configuracion;
  }

  /**
   * Restablecer configuración de un módulo (eliminarla)
   */
  async resetModuleConfig(
    usuarioId: string,
    empresaId: string,
    data: ResetModuleConfigBodyDto
  ): Promise<IConfiguracionUsuario> {
    const configuracion = await this.findOrCreate(usuarioId, empresaId);

    // Eliminar la configuración del módulo
    delete (configuracion.configuraciones as any)[data.modulo];

    configuracion.markModified('configuraciones');
    await configuracion.save();

    return configuracion;
  }

  /**
   * Actualizar solo las columnas de un módulo
   */
  async updateColumnas(
    usuarioId: string,
    empresaId: string,
    data: UpdateColumnasBodyDto
  ): Promise<IConfiguracionUsuario> {
    const configuracion = await this.findOrCreate(usuarioId, empresaId);

    // Obtener configuración actual del módulo o crear una nueva
    const moduleConfig: IModuleConfig = (configuracion.configuraciones as any)[
      data.modulo
    ] || {
      columnas: [],
    };

    moduleConfig.columnas = data.columnas;

    (configuracion.configuraciones as any)[data.modulo] = moduleConfig;
    configuracion.markModified('configuraciones');

    await configuracion.save();
    return configuracion;
  }

  /**
   * Actualizar solo el ordenamiento de un módulo
   */
  async updateSortConfig(
    usuarioId: string,
    empresaId: string,
    data: UpdateSortConfigBodyDto
  ): Promise<IConfiguracionUsuario> {
    const configuracion = await this.findOrCreate(usuarioId, empresaId);

    const moduleConfig: IModuleConfig = (configuracion.configuraciones as any)[
      data.modulo
    ] || {
      columnas: [],
    };

    moduleConfig.sortConfig = data.sortConfig;

    (configuracion.configuraciones as any)[data.modulo] = moduleConfig;
    configuracion.markModified('configuraciones');

    await configuracion.save();
    return configuracion;
  }

  /**
   * Actualizar solo los filtros de columna de un módulo
   */
  async updateColumnFilters(
    usuarioId: string,
    empresaId: string,
    data: UpdateColumnFiltersBodyDto
  ): Promise<IConfiguracionUsuario> {
    const configuracion = await this.findOrCreate(usuarioId, empresaId);

    const moduleConfig: IModuleConfig = (configuracion.configuraciones as any)[
      data.modulo
    ] || {
      columnas: [],
    };

    moduleConfig.columnFilters = data.columnFilters;

    (configuracion.configuraciones as any)[data.modulo] = moduleConfig;
    configuracion.markModified('configuraciones');

    await configuracion.save();
    return configuracion;
  }

  /**
   * Actualizar solo el límite de paginación de un módulo
   */
  async updatePaginationLimit(
    usuarioId: string,
    empresaId: string,
    data: UpdatePaginationLimitBodyDto
  ): Promise<IConfiguracionUsuario> {
    const configuracion = await this.findOrCreate(usuarioId, empresaId);

    const moduleConfig: IModuleConfig = (configuracion.configuraciones as any)[
      data.modulo
    ] || {
      columnas: [],
    };

    if (!moduleConfig.paginacion) {
      moduleConfig.paginacion = { limit: data.limit };
    } else {
      moduleConfig.paginacion.limit = data.limit;
    }

    (configuracion.configuraciones as any)[data.modulo] = moduleConfig;
    configuracion.markModified('configuraciones');

    await configuracion.save();
    return configuracion;
  }

  /**
   * Eliminar todas las configuraciones de un usuario
   */
  async deleteByUserId(
    usuarioId: string,
    empresaId: string
  ): Promise<boolean> {
    const result = await ConfiguracionUsuario.deleteOne({
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      empresaId: new mongoose.Types.ObjectId(empresaId),
    });

    return result.deletedCount > 0;
  }

  /**
 * Actualizar solo la densidad de un módulo
 */
  async updateDensidad(
    usuarioId: string,
    empresaId: string,
    data: { modulo: string; densidad: 'compact' | 'normal' | 'comfortable' }
  ): Promise<IConfiguracionUsuario> {
    const configuracion = await this.findOrCreate(usuarioId, empresaId);

    const moduleConfig: IModuleConfig = (configuracion.configuraciones as any)[
      data.modulo
    ] || {
      columnas: [],
    };

    moduleConfig.densidad = data.densidad;

    (configuracion.configuraciones as any)[data.modulo] = moduleConfig;
    configuracion.markModified('configuraciones');

    await configuracion.save();
    return configuracion;
  }

}

export default new ConfiguracionUsuarioService();