/**
 * Controlador de IA
 * Endpoints para funcionalidades de inteligencia artificial
 */

import { Request, Response } from 'express';
import { AIService } from '../../services/ai/ai.service';
import { AICommandsService, createAICommandsServiceWithConfig } from '../../services/ai/ai-commands.service';

class AIController {
  private aiService: AIService | null = null;

  private getService(): AIService {
    if (!this.aiService) {
      this.aiService = new AIService();
    }
    return this.aiService;
  }

  /**
   * GET /ai/status
   * Verificar si el servicio de IA está disponible
   */
  getStatus = async (req: Request, res: Response) => {
    try {
      const service = this.getService();
      const available = await service.isAvailable();

      res.json({
        success: true,
        data: {
          available,
          provider: service.getProvider(),
        },
      });
    } catch (error: any) {
      res.json({
        success: true,
        data: {
          available: false,
          provider: null,
          error: error.message,
        },
      });
    }
  };

  /**
   * POST /ai/suggest-price
   * Sugerir precio de mercado para un producto
   */
  suggestPrice = async (req: Request, res: Response) => {
    try {
      const { productName, description, purchasePrice, category } = req.body;

      if (!productName) {
        return res.status(400).json({
          success: false,
          error: 'El nombre del producto es obligatorio',
        });
      }

      const service = this.getService();
      const suggestion = await service.suggestPrice(
        productName,
        description,
        purchasePrice,
        category
      );

      res.json({
        success: true,
        data: suggestion,
      });
    } catch (error: any) {
      console.error('Error en suggest-price:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al sugerir precio',
      });
    }
  };

  /**
   * POST /ai/generate-description
   * Generar descripción de producto
   */
  generateDescription = async (req: Request, res: Response) => {
    try {
      const { productName, category, features, targetAudience } = req.body;

      if (!productName) {
        return res.status(400).json({
          success: false,
          error: 'El nombre del producto es obligatorio',
        });
      }

      const service = this.getService();
      const description = await service.generateDescription(
        productName,
        category,
        features,
        targetAudience
      );

      res.json({
        success: true,
        data: description,
      });
    } catch (error: any) {
      console.error('Error en generate-description:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al generar descripción',
      });
    }
  };

  /**
   * POST /ai/suggest-category
   * Sugerir categoría para un producto
   */
  suggestCategory = async (req: Request, res: Response) => {
    try {
      const { productName, description, availableCategories } = req.body;

      if (!productName) {
        return res.status(400).json({
          success: false,
          error: 'El nombre del producto es obligatorio',
        });
      }

      const service = this.getService();
      const suggestion = await service.suggestCategory(
        productName,
        description,
        availableCategories
      );

      res.json({
        success: true,
        data: suggestion,
      });
    } catch (error: any) {
      console.error('Error en suggest-category:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al sugerir categoría',
      });
    }
  };

  /**
   * POST /ai/lookup-barcode
   * Buscar información de producto por código de barras
   */
  lookupBarcode = async (req: Request, res: Response) => {
    try {
      const { barcode } = req.body;

      if (!barcode) {
        return res.status(400).json({
          success: false,
          error: 'El código de barras es obligatorio',
        });
      }

      const service = this.getService();
      const productInfo = await service.lookupBarcode(barcode);

      res.json({
        success: true,
        data: productInfo,
      });
    } catch (error: any) {
      console.error('Error en lookup-barcode:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al buscar información del producto',
      });
    }
  };

  /**
   * POST /ai/chat
   * Chat con el asistente de IA
   */
  chat = async (req: Request, res: Response) => {
    try {
      const { message, history, businessContext } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'El mensaje es obligatorio',
        });
      }

      const service = this.getService();
      const response = await service.chat(message, history, businessContext);

      res.json({
        success: true,
        data: {
          response,
        },
      });
    } catch (error: any) {
      console.error('Error en chat:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error en el chat',
      });
    }
  };

  // ============================================
  // COMANDOS DE VOZ/CHAT
  // ============================================

  /**
   * POST /ai/command
   * Procesar un comando de texto para crear documentos
   *
   * Ejemplos:
   *   "Crea un albarán para ACME con 10 tornillos"
   *   "Hazme un pedido de compra a Ferretería Central con 100 tuercas"
   */
  processCommand = async (req: Request, res: Response) => {
    try {
      const { command, autoCreate } = req.body;

      if (!command) {
        return res.status(400).json({
          success: false,
          error: 'El comando es obligatorio',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          error: 'Configuración de empresa no disponible',
        });
      }

      const commandsService = createAICommandsServiceWithConfig();
      const resultado = await commandsService.procesarComando(
        command,
        req.empresaId,
        req.userId!,
        req.dbConfig,
        autoCreate === true
      );

      res.json({
        success: resultado.exito,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error en process-command:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al procesar comando',
      });
    }
  };

  /**
   * POST /ai/command/parse
   * Solo parsear un comando sin ejecutarlo
   * Útil para previsualizar qué haría el comando
   */
  parseCommand = async (req: Request, res: Response) => {
    try {
      const { command } = req.body;

      if (!command) {
        return res.status(400).json({
          success: false,
          error: 'El comando es obligatorio',
        });
      }

      const commandsService = createAICommandsServiceWithConfig();
      const resultado = await commandsService.parsearComando(command);

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error en parse-command:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al parsear comando',
      });
    }
  };

  /**
   * POST /ai/command/confirm
   * Confirmar y ejecutar la creación de un documento
   * después de que el usuario haya revisado los datos
   */
  confirmCommand = async (req: Request, res: Response) => {
    try {
      const {
        tipoDocumento,
        terceroId,
        productos,
        observaciones,
      } = req.body;

      if (!tipoDocumento || !terceroId || !productos || productos.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Datos incompletos para crear el documento',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          error: 'Configuración de empresa no disponible',
        });
      }

      const commandsService = createAICommandsServiceWithConfig();

      // Construir entidades resueltas desde los datos confirmados
      const entidadesResueltas = [
        {
          tipo: ['presupuesto_compra', 'pedido_compra', 'albaran_compra', 'factura_compra'].includes(tipoDocumento)
            ? 'proveedor' as const
            : 'cliente' as const,
          encontrado: true,
          id: terceroId.id,
          nombre: terceroId.nombre,
          datos: terceroId.datos,
        },
        ...productos.map((p: any) => ({
          tipo: 'producto' as const,
          encontrado: true,
          id: p.id,
          nombre: p.nombre,
          datos: p.datos,
          cantidad: p.cantidad,
          precio: p.precio,
          unidad: p.unidad,
        })),
      ];

      const documento = await commandsService.crearDocumento(
        tipoDocumento,
        entidadesResueltas,
        { observaciones, intencion: tipoDocumento, entidades: [], confianza: 'alta' },
        req.empresaId,
        req.userId!,
        req.dbConfig
      );

      res.json({
        success: true,
        data: {
          mensaje: `Documento ${documento.codigo} creado correctamente`,
          documento,
        },
      });
    } catch (error: any) {
      console.error('Error en confirm-command:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al crear documento',
      });
    }
  };

  /**
   * POST /ai/smart-chat
   * Chat inteligente que detecta comandos y los ejecuta
   * o responde normalmente según corresponda
   */
  smartChat = async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'El mensaje es obligatorio',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          error: 'Configuración de empresa no disponible',
        });
      }

      const commandsService = createAICommandsServiceWithConfig();
      const resultado = await commandsService.chat(
        message,
        history || [],
        req.empresaId,
        req.dbConfig
      );

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error en smart-chat:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error en el chat',
      });
    }
  };
}

export const aiController = new AIController();
