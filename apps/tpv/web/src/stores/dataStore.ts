// ===========================================
// STORE DE DATOS SINCRONIZADOS TPV
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tpvApi } from '../services/api';

// Tipos de datos

// Atributos de variante (Talla, Color, etc.)
interface ValorAtributo {
  valor: string;
  hexColor?: string;
  activo: boolean;
}

interface Atributo {
  nombre: string;
  valores: ValorAtributo[];
  tipoVisualizacion: 'botones' | 'dropdown' | 'colores';
  obligatorio: boolean;
}

// Variante específica
interface Variante {
  _id: string;
  sku: string;
  codigoBarras?: string;
  combinacion: Record<string, string>; // { talla: "M", color: "Rojo" }
  precios: {
    compra: number;
    venta: number;
    pvp: number;
    usarPrecioBase?: boolean;
  };
  stockPorAlmacen: Array<{
    almacenId: string;
    cantidad: number;
  }>;
  imagenes?: string[];
  activo: boolean;
}

// Componente de kit
interface ComponenteKit {
  productoId: string;
  cantidad: number;
  opcional: boolean;
  orden: number;
  precioUnitario?: number;
  descuentoPorcentaje?: number;
}

interface Producto {
  _id: string;
  codigo: string;
  sku?: string;
  nombre: string;
  descripcion?: string;
  familiaId?: string;
  tipoImpuestoId: string;
  precioVenta: number;
  precios?: {
    compra: number;
    venta: number;
    pvp: number;
  };
  codigoBarras?: string;
  imagen?: string;
  imagenes?: string[];
  unidadMedida: string;
  ventaPorPeso?: boolean;
  stockMinimo?: number;
  controlStock?: boolean;
  gestionaStock?: boolean;
  // Tipo de producto
  tipo?: 'simple' | 'variantes' | 'compuesto' | 'servicio' | 'materia_prima';
  // Variantes
  tieneVariantes?: boolean;
  atributos?: Atributo[];
  variantes?: Variante[];
  // Kit/Compuesto
  componentesKit?: ComponenteKit[];
  // TPV
  permiteDescuento?: boolean;
  precioModificable?: boolean;
}

interface Familia {
  _id: string;
  codigo: string;
  nombre: string;
  color?: string;
  orden?: number;
  familiaId?: string; // Padre
  imagen?: string;
}

interface Cliente {
  _id: string;
  codigo: string;
  nombre: string;
  nombreComercial?: string;
  nif?: string;
  telefono?: string;
  email?: string;
  direccion?: any;
  tarifaId?: string;
  formaPagoId?: string;
}

interface TipoImpuesto {
  _id: string;
  codigo: string;
  nombre: string;
  porcentaje: number;
  tipo: string;
}

interface FormaPago {
  _id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  requiereCambio?: boolean;
  abreCajon?: boolean;
}

interface Almacen {
  _id: string;
  codigo: string;
  nombre: string;
  direccion?: any;
}

interface Tarifa {
  _id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  porcentajeModificacion?: number;
  redondeo?: number;
  precios?: any[];
}

interface Oferta {
  _id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  descuento: number;
  productos?: string[];
  familias?: string[];
  fechaInicio: Date;
  fechaFin?: Date;
  prioridad?: number;
}

interface UsuarioTPV {
  _id: string;
  nombre: string;
  apellidos: string;
  rol: string;
  permisos: any;
}

interface StockItem {
  productoId: string;
  stock: number;
}

// Configuración de empresa para tickets
interface EmpresaConfig {
  empresaNombre: string;
  empresaNombreComercial?: string;
  empresaCif: string;
  empresaTelefono?: string;
  empresaEmail?: string;
  empresaDireccion: string;
  textoLOPD?: string;
  condicionesVenta?: string;
  verifactu?: {
    entorno: 'test' | 'production';
    generarQR: boolean;
    sistemaFiscal?: string;
  } | null;
}

interface DataState {
  // Datos sincronizados
  productos: Producto[];
  // Configuración de empresa
  empresaConfig: EmpresaConfig | null;
  familias: Familia[];
  clientes: Cliente[];
  tiposImpuesto: TipoImpuesto[];
  formasPago: FormaPago[];
  almacenes: Almacen[];
  tarifas: Tarifa[];
  ofertas: Oferta[];
  usuarios: UsuarioTPV[];
  stock: StockItem[];

  // Metadata
  ultimaSync: Date | null;
  sincronizando: boolean;
  errorSync: string | null;

  // Acciones
  sincronizarDatos: (incremental?: boolean) => Promise<boolean>;
  actualizarStock: (productosIds?: string[]) => Promise<void>;
  limpiarDatos: () => void;

  // Buscadores
  buscarProducto: (termino: string) => Producto[];
  buscarProductoPorCodigo: (codigo: string) => Producto | undefined;
  buscarCliente: (termino: string) => Cliente[];
  obtenerFamilia: (id: string) => Familia | undefined;
  obtenerTipoImpuesto: (id: string) => TipoImpuesto | undefined;
  obtenerFormaPago: (id: string) => FormaPago | undefined;
  obtenerStockProducto: (productoId: string) => number;
  calcularPrecioProducto: (producto: Producto, clienteId?: string) => number;
  calcularPrecioConDetalles: (producto: Producto, clienteId?: string) => {
    precioBase: number;
    precioFinal: number;
    origen: 'base' | 'tarifa' | 'oferta';
    tarifaNombre?: string;
    ofertaNombre?: string;
    descuentoOferta?: number;
  };
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      productos: [],
      empresaConfig: null,
      familias: [],
      clientes: [],
      tiposImpuesto: [],
      formasPago: [],
      almacenes: [],
      tarifas: [],
      ofertas: [],
      usuarios: [],
      stock: [],
      ultimaSync: null,
      sincronizando: false,
      errorSync: null,

      // Sincronizar datos con el servidor
      sincronizarDatos: async (incremental = false) => {
        if (get().sincronizando) return false;

        set({ sincronizando: true, errorSync: null });

        try {
          const ultimaSync = incremental ? get().ultimaSync : undefined;
          const response = await tpvApi.descargarDatos(ultimaSync || undefined);

          if (response.ok) {
            const { datos } = response;

            if (incremental && ultimaSync) {
              // Sync incremental: actualizar solo los datos modificados
              set((state) => ({
                productos: mergeArrays(state.productos, datos.productos),
                familias: mergeArrays(state.familias, datos.familias),
                clientes: mergeArrays(state.clientes, datos.clientes),
                tiposImpuesto: datos.tiposImpuesto, // Estos siempre se reemplazan
                formasPago: datos.formasPago,
                almacenes: datos.almacenes,
                tarifas: mergeArrays(state.tarifas, datos.tarifas),
                ofertas: datos.ofertas, // Las ofertas siempre se reemplazan
                usuarios: datos.usuarios,
                ultimaSync: new Date(datos.ultimaActualizacion),
                sincronizando: false,
              }));
            } else {
              // Sync completa: reemplazar todo
              set({
                productos: datos.productos,
                familias: datos.familias,
                clientes: datos.clientes,
                tiposImpuesto: datos.tiposImpuesto,
                formasPago: datos.formasPago,
                almacenes: datos.almacenes,
                tarifas: datos.tarifas,
                ofertas: datos.ofertas,
                usuarios: datos.usuarios,
                // Guardar configuración de empresa para tickets
                empresaConfig: datos.config ? {
                  empresaNombre: datos.config.empresaNombre || '',
                  empresaNombreComercial: datos.config.empresaNombreComercial,
                  empresaCif: datos.config.empresaCif || '',
                  empresaTelefono: datos.config.empresaTelefono,
                  empresaEmail: datos.config.empresaEmail,
                  empresaDireccion: datos.config.empresaDireccion || '',
                  textoLOPD: datos.config.textoLOPD,
                  condicionesVenta: datos.config.condicionesVenta,
                  verifactu: datos.config.verifactu,
                } : null,
                ultimaSync: new Date(datos.ultimaActualizacion),
                sincronizando: false,
              });
            }

            return true;
          }

          set({ sincronizando: false, errorSync: 'Error en respuesta del servidor' });
          return false;
        } catch (error) {
          const mensaje = error instanceof Error ? error.message : 'Error desconocido';
          set({ sincronizando: false, errorSync: mensaje });
          return false;
        }
      },

      // Actualizar stock
      actualizarStock: async (productosIds) => {
        try {
          const response = await tpvApi.obtenerStockCloud(productosIds);

          if (response.ok) {
            set((state) => {
              const nuevoStock = [...state.stock];

              for (const item of response.stock) {
                const index = nuevoStock.findIndex((s) => s.productoId === item.productoId);
                if (index >= 0) {
                  nuevoStock[index] = item;
                } else {
                  nuevoStock.push(item);
                }
              }

              return { stock: nuevoStock };
            });
          }
        } catch (error) {
          console.error('Error actualizando stock:', error);
        }
      },

      // Limpiar todos los datos
      limpiarDatos: () => {
        set({
          productos: [],
          empresaConfig: null,
          familias: [],
          clientes: [],
          tiposImpuesto: [],
          formasPago: [],
          almacenes: [],
          tarifas: [],
          ofertas: [],
          usuarios: [],
          stock: [],
          ultimaSync: null,
          errorSync: null,
        });
      },

      // Buscar productos por nombre o codigo
      buscarProducto: (termino) => {
        const { productos } = get();
        const terminoLower = termino.toLowerCase();

        return productos.filter(
          (p) =>
            p.nombre.toLowerCase().includes(terminoLower) ||
            p.codigo.toLowerCase().includes(terminoLower) ||
            p.codigoBarras?.includes(termino)
        );
      },

      // Buscar producto por codigo exacto o codigo de barras
      buscarProductoPorCodigo: (codigo) => {
        const { productos } = get();
        return productos.find(
          (p) => p.codigo === codigo || p.codigoBarras === codigo
        );
      },

      // Buscar clientes
      buscarCliente: (termino) => {
        const { clientes } = get();
        const terminoLower = termino.toLowerCase();

        return clientes.filter(
          (c) =>
            c.nombre.toLowerCase().includes(terminoLower) ||
            c.codigo.toLowerCase().includes(terminoLower) ||
            c.nif?.toLowerCase().includes(terminoLower)
        );
      },

      // Obtener familia por ID
      obtenerFamilia: (id) => {
        return get().familias.find((f) => f._id === id);
      },

      // Obtener tipo de impuesto por ID
      obtenerTipoImpuesto: (id) => {
        return get().tiposImpuesto.find((t) => t._id === id);
      },

      // Obtener forma de pago por ID
      obtenerFormaPago: (id) => {
        return get().formasPago.find((f) => f._id === id);
      },

      // Obtener stock de un producto
      obtenerStockProducto: (productoId) => {
        const item = get().stock.find((s) => s.productoId === productoId);
        return item?.stock ?? 0;
      },

      // Calcular precio de producto aplicando tarifas y ofertas
      calcularPrecioProducto: (producto, clienteId) => {
        const resultado = get().calcularPrecioConDetalles(producto, clienteId);
        return resultado.precioFinal;
      },

      // Calcular precio con detalles (tarifa, oferta, etc.)
      // IMPORTANTE: Usar PVP (precio con IVA) para mostrar al cliente
      calcularPrecioConDetalles: (producto, clienteId) => {
        const { clientes, tarifas, ofertas } = get();
        // PVP tiene prioridad porque es el precio final con IVA que ve el cliente
        const precioBase = producto.precios?.pvp ?? producto.precios?.venta ?? producto.precioVenta ?? 0;
        let precio = precioBase;
        let origen: 'base' | 'tarifa' | 'oferta' = 'base';
        let tarifaNombre: string | undefined;
        let ofertaNombre: string | undefined;
        let descuentoOferta: number | undefined;

        // Buscar tarifa del cliente
        if (clienteId) {
          const cliente = clientes.find((c) => c._id === clienteId);
          if (cliente?.tarifaId) {
            const tarifa = tarifas.find((t) => t._id === cliente.tarifaId);
            if (tarifa) {
              // Buscar precio especifico en la tarifa
              const precioTarifa = tarifa.precios?.find(
                (p: any) => p.productoId === producto._id
              );
              if (precioTarifa) {
                precio = precioTarifa.precio;
                origen = 'tarifa';
                tarifaNombre = tarifa.nombre;
              } else if (tarifa.porcentajeModificacion) {
                // Aplicar porcentaje de modificacion
                precio = precio * (1 + tarifa.porcentajeModificacion / 100);
                origen = 'tarifa';
                tarifaNombre = tarifa.nombre;
              }
            }
          }
        }

        // Buscar ofertas aplicables
        const ahora = new Date();
        const ofertasAplicables = ofertas
          .filter((o) => {
            const inicio = new Date(o.fechaInicio);
            const fin = o.fechaFin ? new Date(o.fechaFin) : null;

            if (ahora < inicio) return false;
            if (fin && ahora > fin) return false;

            // Verificar si aplica al producto o familia
            if (o.productos?.includes(producto._id)) return true;
            if (producto.familiaId && o.familias?.includes(producto.familiaId)) return true;

            return false;
          })
          .sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0));

        // Aplicar la oferta de mayor prioridad
        if (ofertasAplicables.length > 0) {
          const oferta = ofertasAplicables[0];
          precio = precio * (1 - oferta.descuento / 100);
          origen = 'oferta';
          ofertaNombre = oferta.nombre;
          descuentoOferta = oferta.descuento;
        }

        return {
          precioBase,
          precioFinal: Math.round(precio * 100) / 100,
          origen,
          tarifaNombre,
          ofertaNombre,
          descuentoOferta,
        };
      },
    }),
    {
      name: 'tpv-data-storage',
      partialize: (state) => ({
        productos: state.productos,
        empresaConfig: state.empresaConfig,
        familias: state.familias,
        clientes: state.clientes,
        tiposImpuesto: state.tiposImpuesto,
        formasPago: state.formasPago,
        almacenes: state.almacenes,
        tarifas: state.tarifas,
        ofertas: state.ofertas,
        usuarios: state.usuarios,
        stock: state.stock,
        ultimaSync: state.ultimaSync,
      }),
    }
  )
);

// Exportar tipos para uso en otros componentes
export type { Producto, Variante, Atributo, ValorAtributo, ComponenteKit };

// Funcion auxiliar para merge de arrays por _id
function mergeArrays<T extends { _id: string }>(existing: T[], updates: T[]): T[] {
  const result = [...existing];

  for (const update of updates) {
    const index = result.findIndex((item) => item._id === update._id);
    if (index >= 0) {
      result[index] = update;
    } else {
      result.push(update);
    }
  }

  return result;
}
