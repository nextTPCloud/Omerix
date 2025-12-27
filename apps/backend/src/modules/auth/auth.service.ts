// apps/backend/src/modules/auth/auth.service.ts

import Usuario, { IUsuario } from '../usuarios/Usuario';
import UsuarioEmpresa from '../usuarios/UsuarioEmpresa';
import Empresa from '../empresa/Empresa';
import Plan from '../licencias/Plan';
import Licencia from '../licencias/Licencia';
import AddOn from '../licencias/AddOn';
import RefreshToken from './RefreshToken';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import crypto from 'crypto';
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTP,
  generateSMSCode,
  sendSMSCode,
  storeSMSCode,
  verifySMSCode,
} from '../../utils/twoFactor';
import {
  RegisterDTO,
  LoginDTO,
  Verify2FADTO,
  Setup2FASMSDTO,
  UserResponse,
  EmpresaResponse,
} from './auth.dto';
import { databaseManager } from '../../services/database-manager.service';
import { DatabaseManagerService } from '../../services/database-manager.service';
import { registroMercantilService } from '../../services/registro-mercantil.service';
import mongoose from 'mongoose';

export class AuthService {
  
  // ============================================
  // REGISTRO
  // ============================================
  
 async register(data: RegisterDTO) {
    // 1. Verificar si el usuario ya existe (puede tener múltiples empresas)
    const usuarioExistente = await Usuario.findOne({ email: data.email }).select('+password');

    // 2. Verificar si el NIF de empresa ya existe
    const empresaExistenteNif = await Empresa.findOne({ nif: data.nifEmpresa });
    if (empresaExistenteNif) {
      throw new Error('Ya existe una empresa registrada con este NIF');
    }

    // 3. Verificar si el email de empresa ya existe (debe ser único por empresa)
    const empresaExistenteEmail = await Empresa.findOne({ email: data.emailEmpresa });
    if (empresaExistenteEmail) {
      throw new Error('Ya existe una empresa registrada con este email de empresa');
    }

    // 4. Si el usuario existe, verificar la contraseña para confirmar identidad
    if (usuarioExistente) {
      const passwordValido = await usuarioExistente.comparePassword(data.password);
      if (!passwordValido) {
        throw new Error('El email ya está registrado. Si es tu cuenta, introduce la contraseña correcta para añadir una nueva empresa.');
      }
    }

    // VERIFICAR EMPRESA EN REGISTRO MERCANTIL
    const verificacion = await registroMercantilService.verificarEmpresa({
      nif: data.nifEmpresa,
      nombre: data.nombreEmpresa,
      nombreComercial: data.nombreComercialEmpresa,
    });

    // Si hay errores de verificación, no permitir el registro
    if (!verificacion.verificado) {
      const errores = verificacion.errores.join('. ');
      throw new Error(`Error de verificación: ${errores}`);
    }

    // Si hay advertencias, continuar (las advertencias no bloquean el registro)
    // Las advertencias se registran en el sistema de logs de la empresa

    // 1. GENERAR CONFIGURACIÓN DE BASE DE DATOS PARA LA EMPRESA
    // Crear un ID temporal para la empresa
    const tempEmpresaId = new (require('mongoose').Types.ObjectId)();

    const databaseConfig = DatabaseManagerService.generateDatabaseConfig(
      String(tempEmpresaId),
      {
        host: process.env.MONGODB_HOST || 'localhost',
        port: parseInt(process.env.MONGODB_PORT || '27017'),
        user: process.env.MONGODB_USER,
        password: process.env.MONGODB_PASSWORD,
      }
    );


    // 2. CREAR EMPRESA CON CONFIGURACIÓN DE DB
    // Usar el nombre oficial del registro mercantil si está disponible
    const nombreFiscal = verificacion.datosOficiales?.nombreFiscal || data.nombreEmpresa;

    const empresa = await Empresa.create({
      _id: tempEmpresaId, // Usar el mismo ID temporal
      nombre: nombreFiscal,
      nombreComercial: data.nombreComercialEmpresa,
      nif: data.nifEmpresa,
      email: data.emailEmpresa,
      telefono: data.telefonoEmpresa,
      tipoNegocio: data.tipoNegocio || 'retail',
      estado: 'activa',
      direccion: {
        calle: data.direccion,
        codigoPostal: data.codigoPostal,
        ciudad: data.ciudad,
        provincia: data.provincia,
        pais: data.pais || 'España',
      },
      databaseConfig,
    });


    // 3. INICIALIZAR BASE DE DATOS DE LA EMPRESA
    try {
      await databaseManager.initializeEmpresaDatabase(
        String(empresa._id),
        databaseConfig
      );
    } catch (error: any) {
      console.error('Error inicializando base de datos de empresa:', error);
      // Si falla la inicialización, eliminar la empresa creada
      await Empresa.deleteOne({ _id: empresa._id });
      throw new Error('Error al inicializar la base de datos de la empresa');
    }

    // 4. CREAR O REUTILIZAR USUARIO (admin de la empresa)
    let usuario: IUsuario;

    if (usuarioExistente) {
      // Usuario ya existe - reutilizarlo para la nueva empresa
      usuario = usuarioExistente;
    } else {
      // Crear nuevo usuario
      usuario = await Usuario.create({
        empresaId: empresa._id,
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        password: data.password,
        telefono: data.telefono,
        rol: 'admin',
        activo: true,
        emailVerificado: false,
      });
    }

    // 4.1 CREAR RELACIÓN USUARIO-EMPRESA
    await UsuarioEmpresa.create({
      usuarioId: usuario._id,
      empresaId: empresa._id,
      rol: 'admin',
      esPrincipal: true,
      activo: true,
      fechaAsignacion: new Date(),
    });

    // 5. CREAR LICENCIA CON EL PLAN SELECCIONADO
    // El usuario selecciona un plan de pago desde el registro
    const planSlug = data.plan || 'starter'; // Por defecto Starter si no se especifica
    const planSeleccionado = await Plan.findOne({ slug: planSlug, activo: true });

    if (!planSeleccionado) {
      throw new Error('Plan no encontrado o no disponible');
    }

    // Crear licencia con el plan seleccionado (pendiente de pago)
    const licencia = await Licencia.create({
      empresaId: empresa._id,
      planId: planSeleccionado._id,
      estado: 'activa', // Activa - el pago se gestionará en checkout
      esTrial: false,
      tipoSuscripcion: 'mensual',
      fechaInicio: new Date(),
      fechaRenovacion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usoActual: {
        usuariosSimultaneos: 0,
        usuariosTotales: 1,
        facturasEsteMes: 0,
        productosActuales: 0,
        almacenesActuales: 0,
        clientesActuales: 0,
        tpvsActuales: 0,
        almacenamientoUsadoGB: 0,
        llamadasAPIHoy: 0,
        emailsEsteMes: 0,
        smsEsteMes: 0,
        whatsappEsteMes: 0,
      },
      addOns: [],
      historial: [
        {
          fecha: new Date(),
          accion: 'CREACION',
          planNuevo: planSeleccionado.nombre,
          motivo: `Registro con plan ${planSeleccionado.nombre}`,
        },
      ],
    });

    // 6. GENERAR TOKENS
    const accessToken = generateAccessToken(usuario);
    const refreshToken = generateRefreshToken(usuario);

    // Guardar refresh token en base de datos
    await this.saveRefreshToken(usuario._id, refreshToken);

    return {
      usuario: this.formatUserResponse(usuario),
      empresa: this.formatEmpresaResponse(empresa),
      licencia: {
        plan: planSeleccionado.nombre,
        estado: licencia.estado,
      },
      accessToken,
      refreshToken,
    };
  }



  // ============================================
  // LOGIN
  // ============================================

  /**
   * Obtener el límite efectivo de sesiones simultáneas (plan + add-ons)
   */
  private async getLimiteSesionesSimultaneas(empresaId: mongoose.Types.ObjectId): Promise<number> {
    const licencia = await Licencia.findOne({ empresaId }).populate('planId');
    if (!licencia) {
      return 1; // Por defecto 1 si no hay licencia
    }

    const plan = licencia.planId as any;
    let limite = plan.limites?.usuariosSimultaneos ?? 1;

    // Si es ilimitado (-1), devolver -1
    if (limite === -1) {
      return -1;
    }

    // Sumar límites extra de add-ons activos
    const addOnsActivos = licencia.addOns.filter((a: any) => a.activo);
    for (const addon of addOnsActivos) {
      // Buscar el add-on para obtener sus límites extra
      const addOnDoc = await AddOn.findById(addon.addOnId);
      if (addOnDoc?.limitesExtra?.usuariosSimultaneos) {
        // Multiplicar por cantidad si aplica (ej: Pack 5 Usuarios x 2 = 10 usuarios extra)
        limite += (addOnDoc.limitesExtra.usuariosSimultaneos * (addon.cantidad || 1));
      }
    }

    return limite;
  }

  /**
   * Contar sesiones activas de una empresa
   */
  private async contarSesionesActivas(empresaId: mongoose.Types.ObjectId): Promise<number> {
    const usuariosEmpresa = await UsuarioEmpresa.find({
      empresaId,
      activo: true,
    }).select('usuarioId');

    const userIds = usuariosEmpresa.map(ue => ue.usuarioId);

    const count = await RefreshToken.countDocuments({
      userId: { $in: userIds },
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    return count;
  }

  async login(data: LoginDTO & { empresaId?: string }) {
    // Buscar usuario (incluir password y twoFactorSecret para verificar 2FA)
    const usuario = await Usuario.findOne({ email: data.email })
      .select('+password +twoFactorSecret');

    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      throw new Error('Usuario desactivado. Contacte al administrador.');
    }

    // Verificar password
    const isPasswordValid = await usuario.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar si tiene 2FA activado Y correctamente configurado
    if (usuario.twoFactorEnabled) {
      const is2FAConfigured =
        (usuario.twoFactorMethod === 'app' && usuario.twoFactorSecret) ||
        (usuario.twoFactorMethod === 'sms' && usuario.twoFactorPhone);

      if (!is2FAConfigured) {
        // 2FA habilitado pero no configurado correctamente - deshabilitar temporalmente
        usuario.twoFactorEnabled = false;
        usuario.twoFactorMethod = null;
        await usuario.save();
      } else {
        if (usuario.twoFactorMethod === 'sms' && usuario.twoFactorPhone) {
          const code = generateSMSCode();
          await sendSMSCode(usuario.twoFactorPhone, code);
          storeSMSCode(String(usuario._id), code);
        }

        return {
          requires2FA: true,
          twoFactorMethod: usuario.twoFactorMethod!,
          userId: String(usuario._id),
        };
      }
    }

    // ============================================
    // VERIFICAR EMPRESAS DEL USUARIO
    // ============================================
    const empresasUsuario = await UsuarioEmpresa.getEmpresasDeUsuario(usuario._id);

    // Si el usuario es superadmin, tiene acceso especial
    const esSuperadmin = usuario.rol === 'superadmin';

    // ============================================
    // VERIFICAR SI SUPERADMIN TIENE EMPRESA DE NEGOCIO
    // ============================================
    if (esSuperadmin) {
      // Filtrar empresas de negocio (no plataforma)
      // Verificar que empresaId existe y no es null antes de acceder a esPlatforma
      const empresasNegocio = empresasUsuario.filter((ue: any) =>
        ue.empresaId && !ue.empresaId.esPlatforma
      );

      if (empresasNegocio.length === 0) {
        // Generar tokens temporales para que pueda crear empresa
        const accessToken = generateAccessToken(usuario);
        const refreshToken = generateRefreshToken(usuario);

        await this.saveRefreshToken(
          usuario._id,
          refreshToken,
          data.deviceInfo,
          data.ipAddress
        );

        return {
          requiresCompanyCreation: true,
          userId: String(usuario._id),
          usuario: this.formatUserResponse(usuario),
          accessToken,
          refreshToken,
          message: 'Debes crear una empresa de negocio para continuar',
        };
      }
    }

    // Si tiene múltiples empresas y no ha seleccionado una, pedir selección
    // Esto aplica también para superadmins con múltiples empresas de negocio
    if (empresasUsuario.length > 1 && !data.empresaId) {
      // Filtrar solo empresas de negocio (no plataforma) para la selección
      const empresasNegocio = empresasUsuario.filter((ue: any) =>
        ue.empresaId && !ue.empresaId.esPlatforma
      );

      // Si tiene más de una empresa de negocio, pedir selección
      if (empresasNegocio.length > 1) {
        return {
          requiresEmpresaSelection: true,
          userId: String(usuario._id),
          empresas: empresasNegocio.map((ue: any) => ({
            id: String(ue.empresaId._id),
            nombre: ue.empresaId.nombre,
            nif: ue.empresaId.nif,
            logo: ue.empresaId.logo,
            rol: ue.rol,
            esPrincipal: ue.esPrincipal,
          })),
        };
      }
    }

    // Determinar la empresa a usar
    let empresaIdFinal = usuario.empresaId;

    if (data.empresaId) {
      // Verificar que el usuario tenga acceso a esa empresa
      const tieneAcceso = await UsuarioEmpresa.tieneAcceso(usuario._id, data.empresaId);
      if (!tieneAcceso && !esSuperadmin) {
        throw new Error('No tienes acceso a esa empresa');
      }
      empresaIdFinal = new mongoose.Types.ObjectId(data.empresaId);
    } else if (empresasUsuario.length === 1) {
      // Si solo tiene una empresa, usar esa
      empresaIdFinal = (empresasUsuario[0] as any).empresaId._id;
    }

    // Actualizar empresaId en el usuario para esta sesión
    usuario.empresaId = empresaIdFinal;

    // ============================================
    // VALIDAR LÍMITE DE SESIONES SIMULTÁNEAS
    // ============================================
    const limiteSesiones = await this.getLimiteSesionesSimultaneas(empresaIdFinal);
    const sesionesActivas = await this.contarSesionesActivas(empresaIdFinal);

    if (limiteSesiones !== -1 && sesionesActivas >= limiteSesiones) {
      throw new Error(
        `Se ha alcanzado el límite de ${limiteSesiones} sesiones simultáneas de tu plan. ` +
        `Cierra alguna sesión activa o contacta con el administrador para ampliar el límite.`
      );
    }

    // Generar tokens
    const accessToken = generateAccessToken(usuario);
    const refreshToken = generateRefreshToken(usuario);

    // Guardar refresh token
    await this.saveRefreshToken(
      usuario._id,
      refreshToken,
      data.deviceInfo,
      data.ipAddress
    );

    // Actualizar último acceso
    usuario.ultimoAcceso = new Date();
    await usuario.save();

    // Obtener datos de la empresa
    const empresa = await Empresa.findById(empresaIdFinal);

    // Obtener relación UsuarioEmpresa para esta empresa (para personalId y rol específico)
    const relacionEmpresa = await UsuarioEmpresa.findOne({
      usuarioId: usuario._id,
      empresaId: empresaIdFinal,
      activo: true,
    });

    return {
      requires2FA: false,
      requiresEmpresaSelection: false,
      usuario: this.formatUserResponse(usuario, relacionEmpresa || undefined),
      empresa: empresa ? this.formatEmpresaResponse(empresa) : undefined,
      accessToken,
      refreshToken,
    };
  }

  // ============================================
  // SELECCIONAR EMPRESA (después de login)
  // ============================================

  async selectEmpresa(userId: string, empresaId: string, deviceInfo?: string, ipAddress?: string) {
    const usuario = await Usuario.findById(userId);

    if (!usuario || !usuario.activo) {
      throw new Error('Usuario no encontrado o inactivo');
    }

    // Verificar acceso a la empresa
    const tieneAcceso = await UsuarioEmpresa.tieneAcceso(userId, empresaId);
    if (!tieneAcceso && usuario.rol !== 'superadmin') {
      throw new Error('No tienes acceso a esa empresa');
    }

    // Actualizar empresaId del usuario
    usuario.empresaId = new mongoose.Types.ObjectId(empresaId);

    // ============================================
    // VALIDAR LÍMITE DE SESIONES SIMULTÁNEAS
    // ============================================
    const limiteSesiones = await this.getLimiteSesionesSimultaneas(usuario.empresaId);
    const sesionesActivas = await this.contarSesionesActivas(usuario.empresaId);

    if (limiteSesiones !== -1 && sesionesActivas >= limiteSesiones) {
      throw new Error(
        `Se ha alcanzado el límite de ${limiteSesiones} sesiones simultáneas de tu plan. ` +
        `Cierra alguna sesión activa o contacta con el administrador para ampliar el límite.`
      );
    }

    // Generar tokens
    const accessToken = generateAccessToken(usuario);
    const refreshToken = generateRefreshToken(usuario);

    // Guardar refresh token
    await this.saveRefreshToken(
      usuario._id,
      refreshToken,
      deviceInfo,
      ipAddress
    );

    // Actualizar último acceso
    usuario.ultimoAcceso = new Date();
    await usuario.save();

    // Obtener datos de la empresa
    const empresa = await Empresa.findById(empresaId);

    // Obtener relación UsuarioEmpresa para esta empresa
    const relacionEmpresa = await UsuarioEmpresa.findOne({
      usuarioId: usuario._id,
      empresaId: new mongoose.Types.ObjectId(empresaId),
      activo: true,
    });

    return {
      usuario: this.formatUserResponse(usuario, relacionEmpresa || undefined),
      empresa: empresa ? this.formatEmpresaResponse(empresa) : undefined,
      accessToken,
      refreshToken,
    };
  }

  // ============================================
  // REFRESH TOKEN
  // ============================================
  
  async refreshToken(refreshToken: string) {
    // Verificar refresh token
    let payload;
    try {
      const { verifyToken } = require('../../utils/jwt');
      payload = verifyToken(refreshToken);
    } catch (error) {
      throw new Error('Refresh token inválido o expirado');
    }

    // Buscar usuario
    const usuario = await Usuario.findById(payload.userId).populate('empresaId');

    if (!usuario || !usuario.activo) {
      throw new Error('Usuario no encontrado o inactivo');
    }

    // Generar nuevo access token
    const newAccessToken = generateAccessToken(usuario);

    return {
      accessToken: newAccessToken,
    };
  }

  // ============================================
  // VERIFICAR 2FA
  // ============================================

  async verify2FA(data: Verify2FADTO) {
    // Buscar usuario con secret 2FA
    const usuario = await Usuario.findById(data.userId)
      .select('+twoFactorSecret')
      .populate('empresaId');

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    let isValidCode = false;

    // Verificar según el método
    if (usuario.twoFactorMethod === 'app') {
      // Google Authenticator (TOTP)
      if (!usuario.twoFactorSecret) {
        throw new Error('2FA no configurado correctamente');
      }
      isValidCode = verifyTOTP(data.code, usuario.twoFactorSecret);
    } else if (usuario.twoFactorMethod === 'sms') {
      // SMS
      isValidCode = verifySMSCode(data.userId, data.code);
    }

    if (!isValidCode) {
      throw new Error('Código 2FA inválido o expirado');
    }

    // ============================================
    // Buscar el usuario de nuevo SIN POPULATE para tokens
    // ============================================
    const usuarioParaToken = await Usuario.findById(usuario._id);

    if (!usuarioParaToken) {
      throw new Error('Error al generar tokens');
    }

    // ============================================
    // VALIDAR LÍMITE DE SESIONES SIMULTÁNEAS
    // ============================================
    const empresaIdUsuario = usuario.empresaId as mongoose.Types.ObjectId;
    const limiteSesiones = await this.getLimiteSesionesSimultaneas(empresaIdUsuario);
    const sesionesActivas = await this.contarSesionesActivas(empresaIdUsuario);

    if (limiteSesiones !== -1 && sesionesActivas >= limiteSesiones) {
      throw new Error(
        `Se ha alcanzado el límite de ${limiteSesiones} sesiones simultáneas de tu plan. ` +
        `Cierra alguna sesión activa o contacta con el administrador para ampliar el límite.`
      );
    }

    // Código válido, generar tokens
    const accessToken = generateAccessToken(usuarioParaToken);
    const refreshToken = generateRefreshToken(usuarioParaToken);

    // Guardar refresh token en base de datos
    await this.saveRefreshToken(usuario._id, refreshToken, data.deviceInfo, data.ipAddress);

    // Actualizar último acceso
    usuario.ultimoAcceso = new Date();
    await usuario.save();

    // Obtener relación UsuarioEmpresa para esta empresa
    const relacionEmpresa = await UsuarioEmpresa.findOne({
      usuarioId: usuario._id,
      empresaId: empresaIdUsuario,
      activo: true,
    });

    return {
      usuario: this.formatUserResponse(usuario, relacionEmpresa || undefined),
      accessToken,
      refreshToken,
    };
  }


  // ============================================
  // FORGOT PASSWORD (Solicitar reset)
  // ============================================
  
  async forgotPassword(email: string) {
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      // Por seguridad, no revelar si el email existe
      return {
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación',
      };
    }

    // Generar token aleatorio
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash del token para guardarlo en DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Guardar token y expiración (1 hora)
    usuario.resetPasswordToken = hashedToken;
    usuario.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await usuario.save();

    // URL de reset (frontend)
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Enviar email
    const { sendEmail, emailTemplates } = require('../../utils/email');
    const emailResult = await sendEmail(
      usuario.email,
      'Recuperación de Contraseña - Tralok ERP',
      emailTemplates.resetPassword(resetUrl, usuario.nombre)
    );

    if (!emailResult.success) {
      // Limpiar token si falla el envío
      usuario.resetPasswordToken = undefined;
      usuario.resetPasswordExpires = undefined;
      await usuario.save();

      throw new Error('Error enviando email de recuperación');
    }

    return {
      success: true,
      message: 'Si el email existe, recibirás un enlace de recuperación',
    };
  }

  // ============================================
  // VERIFY RESET TOKEN
  // ============================================
  
  async verifyResetToken(token: string) {
    // Hash del token para buscar en DB
    const crypto = require('crypto');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar usuario con token válido y no expirado
    const usuario = await Usuario.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!usuario) {
      throw new Error('Token inválido o expirado');
    }

    return {
      valid: true,
      email: usuario.email,
    };
  }

  // ============================================
  // RESET PASSWORD (Cambiar contraseña)
  // ============================================
  
  async resetPassword(token: string, newPassword: string) {
    // Hash del token para buscar en DB
    const crypto = require('crypto');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar usuario con token válido y no expirado
    const usuario = await Usuario.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!usuario) {
      throw new Error('Token inválido o expirado');
    }

    // Actualizar contraseña
    usuario.password = newPassword; // Se hasheará automáticamente por el middleware
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpires = undefined;
    await usuario.save();

    // Revocar todos los refresh tokens (por seguridad)
    await this.revokeAllUserTokens(String(usuario._id), 'password_change');

    // Enviar email de confirmación
    const { sendEmail, emailTemplates } = require('../../utils/email');
    await sendEmail(
      usuario.email,
      'Contraseña Actualizada - Tralok ERP',
      emailTemplates.passwordChanged(usuario.nombre)
    );

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    };
  }

  // ============================================
  // OBTENER USUARIO POR ID
  // ============================================
  
  async getUserById(userId: string) {
    const usuario = await Usuario.findById(userId).populate('empresaId');

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener relación UsuarioEmpresa para la empresa actual del usuario
    const relacionEmpresa = usuario.empresaId
      ? await UsuarioEmpresa.findOne({
          usuarioId: usuario._id,
          empresaId: usuario.empresaId,
          activo: true,
        })
      : null;

    return this.formatUserResponse(usuario, relacionEmpresa || undefined);
  }

  // ============================================
  // SETUP 2FA - GOOGLE AUTHENTICATOR
  // ============================================
  
  async setup2FAApp(userId: string) {
    const usuario = await Usuario.findById(userId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Generar secret y QR
    const { secret, otpauthUrl } = generateTOTPSecret(usuario.email);
    const qrCode = await generateQRCode(otpauthUrl!);

    // Guardar secret temporalmente (se confirmará después)
    usuario.twoFactorSecret = secret;
    await usuario.save();

    return {
      qrCode, // Data URL del QR
      secret, // Por si quieren introducirlo manualmente
    };
  }

  // ============================================
  // CONFIRMAR 2FA - GOOGLE AUTHENTICATOR
  // ============================================
  
  async confirm2FAApp(userId: string, code: string) {
    const usuario = await Usuario.findById(userId).select('+twoFactorSecret');
    if (!usuario || !usuario.twoFactorSecret) {
      throw new Error('2FA no iniciado. Ejecuta setup primero.');
    }

    // Verificar código
    const isValid = verifyTOTP(code, usuario.twoFactorSecret);
    if (!isValid) {
      throw new Error('Código inválido. Intenta de nuevo.');
    }

    // Activar 2FA
    usuario.twoFactorEnabled = true;
    usuario.twoFactorMethod = 'app';
    await usuario.save();

    return true;
  }

  // ============================================
  // SETUP 2FA - SMS
  // ============================================
  
  async setup2FASMS(userId: string, data: Setup2FASMSDTO) {
    const usuario = await Usuario.findById(userId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Generar código
    const code = generateSMSCode();

    // Enviar SMS
    const result = await sendSMSCode(data.phoneNumber, code);

    if (!result.success) {
      throw new Error(result.message);
    }

    // Guardar código temporalmente
    storeSMSCode(userId, code);

    // Guardar teléfono (pero no activar aún)
    usuario.twoFactorPhone = data.phoneNumber;
    await usuario.save();

    return {
      phoneNumber: data.phoneNumber,
      message: result.message,
    };
  }

  // ============================================
  // CONFIRMAR 2FA - SMS
  // ============================================
  
  async confirm2FASMS(userId: string, code: string) {
    // Verificar código
    const isValid = verifySMSCode(userId, code);
    if (!isValid) {
      throw new Error('Código inválido o expirado');
    }

    const usuario = await Usuario.findById(userId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Activar 2FA SMS
    usuario.twoFactorEnabled = true;
    usuario.twoFactorMethod = 'sms';
    await usuario.save();

    return true;
  }

  // ============================================
  // DESACTIVAR 2FA
  // ============================================
  
  async disable2FA(userId: string, password: string) {
    const usuario = await Usuario.findById(userId)
      .select('+password +twoFactorSecret');
    
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar contraseña
    const isPasswordValid = await usuario.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Contraseña incorrecta');
    }

    // Desactivar 2FA
    usuario.twoFactorEnabled = false;
    usuario.twoFactorMethod = null;
    usuario.twoFactorSecret = undefined;
    usuario.twoFactorPhone = undefined;
    await usuario.save();

    return true;
  }

  // ============================================
  // REENVIAR CÓDIGO SMS
  // ============================================
  
  async resendSMSCode(userId: string) {
    const usuario = await Usuario.findById(userId);
    if (!usuario || !usuario.twoFactorPhone) {
      throw new Error('Usuario o teléfono no encontrado');
    }

    // Generar nuevo código
    const code = generateSMSCode();

    // Enviar SMS
    const result = await sendSMSCode(usuario.twoFactorPhone, code);

    if (!result.success) {
      throw new Error(result.message);
    }

    // Guardar código
    storeSMSCode(userId, code);

    return true;
  }

  // ============================================
  // HELPERS PRIVADOS
  // ============================================
  
  private formatUserResponse(
    usuario: IUsuario,
    relacionEmpresa?: { personalId?: mongoose.Types.ObjectId; rol?: string }
  ): UserResponse {
    return {
      id: String(usuario._id),
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      email: usuario.email,
      // Usar el rol de la relación si existe, si no el del usuario
      rol: relacionEmpresa?.rol || usuario.rol,
      empresaId: String(usuario.empresaId),
      avatar: usuario.avatar,
      twoFactorEnabled: usuario.twoFactorEnabled,
      twoFactorMethod: usuario.twoFactorMethod,
      // Usar personalId de la relación UsuarioEmpresa (específico de cada empresa)
      personalId: relacionEmpresa?.personalId
        ? String(relacionEmpresa.personalId)
        : undefined,
    };
  }

  private formatEmpresaResponse(empresa: any): EmpresaResponse {
    return {
      id: String(empresa._id),
      nombre: empresa.nombre,
      nif: empresa.nif,
      email: empresa.email,
      tipoNegocio: empresa.tipoNegocio,
    };
  }

  // ============================================
  // 🆕 MÉTODOS PARA GESTIÓN DE REFRESH TOKENS
  // ============================================

  /**
   * Guardar refresh token en la base de datos
   */
  private async saveRefreshToken(
    userId: mongoose.Types.ObjectId,
    token: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<void> {
    // Hash del token para guardarlo de forma segura
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Calcular fecha de expiración (mismo que el JWT)
    const config = require('@/config/env').default;
    const expiresInDays = parseInt(config.jwt.refreshExpiresIn.replace('d', ''));
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      userId,
      token: hashedToken,
      deviceInfo,
      ipAddress,
      expiresAt,
      isRevoked: false,
    });
  }

  /**
   * Verificar si un refresh token es válido en la base de datos
   */
  private async verifyRefreshTokenInDB(token: string): Promise<boolean> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const tokenRecord = await RefreshToken.findOne({
      token: hashedToken,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    return !!tokenRecord;
  }

  /**
   * Revocar un refresh token específico
   */
  async revokeRefreshToken(token: string, reason: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    await RefreshToken.updateOne(
      { token: hashedToken },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: reason,
        },
      }
    );
  }

  /**
   * Revocar todos los refresh tokens de un usuario
   */
  async revokeAllUserTokens(userId: string, reason: string): Promise<number> {
    const result = await RefreshToken.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isRevoked: false },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: reason,
        },
      }
    );

    return result.modifiedCount;
  }

  /**
   * Obtener sesiones activas de un usuario
   */
  async getActiveSessions(userId: string) {
    const sessions = await RefreshToken.find({
      userId: new mongoose.Types.ObjectId(userId),
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .select('deviceInfo ipAddress createdAt expiresAt')
      .lean();

    return sessions.map((session) => ({
      id: String(session._id),
      deviceInfo: session.deviceInfo || 'Dispositivo desconocido',
      ipAddress: session.ipAddress || 'IP desconocida',
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }

  /**
   * Obtener sesiones activas de todos los usuarios de una empresa
   * Usado para el control de usuarios simultáneos en billing
   */
  async getActiveSessionsByEmpresa(empresaId: string) {
    // Obtener todos los usuarios de la empresa
    const usuariosEmpresa = await UsuarioEmpresa.find({
      empresaId: new mongoose.Types.ObjectId(empresaId),
      activo: true,
    }).select('usuarioId');

    const userIds = usuariosEmpresa.map(ue => ue.usuarioId);

    // Obtener todas las sesiones activas de esos usuarios
    const sessions = await RefreshToken.find({
      userId: { $in: userIds },
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'userId',
        select: 'nombre apellidos email',
        model: 'Usuario',
      })
      .lean();

    return {
      totalSesiones: sessions.length,
      sesiones: sessions.map((session: any) => ({
        id: String(session._id),
        usuario: session.userId ? {
          id: String(session.userId._id),
          nombre: `${session.userId.nombre || ''} ${session.userId.apellidos || ''}`.trim(),
          email: session.userId.email,
        } : null,
        deviceInfo: session.deviceInfo || 'Dispositivo desconocido',
        ipAddress: session.ipAddress || 'IP desconocida',
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      })),
    };
  }

  /**
   * Logout: Revocar el refresh token actual
   */
  async logout(refreshToken: string): Promise<void> {
    await this.revokeRefreshToken(refreshToken, 'user_logout');
  }
}