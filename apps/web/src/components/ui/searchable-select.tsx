'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronsUpDown, Search, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

// Hook para calcular posición del dropdown
function useDropdownPosition(
  triggerRef: React.RefObject<HTMLElement>,
  isOpen: boolean
) {
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 })

  React.useEffect(() => {
    if (!isOpen || !triggerRef.current) return

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) {
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        })
      }
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, triggerRef])

  return position
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  allowClear?: boolean
  loading?: boolean
  onCreate?: () => void
  createLabel?: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados',
  disabled = false,
  className,
  triggerClassName,
  allowClear = true,
  loading = false,
  onCreate,
  createLabel = 'Crear nuevo',
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const position = useDropdownPosition(triggerRef, open)

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  // Filtrar opciones
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      onValueChange(selectedValue === value ? '' : selectedValue)
      setOpen(false)
      setSearch('')
    },
    [onValueChange, value]
  )

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange('')
  }

  // Cerrar al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false)
        setSearch('')
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      setTimeout(() => inputRef.current?.focus(), 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Manejar teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setSearch('')
    }
  }

  const dropdown = open && typeof document !== 'undefined' ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 9999,
      }}
      className="rounded-md border bg-popover text-popover-foreground shadow-lg"
      onKeyDown={handleKeyDown}
    >
      {/* Input de búsqueda */}
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Lista de opciones */}
      <div className="max-h-[300px] overflow-y-auto p-1">
        {filteredOptions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
            {onCreate && (
              <div className="mt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setOpen(false)
                    setSearch('')
                    onCreate()
                  }}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  {createLabel}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => !option.disabled && handleSelect(option.value)}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                  'hover:bg-accent hover:text-accent-foreground',
                  value === option.value && 'bg-accent',
                  option.disabled && 'pointer-events-none opacity-50'
                )}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === option.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {onCreate && (
              <>
                <div className="-mx-1 my-1 h-px bg-border" />
                <div
                  onClick={() => {
                    setOpen(false)
                    setSearch('')
                    onCreate()
                  }}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createLabel}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className={cn('relative', className)}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled || loading}
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full justify-between font-normal',
          !selectedOption && 'text-muted-foreground',
          triggerClassName
        )}
      >
        <span className="truncate">
          {loading ? 'Cargando...' : selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {allowClear && selectedOption && !disabled && (
            <X
              className="h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </div>
      </Button>
      {dropdown}
    </div>
  )
}

// ============================================
// Versión editable - Input que permite escribir y buscar con dropdown
// ============================================
interface EditableSearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  displayValue?: string
  onValueChange: (value: string) => void
  onDisplayValueChange?: (displayValue: string) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  loading?: boolean
  onEnterPress?: () => void // Callback cuando se presiona Enter
  onArrowDownPress?: () => void // Callback cuando se presiona flecha abajo sin dropdown
  inputRef?: (el: HTMLInputElement | null) => void // Ref callback para el input
}

export function EditableSearchableSelect({
  options,
  value,
  displayValue,
  onValueChange,
  onDisplayValueChange,
  placeholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados',
  disabled = false,
  className,
  inputClassName,
  loading = false,
  onEnterPress,
  onArrowDownPress,
  inputRef: externalInputRef,
}: EditableSearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const optionRefs = React.useRef<Map<number, HTMLDivElement>>(new Map())
  const position = useDropdownPosition(containerRef, open)

  // Reset highlighted index cuando cambian las opciones filtradas o se abre/cierra
  React.useEffect(() => {
    if (open) {
      setHighlightedIndex(-1)
    }
  }, [open])

  React.useEffect(() => {
    setHighlightedIndex(-1)
  }, [inputValue])

  // Sincronizar inputValue con displayValue o el label de la opción seleccionada
  React.useEffect(() => {
    if (!isSearching) {
      if (displayValue !== undefined) {
        setInputValue(displayValue)
      } else if (value) {
        const option = options.find((o) => o.value === value)
        setInputValue(option?.label || '')
      } else {
        setInputValue('')
      }
    }
  }, [displayValue, value, options, isSearching])

  // Filtrar opciones - si está buscando, filtra; si no, muestra todas
  const filteredOptions = React.useMemo(() => {
    if (!isSearching || !inputValue) return options
    const searchLower = inputValue.toLowerCase()
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
    )
  }, [options, inputValue, isSearching])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsSearching(true)
    if (onDisplayValueChange) {
      onDisplayValueChange(newValue)
    }
    if (!open) {
      setOpen(true)
    }
  }

  const handleSelect = (selectedValue: string) => {
    const option = options.find((o) => o.value === selectedValue)
    if (option) {
      onValueChange(selectedValue)
      setInputValue(option.label)
      setIsSearching(false)
      if (onDisplayValueChange) {
        onDisplayValueChange(option.label)
      }
    }
    setOpen(false)
  }

  const handleInputFocus = () => {
    setOpen(true)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onValueChange('')
    setInputValue('')
    setIsSearching(false)
    if (onDisplayValueChange) {
      onDisplayValueChange('')
    }
    inputRef.current?.focus()
  }

  // Cerrar al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false)
        setIsSearching(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setIsSearching(false)
      setHighlightedIndex(-1)
    } else if (e.key === 'Enter') {
      e.preventDefault() // Evitar que el formulario se envíe

      // Si hay una opción resaltada, seleccionarla
      if (open && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const option = filteredOptions[highlightedIndex]
        if (!option.disabled) {
          handleSelect(option.value)
          // Después de seleccionar, notificar para pasar al siguiente campo
          if (onEnterPress) {
            setTimeout(() => onEnterPress(), 50)
          }
        }
        return
      }

      // Si hay un producto seleccionado o texto escrito, cerrar dropdown y notificar
      if (value || inputValue) {
        setOpen(false)
        setIsSearching(false)
        setHighlightedIndex(-1)
        if (onEnterPress) {
          onEnterPress()
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) {
        // Si el dropdown está cerrado, abrirlo
        setOpen(true)
      } else if (filteredOptions.length > 0) {
        // Navegar hacia abajo en las opciones
        setHighlightedIndex(prev => {
          const next = prev < filteredOptions.length - 1 ? prev + 1 : 0
          // Scroll into view
          setTimeout(() => {
            const el = optionRefs.current.get(next)
            el?.scrollIntoView({ block: 'nearest' })
          }, 0)
          return next
        })
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
      } else if (filteredOptions.length > 0) {
        // Navegar hacia arriba en las opciones
        setHighlightedIndex(prev => {
          const next = prev > 0 ? prev - 1 : filteredOptions.length - 1
          // Scroll into view
          setTimeout(() => {
            const el = optionRefs.current.get(next)
            el?.scrollIntoView({ block: 'nearest' })
          }, 0)
          return next
        })
      }
    } else if (e.key === 'Tab') {
      // Cerrar dropdown al tabular
      setOpen(false)
      setIsSearching(false)
      setHighlightedIndex(-1)
    }
  }

  const dropdown = open && typeof document !== 'undefined' ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 9999,
      }}
      className="rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
    >
      <div className="max-h-[200px] overflow-y-auto p-1">
        {filteredOptions.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {loading ? 'Cargando...' : emptyMessage}
          </div>
        ) : (
          filteredOptions.map((option, index) => (
            <div
              key={option.value}
              ref={(el) => {
                if (el) optionRefs.current.set(index, el)
                else optionRefs.current.delete(index)
              }}
              onClick={() => !option.disabled && handleSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                'hover:bg-accent hover:text-accent-foreground',
                highlightedIndex === index && 'bg-accent text-accent-foreground',
                value === option.value && highlightedIndex !== index && 'bg-accent/50',
                option.disabled && 'pointer-events-none opacity-50'
              )}
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4 flex-shrink-0',
                  value === option.value ? 'opacity-100' : 'opacity-0'
                )}
              />
              <div className="flex flex-col overflow-hidden">
                <span className="truncate">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-muted-foreground truncate">
                    {option.description}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  ) : null

  // Combinar refs: interno y externo
  const setInputRef = React.useCallback((el: HTMLInputElement | null) => {
    (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el
    if (externalInputRef) {
      externalInputRef(el)
    }
  }, [externalInputRef])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          ref={setInputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={cn(
            'flex h-8 w-full rounded-md border border-input bg-background pl-8 pr-8 py-1 text-sm shadow-sm transition-colors',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            inputClassName
          )}
        />
        {(value || inputValue) && !disabled && (
          <X
            className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={handleClear}
          />
        )}
      </div>
      {dropdown}
    </div>
  )
}

// ============================================
// Versión con múltiples selecciones
// ============================================
interface MultiSearchableSelectProps {
  options: SearchableSelectOption[]
  values: string[]
  onValuesChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  maxSelections?: number
}

export function MultiSearchableSelect({
  options,
  values,
  onValuesChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados',
  disabled = false,
  className,
  triggerClassName,
  maxSelections,
}: MultiSearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const position = useDropdownPosition(triggerRef, open)

  const safeValues = values || []

  const selectedOptions = React.useMemo(
    () => options.filter((option) => safeValues.includes(option.value)),
    [options, safeValues]
  )

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  const handleSelect = (selectedValue: string) => {
    if (safeValues.includes(selectedValue)) {
      onValuesChange(safeValues.filter((v) => v !== selectedValue))
    } else {
      if (maxSelections && safeValues.length >= maxSelections) {
        return
      }
      onValuesChange([...safeValues, selectedValue])
    }
  }

  const handleRemove = (e: React.MouseEvent, valueToRemove: string) => {
    e.stopPropagation()
    onValuesChange(safeValues.filter((v) => v !== valueToRemove))
  }

  // Cerrar al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false)
        setSearch('')
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      setTimeout(() => inputRef.current?.focus(), 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const dropdown = open && typeof document !== 'undefined' ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 9999,
      }}
      className="rounded-md border bg-popover text-popover-foreground shadow-lg"
    >
      {/* Input de búsqueda */}
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Lista de opciones */}
      <div className="max-h-[300px] overflow-y-auto p-1">
        {filteredOptions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          filteredOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => !option.disabled && handleSelect(option.value)}
              className={cn(
                'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                'hover:bg-accent hover:text-accent-foreground',
                option.disabled && 'pointer-events-none opacity-50'
              )}
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  safeValues.includes(option.value) ? 'opacity-100' : 'opacity-0'
                )}
              />
              <div className="flex flex-col">
                <span>{option.label}</span>
                {option.description && (
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className={cn('relative', className)}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full justify-between font-normal min-h-[40px] h-auto',
          !selectedOptions.length && 'text-muted-foreground',
          triggerClassName
        )}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
              >
                {option.label}
                {!disabled && (
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => handleRemove(e, option.value)}
                  />
                )}
              </span>
            ))
          ) : (
            <span>{placeholder}</span>
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
      </Button>
      {dropdown}
    </div>
  )
}
