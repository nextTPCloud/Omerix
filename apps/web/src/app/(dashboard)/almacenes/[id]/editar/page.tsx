'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
;
import { almacenesService } from '@/services/almacenes.service';
import { Almacen, UpdateAlmacenDTO } from '@/types/almacen.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { useFormValidation, ValidationRule } from '@/hooks/useFormValidation';
import Link from 'next/link';

// Reglas de validacion
const validationRules: ValidationRule[] = [
  { field: 'nombre', label: 'Nombre', required: true, minLength: 2, maxLength: 100 },
  {
    field: 'email',
    label: 'Email',
    pattern: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'El email no tiene un formato valido',
  },
];

interface EditarAlmacenPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditarAlmacenPage({ params }: EditarAlmacenPageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const [almacen, setAlmacen] = useState<Almacen | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { validate, getFieldError, clearFieldError } = useFormValidation<UpdateAlmacenDTO>(validationRules);

  const [formData, setFormData] = useState<UpdateAlmacenDTO>({
    nombre: '',
    descripcion: '',
    direccion: {
      calle: '',
      numero: '',
      codigoPostal: '',
      ciudad: '',
      provincia: '',
      pais: 'Espana',
    },
    esPrincipal: false,
    activo: true,
    capacidadMaxima: undefined,
    unidadCapacidad: 'unidades',
    responsable: '',
    telefono: '',
    email: '',
    usarEnTPV: true,
    notas: '',
  });

  // Cargar almacen
  useEffect(() => {
    loadAlmacen();
  }, [resolvedParams.id]);

  const loadAlmacen = async () => {
    try {
      setIsLoading(true);
      const response = await almacenesService.getById(resolvedParams.id);

      if (response.data) {
        const alm = response.data;
        setAlmacen(alm);
        setFormData({
          nombre: alm.nombre || '',
          descripcion: alm.descripcion || '',
          direccion: alm.direccion || {
            calle: '',
            numero: '',
            codigoPostal: '',
            ciudad: '',
            provincia: '',
            pais: 'Espana',
          },
          esPrincipal: alm.esPrincipal || false,
          activo: alm.activo ?? true,
          capacidadMaxima: alm.capacidadMaxima,
          unidadCapacidad: alm.unidadCapacidad || 'unidades',
          responsable: alm.responsable || '',
          telefono: alm.telefono || '',
          email: alm.email || '',
          usarEnTPV: alm.usarEnTPV ?? true,
          notas: alm.notas || '',
        });
      } else {
        toast.error('No se pudo cargar el almacen');
        router.push('/almacenes');
      }
    } catch (error: any) {
      console.error('Error al cargar almacen:', error);
      toast.error(error.response?.data?.message || 'Error al cargar el almacen');
      router.push('/almacenes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof UpdateAlmacenDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleDireccionChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      direccion: {
        ...prev.direccion!,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate(formData)) {
      return;
    }

    try {
      setIsSaving(true);
      await almacenesService.update(resolvedParams.id, formData);
      toast.success('Almacen actualizado correctamente');
      router.push(`/almacenes/${resolvedParams.id}`);
    } catch (error: any) {
      console.error('Error al actualizar almacen:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar el almacen');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando almacen...</p>
          </div>
        </div>
      
    );
  }

  // Not found
  if (!almacen) {
    return (
      
        <div className="flex flex-col items-center justify-center py-12">
          <Warehouse className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Almacen no encontrado</h2>
          <Button onClick={() => router.push('/almacenes')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Almacenes
          </Button>
        </div>
      
    );
  }

  return (
    
      <div className="w-full max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/almacenes/${almacen._id}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Editar Almacen</h1>
            <Badge variant="outline" className="font-mono">{almacen.codigo}</Badge>
            {almacen.esPrincipal && <Badge>Principal</Badge>}
          </div>
          <p className="text-muted-foreground">
            Modificar datos de <span className="font-medium">{almacen.nombre}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="p-6">
            <div className="space-y-6">
              {/* Informacion basica */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Informacion Basica</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigo">Codigo</Label>
                    <Input
                      id="codigo"
                      value={almacen.codigo}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">El codigo no se puede modificar</p>
                  </div>

                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      placeholder="Ej: Almacen Central"
                      aria-invalid={!!getFieldError('nombre')}
                    />
                    {getFieldError('nombre') && (
                      <p className="text-sm text-destructive mt-1">{getFieldError('nombre')}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="descripcion">Descripcion</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => handleChange('descripcion', e.target.value)}
                      placeholder="Descripcion opcional del almacen"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Direccion */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Direccion</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="calle">Calle</Label>
                    <Input
                      id="calle"
                      value={formData.direccion?.calle || ''}
                      onChange={(e) => handleDireccionChange('calle', e.target.value)}
                      placeholder="Nombre de la calle"
                    />
                  </div>

                  <div>
                    <Label htmlFor="numero">Numero</Label>
                    <Input
                      id="numero"
                      value={formData.direccion?.numero || ''}
                      onChange={(e) => handleDireccionChange('numero', e.target.value)}
                      placeholder="Numero"
                    />
                  </div>

                  <div>
                    <Label htmlFor="codigoPostal">Codigo Postal</Label>
                    <Input
                      id="codigoPostal"
                      value={formData.direccion?.codigoPostal || ''}
                      onChange={(e) => handleDireccionChange('codigoPostal', e.target.value)}
                      placeholder="28001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      value={formData.direccion?.ciudad || ''}
                      onChange={(e) => handleDireccionChange('ciudad', e.target.value)}
                      placeholder="Madrid"
                    />
                  </div>

                  <div>
                    <Label htmlFor="provincia">Provincia</Label>
                    <Input
                      id="provincia"
                      value={formData.direccion?.provincia || ''}
                      onChange={(e) => handleDireccionChange('provincia', e.target.value)}
                      placeholder="Madrid"
                    />
                  </div>
                </div>
              </div>

              {/* Configuracion */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Configuracion</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacidadMaxima">Capacidad Maxima</Label>
                    <Input
                      id="capacidadMaxima"
                      type="number"
                      min="0"
                      value={formData.capacidadMaxima || ''}
                      onChange={(e) => handleChange('capacidadMaxima', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="10000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unidadCapacidad">Unidad de Capacidad</Label>
                    <Select
                      value={formData.unidadCapacidad}
                      onValueChange={(value: any) => handleChange('unidadCapacidad', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidades">Unidades</SelectItem>
                        <SelectItem value="kg">Kilogramos</SelectItem>
                        <SelectItem value="m3">Metros Cubicos</SelectItem>
                        <SelectItem value="litros">Litros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Contacto</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="responsable">Responsable</Label>
                    <Input
                      id="responsable"
                      value={formData.responsable}
                      onChange={(e) => handleChange('responsable', e.target.value)}
                      placeholder="Juan Perez"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefono">Telefono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      placeholder="+34 912 345 678"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="almacen@empresa.com"
                      aria-invalid={!!getFieldError('email')}
                    />
                    {getFieldError('email') && (
                      <p className="text-sm text-destructive mt-1">{getFieldError('email')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Estado</h2>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="activo"
                      checked={formData.activo}
                      onCheckedChange={(checked) => handleChange('activo', checked)}
                    />
                    <Label htmlFor="activo" className="text-sm font-normal cursor-pointer">
                      Activo
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="esPrincipal"
                      checked={formData.esPrincipal}
                      onCheckedChange={(checked) => handleChange('esPrincipal', checked)}
                    />
                    <Label htmlFor="esPrincipal" className="text-sm font-normal cursor-pointer">
                      Establecer como almacen principal
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="usarEnTPV"
                      checked={formData.usarEnTPV}
                      onCheckedChange={(checked) => handleChange('usarEnTPV', checked)}
                    />
                    <Label htmlFor="usarEnTPV" className="text-sm font-normal cursor-pointer">
                      Usar en TPV
                    </Label>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Notas</h2>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => handleChange('notas', e.target.value)}
                  placeholder="Notas adicionales del almacen"
                  rows={4}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    
  );
}
