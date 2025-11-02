export interface Usuario {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  empresaId: string;
  avatar?: string;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'app' | 'sms' | null;
}

export interface Empresa {
  id: string;
  nombre: string;
  nif: string;
  email: string;
  tipoNegocio: string;
}

export interface LoginResponse {
  success: boolean;
  requires2FA: boolean;
  twoFactorMethod?: 'app' | 'sms';
  userId?: string;
  message?: string;
  data?: {
    usuario: Usuario;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterData {
  nombreEmpresa: string;
  nifEmpresa: string;
  emailEmpresa: string;
  tipoNegocio?: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface Verify2FAData {
  userId: string;
  code: string;
}