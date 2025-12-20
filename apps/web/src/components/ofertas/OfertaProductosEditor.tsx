'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Trash2,
  Package,
  Folder,
  X,
  Check,
  Ban,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { productosService } from '@/services/productos.service';
import { familiasService } from '@/services/familias.service';
import { Producto } from '@/types/producto.types';
import { Familia } from '@/types/familia.types';

interface ProductoInfo {
  _id: string;
  nombre: string;
  sku?: string;
}

interface FamiliaInfo {
  _id: string;
  nombre: string;
}

interface OfertaProductosEditorProps {
  aplicaATodos: boolean;
  productosIncluidos: string[];
  productosExcluidos: string[];
  familiasIncluidas: string[];
  familiasExcluidas: string[];
  onUpdate: (data: {
    productosIncluidos?: string[];
    productosExcluidos?: string[];
    familiasIncluidas?: string[];
    familiasExcluidas?: string[];
  }) => void;
}

// Producto con estado de selección para inserción masiva
interface ProductoSeleccionable extends Producto {
  seleccionado: boolean;
}

export function OfertaProductosEditor({
  aplicaATodos,
  productosIncluidos,
  productosExcluidos,
  familiasIncluidas,
  familiasExcluidas,
  onUpdate,
}: OfertaProductosEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'incluir' | 'excluir'>('incluir');
  const [dialogType, setDialogType] = useState<'producto' | 'familia' | 'productosPorFamilia'>('producto');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFamilia, setSelectedFamilia] = useState<string>('');
  const [familiaProductos, setFamiliaProductos] = useState<ProductoSeleccionable[]>([]);

  // Info cargada de productos y familias seleccionados
  const [productosInfo, setProductosInfo] = useState<Map<string, ProductoInfo>>(new Map());
  const [familiasInfo, setFamiliasInfo] = useState<Map<string, FamiliaInfo>>(new Map());

  // Cargar info de productos y familias al montar
  useEffect(() => {
    loadFamilias();
    loadProductosInfo();
  }, [productosIncluidos, productosExcluidos]);

  useEffect(() => {
    loadFamiliasInfo();
  }, [familiasIncluidas, familiasExcluidas]);

  const loadFamilias = async () => {
    try {
      const response = await familiasService.getAll({ activo: true, limit: 100 });
      if (response.success) {
        setFamilias(response.data || []);
      }
    } catch (error) {
      console.error('Error al cargar familias:', error);
    }
  };

  const loadProductosInfo = async () => {
    const allIds = [...productosIncluidos, ...productosExcluidos];
    if (allIds.length === 0) return;

    const newInfo = new Map<string, ProductoInfo>();
    for (const id of allIds) {
      if (!productosInfo.has(id)) {
        try {
          const response = await productosService.getById(id);
          if (response.success) {
            newInfo.set(id, {
              _id: response.data._id,
              nombre: response.data.nombre,
              sku: response.data.sku,
            });
          }
        } catch {
          newInfo.set(id, { _id: id, nombre: 'Producto no encontrado' });
        }
      } else {
        newInfo.set(id, productosInfo.get(id)!);
      }
    }
    setProductosInfo(newInfo);
  };

  const loadFamiliasInfo = async () => {
    const allIds = [...familiasIncluidas, ...familiasExcluidas];
    if (allIds.length === 0) return;

    const newInfo = new Map<string, FamiliaInfo>();
    for (const id of allIds) {
      if (!familiasInfo.has(id)) {
        try {
          const response = await familiasService.getById(id);
          if (response.success) {
            newInfo.set(id, {
              _id: response.data._id,
              nombre: response.data.nombre,
            });
          }
        } catch {
          newInfo.set(id, { _id: id, nombre: 'Familia no encontrada' });
        }
      } else {
        newInfo.set(id, familiasInfo.get(id)!);
      }
    }
    setFamiliasInfo(newInfo);
  };

  // Buscar productos
  const handleSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await productosService.getAll({ q: term, limit: 20, activo: true });
      if (response.success) {
        // Filtrar productos ya añadidos
        const existentes = new Set([...productosIncluidos, ...productosExcluidos]);
        const productosFiltrados = (response.data || []).filter(
          (p: Producto) => !existentes.has(p._id)
        );
        setSearchResults(productosFiltrados);
      }
    } catch (error) {
      console.error('Error al buscar productos:', error);
    } finally {
      setLoading(false);
    }
  }, [productosIncluidos, productosExcluidos]);

  // Cargar productos de una familia
  const handleFamiliaChange = async (familiaId: string) => {
    setSelectedFamilia(familiaId);
    if (!familiaId) {
      setFamiliaProductos([]);
      return;
    }

    try {
      setLoading(true);
      const response = await productosService.getAll({ familiaId, limit: 100, activo: true });
      if (response.success) {
        // Filtrar productos ya añadidos
        const existentes = new Set([...productosIncluidos, ...productosExcluidos]);
        const productosFiltrados = (response.data || []).filter(
          (p: Producto) => !existentes.has(p._id)
        );
        // Convertir a productos seleccionables
        const productosSeleccionables: ProductoSeleccionable[] = productosFiltrados.map(p => ({
          ...p,
          seleccionado: true,
        }));
        setFamiliaProductos(productosSeleccionables);
      }
    } catch (error) {
      console.error('Error al cargar productos de familia:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle selección de producto en lista de familia
  const handleToggleProductoSeleccion = (productoId: string) => {
    setFamiliaProductos(prev => prev.map(p =>
      p._id === productoId ? { ...p, seleccionado: !p.seleccionado } : p
    ));
  };

  // Toggle seleccionar todos
  const handleToggleSelectAll = (seleccionar: boolean) => {
    setFamiliaProductos(prev => prev.map(p => ({ ...p, seleccionado: seleccionar })));
  };

  // Añadir productos seleccionados de una familia
  const handleAddProductosMasivo = () => {
    const productosSeleccionados = familiaProductos.filter(p => p.seleccionado);
    if (productosSeleccionados.length === 0) {
      toast.warning('No hay productos seleccionados');
      return;
    }

    // Actualizar info de productos
    const newInfo = new Map(productosInfo);
    productosSeleccionados.forEach(p => {
      newInfo.set(p._id, {
        _id: p._id,
        nombre: p.nombre,
        sku: p.sku,
      });
    });
    setProductosInfo(newInfo);

    // Añadir a la lista correspondiente
    const nuevosIds = productosSeleccionados.map(p => p._id);
    if (dialogMode === 'incluir') {
      onUpdate({ productosIncluidos: [...productosIncluidos, ...nuevosIds] });
    } else {
      onUpdate({ productosExcluidos: [...productosExcluidos, ...nuevosIds] });
    }

    toast.success(`${productosSeleccionados.length} productos ${dialogMode === 'incluir' ? 'incluidos' : 'excluidos'}`);
    setDialogOpen(false);
    setSelectedFamilia('');
    setFamiliaProductos([]);
  };

  const openDialog = (mode: 'incluir' | 'excluir', type: 'producto' | 'familia' | 'productosPorFamilia') => {
    setDialogMode(mode);
    setDialogType(type);
    setDialogOpen(true);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedFamilia('');
    setFamiliaProductos([]);
  };

  const handleAddProducto = (producto: Producto) => {
    const newInfo = new Map(productosInfo);
    newInfo.set(producto._id, {
      _id: producto._id,
      nombre: producto.nombre,
      sku: producto.sku,
    });
    setProductosInfo(newInfo);

    if (dialogMode === 'incluir') {
      onUpdate({ productosIncluidos: [...productosIncluidos, producto._id] });
    } else {
      onUpdate({ productosExcluidos: [...productosExcluidos, producto._id] });
    }
    setSearchResults(prev => prev.filter(p => p._id !== producto._id));
    toast.success(`Producto ${dialogMode === 'incluir' ? 'incluido' : 'excluido'}`);
  };

  const handleAddFamilia = (familia: Familia) => {
    const newInfo = new Map(familiasInfo);
    newInfo.set(familia._id, {
      _id: familia._id,
      nombre: familia.nombre,
    });
    setFamiliasInfo(newInfo);

    if (dialogMode === 'incluir') {
      onUpdate({ familiasIncluidas: [...familiasIncluidas, familia._id] });
    } else {
      onUpdate({ familiasExcluidas: [...familiasExcluidas, familia._id] });
    }
    setDialogOpen(false);
    toast.success(`Familia ${dialogMode === 'incluir' ? 'incluida' : 'excluida'}`);
  };

  const handleRemoveProducto = (productoId: string, fromIncluidos: boolean) => {
    if (fromIncluidos) {
      onUpdate({ productosIncluidos: productosIncluidos.filter(id => id !== productoId) });
    } else {
      onUpdate({ productosExcluidos: productosExcluidos.filter(id => id !== productoId) });
    }
  };

  const handleRemoveFamilia = (familiaId: string, fromIncluidas: boolean) => {
    if (fromIncluidas) {
      onUpdate({ familiasIncluidas: familiasIncluidas.filter(id => id !== familiaId) });
    } else {
      onUpdate({ familiasExcluidas: familiasExcluidas.filter(id => id !== familiaId) });
    }
  };

  // Familias disponibles (no seleccionadas aun)
  const familiasDisponibles = familias.filter(
    f => !familiasIncluidas.includes(f._id) && !familiasExcluidas.includes(f._id)
  );

  if (aplicaATodos) {
    // Si aplica a todos, solo mostramos exclusiones
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Productos Excluidos</h2>
            <p className="text-sm text-muted-foreground">
              La oferta aplica a todos los productos excepto los listados aqui
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openDialog('excluir', 'producto')}>
              <Ban className="h-4 w-4 mr-2" />
              Excluir Producto
            </Button>
            <Button variant="outline" size="sm" onClick={() => openDialog('excluir', 'productosPorFamilia')}>
              <Users className="h-4 w-4 mr-2" />
              Excluir por Familia
            </Button>
            <Button variant="outline" size="sm" onClick={() => openDialog('excluir', 'familia')}>
              <Ban className="h-4 w-4 mr-2" />
              Excluir Familia Completa
            </Button>
          </div>
        </div>

        {productosExcluidos.length === 0 && familiasExcluidas.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">
            No hay exclusiones configuradas
          </p>
        ) : (
          <div className="space-y-4">
            {familiasExcluidas.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Familias excluidas</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {familiasExcluidas.map(id => (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      <Folder className="h-3 w-3" />
                      {familiasInfo.get(id)?.nombre || id}
                      <button onClick={() => handleRemoveFamilia(id, false)}>
                        <X className="h-3 w-3 ml-1" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {productosExcluidos.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Productos excluidos</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {productosExcluidos.map(id => (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {productosInfo.get(id)?.nombre || id}
                      <button onClick={() => handleRemoveProducto(id, false)}>
                        <X className="h-3 w-3 ml-1" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {renderDialog()}
      </Card>
    );
  }

  // Si NO aplica a todos, mostramos inclusiones
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Productos Incluidos</h2>
          <p className="text-sm text-muted-foreground">
            La oferta solo aplica a los productos y familias listados aqui
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openDialog('incluir', 'producto')}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Producto
          </Button>
          <Button variant="outline" size="sm" onClick={() => openDialog('incluir', 'productosPorFamilia')}>
            <Users className="h-4 w-4 mr-2" />
            Añadir por Familia
          </Button>
          <Button variant="outline" size="sm" onClick={() => openDialog('incluir', 'familia')}>
            <Folder className="h-4 w-4 mr-2" />
            Añadir Familia Completa
          </Button>
        </div>
      </div>

      {productosIncluidos.length === 0 && familiasIncluidas.length === 0 ? (
        <p className="text-center py-4 text-muted-foreground">
          No hay productos incluidos. Añade productos o familias para que la oferta aplique.
        </p>
      ) : (
        <div className="space-y-4">
          {familiasIncluidas.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Familias incluidas</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {familiasIncluidas.map(id => (
                  <Badge key={id} variant="default" className="flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    {familiasInfo.get(id)?.nombre || id}
                    <button onClick={() => handleRemoveFamilia(id, true)}>
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {productosIncluidos.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Productos incluidos</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {productosIncluidos.map(id => (
                  <Badge key={id} variant="default" className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {productosInfo.get(id)?.nombre || id}
                    <button onClick={() => handleRemoveProducto(id, true)}>
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {renderDialog()}
    </Card>
  );

  function renderDialog() {
    const getDialogTitle = () => {
      if (dialogType === 'producto') return `${dialogMode === 'incluir' ? 'Incluir' : 'Excluir'} Producto`;
      if (dialogType === 'familia') return `${dialogMode === 'incluir' ? 'Incluir' : 'Excluir'} Familia Completa`;
      return `${dialogMode === 'incluir' ? 'Incluir' : 'Excluir'} Productos por Familia`;
    };

    const getDialogDescription = () => {
      if (dialogType === 'producto') return 'Busca y selecciona un producto';
      if (dialogType === 'familia') return 'Selecciona una familia para aplicar la oferta a todos sus productos';
      return 'Selecciona una familia y elige qué productos incluir';
    };

    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={dialogType === 'productosPorFamilia' ? 'max-w-2xl' : 'max-w-lg'}>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>

          {dialogType === 'producto' ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="pl-9"
                />
              </div>

              <div className="max-h-[250px] overflow-y-auto">
                {loading ? (
                  <p className="text-center py-4 text-muted-foreground">Buscando...</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    {searchTerm.length < 2 ? 'Escribe al menos 2 caracteres' : 'No se encontraron productos'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((producto) => (
                      <div
                        key={producto._id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleAddProducto(producto)}
                      >
                        <div>
                          <p className="font-medium">{producto.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {producto.sku} | Venta: {(producto.precios?.venta || 0).toFixed(2)} €
                          </p>
                        </div>
                        <Plus className="h-4 w-4" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : dialogType === 'productosPorFamilia' ? (
            <div className="space-y-4">
              <div>
                <Label>Selecciona una familia</Label>
                <Select value={selectedFamilia} onValueChange={handleFamiliaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar familia..." />
                  </SelectTrigger>
                  <SelectContent>
                    {familias.map((familia) => (
                      <SelectItem key={familia._id} value={familia._id}>
                        {familia.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFamilia && (
                <div className="border rounded-lg">
                  {loading ? (
                    <p className="text-center py-4 text-muted-foreground">Cargando productos...</p>
                  ) : familiaProductos.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">
                      No hay productos nuevos disponibles en esta familia
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={familiaProductos.every(p => p.seleccionado)}
                            onCheckedChange={(checked) => handleToggleSelectAll(checked === true)}
                          />
                          <span className="text-sm font-medium">
                            {familiaProductos.filter(p => p.seleccionado).length} de {familiaProductos.length} seleccionados
                          </span>
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[40px]"></TableHead>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-right">P. Venta</TableHead>
                              <TableHead className="text-right">PVP</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {familiaProductos.map((producto) => (
                              <TableRow key={producto._id} className={!producto.seleccionado ? 'opacity-50' : ''}>
                                <TableCell>
                                  <Checkbox
                                    checked={producto.seleccionado}
                                    onCheckedChange={() => handleToggleProductoSeleccion(producto._id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-sm">{producto.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{producto.sku}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {(producto.precios?.venta || 0).toFixed(2)} €
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {(producto.precios?.pvp || 0).toFixed(2)} €
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-[300px] overflow-y-auto">
                {familiasDisponibles.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    No hay familias disponibles
                  </p>
                ) : (
                  <div className="space-y-2">
                    {familiasDisponibles.map((familia) => (
                      <div
                        key={familia._id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleAddFamilia(familia)}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          <span className="font-medium">{familia.nombre}</span>
                        </div>
                        <Plus className="h-4 w-4" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cerrar
            </Button>
            {dialogType === 'productosPorFamilia' && familiaProductos.filter(p => p.seleccionado).length > 0 && (
              <Button onClick={handleAddProductosMasivo} disabled={loading}>
                <Check className="h-4 w-4 mr-2" />
                {dialogMode === 'incluir' ? 'Incluir' : 'Excluir'} {familiaProductos.filter(p => p.seleccionado).length} productos
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
}

export default OfertaProductosEditor;
