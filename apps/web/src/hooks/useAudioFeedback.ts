'use client'

import { useCallback, useRef } from 'react'

interface UseAudioFeedbackOptions {
  enabled?: boolean
  volume?: number
  voiceEnabled?: boolean
  voiceLang?: string
}

interface UseAudioFeedbackReturn {
  playSuccess: () => void
  playError: () => void
  playWarning: () => void
  speak: (message: string) => void
  stopSpeaking: () => void
}

/**
 * Hook para retroalimentación de audio usando Web Audio API y Speech Synthesis
 *
 * @param options - Opciones de configuración
 * @param options.enabled - Habilitar/deshabilitar sonidos (default: true)
 * @param options.volume - Volumen de 0 a 1 (default: 0.5)
 * @param options.voiceEnabled - Habilitar síntesis de voz (default: true)
 * @param options.voiceLang - Idioma de la voz (default: 'es-ES')
 */
export function useAudioFeedback(options: UseAudioFeedbackOptions = {}): UseAudioFeedbackReturn {
  const {
    enabled = true,
    volume = 0.5,
    voiceEnabled = true,
    voiceLang = 'es-ES'
  } = options

  const audioContextRef = useRef<AudioContext | null>(null)

  // Obtener o crear AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    // Reanudar si está suspendido (requisito de navegadores modernos)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
    return audioContextRef.current
  }, [])

  // Reproducir un tono con parámetros específicos
  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainValue: number = volume
  ) => {
    if (!enabled) return

    try {
      const ctx = getAudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

      gainNode.gain.setValueAtTime(gainValue, ctx.currentTime)
      // Fade out suave para evitar clicks
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch (error) {
      console.warn('Error al reproducir sonido:', error)
    }
  }, [enabled, volume, getAudioContext])

  // Sonido de éxito - beep agudo corto
  const playSuccess = useCallback(() => {
    if (!enabled) return
    // Dos tonos ascendentes rápidos
    playTone(880, 0.08, 'sine', volume)
    setTimeout(() => playTone(1100, 0.1, 'sine', volume), 80)
  }, [enabled, volume, playTone])

  // Sonido de error - beep grave más largo
  const playError = useCallback(() => {
    if (!enabled) return
    // Tono grave con onda cuadrada (más áspero)
    playTone(220, 0.15, 'square', volume * 0.7)
    setTimeout(() => playTone(180, 0.2, 'square', volume * 0.7), 150)
  }, [enabled, volume, playTone])

  // Sonido de advertencia - tono medio
  const playWarning = useCallback(() => {
    if (!enabled) return
    playTone(440, 0.15, 'triangle', volume)
  }, [enabled, volume, playTone])

  // Síntesis de voz
  const speak = useCallback((message: string) => {
    if (!voiceEnabled || !message) return

    if ('speechSynthesis' in window) {
      // Cancelar cualquier síntesis en curso
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(message)
      utterance.lang = voiceLang
      utterance.rate = 1.1 // Ligeramente más rápido
      utterance.pitch = 1
      utterance.volume = volume

      // Intentar usar una voz en español si está disponible
      const voices = speechSynthesis.getVoices()
      const spanishVoice = voices.find(v => v.lang.startsWith('es'))
      if (spanishVoice) {
        utterance.voice = spanishVoice
      }

      speechSynthesis.speak(utterance)
    }
  }, [voiceEnabled, voiceLang, volume])

  // Detener síntesis de voz
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
  }, [])

  return {
    playSuccess,
    playError,
    playWarning,
    speak,
    stopSpeaking
  }
}

export default useAudioFeedback
