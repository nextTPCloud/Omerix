import { api } from './api';
import {
  LoginResponse,
  RegisterData,
  LoginData,
  Verify2FAData,
  Usuario,
} from '../types/auth.types';

export const authService = {
  // Registro
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Login
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // Verificar 2FA
  verify2FA: async (data: Verify2FAData): Promise<LoginResponse> => {
    const response = await api.post('/auth/verify-2fa', data);
    return response.data;
  },

  // Reenviar código SMS
  resendSMS: async (userId: string): Promise<any> => {
    const response = await api.post('/auth/resend-sms', { userId });
    return response.data;
  },

  // Obtener usuario actual
  getMe: async (): Promise<Usuario> => {
    const response = await api.get('/auth/me');
    return response.data.data.usuario;
  },

  // Logout (local)
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};