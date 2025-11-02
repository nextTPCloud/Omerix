import { z } from 'zod';

// Solicitar reset
export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;

// Verificar token
export const VerifyResetTokenSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

export type VerifyResetTokenDTO = z.infer<typeof VerifyResetTokenSchema>;

// Restablecer contraseña
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;