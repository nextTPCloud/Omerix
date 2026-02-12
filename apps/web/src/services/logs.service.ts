import { api } from './api'

// ============================================
// ENUMS (espejo del backend)
// ============================================

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
  PURCHASES = 'purchases',
  SUPPLIERS = 'suppliers',
  DELIVERY_NOTES = 'delivery_notes',
  ORDERS = 'orders',
  QUOTES = 'quotes',
  HR = 'hr',
  TREASURY = 'treasury',
  ACCOUNTING = 'accounting',
  TPV = 'tpv',
  CRM = 'crm',
  PROJECTS = 'projects',
  CONFIG = 'config',
  ROLES = 'roles',
  STOCK = 'stock',
  RESTAURANT = 'restaurant',
}

export enum LogAction {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  TWO_FACTOR_ENABLE = 'TWO_FACTOR_ENABLE',
  TWO_FACTOR_DISABLE = 'TWO_FACTOR_DISABLE',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_ACTIVATE = 'USER_ACTIVATE',
  USER_DEACTIVATE = 'USER_DEACTIVATE',
  COMPANY_UPDATE = 'COMPANY_UPDATE',
  COMPANY_SETTINGS_CHANGE = 'COMPANY_SETTINGS_CHANGE',
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  PRODUCT_STOCK_ADJUST = 'PRODUCT_STOCK_ADJUST',
  CLIENT_CREATE = 'CLIENT_CREATE',
  CLIENT_UPDATE = 'CLIENT_UPDATE',
  CLIENT_DELETE = 'CLIENT_DELETE',
  SALE_CREATE = 'SALE_CREATE',
  SALE_UPDATE = 'SALE_UPDATE',
  SALE_CANCEL = 'SALE_CANCEL',
  INVOICE_CREATE = 'INVOICE_CREATE',
  INVOICE_RECTIFY = 'INVOICE_RECTIFY',
  INVOICE_CANCEL = 'INVOICE_CANCEL',
  CASH_CLOSE = 'CASH_CLOSE',
  FISCAL_DECLARATION = 'FISCAL_DECLARATION',
  DELIVERY_NOTE_CREATE = 'DELIVERY_NOTE_CREATE',
  DELIVERY_NOTE_UPDATE = 'DELIVERY_NOTE_UPDATE',
  DELIVERY_NOTE_DELETE = 'DELIVERY_NOTE_DELETE',
  ORDER_CREATE = 'ORDER_CREATE',
  ORDER_UPDATE = 'ORDER_UPDATE',
  ORDER_DELETE = 'ORDER_DELETE',
  QUOTE_CREATE = 'QUOTE_CREATE',
  QUOTE_UPDATE = 'QUOTE_UPDATE',
  QUOTE_DELETE = 'QUOTE_DELETE',
  PURCHASE_CREATE = 'PURCHASE_CREATE',
  PURCHASE_UPDATE = 'PURCHASE_UPDATE',
  PURCHASE_DELETE = 'PURCHASE_DELETE',
  SUPPLIER_CREATE = 'SUPPLIER_CREATE',
  SUPPLIER_UPDATE = 'SUPPLIER_UPDATE',
  SUPPLIER_DELETE = 'SUPPLIER_DELETE',
  EMPLOYEE_CREATE = 'EMPLOYEE_CREATE',
  EMPLOYEE_UPDATE = 'EMPLOYEE_UPDATE',
  EMPLOYEE_DELETE = 'EMPLOYEE_DELETE',
  ATTENDANCE_CLOCK = 'ATTENDANCE_CLOCK',
  PAYMENT_CREATE = 'PAYMENT_CREATE',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  RECEIPT_CREATE = 'RECEIPT_CREATE',
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROJECT_DELETE = 'PROJECT_DELETE',
  WORK_ORDER_CREATE = 'WORK_ORDER_CREATE',
  WORK_ORDER_UPDATE = 'WORK_ORDER_UPDATE',
  WORK_ORDER_DELETE = 'WORK_ORDER_DELETE',
  STOCK_ADJUST = 'STOCK_ADJUST',
  TRANSFER_CREATE = 'TRANSFER_CREATE',
  INVENTORY_CREATE = 'INVENTORY_CREATE',
  LEAD_CREATE = 'LEAD_CREATE',
  LEAD_UPDATE = 'LEAD_UPDATE',
  OPPORTUNITY_CREATE = 'OPPORTUNITY_CREATE',
  OPPORTUNITY_UPDATE = 'OPPORTUNITY_UPDATE',
  TPV_SALE = 'TPV_SALE',
  TPV_CONFIG = 'TPV_CONFIG',
  ROLE_CREATE = 'ROLE_CREATE',
  ROLE_UPDATE = 'ROLE_UPDATE',
  ROLE_DELETE = 'ROLE_DELETE',
  CONFIG_UPDATE = 'CONFIG_UPDATE',
  RECORD_CREATE = 'RECORD_CREATE',
  RECORD_UPDATE = 'RECORD_UPDATE',
  RECORD_DELETE = 'RECORD_DELETE',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  DATA_EXPORT = 'DATA_EXPORT',
  BULK_OPERATION = 'BULK_OPERATION',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_WARNING = 'SYSTEM_WARNING',
  CRON_JOB_RUN = 'CRON_JOB_RUN',
  EXTERNAL_API_CALL = 'EXTERNAL_API_CALL',
}

export enum LogResult {
  SUCCESS = 'exito',
  FAILURE = 'fallo',
  PARTIAL = 'parcial',
}

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
  DEBUG = 'debug',
}

// ============================================
// LABELS PARA UI
// ============================================

export const MODULE_LABELS: Record<string, string> = {
  [LogModule.AUTH]: 'Autenticacion',
  [LogModule.USERS]: 'Usuarios',
  [LogModule.COMPANY]: 'Empresa',
  [LogModule.PRODUCTS]: 'Productos',
  [LogModule.CLIENTS]: 'Clientes',
  [LogModule.SALES]: 'Ventas',
  [LogModule.INVOICES]: 'Facturas',
  [LogModule.INVENTORY]: 'Inventario',
  [LogModule.REPORTS]: 'Informes',
  [LogModule.SYSTEM]: 'Sistema',
  [LogModule.PURCHASES]: 'Compras',
  [LogModule.SUPPLIERS]: 'Proveedores',
  [LogModule.DELIVERY_NOTES]: 'Albaranes',
  [LogModule.ORDERS]: 'Pedidos',
  [LogModule.QUOTES]: 'Presupuestos',
  [LogModule.HR]: 'RRHH',
  [LogModule.TREASURY]: 'Tesoreria',
  [LogModule.ACCOUNTING]: 'Contabilidad',
  [LogModule.TPV]: 'TPV',
  [LogModule.CRM]: 'CRM',
  [LogModule.PROJECTS]: 'Proyectos',
  [LogModule.CONFIG]: 'Configuracion',
  [LogModule.ROLES]: 'Roles',
  [LogModule.STOCK]: 'Stock',
  [LogModule.RESTAURANT]: 'Restauracion',
}

export const ACTION_LABELS: Record<string, string> = {
  [LogAction.USER_LOGIN]: 'Inicio de sesion',
  [LogAction.USER_LOGOUT]: 'Cierre de sesion',
  [LogAction.USER_REGISTER]: 'Registro',
  [LogAction.PASSWORD_CHANGE]: 'Cambio de contrasena',
  [LogAction.USER_CREATE]: 'Usuario creado',
  [LogAction.USER_UPDATE]: 'Usuario actualizado',
  [LogAction.USER_DELETE]: 'Usuario eliminado',
  [LogAction.PRODUCT_CREATE]: 'Producto creado',
  [LogAction.PRODUCT_UPDATE]: 'Producto actualizado',
  [LogAction.PRODUCT_DELETE]: 'Producto eliminado',
  [LogAction.CLIENT_CREATE]: 'Cliente creado',
  [LogAction.CLIENT_UPDATE]: 'Cliente actualizado',
  [LogAction.CLIENT_DELETE]: 'Cliente eliminado',
  [LogAction.INVOICE_CREATE]: 'Factura creada',
  [LogAction.INVOICE_RECTIFY]: 'Factura rectificada',
  [LogAction.INVOICE_CANCEL]: 'Factura anulada',
  [LogAction.DELIVERY_NOTE_CREATE]: 'Albaran creado',
  [LogAction.DELIVERY_NOTE_UPDATE]: 'Albaran actualizado',
  [LogAction.DELIVERY_NOTE_DELETE]: 'Albaran eliminado',
  [LogAction.ORDER_CREATE]: 'Pedido creado',
  [LogAction.ORDER_UPDATE]: 'Pedido actualizado',
  [LogAction.ORDER_DELETE]: 'Pedido eliminado',
  [LogAction.QUOTE_CREATE]: 'Presupuesto creado',
  [LogAction.QUOTE_UPDATE]: 'Presupuesto actualizado',
  [LogAction.QUOTE_DELETE]: 'Presupuesto eliminado',
  [LogAction.PURCHASE_CREATE]: 'Compra creada',
  [LogAction.PURCHASE_UPDATE]: 'Compra actualizada',
  [LogAction.PURCHASE_DELETE]: 'Compra eliminada',
  [LogAction.SUPPLIER_CREATE]: 'Proveedor creado',
  [LogAction.SUPPLIER_UPDATE]: 'Proveedor actualizado',
  [LogAction.SUPPLIER_DELETE]: 'Proveedor eliminado',
  [LogAction.EMPLOYEE_CREATE]: 'Empleado creado',
  [LogAction.EMPLOYEE_UPDATE]: 'Empleado actualizado',
  [LogAction.EMPLOYEE_DELETE]: 'Empleado eliminado',
  [LogAction.ATTENDANCE_CLOCK]: 'Fichaje',
  [LogAction.PAYMENT_CREATE]: 'Pago creado',
  [LogAction.PAYMENT_UPDATE]: 'Pago actualizado',
  [LogAction.RECEIPT_CREATE]: 'Recibo creado',
  [LogAction.PROJECT_CREATE]: 'Proyecto creado',
  [LogAction.PROJECT_UPDATE]: 'Proyecto actualizado',
  [LogAction.PROJECT_DELETE]: 'Proyecto eliminado',
  [LogAction.WORK_ORDER_CREATE]: 'Parte creado',
  [LogAction.WORK_ORDER_UPDATE]: 'Parte actualizado',
  [LogAction.WORK_ORDER_DELETE]: 'Parte eliminado',
  [LogAction.STOCK_ADJUST]: 'Ajuste de stock',
  [LogAction.TRANSFER_CREATE]: 'Traspaso creado',
  [LogAction.INVENTORY_CREATE]: 'Inventario creado',
  [LogAction.LEAD_CREATE]: 'Lead creado',
  [LogAction.LEAD_UPDATE]: 'Lead actualizado',
  [LogAction.OPPORTUNITY_CREATE]: 'Oportunidad creada',
  [LogAction.OPPORTUNITY_UPDATE]: 'Oportunidad actualizada',
  [LogAction.TPV_SALE]: 'Venta TPV',
  [LogAction.TPV_CONFIG]: 'Config TPV',
  [LogAction.ROLE_CREATE]: 'Rol creado',
  [LogAction.ROLE_UPDATE]: 'Rol actualizado',
  [LogAction.ROLE_DELETE]: 'Rol eliminado',
  [LogAction.CONFIG_UPDATE]: 'Configuracion actualizada',
  [LogAction.RECORD_CREATE]: 'Registro creado',
  [LogAction.RECORD_UPDATE]: 'Registro actualizado',
  [LogAction.RECORD_DELETE]: 'Registro eliminado',
  [LogAction.DATA_EXPORT]: 'Exportacion de datos',
  [LogAction.BULK_OPERATION]: 'Operacion masiva',
  [LogAction.COMPANY_UPDATE]: 'Empresa actualizada',
  [LogAction.COMPANY_SETTINGS_CHANGE]: 'Config empresa cambiada',
  [LogAction.SALE_CREATE]: 'Venta creada',
  [LogAction.SALE_UPDATE]: 'Venta actualizada',
  [LogAction.SALE_CANCEL]: 'Venta cancelada',
  [LogAction.SYSTEM_ERROR]: 'Error del sistema',
  [LogAction.SYSTEM_WARNING]: 'Aviso del sistema',
  [LogAction.CRON_JOB_RUN]: 'Tarea programada',
  [LogAction.EXTERNAL_API_CALL]: 'Llamada API externa',
}

export const RESULT_LABELS: Record<string, string> = {
  [LogResult.SUCCESS]: 'Exitoso',
  [LogResult.FAILURE]: 'Fallido',
  [LogResult.PARTIAL]: 'Parcial',
}

export const LEVEL_LABELS: Record<string, string> = {
  [LogLevel.INFO]: 'Info',
  [LogLevel.WARN]: 'Aviso',
  [LogLevel.ERROR]: 'Error',
  [LogLevel.FATAL]: 'Fatal',
  [LogLevel.DEBUG]: 'Debug',
}

// ============================================
// TIPOS
// ============================================

export interface AuditLog {
  _id: string
  empresaId: string
  usuarioId: string | { _id: string; nombre: string; apellidos: string; email: string }
  accion: string
  modulo: string
  descripcion: string
  entidadTipo?: string
  entidadId?: string
  datosAnteriores?: any
  datosNuevos?: any
  ip: string
  userAgent?: string
  resultado: string
  mensajeError?: string
  metadata?: any
  timestamp: string
  createdAt: string
}

export interface SystemLog {
  _id: string
  nivel: string
  mensaje: string
  modulo: string
  accion?: string
  stack?: string
  errorCode?: string
  empresaId?: string
  usuarioId?: string
  contexto?: any
  ip?: string
  url?: string
  method?: string
  timestamp: string
  createdAt: string
}

export interface FiscalLog {
  _id: string
  empresaId: string
  usuarioId?: string
  documentoTipo: string
  documentoId: string
  numeroDocumento: string
  serie?: string
  importe: number
  iva: number
  total: number
  hash: string
  hashAnterior?: string
  firma: string
  inmutable: boolean
  retencionHasta: string
  timestamp: string
  createdAt: string
}

export interface LogsResponse<T> {
  success: boolean
  data: T[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AuditLogFilters {
  page?: number
  limit?: number
  accion?: string
  modulo?: string
  resultado?: string
  fechaDesde?: string
  fechaHasta?: string
  usuarioId?: string
}

export interface SystemLogFilters {
  page?: number
  limit?: number
  nivel?: string
  modulo?: string
  fechaDesde?: string
  fechaHasta?: string
}

export interface FiscalLogFilters {
  page?: number
  limit?: number
  documentoTipo?: string
  numeroDocumento?: string
  fechaDesde?: string
  fechaHasta?: string
}

// ============================================
// FUNCIONES DEL SERVICIO
// ============================================

function buildQuery(params?: Record<string, any>): string {
  if (!params) return ''
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value))
    }
  })
  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

// --- Audit Logs ---

export async function getAuditLogs(filters?: AuditLogFilters) {
  const response = await api.get(`/logs/audit${buildQuery(filters)}`)
  return response.data
}

export async function getMyLogs(limit?: number) {
  const response = await api.get(`/logs/audit/me${buildQuery({ limit })}`)
  return response.data
}

export async function getAuditLogById(id: string) {
  const response = await api.get(`/logs/audit/${id}`)
  return response.data
}

export async function getAuditStats(fechaDesde: string, fechaHasta: string) {
  const response = await api.get(`/logs/audit/stats${buildQuery({ fechaDesde, fechaHasta })}`)
  return response.data
}

export async function exportAuditLogs(filters?: AuditLogFilters & { format?: 'json' | 'csv' }) {
  const response = await api.get(`/logs/audit/export${buildQuery(filters)}`)
  return response.data
}

// --- System Logs ---

export async function getSystemLogs(filters?: SystemLogFilters) {
  const response = await api.get(`/logs/system${buildQuery(filters)}`)
  return response.data
}

export async function getSystemLogById(id: string) {
  const response = await api.get(`/logs/system/${id}`)
  return response.data
}

export async function getSystemHealth() {
  const response = await api.get('/logs/system/health')
  return response.data
}

export async function exportSystemLogs(filters?: SystemLogFilters & { format?: 'json' | 'csv' }) {
  const response = await api.get(`/logs/system/export${buildQuery(filters)}`)
  return response.data
}

// --- Fiscal Logs ---

export async function getFiscalLogs(filters?: FiscalLogFilters) {
  const response = await api.get(`/logs/fiscal${buildQuery(filters)}`)
  return response.data
}

export async function getFiscalLogById(id: string) {
  const response = await api.get(`/logs/fiscal/${id}`)
  return response.data
}

export async function exportFiscalLogs(filters?: FiscalLogFilters & { format?: 'json' | 'csv' }) {
  const response = await api.get(`/logs/fiscal/export${buildQuery(filters)}`)
  return response.data
}
