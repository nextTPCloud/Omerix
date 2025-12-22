'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, ComponentType } from 'react'

/**
 * Hook personalizado para obtener searchParams de forma segura
 * @deprecated Use withSearchParams HOC for pages that need searchParams
 */
export function useSearchParamsSafe() {
  return useSearchParams()
}

/**
 * HOC para envolver componentes que usan useSearchParams
 * en un Suspense boundary automaticamente
 */
export function withSearchParams<P extends object>(
  WrappedComponent: ComponentType<P>,
  FallbackComponent?: ComponentType
) {
  const WithSearchParamsComponent = (props: P) => {
    const Fallback = FallbackComponent || (() => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ))

    return (
      <Suspense fallback={<Fallback />}>
        <WrappedComponent {...props} />
      </Suspense>
    )
  }

  WithSearchParamsComponent.displayName = `WithSearchParams(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`

  return WithSearchParamsComponent
}

/**
 * Componente wrapper para usar en paginas con useSearchParams
 */
export function SearchParamsProvider({
  children,
  fallback
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <Suspense fallback={fallback || (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )}>
      {children}
    </Suspense>
  )
}
