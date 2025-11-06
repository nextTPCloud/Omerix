import { api } from './api';

export interface Cliente {
  _id: string;
  empresaId: string;
  tipoCliente: 'empresa' | 'particular';
  codigo: string;
  nombre: string;
  nombreComercial?: string;
  nif: string;
  email?: string;
  telefono?: string;
  movil?: string;
  web?: string;
  direccion: {
    calle: string;
    numero?: string;
    piso?: string;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
    latitud?: number;
    longitud?: number;
  };
  direccionEnvio?: {
    calle: string;
    numero?: string;
    piso?: string;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
    latitud?: number;
    longitud?: number;
  };
  formaPago: 'contado' | 'transferencia' | 'domiciliacion' | 'confirming' | 'pagare';
  diasPago: number;
  descuentoGeneral?: number;
  tarifaId?: string;
  iban?: string;
  swift?: string;
  personaContacto?: {
    nombre: string;
    cargo?: string;
    telefono?: string;
    email?: string;
  };
  categoriaId?: string;
  zona?: string;
  vendedorId?: string;
  limiteCredito?: number;
  riesgoActual: number;
  activo: boolean;
  observaciones?: string;
  tags?: string[];
  archivos?: Array<{
    nombre: string;
    url: string;
    tipo: string;
    tamaño: number;
    fechaSubida: Date;
    subidoPor: string;
  }>;
  creadoPor: string;
  modificadoPor?: string;
  fechaCreacion: Date;
  fechaModificacion?: Date;
}

export interface GetClientesParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  activo?: boolean;
  vendedorId?: string;
  categoriaId?: string;
  zona?: string;
  tags?: string[];
}

export interface GetClientesResponse {
  success: boolean;
  data: Cliente[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Estadisticas {
  total: number;
  activos: number;
  inactivos: number;
  excedenCredito: number;
  riesgoTotal: number;
}

class ClientesService {
  
  // ============================================
  // OBTENER TODOS CON FILTROS
  // ============================================
  
  async obtenerTodos(params?: GetClientesParams): Promise<GetClientesResponse> {
    const response = await api.get('/clientes', { params });
    return response.data;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  
  async obtenerPorId(id: string): Promise<Cliente> {
    const response = await api.get(`/clientes/${id}`);
    return response.data.data;
  }

  // ============================================
  // CREAR
  // ============================================
  
  async crear(cliente: Partial<Cliente>): Promise<Cliente> {
    const response = await api.post('/clientes', cliente);
    return response.data.data;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  
  async actualizar(id: string, cliente: Partial<Cliente>): Promise<Cliente> {
    const response = await api.put(`/clientes/${id}`, cliente);
    return response.data.data;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  
  async eliminar(id: string): Promise<void> {
    await api.delete(`/clientes/${id}`);
  }

  // ============================================
  // ELIMINACIÓN MÚLTIPLE
  // ============================================
  
  async eliminarMultiples(ids: string[]): Promise<{ eliminados: number }> {
    const response = await api.post('/clientes/bulk-delete', { ids });
    return response.data.data;
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================
  
  async cambiarEstado(id: string, activo: boolean): Promise<Cliente> {
    const response = await api.patch(`/clientes/${id}/estado`, { activo });
    return response.data.data;
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================
  
  async obtenerEstadisticas(): Promise<Estadisticas> {
    const response = await api.get('/clientes/estadisticas');
    return response.data.data;
  }

  // ============================================
  // SUBIR ARCHIVO
  // ============================================
  
  async subirArchivo(id: string, archivo: File): Promise<Cliente> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await api.post(`/clientes/${id}/archivos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // ============================================
  // ELIMINAR ARCHIVO
  // ============================================
  
  async eliminarArchivo(id: string, archivoUrl: string): Promise<Cliente> {
    const response = await api.delete(`/clientes/${id}/archivos`, {
      data: { archivoUrl },
    });
    return response.data.data;
  }

  // ============================================
  // EXPORTAR A CSV
  // ============================================
  
  async exportarCSV(params?: GetClientesParams): Promise<Blob> {
    const response = await api.get('/clientes/exportar/csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  // ============================================
  // OBTENER URL DE GOOGLE MAPS
  // ============================================
  
  getGoogleMapsUrl(direccion: Cliente['direccion']): string {
    const query = encodeURIComponent(
      `${direccion.calle} ${direccion.numero || ''}, ${direccion.codigoPostal} ${direccion.ciudad}, ${direccion.provincia}, ${direccion.pais}`
    );
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
}

export const clientesService = new ClientesService();