'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { gruposModificadoresService, GrupoModificadores } from '@/services/modificadores.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Edit, Trash2, Grid3X3, RefreshCw, FileText, Settings, List } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function VerGrupoModificadoresPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [grupo, setGrupo] = useState<GrupoModificadores | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await gruposModificadoresService.getById(id)
        if (response.success && response.data) {
          setGrupo(response.data)
        }
      } catch (error) {
        toast.error('Error al cargar el grupo')
        router.push('/grupos-modificadores')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await gruposModificadoresService.delete(id)
      toast.success('Grupo eliminado correctamente')
      router.push('/grupos-modificadores')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    } finally {
      setIsDeleting(false)
      setDeleteDialog(false)
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      exclusivo: 'Exclusivo (solo uno)',
      multiple: 'Múltiple (varios)',
    }
    return labels[tipo] || tipo
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando grupo...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!grupo) return null

  return (
    <DashboardLayout>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/grupos-modificadores"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Grid3X3 className="h-7 w-7 text-primary" />
                {grupo.nombre}
              </h1>
              <p className="text-sm text-muted-foreground">Detalles del grupo de modificadores</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/grupos-modificadores/${id}/editar`}>
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
          <Badge variant={grupo.activo ? 'default' : 'secondary'} className={grupo.activo ? 'bg-green-100 text-green-800' : ''}>
            {grupo.activo ? 'Activo' : 'Inactivo'}
          </Badge>
          <Badge variant="outline">
            {getTipoLabel(grupo.tipo)}
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {grupo.modificadores?.length || 0} modificadores
          </Badge>
        </div>

        {/* Información General */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Información General</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Código</p>
              <p className="text-base font-mono font-semibold">{grupo.codigo || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base font-semibold">{grupo.nombre}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="text-base">{grupo.descripcion || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Selección</p>
              <p className="text-base">{getTipoLabel(grupo.tipo)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Orden</p>
              <p className="text-base">{grupo.orden}</p>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Selección */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Configuración de Selección</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Mínimo de selecciones</p>
                <p className="text-2xl font-bold">{grupo.minSelecciones}</p>
                <p className="text-xs text-muted-foreground mt-1">{grupo.minSelecciones === 0 ? 'Opcional' : 'Obligatorio'}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Máximo de selecciones</p>
                <p className="text-2xl font-bold">{grupo.maxSelecciones || 'Sin límite'}</p>
                <p className="text-xs text-muted-foreground mt-1">{grupo.tipo === 'exclusivo' ? 'Solo 1' : grupo.maxSelecciones ? '' : 'Ilimitado'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modificadores del Grupo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Modificadores del Grupo
              <Badge variant="outline" className="ml-auto">
                {grupo.modificadores?.length || 0} modificadores
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grupo.modificadores && grupo.modificadores.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Precio Extra</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupo.modificadores.map((modificador) => (
                      <TableRow key={modificador._id}>
                        <TableCell className="font-medium">{modificador.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {modificador.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {modificador.precioExtra > 0 ? (
                            <span className="text-green-600 font-medium">+{modificador.precioExtra.toFixed(2)} €</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={modificador.activo ? 'default' : 'secondary'} className="text-xs">
                            {modificador.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Grid3X3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No hay modificadores en este grupo</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de eliminación */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar el grupo "{grupo.nombre}"?
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
