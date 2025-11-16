import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Usuario } from '@/types/auth.types'
import { authService } from '@/services/auth.service'

interface AuthState {
  user: Usuario | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isHydrated: boolean  // ← NUEVO: controla si ya se cargó del localStorage
  setAuth: (user: Usuario, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  logout: () => Promise<void>  // ← NUEVO: logout con revocación de token
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

      logout: async () => {
        const state = useAuthStore.getState()
        const refreshToken = state.refreshToken

        // Revocar token en el servidor si existe
        if (refreshToken) {
          await authService.logout(refreshToken)
        } else {
          // Si no hay refreshToken, solo limpiar local
          authService.logoutLocal()
        }

        // Limpiar estado
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