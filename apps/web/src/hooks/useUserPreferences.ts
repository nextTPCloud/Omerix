'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'

// Interfaz para las preferencias del usuario
export interface UserPreferences {
  // Almacén por defecto para operaciones
  almacenDefaultId: string | null
  // Otras preferencias futuras...
  temaOscuro?: boolean
  idiomaPreferido?: string
  formatoFecha?: string
  formatoMoneda?: string
}

const DEFAULT_PREFERENCES: UserPreferences = {
  almacenDefaultId: null,
  temaOscuro: false,
  idiomaPreferido: 'es',
  formatoFecha: 'DD/MM/YYYY',
  formatoMoneda: 'EUR',
}

// Key para localStorage basada en el usuario
const getStorageKey = (userId: string) => `user-preferences-${userId}`

/**
 * Hook para gestionar las preferencias del usuario
 * Almacena las preferencias en localStorage vinculadas al usuario actual
 */
export function useUserPreferences() {
  const { user } = useAuthStore()
  const [preferences, setPreferencesState] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)

  // Cargar preferencias al montar o cuando cambia el usuario
  useEffect(() => {
    if (!user?.id) {
      setPreferencesState(DEFAULT_PREFERENCES)
      setIsLoaded(true)
      return
    }

    try {
      const stored = localStorage.getItem(getStorageKey(user.id))
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferencesState({ ...DEFAULT_PREFERENCES, ...parsed })
      } else {
        setPreferencesState(DEFAULT_PREFERENCES)
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
      setPreferencesState(DEFAULT_PREFERENCES)
    }
    setIsLoaded(true)
  }, [user?.id])

  // Guardar preferencias
  const savePreferences = useCallback((newPrefs: Partial<UserPreferences>) => {
    if (!user?.id) return

    setPreferencesState(prev => {
      const updated = { ...prev, ...newPrefs }
      try {
        localStorage.setItem(getStorageKey(user.id), JSON.stringify(updated))
      } catch (error) {
        console.error('Error saving user preferences:', error)
      }
      return updated
    })
  }, [user?.id])

  // Establecer almacén por defecto
  const setAlmacenDefault = useCallback((almacenId: string | null) => {
    savePreferences({ almacenDefaultId: almacenId })
  }, [savePreferences])

  // Obtener almacén por defecto (devuelve el almacén principal si no hay preferencia)
  const getAlmacenDefault = useCallback((): string | null => {
    return preferences.almacenDefaultId
  }, [preferences.almacenDefaultId])

  return {
    preferences,
    isLoaded,
    savePreferences,
    setAlmacenDefault,
    getAlmacenDefault,
    // Accesos directos
    almacenDefaultId: preferences.almacenDefaultId,
  }
}

export default useUserPreferences
