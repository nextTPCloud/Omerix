import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Usuario } from '@/types/auth.types'
import { authService } from '@/services/auth.service'
import { isTokenExpired } from '@/utils/jwt.utils'

interface AuthState {
  user: Usuario | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isHydrated: boolean
  setAuth: (user: Usuario, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  logout: () => Promise<void>
  setHydrated: () => void
  checkAndRefreshToken: () => Promise<boolean>
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)
        }
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
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

      checkAndRefreshToken: async () => {
        const state = useAuthStore.getState()
        const { accessToken, refreshToken } = state

        // Si no hay tokens, no está autenticado
        if (!accessToken || !refreshToken) {
          return false
        }

        // Si el access token no ha expirado, todo bien (buffer de 10 segundos)
        if (!isTokenExpired(accessToken, 10)) {
          return true
        }

        // Si el refresh token también expiró, cerrar sesión
        if (isTokenExpired(refreshToken, 0)) {
          state.clearAuth()
          return false
        }

        // Intentar refrescar el token
        try {
          const response = await authService.refreshToken(refreshToken)
          if (response.accessToken) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', response.accessToken)
              if (response.refreshToken) {
                localStorage.setItem('refreshToken', response.refreshToken)
              }
            }
            set({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken || refreshToken,
            })
            return true
          }
          return false
        } catch {
          state.clearAuth()
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Verificar token al hidratar
          const { accessToken, refreshToken } = state

          // Si hay tokens pero el access token expiró (buffer de 10 segundos)
          if (accessToken && isTokenExpired(accessToken, 10)) {
            // Si el refresh token también expiró, limpiar sesión
            if (!refreshToken || isTokenExpired(refreshToken, 0)) {
              state.clearAuth()
            }
            // Si el refresh token es válido, se intentará refrescar en el siguiente paso
          }

          state.setHydrated()
        }
      },
    }
  )
)