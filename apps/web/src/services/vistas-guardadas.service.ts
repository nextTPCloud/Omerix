import { api } from './api';

export interface VistaGuardada {
  _id: string;
  nombre: string;
  modulo: string;
  descripcion?: string;
  configuracion: any;
  esDefault: boolean;
  compartida: boolean;
  icono?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

class VistasGuardadasService {
  async getAll(modulo: string, incluirCompartidas = true): Promise<VistaGuardada[]> {
    try {
      const response = await api.get(`/vistas-guardadas?modulo=${modulo}&incluirCompartidas=${incluirCompartidas}`);
      console.log('Vistas guardadas obtenidas:', response.data.data);
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener vistas guardadas:', error);
      return [];
    }
  }

  async getById(id: string): Promise<VistaGuardada | null> {
    try {
      const response = await api.get(`/vistas-guardadas/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener vista:', error);
      return null;
    }
  }

  async getDefault(modulo: string): Promise<VistaGuardada | null> {
    try {
      const response = await api.get(`/vistas-guardadas/default/${modulo}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener vista por defecto:', error);
      return null;
    }
  }

  async create(data: {
    modulo: string;
    nombre: string;
    descripcion?: string;
    configuracion: any;
    esDefault?: boolean;
  }): Promise<VistaGuardada> {
    const response = await api.post('/vistas-guardadas', data);
    return response.data.data;
  }

  async update(id: string, data: Partial<VistaGuardada>): Promise<VistaGuardada> {
    const response = await api.put(`/vistas-guardadas/${id}`, data);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/vistas-guardadas/${id}`);
  }

  async duplicate(id: string, nuevoNombre?: string): Promise<VistaGuardada> {
    const response = await api.post(`/vistas-guardadas/${id}/duplicate`, {
      nuevoNombre,
    });
    return response.data.data;
  }

  async setDefault(id: string): Promise<VistaGuardada> {
    const response = await api.put(`/vistas-guardadas/${id}/set-default`);
    return response.data.data;
  }
}

export default new VistasGuardadasService();