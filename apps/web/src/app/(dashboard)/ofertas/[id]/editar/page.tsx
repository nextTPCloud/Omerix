'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
;
import { ofertasService } from '@/services/ofertas.service';
import { IOferta, UpdateOfertaDto, TipoOferta, TipoOfertaLabels } from '@/types/oferta.types';
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
import { ArrowLeft, Save, Gift, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { OfertaProductosEditor } from '@/components/ofertas/OfertaProductosEditor';

export default function EditarOfertaPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [oferta, setOferta] = useState<IOferta | null>(null);

  // Estado para productos y familias
  const [productosIncluidos, setProductosIncluidos] = useState<string[]>([]);
  const [productosExcluidos, setProductosExcluidos] = useState<string[]>([]);
  const [familiasIncluidas, setFamiliasIncluidas] = useState<string[]>([]);
  const [familiasExcluidas, setFamiliasExcluidas] = useState<string[]>([]);

  const [formData, setFormData] = useState<UpdateOfertaDto>({
    nombre: '',
    codigo: '',
    descripcion: '',
    tipo: TipoOferta.DESCUENTO_PORCENTAJE,
    configuracion: {},
    fechaDesde: '',
    fechaHasta: '',
    aplicaATodos: true,
    aplicaATodosClientes: true,
    acumulable: false,
    prioridad: 10,
    activo: true,
    etiqueta: '',
    color: '#3b82f6',
  });

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
        setFormData({
          nombre: response.data.nombre,
          codigo: response.data.codigo,
          descripcion: response.data.descripcion || '',
          tipo: response.data.tipo,
          configuracion: response.data.configuracion,
          fechaDesde: response.data.fechaDesde ? response.data.fechaDesde.split('T')[0] : '',
          fechaHasta: response.data.fechaHasta ? response.data.fechaHasta.split('T')[0] : '',
          aplicaATodos: response.data.aplicaATodos,
          aplicaATodosClientes: response.data.aplicaATodosClientes,
          acumulable: response.data.acumulable,
          prioridad: response.data.prioridad,
          activo: response.data.activo,
          etiqueta: response.data.etiqueta || '',
          color: response.data.color || '#3b82f6',
          horaDesde: response.data.horaDesde || '',
          horaHasta: response.data.horaHasta || '',
          diasSemana: response.data.diasSemana || [],
          esHappyHour: response.data.esHappyHour || false,
        });
        // Cargar productos y familias
        setProductosIncluidos(response.data.productosIncluidos?.map((p: any) => typeof p === 'string' ? p : p._id) || []);
        setProductosExcluidos(response.data.productosExcluidos?.map((p: any) => typeof p === 'string' ? p : p._id) || []);
        setFamiliasIncluidas(response.data.familiasIncluidas?.map((f: any) => typeof f === 'string' ? f : f._id) || []);
        setFamiliasExcluidas(response.data.familiasExcluidas?.map((f: any) => typeof f === 'string' ? f : f._id) || []);
      }
    } catch (error) {
      toast.error('Error al cargar la oferta');
      router.push('/ofertas');
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

      // Incluir productos y familias en la actualizacion
      const updateData = {
        ...formData,
        productosIncluidos,
        productosExcluidos,
        familiasIncluidas,
        familiasExcluidas,
      };

      await ofertasService.update(id as string, updateData);
      toast.success('Oferta actualizada correctamente');
      router.push(`/ofertas/${id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al actualizar la oferta');
    } finally {
      setSaving(false);
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
                value={formData.configuracion?.cantidadCompra || ''}
                onChange={(e) => updateConfiguracion('cantidadCompra', parseInt(e.target.value))}
                placeholder="Ej: 2"
              />
            </div>
            <div>
              <Label>Cantidad que lleva</Label>
              <Input
                type="number"
                min={1}
                value={formData.configuracion?.cantidadLleva || ''}
                onChange={(e) => updateConfiguracion('cantidadLleva', parseInt(e.target.value))}
                placeholder="Ej: 3"
              />
            </div>
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
                value={formData.configuracion?.descuentoSegundaUnidad || ''}
                onChange={(e) => updateConfiguracion('descuentoSegundaUnidad', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Descuento 3a unidad (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.configuracion?.descuentoTerceraUnidad || ''}
                onChange={(e) => updateConfiguracion('descuentoTerceraUnidad', parseFloat(e.target.value))}
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
                value={formData.configuracion?.cantidadParaGratis || ''}
                onChange={(e) => updateConfiguracion('cantidadParaGratis', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label>Unidades gratis</Label>
              <Input
                type="number"
                min={1}
                value={formData.configuracion?.unidadesGratis || ''}
                onChange={(e) => updateConfiguracion('unidadesGratis', parseInt(e.target.value))}
              />
            </div>
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
                value={formData.configuracion?.descuento || ''}
                onChange={(e) => updateConfiguracion('descuento', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Cantidad minima</Label>
              <Input
                type="number"
                min={1}
                value={formData.configuracion?.cantidadMinima || ''}
                onChange={(e) => updateConfiguracion('cantidadMinima', parseInt(e.target.value))}
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
                value={formData.configuracion?.descuento || ''}
                onChange={(e) => updateConfiguracion('descuento', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Importe minimo</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={formData.configuracion?.importeMinimo || ''}
                onChange={(e) => updateConfiguracion('importeMinimo', parseFloat(e.target.value))}
              />
            </div>
          </div>
        );

      case TipoOferta.PRECIO_ESPECIAL:
        return (
          <div>
            <Label>Precio especial (EUR)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={formData.configuracion?.precioEspecial || ''}
              onChange={(e) => updateConfiguracion('precioEspecial', parseFloat(e.target.value))}
            />
          </div>
        );

      default:
        return null;
    }
  };

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
    
      <div className="space-y-6 p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" />
            Editar Oferta
          </h1>
          <p className="text-muted-foreground mt-1">
            Modifica la oferta {oferta.nombre}
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
                  onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoOferta })}
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
                </div>
                <Switch
                  checked={formData.aplicaATodos}
                  onCheckedChange={(checked) => setFormData({ ...formData, aplicaATodos: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Aplica a todos los clientes</Label>
                </div>
                <Switch
                  checked={formData.aplicaATodosClientes}
                  onCheckedChange={(checked) => setFormData({ ...formData, aplicaATodosClientes: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Acumulable</Label>
                </div>
                <Switch
                  checked={formData.acumulable}
                  onCheckedChange={(checked) => setFormData({ ...formData, acumulable: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Activa</Label>
                </div>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
            </div>
          </Card>

        </form>

        {/* Editor de productos y familias */}
        <OfertaProductosEditor
          aplicaATodos={formData.aplicaATodos ?? true}
          productosIncluidos={productosIncluidos}
          productosExcluidos={productosExcluidos}
          familiasIncluidas={familiasIncluidas}
          familiasExcluidas={familiasExcluidas}
          onUpdate={(data) => {
            if (data.productosIncluidos !== undefined) setProductosIncluidos(data.productosIncluidos);
            if (data.productosExcluidos !== undefined) setProductosExcluidos(data.productosExcluidos);
            if (data.familiasIncluidas !== undefined) setFamiliasIncluidas(data.familiasIncluidas);
            if (data.familiasExcluidas !== undefined) setFamiliasExcluidas(data.familiasExcluidas);
          }}
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
