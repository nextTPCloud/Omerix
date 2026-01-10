'use client'

import { useEffect, useRef, useCallback } from 'react'

interface BarcodeScannerOptions {
  /** Habilitar/deshabilitar el escáner */
  enabled: boolean
  /** Callback cuando se detecta un código */
  onScan: (code: string) => void
  /** Timeout para limpiar el buffer (default: 100ms) */
  bufferTimeout?: number
  /** Longitud mínima del código para considerarlo válido (default: 3) */
  minLength?: number
  /** Prefijo esperado del escáner (opcional) */
  prefix?: string
  /** Sufijo esperado del escáner (opcional) */
  suffix?: string
  /** Permitir captura cuando hay un input enfocado (default: false) */
  captureInInputs?: boolean
}

interface UseBarcodeScanner {
  /** Limpiar el buffer manualmente */
  clearBuffer: () => void
  /** Obtener el contenido actual del buffer */
  getBuffer: () => string
  /** Estado de habilitación */
  isEnabled: boolean
}

/**
 * Hook para capturar lecturas de escáner de código de barras
 *
 * Los escáneres de código de barras normalmente envían caracteres como
 * entrada de teclado seguidos de Enter. Este hook detecta esa secuencia
 * rápida de caracteres y la distingue de la escritura manual.
 *
 * @example
 * ```tsx
 * useBarcodeScanner({
 *   enabled: modoEscaner,
 *   onScan: (codigo) => {
 *     const producto = productos.find(p => p.codigoBarras === codigo)
 *     if (producto) {
 *       agregarProducto(producto)
 *     }
 *   }
 * })
 * ```
 */
export function useBarcodeScanner({
  enabled,
  onScan,
  bufferTimeout = 100,
  minLength = 3,
  prefix = '',
  suffix = '',
  captureInInputs = false
}: BarcodeScannerOptions): UseBarcodeScanner {
  const bufferRef = useRef('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastKeyTimeRef = useRef<number>(0)

  // Limpiar el buffer
  const clearBuffer = useCallback(() => {
    bufferRef.current = ''
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Obtener contenido del buffer
  const getBuffer = useCallback(() => bufferRef.current, [])

  useEffect(() => {
    if (!enabled) {
      clearBuffer()
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const tagName = target.tagName.toUpperCase()
      const isInputElement = tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable

      // Si estamos en un input y no queremos capturar ahí, ignorar
      // pero siempre procesar Enter para confirmar el código
      if (isInputElement && !captureInInputs && e.key !== 'Enter') {
        return
      }

      const now = Date.now()
      const timeSinceLastKey = now - lastKeyTimeRef.current
      lastKeyTimeRef.current = now

      // Si pasó mucho tiempo desde la última tecla, limpiar buffer
      // (indica que es entrada manual, no escáner)
      if (timeSinceLastKey > bufferTimeout * 2 && bufferRef.current.length > 0) {
        clearBuffer()
      }

      // Procesar Enter - confirmar código
      if (e.key === 'Enter') {
        let code = bufferRef.current

        // Quitar prefijo si existe
        if (prefix && code.startsWith(prefix)) {
          code = code.substring(prefix.length)
        }

        // Quitar sufijo si existe
        if (suffix && code.endsWith(suffix)) {
          code = code.substring(0, code.length - suffix.length)
        }

        // Validar longitud mínima
        if (code.length >= minLength) {
          e.preventDefault()
          e.stopPropagation()
          onScan(code.trim())
        }

        clearBuffer()
        return
      }

      // Ignorar teclas de control
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return
      }

      // Solo caracteres imprimibles (longitud 1)
      if (e.key.length === 1) {
        // Prevenir que el carácter se escriba si no estamos en un input
        if (!isInputElement) {
          e.preventDefault()
        }

        bufferRef.current += e.key

        // Resetear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          // Si el buffer tiene contenido después del timeout,
          // probablemente es entrada de teclado manual, no escáner
          clearBuffer()
        }, bufferTimeout)
      }
    }

    // Usar keydown en lugar de keypress para mejor compatibilidad
    window.addEventListener('keydown', handleKeyDown, { capture: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      clearBuffer()
    }
  }, [enabled, onScan, bufferTimeout, minLength, prefix, suffix, captureInInputs, clearBuffer])

  return {
    clearBuffer,
    getBuffer,
    isEnabled: enabled
  }
}

export default useBarcodeScanner
