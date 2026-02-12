import mongoose, { Schema, Document } from 'mongoose';

/**
 * Schema de Mesa
 * Representa una mesa física en un salón
 * Incluye posición para el editor visual y estado en tiempo real
 */

export type EstadoMesa = 'libre' | 'ocupada' | 'reservada' | 'cuenta_pedida' | 'por_limpiar' | 'fuera_servicio';
export type FormaMesa = 'cuadrada' | 'rectangular' | 'redonda' | 'ovalada' | 'irregular';

export interface IMesa extends Document {
  numero: string;                   // Número/nombre de la mesa (Ej: "1", "T1", "VIP-1")
  nombre?: string;                  // Nombre descriptivo opcional
  salonId: mongoose.Types.ObjectId; // Salón al que pertenece

  // Posición en el plano (para editor visual)
  posicion: {
    x: number;                      // Posición X en el plano
    y: number;                      // Posición Y en el plano
    rotacion: number;               // Rotación en grados
  };

  // Dimensiones y forma
  forma: FormaMesa;
  dimensiones: {
    ancho: number;                  // Ancho en unidades del plano
    alto: number;                   // Alto en unidades del plano
  };

  // Capacidad
  capacidadMinima: number;          // Mínimo de comensales
  capacidadMaxima: number;          // Máximo de comensales
  capacidadOptima?: number;         // Capacidad óptima

  // Estado actual (se actualiza en tiempo real)
  estado: EstadoMesa;
  estadoInfo?: {
    pedidoId?: mongoose.Types.ObjectId;     // Pedido actual
    camareroId?: mongoose.Types.ObjectId;   // Camarero asignado
    clienteNombre?: string;                 // Nombre del cliente
    numComensales?: number;                 // Número de comensales actuales
    horaOcupacion?: Date;                   // Hora en que se ocupó
    horaUltimaActualizacion?: Date;         // Última actualización
    reservaId?: mongoose.Types.ObjectId;    // ID de reserva si está reservada
    importePendiente?: number;              // Importe pendiente de cobrar
    notasServicio?: string;                 // Notas del servicio actual
  };

  // Configuración
  configuracion?: {
    prioridad: number;              // Prioridad de asignación (1-10)
    esVIP: boolean;                 // Mesa VIP
    esFumadores: boolean;           // Zona fumadores
    tieneEnchufe: boolean;          // Tiene enchufe cerca
    tieneVistas: boolean;           // Tiene vistas
    esAccesible: boolean;           // Accesible para sillas de ruedas
    requiereReserva: boolean;       // Solo con reserva
    tarifaEspecial?: string;        // ID de tarifa especial si aplica
  };

  // Agrupación (para mesas que se pueden juntar)
  grupo?: {
    grupoId?: string;               // ID del grupo si está agrupada
    mesasPrincipales?: mongoose.Types.ObjectId[]; // Mesas que forman el grupo
    esPrincipal: boolean;           // Si es la mesa principal del grupo
  };

  // Colores personalizados
  colores?: {
    fondo?: string;                 // Color de fondo
    borde?: string;                 // Color del borde
    texto?: string;                 // Color del texto
  };

  // Historial de ocupación (para estadísticas)
  estadisticas?: {
    ocupacionesHoy: number;
    tiempoMedioOcupacion: number;   // En minutos
    importeMedioMesa: number;
    ultimaOcupacion?: Date;
  };

  // Mesa virtual (para pedidos rápidos: barra, llevar, etc.)
  virtual: boolean;
  tipoVirtual?: 'barra' | 'llevar' | 'recoger';

  orden: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MesaSchema = new Schema<IMesa>(
  {
    numero: {
      type: String,
      required: true,
      trim: true,
    },
    nombre: {
      type: String,
      trim: true,
    },
    salonId: {
      type: Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    posicion: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      rotacion: { type: Number, default: 0 },
    },
    forma: {
      type: String,
      enum: ['cuadrada', 'rectangular', 'redonda', 'ovalada', 'irregular'],
      default: 'cuadrada',
    },
    dimensiones: {
      ancho: { type: Number, default: 2 },
      alto: { type: Number, default: 2 },
    },
    capacidadMinima: {
      type: Number,
      default: 1,
    },
    capacidadMaxima: {
      type: Number,
      default: 4,
    },
    capacidadOptima: {
      type: Number,
    },
    estado: {
      type: String,
      enum: ['libre', 'ocupada', 'reservada', 'cuenta_pedida', 'por_limpiar', 'fuera_servicio'],
      default: 'libre',
    },
    estadoInfo: {
      pedidoId: { type: Schema.Types.ObjectId, ref: 'Pedido' },
      camareroId: { type: Schema.Types.ObjectId, ref: 'Usuario' },
      clienteNombre: String,
      numComensales: Number,
      horaOcupacion: Date,
      horaUltimaActualizacion: Date,
      reservaId: { type: Schema.Types.ObjectId, ref: 'Reserva' },
      importePendiente: Number,
      notasServicio: String,
    },
    configuracion: {
      prioridad: { type: Number, default: 5 },
      esVIP: { type: Boolean, default: false },
      esFumadores: { type: Boolean, default: false },
      tieneEnchufe: { type: Boolean, default: false },
      tieneVistas: { type: Boolean, default: false },
      esAccesible: { type: Boolean, default: true },
      requiereReserva: { type: Boolean, default: false },
      tarifaEspecial: String,
    },
    grupo: {
      grupoId: String,
      mesasPrincipales: [{ type: Schema.Types.ObjectId, ref: 'Mesa' }],
      esPrincipal: { type: Boolean, default: true },
    },
    colores: {
      fondo: String,
      borde: String,
      texto: String,
    },
    estadisticas: {
      ocupacionesHoy: { type: Number, default: 0 },
      tiempoMedioOcupacion: { type: Number, default: 0 },
      importeMedioMesa: { type: Number, default: 0 },
      ultimaOcupacion: Date,
    },
    virtual: {
      type: Boolean,
      default: false,
    },
    tipoVirtual: {
      type: String,
      enum: ['barra', 'llevar', 'recoger'],
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

// Índices
MesaSchema.index({ salonId: 1, numero: 1 }, { unique: true });
MesaSchema.index({ salonId: 1 });
MesaSchema.index({ estado: 1 });
MesaSchema.index({ activo: 1 });
MesaSchema.index({ 'estadoInfo.camareroId': 1 });
MesaSchema.index({ 'estadoInfo.pedidoId': 1 });

export const Mesa = mongoose.model<IMesa>('Mesa', MesaSchema);
