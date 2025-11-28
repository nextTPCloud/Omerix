/**
 * Tipos para el servicio de IA
 */

// Proveedores soportados
export type AIProvider = 'gemini' | 'openai' | 'claude' | 'ollama';

// Configuración del proveedor
export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string; // Para Ollama o endpoints custom
}

// Mensaje de chat
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Opciones de generación
export interface AIGenerationOptions {
  temperature?: number; // 0-1, más alto = más creativo
  maxTokens?: number;
  stream?: boolean;
}

// Respuesta genérica de IA
export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Sugerencia de precio
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

// Descripción generada
export interface GeneratedDescription {
  shortDescription: string;
  fullDescription: string;
  features: string[];
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
}

// Categorización sugerida
export interface CategorySuggestion {
  suggestedCategory: string;
  confidence: number;
  alternatives: {
    category: string;
    confidence: number;
  }[];
  reasoning: string;
}

// Interfaz que deben implementar todos los proveedores
export interface IAIProvider {
  name: AIProvider;

  // Completar texto/chat
  complete(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<AIResponse>;

  // Búsqueda web (solo algunos proveedores)
  searchWeb?(query: string): Promise<string>;

  // Verificar disponibilidad
  isAvailable(): Promise<boolean>;
}
