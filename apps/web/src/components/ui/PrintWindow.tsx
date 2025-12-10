'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface PrintWindowProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

/**
 * Componente que abre una nueva ventana del navegador para previsualizar e imprimir.
 * Permite hacer zoom con Ctrl+rueda del ratón y usar todas las funciones del navegador.
 */
export function PrintWindow({ isOpen, onClose, title = 'Vista previa', children }: PrintWindowProps) {
  const windowRef = useRef<Window | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const openWindow = useCallback(() => {
    // Cerrar ventana existente si la hay
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close()
    }

    // Abrir nueva ventana
    const newWindow = window.open(
      '',
      '_blank',
      'width=900,height=700,menubar=yes,toolbar=yes,scrollbars=yes,resizable=yes'
    )

    if (!newWindow) {
      alert('No se pudo abrir la ventana de impresión. Verifica que no tengas bloqueador de popups.')
      onClose()
      return
    }

    windowRef.current = newWindow

    // Configurar el documento de la nueva ventana
    newWindow.document.title = title

    // Copiar estilos del documento principal
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
    styles.forEach(style => {
      newWindow.document.head.appendChild(style.cloneNode(true))
    })

    // Añadir estilos adicionales para impresión
    const printStyles = newWindow.document.createElement('style')
    printStyles.textContent = `
      body {
        margin: 0;
        padding: 20px;
        background: #f5f5f5;
        font-family: Arial, Helvetica, sans-serif;
      }

      .print-container {
        background: white;
        max-width: 210mm;
        margin: 0 auto;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }

      .print-toolbar {
        position: sticky;
        top: 0;
        background: #1f2937;
        color: white;
        padding: 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: -20px -20px 20px -20px;
        z-index: 100;
      }

      .print-toolbar button {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        margin-left: 8px;
      }

      .print-toolbar .btn-print {
        background: #3b82f6;
        color: white;
      }

      .print-toolbar .btn-print:hover {
        background: #2563eb;
      }

      .print-toolbar .btn-close {
        background: #6b7280;
        color: white;
      }

      .print-toolbar .btn-close:hover {
        background: #4b5563;
      }

      .zoom-info {
        font-size: 14px;
        opacity: 0.8;
      }

      @media print {
        body {
          margin: 0;
          padding: 0;
          background: white;
        }

        .print-toolbar {
          display: none !important;
        }

        .print-container {
          box-shadow: none;
          padding: 0;
          max-width: 100%;
        }
      }
    `
    newWindow.document.head.appendChild(printStyles)

    // Crear contenedor para el contenido
    const container = newWindow.document.createElement('div')
    container.id = 'print-root'
    newWindow.document.body.appendChild(container)
    containerRef.current = container

    // Listener para cerrar
    newWindow.addEventListener('beforeunload', () => {
      onClose()
    })

    // Forzar re-render para que createPortal funcione
    setTimeout(() => {
      if (windowRef.current && !windowRef.current.closed) {
        renderContent()
      }
    }, 100)
  }, [title, onClose])

  const renderContent = useCallback(() => {
    if (!windowRef.current || windowRef.current.closed || !containerRef.current) return

    const container = containerRef.current

    // Limpiar contenido anterior
    container.innerHTML = ''

    // Crear toolbar
    const toolbar = document.createElement('div')
    toolbar.className = 'print-toolbar'
    toolbar.innerHTML = `
      <div>
        <strong>${title}</strong>
        <span class="zoom-info" style="margin-left: 20px;">Usa Ctrl + rueda del ratón para hacer zoom</span>
      </div>
      <div>
        <button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
        <button class="btn-close" onclick="window.close()">✕ Cerrar</button>
      </div>
    `
    container.appendChild(toolbar)

    // Crear contenedor del documento
    const printContainer = document.createElement('div')
    printContainer.className = 'print-container'
    container.appendChild(printContainer)

  }, [title])

  useEffect(() => {
    if (isOpen) {
      openWindow()
    } else if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close()
    }

    return () => {
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close()
      }
    }
  }, [isOpen, openWindow])

  // Usar createPortal para renderizar el contenido en la nueva ventana
  if (!isOpen || !windowRef.current || windowRef.current.closed || !containerRef.current) {
    return null
  }

  const printContainer = containerRef.current.querySelector('.print-container')
  if (!printContainer) return null

  return createPortal(children, printContainer)
}

export default PrintWindow
