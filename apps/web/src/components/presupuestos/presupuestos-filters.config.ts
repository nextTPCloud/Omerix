import { FilterableField } from '@/components/ui/advanced-filters';
import { ESTADOS_PRESUPUESTO } from '@/types/presupuesto.types';

// Configuración de campos filtrables para el módulo de presupuestos
export const PRESUPUESTOS_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: PRE-2024-001',
  },
  {
    key: 'clienteNombre',
    label: 'Cliente',
    type: 'text',
    placeholder: 'Nombre del cliente',
  },
  {
    key: 'titulo',
    label: 'Título',
    type: 'text',
    placeholder: 'Título del presupuesto',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: ESTADOS_PRESUPUESTO.map(e => ({
      value: e.value,
      label: e.label,
    })),
  },
  {
    key: 'fecha',
    label: 'Fecha',
    type: 'date',
  },
  {
    key: 'fechaValidez',
    label: 'Fecha Validez',
    type: 'date',
  },
  {
    key: 'totalPresupuesto',
    label: 'Importe Total',
    type: 'currency',
    placeholder: 'Ej: 1000',
  },
  {
    key: 'subtotalNeto',
    label: 'Base Imponible',
    type: 'currency',
    placeholder: 'Ej: 850',
  },
  {
    key: 'margenBruto',
    label: 'Margen',
    type: 'currency',
    placeholder: 'Ej: 200',
  },
  {
    key: 'agenteComercial',
    label: 'Agente Comercial',
    type: 'text',
    placeholder: 'Nombre del agente',
  },
  {
    key: 'proyecto',
    label: 'Proyecto',
    type: 'text',
    placeholder: 'Nombre del proyecto',
  },
  {
    key: 'activo',
    label: 'Activo',
    type: 'boolean',
  },
];

// Campos filtrables para el módulo de pedidos
export const PEDIDOS_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
  },
  {
    key: 'clienteNombre',
    label: 'Cliente',
    type: 'text',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'borrador', label: 'Borrador' },
      { value: 'confirmado', label: 'Confirmado' },
      { value: 'en_proceso', label: 'En proceso' },
      { value: 'parcialmente_servido', label: 'Parcialmente servido' },
      { value: 'completado', label: 'Completado' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
  },
  {
    key: 'prioridad',
    label: 'Prioridad',
    type: 'select',
    options: [
      { value: 'baja', label: 'Baja' },
      { value: 'media', label: 'Media' },
      { value: 'alta', label: 'Alta' },
      { value: 'urgente', label: 'Urgente' },
    ],
  },
  {
    key: 'fecha',
    label: 'Fecha',
    type: 'date',
  },
  {
    key: 'fechaEntregaComprometida',
    label: 'Fecha Entrega',
    type: 'date',
  },
  {
    key: 'totalPedido',
    label: 'Importe Total',
    type: 'currency',
  },
];

// Campos filtrables para el módulo de albaranes
export const ALBARANES_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
  },
  {
    key: 'clienteNombre',
    label: 'Cliente',
    type: 'text',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'borrador', label: 'Borrador' },
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'entregado', label: 'Entregado' },
      { value: 'facturado', label: 'Facturado' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
  },
  {
    key: 'fecha',
    label: 'Fecha',
    type: 'date',
  },
  {
    key: 'fechaEntrega',
    label: 'Fecha Entrega',
    type: 'date',
  },
  {
    key: 'totalAlbaran',
    label: 'Importe Total',
    type: 'currency',
  },
  {
    key: 'facturado',
    label: 'Facturado',
    type: 'boolean',
  },
];

// Campos filtrables para el módulo de facturas
export const FACTURAS_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
  },
  {
    key: 'clienteNombre',
    label: 'Cliente',
    type: 'text',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'borrador', label: 'Borrador' },
      { value: 'emitida', label: 'Emitida' },
      { value: 'enviada', label: 'Enviada' },
      { value: 'parcialmente_cobrada', label: 'Parcialmente cobrada' },
      { value: 'cobrada', label: 'Cobrada' },
      { value: 'vencida', label: 'Vencida' },
      { value: 'anulada', label: 'Anulada' },
    ],
  },
  {
    key: 'tipo',
    label: 'Tipo',
    type: 'select',
    options: [
      { value: 'ordinaria', label: 'Ordinaria' },
      { value: 'rectificativa', label: 'Rectificativa' },
      { value: 'proforma', label: 'Proforma' },
    ],
  },
  {
    key: 'fecha',
    label: 'Fecha',
    type: 'date',
  },
  {
    key: 'fechaVencimiento',
    label: 'Fecha Vencimiento',
    type: 'date',
  },
  {
    key: 'totalFactura',
    label: 'Importe Total',
    type: 'currency',
  },
  {
    key: 'importePendiente',
    label: 'Pendiente Cobro',
    type: 'currency',
  },
  {
    key: 'cobrada',
    label: 'Cobrada',
    type: 'boolean',
  },
  {
    key: 'vencida',
    label: 'Vencida',
    type: 'boolean',
  },
];

// Campos filtrables para el módulo de clientes
export const CLIENTES_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: CLI-001',
  },
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Nombre del cliente',
  },
  {
    key: 'nombreComercial',
    label: 'Nombre Comercial',
    type: 'text',
    placeholder: 'Nombre comercial',
  },
  {
    key: 'nif',
    label: 'NIF/CIF',
    type: 'text',
    placeholder: 'Ej: B12345678',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    placeholder: 'email@ejemplo.com',
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    type: 'text',
    placeholder: 'Ej: 612345678',
  },
  {
    key: 'tipoCliente',
    label: 'Tipo Cliente',
    type: 'select',
    options: [
      { value: 'empresa', label: 'Empresa' },
      { value: 'particular', label: 'Particular' },
    ],
  },
  {
    key: 'riesgoActual',
    label: 'Riesgo Actual',
    type: 'currency',
    placeholder: 'Ej: 5000',
  },
  {
    key: 'limiteCredito',
    label: 'Límite Crédito',
    type: 'currency',
    placeholder: 'Ej: 10000',
  },
  {
    key: 'createdAt',
    label: 'Fecha Alta',
    type: 'date',
  },
  {
    key: 'activo',
    label: 'Activo',
    type: 'boolean',
  },
];

// Campos filtrables para el módulo de productos
export const PRODUCTOS_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: PROD-001',
  },
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Nombre del producto',
  },
  {
    key: 'sku',
    label: 'SKU',
    type: 'text',
    placeholder: 'Código SKU',
  },
  {
    key: 'tipo',
    label: 'Tipo',
    type: 'select',
    options: [
      { value: 'producto', label: 'Producto' },
      { value: 'servicio', label: 'Servicio' },
      { value: 'kit', label: 'Kit' },
    ],
  },
  {
    key: 'precioVenta',
    label: 'Precio Venta',
    type: 'currency',
    placeholder: 'Ej: 100',
  },
  {
    key: 'coste',
    label: 'Coste',
    type: 'currency',
    placeholder: 'Ej: 50',
  },
  {
    key: 'stockActual',
    label: 'Stock',
    type: 'number',
    placeholder: 'Ej: 100',
  },
  {
    key: 'stockMinimo',
    label: 'Stock Mínimo',
    type: 'number',
    placeholder: 'Ej: 10',
  },
  {
    key: 'margen',
    label: 'Margen %',
    type: 'number',
    placeholder: 'Ej: 30',
  },
  {
    key: 'activo',
    label: 'Activo',
    type: 'boolean',
  },
  {
    key: 'controlaStock',
    label: 'Controla Stock',
    type: 'boolean',
  },
];

// Campos filtrables para el módulo de proyectos
export const PROYECTOS_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: PROY-001',
  },
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Nombre del proyecto',
  },
  {
    key: 'clienteNombre',
    label: 'Cliente',
    type: 'text',
    placeholder: 'Nombre del cliente',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'planificado', label: 'Planificado' },
      { value: 'en_curso', label: 'En curso' },
      { value: 'pausado', label: 'Pausado' },
      { value: 'completado', label: 'Completado' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
  },
  {
    key: 'fechaInicio',
    label: 'Fecha Inicio',
    type: 'date',
  },
  {
    key: 'fechaFin',
    label: 'Fecha Fin',
    type: 'date',
  },
  {
    key: 'presupuesto',
    label: 'Presupuesto',
    type: 'currency',
    placeholder: 'Ej: 50000',
  },
  {
    key: 'activo',
    label: 'Activo',
    type: 'boolean',
  },
];

// Campos filtrables para el módulo de personal
export const PERSONAL_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: EMP-001',
  },
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Nombre',
  },
  {
    key: 'apellidos',
    label: 'Apellidos',
    type: 'text',
    placeholder: 'Apellidos',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    placeholder: 'email@ejemplo.com',
  },
  {
    key: 'departamento',
    label: 'Departamento',
    type: 'text',
    placeholder: 'Departamento',
  },
  {
    key: 'cargo',
    label: 'Cargo',
    type: 'text',
    placeholder: 'Cargo',
  },
  {
    key: 'fechaAlta',
    label: 'Fecha Alta',
    type: 'date',
  },
  {
    key: 'activo',
    label: 'Activo',
    type: 'boolean',
  },
];

// Campos filtrables para el módulo de agentes comerciales
export const AGENTES_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: AG-001',
  },
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Nombre',
  },
  {
    key: 'apellidos',
    label: 'Apellidos',
    type: 'text',
    placeholder: 'Apellidos',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    placeholder: 'email@ejemplo.com',
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    type: 'text',
    placeholder: 'Ej: 612345678',
  },
  {
    key: 'comision',
    label: 'Comisión %',
    type: 'number',
    placeholder: 'Ej: 5',
  },
  {
    key: 'activo',
    label: 'Activo',
    type: 'boolean',
  },
];

// ============================================
// MÓDULOS DE COMPRAS
// ============================================

// Campos filtrables para el módulo de proveedores
export const PROVEEDORES_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: PROV-001',
  },
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Nombre del proveedor',
  },
  {
    key: 'nombreComercial',
    label: 'Nombre Comercial',
    type: 'text',
    placeholder: 'Nombre comercial',
  },
  {
    key: 'nif',
    label: 'NIF/CIF',
    type: 'text',
    placeholder: 'Ej: B12345678',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    placeholder: 'email@ejemplo.com',
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    type: 'text',
    placeholder: 'Ej: 612345678',
  },
  {
    key: 'tipoProveedor',
    label: 'Tipo',
    type: 'select',
    options: [
      { value: 'empresa', label: 'Empresa' },
      { value: 'autonomo', label: 'Autónomo' },
      { value: 'particular', label: 'Particular' },
    ],
  },
  {
    key: 'calificacion',
    label: 'Calificación',
    type: 'number',
    placeholder: 'Ej: 4',
  },
  {
    key: 'totalCompras',
    label: 'Total Compras',
    type: 'currency',
    placeholder: 'Ej: 50000',
  },
  {
    key: 'diasPago',
    label: 'Días de Pago',
    type: 'number',
    placeholder: 'Ej: 30',
  },
  {
    key: 'createdAt',
    label: 'Fecha Alta',
    type: 'date',
  },
  {
    key: 'activo',
    label: 'Activo',
    type: 'boolean',
  },
];

// Campos filtrables para el módulo de pedidos de compra
export const PEDIDOS_COMPRA_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: PC-2024-001',
  },
  {
    key: 'proveedorNombre',
    label: 'Proveedor',
    type: 'text',
    placeholder: 'Nombre del proveedor',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'borrador', label: 'Borrador' },
      { value: 'enviado', label: 'Enviado' },
      { value: 'confirmado', label: 'Confirmado' },
      { value: 'parcialmente_recibido', label: 'Parcialmente recibido' },
      { value: 'recibido', label: 'Recibido' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
  },
  {
    key: 'fecha',
    label: 'Fecha',
    type: 'date',
  },
  {
    key: 'fechaEntregaPrevista',
    label: 'Fecha Entrega Prevista',
    type: 'date',
  },
  {
    key: 'totalPedido',
    label: 'Importe Total',
    type: 'currency',
  },
];

// Campos filtrables para el módulo de albaranes de compra
export const ALBARANES_COMPRA_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: AC-2024-001',
  },
  {
    key: 'proveedorNombre',
    label: 'Proveedor',
    type: 'text',
    placeholder: 'Nombre del proveedor',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'borrador', label: 'Borrador' },
      { value: 'recibido', label: 'Recibido' },
      { value: 'verificado', label: 'Verificado' },
      { value: 'facturado', label: 'Facturado' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
  },
  {
    key: 'fecha',
    label: 'Fecha',
    type: 'date',
  },
  {
    key: 'fechaRecepcion',
    label: 'Fecha Recepción',
    type: 'date',
  },
  {
    key: 'totalAlbaran',
    label: 'Importe Total',
    type: 'currency',
  },
  {
    key: 'facturado',
    label: 'Facturado',
    type: 'boolean',
  },
];

// Campos filtrables para el módulo de facturas de compra
export const FACTURAS_COMPRA_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: FC-2024-001',
  },
  {
    key: 'numeroProveedor',
    label: 'Nº Factura Proveedor',
    type: 'text',
    placeholder: 'Número del proveedor',
  },
  {
    key: 'proveedorNombre',
    label: 'Proveedor',
    type: 'text',
    placeholder: 'Nombre del proveedor',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'borrador', label: 'Borrador' },
      { value: 'registrada', label: 'Registrada' },
      { value: 'parcialmente_pagada', label: 'Parcialmente pagada' },
      { value: 'pagada', label: 'Pagada' },
      { value: 'vencida', label: 'Vencida' },
      { value: 'anulada', label: 'Anulada' },
    ],
  },
  {
    key: 'fecha',
    label: 'Fecha',
    type: 'date',
  },
  {
    key: 'fechaVencimiento',
    label: 'Fecha Vencimiento',
    type: 'date',
  },
  {
    key: 'totalFactura',
    label: 'Importe Total',
    type: 'currency',
  },
  {
    key: 'importePendiente',
    label: 'Pendiente Pago',
    type: 'currency',
  },
  {
    key: 'pagada',
    label: 'Pagada',
    type: 'boolean',
  },
  {
    key: 'vencida',
    label: 'Vencida',
    type: 'boolean',
  },
];

// ============================================
// MÓDULOS DE CONTROL HORARIO
// ============================================

// Campos filtrables para el módulo de terminales biométricos
export const TERMINALES_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'codigo',
    label: 'Código',
    type: 'text',
    placeholder: 'Ej: TERM-001',
  },
  {
    key: 'nombre',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Nombre del terminal',
  },
  {
    key: 'ip',
    label: 'IP',
    type: 'text',
    placeholder: 'Ej: 192.168.1.100',
  },
  {
    key: 'marca',
    label: 'Marca',
    type: 'select',
    options: [
      { value: 'ZKTeco', label: 'ZKTeco' },
      { value: 'ANVIZ', label: 'ANVIZ' },
      { value: 'Hikvision', label: 'Hikvision' },
      { value: 'otro', label: 'Otro' },
    ],
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'activo', label: 'Activo' },
      { value: 'inactivo', label: 'Inactivo' },
      { value: 'error', label: 'Error' },
    ],
  },
  {
    key: 'estadoConexion',
    label: 'Conexión',
    type: 'select',
    options: [
      { value: 'conectado', label: 'Conectado' },
      { value: 'desconectado', label: 'Desconectado' },
      { value: 'desconocido', label: 'Desconocido' },
    ],
  },
  {
    key: 'ultimaSincronizacion',
    label: 'Última Sincronización',
    type: 'date',
  },
  {
    key: 'activo',
    label: 'Activo',
    type: 'boolean',
  },
];

// Campos filtrables para el módulo de fichajes
export const FICHAJES_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'personalNombre',
    label: 'Empleado',
    type: 'text',
    placeholder: 'Nombre del empleado',
  },
  {
    key: 'departamentoNombre',
    label: 'Departamento',
    type: 'text',
    placeholder: 'Departamento',
  },
  {
    key: 'fecha',
    label: 'Fecha',
    type: 'date',
  },
  {
    key: 'tipo',
    label: 'Tipo',
    type: 'select',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'teletrabajo', label: 'Teletrabajo' },
      { value: 'viaje', label: 'Viaje' },
      { value: 'formacion', label: 'Formación' },
    ],
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'abierto', label: 'Abierto' },
      { value: 'cerrado', label: 'Cerrado' },
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'aprobado', label: 'Aprobado' },
      { value: 'rechazado', label: 'Rechazado' },
    ],
  },
  {
    key: 'horasTrabajadas',
    label: 'Horas Trabajadas',
    type: 'number',
    placeholder: 'Ej: 8',
  },
  {
    key: 'incidencia',
    label: 'Con Incidencia',
    type: 'boolean',
  },
];

// ============================================
// MÓDULOS DE TESORERÍA
// ============================================

// Campos filtrables para el módulo de cobros (vencimientos tipo cobro)
export const COBROS_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'numero',
    label: 'Número',
    type: 'text',
    placeholder: 'Ej: VEN-C-24-00001',
  },
  {
    key: 'terceroNombre',
    label: 'Cliente',
    type: 'text',
    placeholder: 'Nombre del cliente',
  },
  {
    key: 'terceroNif',
    label: 'NIF Cliente',
    type: 'text',
    placeholder: 'Ej: B12345678',
  },
  {
    key: 'documentoNumero',
    label: 'Nº Factura',
    type: 'text',
    placeholder: 'Ej: FAC-2024-001',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'parcial', label: 'Parcial' },
      { value: 'cobrado', label: 'Cobrado' },
      { value: 'impagado', label: 'Impagado' },
      { value: 'anulado', label: 'Anulado' },
    ],
  },
  {
    key: 'fechaVencimiento',
    label: 'Fecha Vencimiento',
    type: 'date',
  },
  {
    key: 'fechaEmision',
    label: 'Fecha Emisión',
    type: 'date',
  },
  {
    key: 'importe',
    label: 'Importe',
    type: 'currency',
    placeholder: 'Ej: 1000',
  },
  {
    key: 'importePendiente',
    label: 'Pendiente',
    type: 'currency',
    placeholder: 'Ej: 500',
  },
  {
    key: 'vencido',
    label: 'Vencido',
    type: 'boolean',
  },
];

// Campos filtrables para el módulo de pagos (vencimientos tipo pago)
export const PAGOS_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: 'numero',
    label: 'Número',
    type: 'text',
    placeholder: 'Ej: VEN-P-24-00001',
  },
  {
    key: 'terceroNombre',
    label: 'Proveedor',
    type: 'text',
    placeholder: 'Nombre del proveedor',
  },
  {
    key: 'terceroNif',
    label: 'NIF Proveedor',
    type: 'text',
    placeholder: 'Ej: B12345678',
  },
  {
    key: 'documentoNumero',
    label: 'Nº Factura',
    type: 'text',
    placeholder: 'Ej: FC-2024-001',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'parcial', label: 'Parcial' },
      { value: 'pagado', label: 'Pagado' },
      { value: 'impagado', label: 'Impagado' },
      { value: 'anulado', label: 'Anulado' },
    ],
  },
  {
    key: 'fechaVencimiento',
    label: 'Fecha Vencimiento',
    type: 'date',
  },
  {
    key: 'fechaEmision',
    label: 'Fecha Emisión',
    type: 'date',
  },
  {
    key: 'importe',
    label: 'Importe',
    type: 'currency',
    placeholder: 'Ej: 1000',
  },
  {
    key: 'importePendiente',
    label: 'Pendiente',
    type: 'currency',
    placeholder: 'Ej: 500',
  },
  {
    key: 'vencido',
    label: 'Vencido',
    type: 'boolean',
  },
];
