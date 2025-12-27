import axios from 'axios';
import { api } from './api';
import {
  LoginResponse,
  RegisterData,
  LoginData,
  Verify2FAData,
  SelectEmpresaData,
  Usuario,
} from '../types/auth.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Respuesta de verificación de NIF
interface VerificarNIFResponse {
  success: boolean;
  data?: {
    valido: boolean;
    tipo?: string;
    mensaje?: string;
    verificado?: boolean;
    encontrado?: boolean;
    datosOficiales?: any;
    advertencias?: string[];
    errores?: string[];
  };
}

export const authService = {
  // Verificar NIF antes del registro
  verificarNIF: async (nif: string, nombre?: string): Promise<VerificarNIFResponse> => {
    const response = await api.post('/auth/verificar-nif', { nif, nombre });
    return response.data;
  },

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

  // Seleccionar empresa (cuando el usuario tiene acceso a múltiples)
  selectEmpresa: async (data: SelectEmpresaData): Promise<LoginResponse> => {
    const response = await api.post('/auth/select-empresa', data);
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

  // Refresh token (usa axios directo para evitar interceptores circulares)
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> => {
    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    return response.data;
  },

  // Logout (revocar token en servidor)
  logout: async (refreshToken: string): Promise<void> => {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Error al revocar token en servidor:', error);
    } finally {
      // Limpiar localStorage siempre, incluso si falla la revocación
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-storage'); // Store de Zustand
    }
  },

  // Logout local (sin revocar en servidor)
  logoutLocal: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-storage'); // Store de Zustand
  },

  // Obtener sesiones activas
  getActiveSessions: async (): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      deviceInfo: string;
      ipAddress: string;
      createdAt: string;
      expiresAt: string;
    }>;
  }> => {
    const response = await api.get('/auth/sessions');
    return response.data;
  },

  // Cerrar todas las sesiones
  logoutAllSessions: async (): Promise<{
    success: boolean;
    message: string;
    count: number;
  }> => {
    const response = await api.post('/auth/logout-all');
    // Limpiar localStorage también
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return response.data;
  },
};