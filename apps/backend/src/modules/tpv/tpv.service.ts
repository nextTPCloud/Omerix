import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import TPVRegistrado, { ITPVRegistrado } from './TPVRegistrado';
import TPVActivationToken, { ITPVActivationToken } from './TPVActivationToken';
import SesionTPV, { ISesionTPV } from './SesionTPV';
import Licencia from '../licencias/Licencia';
import Empresa from '../empresa/Empresa';
import Usuario from '../usuarios/Usuario';
import mongoose from 'mongoose';

// Generar token corto (8 caracteres alfanumericos, facil de escribir)
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

export class TPVService {
  /**
   * Genera un token de activacion para registrar un nuevo TPV
   */
  async generarTokenActivacion(
    empresaId: string,
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

    // 2. Calcular limite de TPVs
    const plan = licencia.planId as any;
    let limiteTPVs = plan.limites?.tpvs || 0;

    // Sumar TPVs extra contratados como add-on
    const addonTPV = licencia.addOns.find(
      (a) => a.slug === 'tpv-extra' && a.activo
    );
    if (addonTPV) {
      limiteTPVs += addonTPV.cantidad;
    }

    // 3. Verificar TPVs actuales
    const tpvsActivos = await TPVRegistrado.countDocuments({
      empresaId,
      estado: { $ne: 'desactivado' },
    });

    if (tpvsActivos >= limiteTPVs) {
      throw new Error(
        `Limite de ${limiteTPVs} TPVs alcanzado. Contrata mas TPVs desde la configuracion de facturacion.`
      );
    }

    // 4. Generar token unico
    let token: string;
    let existe = true;
    while (existe) {
      token = generarTokenCorto();
      existe = !!(await TPVActivationToken.findOne({ token }));
    }

    // 5. Crear registro de token
    const expiraEn = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await TPVActivationToken.create({
      empresaId,
      token: token!,
      tokenHash: hashToken(token!),
      usado: false,
      expiraEn,
      creadoPor: usuarioId,
    });

    return { token: token!, expiraEn };
  }

  /**
   * Activa un TPV usando el token de activacion
   */
  async activarTPV(
    token: string,
    nombre: string,
    almacenId: string,
    deviceInfo: { ip: string; version?: string }
  ): Promise<{
    tpvId: string;
    tpvSecret: string;
    empresaId: string;
    empresaNombre: string;
    serverUrl: string;
    config: ITPVRegistrado['config'];
  }> {
    // 1. Buscar y validar token
    const activationToken = await TPVActivationToken.findOne({
      token,
      usado: false,
      expiraEn: { $gte: new Date() },
    });

    if (!activationToken) {
      throw new Error('Token invalido o expirado');
    }

    // 2. Verificar que el almacen existe y pertenece a la empresa
    const Almacen = mongoose.model('Almacen');
    const almacen = await Almacen.findOne({
      _id: almacenId,
      empresaId: activationToken.empresaId,
    });

    if (!almacen) {
      throw new Error('Almacen no encontrado');
    }

    // 3. Generar codigo de TPV
    const tpvCount = await TPVRegistrado.countDocuments({
      empresaId: activationToken.empresaId,
    });
    const codigo = `TPV-${String(tpvCount + 1).padStart(3, '0')}`;

    // 4. Generar secret
    const tpvSecret = generarSecretoSeguro();

    // 5. Crear TPV
    const tpv = await TPVRegistrado.create({
      empresaId: activationToken.empresaId,
      codigo,
      nombre,
      deviceId: uuidv4(),
      secretHash: hashToken(tpvSecret),
      tokenVersion: 1,
      almacenId,
      serieFactura: 'FS',
      config: {
        permitirDescuentos: true,
        descuentoMaximo: 100,
        permitirPrecioManual: false,
        modoOfflinePermitido: true,
        diasCacheProductos: 7,
      },
      estado: 'activo',
      ultimaIP: deviceInfo.ip,
      versionApp: deviceInfo.version,
    });

    // 6. Marcar token como usado
    activationToken.usado = true;
    activationToken.tpvId = tpv._id;
    activationToken.usadoEn = new Date();
    activationToken.usadoDesdeIP = deviceInfo.ip;
    await activationToken.save();

    // 7. Actualizar contador en licencia
    await Licencia.updateOne(
      { empresaId: activationToken.empresaId },
      { $inc: { 'usoActual.tpvsActuales': 1 } }
    );

    // 8. Obtener datos de empresa
    const empresa = await Empresa.findById(activationToken.empresaId);

    return {
      tpvId: tpv._id.toString(),
      tpvSecret, // Solo se devuelve UNA vez
      empresaId: activationToken.empresaId.toString(),
      empresaNombre: empresa?.nombre || '',
      serverUrl: process.env.API_URL || '',
      config: tpv.config,
    };
  }

  /**
   * Valida login de usuario en TPV y crea sesion
   */
  async loginTPV(
    tpvId: string,
    tpvSecret: string,
    pin: string,
    deviceInfo: { ip: string }
  ): Promise<{
    usuario: { id: string; nombre: string; permisos: any };
    sesionId: string;
  }> {
    // 1. Verificar TPV
    const tpv = await TPVRegistrado.findById(tpvId);
    if (!tpv || tpv.estado !== 'activo') {
      throw new Error('TPV no encontrado o inactivo');
    }

    // Verificar secret
    if (hashToken(tpvSecret) !== tpv.secretHash) {
      throw new Error('Credenciales de TPV invalidas');
    }

    // 2. Buscar usuario por PIN
    const usuario = await Usuario.findOne({
      empresaId: tpv.empresaId,
      pinTPV: pin,
      activo: true,
    });

    if (!usuario) {
      throw new Error('PIN incorrecto');
    }

    // 3. Verificar limite de usuarios simultaneos
    await this.verificarLimiteUsuarios(tpv.empresaId.toString(), usuario._id.toString());

    // 4. Cerrar sesiones anteriores del usuario en este TPV
    await SesionTPV.updateMany(
      { usuarioId: usuario._id, tpvId: tpv._id, activa: true },
      { activa: false, finSesion: new Date(), motivoFin: 'logout' }
    );

    // 5. Crear nueva sesion
    const sesion = await SesionTPV.create({
      empresaId: tpv.empresaId,
      usuarioId: usuario._id,
      tpvId: tpv._id,
      ip: deviceInfo.ip,
      tpvNombre: tpv.nombre,
      usuarioNombre: usuario.nombre,
      inicioSesion: new Date(),
      ultimaActividad: new Date(),
      heartbeatUltimo: new Date(),
      activa: true,
    });

    // 6. Actualizar ultimo acceso del TPV
    tpv.ultimoAcceso = new Date();
    tpv.ultimaIP = deviceInfo.ip;
    await tpv.save();

    return {
      usuario: {
        id: usuario._id.toString(),
        nombre: usuario.nombre,
        permisos: usuario.permisos || {},
      },
      sesionId: sesion._id.toString(),
    };
  }

  /**
   * Verifica el limite de usuarios simultaneos
   */
  async verificarLimiteUsuarios(
    empresaId: string,
    usuarioId: string
  ): Promise<void> {
    // 1. Obtener licencia y limites
    const licencia = await Licencia.findOne({ empresaId }).populate('planId');
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const plan = licencia.planId as any;

    // 2. Calcular limite de usuarios simultaneos
    let limiteUsuarios = plan.limites?.usuariosSimultaneos || 1;

    // Sumar usuarios extra contratados como add-on
    const addonUsuarios = licencia.addOns.find(
      (a) => a.slug === 'usuarios-extra' && a.activo
    );
    if (addonUsuarios) {
      limiteUsuarios += addonUsuarios.cantidad;
    }

    // IMPORTANTE: Cada TPV contratado anade 1 usuario simultaneo
    const addonTPV = licencia.addOns.find(
      (a) => a.slug === 'tpv-extra' && a.activo
    );
    if (addonTPV) {
      limiteUsuarios += addonTPV.cantidad;
    }

    // Tambien contar TPVs del plan base
    limiteUsuarios += plan.limites?.tpvs || 0;

    // 3. Contar sesiones activas (excluyendo este usuario si ya tiene sesion)
    const sesionesActivas = await SesionTPV.countDocuments({
      empresaId,
      activa: true,
      usuarioId: { $ne: usuarioId },
      heartbeatUltimo: { $gte: new Date(Date.now() - 60000) }, // Ultimos 60s
    });

    // 4. Verificar limite
    if (sesionesActivas >= limiteUsuarios) {
      throw new Error(
        `Limite de ${limiteUsuarios} usuarios simultaneos alcanzado`
      );
    }
  }

  /**
   * Procesa heartbeat de un TPV
   */
  async heartbeat(
    tpvId: string,
    sesionId: string,
    cajaId?: string
  ): Promise<{ ok: boolean }> {
    await SesionTPV.updateOne(
      { _id: sesionId, tpvId, activa: true },
      {
        ultimaActividad: new Date(),
        heartbeatUltimo: new Date(),
        ...(cajaId && { cajaId }),
      }
    );

    await TPVRegistrado.updateOne(
      { _id: tpvId },
      { ultimoAcceso: new Date() }
    );

    return { ok: true };
  }

  /**
   * Cierra sesion de usuario en TPV
   */
  async logoutTPV(sesionId: string): Promise<void> {
    await SesionTPV.updateOne(
      { _id: sesionId },
      {
        activa: false,
        finSesion: new Date(),
        motivoFin: 'logout',
      }
    );
  }

  /**
   * Lista TPVs de una empresa
   */
  async listarTPVs(empresaId: string): Promise<ITPVRegistrado[]> {
    return TPVRegistrado.find({ empresaId }).sort({ codigo: 1 });
  }

  /**
   * Obtiene un TPV por ID
   */
  async obtenerTPV(tpvId: string, empresaId: string): Promise<ITPVRegistrado | null> {
    return TPVRegistrado.findOne({ _id: tpvId, empresaId });
  }

  /**
   * Actualiza configuracion de un TPV
   */
  async actualizarTPV(
    tpvId: string,
    empresaId: string,
    datos: Partial<Pick<ITPVRegistrado, 'nombre' | 'almacenId' | 'serieFactura' | 'config'>>
  ): Promise<ITPVRegistrado | null> {
    return TPVRegistrado.findOneAndUpdate(
      { _id: tpvId, empresaId },
      { $set: datos },
      { new: true }
    );
  }

  /**
   * Desactiva un TPV
   */
  async desactivarTPV(
    tpvId: string,
    empresaId: string,
    usuarioId: string,
    motivo: string
  ): Promise<void> {
    const tpv = await TPVRegistrado.findOne({ _id: tpvId, empresaId });
    if (!tpv) {
      throw new Error('TPV no encontrado');
    }

    if (tpv.estado === 'desactivado') {
      throw new Error('El TPV ya esta desactivado');
    }

    // Cerrar todas las sesiones activas
    await SesionTPV.updateMany(
      { tpvId, activa: true },
      { activa: false, finSesion: new Date(), motivoFin: 'forzado' }
    );

    // Desactivar TPV
    tpv.estado = 'desactivado';
    tpv.desactivadoPor = new mongoose.Types.ObjectId(usuarioId);
    tpv.motivoDesactivacion = motivo;
    tpv.fechaDesactivacion = new Date();
    await tpv.save();

    // Decrementar contador en licencia
    await Licencia.updateOne(
      { empresaId },
      { $inc: { 'usoActual.tpvsActuales': -1 } }
    );
  }

  /**
   * Obtiene sesiones activas de una empresa
   */
  async obtenerSesionesActivas(empresaId: string): Promise<ISesionTPV[]> {
    return SesionTPV.find({
      empresaId,
      activa: true,
      heartbeatUltimo: { $gte: new Date(Date.now() - 60000) },
    }).sort({ inicioSesion: -1 });
  }

  /**
   * Fuerza cierre de una sesion
   */
  async forzarCierreSesion(
    sesionId: string,
    empresaId: string
  ): Promise<void> {
    await SesionTPV.updateOne(
      { _id: sesionId, empresaId },
      {
        activa: false,
        finSesion: new Date(),
        motivoFin: 'forzado',
      }
    );
  }

  /**
   * Limpia sesiones zombies (sin heartbeat reciente)
   */
  async limpiarSesionesZombies(): Promise<number> {
    const resultado = await SesionTPV.updateMany(
      {
        activa: true,
        heartbeatUltimo: { $lt: new Date(Date.now() - 120000) }, // 2 minutos
      },
      {
        activa: false,
        finSesion: new Date(),
        motivoFin: 'timeout',
      }
    );

    return resultado.modifiedCount;
  }

  /**
   * Revoca el token de un TPV (fuerza re-autenticacion)
   */
  async revocarTokenTPV(tpvId: string, empresaId: string): Promise<void> {
    await TPVRegistrado.updateOne(
      { _id: tpvId, empresaId },
      { $inc: { tokenVersion: 1 } }
    );

    // Cerrar todas las sesiones
    await SesionTPV.updateMany(
      { tpvId, activa: true },
      { activa: false, finSesion: new Date(), motivoFin: 'forzado' }
    );
  }

  /**
   * Verifica credenciales del TPV (para endpoints de sync)
   */
  async verificarCredencialesTPV(
    tpvId: string,
    tpvSecret: string
  ): Promise<ITPVRegistrado> {
    const tpv = await TPVRegistrado.findById(tpvId);

    if (!tpv) {
      throw new Error('TPV no encontrado');
    }

    if (tpv.estado !== 'activo') {
      throw new Error('TPV inactivo o desactivado');
    }

    if (hashToken(tpvSecret) !== tpv.secretHash) {
      throw new Error('Credenciales de TPV invalidas');
    }

    return tpv;
  }
}

export const tpvService = new TPVService();
