'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import { terminosPagoService } from '@/services/terminos-pago.service'
import { TerminoPago } from '@/types/termino-pago.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, Calendar, RefreshCw, Clock } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function VerTerminoPagoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [termino, setTermino] = useState<TerminoPago | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await terminosPagoService.getById(id)
        if (response.success && response.data) {
          setTermino(response.data)
        }
      } catch (error) {
        toast.error('Error al cargar el término de pago')
        router.push('/terminos-pago')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await terminosPagoService.delete(id)
      toast.success('Término de pago eliminado correctamente')
      router.push('/terminos-pago')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    } finally {
      setIsDeleting(false)
      setDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando término de pago...</p>
          </div>
        </div>
      
    )
  }

  if (!termino) return null

  return (
    
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/terminos-pago"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{termino.nombre}</h1>
                <p className="text-sm text-muted-foreground">Detalles del término de pago</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/terminos-pago/${id}/editar`}>
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

        {/* Badge de estado */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={termino.activo ? 'default' : 'secondary'}
            className={termino.activo ? 'bg-green-100 text-green-800' : ''}
          >
            {termino.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        {/* Información General */}
        <Card>
          <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Código</p>
              <p className="text-base font-mono font-semibold">{termino.codigo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base font-semibold">{termino.nombre}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="text-base">{termino.descripcion || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Vencimientos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Vencimientos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {termino.vencimientos.map((vencimiento, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {vencimiento.porcentaje}% del total
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {vencimiento.dias === 0 ? 'Pago al contado' : `A ${vencimiento.dias} días de la fecha de factura`}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-lg">
                  {vencimiento.dias}d
                </Badge>
              </div>
            ))}

            {/* Resumen visual */}
            <div className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <p className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                Resumen de condiciones:
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                {termino.vencimientos.length === 1 && termino.vencimientos[0].dias === 0
                  ? 'Pago al contado (100% inmediato)'
                  : termino.vencimientos.map((v, i) => (
                      `${v.porcentaje}% a ${v.dias} días`
                    )).join(' + ')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de eliminación */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar el término de pago "{termino.nombre}"?
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
    
  )
}
