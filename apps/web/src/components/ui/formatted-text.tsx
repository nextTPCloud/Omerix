'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface FormattedTextProps {
  text: string
  className?: string
}

/**
 * Limpiar HTML y convertir a texto plano con formato
 */
function cleanHtmlToText(html: string): string {
  return html
    // Convertir tags de bloque a saltos de línea
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    // Convertir listas
    .replace(/<li>/gi, '• ')
    // Eliminar tags restantes
    .replace(/<[^>]+>/g, '')
    // Decodificar entidades HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Limpiar espacios múltiples
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Componente para renderizar texto con formato básico
 * Soporta: HTML básico, saltos de línea, párrafos, listas
 */
export function FormattedText({ text, className }: FormattedTextProps) {
  if (!text) return null

  // Limpiar HTML si existe
  const cleanText = cleanHtmlToText(text)

  // Procesar el texto para convertirlo en elementos React
  const formatText = (input: string): React.ReactNode[] => {
    const lines = input.split('\n')
    const elements: React.ReactNode[] = []
    let currentParagraph: string[] = []
    let listItems: string[] = []
    let inList = false

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={`p-${elements.length}`} className="mb-2 last:mb-0">
            {currentParagraph.join(' ')}
          </p>
        )
        currentParagraph = []
      }
    }

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="mb-2 ml-4 list-disc list-inside space-y-1 last:mb-0">
            {listItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        )
        listItems = []
        inList = false
      }
    }

    lines.forEach((line) => {
      const trimmedLine = line.trim()

      // Línea vacía = fin de párrafo/lista
      if (!trimmedLine) {
        flushList()
        flushParagraph()
        return
      }

      // Detectar elemento de lista (-, *, •, números)
      const listMatch = trimmedLine.match(/^[-*•]\s*(.+)$/) || trimmedLine.match(/^\d+[.)]\s+(.+)$/)
      if (listMatch) {
        flushParagraph()
        inList = true
        listItems.push(listMatch[1])
        return
      }

      // Si estábamos en lista y esta línea no es lista, cerrar lista
      if (inList) {
        flushList()
      }

      // Agregar a párrafo actual
      currentParagraph.push(trimmedLine)
    })

    // Flush final
    flushList()
    flushParagraph()

    return elements
  }

  return (
    <div className={cn('text-sm', className)}>
      {formatText(cleanText)}
    </div>
  )
}

/**
 * Versión inline para textos cortos (preserva saltos de línea)
 */
export function FormattedTextInline({ text, className }: FormattedTextProps) {
  if (!text) return null

  const cleanText = cleanHtmlToText(text)

  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {cleanText}
    </span>
  )
}
