'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  FileText,
  Search,
  Loader2,
  Plus,
  Check,
  Import,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import presupuestosService from '@/services/presupuestos.service';
import { productosService } from '@/services/productos.service';

interface ImportarLineasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presupuestoId: string;
  onImportado: () => void;
}

interface Producto {
  _id: string;
  nombre: string;
  sku?: string;
  descripcion?: string;
  precios?: {
    pvp?: number;
    coste?: number;
  };
  iva?: number;
  tipo?: string;
}

interface PresupuestoResumen {
  _id: string;
  codigo: string;
  clienteNombre: string;
  fecha: string | Date;
  estado: string;
  totales?: {
    totalPresupuesto?: number;
  };
  lineas?: Array<{
    nombre: string;
    cantidad: number;
    precioUnitario: number;
  }>;
}

export function ImportarLineasDialog({
  open,
  onOpenChange,
  presupuestoId,
  onImportado,
}: ImportarLineasDialogProps) {
  const [tab, setTab] = useState<'productos' | 'presupuesto'>('productos');
  const [loading, setLoading] = useState(false);
  const [importando, setImportando] = useState(false);

  // Productos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [searchProductos, setSearchProductos] = useState('');
  const [productosSeleccionados, setProductosSeleccionados] = useState<string[]>([]);

  // Presupuestos
  const [presupuestos, setPresupuestos] = useState<PresupuestoResumen[]>([]);
  const [searchPresupuestos, setSearchPresupuestos] = useState('');
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<string | null>(null);

  // Opciones
  const [opciones, setOpciones] = useState({
    incluirPrecios: true,
    incluirCostes: true,
    incluirDescuentos: true,
    multiplicador: 1,
  });

  useEffect(() => {
    if (open && tab === 'productos') {
      buscarProductos();
    }
    if (open && tab === 'presupuesto') {
      buscarPresupuestos();
    }
  }, [open, tab]);

  const buscarProductos = async () => {
    try {
      setLoading(true);
      const response = await productosService.getAll({
        q: searchProductos,
        activo: true,
        limit: 50,
      });
      if (response.success && response.data) {
        setProductos(response.data);
      }
    } catch (error) {
      console.error('Error al buscar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarPresupuestos = async () => {
    try {
      setLoading(true);
      const response = await presupuestosService.getAll({
        search: searchPresupuestos,
        limit: 20,
      });
      if (response.success && response.data) {
        // Filtrar el presupuesto actual
        setPresupuestos(response.data.filter(p => p._id !== presupuestoId));
      }
    } catch (error) {
      console.error('Error al buscar presupuestos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchProductos = (e: React.FormEvent) => {
    e.preventDefault();
    buscarProductos();
  };

  const handleSearchPresupuestos = (e: React.FormEvent) => {
    e.preventDefault();
    buscarPresupuestos();
  };

  const toggleProducto = (id: string) => {
    setProductosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleImportar = async () => {
    try {
      setImportando(true);

      let params: any = {
        incluirPrecios: opciones.incluirPrecios,
        incluirCostes: opciones.incluirCostes,
        incluirDescuentos: opciones.incluirDescuentos,
        multiplicador: opciones.multiplicador,
      };

      if (tab === 'productos') {
        if (productosSeleccionados.length === 0) {
          toast.error('Selecciona al menos un producto');
          return;
        }
        params.origen = 'productos';
        params.productosIds = productosSeleccionados;
      } else {
        if (!presupuestoSeleccionado) {
          toast.error('Selecciona un presupuesto');
          return;
        }
        params.origen = 'presupuesto';
        params.documentoId = presupuestoSeleccionado;
      }

      const response = await presupuestosService.importarLineas(presupuestoId, params);

      if (response.success) {
        toast.success(
          `${tab === 'productos' ? productosSeleccionados.length : 'Líneas'} importadas correctamente`
        );
        onImportado();
        onOpenChange(false);
        // Resetear estado
        setProductosSeleccionados([]);
        setPresupuestoSeleccionado(null);
      } else {
        toast.error(response.message || 'Error al importar líneas');
      }
    } catch (error) {
      console.error('Error al importar:', error);
      toast.error('Error al importar líneas');
    } finally {
      setImportando(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Import className="h-5 w-5" />
            Importar líneas
          </DialogTitle>
          <DialogDescription>
            Importa líneas desde productos del catálogo o desde otros presupuestos
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="productos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="presupuesto" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Otro presupuesto
            </TabsTrigger>
          </TabsList>

          {/* Tab de Productos */}
          <TabsContent value="productos" className="space-y-4">
            <form onSubmit={handleSearchProductos} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchProductos}
                  onChange={(e) => setSearchProductos(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button type="submit" variant="secondary" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
              </Button>
            </form>

            {productosSeleccionados.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">
                  {productosSeleccionados.length} seleccionados
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProductosSeleccionados([])}
                >
                  Limpiar
                </Button>
              </div>
            )}

            <ScrollArea className="h-[300px] border rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : productos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Package className="h-8 w-8 mb-2" />
                  <p>No se encontraron productos</p>
                </div>
              ) : (
                <div className="divide-y">
                  {productos.map((producto) => (
                    <div
                      key={producto._id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 ${
                        productosSeleccionados.includes(producto._id)
                          ? 'bg-primary/10'
                          : ''
                      }`}
                      onClick={() => toggleProducto(producto._id)}
                    >
                      <Checkbox
                        checked={productosSeleccionados.includes(producto._id)}
                        onCheckedChange={() => toggleProducto(producto._id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{producto.nombre}</p>
                          {producto.sku && (
                            <Badge variant="outline" className="text-xs">
                              {producto.sku}
                            </Badge>
                          )}
                        </div>
                        {producto.descripcion && (
                          <p className="text-xs text-muted-foreground truncate">
                            {producto.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(producto.precios?.pvp || 0)}
                        </p>
                        {producto.precios?.coste && (
                          <p className="text-xs text-muted-foreground">
                            Coste: {formatCurrency(producto.precios.coste)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tab de Presupuesto */}
          <TabsContent value="presupuesto" className="space-y-4">
            <form onSubmit={handleSearchPresupuestos} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar presupuestos por código o cliente..."
                  value={searchPresupuestos}
                  onChange={(e) => setSearchPresupuestos(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button type="submit" variant="secondary" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
              </Button>
            </form>

            <ScrollArea className="h-[300px] border rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : presupuestos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2" />
                  <p>No se encontraron presupuestos</p>
                </div>
              ) : (
                <div className="divide-y">
                  {presupuestos.map((p) => (
                    <div
                      key={p._id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 ${
                        presupuestoSeleccionado === p._id ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => setPresupuestoSeleccionado(p._id)}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          presupuestoSeleccionado === p._id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {presupuestoSeleccionado === p._id && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{p.codigo}</p>
                          <Badge variant="outline" className="text-xs">
                            {p.estado}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {p.clienteNombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(p.fecha)} · {p.lineas?.length || 0} líneas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(p.totales?.totalPresupuesto || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Opciones de importación */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Opciones de importación</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="incluirPrecios">Incluir precios</Label>
              <Switch
                id="incluirPrecios"
                checked={opciones.incluirPrecios}
                onCheckedChange={(checked) =>
                  setOpciones((prev) => ({ ...prev, incluirPrecios: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="incluirCostes">Incluir costes</Label>
              <Switch
                id="incluirCostes"
                checked={opciones.incluirCostes}
                onCheckedChange={(checked) =>
                  setOpciones((prev) => ({ ...prev, incluirCostes: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="incluirDescuentos">Incluir descuentos</Label>
              <Switch
                id="incluirDescuentos"
                checked={opciones.incluirDescuentos}
                onCheckedChange={(checked) =>
                  setOpciones((prev) => ({ ...prev, incluirDescuentos: checked }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="multiplicador" className="shrink-0">
                Multiplicador
              </Label>
              <Input
                id="multiplicador"
                type="number"
                min="0.1"
                step="0.1"
                value={opciones.multiplicador}
                onChange={(e) =>
                  setOpciones((prev) => ({
                    ...prev,
                    multiplicador: parseFloat(e.target.value) || 1,
                  }))
                }
                className="w-20"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImportar}
            disabled={
              importando ||
              (tab === 'productos' && productosSeleccionados.length === 0) ||
              (tab === 'presupuesto' && !presupuestoSeleccionado)
            }
          >
            {importando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Importar {tab === 'productos' && productosSeleccionados.length > 0
                  ? `(${productosSeleccionados.length})`
                  : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ImportarLineasDialog;
