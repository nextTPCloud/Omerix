/**
 * Utilidades para manejo de JWT en el cliente
 */

interface JWTPayload {
  exp?: number
  iat?: number
  sub?: string
  [key: string]: unknown
}

/**
 * Decodifica un JWT sin verificar la firma (solo cliente)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = parts[1]
    // Base64Url a Base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Verifica si un token JWT ha expirado
 * @param token - El token JWT
 * @param bufferSeconds - Segundos de margen antes de la expiración real (por defecto 60)
 */
export function isTokenExpired(token: string | null, bufferSeconds: number = 60): boolean {
  if (!token) {
    return true
  }

  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return true
  }

  // exp está en segundos, Date.now() en milisegundos
  const expirationTime = payload.exp * 1000
  const now = Date.now()
  const bufferMs = bufferSeconds * 1000

  return now >= expirationTime - bufferMs
}

/**
 * Obtiene el tiempo restante hasta la expiración del token en milisegundos
 */
export function getTokenTimeRemaining(token: string | null): number {
  if (!token) {
    return 0
  }

  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return 0
  }

  const expirationTime = payload.exp * 1000
  const remaining = expirationTime - Date.now()

  return remaining > 0 ? remaining : 0
}
