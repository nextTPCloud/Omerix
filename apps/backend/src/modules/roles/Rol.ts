import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Permisos especiales granulares
 * Controlan acceso a funcionalidades específicas más allá del CRUD básico
 */
export interface IPermisosEspeciales {
  // Visibilidad de datos financieros
  verCostes: boolean;              // Ver precios de compra/coste
  verMargenes: boolean;            // Ver márgenes de beneficio
  verDatosFacturacion: boolean;    // Ver datos de facturación de clientes

  // Edición de precios
  modificarPVP: boolean;           // Modificar precio de venta
  modificarPrecioCompra: boolean;  // Modificar precio de compra

  // Descuentos
  aplicarDescuentos: boolean;      // Puede aplicar descuentos
  descuentoMaximo: number;         // Porcentaje máximo de descuento permitido (0-100)

  // Gestión del sistema
  accederConfiguracion: boolean;   // Acceder a configuración de empresa
  gestionarUsuarios: boolean;      // Crear/editar/eliminar usuarios
  gestionarRoles: boolean;         // Crear/editar roles personalizados

  // Operaciones masivas
  exportarDatos: boolean;          // Exportar datos a Excel/CSV
  importarDatos: boolean;          // Importar datos masivamente

  // Operaciones especiales
  anularDocumentos: boolean;       // Anular facturas, albaranes, etc.
  eliminarDocumentos: boolean;     // Eliminar documentos (no solo anular)
  verHistorialCambios: boolean;    // Ver historial de modificaciones

  // Acceso a módulos
  accesoVentas: boolean;           // Acceso al módulo de ventas
  accesoCompras: boolean;          // Acceso al módulo de compras
  accesoAlmacen: boolean;          // Acceso al módulo de almacén
  accesoContabilidad: boolean;     // Acceso a contabilidad/informes financieros
  accesoTPV: boolean;              // Acceso al TPV
  accesoCobroVencimientosTPV: boolean;   // Cobrar vencimientos desde TPV
  accesoPagoVencimientosTPV: boolean;    // Pagar vencimientos desde TPV
  accesoRRHH: boolean;             // Acceso al módulo de RRHH/Personal
  accesoInformes: boolean;         // Acceso al módulo de informes
  accesoTesoreria: boolean;        // Acceso al módulo de tesorería
  accesoProyectos: boolean;        // Acceso al módulo de proyectos
  accesoCRM: boolean;              // Acceso al módulo CRM (clientes avanzado)
}

/**
 * Acciones CRUD estándar sobre recursos
 */
export type AccionRecurso = 'create' | 'read' | 'update' | 'delete' | 'export' | 'import';

/**
 * Recursos del sistema sobre los que se pueden aplicar permisos
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
  // RRHH / Personal
  | 'personal'
  | 'departamentos'
  | 'turnos'
  | 'calendarios'
  | 'fichajes'
  | 'planificacion'
  // Informes
  | 'informes'
  // Tesorería
  | 'tesoreria'
  | 'recibos'
  | 'pagares'
  | 'vencimientos'
  // Stock
  | 'stock'
  | 'inventarios'
  | 'traspasos'
  // TPV - Punto de Venta
  | 'tpv'              // Gestion de TPVs registrados
  | 'tpv-sesiones'     // Ver/cerrar sesiones de TPV
  | 'cajas'            // Cajas registradoras
  // Otros
  | 'tarifas'
  | 'ofertas'
  | 'series-documentos'
  | 'terminales';

/**
 * Estructura de permisos por recurso
 */
export interface IPermisosRecursos {
  [recurso: string]: AccionRecurso[];
}

/**
 * Estructura completa de permisos de un rol
 */
export interface IPermisos {
  recursos: IPermisosRecursos;
  especiales: IPermisosEspeciales;
}

/**
 * Roles base del sistema (predefinidos)
 */
export type RolBase = 'admin' | 'gerente' | 'vendedor' | 'tecnico' | 'almacenero' | 'visualizador';

/**
 * Interface del modelo Rol
 */
export interface IRol extends Document {
  _id: Types.ObjectId;
  empresaId: Types.ObjectId;     // Empresa a la que pertenece este rol
  codigo: string;                // Código único dentro de la empresa
  nombre: string;                // Nombre descriptivo
  descripcion?: string;          // Descripción del rol

  // Herencia de rol base (opcional)
  rolBase?: RolBase;             // Si está definido, hereda permisos de este rol

  // Permisos del rol
  permisos: IPermisos;

  // Configuración
  color?: string;                // Color para identificar el rol en UI
  icono?: string;                // Icono del rol
  orden: number;                 // Orden de visualización

  // Estado
  activo: boolean;
  esSistema: boolean;            // true = rol del sistema (no editable/eliminable)

  // Auditoría
  creadoPor?: Types.ObjectId;
  modificadoPor?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
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
  accesoCobroVencimientosTPV: false,
  accesoPagoVencimientosTPV: false,
  accesoRRHH: false,
  accesoInformes: false,
  accesoTesoreria: false,
  accesoProyectos: false,
  accesoCRM: false,
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
  accesoCobroVencimientosTPV: true,
  accesoPagoVencimientosTPV: true,
  accesoRRHH: true,
  accesoInformes: true,
  accesoTesoreria: true,
  accesoProyectos: true,
  accesoCRM: true,
};

/**
 * Plantillas de roles del sistema
 */
export const ROLES_SISTEMA: Partial<IRol>[] = [
  {
    codigo: 'admin',
    nombre: 'Administrador',
    descripcion: 'Acceso completo al sistema',
    rolBase: 'admin',
    esSistema: true,
    orden: 1,
    color: '#dc2626',
    permisos: {
      recursos: {
        clientes: ['create', 'read', 'update', 'delete', 'export', 'import'],
        proveedores: ['create', 'read', 'update', 'delete', 'export', 'import'],
        productos: ['create', 'read', 'update', 'delete', 'export', 'import'],
        familias: ['create', 'read', 'update', 'delete'],
        almacenes: ['create', 'read', 'update', 'delete'],
        presupuestos: ['create', 'read', 'update', 'delete', 'export'],
        pedidos: ['create', 'read', 'update', 'delete', 'export'],
        albaranes: ['create', 'read', 'update', 'delete', 'export'],
        facturas: ['create', 'read', 'update', 'delete', 'export'],
        'presupuestos-compra': ['create', 'read', 'update', 'delete', 'export'],
        'pedidos-compra': ['create', 'read', 'update', 'delete', 'export'],
        'albaranes-compra': ['create', 'read', 'update', 'delete', 'export'],
        'facturas-compra': ['create', 'read', 'update', 'delete', 'export'],
        usuarios: ['create', 'read', 'update', 'delete'],
        roles: ['create', 'read', 'update', 'delete'],
        configuracion: ['read', 'update'],
        reportes: ['read', 'export'],
        proyectos: ['create', 'read', 'update', 'delete'],
        agentes: ['create', 'read', 'update', 'delete'],
        'formas-pago': ['create', 'read', 'update', 'delete'],
        'tipos-impuesto': ['create', 'read', 'update', 'delete'],
        'partes-trabajo': ['create', 'read', 'update', 'delete', 'export'],
        maquinaria: ['create', 'read', 'update', 'delete'],
        'tipos-gasto': ['create', 'read', 'update', 'delete'],
        // RRHH / Personal
        personal: ['create', 'read', 'update', 'delete', 'export', 'import'],
        departamentos: ['create', 'read', 'update', 'delete'],
        turnos: ['create', 'read', 'update', 'delete'],
        calendarios: ['create', 'read', 'update', 'delete'],
        fichajes: ['create', 'read', 'update', 'delete', 'export'],
        planificacion: ['create', 'read', 'update', 'delete'],
        // Informes
        informes: ['create', 'read', 'update', 'delete', 'export'],
        // Tesorería
        tesoreria: ['create', 'read', 'update', 'delete', 'export'],
        recibos: ['create', 'read', 'update', 'delete', 'export'],
        pagares: ['create', 'read', 'update', 'delete', 'export'],
        vencimientos: ['create', 'read', 'update', 'delete', 'export'],
        // Stock
        stock: ['create', 'read', 'update', 'delete', 'export'],
        inventarios: ['create', 'read', 'update', 'delete', 'export'],
        traspasos: ['create', 'read', 'update', 'delete', 'export'],
        // TPV
        tpv: ['create', 'read', 'update', 'delete'],
        'tpv-sesiones': ['read', 'delete'],
        cajas: ['create', 'read', 'update', 'delete', 'export'],
        // Otros
        tarifas: ['create', 'read', 'update', 'delete'],
        ofertas: ['create', 'read', 'update', 'delete'],
        'series-documentos': ['create', 'read', 'update', 'delete'],
        terminales: ['create', 'read', 'update', 'delete'],
      },
      especiales: PERMISOS_ESPECIALES_ADMIN,
    },
  },
  {
    codigo: 'gerente',
    nombre: 'Gerente',
    descripcion: 'Gestión completa de ventas y compras con visibilidad de costes',
    rolBase: 'gerente',
    esSistema: true,
    orden: 2,
    color: '#ea580c',
    permisos: {
      recursos: {
        clientes: ['create', 'read', 'update', 'export'],
        proveedores: ['create', 'read', 'update', 'export'],
        productos: ['create', 'read', 'update', 'export'],
        familias: ['create', 'read', 'update'],
        almacenes: ['read', 'update'],
        presupuestos: ['create', 'read', 'update', 'delete', 'export'],
        pedidos: ['create', 'read', 'update', 'delete', 'export'],
        albaranes: ['create', 'read', 'update', 'delete', 'export'],
        facturas: ['create', 'read', 'update', 'export'],
        'presupuestos-compra': ['create', 'read', 'update', 'delete', 'export'],
        'pedidos-compra': ['create', 'read', 'update', 'delete', 'export'],
        'albaranes-compra': ['create', 'read', 'update', 'delete', 'export'],
        'facturas-compra': ['create', 'read', 'update', 'export'],
        usuarios: ['read'],
        roles: ['read'],
        configuracion: ['read'],
        reportes: ['read', 'export'],
        proyectos: ['create', 'read', 'update', 'delete'],
        agentes: ['create', 'read', 'update'],
        'formas-pago': ['read'],
        'tipos-impuesto': ['read'],
        'partes-trabajo': ['create', 'read', 'update', 'delete', 'export'],
        maquinaria: ['create', 'read', 'update', 'delete'],
        'tipos-gasto': ['create', 'read', 'update', 'delete'],
        // RRHH / Personal
        personal: ['create', 'read', 'update', 'export'],
        departamentos: ['create', 'read', 'update'],
        turnos: ['read', 'update'],
        calendarios: ['read', 'update'],
        fichajes: ['read', 'export'],
        planificacion: ['create', 'read', 'update'],
        // Informes
        informes: ['create', 'read', 'update', 'export'],
        // Tesorería
        tesoreria: ['create', 'read', 'update', 'export'],
        recibos: ['create', 'read', 'update', 'export'],
        pagares: ['create', 'read', 'update', 'export'],
        vencimientos: ['create', 'read', 'update', 'export'],
        // Stock
        stock: ['read', 'update', 'export'],
        inventarios: ['create', 'read', 'update', 'export'],
        traspasos: ['create', 'read', 'update', 'export'],
        // TPV
        tpv: ['create', 'read', 'update'],
        'tpv-sesiones': ['read', 'delete'],
        cajas: ['create', 'read', 'update', 'export'],
        // Otros
        tarifas: ['create', 'read', 'update'],
        ofertas: ['create', 'read', 'update', 'delete'],
        'series-documentos': ['read'],
        terminales: ['read', 'update'],
      },
      especiales: {
        ...PERMISOS_ESPECIALES_DEFAULT,
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
        accesoRRHH: true,
        accesoInformes: true,
        accesoTesoreria: true,
        accesoProyectos: true,
        accesoCRM: true,
      },
    },
  },
  {
    codigo: 'vendedor',
    nombre: 'Vendedor',
    descripcion: 'Gestión de ventas sin visibilidad de costes',
    rolBase: 'vendedor',
    esSistema: true,
    orden: 3,
    color: '#16a34a',
    permisos: {
      recursos: {
        clientes: ['create', 'read', 'update'],
        proveedores: ['read'],
        productos: ['read'],
        familias: ['read'],
        almacenes: ['read'],
        presupuestos: ['create', 'read', 'update'],
        pedidos: ['create', 'read', 'update'],
        albaranes: ['create', 'read', 'update'],
        facturas: ['create', 'read'],
        'presupuestos-compra': [],
        'pedidos-compra': [],
        'albaranes-compra': [],
        'facturas-compra': [],
        usuarios: [],
        roles: [],
        configuracion: [],
        reportes: ['read'],
        proyectos: ['create', 'read', 'update'],
        agentes: ['read'],
        'formas-pago': ['read'],
        'tipos-impuesto': ['read'],
        'partes-trabajo': ['read'],
        maquinaria: [],
        'tipos-gasto': [],
        // RRHH limitado
        personal: [],
        departamentos: [],
        turnos: [],
        calendarios: [],
        fichajes: ['create', 'read'], // Solo sus propios fichajes
        planificacion: ['read'],
        // Informes limitado
        informes: ['read'],
        // Tesorería (solo lectura limitada)
        tesoreria: [],
        recibos: ['read'],
        pagares: [],
        vencimientos: ['read'],
        // Stock lectura
        stock: ['read'],
        inventarios: [],
        traspasos: [],
        // TPV - acceso operativo
        tpv: ['read'],
        'tpv-sesiones': [],
        cajas: ['create', 'read', 'update'],
        // Otros
        tarifas: ['read'],
        ofertas: ['read'],
        'series-documentos': [],
        terminales: ['read'],
      },
      especiales: {
        ...PERMISOS_ESPECIALES_DEFAULT,
        verCostes: false,
        verMargenes: false,
        modificarPVP: false,
        aplicarDescuentos: true,
        descuentoMaximo: 15,
        accesoVentas: true,
        accesoTPV: true,
        accesoInformes: true,
        accesoCRM: true,
      },
    },
  },
  {
    codigo: 'tecnico',
    nombre: 'Técnico',
    descripcion: 'Acceso a productos y pedidos para servicio técnico',
    rolBase: 'tecnico',
    esSistema: true,
    orden: 4,
    color: '#2563eb',
    permisos: {
      recursos: {
        clientes: ['read'],
        proveedores: ['read'],
        productos: ['read', 'update'],
        familias: ['read'],
        almacenes: ['read'],
        presupuestos: ['read'],
        pedidos: ['read'],
        albaranes: ['read'],
        facturas: [],
        'presupuestos-compra': [],
        'pedidos-compra': ['read'],
        'albaranes-compra': ['read'],
        'facturas-compra': [],
        usuarios: [],
        roles: [],
        configuracion: [],
        reportes: [],
        proyectos: ['read'],
        agentes: [],
        'formas-pago': [],
        'tipos-impuesto': [],
        'partes-trabajo': ['create', 'read', 'update'],
        maquinaria: ['read'],
        'tipos-gasto': ['read'],
        // RRHH limitado
        personal: [],
        departamentos: [],
        turnos: ['read'],
        calendarios: ['read'],
        fichajes: ['create', 'read'],
        planificacion: ['read'],
        // Informes
        informes: [],
        // Tesorería
        tesoreria: [],
        recibos: [],
        pagares: [],
        vencimientos: [],
        // Stock
        stock: ['read'],
        inventarios: ['read'],
        traspasos: ['read'],
        // TPV - sin acceso
        tpv: [],
        'tpv-sesiones': [],
        cajas: [],
        // Otros
        tarifas: [],
        ofertas: [],
        'series-documentos': [],
        terminales: [],
      },
      especiales: {
        ...PERMISOS_ESPECIALES_DEFAULT,
        verCostes: false,
        accesoAlmacen: true,
        accesoProyectos: true,
      },
    },
  },
  {
    codigo: 'almacenero',
    nombre: 'Almacenero',
    descripcion: 'Gestión de almacén y stock',
    rolBase: 'almacenero',
    esSistema: true,
    orden: 5,
    color: '#7c3aed',
    permisos: {
      recursos: {
        clientes: [],
        proveedores: ['read'],
        productos: ['read', 'update'],
        familias: ['read'],
        almacenes: ['read', 'update'],
        presupuestos: [],
        pedidos: ['read', 'update'],
        albaranes: ['read', 'update'],
        facturas: [],
        'presupuestos-compra': [],
        'pedidos-compra': ['read', 'update'],
        'albaranes-compra': ['read', 'update'],
        'facturas-compra': [],
        usuarios: [],
        roles: [],
        configuracion: [],
        reportes: [],
        proyectos: [],
        agentes: [],
        'formas-pago': [],
        'tipos-impuesto': [],
        'partes-trabajo': ['read'],
        maquinaria: ['read'],
        'tipos-gasto': ['read'],
        // RRHH limitado
        personal: [],
        departamentos: [],
        turnos: ['read'],
        calendarios: ['read'],
        fichajes: ['create', 'read'],
        planificacion: [],
        // Informes
        informes: [],
        // Tesorería
        tesoreria: [],
        recibos: [],
        pagares: [],
        vencimientos: [],
        // Stock - acceso completo
        stock: ['create', 'read', 'update', 'export'],
        inventarios: ['create', 'read', 'update', 'export'],
        traspasos: ['create', 'read', 'update', 'export'],
        // TPV - sin acceso
        tpv: [],
        'tpv-sesiones': [],
        cajas: [],
        // Otros
        tarifas: [],
        ofertas: [],
        'series-documentos': [],
        terminales: [],
      },
      especiales: {
        ...PERMISOS_ESPECIALES_DEFAULT,
        verCostes: true,
        accesoCompras: true,
        accesoAlmacen: true,
      },
    },
  },
  {
    codigo: 'visualizador',
    nombre: 'Solo Lectura',
    descripcion: 'Acceso de solo lectura a toda la información',
    rolBase: 'visualizador',
    esSistema: true,
    orden: 6,
    color: '#6b7280',
    permisos: {
      recursos: {
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
        usuarios: [],
        roles: [],
        configuracion: ['read'],
        reportes: ['read'],
        proyectos: ['read'],
        agentes: ['read'],
        'formas-pago': ['read'],
        'tipos-impuesto': ['read'],
        'partes-trabajo': ['read'],
        maquinaria: ['read'],
        'tipos-gasto': ['read'],
        // RRHH lectura
        personal: ['read'],
        departamentos: ['read'],
        turnos: ['read'],
        calendarios: ['read'],
        fichajes: ['read'],
        planificacion: ['read'],
        // Informes lectura
        informes: ['read'],
        // Tesorería lectura
        tesoreria: ['read'],
        recibos: ['read'],
        pagares: ['read'],
        vencimientos: ['read'],
        // Stock lectura
        stock: ['read'],
        inventarios: ['read'],
        traspasos: ['read'],
        // TPV lectura
        tpv: ['read'],
        'tpv-sesiones': ['read'],
        cajas: ['read'],
        // Otros lectura
        tarifas: ['read'],
        ofertas: ['read'],
        'series-documentos': ['read'],
        terminales: ['read'],
      },
      especiales: {
        ...PERMISOS_ESPECIALES_DEFAULT,
        verDatosFacturacion: true,
        accesoVentas: true,
        accesoCompras: true,
        accesoAlmacen: true,
        accesoInformes: true,
        accesoTesoreria: true,
        accesoProyectos: true,
      },
    },
  },
  // Nuevo rol específico para RRHH
  {
    codigo: 'rrhh',
    nombre: 'Recursos Humanos',
    descripcion: 'Gestión completa de personal y RRHH',
    rolBase: 'gerente',
    esSistema: true,
    orden: 7,
    color: '#0891b2',
    permisos: {
      recursos: {
        clientes: [],
        proveedores: [],
        productos: [],
        familias: [],
        almacenes: [],
        presupuestos: [],
        pedidos: [],
        albaranes: [],
        facturas: [],
        'presupuestos-compra': [],
        'pedidos-compra': [],
        'albaranes-compra': [],
        'facturas-compra': [],
        usuarios: ['read'],
        roles: [],
        configuracion: ['read'],
        reportes: ['read'],
        proyectos: ['read'],
        agentes: [],
        'formas-pago': [],
        'tipos-impuesto': [],
        'partes-trabajo': ['create', 'read', 'update', 'delete', 'export'],
        maquinaria: [],
        'tipos-gasto': [],
        // RRHH - acceso completo
        personal: ['create', 'read', 'update', 'delete', 'export', 'import'],
        departamentos: ['create', 'read', 'update', 'delete'],
        turnos: ['create', 'read', 'update', 'delete'],
        calendarios: ['create', 'read', 'update', 'delete'],
        fichajes: ['create', 'read', 'update', 'delete', 'export'],
        planificacion: ['create', 'read', 'update', 'delete'],
        // Informes de personal
        informes: ['create', 'read', 'update', 'export'],
        // Tesorería (nóminas relacionado)
        tesoreria: ['read'],
        recibos: [],
        pagares: [],
        vencimientos: [],
        // Stock
        stock: [],
        inventarios: [],
        traspasos: [],
        // TPV - sin acceso
        tpv: [],
        'tpv-sesiones': [],
        cajas: [],
        // Otros
        tarifas: [],
        ofertas: [],
        'series-documentos': [],
        terminales: [],
      },
      especiales: {
        ...PERMISOS_ESPECIALES_DEFAULT,
        exportarDatos: true,
        importarDatos: true,
        verHistorialCambios: true,
        accesoRRHH: true,
        accesoInformes: true,
        accesoProyectos: true,
      },
    },
  },
  // Nuevo rol para Tesorería
  {
    codigo: 'tesorero',
    nombre: 'Tesorero',
    descripcion: 'Gestión de tesorería, cobros y pagos',
    rolBase: 'gerente',
    esSistema: true,
    orden: 8,
    color: '#059669',
    permisos: {
      recursos: {
        clientes: ['read'],
        proveedores: ['read'],
        productos: [],
        familias: [],
        almacenes: [],
        presupuestos: ['read'],
        pedidos: ['read'],
        albaranes: ['read'],
        facturas: ['read', 'update'],
        'presupuestos-compra': ['read'],
        'pedidos-compra': ['read'],
        'albaranes-compra': ['read'],
        'facturas-compra': ['read', 'update'],
        usuarios: [],
        roles: [],
        configuracion: ['read'],
        reportes: ['read', 'export'],
        proyectos: [],
        agentes: [],
        'formas-pago': ['read'],
        'tipos-impuesto': ['read'],
        'partes-trabajo': [],
        maquinaria: [],
        'tipos-gasto': [],
        // RRHH
        personal: [],
        departamentos: [],
        turnos: [],
        calendarios: [],
        fichajes: ['create', 'read'],
        planificacion: [],
        // Informes
        informes: ['create', 'read', 'update', 'export'],
        // Tesorería - acceso completo
        tesoreria: ['create', 'read', 'update', 'delete', 'export'],
        recibos: ['create', 'read', 'update', 'delete', 'export'],
        pagares: ['create', 'read', 'update', 'delete', 'export'],
        vencimientos: ['create', 'read', 'update', 'delete', 'export'],
        // Stock
        stock: [],
        inventarios: [],
        traspasos: [],
        // TPV - lectura de cajas
        tpv: [],
        'tpv-sesiones': [],
        cajas: ['read', 'export'],
        // Otros
        tarifas: [],
        ofertas: [],
        'series-documentos': ['read'],
        terminales: [],
      },
      especiales: {
        ...PERMISOS_ESPECIALES_DEFAULT,
        verDatosFacturacion: true,
        exportarDatos: true,
        verHistorialCambios: true,
        accesoVentas: true,
        accesoCompras: true,
        accesoContabilidad: true,
        accesoTesoreria: true,
        accesoInformes: true,
      },
    },
  },
];

// =============================================
// SCHEMA DE MONGOOSE
// =============================================

const PermisosEspecialesSchema = new Schema<IPermisosEspeciales>({
  verCostes: { type: Boolean, default: false },
  verMargenes: { type: Boolean, default: false },
  verDatosFacturacion: { type: Boolean, default: false },
  modificarPVP: { type: Boolean, default: false },
  modificarPrecioCompra: { type: Boolean, default: false },
  aplicarDescuentos: { type: Boolean, default: false },
  descuentoMaximo: { type: Number, default: 0, min: 0, max: 100 },
  accederConfiguracion: { type: Boolean, default: false },
  gestionarUsuarios: { type: Boolean, default: false },
  gestionarRoles: { type: Boolean, default: false },
  exportarDatos: { type: Boolean, default: false },
  importarDatos: { type: Boolean, default: false },
  anularDocumentos: { type: Boolean, default: false },
  eliminarDocumentos: { type: Boolean, default: false },
  verHistorialCambios: { type: Boolean, default: false },
  accesoVentas: { type: Boolean, default: true },
  accesoCompras: { type: Boolean, default: false },
  accesoAlmacen: { type: Boolean, default: false },
  accesoContabilidad: { type: Boolean, default: false },
  accesoTPV: { type: Boolean, default: false },
  accesoCobroVencimientosTPV: { type: Boolean, default: false },
  accesoPagoVencimientosTPV: { type: Boolean, default: false },
  accesoRRHH: { type: Boolean, default: false },
  accesoInformes: { type: Boolean, default: false },
  accesoTesoreria: { type: Boolean, default: false },
  accesoProyectos: { type: Boolean, default: false },
  accesoCRM: { type: Boolean, default: false },
}, { _id: false });

const PermisosSchema = new Schema<IPermisos>({
  recursos: { type: Schema.Types.Mixed, default: {} },
  especiales: { type: PermisosEspecialesSchema, default: () => ({ ...PERMISOS_ESPECIALES_DEFAULT }) },
}, { _id: false });

const RolSchema = new Schema<IRol>(
  {
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: [true, 'La empresa es obligatoria'],
      index: true,
    },
    codigo: {
      type: String,
      required: [true, 'El código es obligatorio'],
      trim: true,
      lowercase: true,
      maxlength: [50, 'El código no puede exceder 50 caracteres'],
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    rolBase: {
      type: String,
      enum: ['admin', 'gerente', 'vendedor', 'tecnico', 'almacenero', 'visualizador'],
    },
    permisos: {
      type: PermisosSchema,
      required: true,
      default: () => ({
        recursos: {},
        especiales: { ...PERMISOS_ESPECIALES_DEFAULT },
      }),
    },
    color: {
      type: String,
      default: '#6b7280',
    },
    icono: {
      type: String,
    },
    orden: {
      type: Number,
      default: 100,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    esSistema: {
      type: Boolean,
      default: false,
    },
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    modificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
  },
  {
    timestamps: true,
  }
);

// Índice único: código único dentro de cada empresa
RolSchema.index({ empresaId: 1, codigo: 1 }, { unique: true });

// Índice para búsquedas por empresa y estado
RolSchema.index({ empresaId: 1, activo: 1 });

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

/**
 * Obtener permisos efectivos de un rol
 * Combina permisos del rol base (si existe) con los permisos personalizados
 */
RolSchema.statics.getPermisosEfectivos = function(rol: IRol): IPermisos {
  // Si tiene rol base, partir de esos permisos
  if (rol.rolBase) {
    const rolSistema = ROLES_SISTEMA.find(r => r.codigo === rol.rolBase);
    if (rolSistema?.permisos) {
      // Combinar permisos: rol.permisos sobrescribe rolSistema.permisos
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
};

/**
 * Verificar si un rol tiene permiso sobre un recurso y acción
 */
RolSchema.statics.tienePermiso = function(
  rol: IRol,
  recurso: RecursoSistema,
  accion: AccionRecurso
): boolean {
  const permisos = this.getPermisosEfectivos(rol);
  const permisosRecurso = permisos.recursos[recurso];
  return Array.isArray(permisosRecurso) && permisosRecurso.includes(accion);
};

/**
 * Verificar si un rol tiene un permiso especial
 */
RolSchema.statics.tienePermisoEspecial = function(
  rol: IRol,
  permiso: keyof IPermisosEspeciales
): boolean {
  const permisos = this.getPermisosEfectivos(rol);
  return !!permisos.especiales[permiso];
};

export default mongoose.model<IRol>('Rol', RolSchema);
