'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { TipoImpuesto, CreateTipoImpuestoDTO, UpdateTipoImpuestoDTO } from '@/types/tipo-impuesto.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { CodeInput } from '@/components/ui/code-input'
import { Loader2 } from 'lucide-react'
import { tiposImpuestoService } from '@/services/tipos-impuesto.service'
import { useFormValidation, ValidationRule } from '@/hooks/useFormValidation'

// Reglas de validación
const validationRules: ValidationRule[] = [
  { field: 'codigo', label: 'Código', required: true, minLength: 2 },
  { field: 'nombre', label: 'Nombre', required: true, minLength: 2 },
  {
    field: 'porcentaje',
    label: 'Porcentaje',
    required: true,
    custom: (value) => {
      if (value === undefined || value === null || value < 0) {
        return 'El porcentaje debe ser mayor o igual a 0'
      }
      if (value > 100) {
        return 'El porcentaje no puede ser mayor a 100'
      }
      return null
    },
  },
]

interface TipoImpuestoFormProps {
  initialData?: TipoImpuesto
  onSubmit: (data: CreateTipoImpuestoDTO | UpdateTipoImpuestoDTO) => Promise<void>
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

export function TipoImpuestoForm({
  initialData,
  onSubmit,
  isLoading = false,
  mode = 'create',
}: TipoImpuestoFormProps) {
  const { validate, getFieldError, clearFieldError } = useFormValidation<CreateTipoImpuestoDTO>(validationRules)
  const [formData, setFormData] = useState<CreateTipoImpuestoDTO>({
    codigo: '',
    nombre: '',
    descripcion: '',
    porcentaje: 0,
    tipo: 'IVA',
    recargoEquivalencia: false,
    porcentajeRecargo: 0,
    activo: true,
    predeterminado: false,
  })

  // Cargar datos iniciales si existen
  useEffect(() => {
    if (initialData) {
      setFormData({
        codigo: initialData.codigo,
        nombre: initialData.nombre,
        descripcion: initialData.descripcion,
        porcentaje: initialData.porcentaje,
        tipo: initialData.tipo,
        recargoEquivalencia: initialData.recargoEquivalencia,
        porcentajeRecargo: initialData.porcentajeRecargo,
        activo: initialData.activo,
        predeterminado: initialData.predeterminado,
      })
    }
  }, [initialData])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }))
    clearFieldError(name)
  }

  // Función para buscar códigos existentes
  const handleSearchCodigos = useCallback(async (prefix: string): Promise<string[]> => {
    try {
      return await tiposImpuestoService.searchCodigos(prefix)
    } catch {
      return []
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar con mensajes bonitos
    if (!validate(formData)) {
      return
    }

    const dataToSubmit = { ...formData }

    // Si no hay recargo de equivalencia, eliminar el porcentaje de recargo
    if (!formData.recargoEquivalencia) {
      dataToSubmit.porcentajeRecargo = undefined
    }

    await onSubmit(dataToSubmit)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ============================================ */}
      {/* DATOS BÁSICOS */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Básicos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código *</Label>
            {mode === 'create' ? (
              <CodeInput
                id="codigo"
                value={formData.codigo || ''}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, codigo: value }))
                  clearFieldError('codigo')
                }}
                onSearchCodes={handleSearchCodigos}
                placeholder="Ej: IVA21"
                error={getFieldError('codigo')}
                helperText="Pulsa ↓ para sugerir siguiente código"
              />
            ) : (
              <Input
                id="codigo"
                name="codigo"
                value={formData.codigo || ''}
                disabled
                className="bg-muted"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Impuesto *</Label>
            <select
              id="tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="IVA">IVA (Impuesto sobre el Valor Añadido)</option>
              <option value="IGIC">IGIC (Impuesto General Indirecto Canario)</option>
              <option value="IPSI">IPSI (Impuesto sobre Producción, Servicios e Importación)</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: IVA General"
              aria-invalid={!!getFieldError('nombre')}
            />
            {getFieldError('nombre') && (
              <p className="text-sm text-destructive">{getFieldError('nombre')}</p>
            )}
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion || ''}
              onChange={handleChange}
              rows={2}
              placeholder="Descripción del tipo de impuesto..."
            />
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* PORCENTAJES */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Porcentajes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="porcentaje">Porcentaje de Impuesto * (%)</Label>
            <Input
              id="porcentaje"
              name="porcentaje"
              type="number"
              value={formData.porcentaje}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
              required
              placeholder="21.00"
            />
            <p className="text-xs text-muted-foreground">
              Introduce el porcentaje sin el símbolo %
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <input
              type="checkbox"
              id="recargoEquivalencia"
              name="recargoEquivalencia"
              checked={formData.recargoEquivalencia}
              onChange={handleChange}
              className="h-4 w-4 rounded border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <Label htmlFor="recargoEquivalencia" className="cursor-pointer">
              Aplicar Recargo de Equivalencia
            </Label>
          </div>

          {formData.recargoEquivalencia && (
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="porcentajeRecargo">Porcentaje de Recargo de Equivalencia * (%)</Label>
              <Input
                id="porcentajeRecargo"
                name="porcentajeRecargo"
                type="number"
                value={formData.porcentajeRecargo || 0}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                required={formData.recargoEquivalencia}
                placeholder="5.20"
              />
              <p className="text-xs text-muted-foreground">
                Recargo aplicable en régimen de equivalencia
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* CONFIGURACIÓN */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="h-4 w-4 rounded border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <Label htmlFor="activo" className="cursor-pointer">
              Tipo de Impuesto Activo
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="predeterminado"
              name="predeterminado"
              checked={formData.predeterminado}
              onChange={handleChange}
              className="h-4 w-4 rounded border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <Label htmlFor="predeterminado" className="cursor-pointer">
              Establecer como Predeterminado
            </Label>
          </div>

          <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Nota:</strong> El tipo de impuesto marcado como predeterminado se aplicará automáticamente en nuevas facturas y documentos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* EJEMPLOS DE CÁLCULO */}
      {/* ============================================ */}
      {formData.porcentaje > 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Ejemplos de Cálculo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Base Imponible: 100.00 €</p>
                <p className="text-sm text-muted-foreground">
                  + {formData.tipo} ({formData.porcentaje}%): {(100 * formData.porcentaje / 100).toFixed(2)} €
                </p>
                {formData.recargoEquivalencia && formData.porcentajeRecargo && (
                  <p className="text-sm text-muted-foreground">
                    + Recargo Equiv. ({formData.porcentajeRecargo}%): {(100 * (formData.porcentajeRecargo || 0) / 100).toFixed(2)} €
                  </p>
                )}
                <p className="text-sm font-semibold border-t pt-1 mt-1">
                  Total: {(100 + (100 * formData.porcentaje / 100) + (formData.recargoEquivalencia ? (100 * (formData.porcentajeRecargo || 0) / 100) : 0)).toFixed(2)} €
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Base Imponible: 1,000.00 €</p>
                <p className="text-sm text-muted-foreground">
                  + {formData.tipo} ({formData.porcentaje}%): {(1000 * formData.porcentaje / 100).toFixed(2)} €
                </p>
                {formData.recargoEquivalencia && formData.porcentajeRecargo && (
                  <p className="text-sm text-muted-foreground">
                    + Recargo Equiv. ({formData.porcentajeRecargo}%): {(1000 * (formData.porcentajeRecargo || 0) / 100).toFixed(2)} €
                  </p>
                )}
                <p className="text-sm font-semibold border-t pt-1 mt-1">
                  Total: {(1000 + (1000 * formData.porcentaje / 100) + (formData.recargoEquivalencia ? (1000 * (formData.porcentajeRecargo || 0) / 100) : 0)).toFixed(2)} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* BOTONES */}
      {/* ============================================ */}
      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  )
}

// También exportar como default para compatibilidad
export default TipoImpuestoForm
