'use client';

import { useSkin, SkinType } from '@/hooks/useSkin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Check, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkinSelectorProps {
  showLabel?: boolean;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function SkinSelector({
  showLabel = false,
  variant = 'ghost',
  size = 'icon',
  className,
}: SkinSelectorProps) {
  const { currentSkin, setSkin, availableSkins, isDarkMode, toggleDarkMode } = useSkin();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={cn('gap-2', className)}>
          <Palette className="h-4 w-4" />
          {showLabel && <span>Tema</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Seleccionar Tema</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {availableSkins.map((skin) => (
          <DropdownMenuItem
            key={skin.id}
            onClick={() => setSkin(skin.id)}
            className="flex items-center gap-3 cursor-pointer"
          >
            {/* Preview de colores */}
            <div className="flex gap-0.5">
              <div
                className="w-3 h-3 rounded-full border border-border"
                style={{ backgroundColor: skin.preview.background }}
              />
              <div
                className="w-3 h-3 rounded-full border border-border"
                style={{ backgroundColor: skin.preview.primary }}
              />
              <div
                className="w-3 h-3 rounded-full border border-border"
                style={{ backgroundColor: skin.preview.secondary }}
              />
            </div>

            {/* Nombre y descripción */}
            <div className="flex-1">
              <div className="font-medium text-sm">{skin.name}</div>
              <div className="text-xs text-muted-foreground">{skin.description}</div>
            </div>

            {/* Check si está seleccionado */}
            {currentSkin === skin.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Toggle rápido de modo oscuro */}
        <DropdownMenuItem
          onClick={toggleDarkMode}
          className="flex items-center gap-3 cursor-pointer"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span>{isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Componente de selector de skin en formato de tarjetas
 * Útil para páginas de configuración
 */
interface SkinCardSelectorProps {
  className?: string;
}

export function SkinCardSelector({ className }: SkinCardSelectorProps) {
  const { currentSkin, setSkin, availableSkins } = useSkin();

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-4', className)}>
      {availableSkins.map((skin) => (
        <button
          key={skin.id}
          onClick={() => setSkin(skin.id)}
          className={cn(
            'relative p-4 rounded-lg border-2 transition-all hover:shadow-md',
            currentSkin === skin.id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
        >
          {/* Preview de colores */}
          <div className="flex gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-md border border-border shadow-sm"
              style={{ backgroundColor: skin.preview.background }}
            />
            <div
              className="w-8 h-8 rounded-md border border-border shadow-sm"
              style={{ backgroundColor: skin.preview.primary }}
            />
            <div
              className="w-8 h-8 rounded-md border border-border shadow-sm"
              style={{ backgroundColor: skin.preview.secondary }}
            />
          </div>

          {/* Nombre y descripción */}
          <div className="text-left">
            <div className="font-medium">{skin.name}</div>
            <div className="text-xs text-muted-foreground">{skin.description}</div>
          </div>

          {/* Indicador de selección */}
          {currentSkin === skin.id && (
            <div className="absolute top-2 right-2">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
