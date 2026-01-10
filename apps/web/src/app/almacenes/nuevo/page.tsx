'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { almacenesService } from '@/services/almacenes.service';
import { CreateAlmacenDTO } from '@/types/almacen.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CodeInput } from '@/components/ui/code-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { useFormValidation, ValidationRule } from '@/hooks/useFormValidation';

// Reglas de validación para el formulario
const validationRules: ValidationRule[] = [
  { field: 'codigo', label: 'Código', required: true, minLength: 2, maxLength: 20 },
  { field: 'nombre', label: 'Nombre', required: true, minLength: 2, maxLength: 100 },
  {
    field: 'email',
    label: 'Email',
    pattern: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'El email no tiene un formato válido',
  },
];

export default function NuevoAlmacenPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { validate, getFieldError, clearFieldError } = useFormValidation<CreateAlmacenDTO>(validationRules);

  const [formData, setFormData] = useState<CreateAlmacenDTO>({
    codigo: '',
    nombre: '',
    descripcion: '',
    direccion: {
      calle: '',
      numero: '',
      codigoPostal: '',
      ciudad: '',
      provincia: '',
      pais: 'España',
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

  const handleChange = (field: keyof CreateAlmacenDTO, value: any) => {
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

    // Validar formulario con mensajes bonitos
    if (!validate(formData)) {
      return;
    }

    try {
      setIsLoading(true);
      await almacenesService.create(formData);
      toast.success('Almacén creado correctamente');
      router.push('/almacenes');
    } catch (error: any) {
      console.error('Error al crear almacén:', error);
      toast.error(error.response?.data?.message || 'Error al crear el almacén');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para buscar códigos existentes
  const handleSearchCodigos = async (prefix: string): Promise<string[]> => {
    try {
      return await almacenesService.searchCodigos(prefix);
    } catch {
      return [];
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <h1 className="text-3xl font-bold text-foreground">Nuevo Almacén</h1>
          <p className="text-muted-foreground">
            Crea un nuevo almacén para tu empresa
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="p-6">
            <div className="space-y-6">
              {/* Información básica */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Información Básica</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <CodeInput
                      id="codigo"
                      value={formData.codigo}
                      onChange={(value) => handleChange('codigo', value)}
                      onSearchCodes={handleSearchCodigos}
                      placeholder="Ej: ALM001"
                      error={getFieldError('codigo')}
                      helperText="Pulsa ↓ para sugerir siguiente código"
                    />
                  </div>

                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      placeholder="Ej: Almacén Central"
                      aria-invalid={!!getFieldError('nombre')}
                    />
                    {getFieldError('nombre') && (
                      <p className="text-sm text-destructive mt-1">{getFieldError('nombre')}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => handleChange('descripcion', e.target.value)}
                      placeholder="Descripción opcional del almacén"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Dirección
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="direccion">Buscar dirección</Label>
                    <AddressAutocomplete
                      defaultValue={formData.direccion?.calle || ''}
                      onAddressSelect={(address) => {
                        setFormData((prev) => ({
                          ...prev,
                          direccion: {
                            ...prev.direccion,
                            calle: address.calle || '',
                            numero: address.numero || '',
                            codigoPostal: address.codigoPostal || '',
                            ciudad: address.ciudad || '',
                            provincia: address.provincia || '',
                            pais: address.pais || 'España',
                          },
                        }));
                      }}
                      placeholder="Buscar dirección en OpenStreetMap..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Escribe para buscar o completa los campos manualmente
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.direccion?.numero}
                      onChange={(e) => handleDireccionChange('numero', e.target.value)}
                      placeholder="Número"
                    />
                  </div>

                  <div>
                    <Label htmlFor="codigoPostal">Código Postal</Label>
                    <Input
                      id="codigoPostal"
                      value={formData.direccion?.codigoPostal}
                      onChange={(e) => handleDireccionChange('codigoPostal', e.target.value)}
                      placeholder="28001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      value={formData.direccion?.ciudad}
                      onChange={(e) => handleDireccionChange('ciudad', e.target.value)}
                      placeholder="Madrid"
                    />
                  </div>

                  <div>
                    <Label htmlFor="provincia">Provincia</Label>
                    <Input
                      id="provincia"
                      value={formData.direccion?.provincia}
                      onChange={(e) => handleDireccionChange('provincia', e.target.value)}
                      placeholder="Madrid"
                    />
                  </div>
                </div>
              </div>

              {/* Configuración */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Configuración</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacidadMaxima">Capacidad Máxima</Label>
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
                        <SelectItem value="m3">Metros Cúbicos</SelectItem>
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
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
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
                      Establecer como almacén principal
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
                  placeholder="Notas adicionales del almacén"
                  rows={4}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Guardando...' : 'Crear Almacén'}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
