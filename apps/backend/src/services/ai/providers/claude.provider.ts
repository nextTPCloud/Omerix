/**
 * Proveedor de IA: Anthropic Claude
 *
 * Modelos disponibles:
 * - claude-sonnet-4-20250514 (Equilibrado, recomendado)
 * - claude-opus-4-20250514 (Más potente, más caro)
 * - claude-3-5-haiku-20241022 (Más rápido y económico)
 *
 * Documentación: https://docs.anthropic.com/
 */

import {
  IAIProvider,
  AIMessage,
  AIMessageWithImage,
  AIGenerationOptions,
  AIResponse,
  AIProvider,
} from '../ai.types';

export class ClaudeProvider implements IAIProvider {
  name: AIProvider = 'claude';
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.anthropic.com/v1';
  private apiVersion = '2023-06-01';

  constructor(apiKey: string, model: string = 'claude-sonnet-4-20250514') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<AIResponse> {
    // Convertir mensajes al formato de Claude
    const { systemPrompt, claudeMessages } = this.convertMessages(messages);

    const requestBody: any = {
      model: this.model,
      max_tokens: options?.maxTokens ?? 4096,
      messages: claudeMessages,
    };

    // Añadir system prompt si existe
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    // Añadir temperatura si se especifica
    if (options?.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': this.apiVersion,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      const errorMessage = error.error?.message || response.statusText;

      // Detectar errores específicos
      if (response.status === 429 || errorMessage.includes('rate_limit')) {
        throw new Error('QUOTA_EXCEEDED:Has superado el límite de la API de Claude. Espera un momento o revisa tu plan.');
      }

      if (response.status === 401) {
        throw new Error('API_KEY_ERROR:La API key de Claude no es válida. Verifica tu configuración.');
      }

      throw new Error(`Claude API error: ${errorMessage}`);
    }

    const data = await response.json();

    // Extraer el texto de la respuesta
    const content = data.content?.[0]?.text || '';

    return {
      content,
      provider: this.name,
      model: this.model,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }

  /**
   * Completar con imágenes (visión)
   * Claude soporta imágenes en formato base64
   */
  async completeWithImage(
    message: AIMessageWithImage,
    systemPrompt?: string,
    options?: AIGenerationOptions
  ): Promise<AIResponse> {
    // Construir el contenido del mensaje con imágenes
    const content: any[] = [];

    // Añadir imágenes primero
    for (const image of message.images) {
      // Claude usa media_type en lugar de mimeType
      const mediaType = image.mimeType === 'application/pdf' ? 'application/pdf' : image.mimeType;

      // Para PDFs, Claude usa un formato diferente
      if (image.mimeType === 'application/pdf') {
        content.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: image.base64,
          },
        });
      } else {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: image.base64,
          },
        });
      }
    }

    // Añadir el texto del mensaje
    content.push({
      type: 'text',
      text: message.content,
    });

    const requestBody: any = {
      model: this.model,
      max_tokens: options?.maxTokens ?? 4096,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    };

    // Añadir system prompt si existe
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    // Añadir temperatura
    if (options?.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': this.apiVersion,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      const errorMessage = error.error?.message || response.statusText;

      if (response.status === 429 || errorMessage.includes('rate_limit')) {
        throw new Error('QUOTA_EXCEEDED:Has superado el límite de la API de Claude. Espera un momento o revisa tu plan.');
      }

      if (response.status === 401) {
        throw new Error('API_KEY_ERROR:La API key de Claude no es válida. Verifica tu configuración.');
      }

      throw new Error(`Claude Vision API error: ${errorMessage}`);
    }

    const data = await response.json();
    const responseContent = data.content?.[0]?.text || '';

    return {
      content: responseContent,
      provider: this.name,
      model: this.model,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }

  /**
   * Claude no tiene búsqueda web nativa, pero podemos implementar
   * una búsqueda basada en el conocimiento del modelo
   */
  async searchWeb(query: string): Promise<string> {
    const response = await this.complete([
      {
        role: 'user',
        content: `Basándote en tu conocimiento actualizado hasta tu fecha de corte, proporciona información detallada sobre: ${query}

Por favor incluye:
1. Datos concretos y específicos
2. Precios aproximados si aplica (en euros)
3. Fuentes o referencias conocidas

Responde de forma estructurada y útil.`,
      },
    ], { temperature: 0.3 });

    return response.content;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Hacer una petición simple para verificar que la API key es válida
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });

      // Si devuelve 401, la API key no es válida
      if (response.status === 401) {
        return false;
      }

      // Cualquier otra respuesta (incluso 429 rate limit) significa que la key es válida
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convertir mensajes del formato común al formato de Claude
   * Claude separa el system prompt de los mensajes
   */
  private convertMessages(messages: AIMessage[]): {
    systemPrompt: string | null;
    claudeMessages: { role: 'user' | 'assistant'; content: string }[];
  } {
    let systemPrompt: string | null = null;
    const claudeMessages: { role: 'user' | 'assistant'; content: string }[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Claude maneja el system prompt por separado
        systemPrompt = msg.content;
      } else {
        claudeMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Claude requiere que el primer mensaje sea del usuario
    // Si no hay mensajes o el primero no es del usuario, ajustar
    if (claudeMessages.length === 0) {
      claudeMessages.push({ role: 'user', content: 'Hola' });
    }

    return { systemPrompt, claudeMessages };
  }
}
