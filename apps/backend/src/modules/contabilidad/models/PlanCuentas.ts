/**
 * Modelo de Plan de Cuentas Contables
 * Basado en PGC 2007 (Plan General Contable español)
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// Tipos de cuenta según su naturaleza en el balance
export enum TipoCuenta {
  ACTIVO = 'activo',
  PASIVO = 'pasivo',
  PATRIMONIO = 'patrimonio',
  INGRESO = 'ingreso',
  GASTO = 'gasto',
}

// Naturaleza del saldo (deudor o acreedor)
export enum NaturalezaCuenta {
  DEUDORA = 'deudora',   // Activos y Gastos (aumentan al Debe)
  ACREEDORA = 'acreedora', // Pasivos, Patrimonio e Ingresos (aumentan al Haber)
}

// Tipo de tercero vinculado a la cuenta
export enum TipoTercero {
  CLIENTE = 'cliente',
  PROVEEDOR = 'proveedor',
}

// Interface de cuenta contable
export interface ICuentaContable extends Document {
  // Identificación
  codigo: string;              // "1", "10", "100", "1000", "4300001"
  nombre: string;              // "Financiación básica", "Capital"
  descripcion?: string;        // Descripción ampliada de la cuenta

  // Jerarquía
  nivel: number;               // 1=grupo, 2=subgrupo, 3=cuenta, 4=subcuenta, 5+=auxiliar
  cuentaPadreId?: mongoose.Types.ObjectId;
  codigoPadre?: string;        // Para búsquedas rápidas

  // Clasificación contable
  tipo: TipoCuenta;
  naturaleza: NaturalezaCuenta;

  // Configuración
  esMovimiento: boolean;       // true si acepta apuntes (normalmente nivel >= 3)
  esSistema: boolean;          // true si es cuenta del PGC base (no editable)
  activa: boolean;

  // Vinculación con terceros (para cuentas auxiliares 430XXXXX, 400XXXXX)
  terceroId?: mongoose.Types.ObjectId;
  terceroTipo?: TipoTercero;
  terceroNombre?: string;      // Cache del nombre para búsquedas
  terceroNif?: string;         // Cache del NIF

  // Saldos calculados (se actualizan con cada asiento)
  saldoDebe: number;           // Suma de movimientos al Debe
  saldoHaber: number;          // Suma de movimientos al Haber
  saldo: number;               // saldoDebe - saldoHaber (o al revés según naturaleza)

  // Control
  ultimoMovimiento?: Date;
  numeroMovimientos: number;

  // Auditoría
  creadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaModificacion?: Date;
}

// Schema de cuenta contable
const CuentaContableSchema = new Schema<ICuentaContable>(
  {
    codigo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      // index se define abajo en schema.index() con unique
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },

    // Jerarquía
    nivel: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    cuentaPadreId: {
      type: Schema.Types.ObjectId,
      ref: 'CuentaContable',
    },
    codigoPadre: {
      type: String,
      trim: true,
    },

    // Clasificación
    tipo: {
      type: String,
      enum: Object.values(TipoCuenta),
      required: true,
    },
    naturaleza: {
      type: String,
      enum: Object.values(NaturalezaCuenta),
      required: true,
    },

    // Configuración
    esMovimiento: {
      type: Boolean,
      default: false,
    },
    esSistema: {
      type: Boolean,
      default: false,
    },
    activa: {
      type: Boolean,
      default: true,
    },

    // Tercero vinculado
    terceroId: {
      type: Schema.Types.ObjectId,
    },
    terceroTipo: {
      type: String,
      enum: Object.values(TipoTercero),
    },
    terceroNombre: {
      type: String,
      trim: true,
    },
    terceroNif: {
      type: String,
      trim: true,
    },

    // Saldos
    saldoDebe: {
      type: Number,
      default: 0,
    },
    saldoHaber: {
      type: Number,
      default: 0,
    },
    saldo: {
      type: Number,
      default: 0,
    },

    // Control
    ultimoMovimiento: {
      type: Date,
    },
    numeroMovimientos: {
      type: Number,
      default: 0,
    },

    // Auditoría
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    modificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaModificacion: {
      type: Date,
    },
  },
  {
    timestamps: false,
    collection: 'cuentas_contables',
  }
);

// Índices para rendimiento
CuentaContableSchema.index({ codigo: 1 }, { unique: true });
CuentaContableSchema.index({ nivel: 1, codigo: 1 });
CuentaContableSchema.index({ tipo: 1, activa: 1 });
CuentaContableSchema.index({ cuentaPadreId: 1 });
CuentaContableSchema.index({ terceroId: 1, terceroTipo: 1 });
CuentaContableSchema.index({ esMovimiento: 1, activa: 1 });
CuentaContableSchema.index({ nombre: 'text', codigo: 'text' }); // Búsqueda full-text

// Virtual para obtener código formateado con puntos
CuentaContableSchema.virtual('codigoFormateado').get(function () {
  const codigo = this.codigo;
  if (codigo.length <= 3) return codigo;
  // Formato: 430.00001 para subcuentas
  return `${codigo.substring(0, 3)}.${codigo.substring(3)}`;
});

// Virtual para nombre completo (código + nombre)
CuentaContableSchema.virtual('nombreCompleto').get(function () {
  return `${this.codigo} - ${this.nombre}`;
});

// Método para verificar si tiene movimientos
CuentaContableSchema.methods.tieneMovimientos = function (): boolean {
  return this.numeroMovimientos > 0;
};

// Método para calcular saldo según naturaleza
CuentaContableSchema.methods.calcularSaldo = function (): number {
  if (this.naturaleza === NaturalezaCuenta.DEUDORA) {
    return this.saldoDebe - this.saldoHaber;
  }
  return this.saldoHaber - this.saldoDebe;
};

// Pre-save: calcular nivel automáticamente y validar
CuentaContableSchema.pre('save', function (next) {
  // Calcular nivel según longitud del código
  if (!this.nivel) {
    this.nivel = this.codigo.length;
    if (this.nivel > 4) this.nivel = 4 + Math.floor((this.codigo.length - 4) / 2);
  }

  // Las cuentas de nivel >= 3 son de movimiento por defecto
  if (this.nivel >= 3 && this.esMovimiento === undefined) {
    this.esMovimiento = true;
  }

  // Calcular código padre
  if (this.codigo.length > 1 && !this.codigoPadre) {
    this.codigoPadre = this.codigo.slice(0, -1);
  }

  // Calcular saldo
  this.saldo = this.calcularSaldo();

  // Fecha de modificación
  this.fechaModificacion = new Date();

  next();
});

// Función helper para determinar tipo y naturaleza según grupo PGC
export function determinarTipoYNaturaleza(codigo: string): {
  tipo: TipoCuenta;
  naturaleza: NaturalezaCuenta;
} {
  const grupo = parseInt(codigo.charAt(0), 10);

  switch (grupo) {
    case 1: // Financiación básica
      return { tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA };
    case 2: // Activo no corriente
      return { tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA };
    case 3: // Existencias
      return { tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA };
    case 4: // Acreedores y deudores
      // Depende de la subcuenta
      if (codigo.startsWith('40') || codigo.startsWith('41')) {
        return { tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA };
      }
      if (codigo.startsWith('43') || codigo.startsWith('44')) {
        return { tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA };
      }
      if (codigo.startsWith('47')) {
        // Administraciones públicas: 470-473 deudora, 475-479 acreedora
        if (codigo.startsWith('470') || codigo.startsWith('471') ||
            codigo.startsWith('472') || codigo.startsWith('473')) {
          return { tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA };
        }
        return { tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA };
      }
      return { tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA };
    case 5: // Cuentas financieras
      return { tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA };
    case 6: // Compras y gastos
      return { tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA };
    case 7: // Ventas e ingresos
      return { tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA };
    case 8: // Gastos imputados al patrimonio neto
      return { tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA };
    case 9: // Ingresos imputados al patrimonio neto
      return { tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA };
    default:
      return { tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA };
  }
}

// Crear modelo
const CuentaContable = mongoose.model<ICuentaContable>('CuentaContable', CuentaContableSchema);

export default CuentaContable;
export { CuentaContableSchema };
