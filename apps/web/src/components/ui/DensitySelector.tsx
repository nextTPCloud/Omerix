'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ListTree } from 'lucide-react'

interface DensitySelectorProps {
  value: 'compact' | 'normal' | 'comfortable'
  onChange: (density: 'compact' | 'normal' | 'comfortable') => void
}

const DENSITY_OPTIONS = [
  {
    value: 'compact' as const,
    label: 'Compacto',
    description: 'Más filas visibles',
    className: 'py-1 text-xs',
  },
  {
    value: 'normal' as const,
    label: 'Normal',
    description: 'Balance entre densidad y legibilidad',
    className: 'py-2 text-sm',
  },
  {
    value: 'comfortable' as const,
    label: 'Cómodo',
    description: 'Más espaciado, mejor legibilidad',
    className: 'py-3 text-sm',
  },
]

export function DensitySelector({ value, onChange }: DensitySelectorProps) {
  const currentOption = DENSITY_OPTIONS.find((opt) => opt.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ListTree className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Densidad</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Densidad de la tabla</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(val) => onChange(val as any)}
        >
          {DENSITY_OPTIONS.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="flex-col items-start py-3"
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground">
                {option.description}
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Hook para obtener las clases CSS según la densidad
 */
export function useDensityClasses(density: 'compact' | 'normal' | 'comfortable') {
  const densityClasses = {
    compact: {
      row: 'py-1',
      cell: 'px-2 py-1',
      text: 'text-xs',
      header: 'px-2 py-1.5',
    },
    normal: {
      row: 'py-2',
      cell: 'px-3 py-2',
      text: 'text-sm',
      header: 'px-3 py-2.5',
    },
    comfortable: {
      row: 'py-3',
      cell: 'px-4 py-3',
      text: 'text-sm',
      header: 'px-4 py-3.5',
    },
  }

  return densityClasses[density]
}