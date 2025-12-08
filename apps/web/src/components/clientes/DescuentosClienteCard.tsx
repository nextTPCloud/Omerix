'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Percent,
  Plus,
  Trash2,
  Save,
  Loader2,
  Package,
  Edit2,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { clientesService } from '@/services/clientes.service';
import { familiasService } from '@/services/familias.service';

interface DescuentoFamilia {
  familiaId: string;
  nombreFamilia?: string;
  descuento: number;
}

interface DescuentosClienteCardProps {
  clienteId: string;
  descuentoGeneralInicial?: number;
  onUpdate?: () => void;
}

interface Familia {
  _id: string;
  nombre: string;
  codigo?: string;
}

export function DescuentosClienteCard({
  clienteId,
  descuentoGeneralInicial = 0,
  onUpdate,
}: DescuentosClienteCardProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Estado de descuentos
  const [descuentoGeneral, setDescuentoGeneral] = useState(descuentoGeneralInicial);
  const [aplicarDescuentoAutomatico, setAplicarDescuentoAutomatico] = useState(true);
  const [descuentosPorFamilia, setDescuentosPorFamilia] = useState<DescuentoFamilia[]>([]);

  // Familias disponibles
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loadingFamilias, setLoadingFamilias] = useState(false);

  // Nuevo descuento
  const [nuevaFamiliaId, setNuevaFamiliaId] = useState('');
  const [nuevoDescuento, setNuevoDescuento] = useState(0);

  useEffect(() => {
    cargarDescuentos();
  }, [clienteId]);

  const cargarDescuentos = async () => {
    try {
      setLoading(true);
      const response = await clientesService.getDescuentos(clienteId);
      if (response.success) {
        setDescuentoGeneral(response.data.descuentoGeneral);
        setAplicarDescuentoAutomatico(response.data.aplicarDescuentoAutomatico);
        setDescuentosPorFamilia(response.data.descuentosPorFamilia || []);
      }
    } catch (error) {
      console.error('Error al cargar descuentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarFamilias = async () => {
    try {
      setLoadingFamilias(true);
      const response = await familiasService.getAll({ limit: 100, activo: true });
      if (response.success && response.data) {
        setFamilias(response.data);
      }
    } catch (error) {
      console.error('Error al cargar familias:', error);
    } finally {
      setLoadingFamilias(false);
    }
  };

  const handleOpenDialog = () => {
    if (familias.length === 0) {
      cargarFamilias();
    }
    setDialogOpen(true);
  };

  const handleAgregarDescuento = () => {
    if (!nuevaFamiliaId) {
      toast.error('Selecciona una familia');
      return;
    }
    if (nuevoDescuento < 0 || nuevoDescuento > 100) {
      toast.error('El descuento debe estar entre 0 y 100');
      return;
    }
    if (descuentosPorFamilia.some(d => d.familiaId === nuevaFamiliaId)) {
      toast.error('Esta familia ya tiene un descuento configurado');
      return;
    }

    const familia = familias.find(f => f._id === nuevaFamiliaId);
    setDescuentosPorFamilia([
      ...descuentosPorFamilia,
      {
        familiaId: nuevaFamiliaId,
        nombreFamilia: familia?.nombre,
        descuento: nuevoDescuento,
      },
    ]);

    setNuevaFamiliaId('');
    setNuevoDescuento(0);
  };

  const handleEliminarDescuento = (familiaId: string) => {
    setDescuentosPorFamilia(descuentosPorFamilia.filter(d => d.familiaId !== familiaId));
  };

  const handleGuardar = async () => {
    try {
      setSaving(true);
      const response = await clientesService.actualizarDescuentos(clienteId, {
        descuentoGeneral,
        aplicarDescuentoAutomatico,
        descuentosPorFamilia,
      });

      if (response.success) {
        toast.success('Descuentos guardados correctamente');
        setDialogOpen(false);
        onUpdate?.();
      } else {
        toast.error(response.message || 'Error al guardar descuentos');
      }
    } catch (error) {
      console.error('Error al guardar descuentos:', error);
      toast.error('Error al guardar los descuentos');
    } finally {
      setSaving(false);
    }
  };

  // Familias disponibles (no asignadas aún)
  const familiasDisponibles = familias.filter(
    f => !descuentosPorFamilia.some(d => d.familiaId === f._id)
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Descuentos Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Descuentos Automáticos
              </CardTitle>
              <CardDescription>
                Descuentos que se aplican automáticamente en presupuestos
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenDialog}>
              <Settings2 className="mr-2 h-4 w-4" />
              Configurar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado del descuento automático */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Descuentos automáticos</p>
              <p className="text-xs text-muted-foreground">
                {aplicarDescuentoAutomatico
                  ? 'Se aplican automáticamente en nuevos presupuestos'
                  : 'Desactivados - se aplican solo manualmente'}
              </p>
            </div>
            <Badge variant={aplicarDescuentoAutomatico ? 'default' : 'secondary'}>
              {aplicarDescuentoAutomatico ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>

          {/* Descuento general */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Descuento general</p>
              <p className="text-xs text-muted-foreground">Aplica a todos los productos</p>
            </div>
            <Badge variant="outline" className="text-lg font-bold">
              {descuentoGeneral}%
            </Badge>
          </div>

          {/* Descuentos por familia */}
          {descuentosPorFamilia.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Descuentos por familia</p>
                <div className="space-y-2">
                  {descuentosPorFamilia.map((desc) => (
                    <div
                      key={desc.familiaId}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{desc.nombreFamilia || 'Familia'}</span>
                      </div>
                      <Badge variant="secondary">{desc.descuento}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {descuentosPorFamilia.length === 0 && descuentoGeneral === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay descuentos configurados para este cliente
            </p>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de configuración */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Configurar Descuentos
            </DialogTitle>
            <DialogDescription>
              Configura los descuentos automáticos que se aplicarán en presupuestos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Switch de activación */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Aplicar automáticamente</Label>
                <p className="text-xs text-muted-foreground">
                  Aplica descuentos al crear nuevos presupuestos
                </p>
              </div>
              <Switch
                checked={aplicarDescuentoAutomatico}
                onCheckedChange={setAplicarDescuentoAutomatico}
              />
            </div>

            <Separator />

            {/* Descuento general */}
            <div className="space-y-2">
              <Label>Descuento general (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={descuentoGeneral}
                onChange={(e) => setDescuentoGeneral(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Se aplica a todos los productos que no tengan un descuento específico por familia
              </p>
            </div>

            <Separator />

            {/* Descuentos por familia */}
            <div className="space-y-3">
              <Label>Descuentos por familia de productos</Label>

              {/* Lista de descuentos actuales */}
              {descuentosPorFamilia.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {descuentosPorFamilia.map((desc) => (
                    <div
                      key={desc.familiaId}
                      className="flex items-center justify-between p-2 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{desc.nombreFamilia}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{desc.descuento}%</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleEliminarDescuento(desc.familiaId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Añadir nuevo descuento */}
              <div className="flex gap-2">
                <Select value={nuevaFamiliaId} onValueChange={setNuevaFamiliaId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar familia..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingFamilias ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : familiasDisponibles.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        No hay más familias disponibles
                      </div>
                    ) : (
                      familiasDisponibles.map((familia) => (
                        <SelectItem key={familia._id} value={familia._id}>
                          {familia.codigo && `[${familia.codigo}] `}
                          {familia.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  placeholder="%"
                  className="w-20"
                  value={nuevoDescuento || ''}
                  onChange={(e) => setNuevoDescuento(parseFloat(e.target.value) || 0)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAgregarDescuento}
                  disabled={!nuevaFamiliaId}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Los descuentos por familia tienen prioridad sobre el descuento general
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DescuentosClienteCard;
