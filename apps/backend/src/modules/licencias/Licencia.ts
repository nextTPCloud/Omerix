import mongoose, { Schema, Document } from 'mongoose';

export interface ILicencia extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  
  // Estado de la licencia
  estado: 'trial' | 'activa' | 'suspendida' | 'cancelada' | 'expirada';
  
  // Trial
  esTrial: boolean;
  fechaInicioTrial: Date;
  fechaFinTrial: Date;
  
  // Suscripción
  tipoSuscripcion: 'mensual' | 'anual';
  fechaInicio: Date;
  fechaRenovacion: Date;
  fechaCancelacion?: Date;
  
  // IDs de suscripciones en pasarelas ← AÑADIR ESTO
  stripeSubscriptionId?: string;
  paypalSubscriptionId?: string;

  // Uso actual (se actualiza en tiempo real)
  usoActual: {
    usuariosSimultaneos: number;
    usuariosTotales: number;
    facturasEsteMes: number;
    productosActuales: number;
    almacenesActuales: number;
    clientesActuales: number;
    tpvsActuales: number;
    almacenamientoUsadoGB: number;
    llamadasAPIHoy: number;
    emailsEsteMes: number;
    smsEsteMes: number;
    whatsappEsteMes: number;
  };
  
  // Add-ons contratados
  addOns: Array<{
    nombre: string;
    precioMensual: number;
    activo: boolean;
    fechaActivacion: Date;
  }>;
  
  // Historial de cambios
  historial: Array<{
    fecha: Date;
    accion: string;
    planAnterior?: string;
    planNuevo?: string;
    motivo?: string;
  }>;
  
   // Métodos ← AÑADIR ESTO
  isTrialExpired(): boolean;
  isActive(): boolean;
  getDiasTrialRestantes(): number;

  createdAt: Date;
  updatedAt: Date;
}

const LicenciaSchema = new Schema<ILicencia>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true,
      unique: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    estado: {
      type: String,
      enum: ['trial', 'activa', 'suspendida', 'cancelada', 'expirada'],
      default: 'trial',
    },
    esTrial: {
      type: Boolean,
      default: true,
    },
    fechaInicioTrial: {
      type: Date,
      default: Date.now,
    },
    fechaFinTrial: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    },
    tipoSuscripcion: {
      type: String,
      enum: ['mensual', 'anual'],
      default: 'mensual',
    },
    fechaInicio: {
      type: Date,
      default: Date.now,
    },
    fechaRenovacion: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    fechaCancelacion: {
      type: Date,
    },
    usoActual: {
      usuariosSimultaneos: { type: Number, default: 0 },
      usuariosTotales: { type: Number, default: 1 },
      facturasEsteMes: { type: Number, default: 0 },
      productosActuales: { type: Number, default: 0 },
      almacenesActuales: { type: Number, default: 1 },
      clientesActuales: { type: Number, default: 0 },
      tpvsActuales: { type: Number, default: 0 },
      almacenamientoUsadoGB: { type: Number, default: 0 },
      llamadasAPIHoy: { type: Number, default: 0 },
      emailsEsteMes: { type: Number, default: 0 },
      smsEsteMes: { type: Number, default: 0 },
      whatsappEsteMes: { type: Number, default: 0 },
    },
    addOns: [
      {
        nombre: String,
        precioMensual: Number,
        activo: { type: Boolean, default: true },
        fechaActivacion: { type: Date, default: Date.now },
      },
    ],
    historial: [
      {
        fecha: { type: Date, default: Date.now },
        accion: String,
        planAnterior: String,
        planNuevo: String,
        motivo: String,
      },
    ],
    // IDs de suscripciones en pasarelas ← AÑADIR ESTO
    stripeSubscriptionId: String,
    paypalSubscriptionId: String,
  },
  {
    timestamps: true,
  }
);

// Índices
LicenciaSchema.index({ estado: 1 });
LicenciaSchema.index({ fechaRenovacion: 1 });

// Método para verificar si el trial ha expirado
LicenciaSchema.methods.isTrialExpired = function () {
  if (!this.esTrial) return false;
  return new Date() > this.fechaFinTrial;
};

// Método para verificar si la licencia está activa
LicenciaSchema.methods.isActive = function () {
  if (this.estado === 'suspendida' || this.estado === 'cancelada') {
    return false;
  }
  
  if (this.esTrial) {
    return !this.isTrialExpired();
  }
  
  return this.estado === 'activa';
};

// Método para obtener días restantes de trial
LicenciaSchema.methods.getDiasTrialRestantes = function () {
  if (!this.esTrial) return 0;
  
  const now = new Date();
  const diff = this.fechaFinTrial.getTime() - now.getTime();
  const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  return Math.max(0, dias);
};

export default mongoose.model<ILicencia>('Licencia', LicenciaSchema);