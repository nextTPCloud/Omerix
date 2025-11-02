// apps/backend/src/modules/auth/auth.controller.ts

import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,  // ← AÑADIR ESTO
  Verify2FASchema,
  Confirm2FAAppSchema,
  Setup2FASMSSchema,
  Confirm2FASMSSchema,
  Disable2FASchema,
  ResendSMSSchema,
  RegisterDTO,
  LoginDTO,
  Verify2FADTO,
  Confirm2FAAppDTO,
  Setup2FASMSDTO,
  Confirm2FASMSDTO,
  Disable2FADTO,
  ResendSMSDTO,
  AuthSuccessResponse,
  Auth2FARequiredResponse,
  AuthErrorResponse,
  RefreshTokenDTO,
} from './auth.dto';

const authService = new AuthService();

// ============================================
// HELPER DE VALIDACIÓN CON TIPOS GENÉRICOS
// ============================================

interface ValidationSuccess<T> {
  success: true;
  data: T;
}

interface ValidationError {
  success: false;
  errors: Array<{ field: string; message: string }>;
}

type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

const validateRequest = <T>(schema: any, data: any): ValidationResult<T> => {
  try {
    const validatedData = schema.parse(data) as T;
    return { success: true, data: validatedData };
  } catch (error: any) {
    return {
      success: false,
      errors: error.errors?.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [{ field: 'unknown', message: error.message }],
    };
  }
};

// ============================================
// REGISTRO
// ============================================

export const register = async (req: Request, res: Response) => {
  try {
    // Validar
    const validation = validateRequest<RegisterDTO>(RegisterSchema, req.body);
    
    if (!validation.success) {
      const response: AuthErrorResponse = {
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      };
      return res.status(400).json(response);
    }

    // Ejecutar lógica de negocio
    const result = await authService.register(validation.data);

    // Responder
    const response: AuthSuccessResponse = {
      success: true,
      message: 'Registro exitoso',
      data: result,
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error en registro:', error);
    
    const response: AuthErrorResponse = {
      success: false,
      message: error.message || 'Error en el registro',
    };

    res.status(500).json(response);
  }
};

// ============================================
// LOGIN
// ============================================

export const login = async (req: Request, res: Response) => {
  try {
    // Validar
    const validation = validateRequest<LoginDTO>(LoginSchema, req.body);
    
    if (!validation.success) {
      const response: AuthErrorResponse = {
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      };
      return res.status(400).json(response);
    }

    // Ejecutar lógica de negocio
    const result = await authService.login(validation.data);

    // Si requiere 2FA
    if (result.requires2FA) {
      // Validar que twoFactorMethod esté definido
      if (!result.twoFactorMethod) {
        return res.status(500).json({
          success: false,
          message: '2FA está activado pero el método no está configurado correctamente',
        });
      }

      const response: Auth2FARequiredResponse = {
        success: true,
        requires2FA: true,
        twoFactorMethod: result.twoFactorMethod,  // ← Ahora TypeScript sabe que NO es null
        userId: result.userId!,
        message: 'Verificación de dos factores requerida',
      };
      return res.json(response);
    }

    // Login exitoso sin 2FA
    const response: AuthSuccessResponse = {
      success: true,
      message: 'Login exitoso',
      data: {
        usuario: result.usuario!,
        accessToken: result.accessToken!,
        refreshToken: result.refreshToken!,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error en login:', error);
    
    const response: AuthErrorResponse = {
      success: false,
      message: error.message || 'Error en el login',
    };

    const statusCode = error.message === 'Credenciales inválidas' ? 401 : 500;
    res.status(statusCode).json(response);
  }
};

// ============================================
// REFRESH TOKEN
// ============================================

export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Validar
    const validation = validateRequest<RefreshTokenDTO>(RefreshTokenSchema, req.body);
    
    if (!validation.success) {
      const response: AuthErrorResponse = {
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      };
      return res.status(400).json(response);
    }

    // Ejecutar lógica de negocio
    const result = await authService.refreshToken(validation.data.refreshToken);

    // Responder
    res.json({
      success: true,
      message: 'Token refrescado exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error refrescando token:', error);
    
    const statusCode = error.message.includes('inválido') || error.message.includes('expirado') ? 401 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error refrescando token',
    });
  }
};
// ============================================
// FORGOT PASSWORD
// ============================================

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    // Importar DTOs
    const { ForgotPasswordSchema } = require('./password-reset.dto');
    
    // Validar
    const validation = validateRequest<any>(ForgotPasswordSchema, req.body);
    
    if (!validation.success) {
      const response: AuthErrorResponse = {
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      };
      return res.status(400).json(response);
    }

    // Ejecutar lógica de negocio
    const result = await authService.forgotPassword(validation.data.email);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error en forgot password:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error procesando solicitud',
    });
  }
};

// ============================================
// VERIFY RESET TOKEN
// ============================================

export const verifyResetToken = async (req: Request, res: Response) => {
  try {
    // Importar DTOs
    const { VerifyResetTokenSchema } = require('./password-reset.dto');
    
    // Validar
    const validation = validateRequest<any>(VerifyResetTokenSchema, req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Token requerido',
        errors: validation.errors,
      });
    }

    // Ejecutar lógica de negocio
    const result = await authService.verifyResetToken(validation.data.token);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error verificando token:', error);
    
    const statusCode = error.message === 'Token inválido o expirado' ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error verificando token',
    });
  }
};

// ============================================
// RESET PASSWORD
// ============================================

export const resetPassword = async (req: Request, res: Response) => {
  try {
    // Importar DTOs
    const { ResetPasswordSchema } = require('./password-reset.dto');
    
    // Validar
    const validation = validateRequest<any>(ResetPasswordSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    // Ejecutar lógica de negocio
    const result = await authService.resetPassword(
      validation.data.token,
      validation.data.newPassword
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error reseteando contraseña:', error);
    
    const statusCode = error.message === 'Token inválido o expirado' ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error actualizando contraseña',
    });
  }
};

// ============================================
// VERIFICAR 2FA
// ============================================

export const verify2FA = async (req: Request, res: Response) => {
  try {
    // Validar
    const validation = validateRequest<Verify2FADTO>(Verify2FASchema, req.body);
    
    if (!validation.success) {
      const response: AuthErrorResponse = {
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      };
      return res.status(400).json(response);
    }

    // Ejecutar lógica de negocio
    const result = await authService.verify2FA(validation.data);

    // Responder
    const response: AuthSuccessResponse = {
      success: true,
      message: 'Verificación 2FA exitosa',
      data: result,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error verificando 2FA:', error);
    
    const response: AuthErrorResponse = {
      success: false,
      message: error.message || 'Error verificando código 2FA',
    };

    const statusCode = error.message === 'Código 2FA inválido o expirado' ? 401 : 500;
    res.status(statusCode).json(response);
  }
};

// ============================================
// GET ME (Usuario actual)
// ============================================

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const usuario = await authService.getUserById(userId);

    res.json({
      success: true,
      data: { usuario },
    });
  } catch (error: any) {
    console.error('Error obteniendo usuario:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo usuario',
    });
  }
};

// ============================================
// SETUP 2FA - GOOGLE AUTHENTICATOR
// ============================================

export const setup2FAApp = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const result = await authService.setup2FAApp(userId);

    res.json({
      success: true,
      message: 'Escanea el código QR con Google Authenticator',
      data: result,
    });
  } catch (error: any) {
    console.error('Error configurando 2FA App:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error configurando 2FA',
    });
  }
};

// ============================================
// CONFIRMAR 2FA - GOOGLE AUTHENTICATOR
// ============================================

export const confirm2FAApp = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Validar
    const validation = validateRequest<Confirm2FAAppDTO>(Confirm2FAAppSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    await authService.confirm2FAApp(userId, validation.data.code);

    res.json({
      success: true,
      message: '2FA activado exitosamente',
    });
  } catch (error: any) {
    console.error('Error confirmando 2FA:', error);
    
    const statusCode = error.message === 'Código inválido. Intenta de nuevo.' ? 401 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error confirmando 2FA',
    });
  }
};

// ============================================
// SETUP 2FA - SMS
// ============================================

export const setup2FASMS = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Validar
    const validation = validateRequest<Setup2FASMSDTO>(Setup2FASMSSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const result = await authService.setup2FASMS(userId, validation.data);

    res.json({
      success: true,
      message: result.message,
      data: {
        phoneNumber: result.phoneNumber,
      },
    });
  } catch (error: any) {
    console.error('Error configurando 2FA SMS:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error configurando 2FA SMS',
    });
  }
};

// ============================================
// CONFIRMAR 2FA - SMS
// ============================================

export const confirm2FASMS = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Validar
    const validation = validateRequest<Confirm2FASMSDTO>(Confirm2FASMSSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    await authService.confirm2FASMS(userId, validation.data.code);

    res.json({
      success: true,
      message: '2FA SMS activado exitosamente',
    });
  } catch (error: any) {
    console.error('Error confirmando 2FA SMS:', error);
    
    const statusCode = error.message === 'Código inválido o expirado' ? 401 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error confirmando 2FA SMS',
    });
  }
};

// ============================================
// DESACTIVAR 2FA
// ============================================

export const disable2FA = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Validar
    const validation = validateRequest<Disable2FADTO>(Disable2FASchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    await authService.disable2FA(userId, validation.data.password);

    res.json({
      success: true,
      message: '2FA desactivado exitosamente',
    });
  } catch (error: any) {
    console.error('Error desactivando 2FA:', error);
    
    const statusCode = error.message === 'Contraseña incorrecta' ? 401 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error desactivando 2FA',
    });
  }
};

// ============================================
// REENVIAR CÓDIGO SMS
// ============================================

export const resendSMSCode = async (req: Request, res: Response) => {
  try {
    // Validar
    const validation = validateRequest<ResendSMSDTO>(ResendSMSSchema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    await authService.resendSMSCode(validation.data.userId);

    res.json({
      success: true,
      message: 'Código reenviado',
    });
  } catch (error: any) {
    console.error('Error reenviando SMS:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error reenviando código',
    });
  }
};