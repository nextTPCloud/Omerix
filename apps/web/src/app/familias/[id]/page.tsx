'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { familiasService } from '@/services/familias.service';
import { Familia } from '@/types/familia.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FolderTree,
  Tag,
  AlignLeft,
  AlertCircle,
  Package,
  TrendingUp,
  Hash,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface FamiliaEstadisticas {
  totalProductos: number;
  productosActivos: number;
  productosInactivos: number;
  subfamilias: number;
}

export default function FamiliaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [familia, setFamilia] = useState<Familia | null>(null);
  const [estadisticas, setEstadisticas] = useState<FamiliaEstadisticas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFamilia();
      fetchEstadisticas();
    }
  }, [id]);

  const fetchFamilia = async () => {
    try {
      setLoading(true);
      const response = await familiasService.getById(id);
      setFamilia(response.data);
    } catch (err: any) {
      console.error('Error al cargar familia:', err);
      setError(err.response?.data?.message || 'Error al cargar la familia');
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const response = await familiasService.getEstadisticas(id);
      setEstadisticas(response.data);
    } catch (err: any) {
      console.error('Error al cargar estadísticas:', err);
      // No mostramos error aquí, ya que las estadísticas son opcionales
    }
  };

  const handleDelete = async () => {
    try {
      await familiasService.delete(id);
      toast.success('Familia eliminada correctamente');
      router.push('/familias');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar la familia');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando familia...</p>
        </div>
      </div>
    );
  }

  if (error || !familia) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive text-lg mb-4">{error || 'Familia no encontrada'}</p>
          <Button onClick={() => router.push('/familias')}>
            Volver al listado
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FolderTree className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {familia.nombre}
              </h1>
              <div className="flex items-center gap-3">
                {familia.codigo && (
                  <Badge variant="outline" className="font-mono">
                    {familia.codigo}
                  </Badge>
                )}
                <Badge variant={familia.activo ? 'default' : 'secondary'}>
                  {familia.activo ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activa
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactiva
                    </>
                  )}
                </Badge>
                <Badge variant="outline">
                  <Hash className="h-3 w-3 mr-1" />
                  Orden: {familia.orden}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/familias/${id}/editar`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información básica */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Información Básica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {familia.codigo && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Código</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <p className="font-mono font-semibold">{familia.codigo}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Orden</label>
                <div className="mt-1 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <p className="font-semibold">{familia.orden}</p>
                </div>
              </div>

              {familia.familiaPadre && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Familia Padre</label>
                  <div className="mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/familias/${familia.familiaPadre?._id}`)}
                      className="gap-2"
                    >
                      <FolderTree className="h-4 w-4" />
                      {familia.familiaPadre.nombre}
                    </Button>
                  </div>
                </div>
              )}

              {familia.descripcion && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                  <div className="mt-1 flex items-start gap-2">
                    <AlignLeft className="h-4 w-4 text-muted-foreground mt-1" />
                    <p className="text-foreground">{familia.descripcion}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Estadísticas */}
          {estadisticas && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Estadísticas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Productos</p>
                      <p className="text-3xl font-bold text-primary mt-1">
                        {estadisticas.totalProductos}
                      </p>
                    </div>
                    <Package className="h-10 w-10 text-primary/30" />
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Productos Activos</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">
                        {estadisticas.productosActivos}
                      </p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-300" />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Productos Inactivos</p>
                      <p className="text-3xl font-bold text-slate-600 mt-1">
                        {estadisticas.productosInactivos}
                      </p>
                    </div>
                    <XCircle className="h-10 w-10 text-slate-300" />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Subfamilias</p>
                      <p className="text-3xl font-bold text-blue-600 mt-1">
                        {estadisticas.subfamilias}
                      </p>
                    </div>
                    <FolderTree className="h-10 w-10 text-blue-300" />
                  </div>
                </div>
              </div>

              {estadisticas.totalProductos > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/productos?familiaId=${familia._id}`)}
                    className="w-full"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Ver productos de esta familia
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Metadatos */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Información del Sistema</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p className="text-xs font-mono mt-1 break-all">{familia._id}</p>
              </div>

              {familia.createdAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Creado</label>
                  <p className="text-sm mt-1">
                    {new Date(familia.createdAt).toLocaleString('es-ES')}
                  </p>
                </div>
              )}

              {familia.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Última actualización</label>
                  <p className="text-sm mt-1">
                    {new Date(familia.updatedAt).toLocaleString('es-ES')}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Acciones rápidas */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/familias/${id}/editar`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Familia
              </Button>

              {estadisticas && estadisticas.totalProductos > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/productos?familiaId=${familia._id}`)}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Ver Productos ({estadisticas.totalProductos})
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/familias/nuevo?padreId=${familia._id}`)}
              >
                <FolderTree className="h-4 w-4 mr-2" />
                Crear Subfamilia
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Familia
              </Button>
            </div>
          </Card>

          {/* Jerarquía */}
          {(familia.familiaPadre || (estadisticas && estadisticas.subfamilias > 0)) && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-primary" />
                Jerarquía
              </h2>
              <div className="space-y-2">
                {familia.familiaPadre && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Padre</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/familias/${familia.familiaPadre?._id}`)}
                      className="w-full justify-start mt-1"
                    >
                      ↑ {familia.familiaPadre.nombre}
                    </Button>
                  </div>
                )}
                {estadisticas && estadisticas.subfamilias > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Subfamilias</label>
                    <div className="mt-1 p-2 bg-muted rounded text-sm">
                      {estadisticas.subfamilias} subfamilia(s)
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la familia <strong>{familia.nombre}</strong>?
              {estadisticas && estadisticas.totalProductos > 0 && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Esta familia tiene {estadisticas.totalProductos} producto(s) asociado(s).
                  </p>
                </div>
              )}
              {estadisticas && estadisticas.subfamilias > 0 && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Esta familia tiene {estadisticas.subfamilias} subfamilia(s).
                  </p>
                </div>
              )}
              <p className="mt-2">Esta acción no se puede deshacer.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
