import mongoose, { Schema, Document } from 'mongoose';

/**
 * Modelo para Kioskos Registrados
 * Soporta 4 tipos de kiosko configurables:
 * - totem: Terminal de pie autoservicio
 * - qr_mesa: Cliente escanea QR, pide desde móvil
 * - tablet_mesa: Dispositivo fijo en mesa
 * - menu_digital: Solo visualización, sin pedidos
 */

export interface IKioskRegistrado extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificacion
  codigo: string;              // "KIOSK-001" (auto-generado)
  nombre: string;              // "Totem Entrada"
  deviceId: string;            // UUID unico generado en activacion

  // Autenticacion (mismo patron que TPV)
  secretHash: string;          // Hash del kioskSecret
  tokenVersion: number;        // Para invalidar tokens

  // Tipo de kiosko
  tipo: 'totem' | 'qr_mesa' | 'tablet_mesa' | 'menu_digital';

  // Vinculacion opcional
  salonId?: mongoose.Types.ObjectId;
  mesaId?: mongoose.Types.ObjectId;  // Para tablet_mesa o qr_mesa fijo

  // Configuracion de pagos
  pagos: {
    permitePago: boolean;           // Si el kiosko puede procesar pagos
    formasPagoIds: mongoose.Types.ObjectId[];  // Formas de pago habilitadas
    pagoObligatorio: boolean;       // Si requiere pagar antes de enviar
    tpvDestinoId?: mongoose.Types.ObjectId;    // TPV destino para pedidos sin pagar
  };

  // Tema y aspecto visual
  tema: {
    colorPrimario?: string;      // Color primario del tema
    colorSecundario?: string;    // Color secundario
    logoUrl?: string;            // URL del logo
    fondoUrl?: string;           // Imagen de fondo
    idiomas: string[];           // Idiomas disponibles ['es', 'en', 'ca']
    idiomaPorDefecto: string;    // Idioma por defecto
  };

  // Configuracion de comportamiento
  config: {
    // Filtrado de productos
    familiasVisibles?: mongoose.Types.ObjectId[];  // Si vacio, muestra todas

    // Comportamiento UI
    tiempoInactividad: number;     // Segundos antes de volver al inicio
    permitirComentarios: boolean;  // Si permite comentarios en lineas
    mostrarPrecios: boolean;       // Para menu_digital puede ocultarse
    mostrarAlergenos: boolean;
    mostrarCalorias: boolean;

    // Sesiones QR
    qrSessionDuration: number;    // Minutos de duracion de sesion QR

    // Flujo de pedido
    requiereNombreCliente: boolean;
    requiereTelefono: boolean;
    permitirParaLlevar: boolean;
  };

  // Estado y monitoreo
  estado: 'activo' | 'suspendido' | 'desactivado';
  ultimoAcceso?: Date;
  ultimaIP?: string;
  ultimaSync?: Date;
  versionApp?: string;

  // Desactivacion
  desactivadoPor?: mongoose.Types.ObjectId;
  motivoDesactivacion?: string;
  fechaDesactivacion?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const KioskRegistradoSchema = new Schema<IKioskRegistrado>(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
    },
    nombre: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    secretHash: {
      type: String,
      required: true,
    },
    tokenVersion: {
      type: Number,
      default: 1,
    },
    tipo: {
      type: String,
      enum: ['totem', 'qr_mesa', 'tablet_mesa', 'menu_digital'],
      required: true,
      default: 'totem',
    },
    salonId: {
      type: Schema.Types.ObjectId,
      ref: 'Salon',
    },
    mesaId: {
      type: Schema.Types.ObjectId,
      ref: 'Mesa',
    },
    pagos: {
      permitePago: { type: Boolean, default: false },
      formasPagoIds: [{
        type: Schema.Types.ObjectId,
        ref: 'FormaPago',
      }],
      pagoObligatorio: { type: Boolean, default: false },
      tpvDestinoId: {
        type: Schema.Types.ObjectId,
        ref: 'TPVRegistrado',
      },
    },
    tema: {
      colorPrimario: { type: String, default: '#3B82F6' },
      colorSecundario: { type: String, default: '#1E40AF' },
      logoUrl: String,
      fondoUrl: String,
      idiomas: [{ type: String }],
      idiomaPorDefecto: { type: String, default: 'es' },
    },
    config: {
      familiasVisibles: [{
        type: Schema.Types.ObjectId,
        ref: 'Familia',
      }],
      tiempoInactividad: { type: Number, default: 120 }, // 2 minutos
      permitirComentarios: { type: Boolean, default: true },
      mostrarPrecios: { type: Boolean, default: true },
      mostrarAlergenos: { type: Boolean, default: true },
      mostrarCalorias: { type: Boolean, default: false },
      qrSessionDuration: { type: Number, default: 60 }, // 1 hora
      requiereNombreCliente: { type: Boolean, default: false },
      requiereTelefono: { type: Boolean, default: false },
      permitirParaLlevar: { type: Boolean, default: true },
    },
    estado: {
      type: String,
      enum: ['activo', 'suspendido', 'desactivado'],
      default: 'activo',
    },
    ultimoAcceso: Date,
    ultimaIP: String,
    ultimaSync: Date,
    versionApp: String,
    desactivadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    motivoDesactivacion: String,
    fechaDesactivacion: Date,
  },
  {
    timestamps: true,
  }
);

// Indices
KioskRegistradoSchema.index({ estado: 1 });
KioskRegistradoSchema.index({ tipo: 1 });
KioskRegistradoSchema.index({ salonId: 1 });

// Exportar el schema para modelos dinamicos
export { KioskRegistradoSchema };
