'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
;
import { tarifasService } from '@/services/tarifas.service';
import { ITarifa, UpdateTarifaDto, IPrecioTarifa } from '@/types/tarifa.types';
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
import { ArrowLeft, Save, Tag, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { TarifaPreciosEditor } from '@/components/tarifas/TarifaPreciosEditor';

export default function EditarTarifaPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tarifa, setTarifa] = useState<ITarifa | null>(null);
  const [precios, setPrecios] = useState<IPrecioTarifa[]>([]);

  const [formData, setFormData] = useState<UpdateTarifaDto>({
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
        setPrecios(response.data.precios || []);
        setFormData({
          nombre: response.data.nombre,
          codigo: response.data.codigo,
          descripcion: response.data.descripcion || '',
          tipo: response.data.tipo,
          basePrecio: response.data.basePrecio,
          porcentajeGeneral: response.data.porcentajeGeneral,
          fechaDesde: response.data.fechaDesde ? response.data.fechaDesde.split('T')[0] : '',
          fechaHasta: response.data.fechaHasta ? response.data.fechaHasta.split('T')[0] : '',
          prioridad: response.data.prioridad,
          activo: response.data.activo,
        });
      }
    } catch (error) {
      toast.error('Error al cargar la tarifa');
      router.push('/tarifas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!formData.nombre?.trim()) {
        throw new Error('El nombre es obligatorio');
      }

      await tarifasService.update(id as string, formData);
      toast.success('Tarifa actualizada correctamente');
      router.push(`/tarifas/${id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al actualizar la tarifa');
    } finally {
      setSaving(false);
    }
  };

  // Funciones para gestionar precios
  const handleAddPrecio = useCallback(async (precio: { productoId: string; precio?: number; descuentoPorcentaje?: number }) => {
    try {
      const response = await tarifasService.addOrUpdatePrecio(id as string, precio);
      if (response.success) {
        setPrecios(response.data.precios || []);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al añadir producto');
    }
  }, [id]);

  const handleRemovePrecio = useCallback(async (productoId: string, varianteId?: string) => {
    try {
      const response = await tarifasService.deletePrecio(id as string, productoId, varianteId);
      if (response.success) {
        setPrecios(response.data.precios || []);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar producto');
    }
  }, [id]);

  const handleUpdatePrecio = useCallback(async (precio: { productoId: string; precio?: number; descuentoPorcentaje?: number }) => {
    try {
      const response = await tarifasService.addOrUpdatePrecio(id as string, precio);
      if (response.success) {
        setPrecios(response.data.precios || []);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar precio');
    }
  }, [id]);

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
    
      <div className="space-y-6 p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="h-8 w-8 text-primary" />
            Editar Tarifa
          </h1>
          <p className="text-muted-foreground mt-1">
            Modifica la tarifa {tarifa.nombre}
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
                  value={formData.nombre || ''}
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
                  value={formData.tipo || 'fija'}
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

        </form>

        {/* Seccion de precios por producto */}
        <TarifaPreciosEditor
          tarifaId={id as string}
          tipoTarifa={formData.tipo || 'fija'}
          precios={precios}
          onAddPrecio={handleAddPrecio}
          onRemovePrecio={handleRemovePrecio}
          onUpdatePrecio={handleUpdatePrecio}
        />

        {/* Botones de accion al final */}
        <div className="flex gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    
  );
}
