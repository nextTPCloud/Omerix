// backend/src/modules/logs/interfaces/log.interface.ts

import { Document, Types } from 'mongoose';

// ============================================
// ENUMS Y TIPOS GENERALES
// ============================================

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
  DEBUG = 'debug',
}

export enum LogAction {
  // Autenticación
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  TWO_FACTOR_ENABLE = 'TWO_FACTOR_ENABLE',
  TWO_FACTOR_DISABLE = 'TWO_FACTOR_DISABLE',
  
  // Usuarios
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_ACTIVATE = 'USER_ACTIVATE',
  USER_DEACTIVATE = 'USER_DEACTIVATE',
  
  // Empresa
  COMPANY_UPDATE = 'COMPANY_UPDATE',
  COMPANY_SETTINGS_CHANGE = 'COMPANY_SETTINGS_CHANGE',
  
  // Productos
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  PRODUCT_STOCK_ADJUST = 'PRODUCT_STOCK_ADJUST',
  
  // Clientes
  CLIENT_CREATE = 'CLIENT_CREATE',
  CLIENT_UPDATE = 'CLIENT_UPDATE',
  CLIENT_DELETE = 'CLIENT_DELETE',
  
  // Ventas
  SALE_CREATE = 'SALE_CREATE',
  SALE_UPDATE = 'SALE_UPDATE',
  SALE_CANCEL = 'SALE_CANCEL',
  
  // Fiscales (críticos)
  INVOICE_CREATE = 'INVOICE_CREATE',
  INVOICE_RECTIFY = 'INVOICE_RECTIFY',
  INVOICE_CANCEL = 'INVOICE_CANCEL',
  CASH_CLOSE = 'CASH_CLOSE',
  FISCAL_DECLARATION = 'FISCAL_DECLARATION',
  
  // Accesos sensibles
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  DATA_EXPORT = 'DATA_EXPORT',
  BULK_OPERATION = 'BULK_OPERATION',
  
  // Sistema
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_WARNING = 'SYSTEM_WARNING',
  CRON_JOB_RUN = 'CRON_JOB_RUN',
  EXTERNAL_API_CALL = 'EXTERNAL_API_CALL',
}

export enum LogModule {
  AUTH = 'auth',
  USERS = 'users',
  COMPANY = 'company',
  PRODUCTS = 'products',
  CLIENTS = 'clients',
  SALES = 'sales',
  INVOICES = 'invoices',
  INVENTORY = 'inventory',
  REPORTS = 'reports',
  SYSTEM = 'system',
}

export enum LogResult {
  SUCCESS = 'exito',
  FAILURE = 'fallo',
  PARTIAL = 'parcial',
}

export enum DocumentType {
  FACTURA = 'factura',
  TICKET = 'ticket',
  RECTIFICATIVA = 'rectificativa',
  ABONO = 'abono',
}

// ============================================
// INTERFACES DE AUDIT LOG
// ============================================

export interface IAuditLog extends Document {
  // Identificadores
  empresaId: Types.ObjectId;
  usuarioId: Types.ObjectId;
  
  // Información de la acción
  accion: LogAction;
  modulo: LogModule;
  descripcion: string;
  
  // Entidad afectada
  entidadTipo?: string;
  entidadId?: Types.ObjectId;
  
  // Datos del cambio
  datosAnteriores?: any;
  datosNuevos?: any;
  
  // Información de red
  ip: string;
  userAgent?: string;
  
  // Resultado
  resultado: LogResult;
  mensajeError?: string;
  
  // Metadatos adicionales
  metadata?: any;
  
  // Timestamp
  timestamp: Date;
  createdAt: Date;
}

export interface ICreateAuditLog {
  empresaId: string | Types.ObjectId;
  usuarioId: string | Types.ObjectId;
  accion: LogAction;
  modulo: LogModule;
  descripcion: string;
  entidadTipo?: string;
  entidadId?: string | Types.ObjectId;
  datosAnteriores?: any;
  datosNuevos?: any;
  ip: string;
  userAgent?: string;
  resultado: LogResult;
  mensajeError?: string;
  metadata?: any;
}

// ============================================
// INTERFACES DE SYSTEM LOG
// ============================================

export interface ISystemLog extends Document {
  // Nivel y mensaje
  nivel: LogLevel;
  mensaje: string;
  
  // Contexto
  modulo: LogModule;
  accion?: string;
  
  // Error info (si es error)
  stack?: string;
  errorCode?: string;
  
  // Empresa (opcional, algunos logs son globales)
  empresaId?: Types.ObjectId;
  usuarioId?: Types.ObjectId;
  
  // Contexto adicional
  contexto?: any;
  
  // Request info (opcional)
  ip?: string;
  url?: string;
  method?: string;
  
  // Timestamp
  timestamp: Date;
  createdAt: Date;
}

export interface ICreateSystemLog {
  nivel: LogLevel;
  mensaje: string;
  modulo: LogModule;
  accion?: string;
  stack?: string;
  errorCode?: string;
  empresaId?: string | Types.ObjectId;
  usuarioId?: string | Types.ObjectId;
  contexto?: any;
  ip?: string;
  url?: string;
  method?: string;
}

// ============================================
// INTERFACES DE FISCAL LOG (INMUTABLES)
// ============================================

export interface IFiscalLog extends Document {
  // Identificadores
  empresaId: Types.ObjectId;
  usuarioId?: Types.ObjectId;
  
  // Documento fiscal
  documentoTipo: DocumentType;
  documentoId: Types.ObjectId;
  numeroDocumento: string;
  serie?: string;
  
  // Datos fiscales
  importe: number;
  iva: number;
  total: number;
  
  // Seguridad e inmutabilidad
  hash: string;              // Hash SHA-256 del documento
  hashAnterior?: string;     // Hash del documento anterior (blockchain)
  firma: string;             // Firma digital
  
  // Normativa específica
  ticketBAI?: {
    tbaiId: string;
    qr: string;
    firma: string;
  };
  
  verifactu?: {
    idFactura: string;
    hash: string;
    fechaExpedicion: Date;
  };
  
  // Metadatos
  metadata?: any;
  
  // Control
  inmutable: boolean;        // Siempre true
  retencionHasta: Date;      // Mínimo 4 años desde creación
  
  // Timestamps
  timestamp: Date;
  createdAt: Date;
}

export interface ICreateFiscalLog {
  empresaId: string | Types.ObjectId;
  usuarioId?: string | Types.ObjectId;
  documentoTipo: DocumentType;
  documentoId: string | Types.ObjectId;
  numeroDocumento: string;
  serie?: string;
  importe: number;
  iva: number;
  total: number;
  hashAnterior?: string;
  ticketBAI?: {
    tbaiId: string;
    qr: string;
    firma: string;
  };
  verifactu?: {
    idFactura: string;
    hash: string;
    fechaExpedicion: Date;
  };
  metadata?: any;
}

// ============================================
// INTERFACES DE QUERY/FILTROS
// ============================================

export interface ILogQuery {
  empresaId?: string;
  usuarioId?: string;
  accion?: LogAction;
  modulo?: LogModule;
  entidadTipo?: string;
  entidadId?: string;
  resultado?: LogResult;
  fechaDesde?: Date;
  fechaHasta?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ISystemLogQuery {
  nivel?: LogLevel;
  modulo?: LogModule;
  empresaId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  page?: number;
  limit?: number;
}

export interface IFiscalLogQuery {
  empresaId?: string;
  documentoTipo?: DocumentType;
  numeroDocumento?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  page?: number;
  limit?: number;
}

// ============================================
// INTERFACES DE RESPUESTA
// ============================================

export interface ILogResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ISingleLogResponse<T> {
  success: boolean;
  data: T;
}

// ============================================
// INTERFACES DE RETENCIÓN
// ============================================

export interface IRetentionPolicy {
  auditLogs: number;    // días (default: 730 = 2 años)
  systemLogs: number;   // días (default: 90 = 3 meses)
  fiscalLogs: number;   // días (default: 1460 = 4 años, mínimo legal)
}

export interface IRetentionStats {
  auditLogsDeleted: number;
  systemLogsDeleted: number;
  fiscalLogsRetained: number; // No se eliminan, solo se cuenta
  lastRun: Date;
}