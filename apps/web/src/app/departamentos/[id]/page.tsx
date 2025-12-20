'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { departamentosService } from '@/services/departamentos.service'
import { Departamento, COLORES_DEPARTAMENTO } from '@/types/departamento.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, Building2, RefreshCw, User, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { usePermissions } from '@/hooks/usePermissions'

export default function DepartamentoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { canUpdate, canDelete } = usePermissions()
  const [departamento, setDepartamento] = useState<Departamento | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const cargarDepartamento = async () => {
    try {
      setIsLoading(true)
      const response = await departamentosService.getById(params.id as string)
      if (response.success && response.data) {
        setDepartamento(response.data)
      } else {
        toast.error('Departamento no encontrado')
        router.push('/departamentos')
      }
    } catch (error) {
      toast.error('Error al cargar el departamento')
      router.push('/departamentos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      cargarDepartamento()
    }
  }, [params.id])

  const handleDelete = async () => {
    try {
      const response = await departamentosService.delete(params.id as string)
      if (response.success) {
        toast.success('Departamento eliminado')
        router.push('/departamentos')
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!departamento) {
    return null
  }

  const colorInfo = COLORES_DEPARTAMENTO.find(c => c.value === departamento.color)

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/departamentos"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: departamento.color || '#3B82F6' }}
              >
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{departamento.nombre}</h1>
                <p className="text-sm text-muted-foreground font-mono">{departamento.codigo}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {canUpdate('departamentos') && (
              <Button variant="outline" asChild>
                <Link href={`/departamentos/${departamento._id}/editar`}>
                  <Edit className="h-4 w-4 mr-2" />Editar
                </Link>
              </Button>
            )}
            {canDelete('departamentos') && (
              <Button variant="destructive" onClick={() => setDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />Eliminar
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Informacion Principal */}
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Informacion General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Codigo</p>
                  <p className="font-mono font-medium">{departamento.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{departamento.nombre}</p>
                </div>
              </div>

              {departamento.descripcion && (
                <div>
                  <p className="text-sm text-muted-foreground">Descripcion</p>
                  <p>{departamento.descripcion}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Responsable</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p>{departamento.responsableNombre || 'Sin asignar'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Orden</p>
                  <p>{departamento.orden}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado y Configuracion */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Estado</CardTitle></CardHeader>
              <CardContent>
                <Badge
                  variant={departamento.activo ? 'default' : 'secondary'}
                  className={departamento.activo ? 'bg-green-100 text-green-800' : ''}
                >
                  {departamento.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Apariencia</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border"
                    style={{ backgroundColor: departamento.color || '#3B82F6' }}
                  />
                  <span>{colorInfo?.label || departamento.color}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Fechas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Creado:</span>
                  <span>{new Date(departamento.fechaCreacion).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Modificado:</span>
                  <span>{new Date(departamento.fechaModificacion).toLocaleDateString('es-ES')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminacion</DialogTitle>
              <DialogDescription>
                ¿Esta seguro de eliminar el departamento "{departamento.nombre}"? Esta accion no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
