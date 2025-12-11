import mongoose, { Schema, Document } from 'mongoose';

/**
 * ============================================
 * INTERFACES
 * ============================================
 */

// Configuración de columnas de una tabla
export interface IColumnaConfig {
  key: string;
  visible: boolean;
  orden: number;
  ancho?: number; // Ancho opcional en píxeles
}

// Configuración de ordenamiento
export interface ISortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Configuración de filtros por columna
export interface IColumnFilters {
  [key: string]: string | boolean | number;
}

// Filtro avanzado guardado
export interface ISavedAdvancedFilter {
  field: string;
  operator: string;
  value: string | number | boolean | string[];
  valueTo?: string | number;
}

// Configuración de un módulo específico
export interface IModuleConfig {
  columnas: IColumnaConfig[];
  sortConfig?: ISortConfig;
  columnFilters?: IColumnFilters;
  advancedFilters?: ISavedAdvancedFilter[]; // Filtros avanzados guardados
  paginacion?: {
    limit: 10 | 25 | 50 | 100; // Límite de registros por página
  };
  filtrosAdicionales?: any; // Filtros específicos del módulo (ej: activo: true)
  densidad?: 'compact' | 'normal' | 'comfortable'; // Densidad de la tabla
}

// Favorito del menú
export interface IFavorito {
  href: string;      // Ruta del elemento (ej: '/clientes', '/productos')
  title: string;     // Título a mostrar
  icon?: string;     // Nombre del icono (opcional, para referencia)
  orden: number;     // Orden en el que aparece
  fechaAgregado: Date;
}

// Documento principal
export interface IConfiguracionUsuario extends Document {
  _id: mongoose.Types.ObjectId;
  usuarioId: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;

  // Configuraciones por módulo
  configuraciones: {
    clientes?: IModuleConfig;
    productos?: IModuleConfig;
    facturas?: IModuleConfig;
    pedidos?: IModuleConfig;
    ordenesTrabajo?: IModuleConfig;
    proveedores?: IModuleConfig;
    almacenes?: IModuleConfig;
    inventario?: IModuleConfig;
    usuarios?: IModuleConfig;
    [key: string]: IModuleConfig | undefined; // Permitir módulos dinámicos
  };

  // Favoritos del menú
  favoritos: IFavorito[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * ============================================
 * SCHEMA
 * ============================================
 */

const ColumnaConfigSchema = new Schema<IColumnaConfig>(
  {
    key: {
      type: String,
      required: true,
    },
    visible: {
      type: Boolean,
      required: true,
      default: true,
    },
    orden: {
      type: Number,
      required: true,
      default: 0,
    },
    ancho: {
      type: Number,
      min: 50,
      max: 500,
    },
  },
  { _id: false }
);

const SortConfigSchema = new Schema<ISortConfig>(
  {
    key: {
      type: String,
      required: true,
    },
    direction: {
      type: String,
      enum: ['asc', 'desc'],
      required: true,
    },
  },
  { _id: false }
);

const ModuleConfigSchema = new Schema<IModuleConfig>(
  {
    columnas: {
      type: [ColumnaConfigSchema],
      default: [],
    },
    sortConfig: {
      type: SortConfigSchema,
      default: null,
    },
    columnFilters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    advancedFilters: {
      type: Schema.Types.Mixed,
      default: [],
    },
    paginacion: {
      limit: {
        type: Number,
        enum: [10, 25, 50, 100],
        default: 25,
      },
    },
    filtrosAdicionales: {
      type: Schema.Types.Mixed,
      default: {},
    },
    densidad: {
      type: String,
      enum: ['compact', 'normal', 'comfortable'],
      default: 'normal',
    },
  },
  { _id: false }
);

const FavoritoSchema = new Schema<IFavorito>(
  {
    href: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
    },
    orden: {
      type: Number,
      default: 0,
    },
    fechaAgregado: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ConfiguracionUsuarioSchema = new Schema<IConfiguracionUsuario>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El usuario es obligatorio'],
      index: true,
    },
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: [true, 'La empresa es obligatoria'],
      index: true,
    },
    configuraciones: {
      clientes: { type: ModuleConfigSchema, default: null },
      productos: { type: ModuleConfigSchema, default: null },
      facturas: { type: ModuleConfigSchema, default: null },
      pedidos: { type: ModuleConfigSchema, default: null },
      ordenesTrabajo: { type: ModuleConfigSchema, default: null },
      proveedores: { type: ModuleConfigSchema, default: null },
      almacenes: { type: ModuleConfigSchema, default: null },
      inventario: { type: ModuleConfigSchema, default: null },
      usuarios: { type: ModuleConfigSchema, default: null },
    },
    favoritos: {
      type: [FavoritoSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * ============================================
 * ÍNDICES
 * ============================================
 */

// Índice único por usuario y empresa
ConfiguracionUsuarioSchema.index(
  { usuarioId: 1, empresaId: 1 },
  { unique: true }
);

/**
 * ============================================
 * EXPORT
 * ============================================
 */

export default mongoose.model<IConfiguracionUsuario>(
  'ConfiguracionUsuario',
  ConfiguracionUsuarioSchema
);