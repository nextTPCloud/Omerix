import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { IKioskRegistrado } from './KioskRegistrado';
import { IPedidoKiosk, ILineaPedidoKiosk } from './PedidoKiosk';
import { ISesionKiosk, IItemCarritoKiosk } from './SesionKiosk';
import KioskActivationToken from './KioskActivationToken';
import Empresa, { IDatabaseConfig } from '../empresa/Empresa';
import Licencia from '../licencias/Licencia';
import mongoose, { Model } from 'mongoose';
import {
  getKioskRegistradoModel,
  getPedidoKioskModel,
  getSesionKioskModel,
  getComandaCocinaModel,
  getMesaModel,
} from '../../utils/dynamic-models.helper';

// Generar token corto (8 caracteres, igual que TPV)
function generarTokenCorto(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin I, O, 0, 1 para evitar confusion
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Hash de token/secret
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Generar secreto seguro
function generarSecretoSeguro(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generar codigo de recogida corto (ej: A23, B45)
function generarCodigoRecogida(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const letra = letras.charAt(Math.floor(Math.random() * letras.length));
  const numero = Math.floor(Math.random() * 90) + 10; // 10-99
  return `${letra}${numero}`;
}

export class KioskService {
  /**
   * Obtener la configuracion de BD de una empresa
   */
  private async getDbConfig(empresaId: string): Promise<IDatabaseConfig> {
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }
    if (!empresa.databaseConfig) {
      throw new Error('Configuracion de base de datos no encontrada para esta empresa');
    }
    return empresa.databaseConfig;
  }

  // ============================================
  // TOKEN DE ACTIVACION
  // ============================================

  /**
   * Genera un token de activacion para un kiosk existente
   * El kiosk ya debe estar creado previamente
   */
  async generarTokenActivacion(
    empresaId: string,
    kioskId: string,
    usuarioId: string
  ): Promise<{ token: string; expiraEn: Date }> {
    // 1. Verificar licencia activa
    const licencia = await Licencia.findOne({ empresaId }).populate('planId');
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    if (!licencia.isActive()) {
      throw new Error('La licencia no esta activa');
    }

    // 2. Verificar que el kiosk existe
    const dbConfig = await this.getDbConfig(empresaId);
    const KioskRegistrado = await getKioskRegistradoModel(empresaId, dbConfig);

    const kiosk = await KioskRegistrado.findById(kioskId);
    if (!kiosk) {
      throw new Error('Kiosk no encontrado');
    }

    // 3. Invalidar tokens anteriores no usados de este kiosk
    await KioskActivationToken.updateMany(
      { kioskId, usado: false },
      { usado: true }
    );

    // 4. Generar token unico
    let token: string;
    let existe = true;
    while (existe) {
      token = generarTokenCorto();
      existe = !!(await KioskActivationToken.findOne({ token, usado: false }));
    }

    // 5. Crear registro de token (en BD principal)
    const expiraEn = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await KioskActivationToken.create({
      empresaId,
      kioskId,
      token: token!,
      tokenHash: hashToken(token!),
      usado: false,
      expiraEn,
      creadoPor: usuarioId,
    });

    return { token: token!, expiraEn };
  }

  /**
   * Activa un kiosk usando el token de activacion
   * El kiosk ya debe existir, el token sirve para vincular el dispositivo
   */
  async activarConToken(
    token: string,
    deviceInfo: { ip: string; userAgent?: string }
  ): Promise<{
    kioskId: string;
    kioskSecret: string;
    empresaId: string;
    empresaNombre: string;
    kioskNombre: string;
  }> {
    // 1. Buscar token valido
    const tokenDoc = await KioskActivationToken.findOne({
      token: token.toUpperCase(),
      usado: false,
      expiraEn: { $gt: new Date() },
    });

    if (!tokenDoc) {
      throw new Error('Token invalido o expirado');
    }

    // 2. Obtener empresa
    const empresa = await Empresa.findById(tokenDoc.empresaId);
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }

    // 3. Obtener y actualizar kiosk existente
    const dbConfig = await this.getDbConfig(tokenDoc.empresaId.toString());
    const KioskRegistrado = await getKioskRegistradoModel(tokenDoc.empresaId.toString(), dbConfig);

    const kiosk = await KioskRegistrado.findById(tokenDoc.kioskId);
    if (!kiosk) {
      throw new Error('Kiosk no encontrado');
    }

    // 4. Generar nuevo secret para este dispositivo
    const kioskSecret = generarSecretoSeguro();

    // 5. Actualizar kiosk con el nuevo secret
    kiosk.secretHash = hashToken(kioskSecret);
    kiosk.estado = 'activo';
    kiosk.ultimaConexion = new Date();
    kiosk.ultimaIP = deviceInfo.ip;
    await kiosk.save();

    // 6. Marcar token como usado
    tokenDoc.usado = true;
    tokenDoc.usadoEn = new Date();
    tokenDoc.usadoDesdeIP = deviceInfo.ip;
    await tokenDoc.save();

    return {
      kioskId: kiosk._id.toString(),
      kioskSecret,
      empresaId: tokenDoc.empresaId.toString(),
      empresaNombre: empresa.nombre,
      kioskNombre: kiosk.nombre,
    };
  }

  // ============================================
  // GESTION DE KIOSKOS
  // ============================================

  /**
   * Lista todos los kioskos de una empresa
   */
  async listarKiosks(empresaId: string): Promise<IKioskRegistrado[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const KioskRegistrado = await getKioskRegistradoModel(empresaId, dbConfig);

    return KioskRegistrado.find({})
      .populate('salonId', 'nombre')
      .populate('mesaId', 'numero')
      .sort({ codigo: 1 });
  }

  /**
   * Obtiene un kiosk por ID
   */
  async obtenerKiosk(kioskId: string, empresaId: string): Promise<IKioskRegistrado | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const KioskRegistrado = await getKioskRegistradoModel(empresaId, dbConfig);

    return KioskRegistrado.findById(kioskId)
      .populate('salonId', 'nombre')
      .populate('mesaId', 'numero')
      .populate('pagos.tpvDestinoId', 'nombre codigo');
  }

  /**
   * Crea un nuevo kiosk
   */
  async crearKiosk(
    empresaId: string,
    datos: {
      nombre: string;
      tipo: IKioskRegistrado['tipo'];
      salonId?: string;
      mesaId?: string;
      pagos?: IKioskRegistrado['pagos'];
      tema?: Partial<IKioskRegistrado['tema']>;
      config?: Partial<IKioskRegistrado['config']>;
    }
  ): Promise<{ kiosk: IKioskRegistrado; kioskSecret: string }> {
    const dbConfig = await this.getDbConfig(empresaId);
    const KioskRegistrado = await getKioskRegistradoModel(empresaId, dbConfig);

    // Generar codigo de kiosk
    const kioskCount = await KioskRegistrado.countDocuments({});
    const codigo = `KIOSK-${String(kioskCount + 1).padStart(3, '0')}`;

    // Generar secret
    const kioskSecret = generarSecretoSeguro();

    const kiosk = await KioskRegistrado.create({
      codigo,
      nombre: datos.nombre,
      deviceId: uuidv4(),
      secretHash: hashToken(kioskSecret),
      tokenVersion: 1,
      tipo: datos.tipo,
      salonId: datos.salonId,
      mesaId: datos.mesaId,
      pagos: {
        permitePago: datos.pagos?.permitePago ?? false,
        formasPagoIds: datos.pagos?.formasPagoIds ?? [],
        pagoObligatorio: datos.pagos?.pagoObligatorio ?? false,
        tpvDestinoId: datos.pagos?.tpvDestinoId,
      },
      tema: {
        colorPrimario: datos.tema?.colorPrimario || '#3B82F6',
        colorSecundario: datos.tema?.colorSecundario || '#1E40AF',
        logoUrl: datos.tema?.logoUrl,
        fondoUrl: datos.tema?.fondoUrl,
        idiomas: datos.tema?.idiomas || ['es'],
        idiomaPorDefecto: datos.tema?.idiomaPorDefecto || 'es',
      },
      config: {
        familiasVisibles: datos.config?.familiasVisibles || [],
        tiempoInactividad: datos.config?.tiempoInactividad ?? 120,
        permitirComentarios: datos.config?.permitirComentarios ?? true,
        mostrarPrecios: datos.config?.mostrarPrecios ?? true,
        mostrarAlergenos: datos.config?.mostrarAlergenos ?? true,
        mostrarCalorias: datos.config?.mostrarCalorias ?? false,
        qrSessionDuration: datos.config?.qrSessionDuration ?? 60,
        requiereNombreCliente: datos.config?.requiereNombreCliente ?? false,
        requiereTelefono: datos.config?.requiereTelefono ?? false,
        permitirParaLlevar: datos.config?.permitirParaLlevar ?? true,
      },
      estado: 'activo',
    });

    return {
      kiosk,
      kioskSecret, // Solo se devuelve UNA vez al crear
    };
  }

  /**
   * Actualiza configuracion de un kiosk
   */
  async actualizarKiosk(
    kioskId: string,
    empresaId: string,
    datos: Partial<Pick<IKioskRegistrado, 'nombre' | 'tipo' | 'salonId' | 'mesaId' | 'pagos' | 'tema' | 'config'>>
  ): Promise<IKioskRegistrado | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const KioskRegistrado = await getKioskRegistradoModel(empresaId, dbConfig);

    return KioskRegistrado.findByIdAndUpdate(
      kioskId,
      { $set: datos },
      { new: true }
    );
  }

  /**
   * Desactiva un kiosk
   */
  async desactivarKiosk(
    kioskId: string,
    empresaId: string,
    usuarioId: string,
    motivo: string
  ): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const KioskRegistrado = await getKioskRegistradoModel(empresaId, dbConfig);
    const SesionKiosk = await getSesionKioskModel(empresaId, dbConfig);

    const kiosk = await KioskRegistrado.findById(kioskId);
    if (!kiosk) {
      throw new Error('Kiosk no encontrado');
    }

    // Expirar todas las sesiones activas
    await SesionKiosk.updateMany(
      { kioskId, estado: 'activa' },
      { estado: 'expirada' }
    );

    // Desactivar kiosk
    kiosk.estado = 'desactivado';
    kiosk.desactivadoPor = new mongoose.Types.ObjectId(usuarioId);
    kiosk.motivoDesactivacion = motivo;
    kiosk.fechaDesactivacion = new Date();
    await kiosk.save();
  }

  /**
   * Activa un kiosk desactivado
   */
  async activarKiosk(kioskId: string, empresaId: string): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const KioskRegistrado = await getKioskRegistradoModel(empresaId, dbConfig);

    const kiosk = await KioskRegistrado.findById(kioskId);
    if (!kiosk) {
      throw new Error('Kiosk no encontrado');
    }

    if (kiosk.estado === 'activo') {
      throw new Error('El kiosk ya esta activo');
    }

    // Activar kiosk
    kiosk.estado = 'activo';
    kiosk.desactivadoPor = undefined;
    kiosk.motivoDesactivacion = undefined;
    kiosk.fechaDesactivacion = undefined;
    await kiosk.save();
  }

  /**
   * Elimina un kiosk
   */
  async eliminarKiosk(kioskId: string, empresaId: string): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const KioskRegistrado = await getKioskRegistradoModel(empresaId, dbConfig);
    const SesionKiosk = await getSesionKioskModel(empresaId, dbConfig);
    const PedidoKiosk = await getPedidoKioskModel(empresaId, dbConfig);

    // Verificar si tiene pedidos
    const pedidosCount = await PedidoKiosk.countDocuments({ kioskId });
    if (pedidosCount > 0) {
      throw new Error('No se puede eliminar el kiosk porque tiene pedidos asociados. Solo puedes desactivarlo.');
    }

    // Eliminar sesiones
    await SesionKiosk.deleteMany({ kioskId });

    // Eliminar kiosk
    await KioskRegistrado.deleteOne({ _id: kioskId });
  }

  /**
   * Regenera el secret de un kiosk (fuerza re-autenticacion)
   */
  async regenerarSecretKiosk(
    kioskId: string,
    empresaId: string
  ): Promise<{ kioskSecret: string }> {
    const dbConfig = await this.getDbConfig(empresaId);
    const KioskRegistrado = await getKioskRegistradoModel(empresaId, dbConfig);
    const SesionKiosk = await getSesionKioskModel(empresaId, dbConfig);

    const kioskSecret = generarSecretoSeguro();

    await KioskRegistrado.updateOne(
      { _id: kioskId },
      {
        secretHash: hashToken(kioskSecret),
        $inc: { tokenVersion: 1 },
      }
    );

    // Expirar todas las sesiones
    await SesionKiosk.updateMany(
      { kioskId, estado: 'activa' },
      { estado: 'expirada' }
    );

    return { kioskSecret };
  }

  // ============================================
  // AUTENTICACION DE KIOSK
  // ============================================

  /**
   * Verifica credenciales del kiosk
   */
  async verificarCredencialesKiosk(
    empresaId: string,
    kioskId: string,
    kioskSecret: string
  ): Promise<IKioskRegistrado> {
    const dbConfig = await this.getDbConfig(empresaId);
    const KioskRegistrado = await getKioskRegistradoModel(empresaId, dbConfig);

    const kiosk = await KioskRegistrado.findById(kioskId);

    if (!kiosk) {
      throw new Error('Kiosk no encontrado');
    }

    if (kiosk.estado !== 'activo') {
      throw new Error('Kiosk inactivo o desactivado');
    }

    if (hashToken(kioskSecret) !== kiosk.secretHash) {
      throw new Error('Credenciales de kiosk invalidas');
    }

    // Actualizar ultimo acceso
    kiosk.ultimoAcceso = new Date();
    await kiosk.save();

    return kiosk;
  }

  // ============================================
  // SESIONES QR
  // ============================================

  /**
   * Crea una sesion para QR de mesa
   */
  async crearSesion(
    empresaId: string,
    kioskId: string,
    kioskSecret: string,
    datos: {
      mesaId?: string;
      userAgent?: string;
      ip?: string;
      idioma?: string;
    }
  ): Promise<{ sessionToken: string; expiracion: Date }> {
    // Verificar kiosk
    const kiosk = await this.verificarCredencialesKiosk(empresaId, kioskId, kioskSecret);

    const dbConfig = await this.getDbConfig(empresaId);
    const SesionKiosk = await getSesionKioskModel(empresaId, dbConfig);

    // Generar token unico
    let sessionToken: string;
    let existe = true;
    while (existe) {
      sessionToken = generarTokenCorto();
      existe = !!(await SesionKiosk.findOne({ sessionToken, estado: 'activa' }));
    }

    // Calcular expiracion
    const duracionMinutos = kiosk.config.qrSessionDuration || 60;
    const expiracion = new Date(Date.now() + duracionMinutos * 60 * 1000);

    // Obtener numero de mesa si se proporciona
    let numeroMesa: string | undefined;
    if (datos.mesaId) {
      const Mesa = await getMesaModel(empresaId, dbConfig);
      const mesa = await Mesa.findById(datos.mesaId);
      numeroMesa = mesa?.numero;
    }

    const sesion = await SesionKiosk.create({
      sessionToken: sessionToken!,
      kioskId: kiosk._id,
      salonId: kiosk.salonId,
      mesaId: datos.mesaId,
      numeroMesa,
      carrito: {
        items: [],
        subtotal: 0,
        impuestos: 0,
        total: 0,
        ultimaModificacion: new Date(),
      },
      estado: 'activa',
      fechaCreacion: new Date(),
      expiracion,
      ultimaActividad: new Date(),
      userAgent: datos.userAgent,
      ip: datos.ip,
      idioma: datos.idioma || kiosk.tema.idiomaPorDefecto,
    });

    return {
      sessionToken: sessionToken!,
      expiracion,
    };
  }

  /**
   * Obtiene una sesion por token
   */
  async obtenerSesion(
    empresaId: string,
    sessionToken: string
  ): Promise<ISesionKiosk | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const SesionKiosk = await getSesionKioskModel(empresaId, dbConfig);

    const sesion = await SesionKiosk.findOne({
      sessionToken,
      estado: 'activa',
      expiracion: { $gte: new Date() },
    });

    if (sesion) {
      // Actualizar ultima actividad
      sesion.ultimaActividad = new Date();
      await sesion.save();
    }

    return sesion;
  }

  /**
   * Actualiza el carrito de una sesion
   */
  async actualizarCarrito(
    empresaId: string,
    sessionToken: string,
    carrito: {
      items: IItemCarritoKiosk[];
      subtotal: number;
      impuestos: number;
      total: number;
    }
  ): Promise<ISesionKiosk | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const SesionKiosk = await getSesionKioskModel(empresaId, dbConfig);

    return SesionKiosk.findOneAndUpdate(
      {
        sessionToken,
        estado: 'activa',
        expiracion: { $gte: new Date() },
      },
      {
        carrito: {
          ...carrito,
          ultimaModificacion: new Date(),
        },
        ultimaActividad: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Actualiza datos del cliente en sesion
   */
  async actualizarClienteSesion(
    empresaId: string,
    sessionToken: string,
    cliente: { nombre?: string; telefono?: string; email?: string },
    tipoServicio?: 'en_local' | 'para_llevar'
  ): Promise<ISesionKiosk | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const SesionKiosk = await getSesionKioskModel(empresaId, dbConfig);

    const updateData: any = {
      cliente,
      ultimaActividad: new Date(),
    };
    if (tipoServicio) {
      updateData.tipoServicio = tipoServicio;
    }

    return SesionKiosk.findOneAndUpdate(
      {
        sessionToken,
        estado: 'activa',
        expiracion: { $gte: new Date() },
      },
      updateData,
      { new: true }
    );
  }

  // ============================================
  // PEDIDOS
  // ============================================

  /**
   * Crea un pedido desde kiosk o sesion
   */
  async crearPedido(
    empresaId: string,
    datos: {
      kioskId: string;
      kioskSecret?: string;
      sessionToken?: string;
      lineas: ILineaPedidoKiosk[];
      tipoServicio: 'en_local' | 'para_llevar';
      cliente?: { nombre?: string; telefono?: string; email?: string };
      notas?: string;
      pagado?: boolean;
      metodoPago?: IPedidoKiosk['metodoPago'];
      referenciaPago?: string;
    }
  ): Promise<IPedidoKiosk> {
    const dbConfig = await this.getDbConfig(empresaId);
    const KioskRegistrado = await getKioskRegistradoModel(empresaId, dbConfig);
    const PedidoKiosk = await getPedidoKioskModel(empresaId, dbConfig);
    const SesionKiosk = await getSesionKioskModel(empresaId, dbConfig);

    // Verificar kiosk
    let kiosk: IKioskRegistrado;
    if (datos.kioskSecret) {
      kiosk = await this.verificarCredencialesKiosk(empresaId, datos.kioskId, datos.kioskSecret);
    } else {
      const k = await KioskRegistrado.findById(datos.kioskId);
      if (!k || k.estado !== 'activo') {
        throw new Error('Kiosk no encontrado o inactivo');
      }
      kiosk = k;
    }

    // Verificar sesion si se proporciona
    let sesion: ISesionKiosk | null = null;
    let mesaId = kiosk.mesaId;
    let salonId = kiosk.salonId;

    if (datos.sessionToken) {
      sesion = await SesionKiosk.findOne({
        sessionToken: datos.sessionToken,
        estado: 'activa',
      });
      if (sesion) {
        mesaId = sesion.mesaId;
        salonId = sesion.salonId;
      }
    }

    // Calcular totales
    let subtotal = 0;
    const lineasProcesadas = datos.lineas.map(linea => {
      const precioMods = linea.modificadores.reduce(
        (sum, m) => sum + (m.precioExtra * m.cantidad),
        0
      );
      const precioTotal = (linea.precioUnitario + precioMods) * linea.cantidad;
      subtotal += precioTotal;
      return {
        ...linea,
        precioTotal,
      };
    });

    // TODO: Calcular impuestos segun configuracion
    const impuestos = subtotal * 0.10; // 10% IVA simplificado
    const total = subtotal + impuestos;

    // Generar numero de pedido
    const pedidoCount = await PedidoKiosk.countDocuments({});
    const numeroPedido = `K-${String(pedidoCount + 1).padStart(4, '0')}`;

    // Determinar estado inicial y destino
    let estado: IPedidoKiosk['estado'];
    let tpvDestinoId: mongoose.Types.ObjectId | undefined;

    if (datos.pagado) {
      estado = 'confirmado';
    } else if (kiosk.pagos.pagoObligatorio) {
      estado = 'pendiente_pago';
    } else if (kiosk.pagos.tpvDestinoId) {
      estado = 'pendiente_validacion';
      tpvDestinoId = kiosk.pagos.tpvDestinoId;
    } else {
      estado = 'confirmado'; // Sin pago requerido y sin TPV destino
    }

    const pedido = await PedidoKiosk.create({
      numeroPedido,
      codigoRecogida: generarCodigoRecogida(),
      kioskId: kiosk._id,
      salonId,
      mesaId,
      sesionId: sesion?._id,
      estado,
      tipoServicio: datos.tipoServicio,
      cliente: datos.cliente,
      lineas: lineasProcesadas,
      subtotal,
      impuestos,
      total,
      pagado: datos.pagado || false,
      metodoPago: datos.metodoPago,
      fechaPago: datos.pagado ? new Date() : undefined,
      referenciaPago: datos.referenciaPago,
      tpvDestinoId,
      notas: datos.notas,
      fechaCreacion: new Date(),
      fechaConfirmacion: estado === 'confirmado' ? new Date() : undefined,
    });

    // Marcar sesion como completada si existe
    if (sesion) {
      sesion.estado = 'completada';
      sesion.pedidoId = pedido._id;
      await sesion.save();
    }

    // Si esta confirmado, enviar a KDS automaticamente
    if (estado === 'confirmado') {
      await this.enviarPedidoAKDS(empresaId, pedido._id.toString());
    }

    return pedido;
  }

  /**
   * Obtiene un pedido por ID
   */
  async obtenerPedido(
    empresaId: string,
    pedidoId: string
  ): Promise<IPedidoKiosk | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const PedidoKiosk = await getPedidoKioskModel(empresaId, dbConfig);

    return PedidoKiosk.findById(pedidoId);
  }

  /**
   * Obtiene el estado de un pedido (para pantalla de seguimiento)
   */
  async obtenerEstadoPedido(
    empresaId: string,
    pedidoId: string
  ): Promise<{
    estado: IPedidoKiosk['estado'];
    codigoRecogida?: string;
    numeroPedido: string;
  } | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const PedidoKiosk = await getPedidoKioskModel(empresaId, dbConfig);

    const pedido = await PedidoKiosk.findById(pedidoId).select('estado codigoRecogida numeroPedido');
    if (!pedido) return null;

    return {
      estado: pedido.estado,
      codigoRecogida: pedido.codigoRecogida,
      numeroPedido: pedido.numeroPedido,
    };
  }

  /**
   * Registra el pago de un pedido
   */
  async registrarPago(
    empresaId: string,
    pedidoId: string,
    datos: {
      metodoPago: IPedidoKiosk['metodoPago'];
      referenciaPago?: string;
    }
  ): Promise<IPedidoKiosk | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const PedidoKiosk = await getPedidoKioskModel(empresaId, dbConfig);

    const pedido = await PedidoKiosk.findByIdAndUpdate(
      pedidoId,
      {
        pagado: true,
        metodoPago: datos.metodoPago,
        referenciaPago: datos.referenciaPago,
        fechaPago: new Date(),
        estado: 'confirmado',
        fechaConfirmacion: new Date(),
      },
      { new: true }
    );

    // Enviar a KDS
    if (pedido) {
      await this.enviarPedidoAKDS(empresaId, pedidoId);
    }

    return pedido;
  }

  /**
   * Cambia el estado de un pedido
   */
  async cambiarEstadoPedido(
    empresaId: string,
    pedidoId: string,
    nuevoEstado: IPedidoKiosk['estado'],
    motivo?: string
  ): Promise<IPedidoKiosk | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const PedidoKiosk = await getPedidoKioskModel(empresaId, dbConfig);

    const updateData: any = { estado: nuevoEstado };

    switch (nuevoEstado) {
      case 'confirmado':
        updateData.fechaConfirmacion = new Date();
        break;
      case 'en_preparacion':
        updateData.fechaPreparacion = new Date();
        break;
      case 'listo':
        updateData.fechaListo = new Date();
        break;
      case 'entregado':
        updateData.fechaEntrega = new Date();
        break;
      case 'cancelado':
        updateData.fechaCancelacion = new Date();
        updateData.motivoCancelacion = motivo;
        break;
    }

    const pedido = await PedidoKiosk.findByIdAndUpdate(
      pedidoId,
      updateData,
      { new: true }
    );

    // Si se confirma, enviar a KDS
    if (pedido && nuevoEstado === 'confirmado') {
      await this.enviarPedidoAKDS(empresaId, pedidoId);
    }

    return pedido;
  }

  /**
   * Obtiene pedidos pendientes para un TPV
   */
  async obtenerPedidosPendientesTPV(
    empresaId: string,
    tpvId: string
  ): Promise<IPedidoKiosk[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const PedidoKiosk = await getPedidoKioskModel(empresaId, dbConfig);

    return PedidoKiosk.find({
      tpvDestinoId: tpvId,
      estado: 'pendiente_validacion',
    })
      .populate('mesaId', 'numero')
      .sort({ fechaCreacion: 1 });
  }

  // ============================================
  // INTEGRACION CON KDS
  // ============================================

  /**
   * Envia un pedido al sistema de comandas de cocina (KDS)
   */
  async enviarPedidoAKDS(
    empresaId: string,
    pedidoId: string
  ): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const PedidoKiosk = await getPedidoKioskModel(empresaId, dbConfig);
    const ComandaCocina = await getComandaCocinaModel(empresaId, dbConfig);
    const Mesa = await getMesaModel(empresaId, dbConfig);

    const pedido = await PedidoKiosk.findById(pedidoId);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    // Obtener numero de mesa
    let mesaNumero: string | undefined;
    if (pedido.mesaId) {
      const mesa = await Mesa.findById(pedido.mesaId);
      mesaNumero = mesa?.numero;
    }

    // Crear comanda
    const comandaNumero = await ComandaCocina.countDocuments({}) + 1;

    const comanda = await ComandaCocina.create({
      numero: comandaNumero,
      mesaId: pedido.mesaId,
      mesaNumero,
      salonId: pedido.salonId,
      origen: 'kiosk',
      origenId: pedido._id,
      estado: 'pendiente',
      prioridad: 'normal',
      lineas: pedido.lineas.map(linea => ({
        productoId: linea.productoId,
        nombre: linea.nombre,
        cantidad: linea.cantidad,
        estado: 'pendiente',
        notas: linea.comentario,
        modificadores: linea.modificadores.map(m => m.nombre),
      })),
      notas: `Pedido Kiosk ${pedido.numeroPedido}${pedido.codigoRecogida ? ` - Recogida: ${pedido.codigoRecogida}` : ''}`,
      horaCreacion: new Date(),
    });

    // Actualizar pedido con referencia a la comanda
    await PedidoKiosk.updateOne(
      { _id: pedidoId },
      {
        $push: { comandasIds: comanda._id },
        estado: 'en_preparacion',
        fechaPreparacion: new Date(),
      }
    );
  }

  // ============================================
  // QR GENERATION
  // ============================================

  /**
   * Genera URL para QR de mesa
   */
  async generarQRMesa(
    empresaId: string,
    kioskId: string,
    mesaId: string,
    baseUrl: string
  ): Promise<{ url: string }> {
    const dbConfig = await this.getDbConfig(empresaId);
    const KioskRegistrado = await getKioskRegistradoModel(empresaId, dbConfig);
    const Mesa = await getMesaModel(empresaId, dbConfig);

    const kiosk = await KioskRegistrado.findById(kioskId);
    if (!kiosk || kiosk.tipo !== 'qr_mesa') {
      throw new Error('Kiosk no encontrado o no es de tipo QR');
    }

    const mesa = await Mesa.findById(mesaId);
    if (!mesa) {
      throw new Error('Mesa no encontrada');
    }

    // El QR apunta a la app web del kiosk con parametros
    const url = `${baseUrl}/qr/${empresaId}/${kioskId}/${mesaId}`;

    return { url };
  }
}

export const kioskService = new KioskService();
