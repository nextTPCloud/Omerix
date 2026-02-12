'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
;
import { tarifasService } from '@/services/tarifas.service';
import { CreateTarifaDto } from '@/types/tarifa.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CodeInput } from '@/components/ui/code-input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function NuevaTarifaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateTarifaDto>({
    nombre: '',
    codigo: '',
    descripcion: '',
    tipo: 'fija',
    basePrecio: 'venta',
    porcentajeGeneral: undefined,
    fechaDesde: '',
    fechaHasta: '',
    prioridad: 10,
    activo: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.nombre.trim()) {
        throw new Error('El nombre es obligatorio');
      }

      await tarifasService.create(formData);
      toast.success('Tarifa creada correctamente');
      router.push('/tarifas');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al crear la tarifa');
    } finally {
      setLoading(false);
    }
  };

  return (
    
      <div className="space-y-6 p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="h-8 w-8 text-primary" />
            Nueva Tarifa
          </h1>
          <p className="text-muted-foreground mt-1">
            Define una tarifa de precios para asignar a clientes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informacion Basica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nombre *</Label>
                <Input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Tarifa Distribuidores"
                  required
                />
              </div>

              <div>
                <Label>Codigo</Label>
                <CodeInput
                  value={formData.codigo || ''}
                  onChange={(value) => setFormData({ ...formData, codigo: value })}
                  onSearchCodes={tarifasService.searchCodes}
                  placeholder="Ej: TAR-001"
                  helperText="Pulsa ↓ para sugerir codigo"
                />
              </div>

              <div>
                <Label>Prioridad</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.prioridad || 10}
                  onChange={(e) => setFormData({ ...formData, prioridad: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Menor numero = mayor prioridad
                </p>
              </div>

              <div className="md:col-span-2">
                <Label>Descripcion</Label>
                <Textarea
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripcion opcional de la tarifa"
                  rows={2}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Tipo de Tarifa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value as 'fija' | 'porcentaje' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fija">Precio fijo por producto</SelectItem>
                    <SelectItem value="porcentaje">Descuento % sobre precio base</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo === 'porcentaje' && (
                <>
                  <div>
                    <Label>Base de precio</Label>
                    <Select
                      value={formData.basePrecio || 'venta'}
                      onValueChange={(value) => setFormData({ ...formData, basePrecio: value as 'venta' | 'pvp' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venta">Precio venta</SelectItem>
                        <SelectItem value="pvp">PVP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Descuento general (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={formData.porcentajeGeneral || ''}
                      onChange={(e) => setFormData({ ...formData, porcentajeGeneral: parseFloat(e.target.value) || undefined })}
                      placeholder="Ej: 15"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Descuento aplicado a todos los productos
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Vigencia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Fecha desde</Label>
                <Input
                  type="date"
                  value={formData.fechaDesde || ''}
                  onChange={(e) => setFormData({ ...formData, fechaDesde: e.target.value })}
                />
              </div>

              <div>
                <Label>Fecha hasta</Label>
                <Input
                  type="date"
                  value={formData.fechaHasta || ''}
                  onChange={(e) => setFormData({ ...formData, fechaHasta: e.target.value })}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Estado</h2>
                <p className="text-sm text-muted-foreground">
                  Define si la tarifa esta activa
                </p>
              </div>
              <Switch
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
            </div>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Tarifa'}
            </Button>
          </div>
        </form>
      </div>
    
  );
}
