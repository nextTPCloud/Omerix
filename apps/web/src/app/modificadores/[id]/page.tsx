'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { modificadoresService, ModificadorProducto } from '@/services/modificadores.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, SlidersHorizontal, RefreshCw, FileText, Settings, Euro } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function VerModificadorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [modificador, setModificador] = useState<ModificadorProducto | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await modificadoresService.getById(id)
        if (response.success && response.data) {
          setModificador(response.data)
        }
      } catch (error) {
        toast.error('Error al cargar el modificador')
        router.push('/modificadores')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await modificadoresService.delete(id)
      toast.success('Modificador eliminado correctamente')
      router.push('/modificadores')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    } finally {
      setIsDeleting(false)
      setDeleteDialog(false)
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      gratis: 'Gratis',
      cargo: 'Cargo',
      descuento: 'Descuento',
    }
    return labels[tipo] || tipo
  }

  const getAplicaALabel = (aplicaA: string) => {
    const labels: Record<string, string> = {
      todos: 'Todos',
      familias: 'Familias',
      productos: 'Productos',
    }
    return labels[aplicaA] || aplicaA
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando modificador...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!modificador) return null

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/modificadores"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <SlidersHorizontal className="h-7 w-7 text-primary" />
                {modificador.nombre}
              </h1>
              <p className="text-sm text-muted-foreground">Detalles del modificador</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/modificadores/${id}/editar`}>
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
          <Badge variant={modificador.activo ? 'default' : 'secondary'} className={modificador.activo ? 'bg-green-100 text-green-800' : ''}>
            {modificador.activo ? 'Activo' : 'Inactivo'}
          </Badge>
          <Badge variant="outline">
            {getTipoLabel(modificador.tipo)}
          </Badge>
          {modificador.mostrarEnTPV && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Visible en TPV
            </Badge>
          )}
          {modificador.obligatorio && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              Obligatorio
            </Badge>
          )}
        </div>

        {/* Información General */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Información General</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Código</p>
              <p className="text-base font-mono font-semibold">{modificador.codigo || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base font-semibold">{modificador.nombre}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre Corto</p>
              <p className="text-base">{modificador.nombreCorto || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <p className="text-base">{getTipoLabel(modificador.tipo)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="text-base">{modificador.descripcion || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Precio y Aplicación */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Euro className="h-5 w-5" />Precio y Aplicación</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Precio extra</p>
                <p className="text-2xl font-bold">{modificador.precioExtra > 0 ? `+${modificador.precioExtra.toFixed(2)} €` : '0.00 €'}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Porcentaje</p>
                <p className="text-2xl font-bold">{modificador.porcentaje ? `${modificador.porcentaje}%` : '-'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Aplica a</p>
              <p className="text-base font-semibold">{getAplicaALabel(modificador.aplicaA)}</p>
            </div>

            {modificador.color && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Color</p>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded border" style={{ backgroundColor: modificador.color }} />
                  <span className="font-mono text-sm">{modificador.color}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Configuración</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Orden</p>
                <p className="text-2xl font-bold">{modificador.orden}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Cantidad máxima</p>
                <p className="text-2xl font-bold">{modificador.cantidadMaxima || 'Sin límite'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Mostrar en TPV</span>
                <Badge variant={modificador.mostrarEnTPV ? 'default' : 'secondary'}>
                  {modificador.mostrarEnTPV ? 'Sí' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Es múltiple</span>
                <Badge variant={modificador.esMultiple ? 'default' : 'secondary'}>
                  {modificador.esMultiple ? 'Sí' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Obligatorio</span>
                <Badge variant={modificador.obligatorio ? 'default' : 'secondary'}>
                  {modificador.obligatorio ? 'Sí' : 'No'}
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
                ¿Estás seguro de que deseas eliminar el modificador "{modificador.nombre}"?
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
