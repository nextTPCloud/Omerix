/**
 * Servicio de Contabilidad
 * Cliente API para el módulo de contabilidad
 */

import { api } from './api'
import {
  CuentaContable,
  CreateCuentaDTO,
  UpdateCuentaDTO,
  CuentasFilters,
  AsientoContable,
  CreateAsientoDTO,
  AsientosFilters,
  AsientosListResponse,
  ConfigContable,
  FiltrosInformes,
  LibroDiarioResponse,
  LibroMayorResponse,
  LibroMayorCuenta,
  SumasSaldosResponse,
  BalanceSituacionResponse,
  CuentaResultadosResponse,
  ExportFormat,
  ExportFormatInfo,
} from '@/types/contabilidad.types'

export const contabilidadService = {
  // ============================================
  // CONFIGURACIÓN
  // ============================================

  getConfig: async (): Promise<ConfigContable> => {
    const response = await api.get('/contabilidad/config')
    return response.data
  },

  updateConfig: async (data: Partial<ConfigContable>): Promise<ConfigContable> => {
    const response = await api.put('/contabilidad/config', data)
    return response.data
  },

  inicializarPlanCuentas: async (): Promise<{ mensaje: string; cuentasCreadas: number; errores: string[] }> => {
    const response = await api.post('/contabilidad/cuentas/inicializar')
    return response.data
  },

  // ============================================
  // CUENTAS CONTABLES
  // ============================================

  getCuentas: async (filters?: CuentasFilters): Promise<CuentaContable[]> => {
    const params = new URLSearchParams()

    if (filters?.nivel !== undefined) params.append('nivel', String(filters.nivel))
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.esMovimiento !== undefined) params.append('esMovimiento', String(filters.esMovimiento))
    if (filters?.activa !== undefined) params.append('activa', String(filters.activa))
    if (filters?.busqueda) params.append('busqueda', filters.busqueda)
    if (filters?.codigoPadre) params.append('codigoPadre', filters.codigoPadre)

    const response = await api.get(`/contabilidad/cuentas?${params.toString()}`)
    return response.data
  },

  getCuentaById: async (id: string): Promise<CuentaContable> => {
    const response = await api.get(`/contabilidad/cuentas/${id}`)
    return response.data
  },

  getCuentaByCodigo: async (codigo: string): Promise<CuentaContable | null> => {
    try {
      const cuentas = await contabilidadService.getCuentas({ busqueda: codigo })
      return cuentas.find(c => c.codigo === codigo) || null
    } catch {
      return null
    }
  },

  createCuenta: async (data: CreateCuentaDTO): Promise<CuentaContable> => {
    const response = await api.post('/contabilidad/cuentas', data)
    return response.data
  },

  updateCuenta: async (id: string, data: UpdateCuentaDTO): Promise<CuentaContable> => {
    const response = await api.put(`/contabilidad/cuentas/${id}`, data)
    return response.data
  },

  deleteCuenta: async (id: string): Promise<CuentaContable> => {
    const response = await api.delete(`/contabilidad/cuentas/${id}`)
    return response.data
  },

  // ============================================
  // ASIENTOS CONTABLES
  // ============================================

  getAsientos: async (filters?: AsientosFilters): Promise<AsientosListResponse> => {
    const params = new URLSearchParams()

    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.ejercicio) params.append('ejercicio', String(filters.ejercicio))
    if (filters?.periodo) params.append('periodo', String(filters.periodo))
    if (filters?.cuentaCodigo) params.append('cuentaCodigo', filters.cuentaCodigo)
    if (filters?.origenTipo) params.append('origenTipo', filters.origenTipo)
    if (filters?.estado) params.append('estado', filters.estado)
    if (filters?.concepto) params.append('concepto', filters.concepto)
    if (filters?.pagina) params.append('pagina', String(filters.pagina))
    if (filters?.limite) params.append('limite', String(filters.limite))

    const response = await api.get(`/contabilidad/asientos?${params.toString()}`)
    return response.data
  },

  getAsientoById: async (id: string): Promise<AsientoContable> => {
    const response = await api.get(`/contabilidad/asientos/${id}`)
    return response.data
  },

  createAsiento: async (data: CreateAsientoDTO): Promise<AsientoContable> => {
    const response = await api.post('/contabilidad/asientos', data)
    return response.data
  },

  anularAsiento: async (id: string, motivo: string): Promise<{ mensaje: string; contraAsiento: AsientoContable }> => {
    const response = await api.post(`/contabilidad/asientos/${id}/anular`, { motivo })
    return response.data
  },

  // ============================================
  // INFORMES
  // ============================================

  getLibroDiario: async (filters?: FiltrosInformes): Promise<LibroDiarioResponse> => {
    const params = new URLSearchParams()

    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.ejercicio) params.append('ejercicio', String(filters.ejercicio))

    const response = await api.get(`/contabilidad/informes/libro-diario?${params.toString()}`)
    return response.data
  },

  getLibroMayor: async (filters?: FiltrosInformes): Promise<LibroMayorResponse> => {
    const params = new URLSearchParams()

    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.ejercicio) params.append('ejercicio', String(filters.ejercicio))
    if (filters?.nivel) params.append('nivel', String(filters.nivel))
    if (filters?.cuentaDesde) params.append('cuentaDesde', filters.cuentaDesde)
    if (filters?.cuentaHasta) params.append('cuentaHasta', filters.cuentaHasta)
    if (filters?.incluirCuentasSinMovimiento !== undefined) {
      params.append('incluirCuentasSinMovimiento', String(filters.incluirCuentasSinMovimiento))
    }

    const response = await api.get(`/contabilidad/informes/libro-mayor?${params.toString()}`)
    return response.data
  },

  getLibroMayorCuenta: async (codigoCuenta: string, filters?: FiltrosInformes): Promise<LibroMayorCuenta> => {
    const params = new URLSearchParams()

    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.ejercicio) params.append('ejercicio', String(filters.ejercicio))

    const response = await api.get(`/contabilidad/informes/libro-mayor/${codigoCuenta}?${params.toString()}`)
    return response.data
  },

  getSumasSaldos: async (filters?: FiltrosInformes): Promise<SumasSaldosResponse> => {
    const params = new URLSearchParams()

    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.ejercicio) params.append('ejercicio', String(filters.ejercicio))
    if (filters?.nivel) params.append('nivel', String(filters.nivel))
    if (filters?.cuentaDesde) params.append('cuentaDesde', filters.cuentaDesde)
    if (filters?.cuentaHasta) params.append('cuentaHasta', filters.cuentaHasta)

    const response = await api.get(`/contabilidad/informes/sumas-saldos?${params.toString()}`)
    return response.data
  },

  getBalanceSituacion: async (filters?: FiltrosInformes): Promise<BalanceSituacionResponse> => {
    const params = new URLSearchParams()

    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.ejercicio) params.append('ejercicio', String(filters.ejercicio))
    if (filters?.nivel) params.append('nivel', String(filters.nivel))

    const response = await api.get(`/contabilidad/informes/balance-situacion?${params.toString()}`)
    return response.data
  },

  getCuentaResultados: async (filters?: FiltrosInformes): Promise<CuentaResultadosResponse> => {
    const params = new URLSearchParams()

    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.ejercicio) params.append('ejercicio', String(filters.ejercicio))
    if (filters?.nivel) params.append('nivel', String(filters.nivel))

    const response = await api.get(`/contabilidad/informes/cuenta-resultados?${params.toString()}`)
    return response.data
  },

  getCuentaResultadosResumida: async (filters?: FiltrosInformes): Promise<CuentaResultadosResponse> => {
    const params = new URLSearchParams()

    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.ejercicio) params.append('ejercicio', String(filters.ejercicio))

    const response = await api.get(`/contabilidad/informes/cuenta-resultados-resumida?${params.toString()}`)
    return response.data
  },

  // ============================================
  // EXPORTACIÓN
  // ============================================

  getFormatosExportacion: async (): Promise<Record<ExportFormat, ExportFormatInfo>> => {
    const response = await api.get('/contabilidad/exportar/formatos')
    return response.data
  },

  exportarAsientos: async (
    formato: ExportFormat = 'csv',
    filters?: FiltrosInformes & { codigoEmpresa?: string }
  ): Promise<Blob> => {
    const params = new URLSearchParams()
    params.append('formato', formato)

    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.ejercicio) params.append('ejercicio', String(filters.ejercicio))
    if (filters?.codigoEmpresa) params.append('codigoEmpresa', filters.codigoEmpresa)

    const response = await api.get(`/contabilidad/exportar/asientos?${params.toString()}`, {
      responseType: 'blob',
    })
    return response.data
  },

  exportarPlanCuentas: async (
    formato: ExportFormat = 'csv',
    options?: { ejercicio?: number; codigoEmpresa?: string }
  ): Promise<Blob> => {
    const params = new URLSearchParams()
    params.append('formato', formato)

    if (options?.ejercicio) params.append('ejercicio', String(options.ejercicio))
    if (options?.codigoEmpresa) params.append('codigoEmpresa', options.codigoEmpresa)

    const response = await api.get(`/contabilidad/exportar/plan-cuentas?${params.toString()}`, {
      responseType: 'blob',
    })
    return response.data
  },

  // ============================================
  // UTILIDADES
  // ============================================

  descargarArchivo: (blob: Blob, nombreArchivo: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nombreArchivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}

export default contabilidadService
