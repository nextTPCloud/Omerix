import Empresa, { IEmpresa, IEmailConfig, ICuentaBancariaEmpresa, ITextosLegales, IDatosRegistro, encrypt, decrypt } from '../../models/Empresa';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { Types } from 'mongoose';
import { emailOAuthService } from './email-oauth.service';

// Roles permitidos para gestionar configuración de empresa
export const ROLES_GESTION_EMPRESA = ['superadmin', 'admin', 'gerente'];

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}

export interface UpdateAIConfigDTO {
  provider?: 'gemini' | 'openai' | 'claude' | 'ollama';
  apiKey?: string | null; // null para eliminar
  model?: string;
}

export interface UpdateEmpresaDTO {
  nombre?: string;
  nombreComercial?: string;
  email?: string;
  telefono?: string;
  movil?: string;
  fax?: string;
  web?: string;
  logo?: string;
  direccion?: {
    calle?: string;
    numero?: string;
    piso?: string;
    ciudad?: string;
    provincia?: string;
    codigoPostal?: string;
    pais?: string;
  };
  datosRegistro?: IDatosRegistro;
  cuentasBancarias?: ICuentaBancariaEmpresa[];
  textosLegales?: ITextosLegales;
  seriesDocumentos?: {
    presupuestos?: string;
    pedidos?: string;
    albaranes?: string;
    facturas?: string;
    facturasRectificativas?: string;
  };
  moneda?: string;
  formatoFecha?: string;
  formatoNumero?: string;
  // Configuración de decimales
  decimalesCantidad?: number;
  decimalesPrecios?: number;
  aiConfig?: UpdateAIConfigDTO;
}

export interface UpdateEmailConfigDTO {
  authType: 'oauth2' | 'smtp';
  // SMTP
  host?: string;
  port?: number;
  secure?: boolean;
  user: string;
  password?: string;
  // Común
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

class EmpresaService {
  /**
   * Obtener información de la empresa actual (sin datos sensibles)
   */
  async getEmpresaById(empresaId: string): Promise<IEmpresa | null> {
    // Incluir aiConfig.apiKey para verificar si existe
    const empresa = await Empresa.findById(empresaId)
      .select('+aiConfig.apiKey')
      .lean();
    if (empresa) {
      // Eliminar campos sensibles manualmente
      delete (empresa as any).databaseConfig;
      if ((empresa as any).emailConfig) {
        delete (empresa as any).emailConfig.password;
        delete (empresa as any).emailConfig.oauth2;
      }
      // Para aiConfig, indicar si hay API key pero no devolver el valor
      if ((empresa as any).aiConfig) {
        const hasApiKey = !!(empresa as any).aiConfig.apiKey;
        (empresa as any).aiConfig = {
          provider: (empresa as any).aiConfig.provider,
          model: (empresa as any).aiConfig.model,
          hasApiKey,
        };
      }
    }
    return empresa as IEmpresa | null;
  }

  /**
   * Obtener información completa de la empresa (para admin)
   */
  async getEmpresaCompleta(empresaId: string): Promise<IEmpresa | null> {
    const empresa = await Empresa.findById(empresaId).lean();
    if (empresa) {
      // Eliminar solo las contraseñas y tokens
      delete (empresa as any).databaseConfig?.password;
      delete (empresa as any).databaseConfig?.uri;
      if ((empresa as any).emailConfig) {
        delete (empresa as any).emailConfig.password;
        delete (empresa as any).emailConfig.oauth2;
      }
    }
    return empresa as IEmpresa | null;
  }

  /**
   * Actualizar información básica de la empresa
   */
  async updateEmpresa(empresaId: string, data: UpdateEmpresaDTO): Promise<IEmpresa | null> {
    const updateData: any = {};

    if (data.nombre) updateData.nombre = data.nombre;
    if (data.nombreComercial !== undefined) updateData.nombreComercial = data.nombreComercial;
    if (data.email) updateData.email = data.email;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.movil !== undefined) updateData.movil = data.movil;
    if (data.fax !== undefined) updateData.fax = data.fax;
    if (data.web !== undefined) updateData.web = data.web;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.direccion) updateData.direccion = data.direccion;
    if (data.datosRegistro !== undefined) updateData.datosRegistro = data.datosRegistro;
    if (data.cuentasBancarias !== undefined) updateData.cuentasBancarias = data.cuentasBancarias;
    if (data.textosLegales !== undefined) updateData.textosLegales = data.textosLegales;
    if (data.seriesDocumentos !== undefined) updateData.seriesDocumentos = data.seriesDocumentos;
    if (data.moneda !== undefined) updateData.moneda = data.moneda;
    if (data.formatoFecha !== undefined) updateData.formatoFecha = data.formatoFecha;
    if (data.formatoNumero !== undefined) updateData.formatoNumero = data.formatoNumero;
    if (data.decimalesCantidad !== undefined) updateData.decimalesCantidad = data.decimalesCantidad;
    if (data.decimalesPrecios !== undefined) updateData.decimalesPrecios = data.decimalesPrecios;

    // Manejar configuración de IA
    if (data.aiConfig !== undefined) {
      // Obtener configuración actual para preservar apiKey si no se envía nueva
      const empresaActual = await Empresa.findById(empresaId)
        .select('+aiConfig.apiKey')
        .lean();

      const aiConfig: any = {
        provider: data.aiConfig.provider || 'gemini',
        model: data.aiConfig.model || 'gemini-2.0-flash',
      };

      // Si apiKey es null, eliminar la API key
      if (data.aiConfig.apiKey === null) {
        aiConfig.apiKey = undefined;
      } else if (data.aiConfig.apiKey) {
        // Nueva API key: encriptar
        aiConfig.apiKey = encrypt(data.aiConfig.apiKey);
      } else if ((empresaActual as any)?.aiConfig?.apiKey) {
        // Mantener la existente
        aiConfig.apiKey = (empresaActual as any).aiConfig.apiKey;
      }

      updateData.aiConfig = aiConfig;
    }

    await Empresa.updateOne(
      { _id: empresaId },
      { $set: updateData }
    );

    // Devolver sin datos sensibles
    return this.getEmpresaById(empresaId);
  }

  /**
   * Actualizar configuración de email SMTP manual
   * La contraseña se almacena encriptada
   */
  async updateEmailConfig(empresaId: string, config: UpdateEmailConfigDTO): Promise<IEmpresa | null> {
    // Primero obtener la empresa CON el password actual (select: false requiere +campo)
    const empresaActual = await Empresa.findById(empresaId)
      .select('+emailConfig.password')
      .lean();
    if (!empresaActual) return null;

    // Si no se envía password, mantener la existente (ya está encriptada)
    const currentEncryptedPassword = (empresaActual.emailConfig as any)?.password || '';

    let passwordToStore: string | undefined;
    if (config.password) {
      // Nueva contraseña: encriptar antes de guardar
      passwordToStore = encrypt(config.password);
    } else if (currentEncryptedPassword) {
      // Mantener la contraseña existente (ya encriptada)
      passwordToStore = currentEncryptedPassword;
    } else if (config.authType === 'smtp') {
      throw new Error('La contraseña es obligatoria para configuración SMTP');
    }

    const emailConfig: Partial<IEmailConfig> = {
      authType: 'smtp',
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      password: passwordToStore,
      fromName: config.fromName,
      fromEmail: config.fromEmail,
      replyTo: config.replyTo,
    };

    // Usar updateOne para evitar conflictos de proyección
    await Empresa.updateOne(
      { _id: empresaId },
      { $set: { emailConfig } }
    );

    // Devolver la empresa actualizada sin datos sensibles
    return this.getEmpresaById(empresaId);
  }

  /**
   * Obtener configuración de email (sin datos sensibles)
   */
  async getEmailConfig(empresaId: string): Promise<Partial<IEmailConfig> & { hasPassword?: boolean; isConnected?: boolean } | null> {
    // Incluir password y oauth2.refreshToken para verificar si existen (no se devuelven al frontend)
    const empresa = await Empresa.findById(empresaId)
      .select('+emailConfig.password +emailConfig.oauth2.refreshToken')
      .lean();

    if (!empresa?.emailConfig) return null;

    const emailConfig = empresa.emailConfig as IEmailConfig;

    // Respuesta base común
    const response: any = {
      authType: emailConfig.authType || 'smtp',
      user: emailConfig.user,
      fromName: emailConfig.fromName,
      fromEmail: emailConfig.fromEmail,
      replyTo: emailConfig.replyTo,
    };

    if (emailConfig.authType === 'oauth2') {
      // OAuth2 - indicar proveedor y estado de conexión
      response.provider = emailConfig.provider;
      response.isConnected = !!(emailConfig.oauth2?.refreshToken);
    } else {
      // SMTP manual
      response.host = emailConfig.host;
      response.port = emailConfig.port;
      response.secure = emailConfig.secure;
      response.hasPassword = !!emailConfig.password;
    }

    return response;
  }

  /**
   * Probar configuración de email enviando un correo de prueba
   */
  async testEmailConfig(empresaId: string, testEmail: string): Promise<{ success: boolean; message: string }> {
    const empresa = await Empresa.findById(empresaId)
      .select('+emailConfig.password +emailConfig.oauth2.accessToken +emailConfig.oauth2.refreshToken')
      .lean();

    if (!empresa?.emailConfig) {
      return { success: false, message: 'No hay configuración de email' };
    }

    try {
      const transporter = await this.createTransporter(empresaId, empresa.emailConfig as IEmailConfig);

      await transporter.sendMail({
        from: `"${empresa.emailConfig.fromName || empresa.nombre}" <${empresa.emailConfig.fromEmail || empresa.emailConfig.user}>`,
        to: testEmail,
        subject: 'Prueba de configuración de email - Omerix',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Prueba de configuración exitosa</h2>
            <p>Este es un correo de prueba enviado desde Omerix.</p>
            <p>Si estás viendo este mensaje, la configuración de email está funcionando correctamente.</p>
            <p><strong>Método de autenticación:</strong> ${empresa.emailConfig.authType === 'oauth2' ? `OAuth2 (${empresa.emailConfig.provider})` : 'SMTP Manual'}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Enviado desde: ${empresa.nombre}<br>
              Fecha: ${new Date().toLocaleString('es-ES')}
            </p>
          </div>
        `,
        text: `Prueba de configuración exitosa\n\nEste es un correo de prueba enviado desde Omerix.\nSi estás viendo este mensaje, la configuración de email está funcionando correctamente.\n\nMétodo: ${empresa.emailConfig.authType === 'oauth2' ? `OAuth2 (${empresa.emailConfig.provider})` : 'SMTP Manual'}`,
      });

      return { success: true, message: 'Email de prueba enviado correctamente' };
    } catch (error: any) {
      console.error('Error al enviar email de prueba:', error);
      return {
        success: false,
        message: `Error al enviar: ${error.message || 'Error desconocido'}`
      };
    }
  }

  /**
   * Enviar email usando la configuración de la empresa
   */
  async sendEmail(empresaId: string, options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const empresa = await Empresa.findById(empresaId)
      .select('+emailConfig.password +emailConfig.oauth2.accessToken +emailConfig.oauth2.refreshToken')
      .lean();

    if (!empresa?.emailConfig) {
      return { success: false, error: 'No hay configuración de email para esta empresa' };
    }

    try {
      const transporter = await this.createTransporter(empresaId, empresa.emailConfig as IEmailConfig);

      const mailOptions = {
        from: `"${empresa.emailConfig.fromName || empresa.nombre}" <${empresa.emailConfig.fromEmail || empresa.emailConfig.user}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        replyTo: empresa.emailConfig.replyTo || empresa.emailConfig.user,
        attachments: options.attachments,
      };

      const info = await transporter.sendMail(mailOptions);

      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error('Error al enviar email:', error);
      return { success: false, error: error.message || 'Error al enviar email' };
    }
  }

  /**
   * Crear transporter de nodemailer según el tipo de autenticación
   */
  private async createTransporter(empresaId: string, config: IEmailConfig) {
    if (config.authType === 'oauth2' && config.provider === 'google') {
      // OAuth2 con Google
      const { accessToken, email } = await emailOAuthService.getValidAccessToken(empresaId);

      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: email,
          accessToken,
        },
      });
    }

    if (config.authType === 'oauth2' && config.provider === 'microsoft') {
      // OAuth2 con Microsoft
      const { accessToken, email } = await emailOAuthService.getValidAccessToken(empresaId);

      return nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          type: 'OAuth2',
          user: email,
          accessToken,
        },
      });
    }

    // SMTP manual
    if (!config.password) {
      throw new Error('No hay contraseña configurada para SMTP');
    }

    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: decrypt(config.password),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Desconectar configuración de email
   */
  async disconnectEmail(empresaId: string): Promise<void> {
    await Empresa.updateOne(
      { _id: empresaId },
      { $unset: { emailConfig: 1 } }
    );
  }
}

export const empresaService = new EmpresaService();
export default empresaService;
