'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { productosService } from '@/services/productos.service';
import { Producto } from '@/types/producto.types';
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
  Package,
  Barcode,
  Tag,
  Euro,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  FolderTree,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProductoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProducto();
    }
  }, [id]);

  const fetchProducto = async () => {
    try {
      setLoading(true);
      const response = await productosService.getById(id);
      setProducto(response.data);
    } catch (err: any) {
      console.error('Error al cargar producto:', err);
      setError(err.response?.data?.message || 'Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await productosService.delete(id);
      toast.success('Producto eliminado correctamente');
      router.push('/productos');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar el producto');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando producto...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !producto) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive text-lg mb-4">{error || 'Producto no encontrado'}</p>
            <Button onClick={() => router.push('/productos')}>
              Volver al listado
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stockBajo = producto.stock.cantidad <= producto.stock.minimo;
  const margen = producto.precio.venta > 0
    ? ((producto.precio.venta - producto.precio.base) / producto.precio.venta * 100).toFixed(2)
    : '0.00';

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
              <Package className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {producto.nombre}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant={producto.activo ? 'default' : 'secondary'}>
                  {producto.activo ? 'Activo' : 'Inactivo'}
                </Badge>
                <Badge variant={producto.visible ? 'default' : 'outline'}>
                  {producto.visible ? (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Oculto
                    </>
                  )}
                </Badge>
                {stockBajo && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Stock bajo
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/productos/${id}/editar`)}
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
              <div>
                <label className="text-sm font-medium text-muted-foreground">SKU</label>
                <div className="mt-1 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <p className="font-mono font-semibold">{producto.sku}</p>
                </div>
              </div>

              {producto.codigoBarras && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Código de Barras</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Barcode className="h-4 w-4 text-muted-foreground" />
                    <p className="font-mono">{producto.codigoBarras}</p>
                  </div>
                </div>
              )}

              {producto.familia && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Familia</label>
                  <div className="mt-1 flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{producto.familia.nombre}</p>
                  </div>
                </div>
              )}

              {producto.descripcion && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                  <p className="mt-1 text-foreground">{producto.descripcion}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Precios */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Euro className="h-5 w-5 text-primary" />
              Precios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Precio Base</label>
                <p className="text-2xl font-bold mt-1">
                  {producto.precio.base.toFixed(2)} €
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Precio Venta</label>
                <p className="text-2xl font-bold text-primary mt-1">
                  {producto.precio.venta.toFixed(2)} €
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Margen</label>
                <div className="flex items-center gap-2 mt-1">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">
                    {margen}%
                  </p>
                </div>
              </div>
            </div>

            {producto.precio.moneda && (
              <div className="mt-4 pt-4 border-t">
                <label className="text-sm font-medium text-muted-foreground">Moneda</label>
                <p className="mt-1 font-semibold">{producto.precio.moneda}</p>
              </div>
            )}
          </Card>

          {/* Stock */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Inventario
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cantidad Actual</label>
                <div className="flex items-center gap-2 mt-1">
                  {stockBajo ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  <p className={`text-2xl font-bold ${stockBajo ? 'text-destructive' : 'text-foreground'}`}>
                    {producto.stock.cantidad}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Stock Mínimo</label>
                <p className="text-2xl font-bold mt-1">
                  {producto.stock.minimo}
                </p>
              </div>

              {producto.stock.maximo > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stock Máximo</label>
                  <p className="text-2xl font-bold mt-1">
                    {producto.stock.maximo}
                  </p>
                </div>
              )}
            </div>

            {stockBajo && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  El stock actual está por debajo del mínimo recomendado
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Metadatos */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Información del Sistema</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p className="text-xs font-mono mt-1 break-all">{producto._id}</p>
              </div>

              {producto.createdAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Creado</label>
                  <p className="text-sm mt-1">
                    {new Date(producto.createdAt).toLocaleString('es-ES')}
                  </p>
                </div>
              )}

              {producto.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Última actualización</label>
                  <p className="text-sm mt-1">
                    {new Date(producto.updatedAt).toLocaleString('es-ES')}
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
                onClick={() => router.push(`/productos/${id}/editar`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Producto
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Producto
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto <strong>{producto.nombre}</strong>?
              Esta acción no se puede deshacer.
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
