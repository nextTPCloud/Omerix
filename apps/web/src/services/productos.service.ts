import { api } from './api';
import {
  Producto,
  CreateProductoDTO,
  UpdateProductoDTO,
  UpdateStockDTO,
  GenerarVariantesDTO,
  ProductosResponse,
  ProductoResponse,
  ProductosStockBajoResponse,
} from '@/types/producto.types';

export const productosService = {
  // Obtener todos los productos con paginación y filtros
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    familiaId?: string;
    activo?: boolean;
  }): Promise<ProductosResponse> {
    const response = await api.get('/productos', { params });
    return response.data;
  },

  // Obtener productos con stock bajo
  async getStockBajo(): Promise<ProductosStockBajoResponse> {
    const response = await api.get('/productos/stock-bajo');
    return response.data;
  },

  // Obtener producto por ID
  async getById(id: string): Promise<ProductoResponse> {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  },

  // Obtener producto por SKU
  async getBySku(sku: string): Promise<ProductoResponse> {
    const response = await api.get(`/productos/sku/${sku}`);
    return response.data;
  },

  // Obtener producto por código de barras
  async getByCodigoBarras(codigoBarras: string): Promise<ProductoResponse> {
    const response = await api.get(`/productos/barcode/${codigoBarras}`);
    return response.data;
  },

  // Crear producto
  async create(data: CreateProductoDTO): Promise<ProductoResponse> {
    const response = await api.post('/productos', data);
    return response.data;
  },

  // Actualizar producto
  async update(id: string, data: UpdateProductoDTO): Promise<ProductoResponse> {
    const response = await api.put(`/productos/${id}`, data);
    return response.data;
  },

  // Actualizar stock de producto
  async updateStock(id: string, data: UpdateStockDTO): Promise<ProductoResponse> {
    const response = await api.put(`/productos/${id}/stock`, data);
    return response.data;
  },

  // Generar variantes de un producto
  async generarVariantes(id: string, data: GenerarVariantesDTO): Promise<ProductoResponse> {
    const response = await api.post(`/productos/${id}/variantes`, data);
    return response.data;
  },

  // Eliminar producto
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  },
};
