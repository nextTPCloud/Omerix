'use client'

import { useForm } from 'react-hook-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CreateEstadoDTO, UpdateEstadoDTO, Estado } from '@/types/estado.types'
import { Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EstadoFormProps {
  onSubmit: (data: CreateEstadoDTO | UpdateEstadoDTO) => void
  isLoading?: boolean
  initialData?: Estado | null
  mode: 'create' | 'edit' | 'view'
}

export function EstadoForm({
  onSubmit,
  isLoading = false,
  initialData = null,
  mode = 'create',
}: EstadoFormProps) {
  const router = useRouter()
  const isViewMode = mode === 'view'

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEstadoDTO | UpdateEstadoDTO>({
    defaultValues: {
      nombre: initialData?.nombre || '',
      activo: initialData?.activo ?? true,
    },
  })

  const activo = watch('activo')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Información del Estado</h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  {...register('nombre', {
                    required: 'El nombre es obligatorio',
                    minLength: {
                      value: 2,
                      message: 'El nombre debe tener al menos 2 caracteres',
                    },
                  })}
                  placeholder="Ej: Activo, Pendiente, Finalizado..."
                  disabled={isViewMode}
                  className={errors.nombre ? 'border-destructive' : ''}
                />
                {errors.nombre && (
                  <p className="text-sm text-destructive">{errors.nombre.message}</p>
                )}
              </div>

              {/* Activo */}
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="activo" className="text-base font-medium">
                    Estado activo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Define si este estado está disponible para usar en el sistema
                  </p>
                </div>
                <Switch
                  id="activo"
                  checked={activo}
                  onCheckedChange={(checked) => setValue('activo', checked)}
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ACCIONES */}
      {!isViewMode && (
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear Estado' : 'Guardar Cambios'}
          </Button>
        </div>
      )}
    </form>
  )
}
