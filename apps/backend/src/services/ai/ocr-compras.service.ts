/**
 * Servicio OCR para documentos de compra
 * Procesa albaranes/facturas de proveedores usando IA con visión
 */

import { createAIServiceWithConfig, getAIService } from './ai.service';
import {
  AIMessageWithImage,
  DocumentoCompraExtraido,
  OCRResult,
} from './ai.types';
import { databaseManager, IDatabaseConfig } from '@/services/database-manager.service';
import Empresa, { decrypt } from '@/modules/empresa/Empresa';

// Prompt del sistema para extracción de datos de documentos de compra
const SYSTEM_PROMPT = `Eres un experto en OCR y extracción de datos de documentos comerciales españoles.
Tu tarea es analizar imágenes de albaranes o facturas de proveedores y extraer la información estructurada.

IMPORTANTE:
- El documento es un albarán o factura de compra de un PROVEEDOR
- Debes extraer el CIF/NIF del proveedor (emisor del documento)
- Los códigos de producto son las referencias del proveedor (no nuestras referencias)
- Extrae TODAS las líneas de productos que veas en el documento
- Los precios son precios de COMPRA (lo que nos cobra el proveedor)
- Si no puedes leer un campo con certeza, devuelve null para ese campo
- Los importes deben ser números (sin símbolos de moneda)
- La fecha debe estar en formato YYYY-MM-DD

Responde SIEMPRE en JSON válido con esta estructura exacta:
{
  "cifProveedor": string | null,
  "nombreProveedor": string | null,
  "numeroDocumento": string | null,
  "fecha": string | null,
  "lineas": [
    {
      "codigoProducto": string | null,
      "descripcion": string,
      "cantidad": number,
      "precioUnitario": number,
      "descuento": number | null,
      "iva": number | null,
      "total": number | null
    }
  ],
  "totales": {
    "subtotal": number | null,
    "iva": number | null,
    "total": number | null
  },
  "observaciones": string | null,
  "confianza": "alta" | "media" | "baja",
  "camposNoDetectados": string[]
}`;

/**
 * Procesar documento de compra con OCR
 */
export async function procesarDocumentoCompra(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf',
  empresaId: string,
  dbConfig: IDatabaseConfig
): Promise<OCRResult> {
  const advertencias: string[] = [];

  try {
    // Buscar configuración de IA de la empresa
    const empresa = await Empresa.findById(empresaId).select('+aiConfig.apiKey').lean();
    let aiService;

    if (empresa?.aiConfig?.apiKey) {
      // Usar API key de la empresa (desencriptada)
      const apiKey = decrypt(empresa.aiConfig.apiKey);
      const provider = empresa.aiConfig.provider || 'gemini';
      const model = empresa.aiConfig.model || 'gemini-2.0-flash';
      aiService = createAIServiceWithConfig(provider, apiKey, model);
    } else {
      // Usar servicio global (API key del .env)
      aiService = getAIService();
    }

    // Verificar que el servicio esté disponible
    const disponible = await aiService.isAvailable();
    if (!disponible) {
      return {
        success: false,
        datos: null,
        productosEncontrados: [],
        productosNoEncontrados: [],
        advertencias: [],
        error: 'El servicio de IA no está disponible. Verifica tu API key en los ajustes de la empresa.',
      };
    }

    // Crear mensaje con imagen
    const message: AIMessageWithImage = {
      role: 'user',
      content: `Analiza este documento de compra (albarán o factura de proveedor) y extrae toda la información.
Presta especial atención a:
1. El CIF/NIF del proveedor (normalmente en la cabecera, junto al nombre de la empresa que emite)
2. El número de albarán o factura
3. La fecha del documento
4. TODAS las líneas de productos con sus códigos, descripciones, cantidades y precios
5. Los totales del documento

Responde SOLO con el JSON estructurado.`,
      images: [{ base64: imageBase64, mimeType }],
    };

    // Obtener el proveedor interno para acceder a completeWithImage
    const provider = (aiService as any).provider;
    if (!provider.completeWithImage) {
      return {
        success: false,
        datos: null,
        productosEncontrados: [],
        productosNoEncontrados: [],
        advertencias: [],
        error: 'El proveedor de IA no soporta procesamiento de imágenes',
      };
    }

    // Procesar imagen con IA
    const response = await provider.completeWithImage(message, SYSTEM_PROMPT, {
      temperature: 0.1,
      maxTokens: 4096,
    });

    // Parsear respuesta JSON
    let jsonStr = response.content.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

    const datos: DocumentoCompraExtraido = JSON.parse(jsonStr.trim());

    // Obtener modelos usando databaseManager
    const ProveedorModel = await databaseManager.getModel<any>(empresaId, dbConfig, 'Proveedor');
    const ProductoModel = await databaseManager.getModel<any>(empresaId, dbConfig, 'Producto');

    // Buscar proveedor por CIF
    let proveedorEncontrado = null;
    if (datos.cifProveedor) {
      const cifNormalizado = datos.cifProveedor.replace(/[\s\-\.]/g, '').toUpperCase();

      const proveedor = await ProveedorModel.findOne({
        $or: [
          { cif: cifNormalizado },
          { cif: datos.cifProveedor },
          { nif: cifNormalizado },
          { nif: datos.cifProveedor },
        ],
        activo: true,
      }).lean();

      if (proveedor) {
        proveedorEncontrado = {
          _id: (proveedor as any)._id.toString(),
          nombre: (proveedor as any).nombre,
          cif: (proveedor as any).cif || (proveedor as any).nif,
        };
      } else {
        advertencias.push(`Proveedor con CIF ${datos.cifProveedor} no encontrado en la base de datos`);
      }
    } else {
      advertencias.push('No se pudo detectar el CIF del proveedor en el documento');
    }

    // Buscar productos por referencia del proveedor
    const productosEncontrados: OCRResult['productosEncontrados'] = [];
    const productosNoEncontrados: OCRResult['productosNoEncontrados'] = [];

    if (datos.lineas && datos.lineas.length > 0) {
      for (let i = 0; i < datos.lineas.length; i++) {
        const linea = datos.lineas[i];

        if (linea.codigoProducto) {
          // Buscar producto por referenciaProveedor
          const producto = await ProductoModel.findOne({
            referenciaProveedor: linea.codigoProducto,
            activo: true,
          }).lean();

          if (producto) {
            productosEncontrados.push({
              lineaIndex: i,
              codigoProveedor: linea.codigoProducto,
              productoId: (producto as any)._id.toString(),
              nombre: (producto as any).nombre,
              sku: (producto as any).sku || '',
              precioCompra: (producto as any).precioCompra || linea.precioUnitario,
            });
          } else {
            productosNoEncontrados.push({
              lineaIndex: i,
              codigoProveedor: linea.codigoProducto,
              descripcion: linea.descripcion,
            });
          }
        } else {
          // Sin código, intentar buscar por descripción
          productosNoEncontrados.push({
            lineaIndex: i,
            codigoProveedor: '',
            descripcion: linea.descripcion,
          });
        }
      }
    }

    // Generar advertencias adicionales
    if (productosNoEncontrados.length > 0) {
      advertencias.push(
        `${productosNoEncontrados.length} producto(s) no encontrados por referencia del proveedor`
      );
    }

    if (!datos.fecha) {
      advertencias.push('No se detectó la fecha del documento');
    }

    if (!datos.numeroDocumento) {
      advertencias.push('No se detectó el número de documento');
    }

    return {
      success: true,
      datos,
      proveedorEncontrado,
      productosEncontrados,
      productosNoEncontrados,
      advertencias,
    };
  } catch (error: any) {
    console.error('Error procesando documento OCR:', error);

    // Detectar tipo de error para mensaje amigable
    let errorMessage = error.message || 'Error procesando el documento';
    let errorCode = 'ERROR';

    if (errorMessage.startsWith('QUOTA_EXCEEDED:')) {
      errorCode = 'QUOTA_EXCEEDED';
      errorMessage = errorMessage.replace('QUOTA_EXCEEDED:', '');
    } else if (errorMessage.includes('API key')) {
      errorCode = 'API_KEY_ERROR';
      errorMessage = 'API key de IA no configurada o inválida. Configura una API key en los ajustes de la empresa.';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      errorCode = 'NETWORK_ERROR';
      errorMessage = 'Error de conexión con el servicio de IA. Inténtalo de nuevo.';
    }

    return {
      success: false,
      datos: null,
      productosEncontrados: [],
      productosNoEncontrados: [],
      advertencias,
      error: errorMessage,
      errorCode,
    };
  }
}

/**
 * Buscar productos sugeridos por descripción
 * Útil cuando no se encuentra por código del proveedor
 */
export async function buscarProductosPorDescripcion(
  descripcion: string,
  empresaId: string,
  dbConfig: IDatabaseConfig,
  limit: number = 5
): Promise<any[]> {
  const ProductoModel = await databaseManager.getModel<any>(empresaId, dbConfig, 'Producto');

  // Buscar por texto en nombre y descripción
  const productos = await ProductoModel.find({
    activo: true,
    $or: [
      { nombre: { $regex: descripcion, $options: 'i' } },
      { descripcion: { $regex: descripcion, $options: 'i' } },
      { sku: { $regex: descripcion, $options: 'i' } },
    ],
  })
    .select('_id nombre sku referenciaProveedor precioCompra')
    .limit(limit)
    .lean();

  return productos;
}
