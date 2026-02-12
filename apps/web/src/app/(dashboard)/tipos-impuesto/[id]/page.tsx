'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { tiposImpuestoService } from '@/services/tipos-impuesto.service'
import { TipoImpuesto } from '@/types/tipo-impuesto.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, Percent, RefreshCw, Star } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function VerTipoImpuestoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [tipoImpuesto, setTipoImpuesto] = useState<TipoImpuesto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      cargarTipoImpuesto()
    }
  }, [id])

  const cargarTipoImpuesto = async () => {
    try {
      setIsLoading(true)
      const response = await tiposImpuestoService.getById(id)

      if (response.success && response.data) {
        setTipoImpuesto(response.data)
      } else {
        toast.error('No se pudo cargar el tipo de impuesto')
        router.push('/tipos-impuesto')
      }
    } catch (error) {
      console.error('Error al cargar tipo de impuesto:', error)
      toast.error('Error al cargar el tipo de impuesto')
      router.push('/tipos-impuesto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await tiposImpuestoService.delete(id)
      toast.success('Tipo de impuesto eliminado correctamente')
      router.push('/tipos-impuesto')
    } catch (error) {
      console.error('Error al eliminar:', error)
      toast.error('Error al eliminar el tipo de impuesto')
    } finally {
      setIsDeleting(false)
      setDeleteDialog(false)
    }
  }

  const handleSetPredeterminado = async () => {
    try {
      await tiposImpuestoService.setPredeterminado(id)
      toast.success('Tipo de impuesto establecido como predeterminado')
      cargarTipoImpuesto()
    } catch (error) {
      console.error('Error al establecer como predeterminado:', error)
      toast.error('Error al establecer como predeterminado')
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando tipo de impuesto...</p>
          </div>
        </div>
      
    )
  }

  if (!tipoImpuesto) {
    return null
  }

  return (
    
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Percent className="h-7 w-7 text-primary" />
              {tipoImpuesto.nombre}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Detalles del tipo de impuesto
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link href="/tipos-impuesto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/tipos-impuesto/${id}/editar`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* BADGES DE ESTADO */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={tipoImpuesto.activo ? 'default' : 'secondary'}
            className={`${
              tipoImpuesto.activo
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {tipoImpuesto.activo ? 'Activo' : 'Inactivo'}
          </Badge>
          {tipoImpuesto.predeterminado && (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Predeterminado
            </Badge>
          )}
          <Badge variant="outline">{tipoImpuesto.tipo}</Badge>
        </div>

        {/* INFORMACIÓN BÁSICA */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Código</p>
              <p className="text-base font-mono font-semibold">{tipoImpuesto.codigo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base font-semibold">{tipoImpuesto.nombre}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="text-base">{tipoImpuesto.descripcion || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Impuesto</p>
              <p className="text-base">
                {tipoImpuesto.tipo === 'IVA' && 'IVA (Impuesto sobre el Valor Añadido)'}
                {tipoImpuesto.tipo === 'IGIC' && 'IGIC (Impuesto General Indirecto Canario)'}
                {tipoImpuesto.tipo === 'IPSI' && 'IPSI (Impuesto sobre Producción, Servicios e Importación)'}
                {tipoImpuesto.tipo === 'OTRO' && 'Otro'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PORCENTAJES */}
        <Card>
          <CardHeader>
            <CardTitle>Porcentajes</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Porcentaje de Impuesto</p>
              <p className="text-2xl font-bold text-primary">{tipoImpuesto.porcentaje.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recargo de Equivalencia</p>
              <p className="text-base">
                {tipoImpuesto.recargoEquivalencia ? (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Sí - {tipoImpuesto.porcentajeRecargo?.toFixed(2)}%
                  </Badge>
                ) : (
                  <Badge variant="secondary">No aplicable</Badge>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* EJEMPLOS DE CÁLCULO */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Ejemplos de Cálculo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ejemplo 1 */}
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm font-semibold mb-3">Base Imponible: 100.00 €</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base:</span>
                    <span className="font-medium">100.00 €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">+ {tipoImpuesto.tipo} ({tipoImpuesto.porcentaje}%):</span>
                    <span className="font-medium">{(100 * tipoImpuesto.porcentaje / 100).toFixed(2)} €</span>
                  </div>
                  {tipoImpuesto.recargoEquivalencia && tipoImpuesto.porcentajeRecargo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">+ Recargo Equiv. ({tipoImpuesto.porcentajeRecargo}%):</span>
                      <span className="font-medium">{(100 * tipoImpuesto.porcentajeRecargo / 100).toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span className="text-primary">
                      {(100 + (100 * tipoImpuesto.porcentaje / 100) + (tipoImpuesto.recargoEquivalencia ? (100 * (tipoImpuesto.porcentajeRecargo || 0) / 100) : 0)).toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>

              {/* Ejemplo 2 */}
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm font-semibold mb-3">Base Imponible: 1,000.00 €</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base:</span>
                    <span className="font-medium">1,000.00 €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">+ {tipoImpuesto.tipo} ({tipoImpuesto.porcentaje}%):</span>
                    <span className="font-medium">{(1000 * tipoImpuesto.porcentaje / 100).toFixed(2)} €</span>
                  </div>
                  {tipoImpuesto.recargoEquivalencia && tipoImpuesto.porcentajeRecargo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">+ Recargo Equiv. ({tipoImpuesto.porcentajeRecargo}%):</span>
                      <span className="font-medium">{(1000 * tipoImpuesto.porcentajeRecargo / 100).toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span className="text-primary">
                      {(1000 + (1000 * tipoImpuesto.porcentaje / 100) + (tipoImpuesto.recargoEquivalencia ? (1000 * (tipoImpuesto.porcentajeRecargo || 0) / 100) : 0)).toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ACCIONES ADICIONALES */}
        {!tipoImpuesto.predeterminado && (
          <Card>
            <CardHeader>
              <CardTitle>Acciones Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSetPredeterminado} variant="outline">
                <Star className="h-4 w-4 mr-2" />
                Establecer como Predeterminado
              </Button>
            </CardContent>
          </Card>
        )}

        {/* INFORMACIÓN DEL SISTEMA */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
              <p className="text-base">
                {new Date(tipoImpuesto.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
              <p className="text-base">
                {new Date(tipoImpuesto.updatedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* DIALOG DE CONFIRMACIÓN DE ELIMINACIÓN */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar el tipo de impuesto "{tipoImpuesto.nombre}"?
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  )
}
