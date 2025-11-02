import { api } from './api';

export const passwordResetService = {
  // Solicitar reset
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Verificar token
  verifyToken: async (token: string) => {
    const response = await api.get('/auth/verify-reset-token', {
      params: { token },
    });
    return response.data;
  },

  // Restablecer contraseña
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};