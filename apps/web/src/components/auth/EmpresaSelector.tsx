"use client"

import { useState } from 'react'
import { Building2, Check, ChevronRight, Crown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { EmpresaResumen } from '@/types/auth.types'

interface EmpresaSelectorProps {
  empresas: EmpresaResumen[]
  isLoading: boolean
  onSelect: (empresaId: string) => void
  onCancel: () => void
}

export function EmpresaSelector({ empresas, isLoading, onSelect, onCancel }: EmpresaSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (empresaId: string) => {
    setSelectedId(empresaId)
  }

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId)
    }
  }

  // Traducir rol a español legible
  const getRolLabel = (rol: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      gerente: 'Gerente',
      vendedor: 'Vendedor',
      tecnico: 'Técnico',
      almacenero: 'Almacenero',
      visualizador: 'Visualizador',
    }
    return roles[rol] || rol
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Selecciona una empresa
        </CardTitle>
        <CardDescription>
          Tienes acceso a varias empresas. Selecciona con cuál deseas trabajar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              onClick={() => handleSelect(empresa.id)}
              disabled={isLoading}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                selectedId === empresa.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Logo o icono */}
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {empresa.logo ? (
                  <img
                    src={empresa.logo}
                    alt={empresa.nombre}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <Building2 className="h-5 w-5 text-primary" />
                )}
              </div>

              {/* Info de la empresa */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{empresa.nombre}</span>
                  {empresa.esPrincipal && (
                    <span title="Empresa principal">
                      <Crown className="h-3.5 w-3.5 text-yellow-500" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{empresa.nif}</span>
                  <span>•</span>
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {getRolLabel(empresa.rol)}
                  </span>
                </div>
              </div>

              {/* Indicador de selección */}
              <div className="flex-shrink-0">
                {selectedId === empresa.id ? (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !selectedId}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accediendo...
              </>
            ) : (
              'Continuar'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
