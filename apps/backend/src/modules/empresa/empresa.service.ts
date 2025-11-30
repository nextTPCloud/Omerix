import Empresa, { IEmpresa, IEmailConfig } from '../../models/Empresa';
import nodemailer from 'nodemailer';
import { Types } from 'mongoose';

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

export interface UpdateEmpresaDTO {
  nombre?: string;
  nombreComercial?: string;
  email?: string;
  telefono?: string;
  web?: string;
  logo?: string;
  direccion?: {
    calle?: string;
    ciudad?: string;
    provincia?: string;
    codigoPostal?: string;
    pais?: string;
  };
}

export interface UpdateEmailConfigDTO {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string; // Solo se envía si se quiere cambiar
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

class EmpresaService {
  /**
   * Obtener información de la empresa actual (sin datos sensibles)
   */
  async getEmpresaById(empresaId: string): Promise<IEmpresa | null> {
    const empresa = await Empresa.findById(empresaId).lean();
    if (empresa) {
      // Eliminar campos sensibles manualmente
      delete (empresa as any).databaseConfig;
      if ((empresa as any).emailConfig) {
        delete (empresa as any).emailConfig.password;
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
      // Eliminar solo las contraseñas
      delete (empresa as any).databaseConfig?.password;
      delete (empresa as any).databaseConfig?.uri;
      if ((empresa as any).emailConfig) {
        delete (empresa as any).emailConfig.password;
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
    if (data.web !== undefined) updateData.web = data.web;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.direccion) updateData.direccion = data.direccion;

    await Empresa.updateOne(
      { _id: empresaId },
      { $set: updateData }
    );

    // Devolver sin datos sensibles
    return this.getEmpresaById(empresaId);
  }

  /**
   * Actualizar configuración de email SMTP
   */
  async updateEmailConfig(empresaId: string, config: UpdateEmailConfigDTO): Promise<IEmpresa | null> {
    // Primero obtener la empresa CON el password actual (select: false requiere +campo)
    const empresaActual = await Empresa.findById(empresaId)
      .select('+emailConfig.password')
      .lean();
    if (!empresaActual) return null;

    // Si no se envía password, mantener la existente
    const currentPassword = (empresaActual.emailConfig as any)?.password || '';
    const newPassword = config.password || currentPassword;

    if (!newPassword) {
      throw new Error('La contraseña es obligatoria');
    }

    const emailConfig: IEmailConfig = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      password: newPassword,
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
   * Obtener configuración de email (sin password)
   */
  async getEmailConfig(empresaId: string): Promise<Partial<IEmailConfig> | null> {
    const empresa = await Empresa.findById(empresaId).lean();

    if (!empresa?.emailConfig) return null;

    // Devolver sin password
    const emailConfig = empresa.emailConfig as IEmailConfig;
    return {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      user: emailConfig.user,
      fromName: emailConfig.fromName,
      fromEmail: emailConfig.fromEmail,
      replyTo: emailConfig.replyTo,
      password: emailConfig.password ? '••••••••' : undefined, // Indicar que hay password sin revelarla
    };
  }

  /**
   * Probar configuración de email enviando un correo de prueba
   */
  async testEmailConfig(empresaId: string, testEmail: string): Promise<{ success: boolean; message: string }> {
    // Necesitamos el password para enviar
    const empresa = await Empresa.findById(empresaId)
      .select('+emailConfig.password')
      .lean();

    if (!empresa?.emailConfig) {
      return { success: false, message: 'No hay configuración de email' };
    }

    if (!(empresa.emailConfig as any).password) {
      return { success: false, message: 'No hay contraseña configurada' };
    }

    try {
      const transporter = this.createTransporter(empresa.emailConfig);

      await transporter.sendMail({
        from: `"${empresa.emailConfig.fromName || empresa.nombre}" <${empresa.emailConfig.fromEmail || empresa.emailConfig.user}>`,
        to: testEmail,
        subject: 'Prueba de configuración de email - Omerix',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Prueba de configuración exitosa</h2>
            <p>Este es un correo de prueba enviado desde Omerix.</p>
            <p>Si estás viendo este mensaje, la configuración de email está funcionando correctamente.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Enviado desde: ${empresa.nombre}<br>
              Fecha: ${new Date().toLocaleString('es-ES')}
            </p>
          </div>
        `,
        text: `Prueba de configuración exitosa\n\nEste es un correo de prueba enviado desde Omerix.\nSi estás viendo este mensaje, la configuración de email está funcionando correctamente.`,
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
    // Necesitamos el password para enviar
    const empresa = await Empresa.findById(empresaId)
      .select('+emailConfig.password')
      .lean();

    if (!empresa?.emailConfig) {
      return { success: false, error: 'No hay configuración de email para esta empresa' };
    }

    if (!(empresa.emailConfig as any).password) {
      return { success: false, error: 'No hay contraseña de email configurada' };
    }

    try {
      const transporter = this.createTransporter(empresa.emailConfig);

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
   * Crear transporter de nodemailer
   */
  private createTransporter(config: IEmailConfig) {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: false, // Para servidores con certificados auto-firmados
      },
    });
  }
}

export const empresaService = new EmpresaService();
export default empresaService;
