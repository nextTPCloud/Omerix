// apps/backend/src/types/permissions.types.ts

/**
 * Recursos del sistema que pueden tener permisos
 */
export type Resource =
  | 'clientes'
  | 'productos'
  | 'familias'
  | 'almacenes'
  | 'tipos-impuesto'
  | 'facturas'
  | 'presupuestos'
  | 'pedidos'
  | 'usuarios'
  | 'configuracion'
  | 'reportes'
  | 'licencias'
  | 'estados'
  | 'situaciones'
  | 'clasificaciones';

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

/**
 * Matriz de permisos del sistema
 * Define qué acciones puede realizar cada rol sobre cada recurso
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  superadmin: {
    description: 'Acceso total al sistema',
    resources: {
      clientes: ['create', 'read', 'update', 'delete', 'export', 'import'],
      productos: ['create', 'read', 'update', 'delete', 'export', 'import'],
      familias: ['create', 'read', 'update', 'delete', 'export', 'import'],
      almacenes: ['create', 'read', 'update', 'delete', 'export', 'import'],
      'tipos-impuesto': ['create', 'read', 'update', 'delete'],
      facturas: ['create', 'read', 'update', 'delete', 'export'],
      presupuestos: ['create', 'read', 'update', 'delete', 'export'],
      pedidos: ['create', 'read', 'update', 'delete', 'export'],
      usuarios: ['create', 'read', 'update', 'delete'],
      configuracion: ['create', 'read', 'update', 'delete'],
      reportes: ['read', 'export'],
      licencias: ['create', 'read', 'update', 'delete'],
      estados: ['create', 'read', 'update', 'delete'],
      situaciones: ['create', 'read', 'update', 'delete'],
      clasificaciones: ['create', 'read', 'update', 'delete'],
    },
  },

  admin: {
    description: 'Administrador de empresa con acceso completo',
    resources: {
      clientes: ['create', 'read', 'update', 'delete', 'export', 'import'],
      productos: ['create', 'read', 'update', 'delete', 'export', 'import'],
      familias: ['create', 'read', 'update', 'delete', 'export', 'import'],
      almacenes: ['create', 'read', 'update', 'delete', 'export', 'import'],
      'tipos-impuesto': ['create', 'read', 'update', 'delete'],
      facturas: ['create', 'read', 'update', 'delete', 'export'],
      presupuestos: ['create', 'read', 'update', 'delete', 'export'],
      pedidos: ['create', 'read', 'update', 'delete', 'export'],
      usuarios: ['create', 'read', 'update', 'delete'],
      configuracion: ['read', 'update'],
      reportes: ['read', 'export'],
      estados: ['create', 'read', 'update', 'delete'],
      situaciones: ['create', 'read', 'update', 'delete'],
      clasificaciones: ['create', 'read', 'update', 'delete'],
    },
  },

  gerente: {
    description: 'Gerente con permisos amplios de gestión',
    resources: {
      clientes: ['create', 'read', 'update', 'export'],
      productos: ['create', 'read', 'update', 'export'],
      familias: ['create', 'read', 'update', 'export'],
      almacenes: ['read', 'update', 'export'],
      'tipos-impuesto': ['read'],
      facturas: ['create', 'read', 'update', 'delete', 'export'],
      presupuestos: ['create', 'read', 'update', 'delete', 'export'],
      pedidos: ['create', 'read', 'update', 'delete', 'export'],
      usuarios: ['read'],
      configuracion: ['read'],
      reportes: ['read', 'export'],
      estados: ['read'],
      situaciones: ['read'],
      clasificaciones: ['read'],
    },
  },

  vendedor: {
    description: 'Vendedor con permisos de ventas',
    resources: {
      clientes: ['create', 'read', 'update'],
      productos: ['read'],
      familias: ['read'],
      almacenes: ['read'],
      'tipos-impuesto': ['read'],
      facturas: ['create', 'read'],
      presupuestos: ['create', 'read', 'update'],
      pedidos: ['create', 'read', 'update'],
      configuracion: ['read'],
      reportes: ['read'],
      estados: ['read'],
      situaciones: ['read'],
      clasificaciones: ['read'],
    },
  },

  tecnico: {
    description: 'Técnico con permisos específicos',
    resources: {
      clientes: ['read'],
      productos: ['read', 'update'],
      familias: ['read'],
      almacenes: ['read', 'update'],
      'tipos-impuesto': ['read'],
      pedidos: ['read'],
      reportes: ['read'],
      estados: ['read'],
      situaciones: ['read'],
      clasificaciones: ['read'],
    },
  },

  almacenero: {
    description: 'Gestión de almacén e inventario',
    resources: {
      productos: ['read', 'update'],
      familias: ['read'],
      almacenes: ['read', 'update', 'export'],
      pedidos: ['read', 'update'],
      reportes: ['read'],
      estados: ['read'],
      situaciones: ['read'],
      clasificaciones: ['read'],
    },
  },

  visualizador: {
    description: 'Solo lectura en todos los recursos',
    resources: {
      clientes: ['read'],
      productos: ['read'],
      familias: ['read'],
      almacenes: ['read'],
      'tipos-impuesto': ['read'],
      facturas: ['read'],
      presupuestos: ['read'],
      pedidos: ['read'],
      configuracion: ['read'],
      reportes: ['read'],
      estados: ['read'],
      situaciones: ['read'],
      clasificaciones: ['read'],
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
