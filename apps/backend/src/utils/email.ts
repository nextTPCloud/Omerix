import nodemailer from 'nodemailer';

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@omerix.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Omerix ERP';

// Crear transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: EMAIL_USER && EMAIL_PASSWORD ? {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  } : undefined,
});

// Verificar configuración
transporter.verify().then(() => {
  console.log('✅ Servidor de email configurado correctamente');
}).catch((error) => {
  console.warn('⚠️ Email no configurado:', error.message);
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; message: string }> => {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.warn('⚠️ Email no configurado. Email simulado enviado a:', to);
    return {
      success: true,
      message: 'Email simulado (configurar SMTP en producción)',
    };
  }

  try {
    await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email enviado a:', to);
    return {
      success: true,
      message: 'Email enviado correctamente',
    };
  } catch (error: any) {
    console.error('❌ Error enviando email:', error);
    return {
      success: false,
      message: 'Error enviando email: ' + error.message,
    };
  }
};

// Templates de emails
export const emailTemplates = {
  resetPassword: (resetUrl: string, userName: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Recuperación de Contraseña</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${userName}</strong>,</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Omerix ERP</strong>.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          <center>
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
          </center>
          <p><small>O copia y pega este enlace en tu navegador:<br>${resetUrl}</small></p>
          <p><strong>⚠️ Este enlace expira en 1 hora.</strong></p>
          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
          <p>Saludos,<br>El equipo de Omerix</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Omerix ERP. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  passwordChanged: (userName: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Contraseña Actualizada</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${userName}</strong>,</p>
          <p>Tu contraseña ha sido actualizada exitosamente.</p>
          <p>Si no realizaste este cambio, por favor contacta inmediatamente a soporte.</p>
          <p>Saludos,<br>El equipo de Omerix</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Omerix ERP. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};