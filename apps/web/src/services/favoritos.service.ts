import { api } from './api'

// Interfaces
export interface Favorito {
  href: string
  title: string
  icon?: string
  orden: number
  fechaAgregado: Date
}

export interface AddFavoritoDTO {
  href: string
  title: string
  icon?: string
}

export interface ReorderFavoritoItem {
  href: string
  orden: number
}

export interface FavoritosResponse {
  success: boolean
  data: Favorito[]
  message?: string
}

export const favoritosService = {
  // ============================================
  // OBTENER FAVORITOS DEL USUARIO
  // ============================================

  getAll: async (): Promise<FavoritosResponse> => {
    const response = await api.get('/configuraciones/favoritos')
    return response.data
  },

  // ============================================
  // AGREGAR FAVORITO
  // ============================================

  add: async (data: AddFavoritoDTO): Promise<FavoritosResponse> => {
    const response = await api.post('/configuraciones/favoritos', data)
    return response.data
  },

  // ============================================
  // ELIMINAR FAVORITO
  // ============================================

  remove: async (href: string): Promise<FavoritosResponse> => {
    const response = await api.delete('/configuraciones/favoritos', {
      data: { href }
    })
    return response.data
  },

  // ============================================
  // REORDENAR FAVORITOS
  // ============================================

  reorder: async (favoritos: ReorderFavoritoItem[]): Promise<FavoritosResponse> => {
    const response = await api.put('/configuraciones/favoritos/reorder', {
      favoritos
    })
    return response.data
  },

  // ============================================
  // TOGGLE FAVORITO (agregar o eliminar)
  // ============================================

  toggle: async (data: AddFavoritoDTO, isFavorite: boolean): Promise<FavoritosResponse> => {
    if (isFavorite) {
      return favoritosService.remove(data.href)
    } else {
      return favoritosService.add(data)
    }
  },
}
