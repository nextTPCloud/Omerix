import { api } from './api'
import type {
  Producto,
  CreateProductoDTO,
  UpdateProductoDTO,
  ProductosResponse,
  ProductoResponse,
  ProductosStockBajoResponse,
  EstadisticasProductosResponse,
  UpdateStockDTO,
  GenerarVariantesDTO,
  AgregarLoteDTO,
  AgregarNumeroSerieDTO,
  TransferirStockDTO,
} from '@/types/producto.types'

/**
 * Parámetros de búsqueda y filtrado para productos
 */
export interface SearchProductosParams {
  q?: string
  familiaId?: string
  marca?: string
  tipo?: 'simple' | 'variantes' | 'compuesto' | 'servicio' | 'materia_prima'
  estadoId?: string
  situacionId?: string
  clasificacionId?: string
  activo?: boolean
  disponible?: boolean
  destacado?: boolean
  nuevo?: boolean
  oferta?: boolean
  stockBajo?: boolean
  sinStock?: boolean
  gestionaStock?: boolean
  tieneVariantes?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Servicio para la gestión de productos
 * Proporciona métodos para CRUD, gestión de stock, variantes, trazabilidad, etc.
 */
class ProductosService {
  private baseUrl = '/productos'

  // ============================================
  // CRUD BÁSICO
  // ============================================

  /**
   * Obtiene todos los productos con paginación y filtros opcionales
   */
  async getAll(params?: SearchProductosParams): Promise<ProductosResponse> {
    try {
      const response = await api.get(this.baseUrl, { params })
      return response.data
    } catch (error) {
      console.error('Error al obtener productos:', error)
      throw error
    }
  }

  /**
   * Obtiene un producto por su ID
   */
  async getById(id: string): Promise<ProductoResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error al obtener producto ${id}:`, error)
      throw error
    }
  }

  /**
   * Crea un nuevo producto
   */
  async create(data: CreateProductoDTO): Promise<ProductoResponse> {
    try {
      const response = await api.post(this.baseUrl, data)
      return response.data
    } catch (error) {
      console.error('Error al crear producto:', error)
      throw error
    }
  }

  /**
   * Actualiza un producto existente
   */
  async update(id: string, data: UpdateProductoDTO): Promise<ProductoResponse> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data)
      return response.data
    } catch (error) {
      console.error(`Error al actualizar producto ${id}:`, error)
      throw error
    }
  }

  /**
   * Elimina un producto por su ID
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error al eliminar producto ${id}:`, error)
      throw error
    }
  }

  /**
   * Elimina múltiples productos en una sola operación
   */
  async bulkDelete(ids: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`${this.baseUrl}/bulk-delete`, { ids })
      return response.data
    } catch (error) {
      console.error('Error al eliminar productos en lote:', error)
      throw error
    }
  }

  // ============================================
  // GESTIÓN DE STOCK
  // ============================================

  /**
   * Actualiza el stock de un producto
   */
  async updateStock(id: string, data: UpdateStockDTO): Promise<ProductoResponse> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}/stock`, data)
      return response.data
    } catch (error) {
      console.error(`Error al actualizar stock del producto ${id}:`, error)
      throw error
    }
  }

  /**
   * Obtiene el stock de un producto por almacén
   */
  async getStockPorAlmacen(id: string): Promise<any> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}/stock-almacen`)
      return response.data
    } catch (error) {
      console.error(`Error al obtener stock por almacén del producto ${id}:`, error)
      throw error
    }
  }

  /**
   * Transfiere stock entre almacenes
   */
  async transferirStock(data: TransferirStockDTO): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`${this.baseUrl}/transferir-stock`, data)
      return response.data
    } catch (error) {
      console.error('Error al transferir stock:', error)
      throw error
    }
  }

  /**
   * Ajusta el stock de un producto en un almacén específico
   */
  async ajustarStock(
    id: string,
    almacenId: string,
    cantidad: number,
    motivo?: string
  ): Promise<any> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/ajustar-stock`, {
        almacenId,
        cantidad,
        motivo,
      })
      return response.data
    } catch (error) {
      console.error(`Error al ajustar stock del producto ${id}:`, error)
      throw error
    }
  }

  // ============================================
  // GESTIÓN DE VARIANTES
  // ============================================

  /**
   * Genera variantes automáticamente basándose en atributos
   */
  async generarVariantes(id: string, data: GenerarVariantesDTO): Promise<ProductoResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/variantes`, data)
      return response.data
    } catch (error) {
      console.error(`Error al generar variantes del producto ${id}:`, error)
      throw error
    }
  }

  /**
   * Actualiza una variante específica de un producto
   */
  async actualizarVariante(
    productoId: string,
    varianteId: string,
    data: any
  ): Promise<ProductoResponse> {
    try {
      const response = await api.put(
        `${this.baseUrl}/${productoId}/variantes/${varianteId}`,
        data
      )
      return response.data
    } catch (error) {
      console.error(`Error al actualizar variante ${varianteId}:`, error)
      throw error
    }
  }

  /**
   * Elimina una variante específica de un producto
   */
  async eliminarVariante(productoId: string, varianteId: string): Promise<ProductoResponse> {
    try {
      const response = await api.delete(`${this.baseUrl}/${productoId}/variantes/${varianteId}`)
      return response.data
    } catch (error) {
      console.error(`Error al eliminar variante ${varianteId}:`, error)
      throw error
    }
  }

  // ============================================
  // TRAZABILIDAD - LOTES
  // ============================================

  /**
   * Agrega un nuevo lote a un producto
   */
  async agregarLote(id: string, data: AgregarLoteDTO): Promise<ProductoResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/lotes`, data)
      return response.data
    } catch (error) {
      console.error(`Error al agregar lote al producto ${id}:`, error)
      throw error
    }
  }

  /**
   * Actualiza un lote específico de un producto
   */
  async actualizarLote(productoId: string, loteId: string, data: any): Promise<ProductoResponse> {
    try {
      const response = await api.put(`${this.baseUrl}/${productoId}/lotes/${loteId}`, data)
      return response.data
    } catch (error) {
      console.error(`Error al actualizar lote ${loteId}:`, error)
      throw error
    }
  }

  /**
   * Elimina un lote específico de un producto
   */
  async eliminarLote(productoId: string, loteId: string): Promise<ProductoResponse> {
    try {
      const response = await api.delete(`${this.baseUrl}/${productoId}/lotes/${loteId}`)
      return response.data
    } catch (error) {
      console.error(`Error al eliminar lote ${loteId}:`, error)
      throw error
    }
  }

  // ============================================
  // TRAZABILIDAD - NÚMEROS DE SERIE
  // ============================================

  /**
   * Agrega un nuevo número de serie a un producto
   */
  async agregarNumeroSerie(id: string, data: AgregarNumeroSerieDTO): Promise<ProductoResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/numeros-serie`, data)
      return response.data
    } catch (error) {
      console.error(`Error al agregar número de serie al producto ${id}:`, error)
      throw error
    }
  }

  /**
   * Actualiza un número de serie específico de un producto
   */
  async actualizarNumeroSerie(
    productoId: string,
    serieId: string,
    data: any
  ): Promise<ProductoResponse> {
    try {
      const response = await api.put(
        `${this.baseUrl}/${productoId}/numeros-serie/${serieId}`,
        data
      )
      return response.data
    } catch (error) {
      console.error(`Error al actualizar número de serie ${serieId}:`, error)
      throw error
    }
  }

  /**
   * Elimina un número de serie específico de un producto
   */
  async eliminarNumeroSerie(productoId: string, serieId: string): Promise<ProductoResponse> {
    try {
      const response = await api.delete(
        `${this.baseUrl}/${productoId}/numeros-serie/${serieId}`
      )
      return response.data
    } catch (error) {
      console.error(`Error al eliminar número de serie ${serieId}:`, error)
      throw error
    }
  }

  // ============================================
  // CONSULTAS ESPECIALES
  // ============================================

  /**
   * Obtiene productos con stock por debajo del mínimo
   */
  async getStockBajo(): Promise<ProductosStockBajoResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/stock-bajo`)
      return response.data
    } catch (error) {
      console.error('Error al obtener productos con stock bajo:', error)
      throw error
    }
  }

  /**
   * Obtiene productos sin stock disponible
   */
  async getSinStock(): Promise<ProductosResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/sin-stock`)
      return response.data
    } catch (error) {
      console.error('Error al obtener productos sin stock:', error)
      throw error
    }
  }

  /**
   * Obtiene estadísticas generales de productos
   */
  async getEstadisticas(): Promise<EstadisticasProductosResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/estadisticas`)
      return response.data
    } catch (error) {
      console.error('Error al obtener estadísticas de productos:', error)
      throw error
    }
  }

  /**
   * Busca un producto por su código de barras
   */
  async buscarPorCodigoBarras(codigo: string): Promise<ProductoResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/barcode/${codigo}`)
      return response.data
    } catch (error) {
      console.error(`Error al buscar producto por código de barras ${codigo}:`, error)
      throw error
    }
  }

  /**
   * Busca un producto por su SKU
   */
  async buscarPorSKU(sku: string): Promise<ProductoResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/sku/${sku}`)
      return response.data
    } catch (error) {
      console.error(`Error al buscar producto por SKU ${sku}:`, error)
      throw error
    }
  }

  // ============================================
  // GESTIÓN DE IMÁGENES
  // ============================================

  /**
   * Sube una imagen para un producto
   */
  async subirImagen(id: string, file: File): Promise<{ success: boolean; url: string }> {
    try {
      const formData = new FormData()
      formData.append('imagen', file)

      const response = await api.post(`${this.baseUrl}/${id}/imagenes`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      console.error(`Error al subir imagen del producto ${id}:`, error)
      throw error
    }
  }

  /**
   * Elimina una imagen de un producto
   */
  async eliminarImagen(id: string, imagenUrl: string): Promise<ProductoResponse> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}/imagenes`, {
        data: { imagenUrl },
      })
      return response.data
    } catch (error) {
      console.error(`Error al eliminar imagen del producto ${id}:`, error)
      throw error
    }
  }

  /**
   * Establece una imagen como principal del producto
   */
  async establecerImagenPrincipal(id: string, imagenUrl: string): Promise<ProductoResponse> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}/imagen-principal`, { imagenUrl })
      return response.data
    } catch (error) {
      console.error(`Error al establecer imagen principal del producto ${id}:`, error)
      throw error
    }
  }

  // ============================================
  // OPERACIONES ESPECIALES
  // ============================================

  /**
   * Duplica un producto existente
   */
  async duplicar(id: string): Promise<ProductoResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/duplicar`)
      return response.data
    } catch (error) {
      console.error(`Error al duplicar producto ${id}:`, error)
      throw error
    }
  }

  /**
   * Busca SKUs existentes por prefijo (para auto-sugerencia de códigos)
   */
  async searchSkus(prefix: string): Promise<string[]> {
    try {
      const response = await api.get<{ success: boolean; data: string[] }>(
        `${this.baseUrl}/skus`,
        { params: { prefix } }
      )
      return response.data.data
    } catch (error) {
      console.error('Error al buscar SKUs:', error)
      return []
    }
  }
}

// Exportar instancia singleton del servicio
export const productosService = new ProductosService()
