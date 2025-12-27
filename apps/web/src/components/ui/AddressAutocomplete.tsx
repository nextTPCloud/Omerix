'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddressComponents {
  calle: string
  numero?: string
  codigoPostal: string
  ciudad: string
  provincia: string
  pais: string
  latitud?: number
  longitud?: number
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressComponents) => void
  label?: string
  placeholder?: string
  defaultValue?: string
  disabled?: boolean
  className?: string
}

interface NominatimResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  address: {
    road?: string
    house_number?: string
    postcode?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    province?: string
    country?: string
  }
}

export function AddressAutocomplete({
  onAddressSelect,
  label = 'Buscar dirección',
  placeholder = 'Escribe una dirección...',
  defaultValue = '',
  disabled = false,
  className = '',
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchAddress = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)

    try {
      // Usar Nominatim de OpenStreetMap - 100% GRATIS
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: searchQuery,
          format: 'json',
          addressdetails: '1',
          limit: '5',
          countrycodes: 'es', // Restringir a España
          'accept-language': 'es',
        }),
        {
          headers: {
            'User-Agent': 'ERP-Tralok/1.0', // Nominatim requiere User-Agent
          },
        }
      )

      if (!response.ok) {
        throw new Error('Error al buscar direcciones')
      }

      const results: NominatimResult[] = await response.json()
      setSuggestions(results)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error al buscar dirección:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)

    // Debounce para no hacer demasiadas peticiones
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      searchAddress(value)
    }, 300)
  }

  const handleSelectAddress = (result: NominatimResult) => {
    const addr = result.address

    // Extraer componentes de la dirección
    let calle = addr.road || ''
    let numero = addr.house_number || ''

    // Si no hay número en los datos estructurados, intentar extraerlo del display_name
    if (!numero && result.display_name) {
      // Intentar extraer número del formato: "Calle nombre, número, ciudad"
      // Ejemplos: "C/ renou, 64, sa pobla" o "Gran Vía, 1, Madrid"
      const displayParts = result.display_name.split(',').map(p => p.trim())

      // Buscar en las primeras partes un número
      for (let i = 0; i < Math.min(3, displayParts.length); i++) {
        const part = displayParts[i]
        // Si la parte es solo números o empieza con números
        const numberMatch = part.match(/^(\d+[a-zA-Z]?)(?:\s|$)/)
        if (numberMatch) {
          numero = numberMatch[1]
          break
        }

        // También buscar números después de coma dentro de la misma parte
        // Ej: "C/ renou, 64"
        const commaNumberMatch = part.match(/,\s*(\d+[a-zA-Z]?)(?:\s|$)/)
        if (commaNumberMatch) {
          numero = commaNumberMatch[1]
          break
        }
      }

      // Si aún no encontramos número, buscar en la primera parte
      if (!numero && displayParts[0]) {
        // Buscar patrón: "nombre calle número"
        const streetWithNumber = displayParts[0].match(/^(.+?)\s+(\d+[a-zA-Z]?)$/)
        if (streetWithNumber) {
          calle = streetWithNumber[1].trim()
          numero = streetWithNumber[2]
        }
      }
    }

    const codigoPostal = addr.postcode || ''
    const ciudad = addr.city || addr.town || addr.village || addr.municipality || ''
    const provincia = addr.province || addr.state || ''
    const pais = addr.country || 'España'
    const latitud = parseFloat(result.lat)
    const longitud = parseFloat(result.lon)

    const addressData: AddressComponents = {
      calle,
      numero,
      codigoPostal,
      ciudad,
      provincia,
      pais,
      latitud,
      longitud,
    }

    setQuery(result.display_name)
    setShowSuggestions(false)
    setSuggestions([])
    onAddressSelect(addressData)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectAddress(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div className={cn('space-y-2', className)} ref={wrapperRef}>
      {label && <Label htmlFor="address-autocomplete">{label}</Label>}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          id="address-autocomplete"
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}

        {/* Sugerencias */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-[300px] overflow-y-auto">
            {suggestions.map((result, index) => (
              <div
                key={result.place_id}
                className={cn(
                  'px-3 py-2 cursor-pointer hover:bg-muted transition-colors border-b border-border last:border-b-0',
                  selectedIndex === index && 'bg-muted'
                )}
                onClick={() => handleSelectAddress(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {result.address.road && result.address.house_number
                        ? `${result.address.road}, ${result.address.house_number}`
                        : result.address.road || result.display_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.address.postcode && `${result.address.postcode} `}
                      {result.address.city || result.address.town || result.address.village}
                      {result.address.province && `, ${result.address.province}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        🌍 Búsqueda gratuita con OpenStreetMap. Empieza a escribir para ver sugerencias.
      </p>
    </div>
  )
}

export default AddressAutocomplete