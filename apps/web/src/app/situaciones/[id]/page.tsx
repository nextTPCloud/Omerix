'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SituacionForm } from '@/components/situaciones/SituacionForm'
import { situacionesService } from '@/services/situaciones.service'
import { Situacion } from '@/types/situacion.types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ListChecks, Edit, RefreshCw, Trash2 } from 'lucide-react'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function VerSituacionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [situacion, setSituacion] = useState<Situacion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    cargarSituacion()
  }, [id])

  const cargarSituacion = async () => {
    try {
      setIsLoading(true)
      const response = await situacionesService.getById(id)

      if (response.success) {
        setSituacion(response.data)
      } else {
        toast.error('Error al cargar la situación')
        router.push('/situaciones')
      }
    } catch (error: any) {
      console.error('Error al cargar situación:', error)
      toast.error(error?.response?.data?.message || 'Error al cargar la situación')
      router.push('/situaciones')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await situacionesService.delete(id)
      toast.success('Situación eliminada correctamente')
      router.push('/situaciones')
    } catch (error: any) {
      console.error('Error al eliminar situación:', error)
      toast.error(error?.response?.data?.message || 'Error al eliminar la situación')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando situación...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ListChecks className="h-7 w-7 text-primary" />
              Ver Situación
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Detalles de la situación: {situacion?.nombre}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/situaciones">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/situaciones/${id}/editar`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* FORMULARIO EN MODO VISTA */}
        <SituacionForm
          onSubmit={() => {}}
          initialData={situacion}
          mode="view"
        />
      </div>

      {/* DIALOG DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la situación "{situacion?.nombre}".
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
