/**
 * Controlador de IA
 * Endpoints para funcionalidades de inteligencia artificial
 */

import { Request, Response } from 'express';
import { AIService } from '../../services/ai/ai.service';

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
}

export const aiController = new AIController();
