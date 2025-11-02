import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICliente extends Document {
  _id: {
      type: Types.ObjectId,
      auto: true, // ✅ Mongoose lo genera automáticamente
  },
  
  // Relación con empresa (multi-tenant)
  empresaId: Types.ObjectId;
  
  // Tipo de cliente
  tipoCliente: 'empresa' | 'particular';
  
  // Datos básicos
  codigo: string; // CLI-001
  nombre: string;
  nombreComercial?: string;
  
  // Datos fiscales
  nif: string;
  
  // Contacto
  email?: string;
  telefono?: string;
  movil?: string;
  web?: string;
  
  // Dirección
  direccion: {
    calle: string;
    numero?: string;
    piso?: string;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
  };
  
  // Dirección de envío (opcional)
  direccionEnvio?: {
    calle: string;
    numero?: string;
    piso?: string;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
  };
  
  // Datos comerciales
  formaPago: 'contado' | 'transferencia' | 'domiciliacion' | 'confirming' | 'pagare';
  diasPago: number; // días de vencimiento
  descuentoGeneral?: number; // % descuento
  tarifaId?: Types.ObjectId; // Tarifa especial asignada
  
  // Datos bancarios
  iban?: string;
  swift?: string;
  
  // Persona de contacto
  personaContacto?: {
    nombre: string;
    cargo?: string;
    telefono?: string;
    email?: string;
  };
  
  // Clasificación
  categoriaId?: Types.ObjectId;
  zona?: string;
  vendedorId?: Types.ObjectId;
  
  // Límites y riesgos
  limiteCredito?: number;
  riesgoActual?: number;
  
  // Estado
  activo: boolean;
  observaciones?: string;
  
  // Tags personalizados
  tags?: string[];
  
  // Campos personalizados
  camposPersonalizados?: Map<string, any>;
  
  // Auditoría
  creadoPor: Types.ObjectId;
  modificadoPor?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClienteSchema = new Schema<ICliente>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      auto: true, // Mongoose lo genera automáticamente
    },
    // Multi-tenant
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true,
      index: true,
    },
    
    // Tipo
    tipoCliente: {
      type: String,
      enum: ['empresa', 'particular'],
      required: true,
      default: 'particular',
    },
    
    // Datos básicos
    codigo: {
      type: String,
      required: false, // ✅ No required porque se genera automáticamente
      trim: true,
      uppercase: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    nombreComercial: {
      type: String,
      trim: true,
    },
    
    // Fiscal
    nif: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    
    // Contacto
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    telefono: {
      type: String,
      trim: true,
    },
    movil: {
      type: String,
      trim: true,
    },
    web: {
      type: String,
      trim: true,
    },
    
    // Dirección principal
    direccion: {
      calle: { type: String, required: true },
      numero: String,
      piso: String,
      codigoPostal: { type: String, required: true },
      ciudad: { type: String, required: true },
      provincia: { type: String, required: true },
      pais: { type: String, required: true, default: 'España' },
    },
    
    // Dirección de envío
    direccionEnvio: {
      calle: String,
      numero: String,
      piso: String,
      codigoPostal: String,
      ciudad: String,
      provincia: String,
      pais: String,
    },
    
    // Comercial
    formaPago: {
      type: String,
      enum: ['contado', 'transferencia', 'domiciliacion', 'confirming', 'pagare'],
      default: 'transferencia',
    },
    diasPago: {
      type: Number,
      default: 30,
      min: 0,
    },
    descuentoGeneral: {
      type: Number,
      min: 0,
      max: 100,
    },
    tarifaId: {
      type: Schema.Types.ObjectId,
      ref: 'Tarifa',
    },
    
    // Bancarios
    iban: {
      type: String,
      trim: true,
      uppercase: true,
    },
    swift: {
      type: String,
      trim: true,
      uppercase: true,
    },
    
    // Contacto
    personaContacto: {
      nombre: String,
      cargo: String,
      telefono: String,
      email: String,
    },
    
    // Clasificación
    categoriaId: {
      type: Schema.Types.ObjectId,
      ref: 'CategoriaCliente',
    },
    zona: String,
    vendedorId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    
    // Límites
    limiteCredito: {
      type: Number,
      min: 0,
    },
    riesgoActual: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Estado
    activo: {
      type: Boolean,
      default: true,
    },
    observaciones: {
      type: String,
      maxlength: 1000,
    },
    
    // Tags
    tags: [String],
    
    // Campos personalizados
    camposPersonalizados: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    
    // Auditoría
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    modificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
  },
  {
    timestamps: true,
    collection: 'clientes',
  }
);

// Índices compuestos para búsquedas eficientes
ClienteSchema.index({ empresaId: 1, codigo: 1 }, { 
  unique: true,
  sparse: true, // ✅ Permite documentos sin código temporalmente durante la creación
});
ClienteSchema.index({ empresaId: 1, nif: 1 });
ClienteSchema.index({ empresaId: 1, email: 1 });
ClienteSchema.index({ empresaId: 1, activo: 1 });
ClienteSchema.index({ empresaId: 1, nombre: 'text', nombreComercial: 'text' });

// Método para verificar límite de crédito
ClienteSchema.methods.tieneRiesgoExcedido = function(): boolean {
  if (!this.limiteCredito) return false;
  return this.riesgoActual > this.limiteCredito;
};

// Pre-save hook para código automático
ClienteSchema.pre('save', async function(next) {
  // Solo generar código si es un documento nuevo y no tiene código
  if (this.isNew && !this.codigo) {
    try {
      const ClienteModel = this.constructor as any;
      
      // Buscar el último cliente de la empresa ordenado por código
      const ultimoCliente = await ClienteModel
        .findOne({ empresaId: this.empresaId, codigo: { $exists: true } })
        .sort({ codigo: -1 })
        .select('codigo')
        .lean();
      
      if (ultimoCliente && ultimoCliente.codigo) {
        // Extraer el número del código (CLI-001 -> 001)
        const match = ultimoCliente.codigo.match(/CLI-(\d+)/);
        if (match) {
          const ultimoNumero = parseInt(match[1], 10);
          const nuevoNumero = ultimoNumero + 1;
          this.codigo = `CLI-${String(nuevoNumero).padStart(3, '0')}`;
        } else {
          // Si el formato no coincide, empezar desde CLI-001
          this.codigo = 'CLI-001';
        }
      } else {
        // Si no hay clientes previos, empezar desde CLI-001
        this.codigo = 'CLI-001';
      }
      
      console.log(`✅ Código generado automáticamente: ${this.codigo} para empresa ${this.empresaId}`);
    } catch (error) {
      console.error('❌ Error generando código de cliente:', error);
      // En caso de error, generar código temporal único basado en timestamp
      this.codigo = `CLI-TMP-${Date.now().toString().slice(-8)}`;
      console.log(`⚠️ Código temporal generado: ${this.codigo}`);
    }
  }
  next();
});

export const Cliente = mongoose.model<ICliente>('Cliente', ClienteSchema);