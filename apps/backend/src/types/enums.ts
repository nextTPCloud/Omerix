/**
 * ============================================
 * ENUMS GLOBALES - OMERIX ERP
 * ============================================
 */

/**
 * Roles de usuario en el sistema
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  GERENTE = 'gerente',
  VENDEDOR = 'vendedor',
  TECNICO = 'tecnico',
  ALMACENERO = 'almacenero',
  VISUALIZADOR = 'visualizador',
}

/**
 * Métodos de autenticación de dos factores
 */
export enum TwoFactorMethod {
  NONE = 'none',
  APP = 'app',   // Google Authenticator
  SMS = 'sms',   // SMS
}

/**
 * Tipos de negocio
 */
export enum BusinessType {
  RETAIL = 'retail',
  RESTAURACION = 'restauracion',
  TALLER = 'taller',
  INFORMATICA = 'informatica',
  SERVICIOS = 'servicios',
  OTRO = 'otro',
}

/**
 * Estados de empresa
 */
export enum CompanyStatus {
  ACTIVA = 'activa',
  SUSPENDIDA = 'suspendida',
  CANCELADA = 'cancelada',
}

/**
 * Tipos de acciones para logs de auditoría
 */
export enum AuditAction {
  // Auth
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  ENABLE_2FA = 'ENABLE_2FA',
  DISABLE_2FA = 'DISABLE_2FA',
  
  // CRUD genérico
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  
  // Específicos
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  SEND_EMAIL = 'SEND_EMAIL',
  GENERATE_PDF = 'GENERATE_PDF',
}

/**
 * Módulos/Recursos del sistema (para logs)
 */
export enum AuditResource {
  AUTH = 'auth',
  USUARIO = 'usuario',
  EMPRESA = 'empresa',
  CLIENTE = 'cliente',
  PRODUCTO = 'producto',
  VENTA = 'venta',
  INVENTARIO = 'inventario',
}

/**
 * Niveles de log del sistema
 */
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
  DEBUG = 'debug',
}

/**
 * Tipos de documentos fiscales
 */
export enum FiscalDocumentType {
  FACTURA = 'factura',
  TICKET = 'ticket',
  RECTIFICATIVA = 'rectificativa',
  ABONO = 'abono',
}

/**
 * Resultado de operación
 */
export enum OperationResult {
  EXITO = 'exito',
  FALLO = 'fallo',
}

export default {
  UserRole,
  TwoFactorMethod,
  BusinessType,
  CompanyStatus,
  AuditAction,
  AuditResource,
  LogLevel,
  FiscalDocumentType,
  OperationResult,
};