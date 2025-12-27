import { Types } from 'mongoose';
import Usuario, { IUsuario } from './Usuario';
import { ROLE_HIERARCHY, Role } from '../../types/permissions.types';

// Roles que pueden gestionar usuarios
export const ROLES_GESTION_USUARIOS = ['superadmin', 'admin'];

/**
 * DTO para crear un usuario
 */
export interface CreateUsuarioDTO {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  rol: Role;
  rolId?: string;
  activo?: boolean;
}

/**
 * DTO para actualizar un usuario
 */
export interface UpdateUsuarioDTO {
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  rol?: Role;
  rolId?: string;
  personalId?: string | null;  // Vinculación con empleado para fichaje (guardado en UsuarioEmpresa)
  activo?: boolean;
  avatar?: string;
  // pinTPV ahora se guarda en UsuarioEmpresa, no en Usuario
}

/**
 * Opciones de filtrado para listar usuarios
 */
export interface UsuariosFilterOptions {
  activo?: boolean;
  rol?: Role;
  busqueda?: string;
  page?: number;
  limit?: number;
}

class UsuariosService {
  /**
   * Obtener todos los usuarios de una empresa
   * @param ocultarSuperadmin - Si true, no incluye usuarios superadmin en los resultados
   */
  async getUsuariosByEmpresa(
    empresaId: string,
    options: UsuariosFilterOptions = {},
    ocultarSuperadmin: boolean = false
  ): Promise<{ usuarios: IUsuario[]; total: number }> {
    const filter: any = { empresaId: new Types.ObjectId(empresaId) };

    // Ocultar superadmin si no eres superadmin
    if (ocultarSuperadmin) {
      filter.rol = { $ne: 'superadmin' };
    }

    if (options.activo !== undefined) {
      filter.activo = options.activo;
    }

    if (options.rol) {
      // Si ya hay filtro de rol por $ne, combinamos con $and
      if (filter.rol && filter.rol.$ne) {
        filter.$and = [
          { rol: { $ne: 'superadmin' } },
          { rol: options.rol }
        ];
        delete filter.rol;
      } else {
        filter.rol = options.rol;
      }
    }

    if (options.busqueda) {
      const regex = new RegExp(options.busqueda, 'i');
      filter.$or = [
        { nombre: regex },
        { apellidos: regex },
        { email: regex },
      ];
    }

    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const [usuarios, total] = await Promise.all([
      Usuario.find(filter)
        .select('-password -twoFactorSecret -resetPasswordToken -resetPasswordExpires')
        .populate('rolId', 'nombre codigo color')
        // personalId ahora viene de UsuarioEmpresa (el controller lo enriquece)
        .sort({ nombre: 1, apellidos: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Usuario.countDocuments(filter),
    ]);

    return { usuarios: usuarios as IUsuario[], total };
  }

  /**
   * Obtener un usuario por ID
   */
  async getUsuarioById(usuarioId: string, empresaId: string): Promise<IUsuario | null> {
    return Usuario.findOne({
      _id: new Types.ObjectId(usuarioId),
      empresaId: new Types.ObjectId(empresaId),
    })
      .select('-password -twoFactorSecret -resetPasswordToken -resetPasswordExpires')
      .populate('rolId', 'nombre codigo color permisos')
      // personalId ahora viene de UsuarioEmpresa (el controller lo enriquece)
      .lean();
  }

  /**
   * Obtener un usuario por email
   */
  async getUsuarioByEmail(email: string): Promise<IUsuario | null> {
    return Usuario.findOne({ email: email.toLowerCase() })
      .select('-password -twoFactorSecret -resetPasswordToken -resetPasswordExpires')
      .lean();
  }

  /**
   * Crear un nuevo usuario
   * @param empresaId - ID de la empresa
   * @param data - Datos del usuario
   * @param creadorRol - Rol del usuario que crea (para validar jerarquía)
   */
  async createUsuario(
    empresaId: string,
    data: CreateUsuarioDTO,
    creadorRol: Role
  ): Promise<IUsuario> {
    // Verificar que el email no exista
    const existente = await Usuario.findOne({ email: data.email.toLowerCase() });
    if (existente) {
      throw new Error('Ya existe un usuario con este email');
    }

    // Verificar jerarquía de roles: no puede crear usuarios con rol superior al suyo
    if (!this.canAssignRole(creadorRol, data.rol)) {
      throw new Error(`No puedes asignar el rol "${data.rol}". Solo puedes asignar roles de nivel igual o inferior al tuyo.`);
    }

    // No permitir crear superadmin desde la UI
    if (data.rol === 'superadmin') {
      throw new Error('No se puede crear usuarios con rol superadmin');
    }

    const usuario = new Usuario({
      empresaId: new Types.ObjectId(empresaId),
      email: data.email.toLowerCase(),
      password: data.password,
      nombre: data.nombre,
      apellidos: data.apellidos,
      telefono: data.telefono,
      rol: data.rol,
      rolId: data.rolId ? new Types.ObjectId(data.rolId) : undefined,
      activo: data.activo !== undefined ? data.activo : true,
      emailVerificado: false,
    });

    await usuario.save();

    // Devolver sin campos sensibles
    const usuarioCreado = await this.getUsuarioById(String(usuario._id), empresaId);
    return usuarioCreado!;
  }

  /**
   * Actualizar un usuario existente
   */
  async updateUsuario(
    usuarioId: string,
    empresaId: string,
    data: UpdateUsuarioDTO,
    editorRol: Role,
    editorId: string
  ): Promise<IUsuario | null> {
    // Verificar que el usuario existe y pertenece a la empresa
    const usuario = await Usuario.findOne({
      _id: new Types.ObjectId(usuarioId),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!usuario) {
      return null;
    }

    // No permitir editar superadmin (excepto si eres superadmin)
    if (usuario.rol === 'superadmin' && editorRol !== 'superadmin') {
      throw new Error('No puedes editar usuarios superadmin');
    }

    // Verificar jerarquía si se cambia el rol
    if (data.rol && data.rol !== usuario.rol) {
      if (!this.canAssignRole(editorRol, data.rol)) {
        throw new Error(`No puedes asignar el rol "${data.rol}". Solo puedes asignar roles de nivel igual o inferior al tuyo.`);
      }

      // No permitir asignar superadmin
      if (data.rol === 'superadmin') {
        throw new Error('No se puede asignar el rol superadmin');
      }
    }

    // No permitir desactivarse a uno mismo
    if (usuarioId === editorId && data.activo === false) {
      throw new Error('No puedes desactivar tu propia cuenta');
    }

    const updateData: any = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.apellidos !== undefined) updateData.apellidos = data.apellidos;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.rol !== undefined) updateData.rol = data.rol;
    if (data.rolId !== undefined) {
      updateData.rolId = data.rolId ? new Types.ObjectId(data.rolId) : null;
    }
    // personalId y pinTPV ahora se guardan en UsuarioEmpresa, no en Usuario
    // (lo maneja el controller)
    if (data.activo !== undefined) updateData.activo = data.activo;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    await Usuario.findByIdAndUpdate(usuarioId, { $set: updateData });

    return this.getUsuarioById(usuarioId, empresaId);
  }

  /**
   * Cambiar contraseña de un usuario (por admin)
   */
  async changePassword(
    usuarioId: string,
    empresaId: string,
    newPassword: string,
    editorRol: Role
  ): Promise<boolean> {
    const usuario = await Usuario.findOne({
      _id: new Types.ObjectId(usuarioId),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!usuario) {
      return false;
    }

    // No permitir cambiar contraseña de superadmin (excepto si eres superadmin)
    if (usuario.rol === 'superadmin' && editorRol !== 'superadmin') {
      throw new Error('No puedes cambiar la contraseña de usuarios superadmin');
    }

    // Verificar jerarquía
    if (!this.canManageUser(editorRol, usuario.rol as Role)) {
      throw new Error('No tienes permisos para cambiar la contraseña de este usuario');
    }

    usuario.password = newPassword; // Se hasheará automáticamente por el middleware pre-save
    await usuario.save();

    return true;
  }

  /**
   * Eliminar/desactivar un usuario
   * Por seguridad, no eliminamos usuarios, solo los desactivamos
   */
  async deleteUsuario(
    usuarioId: string,
    empresaId: string,
    editorRol: Role,
    editorId: string
  ): Promise<boolean> {
    const usuario = await Usuario.findOne({
      _id: new Types.ObjectId(usuarioId),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!usuario) {
      return false;
    }

    // No permitir eliminar superadmin
    if (usuario.rol === 'superadmin') {
      throw new Error('No puedes eliminar usuarios superadmin');
    }

    // No permitir eliminarse a uno mismo
    if (usuarioId === editorId) {
      throw new Error('No puedes eliminar tu propia cuenta');
    }

    // Verificar jerarquía
    if (!this.canManageUser(editorRol, usuario.rol as Role)) {
      throw new Error('No tienes permisos para eliminar este usuario');
    }

    // Desactivar en lugar de eliminar
    await Usuario.findByIdAndUpdate(usuarioId, {
      $set: { activo: false },
    });

    return true;
  }

  /**
   * Eliminar usuario permanentemente (solo superadmin)
   */
  async deleteUsuarioPermanente(
    usuarioId: string,
    empresaId: string,
    editorRol: Role
  ): Promise<boolean> {
    if (editorRol !== 'superadmin') {
      throw new Error('Solo superadmin puede eliminar usuarios permanentemente');
    }

    const usuario = await Usuario.findOne({
      _id: new Types.ObjectId(usuarioId),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!usuario) {
      return false;
    }

    // No permitir eliminar superadmin
    if (usuario.rol === 'superadmin') {
      throw new Error('No puedes eliminar usuarios superadmin');
    }

    await Usuario.deleteOne({ _id: new Types.ObjectId(usuarioId) });
    return true;
  }

  /**
   * Reactivar un usuario desactivado
   */
  async reactivarUsuario(
    usuarioId: string,
    empresaId: string,
    editorRol: Role
  ): Promise<IUsuario | null> {
    const usuario = await Usuario.findOne({
      _id: new Types.ObjectId(usuarioId),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!usuario) {
      return null;
    }

    if (!this.canManageUser(editorRol, usuario.rol as Role)) {
      throw new Error('No tienes permisos para reactivar este usuario');
    }

    await Usuario.findByIdAndUpdate(usuarioId, {
      $set: { activo: true },
    });

    return this.getUsuarioById(usuarioId, empresaId);
  }

  /**
   * Obtener estadísticas de usuarios de la empresa
   */
  async getEstadisticas(empresaId: string): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    porRol: { rol: string; count: number }[];
  }> {
    const [total, activos, porRol] = await Promise.all([
      Usuario.countDocuments({ empresaId: new Types.ObjectId(empresaId) }),
      Usuario.countDocuments({ empresaId: new Types.ObjectId(empresaId), activo: true }),
      Usuario.aggregate([
        { $match: { empresaId: new Types.ObjectId(empresaId) } },
        { $group: { _id: '$rol', count: { $sum: 1 } } },
        { $project: { rol: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      total,
      activos,
      inactivos: total - activos,
      porRol,
    };
  }

  // =========================================
  // MÉTODOS DE VERIFICACIÓN DE JERARQUÍA
  // =========================================

  /**
   * Verificar si un rol puede asignar otro rol
   * Un usuario solo puede asignar roles de nivel igual o inferior
   */
  canAssignRole(creadorRol: Role, rolAAsignar: Role): boolean {
    const nivelCreador = ROLE_HIERARCHY[creadorRol] || 0;
    const nivelRol = ROLE_HIERARCHY[rolAAsignar] || 0;
    return nivelCreador >= nivelRol;
  }

  /**
   * Verificar si un usuario puede gestionar a otro según la jerarquía
   */
  canManageUser(editorRol: Role, targetRol: Role): boolean {
    const nivelEditor = ROLE_HIERARCHY[editorRol] || 0;
    const nivelTarget = ROLE_HIERARCHY[targetRol] || 0;
    // Puede gestionar si tiene nivel >= al del objetivo
    return nivelEditor >= nivelTarget;
  }

  /**
   * Obtener roles disponibles para asignar según el rol del creador
   */
  getRolesDisponibles(creadorRol: Role): Role[] {
    const nivelCreador = ROLE_HIERARCHY[creadorRol] || 0;
    const rolesDisponibles: Role[] = [];

    for (const [rol, nivel] of Object.entries(ROLE_HIERARCHY)) {
      // No incluir superadmin nunca
      if (rol === 'superadmin') continue;
      // Solo roles de nivel igual o inferior
      if (nivel <= nivelCreador) {
        rolesDisponibles.push(rol as Role);
      }
    }

    // Ordenar por nivel descendente
    return rolesDisponibles.sort(
      (a, b) => (ROLE_HIERARCHY[b] || 0) - (ROLE_HIERARCHY[a] || 0)
    );
  }
}

export const usuariosService = new UsuariosService();
export default usuariosService;
