// apps/web/src/services/informes.service.ts

import { api } from './api'

// ============================================
// ENUMS
// ============================================

export enum ModuloInforme {
  VENTAS = 'ventas',
  COMPRAS = 'compras',
  STOCK = 'stock',
  TESORERIA = 'tesoreria',
  PERSONAL = 'personal',
  CLIENTES = 'clientes',
  PROVEEDORES = 'proveedores',
  PROYECTOS = 'proyectos',
  CRM = 'crm',
  CONTABILIDAD = 'contabilidad',
  TPV = 'tpv',
  PRESUPUESTOS = 'presupuestos',
  PEDIDOS = 'pedidos',
  ALBARANES = 'albaranes',
  GENERAL = 'general',
}

export enum TipoInforme {
  TABLA = 'tabla',
  GRAFICO = 'grafico',
  MIXTO = 'mixto',
}

export enum TipoCampo {
  TEXTO = 'texto',
  NUMERO = 'numero',
  MONEDA = 'moneda',
  FECHA = 'fecha',
  PORCENTAJE = 'porcentaje',
  BOOLEAN = 'boolean',
}

export enum TipoAgregacion {
  NINGUNA = 'ninguna',
  SUMA = 'suma',
  PROMEDIO = 'promedio',
  CONTEO = 'conteo',
  MIN = 'min',
  MAX = 'max',
}

export enum OperadorFiltro {
  IGUAL = 'igual',
  DIFERENTE = 'diferente',
  CONTIENE = 'contiene',
  COMIENZA = 'comienza',
  TERMINA = 'termina',
  MAYOR = 'mayor',
  MAYOR_IGUAL = 'mayor_igual',
  MENOR = 'menor',
  MENOR_IGUAL = 'menor_igual',
  ENTRE = 'entre',
  EN = 'en',
  NO_EN = 'no_en',
  EXISTE = 'existe',
  NO_EXISTE = 'no_existe',
}

export enum TipoGraficoInforme {
  LINEA = 'linea',
  BARRA = 'barra',
  BARRA_HORIZONTAL = 'barra_horizontal',
  AREA = 'area',
  CIRCULAR = 'circular',
  DONA = 'dona',
  COMBINADO = 'combinado',
}

// ============================================
// INTERFACES
// ============================================

export interface ICampoInforme {
  campo: string
  etiqueta: string
  tipo: TipoCampo
  visible: boolean
  ancho?: number
  formato?: string
  agregacion: TipoAgregacion
  orden?: number
}

export interface IFiltroInforme {
  campo: string
  operador: OperadorFiltro
  valor?: any
  valor2?: any
  parametro?: string
  etiqueta?: string
}

export interface IAgrupacionInforme {
  campo: string
  etiqueta?: string
  orden: 'asc' | 'desc'
}

export interface IOrdenamientoInforme {
  campo: string
  direccion: 'asc' | 'desc'
}

export interface IJoinInforme {
  coleccion: string
  campoLocal: string
  campoForaneo: string
  alias: string
}

export interface IFuenteInforme {
  coleccion: string
  joins?: IJoinInforme[]
}

export interface IGraficoConfigInforme {
  tipo: TipoGraficoInforme
  ejeX: string
  ejeY: string[]
  colores?: string[]
  mostrarLeyenda?: boolean
  mostrarEtiquetas?: boolean
}

export interface IParametroInforme {
  nombre: string
  etiqueta: string
  tipo: 'texto' | 'numero' | 'fecha' | 'select' | 'multiselect'
  valorDefecto?: any
  opciones?: Array<{ valor: any; etiqueta: string }>
  requerido: boolean
}

export interface IConfigInforme {
  limite?: number
  paginacion: boolean
  mostrarTotales: boolean
  exportable: boolean
  formatos: ('pdf' | 'excel' | 'csv')[]
}

export interface IInforme {
  _id: string
  empresaId: string
  nombre: string
  descripcion?: string
  modulo: ModuloInforme
  tipo: TipoInforme
  icono?: string
  fuente: IFuenteInforme
  campos: ICampoInforme[]
  filtros: IFiltroInforme[]
  parametros: IParametroInforme[]
  agrupaciones: IAgrupacionInforme[]
  ordenamiento: IOrdenamientoInforme[]
  grafico?: IGraficoConfigInforme
  config: IConfigInforme
  esPlantilla: boolean
  compartido: boolean
  favorito: boolean
  orden?: number
  permisosRequeridos?: string[]
  creadoPor: string
  modificadoPor?: string
  createdAt: string
  updatedAt: string
}

export interface IResultadoInforme {
  datos: any[]
  totales?: Record<string, number>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface IResultadoIA {
  definicion: Partial<IInforme>
  datos?: any[]
  totales?: Record<string, number>
  pagination?: any
  mensaje: string
}

export interface ICatalogoColeccion {
  coleccion: string
  etiqueta: string
  campos: Array<{
    campo: string
    etiqueta: string
    tipo: TipoCampo
    agregable?: boolean
  }>
}

// ============================================
// FUNCIONES DE SERVICIO
// ============================================

/**
 * Listar informes
 */
export async function listarInformes(params?: {
  modulo?: ModuloInforme
  tipo?: TipoInforme
  esPlantilla?: boolean
  favorito?: boolean
  busqueda?: string
  page?: number
  limit?: number
}): Promise<{ data: IInforme[]; pagination: any }> {
  const query = new URLSearchParams()
  if (params?.modulo) query.append('modulo', params.modulo)
  if (params?.tipo) query.append('tipo', params.tipo)
  if (params?.esPlantilla !== undefined) query.append('esPlantilla', String(params.esPlantilla))
  if (params?.favorito) query.append('favorito', 'true')
  if (params?.busqueda) query.append('busqueda', params.busqueda)
  if (params?.page) query.append('page', String(params.page))
  if (params?.limit) query.append('limit', String(params.limit))

  const response = await api.get(`/informes?${query.toString()}`)
  return response.data
}

/**
 * Obtener informe por ID
 */
export async function obtenerInforme(id: string): Promise<IInforme> {
  const response = await api.get(`/informes/${id}`)
  return response.data.data
}

/**
 * Crear informe
 */
export async function crearInforme(data: Partial<IInforme>): Promise<IInforme> {
  const response = await api.post('/informes', data)
  return response.data.data
}

/**
 * Actualizar informe
 */
export async function actualizarInforme(id: string, data: Partial<IInforme>): Promise<IInforme> {
  const response = await api.put(`/informes/${id}`, data)
  return response.data.data
}

/**
 * Eliminar informe
 */
export async function eliminarInforme(id: string): Promise<void> {
  await api.delete(`/informes/${id}`)
}

/**
 * Duplicar informe
 */
export async function duplicarInforme(id: string): Promise<IInforme> {
  const response = await api.post(`/informes/${id}/duplicar`)
  return response.data.data
}

/**
 * Toggle favorito
 */
export async function toggleFavorito(id: string): Promise<IInforme> {
  const response = await api.post(`/informes/${id}/favorito`)
  return response.data.data
}

/**
 * Ejecutar informe
 */
export async function ejecutarInforme(
  id: string,
  params?: { parametros?: Record<string, any>; page?: number; limit?: number }
): Promise<IResultadoInforme> {
  const response = await api.post(`/informes/${id}/ejecutar`, params || {})
  return {
    datos: response.data.data,
    totales: response.data.totales,
    pagination: response.data.pagination,
  }
}

/**
 * Exportar informe
 */
export async function exportarInforme(
  id: string,
  formato: 'pdf' | 'excel' | 'csv',
  parametros?: Record<string, any>
): Promise<Blob> {
  const response = await api.post(
    `/informes/${id}/exportar`,
    { formato, parametros },
    { responseType: 'blob' }
  )
  return response.data
}

/**
 * Obtener catálogo de colecciones y campos
 */
export async function obtenerCatalogo(modulo?: ModuloInforme): Promise<Record<string, ICatalogoColeccion[]>> {
  const query = modulo ? `?modulo=${modulo}` : ''
  const response = await api.get(`/informes/catalogo${query}`)
  return response.data.data
}

/**
 * Obtener plantillas predefinidas
 */
export async function obtenerPlantillas(modulo?: ModuloInforme): Promise<IInforme[]> {
  const query = modulo ? `?modulo=${modulo}` : ''
  const response = await api.get(`/informes/plantillas${query}`)
  return response.data.data
}

/**
 * Inicializar plantillas
 * @param forzar - Si es true, elimina las plantillas existentes antes de crear las nuevas
 */
export async function inicializarPlantillas(forzar: boolean = false): Promise<{ message: string; data: { insertados: number; existentes: number; eliminados?: number } }> {
  const response = await api.post('/informes/inicializar-plantillas', { forzar })
  return response.data
}

/**
 * Generar informe con IA
 */
export async function generarInformeConIA(
  comando: string,
  ejecutar: boolean = true
): Promise<IResultadoIA> {
  const response = await api.post('/informes/ai/generar', { comando, ejecutar })
  return response.data.data
}

/**
 * Obtener sugerencias de comandos IA
 */
export async function obtenerSugerenciasIA(modulo?: ModuloInforme): Promise<string[]> {
  const query = modulo ? `?modulo=${modulo}` : ''
  const response = await api.get(`/informes/ai/sugerencias${query}`)
  return response.data.data
}

// ============================================
// UTILIDADES
// ============================================

export const MODULOS_INFO: Record<string, { label: string; icon: string; color: string }> = {
  [ModuloInforme.VENTAS]: { label: 'Ventas', icon: 'TrendingUp', color: 'bg-green-500' },
  [ModuloInforme.COMPRAS]: { label: 'Compras', icon: 'ShoppingCart', color: 'bg-blue-500' },
  [ModuloInforme.STOCK]: { label: 'Stock', icon: 'Package', color: 'bg-amber-500' },
  [ModuloInforme.TESORERIA]: { label: 'Tesorería', icon: 'Wallet', color: 'bg-purple-500' },
  [ModuloInforme.PERSONAL]: { label: 'Personal', icon: 'Users', color: 'bg-indigo-500' },
  [ModuloInforme.CLIENTES]: { label: 'Clientes', icon: 'UserCheck', color: 'bg-cyan-500' },
  [ModuloInforme.PROVEEDORES]: { label: 'Proveedores', icon: 'Truck', color: 'bg-orange-500' },
  [ModuloInforme.PROYECTOS]: { label: 'Proyectos', icon: 'Briefcase', color: 'bg-pink-500' },
  [ModuloInforme.CRM]: { label: 'CRM', icon: 'Target', color: 'bg-rose-500' },
  [ModuloInforme.CONTABILIDAD]: { label: 'Contabilidad', icon: 'Calculator', color: 'bg-teal-500' },
  [ModuloInforme.TPV]: { label: 'TPV', icon: 'Monitor', color: 'bg-violet-500' },
  [ModuloInforme.PRESUPUESTOS]: { label: 'Presupuestos', icon: 'FileText', color: 'bg-emerald-500' },
  [ModuloInforme.PEDIDOS]: { label: 'Pedidos', icon: 'ShoppingCart', color: 'bg-sky-500' },
  [ModuloInforme.ALBARANES]: { label: 'Albaranes', icon: 'Truck', color: 'bg-lime-500' },
  [ModuloInforme.GENERAL]: { label: 'General', icon: 'LayoutDashboard', color: 'bg-gray-500' },
  // Alias para compatibilidad
  'rrhh': { label: 'RRHH', icon: 'Users', color: 'bg-indigo-500' },
}

// Fallback para módulos no definidos
export const getModuloInfo = (modulo: string) => {
  return MODULOS_INFO[modulo] || { label: modulo || 'Sin módulo', icon: 'FileText', color: 'bg-gray-400' }
}

export const TIPOS_INFORME_INFO: Record<TipoInforme, { label: string; icon: string }> = {
  [TipoInforme.TABLA]: { label: 'Tabla', icon: 'Table' },
  [TipoInforme.GRAFICO]: { label: 'Gráfico', icon: 'BarChart' },
  [TipoInforme.MIXTO]: { label: 'Mixto', icon: 'LayoutGrid' },
}

/**
 * Formatear valor según tipo de campo
 */
export function formatearValor(valor: any, tipo: TipoCampo): string {
  if (valor === null || valor === undefined) return '-'

  switch (tipo) {
    case TipoCampo.MONEDA:
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }).format(valor)
    case TipoCampo.NUMERO:
      return new Intl.NumberFormat('es-ES').format(valor)
    case TipoCampo.PORCENTAJE:
      return `${(valor * 100).toFixed(2)}%`
    case TipoCampo.FECHA:
      return new Date(valor).toLocaleDateString('es-ES')
    case TipoCampo.BOOLEAN:
      return valor ? 'Sí' : 'No'
    default:
      return String(valor)
  }
}
