'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { almacenesService, Almacen } from '@/services/almacenes.service'
import { toast } from 'sonner'
import { Warehouse, Settings } from 'lucide-react'

interface UserPreferencesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserPreferencesSheet({ open, onOpenChange }: UserPreferencesSheetProps) {
  const { almacenDefaultId, setAlmacenDefault, isLoaded } = useUserPreferences()
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(true)

  // Cargar almacenes
  useEffect(() => {
    const cargarAlmacenes = async () => {
      if (!open) return

      try {
        setLoadingAlmacenes(true)
        const response = await almacenesService.getAll({ activo: true })
        setAlmacenes(response.data?.almacenes || [])
      } catch (error) {
        console.error('Error cargando almacenes:', error)
      } finally {
        setLoadingAlmacenes(false)
      }
    }

    cargarAlmacenes()
  }, [open])

  const handleAlmacenChange = (value: string) => {
    setAlmacenDefault(value || null)
    const almacenNombre = almacenes.find(a => a._id === value)?.nombre
    toast.success(`Almacen por defecto: ${almacenNombre || 'Ninguno'}`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Mis Preferencias
          </SheetTitle>
          <SheetDescription>
            Configura tus preferencias personales de la aplicacion.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Almacen por defecto */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Almacen por Defecto
            </Label>
            <p className="text-xs text-muted-foreground">
              Este almacen se seleccionara automaticamente en ventas, compras, inventarios y movimientos de stock.
            </p>
            {loadingAlmacenes ? (
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            ) : (
              <SearchableSelect
                options={almacenes.map(a => ({
                  value: a._id,
                  label: a.nombre,
                  description: a.esPrincipal ? 'Principal' : a.codigo || undefined,
                }))}
                value={almacenDefaultId || ''}
                onValueChange={handleAlmacenChange}
                placeholder="Seleccionar almacen..."
                searchPlaceholder="Buscar almacen..."
                allowClear={true}
                emptyMessage="No hay almacenes disponibles"
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
