import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Usuario } from '@/types/auth.types'

interface AuthState {
  user: Usuario | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isHydrated: boolean  // ← NUEVO: controla si ya se cargó del localStorage
  setAuth: (user: Usuario, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  setHydrated: () => void  // ← NUEVO
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,  // ← NUEVO

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
      },

      clearAuth: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      setHydrated: () => {
        set({ isHydrated: true })
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Cuando termine de cargar del localStorage, marcar como hidratado
        state?.setHydrated()
      },
    }
  )
)