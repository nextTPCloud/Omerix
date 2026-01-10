'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  Receipt,
  Building2,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { albaranesCompraService } from '@/services/albaranes-compra.service'
import { facturasCompraService } from '@/services/facturas-compra.service'
import { AlbaranCompra } from '@/types/albaran-compra.types'
import { formatCurrency } from '@/lib/utils'

interface CrearFacturaDesdeAlbaranesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  albaranesIds: string[]
  onSuccess?: () => void
}

export function CrearFacturaDesdeAlbaranesDialog({
  open,
  onOpenChange,
  albaranesIds,
  onSuccess,
}: CrearFacturaDesdeAlbaranesDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [albaranes, setAlbaranes] = useState<AlbaranCompra[]>([])
  const [error, setError] = useState<string | null>(null)

  // Campos del formulario
  const [numeroFacturaProveedor, setNumeroFacturaProveedor] = useState('')
  const [fechaFacturaProveedor, setFechaFacturaProveedor] = useState(
    new Date().toISOString().split('T')[0]
  )

  // Cargar datos de los albaranes cuando se abre el dialog
  useEffect(() => {
    if (open && albaranesIds.length > 0) {
      loadAlbaranes()
    }
  }, [open, albaranesIds])

  // Limpiar formulario cuando se cierra
  useEffect(() => {
    if (!open) {
      setNumeroFacturaProveedor('')
      setFechaFacturaProveedor(new Date().toISOString().split('T')[0])
      setError(null)
      setAlbaranes([])
    }
  }, [open])

  const loadAlbaranes = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Cargar cada albaran individualmente
      const albaranesPromises = albaranesIds.map(id =>
        albaranesCompraService.getById(id)
      )
      const responses = await Promise.all(albaranesPromises)

      const albaranesData = responses
        .filter(r => r.success && r.data)
        .map(r => r.data as AlbaranCompra)

      setAlbaranes(albaranesData)

      // Validar que todos sean del mismo proveedor
      if (albaranesData.length > 0) {
        const proveedores = new Set(albaranesData.map(a => a.proveedorId))
        if (proveedores.size > 1) {
          setError('Los albaranes seleccionados pertenecen a diferentes proveedores. Solo se pueden facturar albaranes del mismo proveedor.')
        }

        // Verificar si alguno ya está facturado
        const facturados = albaranesData.filter(a => a.facturado)
        if (facturados.length > 0) {
          setError(`${facturados.length} albaran(es) ya están facturados y no se pueden volver a facturar.`)
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los albaranes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCrearFactura = async () => {
    if (!numeroFacturaProveedor.trim()) {
      toast.error('El número de factura del proveedor es requerido')
      return
    }

    if (!fechaFacturaProveedor) {
      toast.error('La fecha de factura es requerida')
      return
    }

    if (error) {
      toast.error('No se puede crear la factura debido a los errores mostrados')
      return
    }

    try {
      setIsSaving(true)

      const response = await facturasCompraService.crearDesdeAlbaranes(
        albaranesIds,
        numeroFacturaProveedor.trim(),
        fechaFacturaProveedor
      )

      if (response.success && response.data) {
        toast.success('Factura de compra creada correctamente')
        onOpenChange(false)
        onSuccess?.()

        // Navegar a la factura creada
        router.push(`/compras/facturas/${response.data._id}`)
      } else {
        toast.error(response.message || 'Error al crear la factura')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear la factura de compra')
    } finally {
      setIsSaving(false)
    }
  }

  // Calcular totales
  const totalImporte = albaranes.reduce(
    (sum, a) => sum + (a.totales?.totalAlbaran || 0),
    0
  )

  // Obtener info del proveedor (del primer albaran)
  const proveedor = albaranes[0]
    ? {
        nombre: albaranes[0].proveedorNombre,
        nif: albaranes[0].proveedorNif,
      }
    : null

  // Albaranes válidos (no facturados)
  const albaranesValidos = albaranes.filter(a => !a.facturado)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Crear Factura desde Albaranes
          </DialogTitle>
          <DialogDescription>
            Se creará una factura de compra agrupando los albaranes seleccionados
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Info del proveedor */}
            {proveedor && (
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Building2 className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">{proveedor.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    NIF: {proveedor.nif || 'No especificado'}
                  </p>
                </div>
              </div>
            )}

            {/* Lista de albaranes */}
            <div>
              <Label className="text-sm font-medium">
                Albaranes a facturar ({albaranesValidos.length})
              </Label>
              <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto">
                {albaranes.map(albaran => (
                  <div
                    key={albaran._id}
                    className={`flex items-center justify-between p-3 ${
                      albaran.facturado ? 'bg-red-50 opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{albaran.codigo}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(albaran.fecha).toLocaleDateString('es-ES')}
                          {albaran.albaranProveedor && ` - Ref: ${albaran.albaranProveedor}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {albaran.facturado ? (
                        <Badge variant="destructive" className="text-xs">
                          Ya facturado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                      <span className="font-medium text-sm">
                        {formatCurrency(albaran.totales?.totalAlbaran || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Formulario */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="numeroFactura">
                  Número factura proveedor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="numeroFactura"
                  placeholder="Ej: FAC-2024-001"
                  value={numeroFacturaProveedor}
                  onChange={e => setNumeroFacturaProveedor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaFactura">
                  Fecha factura <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fechaFactura"
                    type="date"
                    className="pl-10"
                    value={fechaFacturaProveedor}
                    onChange={e => setFechaFacturaProveedor(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-primary/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total a facturar ({albaranesValidos.length} albaranes)
                </span>
                <span className="text-xl font-bold">
                  {formatCurrency(
                    albaranesValidos.reduce(
                      (sum, a) => sum + (a.totales?.totalAlbaran || 0),
                      0
                    )
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCrearFactura}
            disabled={
              isLoading ||
              isSaving ||
              !!error ||
              albaranesValidos.length === 0 ||
              !numeroFacturaProveedor.trim()
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-4 w-4" />
                Crear Factura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
