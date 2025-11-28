'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { ChevronDown } from 'lucide-react';

interface CodeInputProps extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  /** Función para buscar códigos existentes que empiecen con el prefijo */
  onSearchCodes?: (prefix: string) => Promise<string[]>;
  /** Callback cuando cambia el valor */
  onChange?: (value: string) => void;
  /** Valor actual */
  value?: string;
  /** Convertir automáticamente a mayúsculas */
  uppercase?: boolean;
  /** Mensaje de error */
  error?: string;
  /** Texto de ayuda */
  helperText?: string;
}

/**
 * Input especializado para códigos/SKU con auto-sugerencia
 * Al escribir un prefijo y pulsar flecha abajo, sugiere el siguiente código disponible
 */
export function CodeInput({
  onSearchCodes,
  onChange,
  value = '',
  uppercase = true,
  error,
  helperText,
  className,
  placeholder,
  ...props
}: CodeInputProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generar siguiente código basado en los existentes
  const generateNextCode = useCallback((prefix: string, existingCodes: string[]): string => {
    if (!prefix) return '';

    // Extraer el prefijo base (letras) y encontrar el número más alto
    const prefixUpper = prefix.toUpperCase();

    // Filtrar códigos que empiezan con el prefijo
    const matchingCodes = existingCodes
      .map(code => code.toUpperCase())
      .filter(code => code.startsWith(prefixUpper));

    if (matchingCodes.length === 0) {
      // Si no hay códigos, sugerir prefijo + 001
      return `${prefixUpper}001`;
    }

    // Encontrar el número más alto
    let maxNumber = 0;
    const numberPattern = new RegExp(`^${escapeRegex(prefixUpper)}(\\d+)$`);

    for (const code of matchingCodes) {
      const match = code.match(numberPattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    // Generar siguiente número con padding
    const nextNumber = maxNumber + 1;
    const padding = Math.max(3, String(maxNumber).length);
    return `${prefixUpper}${String(nextNumber).padStart(padding, '0')}`;
  }, []);

  // Buscar y generar sugerencia
  const searchAndSuggest = useCallback(async (prefix: string) => {
    if (!onSearchCodes || !prefix || prefix.length < 1) {
      setSuggestion(null);
      return;
    }

    setIsSearching(true);
    try {
      const existingCodes = await onSearchCodes(prefix);
      const nextCode = generateNextCode(prefix, existingCodes);
      setSuggestion(nextCode);
    } catch (error) {
      console.error('Error buscando códigos:', error);
      setSuggestion(null);
    } finally {
      setIsSearching(false);
    }
  }, [onSearchCodes, generateNextCode]);

  // Manejar cambio de valor
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (uppercase) {
      newValue = newValue.toUpperCase();
    }
    onChange?.(newValue);
    setShowSuggestion(false);
    setSuggestion(null);
  };

  // Manejar teclas especiales
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();

      if (suggestion && showSuggestion) {
        // Si ya hay sugerencia visible, aplicarla
        onChange?.(suggestion);
        setShowSuggestion(false);
        setSuggestion(null);
      } else if (value) {
        // Buscar y mostrar sugerencia
        await searchAndSuggest(value);
        setShowSuggestion(true);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestion(false);
    } else if (e.key === 'Tab' && suggestion && showSuggestion) {
      // Tab también aplica la sugerencia
      e.preventDefault();
      onChange?.(suggestion);
      setShowSuggestion(false);
      setSuggestion(null);
    }
  };

  // Cerrar sugerencia al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestion(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            'pr-8',
            error && 'border-destructive focus-visible:ring-destructive/20',
            className
          )}
          placeholder={placeholder}
          aria-invalid={!!error}
          {...props}
        />
        {onSearchCodes && (
          <button
            type="button"
            tabIndex={-1}
            onClick={async () => {
              if (value) {
                await searchAndSuggest(value);
                setShowSuggestion(true);
                inputRef.current?.focus();
              }
            }}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded',
              'text-muted-foreground hover:text-foreground transition-colors',
              'focus:outline-none',
              isSearching && 'animate-pulse'
            )}
            title="Sugerir siguiente código (↓)"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown de sugerencia */}
      {showSuggestion && suggestion && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1 py-1 px-2',
            'bg-popover border rounded-md shadow-md',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <button
            type="button"
            onClick={() => {
              onChange?.(suggestion);
              setShowSuggestion(false);
              setSuggestion(null);
            }}
            className={cn(
              'w-full text-left px-2 py-1.5 rounded',
              'hover:bg-accent hover:text-accent-foreground',
              'text-sm font-mono transition-colors'
            )}
          >
            <span className="text-muted-foreground mr-2">Siguiente:</span>
            <span className="font-semibold">{suggestion}</span>
          </button>
          <p className="text-xs text-muted-foreground px-2 mt-1">
            Pulsa ↓ o Tab para aplicar
          </p>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      {/* Texto de ayuda */}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
      )}
    </div>
  );
}

/**
 * Escapa caracteres especiales para usar en regex
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
