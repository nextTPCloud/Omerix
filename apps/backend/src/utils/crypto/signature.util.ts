// backend/src/utils/crypto/signature.util.ts

import crypto from 'crypto';
import { generateHash } from './hash.util';

/**
 * Secret para firma digital
 * En producción debe estar en variable de entorno
 */
const SIGNATURE_SECRET = process.env.SIGNATURE_SECRET || 'omerix-fiscal-secret-2025';

/**
 * Genera una firma digital completa para un documento fiscal
 * Incluye: hash, timestamp, empresa, y firma HMAC
 */
export const signFiscalDocument = (documentData: {
  empresaId: string;
  documentoTipo: string;
  numeroDocumento: string;
  serie?: string;
  importe: number;
  iva: number;
  total: number;
  timestamp?: Date | string;
}): {
  hash: string;
  firma: string;
  timestamp: string;
} => {
  try {
    const timestamp = documentData.timestamp 
      ? new Date(documentData.timestamp).toISOString()
      : new Date().toISOString();

    // Generar hash del documento
    const hash = generateHash({
      ...documentData,
      timestamp,
    });

    // Generar firma HMAC del hash
    const firma = crypto
      .createHmac('sha256', SIGNATURE_SECRET)
      .update(`${hash}:${timestamp}:${documentData.empresaId}`)
      .digest('hex');

    return {
      hash,
      firma,
      timestamp,
    };
  } catch (error) {
    console.error('Error firmando documento:', error);
    throw new Error('Error al firmar documento fiscal');
  }
};

/**
 * Verifica la firma digital de un documento fiscal
 */
export const verifyFiscalSignature = (
  documentData: any,
  storedHash: string,
  storedSignature: string,
  timestamp: string
): {
  isValid: boolean;
  message: string;
} => {
  try {
    // Recalcular firma
    const expectedSignature = crypto
      .createHmac('sha256', SIGNATURE_SECRET)
      .update(`${storedHash}:${timestamp}:${documentData.empresaId}`)
      .digest('hex');

    if (expectedSignature !== storedSignature) {
      return {
        isValid: false,
        message: 'Firma digital inválida: el documento ha sido alterado',
      };
    }

    return {
      isValid: true,
      message: 'Firma digital válida',
    };
  } catch (error: any) {
    return {
      isValid: false,
      message: `Error verificando firma: ${error.message}`,
    };
  }
};

/**
 * Genera firma para TicketBAI (País Vasco)
 * Formato específico según normativa TicketBAI
 */
export const generateTicketBAISignature = (ticketData: {
  tbaiId: string;
  empresaNIF: string;
  serie: string;
  numero: string;
  fecha: Date | string;
  importe: number;
}): {
  firma: string;
  qr: string;
} => {
  try {
    // Firma TicketBAI: hash de campos clave
    const signatureData = `TBAI:${ticketData.tbaiId}:${ticketData.empresaNIF}:${ticketData.serie}:${ticketData.numero}`;
    
    const firma = crypto
      .createHmac('sha256', SIGNATURE_SECRET)
      .update(signatureData)
      .digest('base64');

    // QR Code data (formato TicketBAI)
    const qrData = `TBAI1:${ticketData.tbaiId}:${firma.substring(0, 32)}`;
    const qr = Buffer.from(qrData).toString('base64');

    return {
      firma: firma.substring(0, 100), // Limitar longitud
      qr,
    };
  } catch (error) {
    console.error('Error generando firma TicketBAI:', error);
    throw new Error('Error al generar firma TicketBAI');
  }
};

/**
 * Genera firma para Verifactu (Sistema nacional)
 * Formato según normativa Verifactu
 */
export const generateVerifactuSignature = (facturaData: {
  idFactura: string;
  empresaNIF: string;
  fechaExpedicion: Date | string;
  importe: number;
  numeroFactura: string;
}): {
  hash: string;
  firma: string;
  huella: string;
} => {
  try {
    const fechaISO = new Date(facturaData.fechaExpedicion).toISOString();
    
    // Hash Verifactu
    const hashData = {
      idFactura: facturaData.idFactura,
      nif: facturaData.empresaNIF,
      fecha: fechaISO,
      numero: facturaData.numeroFactura,
      importe: facturaData.importe,
    };
    
    const hash = generateHash(hashData);

    // Firma Verifactu
    const firma = crypto
      .createHmac('sha256', SIGNATURE_SECRET)
      .update(`VF:${hash}:${facturaData.empresaNIF}`)
      .digest('hex');

    // Huella digital (primeros 16 caracteres del hash)
    const huella = hash.substring(0, 16).toUpperCase();

    return {
      hash,
      firma: firma.substring(0, 64),
      huella,
    };
  } catch (error) {
    console.error('Error generando firma Verifactu:', error);
    throw new Error('Error al generar firma Verifactu');
  }
};

/**
 * Genera un identificador único para documentos fiscales
 * Formato: TIPO-YYYYMMDD-SERIE-NUMERO-HASH
 */
export const generateFiscalDocumentId = (
  tipo: string,
  serie: string,
  numero: string,
  empresaId: string
): string => {
  try {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    
    const hash = generateHash({
      tipo,
      serie,
      numero,
      empresaId,
      timestamp: date.getTime(),
    });
    
    const shortHash = hash.substring(0, 8).toUpperCase();
    
    return `${tipo.toUpperCase()}-${dateStr}-${serie}-${numero}-${shortHash}`;
  } catch (error) {
    console.error('Error generando ID de documento:', error);
    throw new Error('Error al generar ID de documento fiscal');
  }
};

/**
 * Valida el formato de un ID de documento fiscal
 */
export const validateFiscalDocumentId = (documentId: string): {
  isValid: boolean;
  parts?: {
    tipo: string;
    fecha: string;
    serie: string;
    numero: string;
    hash: string;
  };
  message: string;
} => {
  try {
    const pattern = /^([A-Z]+)-(\d{8})-([A-Z0-9]+)-(\d+)-([A-F0-9]{8})$/;
    const match = documentId.match(pattern);

    if (!match) {
      return {
        isValid: false,
        message: 'Formato de ID de documento inválido',
      };
    }

    return {
      isValid: true,
      parts: {
        tipo: match[1],
        fecha: match[2],
        serie: match[3],
        numero: match[4],
        hash: match[5],
      },
      message: 'ID válido',
    };
  } catch (error: any) {
    return {
      isValid: false,
      message: `Error validando ID: ${error.message}`,
    };
  }
};

/**
 * Genera código de verificación para impresión en documentos
 * Formato legible: XXXX-XXXX-XXXX
 */
export const generateVerificationCode = (documentData: any): string => {
  try {
    const hash = generateHash(documentData);
    const code = hash.substring(0, 12).toUpperCase();
    return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
  } catch (error) {
    console.error('Error generando código de verificación:', error);
    throw new Error('Error al generar código de verificación');
  }
};

/**
 * Genera token temporal para operaciones sensibles
 * Expira en X minutos
 */
export const generateTemporaryToken = (
  data: any,
  expiresInMinutes: number = 15
): {
  token: string;
  expiresAt: Date;
} => {
  try {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    const tokenData = {
      ...data,
      expiresAt: expiresAt.toISOString(),
    };
    
    const token = crypto
      .createHmac('sha256', SIGNATURE_SECRET)
      .update(JSON.stringify(tokenData))
      .digest('hex');

    return {
      token,
      expiresAt,
    };
  } catch (error) {
    console.error('Error generando token temporal:', error);
    throw new Error('Error al generar token temporal');
  }
};

/**
 * Verifica un token temporal
 */
export const verifyTemporaryToken = (
  data: any,
  token: string,
  expiresAt: Date
): {
  isValid: boolean;
  message: string;
} => {
  try {
    // Verificar si ha expirado
    if (new Date() > new Date(expiresAt)) {
      return {
        isValid: false,
        message: 'Token expirado',
      };
    }

    // Recalcular token
    const tokenData = {
      ...data,
      expiresAt: new Date(expiresAt).toISOString(),
    };
    
    const expectedToken = crypto
      .createHmac('sha256', SIGNATURE_SECRET)
      .update(JSON.stringify(tokenData))
      .digest('hex');

    if (expectedToken !== token) {
      return {
        isValid: false,
        message: 'Token inválido',
      };
    }

    return {
      isValid: true,
      message: 'Token válido',
    };
  } catch (error: any) {
    return {
      isValid: false,
      message: `Error verificando token: ${error.message}`,
    };
  }
};

// ============================================
// EXPORTS
// ============================================

export default {
  signFiscalDocument,
  verifyFiscalSignature,
  generateTicketBAISignature,
  generateVerifactuSignature,
  generateFiscalDocumentId,
  validateFiscalDocumentId,
  generateVerificationCode,
  generateTemporaryToken,
  verifyTemporaryToken,
};