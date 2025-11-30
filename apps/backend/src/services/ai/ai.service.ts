/**
 * Servicio de IA - Capa de abstracción para múltiples proveedores
 *
 * Uso:
 *   const aiService = new AIService();
 *   const suggestion = await aiService.suggestPrice('iPhone 15 Pro 256GB');
 */

import {
  IAIProvider,
  AIProvider,
  AIMessage,
  AIGenerationOptions,
  AIResponse,
  PriceSuggestion,
  GeneratedDescription,
  CategorySuggestion,
  BarcodeProductInfo,
} from './ai.types';
import { GeminiProvider } from './providers/gemini.provider';
import { lookupBarcodeInApis } from './barcode-lookup.service';

export class AIService {
  private provider: IAIProvider;
  private providerName: AIProvider;

  constructor(providerName?: AIProvider) {
    this.providerName = providerName || (process.env.AI_PROVIDER as AIProvider) || 'gemini';
    this.provider = this.createProvider(this.providerName);
  }

  private createProvider(name: AIProvider): IAIProvider {
    switch (name) {
      case 'gemini':
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
          throw new Error('GEMINI_API_KEY no está configurada');
        }
        return new GeminiProvider(geminiKey, process.env.GEMINI_MODEL || 'gemini-2.0-flash');

      case 'openai':
        // TODO: Implementar OpenAI provider
        throw new Error('OpenAI provider no implementado aún');

      case 'claude':
        // TODO: Implementar Claude provider
        throw new Error('Claude provider no implementado aún');

      case 'ollama':
        // TODO: Implementar Ollama provider
        throw new Error('Ollama provider no implementado aún');

      default:
        throw new Error(`Proveedor de IA desconocido: ${name}`);
    }
  }

  /**
   * Obtener el proveedor activo
   */
  getProvider(): AIProvider {
    return this.providerName;
  }

  /**
   * Verificar si el servicio está disponible
   */
  async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  /**
   * Completar un chat/prompt
   */
  async complete(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<AIResponse> {
    return this.provider.complete(messages, options);
  }

  /**
   * Sugerir precio de mercado para un producto
   */
  async suggestPrice(
    productName: string,
    productDescription?: string,
    purchasePrice?: number,
    category?: string
  ): Promise<PriceSuggestion> {
    const contextParts: string[] = [];
    if (productDescription) contextParts.push(`Descripción: ${productDescription}`);
    if (purchasePrice) contextParts.push(`Precio de compra: ${purchasePrice}€`);
    if (category) contextParts.push(`Categoría: ${category}`);

    const context = contextParts.length > 0 ? `\n${contextParts.join('\n')}` : '';

    // Primero intentar búsqueda web si está disponible
    let webSearchResult = '';
    if (this.provider.searchWeb) {
      try {
        webSearchResult = await this.provider.searchWeb(
          `precio de venta ${productName} España euros 2024 2025`
        );
      } catch (error) {
        console.warn('Búsqueda web no disponible:', error);
      }
    }

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Eres un experto en pricing y análisis de mercado para retail en España.
Tu tarea es analizar precios de mercado y sugerir un precio de venta competitivo.
Siempre responde en JSON válido con esta estructura exacta:
{
  "suggestedPrice": number,
  "minPrice": number,
  "maxPrice": number,
  "avgPrice": number,
  "confidence": "alta" | "media" | "baja",
  "sources": [{"name": string, "price": number}],
  "reasoning": string,
  "marketAnalysis": string
}`,
      },
      {
        role: 'user',
        content: `Analiza el precio de mercado para este producto y sugiere un PVP competitivo:

Producto: ${productName}${context}

${webSearchResult ? `Información de mercado encontrada:\n${webSearchResult}\n\n` : ''}

Considera:
1. Precios típicos en tiendas españolas (Amazon.es, PCComponentes, MediaMarkt, El Corte Inglés, etc.)
2. El margen de beneficio típico del sector
3. ${purchasePrice ? `El precio de compra es ${purchasePrice}€, asegura un margen mínimo del 15%` : 'Un margen competitivo'}

Responde SOLO con el JSON, sin markdown ni explicaciones adicionales.`,
      },
    ];

    const response = await this.provider.complete(messages, { temperature: 0.3 });

    try {
      // Limpiar posible markdown del JSON
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }

      const result = JSON.parse(jsonStr.trim());

      // Validar y ajustar si hay precio de compra
      if (purchasePrice && result.suggestedPrice < purchasePrice * 1.15) {
        result.suggestedPrice = Math.round(purchasePrice * 1.25 * 100) / 100;
        result.reasoning += ' (Ajustado para garantizar margen mínimo del 15%)';
      }

      return result as PriceSuggestion;
    } catch (error) {
      console.error('Error parseando respuesta de precio:', response.content);
      // Respuesta por defecto si falla el parsing
      const basePrice = purchasePrice || 10;
      return {
        suggestedPrice: Math.round(basePrice * 1.4 * 100) / 100,
        minPrice: Math.round(basePrice * 1.2 * 100) / 100,
        maxPrice: Math.round(basePrice * 1.8 * 100) / 100,
        avgPrice: Math.round(basePrice * 1.5 * 100) / 100,
        confidence: 'baja',
        sources: [],
        reasoning: 'No se pudo analizar el mercado. Precio basado en margen estándar del 40%.',
        marketAnalysis: 'Análisis no disponible',
      };
    }
  }

  /**
   * Generar descripción de producto
   */
  async generateDescription(
    productName: string,
    category?: string,
    features?: string[],
    targetAudience?: string
  ): Promise<GeneratedDescription> {
    const contextParts: string[] = [];
    if (category) contextParts.push(`Categoría: ${category}`);
    if (features?.length) contextParts.push(`Características: ${features.join(', ')}`);
    if (targetAudience) contextParts.push(`Público objetivo: ${targetAudience}`);

    const context = contextParts.length > 0 ? `\n${contextParts.join('\n')}` : '';

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Eres un copywriter experto en ecommerce y SEO para el mercado español.
Tu tarea es crear descripciones de productos atractivas y optimizadas para SEO.
Responde SIEMPRE en JSON válido con esta estructura:
{
  "shortDescription": string (máximo 150 caracteres),
  "fullDescription": string (2-3 párrafos, HTML permitido con <p>, <ul>, <li>, <strong>),
  "features": string[] (5-8 características clave),
  "seoTitle": string (máximo 60 caracteres),
  "seoDescription": string (máximo 160 caracteres),
  "keywords": string[] (5-10 palabras clave)
}`,
      },
      {
        role: 'user',
        content: `Genera una descripción profesional para este producto:

Producto: ${productName}${context}

La descripción debe:
1. Ser persuasiva y orientada a la venta
2. Destacar beneficios, no solo características
3. Incluir llamadas a la acción sutiles
4. Estar optimizada para SEO en español de España
5. Usar un tono profesional pero cercano

Responde SOLO con el JSON.`,
      },
    ];

    const response = await this.provider.complete(messages, { temperature: 0.7 });

    try {
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      return JSON.parse(jsonStr.trim()) as GeneratedDescription;
    } catch (error) {
      console.error('Error parseando descripción:', response.content);
      return {
        shortDescription: productName,
        fullDescription: `<p>${productName}</p>`,
        features: [],
        seoTitle: productName,
        seoDescription: productName,
        keywords: [],
      };
    }
  }

  /**
   * Sugerir categoría para un producto
   */
  async suggestCategory(
    productName: string,
    description?: string,
    availableCategories?: string[]
  ): Promise<CategorySuggestion> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Eres un experto en categorización de productos para ecommerce.
Tu tarea es sugerir la mejor categoría para un producto.
${availableCategories?.length ? `Categorías disponibles: ${availableCategories.join(', ')}` : 'Sugiere categorías genéricas de retail.'}
Responde en JSON:
{
  "suggestedCategory": string,
  "confidence": number (0-1),
  "alternatives": [{"category": string, "confidence": number}],
  "reasoning": string
}`,
      },
      {
        role: 'user',
        content: `¿En qué categoría clasificarías este producto?

Producto: ${productName}
${description ? `Descripción: ${description}` : ''}

Responde SOLO con el JSON.`,
      },
    ];

    const response = await this.provider.complete(messages, { temperature: 0.3 });

    try {
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      return JSON.parse(jsonStr.trim()) as CategorySuggestion;
    } catch (error) {
      console.error('Error parseando categoría:', response.content);
      return {
        suggestedCategory: 'General',
        confidence: 0,
        alternatives: [],
        reasoning: 'No se pudo determinar la categoría',
      };
    }
  }

  /**
   * Buscar información de producto por código de barras
   * Primero consulta APIs gratuitas, luego usa IA como fallback
   */
  async lookupBarcode(barcode: string): Promise<BarcodeProductInfo> {
    // Validar formato de código de barras (EAN-13, EAN-8, UPC-A, etc.)
    const cleanBarcode = barcode.trim().replace(/\D/g, '');
    if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
      return {
        found: false,
        barcode: cleanBarcode,
        confidence: 'baja',
        source: 'Código de barras inválido',
      };
    }

    // PASO 1: Consultar APIs gratuitas de códigos de barras
    console.log(`Buscando código de barras ${cleanBarcode} en APIs...`);
    const apiResult = await lookupBarcodeInApis(cleanBarcode);

    if (apiResult.found) {
      // Producto encontrado en APIs - generar descripción con IA si falta
      let shortDescription = apiResult.description?.slice(0, 150) || null;
      let fullDescription = apiResult.description || null;

      // Si tenemos nombre pero no descripción, usar IA para generarla
      if (apiResult.name && !apiResult.description) {
        try {
          const aiDescription = await this.generateDescription(
            apiResult.name,
            apiResult.category,
            apiResult.brand ? [apiResult.brand] : undefined
          );
          shortDescription = aiDescription.shortDescription;
          fullDescription = aiDescription.fullDescription;
        } catch (error) {
          console.warn('No se pudo generar descripción con IA:', error);
        }
      }

      return {
        found: true,
        barcode: cleanBarcode,
        name: apiResult.name || null,
        shortDescription,
        fullDescription,
        brand: apiResult.brand || null,
        category: apiResult.category || null,
        imageUrl: apiResult.imageUrl,
        confidence: 'alta',
        source: apiResult.source,
      };
    }

    // PASO 2: Fallback - usar IA con búsqueda web
    console.log(`No encontrado en APIs, usando IA para ${cleanBarcode}...`);
    return this.lookupBarcodeWithAI(cleanBarcode);
  }

  /**
   * Buscar producto por código de barras usando IA y búsqueda web
   */
  private async lookupBarcodeWithAI(cleanBarcode: string): Promise<BarcodeProductInfo> {
    // Intentar búsqueda web si está disponible
    let webSearchResult = '';
    if (this.provider.searchWeb) {
      try {
        webSearchResult = await this.provider.searchWeb(
          `"${cleanBarcode}" producto nombre marca EAN barcode`
        );
      } catch (error) {
        console.warn('Búsqueda web no disponible:', error);
      }
    }

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Eres un experto en identificación de productos a partir de códigos de barras EAN/UPC.

Tu tarea es extraer información del producto basándote en los resultados de búsqueda.

Responde SIEMPRE en JSON válido con esta estructura:
{
  "found": boolean,
  "name": string | null (nombre comercial del producto),
  "shortDescription": string | null (máximo 150 caracteres),
  "fullDescription": string | null (descripción detallada, 2-3 frases),
  "brand": string | null (marca/fabricante),
  "category": string | null,
  "suggestedPrice": number | null (precio en euros),
  "confidence": "alta" | "media" | "baja",
  "source": string
}

IMPORTANTE:
- Si encuentras información clara: found: true, confidence: "alta"
- Si la información es parcial: found: true, confidence: "media"
- Si NO encuentras información: found: false con campos en null
- NO inventes información si no la encuentras en la búsqueda`,
      },
      {
        role: 'user',
        content: `Identifica el producto con código de barras: ${cleanBarcode} (${this.getBarcodeType(cleanBarcode)})

${webSearchResult ? `RESULTADOS DE BÚSQUEDA:\n${webSearchResult}` : 'No hay resultados de búsqueda disponibles.'}

Responde SOLO con el JSON.`,
      },
    ];

    const response = await this.provider.complete(messages, { temperature: 0.2 });

    try {
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      const result = JSON.parse(jsonStr.trim());
      return {
        ...result,
        barcode: cleanBarcode,
        source: result.found ? `IA (${result.source || 'búsqueda web'})` : 'No encontrado en APIs ni búsqueda web',
      } as BarcodeProductInfo;
    } catch (error) {
      console.error('Error parseando respuesta de barcode:', response.content);
      return {
        found: false,
        barcode: cleanBarcode,
        confidence: 'baja',
        source: 'Error al procesar la respuesta',
      };
    }
  }

  /**
   * Identificar el tipo de código de barras según su longitud
   */
  private getBarcodeType(barcode: string): string {
    switch (barcode.length) {
      case 8: return 'EAN-8';
      case 12: return 'UPC-A';
      case 13: return 'EAN-13';
      case 14: return 'GTIN-14';
      default: return 'Desconocido';
    }
  }

  /**
   * Chat libre con el asistente
   */
  async chat(
    userMessage: string,
    conversationHistory?: AIMessage[],
    businessContext?: string
  ): Promise<string> {
    const systemMessage: AIMessage = {
      role: 'system',
      content: `Eres un asistente de IA para un sistema ERP de gestión comercial llamado Omerix.
Ayudas a los usuarios con:
- Consultas sobre productos, ventas, stock, clientes
- Análisis de datos del negocio
- Sugerencias para mejorar las ventas
- Explicaciones sobre el funcionamiento del sistema

${businessContext ? `Contexto del negocio:\n${businessContext}` : ''}

Responde de forma concisa, profesional y útil. En español de España.`,
    };

    const messages: AIMessage[] = [
      systemMessage,
      ...(conversationHistory || []),
      { role: 'user', content: userMessage },
    ];

    const response = await this.provider.complete(messages, { temperature: 0.7 });
    return response.content;
  }
}

// Singleton para uso global
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
