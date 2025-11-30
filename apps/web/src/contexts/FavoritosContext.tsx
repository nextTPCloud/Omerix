'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { favoritosService, Favorito, AddFavoritoDTO } from '@/services/favoritos.service'

interface FavoritosContextType {
  favoritos: Favorito[]
  loading: boolean
  error: string | null
  isFavorito: (href: string) => boolean
  addFavorito: (data: AddFavoritoDTO) => Promise<void>
  removeFavorito: (href: string) => Promise<void>
  toggleFavorito: (data: AddFavoritoDTO) => Promise<void>
  refresh: () => Promise<void>
}

const FavoritosContext = createContext<FavoritosContextType | undefined>(undefined)

interface FavoritosProviderProps {
  children: ReactNode
}

export function FavoritosProvider({ children }: FavoritosProviderProps) {
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
    } catch (err: any) {
      console.error('Error al eliminar favorito:', err)
      throw err
    }
  }, [])

  // Toggle favorito
  const toggleFavorito = useCallback(async (data: AddFavoritoDTO) => {
    const isCurrentlyFavorite = isFavorito(data.href)
    try {
      if (isCurrentlyFavorite) {
        const response = await favoritosService.remove(data.href)
        if (response.success) {
          setFavoritos(response.data || [])
        }
      } else {
        const response = await favoritosService.add(data)
        if (response.success) {
          setFavoritos(response.data || [])
        }
      }
    } catch (err: any) {
      console.error('Error al toggle favorito:', err)
      throw err
    }
  }, [isFavorito])

  return (
    <FavoritosContext.Provider
      value={{
        favoritos,
        loading,
        error,
        isFavorito,
        addFavorito,
        removeFavorito,
        toggleFavorito,
        refresh: loadFavoritos,
      }}
    >
      {children}
    </FavoritosContext.Provider>
  )
}

export function useFavoritosContext() {
  const context = useContext(FavoritosContext)
  if (context === undefined) {
    throw new Error('useFavoritosContext debe usarse dentro de un FavoritosProvider')
  }
  return context
}
