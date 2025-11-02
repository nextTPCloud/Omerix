import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Schema de validación para variables de entorno
 */
const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),

  // Base de datos
  MONGODB_URI: z.string().min(1, 'MONGODB_URI es requerido'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Frontend URL (para CORS)
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // App
  APP_NAME: z.string().default('Omerix ERP'),

  // Twilio (SMS 2FA)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Email (opcional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
});

/**
 * Validar y exportar variables de entorno
 */
const validateEnv = () => {
  try {
    const validated = envSchema.parse(process.env);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Error en variables de entorno:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = validateEnv();

/**
 * Configuración derivada
 */
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  port: parseInt(env.PORT, 10),
  appName: env.APP_NAME,
  
  database: {
    uri: env.MONGODB_URI,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  cors: {
    origin: env.FRONTEND_URL,
  },
  
  sms: {
    enabled: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER,
  },
  
  email: {
    enabled: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : 587,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM || 'noreply@omerix.com',
  },
  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  // PayPal
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    mode: (process.env.PAYPAL_MODE || 'sandbox') as 'sandbox' | 'production',
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
  },

  // Redsys
  redsys: {
    merchantCode: process.env.REDSYS_MERCHANT_CODE || '',
    terminal: process.env.REDSYS_TERMINAL || '1',
    secretKey: process.env.REDSYS_SECRET_KEY || '',
    environment: (process.env.REDSYS_ENVIRONMENT || 'test') as 'test' | 'production',
  },
};

export default config;