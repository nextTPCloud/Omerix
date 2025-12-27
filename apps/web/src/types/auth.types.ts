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
  personalId?: string;  // Vinculación con empleado para fichaje
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

// Empresa resumida para selección
export interface EmpresaResumen {
  id: string;
  nombre: string;
  nif: string;
  logo?: string;
  rol: string;
  esPrincipal: boolean;
}

export interface LoginResponse {
  success: boolean;
  requires2FA?: boolean;
  requiresEmpresaSelection?: boolean;
  requiresCompanyCreation?: boolean;  // Superadmin sin empresa de negocio
  twoFactorMethod?: 'app' | 'sms';
  userId?: string;
  empresas?: EmpresaResumen[];
  message?: string;
  data?: {
    usuario: Usuario;
    accessToken: string;
    refreshToken: string;
  };
  // Datos cuando requiresCompanyCreation es true
  usuario?: Usuario;
  accessToken?: string;
  refreshToken?: string;
}

export interface SelectEmpresaData {
  userId: string;
  empresaId: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface RegisterData {
  // Datos de la empresa
  nombreEmpresa: string;
  nombreComercialEmpresa?: string;
  nifEmpresa: string;
  emailEmpresa: string;
  telefonoEmpresa: string;
  tipoNegocio?: string;
  // Direccion fiscal
  direccion: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  pais: string;
  // Datos del administrador
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  telefono: string;
  // Plan seleccionado
  plan?: string;
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