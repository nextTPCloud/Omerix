// backend/src/modules/verifactu/verifactu.controller.ts

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import verifactuService, { VeriFactuConfig } from './verifactu.service';
import { getFacturaModel } from '@/utils/dynamic-models.helper';
import certificadosService from '@/modules/certificados/certificados.service';
import { UsosCertificado } from '@/modules/certificados/certificados.schema';
import Empresa from '@/models/Empresa';

// ============================================
// CONTROLADORES VERIFACTU
// ============================================

export const verifactuController = {
  /**
   * Enviar factura a la AEAT
   */
  async enviarFactura(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { facturaId } = req.params;
      const { certificadoId, entorno } = req.body;

      // Obtener factura
      const FacturaModel = await getFacturaModel(empresaId, req.empresaDbConfig);
      const factura = await FacturaModel.findById(facturaId);

      if (!factura) {
        return res.status(404).json({
          success: false,
          error: 'Factura no encontrada',
        });
      }

      // Obtener datos de la empresa
      const empresa = await Empresa.findById(empresaId);
      if (!empresa) {
        return res.status(404).json({
          success: false,
          error: 'Empresa no encontrada',
        });
      }

      // Validar certificado si se proporciona
      let certId = certificadoId;
      if (certId) {
        const validacion = await certificadosService.validarParaUso(
          certId,
          empresaId,
          UsosCertificado.VERIFACTU
        );
        if (!validacion.valido) {
          return res.status(400).json({
            success: false,
            error: validacion.mensaje,
          });
        }
      } else {
        // Buscar certificado predeterminado
        const certPredeterminado = await certificadosService.obtenerPredeterminado(empresaId);
        if (certPredeterminado) {
          certId = String(certPredeterminado._id);
        }
      }

      // Configurar entorno
      if (entorno) {
        verifactuService.setEntorno(entorno);
      }

      // Configuración VeriFactu
      const config: VeriFactuConfig = {
        empresaNif: empresa.nif,
        empresaNombre: empresa.nombre,
        certificadoId: certId,
        entorno: entorno || 'test',
      };

      // Enviar factura
      const resultado = await verifactuService.enviarFactura(factura, config, empresaId);

      // Si fue exitoso, actualizar factura
      if (resultado.exito) {
        factura.verifactu = {
          ...factura.verifactu,
          estadoEnvio: 'enviado',
          fechaEnvio: resultado.fechaEnvio,
          csv: resultado.csv,
          respuestaAEAT: {
            codigo: resultado.codigo,
            mensaje: resultado.mensaje,
            xml: resultado.xmlRespuesta,
          },
        };
        await factura.save();
      }

      return res.json({
        success: resultado.exito,
        data: {
          codigo: resultado.codigo,
          mensaje: resultado.mensaje,
          csv: resultado.csv,
          fechaEnvio: resultado.fechaEnvio,
          errores: resultado.errores,
        },
        message: resultado.exito ? 'Factura enviada correctamente a AEAT' : 'Error al enviar factura',
      });
    } catch (error: any) {
      console.error('Error al enviar factura VeriFactu:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar factura a AEAT',
      });
    }
  },

  /**
   * Consultar estado de factura en AEAT
   */
  async consultarFactura(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { facturaId } = req.params;
      const { entorno } = req.query;

      // Obtener factura
      const FacturaModel = await getFacturaModel(empresaId, req.empresaDbConfig);
      const factura = await FacturaModel.findById(facturaId);

      if (!factura) {
        return res.status(404).json({
          success: false,
          error: 'Factura no encontrada',
        });
      }

      // Obtener empresa
      const empresa = await Empresa.findById(empresaId);
      if (!empresa) {
        return res.status(404).json({
          success: false,
          error: 'Empresa no encontrada',
        });
      }

      // Configurar entorno
      if (entorno) {
        verifactuService.setEntorno(entorno as 'test' | 'production');
      }

      const config: VeriFactuConfig = {
        empresaNif: empresa.nif,
        empresaNombre: empresa.nombre,
        entorno: entorno as 'test' | 'production' || 'test',
      };

      const resultado = await verifactuService.consultarFactura(factura, config, empresaId);

      return res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error al consultar factura VeriFactu:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al consultar factura en AEAT',
      });
    }
  },

  /**
   * Anular/dar de baja factura en AEAT
   */
  async bajaFactura(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { facturaId } = req.params;
      const { motivo, certificadoId, entorno } = req.body;

      if (!motivo) {
        return res.status(400).json({
          success: false,
          error: 'El motivo de la baja es obligatorio',
        });
      }

      // Obtener factura
      const FacturaModel = await getFacturaModel(empresaId, req.empresaDbConfig);
      const factura = await FacturaModel.findById(facturaId);

      if (!factura) {
        return res.status(404).json({
          success: false,
          error: 'Factura no encontrada',
        });
      }

      // Obtener empresa
      const empresa = await Empresa.findById(empresaId);
      if (!empresa) {
        return res.status(404).json({
          success: false,
          error: 'Empresa no encontrada',
        });
      }

      // Buscar certificado
      let certId = certificadoId;
      if (!certId) {
        const certPredeterminado = await certificadosService.obtenerPredeterminado(empresaId);
        if (certPredeterminado) {
          certId = String(certPredeterminado._id);
        }
      }

      // Configurar entorno
      if (entorno) {
        verifactuService.setEntorno(entorno);
      }

      const config: VeriFactuConfig = {
        empresaNif: empresa.nif,
        empresaNombre: empresa.nombre,
        certificadoId: certId,
        entorno: entorno || 'test',
      };

      const resultado = await verifactuService.bajaFactura(factura, config, empresaId, motivo);

      // Si fue exitoso, actualizar factura
      if (resultado.exito) {
        factura.verifactu = {
          ...factura.verifactu,
          estadoEnvio: 'anulado',
          fechaBaja: resultado.fechaEnvio,
        };
        await factura.save();
      }

      return res.json({
        success: resultado.exito,
        data: resultado,
        message: resultado.exito ? 'Factura dada de baja correctamente' : 'Error al dar de baja la factura',
      });
    } catch (error: any) {
      console.error('Error al dar de baja factura VeriFactu:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al dar de baja factura en AEAT',
      });
    }
  },

  /**
   * Verificar conexión con AEAT
   */
  async verificarConexion(req: Request, res: Response) {
    try {
      const { entorno } = req.query;

      if (entorno) {
        verifactuService.setEntorno(entorno as 'test' | 'production');
      }

      const conectado = await verifactuService.verificarConexion();

      return res.json({
        success: true,
        data: {
          conectado,
          entorno: entorno || 'test',
          mensaje: conectado
            ? 'Conexión con AEAT establecida correctamente'
            : 'No se pudo establecer conexión con AEAT',
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al verificar conexión',
      });
    }
  },

  /**
   * Obtener URL de verificación para una factura
   */
  async obtenerURLVerificacion(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { facturaId } = req.params;

      // Obtener factura
      const FacturaModel = await getFacturaModel(empresaId, req.empresaDbConfig);
      const factura = await FacturaModel.findById(facturaId);

      if (!factura) {
        return res.status(404).json({
          success: false,
          error: 'Factura no encontrada',
        });
      }

      // Obtener empresa
      const empresa = await Empresa.findById(empresaId);
      if (!empresa) {
        return res.status(404).json({
          success: false,
          error: 'Empresa no encontrada',
        });
      }

      const url = verifactuService.generarURLVerificacion(factura, empresa.nif);

      return res.json({
        success: true,
        data: {
          url,
          facturaId: factura._id,
          codigo: factura.codigo,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al generar URL de verificación',
      });
    }
  },

  /**
   * Configurar entorno VeriFactu
   */
  async configurarEntorno(req: Request, res: Response) {
    try {
      const { entorno } = req.body;

      if (!entorno || !['test', 'production'].includes(entorno)) {
        return res.status(400).json({
          success: false,
          error: 'Entorno debe ser "test" o "production"',
        });
      }

      verifactuService.setEntorno(entorno);

      return res.json({
        success: true,
        data: { entorno },
        message: `Entorno configurado a ${entorno}`,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al configurar entorno',
      });
    }
  },
};

export default verifactuController;
