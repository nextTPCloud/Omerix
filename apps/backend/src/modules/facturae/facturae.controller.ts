import { Request, Response, NextFunction } from 'express';
import { facturaEService } from './facturae.service';
import { xadesSignerService } from './xades-signer.service';
import { faceService } from './face.service';

export class FacturaEController {
  /**
   * Genera un documento FacturaE a partir de una factura
   */
  async generarFacturaE(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const { facturaId } = req.params;
      const { firmar, certificadoId } = req.body;

      const resultado = await facturaEService.generarFacturaE(
        { facturaId, firmar, certificadoId },
        empresaId!,
        dbConfig!
      );

      if (!resultado.exito) {
        return res.status(400).json({
          success: false,
          errores: resultado.errores,
        });
      }

      res.json({
        success: true,
        data: {
          xml: resultado.xml,
          nombreArchivo: resultado.nombreArchivo,
          firmado: resultado.firmado,
          advertencias: resultado.advertencias,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Descarga el XML de FacturaE
   */
  async descargarFacturaE(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const { facturaId } = req.params;

      const resultado = await facturaEService.generarFacturaE(
        { facturaId },
        empresaId!,
        dbConfig!
      );

      if (!resultado.exito || !resultado.xml) {
        return res.status(400).json({
          success: false,
          errores: resultado.errores,
        });
      }

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="${resultado.nombreArchivo}"`);
      res.send(resultado.xml);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Genera un lote de facturas FacturaE
   */
  async generarLote(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const { facturaIds } = req.body;

      if (!facturaIds || !Array.isArray(facturaIds) || facturaIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un array de IDs de facturas',
        });
      }

      const resultado = await facturaEService.generarLoteFacturaE(
        facturaIds,
        empresaId!,
        dbConfig!
      );

      if (!resultado.exito) {
        return res.status(400).json({
          success: false,
          errores: resultado.errores,
        });
      }

      res.json({
        success: true,
        data: {
          xml: resultado.xml,
          nombreArchivo: resultado.nombreArchivo,
          advertencias: resultado.advertencias,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Valida un documento FacturaE
   */
  async validarFacturaE(req: Request, res: Response, next: NextFunction) {
    try {
      const { xml } = req.body;

      if (!xml) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar el XML a validar',
        });
      }

      const resultado = await facturaEService.validarFacturaE({ xml });

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Firma un documento FacturaE con XAdES-EPES
   */
  async firmarFacturaE(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const { facturaId } = req.params;
      const { certificadoId } = req.body;

      if (!certificadoId) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar el ID del certificado',
        });
      }

      // Primero generar el XML
      const resultadoGeneracion = await facturaEService.generarFacturaE(
        { facturaId },
        empresaId!,
        dbConfig!
      );

      if (!resultadoGeneracion.exito || !resultadoGeneracion.xml) {
        return res.status(400).json({
          success: false,
          errores: resultadoGeneracion.errores,
        });
      }

      // Firmar el XML
      const resultadoFirma = await xadesSignerService.firmar(
        resultadoGeneracion.xml,
        certificadoId,
        empresaId!,
        dbConfig!
      );

      if (!resultadoFirma.exito) {
        return res.status(400).json({
          success: false,
          errores: resultadoFirma.errores,
        });
      }

      res.json({
        success: true,
        data: {
          xmlFirmado: resultadoFirma.xmlFirmado,
          datosFirma: resultadoFirma.datosFirma,
          advertencias: resultadoFirma.advertencias,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envía una factura a FACE
   */
  async enviarAFACE(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const { facturaId } = req.params;
      const { certificadoId, entorno = 'pruebas' } = req.body;

      if (!certificadoId) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar el ID del certificado',
        });
      }

      const resultado = await faceService.enviarFactura(
        facturaId,
        { certificadoId, entorno },
        empresaId!,
        usuario!._id.toString(),
        dbConfig!
      );

      if (!resultado.exito) {
        return res.status(400).json({
          success: false,
          errores: resultado.errores,
        });
      }

      res.json({
        success: true,
        data: {
          numeroRegistro: resultado.numeroRegistro,
          codigoResultado: resultado.codigoResultado,
          descripcionResultado: resultado.descripcionResultado,
          fechaRecepcion: resultado.fechaRecepcion,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Consulta el estado de una factura en FACE
   */
  async consultarEstadoFACE(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const { facturaId } = req.params;
      const { certificadoId, entorno = 'pruebas' } = req.query;

      const resultado = await faceService.consultarEstado(
        facturaId,
        { certificadoId: certificadoId as string, entorno: entorno as 'produccion' | 'pruebas' },
        empresaId!,
        dbConfig!
      );

      if (!resultado.exito) {
        return res.status(400).json({
          success: false,
          errores: resultado.errores,
        });
      }

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Anula una factura en FACE
   */
  async anularEnFACE(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const { facturaId } = req.params;
      const { motivo, certificadoId, entorno = 'pruebas' } = req.body;

      if (!motivo) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar el motivo de anulación',
        });
      }

      const resultado = await faceService.anularFactura(
        facturaId,
        motivo,
        { certificadoId, entorno },
        empresaId!,
        usuario!._id.toString(),
        dbConfig!
      );

      if (!resultado.exito) {
        return res.status(400).json({
          success: false,
          errores: resultado.errores,
        });
      }

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifica los requisitos para enviar a FACE
   */
  async verificarRequisitos(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const { facturaId } = req.params;

      const resultado = await faceService.verificarRequisitosEnvio(
        facturaId,
        empresaId!,
        dbConfig!
      );

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtiene certificados disponibles para firmar
   */
  async getCertificadosDisponibles(req: Request, res: Response, next: NextFunction) {
    try {
      const { dbConfig } = req;

      const certificados = await xadesSignerService.listarCertificadosDisponibles(dbConfig!);

      res.json({
        success: true,
        data: certificados,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtiene el historial de estados FACE de una factura
   */
  async getHistorialFACE(req: Request, res: Response, next: NextFunction) {
    try {
      const { dbConfig } = req;
      const { facturaId } = req.params;

      const historial = await faceService.obtenerHistorialEstados(facturaId, dbConfig!);

      res.json({
        success: true,
        data: historial,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const facturaEController = new FacturaEController();
