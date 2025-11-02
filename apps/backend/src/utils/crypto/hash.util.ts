// backend/src/utils/crypto/hash.util.ts

import crypto from 'crypto';

/**
 * Genera un hash SHA-256 de un objeto o string
 * Usado para crear cadenas inmutables tipo blockchain
 */
export const generateHash = (data: any): string => {
  try {
    // Convertir objeto a string JSON ordenado (para consistencia)
    const dataString = typeof data === 'string' 
      ? data 
      : JSON.stringify(sortObjectKeys(data));
    
    // Generar hash SHA-256
    return crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex');
  } catch (error) {
    console.error('Error generando hash:', error);
    throw new Error('Error al generar hash del documento');
  }
};

/**
 * Genera un hash de un documento fiscal completo
 * Incluye todos los campos relevantes para garantizar integridad
 */
export const generateDocumentHash = (documentData: {
  empresaId: string;
  documentoTipo: string;
  numeroDocumento: string;
  serie?: string;
  importe: number;
  iva: number;
  total: number;
  timestamp: Date | string;
  hashAnterior?: string;
}): string => {
  try {
    // Crear objeto con campos en orden determinista
    const hashObject = {
      empresaId: documentData.empresaId.toString(),
      documentoTipo: documentData.documentoTipo,
      numeroDocumento: documentData.numeroDocumento,
      serie: documentData.serie || '',
      importe: documentData.importe,
      iva: documentData.iva,
      total: documentData.total,
      timestamp: new Date(documentData.timestamp).toISOString(),
      hashAnterior: documentData.hashAnterior || 'GENESIS',
    };
    
    return generateHash(hashObject);
  } catch (error) {
    console.error('Error generando hash de documento:', error);
    throw new Error('Error al generar hash del documento fiscal');
  }
};

/**
 * Verifica la integridad de un documento comparando su hash
 */
export const verifyDocumentHash = (
  documentData: any,
  storedHash: string
): boolean => {
  try {
    const calculatedHash = generateDocumentHash(documentData);
    return calculatedHash === storedHash;
  } catch (error) {
    console.error('Error verificando hash:', error);
    return false;
  }
};

/**
 * Verifica la integridad de una cadena de documentos (blockchain)
 * Comprueba que cada hash coincida con el hashAnterior del siguiente
 */
export const verifyHashChain = (documents: any[]): {
  isValid: boolean;
  brokenAt?: number;
  message: string;
} => {
  try {
    if (documents.length === 0) {
      return { isValid: true, message: 'No hay documentos para verificar' };
    }

    // Ordenar documentos por fecha
    const sortedDocs = [...documents].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 0; i < sortedDocs.length; i++) {
      const doc = sortedDocs[i];
      
      // Verificar hash del documento actual
      const isHashValid = verifyDocumentHash(doc, doc.hash);
      if (!isHashValid) {
        return {
          isValid: false,
          brokenAt: i,
          message: `Hash inválido en documento ${i + 1}: ${doc.numeroDocumento}`,
        };
      }

      // Verificar encadenamiento (excepto el primero)
      if (i > 0) {
        const previousDoc = sortedDocs[i - 1];
        if (doc.hashAnterior !== previousDoc.hash) {
          return {
            isValid: false,
            brokenAt: i,
            message: `Cadena rota entre documento ${i} y ${i + 1}`,
          };
        }
      } else {
        // El primer documento debe tener hashAnterior = null o 'GENESIS'
        if (doc.hashAnterior && doc.hashAnterior !== 'GENESIS') {
          return {
            isValid: false,
            brokenAt: 0,
            message: 'El primer documento debe tener hashAnterior nulo o GENESIS',
          };
        }
      }
    }

    return {
      isValid: true,
      message: `Cadena válida: ${sortedDocs.length} documentos verificados`,
    };
  } catch (error: any) {
    return {
      isValid: false,
      message: `Error verificando cadena: ${error.message}`,
    };
  }
};

/**
 * Genera un hash corto (8 caracteres) para identificadores legibles
 */
export const generateShortHash = (data: any): string => {
  const fullHash = generateHash(data);
  return fullHash.substring(0, 8).toUpperCase();
};

/**
 * Genera un hash con timestamp incluido
 * Útil para identificadores únicos basados en tiempo
 */
export const generateTimestampHash = (data: any): string => {
  const timestamp = Date.now();
  const dataWithTimestamp = {
    ...data,
    _timestamp: timestamp,
  };
  return generateHash(dataWithTimestamp);
};

/**
 * Ordena las claves de un objeto recursivamente
 * Garantiza que el mismo objeto siempre genere el mismo hash
 */
const sortObjectKeys = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  return Object.keys(obj)
    .sort()
    .reduce((result: any, key) => {
      result[key] = sortObjectKeys(obj[key]);
      return result;
    }, {});
};

/**
 * Genera una firma digital simple basada en hash
 * Para firma avanzada, usar certificados digitales
 */
export const generateSignature = (data: any, secret: string): string => {
  try {
    const dataString = typeof data === 'string' 
      ? data 
      : JSON.stringify(sortObjectKeys(data));
    
    return crypto
      .createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');
  } catch (error) {
    console.error('Error generando firma:', error);
    throw new Error('Error al generar firma digital');
  }
};

/**
 * Verifica una firma digital
 */
export const verifySignature = (
  data: any,
  signature: string,
  secret: string
): boolean => {
  try {
    const calculatedSignature = generateSignature(data, secret);
    return calculatedSignature === signature;
  } catch (error) {
    console.error('Error verificando firma:', error);
    return false;
  }
};

// ============================================
// EXPORTS
// ============================================

export default {
  generateHash,
  generateDocumentHash,
  verifyDocumentHash,
  verifyHashChain,
  generateShortHash,
  generateTimestampHash,
  generateSignature,
  verifySignature,
};