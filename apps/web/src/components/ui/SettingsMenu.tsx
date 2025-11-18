'use client'

import { Settings, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { VistasGuardadasManager } from '@/components/ui/VistasGuardadasManager'

interface SettingsMenuProps {
  // Densidad
  densidad: 'compact' | 'normal' | 'comfortable'
  onDensidadChange: (densidad: 'compact' | 'normal' | 'comfortable') => void

  // Vistas Guardadas
  modulo: string
  configuracionActual: any
  onAplicarVista: (config: any) => void
  onGuardarVista: (nombre: string, descripcion?: string, esDefault?: boolean, vistaId?: string) => Promise<void>

  // Restablecer
  onRestablecer: () => void

  // UI
  showResetButton?: boolean
}

export function SettingsMenu({
  densidad,
  onDensidadChange,
  modulo,
  configuracionActual,
  onAplicarVista,
  onGuardarVista,
  onRestablecer,
  showResetButton = true,
}: SettingsMenuProps) {
  const densidadLabels = {
    compact: 'Compacta',
    normal: 'Normal',
    comfortable: 'Cómoda',
  }

  return (
    <div className="flex items-center gap-2">
      {/* Menú de configuración */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2 shrink-0" />
            <span className="hidden sm:inline">Configuración</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Configuración de tabla</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Densidad */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              Densidad: {densidadLabels[densidad]}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={densidad} onValueChange={onDensidadChange as any}>
                <DropdownMenuRadioItem value="compact">
                  Compacta
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="normal">
                  Normal
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="comfortable">
                  Cómoda
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Restablecer */}
          {showResetButton && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRestablecer}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restablecer configuración
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Vistas Guardadas (separado para mejor UX) */}
      <VistasGuardadasManager
        modulo={modulo}
        configuracionActual={configuracionActual}
        onAplicarVista={onAplicarVista}
        onGuardarVista={onGuardarVista}
      />
    </div>
  )
}