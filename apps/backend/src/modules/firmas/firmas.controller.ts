import { Request, Response } from 'express';
import { firmasService } from './firmas.service';

/**
 * Obtener datos de solicitud por token (PUBLICO)
 * GET /api/firmas/firmar/:token
 */
export async function getSolicitudPorToken(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const resultado = await firmasService.getSolicitudPorToken(token);

    if (!resultado) {
      return res.status(404).json({ ok: false, error: 'Enlace de firma no valido o expirado' });
    }

    const { solicitud, firmante, firmateIndex } = resultado;

    res.json({
      ok: true,
      solicitud: {
        id: solicitud._id,
        tipoDocumento: solicitud.tipoDocumento,
        codigoDocumento: solicitud.codigoDocumento,
        mensajePersonalizado: solicitud.mensajePersonalizado,
        fechaExpiracion: solicitud.fechaExpiracion,
      },
      firmante: {
        nombre: firmante.nombre,
        email: firmante.email,
        index: firmateIndex,
        tipoFirmaPermitido: firmante.tipoFirmaPermitido,
      },
    });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Firmar con firma manuscrita (PUBLICO)
 * POST /api/firmas/firmar/:token/manuscrita
 */
export async function firmarManuscrita(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { imagenFirma, nombre, nif } = req.body;

    if (!imagenFirma || !nombre) {
      return res.status(400).json({ ok: false, error: 'imagenFirma y nombre son requeridos' });
    }

    const resultado = await firmasService.getSolicitudPorToken(token);
    if (!resultado) {
      return res.status(404).json({ ok: false, error: 'Enlace de firma no valido o expirado' });
    }

    const firma = await firmasService.firmarManuscrita(
      resultado.empresaId,
      resultado.solicitud._id.toString(),
      resultado.firmateIndex,
      {
        imagenFirma,
        nombre,
        nif,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    );

    res.json({ ok: true, firmaId: firma._id });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Firmar con certificado digital (PUBLICO)
 * POST /api/firmas/firmar/:token/certificado
 */
export async function firmarConCertificado(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { certificadoBase64, password } = req.body;

    if (!certificadoBase64 || !password) {
      return res.status(400).json({ ok: false, error: 'certificadoBase64 y password son requeridos' });
    }

    const resultado = await firmasService.getSolicitudPorToken(token);
    if (!resultado) {
      return res.status(404).json({ ok: false, error: 'Enlace de firma no valido o expirado' });
    }

    const firma = await firmasService.firmarConCertificado(
      resultado.empresaId,
      resultado.solicitud._id.toString(),
      resultado.firmateIndex,
      {
        certificadoBase64,
        password,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    );

    res.json({ ok: true, firmaId: firma._id });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Obtener solicitudes de firma (PROTEGIDO)
 * GET /api/firmas/solicitudes
 */
export async function getSolicitudes(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;
    const { estado, tipoDocumento } = req.query;

    const solicitudes = await firmasService.getSolicitudes(empresaId, {
      estado: estado as string,
      tipoDocumento: tipoDocumento as string,
    });

    res.json({ ok: true, solicitudes });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Crear solicitud de firma (PROTEGIDO)
 * POST /api/firmas/solicitudes
 */
export async function crearSolicitudFirma(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;
    const usuarioId = (req as any).userId || (req as any).usuarioId;
    const { documentoId, tipoDocumento, codigoDocumento, firmantes, fechaExpiracion, mensajePersonalizado } = req.body;

    if (!documentoId || !tipoDocumento || !codigoDocumento || !firmantes?.length) {
      return res.status(400).json({
        ok: false,
        error: 'documentoId, tipoDocumento, codigoDocumento y firmantes son requeridos',
      });
    }

    const solicitud = await firmasService.crearSolicitudFirma(empresaId, {
      documentoId,
      tipoDocumento,
      codigoDocumento,
      firmantes,
      fechaExpiracion: fechaExpiracion ? new Date(fechaExpiracion) : undefined,
      mensajePersonalizado,
      solicitadoPor: usuarioId,
    });

    // Generar links de firma para cada firmante
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const links = solicitud.firmantes.map((f, i) => ({
      nombre: f.nombre,
      email: f.email,
      link: `${frontendUrl}/firmar/${f.token}`,
      estado: f.estado,
    }));

    res.json({ ok: true, solicitud, links });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Reenviar notificacion a firmante (PROTEGIDO)
 * POST /api/firmas/solicitudes/:id/reenviar/:idx
 */
export async function reenviarNotificacion(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;
    const { id, idx } = req.params;

    await firmasService.reenviarNotificacion(empresaId, id, parseInt(idx));

    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Obtener firmas de un documento (PROTEGIDO)
 * GET /api/firmas/documento/:tipo/:id
 */
export async function getFirmasDocumento(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;
    const { tipo, id } = req.params;

    const firmas = await firmasService.getFirmasDocumento(empresaId, tipo, id);

    res.json({ ok: true, firmas });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}

/**
 * Firmar documento internamente (PROTEGIDO)
 * POST /api/firmas/interna
 */
export async function firmarInterna(req: Request, res: Response) {
  try {
    const empresaId = (req as any).empresaId;
    const { documentoId, tipoDocumento, imagenFirma, firmante } = req.body;

    if (!documentoId || !tipoDocumento || !imagenFirma || !firmante?.nombre) {
      return res.status(400).json({
        ok: false,
        error: 'documentoId, tipoDocumento, imagenFirma y firmante.nombre son requeridos',
      });
    }

    const firma = await firmasService.firmarInterna(empresaId, {
      documentoId,
      tipoDocumento,
      imagenFirma,
      firmante,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({ ok: true, firma });
  } catch (error: any) {
    res.status(400).json({ ok: false, error: error.message });
  }
}
