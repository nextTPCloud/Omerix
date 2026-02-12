import nodemailer from 'nodemailer';

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@tralok.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Tralok ERP';

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
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Tralok ERP</strong>.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          <center>
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
          </center>
          <p><small>O copia y pega este enlace en tu navegador:<br>${resetUrl}</small></p>
          <p><strong>⚠️ Este enlace expira en 1 hora.</strong></p>
          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
          <p>Saludos,<br>El equipo de Tralok</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Tralok ERP. Todos los derechos reservados.</p>
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
          <p>Saludos,<br>El equipo de Tralok</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Tralok ERP. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Recordatorios de presupuestos
  presupuestoExpiracion: (params: {
    clienteNombre: string;
    codigoPresupuesto: string;
    tituloPresupuesto?: string;
    fechaValidez: string;
    diasRestantes: number;
    totalPresupuesto: string;
    empresaNombre: string;
    contactoEmail?: string;
    contactoTelefono?: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B; }
        .highlight { font-size: 24px; font-weight: bold; color: #F59E0B; }
        .cta-button { display: inline-block; padding: 14px 30px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .contact-info { background: #E5E7EB; padding: 15px; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Recordatorio de Presupuesto</h1>
        </div>
        <div class="content">
          <p>Estimado/a <strong>${params.clienteNombre}</strong>,</p>
          <p>Le recordamos que el presupuesto que le enviamos está próximo a expirar:</p>

          <div class="info-box">
            <p><strong>Presupuesto:</strong> ${params.codigoPresupuesto}</p>
            ${params.tituloPresupuesto ? `<p><strong>Concepto:</strong> ${params.tituloPresupuesto}</p>` : ''}
            <p><strong>Importe total:</strong> <span class="highlight">${params.totalPresupuesto}</span></p>
            <p><strong>Válido hasta:</strong> ${params.fechaValidez}</p>
            <p><strong>Días restantes:</strong> <span style="color: ${params.diasRestantes <= 3 ? '#EF4444' : '#F59E0B'}; font-weight: bold;">${params.diasRestantes} ${params.diasRestantes === 1 ? 'día' : 'días'}</span></p>
          </div>

          <p>Si tiene alguna duda o desea aceptar el presupuesto, no dude en ponerse en contacto con nosotros.</p>

          ${params.contactoEmail || params.contactoTelefono ? `
          <div class="contact-info">
            <p><strong>Contacto:</strong></p>
            ${params.contactoEmail ? `<p>📧 ${params.contactoEmail}</p>` : ''}
            ${params.contactoTelefono ? `<p>📞 ${params.contactoTelefono}</p>` : ''}
          </div>
          ` : ''}

          <p>Saludos cordiales,<br><strong>${params.empresaNombre}</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${params.empresaNombre}. Todos los derechos reservados.</p>
          <p style="font-size: 11px; color: #999;">Este es un recordatorio automático. Si ya ha respondido a este presupuesto, por favor ignore este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  presupuestoSinRespuesta: (params: {
    clienteNombre: string;
    codigoPresupuesto: string;
    tituloPresupuesto?: string;
    fechaEnvio: string;
    diasSinRespuesta: number;
    totalPresupuesto: string;
    empresaNombre: string;
    contactoEmail?: string;
    contactoTelefono?: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366F1; }
        .highlight { font-size: 24px; font-weight: bold; color: #6366F1; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .contact-info { background: #E5E7EB; padding: 15px; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Seguimiento de Presupuesto</h1>
        </div>
        <div class="content">
          <p>Estimado/a <strong>${params.clienteNombre}</strong>,</p>
          <p>Hace ${params.diasSinRespuesta} días le enviamos un presupuesto y aún no hemos recibido respuesta. Nos gustaría saber si tiene alguna duda o si podemos ayudarle de alguna manera.</p>

          <div class="info-box">
            <p><strong>Presupuesto:</strong> ${params.codigoPresupuesto}</p>
            ${params.tituloPresupuesto ? `<p><strong>Concepto:</strong> ${params.tituloPresupuesto}</p>` : ''}
            <p><strong>Importe total:</strong> <span class="highlight">${params.totalPresupuesto}</span></p>
            <p><strong>Fecha de envío:</strong> ${params.fechaEnvio}</p>
          </div>

          <p>Entendemos que puede estar evaluando diferentes opciones. Si desea que modifiquemos algo del presupuesto o tiene alguna consulta, estamos a su disposición.</p>

          ${params.contactoEmail || params.contactoTelefono ? `
          <div class="contact-info">
            <p><strong>Contacto:</strong></p>
            ${params.contactoEmail ? `<p>📧 ${params.contactoEmail}</p>` : ''}
            ${params.contactoTelefono ? `<p>📞 ${params.contactoTelefono}</p>` : ''}
          </div>
          ` : ''}

          <p>Saludos cordiales,<br><strong>${params.empresaNombre}</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${params.empresaNombre}. Todos los derechos reservados.</p>
          <p style="font-size: 11px; color: #999;">Este es un recordatorio automático. Si ya ha respondido a este presupuesto, por favor ignore este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Email de parte de trabajo
  parteTrabajo: (params: {
    clienteNombre: string;
    codigoParte: string;
    tituloParte?: string;
    tipoParte: string;
    fecha: string;
    estado: string;
    totalVenta: string;
    empresaNombre: string;
    empresaEmail?: string;
    empresaTelefono?: string;
    urlParte?: string;
    mensaje?: string;
    trabajoRealizado?: string;
    lineasResumen?: {
      personal: number;
      material: number;
      maquinaria: number;
      transporte: number;
      gastos: number;
    };
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
        .highlight { font-size: 24px; font-weight: bold; color: #059669; }
        .lineas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0; }
        .linea-item { background: #E5E7EB; padding: 10px; border-radius: 6px; text-align: center; }
        .linea-item span { font-weight: bold; color: #059669; }
        .cta-button { display: inline-block; padding: 14px 30px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .contact-info { background: #E5E7EB; padding: 15px; border-radius: 6px; margin-top: 20px; }
        .mensaje-personalizado { background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #F59E0B; }
        .trabajo-realizado { background: #DBEAFE; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3B82F6; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #D1FAE5; color: #065F46; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Parte de Trabajo</h1>
          <p style="margin: 0; opacity: 0.9;">${params.codigoParte}</p>
        </div>
        <div class="content">
          <p>Estimado/a <strong>${params.clienteNombre}</strong>,</p>

          ${params.mensaje ? `
          <div class="mensaje-personalizado">
            <p style="margin: 0;">${params.mensaje}</p>
          </div>
          ` : '<p>Le enviamos el parte de trabajo correspondiente a los servicios realizados:</p>'}

          <div class="info-box">
            <p><strong>Parte:</strong> ${params.codigoParte}</p>
            ${params.tituloParte ? `<p><strong>Concepto:</strong> ${params.tituloParte}</p>` : ''}
            <p><strong>Tipo:</strong> <span class="badge">${params.tipoParte}</span></p>
            <p><strong>Fecha:</strong> ${params.fecha}</p>
            <p><strong>Estado:</strong> ${params.estado}</p>
            <p><strong>Importe total:</strong> <span class="highlight">${params.totalVenta}</span></p>
          </div>

          ${params.lineasResumen ? `
          <p><strong>Resumen de trabajos:</strong></p>
          <div class="lineas-grid">
            ${params.lineasResumen.personal > 0 ? `<div class="linea-item">Personal<br><span>${params.lineasResumen.personal} líneas</span></div>` : ''}
            ${params.lineasResumen.material > 0 ? `<div class="linea-item">Material<br><span>${params.lineasResumen.material} líneas</span></div>` : ''}
            ${params.lineasResumen.maquinaria > 0 ? `<div class="linea-item">Maquinaria<br><span>${params.lineasResumen.maquinaria} líneas</span></div>` : ''}
            ${params.lineasResumen.transporte > 0 ? `<div class="linea-item">Transporte<br><span>${params.lineasResumen.transporte} líneas</span></div>` : ''}
            ${params.lineasResumen.gastos > 0 ? `<div class="linea-item">Gastos<br><span>${params.lineasResumen.gastos} líneas</span></div>` : ''}
          </div>
          ` : ''}

          ${params.trabajoRealizado ? `
          <div class="trabajo-realizado">
            <p><strong>Trabajo realizado:</strong></p>
            <p style="margin: 0;">${params.trabajoRealizado}</p>
          </div>
          ` : ''}

          ${params.urlParte ? `
          <center>
            <a href="${params.urlParte}" class="cta-button">Ver Parte de Trabajo</a>
          </center>
          ` : ''}

          <div class="contact-info">
            <p><strong>Contacto:</strong></p>
            ${params.empresaEmail ? `<p>Email: ${params.empresaEmail}</p>` : ''}
            ${params.empresaTelefono ? `<p>Telefono: ${params.empresaTelefono}</p>` : ''}
          </div>

          <p>Saludos cordiales,<br><strong>${params.empresaNombre}</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${params.empresaNombre}. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Notificación al agente comercial
  // Planificacion de jornadas para empleado
  planificacionJornadas: (params: {
    empleadoNombre: string;
    periodo: string;
    fechaInicio: string;
    fechaFin: string;
    diasPlanificados: Array<{
      fecha: string;
      diaSemana: string;
      horaInicio: string;
      horaFin: string;
      horas: number;
      turno?: string;
      partes?: Array<{ codigo: string; cliente: string }>;
      tareas?: Array<{ titulo: string }>;
    }>;
    totalHoras: number;
    empresaNombre: string;
    mensaje?: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .resumen { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; display: flex; justify-content: space-around; text-align: center; }
        .resumen-item h3 { margin: 0; color: #3B82F6; font-size: 24px; }
        .resumen-item p { margin: 5px 0 0; color: #666; font-size: 14px; }
        .tabla-planificacion { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; }
        .tabla-planificacion th { background: #E5E7EB; padding: 12px; text-align: left; font-weight: 600; }
        .tabla-planificacion td { padding: 12px; border-bottom: 1px solid #E5E7EB; }
        .tabla-planificacion tr:last-child td { border-bottom: none; }
        .badge-horario { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #D1FAE5; color: #065F46; }
        .badge-parte { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; background: #DBEAFE; color: #1E40AF; margin: 2px; }
        .badge-tarea { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; background: #EDE9FE; color: #5B21B6; margin: 2px; }
        .mensaje { background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #F59E0B; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Planificacion de Jornadas</h1>
          <p style="margin: 0; opacity: 0.9;">${params.periodo}</p>
        </div>
        <div class="content">
          <p>Hola <strong>${params.empleadoNombre}</strong>,</p>
          <p>Te enviamos tu planificacion de jornadas para la semana del <strong>${params.fechaInicio}</strong> al <strong>${params.fechaFin}</strong>:</p>

          ${params.mensaje ? `
          <div class="mensaje">
            <p style="margin: 0;">${params.mensaje}</p>
          </div>
          ` : ''}

          <div class="resumen">
            <div class="resumen-item">
              <h3>${params.diasPlanificados.length}</h3>
              <p>Dias planificados</p>
            </div>
            <div class="resumen-item">
              <h3>${params.totalHoras}h</h3>
              <p>Total horas</p>
            </div>
          </div>

          <table class="tabla-planificacion">
            <thead>
              <tr>
                <th>Dia</th>
                <th>Horario</th>
                <th>Actividades</th>
              </tr>
            </thead>
            <tbody>
              ${params.diasPlanificados.map(dia => `
              <tr>
                <td>
                  <strong>${dia.diaSemana}</strong><br>
                  <span style="color: #666; font-size: 13px;">${dia.fecha}</span>
                </td>
                <td>
                  <span class="badge-horario">${dia.horaInicio} - ${dia.horaFin}</span>
                  <br><span style="color: #666; font-size: 12px;">${dia.horas}h${dia.turno ? ` - ${dia.turno}` : ''}</span>
                </td>
                <td>
                  ${dia.partes && dia.partes.length > 0 ? dia.partes.map(p => `<span class="badge-parte">${p.codigo} - ${p.cliente}</span>`).join(' ') : ''}
                  ${dia.tareas && dia.tareas.length > 0 ? dia.tareas.map(t => `<span class="badge-tarea">${t.titulo}</span>`).join(' ') : ''}
                  ${(!dia.partes || dia.partes.length === 0) && (!dia.tareas || dia.tareas.length === 0) ? '<span style="color: #999;">-</span>' : ''}
                </td>
              </tr>
              `).join('')}
            </tbody>
          </table>

          <p>Si tienes alguna pregunta sobre tu horario, contacta con tu supervisor.</p>

          <p>Saludos,<br><strong>${params.empresaNombre}</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${params.empresaNombre}. Todos los derechos reservados.</p>
          <p style="font-size: 11px; color: #999;">Este es un mensaje automatico del sistema de planificacion.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Factura de suscripción
  facturaSuscripcion: (params: {
    clienteNombre: string;
    numeroFactura: string;
    fechaEmision: string;
    planNombre: string;
    tipoSuscripcion: string;
    periodoInicio: string;
    periodoFin: string;
    lineas: Array<{
      descripcion: string;
      cantidad: number;
      precioUnitario: string;
      total: string;
    }>;
    subtotal: string;
    totalIva: string;
    total: string;
    urlDescarga?: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
        .tabla-factura { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; }
        .tabla-factura th { background: #E5E7EB; padding: 12px; text-align: left; font-weight: 600; }
        .tabla-factura td { padding: 12px; border-bottom: 1px solid #E5E7EB; }
        .tabla-factura tr:last-child td { border-bottom: none; }
        .totales { background: white; padding: 15px; border-radius: 8px; text-align: right; }
        .totales .total-final { font-size: 20px; font-weight: bold; color: #10B981; }
        .cta-button { display: inline-block; padding: 14px 30px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #D1FAE5; color: #065F46; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Factura de Suscripcion</h1>
          <p style="margin: 0; opacity: 0.9;">${params.numeroFactura}</p>
        </div>
        <div class="content">
          <p>Estimado/a <strong>${params.clienteNombre}</strong>,</p>
          <p>Gracias por su suscripcion a Tralok ERP. Adjuntamos la factura correspondiente:</p>

          <div class="info-box">
            <p><strong>Factura:</strong> ${params.numeroFactura}</p>
            <p><strong>Fecha:</strong> ${params.fechaEmision}</p>
            <p><strong>Plan:</strong> <span class="badge">${params.planNombre} (${params.tipoSuscripcion})</span></p>
            <p><strong>Periodo:</strong> ${params.periodoInicio} - ${params.periodoFin}</p>
          </div>

          <table class="tabla-factura">
            <thead>
              <tr>
                <th>Concepto</th>
                <th style="text-align: center;">Cant.</th>
                <th style="text-align: right;">Precio</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${params.lineas.map(l => `
              <tr>
                <td>${l.descripcion}</td>
                <td style="text-align: center;">${l.cantidad}</td>
                <td style="text-align: right;">${l.precioUnitario}</td>
                <td style="text-align: right;">${l.total}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totales">
            <p>Base imponible: <strong>${params.subtotal}</strong></p>
            <p>IVA (21%): <strong>${params.totalIva}</strong></p>
            <p class="total-final">Total: ${params.total}</p>
          </div>

          ${params.urlDescarga ? `
          <center>
            <a href="${params.urlDescarga}" class="cta-button">Descargar Factura PDF</a>
          </center>
          ` : ''}

          <p>Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.</p>

          <p>Saludos cordiales,<br><strong>Equipo Tralok</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Tralok SL. Todos los derechos reservados.</p>
          <p style="font-size: 11px; color: #999;">CIF: B12345678 | soporte@tralok.com</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Confirmación de pago exitoso
  pagoExitoso: (params: {
    clienteNombre: string;
    planNombre: string;
    total: string;
    proximaRenovacion: string;
    numeroFactura: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-icon { font-size: 48px; margin-bottom: 10px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">&#10004;</div>
          <h1>Pago Confirmado</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${params.clienteNombre}</strong>,</p>
          <p>Tu pago ha sido procesado correctamente. Gracias por confiar en Tralok ERP.</p>

          <div class="info-box">
            <p><strong>Plan:</strong> ${params.planNombre}</p>
            <p><strong>Importe:</strong> ${params.total}</p>
            <p><strong>Factura:</strong> ${params.numeroFactura}</p>
            <p><strong>Proxima renovacion:</strong> ${params.proximaRenovacion}</p>
          </div>

          <p>Tu factura ha sido enviada en un email separado.</p>
          <p>Si tienes alguna pregunta, contactanos en soporte@tralok.com</p>

          <p>Saludos,<br><strong>Equipo Tralok</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Tralok SL. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Solicitud de firma digital
  solicitudFirma: (params: {
    nombreDestinatario: string;
    codigoDocumento: string;
    tipoDocumento: string;
    empresaNombre: string;
    urlFirma: string;
    mensajePersonalizado?: string;
    fechaExpiracion: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7C3AED; }
        .cta-button { display: inline-block; padding: 16px 40px; background: #7C3AED; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .mensaje-personalizado { background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #F59E0B; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #EDE9FE; color: #5B21B6; }
        .expiracion { background: #FEF2F2; padding: 10px 15px; border-radius: 6px; margin-top: 15px; font-size: 13px; color: #991B1B; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Solicitud de Firma</h1>
          <p style="margin: 0; opacity: 0.9;">Documento pendiente de firma</p>
        </div>
        <div class="content">
          <p>Estimado/a <strong>${params.nombreDestinatario}</strong>,</p>
          <p><strong>${params.empresaNombre}</strong> le solicita firmar el siguiente documento:</p>

          ${params.mensajePersonalizado ? `
          <div class="mensaje-personalizado">
            <p style="margin: 0;">${params.mensajePersonalizado}</p>
          </div>
          ` : ''}

          <div class="info-box">
            <p><strong>Documento:</strong> ${params.codigoDocumento}</p>
            <p><strong>Tipo:</strong> <span class="badge">${params.tipoDocumento}</span></p>
          </div>

          <p>Puede firmar el documento de forma digital haciendo clic en el siguiente boton:</p>

          <center>
            <a href="${params.urlFirma}" class="cta-button">Firmar Documento</a>
          </center>

          <p><small>O copie y pegue este enlace en su navegador:<br>${params.urlFirma}</small></p>

          <div class="expiracion">
            Este enlace de firma expira el <strong>${params.fechaExpiracion}</strong>. Por favor, firme el documento antes de esa fecha.
          </div>

          <p style="margin-top: 20px;">Saludos cordiales,<br><strong>${params.empresaNombre}</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${params.empresaNombre}. Todos los derechos reservados.</p>
          <p style="font-size: 11px; color: #999;">Este es un mensaje automatico. Si no esperaba esta solicitud, puede ignorar este email.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  recordatorioAgente: (params: {
    agenteNombre: string;
    tipoRecordatorio: 'expiracion' | 'sin_respuesta';
    presupuestos: Array<{
      codigo: string;
      clienteNombre: string;
      total: string;
      diasRestantes?: number;
      diasSinRespuesta?: number;
    }>;
    empresaNombre: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .presupuesto-item { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #EF4444; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-warning { background: #FEF3C7; color: #92400E; }
        .badge-danger { background: #FEE2E2; color: #991B1B; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Alerta de Presupuestos</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${params.agenteNombre}</strong>,</p>
          <p>Tienes presupuestos que requieren tu atención:</p>

          ${params.presupuestos.map(p => `
          <div class="presupuesto-item">
            <p><strong>${p.codigo}</strong> - ${p.clienteNombre}</p>
            <p>Importe: <strong>${p.total}</strong></p>
            ${p.diasRestantes !== undefined ? `
              <p><span class="badge ${p.diasRestantes <= 3 ? 'badge-danger' : 'badge-warning'}">
                ${p.diasRestantes <= 0 ? 'EXPIRADO' : `Expira en ${p.diasRestantes} días`}
              </span></p>
            ` : ''}
            ${p.diasSinRespuesta !== undefined ? `
              <p><span class="badge badge-warning">
                ${p.diasSinRespuesta} días sin respuesta
              </span></p>
            ` : ''}
          </div>
          `).join('')}

          <p>Te recomendamos hacer seguimiento a estos presupuestos lo antes posible.</p>

          <p>Saludos,<br>Sistema de ${params.empresaNombre}</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${params.empresaNombre}. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};