'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
;
import { ofertasService } from '@/services/ofertas.service';
import { IOferta, TipoOferta, TipoOfertaLabels } from '@/types/oferta.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Gift,
  CheckCircle,
  XCircle,
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

export default function OfertaDetallePage() {
  const router = useRouter();
  const { id } = useParams();
  const { canUpdate, canDelete } = usePermissions();
  const [oferta, setOferta] = useState<IOferta | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOferta();
    }
  }, [id]);

  const fetchOferta = async () => {
    try {
      setLoading(true);
      const response = await ofertasService.getById(id as string);
      if (response.success) {
        setOferta(response.data);
      }
    } catch (error) {
      toast.error('Error al cargar la oferta');
      router.push('/ofertas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await ofertasService.delete(id as string);
      toast.success('Oferta eliminada correctamente');
      router.push('/ofertas');
    } catch (error) {
      toast.error('Error al eliminar la oferta');
    }
  };

  const handleDuplicar = async () => {
    try {
      const response = await ofertasService.duplicar(id as string);
      if (response.success) {
        toast.success('Oferta duplicada correctamente');
        router.push(`/ofertas/${response.data._id}/editar`);
      }
    } catch (error) {
      toast.error('Error al duplicar la oferta');
    }
  };

  const handleToggleActivo = async () => {
    if (!oferta) return;
    try {
      await ofertasService.changeStatus(oferta._id, !oferta.activo);
      toast.success(oferta.activo ? 'Oferta desactivada' : 'Oferta activada');
      fetchOferta();
    } catch (error) {
      toast.error('Error al cambiar el estado');
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES');
  };

  const getConfiguracionDescripcion = () => {
    if (!oferta) return '';
    const cfg = oferta.configuracion;

    switch (oferta.tipo) {
      case TipoOferta.NXM:
        return `Paga ${cfg.cantidadCompra} y lleva ${cfg.cantidadLleva}`;
      case TipoOferta.SEGUNDA_UNIDAD:
        return `2a unidad al ${cfg.descuentoSegundaUnidad}%${cfg.descuentoTerceraUnidad ? `, 3a al ${cfg.descuentoTerceraUnidad}%` : ''}`;
      case TipoOferta.UNIDAD_GRATIS:
        return `Compra ${cfg.cantidadParaGratis} y lleva ${cfg.unidadesGratis} gratis`;
      case TipoOferta.DESCUENTO_PORCENTAJE:
        return `${cfg.descuento}% de descuento${cfg.cantidadMinima ? ` (min. ${cfg.cantidadMinima} uds)` : ''}`;
      case TipoOferta.DESCUENTO_IMPORTE:
        return `${cfg.descuento}EUR de descuento${cfg.importeMinimo ? ` (min. ${cfg.importeMinimo}EUR)` : ''}`;
      case TipoOferta.PRECIO_ESPECIAL:
        return `Precio especial: ${cfg.precioEspecial}EUR`;
      case TipoOferta.ESCALADO:
        return `Descuento progresivo por cantidad`;
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      
    );
  }

  if (!oferta) {
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
                <Gift className="h-8 w-8 text-primary" />
                {oferta.nombre}
              </h1>
              <p className="text-muted-foreground mt-1">
                Codigo: {oferta.codigo}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDuplicar}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </Button>
              {canUpdate('ofertas') && (
                <Button onClick={() => router.push(`/ofertas/${id}/editar`)}>
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
                <span className="font-medium">{oferta.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium">{oferta.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge variant="outline">{TipoOfertaLabels[oferta.tipo]}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prioridad:</span>
                <span className="font-medium">{oferta.prioridad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                {oferta.activo ? (
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
            <h2 className="text-lg font-semibold mb-4">Configuracion</h2>
            <div className="space-y-3">
              <div>
                <span className="text-muted-foreground">Descripcion:</span>
                <p className="font-medium mt-1">{getConfiguracionDescripcion()}</p>
              </div>
              {oferta.etiqueta && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Etiqueta:</span>
                  <Badge style={{ backgroundColor: oferta.color || '#3b82f6' }} className="text-white">
                    {oferta.etiqueta}
                  </Badge>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acumulable:</span>
                <span className="font-medium">{oferta.acumulable ? 'Si' : 'No'}</span>
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
                <span className="font-medium">{formatDate(oferta.fechaDesde)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Hasta:
                </span>
                <span className="font-medium">{formatDate(oferta.fechaHasta)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Uso</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usos actuales:</span>
                <span className="font-medium">{oferta.usosActuales}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usos maximos:</span>
                <span className="font-medium">{oferta.usosMaximos || 'Sin limite'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usos por cliente:</span>
                <span className="font-medium">{oferta.usosPorCliente || 'Sin limite'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Aplicacion</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aplica a todos los productos:</span>
                <span className="font-medium">{oferta.aplicaATodos ? 'Si' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aplica a todos los clientes:</span>
                <span className="font-medium">{oferta.aplicaATodosClientes ? 'Si' : 'No'}</span>
              </div>
            </div>
          </Card>

          {oferta.descripcion && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Descripcion</h2>
              <p className="text-muted-foreground">{oferta.descripcion}</p>
            </Card>
          )}
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Acciones</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleToggleActivo}>
              {oferta.activo ? (
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
            {canDelete('ofertas') && (
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
            <DialogTitle>Eliminar Oferta</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que quieres eliminar la oferta "{oferta.nombre}"?
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
