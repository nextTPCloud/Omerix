import { api } from './api';

// ============================================
// INTERFACES
// ============================================

// Cuenta bancaria de la empresa
export interface CuentaBancariaEmpresa {
  _id?: string;
  alias?: string;
  titular: string;
  iban: string;
  swift?: string;
  banco?: string;
  sucursal?: string;
  predeterminada: boolean;
  activa: boolean;
}

// Textos legales configurables
export interface TextosLegales {
  // Para presupuestos
  presupuestoIntroduccion?: string;
  presupuestoPiePagina?: string;
  presupuestoCondiciones?: string;
  // Para facturas
  facturaIntroduccion?: string;
  facturaPiePagina?: string;
  facturaCondiciones?: string;
  // Para emails
  emailFirma?: string;
  emailDisclaimer?: string;
  // LOPD / RGPD
  textoLOPD?: string;
  textoRGPD?: string;
  // Política de privacidad, cookies, etc.
  politicaPrivacidad?: string;
  condicionesVenta?: string;
}

// Datos de registro mercantil
export interface DatosRegistro {
  registroMercantil?: string;
  tomo?: string;
  libro?: string;
  folio?: string;
  seccion?: string;
  hoja?: string;
  inscripcion?: string;
}

// Información principal de la empresa
export interface EmpresaInfo {
  _id: string;
  nombre: string;
  nombreComercial?: string;
  nif: string;
  email: string;
  telefono?: string;
  movil?: string;
  fax?: string;
  web?: string;
  logo?: string;
  direccion?: {
    calle: string;
    numero?: string;
    piso?: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
    pais: string;
  };
  tipoNegocio: string;
  // Datos de registro mercantil
  datosRegistro?: DatosRegistro;
  // Cuentas bancarias
  cuentasBancarias?: CuentaBancariaEmpresa[];
  // Textos legales
  textosLegales?: TextosLegales;
  // Series de documentos
  seriesDocumentos?: {
    presupuestos?: string;
    pedidos?: string;
    albaranes?: string;
    facturas?: string;
    facturasRectificativas?: string;
  };
  // Configuración de numeración
  numeracion?: {
    presupuestoActual?: number;
    pedidoActual?: number;
    albaranActual?: number;
    facturaActual?: number;
    facturaRectificativaActual?: number;
    reiniciarAnualmente?: boolean;
  };
  // Moneda y formato
  moneda?: string;
  formatoFecha?: string;
  formatoNumero?: string;
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
   * Alias de getMiEmpresa para compatibilidad con código existente
   */
  getInfo: async (): Promise<EmpresaInfo | undefined> => {
    try {
      const response = await api.get('/empresa/mi-empresa');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return undefined;
    } catch (error) {
      console.error('Error obteniendo info empresa:', error);
      return undefined;
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
