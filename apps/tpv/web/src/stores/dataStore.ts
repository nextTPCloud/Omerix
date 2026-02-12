// ===========================================
// STORE DE DATOS SINCRONIZADOS TPV
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tpvApi } from '../services/api';
import { useRestauracionStore } from './restauracionStore';
import { useAuthStore } from './authStore';

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
  imagenPrincipal?: string;
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
  // Restauración
  restauracion?: {
    zonaPreparacionId?: string;
    impresoraId?: string;
    tiempoPreparacionMinutos?: number;
    alergenosIds?: string[];
    permitirNotasCamarero?: boolean;
  };
}

interface Familia {
  _id: string;
  codigo: string;
  nombre: string;
  color?: string;
  orden?: number;
  familiaId?: string; // Padre (legacy)
  familiaPadreId?: string; // Padre (campo real del modelo)
  imagen?: string;
  imagenUrl?: string;
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
  // Happy Hours
  horaDesde?: string;   // "17:00" formato HH:mm
  horaHasta?: string;   // "19:00" formato HH:mm
  diasSemana?: number[]; // [1,2,3,4,5] = lun-vie (0=dom, 6=sáb)
  esHappyHour?: boolean;
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

// Alérgeno
interface Alergeno {
  _id: string;
  codigo?: string;
  nombre: string;
  icono?: string;
  color?: string;
  esObligatorioUE?: boolean;
  orden?: number;
}

// Grupo de modificadores
interface GrupoModificadores {
  _id: string;
  nombre: string;
  color?: string;
  tipoSeleccion?: 'unico' | 'multiple';
  minimo?: number;
  maximo?: number;
  orden?: number;
}

// Modificador de producto
interface Modificador {
  _id: string;
  grupoId?: string | { _id: string; nombre: string; color?: string; tipoSeleccion?: string; minimo?: number; maximo?: number };
  nombre: string;
  nombreCorto?: string;
  codigo?: string;
  tipo: 'gratis' | 'cargo' | 'descuento';
  precioExtra: number;
  porcentaje?: number;
  aplicaA: 'todos' | 'familias' | 'productos';
  familiasIds?: string[];
  productosIds?: string[];
  color?: string;
  icono?: string;
  orden?: number;
  mostrarEnTPV?: boolean;
  esMultiple?: boolean;
  cantidadMaxima?: number;
  obligatorio?: boolean;
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
  // Restauración
  tieneRestauracion?: boolean;
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
  // Modificadores
  modificadores: Modificador[];
  gruposModificadores: GrupoModificadores[];
  // Alérgenos
  alergenos: Alergeno[];

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
    esHappyHour?: boolean;
  };
  // Modificadores
  obtenerModificadoresProducto: (producto: Producto) => Modificador[];
  tieneModificadores: (producto: Producto) => boolean;
  // Alérgenos
  getAlergenosProducto: (productoId: string) => Alergeno[];
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
      modificadores: [],
      gruposModificadores: [],
      alergenos: [],
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
                modificadores: datos.modificadores || [],
                gruposModificadores: datos.gruposModificadores || [],
                alergenos: datos.alergenos || [],
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
                  tieneRestauracion: datos.config.tpvConfig?.tieneRestauracion,
                } : null,
                ultimaSync: new Date(datos.ultimaActualizacion),
                sincronizando: false,
              });

              // Actualizar la config del TPV en authStore (para mantener sincronizado)
              if (datos.config?.tpvConfig) {
                const authState = useAuthStore.getState();
                if (authState.tpvConfig) {
                  useAuthStore.setState({
                    tpvConfig: {
                      ...authState.tpvConfig,
                      tieneRestauracion: datos.config.tpvConfig.tieneRestauracion ?? false,
                      permitirPropinas: datos.config.tpvConfig.permitirPropinas ?? false,
                      pinPorTicket: datos.config.tpvConfig.pinPorTicket ?? false,
                      permitirDescuentos: datos.config.tpvConfig.permitirDescuentos ?? true,
                      descuentoMaximo: datos.config.tpvConfig.descuentoMaximo ?? 100,
                      permitirPrecioManual: datos.config.tpvConfig.permitirPrecioManual ?? false,
                      permitirCobroVencimientos: datos.config.tpvConfig.permitirCobroVencimientos ?? false,
                      permitirPagoVencimientos: datos.config.tpvConfig.permitirPagoVencimientos ?? false,
                      requiereMesaParaVenta: datos.config.tpvConfig.requiereMesaParaVenta ?? false,
                      requiereCamareroParaVenta: datos.config.tpvConfig.requiereCamareroParaVenta ?? false,
                    },
                  });
                  console.log('[DataStore Sync] Config TPV actualizada:', {
                    tieneRestauracion: datos.config.tpvConfig.tieneRestauracion,
                    permitirPropinas: datos.config.tpvConfig.permitirPropinas,
                    pinPorTicket: datos.config.tpvConfig.pinPorTicket,
                  });
                }
              }

              // Si hay datos de restauración, inicializar el store de restauración
              if (datos.salones || datos.mesas || datos.camareros) {
                useRestauracionStore.getState().inicializarDesdeSync({
                  salones: datos.salones,
                  mesas: datos.mesas,
                  camareros: datos.camareros,
                  sugerencias: datos.sugerencias,
                });
                console.log('[DataStore Sync] Datos restauración cargados:', {
                  salones: datos.salones?.length || 0,
                  mesas: datos.mesas?.length || 0,
                  camareros: datos.camareros?.length || 0,
                });
              }

              // Log de modificadores
              if (datos.modificadores?.length > 0) {
                console.log('[DataStore Sync] Modificadores cargados:', {
                  modificadores: datos.modificadores.length,
                  grupos: datos.gruposModificadores?.length || 0,
                });
              }
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
          modificadores: [],
          gruposModificadores: [],
          alergenos: [],
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
        let esHappyHour = false;

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
        const horaActualMin = ahora.getHours() * 60 + ahora.getMinutes();
        const diaActual = ahora.getDay(); // 0=dom, 6=sáb

        const ofertasAplicables = ofertas
          .filter((o) => {
            const inicio = new Date(o.fechaInicio);
            const fin = o.fechaFin ? new Date(o.fechaFin) : null;

            if (ahora < inicio) return false;
            if (fin && ahora > fin) return false;

            // Verificar restricción por día de la semana
            if (o.diasSemana && o.diasSemana.length > 0) {
              if (!o.diasSemana.includes(diaActual)) return false;
            }

            // Verificar restricción horaria
            if (o.horaDesde) {
              const [h, m] = o.horaDesde.split(':').map(Number);
              if (horaActualMin < h * 60 + m) return false;
            }
            if (o.horaHasta) {
              const [h, m] = o.horaHasta.split(':').map(Number);
              if (horaActualMin > h * 60 + m) return false;
            }

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
          esHappyHour = !!oferta.esHappyHour;
        }

        return {
          precioBase,
          precioFinal: Math.round(precio * 100) / 100,
          origen,
          tarifaNombre,
          ofertaNombre,
          descuentoOferta,
          esHappyHour,
        };
      },

      // Obtener modificadores aplicables a un producto
      obtenerModificadoresProducto: (producto) => {
        const { modificadores } = get();

        return modificadores.filter((mod) => {
          // Solo modificadores que deben mostrarse en TPV
          if (mod.mostrarEnTPV === false) return false;

          // Verificar aplicabilidad
          if (mod.aplicaA === 'todos') return true;

          if (mod.aplicaA === 'productos' && mod.productosIds) {
            return mod.productosIds.includes(producto._id);
          }

          if (mod.aplicaA === 'familias' && mod.familiasIds && producto.familiaId) {
            return mod.familiasIds.includes(producto.familiaId);
          }

          return false;
        }).sort((a, b) => (a.orden || 0) - (b.orden || 0));
      },

      // Verificar si un producto tiene modificadores disponibles
      tieneModificadores: (producto) => {
        const modificadoresProducto = get().obtenerModificadoresProducto(producto);
        return modificadoresProducto.length > 0;
      },

      // Obtener alérgenos de un producto resolviendo IDs a objetos
      getAlergenosProducto: (productoId) => {
        const { productos, alergenos } = get();
        const producto = productos.find(p => p._id === productoId);
        if (!producto?.restauracion?.alergenosIds?.length) return [];
        return producto.restauracion.alergenosIds
          .map(id => alergenos.find(a => a._id === id))
          .filter(Boolean) as Alergeno[];
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
        modificadores: state.modificadores,
        gruposModificadores: state.gruposModificadores,
        alergenos: state.alergenos,
        ultimaSync: state.ultimaSync,
      }),
    }
  )
);

// Exportar tipos para uso en otros componentes
export type { Producto, Variante, Atributo, ValorAtributo, ComponenteKit, Modificador, GrupoModificadores, Alergeno, Oferta };

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
