'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { formasPagoService } from '@/services/formas-pago.service'
import { FormaPago, TIPOS_FORMA_PAGO, TIPOS_PASARELA } from '@/types/forma-pago.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, CreditCard, RefreshCw, Copy, Settings, Palette, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function VerFormaPagoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [formaPago, setFormaPago] = useState<FormaPago | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await formasPagoService.getById(id)
        if (response.success && response.data) {
          setFormaPago(response.data)
        }
      } catch (error) {
        toast.error('Error al cargar la forma de pago')
        router.push('/formas-pago')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await formasPagoService.delete(id)
      toast.success('Forma de pago eliminada correctamente')
      router.push('/formas-pago')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    } finally {
      setIsDeleting(false)
      setDeleteDialog(false)
    }
  }

  const handleDuplicar = () => {
    if (!formaPago) return
    const dataForDuplicate = {
      nombre: `${formaPago.nombre} (copia)`,
      descripcion: formaPago.descripcion,
      tipo: formaPago.tipo,
      icono: formaPago.icono,
      color: formaPago.color,
      requiereDatosBancarios: formaPago.requiereDatosBancarios,
      configuracionPasarela: formaPago.configuracionPasarela,
      comision: formaPago.comision,
      orden: formaPago.orden,
    }
    const encodedData = encodeURIComponent(JSON.stringify(dataForDuplicate))
    router.push(`/formas-pago/nuevo?data=${encodedData}`)
  }

  const getTipoLabel = (tipo: string) => {
    return TIPOS_FORMA_PAGO.find(t => t.value === tipo)?.label || tipo
  }

  const getPasarelaLabel = (tipo: string) => {
    return TIPOS_PASARELA.find(t => t.value === tipo)?.label || tipo
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando forma de pago...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!formaPago) return null

  return (
    <DashboardLayout>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/formas-pago"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: formaPago.color || '#3B82F6' }}
              >
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{formaPago.nombre}</h1>
                <p className="text-sm text-muted-foreground">Detalles de la forma de pago</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleDuplicar}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/formas-pago/${id}/editar`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Badges de estado */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={formaPago.activo ? 'default' : 'secondary'}
            className={formaPago.activo ? 'bg-green-100 text-green-800' : ''}
          >
            {formaPago.activo ? 'Activa' : 'Inactiva'}
          </Badge>
          <Badge variant="outline">{getTipoLabel(formaPago.tipo)}</Badge>
          {formaPago.comision && formaPago.comision > 0 && (
            <Badge variant="secondary">{formaPago.comision}% comisión</Badge>
          )}
        </div>

        {/* Información General */}
        <Card>
          <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Código</p>
              <p className="text-base font-mono font-semibold">{formaPago.codigo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base font-semibold">{formaPago.nombre}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <p className="text-base">{getTipoLabel(formaPago.tipo)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Orden</p>
              <p className="text-base">{formaPago.orden || 0}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="text-base">{formaPago.descripcion || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Apariencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apariencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Icono</p>
                <p className="text-base">{formaPago.icono || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Color</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: formaPago.color || '#3B82F6' }}
                  />
                  <span className="text-sm font-mono">{formaPago.color || '#3B82F6'}</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-2">Vista previa:</p>
              <div
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: formaPago.color || '#3B82F6' }}
              >
                <CreditCard className="h-4 w-4" />
                {formaPago.nombre}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Comisión</p>
                <p className="text-base font-semibold">
                  {formaPago.comision ? `${formaPago.comision}%` : 'Sin comisión'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Requiere datos bancarios</p>
                <div className="flex items-center gap-2">
                  {formaPago.requiereDatosBancarios ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Sí</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span>No</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Pasarela */}
        {formaPago.configuracionPasarela && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pasarela de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de pasarela</p>
                  <p className="text-base font-semibold">
                    {getPasarelaLabel(formaPago.configuracionPasarela.tipo)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge
                    variant={formaPago.configuracionPasarela.habilitado ? 'default' : 'secondary'}
                    className={formaPago.configuracionPasarela.habilitado ? 'bg-green-100 text-green-800' : ''}
                  >
                    {formaPago.configuracionPasarela.habilitado ? 'Habilitada' : 'Deshabilitada'}
                  </Badge>
                </div>
              </div>

              {formaPago.configuracionPasarela.tipo === 'stripe' && (
                <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
                  <p className="text-sm font-medium">Stripe</p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Public Key: </span>
                      <span className="font-mono">
                        {formaPago.configuracionPasarela.stripePublicKey
                          ? `${formaPago.configuracionPasarela.stripePublicKey.substring(0, 12)}...`
                          : 'No configurada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Secret Key: </span>
                      <span className="font-mono">
                        {formaPago.configuracionPasarela.stripeSecretKey ? '••••••••••••' : 'No configurada'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {formaPago.configuracionPasarela.tipo === 'redsys' && (
                <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
                  <p className="text-sm font-medium">Redsys</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Código comercio: </span>
                      <span className="font-mono">{formaPago.configuracionPasarela.redsysMerchantCode || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Terminal: </span>
                      <span className="font-mono">{formaPago.configuracionPasarela.redsysTerminal || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Entorno: </span>
                      <Badge variant="outline" className="ml-1">
                        {formaPago.configuracionPasarela.redsysEnvironment === 'production' ? 'Producción' : 'Test'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {formaPago.configuracionPasarela.tipo === 'paypal' && (
                <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
                  <p className="text-sm font-medium">PayPal</p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Client ID: </span>
                      <span className="font-mono">
                        {formaPago.configuracionPasarela.paypalClientId
                          ? `${formaPago.configuracionPasarela.paypalClientId.substring(0, 12)}...`
                          : 'No configurado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Entorno: </span>
                      <Badge variant="outline" className="ml-1">
                        {formaPago.configuracionPasarela.paypalEnvironment === 'production' ? 'Producción' : 'Sandbox'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {formaPago.configuracionPasarela.webhookUrl && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">URL de Webhook</p>
                  <p className="text-sm font-mono break-all">{formaPago.configuracionPasarela.webhookUrl}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog de eliminación */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar la forma de pago "{formaPago.nombre}"?
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
