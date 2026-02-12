import crypto from 'crypto';
import Empresa from '../empresa/Empresa';
import { IDatabaseConfig } from '../empresa/Empresa';
import { getFirmaModel } from '../../utils/dynamic-models.helper';
import { getSolicitudFirmaModel } from '../../utils/dynamic-models.helper';
import { IFirma } from './Firma';
import { ISolicitudFirma } from './SolicitudFirma';
import { sendEmail, emailTemplates } from '../../utils/email';
import { env } from '../../config/env';

class FirmasService {
  private async getDbConfig(empresaId: string): Promise<IDatabaseConfig> {
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) throw new Error('Empresa no encontrada');
    if (!empresa.databaseConfig) throw new Error('Configuracion de BD no encontrada');
    return empresa.databaseConfig;
  }

  private getTipoDocumentoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      albaran: 'Albarán',
      factura: 'Factura',
      parteTrabajo: 'Parte de Trabajo',
      presupuesto: 'Presupuesto',
      pedido: 'Pedido',
    };
    return labels[tipo] || tipo;
  }

  /**
   * Envia emails de firma a los firmantes que tengan email
   */
  private async enviarEmailsFirma(
    empresaId: string,
    solicitud: ISolicitudFirma,
    mensajePersonalizado?: string
  ): Promise<void> {
    const empresa = await Empresa.findById(empresaId).select('nombre').lean();
    const empresaNombre = empresa?.nombre || 'Empresa';
    const tipoDocLabel = this.getTipoDocumentoLabel(solicitud.tipoDocumento);

    for (const firmante of solicitud.firmantes) {
      if (!firmante.email || firmante.estado !== 'pendiente') continue;

      const urlFirma = `${env.FRONTEND_URL}/firmar/${firmante.token}`;
      const fechaExp = new Date(solicitud.fechaExpiracion).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric',
      });

      const html = emailTemplates.solicitudFirma({
        nombreDestinatario: firmante.nombre,
        codigoDocumento: solicitud.codigoDocumento,
        tipoDocumento: tipoDocLabel,
        empresaNombre,
        urlFirma,
        mensajePersonalizado,
        fechaExpiracion: fechaExp,
      });

      try {
        await sendEmail(
          firmante.email,
          `Solicitud de firma - ${solicitud.codigoDocumento} | ${empresaNombre}`,
          html
        );
        console.log(`✅ Email de firma enviado a ${firmante.email} para ${solicitud.codigoDocumento}`);
      } catch (error) {
        console.error(`❌ Error enviando email de firma a ${firmante.email}:`, error);
      }
    }
  }

  /**
   * Crear solicitud de firma para un documento
   */
  async crearSolicitudFirma(
    empresaId: string,
    datos: {
      documentoId: string;
      tipoDocumento: string;
      codigoDocumento: string;
      firmantes: Array<{
        nombre: string;
        email?: string;
        telefono?: string;
        tipoFirmaPermitido?: string[];
      }>;
      fechaExpiracion?: Date;
      mensajePersonalizado?: string;
      solicitadoPor: string;
    }
  ): Promise<ISolicitudFirma> {
    const dbConfig = await this.getDbConfig(empresaId);
    const SolicitudFirma = await getSolicitudFirmaModel(empresaId, dbConfig);

    const fechaExp = datos.fechaExpiracion || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    const firmantes = datos.firmantes.map(f => ({
      nombre: f.nombre,
      email: f.email,
      telefono: f.telefono,
      token: crypto.randomBytes(32).toString('hex'),
      tokenExpira: fechaExp,
      estado: 'pendiente' as const,
      tipoFirmaPermitido: f.tipoFirmaPermitido || ['manuscrita', 'certificado_digital'],
    }));

    const solicitud = await SolicitudFirma.create({
      documentoId: datos.documentoId,
      tipoDocumento: datos.tipoDocumento,
      codigoDocumento: datos.codigoDocumento,
      firmantes,
      estado: 'pendiente',
      notificaciones: [],
      fechaExpiracion: fechaExp,
      mensajePersonalizado: datos.mensajePersonalizado,
      solicitadoPor: datos.solicitadoPor,
    });

    // Enviar emails a firmantes que tengan email
    this.enviarEmailsFirma(empresaId, solicitud, datos.mensajePersonalizado).catch(err => {
      console.error('Error enviando emails de firma:', err);
    });

    return solicitud;
  }

  /**
   * Buscar solicitud por token de firmante (busca en TODAS las empresas - ruta publica)
   */
  async getSolicitudPorToken(token: string): Promise<{
    solicitud: ISolicitudFirma;
    firmante: any;
    firmateIndex: number;
    empresaId: string;
  } | null> {
    // Buscar en todas las empresas que tengan BD configurada
    const empresas = await Empresa.find({ databaseConfig: { $exists: true } }).select('_id databaseConfig').lean();

    for (const empresa of empresas) {
      if (!empresa.databaseConfig) continue;
      try {
        const SolicitudFirma = await getSolicitudFirmaModel(empresa._id.toString(), empresa.databaseConfig);
        const solicitud = await SolicitudFirma.findOne({
          'firmantes.token': token,
          estado: { $in: ['pendiente', 'parcial'] },
        });

        if (solicitud) {
          const idx = solicitud.firmantes.findIndex(f => f.token === token);
          if (idx === -1) continue;

          const firmante = solicitud.firmantes[idx];

          // Verificar que no haya expirado
          if (new Date() > firmante.tokenExpira) {
            firmante.estado = 'expirado';
            await solicitud.save();
            return null;
          }

          if (firmante.estado !== 'pendiente') return null;

          return {
            solicitud,
            firmante,
            firmateIndex: idx,
            empresaId: empresa._id.toString(),
          };
        }
      } catch (e) {
        // Empresa sin BD o error - continuar
        continue;
      }
    }

    return null;
  }

  /**
   * Firmar documento con firma manuscrita (imagen base64)
   */
  async firmarManuscrita(
    empresaId: string,
    solicitudId: string,
    firmanteIndex: number,
    datos: {
      imagenFirma: string;
      nombre: string;
      nif?: string;
      ip: string;
      userAgent: string;
    }
  ): Promise<IFirma> {
    const dbConfig = await this.getDbConfig(empresaId);
    const SolicitudFirma = await getSolicitudFirmaModel(empresaId, dbConfig);
    const Firma = await getFirmaModel(empresaId, dbConfig);

    const solicitud = await SolicitudFirma.findById(solicitudId);
    if (!solicitud) throw new Error('Solicitud no encontrada');

    const firmante = solicitud.firmantes[firmanteIndex];
    if (!firmante || firmante.estado !== 'pendiente') {
      throw new Error('Firmante no valido o ya ha firmado');
    }

    // Calcular hashes
    const hashDocumento = crypto.createHash('sha256')
      .update(`${solicitud.documentoId}-${solicitud.tipoDocumento}-${solicitud.codigoDocumento}`)
      .digest('hex');
    const hashFirma = crypto.createHash('sha256')
      .update(datos.imagenFirma)
      .digest('hex');

    // Crear firma
    const firma = await Firma.create({
      documentoId: solicitud.documentoId,
      tipoDocumento: solicitud.tipoDocumento,
      tipo: 'remota_manuscrita',
      imagenFirma: datos.imagenFirma,
      hashDocumento,
      hashFirma,
      timestamp: new Date(),
      ip: datos.ip,
      userAgent: datos.userAgent,
      firmante: {
        nombre: datos.nombre,
        nif: datos.nif,
        tipo: 'cliente',
      },
      solicitudFirmaId: solicitud._id,
    });

    // Actualizar estado del firmante
    solicitud.firmantes[firmanteIndex].estado = 'firmado';
    solicitud.firmantes[firmanteIndex].firmadoEn = new Date();

    // Actualizar estado de la solicitud
    const todosFirmados = solicitud.firmantes.every(f => f.estado === 'firmado');
    const algunoFirmado = solicitud.firmantes.some(f => f.estado === 'firmado');
    solicitud.estado = todosFirmados ? 'completa' : algunoFirmado ? 'parcial' : 'pendiente';

    await solicitud.save();

    return firma;
  }

  /**
   * Firmar documento con certificado digital (.p12/.pfx)
   */
  async firmarConCertificado(
    empresaId: string,
    solicitudId: string,
    firmanteIndex: number,
    datos: {
      certificadoBase64: string;
      password: string;
      ip: string;
      userAgent: string;
    }
  ): Promise<IFirma> {
    const dbConfig = await this.getDbConfig(empresaId);
    const SolicitudFirma = await getSolicitudFirmaModel(empresaId, dbConfig);
    const Firma = await getFirmaModel(empresaId, dbConfig);

    const solicitud = await SolicitudFirma.findById(solicitudId);
    if (!solicitud) throw new Error('Solicitud no encontrada');

    const firmante = solicitud.firmantes[firmanteIndex];
    if (!firmante || firmante.estado !== 'pendiente') {
      throw new Error('Firmante no valido o ya ha firmado');
    }

    // Parsear certificado .p12 con node-forge
    let certInfo: any;
    try {
      const forge = await import('node-forge');
      const p12Der = forge.util.decode64(datos.certificadoBase64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, datos.password);

      // Extraer certificado
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = (certBags[forge.pki.oids.certBag] || [])[0];
      if (!certBag || !certBag.cert) throw new Error('No se encontro certificado en el archivo');

      const cert = certBag.cert;
      const subject = cert.subject.getField('CN')?.value || '';
      const nif = cert.subject.getField('serialNumber')?.value || '';
      const issuer = cert.issuer.getField('CN')?.value || '';

      certInfo = {
        titular: subject,
        nif: nif,
        emisor: issuer,
        serial: cert.serialNumber,
        validoDesde: cert.validity.notBefore,
        validoHasta: cert.validity.notAfter,
      };

      // Verificar vigencia
      const ahora = new Date();
      if (ahora < cert.validity.notBefore || ahora > cert.validity.notAfter) {
        throw new Error('El certificado ha expirado o aun no es valido');
      }
    } catch (error: any) {
      if (error.message.includes('expirado') || error.message.includes('valido')) throw error;
      throw new Error('Error al procesar el certificado. Verifica la contraseña y el formato del archivo.');
    }

    // Calcular hashes
    const hashDocumento = crypto.createHash('sha256')
      .update(`${solicitud.documentoId}-${solicitud.tipoDocumento}-${solicitud.codigoDocumento}`)
      .digest('hex');
    const hashFirma = crypto.createHash('sha256')
      .update(datos.certificadoBase64 + hashDocumento)
      .digest('hex');

    // Crear firma
    const firma = await Firma.create({
      documentoId: solicitud.documentoId,
      tipoDocumento: solicitud.tipoDocumento,
      tipo: 'certificado_digital',
      certificadoInfo: certInfo,
      hashDocumento,
      hashFirma,
      timestamp: new Date(),
      ip: datos.ip,
      userAgent: datos.userAgent,
      firmante: {
        nombre: certInfo.titular,
        nif: certInfo.nif,
        tipo: 'cliente',
      },
      solicitudFirmaId: solicitud._id,
    });

    // Actualizar estado del firmante
    solicitud.firmantes[firmanteIndex].estado = 'firmado';
    solicitud.firmantes[firmanteIndex].firmadoEn = new Date();

    // Actualizar estado de la solicitud
    const todosFirmados = solicitud.firmantes.every(f => f.estado === 'firmado');
    const algunoFirmado = solicitud.firmantes.some(f => f.estado === 'firmado');
    solicitud.estado = todosFirmados ? 'completa' : algunoFirmado ? 'parcial' : 'pendiente';

    await solicitud.save();

    return firma;
  }

  /**
   * Obtener firmas de un documento
   */
  async getFirmasDocumento(
    empresaId: string,
    tipoDocumento: string,
    documentoId: string
  ): Promise<IFirma[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const Firma = await getFirmaModel(empresaId, dbConfig);
    return Firma.find({ documentoId, tipoDocumento }).sort({ timestamp: -1 });
  }

  /**
   * Obtener solicitudes de firma
   */
  async getSolicitudes(
    empresaId: string,
    filtros?: { estado?: string; tipoDocumento?: string }
  ): Promise<ISolicitudFirma[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const SolicitudFirma = await getSolicitudFirmaModel(empresaId, dbConfig);

    const query: any = {};
    if (filtros?.estado) query.estado = filtros.estado;
    if (filtros?.tipoDocumento) query.tipoDocumento = filtros.tipoDocumento;

    return SolicitudFirma.find(query).sort({ createdAt: -1 });
  }

  /**
   * Reenviar notificacion a un firmante
   */
  async reenviarNotificacion(
    empresaId: string,
    solicitudId: string,
    firmanteIndex: number
  ): Promise<void> {
    const dbConfig = await this.getDbConfig(empresaId);
    const SolicitudFirma = await getSolicitudFirmaModel(empresaId, dbConfig);

    const solicitud = await SolicitudFirma.findById(solicitudId);
    if (!solicitud) throw new Error('Solicitud no encontrada');

    const firmante = solicitud.firmantes[firmanteIndex];
    if (!firmante) throw new Error('Firmante no encontrado');
    if (firmante.estado !== 'pendiente') throw new Error('El firmante ya ha firmado');

    // Renovar token si esta proximo a expirar
    if (new Date(firmante.tokenExpira).getTime() - Date.now() < 24 * 60 * 60 * 1000) {
      firmante.tokenExpira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    // Registrar notificacion
    solicitud.notificaciones.push({
      tipo: 'email',
      destinatario: firmante.email || '',
      fechaEnvio: new Date(),
      estado: 'enviado',
    });

    await solicitud.save();

    // Enviar email real con el link de firma
    if (firmante.email) {
      const empresa = await Empresa.findById(empresaId).select('nombre').lean();
      const empresaNombre = empresa?.nombre || 'Empresa';
      const tipoDocLabel = this.getTipoDocumentoLabel(solicitud.tipoDocumento);
      const urlFirma = `${env.FRONTEND_URL}/firmar/${firmante.token}`;
      const fechaExp = new Date(solicitud.fechaExpiracion).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric',
      });

      const html = emailTemplates.solicitudFirma({
        nombreDestinatario: firmante.nombre,
        codigoDocumento: solicitud.codigoDocumento,
        tipoDocumento: tipoDocLabel,
        empresaNombre,
        urlFirma,
        mensajePersonalizado: solicitud.mensajePersonalizado,
        fechaExpiracion: fechaExp,
      });

      await sendEmail(
        firmante.email,
        `Recordatorio de firma - ${solicitud.codigoDocumento} | ${empresaNombre}`,
        html
      );
    }
  }

  /**
   * Firmar documento internamente (manuscrita interna)
   */
  async firmarInterna(
    empresaId: string,
    datos: {
      documentoId: string;
      tipoDocumento: string;
      imagenFirma: string;
      firmante: { nombre: string; nif?: string };
      ip: string;
      userAgent: string;
    }
  ): Promise<IFirma> {
    const dbConfig = await this.getDbConfig(empresaId);
    const Firma = await getFirmaModel(empresaId, dbConfig);

    const hashDocumento = crypto.createHash('sha256')
      .update(`${datos.documentoId}-${datos.tipoDocumento}`)
      .digest('hex');
    const hashFirma = crypto.createHash('sha256')
      .update(datos.imagenFirma)
      .digest('hex');

    return Firma.create({
      documentoId: datos.documentoId,
      tipoDocumento: datos.tipoDocumento,
      tipo: 'manuscrita',
      imagenFirma: datos.imagenFirma,
      hashDocumento,
      hashFirma,
      timestamp: new Date(),
      ip: datos.ip,
      userAgent: datos.userAgent,
      firmante: {
        nombre: datos.firmante.nombre,
        nif: datos.firmante.nif,
        tipo: 'interno',
      },
    });
  }
}

export const firmasService = new FirmasService();
