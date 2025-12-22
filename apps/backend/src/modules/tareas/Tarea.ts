import { Schema, model, Document, Model, Types } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoTarea {
  PENDIENTE = 'pendiente',
  EN_PROGRESO = 'en_progreso',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
  VENCIDA = 'vencida',
}

export enum PrioridadTarea {
  BAJA = 'baja',
  NORMAL = 'normal',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum TipoTarea {
  GENERAL = 'general',
  RECORDATORIO = 'recordatorio',
  SEGUIMIENTO_CLIENTE = 'seguimiento_cliente',
  SEGUIMIENTO_PROVEEDOR = 'seguimiento_proveedor',
  COBRO = 'cobro',
  PAGO = 'pago',
  LLAMADA = 'llamada',
  REUNION = 'reunion',
  VISITA = 'visita',
  REVISION = 'revision',
  MANTENIMIENTO = 'mantenimiento',
  INVENTARIO = 'inventario',
  ENTREGA = 'entrega',
  OTRO = 'otro',
}

export enum RecurrenciaTarea {
  NINGUNA = 'ninguna',
  DIARIA = 'diaria',
  SEMANAL = 'semanal',
  QUINCENAL = 'quincenal',
  MENSUAL = 'mensual',
  TRIMESTRAL = 'trimestral',
  ANUAL = 'anual',
}

// ============================================
// INTERFACES
// ============================================

export interface IComentarioTarea {
  _id?: Types.ObjectId;
  usuarioId: Types.ObjectId;
  usuarioNombre: string;
  texto: string;
  fecha: Date;
}

export interface ITarea extends Document {
  titulo: string;
  descripcion?: string;
  tipo: TipoTarea;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;

  // Fechas
  fechaCreacion: Date;
  fechaVencimiento?: Date;
  fechaRecordatorio?: Date;
  fechaInicio?: Date;
  fechaCompletada?: Date;

  // Recurrencia
  recurrencia: RecurrenciaTarea;
  tareaOrigenId?: Types.ObjectId; // Si es generada por recurrencia
  proximaRecurrencia?: Date;

  // Asignación
  creadoPorId: Types.ObjectId;
  creadoPorNombre: string;
  asignadoAId?: Types.ObjectId;
  asignadoANombre?: string;
  departamentoId?: Types.ObjectId;
  departamentoNombre?: string;

  // Relaciones opcionales
  clienteId?: Types.ObjectId;
  clienteNombre?: string;
  proveedorId?: Types.ObjectId;
  proveedorNombre?: string;
  proyectoId?: Types.ObjectId;
  proyectoNombre?: string;
  documentoTipo?: string; // factura, pedido, presupuesto, etc.
  documentoId?: Types.ObjectId;
  documentoCodigo?: string;

  // Seguimiento
  porcentajeCompletado: number;
  horasEstimadas?: number;
  horasReales?: number;

  // Notificaciones
  enviarRecordatorio: boolean;
  recordatorioEnviado: boolean;
  notificarAlCompletar: boolean;

  // Etiquetas y categorías
  etiquetas?: string[];
  color?: string;

  // Comentarios
  comentarios: IComentarioTarea[];

  // Archivos adjuntos
  archivos?: {
    nombre: string;
    url: string;
    tipo: string;
    tamanio: number;
  }[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const ComentarioTareaSchema = new Schema<IComentarioTarea>({
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  usuarioNombre: { type: String, required: true },
  texto: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
}, { _id: true });

const TareaSchema = new Schema<ITarea>({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  tipo: { type: String, enum: Object.values(TipoTarea), default: TipoTarea.GENERAL },
  estado: { type: String, enum: Object.values(EstadoTarea), default: EstadoTarea.PENDIENTE },
  prioridad: { type: String, enum: Object.values(PrioridadTarea), default: PrioridadTarea.NORMAL },

  fechaCreacion: { type: Date, default: Date.now },
  fechaVencimiento: Date,
  fechaRecordatorio: Date,
  fechaInicio: Date,
  fechaCompletada: Date,

  recurrencia: { type: String, enum: Object.values(RecurrenciaTarea), default: RecurrenciaTarea.NINGUNA },
  tareaOrigenId: { type: Schema.Types.ObjectId, ref: 'Tarea' },
  proximaRecurrencia: Date,

  creadoPorId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  creadoPorNombre: { type: String, required: true },
  asignadoAId: { type: Schema.Types.ObjectId, ref: 'Personal' },
  asignadoANombre: String,
  departamentoId: { type: Schema.Types.ObjectId, ref: 'Departamento' },
  departamentoNombre: String,

  clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente' },
  clienteNombre: String,
  proveedorId: { type: Schema.Types.ObjectId, ref: 'Proveedor' },
  proveedorNombre: String,
  proyectoId: { type: Schema.Types.ObjectId, ref: 'Proyecto' },
  proyectoNombre: String,
  documentoTipo: String,
  documentoId: { type: Schema.Types.ObjectId },
  documentoCodigo: String,

  porcentajeCompletado: { type: Number, default: 0, min: 0, max: 100 },
  horasEstimadas: { type: Number, min: 0 },
  horasReales: { type: Number, min: 0 },

  enviarRecordatorio: { type: Boolean, default: true },
  recordatorioEnviado: { type: Boolean, default: false },
  notificarAlCompletar: { type: Boolean, default: false },

  etiquetas: [String],
  color: String,

  comentarios: [ComentarioTareaSchema],

  archivos: [{
    nombre: String,
    url: String,
    tipo: String,
    tamanio: Number,
  }],
}, { timestamps: true });

// ============================================
// ÍNDICES
// ============================================

TareaSchema.index({ estado: 1 });
TareaSchema.index({ prioridad: 1 });
TareaSchema.index({ fechaVencimiento: 1 });
TareaSchema.index({ asignadoAId: 1 });
TareaSchema.index({ creadoPorId: 1 });
TareaSchema.index({ clienteId: 1 });
TareaSchema.index({ proyectoId: 1 });
TareaSchema.index({ tipo: 1 });
TareaSchema.index({ recurrencia: 1, proximaRecurrencia: 1 });

// ============================================
// MÉTODOS
// ============================================

// Calcular siguiente fecha de recurrencia
TareaSchema.methods.calcularProximaRecurrencia = function(): Date | null {
  if (this.recurrencia === RecurrenciaTarea.NINGUNA || !this.fechaVencimiento) {
    return null;
  }

  const fecha = new Date(this.fechaVencimiento);

  switch (this.recurrencia) {
    case RecurrenciaTarea.DIARIA:
      fecha.setDate(fecha.getDate() + 1);
      break;
    case RecurrenciaTarea.SEMANAL:
      fecha.setDate(fecha.getDate() + 7);
      break;
    case RecurrenciaTarea.QUINCENAL:
      fecha.setDate(fecha.getDate() + 15);
      break;
    case RecurrenciaTarea.MENSUAL:
      fecha.setMonth(fecha.getMonth() + 1);
      break;
    case RecurrenciaTarea.TRIMESTRAL:
      fecha.setMonth(fecha.getMonth() + 3);
      break;
    case RecurrenciaTarea.ANUAL:
      fecha.setFullYear(fecha.getFullYear() + 1);
      break;
  }

  return fecha;
};

// ============================================
// EXPORT
// ============================================

export const Tarea = model<ITarea>('Tarea', TareaSchema);
export default Tarea;
