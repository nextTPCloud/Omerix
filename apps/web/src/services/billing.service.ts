import { api } from './api'

/**
 * Interfaces para el sistema de licencias y billing
 */
export interface IPlan {
  _id: string
  nombre: string
  slug: string
  descripcion?: string
  precio: {
    mensual: number
    anual: number
  }
  limites: {
    usuariosSimultaneos: number
    usuariosTotales: number
    facturasMes: number
    productosCatalogo: number
    almacenes: number
    clientes: number
    tpvsActivos: number
    almacenamientoGB: number
    llamadasAPIDia: number
    emailsMes: number
    smsMes: number
    whatsappMes: number
  }
  modulosIncluidos: string[]
  activo: boolean
  visible: boolean
}

export interface ILicencia {
  _id: string
  empresaId: string
  planId: string
  plan?: IPlan
  estado: 'trial' | 'activa' | 'suspendida' | 'cancelada' | 'expirada'
  esTrial: boolean
  fechaInicioTrial?: Date
  fechaFinTrial?: Date
  tipoSuscripcion?: 'mensual' | 'anual'
  fechaInicio?: Date
  fechaRenovacion?: Date
  fechaCancelacion?: Date
  usoActual: {
    usuariosActuales: number
    facturasEsteMes: number
    productosActuales: number
    almacenesActuales: number
    clientesActuales: number
    tpvsActuales: number
    almacenamientoUsadoGB: number
    llamadasAPIHoy: number
    emailsEsteMes: number
    smsEsteMes: number
    whatsappEsteMes: number
  }
  addOns: Array<{
    nombre: string
    slug: string
    precioMensual: number
    activo: boolean
    fechaActivacion: Date
  }>
}

export interface IAddOn {
  _id: string
  nombre: string
  slug: string
  descripcion?: string
  icono?: string
  tipo: 'modulo' | 'usuarios' | 'almacenamiento' | 'tokens' | 'otro'
  precioMensual: number
  precioAnual?: number
  unidad?: string
  cantidad?: number
  esRecurrente: boolean
  caracteristicas?: string[]
  limitesExtra?: {
    usuariosTotales?: number
    almacenamientoGB?: number
    tokensIA?: number
    tpvs?: number
  }
  orden: number
  activo: boolean
}

export interface LicenciaResponse {
  licencia: ILicencia
  plan: IPlan
  diasRestantes?: number
  advertencias?: string[]
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

class BillingService {
  private basePath = '/licencias'

  /**
   * Obtener la licencia actual de la empresa
   */
  async getMiLicencia(): Promise<ApiResponse<LicenciaResponse>> {
    try {
      const response = await api.get(`${this.basePath}/mi-licencia`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener licencia')
    }
  }

  /**
   * Obtener planes disponibles
   */
  async getPlanes(): Promise<ApiResponse<IPlan[]>> {
    try {
      const response = await api.get(`${this.basePath}/planes`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener planes')
    }
  }

  /**
   * Obtener add-ons disponibles
   */
  async getAddOns(): Promise<ApiResponse<IAddOn[]>> {
    try {
      const response = await api.get(`${this.basePath}/addons`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener add-ons')
    }
  }

  /**
   * Cambiar de plan
   */
  async cambiarPlan(planSlug: string, tipoSuscripcion: 'mensual' | 'anual'): Promise<ApiResponse<ILicencia>> {
    try {
      const response = await api.post(`${this.basePath}/cambiar-plan`, {
        planSlug,
        tipoSuscripcion
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cambiar plan')
    }
  }

  /**
   * Agregar un add-on
   */
  async addAddOn(addOnSlug: string, cantidad: number = 1): Promise<ApiResponse<ILicencia>> {
    try {
      const response = await api.post(`${this.basePath}/add-addon`, {
        addOnSlug,
        cantidad
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al agregar add-on')
    }
  }

  /**
   * Eliminar un add-on
   * @param addOnSlug - Slug del add-on a eliminar
   * @param cancelarAlRenovar - true = cancela al renovar (sigue activo), false = cancela inmediatamente
   */
  async removeAddOn(addOnSlug: string, cancelarAlRenovar: boolean = true): Promise<ApiResponse<{
    success: boolean
    message: string
    canceladoInmediatamente: boolean
    fechaCancelacion: Date
  }>> {
    try {
      const response = await api.post(`${this.basePath}/remove-addon`, {
        addOnSlug,
        cancelarAlRenovar
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar add-on')
    }
  }

  /**
   * Obtener resumen de facturacion
   */
  async getResumenFacturacion(): Promise<ApiResponse<{
    plan: { nombre: string; precio: number; tipoSuscripcion: string }
    addOns: Array<{ nombre: string; cantidad: number; precioMensual: number }>
    totales: { precioPlan: number; precioAddOns: number; totalMensual: number; proximaFactura: Date }
  }>> {
    try {
      const response = await api.get(`${this.basePath}/facturacion`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener resumen de facturacion')
    }
  }

  /**
   * Crear sesion de checkout en Stripe
   */
  async crearCheckoutSession(params: {
    planSlug?: string
    tipoSuscripcion: 'mensual' | 'anual'
    addOns?: string[]
    onlyAddOns?: boolean
    successUrl: string
    cancelUrl: string
  }): Promise<ApiResponse<{ sessionId: string; url: string; message?: string }>> {
    try {
      const response = await api.post('/pagos/checkout/session', params)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear sesion de checkout')
    }
  }

  /**
   * Crear orden de PayPal
   */
  async crearOrdenPayPal(params: {
    planSlug: string
    tipoSuscripcion: 'mensual' | 'anual'
  }): Promise<ApiResponse<{ orderId: string; approvalUrl: string }>> {
    try {
      const response = await api.post('/pagos/paypal/orders', params)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear orden de PayPal')
    }
  }

  /**
   * Crear suscripcion de PayPal
   */
  async crearSuscripcionPayPal(params: {
    planSlug?: string
    tipoSuscripcion: 'mensual' | 'anual'
    addOns?: string[]
    onlyAddOns?: boolean
  }): Promise<ApiResponse<{ subscriptionId: string; approvalUrl: string }>> {
    try {
      const response = await api.post('/pagos/paypal/subscriptions', params)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear suscripcion de PayPal')
    }
  }

  /**
   * Crear pago con Redsys
   */
  async crearPagoRedsys(params: {
    planSlug?: string
    tipoSuscripcion: 'mensual' | 'anual'
    addOns?: string[]
    onlyAddOns?: boolean
  }): Promise<ApiResponse<{
    redsysUrl: string
    Ds_SignatureVersion: string
    Ds_MerchantParameters: string
    Ds_Signature: string
  }>> {
    try {
      const response = await api.post('/pagos/redsys/subscriptions', params)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear pago de Redsys')
    }
  }

  /**
   * Obtener historial de pagos
   */
  async getHistorialPagos(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get('/pagos/historial')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener historial de pagos')
    }
  }

  /**
   * Obtener metodo de pago guardado
   */
  async getMetodoPago(): Promise<ApiResponse<{
    tipo: string
    ultimos4: string
    marca: string
    expira: string
  } | null>> {
    try {
      const response = await api.get('/pagos/metodo-pago')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener metodo de pago')
    }
  }

  /**
   * Cancelar suscripcion
   */
  async cancelarSuscripcion(): Promise<ApiResponse<ILicencia>> {
    try {
      const response = await api.post(`${this.basePath}/cancelar`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cancelar suscripcion')
    }
  }

  /**
   * Obtener sesiones activas de la empresa
   */
  async getSesionesActivasEmpresa(): Promise<ApiResponse<{
    totalSesiones: number
    sesiones: Array<{
      id: string
      usuario: {
        id: string
        nombre: string
        email: string
      } | null
      deviceInfo: string
      ipAddress: string
      createdAt: string
      expiresAt: string
    }>
  }>> {
    try {
      const response = await api.get('/auth/sessions/empresa')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener sesiones activas')
    }
  }

  /**
   * Obtener estado de renovación automática
   */
  async getEstadoRenovacion(): Promise<ApiResponse<{
    renovacionAutomatica: boolean
    fechaRenovacion: string
    estado: string
    plan: string
    tipoSuscripcion: string
    pasarela: 'stripe' | 'paypal' | null
  }>> {
    try {
      const response = await api.get(`${this.basePath}/renovacion`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener estado de renovación')
    }
  }

  /**
   * Activar/Desactivar renovación automática
   */
  async toggleRenovacionAutomatica(activar: boolean): Promise<ApiResponse<{
    success: boolean
    renovacionAutomatica: boolean
    message: string
  }>> {
    try {
      const response = await api.put(`${this.basePath}/renovacion`, { activar })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar renovación automática')
    }
  }

  /**
   * Obtener permisos disponibles según el plan
   */
  async getPermisosDisponibles(): Promise<ApiResponse<{
    plan: string
    modulosContratados: string[]
    permisos: Array<{
      key: string
      label: string
      modulo: string
      disponible: boolean
      requiereUpgrade: boolean
    }>
  }>> {
    try {
      const response = await api.get(`${this.basePath}/permisos-disponibles`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener permisos disponibles')
    }
  }

  /**
   * Obtener facturas de suscripción
   */
  async getFacturasSuscripcion(): Promise<ApiResponse<Array<{
    _id: string
    numeroFactura: string
    fechaEmision: string
    fechaPago?: string
    total: number
    estado: string
    planNombre: string
  }>>> {
    try {
      const response = await api.get('/pagos/facturas-suscripcion')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener facturas')
    }
  }

  /**
   * Descargar PDF de factura de suscripción
   */
  async descargarFacturaPDF(facturaId: string): Promise<Blob> {
    try {
      const response = await api.get(`/pagos/facturas-suscripcion/${facturaId}/pdf`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al descargar factura')
    }
  }

  /**
   * Calcular prorrateo para add-ons o cambio de plan
   */
  async calcularProrrateo(params: {
    addOns?: string[]
    planSlug?: string
  }): Promise<ApiResponse<{
    aplicaProrrata: boolean
    diasRestantes: number
    diasCiclo: number
    fechaRenovacion: string
    tipoSuscripcion: 'mensual' | 'anual'
    mensaje: string
    desglose: Array<{
      concepto: string
      precioCompleto: number
      precioProrrata: number
    }>
    totales: {
      subtotalCompleto: number
      subtotalProrrata: number
      ivaCompleto: number
      ivaProrrata: number
      totalCompleto: number
      totalProrrata: number
      ahorro: number
    }
  }>> {
    try {
      const response = await api.post('/pagos/prorrateo', params)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al calcular prorrateo')
    }
  }
}

export const billingService = new BillingService()
export default billingService
