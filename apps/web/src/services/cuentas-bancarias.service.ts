import { api } from './api'

// ============================================
// TIPOS
// ============================================

export interface CuentaBancaria {
  _id: string
  iban: string
  banco: string
  bic?: string
  titular: string
  alias?: string
  saldoInicial: number
  saldoActual: number
  fechaUltimoMovimiento?: string
  activa: boolean
  predeterminada: boolean
  usarParaCobros: boolean
  usarParaPagos: boolean
  creadoPor: string
  fechaCreacion: string
  modificadoPor?: string
  fechaModificacion?: string
}

export interface CuentaBancariaSelector {
  _id: string
  nombre: string
  iban: string
  predeterminada: boolean
}

export interface CuentaBancariaFilters {
  activa?: boolean
  usarParaCobros?: boolean
  usarParaPagos?: boolean
  busqueda?: string
}

export interface CreateCuentaBancariaDTO {
  iban: string
  banco: string
  bic?: string
  titular: string
  alias?: string
  saldoInicial?: number
  usarParaCobros?: boolean
  usarParaPagos?: boolean
  predeterminada?: boolean
}

export interface UpdateCuentaBancariaDTO {
  iban?: string
  banco?: string
  bic?: string
  titular?: string
  alias?: string
  usarParaCobros?: boolean
  usarParaPagos?: boolean
  activa?: boolean
}

// Respuestas API
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// ============================================
// SERVICIO
// ============================================

class CuentasBancariasService {
  private baseUrl = '/cuentas-bancarias'

  /**
   * Listar cuentas bancarias con filtros
   */
  async getAll(filters: CuentaBancariaFilters = {}): Promise<ApiResponse<CuentaBancaria[]>> {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const queryString = params.toString()
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl
    const response = await api.get<ApiResponse<CuentaBancaria[]>>(url)
    return response.data
  }

  /**
   * Obtener cuentas activas para selector
   */
  async getForSelector(): Promise<ApiResponse<CuentaBancariaSelector[]>> {
    const response = await api.get<ApiResponse<CuentaBancariaSelector[]>>(
      `${this.baseUrl}/selector`
    )
    return response.data
  }

  /**
   * Obtener una cuenta por ID
   */
  async getById(id: string): Promise<ApiResponse<CuentaBancaria>> {
    const response = await api.get<ApiResponse<CuentaBancaria>>(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Crear una nueva cuenta bancaria
   */
  async create(data: CreateCuentaBancariaDTO): Promise<ApiResponse<CuentaBancaria>> {
    const response = await api.post<ApiResponse<CuentaBancaria>>(this.baseUrl, data)
    return response.data
  }

  /**
   * Actualizar una cuenta bancaria
   */
  async update(id: string, data: UpdateCuentaBancariaDTO): Promise<ApiResponse<CuentaBancaria>> {
    const response = await api.put<ApiResponse<CuentaBancaria>>(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  /**
   * Establecer cuenta como predeterminada
   */
  async setPredeterminada(id: string): Promise<ApiResponse<CuentaBancaria>> {
    const response = await api.post<ApiResponse<CuentaBancaria>>(
      `${this.baseUrl}/${id}/predeterminada`
    )
    return response.data
  }

  /**
   * Eliminar (desactivar) una cuenta bancaria
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Formatear IBAN para mostrar (agrupado en bloques de 4)
   */
  formatIban(iban: string): string {
    return iban.replace(/(.{4})/g, '$1 ').trim()
  }

  /**
   * Obtener últimos 4 dígitos del IBAN
   */
  getIbanLastDigits(iban: string): string {
    return iban.slice(-4)
  }

  /**
   * Validar formato de IBAN español
   */
  validateIban(iban: string): boolean {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase()
    // IBAN español: ES + 2 dígitos de control + 20 dígitos
    const spanishIbanRegex = /^ES\d{22}$/
    return spanishIbanRegex.test(cleanIban)
  }

  /**
   * Obtener color según el saldo
   */
  getSaldoColor(saldo: number): string {
    if (saldo > 0) return 'text-green-600'
    if (saldo < 0) return 'text-red-600'
    return 'text-gray-600'
  }
}

export const cuentasBancariasService = new CuentasBancariasService()
