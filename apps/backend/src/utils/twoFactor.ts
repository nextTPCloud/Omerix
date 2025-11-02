import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import twilio from 'twilio';

const APP_NAME = process.env.APP_NAME || 'Omerix ERP';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// ============================================
// VALIDAR CREDENCIALES DE TWILIO
// ============================================

const isTwilioConfigured = (): boolean => {
  // Verificar que las credenciales existen y son válidas
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return false;
  }
  
  // Verificar que no sean los valores de placeholder del .env
  if (
    TWILIO_ACCOUNT_SID === 'tu_account_sid_aqui' ||
    TWILIO_AUTH_TOKEN === 'tu_auth_token_aqui' ||
    TWILIO_PHONE_NUMBER === '+1234567890' ||
    !TWILIO_ACCOUNT_SID.startsWith('AC') // Los Account SID de Twilio empiezan con "AC"
  ) {
    return false;
  }
  
  return true;
};

// Cliente Twilio (inicializar solo si están configuradas las credenciales VÁLIDAS)
let twilioClient: any = null;

if (isTwilioConfigured()) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);
    console.log('✅ Twilio configurado correctamente');
  } catch (error) {
    console.warn('⚠️ Error inicializando Twilio:', error);
    twilioClient = null;
  }
} else {
  console.warn('⚠️ Twilio no configurado. SMS 2FA no estará disponible.');
  console.warn('   Para configurarlo, edita el archivo .env con tus credenciales de Twilio.');
}

// ============================================
// GOOGLE AUTHENTICATOR (TOTP)
// ============================================

// Generar secret para Google Authenticator
export const generateTOTPSecret = (userEmail: string) => {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${userEmail})`,
    length: 32,
  });
  
  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
};

// Generar QR Code para Google Authenticator
export const generateQRCode = async (otpauthUrl: string): Promise<string> => {
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generando QR:', error);
    throw new Error('Error generando código QR');
  }
};

// Verificar código TOTP (Google Authenticator)
export const verifyTOTP = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Permite 2 períodos de tiempo (60 segundos antes/después)
  });
};

// ============================================
// SMS (Twilio)
// ============================================

// Generar código de 6 dígitos para SMS
export const generateSMSCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Enviar código por SMS
export const sendSMSCode = async (
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; message: string }> => {
  if (!twilioClient) {
    console.warn('⚠️ Twilio no configurado. Código generado:', code);
    
    // En desarrollo, devolver éxito con el código en el mensaje
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        message: `[DESARROLLO] Código SMS: ${code} (Twilio no configurado)`,
      };
    }
    
    return {
      success: false,
      message: 'Servicio de SMS no configurado. Contacte al administrador.',
    };
  }
  
  try {
    await twilioClient.messages.create({
      body: `Tu código de verificación de ${APP_NAME} es: ${code}. Válido por 5 minutos.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    
    return {
      success: true,
      message: 'Código enviado por SMS',
    };
  } catch (error: any) {
    console.error('Error enviando SMS:', error);
    return {
      success: false,
      message: 'Error enviando SMS: ' + error.message,
    };
  }
};

// Almacenar códigos SMS temporalmente (en producción usar Redis)
const smsCodesStore = new Map<string, { code: string; expiresAt: number }>();

// Guardar código SMS temporal
export const storeSMSCode = (userId: string, code: string): void => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos
  smsCodesStore.set(userId, { code, expiresAt });
  
  // Limpiar código después de 5 minutos
  setTimeout(() => {
    smsCodesStore.delete(userId);
  }, 5 * 60 * 1000);
};

// Verificar código SMS
export const verifySMSCode = (userId: string, code: string): boolean => {
  const stored = smsCodesStore.get(userId);
  
  if (!stored) {
    return false;
  }
  
  if (Date.now() > stored.expiresAt) {
    smsCodesStore.delete(userId);
    return false;
  }
  
  if (stored.code === code) {
    smsCodesStore.delete(userId);
    return true;
  }
  
  return false;
};