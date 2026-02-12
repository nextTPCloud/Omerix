'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { billingService, ILicencia, IPlan, LicenciaResponse } from '@/services/billing.service'
import { useAuthStore } from '@/stores/authStore'

export interface UseLicenseReturn {
  // Datos
  license: ILicencia | null
  plan: IPlan | null
  loading: boolean
  error: string | null

  // Estado de la licencia
  isTrial: boolean
  isActive: boolean
  isExpired: boolean
  isSuspended: boolean
  daysRemaining: number
  warnings: string[]

  // Verificaciones de modulos
  hasModule: (moduleName: string) => boolean
  hasAnyModule: (moduleNames: string[]) => boolean

  // Verificaciones de limites
  isWithinLimit: (limitType: keyof ILicencia['usoActual']) => boolean
  getUsagePercentage: (limitType: keyof ILicencia['usoActual']) => number
  getRemainingLimit: (limitType: keyof ILicencia['usoActual']) => number
  getLimitValue: (limitType: keyof IPlan['limites']) => number

  // Acciones
  refetch: () => Promise<void>
}

// Mapeo de limites de uso a limites de plan
const limitMapping: Record<string, string> = {
  usuariosActuales: 'usuariosTotales',
  facturasEsteMes: 'facturasMes',
  productosActuales: 'productosCatalogo',
  almacenesActuales: 'almacenes',
  clientesActuales: 'clientes',
  tpvsActuales: 'tpvsActivos',
  almacenamientoUsadoGB: 'almacenamientoGB',
  llamadasAPIHoy: 'llamadasAPIDia',
  emailsEsteMes: 'emailsMes',
  smsEsteMes: 'smsMes',
  whatsappEsteMes: 'whatsappMes',
}


export function useLicense(): UseLicenseReturn {
  const { isAuthenticated, user } = useAuthStore()
  const [license, setLicense] = useState<ILicencia | null>(null)
  const [plan, setPlan] = useState<IPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [daysRemaining, setDaysRemaining] = useState(0)

  // Verificar si el usuario es superadmin (bypass completo)
  const isSuperadmin = useMemo(() => user?.rol === 'superadmin', [user])

  const fetchLicense = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await billingService.getMiLicencia()

      if (response.success && response.data) {
        setLicense(response.data.licencia)
        setPlan(response.data.plan)
        setDaysRemaining(response.data.diasRestantes || 0)
        setWarnings(response.data.advertencias || [])
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar licencia')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchLicense()
  }, [fetchLicense])

  // Estado de la licencia
  const isTrial = useMemo(() => license?.esTrial || false, [license])
  const isActive = useMemo(() => license?.estado === 'activa' || license?.estado === 'trial', [license])
  const isExpired = useMemo(() => license?.estado === 'expirada', [license])
  const isSuspended = useMemo(() => license?.estado === 'suspendida', [license])

  // Mapeo de nombres de módulos a slugs de add-ons
  // Permite que el sidebar use un nombre y el add-on tenga otro
  const moduleToAddonSlug: Record<string, string[]> = {
    'rrhh': ['rrhh', 'rrhh-fichaje'], // El módulo RRHH puede venir de cualquiera de estos add-ons
    'contabilidad': ['contabilidad'],
    'tpv': ['tpv'],
    'proyectos': ['proyectos'],
    'crm': ['crm'],
    'restauracion': ['restauracion', 'tpv'], // Restauración también incluido si tiene TPV
    'redes-sociales': ['redes-sociales'],
    'ia': ['tokens-ia-5000', 'tokens-ia-20000', 'tokens-ia-50000', 'tokens-ia-ilimitados'],
    'restoo': ['restoo-integration', 'restauracion'],
    'ecommerce': ['ecommerce'],
    'firmas': ['firmas-digitales'],
  }

  // Verificar si tiene un modulo
  const hasModule = useCallback((moduleName: string): boolean => {
    // Superadmin tiene acceso a todos los modulos
    if (isSuperadmin) return true

    if (!plan) return false

    // Si tiene acceso a todos los modulos (Enterprise)
    if (plan.modulosIncluidos.includes('*')) return true

    // Verificar si esta en los modulos del plan
    if (plan.modulosIncluidos.includes(moduleName)) return true

    // Caso especial: si el plan tiene tpvsActivos > 0, tiene acceso al modulo TPV
    if (moduleName === 'tpv' && plan.limites?.tpvsActivos > 0) return true

    // Verificar si tiene el modulo como add-on activo
    if (license?.addOns) {
      // Obtener los posibles slugs de add-on para este módulo
      const possibleSlugs = moduleToAddonSlug[moduleName] || [moduleName]

      return license.addOns.some(addon =>
        possibleSlugs.includes(addon.slug) && addon.activo
      )
    }

    return false
  }, [plan, license, isSuperadmin])

  // Verificar si tiene alguno de los modulos
  const hasAnyModule = useCallback((moduleNames: string[]): boolean => {
    return moduleNames.some(name => hasModule(name))
  }, [hasModule])

  // Obtener valor del limite del plan
  const getLimitValue = useCallback((limitType: keyof IPlan['limites']): number => {
    if (!plan) return 0
    return plan.limites[limitType] ?? 0
  }, [plan])

  // Verificar si esta dentro del limite
  const isWithinLimit = useCallback((limitType: keyof ILicencia['usoActual']): boolean => {
    // Superadmin no tiene limites
    if (isSuperadmin) return true

    if (!license || !plan) return true

    const usoActual = license.usoActual[limitType] ?? 0
    const planLimitKey = limitMapping[limitType] as keyof IPlan['limites']
    const limite = plan.limites[planLimitKey] ?? -1

    // -1 significa ilimitado
    if (limite === -1) return true

    return usoActual < limite
  }, [license, plan, isSuperadmin])

  // Obtener porcentaje de uso
  const getUsagePercentage = useCallback((limitType: keyof ILicencia['usoActual']): number => {
    // Superadmin no tiene limites, siempre 0%
    if (isSuperadmin) return 0

    if (!license || !plan) return 0

    const usoActual = license.usoActual[limitType] ?? 0
    const planLimitKey = limitMapping[limitType] as keyof IPlan['limites']
    const limite = plan.limites[planLimitKey] ?? -1

    // -1 significa ilimitado
    if (limite === -1) return 0

    return Math.min(100, Math.round((usoActual / limite) * 100))
  }, [license, plan, isSuperadmin])

  // Obtener limite restante
  const getRemainingLimit = useCallback((limitType: keyof ILicencia['usoActual']): number => {
    // Superadmin tiene limites ilimitados
    if (isSuperadmin) return Infinity

    if (!license || !plan) return 0

    const usoActual = license.usoActual[limitType] ?? 0
    const planLimitKey = limitMapping[limitType] as keyof IPlan['limites']
    const limite = plan.limites[planLimitKey] ?? -1

    // -1 significa ilimitado
    if (limite === -1) return Infinity

    return Math.max(0, limite - usoActual)
  }, [license, plan, isSuperadmin])

  return {
    // Datos
    license,
    plan,
    loading,
    error,

    // Estado
    isTrial,
    isActive,
    isExpired,
    isSuspended,
    daysRemaining,
    warnings,

    // Verificaciones
    hasModule,
    hasAnyModule,
    isWithinLimit,
    getUsagePercentage,
    getRemainingLimit,
    getLimitValue,

    // Acciones
    refetch: fetchLicense,
  }
}

export default useLicense
