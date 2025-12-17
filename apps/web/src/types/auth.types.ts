import { IPermisosEspeciales } from './permissions.types';

export interface Usuario {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  rolId?: string;  // Rol personalizado
  empresaId: string;
  avatar?: string;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'app' | 'sms' | null;
  permisos?: {
    especiales?: Partial<IPermisosEspeciales>;
  };
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
  deviceInfo?: string;
  ipAddress?: string;
}

export interface Verify2FAData {
  userId: string;
  code: string;
  deviceInfo?: string;
  ipAddress?: string;
}