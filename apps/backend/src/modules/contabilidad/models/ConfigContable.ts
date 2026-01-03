/**
 * Modelo de Configuración Contable
 * Configuración de contabilidad por empresa
 */

import mongoose, { Schema, Document } from 'mongoose';

// Cuentas por defecto del PGC
export interface ICuentasDefecto {
  // Grupo 4 - Acreedores y Deudores
  clientes: string;               // 430 - Clientes
  clientesDudosoCobro: string;    // 435 - Clientes dudoso cobro
  efectosComerciales: string;     // 431 - Efectos comerciales a cobrar
  proveedores: string;            // 400 - Proveedores
  proveedoresEfectos: string;     // 401 - Proveedores efectos a pagar
  acreedores: string;             // 410 - Acreedores

  // Grupo 6 - Compras y Gastos
  comprasMercaderias: string;     // 600 - Compras de mercaderías
  comprasMateriasPrimas: string;  // 601 - Compras materias primas
  rappelsCompras: string;         // 609 - Rappels por compras
  gastosPersonal: string;         // 640 - Sueldos y salarios
  seguridadSocial: string;        // 642 - Seguridad social cargo empresa
  serviciosExternos: string;      // 629 - Otros servicios

  // Grupo 7 - Ventas e Ingresos
  ventasMercaderias: string;      // 700 - Ventas de mercaderías
  ventasProductos: string;        // 701 - Ventas de productos terminados
  prestacionServicios: string;    // 705 - Prestación de servicios
  rappelsVentas: string;          // 709 - Rappels sobre ventas
  descuentosVentas: string;       // 706 - Descuentos sobre ventas

  // IVA Repercutido (grupo 477)
  ivaRepercutido21: string;       // 477.21 - IVA repercutido 21%
  ivaRepercutido10: string;       // 477.10 - IVA repercutido 10%
  ivaRepercutido4: string;        // 477.04 - IVA repercutido 4%
  ivaRepercutido0: string;        // 477.00 - IVA repercutido 0% (exento)

  // IVA Soportado (grupo 472)
  ivaSoportado21: string;         // 472.21 - IVA soportado 21%
  ivaSoportado10: string;         // 472.10 - IVA soportado 10%
  ivaSoportado4: string;          // 472.04 - IVA soportado 4%

  // Retenciones e impuestos
  retencionesIRPFPracticadas: string;  // 473 - Retenciones practicadas (a nosotros)
  retencionesIRPFSoportadas: string;   // 4751 - Retenciones soportadas (que practicamos)
  haciendaAcreedoraIVA: string;        // 4750 - Hacienda acreedora IVA
  haciendaDeudoraIVA: string;          // 4700 - Hacienda deudora IVA

  // Grupo 5 - Cuentas Financieras
  caja: string;                   // 570 - Caja
  cajaTpv: string;                // 5700 - Caja TPV (subcuenta)
  bancos: string;                 // 572 - Bancos
  efectosDescontados: string;     // 5208 - Deudas por efectos descontados

  // Grupo 1 - Patrimonio
  capital: string;                // 100 - Capital social
  reservas: string;               // 112 - Reservas
  resultadoEjercicio: string;     // 129 - Resultado del ejercicio
  remaneente: string;             // 120 - Remanente
}

// Estado de un período contable
export interface IPeriodoContable {
  mes: number;                    // 1-12
  cerrado: boolean;
  fechaCierre?: Date;
  cerradoPor?: mongoose.Types.ObjectId;
}

// Ejercicio contable
export interface IEjercicioContable {
  ejercicio: number;              // Año
  fechaInicio: Date;
  fechaFin: Date;
  cerrado: boolean;
  fechaCierre?: Date;
  cerradoPor?: mongoose.Types.ObjectId;
  periodos: IPeriodoContable[];
}

// Interface de configuración contable
export interface IConfigContable extends Document {
  // Ejercicio actual
  ejercicioActivo: number;

  // Ejercicios
  ejercicios: IEjercicioContable[];

  // Cuentas por defecto
  cuentasDefecto: ICuentasDefecto;

  // Numeración de asientos
  proximoNumeroAsiento: number;
  reiniciarNumeracionAnual: boolean;

  // Configuración de comportamiento
  generarAsientosAutomaticos: boolean;
  permitirAsientosDescuadrados: boolean;
  bloquearPeriodosCerrados: boolean;
  requerirConceptoEnLineas: boolean;
  permitirModificarContabilizados: boolean;

  // Configuración de subcuentas automáticas
  longitudSubcuentaCliente: number;    // Ej: 7 → 4300001
  longitudSubcuentaProveedor: number;
  prefijoCuentaCliente: string;        // Ej: "430"
  prefijoCuentaProveedor: string;      // Ej: "400"

  // Mapeo de cuentas por familia de productos (opcional)
  cuentasPorFamilia: Array<{
    familiaId: mongoose.Types.ObjectId;
    familiaNombre: string;
    cuentaVenta: string;
    cuentaCompra: string;
  }>;

  // Mapeo de cuentas por tipo de IVA
  cuentasPorTipoIva: Array<{
    tipoIvaId: mongoose.Types.ObjectId;
    porcentaje: number;
    cuentaIvaRepercutido: string;
    cuentaIvaSoportado: string;
  }>;

  // Formato de exportación preferido
  formatoExportacion: 'a3' | 'sage' | 'csv' | 'contasol';

  // Auditoría
  creadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaModificacion?: Date;
}

// Schema de período contable
const PeriodoContableSchema = new Schema<IPeriodoContable>(
  {
    mes: { type: Number, required: true, min: 1, max: 12 },
    cerrado: { type: Boolean, default: false },
    fechaCierre: { type: Date },
    cerradoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  },
  { _id: false }
);

// Schema de ejercicio contable
const EjercicioContableSchema = new Schema<IEjercicioContable>(
  {
    ejercicio: { type: Number, required: true },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    cerrado: { type: Boolean, default: false },
    fechaCierre: { type: Date },
    cerradoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    periodos: { type: [PeriodoContableSchema], default: [] },
  },
  { _id: false }
);

// Schema de cuentas por defecto
const CuentasDefectoSchema = new Schema<ICuentasDefecto>(
  {
    // Clientes y proveedores
    clientes: { type: String, default: '430' },
    clientesDudosoCobro: { type: String, default: '435' },
    efectosComerciales: { type: String, default: '431' },
    proveedores: { type: String, default: '400' },
    proveedoresEfectos: { type: String, default: '401' },
    acreedores: { type: String, default: '410' },

    // Compras
    comprasMercaderias: { type: String, default: '600' },
    comprasMateriasPrimas: { type: String, default: '601' },
    rappelsCompras: { type: String, default: '609' },
    gastosPersonal: { type: String, default: '640' },
    seguridadSocial: { type: String, default: '642' },
    serviciosExternos: { type: String, default: '629' },

    // Ventas
    ventasMercaderias: { type: String, default: '700' },
    ventasProductos: { type: String, default: '701' },
    prestacionServicios: { type: String, default: '705' },
    rappelsVentas: { type: String, default: '709' },
    descuentosVentas: { type: String, default: '706' },

    // IVA Repercutido
    ivaRepercutido21: { type: String, default: '4770021' },
    ivaRepercutido10: { type: String, default: '4770010' },
    ivaRepercutido4: { type: String, default: '4770004' },
    ivaRepercutido0: { type: String, default: '4770000' },

    // IVA Soportado
    ivaSoportado21: { type: String, default: '4720021' },
    ivaSoportado10: { type: String, default: '4720010' },
    ivaSoportado4: { type: String, default: '4720004' },

    // Retenciones
    retencionesIRPFPracticadas: { type: String, default: '473' },
    retencionesIRPFSoportadas: { type: String, default: '4751' },
    haciendaAcreedoraIVA: { type: String, default: '4750' },
    haciendaDeudoraIVA: { type: String, default: '4700' },

    // Tesorería
    caja: { type: String, default: '570' },
    cajaTpv: { type: String, default: '5700' },
    bancos: { type: String, default: '572' },
    efectosDescontados: { type: String, default: '5208' },

    // Patrimonio
    capital: { type: String, default: '100' },
    reservas: { type: String, default: '112' },
    resultadoEjercicio: { type: String, default: '129' },
    remaneente: { type: String, default: '120' },
  },
  { _id: false }
);

// Schema de configuración contable
const ConfigContableSchema = new Schema<IConfigContable>(
  {
    ejercicioActivo: {
      type: Number,
      default: () => new Date().getFullYear(),
    },

    ejercicios: {
      type: [EjercicioContableSchema],
      default: [],
    },

    cuentasDefecto: {
      type: CuentasDefectoSchema,
      default: () => ({}),
    },

    // Numeración
    proximoNumeroAsiento: {
      type: Number,
      default: 1,
    },
    reiniciarNumeracionAnual: {
      type: Boolean,
      default: true,
    },

    // Comportamiento
    generarAsientosAutomaticos: {
      type: Boolean,
      default: true,
    },
    permitirAsientosDescuadrados: {
      type: Boolean,
      default: false,
    },
    bloquearPeriodosCerrados: {
      type: Boolean,
      default: true,
    },
    requerirConceptoEnLineas: {
      type: Boolean,
      default: false,
    },
    permitirModificarContabilizados: {
      type: Boolean,
      default: false,
    },

    // Subcuentas automáticas
    longitudSubcuentaCliente: {
      type: Number,
      default: 7,
      min: 4,
      max: 10,
    },
    longitudSubcuentaProveedor: {
      type: Number,
      default: 7,
      min: 4,
      max: 10,
    },
    prefijoCuentaCliente: {
      type: String,
      default: '430',
    },
    prefijoCuentaProveedor: {
      type: String,
      default: '400',
    },

    // Mapeos personalizados
    cuentasPorFamilia: {
      type: [{
        familiaId: { type: Schema.Types.ObjectId },
        familiaNombre: { type: String },
        cuentaVenta: { type: String },
        cuentaCompra: { type: String },
      }],
      default: [],
    },

    cuentasPorTipoIva: {
      type: [{
        tipoIvaId: { type: Schema.Types.ObjectId },
        porcentaje: { type: Number },
        cuentaIvaRepercutido: { type: String },
        cuentaIvaSoportado: { type: String },
      }],
      default: [],
    },

    // Exportación
    formatoExportacion: {
      type: String,
      enum: ['a3', 'sage', 'csv', 'contasol'],
      default: 'csv',
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
    collection: 'config_contable',
  }
);

// Pre-save: actualizar fecha modificación
ConfigContableSchema.pre('save', function (next) {
  this.fechaModificacion = new Date();
  next();
});

// Método para obtener cuenta de IVA según porcentaje
ConfigContableSchema.methods.getCuentaIvaRepercutido = function (porcentaje: number): string {
  // Primero buscar en mapeo personalizado
  const mapeado = this.cuentasPorTipoIva.find(
    (c: { porcentaje: number }) => c.porcentaje === porcentaje
  );
  if (mapeado) return mapeado.cuentaIvaRepercutido;

  // Usar cuenta por defecto según porcentaje
  switch (porcentaje) {
    case 21: return this.cuentasDefecto.ivaRepercutido21;
    case 10: return this.cuentasDefecto.ivaRepercutido10;
    case 4: return this.cuentasDefecto.ivaRepercutido4;
    default: return this.cuentasDefecto.ivaRepercutido0;
  }
};

ConfigContableSchema.methods.getCuentaIvaSoportado = function (porcentaje: number): string {
  const mapeado = this.cuentasPorTipoIva.find(
    (c: { porcentaje: number }) => c.porcentaje === porcentaje
  );
  if (mapeado) return mapeado.cuentaIvaSoportado;

  switch (porcentaje) {
    case 21: return this.cuentasDefecto.ivaSoportado21;
    case 10: return this.cuentasDefecto.ivaSoportado10;
    case 4: return this.cuentasDefecto.ivaSoportado4;
    default: return this.cuentasDefecto.ivaSoportado21; // Por defecto 21%
  }
};

// Método para verificar si un período está cerrado
ConfigContableSchema.methods.estaPeriodoCerrado = function (
  ejercicio: number,
  mes: number
): boolean {
  if (!this.bloquearPeriodosCerrados) return false;

  const ej = this.ejercicios.find((e: IEjercicioContable) => e.ejercicio === ejercicio);
  if (!ej) return false;
  if (ej.cerrado) return true;

  const periodo = ej.periodos.find((p: IPeriodoContable) => p.mes === mes);
  return periodo?.cerrado || false;
};

// Método para obtener el siguiente número de asiento
ConfigContableSchema.methods.getSiguienteNumeroAsiento = function (): number {
  const siguiente = this.proximoNumeroAsiento;
  this.proximoNumeroAsiento += 1;
  return siguiente;
};

// Crear modelo
const ConfigContable = mongoose.model<IConfigContable>('ConfigContable', ConfigContableSchema);

export default ConfigContable;
export { ConfigContableSchema, CuentasDefectoSchema };
