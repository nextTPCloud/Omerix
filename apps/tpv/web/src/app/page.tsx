'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Package,
  CreditCard,
  Receipt,
  Settings,
  Wallet,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Wifi,
  WifiOff,
  RotateCcw,
  LogOut,
  ArrowLeftRight,
  BarChart3,
  User,
  Clock,
} from 'lucide-react';

// Components
import { AperturaCajaModal } from '@/components/caja/AperturaCajaModal';
import { CierreCajaModal } from '@/components/caja/CierreCajaModal';
import { MovimientoCajaModal } from '@/components/caja/MovimientoCajaModal';
import { CobroModal } from '@/components/ventas/CobroModal';
import { ConsultaStockModal } from '@/components/productos/ConsultaStockModal';
import { Button } from '@/components/ui/Button';

// Types
interface LineaVenta {
  id: string;
  productoId: string;
  varianteId?: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  total: number;
}

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  categoria?: string;
  imagen?: string;
  stock: number;
}

interface StatusSync {
  online: boolean;
  pendientes: number;
}

interface ArqueoCaja {
  efectivo: number;
  tarjeta: number;
  otros: number;
  total: number;
}

// Datos de ejemplo
const categoriasEjemplo = ['Todos', 'Favoritos', 'Bebidas', 'Comida', 'Otros'];

const productosEjemplo: Producto[] = [
  { id: '1', codigo: 'BEB001', nombre: 'Café Solo', precio: 1.20, categoria: 'Bebidas', stock: 999 },
  { id: '2', codigo: 'BEB002', nombre: 'Café con Leche', precio: 1.50, categoria: 'Bebidas', stock: 999 },
  { id: '3', codigo: 'BEB003', nombre: 'Cortado', precio: 1.30, categoria: 'Bebidas', stock: 999 },
  { id: '4', codigo: 'BEB004', nombre: 'Refresco', precio: 2.00, categoria: 'Bebidas', stock: 50 },
  { id: '5', codigo: 'COM001', nombre: 'Croissant', precio: 1.80, categoria: 'Comida', stock: 20 },
  { id: '6', codigo: 'COM002', nombre: 'Tostada', precio: 2.50, categoria: 'Comida', stock: 30 },
  { id: '7', codigo: 'COM003', nombre: 'Bocadillo Jamón', precio: 4.50, categoria: 'Comida', stock: 15 },
  { id: '8', codigo: 'COM004', nombre: 'Pincho Tortilla', precio: 3.00, categoria: 'Comida', stock: 10 },
];

const almacenesEjemplo = [
  { id: '1', nombre: 'Almacén Principal' },
  { id: '2', nombre: 'Almacén Secundario' },
];

export default function TPVPage() {
  // Estado de la caja
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [cajaNombre] = useState('Caja 1');
  const [importeInicial, setImporteInicial] = useState(0);
  const [totalEfectivo, setTotalEfectivo] = useState(0);
  const [totalTarjeta, setTotalTarjeta] = useState(0);
  const [totalOtros, setTotalOtros] = useState(0);
  const [numeroVentas, setNumeroVentas] = useState(0);
  const [totalVentas, setTotalVentas] = useState(0);

  // Estado de la venta
  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  // Estado de sincronización
  const [syncStatus, setSyncStatus] = useState<StatusSync>({ online: true, pendientes: 0 });

  // Modales
  const [showAperturaCaja, setShowAperturaCaja] = useState(false);
  const [showCierreCaja, setShowCierreCaja] = useState(false);
  const [showMovimientoCaja, setShowMovimientoCaja] = useState(false);
  const [showCobro, setShowCobro] = useState(false);
  const [showStock, setShowStock] = useState(false);

  // Hora actual
  const [horaActual, setHoraActual] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calcular totales
  const subtotal = lineas.reduce((acc, l) => acc + l.precioUnitario * l.cantidad, 0);
  const descuento = lineas.reduce((acc, l) => acc + l.descuento, 0);
  const total = subtotal - descuento;

  // Filtrar productos
  const productosFiltrados = productosEjemplo.filter((p) => {
    const matchBusqueda =
      !busqueda ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    return matchBusqueda && matchCategoria;
  });

  // Acciones de venta
  const agregarProducto = useCallback((producto: Producto) => {
    setLineas((prev) => {
      const existente = prev.find((l) => l.productoId === producto.id);
      if (existente) {
        return prev.map((l) =>
          l.productoId === producto.id
            ? { ...l, cantidad: l.cantidad + 1, total: (l.cantidad + 1) * l.precioUnitario }
            : l
        );
      }
      return [
        ...prev,
        {
          id: Date.now().toString(),
          productoId: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          cantidad: 1,
          precioUnitario: producto.precio,
          descuento: 0,
          total: producto.precio,
        },
      ];
    });
  }, []);

  const eliminarLinea = (id: string) => {
    setLineas(lineas.filter((l) => l.id !== id));
  };

  const modificarCantidad = (id: string, delta: number) => {
    setLineas(
      lineas
        .map((l) =>
          l.id === id
            ? {
                ...l,
                cantidad: Math.max(0, l.cantidad + delta),
                total: Math.max(0, l.cantidad + delta) * l.precioUnitario,
              }
            : l
        )
        .filter((l) => l.cantidad > 0)
    );
  };

  const limpiarVenta = () => {
    setLineas([]);
    setBusqueda('');
  };

  // Acciones de caja
  const handleAbrirCaja = (importe: number) => {
    setImporteInicial(importe);
    setTotalEfectivo(importe);
    setTotalTarjeta(0);
    setTotalOtros(0);
    setNumeroVentas(0);
    setTotalVentas(0);
    setCajaAbierta(true);
    setShowAperturaCaja(false);
  };

  const handleCerrarCaja = (arqueoReal: ArqueoCaja, observaciones: string) => {
    console.log('Cierre de caja:', { arqueoReal, observaciones });
    setCajaAbierta(false);
    setShowCierreCaja(false);
  };

  const handleMovimientoCaja = (tipo: 'entrada' | 'salida', importe: number, descripcion: string) => {
    if (tipo === 'entrada') {
      setTotalEfectivo((prev) => prev + importe);
    } else {
      setTotalEfectivo((prev) => prev - importe);
    }
    console.log('Movimiento:', { tipo, importe, descripcion });
  };

  const handleCobro = (pagos: Array<{ metodo: string; importe: number }>, cambio: number) => {
    // Actualizar totales
    pagos.forEach((pago) => {
      if (pago.metodo === 'efectivo') {
        setTotalEfectivo((prev) => prev + pago.importe - cambio);
      } else if (pago.metodo === 'tarjeta') {
        setTotalTarjeta((prev) => prev + pago.importe);
      } else {
        setTotalOtros((prev) => prev + pago.importe);
      }
    });

    setNumeroVentas((prev) => prev + 1);
    setTotalVentas((prev) => prev + total);

    // Agregar a cola de sync si offline
    if (!syncStatus.online) {
      setSyncStatus((prev) => ({ ...prev, pendientes: prev.pendientes + 1 }));
    }

    // Limpiar venta
    limpiarVenta();
    setShowCobro(false);

    console.log('Venta completada:', { pagos, cambio, total });
  };

  // Manejar código de barras
  useEffect(() => {
    let buffer = '';
    let timeout: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar si hay un input activo (excepto búsqueda)
      if (document.activeElement?.tagName === 'INPUT' &&
          !(document.activeElement as HTMLInputElement).placeholder?.includes('Buscar')) {
        return;
      }

      clearTimeout(timeout);

      if (e.key === 'Enter' && buffer.length > 0) {
        // Buscar producto por código
        const producto = productosEjemplo.find((p) => p.codigo === buffer);
        if (producto) {
          agregarProducto(producto);
        } else {
          setBusqueda(buffer);
        }
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
        timeout = setTimeout(() => {
          buffer = '';
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [agregarProducto]);

  // Arqueo teórico
  const arqueoTeorico: ArqueoCaja = {
    efectivo: totalEfectivo,
    tarjeta: totalTarjeta,
    otros: totalOtros,
    total: totalEfectivo + totalTarjeta + totalOtros,
  };

  // Si la caja no está abierta
  if (!cajaAbierta) {
    return (
      <>
        <div className="h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Wallet className="w-12 h-12 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Tralok TPV</h1>
            <p className="text-gray-500 mb-2">{cajaNombre}</p>
            <p className="text-gray-600 mb-8">La caja está cerrada. Ábrela para comenzar a operar.</p>
            <Button
              variant="primary"
              size="xl"
              className="w-full"
              onClick={() => setShowAperturaCaja(true)}
            >
              Abrir Caja
            </Button>
          </div>
        </div>

        <AperturaCajaModal
          isOpen={showAperturaCaja}
          onClose={() => setShowAperturaCaja(false)}
          onConfirm={handleAbrirCaja}
          cajaNombre={cajaNombre}
        />
      </>
    );
  }

  return (
    <>
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Header */}
        <header className="h-[60px] bg-white border-b flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-primary-600">Tralok TPV</h1>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              {cajaNombre}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Hora */}
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {horaActual.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Estado de sincronización */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                syncStatus.online ? 'bg-green-100' : 'bg-amber-100'
              }`}
            >
              {syncStatus.online ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  syncStatus.online ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                {syncStatus.online ? 'Online' : `Offline (${syncStatus.pendientes})`}
              </span>
            </div>

            {/* Botones de acción rápida */}
            <Button variant="ghost" size="sm" onClick={() => setShowStock(true)}>
              <Package className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowMovimientoCaja(true)}>
              <ArrowLeftRight className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowCierreCaja(true)}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Panel Izquierdo - Productos */}
          <div className="flex-1 flex flex-col p-4">
            {/* Búsqueda */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto o escanear código..."
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-lg"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            {/* Categorías */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categoriasEjemplo.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaActiva(cat)}
                  className={`btn-touch whitespace-nowrap ${
                    categoriaActiva === cat
                      ? 'bg-primary-500 text-white'
                      : 'bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid de productos */}
            <div className="flex-1 overflow-y-auto custom-scroll">
              <div className="product-grid">
                {productosFiltrados.map((producto) => (
                  <button
                    key={producto.id}
                    onClick={() => agregarProducto(producto)}
                    className="product-card hover:border-primary-500 hover:shadow-md"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-sm font-medium text-center line-clamp-2">
                      {producto.nombre}
                    </span>
                    <span className="text-lg font-bold text-primary-600">
                      {producto.precio.toFixed(2)} EUR
                    </span>
                    {producto.stock < 20 && (
                      <span className="text-xs text-amber-600">Stock: {producto.stock}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Derecho - Ticket */}
          <div className="w-[360px] bg-white border-l flex flex-col shadow-lg">
            {/* Cliente */}
            <div className="p-3 border-b bg-gray-50">
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium">Público general</p>
                </div>
                <Plus className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Líneas de venta */}
            <div className="flex-1 overflow-y-auto custom-scroll p-2">
              {lineas.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ShoppingCart className="w-16 h-16 mb-3" />
                  <span className="text-lg">Sin productos</span>
                  <span className="text-sm">Escanea o selecciona productos</span>
                </div>
              ) : (
                lineas.map((linea) => (
                  <div key={linea.id} className="sale-line">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{linea.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {linea.precioUnitario.toFixed(2)} EUR x {linea.cantidad}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => modificarCantidad(linea.id, -1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{linea.cantidad}</span>
                      <button
                        onClick={() => modificarCantidad(linea.id, 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="w-20 text-right font-bold">{linea.total.toFixed(2)}</div>
                    <button
                      onClick={() => eliminarLinea(linea.id)}
                      className="w-8 h-8 rounded-full text-red-500 flex items-center justify-center hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Totales */}
            <div className="border-t p-4 bg-gray-50">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Subtotal</span>
                <span>{subtotal.toFixed(2)} EUR</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm mb-1 text-green-600">
                  <span>Descuento</span>
                  <span>-{descuento.toFixed(2)} EUR</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold mt-3 pt-3 border-t border-gray-200">
                <span>TOTAL</span>
                <span className="text-primary-600">{total.toFixed(2)} EUR</span>
              </div>
            </div>

            {/* Acciones */}
            <div className="p-4 border-t grid grid-cols-3 gap-2">
              <Button
                variant="danger"
                size="lg"
                onClick={limpiarVenta}
                disabled={lineas.length === 0}
                icon={<Trash2 className="w-5 h-5" />}
              >
                Cancelar
              </Button>
              <Button
                variant="secondary"
                size="lg"
                disabled={lineas.length === 0}
                icon={<RotateCcw className="w-5 h-5" />}
              >
                Aparcar
              </Button>
              <Button
                variant="secondary"
                size="lg"
                disabled={lineas.length === 0}
                icon={<Printer className="w-5 h-5" />}
              >
                Ticket
              </Button>
              <Button
                variant="success"
                size="xl"
                className="col-span-3 h-16 text-xl"
                onClick={() => setShowCobro(true)}
                disabled={lineas.length === 0}
                icon={<CreditCard className="w-6 h-6" />}
              >
                Cobrar {total.toFixed(2)} EUR
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <CierreCajaModal
        isOpen={showCierreCaja}
        onClose={() => setShowCierreCaja(false)}
        onConfirm={handleCerrarCaja}
        arqueoTeorico={arqueoTeorico}
        cajaNombre={cajaNombre}
        numeroVentas={numeroVentas}
        totalVentas={totalVentas}
      />

      <MovimientoCajaModal
        isOpen={showMovimientoCaja}
        onClose={() => setShowMovimientoCaja(false)}
        onConfirm={handleMovimientoCaja}
        efectivoActual={totalEfectivo}
      />

      <CobroModal
        isOpen={showCobro}
        onClose={() => setShowCobro(false)}
        onConfirm={handleCobro}
        total={total}
      />

      <ConsultaStockModal
        isOpen={showStock}
        onClose={() => setShowStock(false)}
        almacenes={almacenesEjemplo}
      />
    </>
  );
}
