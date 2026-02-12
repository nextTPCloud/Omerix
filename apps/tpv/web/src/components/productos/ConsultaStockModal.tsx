'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Package,
  Search,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Layers,
} from 'lucide-react';
import { useDataStore } from '@/stores/dataStore';

interface StockAlmacen {
  almacenId: string;
  almacenNombre: string;
  stock: number;
  stockMinimo: number;
}

interface VarianteStock {
  id: string;
  sku: string;
  combinacion: Record<string, string>;
  stockTotal: number;
  stocks: StockAlmacen[];
}

interface ProductoStock {
  id: string;
  codigo: string;
  nombre: string;
  imagen?: string;
  stocks: StockAlmacen[];
  stockTotal: number;
  tieneVariantes?: boolean;
  variantes?: VarianteStock[];
}

interface ConsultaStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  almacenes: Array<{ id: string; nombre: string }>;
}

export function ConsultaStockModal({
  isOpen,
  onClose,
  almacenes,
}: ConsultaStockModalProps) {
  const [busqueda, setBusqueda] = useState('');
  const [almacenFiltro, setAlmacenFiltro] = useState<string>('todos');
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoStock | null>(null);

  // Obtener productos del store
  const { productos: productosSync, almacenes: almacenesSync, obtenerStockProducto } = useDataStore();

  // Buscar productos
  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim() || busqueda.length < 2) return [];

    const term = busqueda.toLowerCase();
    return productosSync
      .filter((p: any) =>
        p.codigo?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.nombre?.toLowerCase().includes(term) ||
        p.codigoBarras?.includes(term)
      )
      .slice(0, 20) // Limitar resultados
      .map((p: any) => {
        // Obtener stock del producto
        const stockData = p.stock || [];
        const stocks: StockAlmacen[] = almacenesSync.map((alm: any) => {
          const stockAlmacen = Array.isArray(stockData)
            ? stockData.find((s: any) => s.almacenId === alm._id)
            : null;
          return {
            almacenId: alm._id,
            almacenNombre: alm.nombre,
            stock: stockAlmacen?.cantidad ?? stockAlmacen?.stockActual ?? 0,
            stockMinimo: p.stockMinimo || 5,
          };
        });

        // Mapear variantes si existen
        const variantes: VarianteStock[] = p.tieneVariantes && p.variantes
          ? p.variantes.filter((v: any) => v.activo !== false).map((v: any) => {
              const varStocks: StockAlmacen[] = almacenesSync.map((alm: any) => {
                const stockVar = Array.isArray(v.stockPorAlmacen)
                  ? v.stockPorAlmacen.find((s: any) => s.almacenId === alm._id)
                  : null;
                return {
                  almacenId: alm._id,
                  almacenNombre: alm.nombre,
                  stock: stockVar?.cantidad ?? 0,
                  stockMinimo: 0,
                };
              });
              return {
                id: v._id,
                sku: v.sku || '',
                combinacion: v.combinacion || {},
                stockTotal: varStocks.reduce((acc, s) => acc + s.stock, 0),
                stocks: varStocks,
              };
            })
          : [];

        return {
          id: p._id,
          codigo: p.sku || p.codigo || '',
          nombre: p.nombre,
          imagen: p.imagenPrincipal || p.imagenes?.[0],
          stocks,
          stockTotal: stocks.reduce((acc, s) => acc + s.stock, 0),
          tieneVariantes: p.tieneVariantes || false,
          variantes,
        };
      });
  }, [busqueda, productosSync, almacenesSync]);

  const getStockStatus = (stock: number, stockMinimo: number) => {
    if (stock === 0) return { color: 'red', icon: XCircle, label: 'Sin stock' };
    if (stock <= stockMinimo) return { color: 'amber', icon: AlertTriangle, label: 'Stock bajo' };
    return { color: 'green', icon: CheckCircle, label: 'Disponible' };
  };

  const handleClose = () => {
    setBusqueda('');
    setProductoSeleccionado(null);
    onClose();
  };

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setBusqueda('');
      setProductoSeleccionado(null);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Consulta de Stock" size="xl">
      <div className="p-6">
        {/* Busqueda */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por codigo, SKU o nombre (min. 2 caracteres)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-12 pl-10 pr-4 border rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              autoFocus
            />
          </div>
          <select
            value={almacenFiltro}
            onChange={(e) => setAlmacenFiltro(e.target.value)}
            className="h-12 px-4 border rounded-lg bg-white min-w-[200px]"
          >
            <option value="todos">Todos los almacenes</option>
            {almacenes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Contenido */}
        <div className="min-h-[400px]">
          {/* Sin busqueda */}
          {busqueda.length < 2 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Package className="w-16 h-16 mb-4" />
              <p>Introduce al menos 2 caracteres para buscar</p>
              <p className="text-sm mt-2">Puedes buscar por codigo, SKU, nombre o codigo de barras</p>
            </div>
          )}

          {/* Sin resultados */}
          {busqueda.length >= 2 && productosFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Search className="w-16 h-16 mb-4" />
              <p>No se encontraron productos para "{busqueda}"</p>
            </div>
          )}

          {/* Resultados */}
          {productosFiltrados.length > 0 && !productoSeleccionado && (
            <div className="space-y-3">
              {productosFiltrados.map((producto) => {
                const status = getStockStatus(producto.stockTotal, 10);
                const StatusIcon = status.icon;
                const colorClasses = {
                  red: 'bg-red-100 text-red-600',
                  amber: 'bg-amber-100 text-amber-600',
                  green: 'bg-green-100 text-green-600',
                };

                return (
                  <button
                    key={producto.id}
                    onClick={() => setProductoSeleccionado(producto)}
                    className="w-full p-4 bg-white border rounded-xl hover:border-primary-500 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {producto.imagen ? (
                          <img src={producto.imagen} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">{producto.codigo}</p>
                        <p className="font-semibold text-gray-800">{producto.nombre}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${colorClasses[status.color as keyof typeof colorClasses]}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {producto.stockTotal} uds.
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Detalle de producto */}
          {productoSeleccionado && (
            <div>
              {/* Cabecera producto */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border overflow-hidden">
                  {productoSeleccionado.imagen ? (
                    <img src={productoSeleccionado.imagen} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{productoSeleccionado.codigo}</p>
                  <p className="text-xl font-bold text-gray-800">{productoSeleccionado.nombre}</p>
                  <p className="text-sm text-gray-600">
                    Stock total: <strong>{productoSeleccionado.stockTotal} unidades</strong>
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setProductoSeleccionado(null)}>
                  Volver
                </Button>
              </div>

              {/* Stock por variante (si tiene variantes) */}
              {productoSeleccionado.tieneVariantes && productoSeleccionado.variantes && productoSeleccionado.variantes.length > 0 && (
                <>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Stock por variante
                  </h3>
                  <div className="mb-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-2 font-medium text-gray-600">Variante</th>
                          <th className="text-left p-2 font-medium text-gray-600">SKU</th>
                          {almacenesSync.map((alm: any) => (
                            <th key={alm._id} className="text-center p-2 font-medium text-gray-600">{alm.nombre}</th>
                          ))}
                          <th className="text-center p-2 font-medium text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productoSeleccionado.variantes.map((variante) => {
                          const combinacionStr = Object.entries(variante.combinacion)
                            .map(([k, v]) => `${v}`)
                            .join(' / ');
                          const status = getStockStatus(variante.stockTotal, 0);
                          const colors = {
                            red: 'text-red-600',
                            amber: 'text-amber-600',
                            green: 'text-green-600',
                          };
                          return (
                            <tr key={variante.id} className="border-b hover:bg-gray-50">
                              <td className="p-2 font-medium">{combinacionStr}</td>
                              <td className="p-2 text-gray-500">{variante.sku}</td>
                              {variante.stocks.map((s) => (
                                <td key={s.almacenId} className={`p-2 text-center font-medium ${s.stock === 0 ? 'text-red-500' : s.stock <= 3 ? 'text-amber-500' : 'text-green-600'}`}>
                                  {s.stock}
                                </td>
                              ))}
                              <td className={`p-2 text-center font-bold ${colors[status.color as keyof typeof colors]}`}>
                                {variante.stockTotal}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Stock por almacen */}
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Stock por almacen
              </h3>
              <div className="space-y-3">
                {productoSeleccionado.stocks
                  .filter((s) => almacenFiltro === 'todos' || s.almacenId === almacenFiltro)
                  .map((stock) => {
                    const status = getStockStatus(stock.stock, stock.stockMinimo);
                    const StatusIcon = status.icon;
                    const colorClasses = {
                      red: { bg: 'bg-red-100', text: 'text-red-600' },
                      amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
                      green: { bg: 'bg-green-100', text: 'text-green-600' },
                    };
                    const colors = colorClasses[status.color as keyof typeof colorClasses];

                    return (
                      <div
                        key={stock.almacenId}
                        className="flex items-center justify-between p-4 bg-white border rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
                            <StatusIcon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{stock.almacenNombre}</p>
                            <p className="text-sm text-gray-500">
                              Stock minimo: {stock.stockMinimo} uds.
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${colors.text}`}>
                            {stock.stock}
                          </p>
                          <p className="text-sm text-gray-500">unidades</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex justify-end mt-6 pt-6 border-t">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
