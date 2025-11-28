/**
 * Servicio de IA para el frontend
 */

import { api } from './api';

// Tipos
export interface PriceSuggestion {
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  confidence: 'alta' | 'media' | 'baja';
  sources: {
    name: string;
    price: number;
    url?: string;
  }[];
  reasoning: string;
  marketAnalysis: string;
}

export interface GeneratedDescription {
  shortDescription: string;
  fullDescription: string;
  features: string[];
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
}

export interface CategorySuggestion {
  suggestedCategory: string;
  confidence: number;
  alternatives: {
    category: string;
    confidence: number;
  }[];
  reasoning: string;
}

export interface AIStatus {
  available: boolean;
  provider: string | null;
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Servicio
export const aiService = {
  /**
   * Verificar si el servicio de IA está disponible
   */
  async getStatus(): Promise<AIStatus> {
    try {
      const response = await api.get('/ai/status');
      return response.data.data;
    } catch (error) {
      return { available: false, provider: null, error: 'Error de conexión' };
    }
  },

  /**
   * Sugerir precio de mercado
   */
  async suggestPrice(params: {
    productName: string;
    description?: string;
    purchasePrice?: number;
    category?: string;
  }): Promise<PriceSuggestion> {
    const response = await api.post('/ai/suggest-price', params);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al sugerir precio');
    }
    return response.data.data;
  },

  /**
   * Generar descripción de producto
   */
  async generateDescription(params: {
    productName: string;
    category?: string;
    features?: string[];
    targetAudience?: string;
  }): Promise<GeneratedDescription> {
    const response = await api.post('/ai/generate-description', params);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al generar descripción');
    }
    return response.data.data;
  },

  /**
   * Sugerir categoría
   */
  async suggestCategory(params: {
    productName: string;
    description?: string;
    availableCategories?: string[];
  }): Promise<CategorySuggestion> {
    const response = await api.post('/ai/suggest-category', params);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al sugerir categoría');
    }
    return response.data.data;
  },

  /**
   * Chat con el asistente
   */
  async chat(params: {
    message: string;
    history?: ChatMessage[];
    businessContext?: string;
  }): Promise<string> {
    const response = await api.post('/ai/chat', params);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error en el chat');
    }
    return response.data.data.response;
  },
};
