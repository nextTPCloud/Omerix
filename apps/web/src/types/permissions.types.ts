/**
 * Tipos de permisos especiales del sistema
 * Deben coincidir con IPermisosEspeciales del backend
 */
export interface IPermisosEspeciales {
  // Visibilidad de datos financieros
  verCostes: boolean;
  verMargenes: boolean;
  verDatosFacturacion: boolean;

  // Edición de precios
  modificarPVP: boolean;
  modificarPrecioCompra: boolean;

  // Descuentos
  aplicarDescuentos: boolean;
  descuentoMaximo: number;

  // Gestión del sistema
  accederConfiguracion: boolean;
  gestionarUsuarios: boolean;
  gestionarRoles: boolean;

  // Operaciones masivas
  exportarDatos: boolean;
  importarDatos: boolean;

  // Operaciones especiales
  anularDocumentos: boolean;
  eliminarDocumentos: boolean;
  verHistorialCambios: boolean;

  // Acceso a módulos
  accesoVentas: boolean;
  accesoCompras: boolean;
  accesoAlmacen: boolean;
  accesoContabilidad: boolean;
  accesoTPV: boolean;
}

/**
 * Acciones CRUD sobre recursos
 */
export type AccionRecurso = 'create' | 'read' | 'update' | 'delete' | 'export' | 'import';

/**
 * Recursos del sistema
 */
export type RecursoSistema =
  | 'clientes'
  | 'proveedores'
  | 'productos'
  | 'familias'
  | 'almacenes'
  | 'presupuestos'
  | 'pedidos'
  | 'albaranes'
  | 'facturas'
  | 'ofertas'
  | 'presupuestos-compra'
  | 'pedidos-compra'
  | 'albaranes-compra'
  | 'facturas-compra'
  | 'usuarios'
  | 'roles'
  | 'configuracion'
  | 'reportes'
  | 'proyectos'
  | 'agentes'
  | 'formas-pago'
  | 'tipos-impuesto'
  | 'partes-trabajo'
  | 'maquinaria'
  | 'tipos-gasto'
  | 'personal'
  | 'departamentos'
  | 'calendarios'
  | 'turnos'
  | 'fichajes'
  | 'terminales'
  | 'tareas'
  | 'planificacion'
  | 'traspasos'
  | 'inventarios'
  | 'ajustes-stock'
  | 'tarifas';

/**
 * Permisos por recurso
 */
export interface IPermisosRecursos {
  [recurso: string]: AccionRecurso[];
}

/**
 * Estructura completa de permisos
 */
export interface IPermisos {
  recursos: IPermisosRecursos;
  especiales: IPermisosEspeciales;
}

/**
 * Rol del sistema
 */
export interface IRol {
  _id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  rolBase?: string;
  permisos: IPermisos;
  color?: string;
  icono?: string;
  orden: number;
  activo: boolean;
  esSistema: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Permisos especiales por defecto (todo denegado)
 */
export const PERMISOS_ESPECIALES_DEFAULT: IPermisosEspeciales = {
  verCostes: false,
  verMargenes: false,
  verDatosFacturacion: false,
  modificarPVP: false,
  modificarPrecioCompra: false,
  aplicarDescuentos: false,
  descuentoMaximo: 0,
  accederConfiguracion: false,
  gestionarUsuarios: false,
  gestionarRoles: false,
  exportarDatos: false,
  importarDatos: false,
  anularDocumentos: false,
  eliminarDocumentos: false,
  verHistorialCambios: false,
  accesoVentas: true,
  accesoCompras: false,
  accesoAlmacen: false,
  accesoContabilidad: false,
  accesoTPV: false,
};

/**
 * Permisos especiales para admin (todo permitido)
 */
export const PERMISOS_ESPECIALES_ADMIN: IPermisosEspeciales = {
  verCostes: true,
  verMargenes: true,
  verDatosFacturacion: true,
  modificarPVP: true,
  modificarPrecioCompra: true,
  aplicarDescuentos: true,
  descuentoMaximo: 100,
  accederConfiguracion: true,
  gestionarUsuarios: true,
  gestionarRoles: true,
  exportarDatos: true,
  importarDatos: true,
  anularDocumentos: true,
  eliminarDocumentos: true,
  verHistorialCambios: true,
  accesoVentas: true,
  accesoCompras: true,
  accesoAlmacen: true,
  accesoContabilidad: true,
  accesoTPV: true,
};

/**
 * Permisos por rol base (coincide con ROLES_SISTEMA del backend)
 */
export const PERMISOS_POR_ROL: Record<string, Partial<IPermisosEspeciales>> = {
  superadmin: PERMISOS_ESPECIALES_ADMIN,
  admin: PERMISOS_ESPECIALES_ADMIN,
  gerente: {
    verCostes: true,
    verMargenes: true,
    verDatosFacturacion: true,
    modificarPVP: true,
    modificarPrecioCompra: true,
    aplicarDescuentos: true,
    descuentoMaximo: 50,
    exportarDatos: true,
    anularDocumentos: true,
    verHistorialCambios: true,
    accesoVentas: true,
    accesoCompras: true,
    accesoAlmacen: true,
    accesoContabilidad: true,
    accesoTPV: true,
  },
  vendedor: {
    verCostes: false,
    verMargenes: false,
    modificarPVP: false,
    aplicarDescuentos: true,
    descuentoMaximo: 15,
    accesoVentas: true,
    accesoTPV: true,
  },
  tecnico: {
    verCostes: false,
    accesoAlmacen: true,
  },
  almacenero: {
    verCostes: true,
    accesoCompras: true,
    accesoAlmacen: true,
  },
  visualizador: {
    verDatosFacturacion: true,
    accesoVentas: true,
    accesoCompras: true,
    accesoAlmacen: true,
  },
};

/**
 * Matriz de permisos por rol sobre recursos
 * Define qué acciones puede realizar cada rol sobre cada recurso
 */
export const ROLE_PERMISSIONS: Record<string, { resources: Partial<Record<RecursoSistema, AccionRecurso[]>> }> = {
  superadmin: {
    resources: {
      clientes: ['create', 'read', 'update', 'delete', 'export', 'import'],
      proveedores: ['create', 'read', 'update', 'delete', 'export', 'import'],
      productos: ['create', 'read', 'update', 'delete', 'export', 'import'],
      familias: ['create', 'read', 'update', 'delete', 'export', 'import'],
      almacenes: ['create', 'read', 'update', 'delete', 'export', 'import'],
      presupuestos: ['create', 'read', 'update', 'delete', 'export'],
      pedidos: ['create', 'read', 'update', 'delete', 'export'],
      albaranes: ['create', 'read', 'update', 'delete', 'export'],
      facturas: ['create', 'read', 'update', 'delete', 'export'],
      ofertas: ['create', 'read', 'update', 'delete', 'export'],
      'presupuestos-compra': ['create', 'read', 'update', 'delete', 'export'],
      'pedidos-compra': ['create', 'read', 'update', 'delete', 'export'],
      'albaranes-compra': ['create', 'read', 'update', 'delete', 'export'],
      'facturas-compra': ['create', 'read', 'update', 'delete', 'export'],
      usuarios: ['create', 'read', 'update', 'delete'],
      roles: ['create', 'read', 'update', 'delete'],
      configuracion: ['create', 'read', 'update', 'delete'],
      reportes: ['read', 'export'],
      proyectos: ['create', 'read', 'update', 'delete', 'export'],
      agentes: ['create', 'read', 'update', 'delete', 'export'],
      'formas-pago': ['create', 'read', 'update', 'delete'],
      'tipos-impuesto': ['create', 'read', 'update', 'delete'],
      'partes-trabajo': ['create', 'read', 'update', 'delete', 'export'],
      maquinaria: ['create', 'read', 'update', 'delete'],
      'tipos-gasto': ['create', 'read', 'update', 'delete'],
      personal: ['create', 'read', 'update', 'delete', 'export', 'import'],
      departamentos: ['create', 'read', 'update', 'delete'],
      calendarios: ['create', 'read', 'update', 'delete'],
      turnos: ['create', 'read', 'update', 'delete'],
      fichajes: ['create', 'read', 'update', 'delete', 'export'],
      terminales: ['create', 'read', 'update', 'delete'],
      tareas: ['create', 'read', 'update', 'delete', 'export'],
      planificacion: ['create', 'read', 'update', 'delete', 'export'],
      traspasos: ['create', 'read', 'update', 'delete', 'export'],
      inventarios: ['create', 'read', 'update', 'delete', 'export'],
      'ajustes-stock': ['create', 'read', 'update', 'delete', 'export'],
      tarifas: ['create', 'read', 'update', 'delete', 'export'],
    },
  },
  admin: {
    resources: {
      clientes: ['create', 'read', 'update', 'delete', 'export', 'import'],
      proveedores: ['create', 'read', 'update', 'delete', 'export', 'import'],
      productos: ['create', 'read', 'update', 'delete', 'export', 'import'],
      familias: ['create', 'read', 'update', 'delete', 'export', 'import'],
      almacenes: ['create', 'read', 'update', 'delete', 'export', 'import'],
      presupuestos: ['create', 'read', 'update', 'delete', 'export'],
      pedidos: ['create', 'read', 'update', 'delete', 'export'],
      albaranes: ['create', 'read', 'update', 'delete', 'export'],
      facturas: ['create', 'read', 'update', 'delete', 'export'],
      ofertas: ['create', 'read', 'update', 'delete', 'export'],
      'presupuestos-compra': ['create', 'read', 'update', 'delete', 'export'],
      'pedidos-compra': ['create', 'read', 'update', 'delete', 'export'],
      'albaranes-compra': ['create', 'read', 'update', 'delete', 'export'],
      'facturas-compra': ['create', 'read', 'update', 'delete', 'export'],
      usuarios: ['create', 'read', 'update', 'delete'],
      roles: ['create', 'read', 'update', 'delete'],
      configuracion: ['read', 'update'],
      reportes: ['read', 'export'],
      proyectos: ['create', 'read', 'update', 'delete', 'export'],
      agentes: ['create', 'read', 'update', 'delete', 'export'],
      'formas-pago': ['create', 'read', 'update', 'delete'],
      'tipos-impuesto': ['create', 'read', 'update', 'delete'],
      'partes-trabajo': ['create', 'read', 'update', 'delete', 'export'],
      maquinaria: ['create', 'read', 'update', 'delete'],
      'tipos-gasto': ['create', 'read', 'update', 'delete'],
      personal: ['create', 'read', 'update', 'delete', 'export', 'import'],
      departamentos: ['create', 'read', 'update', 'delete'],
      calendarios: ['create', 'read', 'update', 'delete'],
      turnos: ['create', 'read', 'update', 'delete'],
      fichajes: ['create', 'read', 'update', 'delete', 'export'],
      terminales: ['create', 'read', 'update', 'delete'],
      tareas: ['create', 'read', 'update', 'delete', 'export'],
      planificacion: ['create', 'read', 'update', 'delete', 'export'],
      traspasos: ['create', 'read', 'update', 'delete', 'export'],
      inventarios: ['create', 'read', 'update', 'delete', 'export'],
      'ajustes-stock': ['create', 'read', 'update', 'delete', 'export'],
      tarifas: ['create', 'read', 'update', 'delete', 'export'],
    },
  },
  gerente: {
    resources: {
      clientes: ['create', 'read', 'update', 'export'],
      proveedores: ['create', 'read', 'update', 'export'],
      productos: ['create', 'read', 'update', 'export'],
      familias: ['create', 'read', 'update', 'export'],
      almacenes: ['read', 'update', 'export'],
      presupuestos: ['create', 'read', 'update', 'delete', 'export'],
      pedidos: ['create', 'read', 'update', 'delete', 'export'],
      albaranes: ['create', 'read', 'update', 'delete', 'export'],
      facturas: ['create', 'read', 'update', 'delete', 'export'],
      'presupuestos-compra': ['create', 'read', 'update', 'delete', 'export'],
      'pedidos-compra': ['create', 'read', 'update', 'delete', 'export'],
      'albaranes-compra': ['create', 'read', 'update', 'delete', 'export'],
      'facturas-compra': ['create', 'read', 'update', 'delete', 'export'],
      usuarios: ['read'],
      configuracion: ['read'],
      reportes: ['read', 'export'],
      proyectos: ['create', 'read', 'update', 'delete', 'export'],
      agentes: ['read', 'update'],
      'formas-pago': ['read'],
      'tipos-impuesto': ['read'],
      'partes-trabajo': ['create', 'read', 'update', 'delete', 'export'],
      maquinaria: ['create', 'read', 'update', 'delete'],
      'tipos-gasto': ['create', 'read', 'update', 'delete'],
      personal: ['create', 'read', 'update', 'export'],
      departamentos: ['create', 'read', 'update'],
      calendarios: ['read', 'update'],
      turnos: ['read', 'update'],
      fichajes: ['create', 'read', 'update', 'delete', 'export'],
      terminales: ['read'],
    },
  },
  vendedor: {
    resources: {
      clientes: ['create', 'read', 'update'],
      proveedores: ['read'],
      productos: ['read'],
      familias: ['read'],
      almacenes: ['read'],
      presupuestos: ['create', 'read', 'update'],
      pedidos: ['create', 'read', 'update'],
      albaranes: ['create', 'read', 'update'],
      facturas: ['create', 'read'],
      'presupuestos-compra': ['read'],
      'pedidos-compra': ['read'],
      'albaranes-compra': ['read'],
      'facturas-compra': ['read'],
      configuracion: ['read'],
      reportes: ['read'],
      proyectos: ['read'],
      agentes: ['read'],
      'formas-pago': ['read'],
      'tipos-impuesto': ['read'],
      'partes-trabajo': ['read'],
      personal: ['read'],
      fichajes: ['read'],
    },
  },
  tecnico: {
    resources: {
      clientes: ['read'],
      proveedores: ['read'],
      productos: ['read', 'update'],
      familias: ['read'],
      almacenes: ['read', 'update'],
      presupuestos: ['read'],
      pedidos: ['read'],
      albaranes: ['read'],
      facturas: ['read'],
      'presupuestos-compra': ['read'],
      'pedidos-compra': ['read'],
      'albaranes-compra': ['read'],
      'facturas-compra': ['read'],
      reportes: ['read'],
      proyectos: ['read', 'update'],
      'formas-pago': ['read'],
      'tipos-impuesto': ['read'],
      'partes-trabajo': ['create', 'read', 'update'],
      maquinaria: ['read'],
      'tipos-gasto': ['read'],
      personal: ['read'],
      fichajes: ['create', 'read'],
    },
  },
  almacenero: {
    resources: {
      clientes: ['read'],
      proveedores: ['read'],
      productos: ['read', 'update'],
      familias: ['read'],
      almacenes: ['read', 'update', 'export'],
      presupuestos: ['read'],
      pedidos: ['read', 'update'],
      albaranes: ['read', 'update'],
      facturas: ['read'],
      'presupuestos-compra': ['read'],
      'pedidos-compra': ['read', 'update'],
      'albaranes-compra': ['read', 'update'],
      'facturas-compra': ['read'],
      reportes: ['read'],
      proyectos: ['read'],
      'formas-pago': ['read'],
      'tipos-impuesto': ['read'],
      'partes-trabajo': ['read'],
      maquinaria: ['read'],
      'tipos-gasto': ['read'],
      personal: ['read'],
      fichajes: ['create', 'read'],
    },
  },
  visualizador: {
    resources: {
      clientes: ['read'],
      proveedores: ['read'],
      productos: ['read'],
      familias: ['read'],
      almacenes: ['read'],
      presupuestos: ['read'],
      pedidos: ['read'],
      albaranes: ['read'],
      facturas: ['read'],
      'presupuestos-compra': ['read'],
      'pedidos-compra': ['read'],
      'albaranes-compra': ['read'],
      'facturas-compra': ['read'],
      configuracion: ['read'],
      reportes: ['read'],
      proyectos: ['read'],
      agentes: ['read'],
      'formas-pago': ['read'],
      'tipos-impuesto': ['read'],
      'partes-trabajo': ['read'],
      maquinaria: ['read'],
      'tipos-gasto': ['read'],
      personal: ['read'],
      departamentos: ['read'],
      calendarios: ['read'],
      turnos: ['read'],
      fichajes: ['read'],
      terminales: ['read'],
    },
  },
};
