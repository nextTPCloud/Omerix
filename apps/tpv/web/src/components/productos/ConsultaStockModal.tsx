'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface StockAlmacen {
  almacenId: string;
  almacenNombre: string;
  stock: number;
  stockMinimo: number;
}

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  imagen?: string;
  stocks: StockAlmacen[];
  stockTotal: number;
}

interface ConsultaStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  almacenes: Array<{ id: string; nombre: string }>;
}

// Datos de ejemplo (en producción vendrían de la API)
const productosEjemplo: Producto[] = [
  {
    id: '1',
    codigo: 'PROD001',
    nombre: 'Producto de ejemplo 1',
    stocks: [
      { almacenId: '1', almacenNombre: 'Almacén Principal', stock: 50, stockMinimo: 10 },
      { almacenId: '2', almacenNombre: 'Almacén Secundario', stock: 25, stockMinimo: 5 },
    ],
    stockTotal: 75,
  },
  {
    id: '2',
    codigo: 'PROD002',
    nombre: 'Producto de ejemplo 2',
    stocks: [
      { almacenId: '1', almacenNombre: 'Almacén Principal', stock: 3, stockMinimo: 10 },
      { almacenId: '2', almacenNombre: 'Almacén Secundario', stock: 0, stockMinimo: 5 },
    ],
    stockTotal: 3,
  },
  {
    id: '3',
    codigo: 'PROD003',
    nombre: 'Producto de ejemplo 3',
    stocks: [
      { almacenId: '1', almacenNombre: 'Almacén Principal', stock: 0, stockMinimo: 10 },
    ],
    stockTotal: 0,
  },
];

export function ConsultaStockModal({
  isOpen,
  onClose,
  almacenes,
}: ConsultaStockModalProps) {
  const [busqueda, setBusqueda] = useState('');
  const [almacenFiltro, setAlmacenFiltro] = useState<string>('todos');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  // Buscar productos
  useEffect(() => {
    if (!busqueda.trim()) {
      setProductos([]);
      return;
    }

    setLoading(true);
    // Simular búsqueda (en producción sería una llamada a la API)
    const timer = setTimeout(() => {
      const filtrados = productosEjemplo.filter(
        (p) =>
          p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
      setProductos(filtrados);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Consulta de Stock" size="xl">
      <div className="p-6">
        {/* Búsqueda */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
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
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          )}

          {/* Sin búsqueda */}
          {!loading && !busqueda && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Package className="w-16 h-16 mb-4" />
              <p>Introduce un código o nombre para buscar</p>
            </div>
          )}

          {/* Sin resultados */}
          {!loading && busqueda && productos.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Search className="w-16 h-16 mb-4" />
              <p>No se encontraron productos</p>
            </div>
          )}

          {/* Resultados */}
          {!loading && productos.length > 0 && !productoSeleccionado && (
            <div className="space-y-3">
              {productos.map((producto) => {
                const status = getStockStatus(
                  producto.stockTotal,
                  producto.stocks.reduce((min, s) => min + s.stockMinimo, 0)
                );
                const StatusIcon = status.icon;

                return (
                  <button
                    key={producto.id}
                    onClick={() => setProductoSeleccionado(producto)}
                    className="w-full p-4 bg-white border rounded-xl hover:border-primary-500 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">{producto.codigo}</p>
                        <p className="font-semibold text-gray-800">{producto.nombre}</p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-${status.color}-100`}
                        >
                          <StatusIcon className={`w-4 h-4 text-${status.color}-600`} />
                          <span className={`text-sm font-medium text-${status.color}-700`}>
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
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border">
                  <Package className="w-10 h-10 text-gray-400" />
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

              {/* Stock por almacén */}
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Stock por almacén
              </h3>
              <div className="space-y-3">
                {productoSeleccionado.stocks
                  .filter((s) => almacenFiltro === 'todos' || s.almacenId === almacenFiltro)
                  .map((stock) => {
                    const status = getStockStatus(stock.stock, stock.stockMinimo);
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={stock.almacenId}
                        className="flex items-center justify-between p-4 bg-white border rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full bg-${status.color}-100 flex items-center justify-center`}
                          >
                            <StatusIcon className={`w-5 h-5 text-${status.color}-600`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{stock.almacenNombre}</p>
                            <p className="text-sm text-gray-500">
                              Stock mínimo: {stock.stockMinimo} uds.
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold text-${status.color}-600`}>
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
