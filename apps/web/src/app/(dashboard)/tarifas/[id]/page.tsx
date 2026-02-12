'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
;
import { tarifasService } from '@/services/tarifas.service';
import { ITarifa } from '@/types/tarifa.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Tag,
  CheckCircle,
  XCircle,
  DollarSign,
  Percent,
  Calendar,
  Copy,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePermissions } from '@/hooks/usePermissions';

export default function TarifaDetallePage() {
  const router = useRouter();
  const { id } = useParams();
  const { canUpdate, canDelete } = usePermissions();
  const [tarifa, setTarifa] = useState<ITarifa | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTarifa();
    }
  }, [id]);

  const fetchTarifa = async () => {
    try {
      setLoading(true);
      const response = await tarifasService.getById(id as string);
      if (response.success) {
        setTarifa(response.data);
      }
    } catch (error) {
      toast.error('Error al cargar la tarifa');
      router.push('/tarifas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await tarifasService.delete(id as string);
      toast.success('Tarifa eliminada correctamente');
      router.push('/tarifas');
    } catch (error) {
      toast.error('Error al eliminar la tarifa');
    }
  };

  const handleDuplicar = async () => {
    try {
      const response = await tarifasService.duplicar(id as string);
      if (response.success) {
        toast.success('Tarifa duplicada correctamente');
        router.push(`/tarifas/${response.data._id}/editar`);
      }
    } catch (error) {
      toast.error('Error al duplicar la tarifa');
    }
  };

  const handleToggleActivo = async () => {
    if (!tarifa) return;
    try {
      await tarifasService.changeStatus(tarifa._id, !tarifa.activo);
      toast.success(tarifa.activo ? 'Tarifa desactivada' : 'Tarifa activada');
      fetchTarifa();
    } catch (error) {
      toast.error('Error al cambiar el estado');
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      
    );
  }

  if (!tarifa) {
    return null;
  }

  return (
      <>
      <div className="space-y-6 p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Tag className="h-8 w-8 text-primary" />
                {tarifa.nombre}
              </h1>
              <p className="text-muted-foreground mt-1">
                Codigo: {tarifa.codigo}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDuplicar}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </Button>
              {canUpdate('tarifas') && (
                <Button onClick={() => router.push(`/tarifas/${id}/editar`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informacion General</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Codigo:</span>
                <span className="font-medium">{tarifa.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium">{tarifa.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge variant="outline" className="gap-1">
                  {tarifa.tipo === 'fija' ? (
                    <>
                      <DollarSign className="h-3 w-3" />
                      Precio fijo
                    </>
                  ) : (
                    <>
                      <Percent className="h-3 w-3" />
                      Porcentaje ({tarifa.porcentajeGeneral}%)
                    </>
                  )}
                </Badge>
              </div>
              {tarifa.tipo === 'porcentaje' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base precio:</span>
                  <span className="font-medium capitalize">{tarifa.basePrecio}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prioridad:</span>
                <span className="font-medium">{tarifa.prioridad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                {tarifa.activo ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activa
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactiva
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Vigencia</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Desde:
                </span>
                <span className="font-medium">{formatDate(tarifa.fechaDesde)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Hasta:
                </span>
                <span className="font-medium">{formatDate(tarifa.fechaHasta)}</span>
              </div>
            </div>
          </Card>

          {tarifa.descripcion && (
            <Card className="p-6 md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Descripcion</h2>
              <p className="text-muted-foreground">{tarifa.descripcion}</p>
            </Card>
          )}

          <Card className="p-6 md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Precios por Producto</h2>
            {tarifa.precios && tarifa.precios.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Producto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">SKU</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Precio</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Descuento</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tarifa.precios.map((precio, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">{precio.productoNombre || precio.productoId}</td>
                        <td className="px-4 py-2 text-muted-foreground">{precio.productoSku || '-'}</td>
                        <td className="px-4 py-2 text-right">{precio.precio ? `${precio.precio.toFixed(2)} EUR` : '-'}</td>
                        <td className="px-4 py-2 text-right">{precio.descuentoPorcentaje ? `${precio.descuentoPorcentaje}%` : '-'}</td>
                        <td className="px-4 py-2 text-center">
                          {precio.activo ? (
                            <Badge variant="default" className="bg-green-500">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No hay precios especificos configurados
              </p>
            )}
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Acciones</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleToggleActivo}>
              {tarifa.activo ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Desactivar
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activar
                </>
              )}
            </Button>
            {canDelete('tarifas') && (
              <Button variant="destructive" onClick={() => setDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Tarifa</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que quieres eliminar la tarifa "{tarifa.nombre}"?
              Esta accion no se puede deshacer.
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
      </>
  );
}
