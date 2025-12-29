import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ITPVRegistrado } from './TPVRegistrado';
import TPVActivationToken, { ITPVActivationToken } from './TPVActivationToken';
import { ISesionTPV } from './SesionTPV';
import Licencia from '../licencias/Licencia';
import Empresa, { IDatabaseConfig } from '../empresa/Empresa';
import Usuario from '../usuarios/Usuario';
import UsuarioEmpresa from '../usuarios/UsuarioEmpresa';
import mongoose, { Model } from 'mongoose';
import { getTPVRegistradoModel, getSesionTPVModel } from '../../utils/dynamic-models.helper';

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
    // El campo correcto es tpvsActivos
    let limiteTPVs = plan.limites?.tpvsActivos || 0;

    // Sumar TPVs del add-on de TPV/Restauracion
    const addonTPV = licencia.addOns.find(
      (a) => (a.slug === 'tpv' || a.slug === 'restauracion' || a.slug === 'tpv-extra') && a.activo
    );
    if (addonTPV) {
      // El add-on TPV incluye 1 TPV por defecto, o la cantidad especificada
      limiteTPVs += addonTPV.cantidad || 1;
    }

    // 3. Verificar TPVs actuales - Usar modelo dinamico
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);

    const tpvsActivos = await TPVRegistrado.countDocuments({
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

    // 5. Crear registro de token (en BD principal)
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
   * El almacenId es opcional - se puede configurar despues
   */
  async activarTPV(
    token: string,
    nombre: string,
    almacenId: string | undefined,
    deviceInfo: { ip: string; version?: string }
  ): Promise<{
    tpvId: string;
    tpvSecret: string;
    empresaId: string;
    empresaNombre: string;
    serverUrl: string;
    config: ITPVRegistrado['config'];
  }> {
    // 1. Buscar y validar token (en BD principal)
    console.log('[TPV Service] Buscando token:', token);

    // Primero buscar el token sin validaciones para debug
    const tokenExiste = await TPVActivationToken.findOne({ token });
    if (tokenExiste) {
      console.log('[TPV Service] Token encontrado:', {
        usado: tokenExiste.usado,
        expiraEn: tokenExiste.expiraEn,
        ahora: new Date(),
        expirado: tokenExiste.expiraEn < new Date()
      });
    } else {
      console.log('[TPV Service] Token NO encontrado en BD');
    }

    const activationToken = await TPVActivationToken.findOne({
      token,
      usado: false,
      expiraEn: { $gte: new Date() },
    });

    if (!activationToken) {
      throw new Error('Token invalido o expirado');
    }

    const empresaId = activationToken.empresaId.toString();

    // Obtener modelo dinamico para TPV
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);

    // 2. Verificar almacen si se proporciona (usando modelo dinamico de Almacen)
    let almacenIdFinal: string | undefined = undefined;
    if (almacenId) {
      const { getAlmacenModel } = await import('../../utils/dynamic-models.helper');
      const Almacen = await getAlmacenModel(empresaId, dbConfig);
      const almacen = await Almacen.findById(almacenId);

      if (!almacen) {
        throw new Error('Almacen no encontrado');
      }
      almacenIdFinal = almacenId;
    }

    // 3. Generar codigo de TPV
    const tpvCount = await TPVRegistrado.countDocuments({});
    const codigo = `TPV-${String(tpvCount + 1).padStart(3, '0')}`;

    // 4. Generar secret
    const tpvSecret = generarSecretoSeguro();

    // 5. Crear TPV (en BD de empresa, sin empresaId)
    const tpv = await TPVRegistrado.create({
      codigo,
      nombre,
      deviceId: uuidv4(),
      secretHash: hashToken(tpvSecret),
      tokenVersion: 1,
      almacenId: almacenIdFinal,
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

    // 6. Marcar token como usado (en BD principal)
    activationToken.usado = true;
    activationToken.tpvId = tpv._id;
    activationToken.usadoEn = new Date();
    activationToken.usadoDesdeIP = deviceInfo.ip;
    await activationToken.save();

    // 7. Actualizar contador en licencia (en BD principal)
    await Licencia.updateOne(
      { empresaId },
      { $inc: { 'usoActual.tpvsActuales': 1 } }
    );

    // 8. Obtener datos de empresa
    const empresa = await Empresa.findById(empresaId);

    return {
      tpvId: tpv._id.toString(),
      tpvSecret, // Solo se devuelve UNA vez
      empresaId,
      empresaNombre: empresa?.nombre || '',
      serverUrl: process.env.API_URL || '',
      config: tpv.config,
    };
  }

  /**
   * Valida login de usuario en TPV y crea sesion
   */
  async loginTPV(
    empresaId: string,
    tpvId: string,
    tpvSecret: string,
    pin: string,
    deviceInfo: { ip: string }
  ): Promise<{
    usuario: { id: string; nombre: string; permisos: any };
    sesionId: string;
  }> {
    // Obtener modelos dinamicos
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);
    const SesionTPV = await getSesionTPVModel(empresaId, dbConfig);

    // 1. Verificar TPV (en BD de empresa)
    const tpv = await TPVRegistrado.findById(tpvId);
    if (!tpv || tpv.estado !== 'activo') {
      throw new Error('TPV no encontrado o inactivo');
    }

    // Verificar secret
    if (hashToken(tpvSecret) !== tpv.secretHash) {
      throw new Error('Credenciales de TPV invalidas');
    }

    // 2. Buscar relacion usuario-empresa por PIN (UsuarioEmpresa sigue en BD principal)
    const usuarioEmpresa = await UsuarioEmpresa.findOne({
      empresaId,
      pinTPV: pin,
      activo: true,
    }).populate('usuarioId');

    if (!usuarioEmpresa || !usuarioEmpresa.usuarioId) {
      throw new Error('PIN incorrecto');
    }

    // Obtener el usuario
    const usuario = usuarioEmpresa.usuarioId as any;
    if (!usuario.activo) {
      throw new Error('Usuario inactivo');
    }

    // 3. Verificar limite de usuarios simultaneos
    await this.verificarLimiteUsuarios(empresaId, usuario._id.toString());

    // 4. Cerrar sesiones anteriores del usuario en este TPV (en BD de empresa)
    await SesionTPV.updateMany(
      { usuarioId: usuario._id, tpvId: tpv._id, activa: true },
      { activa: false, finSesion: new Date(), motivoFin: 'logout' }
    );

    // 5. Crear nueva sesion (en BD de empresa, sin empresaId)
    const sesion = await SesionTPV.create({
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
    const dbConfig = await this.getDbConfig(empresaId);
    const SesionTPV = await getSesionTPVModel(empresaId, dbConfig);

    const sesionesActivas = await SesionTPV.countDocuments({
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
    empresaId: string,
    tpvId: string,
    sesionId: string,
    cajaId?: string
  ): Promise<{ ok: boolean }> {
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);
    const SesionTPV = await getSesionTPVModel(empresaId, dbConfig);

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
  async logoutTPV(empresaId: string, sesionId: string): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const SesionTPV = await getSesionTPVModel(empresaId, dbConfig);

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
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);

    return TPVRegistrado.find({})
      .populate('almacenId', 'codigo nombre')
      .sort({ codigo: 1 });
  }

  /**
   * Obtiene un TPV por ID
   */
  async obtenerTPV(tpvId: string, empresaId: string): Promise<ITPVRegistrado | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);

    return TPVRegistrado.findById(tpvId)
      .populate('almacenId', 'codigo nombre');
  }

  /**
   * Actualiza configuracion de un TPV
   */
  async actualizarTPV(
    tpvId: string,
    empresaId: string,
    datos: Partial<Pick<ITPVRegistrado, 'nombre' | 'almacenId' | 'serieFactura' | 'config'>>
  ): Promise<ITPVRegistrado | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);

    return TPVRegistrado.findByIdAndUpdate(
      tpvId,
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
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);
    const SesionTPV = await getSesionTPVModel(empresaId, dbConfig);

    const tpv = await TPVRegistrado.findById(tpvId);
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

    // Decrementar contador en licencia (en BD principal)
    await Licencia.updateOne(
      { empresaId },
      { $inc: { 'usoActual.tpvsActuales': -1 } }
    );
  }

  /**
   * Obtiene sesiones activas de una empresa
   */
  async obtenerSesionesActivas(empresaId: string): Promise<ISesionTPV[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const SesionTPV = await getSesionTPVModel(empresaId, dbConfig);

    return SesionTPV.find({
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
    const dbConfig = await this.getDbConfig(empresaId);
    const SesionTPV = await getSesionTPVModel(empresaId, dbConfig);

    await SesionTPV.updateOne(
      { _id: sesionId },
      {
        activa: false,
        finSesion: new Date(),
        motivoFin: 'forzado',
      }
    );
  }

  /**
   * Limpia sesiones zombies (sin heartbeat reciente) para una empresa
   */
  async limpiarSesionesZombies(empresaId: string): Promise<number> {
    const dbConfig = await this.getDbConfig(empresaId);
    const SesionTPV = await getSesionTPVModel(empresaId, dbConfig);

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
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);
    const SesionTPV = await getSesionTPVModel(empresaId, dbConfig);

    await TPVRegistrado.updateOne(
      { _id: tpvId },
      { $inc: { tokenVersion: 1 } }
    );

    // Cerrar todas las sesiones
    await SesionTPV.updateMany(
      { tpvId, activa: true },
      { activa: false, finSesion: new Date(), motivoFin: 'forzado' }
    );
  }

  /**
   * Elimina un TPV permanentemente (para reasignar licencia)
   * No se puede eliminar si tiene ventas realizadas
   */
  async eliminarTPV(
    tpvId: string,
    empresaId: string,
    usuarioId: string
  ): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);
    const SesionTPV = await getSesionTPVModel(empresaId, dbConfig);

    const tpv = await TPVRegistrado.findById(tpvId);
    if (!tpv) {
      throw new Error('TPV no encontrado');
    }

    // Verificar si hay sesiones historicas con ventas
    const sesionesConVentas = await SesionTPV.countDocuments({
      tpvId,
      cajaId: { $exists: true, $ne: null }
    });

    if (sesionesConVentas > 0) {
      throw new Error('No se puede eliminar el TPV porque tiene ventas realizadas. Solo puedes desactivarlo.');
    }

    // Cerrar todas las sesiones activas
    await SesionTPV.updateMany(
      { tpvId, activa: true },
      { activa: false, finSesion: new Date(), motivoFin: 'eliminado' }
    );

    // Decrementar contador en licencia solo si estaba activo (en BD principal)
    if (tpv.estado !== 'desactivado') {
      await Licencia.updateOne(
        { empresaId },
        { $inc: { 'usoActual.tpvsActuales': -1 } }
      );
    }

    // Eliminar sesiones del TPV (solo si no tiene ventas)
    await SesionTPV.deleteMany({ tpvId });

    // Eliminar el TPV
    await TPVRegistrado.deleteOne({ _id: tpvId });

    // Eliminar tokens de activacion asociados (en BD principal)
    await TPVActivationToken.deleteMany({ tpvId });
  }

  /**
   * Verifica credenciales del TPV (para endpoints de sync)
   * Requiere empresaId porque el TPV ya conoce su empresa
   */
  async verificarCredencialesTPV(
    empresaId: string,
    tpvId: string,
    tpvSecret: string
  ): Promise<ITPVRegistrado> {
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);

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
