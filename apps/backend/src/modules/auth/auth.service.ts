// apps/backend/src/modules/auth/auth.service.ts

import Usuario, { IUsuario } from '../../models/Usuario';
import Empresa from '../../models/Empresa';
import Plan from '../../models/Plan';           // ← AÑADIR
import Licencia from '../../models/Licencia';   // ← AÑADIR
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
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

export class AuthService {
  
  // ============================================
  // REGISTRO
  // ============================================
  
 async register(data: RegisterDTO) {
    // Verificar si el email ya existe
    const usuarioExistente = await Usuario.findOne({ email: data.email });
    if (usuarioExistente) {
      throw new Error('El email ya está registrado');
    }

    // Verificar si el NIF de empresa ya existe
    const empresaExistente = await Empresa.findOne({ nif: data.nifEmpresa });
    if (empresaExistente) {
      throw new Error('La empresa con este NIF ya está registrada');
    }

    // 1. Crear empresa
    const empresa = await Empresa.create({
      nombre: data.nombreEmpresa,
      nif: data.nifEmpresa,
      email: data.emailEmpresa,
      tipoNegocio: data.tipoNegocio || 'retail',
      estado: 'activa',
    });

    // 2. Crear usuario (admin de la empresa)
    const usuario = await Usuario.create({
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

    // 3. CREAR LICENCIA DEMO (30 días trial)
    // Buscar el plan Demo
    const planDemo = await Plan.findOne({ slug: 'demo' });

    if (!planDemo) {
      console.error('⚠️ Plan Demo no encontrado. Ejecuta: npm run seed:plans');
      throw new Error('Error en configuración de planes');
    }

    // Crear licencia trial
    const licencia = await Licencia.create({
      empresaId: empresa._id,
      planId: planDemo._id,
      estado: 'trial',
      esTrial: true,
      fechaInicioTrial: new Date(),
      fechaFinTrial: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      tipoSuscripcion: 'mensual',
      fechaInicio: new Date(),
      fechaRenovacion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usoActual: {
        usuariosSimultaneos: 0,
        usuariosTotales: 1, // Ya hay 1 usuario (el admin)
        facturasEsteMes: 0,
        productosActuales: 0,
        almacenesActuales: 1, // Por defecto 1 almacén
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
          planNuevo: 'Demo',
          motivo: 'Registro inicial - Trial de 30 días',
        },
      ],
    });

    console.log('✅ Licencia trial creada:', licencia._id);

    // 4. Generar tokens
    const accessToken = generateAccessToken(usuario);
    const refreshToken = generateRefreshToken(usuario);

    console.log('✅ Usuario registrado:', usuario.email);

    return {
      usuario: this.formatUserResponse(usuario),
      empresa: this.formatEmpresaResponse(empresa),
      licencia: {
        plan: planDemo.nombre,
        estado: licencia.estado,
        diasTrialRestantes: 30,
      },
      accessToken,
      refreshToken,
    };
  }



  // ============================================
  // LOGIN
  // ============================================

  async login(data: LoginDTO) {
    // Buscar usuario (incluir password para verificar)
    const usuario = await Usuario.findOne({ email: data.email })
      .select('+password')
      .populate('empresaId');

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

    // Verificar si tiene 2FA activado
    if (usuario.twoFactorEnabled) {
      // Si tiene 2FA por SMS, enviar código ahora
      if (usuario.twoFactorMethod === 'sms' && usuario.twoFactorPhone) {
        const code = generateSMSCode();
        await sendSMSCode(usuario.twoFactorPhone, code);
        storeSMSCode(String(usuario._id), code);
      }

      // NO devolver tokens todavía
      return {
        requires2FA: true,
        twoFactorMethod: usuario.twoFactorMethod!,
        userId: String(usuario._id),
      };
    }

    // ============================================
    // IMPORTANTE: Buscar el usuario de nuevo SIN POPULATE
    // para generar tokens con el ID correcto
    // ============================================
    const usuarioParaToken = await Usuario.findById(usuario._id).select('+password');

    if (!usuarioParaToken) {
      throw new Error('Error al generar tokens');
    }

    // Si NO tiene 2FA, devolver tokens directamente
    const accessToken = generateAccessToken(usuarioParaToken); // ← Usuario sin populate
    const refreshToken = generateRefreshToken(usuarioParaToken); // ← Usuario sin populate

    // Actualizar último acceso
    usuario.ultimoAcceso = new Date();
    await usuario.save();

    console.log('✅ Login exitoso:', usuario.email);

    return {
      requires2FA: false,
      usuario: this.formatUserResponse(usuario), // ← Este puede tener populate para mostrar datos
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

    console.log('✅ Token refrescado:', usuario.email);

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

    // Código válido, generar tokens
    const accessToken = generateAccessToken(usuarioParaToken); // ← Sin populate
    const refreshToken = generateRefreshToken(usuarioParaToken); // ← Sin populate

    // Actualizar último acceso
    usuario.ultimoAcceso = new Date();
    await usuario.save();

    console.log('✅ 2FA verificado exitosamente:', usuario.email);

    return {
      usuario: this.formatUserResponse(usuario), // ← Este puede tener populate
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
      'Recuperación de Contraseña - Omerix ERP',
      emailTemplates.resetPassword(resetUrl, usuario.nombre)
    );

    if (!emailResult.success) {
      // Limpiar token si falla el envío
      usuario.resetPasswordToken = undefined;
      usuario.resetPasswordExpires = undefined;
      await usuario.save();

      throw new Error('Error enviando email de recuperación');
    }

    console.log('✅ Email de recuperación enviado a:', usuario.email);

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

    console.log('✅ Contraseña actualizada para:', usuario.email);

    // Enviar email de confirmación
    const { sendEmail, emailTemplates } = require('../../utils/email');
    await sendEmail(
      usuario.email,
      'Contraseña Actualizada - Omerix ERP',
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

    return this.formatUserResponse(usuario);
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

    console.log('✅ 2FA App activado:', usuario.email);

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

    console.log('✅ 2FA SMS activado:', usuario.email);

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

    console.log('✅ 2FA desactivado:', usuario.email);

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
  
  private formatUserResponse(usuario: IUsuario): UserResponse {
    return {
      id: String(usuario._id),
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: usuario.rol,
      empresaId: String(usuario.empresaId),
      avatar: usuario.avatar,
      twoFactorEnabled: usuario.twoFactorEnabled,
      twoFactorMethod: usuario.twoFactorMethod,
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
}