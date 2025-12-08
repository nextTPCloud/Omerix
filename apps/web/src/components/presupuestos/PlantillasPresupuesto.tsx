'use client';

import { useState, useEffect } from 'react';
import {
  plantillasPresupuestoService,
  IPlantillaPresupuesto,
  ILineaPlantilla,
} from '@/services/plantillas-presupuesto.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Files,
  Save,
  Search,
  Loader2,
  Plus,
  Star,
  Clock,
  Copy,
  Trash2,
  FolderOpen,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================
// DIALOG PARA GUARDAR COMO PLANTILLA
// ============================================

interface GuardarPlantillaDialogProps {
  presupuestoId: string;
  codigoPresupuesto: string;
  trigger?: React.ReactNode;
  onSuccess?: (plantilla: IPlantillaPresupuesto) => void;
}

export function GuardarPlantillaDialog({
  presupuestoId,
  codigoPresupuesto,
  trigger,
  onSuccess,
}: GuardarPlantillaDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    nuevaCategoria: '',
    mantenerPrecios: true,
    mantenerCostes: true,
    esPublica: false,
  });

  useEffect(() => {
    if (open) {
      plantillasPresupuestoService.getCategorias().then((res) => {
        if (res.success && res.data) {
          setCategorias(res.data);
        }
      });
      setFormData(prev => ({
        ...prev,
        nombre: `Plantilla de ${codigoPresupuesto}`,
      }));
    }
  }, [open, codigoPresupuesto]);

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      setLoading(true);
      const response = await plantillasPresupuestoService.crearDesdePresupuesto(
        presupuestoId,
        {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          categoria: formData.nuevaCategoria || formData.categoria,
          mantenerPrecios: formData.mantenerPrecios,
          mantenerCostes: formData.mantenerCostes,
          esPublica: formData.esPublica,
        }
      );

      if (response.success && response.data) {
        toast.success('Plantilla guardada correctamente');
        setOpen(false);
        onSuccess?.(response.data);
      } else {
        toast.error(response.message || 'Error al guardar plantilla');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar plantilla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Files className="h-4 w-4 mr-2" />
            Guardar como plantilla
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Guardar como plantilla
          </DialogTitle>
          <DialogDescription>
            Guarda este presupuesto como plantilla reutilizable
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la plantilla *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre de la plantilla"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la plantilla"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <div className="flex gap-2">
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value, nuevaCategoria: '' })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="O crear nueva..."
                value={formData.nuevaCategoria}
                onChange={(e) => setFormData({ ...formData, nuevaCategoria: e.target.value, categoria: '' })}
                className="flex-1"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="mantenerPrecios" className="text-sm">
                Mantener precios
              </Label>
              <Switch
                id="mantenerPrecios"
                checked={formData.mantenerPrecios}
                onCheckedChange={(checked) => setFormData({ ...formData, mantenerPrecios: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="mantenerCostes" className="text-sm">
                Mantener costes
              </Label>
              <Switch
                id="mantenerCostes"
                checked={formData.mantenerCostes}
                onCheckedChange={(checked) => setFormData({ ...formData, mantenerCostes: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="esPublica" className="text-sm">
                Compartir con otros usuarios
              </Label>
              <Switch
                id="esPublica"
                checked={formData.esPublica}
                onCheckedChange={(checked) => setFormData({ ...formData, esPublica: checked })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DIALOG PARA SELECCIONAR PLANTILLA
// ============================================

interface SeleccionarPlantillaDialogProps {
  trigger?: React.ReactNode;
  onSelect: (plantilla: IPlantillaPresupuesto) => void;
}

export function SeleccionarPlantillaDialog({
  trigger,
  onSelect,
}: SeleccionarPlantillaDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plantillas, setPlantillas] = useState<IPlantillaPresupuesto[]>([]);
  const [masUsadas, setMasUsadas] = useState<IPlantillaPresupuesto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plantillasRes, masUsadasRes, categoriasRes] = await Promise.all([
        plantillasPresupuestoService.getAll({ search, categoria: categoriaFilter }),
        plantillasPresupuestoService.getMasUsadas(5),
        plantillasPresupuestoService.getCategorias(),
      ]);

      if (plantillasRes.success && plantillasRes.data) {
        setPlantillas(plantillasRes.data);
      }
      if (masUsadasRes.success && masUsadasRes.data) {
        setMasUsadas(masUsadasRes.data);
      }
      if (categoriasRes.success && categoriasRes.data) {
        setCategorias(categoriasRes.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, search, categoriaFilter]);

  const handleSelect = async (plantilla: IPlantillaPresupuesto) => {
    try {
      // Registrar uso
      await plantillasPresupuestoService.registrarUso(plantilla._id);

      // Obtener plantilla completa con líneas
      const response = await plantillasPresupuestoService.getById(plantilla._id);
      if (response.success && response.data) {
        onSelect(response.data);
        setOpen(false);
        toast.success(`Plantilla "${plantilla.nombre}" aplicada`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al aplicar plantilla');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Files className="h-4 w-4 mr-2" />
            Usar plantilla
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Files className="h-5 w-5" />
            Seleccionar plantilla
          </DialogTitle>
          <DialogDescription>
            Selecciona una plantilla para aplicar al presupuesto
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar plantilla..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            {/* Plantillas más usadas */}
            {masUsadas.length > 0 && !search && !categoriaFilter && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Más usadas
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {masUsadas.map((plantilla) => (
                    <Card
                      key={plantilla._id}
                      className={cn(
                        'cursor-pointer transition-colors hover:border-primary',
                        selectedId === plantilla._id && 'border-primary bg-primary/5'
                      )}
                      onClick={() => setSelectedId(plantilla._id)}
                      onDoubleClick={() => handleSelect(plantilla)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{plantilla.nombre}</p>
                          <Badge variant="secondary" className="text-xs">
                            {plantilla.vecesUsada}x
                          </Badge>
                        </div>
                        {plantilla.categoria && (
                          <p className="text-xs text-muted-foreground mt-1">{plantilla.categoria}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Todas las plantillas */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {search || categoriaFilter ? 'Resultados' : 'Todas las plantillas'}
              </h4>
              {plantillas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {search || categoriaFilter
                    ? 'No se encontraron plantillas'
                    : 'No hay plantillas guardadas'}
                </div>
              ) : (
                plantillas.map((plantilla) => (
                  <Card
                    key={plantilla._id}
                    className={cn(
                      'cursor-pointer transition-colors hover:border-primary',
                      selectedId === plantilla._id && 'border-primary bg-primary/5'
                    )}
                    onClick={() => setSelectedId(plantilla._id)}
                    onDoubleClick={() => handleSelect(plantilla)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{plantilla.nombre}</p>
                            {plantilla.esPublica && (
                              <Badge variant="outline" className="text-xs">Compartida</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {plantilla.categoria && (
                              <span>{plantilla.categoria}</span>
                            )}
                            <span>{plantilla.lineas.length} líneas</span>
                            {plantilla.ultimoUso && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(plantilla.ultimoUso), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedId === plantilla._id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              const selected = plantillas.find((p) => p._id === selectedId);
              if (selected) handleSelect(selected);
            }}
            disabled={!selectedId}
          >
            Aplicar plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default { GuardarPlantillaDialog, SeleccionarPlantillaDialog };
