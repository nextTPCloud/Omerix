'use client'

import { useState, useEffect, useCallback } from 'react'
import { favoritosService, Favorito, AddFavoritoDTO } from '@/services/favoritos.service'

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar favoritos al iniciar
  const loadFavoritos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await favoritosService.getAll()
      if (response.success) {
        setFavoritos(response.data || [])
      }
    } catch (err: any) {
      console.error('Error al cargar favoritos:', err)
      setError(err.message || 'Error al cargar favoritos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFavoritos()
  }, [loadFavoritos])

  // Verificar si una ruta es favorita
  const isFavorito = useCallback((href: string): boolean => {
    return favoritos.some(f => f.href === href)
  }, [favoritos])

  // Agregar favorito
  const addFavorito = useCallback(async (data: AddFavoritoDTO) => {
    try {
      const response = await favoritosService.add(data)
      if (response.success) {
        setFavoritos(response.data || [])
      }
      return response
    } catch (err: any) {
      console.error('Error al agregar favorito:', err)
      throw err
    }
  }, [])

  // Eliminar favorito
  const removeFavorito = useCallback(async (href: string) => {
    try {
      const response = await favoritosService.remove(href)
      if (response.success) {
        setFavoritos(response.data || [])
      }
      return response
    } catch (err: any) {
      console.error('Error al eliminar favorito:', err)
      throw err
    }
  }, [])

  // Toggle favorito
  const toggleFavorito = useCallback(async (data: AddFavoritoDTO) => {
    const isCurrentlyFavorite = isFavorito(data.href)
    try {
      const response = await favoritosService.toggle(data, isCurrentlyFavorite)
      if (response.success) {
        setFavoritos(response.data || [])
      }
      return response
    } catch (err: any) {
      console.error('Error al toggle favorito:', err)
      throw err
    }
  }, [isFavorito])

  // Reordenar favoritos
  const reorderFavoritos = useCallback(async (newOrder: { href: string; orden: number }[]) => {
    try {
      const response = await favoritosService.reorder(newOrder)
      if (response.success) {
        setFavoritos(response.data || [])
      }
      return response
    } catch (err: any) {
      console.error('Error al reordenar favoritos:', err)
      throw err
    }
  }, [])

  return {
    favoritos,
    loading,
    error,
    isFavorito,
    addFavorito,
    removeFavorito,
    toggleFavorito,
    reorderFavoritos,
    refresh: loadFavoritos,
  }
}
