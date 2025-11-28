/**
 * Proveedor de IA: Google Gemini
 *
 * Tier gratuito: 60 RPM, 1500 RPD
 * Documentación: https://ai.google.dev/
 */

import {
  IAIProvider,
  AIMessage,
  AIGenerationOptions,
  AIResponse,
  AIProvider,
} from '../ai.types';

export class GeminiProvider implements IAIProvider {
  name: AIProvider = 'gemini';
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<AIResponse> {
    // Convertir mensajes al formato de Gemini
    const contents = this.convertMessages(messages);

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxTokens ?? 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Extraer el texto de la respuesta
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      content,
      provider: this.name,
      model: this.model,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  /**
   * Búsqueda web usando Gemini con grounding
   * Nota: Requiere modelo gemini-1.5-pro o superior para grounding
   */
  async searchWeb(query: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Busca información actualizada en internet sobre: ${query}.
                  Proporciona datos concretos, precios si aplica, y fuentes.`,
                },
              ],
            },
          ],
          tools: [
            {
              googleSearch: {},
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      // Si falla el grounding, hacer búsqueda normal
      console.warn('Gemini grounding no disponible, usando búsqueda básica');
      const basicResponse = await this.complete([
        {
          role: 'user',
          content: `Basándote en tu conocimiento, proporciona información sobre: ${query}`,
        },
      ]);
      return basicResponse.content;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models?key=${this.apiKey}`,
        { method: 'GET' }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private convertMessages(messages: AIMessage[]): any[] {
    const contents: any[] = [];
    let systemPrompt = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Gemini no tiene role 'system', lo añadimos al primer mensaje user
        systemPrompt = msg.content + '\n\n';
      } else {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        const content = msg.role === 'user' && systemPrompt
          ? systemPrompt + msg.content
          : msg.content;

        if (msg.role === 'user') {
          systemPrompt = ''; // Solo añadir una vez
        }

        contents.push({
          role,
          parts: [{ text: content }],
        });
      }
    }

    return contents;
  }
}
