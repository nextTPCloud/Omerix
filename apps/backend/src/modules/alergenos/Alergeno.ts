import mongoose, { Schema, Document } from 'mongoose';

/**
 * Schema de Alérgeno
 * Los 14 alérgenos de declaración obligatoria en la UE más opcionales
 */

export interface IAlergeno extends Document {
  nombre: string;                   // Ej: "Gluten", "Crustáceos"
  codigo: string;                   // Código estándar: GLU, CRU, etc.
  descripcion?: string;
  icono?: string;                   // Emoji o URL de icono
  color?: string;
  esObligatorioUE: boolean;         // Si es de los 14 obligatorios
  orden: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlergenoSchema = new Schema<IAlergeno>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    codigo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    icono: {
      type: String,
    },
    color: {
      type: String,
      default: '#ef4444',
    },
    esObligatorioUE: {
      type: Boolean,
      default: false,
    },
    orden: {
      type: Number,
      default: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices (sin empresaId porque cada empresa tiene su propia BD)
AlergenoSchema.index({ codigo: 1 }, { unique: true });
AlergenoSchema.index({ activo: 1 });

export const Alergeno = mongoose.model<IAlergeno>('Alergeno', AlergenoSchema);

/**
 * Lista de los 14 alérgenos obligatorios en la UE
 * Para inicializar la base de datos
 */
export const ALERGENOS_UE = [
  { codigo: 'GLU', nombre: 'Gluten', descripcion: 'Cereales que contienen gluten: trigo, centeno, cebada, avena, espelta, kamut', icono: '🌾', orden: 1 },
  { codigo: 'CRU', nombre: 'Crustáceos', descripcion: 'Crustáceos y productos a base de crustáceos', icono: '🦐', orden: 2 },
  { codigo: 'HUE', nombre: 'Huevos', descripcion: 'Huevos y productos a base de huevo', icono: '🥚', orden: 3 },
  { codigo: 'PES', nombre: 'Pescado', descripcion: 'Pescado y productos a base de pescado', icono: '🐟', orden: 4 },
  { codigo: 'CAC', nombre: 'Cacahuetes', descripcion: 'Cacahuetes y productos a base de cacahuetes', icono: '🥜', orden: 5 },
  { codigo: 'SOJ', nombre: 'Soja', descripcion: 'Soja y productos a base de soja', icono: '🫘', orden: 6 },
  { codigo: 'LAC', nombre: 'Lácteos', descripcion: 'Leche y sus derivados (incluida la lactosa)', icono: '🥛', orden: 7 },
  { codigo: 'FRU', nombre: 'Frutos de cáscara', descripcion: 'Almendras, avellanas, nueces, anacardos, pacanas, nueces de Brasil, pistachos, macadamias', icono: '🌰', orden: 8 },
  { codigo: 'API', nombre: 'Apio', descripcion: 'Apio y productos derivados', icono: '🥬', orden: 9 },
  { codigo: 'MOS', nombre: 'Mostaza', descripcion: 'Mostaza y productos derivados', icono: '🟡', orden: 10 },
  { codigo: 'SES', nombre: 'Sésamo', descripcion: 'Granos de sésamo y productos a base de granos de sésamo', icono: '⚪', orden: 11 },
  { codigo: 'SUL', nombre: 'Sulfitos', descripcion: 'Dióxido de azufre y sulfitos en concentraciones superiores a 10mg/kg', icono: '🧪', orden: 12 },
  { codigo: 'ALT', nombre: 'Altramuces', descripcion: 'Altramuces y productos a base de altramuces', icono: '🫛', orden: 13 },
  { codigo: 'MOL', nombre: 'Moluscos', descripcion: 'Moluscos y productos a base de moluscos', icono: '🦪', orden: 14 },
];
