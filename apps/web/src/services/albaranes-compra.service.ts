import { api } from './api'
import {
  AlbaranCompra,
  CreateAlbaranCompraDTO,
  UpdateAlbaranCompraDTO,
  AlbaranesCompraFilters,
  AlbaranesCompraResponse,
  AlbaranCompraResponse,
  AlbaranCompraEstadisticas,
  EstadoAlbaranCompra,
} from '@/types/albaran-compra.types'

export const albaranesCompraService = {
  // ============================================
  // LISTAR ALBARANES DE COMPRA CON FILTROS Y PAGINACION
  // ============================================

  getAll: async (filters?: AlbaranesCompraFilters): Promise<AlbaranesCompraResponse> => {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.estado) params.append('estado', filters.estado)
    if (filters?.proveedorId) params.append('proveedorId', filters.proveedorId)
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo))
    if (filters?.facturado !== undefined) params.append('facturado', String(filters.facturado))
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
    if (filters?.fechaRecepcionDesde) params.append('fechaRecepcionDesde', filters.fechaRecepcionDesde)
    if (filters?.fechaRecepcionHasta) params.append('fechaRecepcionHasta', filters.fechaRecepcionHasta)
    if (filters?.importeMinimo) params.append('importeMinimo', String(filters.importeMinimo))
    if (filters?.importeMaximo) params.append('importeMaximo', String(filters.importeMaximo))
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

    // Anadir filtros avanzados si existen
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (key.includes('_') && value !== undefined && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await api.get(`/albaranes-compra?${params.toString()}`)
    return response.data
  },

  // ============================================
  // OBTENER ALBARAN DE COMPRA POR ID
  // ============================================

  getById: async (id: string): Promise<AlbaranCompraResponse> => {
    const response = await api.get(`/albaranes-compra/${id}`)
    return response.data
  },

  // ============================================
  // CREAR ALBARAN DE COMPRA
  // ============================================

  create: async (data: CreateAlbaranCompraDTO): Promise<AlbaranCompraResponse> => {
    const response = await api.post('/albaranes-compra', data)
    return response.data
  },

  // ============================================
  // CREAR DESDE PEDIDO DE COMPRA
  // ============================================

  crearDesdePedido: async (data: {
    pedidoCompraId: string
    almacenId: string
    numeroAlbaranProveedor?: string
    observaciones?: string
    recibirTodo?: boolean
    lineas?: Array<{
      lineaId: string
      cantidadRecibida: number
      varianteId?: string
      lote?: string
      ubicacion?: string
    }>
  }): Promise<AlbaranCompraResponse> => {
    const response = await api.post('/albaranes-compra/desde-pedido', data)
    return response.data
  },

  // ============================================
  // ACTUALIZAR ALBARAN DE COMPRA
  // ============================================

  update: async (id: string, data: UpdateAlbaranCompraDTO): Promise<AlbaranCompraResponse> => {
    const response = await api.put(`/albaranes-compra/${id}`, data)
    return response.data
  },

  // ============================================
  // ELIMINAR ALBARAN DE COMPRA
  // ============================================

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/albaranes-compra/${id}`)
    return response.data
  },

  // ============================================
  // ELIMINAR MULTIPLES ALBARANES DE COMPRA
  // ============================================

  deleteMany: async (ids: string[]): Promise<{ success: boolean; message: string; data: { eliminados: number } }> => {
    const response = await api.post('/albaranes-compra/bulk/delete', { ids })
    return response.data
  },

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  cambiarEstado: async (id: string, estado: EstadoAlbaranCompra): Promise<AlbaranCompraResponse> => {
    const response = await api.patch(`/albaranes-compra/${id}/estado`, { estado })
    return response.data
  },

  // ============================================
  // REGISTRAR RECEPCION
  // ============================================

  registrarRecepcion: async (
    id: string,
    recepcion: {
      lineas: Array<{
        lineaId: string
        cantidadRecibida: number
        almacenId?: string
        lote?: string
        numeroSerie?: string
      }>
      fechaRecepcion?: string
      observaciones?: string
    }
  ): Promise<AlbaranCompraResponse> => {
    const response = await api.post(`/albaranes-compra/${id}/recepcion`, recepcion)
    return response.data
  },

  // ============================================
  // DUPLICAR ALBARAN DE COMPRA
  // ============================================

  duplicar: async (id: string): Promise<AlbaranCompraResponse> => {
    const response = await api.post(`/albaranes-compra/${id}/duplicar`)
    return response.data
  },

  // ============================================
  // OBTENER ESTADISTICAS
  // ============================================

  getEstadisticas: async (): Promise<{ success: boolean; data: AlbaranCompraEstadisticas }> => {
    const response = await api.get('/albaranes-compra/estadisticas')
    return response.data
  },

  // ============================================
  // OBTENER ALBARANES POR PROVEEDOR
  // ============================================

  getByProveedor: async (proveedorId: string, filters?: AlbaranesCompraFilters): Promise<AlbaranesCompraResponse> => {
    return albaranesCompraService.getAll({ ...filters, proveedorId })
  },

  // ============================================
  // OBTENER ALBARANES PENDIENTES DE FACTURAR
  // ============================================

  getPendientesFacturar: async (proveedorId?: string): Promise<AlbaranesCompraResponse> => {
    const params = new URLSearchParams()
    params.append('facturado', 'false')
    params.append('estado', 'recibido')
    if (proveedorId) params.append('proveedorId', proveedorId)

    const response = await api.get(`/albaranes-compra?${params.toString()}`)
    return response.data
  },

  // ============================================
  // OBTENER ALERTAS
  // ============================================

  getAlertas: async (diasAlerta: number = 30): Promise<{
    success: boolean
    data: {
      alertas: {
        pendientesFacturar: AlbaranCompra[]
        pendientesRecepcion: AlbaranCompra[]
        antiguosSinFacturar: AlbaranCompra[]
      }
      resumen: {
        pendientesFacturar: number
        pendientesRecepcion: number
        antiguosSinFacturar: number
        total: number
      }
    }
  }> => {
    const response = await api.get(`/albaranes-compra/alertas?diasAlerta=${diasAlerta}`)
    return response.data
  },

  // ============================================
  // ENVIAR POR EMAIL
  // ============================================

  enviarPorEmail: async (
    id: string,
    opciones?: {
      asunto?: string
      mensaje?: string
      cc?: string[]
    }
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/albaranes-compra/${id}/enviar-email`, opciones || {})
    return response.data
  },

  // ============================================
  // GENERAR PDF
  // ============================================

  generarPDF: async (id: string): Promise<Blob> => {
    const response = await api.get(`/albaranes-compra/${id}/pdf`, {
      responseType: 'blob',
    })
    return response.data
  },

  // ============================================
  // OCR - PROCESAR DOCUMENTO
  // ============================================

  /**
   * Procesar documento de compra con OCR
   * @param file - Archivo imagen o PDF del albarán/factura del proveedor
   */
  procesarDocumentoOCR: async (file: File): Promise<OCRResultResponse> => {
    const formData = new FormData()
    formData.append('documento', file)

    const response = await api.post('/albaranes-compra/ocr/procesar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Buscar productos sugeridos por descripción
   * Útil cuando el OCR no encuentra el producto por código
   */
  buscarProductosSugeridosOCR: async (descripcion: string): Promise<{
    success: boolean
    data: Array<{
      _id: string
      nombre: string
      sku: string
      referenciaProveedor?: string
      precioCompra?: number
    }>
  }> => {
    const response = await api.get(`/albaranes-compra/ocr/buscar-productos?descripcion=${encodeURIComponent(descripcion)}`)
    return response.data
  },

  /**
   * Crear albarán de compra desde datos extraídos por OCR
   */
  crearDesdeOCR: async (data: {
    proveedorId: string
    almacenId: string
    numeroAlbaranProveedor?: string
    fecha?: string
    lineas: Array<{
      productoId?: string
      nombre?: string
      descripcion: string
      cantidad: number
      precioUnitario: number
      descuento?: number
      iva?: number
      codigoProveedor?: string
    }>
    observaciones?: string
  }): Promise<AlbaranCompraResponse> => {
    const response = await api.post('/albaranes-compra/ocr/crear', data)
    return response.data
  },

  // ============================================
  // ENVÍO MASIVO POR EMAIL
  // ============================================

  enviarMasivoPorEmail: async (
    ids: string[],
    opciones?: {
      asunto?: string
      mensaje?: string
    }
  ): Promise<{
    success: boolean
    message: string
    data: {
      total: number
      enviados: number
      fallidos: number
      resultados: Array<{ id: string; codigo: string; success: boolean; message: string }>
    }
  }> => {
    const response = await api.post('/albaranes-compra/bulk/enviar-email', { ids, ...opciones })
    return response.data
  },

  // ============================================
  // EXPORTAR PDFs MASIVO
  // ============================================

  exportarPDFsMasivo: async (ids: string[]): Promise<Blob> => {
    const response = await api.post(
      '/albaranes-compra/bulk/exportar-pdf',
      { ids },
      { responseType: 'blob' }
    )
    return response.data
  },

  // ============================================
  // WHATSAPP
  // ============================================

  getWhatsAppURL: async (id: string): Promise<{ success: boolean; data: { url: string } }> => {
    const response = await api.get(`/albaranes-compra/${id}/whatsapp`)
    return response.data
  },

  getWhatsAppURLsMasivo: async (ids: string[]): Promise<{
    success: boolean
    data: Array<{
      id: string
      codigo: string
      url?: string
      telefono?: string
      proveedorNombre?: string
      error?: string
    }>
  }> => {
    const response = await api.post('/albaranes-compra/whatsapp-masivo', { ids })
    return response.data
  },
}

// Tipos para respuestas de OCR
export interface OCRResultResponse {
  success: boolean
  data: {
    success: boolean
    datos: {
      cifProveedor: string | null
      nombreProveedor: string | null
      numeroDocumento: string | null
      fecha: string | null
      lineas: Array<{
        codigoProducto: string | null
        descripcion: string
        cantidad: number
        precioUnitario: number
        descuento?: number
        iva?: number
        total?: number
      }>
      totales?: {
        subtotal?: number
        iva?: number
        total?: number
      }
      observaciones?: string
      confianza: 'alta' | 'media' | 'baja'
      camposNoDetectados: string[]
    } | null
    proveedorEncontrado?: {
      _id: string
      nombre: string
      cif: string
    } | null
    productosEncontrados: Array<{
      lineaIndex: number
      codigoProveedor: string
      productoId: string
      nombre: string
      sku: string
      precioCompra: number
    }>
    productosNoEncontrados: Array<{
      lineaIndex: number
      codigoProveedor: string
      descripcion: string
    }>
    advertencias: string[]
    error?: string
  }
}

export default albaranesCompraService
