import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoPlanificacion {
  BORRADOR = 'borrador',
  PUBLICADA = 'publicada',
  CERRADA = 'cerrada',
  CANCELADA = 'cancelada'
}

export enum TipoPlanificacion {
  SEMANAL = 'semanal',
  MENSUAL = 'mensual',
  TRIMESTRAL = 'trimestral',
  ANUAL = 'anual',
  PERSONALIZADA = 'personalizada'
}

export enum EstadoAsignacion {
  PLANIFICADA = 'planificada',
  CONFIRMADA = 'confirmada',
  EN_CURSO = 'en_curso',
  COMPLETADA = 'completada',
  AUSENCIA = 'ausencia',
  CANCELADA = 'cancelada'
}

export enum TipoAusencia {
  VACACIONES = 'vacaciones',
  BAJA_MEDICA = 'baja_medica',
  PERMISO_PERSONAL = 'permiso_personal',
  FORMACION = 'formacion',
  COMPENSACION = 'compensacion',
  FESTIVO = 'festivo',
  OTRO = 'otro'
}

// ============================================
// INTERFACES
// ============================================

export interface IAsignacionJornada {
  _id?: mongoose.Types.ObjectId;
  fecha: Date;
  personalId: mongoose.Types.ObjectId;
  personalNombre: string;
  turnoId?: mongoose.Types.ObjectId;
  turnoNombre?: string;
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  horasPlanificadas: number;
  horasReales?: number;
  ubicacion?: string;
  departamentoId?: mongoose.Types.ObjectId;
  departamentoNombre?: string;
  estado: EstadoAsignacion;
  esAusencia: boolean;
  tipoAusencia?: TipoAusencia;
  motivoAusencia?: string;
  notas?: string;
  color?: string;
  confirmadoPor?: mongoose.Types.ObjectId;
  confirmadoFecha?: Date;
}

export interface IResumenPlanificacion {
  totalHorasPlanificadas: number;
  totalEmpleadosPlanificados: number;
  horasPorDia: {
    fecha: string;
    horas: number;
    empleados: number;
  }[];
  horasPorEmpleado: {
    personalId: string;
    nombre: string;
    horas: number;
    dias: number;
  }[];
  ausencias: number;
  horasExtras: number;
}

export interface IPlanificacion {
  empresaId: mongoose.Types.ObjectId;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoPlanificacion;
  estado: EstadoPlanificacion;
  fechaInicio: Date;
  fechaFin: Date;
  departamentoId?: mongoose.Types.ObjectId;
  departamentoNombre?: string;
  asignaciones: IAsignacionJornada[];
  resumen?: IResumenPlanificacion;
  creadoPorId: mongoose.Types.ObjectId;
  creadoPorNombre: string;
  publicadoPorId?: mongoose.Types.ObjectId;
  publicadoPorNombre?: string;
  fechaPublicacion?: Date;
  notas?: string;
  plantillaBase?: mongoose.Types.ObjectId;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlanificacionDocument extends IPlanificacion, Document {}

export interface IPlanificacionModel extends Model<IPlanificacionDocument> {
  generarCodigo(empresaId: mongoose.Types.ObjectId): Promise<string>;
  calcularResumen(planificacion: IPlanificacionDocument): IResumenPlanificacion;
}

// ============================================
// SCHEMA
// ============================================

const AsignacionJornadaSchema = new Schema<IAsignacionJornada>({
  fecha: { type: Date, required: true },
  personalId: { type: Schema.Types.ObjectId, ref: 'Personal', required: true },
  personalNombre: { type: String, required: true },
  turnoId: { type: Schema.Types.ObjectId, ref: 'Turno' },
  turnoNombre: { type: String },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
  horasPlanificadas: { type: Number, required: true, default: 0 },
  horasReales: { type: Number },
  ubicacion: { type: String },
  departamentoId: { type: Schema.Types.ObjectId, ref: 'Departamento' },
  departamentoNombre: { type: String },
  estado: {
    type: String,
    enum: Object.values(EstadoAsignacion),
    default: EstadoAsignacion.PLANIFICADA
  },
  esAusencia: { type: Boolean, default: false },
  tipoAusencia: { type: String, enum: Object.values(TipoAusencia) },
  motivoAusencia: { type: String },
  notas: { type: String },
  color: { type: String },
  confirmadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  confirmadoFecha: { type: Date }
});

const PlanificacionSchema = new Schema<IPlanificacionDocument, IPlanificacionModel>(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
    codigo: { type: String, required: true },
    nombre: { type: String, required: true },
    descripcion: { type: String },
    tipo: {
      type: String,
      enum: Object.values(TipoPlanificacion),
      default: TipoPlanificacion.SEMANAL
    },
    estado: {
      type: String,
      enum: Object.values(EstadoPlanificacion),
      default: EstadoPlanificacion.BORRADOR
    },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    departamentoId: { type: Schema.Types.ObjectId, ref: 'Departamento' },
    departamentoNombre: { type: String },
    asignaciones: [AsignacionJornadaSchema],
    resumen: {
      totalHorasPlanificadas: { type: Number, default: 0 },
      totalEmpleadosPlanificados: { type: Number, default: 0 },
      horasPorDia: [{
        fecha: String,
        horas: Number,
        empleados: Number
      }],
      horasPorEmpleado: [{
        personalId: String,
        nombre: String,
        horas: Number,
        dias: Number
      }],
      ausencias: { type: Number, default: 0 },
      horasExtras: { type: Number, default: 0 }
    },
    creadoPorId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    creadoPorNombre: { type: String, required: true },
    publicadoPorId: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    publicadoPorNombre: { type: String },
    fechaPublicacion: { type: Date },
    notas: { type: String },
    plantillaBase: { type: Schema.Types.ObjectId, ref: 'Planificacion' },
    activo: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    collection: 'planificaciones'
  }
);

// ============================================
// INDICES
// ============================================

PlanificacionSchema.index({ empresaId: 1, codigo: 1 }, { unique: true });
PlanificacionSchema.index({ empresaId: 1, fechaInicio: 1, fechaFin: 1 });
PlanificacionSchema.index({ empresaId: 1, estado: 1 });
PlanificacionSchema.index({ empresaId: 1, departamentoId: 1 });
PlanificacionSchema.index({ 'asignaciones.personalId': 1 });
PlanificacionSchema.index({ 'asignaciones.fecha': 1 });

// ============================================
// METODOS ESTATICOS
// ============================================

PlanificacionSchema.statics.generarCodigo = async function(empresaId: mongoose.Types.ObjectId): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PLN-${year}`;

  const ultimaPlan = await this.findOne(
    { empresaId, codigo: { $regex: `^${prefix}` } },
    { codigo: 1 },
    { sort: { codigo: -1 } }
  );

  if (!ultimaPlan) {
    return `${prefix}-0001`;
  }

  const numActual = parseInt(ultimaPlan.codigo.split('-').pop() || '0');
  const nuevoNum = (numActual + 1).toString().padStart(4, '0');
  return `${prefix}-${nuevoNum}`;
};

PlanificacionSchema.statics.calcularResumen = function(planificacion: IPlanificacionDocument): IResumenPlanificacion {
  const asignaciones = planificacion.asignaciones || [];

  // Calcular horas totales
  const totalHorasPlanificadas = asignaciones
    .filter(a => !a.esAusencia)
    .reduce((sum, a) => sum + (a.horasPlanificadas || 0), 0);

  // Empleados unicos
  const empleadosUnicos = new Set(asignaciones.map(a => a.personalId.toString()));

  // Horas por dia
  const horasPorDiaMap = new Map<string, { horas: number; empleados: Set<string> }>();
  asignaciones.forEach(a => {
    if (a.esAusencia) return;
    const fechaStr = a.fecha.toISOString().split('T')[0];
    if (!horasPorDiaMap.has(fechaStr)) {
      horasPorDiaMap.set(fechaStr, { horas: 0, empleados: new Set() });
    }
    const dia = horasPorDiaMap.get(fechaStr)!;
    dia.horas += a.horasPlanificadas || 0;
    dia.empleados.add(a.personalId.toString());
  });

  const horasPorDia = Array.from(horasPorDiaMap.entries()).map(([fecha, data]) => ({
    fecha,
    horas: data.horas,
    empleados: data.empleados.size
  }));

  // Horas por empleado
  const horasPorEmpleadoMap = new Map<string, { nombre: string; horas: number; dias: Set<string> }>();
  asignaciones.forEach(a => {
    if (a.esAusencia) return;
    const id = a.personalId.toString();
    if (!horasPorEmpleadoMap.has(id)) {
      horasPorEmpleadoMap.set(id, { nombre: a.personalNombre, horas: 0, dias: new Set() });
    }
    const emp = horasPorEmpleadoMap.get(id)!;
    emp.horas += a.horasPlanificadas || 0;
    emp.dias.add(a.fecha.toISOString().split('T')[0]);
  });

  const horasPorEmpleado = Array.from(horasPorEmpleadoMap.entries()).map(([personalId, data]) => ({
    personalId,
    nombre: data.nombre,
    horas: data.horas,
    dias: data.dias.size
  }));

  // Ausencias
  const ausencias = asignaciones.filter(a => a.esAusencia).length;

  // Horas extras (si horasReales > horasPlanificadas)
  const horasExtras = asignaciones.reduce((sum, a) => {
    if (a.horasReales && a.horasReales > a.horasPlanificadas) {
      return sum + (a.horasReales - a.horasPlanificadas);
    }
    return sum;
  }, 0);

  return {
    totalHorasPlanificadas,
    totalEmpleadosPlanificados: empleadosUnicos.size,
    horasPorDia,
    horasPorEmpleado,
    ausencias,
    horasExtras
  };
};

// ============================================
// HOOKS
// ============================================

PlanificacionSchema.pre('save', async function(next) {
  if (!this.codigo) {
    const Planificacion = this.constructor as IPlanificacionModel;
    this.codigo = await Planificacion.generarCodigo(this.empresaId);
  }

  // Calcular resumen antes de guardar
  const Planificacion = this.constructor as IPlanificacionModel;
  this.resumen = Planificacion.calcularResumen(this);

  next();
});

// ============================================
// MODELO
// ============================================

export const Planificacion = mongoose.model<IPlanificacionDocument, IPlanificacionModel>(
  'Planificacion',
  PlanificacionSchema
);

export default Planificacion;
