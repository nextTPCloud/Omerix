import { api } from './api';

// Tipos
export interface EmpresaInfo {
  _id: string;
  nombre: string;
  nombreComercial?: string;
  nif: string;
  email: string;
  telefono?: string;
  web?: string;
  logo?: string;
  direccion?: {
    calle: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
    pais: string;
  };
  tipoNegocio: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string; // Solo se muestra como ******** o vacío
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Servicio para obtener información de la empresa del usuario actual
 */
export const empresaService = {
  /**
   * Obtener información de la empresa actual del usuario logueado
   */
  getMiEmpresa: async (): Promise<ApiResponse<EmpresaInfo>> => {
    try {
      const response = await api.get('/empresa/mi-empresa');
      return response.data;
    } catch (error) {
      // Si no existe el endpoint, intentamos obtener datos básicos del localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          success: true,
          data: {
            _id: user.empresaId || '',
            nombre: 'Mi Empresa', // Valor por defecto
            nif: '',
            email: user.email || '',
            tipoNegocio: '',
          },
        };
      }
      return { success: false, message: 'No se pudo obtener la información de la empresa' };
    }
  },

  /**
   * Actualizar información de la empresa
   */
  updateInfo: async (data: Partial<EmpresaInfo>): Promise<ApiResponse<EmpresaInfo>> => {
    const response = await api.put('/empresa/mi-empresa', data);
    return response.data;
  },

  /**
   * Actualizar logo de la empresa
   */
  updateLogo: async (file: File): Promise<ApiResponse<{ logoUrl: string }>> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/empresa/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ============================================
  // CONFIGURACIÓN DE EMAIL
  // ============================================

  /**
   * Obtener configuración de email (solo admin/gerente)
   */
  getEmailConfig: async (): Promise<ApiResponse<EmailConfig>> => {
    const response = await api.get('/empresa/email-config');
    return response.data;
  },

  /**
   * Actualizar configuración de email (solo admin/gerente)
   */
  updateEmailConfig: async (config: Partial<EmailConfig>): Promise<ApiResponse<EmpresaInfo>> => {
    const response = await api.put('/empresa/email-config', config);
    return response.data;
  },

  /**
   * Probar configuración de email enviando correo de prueba
   */
  testEmailConfig: async (testEmail: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/empresa/email-config/test', { email: testEmail });
    return response.data;
  },

  // ============================================
  // ENVÍO DE EMAILS
  // ============================================

  /**
   * Enviar email usando la configuración de la empresa
   */
  sendEmail: async (params: SendEmailParams): Promise<ApiResponse<{ messageId?: string }>> => {
    const response = await api.post('/empresa/send-email', params);
    return response.data;
  },
};
