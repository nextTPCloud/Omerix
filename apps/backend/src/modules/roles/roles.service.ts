import { Types } from 'mongoose';
import Rol, {
  IRol,
  IPermisos,
  IPermisosEspeciales,
  AccionRecurso,
  RecursoSistema,
  ROLES_SISTEMA,
  PERMISOS_ESPECIALES_DEFAULT,
  PERMISOS_ESPECIALES_ADMIN,
} from './Rol';

// Roles permitidos para gestionar roles
export const ROLES_GESTION_ROLES = ['superadmin', 'admin'];

/**
 * DTO para crear un rol
 */
export interface CreateRolDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  rolBase?: 'admin' | 'gerente' | 'vendedor' | 'tecnico' | 'almacenero' | 'visualizador';
  permisos: IPermisos;
  color?: string;
  icono?: string;
  orden?: number;
}

/**
 * DTO para actualizar un rol
 */
export interface UpdateRolDTO {
  nombre?: string;
  descripcion?: string;
  permisos?: Partial<IPermisos>;
  color?: string;
  icono?: string;
  orden?: number;
  activo?: boolean;
}

/**
 * Opciones de filtrado para listar roles
 */
export interface RolesFilterOptions {
  activo?: boolean;
  incluirSistema?: boolean;
  busqueda?: string;
}

class RolesService {
  /**
   * Obtener todos los roles de una empresa
   */
  async getRolesByEmpresa(
    empresaId: string,
    options: RolesFilterOptions = {}
  ): Promise<IRol[]> {
    const filter: any = { empresaId: new Types.ObjectId(empresaId) };

    if (options.activo !== undefined) {
      filter.activo = options.activo;
    }

    if (options.incluirSistema === false) {
      filter.esSistema = false;
    }

    if (options.busqueda) {
      const regex = new RegExp(options.busqueda, 'i');
      filter.$or = [
        { nombre: regex },
        { codigo: regex },
        { descripcion: regex },
      ];
    }

    return Rol.find(filter)
      .sort({ orden: 1, nombre: 1 })
      .lean();
  }

  /**
   * Obtener un rol por ID
   */
  async getRolById(rolId: string, empresaId: string): Promise<IRol | null> {
    return Rol.findOne({
      _id: new Types.ObjectId(rolId),
      empresaId: new Types.ObjectId(empresaId),
    }).lean();
  }

  /**
   * Obtener un rol por código
   */
  async getRolByCodigo(codigo: string, empresaId: string): Promise<IRol | null> {
    return Rol.findOne({
      codigo: codigo.toLowerCase(),
      empresaId: new Types.ObjectId(empresaId),
    }).lean();
  }

  /**
   * Crear un nuevo rol
   */
  async createRol(
    empresaId: string,
    data: CreateRolDTO,
    creadoPor?: string
  ): Promise<IRol> {
    // Verificar que no existe un rol con el mismo código
    const existente = await this.getRolByCodigo(data.codigo, empresaId);
    if (existente) {
      throw new Error(`Ya existe un rol con el código "${data.codigo}"`);
    }

    // Obtener el mayor orden actual
    const ultimoRol = await Rol.findOne({ empresaId: new Types.ObjectId(empresaId) })
      .sort({ orden: -1 })
      .lean();
    const siguienteOrden = (ultimoRol?.orden || 0) + 1;

    const rol = new Rol({
      empresaId: new Types.ObjectId(empresaId),
      codigo: data.codigo.toLowerCase(),
      nombre: data.nombre,
      descripcion: data.descripcion,
      rolBase: data.rolBase,
      permisos: {
        recursos: data.permisos?.recursos || {},
        especiales: {
          ...PERMISOS_ESPECIALES_DEFAULT,
          ...data.permisos?.especiales,
        },
      },
      color: data.color || '#6b7280',
      icono: data.icono,
      orden: data.orden ?? siguienteOrden,
      activo: true,
      esSistema: false,
      creadoPor: creadoPor ? new Types.ObjectId(creadoPor) : undefined,
    });

    await rol.save();
    return rol.toObject();
  }

  /**
   * Actualizar un rol existente
   */
  async updateRol(
    rolId: string,
    empresaId: string,
    data: UpdateRolDTO,
    modificadoPor?: string
  ): Promise<IRol | null> {
    // Verificar que existe y pertenece a la empresa
    const rolExistente = await Rol.findOne({
      _id: new Types.ObjectId(rolId),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!rolExistente) {
      return null;
    }

    // No permitir modificar roles del sistema
    if (rolExistente.esSistema) {
      throw new Error('No se pueden modificar los roles del sistema');
    }

    const updateData: any = {
      modificadoPor: modificadoPor ? new Types.ObjectId(modificadoPor) : undefined,
    };

    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.icono !== undefined) updateData.icono = data.icono;
    if (data.orden !== undefined) updateData.orden = data.orden;
    if (data.activo !== undefined) updateData.activo = data.activo;

    // Actualizar permisos si se proporcionan
    if (data.permisos) {
      if (data.permisos.recursos) {
        updateData['permisos.recursos'] = {
          ...rolExistente.permisos.recursos,
          ...data.permisos.recursos,
        };
      }
      if (data.permisos.especiales) {
        updateData['permisos.especiales'] = {
          ...rolExistente.permisos.especiales,
          ...data.permisos.especiales,
        };
      }
    }

    const rol = await Rol.findByIdAndUpdate(
      rolId,
      { $set: updateData },
      { new: true }
    ).lean();

    return rol;
  }

  /**
   * Eliminar un rol
   */
  async deleteRol(rolId: string, empresaId: string): Promise<boolean> {
    const rol = await Rol.findOne({
      _id: new Types.ObjectId(rolId),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!rol) {
      return false;
    }

    // No permitir eliminar roles del sistema
    if (rol.esSistema) {
      throw new Error('No se pueden eliminar los roles del sistema');
    }

    // TODO: Verificar si hay usuarios con este rol asignado antes de eliminar

    await Rol.deleteOne({ _id: new Types.ObjectId(rolId) });
    return true;
  }

  /**
   * Obtener plantillas de roles del sistema
   * (para crear roles personalizados basados en ellas)
   */
  getRolesSistema(): Partial<IRol>[] {
    return ROLES_SISTEMA.map(rol => ({
      codigo: rol.codigo,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      rolBase: rol.rolBase,
      permisos: rol.permisos,
      color: rol.color,
    }));
  }

  /**
   * Inicializar roles del sistema para una empresa
   * Se ejecuta al crear una nueva empresa
   */
  async initializeRolesEmpresa(empresaId: string): Promise<IRol[]> {
    const rolesCreados: IRol[] = [];

    for (const rolTemplate of ROLES_SISTEMA) {
      // Verificar si ya existe
      const existente = await this.getRolByCodigo(rolTemplate.codigo!, empresaId);
      if (existente) continue;

      const rol = new Rol({
        empresaId: new Types.ObjectId(empresaId),
        codigo: rolTemplate.codigo,
        nombre: rolTemplate.nombre,
        descripcion: rolTemplate.descripcion,
        rolBase: rolTemplate.rolBase,
        permisos: rolTemplate.permisos,
        color: rolTemplate.color,
        orden: rolTemplate.orden,
        activo: true,
        esSistema: true,
      });

      await rol.save();
      rolesCreados.push(rol.toObject());
    }

    return rolesCreados;
  }

  /**
   * Duplicar un rol existente
   */
  async duplicarRol(
    rolId: string,
    empresaId: string,
    nuevoCodigo: string,
    nuevoNombre: string,
    creadoPor?: string
  ): Promise<IRol> {
    const rolOriginal = await this.getRolById(rolId, empresaId);
    if (!rolOriginal) {
      throw new Error('Rol no encontrado');
    }

    return this.createRol(empresaId, {
      codigo: nuevoCodigo,
      nombre: nuevoNombre,
      descripcion: `Basado en ${rolOriginal.nombre}`,
      rolBase: rolOriginal.rolBase,
      permisos: JSON.parse(JSON.stringify(rolOriginal.permisos)), // Deep copy
      color: rolOriginal.color,
      icono: rolOriginal.icono,
    }, creadoPor);
  }

  // =========================================
  // MÉTODOS DE VERIFICACIÓN DE PERMISOS
  // =========================================

  /**
   * Obtener permisos efectivos de un rol
   * (combina permisos del rol base con los personalizados)
   */
  getPermisosEfectivos(rol: IRol): IPermisos {
    // Si tiene rol base, partir de esos permisos
    if (rol.rolBase) {
      const rolSistema = ROLES_SISTEMA.find(r => r.codigo === rol.rolBase);
      if (rolSistema?.permisos) {
        return {
          recursos: {
            ...rolSistema.permisos.recursos,
            ...rol.permisos.recursos,
          },
          especiales: {
            ...rolSistema.permisos.especiales,
            ...rol.permisos.especiales,
          },
        };
      }
    }

    return rol.permisos;
  }

  /**
   * Verificar si un rol tiene permiso sobre un recurso
   */
  tienePermiso(
    rol: IRol,
    recurso: RecursoSistema,
    accion: AccionRecurso
  ): boolean {
    const permisos = this.getPermisosEfectivos(rol);
    const permisosRecurso = permisos.recursos[recurso];
    return Array.isArray(permisosRecurso) && permisosRecurso.includes(accion);
  }

  /**
   * Verificar si un rol tiene un permiso especial
   */
  tienePermisoEspecial(
    rol: IRol,
    permiso: keyof IPermisosEspeciales
  ): boolean {
    const permisos = this.getPermisosEfectivos(rol);
    const valor = permisos.especiales[permiso];
    // Para descuentoMaximo devolver true si es > 0
    if (permiso === 'descuentoMaximo') {
      return (valor as number) > 0;
    }
    return !!valor;
  }

  /**
   * Obtener el descuento máximo permitido para un rol
   */
  getDescuentoMaximo(rol: IRol): number {
    const permisos = this.getPermisosEfectivos(rol);
    return permisos.especiales.descuentoMaximo || 0;
  }

  /**
   * Obtener lista de recursos disponibles
   */
  getRecursosDisponibles(): { recurso: RecursoSistema; nombre: string; acciones: AccionRecurso[]; grupo: string }[] {
    return [
      // Maestros
      { recurso: 'clientes', nombre: 'Clientes', acciones: ['create', 'read', 'update', 'delete', 'export', 'import'], grupo: 'Maestros' },
      { recurso: 'proveedores', nombre: 'Proveedores', acciones: ['create', 'read', 'update', 'delete', 'export', 'import'], grupo: 'Maestros' },
      { recurso: 'productos', nombre: 'Productos', acciones: ['create', 'read', 'update', 'delete', 'export', 'import'], grupo: 'Maestros' },
      { recurso: 'familias', nombre: 'Familias', acciones: ['create', 'read', 'update', 'delete'], grupo: 'Maestros' },
      { recurso: 'almacenes', nombre: 'Almacenes', acciones: ['create', 'read', 'update', 'delete'], grupo: 'Maestros' },
      { recurso: 'agentes', nombre: 'Agentes/Comerciales', acciones: ['create', 'read', 'update', 'delete'], grupo: 'Maestros' },
      { recurso: 'formas-pago', nombre: 'Formas de Pago', acciones: ['create', 'read', 'update', 'delete'], grupo: 'Maestros' },
      { recurso: 'tipos-impuesto', nombre: 'Tipos de Impuesto', acciones: ['create', 'read', 'update', 'delete'], grupo: 'Maestros' },
      { recurso: 'tarifas', nombre: 'Tarifas', acciones: ['create', 'read', 'update', 'delete'], grupo: 'Maestros' },
      { recurso: 'ofertas', nombre: 'Ofertas/Promociones', acciones: ['create', 'read', 'update', 'delete'], grupo: 'Maestros' },
      { recurso: 'series-documentos', nombre: 'Series de Documentos', acciones: ['create', 'read', 'update', 'delete'], grupo: 'Maestros' },
      // Ventas
      { recurso: 'presupuestos', nombre: 'Presupuestos (Ventas)', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Ventas' },
      { recurso: 'pedidos', nombre: 'Pedidos (Ventas)', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Ventas' },
      { recurso: 'albaranes', nombre: 'Albaranes (Ventas)', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Ventas' },
      { recurso: 'facturas', nombre: 'Facturas (Ventas)', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Ventas' },
      // Compras
      { recurso: 'presupuestos-compra', nombre: 'Presupuestos (Compras)', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Compras' },
      { recurso: 'pedidos-compra', nombre: 'Pedidos (Compras)', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Compras' },
      { recurso: 'albaranes-compra', nombre: 'Albaranes (Compras)', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Compras' },
      { recurso: 'facturas-compra', nombre: 'Facturas (Compras)', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Compras' },
      // RRHH / Personal
      { recurso: 'personal', nombre: 'Personal/Empleados', acciones: ['create', 'read', 'update', 'delete', 'export', 'import'], grupo: 'RRHH' },
      { recurso: 'departamentos', nombre: 'Departamentos', acciones: ['create', 'read', 'update', 'delete'], grupo: 'RRHH' },
      { recurso: 'turnos', nombre: 'Turnos', acciones: ['create', 'read', 'update', 'delete'], grupo: 'RRHH' },
      { recurso: 'calendarios', nombre: 'Calendarios Laborales', acciones: ['create', 'read', 'update', 'delete'], grupo: 'RRHH' },
      { recurso: 'fichajes', nombre: 'Fichajes', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'RRHH' },
      { recurso: 'planificacion', nombre: 'Planificación', acciones: ['create', 'read', 'update', 'delete'], grupo: 'RRHH' },
      { recurso: 'partes-trabajo', nombre: 'Partes de Trabajo', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'RRHH' },
      // Informes
      { recurso: 'informes', nombre: 'Informes Personalizados', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Informes' },
      { recurso: 'reportes', nombre: 'Reportes del Sistema', acciones: ['read', 'export'], grupo: 'Informes' },
      // Tesorería
      { recurso: 'tesoreria', nombre: 'Tesorería General', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Tesorería' },
      { recurso: 'recibos', nombre: 'Recibos', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Tesorería' },
      { recurso: 'pagares', nombre: 'Pagarés', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Tesorería' },
      { recurso: 'vencimientos', nombre: 'Vencimientos', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Tesorería' },
      // Stock / Almacén
      { recurso: 'stock', nombre: 'Stock', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Almacén' },
      { recurso: 'inventarios', nombre: 'Inventarios', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Almacén' },
      { recurso: 'traspasos', nombre: 'Traspasos', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Almacén' },
      // Proyectos
      { recurso: 'proyectos', nombre: 'Proyectos', acciones: ['create', 'read', 'update', 'delete', 'export'], grupo: 'Proyectos' },
      { recurso: 'maquinaria', nombre: 'Maquinaria', acciones: ['create', 'read', 'update', 'delete'], grupo: 'Proyectos' },
      { recurso: 'tipos-gasto', nombre: 'Tipos de Gasto', acciones: ['create', 'read', 'update', 'delete'], grupo: 'Proyectos' },
      // Terminales de Fichaje
      { recurso: 'terminales', nombre: 'Terminales de Fichaje', acciones: ['create', 'read', 'update', 'delete'], grupo: 'RRHH' },
      // Sistema
      { recurso: 'usuarios', nombre: 'Usuarios', acciones: ['create', 'read', 'update', 'delete'], grupo: 'Sistema' },
      { recurso: 'roles', nombre: 'Roles', acciones: ['create', 'read', 'update', 'delete'], grupo: 'Sistema' },
      { recurso: 'configuracion', nombre: 'Configuración', acciones: ['read', 'update'], grupo: 'Sistema' },
    ];
  }

  /**
   * Obtener lista de permisos especiales disponibles
   */
  getPermisosEspecialesDisponibles(): { codigo: keyof IPermisosEspeciales; nombre: string; descripcion: string; tipo: 'boolean' | 'number'; grupo: string }[] {
    return [
      // Visibilidad de datos
      { codigo: 'verCostes', nombre: 'Ver Costes', descripcion: 'Ver precios de compra y costes de productos', tipo: 'boolean', grupo: 'Datos Financieros' },
      { codigo: 'verMargenes', nombre: 'Ver Márgenes', descripcion: 'Ver márgenes de beneficio en productos y documentos', tipo: 'boolean', grupo: 'Datos Financieros' },
      { codigo: 'verDatosFacturacion', nombre: 'Ver Datos Facturación', descripcion: 'Ver CIF, direcciones y datos fiscales de clientes', tipo: 'boolean', grupo: 'Datos Financieros' },
      // Edición de precios
      { codigo: 'modificarPVP', nombre: 'Modificar PVP', descripcion: 'Modificar precios de venta en documentos', tipo: 'boolean', grupo: 'Precios' },
      { codigo: 'modificarPrecioCompra', nombre: 'Modificar Precio Compra', descripcion: 'Modificar precios de compra en documentos', tipo: 'boolean', grupo: 'Precios' },
      { codigo: 'aplicarDescuentos', nombre: 'Aplicar Descuentos', descripcion: 'Aplicar descuentos en líneas de documentos', tipo: 'boolean', grupo: 'Precios' },
      { codigo: 'descuentoMaximo', nombre: 'Descuento Máximo (%)', descripcion: 'Porcentaje máximo de descuento permitido', tipo: 'number', grupo: 'Precios' },
      // Gestión del sistema
      { codigo: 'accederConfiguracion', nombre: 'Acceder Configuración', descripcion: 'Acceder a la configuración de la empresa', tipo: 'boolean', grupo: 'Sistema' },
      { codigo: 'gestionarUsuarios', nombre: 'Gestionar Usuarios', descripcion: 'Crear, editar y eliminar usuarios', tipo: 'boolean', grupo: 'Sistema' },
      { codigo: 'gestionarRoles', nombre: 'Gestionar Roles', descripcion: 'Crear y modificar roles personalizados', tipo: 'boolean', grupo: 'Sistema' },
      // Operaciones masivas
      { codigo: 'exportarDatos', nombre: 'Exportar Datos', descripcion: 'Exportar datos a Excel/CSV', tipo: 'boolean', grupo: 'Operaciones' },
      { codigo: 'importarDatos', nombre: 'Importar Datos', descripcion: 'Importar datos masivamente', tipo: 'boolean', grupo: 'Operaciones' },
      { codigo: 'anularDocumentos', nombre: 'Anular Documentos', descripcion: 'Anular facturas, albaranes y otros documentos', tipo: 'boolean', grupo: 'Operaciones' },
      { codigo: 'eliminarDocumentos', nombre: 'Eliminar Documentos', descripcion: 'Eliminar documentos completamente', tipo: 'boolean', grupo: 'Operaciones' },
      { codigo: 'verHistorialCambios', nombre: 'Ver Historial', descripcion: 'Ver historial de modificaciones de documentos', tipo: 'boolean', grupo: 'Operaciones' },
      // Acceso a módulos
      { codigo: 'accesoVentas', nombre: 'Acceso Ventas', descripcion: 'Acceder al módulo de ventas', tipo: 'boolean', grupo: 'Acceso a Módulos' },
      { codigo: 'accesoCompras', nombre: 'Acceso Compras', descripcion: 'Acceder al módulo de compras', tipo: 'boolean', grupo: 'Acceso a Módulos' },
      { codigo: 'accesoAlmacen', nombre: 'Acceso Almacén', descripcion: 'Acceder al módulo de almacén/stock', tipo: 'boolean', grupo: 'Acceso a Módulos' },
      { codigo: 'accesoContabilidad', nombre: 'Acceso Contabilidad', descripcion: 'Acceder a informes financieros y contabilidad', tipo: 'boolean', grupo: 'Acceso a Módulos' },
      { codigo: 'accesoTPV', nombre: 'Acceso TPV', descripcion: 'Acceder al terminal punto de venta', tipo: 'boolean', grupo: 'Acceso a Módulos' },
      { codigo: 'accesoCobroVencimientosTPV', nombre: 'Cobrar Vencimientos en TPV', descripcion: 'Cobrar facturas pendientes desde el TPV', tipo: 'boolean', grupo: 'TPV' },
      { codigo: 'accesoPagoVencimientosTPV', nombre: 'Pagar Vencimientos en TPV', descripcion: 'Pagar facturas de proveedores desde el TPV', tipo: 'boolean', grupo: 'TPV' },
      { codigo: 'accesoRRHH', nombre: 'Acceso RRHH', descripcion: 'Acceder al módulo de recursos humanos y personal', tipo: 'boolean', grupo: 'Acceso a Módulos' },
      { codigo: 'accesoInformes', nombre: 'Acceso Informes', descripcion: 'Acceder al módulo de informes personalizados', tipo: 'boolean', grupo: 'Acceso a Módulos' },
      { codigo: 'accesoTesoreria', nombre: 'Acceso Tesorería', descripcion: 'Acceder al módulo de tesorería (cobros, pagos, recibos)', tipo: 'boolean', grupo: 'Acceso a Módulos' },
      { codigo: 'accesoProyectos', nombre: 'Acceso Proyectos', descripcion: 'Acceder al módulo de proyectos y partes de trabajo', tipo: 'boolean', grupo: 'Acceso a Módulos' },
      { codigo: 'accesoCRM', nombre: 'Acceso CRM', descripcion: 'Acceder a funcionalidades avanzadas de gestión de clientes', tipo: 'boolean', grupo: 'Acceso a Módulos' },
    ];
  }
}

export const rolesService = new RolesService();
export default rolesService;
