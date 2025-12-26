// apps/backend/src/modules/auth/auth.dto.ts

import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN - REGISTRO
// ============================================

export const RegisterSchema = z.object({
  // Datos de la empresa
  nombreEmpresa: z.string()
    .min(2, 'El nombre de la empresa debe tener al menos 2 caracteres')
    .max(100, 'El nombre de la empresa no puede exceder 100 caracteres'),

  nombreComercialEmpresa: z.string()
    .max(100, 'El nombre comercial no puede exceder 100 caracteres')
    .optional(),

  nifEmpresa: z.string()
    .min(9, 'NIF inválido')
    .max(15, 'NIF inválido')
    .transform(val => val.toUpperCase()),

  emailEmpresa: z.string()
    .email('Email de empresa inválido')
    .toLowerCase(),

  telefonoEmpresa: z.string()
    .min(9, 'Teléfono de empresa inválido')
    .optional(),

  tipoNegocio: z.enum(['retail', 'restauracion', 'taller', 'informatica', 'servicios', 'otro'])
    .default('retail'),

  // Dirección fiscal
  direccion: z.string()
    .min(5, 'Dirección requerida')
    .optional(),

  codigoPostal: z.string()
    .min(4, 'Código postal requerido')
    .optional(),

  ciudad: z.string()
    .min(2, 'Ciudad requerida')
    .optional(),

  provincia: z.string()
    .min(2, 'Provincia requerida')
    .optional(),

  pais: z.string()
    .min(2, 'País requerido')
    .default('España'),

  // Datos del usuario
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),

  apellidos: z.string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(100, 'Los apellidos no pueden exceder 100 caracteres'),

  email: z.string()
    .email('Email inválido')
    .toLowerCase(),

  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),

  telefono: z.string()
    .min(9, 'Teléfono inválido')
    .optional(),

  // Plan seleccionado
  plan: z.string().optional(),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;

// ============================================
// SCHEMAS DE VALIDACIÓN - LOGIN
// ============================================

export const LoginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .toLowerCase(),

  password: z.string()
    .min(1, 'La contraseña es obligatoria'),

  // Opcionales: se agregan desde el controller
  deviceInfo: z.string().optional(),
  ipAddress: z.string().optional(),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

// ============================================
// SCHEMAS DE VALIDACIÓN - 2FA
// ============================================

export const Verify2FASchema = z.object({
  userId: z.string()
    .min(1, 'UserId es obligatorio'),

  code: z.string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe ser numérico'),

  // Opcionales: se agregan desde el controller
  deviceInfo: z.string().optional(),
  ipAddress: z.string().optional(),
});

export type Verify2FADTO = z.infer<typeof Verify2FASchema>;

export const Setup2FAAppSchema = z.object({
  // No requiere body, se usa el userId del token
});

export type Setup2FAAppDTO = z.infer<typeof Setup2FAAppSchema>;

export const Confirm2FAAppSchema = z.object({
  code: z.string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe ser numérico'),
});

export type Confirm2FAAppDTO = z.infer<typeof Confirm2FAAppSchema>;

export const Setup2FASMSSchema = z.object({
  phoneNumber: z.string()
    .regex(/^\+?[0-9]{9,15}$/, 'Número de teléfono inválido')
    .transform(val => val.startsWith('+') ? val : `+34${val}`), // Añadir prefijo español si no existe
});

export type Setup2FASMSDTO = z.infer<typeof Setup2FASMSSchema>;

export const Confirm2FASMSSchema = z.object({
  code: z.string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe ser numérico'),
});

export type Confirm2FASMSDTO = z.infer<typeof Confirm2FASMSSchema>;

export const Disable2FASchema = z.object({
  password: z.string()
    .min(1, 'La contraseña es obligatoria para desactivar 2FA'),
});

export type Disable2FADTO = z.infer<typeof Disable2FASchema>;

export const ResendSMSSchema = z.object({
  userId: z.string()
    .min(1, 'UserId es obligatorio'),
});

export type ResendSMSDTO = z.infer<typeof ResendSMSSchema>;

// ============================================
// SCHEMAS DE RESPUESTA
// ============================================

export const UserResponseSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellidos: z.string(),
  email: z.string().email(),
  rol: z.string(),
  empresaId: z.string(),
  avatar: z.string().optional(),
  twoFactorEnabled: z.boolean().optional(),
  twoFactorMethod: z.enum(['app', 'sms']).nullable().optional(),
  personalId: z.string().optional(), // Vinculación con empleado para fichaje
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

export const EmpresaResponseSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  nif: z.string(),
  email: z.string().email(),
  tipoNegocio: z.string(),
});

export type EmpresaResponse = z.infer<typeof EmpresaResponseSchema>;

// ============================================
// INTERFACES DE RESPUESTA DE API
// ============================================

export interface AuthSuccessResponse {
  success: true;
  message: string;
  data: {
    usuario: UserResponse;
    empresa?: EmpresaResponse;
    accessToken: string;
    refreshToken: string;
  };
}

export interface Auth2FARequiredResponse {
  success: true;
  requires2FA: true;
  twoFactorMethod: 'app' | 'sms' | null;
  userId: string;
  message: string;
}

export interface AuthErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface Setup2FAResponse {
  success: true;
  message: string;
  data: {
    qrCode?: string;
    secret?: string;
    phoneNumber?: string;
  };
}

// ============================================
// REFRESH TOKEN
// ============================================

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token es obligatorio'),
});

export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>;