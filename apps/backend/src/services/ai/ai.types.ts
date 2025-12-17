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

// Mensaje con imagen (para visión)
export interface AIMessageWithImage {
  role: 'user';
  content: string;
  images: {
    base64: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf';
  }[];
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

// Información de producto por código de barras
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

// Datos extraídos de documento de compra (albarán/factura proveedor)
export interface DocumentoCompraExtraido {
  // Datos del proveedor
  cifProveedor: string | null;
  nombreProveedor: string | null;

  // Datos del documento
  numeroDocumento: string | null;
  fecha: string | null;

  // Líneas del documento
  lineas: {
    codigoProducto: string | null;  // Referencia del proveedor
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
    iva?: number;
    total?: number;
  }[];

  // Totales
  totales?: {
    subtotal?: number;
    iva?: number;
    total?: number;
  };

  // Metadatos
  observaciones?: string;
  confianza: 'alta' | 'media' | 'baja';
  camposNoDetectados: string[];
}

// Resultado del procesamiento OCR
export interface OCRResult {
  success: boolean;
  datos: DocumentoCompraExtraido | null;
  proveedorEncontrado?: {
    _id: string;
    nombre: string;
    cif: string;
  } | null;
  productosEncontrados: {
    lineaIndex: number;
    codigoProveedor: string;
    productoId: string;
    nombre: string;
    sku: string;
    precioCompra: number;
  }[];
  productosNoEncontrados: {
    lineaIndex: number;
    codigoProveedor: string;
    descripcion: string;
  }[];
  advertencias: string[];
  error?: string;
  // Código de error para manejo específico en frontend
  errorCode?: 'QUOTA_EXCEEDED' | 'API_KEY_ERROR' | 'NETWORK_ERROR' | 'ERROR';
}

// Interfaz que deben implementar todos los proveedores
export interface IAIProvider {
  name: AIProvider;

  // Completar texto/chat
  complete(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<AIResponse>;

  // Completar con imágenes (visión)
  completeWithImage?(
    message: AIMessageWithImage,
    systemPrompt?: string,
    options?: AIGenerationOptions
  ): Promise<AIResponse>;

  // Búsqueda web (solo algunos proveedores)
  searchWeb?(query: string): Promise<string>;

  // Verificar disponibilidad
  isAvailable(): Promise<boolean>;
}
