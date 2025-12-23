// apps/backend/src/types/permissions.types.ts

import {
  IPermisosEspeciales,
  IPermisos,
  IRol,
  AccionRecurso,
  RecursoSistema,
  PERMISOS_ESPECIALES_DEFAULT,
  PERMISOS_ESPECIALES_ADMIN,
  ROLES_SISTEMA,
} from '../modules/roles/Rol';

// Re-exportar tipos de permisos especiales para uso en toda la app
export type { IPermisosEspeciales, IPermisos, AccionRecurso, RecursoSistema };
export { PERMISOS_ESPECIALES_DEFAULT, PERMISOS_ESPECIALES_ADMIN };

/**
 * Recursos del sistema que pueden tener permisos
 */
export type Resource =
  // Maestros
  | 'clientes'
  | 'proveedores'
  | 'productos'
  | 'familias'
  | 'almacenes'
  | 'tipos-impuesto'
  | 'formas-pago'
  | 'terminos-pago'
  | 'agentes-comerciales'
  | 'estados'
  | 'situaciones'
  | 'clasificaciones'
  // Documentos de venta
  | 'facturas'
  | 'presupuestos'
  | 'pedidos'
  | 'albaranes'
  // Documentos de compra
  | 'facturas-compra'
  | 'presupuestos-compra'
  | 'pedidos-compra'
  | 'albaranes-compra'
  // Tesorería
  | 'vencimientos'
  | 'pagares'
  | 'recibos'
  | 'tesoreria'
  // RRHH
  | 'personal'
  | 'fichajes'
  | 'turnos'
  | 'partes-trabajo'
  | 'calendarios'
  | 'departamentos'
  | 'planificacion'
  // Proyectos
  | 'proyectos'
  // Comerciales
  | 'ofertas'
  | 'tarifas'
  | 'precios'
  // Facturación electrónica
  | 'facturae'
  | 'verifactu'
  | 'certificados'
  // TPV/Hostelería
  | 'terminales'
  | 'zonas-preparacion'
  | 'impresoras'
  | 'modificadores'
  | 'grupos-modificadores'
  | 'alergenos'
  | 'comandas-cocina'
  // Informes
  | 'informes'
  // Stock
  | 'stock'
  | 'inventarios'
  | 'traspasos'
  // Series
  | 'series-documentos'
  // Sistema
  | 'usuarios'
  | 'roles'
  | 'configuracion'
  | 'reportes'
  | 'licencias'
  | 'dashboard';

/**
 * Acciones posibles sobre un recurso
 */
export type Action = 'create' | 'read' | 'update' | 'delete' | 'export' | 'import';

/**
 * Roles del sistema ordenados por jerarquía
 */
export type Role =
  | 'superadmin' // Acceso total al sistema
  | 'admin' // Administrador de empresa
  | 'gerente' // Gerente con permisos amplios
  | 'vendedor' // Vendedor con permisos limitados
  | 'tecnico' // Técnico con permisos específicos
  | 'almacenero' // Gestión de almacén
  | 'visualizador'; // Solo lectura

/**
 * Definición de permisos por rol
 */
export interface RolePermissions {
  [key: string]: {
    resources: {
      [key in Resource]?: Action[];
    };
    description: string;
  };
}

// Acciones completas para superadmin
const ALL_ACTIONS: Action[] = ['create', 'read', 'update', 'delete', 'export', 'import'];
const CRUD_ACTIONS: Action[] = ['create', 'read', 'update', 'delete'];
const READ_ONLY: Action[] = ['read'];
const READ_EXPORT: Action[] = ['read', 'export'];

/**
 * Matriz de permisos del sistema
 * Define qué acciones puede realizar cada rol sobre cada recurso
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  superadmin: {
    description: 'Acceso total al sistema',
    resources: {
      // Maestros
      clientes: ALL_ACTIONS,
      proveedores: ALL_ACTIONS,
      productos: ALL_ACTIONS,
      familias: ALL_ACTIONS,
      almacenes: ALL_ACTIONS,
      'tipos-impuesto': CRUD_ACTIONS,
      'formas-pago': CRUD_ACTIONS,
      'terminos-pago': CRUD_ACTIONS,
      'agentes-comerciales': ALL_ACTIONS,
      estados: CRUD_ACTIONS,
      situaciones: CRUD_ACTIONS,
      clasificaciones: CRUD_ACTIONS,
      // Documentos de venta
      facturas: ALL_ACTIONS,
      presupuestos: ALL_ACTIONS,
      pedidos: ALL_ACTIONS,
      albaranes: ALL_ACTIONS,
      // Documentos de compra
      'facturas-compra': ALL_ACTIONS,
      'presupuestos-compra': ALL_ACTIONS,
      'pedidos-compra': ALL_ACTIONS,
      'albaranes-compra': ALL_ACTIONS,
      // Tesorería
      vencimientos: ALL_ACTIONS,
      pagares: ALL_ACTIONS,
      recibos: ALL_ACTIONS,
      tesoreria: ALL_ACTIONS,
      // RRHH
      personal: ALL_ACTIONS,
      fichajes: ALL_ACTIONS,
      turnos: ALL_ACTIONS,
      'partes-trabajo': ALL_ACTIONS,
      calendarios: CRUD_ACTIONS,
      departamentos: CRUD_ACTIONS,
      // Proyectos
      proyectos: ALL_ACTIONS,
      // Comerciales
      ofertas: ALL_ACTIONS,
      tarifas: CRUD_ACTIONS,
      precios: CRUD_ACTIONS,
      // Facturación electrónica
      facturae: ALL_ACTIONS,
      verifactu: ALL_ACTIONS,
      certificados: CRUD_ACTIONS,
      // TPV/Hostelería
      terminales: CRUD_ACTIONS,
      'zonas-preparacion': CRUD_ACTIONS,
      impresoras: CRUD_ACTIONS,
      modificadores: CRUD_ACTIONS,
      'grupos-modificadores': CRUD_ACTIONS,
      alergenos: CRUD_ACTIONS,
      'comandas-cocina': CRUD_ACTIONS,
      // Sistema
      usuarios: CRUD_ACTIONS,
      roles: CRUD_ACTIONS,
      configuracion: CRUD_ACTIONS,
      reportes: READ_EXPORT,
      licencias: CRUD_ACTIONS,
      dashboard: CRUD_ACTIONS,
    },
  },

  admin: {
    description: 'Administrador de empresa con acceso completo',
    resources: {
      // Maestros
      clientes: ALL_ACTIONS,
      proveedores: ALL_ACTIONS,
      productos: ALL_ACTIONS,
      familias: ALL_ACTIONS,
      almacenes: ALL_ACTIONS,
      'tipos-impuesto': CRUD_ACTIONS,
      'formas-pago': CRUD_ACTIONS,
      'terminos-pago': CRUD_ACTIONS,
      'agentes-comerciales': ALL_ACTIONS,
      estados: CRUD_ACTIONS,
      situaciones: CRUD_ACTIONS,
      clasificaciones: CRUD_ACTIONS,
      // Documentos de venta
      facturas: ALL_ACTIONS,
      presupuestos: ALL_ACTIONS,
      pedidos: ALL_ACTIONS,
      albaranes: ALL_ACTIONS,
      // Documentos de compra
      'facturas-compra': ALL_ACTIONS,
      'presupuestos-compra': ALL_ACTIONS,
      'pedidos-compra': ALL_ACTIONS,
      'albaranes-compra': ALL_ACTIONS,
      // Tesorería
      vencimientos: ALL_ACTIONS,
      pagares: ALL_ACTIONS,
      recibos: ALL_ACTIONS,
      tesoreria: ALL_ACTIONS,
      // RRHH
      personal: ALL_ACTIONS,
      fichajes: ALL_ACTIONS,
      turnos: ALL_ACTIONS,
      'partes-trabajo': ALL_ACTIONS,
      calendarios: CRUD_ACTIONS,
      departamentos: CRUD_ACTIONS,
      // Proyectos
      proyectos: ALL_ACTIONS,
      // Comerciales
      ofertas: ALL_ACTIONS,
      tarifas: CRUD_ACTIONS,
      precios: CRUD_ACTIONS,
      // Facturación electrónica
      facturae: ALL_ACTIONS,
      verifactu: ALL_ACTIONS,
      certificados: CRUD_ACTIONS,
      // TPV/Hostelería
      terminales: CRUD_ACTIONS,
      'zonas-preparacion': CRUD_ACTIONS,
      impresoras: CRUD_ACTIONS,
      modificadores: CRUD_ACTIONS,
      'grupos-modificadores': CRUD_ACTIONS,
      alergenos: CRUD_ACTIONS,
      'comandas-cocina': CRUD_ACTIONS,
      // Sistema
      usuarios: CRUD_ACTIONS,
      roles: ['read', 'update'],
      configuracion: ['read', 'update'],
      reportes: READ_EXPORT,
      dashboard: CRUD_ACTIONS,
    },
  },

  gerente: {
    description: 'Gerente con permisos amplios de gestión',
    resources: {
      // Maestros
      clientes: ['create', 'read', 'update', 'export'],
      proveedores: ['create', 'read', 'update', 'export'],
      productos: ['create', 'read', 'update', 'export'],
      familias: ['create', 'read', 'update', 'export'],
      almacenes: READ_EXPORT,
      'tipos-impuesto': READ_ONLY,
      'formas-pago': READ_ONLY,
      'terminos-pago': READ_ONLY,
      'agentes-comerciales': ['read', 'update'],
      estados: READ_ONLY,
      situaciones: READ_ONLY,
      clasificaciones: READ_ONLY,
      // Documentos de venta
      facturas: ['create', 'read', 'update', 'delete', 'export'],
      presupuestos: ['create', 'read', 'update', 'delete', 'export'],
      pedidos: ['create', 'read', 'update', 'delete', 'export'],
      albaranes: ['create', 'read', 'update', 'delete', 'export'],
      // Documentos de compra
      'facturas-compra': ['create', 'read', 'update', 'delete', 'export'],
      'presupuestos-compra': ['create', 'read', 'update', 'delete', 'export'],
      'pedidos-compra': ['create', 'read', 'update', 'delete', 'export'],
      'albaranes-compra': ['create', 'read', 'update', 'delete', 'export'],
      // Tesorería
      vencimientos: ['create', 'read', 'update', 'export'],
      pagares: ['create', 'read', 'update', 'export'],
      recibos: ['create', 'read', 'update', 'export'],
      tesoreria: READ_EXPORT,
      // RRHH
      personal: ['read', 'update', 'export'],
      fichajes: ['read', 'update', 'export'],
      turnos: ['read', 'update'],
      'partes-trabajo': ['create', 'read', 'update', 'export'],
      calendarios: READ_ONLY,
      departamentos: READ_ONLY,
      // Proyectos
      proyectos: ['create', 'read', 'update', 'export'],
      // Comerciales
      ofertas: ['create', 'read', 'update', 'export'],
      tarifas: READ_ONLY,
      precios: READ_ONLY,
      // Facturación electrónica
      facturae: ['create', 'read', 'export'],
      verifactu: ['read'],
      certificados: READ_ONLY,
      // Sistema
      usuarios: READ_ONLY,
      roles: READ_ONLY,
      configuracion: READ_ONLY,
      reportes: READ_EXPORT,
      dashboard: ['read', 'update'],
    },
  },

  vendedor: {
    description: 'Vendedor con permisos de ventas',
    resources: {
      // Maestros
      clientes: ['create', 'read', 'update'],
      proveedores: READ_ONLY,
      productos: READ_ONLY,
      familias: READ_ONLY,
      almacenes: READ_ONLY,
      'tipos-impuesto': READ_ONLY,
      'formas-pago': READ_ONLY,
      'terminos-pago': READ_ONLY,
      'agentes-comerciales': READ_ONLY,
      estados: READ_ONLY,
      situaciones: READ_ONLY,
      clasificaciones: READ_ONLY,
      // Documentos de venta
      facturas: ['create', 'read', 'update'],
      presupuestos: ['create', 'read', 'update'],
      pedidos: ['create', 'read', 'update'],
      albaranes: ['create', 'read', 'update'],
      // Tesorería
      vencimientos: READ_ONLY,
      tesoreria: READ_ONLY,
      // Comerciales
      ofertas: ['create', 'read', 'update'],
      tarifas: READ_ONLY,
      precios: READ_ONLY,
      // Sistema
      configuracion: READ_ONLY,
      reportes: READ_ONLY,
      dashboard: READ_ONLY,
    },
  },

  tecnico: {
    description: 'Técnico con permisos específicos',
    resources: {
      // Maestros
      clientes: READ_ONLY,
      productos: ['read', 'update'],
      familias: READ_ONLY,
      almacenes: ['read', 'update'],
      estados: READ_ONLY,
      situaciones: READ_ONLY,
      clasificaciones: READ_ONLY,
      // Documentos
      pedidos: READ_ONLY,
      albaranes: ['read', 'update'],
      // RRHH
      fichajes: ['create', 'read'],
      turnos: READ_ONLY,
      'partes-trabajo': ['create', 'read', 'update'],
      // Proyectos
      proyectos: ['read', 'update'],
      // Sistema
      reportes: READ_ONLY,
      dashboard: READ_ONLY,
    },
  },

  almacenero: {
    description: 'Gestión de almacén e inventario',
    resources: {
      // Maestros
      productos: ['read', 'update'],
      familias: READ_ONLY,
      almacenes: ['read', 'update', 'export'],
      proveedores: READ_ONLY,
      estados: READ_ONLY,
      situaciones: READ_ONLY,
      clasificaciones: READ_ONLY,
      // Documentos
      pedidos: ['read', 'update'],
      albaranes: ['read', 'update'],
      'pedidos-compra': ['read', 'update'],
      'albaranes-compra': ['create', 'read', 'update'],
      // Sistema
      reportes: READ_ONLY,
      dashboard: READ_ONLY,
    },
  },

  visualizador: {
    description: 'Solo lectura en todos los recursos',
    resources: {
      clientes: READ_ONLY,
      proveedores: READ_ONLY,
      productos: READ_ONLY,
      familias: READ_ONLY,
      almacenes: READ_ONLY,
      'tipos-impuesto': READ_ONLY,
      'formas-pago': READ_ONLY,
      'terminos-pago': READ_ONLY,
      'agentes-comerciales': READ_ONLY,
      estados: READ_ONLY,
      situaciones: READ_ONLY,
      clasificaciones: READ_ONLY,
      facturas: READ_ONLY,
      presupuestos: READ_ONLY,
      pedidos: READ_ONLY,
      albaranes: READ_ONLY,
      'facturas-compra': READ_ONLY,
      'presupuestos-compra': READ_ONLY,
      'pedidos-compra': READ_ONLY,
      'albaranes-compra': READ_ONLY,
      vencimientos: READ_ONLY,
      pagares: READ_ONLY,
      recibos: READ_ONLY,
      tesoreria: READ_ONLY,
      personal: READ_ONLY,
      fichajes: READ_ONLY,
      turnos: READ_ONLY,
      'partes-trabajo': READ_ONLY,
      proyectos: READ_ONLY,
      ofertas: READ_ONLY,
      tarifas: READ_ONLY,
      precios: READ_ONLY,
      configuracion: READ_ONLY,
      reportes: READ_ONLY,
      dashboard: READ_ONLY,
    },
  },
};

/**
 * Jerarquía de roles (mayor número = más permisos)
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  superadmin: 7,
  admin: 6,
  gerente: 5,
  vendedor: 4,
  tecnico: 3,
  almacenero: 2,
  visualizador: 1,
};

/**
 * Verifica si un rol tiene un permiso específico sobre un recurso
 */
export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;

  const resourcePerms = rolePerms.resources[resource];
  if (!resourcePerms) return false;

  return resourcePerms.includes(action);
}

/**
 * Verifica si un rol tiene nivel superior o igual a otro rol
 */
export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Obtiene todos los permisos de un rol
 */
export function getRolePermissions(role: Role): { [key in Resource]?: Action[] } {
  return ROLE_PERMISSIONS[role]?.resources || {};
}

// =============================================
// FUNCIONES DE PERMISOS ESPECIALES
// =============================================

/**
 * Interface para usuario con permisos (usado en middleware)
 */
export interface IUsuarioConPermisos {
  rol: Role;
  rolId?: string;
  rolCustom?: IRol;  // Rol personalizado cargado
  permisos?: {
    especiales?: Partial<IPermisosEspeciales>;
  };
}

/**
 * Obtiene los permisos especiales efectivos de un usuario
 * Prioridad: permisos usuario > permisos rol personalizado > permisos rol base
 */
export function getPermisosEspecialesEfectivos(
  usuario: IUsuarioConPermisos
): IPermisosEspeciales {
  // Superadmin siempre tiene todos los permisos
  if (usuario.rol === 'superadmin') {
    return PERMISOS_ESPECIALES_ADMIN;
  }

  // Obtener permisos del rol base
  const rolSistema = ROLES_SISTEMA.find(r => r.codigo === usuario.rol);
  const permisosBase = rolSistema?.permisos?.especiales || PERMISOS_ESPECIALES_DEFAULT;

  // Si tiene rol personalizado, combinarlo
  let permisosRolCustom = permisosBase;
  if (usuario.rolCustom?.permisos?.especiales) {
    permisosRolCustom = {
      ...permisosBase,
      ...usuario.rolCustom.permisos.especiales,
    };
  }

  // Aplicar permisos específicos del usuario (sobrescriben todo)
  if (usuario.permisos?.especiales) {
    return {
      ...permisosRolCustom,
      ...usuario.permisos.especiales,
    };
  }

  return permisosRolCustom;
}

/**
 * Verifica si un usuario tiene un permiso especial
 */
export function hasSpecialPermission(
  usuario: IUsuarioConPermisos,
  permiso: keyof IPermisosEspeciales
): boolean {
  const permisos = getPermisosEspecialesEfectivos(usuario);
  const valor = permisos[permiso];

  // Para descuentoMaximo, true si > 0
  if (permiso === 'descuentoMaximo') {
    return (valor as number) > 0;
  }

  return !!valor;
}

/**
 * Obtiene el descuento máximo permitido para un usuario
 */
export function getDescuentoMaximoUsuario(usuario: IUsuarioConPermisos): number {
  const permisos = getPermisosEspecialesEfectivos(usuario);
  return permisos.descuentoMaximo || 0;
}

/**
 * Verifica si un usuario puede ver costes
 */
export function canVerCostes(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'verCostes');
}

/**
 * Verifica si un usuario puede modificar PVP
 */
export function canModificarPVP(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'modificarPVP');
}

/**
 * Verifica si un usuario puede ver márgenes
 */
export function canVerMargenes(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'verMargenes');
}

/**
 * Verifica si un usuario puede aplicar descuentos
 */
export function canAplicarDescuentos(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'aplicarDescuentos');
}

/**
 * Verifica si un descuento está dentro del límite permitido para el usuario
 */
export function isDescuentoPermitido(usuario: IUsuarioConPermisos, descuento: number): boolean {
  if (!canAplicarDescuentos(usuario)) return false;
  const maximo = getDescuentoMaximoUsuario(usuario);
  return descuento <= maximo;
}

// =============================================
// FUNCIONES DE ACCESO A MÓDULOS
// =============================================

/**
 * Verifica si un usuario tiene acceso al módulo de RRHH/Personal
 */
export function canAccesoRRHH(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'accesoRRHH');
}

/**
 * Verifica si un usuario tiene acceso al módulo de Informes
 */
export function canAccesoInformes(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'accesoInformes');
}

/**
 * Verifica si un usuario tiene acceso al módulo de Tesorería
 */
export function canAccesoTesoreria(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'accesoTesoreria');
}

/**
 * Verifica si un usuario tiene acceso al módulo de Proyectos
 */
export function canAccesoProyectos(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'accesoProyectos');
}

/**
 * Verifica si un usuario tiene acceso al módulo CRM
 */
export function canAccesoCRM(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'accesoCRM');
}

/**
 * Verifica si un usuario tiene acceso al módulo de Ventas
 */
export function canAccesoVentas(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'accesoVentas');
}

/**
 * Verifica si un usuario tiene acceso al módulo de Compras
 */
export function canAccesoCompras(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'accesoCompras');
}

/**
 * Verifica si un usuario tiene acceso al módulo de Almacén
 */
export function canAccesoAlmacen(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'accesoAlmacen');
}

/**
 * Verifica si un usuario tiene acceso al módulo de Contabilidad
 */
export function canAccesoContabilidad(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'accesoContabilidad');
}

/**
 * Verifica si un usuario tiene acceso al TPV
 */
export function canAccesoTPV(usuario: IUsuarioConPermisos): boolean {
  return hasSpecialPermission(usuario, 'accesoTPV');
}

/**
 * Tipo para los permisos de acceso a módulos
 */
export type ModuloAcceso =
  | 'accesoVentas'
  | 'accesoCompras'
  | 'accesoAlmacen'
  | 'accesoContabilidad'
  | 'accesoTPV'
  | 'accesoRRHH'
  | 'accesoInformes'
  | 'accesoTesoreria'
  | 'accesoProyectos'
  | 'accesoCRM';

/**
 * Verifica acceso a un módulo específico
 */
export function canAccesoModulo(usuario: IUsuarioConPermisos, modulo: ModuloAcceso): boolean {
  return hasSpecialPermission(usuario, modulo);
}
