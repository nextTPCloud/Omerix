// ============================================
// TIPOS PARA FORMAS DE PAGO
// ============================================

export interface ConfiguracionPasarela {
  tipo: 'stripe' | 'redsys' | 'paypal' | 'transferencia' | 'efectivo' | 'otro'
  stripePublicKey?: string
  stripeSecretKey?: string
  redsysMerchantCode?: string
  redsysTerminal?: string
  redsysSecretKey?: string
  redsysEnvironment?: 'test' | 'production'
  paypalClientId?: string
  paypalClientSecret?: string
  paypalEnvironment?: 'sandbox' | 'production'
  webhookUrl?: string
  habilitado: boolean
}

export type TipoFormaPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'domiciliacion' | 'cheque' | 'pagare' | 'otro'

export interface FormaPago {
  _id: string
  codigo: string
  nombre: string
  descripcion?: string
  tipo: TipoFormaPago
  icono?: string
  color?: string
  requiereDatosBancarios: boolean
  configuracionPasarela?: ConfiguracionPasarela
  comision?: number
  orden: number
  activo: boolean
  tipoLabel?: string
  createdAt: string
  updatedAt: string
}

export interface CreateFormaPagoDTO {
  codigo: string
  nombre: string
  descripcion?: string
  tipo: TipoFormaPago
  icono?: string
  color?: string
  requiereDatosBancarios?: boolean
  configuracionPasarela?: ConfiguracionPasarela
  comision?: number
  orden?: number
  activo?: boolean
}

export interface UpdateFormaPagoDTO {
  codigo?: string
  nombre?: string
  descripcion?: string
  tipo?: TipoFormaPago
  icono?: string
  color?: string
  requiereDatosBancarios?: boolean
  configuracionPasarela?: ConfiguracionPasarela
  comision?: number
  orden?: number
  activo?: boolean
}

export interface FormasPagoResponse {
  success: boolean
  data: FormaPago[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface FormaPagoResponse {
  success: boolean
  data: FormaPago
  message?: string
}

export const TIPOS_FORMA_PAGO: { value: TipoFormaPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'domiciliacion', label: 'Domiciliación bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'pagare', label: 'Pagaré' },
  { value: 'otro', label: 'Otro' },
]

export const TIPOS_PASARELA = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'redsys', label: 'Redsys' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'otro', label: 'Otro' },
]
