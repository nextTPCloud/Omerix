'use client'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: { value: string; label: string }[]
  className?: string
}

export function TableSelect({
  value,
  onValueChange,
  placeholder = 'Seleccionar',
  options,
  className = 'h-7 text-xs',
}: TableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 })
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Calcular posición del dropdown
  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  // Actualizar posición cuando se abre
  React.useEffect(() => {
    if (open) {
      updatePosition()
    }
  }, [open, updatePosition])

  // Cerrar en scroll (mejor UX que intentar reposicionar)
  React.useEffect(() => {
    if (!open) return

    const handleScroll = () => {
      setOpen(false)
    }

    // Escuchar scroll en la tabla y en la ventana
    const table = triggerRef.current?.closest('.overflow-x-auto')
    const scrollableParents: Element[] = []

    if (table) {
      scrollableParents.push(table)
      table.addEventListener('scroll', handleScroll, { passive: true })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      scrollableParents.forEach(el => {
        el.removeEventListener('scroll', handleScroll)
      })
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [open])

  // Cerrar al hacer click fuera
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        contentRef.current &&
        !contentRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Cerrar con ESC
  React.useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  // Obtener el label de la opción seleccionada
  const selectedLabel = React.useMemo(() => {
    const option = options.find(opt => opt.value === value)
    return option?.label || placeholder
  }, [value, options, placeholder])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-input",
          "bg-background px-3 py-2 text-sm ring-offset-background",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => setOpen(!open)}
      >
        <span className={cn(!value && "text-muted-foreground", "truncate")}>
          {selectedLabel}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
      </button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={contentRef}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            zIndex: 50,
          }}
          className={cn(
            "max-h-60 overflow-auto rounded-md border bg-popover",
            "text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          )}
        >
          <div className="p-1">
            {options.map((option) => {
              const isSelected = value === option.value
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    isSelected && "bg-accent"
                  )}
                  onClick={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </div>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}