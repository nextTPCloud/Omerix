// components/ui/popover.tsx
"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

// ============================================
// CONTEXT
// ============================================

interface PopoverContextValue {
  open: boolean
  // ✅ FIX: Ahora acepta boolean O función callback
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const PopoverContext = React.createContext<PopoverContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
})

const usePopover = () => {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error("usePopover debe usarse dentro de un Popover")
  }
  return context
}

// ============================================
// POPOVER ROOT
// ============================================

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Popover = ({ children, open: controlledOpen, onOpenChange }: PopoverProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)

  // Si es controlado, usar props externos; si no, usar estado interno
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen: React.Dispatch<React.SetStateAction<boolean>> = React.useCallback((value) => {
    const newValue = typeof value === 'function' ? value(open) : value
    if (isControlled) {
      onOpenChange?.(newValue)
    } else {
      setInternalOpen(newValue)
    }
  }, [isControlled, onOpenChange, open])

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  )
}

// ============================================
// POPOVER TRIGGER
// ============================================

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  asChild?: boolean // ✅ FIX: Añadida prop asChild
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ children, onClick, asChild = false, ...props }, forwardedRef) => {
    const { setOpen, triggerRef } = usePopover()

    // ✅ FIX: Si asChild es true, usar Slot de Radix
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={(node: HTMLButtonElement | null) => {
          // Asignar a ambos refs
          if (typeof forwardedRef === 'function') {
            forwardedRef(node)
          } else if (forwardedRef) {
            forwardedRef.current = node
          }
          triggerRef.current = node
        }}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          // ✅ FIX: Ahora funciona con callback
          setOpen((prev) => !prev)
          onClick?.(e)
        }}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
PopoverTrigger.displayName = "PopoverTrigger"

// ============================================
// POPOVER CONTENT
// ============================================

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ children, className, align = 'center', sideOffset = 8, ...props }, ref) => {
    const { open, setOpen, triggerRef } = usePopover()
    const contentRef = React.useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = React.useState(false)
    const [position, setPosition] = React.useState({ top: 0, left: 0 })

    React.useEffect(() => {
      setMounted(true)
    }, [])

    // Calcular posición
    React.useEffect(() => {
      if (open && triggerRef.current && contentRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect()
        const contentRect = contentRef.current.getBoundingClientRect()
        
        let left = triggerRect.left
        
        if (align === 'center') {
          left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2)
        } else if (align === 'end') {
          left = triggerRect.right - contentRect.width
        }
        
        setPosition({
          top: triggerRect.bottom + sideOffset,
          left: Math.max(8, Math.min(left, window.innerWidth - contentRect.width - 8))
        })
      }
    }, [open, align, sideOffset, triggerRef])

    // Cerrar al hacer click fuera
    React.useEffect(() => {
      if (!open) return

      const handleClickOutside = (event: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(event.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open, setOpen, triggerRef])

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
    }, [open, setOpen])

    if (!mounted || !open) return null

    return createPortal(
      <div
        ref={contentRef}
        className={cn(
          "fixed z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
          "animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        {...props}
      >
        {children}
      </div>,
      document.body
    )
  }
)
PopoverContent.displayName = "PopoverContent"

// ============================================
// EXPORTS
// ============================================

export { Popover, PopoverTrigger, PopoverContent }