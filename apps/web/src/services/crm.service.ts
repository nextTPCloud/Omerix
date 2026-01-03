/**
 * Servicio CRM
 * Cliente API para el módulo de CRM
 */

import { api } from './api'
import {
  // Leads
  Lead,
  CreateLeadDTO,
  UpdateLeadDTO,
  ConvertirLeadDTO,
  FiltroLeads,
  ConversionResult,
  EstadisticasLeads,
  EstadoLead,
  // Pipeline
  EtapaPipeline,
  CreateEtapaPipelineDTO,
  UpdateEtapaPipelineDTO,
  ReordenarEtapasDTO,
  // Oportunidades
  Oportunidad,
  CreateOportunidadDTO,
  UpdateOportunidadDTO,
  CambiarEtapaDTO,
  CerrarOportunidadDTO,
  FiltroOportunidades,
  OportunidadPorEtapa,
  EstadisticasOportunidades,
  ForecastData,
  // Actividades
  Actividad,
  CreateActividadDTO,
  UpdateActividadDTO,
  CompletarActividadDTO,
  FiltroActividades,
  EstadisticasActividades,
  // Común
  PaginatedResponse,
} from '@/types/crm.types'

export const crmService = {
  // ============================================
  // PIPELINE (ETAPAS)
  // ============================================

  getEtapas: async (soloActivas: boolean = true): Promise<EtapaPipeline[]> => {
    const response = await api.get(`/crm/pipeline/etapas?activas=${soloActivas}`)
    return response.data.data
  },

  getEtapasConEstadisticas: async (): Promise<EtapaPipeline[]> => {
    const response = await api.get('/crm/pipeline/etapas/estadisticas')
    return response.data.data
  },

  getEtapaById: async (id: string): Promise<EtapaPipeline> => {
    const response = await api.get(`/crm/pipeline/etapas/${id}`)
    return response.data.data
  },

  createEtapa: async (data: CreateEtapaPipelineDTO): Promise<EtapaPipeline> => {
    const response = await api.post('/crm/pipeline/etapas', data)
    return response.data.data
  },

  updateEtapa: async (id: string, data: UpdateEtapaPipelineDTO): Promise<EtapaPipeline> => {
    const response = await api.put(`/crm/pipeline/etapas/${id}`, data)
    return response.data.data
  },

  deleteEtapa: async (id: string): Promise<void> => {
    await api.delete(`/crm/pipeline/etapas/${id}`)
  },

  reordenarEtapas: async (data: ReordenarEtapasDTO): Promise<void> => {
    await api.post('/crm/pipeline/etapas/reordenar', data)
  },

  inicializarPipeline: async (): Promise<EtapaPipeline[]> => {
    const response = await api.post('/crm/pipeline/inicializar')
    return response.data.data
  },

  cambiarEstadoEtapa: async (id: string, activo: boolean): Promise<EtapaPipeline> => {
    const response = await api.patch(`/crm/pipeline/etapas/${id}/estado`, { activo })
    return response.data.data
  },

  // ============================================
  // LEADS
  // ============================================

  getLeads: async (filters?: FiltroLeads): Promise<PaginatedResponse<Lead>> => {
    const params = new URLSearchParams()

    if (filters?.busqueda) params.append('busqueda', filters.busqueda)
    if (filters?.estado) params.append('estado', filters.estado)
    if (filters?.origen) params.append('origen', filters.origen)
    if (filters?.interes) params.append('interes', filters.interes)
    if (filters?.asignadoA) params.append('asignadoA', filters.asignadoA)
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

    const response = await api.get(`/crm/leads?${params.toString()}`)
    return response.data
  },

  getLeadById: async (id: string): Promise<Lead> => {
    const response = await api.get(`/crm/leads/${id}`)
    return response.data.data
  },

  createLead: async (data: CreateLeadDTO): Promise<Lead> => {
    const response = await api.post('/crm/leads', data)
    return response.data.data
  },

  updateLead: async (id: string, data: UpdateLeadDTO): Promise<Lead> => {
    const response = await api.put(`/crm/leads/${id}`, data)
    return response.data.data
  },

  deleteLead: async (id: string): Promise<void> => {
    await api.delete(`/crm/leads/${id}`)
  },

  deleteLeadsMultiple: async (ids: string[]): Promise<number> => {
    const response = await api.post('/crm/leads/bulk-delete', { ids })
    return response.data.count
  },

  cambiarEstadoLead: async (id: string, estado: EstadoLead): Promise<Lead> => {
    const response = await api.patch(`/crm/leads/${id}/estado`, { estado })
    return response.data.data
  },

  asignarLead: async (id: string, usuarioAsignadoId: string | null): Promise<Lead> => {
    const response = await api.patch(`/crm/leads/${id}/asignar`, { usuarioAsignadoId })
    return response.data.data
  },

  convertirLead: async (id: string, data: ConvertirLeadDTO): Promise<ConversionResult> => {
    const response = await api.post(`/crm/leads/${id}/convertir`, data)
    return response.data.data
  },

  duplicarLead: async (id: string): Promise<Lead> => {
    const response = await api.post(`/crm/leads/${id}/duplicar`)
    return response.data.data
  },

  getLeadsEstadisticas: async (): Promise<EstadisticasLeads> => {
    const response = await api.get('/crm/leads/estadisticas')
    return response.data.data
  },

  getLeadsPendientesContacto: async (soloMios: boolean = false): Promise<Lead[]> => {
    const response = await api.get(`/crm/leads/pendientes-contacto?soloMios=${soloMios}`)
    return response.data.data
  },

  // ============================================
  // OPORTUNIDADES
  // ============================================

  getOportunidades: async (filters?: FiltroOportunidades): Promise<PaginatedResponse<Oportunidad>> => {
    const params = new URLSearchParams()

    if (filters?.busqueda) params.append('busqueda', filters.busqueda)
    if (filters?.estado) params.append('estado', filters.estado)
    if (filters?.etapaId) params.append('etapaId', filters.etapaId)
    if (filters?.clienteId) params.append('clienteId', filters.clienteId)
    if (filters?.asignadoA) params.append('asignadoA', filters.asignadoA)
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.valorMinimo !== undefined) params.append('valorMinimo', String(filters.valorMinimo))
    if (filters?.valorMaximo !== undefined) params.append('valorMaximo', String(filters.valorMaximo))
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

    const response = await api.get(`/crm/oportunidades?${params.toString()}`)
    return response.data
  },

  getOportunidadesPipeline: async (filters?: { asignadoA?: string; clienteId?: string }): Promise<OportunidadPorEtapa[]> => {
    const params = new URLSearchParams()
    if (filters?.asignadoA) params.append('asignadoA', filters.asignadoA)
    if (filters?.clienteId) params.append('clienteId', filters.clienteId)

    const response = await api.get(`/crm/oportunidades/pipeline?${params.toString()}`)
    return response.data.data
  },

  getOportunidadById: async (id: string): Promise<Oportunidad> => {
    const response = await api.get(`/crm/oportunidades/${id}`)
    return response.data.data
  },

  createOportunidad: async (data: CreateOportunidadDTO): Promise<Oportunidad> => {
    const response = await api.post('/crm/oportunidades', data)
    return response.data.data
  },

  updateOportunidad: async (id: string, data: UpdateOportunidadDTO): Promise<Oportunidad> => {
    const response = await api.put(`/crm/oportunidades/${id}`, data)
    return response.data.data
  },

  deleteOportunidad: async (id: string): Promise<void> => {
    await api.delete(`/crm/oportunidades/${id}`)
  },

  cambiarEtapaOportunidad: async (id: string, data: CambiarEtapaDTO): Promise<Oportunidad> => {
    const response = await api.patch(`/crm/oportunidades/${id}/etapa`, data)
    return response.data.data
  },

  cerrarOportunidad: async (id: string, data: CerrarOportunidadDTO): Promise<Oportunidad> => {
    const response = await api.post(`/crm/oportunidades/${id}/cerrar`, data)
    return response.data.data
  },

  reabrirOportunidad: async (id: string): Promise<Oportunidad> => {
    const response = await api.post(`/crm/oportunidades/${id}/reabrir`)
    return response.data.data
  },

  getOportunidadesEstadisticas: async (): Promise<EstadisticasOportunidades> => {
    const response = await api.get('/crm/oportunidades/estadisticas')
    return response.data.data
  },

  getOportunidadesForecast: async (meses: number = 6): Promise<ForecastData[]> => {
    const response = await api.get(`/crm/oportunidades/forecast?meses=${meses}`)
    return response.data.data
  },

  // ============================================
  // ACTIVIDADES
  // ============================================

  getActividades: async (filters?: FiltroActividades): Promise<PaginatedResponse<Actividad>> => {
    const params = new URLSearchParams()

    if (filters?.leadId) params.append('leadId', filters.leadId)
    if (filters?.oportunidadId) params.append('oportunidadId', filters.oportunidadId)
    if (filters?.clienteId) params.append('clienteId', filters.clienteId)
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.completada !== undefined) params.append('completada', String(filters.completada))
    if (filters?.asignadoA) params.append('asignadoA', filters.asignadoA)
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

    const response = await api.get(`/crm/actividades?${params.toString()}`)
    return response.data
  },

  getActividadById: async (id: string): Promise<Actividad> => {
    const response = await api.get(`/crm/actividades/${id}`)
    return response.data.data
  },

  createActividad: async (data: CreateActividadDTO): Promise<Actividad> => {
    const response = await api.post('/crm/actividades', data)
    return response.data.data
  },

  updateActividad: async (id: string, data: UpdateActividadDTO): Promise<Actividad> => {
    const response = await api.put(`/crm/actividades/${id}`, data)
    return response.data.data
  },

  deleteActividad: async (id: string): Promise<void> => {
    await api.delete(`/crm/actividades/${id}`)
  },

  completarActividad: async (id: string, data: CompletarActividadDTO): Promise<Actividad> => {
    const response = await api.post(`/crm/actividades/${id}/completar`, data)
    return response.data.data
  },

  descompletarActividad: async (id: string): Promise<Actividad> => {
    const response = await api.post(`/crm/actividades/${id}/descompletar`)
    return response.data.data
  },

  getActividadesPendientes: async (soloMias: boolean = false): Promise<Actividad[]> => {
    const response = await api.get(`/crm/actividades/pendientes?soloMias=${soloMias}`)
    return response.data.data
  },

  getActividadesProximas: async (soloMias: boolean = false, dias: number = 2): Promise<Actividad[]> => {
    const response = await api.get(`/crm/actividades/proximas?soloMias=${soloMias}&dias=${dias}`)
    return response.data.data
  },

  getActividadesVencidas: async (soloMias: boolean = false): Promise<Actividad[]> => {
    const response = await api.get(`/crm/actividades/vencidas?soloMias=${soloMias}`)
    return response.data.data
  },

  getActividadesEstadisticas: async (soloMias: boolean = false): Promise<EstadisticasActividades> => {
    const response = await api.get(`/crm/actividades/estadisticas?soloMias=${soloMias}`)
    return response.data.data
  },

  // ============================================
  // DASHBOARD
  // ============================================

  getDashboard: async (): Promise<{
    leads: EstadisticasLeads
    oportunidades: EstadisticasOportunidades
    actividades: EstadisticasActividades
    forecast: ForecastData[]
  }> => {
    const [leads, oportunidades, actividades, forecast] = await Promise.all([
      crmService.getLeadsEstadisticas(),
      crmService.getOportunidadesEstadisticas(),
      crmService.getActividadesEstadisticas(),
      crmService.getOportunidadesForecast(6),
    ])

    return { leads, oportunidades, actividades, forecast }
  },
}

export default crmService
