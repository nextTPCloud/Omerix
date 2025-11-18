'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { almacenesService } from '@/services/almacenes.service';
import { Almacen } from '@/types/almacen.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Warehouse,
  MapPin,
  User,
  Phone,
  Mail,
  Star,
  PackageCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export default function VerAlmacenPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [almacen, setAlmacen] = useState<Almacen | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAlmacen();
    }
  }, [id]);

  const fetchAlmacen = async () => {
    try {
      setIsLoading(true);
      const response = await almacenesService.getById(id);
      setAlmacen(response.data);
    } catch (error: any) {
      console.error('Error al cargar almacén:', error);
      toast.error('Error al cargar el almacén');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!almacen) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <Warehouse className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Almacén no encontrado</h2>
          <Button onClick={() => router.push('/almacenes')} className="mt-4">
            Volver a almacenes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{almacen.nombre}</h1>
                {almacen.esPrincipal && (
                  <Badge variant="default" className="gap-1">
                    <Star className="h-3 w-3" />
                    Principal
                  </Badge>
                )}
                <Badge variant={almacen.activo ? 'default' : 'secondary'}>
                  {almacen.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="text-muted-foreground font-mono">{almacen.codigo}</p>
            </div>

            <Button onClick={() => router.push(`/almacenes/${id}/editar`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Descripción */}
        {almacen.descripcion && (
          <Card className="p-6">
            <p className="text-muted-foreground">{almacen.descripcion}</p>
          </Card>
        )}

        {/* Grid de información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información General */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Warehouse className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Información General</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Código</p>
                <p className="font-mono font-semibold">{almacen.codigo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{almacen.nombre}</p>
              </div>
              {almacen.capacidadMaxima && (
                <div>
                  <p className="text-sm text-muted-foreground">Capacidad Máxima</p>
                  <p className="font-medium">
                    {almacen.capacidadMaxima.toLocaleString()} {almacen.unidadCapacidad}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Dirección */}
          {almacen.direccion && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Dirección</h2>
              </div>
              <div className="space-y-1">
                <p>{almacen.direccion.calle} {almacen.direccion.numero}</p>
                <p>{almacen.direccion.codigoPostal} {almacen.direccion.ciudad}</p>
                <p>{almacen.direccion.provincia}, {almacen.direccion.pais}</p>
              </div>
            </Card>
          )}

          {/* Contacto */}
          {(almacen.responsable || almacen.telefono || almacen.email) && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Contacto</h2>
              </div>
              <div className="space-y-3">
                {almacen.responsable && (
                  <div>
                    <p className="text-sm text-muted-foreground">Responsable</p>
                    <p className="font-medium">{almacen.responsable}</p>
                  </div>
                )}
                {almacen.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p>{almacen.telefono}</p>
                  </div>
                )}
                {almacen.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${almacen.email}`} className="text-primary hover:underline">
                      {almacen.email}
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Configuración */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <PackageCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Configuración</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Almacén Principal</span>
                <Badge variant={almacen.esPrincipal ? 'default' : 'outline'}>
                  {almacen.esPrincipal ? 'Sí' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usar en TPV</span>
                <Badge variant={almacen.usarEnTPV ? 'default' : 'outline'}>
                  {almacen.usarEnTPV ? 'Sí' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant={almacen.activo ? 'default' : 'secondary'}>
                  {almacen.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Notas */}
        {almacen.notas && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Notas</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{almacen.notas}</p>
          </Card>
        )}

        {/* Metadata */}
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Creado</p>
              <p className="font-medium">
                {new Date(almacen.createdAt).toLocaleString('es-ES')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Última actualización</p>
              <p className="font-medium">
                {new Date(almacen.updatedAt).toLocaleString('es-ES')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
