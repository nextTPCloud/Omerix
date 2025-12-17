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

export interface BarcodeProductInfo {
  found: boolean;
  barcode: string;
  name?: string;
  shortDescription?: string;
  fullDescription?: string;
  brand?: string;
  category?: string;
  suggestedPrice?: number;
  imageUrl?: string;
  confidence: 'alta' | 'media' | 'baja';
  source?: string;
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

// Tipos para comandos de voz/chat
export type TipoDocumento =
  | 'presupuesto'
  | 'pedido'
  | 'albaran'
  | 'factura'
  | 'presupuesto_compra'
  | 'pedido_compra'
  | 'albaran_compra'
  | 'factura_compra';

export interface EntidadResuelta {
  tipo: 'cliente' | 'proveedor' | 'producto';
  encontrado: boolean;
  id?: string;
  nombre?: string;
  datos?: any;
  alternativas?: Array<{ id: string; nombre: string; similitud: number }>;
  cantidad?: number;
  precio?: number;
  unidad?: string;
}

export interface ResultadoComando {
  exito: boolean;
  mensaje: string;
  tipoDocumento?: TipoDocumento;
  documentoCreado?: any;
  entidadesResueltas?: EntidadResuelta[];
  requiereConfirmacion?: boolean;
  datosParaConfirmar?: {
    cliente?: EntidadResuelta;
    proveedor?: EntidadResuelta;
    productos?: EntidadResuelta[];
    totales?: {
      subtotal: number;
      iva: number;
      total: number;
    };
  };
  sugerencias?: string[];
  error?: string;
}

export interface SmartChatResponse {
  respuesta: string;
  esComando: boolean;
  resultado?: ResultadoComando;
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

  /**
   * Buscar información de producto por código de barras
   */
  async lookupBarcode(barcode: string): Promise<BarcodeProductInfo> {
    const response = await api.post('/ai/lookup-barcode', { barcode });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al buscar producto');
    }
    return response.data.data;
  },

  // ============================================
  // COMANDOS DE VOZ/CHAT PARA DOCUMENTOS
  // ============================================

  /**
   * Procesar un comando de voz/texto para crear documentos
   * Ejemplo: "Crea un albarán para el cliente García con 10 martillos"
   */
  async processCommand(params: {
    comando: string;
    autoCrear?: boolean;
  }): Promise<ResultadoComando> {
    const response = await api.post('/ai/command', params);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error procesando comando');
    }
    return response.data.data;
  },

  /**
   * Solo parsear el comando sin ejecutar (para preview)
   */
  async parseCommand(comando: string): Promise<{
    tipoDocumento: TipoDocumento | null;
    entidades: {
      clientes: string[];
      proveedores: string[];
      productos: Array<{ nombre: string; cantidad?: number; precio?: number }>;
    };
    confianza: number;
  }> {
    const response = await api.post('/ai/command/parse', { comando });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error parseando comando');
    }
    return response.data.data;
  },

  /**
   * Confirmar y crear documento con entidades ya resueltas
   */
  async confirmCommand(params: {
    tipoDocumento: TipoDocumento;
    clienteId?: string;
    proveedorId?: string;
    productos: Array<{
      productoId: string;
      cantidad: number;
      precio?: number;
    }>;
    observaciones?: string;
  }): Promise<ResultadoComando> {
    const response = await api.post('/ai/command/confirm', params);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error confirmando comando');
    }
    return response.data.data;
  },

  /**
   * Chat inteligente que detecta comandos automáticamente
   * Si detecta un comando, lo procesa; si no, responde como chat normal
   */
  async smartChat(params: {
    message: string;
    history?: ChatMessage[];
  }): Promise<SmartChatResponse> {
    const response = await api.post('/ai/smart-chat', params);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error en el chat');
    }
    return response.data.data;
  },
};
