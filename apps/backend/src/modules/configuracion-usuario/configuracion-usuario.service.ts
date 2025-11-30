import mongoose from 'mongoose';
import ConfiguracionUsuario, {
  IConfiguracionUsuario,
  IModuleConfig,
  IFavorito,
} from '@/modules/configuracion-usuario/ConfiguracionUsuario';
import {
  UpdateModuleConfigBodyDto,
  ResetModuleConfigBodyDto,
  UpdateColumnasBodyDto,
  UpdateSortConfigBodyDto,
  UpdateColumnFiltersBodyDto,
  UpdatePaginationLimitBodyDto,
  AddFavoritoBodyDto,
  RemoveFavoritoBodyDto,
  ReorderFavoritosBodyDto,
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

  /**
   * ============================================
   * FAVORITOS
   * ============================================
   */

  /**
   * Obtener favoritos de un usuario
   */
  async getFavoritos(
    usuarioId: string,
    empresaId: string
  ): Promise<IFavorito[]> {
    const configuracion = await this.findByUserId(usuarioId, empresaId);

    if (!configuracion) {
      return [];
    }

    return configuracion.favoritos || [];
  }

  /**
   * Agregar un favorito
   */
  async addFavorito(
    usuarioId: string,
    empresaId: string,
    data: AddFavoritoBodyDto
  ): Promise<IConfiguracionUsuario> {
    const configuracion = await this.findOrCreate(usuarioId, empresaId);

    // Verificar si ya existe
    const existente = configuracion.favoritos.find(f => f.href === data.href);
    if (existente) {
      return configuracion;
    }

    // Calcular el siguiente orden
    const maxOrden = configuracion.favoritos.reduce(
      (max, f) => Math.max(max, f.orden),
      -1
    );

    // Agregar el nuevo favorito
    configuracion.favoritos.push({
      href: data.href,
      title: data.title,
      icon: data.icon,
      orden: maxOrden + 1,
      fechaAgregado: new Date(),
    });

    configuracion.markModified('favoritos');
    await configuracion.save();

    return configuracion;
  }

  /**
   * Eliminar un favorito
   */
  async removeFavorito(
    usuarioId: string,
    empresaId: string,
    data: RemoveFavoritoBodyDto
  ): Promise<IConfiguracionUsuario> {
    const configuracion = await this.findOrCreate(usuarioId, empresaId);

    // Filtrar el favorito a eliminar
    configuracion.favoritos = configuracion.favoritos.filter(
      f => f.href !== data.href
    );

    configuracion.markModified('favoritos');
    await configuracion.save();

    return configuracion;
  }

  /**
   * Reordenar favoritos
   */
  async reorderFavoritos(
    usuarioId: string,
    empresaId: string,
    data: ReorderFavoritosBodyDto
  ): Promise<IConfiguracionUsuario> {
    const configuracion = await this.findOrCreate(usuarioId, empresaId);

    // Actualizar el orden de cada favorito
    for (const item of data.favoritos) {
      const favorito = configuracion.favoritos.find(f => f.href === item.href);
      if (favorito) {
        favorito.orden = item.orden;
      }
    }

    // Ordenar por orden
    configuracion.favoritos.sort((a, b) => a.orden - b.orden);

    configuracion.markModified('favoritos');
    await configuracion.save();

    return configuracion;
  }

  /**
   * Verificar si una ruta es favorita
   */
  async isFavorito(
    usuarioId: string,
    empresaId: string,
    href: string
  ): Promise<boolean> {
    const favoritos = await this.getFavoritos(usuarioId, empresaId);
    return favoritos.some(f => f.href === href);
  }

}

export default new ConfiguracionUsuarioService();