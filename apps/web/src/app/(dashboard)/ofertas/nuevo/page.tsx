'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
;
import { ofertasService } from '@/services/ofertas.service';
import { CreateOfertaDto, TipoOferta, TipoOfertaLabels } from '@/types/oferta.types';
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
import { ArrowLeft, Save, Gift, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function NuevaOfertaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateOfertaDto>({
    nombre: '',
    codigo: '',
    descripcion: '',
    tipo: TipoOferta.DESCUENTO_PORCENTAJE,
    configuracion: {},
    fechaDesde: new Date().toISOString().split('T')[0],
    fechaHasta: '',
    aplicaATodos: true,
    aplicaATodosClientes: true,
    acumulable: false,
    prioridad: 10,
    activo: true,
    etiqueta: '',
    color: '#3b82f6',
    horaDesde: '',
    horaHasta: '',
    diasSemana: [],
    esHappyHour: false,
  });

  const DIAS_SEMANA = [
    { value: 1, label: 'L' },
    { value: 2, label: 'M' },
    { value: 3, label: 'X' },
    { value: 4, label: 'J' },
    { value: 5, label: 'V' },
    { value: 6, label: 'S' },
    { value: 0, label: 'D' },
  ];

  const toggleDia = (dia: number) => {
    const dias = formData.diasSemana || [];
    const nuevos = dias.includes(dia) ? dias.filter(d => d !== dia) : [...dias, dia];
    setFormData({ ...formData, diasSemana: nuevos });
  };

  const tieneRestriccionHoraria = !!(formData.horaDesde || formData.horaHasta || (formData.diasSemana && formData.diasSemana.length > 0) || formData.esHappyHour);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.nombre.trim()) {
        throw new Error('El nombre es obligatorio');
      }
      if (!formData.fechaDesde) {
        throw new Error('La fecha de inicio es obligatoria');
      }

      await ofertasService.create(formData);
      toast.success('Oferta creada correctamente');
      router.push('/ofertas');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al crear la oferta');
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguracion = (key: string, value: any) => {
    setFormData({
      ...formData,
      configuracion: {
        ...formData.configuracion,
        [key]: value,
      },
    });
  };

  const renderConfiguracionPorTipo = () => {
    switch (formData.tipo) {
      case TipoOferta.NXM:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Cantidad que compra</Label>
              <Input
                type="number"
                min={1}
                value={formData.configuracion.cantidadCompra || ''}
                onChange={(e) => updateConfiguracion('cantidadCompra', parseInt(e.target.value))}
                placeholder="Ej: 2 (paga 2)"
              />
            </div>
            <div>
              <Label>Cantidad que lleva</Label>
              <Input
                type="number"
                min={1}
                value={formData.configuracion.cantidadLleva || ''}
                onChange={(e) => updateConfiguracion('cantidadLleva', parseInt(e.target.value))}
                placeholder="Ej: 3 (lleva 3)"
              />
            </div>
            <p className="text-sm text-muted-foreground md:col-span-2">
              Ejemplo: Si compra 2 y lleva 3 → Promocion 3x2
            </p>
          </div>
        );

      case TipoOferta.SEGUNDA_UNIDAD:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Descuento 2a unidad (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.configuracion.descuentoSegundaUnidad || ''}
                onChange={(e) => updateConfiguracion('descuentoSegundaUnidad', parseFloat(e.target.value))}
                placeholder="Ej: 50"
              />
            </div>
            <div>
              <Label>Descuento 3a unidad (%) - Opcional</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.configuracion.descuentoTerceraUnidad || ''}
                onChange={(e) => updateConfiguracion('descuentoTerceraUnidad', parseFloat(e.target.value))}
                placeholder="Ej: 70"
              />
            </div>
          </div>
        );

      case TipoOferta.UNIDAD_GRATIS:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Cantidad para conseguir gratis</Label>
              <Input
                type="number"
                min={1}
                value={formData.configuracion.cantidadParaGratis || ''}
                onChange={(e) => updateConfiguracion('cantidadParaGratis', parseInt(e.target.value))}
                placeholder="Ej: 5"
              />
            </div>
            <div>
              <Label>Unidades gratis</Label>
              <Input
                type="number"
                min={1}
                value={formData.configuracion.unidadesGratis || ''}
                onChange={(e) => updateConfiguracion('unidadesGratis', parseInt(e.target.value))}
                placeholder="Ej: 1"
              />
            </div>
            <p className="text-sm text-muted-foreground md:col-span-2">
              Ejemplo: Compra 5 y lleva 1 gratis
            </p>
          </div>
        );

      case TipoOferta.DESCUENTO_PORCENTAJE:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Descuento (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={formData.configuracion.descuento || ''}
                onChange={(e) => updateConfiguracion('descuento', parseFloat(e.target.value))}
                placeholder="Ej: 20"
              />
            </div>
            <div>
              <Label>Cantidad minima</Label>
              <Input
                type="number"
                min={1}
                value={formData.configuracion.cantidadMinima || ''}
                onChange={(e) => updateConfiguracion('cantidadMinima', parseInt(e.target.value))}
                placeholder="Opcional"
              />
            </div>
          </div>
        );

      case TipoOferta.DESCUENTO_IMPORTE:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Descuento (EUR)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={formData.configuracion.descuento || ''}
                onChange={(e) => updateConfiguracion('descuento', parseFloat(e.target.value))}
                placeholder="Ej: 5.00"
              />
            </div>
            <div>
              <Label>Importe minimo</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={formData.configuracion.importeMinimo || ''}
                onChange={(e) => updateConfiguracion('importeMinimo', parseFloat(e.target.value))}
                placeholder="Opcional"
              />
            </div>
          </div>
        );

      case TipoOferta.PRECIO_ESPECIAL:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Precio especial (EUR)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={formData.configuracion.precioEspecial || ''}
                onChange={(e) => updateConfiguracion('precioEspecial', parseFloat(e.target.value))}
                placeholder="Ej: 9.99"
              />
            </div>
          </div>
        );

      case TipoOferta.ESCALADO:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Define tramos de cantidad con descuentos progresivos
            </p>
            {/* TODO: Implementar editor de escalas */}
            <p className="text-xs text-muted-foreground">
              La edicion de escalas estara disponible proximamente
            </p>
          </div>
        );

      default:
        return null;
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
            <Gift className="h-8 w-8 text-primary" />
            Nueva Oferta
          </h1>
          <p className="text-muted-foreground mt-1">
            Crea una promocion o descuento especial
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
                  placeholder="Ej: Promocion 3x2 Verano"
                  required
                />
              </div>

              <div>
                <Label>Codigo</Label>
                <CodeInput
                  value={formData.codigo || ''}
                  onChange={(value) => setFormData({ ...formData, codigo: value })}
                  onSearchCodes={ofertasService.searchCodes}
                  placeholder="Ej: PROMO-001"
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
              </div>

              <div className="md:col-span-2">
                <Label>Descripcion</Label>
                <Textarea
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripcion de la oferta"
                  rows={2}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Tipo de Oferta</h2>
            <div className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoOferta, configuracion: {} })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TipoOfertaLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-medium mb-3">Configuracion</h3>
                {renderConfiguracionPorTipo()}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Vigencia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Fecha desde *</Label>
                <Input
                  type="date"
                  value={formData.fechaDesde || ''}
                  onChange={(e) => setFormData({ ...formData, fechaDesde: e.target.value })}
                  required
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Restricción Horaria
              </h2>
              <Switch
                checked={tieneRestriccionHoraria}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    setFormData({ ...formData, horaDesde: '', horaHasta: '', diasSemana: [], esHappyHour: false });
                  }
                }}
              />
            </div>
            {tieneRestriccionHoraria && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Hora desde</Label>
                    <Input
                      type="time"
                      value={formData.horaDesde || ''}
                      onChange={(e) => setFormData({ ...formData, horaDesde: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Hora hasta</Label>
                    <Input
                      type="time"
                      value={formData.horaHasta || ''}
                      onChange={(e) => setFormData({ ...formData, horaHasta: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Días de la semana</Label>
                  <div className="flex gap-2 mt-2">
                    {DIAS_SEMANA.map(dia => (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => toggleDia(dia.value)}
                        className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${
                          (formData.diasSemana || []).includes(dia.value)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {dia.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deja vacío para que aplique todos los días
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marcar como Happy Hour</Label>
                    <p className="text-sm text-muted-foreground">Se destacará visualmente en el TPV</p>
                  </div>
                  <Switch
                    checked={formData.esHappyHour || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, esHappyHour: checked })}
                  />
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Etiqueta Visual</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Etiqueta</Label>
                <Input
                  type="text"
                  maxLength={20}
                  value={formData.etiqueta || ''}
                  onChange={(e) => setFormData({ ...formData, etiqueta: e.target.value })}
                  placeholder="Ej: 3x2, -20%"
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color || '#3b82f6'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={formData.color || '#3b82f6'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Opciones</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Aplica a todos los productos</Label>
                  <p className="text-sm text-muted-foreground">Si no, deberas seleccionar productos especificos</p>
                </div>
                <Switch
                  checked={formData.aplicaATodos}
                  onCheckedChange={(checked) => setFormData({ ...formData, aplicaATodos: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Aplica a todos los clientes</Label>
                  <p className="text-sm text-muted-foreground">Si no, deberas seleccionar clientes especificos</p>
                </div>
                <Switch
                  checked={formData.aplicaATodosClientes}
                  onCheckedChange={(checked) => setFormData({ ...formData, aplicaATodosClientes: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Acumulable</Label>
                  <p className="text-sm text-muted-foreground">Puede combinarse con otras ofertas</p>
                </div>
                <Switch
                  checked={formData.acumulable}
                  onCheckedChange={(checked) => setFormData({ ...formData, acumulable: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Activa</Label>
                  <p className="text-sm text-muted-foreground">La oferta esta disponible</p>
                </div>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Oferta'}
            </Button>
          </div>
        </form>
      </div>
    
  );
}
