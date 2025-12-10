// backend/src/modules/certificados/certificados.controller.ts

import { Request, Response } from 'express';
import certificadosService, { SubirCertificadoDTO, ActualizarCertificadoDTO, RegistrarCertificadoWindowsDTO } from './certificados.service';
import { UsosCertificado } from './certificados.schema';

// ============================================
// CONTROLADORES
// ============================================

export const certificadosController = {
  /**
   * Subir un nuevo certificado electrónico
   */
  async subir(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      const { nombre, descripcion, tipo, usos, predeterminado, archivoBase64, nombreArchivo, password } = req.body;

      if (!archivoBase64 || !nombreArchivo || !password || !nombre) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos obligatorios: nombre, archivoBase64, nombreArchivo, password',
        });
      }

      // Validar extensión
      const ext = nombreArchivo.toLowerCase();
      if (!ext.endsWith('.p12') && !ext.endsWith('.pfx')) {
        return res.status(400).json({
          success: false,
          error: 'El archivo debe ser un certificado .p12 o .pfx',
        });
      }

      const dto: SubirCertificadoDTO = {
        nombre,
        descripcion,
        tipo,
        usos,
        predeterminado,
        archivoBase64,
        nombreArchivo,
        password,
      };

      const certificado = await certificadosService.subir(dto, empresaId, usuarioId);

      return res.status(201).json({
        success: true,
        data: certificado,
        message: 'Certificado subido correctamente',
      });
    } catch (error: any) {
      console.error('Error al subir certificado:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al subir el certificado',
      });
    }
  },

  /**
   * Listar certificados de la empresa
   */
  async listar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;

      const certificados = await certificadosService.listar(empresaId);

      return res.json({
        success: true,
        data: certificados,
      });
    } catch (error: any) {
      console.error('Error al listar certificados:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al listar certificados',
      });
    }
  },

  /**
   * Obtener un certificado por ID
   */
  async obtenerPorId(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      const certificado = await certificadosService.obtenerPorId(id, empresaId);

      if (!certificado) {
        return res.status(404).json({
          success: false,
          error: 'Certificado no encontrado',
        });
      }

      return res.json({
        success: true,
        data: certificado,
      });
    } catch (error: any) {
      console.error('Error al obtener certificado:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener el certificado',
      });
    }
  },

  /**
   * Obtener certificado predeterminado
   */
  async obtenerPredeterminado(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;

      const certificado = await certificadosService.obtenerPredeterminado(empresaId);

      if (!certificado) {
        return res.status(404).json({
          success: false,
          error: 'No hay certificado predeterminado configurado',
        });
      }

      // No devolver contenido sensible
      return res.json({
        success: true,
        data: {
          _id: certificado._id,
          nombre: certificado.nombre,
          tipo: certificado.tipo,
          estado: certificado.estado,
          titular: certificado.titular,
          emisor: certificado.emisor,
          fechaEmision: certificado.fechaEmision,
          fechaExpiracion: certificado.fechaExpiracion,
          huella: certificado.huella,
          usos: certificado.usos,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener certificado predeterminado:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener el certificado predeterminado',
      });
    }
  },

  /**
   * Actualizar un certificado
   */
  async actualizar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { id } = req.params;

      const dto: ActualizarCertificadoDTO = req.body;

      const certificado = await certificadosService.actualizar(id, dto, empresaId, usuarioId);

      if (!certificado) {
        return res.status(404).json({
          success: false,
          error: 'Certificado no encontrado',
        });
      }

      return res.json({
        success: true,
        data: certificado,
        message: 'Certificado actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar certificado:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar el certificado',
      });
    }
  },

  /**
   * Eliminar un certificado
   */
  async eliminar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      const eliminado = await certificadosService.eliminar(id, empresaId);

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          error: 'Certificado no encontrado',
        });
      }

      return res.json({
        success: true,
        message: 'Certificado eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar certificado:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar el certificado',
      });
    }
  },

  /**
   * Validar un certificado para un uso específico
   */
  async validar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;
      const { uso } = req.query;

      const usoValidar = (uso as UsosCertificado) || UsosCertificado.VERIFACTU;

      const resultado = await certificadosService.validarParaUso(id, empresaId, usoValidar);

      return res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error al validar certificado:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al validar el certificado',
      });
    }
  },

  /**
   * Verificar contraseña de un certificado
   */
  async verificarPassword(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { archivoBase64, password } = req.body;

      if (!archivoBase64 || !password) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere archivoBase64 y password',
        });
      }

      // Intentar parsear el certificado para validar la contraseña
      const info = await certificadosService.parsearCertificado(archivoBase64, password);

      return res.json({
        success: true,
        data: {
          valido: true,
          info: {
            titular: info.titular,
            emisor: info.emisor,
            fechaEmision: info.fechaEmision,
            fechaExpiracion: info.fechaExpiracion,
            numeroSerie: info.numeroSerie,
          },
        },
        message: 'Certificado y contraseña válidos',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Contraseña incorrecta o certificado inválido',
      });
    }
  },

  /**
   * Obtener certificados próximos a caducar (para administración)
   */
  async proximosACaducar(req: Request, res: Response) {
    try {
      const dias = parseInt(req.query.dias as string) || 30;

      const certificados = await certificadosService.obtenerProximosACaducar(dias);

      return res.json({
        success: true,
        data: certificados,
        total: certificados.length,
      });
    } catch (error: any) {
      console.error('Error al obtener certificados próximos a caducar:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener certificados',
      });
    }
  },

  /**
   * Probar firma con un certificado
   */
  async probarFirma(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;
      const { datos } = req.body;

      const datosAFirmar = datos || `Test firma ${new Date().toISOString()}`;

      // Usar método unificado que soporta ambos orígenes
      const resultado = await certificadosService.firmarDatosUnificado(id, empresaId, datosAFirmar);

      return res.json({
        success: true,
        data: {
          datosOriginales: datosAFirmar,
          firma: resultado.firma,
          algoritmo: resultado.algoritmo,
        },
        message: 'Firma generada correctamente',
      });
    } catch (error: any) {
      console.error('Error al probar firma:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al generar la firma',
      });
    }
  },

  // ============================================
  // WINDOWS STORE
  // ============================================

  /**
   * Verificar si el almacén de Windows está disponible
   */
  async windowsStoreDisponible(req: Request, res: Response) {
    try {
      const disponible = await certificadosService.windowsStoreDisponible();

      return res.json({
        success: true,
        data: {
          disponible,
          plataforma: process.platform,
        },
      });
    } catch (error: any) {
      console.error('Error verificando Windows Store:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al verificar disponibilidad',
      });
    }
  },

  /**
   * Listar certificados del almacén de Windows
   */
  async listarCertificadosWindows(req: Request, res: Response) {
    try {
      const storeName = (req.query.store as string) || 'MY';

      const disponible = await certificadosService.windowsStoreDisponible();

      if (!disponible) {
        return res.status(400).json({
          success: false,
          error: 'El almacén de certificados de Windows no está disponible en esta plataforma',
        });
      }

      const certificados = await certificadosService.listarCertificadosWindows(storeName);

      return res.json({
        success: true,
        data: certificados,
        total: certificados.length,
      });
    } catch (error: any) {
      console.error('Error listando certificados de Windows:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al listar certificados de Windows',
      });
    }
  },

  /**
   * Registrar un certificado del almacén de Windows
   */
  async registrarCertificadoWindows(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;

      const { nombre, descripcion, tipo, usos, predeterminado, thumbprint, storeName, storeLocation } = req.body;

      if (!nombre || !thumbprint) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos obligatorios: nombre, thumbprint',
        });
      }

      const disponible = await certificadosService.windowsStoreDisponible();

      if (!disponible) {
        return res.status(400).json({
          success: false,
          error: 'El almacén de certificados de Windows no está disponible en esta plataforma',
        });
      }

      const dto: RegistrarCertificadoWindowsDTO = {
        nombre,
        descripcion,
        tipo,
        usos,
        predeterminado,
        thumbprint,
        storeName,
        storeLocation,
      };

      const certificado = await certificadosService.registrarCertificadoWindows(dto, empresaId, usuarioId);

      return res.status(201).json({
        success: true,
        data: certificado,
        message: 'Certificado de Windows registrado correctamente',
      });
    } catch (error: any) {
      console.error('Error registrando certificado de Windows:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al registrar el certificado de Windows',
      });
    }
  },
};

export default certificadosController;
