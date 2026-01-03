'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  RefreshCw,
  Gift,
  Percent,
  Star,
  Layers,
  FileText,
} from 'lucide-react';

// Components
import { AperturaCajaModal } from '@/components/caja/AperturaCajaModal';
import { CierreCajaModal } from '@/components/caja/CierreCajaModal';
import { MovimientoCajaModal } from '@/components/caja/MovimientoCajaModal';
import { CobroModal } from '@/components/ventas/CobroModal';
import { ConsultaStockModal } from '@/components/productos/ConsultaStockModal';
import { AjustesModal } from '@/components/config/AjustesModal';
import { HistorialTicketsModal } from '@/components/ventas/HistorialTicketsModal';
import { DescuentoModal } from '@/components/ventas/DescuentoModal';
import { CantidadModal } from '@/components/ventas/CantidadModal';
import { VentasAparcadasModal } from '@/components/ventas/VentasAparcadasModal';
import { VariantesModal } from '@/components/productos/VariantesModal';
import { KitModal } from '@/components/productos/KitModal';
import { SelectClienteModal, type ClienteSeleccionado } from '@/components/ventas/SelectClienteModal';
import { PinVerificacionModal } from '@/components/ventas/PinVerificacionModal';
import { CobroVencimientosModal } from '@/components/ventas/CobroVencimientosModal';
import { Button } from '@/components/ui/Button';
import ActivacionTPV from '@/components/auth/ActivacionTPV';
import LoginPIN from '@/components/auth/LoginPIN';

// Stores
import { useAuthStore } from '@/stores/authStore';
import { useDataStore, type Producto as ProductoSync, type Variante } from '@/stores/dataStore';
import { useCajaStore } from '@/stores/cajaStore';
import { printerService } from '@/services/printer.service';
import { tpvApi } from '@/services/api';
import { useVentasAparcadasStore } from '@/stores/ventasAparcadasStore';
import { usePerfilStore } from '@/stores/perfilStore';

// Types
interface ComponenteKitLinea {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

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
  iva: number; // Porcentaje de IVA (21, 10, 4, 0)
  esKit?: boolean;
  componentesKit?: ComponenteKitLinea[];
}

interface Producto {
  id: string;
  codigo: string;
  codigoBarras?: string;
  sku?: string;
  nombre: string;
  precio: number;
  precioBase?: number;
  precioOrigen?: 'base' | 'tarifa' | 'oferta';
  tarifaNombre?: string;
  ofertaNombre?: string;
  descuentoOferta?: number;
  categoria?: string;
  imagen?: string;
  stock: number;
  tieneVariantes?: boolean;
  tipo?: string;
  esKit?: boolean;
}

interface ArqueoCaja {
  efectivo: number;
  tarjeta: number;
  otros: number;
  total: number;
}

// Componente Logo TPV - igual que web pero con distintivo TPV
function LogoTPV() {
  return (
    <div className="flex items-center gap-1">
      {/* Logo identico al web */}
      <svg
        width="180"
        height="48"
        viewBox="0 0 200 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-auto"
      >
        <style>{`
          @font-face {
            font-family: 'GameOfSquids';
            src: url('/fonts/GameOfSquids.woff2') format('woff2'),
                url('/fonts/GameOfSquids.woff') format('woff');
            font-weight: 700;
            font-style: bold;
          }
        `}</style>
        {/* Anillo exterior - O estilizada */}
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.15"/>
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="95 31" strokeLinecap="round"/>

        {/* Barras de datos ascendentes */}
        <rect x="14" y="28" width="4" height="10" rx="1.5" fill="currentColor"/>
        <rect x="20" y="23" width="4" height="15" rx="1.5" fill="currentColor"/>
        <rect x="26" y="18" width="4" height="20" rx="1.5" fill="currentColor"/>

        {/* Punto destacado (metrica/KPI) */}
        <circle cx="34" cy="15" r="3" fill="currentColor"/>

        {/* Texto Tralok - mismo alto que el icono */}
        <text x="54" y="38" fontFamily="GameOfSquids" fontSize="36" fontWeight="700" fill="currentColor" letterSpacing="1">Tralok</text>
      </svg>

      {/* Badge TPV separado */}
      <span className="px-2 py-1 bg-current/10 rounded-md text-sm font-bold">
        TPV
      </span>
    </div>
  );
}

export default function TPVPage() {
  // Auth Store
  const activado = useAuthStore((state) => state.activado);
  const logueado = useAuthStore((state) => state.logueado);
  const usuario = useAuthStore((state) => state.usuario);
  const tpvConfig = useAuthStore((state) => state.tpvConfig);
  const online = useAuthStore((state) => state.online);
  const logout = useAuthStore((state) => state.logout);
  const desactivarTPV = useAuthStore((state) => state.desactivarTPV);

  // Data Store - datos sincronizados reales
  const dataStore = useDataStore();
  const {
    productos: productosSync,
    familias,
    almacenes,
    empresaConfig,
    sincronizarDatos,
    sincronizando,
    obtenerStockProducto,
    calcularPrecioProducto,
    calcularPrecioConDetalles,
  } = dataStore;

  // Caja Store - persistencia automatica
  const cajaStore = useCajaStore();
  const cajaAbierta = cajaStore.estado === 'abierta';
  const cajaNombre = tpvConfig?.tpvNombre || cajaStore.nombre || 'Caja 1';

  // Ventas Aparcadas Store
  const aparcarVenta = useVentasAparcadasStore((state) => state.aparcarVenta);
  const contarVentasAparcadas = useVentasAparcadasStore((state) => state.contarVentas);
  const numVentasAparcadas = contarVentasAparcadas();

  // Perfil Store - ordenar familias y productos favoritos
  const {
    familias: familiasPerfil,
    esFamiliaVisible,
    getProductosDestacados,
    toggleProductoDestacado,
    esProductoDestacado,
  } = usePerfilStore();

  // Estado de la venta
  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null); // null = Todos
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteSeleccionado | null>(null);

  // Estado de sincronización
  const syncPendientes = useDataStore((state) => state.sincronizando ? 1 : 0);

  // Convertir productos sincronizados al formato de la UI
  const productosUI = useMemo(() => {
    return productosSync.map((p: any) => {
      // Calcular precio con detalles (tarifa/oferta)
      const precioInfo = calcularPrecioConDetalles(p, clienteSeleccionado?._id);
      // Detectar si es un kit (por tipo o por tener componentesKit)
      const esKit = p.tipo === 'compuesto' || (p.componentesKit && p.componentesKit.length > 0);
      return {
        id: p._id,
        codigo: p.sku || p.codigo || '',
        codigoBarras: p.codigoBarras || '',
        sku: p.sku || '',
        nombre: p.nombre,
        // Usar el precio final calculado (con tarifa/oferta aplicada)
        precio: precioInfo.precioFinal,
        precioBase: precioInfo.precioBase,
        precioOrigen: precioInfo.origen,
        tarifaNombre: precioInfo.tarifaNombre,
        ofertaNombre: precioInfo.ofertaNombre,
        descuentoOferta: precioInfo.descuentoOferta,
        categoria: p.familiaId || undefined,
        imagen: p.imagenes?.[0] || p.imagen,
        stock: obtenerStockProducto(p._id),
        // Info adicional para variantes y kits
        tieneVariantes: p.tieneVariantes || false,
        tipo: p.tipo || 'simple',
        esKit,
      };
    });
  }, [productosSync, obtenerStockProducto, calcularPrecioConDetalles, clienteSeleccionado]);

  // Obtener producto sync original por ID
  const getProductoSync = useCallback((id: string): ProductoSync | undefined => {
    return productosSync.find((p: any) => p._id === id);
  }, [productosSync]);

  // Categorias basadas en familias reales, filtradas y ordenadas por perfil
  const categoriasUI = useMemo(() => {
    // Obtener configuración del perfil para ordenar
    const getOrdenPerfil = (familiaId: string) => {
      const config = familiasPerfil.find((fp) => fp.familiaId === familiaId);
      return config ? config.orden : 999;
    };

    const cats = familias
      .filter((f) => !f.familiaId) // Solo familias padre
      .filter((f) => esFamiliaVisible(f._id)) // Filtrar por visibilidad del perfil
      .sort((a, b) => getOrdenPerfil(a._id) - getOrdenPerfil(b._id)) // Ordenar por perfil
      .map((f) => ({
        id: f._id,
        nombre: f.nombre,
        color: f.color,
      }));
    return cats;
  }, [familias, familiasPerfil, esFamiliaVisible]);

  // Productos favoritos/destacados
  const productosFavoritos = useMemo(() => {
    const favoritosIds = getProductosDestacados();
    return productosUI.filter((p) => favoritosIds.includes(p.id));
  }, [productosUI, getProductosDestacados]);

  // Modales
  const [showAperturaCaja, setShowAperturaCaja] = useState(false);
  const [showCierreCaja, setShowCierreCaja] = useState(false);
  const [showMovimientoCaja, setShowMovimientoCaja] = useState(false);
  const [showCobro, setShowCobro] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showAjustes, setShowAjustes] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [showDescuento, setShowDescuento] = useState(false);
  const [lineaDescuento, setLineaDescuento] = useState<LineaVenta | null>(null);
  const [showCantidad, setShowCantidad] = useState(false);
  const [lineaCantidad, setLineaCantidad] = useState<LineaVenta | null>(null);
  const [showVentasAparcadas, setShowVentasAparcadas] = useState(false);
  const [showVariantes, setShowVariantes] = useState(false);
  const [productoVariantes, setProductoVariantes] = useState<ProductoSync | null>(null);
  const [showKit, setShowKit] = useState(false);
  const [productoKit, setProductoKit] = useState<ProductoSync | null>(null);
  const [showCliente, setShowCliente] = useState(false);
  const [showPinVerificacion, setShowPinVerificacion] = useState(false);
  const [showVencimientos, setShowVencimientos] = useState(false);

  // Configuracion de ajustes del TPV
  const [tpvSettings, setTpvSettings] = useState<{ pinPorTicket: boolean }>({ pinPorTicket: false });

  // Cargar ajustes del TPV
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tpv_settings');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          setTpvSettings({ pinPorTicket: settings.pinPorTicket ?? false });
        } catch (e) {
          console.error('Error cargando ajustes:', e);
        }
      }
    }
  }, []);

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

  // Filtrar productos usando datos reales
  const productosFiltrados = useMemo(() => {
    const terminoBusqueda = busqueda.toLowerCase();

    // Si está en favoritos, mostrar solo los favoritos
    if (categoriaActiva === 'favoritos') {
      return productosFavoritos.filter((p) => {
        const matchBusqueda =
          !busqueda ||
          p.codigo.toLowerCase().includes(terminoBusqueda) ||
          p.nombre.toLowerCase().includes(terminoBusqueda) ||
          p.codigoBarras?.toLowerCase().includes(terminoBusqueda) ||
          p.sku?.toLowerCase().includes(terminoBusqueda);
        return matchBusqueda;
      });
    }

    return productosUI.filter((p) => {
      const matchBusqueda =
        !busqueda ||
        p.codigo.toLowerCase().includes(terminoBusqueda) ||
        p.nombre.toLowerCase().includes(terminoBusqueda) ||
        p.codigoBarras?.toLowerCase().includes(terminoBusqueda) ||
        p.sku?.toLowerCase().includes(terminoBusqueda);
      const matchCategoria = categoriaActiva === null || p.categoria === categoriaActiva;
      return matchBusqueda && matchCategoria;
    });
  }, [productosUI, busqueda, categoriaActiva, productosFavoritos]);

  // Acciones de venta
  const agregarProducto = useCallback((producto: Producto) => {
    // Si el producto tiene variantes, abrir modal de selección
    if (producto.tieneVariantes) {
      const productoCompleto = getProductoSync(producto.id);
      if (productoCompleto && productoCompleto.variantes && productoCompleto.variantes.length > 0) {
        setProductoVariantes(productoCompleto);
        setShowVariantes(true);
        return;
      }
    }

    // Si el producto es un kit/compuesto, verificar si tiene componentes opcionales
    const productoCompleto = getProductoSync(producto.id);
    if (productoCompleto && productoCompleto.componentesKit && productoCompleto.componentesKit.length > 0) {
      // Verificar si hay componentes opcionales
      const tieneOpcionales = productoCompleto.componentesKit.some((c: any) => c.opcional);

      if (tieneOpcionales) {
        // Tiene opcionales: abrir modal para seleccionar
        setProductoKit(productoCompleto);
        setShowKit(true);
        return;
      }

      // Pack simple (todos obligatorios): añadir directamente con componentes
      const productos = dataStore.productos;
      const componentesParaLinea = productoCompleto.componentesKit.map((comp: any) => {
        const prod = productos.find((p) => p._id === comp.productoId);
        return {
          productoId: comp.productoId,
          nombre: prod?.nombre || 'Componente',
          cantidad: comp.cantidad || 1,
          precioUnitario: comp.precioUnitario ?? prod?.precios?.venta ?? prod?.precioVenta ?? 0,
        };
      });

      // Calcular precio del kit (usar PVP - precio con IVA)
      const precioKit = productoCompleto.precios?.pvp ?? productoCompleto.precios?.venta ?? productoCompleto.precioVenta ?? 0;
      // Obtener IVA del producto (default 21%)
      const ivaKit = productoCompleto.impuestos?.iva ?? productoCompleto.iva ?? 21;

      setLineas((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          productoId: productoCompleto._id,
          codigo: productoCompleto.sku || productoCompleto.codigo,
          nombre: productoCompleto.nombre,
          cantidad: 1,
          precioUnitario: precioKit,
          descuento: 0,
          total: precioKit,
          iva: ivaKit,
          esKit: true,
          componentesKit: componentesParaLinea,
        },
      ]);
      return;
    }

    // Producto simple: agregar directamente
    // Obtener IVA del producto (default 21%)
    const productoParaIva = getProductoSync(producto.id);
    const ivaProducto = productoParaIva?.impuestos?.iva ?? productoParaIva?.iva ?? 21;
    agregarProductoSimple(producto.id, producto.codigo, producto.nombre, producto.precio, undefined, ivaProducto);
  }, [getProductoSync]);

  // Agregar producto simple (sin variantes)
  const agregarProductoSimple = useCallback((
    productoId: string,
    codigo: string,
    nombre: string,
    precio: number,
    varianteId?: string,
    iva: number = 21
  ) => {
    setLineas((prev) => {
      // Para productos con variante, buscar por productoId + varianteId
      const existente = prev.find((l) =>
        l.productoId === productoId &&
        (varianteId ? l.varianteId === varianteId : !l.varianteId)
      );

      if (existente) {
        return prev.map((l) =>
          l.id === existente.id
            ? { ...l, cantidad: l.cantidad + 1, total: (l.cantidad + 1) * l.precioUnitario }
            : l
        );
      }

      return [
        ...prev,
        {
          id: Date.now().toString(),
          productoId,
          varianteId,
          codigo,
          nombre,
          cantidad: 1,
          precioUnitario: precio,
          descuento: 0,
          total: precio,
          iva,
        },
      ];
    });
  }, []);

  // Handler para cuando se selecciona una variante
  const handleSeleccionarVariante = useCallback((variante: Variante, producto: ProductoSync) => {
    // Determinar el precio de la variante (usar PVP - precio con IVA)
    let precio = variante.precios.pvp ?? variante.precios.venta ?? 0;
    if (variante.precios.usarPrecioBase) {
      precio = producto.precios?.pvp ?? producto.precios?.venta ?? producto.precioVenta ?? 0;
    }

    // Crear nombre con la combinación
    const combinacionStr = Object.entries(variante.combinacion)
      .map(([, valor]) => valor)
      .join(' / ');
    const nombreCompleto = `${producto.nombre} (${combinacionStr})`;

    // Obtener IVA del producto (default 21%)
    const ivaProducto = (producto as any).impuestos?.iva ?? (producto as any).iva ?? 21;
    agregarProductoSimple(producto._id, variante.sku, nombreCompleto, precio, variante._id, ivaProducto);
  }, [agregarProductoSimple]);

  // Handler para cuando se confirma un kit
  const handleConfirmarKit = useCallback((componentes: any[], precioTotal: number) => {
    if (!productoKit) return;

    // Preparar los componentes para mostrar en el ticket
    const componentesParaLinea: ComponenteKitLinea[] = componentes.map((comp) => ({
      productoId: comp.productoId,
      nombre: comp.producto?.nombre || 'Componente',
      cantidad: comp.cantidadSeleccionada,
      precioUnitario: comp.precioUnitario ?? comp.producto?.precios?.venta ?? comp.producto?.precioVenta ?? 0,
    }));

    // Obtener IVA del kit (default 21%)
    const ivaKit = productoKit.impuestos?.iva ?? productoKit.iva ?? 21;

    // Agregar el kit como una línea con sus componentes
    setLineas((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        productoId: productoKit._id,
        codigo: productoKit.sku || productoKit.codigo,
        nombre: productoKit.nombre,
        cantidad: 1,
        precioUnitario: precioTotal,
        descuento: 0,
        total: precioTotal,
        iva: ivaKit,
        esKit: true,
        componentesKit: componentesParaLinea,
      },
    ]);
  }, [productoKit]);

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
    setClienteSeleccionado(null);
  };

  // Aparcar venta actual
  const handleAparcarVenta = () => {
    // Si no hay líneas pero hay ventas aparcadas, mostrar modal de ventas aparcadas
    if (lineas.length === 0) {
      if (numVentasAparcadas > 0) {
        setShowVentasAparcadas(true);
      }
      return;
    }

    aparcarVenta({
      lineas,
      subtotal,
      descuento,
      total,
      usuarioId: usuario?.id || '',
      usuarioNombre: usuario?.nombre || 'Usuario',
    });

    // Limpiar venta actual
    limpiarVenta();
  };

  // Recuperar venta aparcada
  const handleRecuperarVenta = (venta: {
    lineas: LineaVenta[];
    clienteId?: string;
    clienteNombre?: string;
  }) => {
    // Si hay lineas actuales, preguntar si quiere fusionarlas o reemplazarlas
    if (lineas.length > 0) {
      if (confirm('Ya hay productos en la venta actual. ¿Reemplazar?')) {
        setLineas(venta.lineas);
      } else {
        // Fusionar lineas
        setLineas((prev) => [...prev, ...venta.lineas]);
      }
    } else {
      setLineas(venta.lineas);
    }
  };

  // Imprimir ticket (proforma sin cobrar)
  const handleImprimirTicket = () => {
    if (lineas.length === 0) return;

    // Generar contenido del ticket para imprimir
    const ticketWindow = window.open('', '_blank', 'width=300,height=600');
    if (!ticketWindow) {
      alert('Por favor, permite las ventanas emergentes para imprimir');
      return;
    }

    const fechaHora = new Date().toLocaleString('es-ES');
    const lineasHTML = lineas.map((l) => `
      <tr>
        <td style="text-align: left;">${l.nombre}</td>
        <td style="text-align: center;">${l.cantidad}</td>
        <td style="text-align: right;">${l.precioUnitario.toFixed(2)}</td>
        <td style="text-align: right;">${l.total.toFixed(2)}</td>
      </tr>
      ${l.descuento > 0 ? `<tr><td colspan="4" style="text-align: right; font-size: 10px; color: green;">Dto: -${l.descuento.toFixed(2)} EUR</td></tr>` : ''}
    `).join('');

    ticketWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket Proforma</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .logo { font-size: 18px; font-weight: bold; }
          .proforma { background: #ffe0e0; padding: 5px; text-align: center; font-weight: bold; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; border-bottom: 1px solid #000; padding: 3px 0; }
          td { padding: 3px 0; }
          .totales { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; }
          .total-final { font-size: 16px; font-weight: bold; }
          .footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; font-size: 10px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${tpvConfig?.empresaNombre || 'Empresa'}</div>
          <div>${cajaNombre}</div>
          <div>${fechaHora}</div>
        </div>
        <div class="proforma">** PROFORMA - SIN VALOR FISCAL **</div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Ud</th>
              <th>PVP</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${lineasHTML}
          </tbody>
        </table>
        <div class="totales">
          <div>Subtotal: ${subtotal.toFixed(2)} EUR</div>
          ${descuento > 0 ? `<div style="color: green;">Descuento: -${descuento.toFixed(2)} EUR</div>` : ''}
          <div class="total-final">TOTAL: ${total.toFixed(2)} EUR</div>
        </div>
        <div class="footer">
          <p>Este documento es una proforma</p>
          <p>No tiene valor fiscal</p>
          <p>Gracias por su visita</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    ticketWindow.document.close();
  };

  // Abrir modal de descuento
  const abrirDescuento = (linea: LineaVenta) => {
    setLineaDescuento(linea);
    setShowDescuento(true);
  };

  // Aplicar descuento a linea
  const handleAplicarDescuento = (porcentaje: number) => {
    if (!lineaDescuento) return;

    setLineas(lineas.map((l) => {
      if (l.id === lineaDescuento.id) {
        const descuentoImporte = (l.precioUnitario * l.cantidad * porcentaje) / 100;
        return {
          ...l,
          descuento: descuentoImporte,
          total: l.precioUnitario * l.cantidad - descuentoImporte,
        };
      }
      return l;
    }));

    setShowDescuento(false);
    setLineaDescuento(null);
  };

  // Abrir modal de cantidad
  const abrirCantidad = (linea: LineaVenta) => {
    setLineaCantidad(linea);
    setShowCantidad(true);
  };

  // Cambiar cantidad de linea
  const handleCambiarCantidad = (nuevaCantidad: number) => {
    if (!lineaCantidad) return;

    setLineas(lineas.map((l) => {
      if (l.id === lineaCantidad.id) {
        const total = nuevaCantidad * l.precioUnitario;
        const descuentoPorcentaje = l.descuento / (l.precioUnitario * l.cantidad);
        const nuevoDescuento = total * descuentoPorcentaje;
        return {
          ...l,
          cantidad: nuevaCantidad,
          descuento: nuevoDescuento,
          total: total - nuevoDescuento,
        };
      }
      return l;
    }).filter((l) => l.cantidad > 0));

    setShowCantidad(false);
    setLineaCantidad(null);
  };

  // Cambiar precio de linea (si esta permitido)
  const handleCambiarPrecio = (nuevoPrecio: number) => {
    if (!lineaCantidad || !tpvConfig?.permitirPrecioManual) return;

    setLineas(lineas.map((l) => {
      if (l.id === lineaCantidad.id) {
        const total = l.cantidad * nuevoPrecio;
        const descuentoPorcentaje = l.descuento / (l.precioUnitario * l.cantidad);
        const nuevoDescuento = total * descuentoPorcentaje;
        return {
          ...l,
          precioUnitario: nuevoPrecio,
          descuento: nuevoDescuento,
          total: total - nuevoDescuento,
        };
      }
      return l;
    }));

    setShowCantidad(false);
    setLineaCantidad(null);
  };

  // Acciones de caja - usando cajaStore para persistencia
  const handleAbrirCaja = (importe: number) => {
    cajaStore.abrirCaja({
      usuarioId: usuario?.id || '',
      usuarioNombre: usuario?.nombre || 'Usuario',
      importeInicial: importe,
    });
    setShowAperturaCaja(false);
  };

  const handleCerrarCaja = (arqueoReal: ArqueoCaja, observaciones: string) => {
    const resultado = cajaStore.cerrarCaja({
      usuarioId: usuario?.id || '',
      usuarioNombre: usuario?.nombre || 'Usuario',
      arqueoReal,
      observaciones,
    });
    console.log('Cierre de caja:', { arqueoReal, observaciones, resultado });
    setShowCierreCaja(false);
  };

  const handleMovimientoCaja = (tipo: 'entrada' | 'salida', importe: number, descripcion: string) => {
    cajaStore.registrarMovimiento({
      tipo,
      importe,
      descripcion,
      usuarioId: usuario?.id || '',
      usuarioNombre: usuario?.nombre || 'Usuario',
    });
    setShowMovimientoCaja(false);
  };

  const handleCobro = async (
    pagos: Array<{ metodo: string; importe: number }>,
    cambio: number,
    opciones: { esTicketRegalo?: boolean; imprimir?: boolean }
  ) => {
    // Datos del ticket para enviar al servidor
    const ticketData = {
      clienteId: clienteSeleccionado?._id,
      clienteNombre: clienteSeleccionado?.nombre,
      clienteNif: clienteSeleccionado?.nif,
      lineas: lineas.map(l => ({
        productoId: l.productoId,
        varianteId: l.varianteId,
        codigo: l.codigo,
        nombre: l.nombre,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        descuento: l.descuento,
        iva: l.iva || 21,
        esKit: l.esKit,
        componentesKit: l.componentesKit?.map(c => ({
          productoId: c.productoId,
          nombre: c.nombre,
          cantidad: c.cantidad,
        })),
      })),
      subtotal,
      descuentoTotal: descuento,
      total,
      pagos: pagos.map(p => ({
        metodo: p.metodo as 'efectivo' | 'tarjeta' | 'bizum' | 'transferencia',
        importe: p.importe,
      })),
      cambio,
      usuarioId: usuario?.id || '',
      usuarioNombre: usuario?.nombre || 'Usuario',
      esTicketRegalo: opciones.esTicketRegalo,
    };

    // Intentar crear ticket en el servidor (si online)
    let ticketServidor: {
      ok: boolean;
      ticketId?: string;
      codigo?: string;
      serie?: string;
      numero?: number;
      fecha?: string;
      verifactu?: {
        hash: string;
        hashAnterior?: string;
        urlQR: string;
        datosQR: string;
      };
    } | null = null;

    if (online) {
      try {
        ticketServidor = await tpvApi.crearTicket(ticketData);
        console.log('[TPV] Ticket creado en servidor:', ticketServidor);
      } catch (error) {
        console.error('[TPV] Error al crear ticket en servidor:', error);
        // TODO: Guardar en cola offline para sincronizar después
      }
    }

    // Usar datos del servidor si están disponibles, sino generar localmente
    const ventaId = ticketServidor?.ticketId || Date.now().toString();
    const numeroTicket = ticketServidor?.codigo || `${tpvConfig?.serieFactura || 'FS'}${new Date().getFullYear()}-${ventaId.slice(-5).padStart(5, '0')}`;
    const serieTicket = ticketServidor?.serie || tpvConfig?.serieFactura || 'FS';

    // Registrar cada pago en la caja local
    pagos.forEach((pago) => {
      const metodoPago = pago.metodo === 'efectivo' ? 'efectivo' :
                         pago.metodo === 'tarjeta' ? 'tarjeta' :
                         pago.metodo === 'bizum' ? 'bizum' : 'transferencia';

      // Para efectivo, descontar el cambio
      const importeReal = pago.metodo === 'efectivo' ? pago.importe - cambio : pago.importe;

      if (importeReal > 0) {
        cajaStore.registrarVenta({
          ventaId,
          importe: importeReal,
          metodoPago,
          usuarioId: usuario?.id || '',
          usuarioNombre: usuario?.nombre || 'Usuario',
        });
      }
    });

    // Imprimir si se solicita
    if (opciones.imprimir) {
      // Calcular desglose de IVA real por tipo
      const ivaMap = new Map<number, { base: number; cuota: number }>();
      lineas.forEach(l => {
        const ivaLinea = l.iva || 21;
        const totalLinea = l.total;
        const baseLinea = totalLinea / (1 + ivaLinea / 100);
        const cuotaLinea = totalLinea - baseLinea;

        if (ivaMap.has(ivaLinea)) {
          const actual = ivaMap.get(ivaLinea)!;
          ivaMap.set(ivaLinea, {
            base: actual.base + baseLinea,
            cuota: actual.cuota + cuotaLinea,
          });
        } else {
          ivaMap.set(ivaLinea, { base: baseLinea, cuota: cuotaLinea });
        }
      });

      const impuestos = Array.from(ivaMap.entries()).map(([porcentaje, valores]) => ({
        nombre: porcentaje === 0 ? 'Exento' : `IVA ${porcentaje}%`,
        porcentaje,
        base: Number(valores.base.toFixed(2)),
        cuota: Number(valores.cuota.toFixed(2)),
      }));

      // Preparar datos para impresión
      const datosTicket = {
        empresa: {
          nombre: empresaConfig?.empresaNombre || tpvConfig?.empresaNombre || 'Empresa',
          nombreComercial: empresaConfig?.empresaNombreComercial,
          nif: empresaConfig?.empresaCif || '',
          direccion: empresaConfig?.empresaDireccion || '',
          telefono: empresaConfig?.empresaTelefono,
          email: empresaConfig?.empresaEmail,
          textoLOPD: empresaConfig?.textoLOPD,
        },
        numero: numeroTicket,
        serie: serieTicket,
        fecha: ticketServidor?.fecha ? new Date(ticketServidor.fecha) : new Date(),
        cajaNombre,
        vendedorNombre: usuario?.nombre || 'Usuario',
        clienteNombre: clienteSeleccionado?.nombre,
        clienteNif: clienteSeleccionado?.nif,
        lineas: lineas.map(l => ({
          codigo: l.codigo,
          nombre: l.nombre,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          descuento: l.descuento,
          total: l.total,
          iva: l.iva || 21,
          esKit: l.esKit,
          componentesKit: l.componentesKit?.map(c => ({
            nombre: c.nombre,
            cantidad: c.cantidad,
          })),
        })),
        subtotal,
        descuento,
        impuestos,
        total,
        pagos,
        cambio,
        // Datos Verifactu reales del servidor
        verifactu: ticketServidor?.verifactu ? {
          hash: ticketServidor.verifactu.hash,
          urlQR: ticketServidor.verifactu.urlQR,
          datosQR: ticketServidor.verifactu.datosQR,
          generarQR: true,
        } : undefined,
        esTicketRegalo: opciones.esTicketRegalo,
      };

      // Imprimir usando el navegador (fallback hasta tener impresora térmica)
      printerService.printBrowser(datosTicket);
    }

    // Limpiar venta
    limpiarVenta();
    setShowCobro(false);

    console.log('Venta completada:', {
      pagos,
      cambio,
      total,
      opciones,
      ticketId: ventaId,
      ticketNumero: numeroTicket,
      guardadoEnServidor: !!ticketServidor?.ok,
    });
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
        // Buscar producto por código en datos reales
        const producto = productosUI.find((p) => p.codigo === buffer);
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
  }, [agregarProducto, productosUI]);

  // Arqueo teórico desde cajaStore
  const arqueoTeorico = cajaStore.getArqueoTeorico();

  // ===== FLUJO DE AUTENTICACION =====

  // 1. Si el TPV no está activado, mostrar pantalla de activación
  if (!activado) {
    return <ActivacionTPV onActivado={() => {}} />;
  }

  // 2. Si no hay usuario logueado, mostrar pantalla de login con PIN
  if (!logueado) {
    return (
      <LoginPIN
        onLogin={() => {}}
        onCambiarTPV={desactivarTPV}
      />
    );
  }

  // ===== FLUJO NORMAL DEL TPV =====

  // Si la caja no está abierta
  if (!cajaAbierta) {
    return (
      <>
        <div className="h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
            <div className="flex justify-center mb-6 text-primary-600">
              <LogoTPV />
            </div>
            <p className="text-gray-500 mb-2">{cajaNombre}</p>
            <p className="text-sm text-gray-400 mb-1">Usuario: {usuario?.nombre}</p>
            <p className="text-gray-600 mb-8">La caja está cerrada. Ábrela para comenzar a operar.</p>

            <div className="space-y-3">
              <Button
                variant="primary"
                size="xl"
                className="w-full"
                onClick={() => setShowAperturaCaja(true)}
              >
                Abrir Caja
              </Button>

              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => sincronizarDatos(true)}
                disabled={sincronizando}
                icon={<RefreshCw className={`w-5 h-5 ${sincronizando ? 'animate-spin' : ''}`} />}
              >
                {sincronizando ? 'Sincronizando...' : 'Sincronizar Datos'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-500"
                onClick={logout}
              >
                Cerrar Sesión
              </Button>
            </div>
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
          <div className="flex items-center gap-4 text-primary-600">
            <LogoTPV />
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
                online ? 'bg-green-100' : 'bg-amber-100'
              }`}
            >
              {online ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  online ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                {online ? 'Online' : `Offline (${syncPendientes})`}
              </span>
            </div>

            {/* Usuario actual */}
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {usuario?.nombre || 'Usuario'}
              </span>
            </div>

            {/* Botones de acción rápida */}
            <Button variant="ghost" size="sm" onClick={() => setShowStock(true)} title="Consultar Stock">
              <Package className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowMovimientoCaja(true)} title="Movimientos de Caja">
              <ArrowLeftRight className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowHistorial(true)} title="Historial de Tickets">
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowVencimientos(true)} title="Cobrar/Pagar Facturas">
              <FileText className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAjustes(true)} title="Ajustes">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowCierreCaja(true)} title="Cerrar Caja">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Panel Izquierdo - Productos */}
          <div className="flex-1 flex flex-col p-4">
            {/* Banner de Ventas Aparcadas */}
            {numVentasAparcadas > 0 && (
              <button
                onClick={() => setShowVentasAparcadas(true)}
                className="mb-3 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-amber-800">
                      {numVentasAparcadas} venta{numVentasAparcadas > 1 ? 's' : ''} aparcada{numVentasAparcadas > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-amber-600">Pulsa para recuperar</p>
                  </div>
                </div>
                <div className="text-amber-500">→</div>
              </button>
            )}

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
              {/* Todos */}
              <button
                onClick={() => setCategoriaActiva(null)}
                className={`btn-touch whitespace-nowrap ${
                  categoriaActiva === null
                    ? 'bg-primary-500 text-white'
                    : 'bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50'
                }`}
              >
                Todos
              </button>
              {/* Favoritos (si hay) */}
              {productosFavoritos.length > 0 && (
                <button
                  onClick={() => setCategoriaActiva('favoritos')}
                  className={`btn-touch whitespace-nowrap flex items-center gap-1 ${
                    categoriaActiva === 'favoritos'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 border border-amber-200 hover:border-amber-400 hover:bg-amber-100 text-amber-700'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Favoritos
                </button>
              )}
              {/* Familias reales */}
              {categoriasUI.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaActiva(cat.id)}
                  className={`btn-touch whitespace-nowrap ${
                    categoriaActiva === cat.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50'
                  }`}
                  style={cat.color && categoriaActiva !== cat.id ? { borderColor: cat.color } : undefined}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            {/* Grid de productos */}
            <div className="flex-1 overflow-y-auto custom-scroll">
              <div className="product-grid">
                {productosFiltrados.map((producto) => {
                  const esFavorito = esProductoDestacado(producto.id);
                  const tienePrecioEspecial = producto.precioOrigen && producto.precioOrigen !== 'base';
                  return (
                    <button
                      key={producto.id}
                      onClick={() => agregarProducto(producto)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleProductoDestacado(producto.id);
                      }}
                      className="product-card hover:border-primary-500 hover:shadow-md relative"
                      title="Click derecho para añadir/quitar de favoritos"
                    >
                      {/* Indicador de favorito */}
                      {esFavorito && (
                        <Star className="absolute top-1 left-1 w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                      {/* Indicador de variantes */}
                      {producto.tieneVariantes && (
                        <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded">
                          Variantes
                        </span>
                      )}
                      {/* Indicador de kit */}
                      {producto.esKit && !producto.tieneVariantes && (
                        <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-medium rounded">
                          Kit
                        </span>
                      )}
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className="text-sm font-medium text-center line-clamp-2">
                        {producto.nombre}
                      </span>
                      {/* Precio con indicador de origen */}
                      <div className="flex flex-col items-center">
                        {/* Si tiene precio especial, mostrar precio base tachado */}
                        {tienePrecioEspecial && producto.precioBase && producto.precioBase !== producto.precio && (
                          <span className="text-xs text-gray-400 line-through">
                            {producto.precioBase.toFixed(2)} EUR
                          </span>
                        )}
                        <span className={`text-lg font-bold ${tienePrecioEspecial ? 'text-green-600' : 'text-primary-600'}`}>
                          {producto.precio.toFixed(2)} EUR
                        </span>
                        {/* Badge de tarifa u oferta */}
                        {producto.precioOrigen === 'tarifa' && producto.tarifaNombre && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded mt-0.5" title={producto.tarifaNombre}>
                            Tarifa: {producto.tarifaNombre.length > 10 ? producto.tarifaNombre.substring(0, 10) + '...' : producto.tarifaNombre}
                          </span>
                        )}
                        {producto.precioOrigen === 'oferta' && producto.ofertaNombre && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded mt-0.5" title={`${producto.ofertaNombre} (-${producto.descuentoOferta}%)`}>
                            {producto.descuentoOferta}% dto
                          </span>
                        )}
                      </div>
                      {producto.stock < 20 && (
                        <span className="text-xs text-amber-600">Stock: {producto.stock}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel Derecho - Ticket */}
          <div className="w-[360px] bg-white border-l flex flex-col shadow-lg">
            {/* Cliente */}
            <div className="p-3 border-b bg-gray-50">
              <button
                onClick={() => setShowCliente(true)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  clienteSeleccionado ? 'bg-blue-100' : 'bg-gray-200'
                }`}>
                  <User className={`w-5 h-5 ${clienteSeleccionado ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className={`font-medium ${clienteSeleccionado ? 'text-blue-700' : ''}`}>
                    {clienteSeleccionado ? clienteSeleccionado.nombre : 'Público general'}
                  </p>
                  {clienteSeleccionado?.nif && (
                    <p className="text-xs text-gray-400">{clienteSeleccionado.nif}</p>
                  )}
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
                  <div key={linea.id} className="bg-white border border-gray-100 rounded-lg p-2 mb-2 hover:border-gray-300 transition-colors">
                    {/* Fila superior: nombre completo del producto */}
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0 pr-2">
                        <div
                          className="font-medium text-sm text-gray-800 break-words flex items-center gap-1 cursor-help"
                          title={
                            linea.esKit && linea.componentesKit && linea.componentesKit.length > 0
                              ? `${linea.nombre}\n\nIncluye:\n${linea.componentesKit.map(c => `  • ${c.cantidad > 1 ? c.cantidad + 'x ' : ''}${c.nombre}`).join('\n')}`
                              : linea.nombre
                          }
                        >
                          {linea.esKit && (
                            <Layers className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          )}
                          {linea.nombre}
                        </div>
                        <div className="text-xs text-gray-400">
                          {linea.codigo}
                          {linea.esKit && linea.componentesKit && linea.componentesKit.length > 0 && (
                            <span
                              className="ml-1 text-orange-500 cursor-help"
                              title={`Contiene: ${linea.componentesKit.map(c => `${c.cantidad > 1 ? c.cantidad + 'x ' : ''}${c.nombre}`).join(', ')}`}
                            >
                              ({linea.componentesKit.length} productos)
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => eliminarLinea(linea.id)}
                        className="w-6 h-6 rounded text-red-400 flex items-center justify-center hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Fila inferior: cantidad, precio, total */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => modificarCantidad(linea.id, -1)}
                          className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => abrirCantidad(linea)}
                          className="w-10 h-7 text-center font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer text-sm"
                          title="Click para cambiar cantidad"
                        >
                          {linea.cantidad}
                        </button>
                        <button
                          onClick={() => modificarCantidad(linea.id, 1)}
                          className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-xs text-gray-500 ml-1">
                          x {linea.precioUnitario.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirDescuento(linea)}
                          className={`w-6 h-6 rounded flex items-center justify-center ${
                            linea.descuento > 0
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title="Aplicar descuento"
                        >
                          <Percent className="w-3 h-3" />
                        </button>
                        <div className="text-right min-w-[60px]">
                          {linea.descuento > 0 && (
                            <div className="text-[10px] text-gray-400 line-through">
                              {(linea.precioUnitario * linea.cantidad).toFixed(2)}
                            </div>
                          )}
                          <div className="font-bold text-sm">{linea.total.toFixed(2)} EUR</div>
                        </div>
                      </div>
                    </div>
                    {/* Mostrar descuento aplicado */}
                    {linea.descuento > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        Descuento: -{linea.descuento.toFixed(2)} EUR ({((linea.descuento / (linea.precioUnitario * linea.cantidad)) * 100).toFixed(0)}%)
                      </div>
                    )}
                    {/* Mostrar componentes del kit */}
                    {linea.esKit && linea.componentesKit && linea.componentesKit.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed border-orange-200 bg-orange-50/50 -mx-2 -mb-2 px-2 pb-2 rounded-b-lg">
                        <div className="text-[10px] font-medium text-orange-600 mb-1 uppercase">
                          Incluye:
                        </div>
                        {linea.componentesKit.map((comp, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-gray-600 py-0.5">
                            <span className="flex items-center gap-1">
                              <span className="text-orange-400">•</span>
                              {comp.cantidad > 1 && <span className="font-medium">{comp.cantidad}x</span>}
                              {comp.nombre}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
                disabled={lineas.length === 0 && numVentasAparcadas === 0}
                onClick={handleAparcarVenta}
                icon={<RotateCcw className="w-5 h-5" />}
                className="relative"
              >
                {lineas.length === 0 && numVentasAparcadas > 0 ? 'Ver Aparcadas' : 'Aparcar'}
                {numVentasAparcadas > 0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowVentasAparcadas(true);
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold cursor-pointer hover:bg-amber-600"
                    title="Ver ventas aparcadas"
                  >
                    {numVentasAparcadas}
                  </span>
                )}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                disabled={lineas.length === 0}
                onClick={handleImprimirTicket}
                icon={<Printer className="w-5 h-5" />}
              >
                Ticket
              </Button>
              <Button
                variant="success"
                size="xl"
                className="col-span-3 h-16 text-xl"
                onClick={() => {
                  if (tpvSettings.pinPorTicket) {
                    setShowPinVerificacion(true);
                  } else {
                    setShowCobro(true);
                  }
                }}
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
        numeroVentas={cajaStore.numeroVentas}
        totalVentas={cajaStore.totalVentas}
      />

      <MovimientoCajaModal
        isOpen={showMovimientoCaja}
        onClose={() => setShowMovimientoCaja(false)}
        onConfirm={handleMovimientoCaja}
        efectivoActual={cajaStore.totalEfectivo}
      />

      <CobroModal
        isOpen={showCobro}
        onClose={() => setShowCobro(false)}
        onConfirm={handleCobro}
        total={total}
      />

      <PinVerificacionModal
        isOpen={showPinVerificacion}
        onClose={() => setShowPinVerificacion(false)}
        onSuccess={(usuarioVerificado) => {
          setShowPinVerificacion(false);
          // PIN correcto, abrir modal de cobro
          setShowCobro(true);
          console.log('PIN verificado para:', usuarioVerificado.nombre);
        }}
        mensaje="Introduce tu PIN para realizar el cobro"
      />

      <ConsultaStockModal
        isOpen={showStock}
        onClose={() => setShowStock(false)}
        almacenes={almacenes.map((a) => ({ id: a._id, nombre: a.nombre }))}
      />

      <AjustesModal
        isOpen={showAjustes}
        onClose={() => setShowAjustes(false)}
      />

      <HistorialTicketsModal
        isOpen={showHistorial}
        onClose={() => setShowHistorial(false)}
      />

      <DescuentoModal
        isOpen={showDescuento}
        onClose={() => {
          setShowDescuento(false);
          setLineaDescuento(null);
        }}
        onConfirm={handleAplicarDescuento}
        lineaNombre={lineaDescuento?.nombre || ''}
        descuentoActual={
          lineaDescuento
            ? (lineaDescuento.descuento / (lineaDescuento.precioUnitario * lineaDescuento.cantidad)) * 100
            : 0
        }
        maxDescuento={tpvConfig?.descuentoMaximo || 100}
      />

      <CantidadModal
        isOpen={showCantidad}
        onClose={() => {
          setShowCantidad(false);
          setLineaCantidad(null);
        }}
        onConfirm={handleCambiarCantidad}
        productoNombre={lineaCantidad?.nombre || ''}
        cantidadActual={lineaCantidad?.cantidad || 1}
        permiteCambiarPrecio={tpvConfig?.permitirPrecioManual}
        precioActual={lineaCantidad?.precioUnitario || 0}
        onCambiarPrecio={handleCambiarPrecio}
      />

      <VentasAparcadasModal
        isOpen={showVentasAparcadas}
        onClose={() => setShowVentasAparcadas(false)}
        onRecuperar={handleRecuperarVenta}
      />

      <VariantesModal
        isOpen={showVariantes}
        onClose={() => {
          setShowVariantes(false);
          setProductoVariantes(null);
        }}
        onSeleccionar={handleSeleccionarVariante}
        producto={productoVariantes}
        almacenId={tpvConfig?.almacenId}
      />

      <KitModal
        isOpen={showKit}
        onClose={() => {
          setShowKit(false);
          setProductoKit(null);
        }}
        onConfirmar={handleConfirmarKit}
        producto={productoKit}
        productos={productosSync}
      />

      {/* Modal Seleccionar Cliente */}
      <SelectClienteModal
        isOpen={showCliente}
        onClose={() => setShowCliente(false)}
        onSelect={setClienteSeleccionado}
        clienteActual={clienteSeleccionado}
      />

      {/* Modal Cobro Vencimientos */}
      <CobroVencimientosModal
        isOpen={showVencimientos}
        onClose={() => setShowVencimientos(false)}
        tipo="todos"
      />
    </>
  );
}
