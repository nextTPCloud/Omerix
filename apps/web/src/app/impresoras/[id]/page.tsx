'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { impresorasService, Impresora } from '@/services/impresoras.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, Printer, RefreshCw, Network, Settings, FileText, TestTube } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function VerImpresoraPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [impresora, setImpresora] = useState<Impresora | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await impresorasService.getById(id)
        if (response.success && response.data) {
          setImpresora(response.data)
        }
      } catch (error) {
        toast.error('Error al cargar la impresora')
        router.push('/impresoras')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await impresorasService.delete(id)
      toast.success('Impresora eliminada correctamente')
      router.push('/impresoras')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    } finally {
      setIsDeleting(false)
      setDeleteDialog(false)
    }
  }

  const handleTest = async () => {
    try {
      const response = await impresorasService.test(id)
      if (response.success) toast.success(response.message || 'Prueba enviada')
      else toast.error('Error en la prueba')
    } catch (error) {
      toast.error('Error al probar la impresora')
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ticket: 'Ticket',
      cocina: 'Cocina',
      etiquetas: 'Etiquetas',
      fiscal: 'Fiscal',
    }
    return labels[tipo] || tipo
  }

  const getTipoConexionLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      red: 'Red (TCP/IP)',
      usb: 'USB',
      bluetooth: 'Bluetooth',
      serie: 'Puerto Serie',
    }
    return labels[tipo] || tipo
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando impresora...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!impresora) return null

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/impresoras"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Printer className="h-7 w-7 text-primary" />
                {impresora.nombre}
              </h1>
              <p className="text-sm text-muted-foreground">Detalles de la impresora</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTest}>
              <TestTube className="h-4 w-4 mr-2" />
              Probar
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/impresoras/${id}/editar`}>
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

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant={impresora.activo ? 'default' : 'secondary'} className={impresora.activo ? 'bg-green-100 text-green-800' : ''}>
            {impresora.activo ? 'Activa' : 'Inactiva'}
          </Badge>
          <Badge variant="outline">
            {getTipoLabel(impresora.tipo)}
          </Badge>
          <Badge variant="outline">
            {getTipoConexionLabel(impresora.tipoConexion)}
          </Badge>
        </div>

        {/* Información General */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Información General</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base font-semibold">{impresora.nombre}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <p className="text-base">{getTipoLabel(impresora.tipo)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Modelo</p>
              <p className="text-base">{impresora.modelo || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fabricante</p>
              <p className="text-base">{impresora.fabricante || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Conexión */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Network className="h-5 w-5" />Conexión</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Conexión</p>
              <p className="text-base font-semibold">{getTipoConexionLabel(impresora.tipoConexion)}</p>
            </div>

            {impresora.tipoConexion === 'red' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dirección IP</p>
                  <p className="text-base font-mono">{impresora.ip || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Puerto</p>
                  <p className="text-base font-mono">{impresora.puerto || '-'}</p>
                </div>
              </div>
            )}

            {impresora.tipoConexion === 'bluetooth' && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dirección MAC</p>
                <p className="text-base font-mono">{impresora.mac || '-'}</p>
              </div>
            )}

            {impresora.tipoConexion === 'serie' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Puerto Serie</p>
                  <p className="text-base font-mono">{impresora.puertoSerie || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Velocidad (baud)</p>
                  <p className="text-base">{impresora.baudRate || '-'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuración de Impresión */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Configuración de Impresión</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Ancho de papel</p>
                <p className="text-2xl font-bold">{impresora.anchoPapel}mm</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Copias por defecto</p>
                <p className="text-2xl font-bold">{impresora.copias}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Cortar papel</span>
                <Badge variant={impresora.cortarPapel ? 'default' : 'secondary'}>
                  {impresora.cortarPapel ? 'Sí' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Abrir cajón</span>
                <Badge variant={impresora.abrirCajon ? 'default' : 'secondary'}>
                  {impresora.abrirCajon ? 'Sí' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Imprimir logo</span>
                <Badge variant={impresora.imprimirLogo ? 'default' : 'secondary'}>
                  {impresora.imprimirLogo ? 'Sí' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de eliminación */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar la impresora "{impresora.nombre}"?
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={isDeleting}>Cancelar</Button>
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
