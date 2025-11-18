'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { tiposImpuestoService } from '@/services/tipos-impuesto.service';
import { CreateTipoImpuestoDTO, TipoImpuestoTipo } from '@/types/tipo-impuesto.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NuevoTipoImpuestoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CreateTipoImpuestoDTO>({
    codigo: '',
    nombre: '',
    descripcion: '',
    porcentaje: 21,
    tipo: 'IVA',
    recargoEquivalencia: false,
    porcentajeRecargo: 0,
    activo: true,
    predeterminado: false,
  });

  const handleChange = (field: keyof CreateTipoImpuestoDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.codigo || !formData.nombre) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      setIsLoading(true);
      await tiposImpuestoService.create(formData);
      toast.success('Tipo de impuesto creado correctamente');
      router.push('/tipos-impuesto');
    } catch (error: any) {
      console.error('Error al crear tipo de impuesto:', error);
      toast.error(error.response?.data?.message || 'Error al crear el tipo de impuesto');
    } finally {
      setIsLoading(false);
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

          <h1 className="text-3xl font-bold text-foreground">Nuevo Tipo de Impuesto</h1>
          <p className="text-muted-foreground">
            Crea un nuevo tipo de impuesto para tu empresa
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
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
                      placeholder="Ej: IVA21"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      placeholder="Ej: IVA General"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => handleChange('descripcion', e.target.value)}
                      placeholder="Descripción opcional del tipo de impuesto"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Configuración del impuesto */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Configuración del Impuesto</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de Impuesto</Label>
                    <Select value={formData.tipo} onValueChange={(value: TipoImpuestoTipo) => handleChange('tipo', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IVA">IVA</SelectItem>
                        <SelectItem value="IGIC">IGIC</SelectItem>
                        <SelectItem value="IPSI">IPSI</SelectItem>
                        <SelectItem value="OTRO">OTRO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="porcentaje">Porcentaje *</Label>
                    <Input
                      id="porcentaje"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.porcentaje}
                      onChange={(e) => handleChange('porcentaje', parseFloat(e.target.value))}
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recargoEquivalencia"
                      checked={formData.recargoEquivalencia}
                      onCheckedChange={(checked) => handleChange('recargoEquivalencia', checked)}
                    />
                    <Label htmlFor="recargoEquivalencia" className="text-sm font-normal cursor-pointer">
                      Recargo de Equivalencia
                    </Label>
                  </div>

                  {formData.recargoEquivalencia && (
                    <div>
                      <Label htmlFor="porcentajeRecargo">Porcentaje Recargo</Label>
                      <Input
                        id="porcentajeRecargo"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.porcentajeRecargo || 0}
                        onChange={(e) => handleChange('porcentajeRecargo', parseFloat(e.target.value))}
                      />
                    </div>
                  )}
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
                      id="predeterminado"
                      checked={formData.predeterminado}
                      onCheckedChange={(checked) => handleChange('predeterminado', checked)}
                    />
                    <Label htmlFor="predeterminado" className="text-sm font-normal cursor-pointer">
                      Establecer como predeterminado
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Guardando...' : 'Crear Tipo de Impuesto'}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
