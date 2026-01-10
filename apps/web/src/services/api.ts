import axios from 'axios';
import { isTokenExpired } from '@/utils/jwt.utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

console.log('🔧 API_URL configurada:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];
// Flag global para evitar múltiples redirecciones y errores
let isRedirectingToLogin = false;
// Timestamp del último error de auth mostrado (debounce)
let lastAuthErrorTime = 0;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Función para limpiar auth y redirigir (una sola vez)
const handleAuthFailure = () => {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('auth-storage');

  // Reset flag después de redirigir
  setTimeout(() => {
    isRedirectingToLogin = false;
  }, 2000);

  window.location.href = '/';
};

// Función para intentar refresh del token
const tryRefreshToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken || isTokenExpired(refreshToken, 0)) {
    return null;
  }

  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }

    return accessToken;
  } catch {
    return null;
  }
};

// Interceptor para añadir token y VERIFICAR PROACTIVAMENTE antes de enviar
api.interceptors.request.use(
  async (config) => {
    // Si ya estamos redirigiendo, cancelar la petición
    if (isRedirectingToLogin) {
      return Promise.reject(new axios.Cancel('Sesión expirada'));
    }

    // Excluir rutas de auth del chequeo proactivo
    const isAuthRoute = config.url?.includes('/auth/');

    let token = localStorage.getItem('accessToken');

    // Verificación proactiva: si el token está expirado, intentar refresh ANTES de enviar
    if (token && !isAuthRoute && isTokenExpired(token, 30)) {
      // Si ya hay un refresh en progreso, esperar
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              config.headers.Authorization = `Bearer ${newToken}`;
              resolve(config);
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      const newToken = await tryRefreshToken();
      isRefreshing = false;

      if (newToken) {
        processQueue(null, newToken);
        token = newToken;
      } else {
        processQueue(new Error('Refresh failed'), null);
        handleAuthFailure();
        return Promise.reject(new axios.Cancel('Sesión expirada'));
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores y refresh token (fallback si el proactivo falla)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si la petición fue cancelada (por redirección), ignorar silenciosamente
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Si ya estamos redirigiendo, no hacer nada más
    if (isRedirectingToLogin) {
      return Promise.reject(error);
    }

    // Si no es 401 o ya se reintentó, rechazar
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si ya hay un refresh en progreso, encolar
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // Marcar que se está reintentando
    originalRequest._retry = true;
    isRefreshing = true;

    const newToken = await tryRefreshToken();
    isRefreshing = false;

    if (newToken) {
      // Actualizar el header del request original
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

      // Procesar todas las peticiones encoladas
      processQueue(null, newToken);

      // Reintentar el request original con el nuevo token
      return api(originalRequest);
    } else {
      processQueue(new Error('Refresh failed'), null);
      handleAuthFailure();
      return Promise.reject(error);
    }
  }
);

// Función exportada para verificar si hay redirección en curso
export const isAuthRedirecting = () => isRedirectingToLogin;

// Función para mostrar error de auth solo si no hay debounce
export const shouldShowAuthError = (): boolean => {
  const now = Date.now();
  // Solo mostrar error si han pasado más de 3 segundos desde el último
  if (now - lastAuthErrorTime > 3000) {
    lastAuthErrorTime = now;
    return true;
  }
  return false;
};