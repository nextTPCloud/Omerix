'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import { variantesService, Variante, ValorVariante } from '@/services/variantes.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Edit, Trash2, Palette, RefreshCw, Grid3X3, List, Image, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function VerVariantePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [variante, setVariante] = useState<Variante | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await variantesService.getById(id)
        if (response.success && response.data) {
          setVariante(response.data)
        }
      } catch (error) {
        toast.error('Error al cargar la variante')
        router.push('/variantes')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await variantesService.delete(id)
      toast.success('Variante eliminada correctamente')
      router.push('/variantes')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    } finally {
      setIsDeleting(false)
      setDeleteDialog(false)
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'colores': return <Palette className="h-4 w-4" />
      case 'dropdown': return <List className="h-4 w-4" />
      case 'imagenes': return <Image className="h-4 w-4" />
      default: return <Grid3X3 className="h-4 w-4" />
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'colores': return 'Colores'
      case 'dropdown': return 'Desplegable'
      case 'imagenes': return 'Imágenes'
      default: return 'Botones'
    }
  }

  const getAplicaALabel = (aplicaA: string) => {
    switch (aplicaA) {
      case 'familias': return 'Por familias'
      case 'productos': return 'Productos específicos'
      default: return 'Todos los productos'
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando variante...</p>
          </div>
        </div>
      
    )
  }

  if (!variante) {
    return null
  }

  return (
    
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/variantes"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Palette className="h-7 w-7 text-primary" />
                {variante.nombre}
              </h1>
              <p className="text-sm text-muted-foreground">Detalles de la variante</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/variantes/${id}/editar`}>
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
          <Badge variant={variante.activo ? 'default' : 'secondary'} className={variante.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}>
            {variante.activo ? 'Activa' : 'Inactiva'}
          </Badge>
          {variante.obligatorio && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Obligatoria
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            {getTipoIcon(variante.tipoVisualizacion)}
            {getTipoLabel(variante.tipoVisualizacion)}
          </Badge>
        </div>

        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Código</p>
              <p className="text-base font-mono font-semibold">{variante.codigo || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base font-semibold">{variante.nombre}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="text-base">{variante.descripcion || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Visualización</p>
              <p className="text-base flex items-center gap-2">
                {getTipoIcon(variante.tipoVisualizacion)}
                {getTipoLabel(variante.tipoVisualizacion)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aplica a</p>
              <p className="text-base">{getAplicaALabel(variante.aplicaA || 'todos')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Orden</p>
              <p className="text-base">{variante.orden || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Valores de la Variante</span>
              <Badge variant="secondary">{variante.valores?.length || 0} valores</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {variante.valores && variante.valores.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Valor</TableHead>
                      <TableHead>Código</TableHead>
                      {variante.tipoVisualizacion === 'colores' && <TableHead>Color</TableHead>}
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variante.valores.map((v: ValorVariante) => (
                      <TableRow key={v._id}>
                        <TableCell className="font-medium">{v.valor}</TableCell>
                        <TableCell className="text-muted-foreground font-mono">{v.codigo || '-'}</TableCell>
                        {variante.tipoVisualizacion === 'colores' && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded border shadow-sm" style={{ backgroundColor: v.hexColor || '#ccc' }} />
                              <span className="text-xs text-muted-foreground font-mono">{v.hexColor || '-'}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          {v.activo !== false ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">Esta variante no tiene valores definidos</p>
            )}
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Obligatoria</p>
                <p className="text-sm text-muted-foreground">El cliente debe seleccionar un valor</p>
              </div>
              {variante.obligatorio ? (
                <Badge className="bg-green-100 text-green-800">Sí</Badge>
              ) : (
                <Badge variant="secondary">No</Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Activa</p>
                <p className="text-sm text-muted-foreground">La variante está disponible</p>
              </div>
              {variante.activo ? (
                <Badge className="bg-green-100 text-green-800">Sí</Badge>
              ) : (
                <Badge variant="secondary">No</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog de eliminación */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar la variante "{variante.nombre}"?
                Esta acción no se puede deshacer y afectará a los productos que la utilicen.
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
