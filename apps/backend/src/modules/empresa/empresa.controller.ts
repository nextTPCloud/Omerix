import { Request, Response } from 'express';
import { z } from 'zod';
import empresaService, { ROLES_GESTION_EMPRESA } from './empresa.service';

// Schemas de validación
const UpdateEmpresaSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  nombreComercial: z.string().max(100).optional().nullable(),
  email: z.string().email().optional(),
  telefono: z.string().optional().nullable(),
  movil: z.string().optional().nullable(),
  fax: z.string().optional().nullable(),
  web: z.string().url().optional().nullable().or(z.literal('')),
  logo: z.string().optional().nullable(),
  direccion: z.object({
    calle: z.string().optional(),
    numero: z.string().optional(),
    piso: z.string().optional(),
    ciudad: z.string().optional(),
    provincia: z.string().optional(),
    codigoPostal: z.string().optional(),
    pais: z.string().optional(),
  }).optional(),
  datosRegistro: z.object({
    registroMercantil: z.string().optional(),
    tomo: z.string().optional(),
    libro: z.string().optional(),
    folio: z.string().optional(),
    seccion: z.string().optional(),
    hoja: z.string().optional(),
    inscripcion: z.string().optional(),
  }).optional(),
  seriesDocumentos: z.object({
    presupuestos: z.string().optional(),
    pedidos: z.string().optional(),
    albaranes: z.string().optional(),
    facturas: z.string().optional(),
    facturasRectificativas: z.string().optional(),
  }).optional(),
  moneda: z.string().optional(),
  formatoFecha: z.string().optional(),
  formatoNumero: z.string().optional(),
  // Configuración de decimales
  decimalesCantidad: z.number().int().min(0).max(6).optional(),
  decimalesPrecios: z.number().int().min(0).max(6).optional(),
  // Configuración de IA
  aiConfig: z.object({
    provider: z.enum(['gemini', 'openai', 'claude', 'ollama']).optional(),
    apiKey: z.string().optional().nullable(), // null para eliminar
    model: z.string().optional(),
  }).optional(),
});

const UpdateEmailConfigSchema = z.object({
  host: z.string().min(1, 'El host es obligatorio'),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().optional(), // Solo obligatorio si es nueva configuración
  fromName: z.string().optional().nullable(),
  fromEmail: z.string().email().optional().nullable().or(z.literal('')),
  replyTo: z.string().email().optional().nullable().or(z.literal('')),
});

const TestEmailSchema = z.object({
  email: z.string().email('Email de prueba no válido'),
});

const SendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, 'El asunto es obligatorio'),
  html: z.string().min(1, 'El contenido HTML es obligatorio'),
  text: z.string().optional(),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
});

class EmpresaController {
  /**
   * Verificar que el usuario tiene rol de gestión
   */
  private hasGestionRole(userRol: string): boolean {
    return ROLES_GESTION_EMPRESA.includes(userRol);
  }

  /**
   * GET /empresa/mi-empresa
   * Obtener información de la empresa actual del usuario
   */
  async getMiEmpresa(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      const empresa = await empresaService.getEmpresaById(empresaId);
      if (!empresa) {
        return res.status(404).json({
          success: false,
          message: 'Empresa no encontrada',
        });
      }

      res.json({
        success: true,
        data: empresa,
      });
    } catch (error: any) {
      console.error('Error al obtener empresa:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener información de la empresa',
      });
    }
  }

  /**
   * PUT /empresa/mi-empresa
   * Actualizar información de la empresa (solo admin/gerente)
   */
  async updateMiEmpresa(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionRole(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para modificar la configuración de la empresa',
        });
      }

      const validacion = UpdateEmpresaSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const empresa = await empresaService.updateEmpresa(empresaId, validacion.data);
      if (!empresa) {
        return res.status(404).json({
          success: false,
          message: 'Empresa no encontrada',
        });
      }

      res.json({
        success: true,
        data: empresa,
        message: 'Empresa actualizada correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar empresa:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar la empresa',
      });
    }
  }

  /**
   * GET /empresa/email-config
   * Obtener configuración de email (solo admin/gerente)
   */
  async getEmailConfig(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionRole(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver la configuración de email',
        });
      }

      const config = await empresaService.getEmailConfig(empresaId);

      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      console.error('Error al obtener config email:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener configuración de email',
      });
    }
  }

  /**
   * PUT /empresa/email-config
   * Actualizar configuración de email (solo admin/gerente)
   */
  async updateEmailConfig(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionRole(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para modificar la configuración de email',
        });
      }

      const validacion = UpdateEmailConfigSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const empresa = await empresaService.updateEmailConfig(empresaId, validacion.data);
      if (!empresa) {
        return res.status(404).json({
          success: false,
          message: 'Empresa no encontrada',
        });
      }

      res.json({
        success: true,
        data: empresa,
        message: 'Configuración de email actualizada correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar config email:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar configuración de email',
      });
    }
  }

  /**
   * POST /empresa/email-config/test
   * Probar configuración de email (solo admin/gerente)
   */
  async testEmailConfig(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionRole(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para probar la configuración de email',
        });
      }

      const validacion = TestEmailSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Email de prueba no válido',
          errors: validacion.error.errors,
        });
      }

      const resultado = await empresaService.testEmailConfig(empresaId, validacion.data.email);

      if (resultado.success) {
        res.json({
          success: true,
          message: resultado.message,
        });
      } else {
        res.status(400).json({
          success: false,
          message: resultado.message,
        });
      }
    } catch (error: any) {
      console.error('Error al probar config email:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al probar configuración de email',
      });
    }
  }

  /**
   * POST /empresa/send-email
   * Enviar email (endpoint general)
   */
  async sendEmail(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      const validacion = SendEmailSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos de email inválidos',
          errors: validacion.error.errors,
        });
      }

      const resultado = await empresaService.sendEmail(empresaId, validacion.data);

      if (resultado.success) {
        res.json({
          success: true,
          messageId: resultado.messageId,
          message: 'Email enviado correctamente',
        });
      } else {
        res.status(400).json({
          success: false,
          message: resultado.error || 'Error al enviar email',
        });
      }
    } catch (error: any) {
      console.error('Error al enviar email:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al enviar email',
      });
    }
  }

  /**
   * GET /empresa/preferencias-precios
   * Obtener preferencias de precios (solo admin/gerente)
   */
  async getPreferenciasPrecios(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontro informacion de la empresa',
        });
      }

      if (!userRol || !this.hasGestionRole(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver la configuracion de precios',
        });
      }

      const preferencias = await empresaService.getPreferenciasPrecios(empresaId);

      res.json({
        success: true,
        data: preferencias,
      });
    } catch (error: any) {
      console.error('Error al obtener preferencias de precios:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener preferencias de precios',
      });
    }
  }

  /**
   * PUT /empresa/preferencias-precios
   * Actualizar preferencias de precios (solo admin/gerente)
   */
  async updatePreferenciasPrecios(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontro informacion de la empresa',
        });
      }

      if (!userRol || !this.hasGestionRole(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para modificar la configuracion de precios',
        });
      }

      const preferencias = await empresaService.updatePreferenciasPrecios(empresaId, req.body);

      res.json({
        success: true,
        data: preferencias,
        message: 'Preferencias de precios actualizadas correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar preferencias de precios:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar preferencias de precios',
      });
    }
  }
}

export const empresaController = new EmpresaController();
export default empresaController;
