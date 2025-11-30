'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { familiasService } from '@/services/familias.service';
import { productosService } from '@/services/productos.service';
import { Familia } from '@/types/familia.types';
import { Producto } from '@/types/producto.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Eye,
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
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
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

  const fetchProductos = async () => {
    try {
      setLoadingProductos(true);
      const response = await productosService.getAll({
        familiaId: id,
        limit: 1000,
      });
      setProductos(response.data || []);
    } catch (err: any) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoadingProductos(false);
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando familia...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !familia) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive text-lg mb-4">{error || 'Familia no encontrada'}</p>
            <Button onClick={() => router.push('/familias')}>
              Volver al listado
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
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

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="tpv" onClick={() => productos.length === 0 && fetchProductos()}>
            TPV y Productos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
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
    </TabsContent>

    <TabsContent value="tpv" className="mt-6">
      <div className="space-y-6">
        {/* Configuración TPV */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Configuración TPV</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Usar en TPV</label>
              <div className="mt-1">
                <Badge variant={familia.usarEnTPV ? 'default' : 'secondary'}>
                  {familia.usarEnTPV ? 'Sí' : 'No'}
                </Badge>
              </div>
            </div>

            {familia.posicionTPV !== undefined && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Posición en TPV</label>
                <div className="mt-1">
                  <p className="font-semibold">{familia.posicionTPV}</p>
                </div>
              </div>
            )}

            {familia.descripcionAbreviada && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Descripción Abreviada (TPV)</label>
                <p className="mt-1">{familia.descripcionAbreviada}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">Obligatorio (Lavanderías)</label>
              <div className="mt-1">
                <Badge variant={familia.obligatorio ? 'default' : 'secondary'}>
                  {familia.obligatorio ? 'Sí' : 'No'}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Renting</label>
              <div className="mt-1">
                <Badge variant={familia.renting ? 'default' : 'secondary'}>
                  {familia.renting ? 'Sí' : 'No'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Productos de la familia */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Productos de esta Familia ({productos.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/productos?familiaId=${familia._id}`)}
            >
              Ver todos en Productos
            </Button>
          </div>

          {loadingProductos ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Cargando productos...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-20" />
              <p className="text-muted-foreground">No hay productos en esta familia</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-sm text-muted-foreground">
                    <th className="text-left py-2 px-2">SKU</th>
                    <th className="text-left py-2 px-2">Nombre</th>
                    <th className="text-right py-2 px-2">Precio Venta</th>
                    <th className="text-right py-2 px-2">Stock</th>
                    <th className="text-center py-2 px-2">Estado</th>
                    <th className="text-right py-2 px-2">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {productos.map((producto) => (
                    <tr key={producto._id} className="hover:bg-muted/50">
                      <td className="py-2 px-2">
                        <span className="font-mono text-sm">{producto.sku}</span>
                      </td>
                      <td className="py-2 px-2">
                        <span className="font-medium">{producto.nombre}</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className="font-semibold">{producto.precios?.venta?.toFixed(2) || '0.00'} €</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={producto.stock.cantidad <= producto.stock.minimo ? 'text-destructive font-semibold' : ''}>
                          {producto.stock.cantidad}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Badge variant={producto.activo ? 'default' : 'secondary'} className="text-xs">
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/productos/${producto._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </TabsContent>
  </Tabs>

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
    </DashboardLayout>
  );
}
