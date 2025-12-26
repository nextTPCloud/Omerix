import { UserRole, TwoFactorMethod } from './enums';

/**
 * ============================================
 * INTERFACES COMPARTIDAS - TRALOK ERP
 * ============================================
 */

/**
 * Respuesta API estandarizada
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Error de validación
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Paginación
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Respuesta paginada
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

/**
 * Query params para paginación
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filtros de fecha
 */
export interface DateFilter {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Dirección
 */
export interface Address {
  calle: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  pais?: string;
}

/**
 * Token de sesión
 */
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Datos de login
 */
export interface LoginData {
  user?: {
    id: string;
    email: string;
    nombre: string;
    apellidos: string;
    rol: UserRole;
    empresaId: string;
  };
  tokens?: SessionTokens;
  require2FA?: boolean;
  twoFactorMethod?: TwoFactorMethod;
  userId?: string;
}

/**
 * Preferencias de usuario
 */
export interface UserPreferences {
  idioma: string;
  tema: 'light' | 'dark';
  notificaciones: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

/**
 * Log de cambios
 */
export interface ChangeLog {
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: Date;
}

