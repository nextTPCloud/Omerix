'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Search,
  Trash2,
  MoreHorizontal,
  Package,
  Folder,
  Edit,
  X,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { productosService } from '@/services/productos.service';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { familiasService } from '@/services/familias.service';
import { Producto } from '@/types/producto.types';
import { Familia } from '@/types/familia.types';
import { IPrecioTarifa } from '@/types/tarifa.types';

interface TarifaPreciosEditorProps {
  tarifaId: string;
  tipoTarifa: 'fija' | 'porcentaje';
  precios: IPrecioTarifa[];
  onAddPrecio: (precio: { productoId: string; precio?: number; descuentoPorcentaje?: number }) => Promise<void>;
  onRemovePrecio: (productoId: string, varianteId?: string) => Promise<void>;
  onUpdatePrecio: (precio: { productoId: string; precio?: number; descuentoPorcentaje?: number }) => Promise<void>;
}

// Interface para productos con precios editables antes de insertar
interface ProductoConPrecioEditable extends Producto {
  precioTarifa: number;
  descuentoTarifa: number;
  seleccionado: boolean;
}

export function TarifaPreciosEditor({
  tarifaId,
  tipoTarifa,
  precios,
  onAddPrecio,
  onRemovePrecio,
  onUpdatePrecio,
}: TarifaPreciosEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'producto' | 'familia'>('producto');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [productOptions, setProductOptions] = useState<SearchableSelectOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [selectedFamilia, setSelectedFamilia] = useState<string>('');
  const [familiaProductos, setFamiliaProductos] = useState<ProductoConPrecioEditable[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPrecio, setEditingPrecio] = useState<{
    productoId: string;
    precio?: number;
    descuentoPorcentaje?: number;
  } | null>(null);
  const [usarPVP, setUsarPVP] = useState(false);

  // Cargar familias al montar
  useEffect(() => {
    loadFamilias();
  }, []);

  // Cargar productos iniciales para el select
  useEffect(() => {
    loadInitialProducts();
  }, [precios]);

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

  const loadInitialProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await productosService.getAll({ limit: 50, activo: true });
      if (response.success) {
        const productosExistentes = new Set(precios.map(p => p.productoId?.toString()));
        const productosFiltrados = (response.data || []).filter(
          (p: Producto) => !productosExistentes.has(p._id)
        );
        const options: SearchableSelectOption[] = productosFiltrados.map((p: Producto) => ({
          value: p._id,
          label: p.nombre,
          description: `SKU: ${p.sku} | Venta: ${(p.precios?.venta || 0).toFixed(2)}€ | PVP: ${(p.precios?.pvp || 0).toFixed(2)}€`,
        }));
        setProductOptions(options);
        setSearchResults(productosFiltrados);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Buscar productos
  const handleSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      // Recargar productos iniciales
      loadInitialProducts();
      return;
    }

    try {
      setLoadingProducts(true);
      const response = await productosService.getAll({ search: term, limit: 30, activo: true });
      if (response.success) {
        // Filtrar productos ya añadidos
        const productosExistentes = new Set(precios.map(p => p.productoId?.toString()));
        const productosFiltrados = (response.data || []).filter(
          (p: Producto) => !productosExistentes.has(p._id)
        );
        setSearchResults(productosFiltrados);
        // Actualizar opciones del select
        const options: SearchableSelectOption[] = productosFiltrados.map((p: Producto) => ({
          value: p._id,
          label: p.nombre,
          description: `SKU: ${p.sku} | Venta: ${(p.precios?.venta || 0).toFixed(2)}€ | PVP: ${(p.precios?.pvp || 0).toFixed(2)}€`,
        }));
        setProductOptions(options);
      }
    } catch (error) {
      console.error('Error al buscar productos:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, [precios]);

  // Obtener el precio de un producto segun configuracion
  const obtenerPrecioProducto = (producto: Producto): number => {
    if (usarPVP) {
      return producto.precios?.pvp || producto.precios?.venta || 0;
    }
    return producto.precios?.venta || 0;
  };

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
        const productosExistentes = new Set(precios.map(p => p.productoId?.toString()));
        const productosFiltrados = (response.data || []).filter(
          (p: Producto) => !productosExistentes.has(p._id)
        );
        // Convertir a productos editables con precios
        const productosEditables: ProductoConPrecioEditable[] = productosFiltrados.map(p => ({
          ...p,
          precioTarifa: p.precios?.venta || 0,
          descuentoTarifa: 0,
          seleccionado: true,
        }));
        setFamiliaProductos(productosEditables);
      }
    } catch (error) {
      console.error('Error al cargar productos de familia:', error);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar precio de un producto en la lista de familia
  const handleUpdateFamiliaProductoPrecio = (productoId: string, campo: 'precioTarifa' | 'descuentoTarifa' | 'seleccionado', valor: number | boolean) => {
    setFamiliaProductos(prev => prev.map(p =>
      p._id === productoId ? { ...p, [campo]: valor } : p
    ));
  };

  // Seleccionar/deseleccionar todos los productos
  const handleToggleSelectAll = (seleccionar: boolean) => {
    setFamiliaProductos(prev => prev.map(p => ({ ...p, seleccionado: seleccionar })));
  };

  // Añadir producto individual
  const handleAddProducto = async (producto: Producto) => {
    try {
      const precio = obtenerPrecioProducto(producto);
      await onAddPrecio({
        productoId: producto._id,
        precio: tipoTarifa === 'fija' ? precio : undefined,
        descuentoPorcentaje: tipoTarifa === 'porcentaje' ? 0 : undefined,
      });
      // Quitar de resultados de busqueda
      setSearchResults(prev => prev.filter(p => p._id !== producto._id));
      setProductOptions(prev => prev.filter(p => p.value !== producto._id));
      setSelectedProductId('');
      toast.success(`Producto "${producto.nombre}" añadido`);
    } catch (error) {
      toast.error('Error al añadir producto');
    }
  };

  // Handler para cuando se selecciona un producto del SearchableSelect
  const handleProductSelect = async (productId: string) => {
    if (!productId) return;

    const producto = searchResults.find(p => p._id === productId);
    if (producto) {
      await handleAddProducto(producto);
    }
  };

  // Añadir los productos seleccionados de una familia
  const handleAddFamilia = async () => {
    const productosSeleccionados = familiaProductos.filter(p => p.seleccionado);
    if (productosSeleccionados.length === 0) {
      toast.warning('No hay productos seleccionados para añadir');
      return;
    }

    try {
      setLoading(true);
      let añadidos = 0;
      for (const producto of productosSeleccionados) {
        await onAddPrecio({
          productoId: producto._id,
          precio: tipoTarifa === 'fija' ? producto.precioTarifa : undefined,
          descuentoPorcentaje: tipoTarifa === 'porcentaje' ? producto.descuentoTarifa : undefined,
        });
        añadidos++;
      }
      toast.success(`${añadidos} productos añadidos`);
      setDialogOpen(false);
      setSelectedFamilia('');
      setFamiliaProductos([]);
    } catch (error) {
      toast.error('Error al añadir productos');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar precio
  const handleRemove = async (productoId: string, varianteId?: string) => {
    try {
      await onRemovePrecio(productoId, varianteId);
      toast.success('Producto eliminado de la tarifa');
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  // Guardar edicion de precio
  const handleSaveEdit = async () => {
    if (!editingPrecio) return;

    try {
      await onUpdatePrecio(editingPrecio);
      setEditingPrecio(null);
      toast.success('Precio actualizado');
    } catch (error) {
      toast.error('Error al actualizar precio');
    }
  };

  const openDialog = (mode: 'producto' | 'familia') => {
    setDialogMode(mode);
    setDialogOpen(true);
    setSearchTerm('');
    setSelectedProductId('');
    setSelectedFamilia('');
    setFamiliaProductos([]);
    // Recargar productos para el selector
    if (mode === 'producto') {
      loadInitialProducts();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Precios por Producto</h2>
          <p className="text-sm text-muted-foreground">
            {precios.length} producto(s) configurados
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Añadir Productos
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openDialog('producto')}>
              <Package className="h-4 w-4 mr-2" />
              Buscar producto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog('familia')}>
              <Folder className="h-4 w-4 mr-2" />
              Añadir por familia
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {precios.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No hay productos configurados</p>
          <p className="text-sm">Añade productos para definir precios especificos</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">
                  {tipoTarifa === 'fija' ? 'Precio' : 'Descuento %'}
                </TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {precios.map((precio, index) => (
                <TableRow key={`${precio.productoId}-${precio.varianteId || index}`}>
                  <TableCell className="font-medium">
                    {precio.productoNombre || precio.productoId}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {precio.productoSku || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingPrecio?.productoId === precio.productoId?.toString() ? (
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          step={tipoTarifa === 'fija' ? '0.01' : '1'}
                          min={0}
                          max={tipoTarifa === 'porcentaje' ? 100 : undefined}
                          className="w-24 h-8"
                          value={tipoTarifa === 'fija' ? editingPrecio.precio : editingPrecio.descuentoPorcentaje}
                          onChange={(e) => setEditingPrecio({
                            ...editingPrecio,
                            [tipoTarifa === 'fija' ? 'precio' : 'descuentoPorcentaje']: parseFloat(e.target.value) || 0,
                          })}
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingPrecio(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => setEditingPrecio({
                          productoId: precio.productoId?.toString() || '',
                          precio: precio.precio,
                          descuentoPorcentaje: precio.descuentoPorcentaje,
                        })}
                      >
                        {tipoTarifa === 'fija'
                          ? `${(precio.precio || 0).toFixed(2)} €`
                          : `${precio.descuentoPorcentaje || 0}%`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={precio.activo !== false ? 'default' : 'secondary'}>
                      {precio.activo !== false ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(precio.productoId?.toString() || '', precio.varianteId?.toString())}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog para añadir productos */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'producto' ? 'Buscar Producto' : 'Añadir por Familia'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'producto'
                ? 'Busca y selecciona productos para añadir a la tarifa'
                : 'Selecciona una familia para añadir todos sus productos'}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === 'producto' ? (
            <div className="space-y-4">
              <div>
                <Label>Buscar y seleccionar producto</Label>
                <SearchableSelect
                  options={productOptions}
                  value={selectedProductId}
                  onValueChange={handleProductSelect}
                  placeholder="Buscar por nombre o SKU..."
                  searchPlaceholder="Escribe para buscar..."
                  emptyMessage="No se encontraron productos"
                  loading={loadingProducts}
                  allowClear={false}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Selecciona un producto para añadirlo a la tarifa
                </p>
              </div>

              {/* Lista de productos añadidos recientemente en esta sesión */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">Productos disponibles ({searchResults.length})</p>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {searchResults.slice(0, 10).map((producto) => (
                      <div
                        key={producto._id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{producto.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {producto.sku} | {(producto.precios?.venta || 0).toFixed(2)}€
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleAddProducto(producto)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                {tipoTarifa === 'fija' && (
                  <div className="flex items-end">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="usarPVP"
                        checked={usarPVP}
                        onCheckedChange={(checked) => {
                          setUsarPVP(checked === true);
                          // Actualizar precios de los productos ya cargados
                          if (familiaProductos.length > 0) {
                            setFamiliaProductos(prev => prev.map(p => ({
                              ...p,
                              precioTarifa: checked ? (p.precios?.pvp || p.precios?.venta || 0) : (p.precios?.venta || 0),
                            })));
                          }
                        }}
                      />
                      <Label htmlFor="usarPVP" className="text-sm">Usar PVP en lugar de precio venta</Label>
                    </div>
                  </div>
                )}
              </div>

              {selectedFamilia && (
                <div className="border rounded-lg">
                  {loading ? (
                    <p className="text-center py-4 text-muted-foreground">Cargando productos...</p>
                  ) : familiaProductos.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">
                      No hay productos nuevos para añadir en esta familia
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
                              <TableHead className="text-right w-[120px]">
                                {tipoTarifa === 'fija' ? 'Precio Tarifa' : 'Descuento %'}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {familiaProductos.map((producto) => (
                              <TableRow key={producto._id} className={!producto.seleccionado ? 'opacity-50' : ''}>
                                <TableCell>
                                  <Checkbox
                                    checked={producto.seleccionado}
                                    onCheckedChange={(checked) =>
                                      handleUpdateFamiliaProductoPrecio(producto._id, 'seleccionado', checked === true)
                                    }
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
                                <TableCell>
                                  <Input
                                    type="number"
                                    step={tipoTarifa === 'fija' ? '0.01' : '1'}
                                    min={0}
                                    max={tipoTarifa === 'porcentaje' ? 100 : undefined}
                                    className="h-8 text-right"
                                    value={tipoTarifa === 'fija' ? producto.precioTarifa : producto.descuentoTarifa}
                                    onChange={(e) =>
                                      handleUpdateFamiliaProductoPrecio(
                                        producto._id,
                                        tipoTarifa === 'fija' ? 'precioTarifa' : 'descuentoTarifa',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    disabled={!producto.seleccionado}
                                  />
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
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            {dialogMode === 'familia' && familiaProductos.filter(p => p.seleccionado).length > 0 && (
              <Button onClick={handleAddFamilia} disabled={loading}>
                <Check className="h-4 w-4 mr-2" />
                Añadir {familiaProductos.filter(p => p.seleccionado).length} productos
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default TarifaPreciosEditor;
