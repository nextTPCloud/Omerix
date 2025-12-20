'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowUp,
  ArrowDown,
  Save,
  Loader2,
  Tag,
  Gift,
  Package,
  GripVertical,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { empresaService } from '@/services/empresa.service'

// ============================================
// INTERFACES
// ============================================

type OrigenPrecio = 'tarifa' | 'oferta' | 'producto'

interface PreferenciasPrecios {
  ordenBusqueda: OrigenPrecio[]
  aplicarOfertasAutomaticamente: boolean
  aplicarTarifasAutomaticamente: boolean
  permitirAcumularOfertas: boolean
  permitirAcumularTarifaYOferta: boolean
  descuentoMaximoManual?: number
}

const ORIGENES_LABELS: Record<OrigenPrecio, { label: string; description: string; icon: React.ReactNode }> = {
  tarifa: {
    label: 'Tarifa del cliente',
    description: 'Precio especifico configurado en la tarifa asignada al cliente',
    icon: <Tag className="h-4 w-4" />,
  },
  oferta: {
    label: 'Ofertas activas',
    description: 'Descuentos y promociones vigentes aplicables al producto',
    icon: <Gift className="h-4 w-4" />,
  },
  producto: {
    label: 'Precio base del producto',
    description: 'Precio de venta estandar definido en la ficha del producto',
    icon: <Package className="h-4 w-4" />,
  },
}

// ============================================
// COMPONENTE
// ============================================

export function PreciosConfig() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [preferencias, setPreferencias] = useState<PreferenciasPrecios>({
    ordenBusqueda: ['tarifa', 'oferta', 'producto'],
    aplicarOfertasAutomaticamente: true,
    aplicarTarifasAutomaticamente: true,
    permitirAcumularOfertas: false,
    permitirAcumularTarifaYOferta: true,
    descuentoMaximoManual: 50,
  })

  // Cargar preferencias actuales
  useEffect(() => {
    loadPreferencias()
  }, [])

  const loadPreferencias = async () => {
    try {
      setIsLoading(true)
      const response = await empresaService.getPreferenciasPrecios()
      if (response.success && response.data) {
        setPreferencias({
          ordenBusqueda: response.data.ordenBusqueda || ['tarifa', 'oferta', 'producto'],
          aplicarOfertasAutomaticamente: response.data.aplicarOfertasAutomaticamente ?? true,
          aplicarTarifasAutomaticamente: response.data.aplicarTarifasAutomaticamente ?? true,
          permitirAcumularOfertas: response.data.permitirAcumularOfertas ?? false,
          permitirAcumularTarifaYOferta: response.data.permitirAcumularTarifaYOferta ?? true,
          descuentoMaximoManual: response.data.descuentoMaximoManual ?? 50,
        })
      }
    } catch (error) {
      console.error('Error al cargar preferencias de precios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await empresaService.updatePreferenciasPrecios(preferencias)
      toast.success('Preferencias de precios guardadas correctamente')
    } catch (error: any) {
      console.error('Error al guardar preferencias:', error)
      toast.error(error.message || 'Error al guardar preferencias')
    } finally {
      setIsSaving(false)
    }
  }

  const moveOrigenUp = (index: number) => {
    if (index === 0) return
    const newOrden = [...preferencias.ordenBusqueda]
    const temp = newOrden[index - 1]
    newOrden[index - 1] = newOrden[index]
    newOrden[index] = temp
    setPreferencias({ ...preferencias, ordenBusqueda: newOrden })
  }

  const moveOrigenDown = (index: number) => {
    if (index === preferencias.ordenBusqueda.length - 1) return
    const newOrden = [...preferencias.ordenBusqueda]
    const temp = newOrden[index + 1]
    newOrden[index + 1] = newOrden[index]
    newOrden[index] = temp
    setPreferencias({ ...preferencias, ordenBusqueda: newOrden })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Orden de busqueda de precios */}
      <Card>
        <CardHeader>
          <CardTitle>Orden de Busqueda de Precios</CardTitle>
          <CardDescription>
            Define el orden en que el sistema busca el precio al añadir un producto a un documento.
            El primer precio valido encontrado sera el aplicado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {preferencias.ordenBusqueda.map((origen, index) => {
              const config = ORIGENES_LABELS[origen]
              return (
                <div
                  key={origen}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                >
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                      {index + 1}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    {config.icon}
                    <div>
                      <p className="font-medium text-sm">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveOrigenUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveOrigenDown(index)}
                      disabled={index === preferencias.ordenBusqueda.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              El sistema buscara el precio en el orden indicado. Por ejemplo, si "Tarifa del cliente"
              esta primero y el cliente tiene tarifa asignada, se usara ese precio.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Opciones de aplicacion automatica */}
      <Card>
        <CardHeader>
          <CardTitle>Aplicacion Automatica</CardTitle>
          <CardDescription>
            Configura si el sistema debe aplicar automaticamente tarifas y ofertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aplicar tarifas automaticamente</Label>
              <p className="text-sm text-muted-foreground">
                Cuando el cliente tiene tarifa asignada, aplicar automaticamente sus precios
              </p>
            </div>
            <Switch
              checked={preferencias.aplicarTarifasAutomaticamente}
              onCheckedChange={(checked) =>
                setPreferencias({ ...preferencias, aplicarTarifasAutomaticamente: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aplicar ofertas automaticamente</Label>
              <p className="text-sm text-muted-foreground">
                Buscar y aplicar ofertas vigentes al añadir productos
              </p>
            </div>
            <Switch
              checked={preferencias.aplicarOfertasAutomaticamente}
              onCheckedChange={(checked) =>
                setPreferencias({ ...preferencias, aplicarOfertasAutomaticamente: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Opciones de acumulacion */}
      <Card>
        <CardHeader>
          <CardTitle>Acumulacion de Descuentos</CardTitle>
          <CardDescription>
            Configura si se pueden acumular diferentes tipos de descuentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permitir acumular ofertas</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que se apliquen multiples ofertas al mismo producto
              </p>
            </div>
            <Switch
              checked={preferencias.permitirAcumularOfertas}
              onCheckedChange={(checked) =>
                setPreferencias({ ...preferencias, permitirAcumularOfertas: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permitir acumular tarifa y oferta</Label>
              <p className="text-sm text-muted-foreground">
                Permitir aplicar oferta sobre el precio ya reducido por tarifa
              </p>
            </div>
            <Switch
              checked={preferencias.permitirAcumularTarifaYOferta}
              onCheckedChange={(checked) =>
                setPreferencias({ ...preferencias, permitirAcumularTarifaYOferta: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Limites */}
      <Card>
        <CardHeader>
          <CardTitle>Limites de Descuento</CardTitle>
          <CardDescription>
            Define limites para los descuentos que pueden aplicar los usuarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="descuentoMaximo">Descuento maximo manual (%)</Label>
              <Input
                id="descuentoMaximo"
                type="number"
                min={0}
                max={100}
                value={preferencias.descuentoMaximoManual || ''}
                onChange={(e) =>
                  setPreferencias({
                    ...preferencias,
                    descuentoMaximoManual: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="Ej: 50"
              />
              <p className="text-xs text-muted-foreground">
                Porcentaje maximo de descuento que un usuario puede aplicar manualmente.
                Deja vacio para no tener limite.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Boton guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Preferencias
        </Button>
      </div>
    </div>
  )
}

export default PreciosConfig
